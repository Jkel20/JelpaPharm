module.exports = function(api) {
  const isTest = api.env('test');
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Only include reanimated plugin when not in test environment
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
