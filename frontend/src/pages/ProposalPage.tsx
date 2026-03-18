import { useEffect, useState, useCallback } from 'react';
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
  Divider,
  Select,
  MenuItem,
  Slider,
  FormControl,
  InputLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import { useNavigate } from 'react-router-dom';
import { useLogoStore } from '../stores/useLogoStore';
import { logoApi } from '../services/api/logoApi';
import { generateAllMockups } from '../utils/mockupGenerator';
import { composeLogoWithText, FONT_OPTIONS, type ComposeOptions } from '../utils/logoComposer';
import type { Mockups } from '../types';

// Store raw (icon-only) logo separately for recomposition
let rawLogoCache: string | null = null;

export const ProposalPage = () => {
  const navigate = useNavigate();
  const store = useLogoStore();
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mockups, setMockups] = useState<Mockups | null>(null);
  const [mockupsLoading, setMockupsLoading] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [revising, setRevising] = useState(false);

  // Font customization state
  const [fontId, setFontId] = useState('mplus');
  const [textColor, setTextColor] = useState('#1a1a2e');
  const [fontSize, setFontSize] = useState(50);
  const [recomposing, setRecomposing] = useState(false);

  const selectedLogo = store.logos[store.selectedLogoIndex];
  const selectedPrompt = store.prompts[store.selectedLogoIndex];
  const companyName = store.analysis?.companyName || '';

  useEffect(() => {
    if (!selectedLogo || !store.analysis) {
      navigate('/');
      return;
    }

    // Cache the current logo as raw for recomposition
    if (!rawLogoCache) {
      rawLogoCache = selectedLogo;
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
      // non-critical
    } finally {
      setMockupsLoading(false);
    }
  };

  const handleRecompose = useCallback(async (opts: ComposeOptions) => {
    const raw = rawLogoCache;
    if (!raw) return;
    setRecomposing(true);
    try {
      const composed = await composeLogoWithText(raw, companyName, opts);
      store.replaceLogo(store.selectedLogoIndex, composed);

      // Regenerate mockups
      const newMockups = await generateAllMockups(composed, companyName);
      setMockups(newMockups);
    } catch {
      // non-critical
    } finally {
      setRecomposing(false);
    }
  }, [companyName, store]);

  const handleFontChange = async (newFontId: string) => {
    setFontId(newFontId);
    await handleRecompose({ fontId: newFontId, textColor, fontSize });
  };

  const handleColorChange = async (newColor: string) => {
    setTextColor(newColor);
    await handleRecompose({ fontId, textColor: newColor, fontSize });
  };

  const handleFontSizeCommit = async (_: unknown, newSize: number | number[]) => {
    const size = typeof newSize === 'number' ? newSize : newSize[0];
    setFontSize(size);
    await handleRecompose({ fontId, textColor, fontSize: size });
  };

  const handleRevise = async () => {
    if (!revisionText.trim() || !selectedPrompt) return;
    setRevising(true);
    setError(null);

    try {
      const revisedPrompt = await logoApi.revisePrompt(selectedPrompt, revisionText.trim());
      const [rawLogo] = await logoApi.generateLogos([revisedPrompt]);

      // Update raw cache
      rawLogoCache = rawLogo;

      const composedLogo = await composeLogoWithText(rawLogo, companyName, { fontId, textColor, fontSize });
      store.replacePrompt(store.selectedLogoIndex, revisedPrompt);
      store.replaceLogo(store.selectedLogoIndex, composedLogo);

      setMockupsLoading(true);
      const newMockups = await generateAllMockups(composedLogo, companyName);
      setMockups(newMockups);
      setMockupsLoading(false);

      if (store.analysis) {
        store.setProposalText('');
        store.setStep('proposalGenerating');
        const proposal = await logoApi.generateProposal(store.analysis, revisedPrompt);
        store.setProposalText(proposal);
        store.setStep('proposal');
      }

      setRevisionText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '修正に失敗しました');
    } finally {
      setRevising(false);
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
    rawLogoCache = null;
    store.setProposalText('');
    store.setStep('selecting');
    navigate('/');
  };

  const isGenerating = store.step === 'proposalGenerating';
  const isLoading = revising || recomposing;

  const mockupItems = mockups
    ? [
        { label: '名刺', data: mockups.businessCard, file: 'mockup_card.png' },
        { label: '看板', data: mockups.signboard, file: 'mockup_sign.png' },
        { label: 'Webサイト', data: mockups.website, file: 'mockup_web.png' },
      ]
    : [];

  const colorOptions = [
    { value: '#1a1a2e', label: 'ダークネイビー' },
    { value: '#212121', label: 'ブラック' },
    { value: '#3E2723', label: 'ダークブラウン' },
    { value: '#1565C0', label: 'ブルー' },
    { value: '#2E7D32', label: 'グリーン' },
    { value: '#C49A6C', label: 'ゴールド' },
    { value: '#7B1FA2', label: 'パープル' },
    { value: '#D32F2F', label: 'レッド' },
    { value: '#757575', label: 'グレー' },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
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
            <Typography variant="h3" sx={{ mb: 2 }}>選択したロゴ</Typography>
            {selectedLogo && (
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={`data:image/png;base64,${selectedLogo}`}
                  alt="選択したロゴ"
                  sx={{
                    aspectRatio: '1',
                    objectFit: 'contain',
                    bgcolor: '#fff',
                    p: 1,
                    opacity: isLoading ? 0.3 : 1,
                    transition: 'opacity 0.3s',
                  }}
                />
                {isLoading && (
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary">
                      {revising ? '修正中...' : '適用中...'}
                    </Typography>
                  </Box>
                )}
              </Card>
            )}
            <Button
              variant="outlined" fullWidth startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedLogo, `logo_${companyName || 'design'}.png`)}
              sx={{ mt: 2 }} disabled={isLoading}
            >
              ロゴをダウンロード
            </Button>

            {/* テキスト調整 */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FormatSizeIcon fontSize="small" /> テキスト調整
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>フォント</InputLabel>
              <Select
                value={fontId}
                label="フォント"
                onChange={(e) => handleFontChange(e.target.value)}
                disabled={isLoading}
              >
                {FONT_OPTIONS.map((f) => (
                  <MenuItem key={f.id} value={f.id} sx={{ fontFamily: `${f.family}, sans-serif` }}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>テキスト色</InputLabel>
              <Select
                value={textColor}
                label="テキスト色"
                onChange={(e) => handleColorChange(e.target.value)}
                disabled={isLoading}
              >
                {colorOptions.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: c.value, border: '1px solid #ddd' }} />
                      {c.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              テキストサイズ
            </Typography>
            <Slider
              value={fontSize}
              min={20}
              max={80}
              onChange={(_, v) => setFontSize(typeof v === 'number' ? v : v[0])}
              onChangeCommitted={handleFontSizeCommit}
              disabled={isLoading}
              size="small"
              sx={{ mb: 2 }}
            />

            {/* ロゴ修正 */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              ロゴを修正する
            </Typography>
            <TextField
              label="修正指示"
              placeholder="例: もっと丸みを帯びた形に / 色を明るく / モチーフを桜に変えて"
              multiline rows={2} fullWidth
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              disabled={isLoading}
              inputProps={{ maxLength: 500 }}
              size="small" sx={{ mb: 1 }}
            />
            <Button
              variant="contained" fullWidth
              startIcon={revising ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
              onClick={handleRevise}
              disabled={isLoading || !revisionText.trim()}
            >
              {revising ? '修正中...' : 'ロゴを修正'}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {/* モックアップ */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>モックアップ</Typography>
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
                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                        <Button size="small" startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(item.data, item.file)}>ダウンロード</Button>
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
              <Typography variant="h3">提案文</Typography>
              <Button variant="contained" startIcon={<ContentCopyIcon />}
                onClick={handleCopy} disabled={!store.proposalText || isGenerating}>コピー</Button>
            </Box>

            {isGenerating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">提案文を生成中...</Typography>
              </Box>
            ) : (
              <TextField
                multiline fullWidth minRows={16}
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

      <Snackbar open={copySuccess} autoHideDuration={2000}
        onClose={() => setCopySuccess(false)} message="提案文をコピーしました" />
    </Box>
  );
};
