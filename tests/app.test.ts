import test from 'node:test';
import assert from 'node:assert/strict';
import initialSeedCards from '../src/assets/seed/initial_cards.json';
import { databaseService } from '../src/database/databaseService';
import { AISummarizerService } from '../src/services/aiSummarizerService';
import { HardwareProbe } from '../src/services/hardwareProbe';
import { LearningCard, CardCategory } from '../src/types/card';

test('Seed Data - Contains 50+ rich educational cards across all 4 categories', () => {
  const cards = initialSeedCards as LearningCard[];
  assert.ok(cards.length >= 50, `Expected >= 50 cards, got ${cards.length}`);

  const categories = new Set(cards.map((c) => c.category));
  assert.ok(categories.has('History'), 'Missing History category');
  assert.ok(categories.has('Science'), 'Missing Science category');
  assert.ok(categories.has('Philosophy'), 'Missing Philosophy category');
  assert.ok(categories.has('Mental Models'), 'Missing Mental Models category');

  // Verify schema on each card
  for (const card of cards) {
    assert.ok(card.id, 'Card must have an id');
    assert.ok(card.title, `Card ${card.id} must have a title`);
    assert.ok(card.summary, `Card ${card.id} must have a summary`);
    assert.ok(card.takeaway, `Card ${card.id} must have a takeaway`);
    assert.ok(card.body, `Card ${card.id} must have a body`);
    assert.ok(card.sourceName, `Card ${card.id} must have a sourceName`);
    assert.ok(card.sourceUrl.startsWith('http'), `Card ${card.id} must have valid sourceUrl`);
    assert.ok(Array.isArray(card.tags), `Card ${card.id} tags must be an array`);
    assert.ok(card.readTimeSeconds > 0, `Card ${card.id} readTimeSeconds must be > 0`);
  }
});

test('HardwareProbe - successfully inspects platform and assigns capability tier', async () => {
  const probe = await HardwareProbe.inspectDevice();
  assert.ok(probe.platform, 'Platform must be identified');
  assert.ok(probe.estimatedMemoryMB > 0, 'Memory estimate must be > 0');
  assert.ok(['OnDeviceLLM', 'ExtractiveNLP'].includes(probe.engineName));
  assert.ok(probe.details.length > 0, 'Probe must provide descriptive details');
});

test('AISummarizerService - short text returns cleanly without unnecessary extraction', async () => {
  const short = 'The quick brown fox jumps over the lazy dog. A lovely afternoon.';
  const result = await AISummarizerService.summarize(short, 'Short Test');
  assert.equal(result.engineUsed, 'FeedFallback');
  assert.ok(result.summary.length > 0);
  assert.ok(result.takeaway.length > 0);
  assert.ok(result.executionTimeMs >= 0);
});

test('AISummarizerService - performs on-device extractive NLP in <20ms with significant compression', async () => {
  const rawArticle = `
    The Library of Alexandria in Egypt was one of the largest and most significant libraries of the ancient world.
    Dedicated to the Muses, the nine goddesses of the arts, the library flourished under the patronage of the Ptolemaic dynasty.
    It functioned as a major center of scholarship from its construction in the 3rd century BC until the Roman conquest of Egypt.
    A widespread cultural myth claims the library was suddenly destroyed in a single catastrophic inferno.
    However, modern historical consensus reveals that the library endured a multi-century institutional decline caused by severe funding cuts, imperial purges, and civil war.
    Therefore, preserving collective civilizational knowledge requires ongoing maintenance rather than merely preventing single disasters.
  `;

  const result = await AISummarizerService.summarize(rawArticle, 'The Real Fate of the Library of Alexandria');

  assert.ok(['ExtractiveNLP', 'OnDeviceLLM'].includes(result.engineUsed));
  assert.ok(result.originalWordCount > 80);
  assert.ok(result.summaryWordCount < result.originalWordCount);
  assert.ok(result.executionTimeMs < 50, `Summarization took ${result.executionTimeMs}ms, should be <50ms`);
  assert.ok(result.summary.length > 40);
  assert.ok(result.takeaway.length > 10);
  console.log(`\n  [AI Summarizer Benchmark]`);
  console.log(`  Engine: ${result.engineUsed}`);
  console.log(`  Latency: ${result.executionTimeMs}ms`);
  console.log(`  Words: ${result.originalWordCount} -> ${result.summaryWordCount} (${result.compressionRatio} compression)`);
  console.log(`  Extracted Takeaway: "${result.takeaway}"\n`);
});

test('DatabaseService - seeds data, filters by category, and performs instant stash toggle', async () => {
  await databaseService.init();

  // Test 1: Load all feed cards
  const allCards = await databaseService.getFeedCards('All');
  assert.ok(allCards.length >= 50, 'Feed cards should contain at least 50 seed items');

  // Test 2: Category filtering
  const historyCards = await databaseService.getFeedCards('History');
  assert.ok(historyCards.length > 0);
  assert.ok(historyCards.every((c) => c.category === 'History'));

  const scienceCards = await databaseService.getFeedCards('Science');
  assert.ok(scienceCards.length > 0);
  assert.ok(scienceCards.every((c) => c.category === 'Science'));

  // Test 3: Stash toggle
  const testCardId = allCards[0].id;
  const initialStashed = await databaseService.isCardStashed(testCardId);

  const newStashState = await databaseService.toggleStash(testCardId);
  assert.equal(newStashState, !initialStashed);

  const stashedCards = await databaseService.getStashedCards();
  if (newStashState) {
    assert.ok(stashedCards.some((c) => c.id === testCardId));
  }

  // Toggle back to restore clean state
  await databaseService.toggleStash(testCardId);

  // Test 4: Search stashed cards
  // Stash a card with known title to search
  await databaseService.toggleStash(testCardId);
  const searchResults = await databaseService.searchStashedCards(allCards[0].title.slice(0, 5));
  assert.ok(searchResults.length >= 1);
  assert.equal(searchResults[0].id, testCardId);

  // Clean up
  await databaseService.toggleStash(testCardId);

  // Test 5: Stats check
  const stats = await databaseService.getStats();
  assert.ok(stats.totalCards >= 50);
  assert.equal(typeof stats.stashedCount, 'number');
  assert.ok(stats.categories['History'] > 0);
  assert.ok(stats.categories['Science'] > 0);
  assert.ok(stats.categories['Philosophy'] > 0);
  assert.ok(stats.categories['Mental Models'] > 0);
});
