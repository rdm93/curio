import { XMLParser } from 'fast-xml-parser';
import { LearningCard, CardCategory, FeedSource } from '../types/card';
import { AISummarizerService } from './aiSummarizerService';
import { databaseService } from '../database/databaseService';

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  {
    id: 'src-wiki-history',
    name: 'Wikipedia: On This Day',
    url: 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/all',
    category: 'History',
    type: 'wikipedia',
    enabled: true,
  },
  {
    id: 'src-nasa-iotd',
    name: 'NASA Science & Astronomy',
    url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    category: 'Science',
    type: 'rss',
    enabled: true,
  },
];

export class FeedIngestionService {
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  /**
   * Fetch Wikipedia "On This Day" historical events
   */
  static async fetchWikipediaHistory(): Promise<LearningCard[]> {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SmartStashApp/1.0 (contact: microlearn@local.dev)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Wikipedia API returned status ${response.status}`);
        return [];
      }

      const data = await response.json();
      const events = (data.events || []).slice(0, 15); // get top 15 events
      const cards: LearningCard[] = [];

      for (const event of events) {
        const year = event.year;
        const text = event.text || '';
        const pages = event.pages || [];
        const primaryPage = pages[0] || {};
        const title = primaryPage.normalizedtitle || `Event of ${year}`;
        const sourceUrl = primaryPage.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
        const extract = primaryPage.extract || text;

        // Run AI summarization on extract
        const aiSummary = await AISummarizerService.summarize(extract, title);

        cards.push({
          id: `wiki-hist-${year}-${title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30).toLowerCase()}`,
          title: `${title} (${year > 0 ? `${year} AD` : `${Math.abs(year)} BC`})`,
          category: 'History',
          summary: aiSummary.summary || text,
          takeaway: aiSummary.takeaway || `Historical milestone recorded on this day in ${year}.`,
          body: `${text}\n\n${extract}`,
          sourceName: 'Wikipedia Historical Archives',
          sourceUrl,
          tags: ['History', 'On This Day', `${year}`],
          readTimeSeconds: 20,
          gradientColors: ['#2C3E50', '#FD746C'],
          isStashed: false,
          aiSummarized: true,
          createdAt: new Date().toISOString(),
        });
      }

      return cards;
    } catch (err) {
      console.warn('Error fetching Wikipedia history feed:', err);
      return [];
    }
  }

  /**
   * Fetch and parse an RSS feed
   */
  static async fetchRSSFeed(source: FeedSource): Promise<LearningCard[]> {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'SmartStashApp/1.0 (contact: microlearn@local.dev)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) return [];

      const xmlText = await response.text();
      const parsed = this.xmlParser.parse(xmlText);
      const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
      const list = Array.isArray(items) ? items.slice(0, 10) : [items];

      const cards: LearningCard[] = [];

      for (const item of list) {
        const rawTitle = item.title || 'Untitled Discovery';
        const rawContent = item.description || item['content:encoded'] || item.summary || '';
        const sourceUrl = item.link || item.guid || '';

        // Strip HTML
        const cleanBody = String(rawContent)
          .replace(/<[^>]*>/g, ' ')
          .replace(/&[a-z0-9]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanBody.length < 50) continue;

        const aiResult = await AISummarizerService.summarize(cleanBody, String(rawTitle));

        cards.push({
          id: `rss-${source.id}-${String(rawTitle).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30).toLowerCase()}`,
          title: String(rawTitle).trim(),
          category: source.category,
          summary: aiResult.summary,
          takeaway: aiResult.takeaway,
          body: cleanBody,
          sourceName: source.name,
          sourceUrl: typeof sourceUrl === 'string' ? sourceUrl : source.url,
          tags: [source.category, source.name],
          readTimeSeconds: 20,
          gradientColors: this.getCategoryGradient(source.category),
          isStashed: false,
          aiSummarized: true,
          createdAt: new Date().toISOString(),
        });
      }

      return cards;
    } catch (err) {
      console.warn(`Error fetching RSS from ${source.name}:`, err);
      return [];
    }
  }

  /**
   * Synchronize all active feeds and cache new cards into SQLite
   */
  static async syncAllFeeds(): Promise<{ newCardsCount: number }> {
    const allFetched: LearningCard[] = [];

    // 1. Wikipedia history
    const wikiCards = await this.fetchWikipediaHistory();
    allFetched.push(...wikiCards);

    // 2. Additional RSS feeds
    for (const source of DEFAULT_FEED_SOURCES) {
      if (source.type === 'rss' && source.enabled) {
        const rssCards = await this.fetchRSSFeed(source);
        allFetched.push(...rssCards);
      }
    }

    if (allFetched.length > 0) {
      const inserted = await databaseService.upsertCards(allFetched);
      return { newCardsCount: inserted };
    }

    return { newCardsCount: 0 };
  }

  private static getCategoryGradient(cat: CardCategory): [string, string] {
    switch (cat) {
      case 'History':
        return ['#2C3E50', '#FD746C'];
      case 'Science':
        return ['#0F2027', '#203A43'];
      case 'Philosophy':
        return ['#42275a', '#734b6d'];
      case 'Mental Models':
        return ['#114357', '#F29492'];
      default:
        return ['#1A2980', '#26D0CE'];
    }
  }
}
