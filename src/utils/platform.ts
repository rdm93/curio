/**
 * Safe platform utility that works in both React Native / Expo Metro bundler
 * and Node.js test environments without triggering Flow syntax errors.
 */

let currentOS: 'ios' | 'android' | 'web' = 'web';

if (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative') {
  try {
    const RN = require('react-native');
    if (RN && RN.Platform) {
      currentOS = RN.Platform.OS;
    }
  } catch (_) {
    currentOS = 'android';
  }
}

export const Platform = {
  OS: currentOS,
};
