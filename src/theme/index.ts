export const colors = {
  background: '#FAF6EF',
  backgroundWarm: '#F3EADA',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE0',
  border: '#E7E0D2',
  text: '#20241F',
  textMuted: '#736C60',
  textOnDark: '#F6F1E6',
  textOnDarkMuted: '#C9CFC5',

  primary: '#24463A',
  primaryLight: '#4F8A70',
  primaryMuted: '#E1ECE3',

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

export const gradients = {
  primary: ['#2E5B4B', '#1B362C'] as const,
  primarySoft: ['#4F8A70', '#2E5B4B'] as const,
  accent: ['#F0A868', '#D97D45'] as const,
  hero: ['#F3EADA', '#FAF6EF'] as const,
  heroDark: ['#24463A', '#152B23'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#1B2A22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
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
    shadowColor: '#1B2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
};

export const memberPalette = [
  '#24463A',
  '#D97D45',
  '#4B6FA0',
  '#8B5A9E',
  '#B0894F',
  '#3FA57E',
];

export const memberEmojis = ['🦊', '🐢', '🐝', '🐧', '🐿️', '🦉', '🐣', '🐨'];
