export const lightColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F2EE',
  border: '#EBEAE4',
  text: '#1D211D',
  textMuted: '#75776F',
  textOnDark: '#F6F1E6',
  textOnDarkMuted: '#C9CFC5',

  primary: '#24463A',
  primaryLight: '#4F8A70',
  primaryMuted: '#E4EEE8',

  accent: '#D97D45',
  accentLight: '#F0A868',
  accentMuted: '#FBEADA',

  danger: '#C1483D',
  dangerMuted: '#F7E2DE',

  staleFresh: '#3FA57E',
  staleOk: '#8CBE4C',
  staleWarn: '#E4AE3B',
  staleOverdue: '#E07B3F',
  staleCritical: '#C1483D',
};

export const darkColors = {
  background: '#14181A',
  surface: '#1D2224',
  surfaceMuted: '#262C2E',
  border: '#333A3C',
  text: '#F2F1EC',
  textMuted: '#9BA39A',
  textOnDark: '#F6F1E6',
  textOnDarkMuted: '#C9CFC5',

  primary: '#6FBB98',
  primaryLight: '#4F8A70',
  primaryMuted: '#22352C',

  accent: '#F0A868',
  accentLight: '#F5C08A',
  accentMuted: '#3A2C1E',

  danger: '#E2685A',
  dangerMuted: '#3A211D',

  staleFresh: '#4FBE8E',
  staleOk: '#A3D164',
  staleWarn: '#F0C15C',
  staleOverdue: '#EF9663',
  staleCritical: '#E2685A',
};

export type ThemeColors = typeof lightColors;

// Gradients are intentionally dark, decorative accent panels — they stay
// the same across both light and dark mode rather than needing their own variants.
export const gradients = {
  primary: ['#2E5B4B', '#1B362C'] as const,
  heroDark: ['#24463A', '#152B23'] as const,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1B362C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
};
