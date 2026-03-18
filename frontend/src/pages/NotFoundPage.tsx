import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 1 }}>
        404
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        ページが見つかりませんでした
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        トップに戻る
      </Button>
    </Box>
  );
};
