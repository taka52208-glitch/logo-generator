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
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import { useNavigate } from 'react-router-dom';
import { useLogoStore } from '../stores/useLogoStore';
import { logoApi } from '../services/api/logoApi';

const steps = ['案件を読み取り', '要件を分析', 'ロゴを生成', 'ロゴを選択'];

const getActiveStep = (step: string): number => {
  switch (step) {
    case 'input': return 0;
    case 'fetching': return 0;
    case 'analyzing': return 1;
    case 'generating': return 2;
    case 'selecting': return 3;
    default: return 0;
  }
};

const getLoadingText = (step: string): string => {
  switch (step) {
    case 'fetching': return '案件を読み取り中...';
    case 'analyzing': return '要件を分析中...';
    case 'generating': return 'ロゴを生成中...';
    default: return '';
  }
};

export const GeneratePage = () => {
  const navigate = useNavigate();
  const store = useLogoStore();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const runPipeline = async (briefText: string) => {
    store.setBriefText(briefText);

    store.setStep('analyzing');
    const analysis = await logoApi.analyze(briefText);
    store.setAnalysis(analysis);

    store.setStep('generating');
    const prompts = await logoApi.generatePrompts(analysis);
    store.setPrompts(prompts);

    store.setLogos([]);
    store.setRawLogos([]);
    const rawLogos = await logoApi.generateLogos(prompts);
    store.setRawLogos(rawLogos);
    // Show raw logos (icon only) by default — text is added in ProposalPage
    store.setLogos(rawLogos);

    store.setStep('selecting');
  };

  const handleGenerateFromUrl = async () => {
    if (!url.trim()) return;
    setError(null);

    try {
      store.setStep('fetching');
      const text = await logoApi.fetchUrl(url.trim());
      await runPipeline(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      store.setStep('input');
    }
  };

  const handleGenerateFromText = async () => {
    if (!store.briefText.trim()) return;
    setError(null);

    try {
      await runPipeline(store.briefText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      store.setStep('input');
    }
  };

  const handleSelectLogo = (index: number) => {
    store.setSelectedLogoIndex(index);
    navigate('/proposal');
  };

  const isLoading = store.step === 'fetching' || store.step === 'analyzing' || store.step === 'generating';
  const loadingText = getLoadingText(store.step);

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
          案件URLを貼り付けてワンクリックで生成
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="案件URL"
            placeholder="https://crowdworks.jp/public/jobs/..."
            fullWidth
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
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
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleGenerateFromUrl}
          disabled={isLoading || !url.trim()}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
          sx={{ py: 1.5, mb: 2 }}
        >
          {isLoading ? loadingText : 'URLからロゴを生成'}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            または
          </Typography>
        </Divider>

        {!showTextInput ? (
          <Button
            variant="text"
            fullWidth
            onClick={() => setShowTextInput(true)}
            disabled={isLoading}
          >
            テキストを直接入力する
          </Button>
        ) : (
          <>
            <TextField
              label="案件テキスト"
              placeholder="案件説明文をここに貼り付け..."
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
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={handleGenerateFromText}
              disabled={isLoading || !store.briefText.trim()}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{ py: 1.5 }}
            >
              {isLoading ? loadingText : 'テキストからロゴを生成'}
            </Button>
          </>
        )}
      </Paper>

      {store.analysis && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            要件分析結果
          </Typography>
          {store.analysis.companyName && (
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              {store.analysis.companyName}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`業種: ${store.analysis.industry}`} variant="outlined" />
            <Chip label={`雰囲気: ${store.analysis.mood}`} variant="outlined" />
            {store.analysis.target && (
              <Chip label={`ターゲット: ${store.analysis.target}`} variant="outlined" />
            )}
            <Chip label={`タイプ: ${store.analysis.logoType}`} variant="outlined" />
            {store.analysis.colors.map((color) => (
              <Chip key={color} label={color} variant="outlined" color="primary" />
            ))}
            {store.analysis.keywords?.map((kw) => (
              <Chip key={kw} label={kw} size="small" color="secondary" variant="outlined" />
            ))}
          </Box>
          {store.analysis.avoidColors && store.analysis.avoidColors.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {store.analysis.avoidColors.map((c) => (
                <Chip key={c} label={`NG: ${c}`} size="small" color="error" variant="outlined" />
              ))}
            </Box>
          )}
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
