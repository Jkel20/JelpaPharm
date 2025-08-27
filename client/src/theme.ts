import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E4D2B', // Ghanaian green
    secondary: '#FDB913', // Ghanaian gold
    tertiary: '#CE1126', // Ghanaian red
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#1A1A1A',
    onSurface: '#1A1A1A',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
  fonts: {
    ...DefaultTheme.fonts,
    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: 'System',
      fontWeight: '600',
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: 'System',
      fontWeight: '500',
    },
    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: 'System',
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: 'System',
    },
    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: 'System',
      fontWeight: '700',
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: 'System',
      fontWeight: '600',
    },
  },
  roundness: 8,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};
