import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from './src/database/databaseService';
import { FeedScreen } from './src/screens/FeedScreen';
import { StashScreen } from './src/screens/StashScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'feed' | 'stash'>('feed');
  const [stashedCount, setStashedCount] = useState(0);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await databaseService.getStats();
      setStashedCount(stats.stashedCount);
    } catch (err) {
      console.warn('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    databaseService.init().then(() => {
      refreshStats();
    });
  }, [refreshStats]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D13" />

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {currentTab === 'feed' ? (
          <FeedScreen
            onNavigateToStash={() => setCurrentTab('stash')}
            stashedCount={stashedCount}
            onStashUpdated={refreshStats}
          />
        ) : (
          <StashScreen
            onBackToFeed={() => setCurrentTab('feed')}
            onStashUpdated={refreshStats}
          />
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('feed')}
        >
          <Ionicons
            name={currentTab === 'feed' ? 'flash' : 'flash-outline'}
            size={22}
            color={currentTab === 'feed' ? '#FFD54F' : '#6B7280'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'feed' && styles.navLabelActiveFeed,
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('stash')}
        >
          <View style={styles.stashIconWrapper}>
            <Ionicons
              name={currentTab === 'stash' ? 'heart' : 'heart-outline'}
              size={22}
              color={currentTab === 'stash' ? '#FF4757' : '#6B7280'}
            />
            {stashedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stashedCount > 99 ? '99+' : stashedCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'stash' && styles.navLabelActiveStash,
            ]}
          >
            My Stash
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#12141C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 80,
  },
  stashIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#FF4757',
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  navLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  navLabelActiveFeed: {
    color: '#FFD54F',
    fontWeight: '700',
  },
  navLabelActiveStash: {
    color: '#FF4757',
    fontWeight: '700',
  },
});
