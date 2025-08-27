/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = {
  resolver: {
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  },
  serializer: {
    getPolyfills: () => [],
  },
};
