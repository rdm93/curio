import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LearningCard, CardCategory } from '../types/card';
import { databaseService } from '../database/databaseService';
import { CategoryBadge } from '../components/CategoryBadge';
import { DeepDiveSheet } from '../components/DeepDiveSheet';

interface Props {
  onBackToFeed: () => void;
  onStashUpdated: () => void;
}

const CATEGORIES: (CardCategory | 'All')[] = [
  'All',
  'History',
  'Science',
  'Philosophy',
  'Mental Models',
];

export const StashScreen: React.FC<Props> = ({ onBackToFeed, onStashUpdated }) => {
  const [stashedCards, setStashedCards] = useState<LearningCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearningCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'All'>('All');
  const [activeCard, setActiveCard] = useState<LearningCard | null>(null);
  const [deepDiveVisible, setDeepDiveVisible] = useState(false);

  const loadStashed = useCallback(async () => {
    try {
      const cards = await databaseService.getStashedCards();
      setStashedCards(cards);
    } catch (err) {
      console.warn('Error loading stashed cards:', err);
    }
  }, []);

  useEffect(() => {
    loadStashed();
  }, [loadStashed]);

  useEffect(() => {
    let result = stashedCards;
    if (selectedCategory !== 'All') {
      result = result.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.takeaway.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFilteredCards(result);
  }, [stashedCards, selectedCategory, searchQuery]);

  const handleUnstash = async (card: LearningCard) => {
    await databaseService.toggleStash(card.id);
    setStashedCards((prev) => prev.filter((c) => c.id !== card.id));
    onStashUpdated();
    if (activeCard && activeCard.id === card.id) {
      setDeepDiveVisible(false);
    }
  };

  const handleOpenCard = (card: LearningCard) => {
    setActiveCard(card);
    setDeepDiveVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToFeed}
          accessibilityLabel="Back to feed"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>My Stash</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{stashedCards.length}</Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved ideas, concepts, tags..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterBar}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stashed List */}
      {filteredCards.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-dislike-outline" size={42} color="#4B5563" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching ideas found' : 'Your Stash is Empty'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try searching with different keywords or switch categories.'
              : 'Swipe through the feed and tap the heart icon to save your favorite mental models, historical discoveries, and science bites for offline reading.'}
          </Text>

          {!searchQuery && (
            <TouchableOpacity style={styles.exploreFeedBtn} onPress={onBackToFeed}>
              <Ionicons name="sparkles" size={18} color="#0B0D13" />
              <Text style={styles.exploreFeedBtnText}>Explore Feed</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardItem}
              activeOpacity={0.8}
              onPress={() => handleOpenCard(item)}
            >
              <View style={styles.cardHeader}>
                <CategoryBadge category={item.category} size="sm" />
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => handleUnstash(item)}
                  accessibilityLabel="Remove from stash"
                >
                  <Ionicons name="heart" size={22} color="#FF4757" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.summary}
              </Text>

              <View style={styles.cardTakeawayBox}>
                <Text style={styles.cardTakeawayText} numberOfLines={2}>
                  🔑 {item.takeaway}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardSource}>{item.sourceName}</Text>
                <Text style={styles.cardReadTime}>{item.readTimeSeconds}s read</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Deep-Dive Bottom Sheet */}
      <DeepDiveSheet
        card={activeCard}
        visible={deepDiveVisible}
        onClose={() => setDeepDiveVisible(false)}
        isStashed={activeCard ? stashedCards.some((c) => c.id === activeCard.id) : false}
        onToggleStash={() => activeCard && handleUnstash(activeCard)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  counterText: {
    color: '#FF4757',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 14,
  },
  cardItem: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heartBtn: {
    padding: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardSummary: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  cardTakeawayBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  cardTakeawayText: {
    color: '#E0E7FF',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  cardSource: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  cardReadTime: {
    color: '#6B7280',
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  exploreFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD54F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
  },
  exploreFeedBtnText: {
    color: '#0B0D13',
    fontSize: 14,
    fontWeight: '700',
  },
});
