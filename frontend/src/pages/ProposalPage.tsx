import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardMedia,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useLogoStore } from '../stores/useLogoStore';
import { logoApi } from '../services/api/logoApi';

export const ProposalPage = () => {
  const navigate = useNavigate();
  const store = useLogoStore();
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedLogo = store.logos[store.selectedLogoIndex];
  const selectedPrompt = store.prompts[store.selectedLogoIndex];

  useEffect(() => {
    if (!selectedLogo || !store.analysis) {
      navigate('/');
      return;
    }

    if (!store.proposalText) {
      generateProposal();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateProposal = async () => {
    if (!store.analysis || !selectedPrompt) return;
    store.setStep('proposalGenerating');
    setError(null);

    try {
      const proposal = await logoApi.generateProposal(store.analysis, selectedPrompt);
      store.setProposalText(proposal);
      store.setStep('proposal');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提案文の生成に失敗しました');
      store.setStep('proposal');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(store.proposalText);
      setCopySuccess(true);
    } catch {
      setError('クリップボードへのコピーに失敗しました');
    }
  };

  const handleDownloadLogo = () => {
    if (!selectedLogo) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${selectedLogo}`;
    link.download = `logo_${store.companyName || 'design'}.png`;
    link.click();
  };

  const handleBack = () => {
    store.setProposalText('');
    store.setStep('selecting');
    navigate('/');
  };

  const isGenerating = store.step === 'proposalGenerating';

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        ロゴ選択に戻る
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              選択したロゴ
            </Typography>
            {selectedLogo && (
              <Card>
                <CardMedia
                  component="img"
                  image={`data:image/png;base64,${selectedLogo}`}
                  alt="選択したロゴ"
                  sx={{
                    aspectRatio: '1',
                    objectFit: 'contain',
                    bgcolor: '#fff',
                    p: 2,
                  }}
                />
              </Card>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5, textAlign: 'center' }}
            >
              {store.companyName}
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleDownloadLogo}
              sx={{ mt: 2 }}
            >
              ロゴをダウンロード
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h3">
                提案文
              </Typography>
              <Button
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={!store.proposalText || isGenerating}
              >
                コピー
              </Button>
            </Box>

            {isGenerating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">提案文を生成中...</Typography>
              </Box>
            ) : (
              <TextField
                multiline
                fullWidth
                minRows={16}
                value={store.proposalText}
                onChange={(e) => store.setProposalText(e.target.value)}
                placeholder="提案文がここに表示されます..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: '"Noto Sans JP", sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: 1.8,
                  },
                }}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="提案文をコピーしました"
      />
    </Box>
  );
};
