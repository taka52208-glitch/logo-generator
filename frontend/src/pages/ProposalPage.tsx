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
  CardActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useLogoStore } from '../stores/useLogoStore';
import { logoApi } from '../services/api/logoApi';
import { generateAllMockups } from '../utils/mockupGenerator';
import type { Mockups } from '../types';

export const ProposalPage = () => {
  const navigate = useNavigate();
  const store = useLogoStore();
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mockups, setMockups] = useState<Mockups | null>(null);
  const [mockupsLoading, setMockupsLoading] = useState(false);

  const selectedLogo = store.logos[store.selectedLogoIndex];
  const selectedPrompt = store.prompts[store.selectedLogoIndex];
  const companyName = store.analysis?.companyName || '';

  useEffect(() => {
    if (!selectedLogo || !store.analysis) {
      navigate('/');
      return;
    }

    if (!store.proposalText) {
      generateProposal();
    }
    if (!mockups) {
      generateMockups();
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

  const generateMockups = async () => {
    if (!selectedLogo) return;
    setMockupsLoading(true);
    try {
      const result = await generateAllMockups(selectedLogo, companyName);
      setMockups(result);
    } catch {
      // Mockup generation is non-critical
    } finally {
      setMockupsLoading(false);
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

  const handleDownload = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = filename;
    link.click();
  };

  const handleBack = () => {
    store.setProposalText('');
    store.setStep('selecting');
    navigate('/');
  };

  const isGenerating = store.step === 'proposalGenerating';

  const mockupItems = mockups
    ? [
        { label: '名刺', data: mockups.businessCard, file: 'mockup_card.png' },
        { label: '看板', data: mockups.signboard, file: 'mockup_sign.png' },
        { label: 'Webサイト', data: mockups.website, file: 'mockup_web.png' },
      ]
    : [];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
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
              {companyName}
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedLogo, `logo_${companyName || 'design'}.png`)}
              sx={{ mt: 2 }}
            >
              ロゴをダウンロード
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {/* モックアップ */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              モックアップ
            </Typography>
            {mockupsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">モックアップを生成中...</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {mockupItems.map((item) => (
                  <Grid size={{ xs: 12 }} key={item.label}>
                    <Card>
                      <CardMedia
                        component="img"
                        image={`data:image/png;base64,${item.data}`}
                        alt={`${item.label}モックアップ`}
                        sx={{ width: '100%' }}
                      />
                      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(item.data, item.file)}
                        >
                          ダウンロード
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* 提案文 */}
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
