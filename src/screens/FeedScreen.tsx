import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LearningCard, CardCategory } from '../types/card';
import { databaseService } from '../database/databaseService';
import { FeedIngestionService } from '../services/feedIngestionService';
import { FeedCard } from '../components/FeedCard';
import { DeepDiveSheet } from '../components/DeepDiveSheet';
import { AIStatusModal } from '../components/AIStatusModal';

interface Props {
  onNavigateToStash: () => void;
  stashedCount: number;
  onStashUpdated: () => void;
}

const CATEGORIES: (CardCategory | 'All')[] = [
  'All',
  'History',
  'Science',
  'Philosophy',
  'Mental Models',
];

export const FeedScreen: React.FC<Props> = ({
  onNavigateToStash,
  stashedCount,
  onStashUpdated,
}) => {
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCard, setActiveCard] = useState<LearningCard | null>(null);
  const [deepDiveVisible, setDeepDiveVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const flatListRef = useRef<FlatList>(null);

  const loadCards = useCallback(async (category: CardCategory | 'All' = 'All') => {
    try {
      const data = await databaseService.getFeedCards(category);
      setCards(data);
    } catch (err) {
      console.warn('Error loading feed cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards(selectedCategory);
  }, [selectedCategory, loadCards]);

  const handleCategorySelect = (cat: CardCategory | 'All') => {
    setSelectedCategory(cat);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await FeedIngestionService.syncAllFeeds();
      await loadCards(selectedCategory);
      onStashUpdated();
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStash = async (card: LearningCard) => {
    // Optimistic UI update
    const newStashedState = !card.isStashed;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isStashed: newStashedState } : c))
    );
    if (activeCard && activeCard.id === card.id) {
      setActiveCard({ ...activeCard, isStashed: newStashedState });
    }

    // Persist to SQLite
    await databaseService.toggleStash(card.id);
    onStashUpdated();
  };

  const handleOpenDeepDive = (card: LearningCard) => {
    setActiveCard(card);
    setDeepDiveVisible(true);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && height !== containerHeight) {
      setContainerHeight(height);
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Floating Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={16} color="#FFD54F" />
          </View>
          <Text style={styles.logoText}>Smart Stash</Text>
        </View>

        {/* Action Controls */}
        <View style={styles.headerRightActions}>
          {/* AI Capability Diagnostics Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setAiModalVisible(true)}
            accessibilityLabel="AI Engine Status"
          >
            <Ionicons name="hardware-chip-outline" size={20} color="#64B5F6" />
          </TouchableOpacity>

          {/* Stash Tab Shortcut with Live Counter */}
          <TouchableOpacity
            style={styles.stashShortcutBtn}
            onPress={onNavigateToStash}
            accessibilityLabel="View My Stash"
          >
            <Ionicons name="heart" size={18} color="#FF4757" />
            <Text style={styles.stashBadgeText}>{stashedCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryBar}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              onPress={() => handleCategorySelect(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Swipeable Feed */}
      {loading || containerHeight === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingText}>Loading microlearning cards...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedCard
              card={item}
              height={containerHeight}
              isStashed={item.isStashed}
              onToggleStash={() => handleToggleStash(item)}
              onOpenDeepDive={() => handleOpenDeepDive(item)}
            />
          )}
          pagingEnabled={true}
          snapToInterval={containerHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD54F"
            />
          }
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
        />
      )}

      {/* Deep-Dive Expandable In-App Bottom Sheet */}
      <DeepDiveSheet
        card={activeCard}
        visible={deepDiveVisible}
        onClose={() => setDeepDiveVisible(false)}
        isStashed={activeCard ? activeCard.isStashed : false}
        onToggleStash={() => activeCard && handleToggleStash(activeCard)}
      />

      {/* On-Device AI Status & Playground Modal */}
      <AIStatusModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 34,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 213, 79, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stashShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  stashBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 78,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryPillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
