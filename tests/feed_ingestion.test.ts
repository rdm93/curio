import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedIngestionService, DEFAULT_FEED_SOURCES } from '../src/services/feedIngestionService';

test('FeedIngestionService - default feed sources are configured', () => {
  assert.ok(DEFAULT_FEED_SOURCES.length >= 2);
  const wikiSource = DEFAULT_FEED_SOURCES.find((s) => s.type === 'wikipedia');
  const rssSource = DEFAULT_FEED_SOURCES.find((s) => s.type === 'rss');

  assert.ok(wikiSource, 'Should have Wikipedia source');
  assert.ok(rssSource, 'Should have RSS source');
  assert.equal(wikiSource?.category, 'History');
  assert.equal(rssSource?.category, 'Science');
});

test('FeedIngestionService - parses sample RSS XML feed into valid LearningCards', async () => {
  const sampleRssXml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>NASA Breaking News</title>
      <link>https://www.nasa.gov</link>
      <description>NASA science updates</description>
      <item>
        <title>James Webb Detects Water Vapor in Rocky Planet Zone</title>
        <link>https://www.nasa.gov/news/webb-water-vapor</link>
        <description>NASA's James Webb Space Telescope has made a breakthrough detection of water vapor in the inner terrestrial region of a planetary disk system PDS 70. This discovery suggests rocky planets could acquire water during their earliest planetary accretion phases rather than through later comet impacts.</description>
        <pubDate>Mon, 18 Sep 2026 12:00:00 GMT</pubDate>
      </item>
    </channel>
  </rss>`;

  // Mock fetch for RSS test
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => sampleRssXml,
  } as any);

  try {
    const cards = await FeedIngestionService.fetchRSSFeed({
      id: 'mock-rss',
      name: 'NASA News',
      url: 'https://fake-rss.local',
      category: 'Science',
      type: 'rss',
      enabled: true,
    });

    assert.equal(cards.length, 1);
    assert.equal(cards[0].title, 'James Webb Detects Water Vapor in Rocky Planet Zone');
    assert.equal(cards[0].category, 'Science');
    assert.ok(cards[0].summary.length > 20);
    assert.ok(cards[0].takeaway.length > 10);
    assert.equal(cards[0].aiSummarized, true);
    assert.equal(cards[0].sourceName, 'NASA News');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
