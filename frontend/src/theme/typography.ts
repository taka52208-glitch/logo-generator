export const typography = {
  fontFamily: '"Inter", "Noto Sans JP", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '0.9375rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 600,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
} as const;
