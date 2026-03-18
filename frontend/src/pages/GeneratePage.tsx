import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import { useNavigate } from 'react-router-dom';
import { useLogoStore } from '../stores/useLogoStore';
import { logoApi } from '../services/api/logoApi';
import { composeLogoWithText } from '../utils/logoComposer';

const steps = ['案件を入力', '要件を分析', 'ロゴを生成', 'ロゴを選択'];

const getActiveStep = (step: string): number => {
  switch (step) {
    case 'input': return 0;
    case 'analyzing': return 1;
    case 'generating': return 2;
    case 'selecting': return 3;
    default: return 0;
  }
};

export const GeneratePage = () => {
  const navigate = useNavigate();
  const store = useLogoStore();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setError(null);
    setFetchingUrl(true);
    try {
      const text = await logoApi.fetchUrl(url.trim());
      store.setBriefText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URLの読み取りに失敗しました');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleGenerate = async () => {
    if (!store.briefText.trim() || !store.companyName.trim()) return;
    setError(null);

    try {
      store.setStep('analyzing');
      const analysis = await logoApi.analyze(store.briefText, store.companyName);
      store.setAnalysis(analysis);

      store.setStep('generating');
      const prompts = await logoApi.generatePrompts(analysis);
      store.setPrompts(prompts);

      store.setLogos([]);
      const rawLogos = await logoApi.generateLogos(prompts);

      // Compose: AI icon + company name text
      const composedLogos = await Promise.all(
        rawLogos.map((logo) => composeLogoWithText(logo, store.companyName))
      );
      store.setLogos(composedLogos);

      store.setStep('selecting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      store.setStep('input');
    }
  };

  const handleSelectLogo = (index: number) => {
    store.setSelectedLogoIndex(index);
    navigate('/proposal');
  };

  const isLoading = store.step === 'analyzing' || store.step === 'generating';

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Stepper activeStep={getActiveStep(store.step)} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          ロゴを生成する
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          案件URLを貼り付けるか、説明文を直接入力してください
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="案件URL"
            placeholder="https://crowdworks.jp/public/jobs/..."
            fullWidth
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading || fetchingUrl}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="outlined"
            onClick={handleFetchUrl}
            disabled={isLoading || fetchingUrl || !url.trim()}
            sx={{ minWidth: 100, whiteSpace: 'nowrap' }}
          >
            {fetchingUrl ? <CircularProgress size={20} /> : '読み取り'}
          </Button>
        </Box>

        <TextField
          label="案件テキスト"
          placeholder="クラウドワークス・ランサーズの案件説明文をここに貼り付け..."
          multiline
          rows={6}
          fullWidth
          value={store.briefText}
          onChange={(e) => store.setBriefText(e.target.value)}
          disabled={isLoading}
          inputProps={{ maxLength: 5000 }}
          helperText={`${store.briefText.length} / 5,000`}
          sx={{ mb: 2 }}
        />

        <TextField
          label="会社名・サービス名"
          placeholder="例: 株式会社ABC"
          fullWidth
          value={store.companyName}
          onChange={(e) => store.setCompanyName(e.target.value)}
          disabled={isLoading}
          inputProps={{ maxLength: 100 }}
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleGenerate}
          disabled={isLoading || !store.briefText.trim() || !store.companyName.trim()}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
          sx={{ py: 1.5 }}
        >
          {store.step === 'analyzing'
            ? '要件を分析中...'
            : store.step === 'generating'
            ? 'ロゴを生成中...'
            : 'ロゴを生成する'}
        </Button>
      </Paper>

      {store.analysis && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            要件分析結果
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`業種: ${store.analysis.industry}`} variant="outlined" />
            <Chip label={`雰囲気: ${store.analysis.mood}`} variant="outlined" />
            <Chip label={`ターゲット: ${store.analysis.target}`} variant="outlined" />
            <Chip label={`タイプ: ${store.analysis.logoType}`} variant="outlined" />
            {store.analysis.colors.map((color) => (
              <Chip key={color} label={color} variant="outlined" color="primary" />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {store.analysis.concept}
          </Typography>
        </Paper>
      )}

      {store.logos.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            生成されたロゴ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            気に入ったロゴを選んで提案パッケージを作成しましょう
          </Typography>
          <Grid container spacing={2}>
            {store.logos.map((logo, index) => (
              <Grid size={{ xs: 6 }} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={`data:image/png;base64,${logo}`}
                    alt={`ロゴ案 ${index + 1}`}
                    sx={{
                      aspectRatio: '1',
                      objectFit: 'contain',
                      bgcolor: '#fff',
                      p: 2,
                    }}
                  />
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handleSelectLogo(index)}
                    >
                      この案で提案を作る
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};
