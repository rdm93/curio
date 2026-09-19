import { Platform } from '../utils/platform';
import { LearningCard, CardCategory } from '../types/card';
import initialSeedCards from '../assets/seed/initial_cards.json';

// Interface for database operations
export interface IDatabaseService {
  init(): Promise<void>;
  getFeedCards(category?: CardCategory | 'All', limit?: number, offset?: number): Promise<LearningCard[]>;
  getStashedCards(): Promise<LearningCard[]>;
  toggleStash(cardId: string): Promise<boolean>; // returns new isStashed state
  isCardStashed(cardId: string): Promise<boolean>;
  upsertCards(cards: LearningCard[]): Promise<number>;
  searchStashedCards(query: string): Promise<LearningCard[]>;
  getStats(): Promise<{ totalCards: number; stashedCount: number; categories: Record<string, number> }>;
}

class DatabaseServiceImpl implements IDatabaseService {
  private db: any = null;
  private memoryCards: Map<string, LearningCard> = new Map();
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS !== 'web') {
      try {
        const SQLite = await import('expo-sqlite');
        this.db = await SQLite.openDatabaseAsync('microlearn.db');
        
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            summary TEXT NOT NULL,
            takeaway TEXT NOT NULL,
            body TEXT NOT NULL,
            sourceName TEXT NOT NULL,
            sourceUrl TEXT NOT NULL,
            tags TEXT NOT NULL,
            readTimeSeconds INTEGER NOT NULL,
            gradientColors TEXT NOT NULL,
            isStashed INTEGER NOT NULL DEFAULT 0,
            stashedAt TEXT,
            createdAt TEXT NOT NULL,
            aiSummarized INTEGER NOT NULL DEFAULT 0
          );
          CREATE INDEX IF NOT EXISTS idx_category ON cards(category);
          CREATE INDEX IF NOT EXISTS idx_stashed ON cards(isStashed);
        `);

        // Check if database needs seeding
        const countResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM cards;');
        if (!countResult || countResult.count === 0) {
          await this.seedInitialCardsSQLite();
        }
        this.isInitialized = true;
        return;
      } catch (err) {
        console.warn('Failed to initialize SQLite, falling back to memory/local store:', err);
      }
    }

    // Web or Fallback Memory Storage
    this.seedInitialCardsMemory();
    this.isInitialized = true;
  }

  private async seedInitialCardsSQLite(): Promise<void> {
    const seed = initialSeedCards as LearningCard[];
    for (const card of seed) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO cards (
          id, title, category, summary, takeaway, body, sourceName, sourceUrl, 
          tags, readTimeSeconds, gradientColors, isStashed, stashedAt, createdAt, aiSummarized
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          card.id,
          card.title,
          card.category,
          card.summary,
          card.takeaway,
          card.body,
          card.sourceName,
          card.sourceUrl,
          JSON.stringify(card.tags),
          card.readTimeSeconds,
          JSON.stringify(card.gradientColors),
          card.isStashed ? 1 : 0,
          card.stashedAt || null,
          card.createdAt || new Date().toISOString(),
          card.aiSummarized ? 1 : 0,
        ]
      );
    }
  }

  private seedInitialCardsMemory(): void {
    const seed = initialSeedCards as LearningCard[];
    seed.forEach((card) => {
      this.memoryCards.set(card.id, {
        ...card,
        createdAt: card.createdAt || new Date().toISOString(),
      });
    });
  }

  async getFeedCards(category: CardCategory | 'All' = 'All', limit = 100, offset = 0): Promise<LearningCard[]> {
    await this.init();

    if (this.db) {
      let query = 'SELECT * FROM cards';
      const params: any[] = [];

      if (category && category !== 'All') {
        query += ' WHERE category = ?';
        params.push(category);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?;';
      params.push(limit, offset);

      const rows = await this.db.getAllAsync(query, params);
      return rows.map((r: any) => this.mapRowToCard(r));
    }

    // Memory fallback
    let cards = Array.from(this.memoryCards.values());
    if (category && category !== 'All') {
      cards = cards.filter((c) => c.category === category);
    }
    return cards.slice(offset, offset + limit);
  }

  async getStashedCards(): Promise<LearningCard[]> {
    await this.init();

    if (this.db) {
      const rows = await this.db.getAllAsync(
        'SELECT * FROM cards WHERE isStashed = 1 ORDER BY stashedAt DESC;'
      );
      return rows.map((r: any) => this.mapRowToCard(r));
    }

    return Array.from(this.memoryCards.values())
      .filter((c) => c.isStashed)
      .sort((a, b) => (b.stashedAt || '').localeCompare(a.stashedAt || ''));
  }

  async toggleStash(cardId: string): Promise<boolean> {
    await this.init();

    if (this.db) {
      const row = await this.db.getFirstAsync(
        'SELECT isStashed FROM cards WHERE id = ?;',
        [cardId]
      );
      if (!row) return false;

      const newStashState = row.isStashed === 1 ? 0 : 1;
      const stashedAt = newStashState === 1 ? new Date().toISOString() : null;

      await this.db.runAsync(
        'UPDATE cards SET isStashed = ?, stashedAt = ? WHERE id = ?;',
        [newStashState, stashedAt, cardId]
      );
      return newStashState === 1;
    }

    const card = this.memoryCards.get(cardId);
    if (!card) return false;

    const newStashState = !card.isStashed;
    card.isStashed = newStashState;
    card.stashedAt = newStashState ? new Date().toISOString() : null;
    return newStashState;
  }

  async isCardStashed(cardId: string): Promise<boolean> {
    await this.init();

    if (this.db) {
      const row = await this.db.getFirstAsync(
        'SELECT isStashed FROM cards WHERE id = ?;',
        [cardId]
      );
      return row ? row.isStashed === 1 : false;
    }

    const card = this.memoryCards.get(cardId);
    return card ? card.isStashed : false;
  }

  async upsertCards(cards: LearningCard[]): Promise<number> {
    await this.init();
    let count = 0;

    if (this.db) {
      for (const card of cards) {
        // preserve stash state if already exists
        const existing = await this.db.getFirstAsync(
          'SELECT isStashed, stashedAt FROM cards WHERE id = ?;',
          [card.id]
        );
        const isStashed = existing ? existing.isStashed : (card.isStashed ? 1 : 0);
        const stashedAt = existing ? existing.stashedAt : card.stashedAt;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO cards (
            id, title, category, summary, takeaway, body, sourceName, sourceUrl, 
            tags, readTimeSeconds, gradientColors, isStashed, stashedAt, createdAt, aiSummarized
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            card.id,
            card.title,
            card.category,
            card.summary,
            card.takeaway,
            card.body,
            card.sourceName,
            card.sourceUrl,
            JSON.stringify(card.tags || []),
            card.readTimeSeconds || 20,
            JSON.stringify(card.gradientColors || ['#2C3E50', '#FD746C']),
            isStashed,
            stashedAt || null,
            card.createdAt || new Date().toISOString(),
            card.aiSummarized ? 1 : 0,
          ]
        );
        count++;
      }
      return count;
    }

    cards.forEach((card) => {
      const existing = this.memoryCards.get(card.id);
      this.memoryCards.set(card.id, {
        ...card,
        isStashed: existing ? existing.isStashed : card.isStashed,
        stashedAt: existing ? existing.stashedAt : card.stashedAt,
      });
      count++;
    });

    return count;
  }

  async searchStashedCards(query: string): Promise<LearningCard[]> {
    await this.init();
    const cleanQuery = query.toLowerCase().trim();

    if (this.db) {
      const rows = await this.db.getAllAsync(
        `SELECT * FROM cards 
         WHERE isStashed = 1 
         AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ?)
         ORDER BY stashedAt DESC;`,
        [`%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`]
      );
      return rows.map((r: any) => this.mapRowToCard(r));
    }

    return Array.from(this.memoryCards.values())
      .filter((c) => c.isStashed)
      .filter(
        (c) =>
          c.title.toLowerCase().includes(cleanQuery) ||
          c.summary.toLowerCase().includes(cleanQuery) ||
          c.tags.some((t) => t.toLowerCase().includes(cleanQuery))
      );
  }

  async getStats(): Promise<{ totalCards: number; stashedCount: number; categories: Record<string, number> }> {
    await this.init();

    if (this.db) {
      const totalRow = await this.db.getFirstAsync('SELECT COUNT(*) as total FROM cards;');
      const stashedRow = await this.db.getFirstAsync('SELECT COUNT(*) as stashed FROM cards WHERE isStashed = 1;');
      const categoryRows = await this.db.getAllAsync(
        'SELECT category, COUNT(*) as count FROM cards GROUP BY category;'
      );

      const categories: Record<string, number> = {};
      categoryRows.forEach((r: any) => {
        categories[r.category] = r.count;
      });

      return {
        totalCards: totalRow?.total || 0,
        stashedCount: stashedRow?.stashed || 0,
        categories,
      };
    }

    const cards = Array.from(this.memoryCards.values());
    const categories: Record<string, number> = {};
    cards.forEach((c) => {
      categories[c.category] = (categories[c.category] || 0) + 1;
    });

    return {
      totalCards: cards.length,
      stashedCount: cards.filter((c) => c.isStashed).length,
      categories,
    };
  }

  private mapRowToCard(row: any): LearningCard {
    return {
      id: row.id,
      title: row.title,
      category: row.category as CardCategory,
      summary: row.summary,
      takeaway: row.takeaway,
      body: row.body,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      readTimeSeconds: row.readTimeSeconds,
      gradientColors: typeof row.gradientColors === 'string' ? JSON.parse(row.gradientColors) : row.gradientColors,
      isStashed: row.isStashed === 1,
      stashedAt: row.stashedAt,
      createdAt: row.createdAt,
      aiSummarized: row.aiSummarized === 1,
    };
  }
}

export const databaseService = new DatabaseServiceImpl();
