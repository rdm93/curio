export type CardCategory = 'History' | 'Science' | 'Philosophy' | 'Mental Models';

export interface LearningCard {
  id: string;
  title: string;
  category: CardCategory;
  summary: string;
  takeaway: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  readTimeSeconds: number;
  gradientColors: [string, string];
  isStashed: boolean;
  stashedAt?: string | null;
  createdAt?: string;
  aiSummarized?: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: CardCategory;
  type: 'rss' | 'wikipedia';
  enabled: boolean;
  lastFetchedAt?: string | null;
}

export interface HardwareCapability {
  hasHighPerformanceAI: boolean;
  estimatedMemoryMB: number;
  platform: string;
  engineName: 'OnDeviceLLM' | 'ExtractiveNLP' | 'FeedFallback';
  details: string;
}
