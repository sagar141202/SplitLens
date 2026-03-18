// SplitLens Design System — Liquid Glassmorphism × Canva Theme

export const COLORS = {
  // Core gradient mesh
  bg: {
    deep:    '#0A0A1A',
    space:   '#0D0B2B',
    navy:    '#0F0E35',
  },

  // Gradient orbs (ambient blobs)
  orbs: {
    violet:  '#6C3AFF',
    indigo:  '#3A4FFF',
    cyan:    '#00D4FF',
    rose:    '#FF3A8C',
    amber:   '#FF9F1C',
    lime:    '#39FF14',
    teal:    '#00FFD1',
  },

  // Glass surfaces
  glass: {
    white10:   'rgba(255,255,255,0.10)',
    white15:   'rgba(255,255,255,0.15)',
    white20:   'rgba(255,255,255,0.20)',
    white06:   'rgba(255,255,255,0.06)',
    border:    'rgba(255,255,255,0.18)',
    borderSub: 'rgba(255,255,255,0.08)',
  },

  // Accent palette (Canva-inspired vivid)
  accent: {
    primary:  '#7B61FF',   // Canva purple
    secondary:'#00D4FF',   // electric cyan
    success:  '#00E6A0',   // mint green
    danger:   '#FF4D6D',   // soft red
    warning:  '#FFB800',   // golden amber
    pink:     '#FF6FB0',   // candy pink
  },

  // Text
  text: {
    primary:   '#FFFFFF',
    secondary: 'rgba(255,255,255,0.70)',
    tertiary:  'rgba(255,255,255,0.40)',
    muted:     'rgba(255,255,255,0.25)',
  },
};

export const FONTS = {
  display:  'System',   // Replace with custom font loading
  body:     'System',
};

export const RADIUS = {
  xs:  8,
  sm:  12,
  md:  18,
  lg:  24,
  xl:  32,
  full: 999,
};

export const SHADOW = {
  glow: (color, radius = 20) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: radius,
    elevation: 12,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Gradient presets
export const GRADIENTS = {
  primary:   ['#7B61FF', '#00D4FF'],
  sunset:    ['#FF3A8C', '#FF9F1C'],
  ocean:     ['#00D4FF', '#00E6A0'],
  candy:     ['#FF6FB0', '#7B61FF'],
  dark:      ['#1A1040', '#0D0B2B'],
  glass:     ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)'],
  success:   ['#00E6A0', '#00D4FF'],
};

// Spacing
export const SPACE = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const ANIMATION = {
  fast:    200,
  normal:  350,
  slow:    500,
  spring: { damping: 15, stiffness: 180 },
};
