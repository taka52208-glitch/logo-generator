import type { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <AutoAwesomeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            ロゴ作成ジェネレーター
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Powered by FLUX.1 + Gemini AI
        </Typography>
      </Box>
    </Box>
  );
};
