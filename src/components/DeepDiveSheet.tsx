import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LearningCard } from '../types/card';
import { CategoryBadge } from './CategoryBadge';

interface Props {
  card: LearningCard | null;
  visible: boolean;
  onClose: () => void;
  isStashed: boolean;
  onToggleStash: () => void;
}

export const DeepDiveSheet: React.FC<Props> = ({
  card,
  visible,
  onClose,
  isStashed,
  onToggleStash,
}) => {
  if (!card) return null;

  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await Share.share({
        title: card.title,
        message: `📖 Deep Dive: "${card.title}"\n\n${card.summary}\n\n🔑 Key Takeaway: ${card.takeaway}\n\n${card.body}\n\n— Smart Stash App`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const paragraphs = card.body ? card.body.split('\n\n') : [card.summary];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Drag handle */}
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerMeta}>
              <CategoryBadge category={card.category} size="sm" />
              <View style={styles.dot} />
              <Text style={styles.readTime}>{card.readTimeSeconds}s deep read</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close deep dive"
            >
              <Ionicons name="close" size={20} color="#E0E0E0" />
            </TouchableOpacity>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.title}>{card.title}</Text>

            {/* Source Pill */}
            <View style={styles.sourceRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#64B5F6" />
              <Text style={styles.sourceText}>Source: {card.sourceName}</Text>
            </View>

            {/* Key Takeaway Callout */}
            <View style={styles.takeawayBox}>
              <View style={styles.takeawayHeader}>
                <Ionicons name="bulb" size={16} color="#FFD54F" />
                <Text style={styles.takeawayLabel}>KEY TAKEAWAY</Text>
              </View>
              <Text style={styles.takeawayText}>{card.takeaway}</Text>
            </View>

            {/* Full Story Paragraphs */}
            <View style={styles.paragraphsWrapper}>
              {paragraphs.map((p, idx) => (
                <Text key={idx} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </View>

            {/* Tags */}
            {card.tags && card.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {card.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom Fixed Action Toolbar */}
          <View style={styles.footerToolbar}>
            <TouchableOpacity
              style={[styles.footerStashBtn, isStashed && styles.footerStashBtnActive]}
              onPress={onToggleStash}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isStashed ? 'heart' : 'heart-outline'}
                size={18}
                color={isStashed ? '#FF4757' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.footerBtnText,
                  isStashed && { color: '#FF4757', fontWeight: '700' },
                ]}
              >
                {isStashed ? 'Saved in Stash' : 'Save to My Stash'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerShareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              <Text style={styles.footerBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    height: '82%',
    backgroundColor: '#161922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 8,
  },
  readTime: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  sourceText: {
    color: '#90CAF9',
    fontSize: 13,
    fontWeight: '500',
  },
  takeawayBox: {
    backgroundColor: 'rgba(255, 213, 79, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD54F',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  takeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  takeawayLabel: {
    color: '#FFD54F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  takeawayText: {
    color: '#FFF8E1',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  paragraphsWrapper: {
    gap: 16,
    marginBottom: 24,
  },
  paragraph: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  footerToolbar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12141C',
    gap: 12,
  },
  footerStashBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  footerStashBtnActive: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  footerShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 13,
    borderRadius: 12,
  },
  footerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
