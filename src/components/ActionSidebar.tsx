import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Share, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LearningCard } from '../types/card';

interface Props {
  card: LearningCard;
  isStashed: boolean;
  onToggleStash: () => void;
  onOpenDeepDive: () => void;
}

export const ActionSidebar: React.FC<Props> = ({
  card,
  isStashed,
  onToggleStash,
  onOpenDeepDive,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStashPress = () => {
    // Tactile haptic feedback
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }

    // Spring animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleStash();
  };

  const handleSharePress = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await Share.share({
        title: card.title,
        message: `💡 "${card.title}"\n\n${card.summary}\n\n🔑 Takeaway: ${card.takeaway}\n\n— Stashed from Smart Stash`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Stash / Heart Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={handleStashPress}
        accessibilityLabel={isStashed ? 'Remove from Stash' : 'Save to Stash'}
      >
        <Animated.View
          style={[
            styles.iconCircle,
            isStashed && styles.iconCircleActive,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Ionicons
            name={isStashed ? 'heart' : 'heart-outline'}
            size={26}
            color={isStashed ? '#FF4757' : '#FFFFFF'}
          />
        </Animated.View>
        <Text style={[styles.actionLabel, isStashed && styles.actionLabelActive]}>
          {isStashed ? 'Saved' : 'Stash'}
        </Text>
      </TouchableOpacity>

      {/* Deep Dive / Read Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={onOpenDeepDive}
        accessibilityLabel="Read full story"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="book-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.actionLabel}>Deep Dive</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={handleSharePress}
        accessibilityLabel="Share this card"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="paper-plane-outline" size={23} color="#FFFFFF" />
        </View>
        <Text style={styles.actionLabel}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderColor: 'rgba(255, 71, 87, 0.5)',
  },
  actionLabel: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionLabelActive: {
    color: '#FF4757',
  },
});
