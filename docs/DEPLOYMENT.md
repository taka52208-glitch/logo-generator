# デプロイ情報

## 本番URL

- **フロントエンド**: https://frontend-dun-five-14.vercel.app
- **バックエンド**: https://logo-generator-api-pxg5.onrender.com
- **リポジトリ**: https://github.com/taka52208-glitch/logo-generator

## 構成

| コンポーネント | プラットフォーム | プラン |
|---------------|----------------|--------|
| フロントエンド | Vercel | Free |
| バックエンド | Render.com | Free |

## 環境変数

### Vercel（フロントエンド）
- `VITE_API_URL`: バックエンドURL

### Render（バックエンド）
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `FRONTEND_ORIGIN`: フロントエンドURL（CORS用）

## デプロイ方法

- `main` ブランチへのpushで両方とも自動デプロイ
- Render無料プランはコールドスタートあり（初回アクセスに30-60秒）

## 注意事項

- Render無料プランは15分無通信でスリープする
- 環境変数の変更は各ダッシュボードで行い、再デプロイが必要
