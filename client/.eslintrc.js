module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@react-native/typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-raw-text': 'off',
    'react-native/no-color-literals': 'warn',
    'react-native/no-single-element-style-arrays': 'warn',
  },
  env: {
    'react-native/react-native': true,
  },
  settings: {
    'react-native/style-sheet-object-names': ['StyleSheet', 'styles'],
  },
};
