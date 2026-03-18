import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import { logoApi } from '../services/api/logoApi';

export const ClientRevisionPage = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [revisedImage, setRevisedImage] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64 = result.split(',')[1];
      setOriginalImage(base64);
      setRevisedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setOriginalImage(base64);
      setRevisedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRevise = async () => {
    if (!originalImage || !revisionText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await logoApi.reviseFromImage(originalImage, revisionText.trim());
      setRevisedImage(result.logo);
    } catch (err) {
      setError(err instanceof Error ? err.message : '修正に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReviseAgain = async () => {
    if (!revisedImage || !revisionText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await logoApi.reviseFromImage(revisedImage, revisionText.trim());
      setRevisedImage(result.logo);
    } catch (err) {
      setError(err instanceof Error ? err.message : '修正に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (base64: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = 'revised_logo.png';
    link.click();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        ロゴ修正対応
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        既存のロゴをアップロードして、修正指示を入力してください
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 左: アップロード & 修正指示 */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              ロゴをアップロード
            </Typography>

            {!originalImage ? (
              <Box
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  クリックまたはドラッグ＆ドロップ
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG, JPG対応
                </Typography>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileUpload}
                />
              </Box>
            ) : (
              <>
                <Card sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    image={`data:image/png;base64,${originalImage}`}
                    alt="アップロードしたロゴ"
                    sx={{ aspectRatio: '1', objectFit: 'contain', bgcolor: '#fff', p: 1 }}
                  />
                </Card>
                <Button
                  variant="text"
                  size="small"
                  fullWidth
                  onClick={() => { setOriginalImage(null); setRevisedImage(null); }}
                  sx={{ mb: 2 }}
                >
                  別の画像をアップロード
                </Button>
              </>
            )}

            <TextField
              label="修正指示"
              placeholder="例: 色をもう少し明るい青に変えてほしい / 丸みを帯びた形にして / 葉のモチーフを追加して"
              multiline
              rows={3}
              fullWidth
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              disabled={loading}
              inputProps={{ maxLength: 500 }}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
              onClick={revisedImage ? handleReviseAgain : handleRevise}
              disabled={loading || !originalImage || !revisionText.trim()}
              sx={{ py: 1.5 }}
            >
              {loading ? '修正中...' : 'ロゴを修正する'}
            </Button>
          </Paper>
        </Grid>

        {/* 右: 修正結果 */}
        <Grid size={{ xs: 12, md: 7 }}>
          {revisedImage ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                修正結果
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                    修正前
                  </Typography>
                  <Card>
                    <CardMedia
                      component="img"
                      image={`data:image/png;base64,${originalImage}`}
                      alt="修正前"
                      sx={{ aspectRatio: '1', objectFit: 'contain', bgcolor: '#fff', p: 1 }}
                    />
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                    修正後
                  </Typography>
                  <Card>
                    <CardMedia
                      component="img"
                      image={`data:image/png;base64,${revisedImage}`}
                      alt="修正後"
                      sx={{ aspectRatio: '1', objectFit: 'contain', bgcolor: '#fff', p: 1 }}
                    />
                  </Card>
                </Grid>
              </Grid>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(revisedImage)}
                sx={{ mt: 2 }}
              >
                修正後ロゴをダウンロード
              </Button>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                ロゴをアップロードして修正指示を入力すると、修正後のロゴがここに表示されます
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
