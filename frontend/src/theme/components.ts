import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        margin: 0,
        minWidth: 320,
        minHeight: '100vh',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '10px 24px',
        fontSize: '0.875rem',
      },
      containedPrimary: {
        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
};
