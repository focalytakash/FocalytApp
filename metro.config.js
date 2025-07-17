const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      'react-native-reanimated': require.resolve('react-native-reanimated'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
