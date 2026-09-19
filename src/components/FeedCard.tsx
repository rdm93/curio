import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LearningCard } from '../types/card';
import { CategoryBadge } from './CategoryBadge';
import { ActionSidebar } from './ActionSidebar';

interface Props {
  card: LearningCard;
  height: number;
  isStashed: boolean;
  onToggleStash: () => void;
  onOpenDeepDive: () => void;
}

export const FeedCard: React.FC<Props> = ({
  card,
  height,
  isStashed,
  onToggleStash,
  onOpenDeepDive,
}) => {
  const gradient = card.gradientColors && card.gradientColors.length >= 2
    ? [card.gradientColors[0], card.gradientColors[1]]
    : ['#141E30', '#243B55'];

  return (
    <View style={[styles.container, { height }]}>
      {/* Dynamic Thematic Gradient Background */}
      <LinearGradient
        colors={[gradient[0] as string, gradient[1] as string, '#0B0D13']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Noise / Radial Vignette Effect */}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content Layer */}
      <View style={styles.cardContent}>
        {/* Top Header Row */}
        <View style={styles.topHeader}>
          <CategoryBadge category={card.category} />
          
          <View style={styles.topMetaRight}>
            {card.aiSummarized && (
              <View style={styles.aiPill}>
                <Ionicons name="sparkles" size={11} color="#64B5F6" />
                <Text style={styles.aiPillText}>AI Summary</Text>
              </View>
            )}
            <View style={styles.readTimeBadge}>
              <Ionicons name="flash-outline" size={12} color="#FFD54F" />
              <Text style={styles.readTimeText}>{card.readTimeSeconds}s bite</Text>
            </View>
          </View>
        </View>

        {/* Main Body + Right Action Sidebar */}
        <View style={styles.middleRow}>
          {/* Main Reading Text Area */}
          <View style={styles.textArea}>
            <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit>
              {card.title}
            </Text>

            <Text style={styles.summaryText}>
              {card.summary}
            </Text>

            {/* Key Takeaway Callout Card */}
            <View style={styles.takeawayCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="rgba(255, 255, 255, 0.7)" style={styles.quoteIcon} />
              <Text style={styles.takeawayText} numberOfLines={3}>
                {card.takeaway}
              </Text>
            </View>

            {/* Source Attribution Tag */}
            <View style={styles.sourceTag}>
              <Ionicons name="book-outline" size={13} color="#9CA3AF" />
              <Text style={styles.sourceLabel}>{card.sourceName}</Text>
            </View>
          </View>

          {/* Right-Hand Floating Sidebar */}
          <View style={styles.sidebarWrapper}>
            <ActionSidebar
              card={card}
              isStashed={isStashed}
              onToggleStash={onToggleStash}
              onOpenDeepDive={onOpenDeepDive}
            />
          </View>
        </View>

        {/* Bottom Navigation Hint */}
        <View style={styles.bottomHintContainer}>
          <Ionicons name="chevron-up" size={16} color="rgba(255, 255, 255, 0.4)" />
          <Text style={styles.bottomHintText}>Swipe for next bite</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: '#0B0D13',
  },
  cardContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 24,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 181, 246, 0.3)',
    gap: 4,
  },
  aiPillText: {
    color: '#64B5F6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  readTimeText: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '600',
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  textArea: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
    marginBottom: 14,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  summaryText: {
    color: '#E8EAED',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 18,
    fontWeight: '400',
  },
  takeawayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  quoteIcon: {
    marginBottom: 4,
  },
  takeawayText: {
    color: '#F3F4F6',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  sidebarWrapper: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHintContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  bottomHintText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
