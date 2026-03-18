import type { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <AutoAwesomeIcon
            sx={{ mr: 1.5, color: 'primary.main', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, cursor: 'pointer', flexGrow: 1 }}
            onClick={() => navigate('/')}
          >
            ロゴ作成ジェネレーター
          </Typography>
          <Button
            color="inherit"
            startIcon={<EditIcon />}
            onClick={() => navigate('/revision')}
            variant={location.pathname === '/revision' ? 'outlined' : 'text'}
            size="small"
          >
            修正対応
          </Button>
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
          Powered by Leonardo Lucid Origin + Gemini AI
        </Typography>
      </Box>
    </Box>
  );
};
