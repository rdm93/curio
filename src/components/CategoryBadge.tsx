import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardCategory } from '../types/card';

interface Props {
  category: CardCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<Props> = ({ category, size = 'md' }) => {
  const config = getCategoryConfig(category);

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, size === 'sm' && styles.badgeSm]}>
      <Ionicons name={config.icon as any} size={size === 'sm' ? 12 : 14} color={config.textColor} style={styles.icon} />
      <Text style={[styles.text, { color: config.textColor }, size === 'sm' && styles.textSm]}>
        {category}
      </Text>
    </View>
  );
};

function getCategoryConfig(category: CardCategory) {
  switch (category) {
    case 'History':
      return {
        icon: 'time-outline',
        textColor: '#FFB26B',
        bgColor: 'rgba(255, 178, 107, 0.15)',
      };
    case 'Science':
      return {
        icon: 'planet-outline',
        textColor: '#4ECCA3',
        bgColor: 'rgba(78, 204, 163, 0.15)',
      };
    case 'Philosophy':
      return {
        icon: 'bulb-outline',
        textColor: '#E0A96D',
        bgColor: 'rgba(224, 169, 109, 0.15)',
      };
    case 'Mental Models':
      return {
        icon: 'compass-outline',
        textColor: '#64B5F6',
        bgColor: 'rgba(100, 181, 246, 0.15)',
      };
    default:
      return {
        icon: 'sparkles-outline',
        textColor: '#FFFFFF',
        bgColor: 'rgba(255, 255, 255, 0.15)',
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
