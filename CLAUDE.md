# ロゴ作成ジェネレーター

## 基本原則
> 「シンプルさは究極の洗練である」

- **最小性**: 不要なコードは一文字も残さない。必要最小限を超えない
- **単一性**: 真実の源は常に一つ（型: types/index.ts、要件: requirements.md、進捗: SCOPE_PROGRESS.md）
- **刹那性**: 役目を終えたコード・ドキュメントは即座に削除する
- **実証性**: 推測しない。ログ・DB・APIレスポンスで事実を確認する
- **潔癖性**: エラーは隠さない。フォールバックで問題を隠蔽しない

## プロジェクト設定

技術スタック:
  frontend: React 18 + TypeScript 5 + MUI v6 + Vite 5 + Zustand + React Query
  backend: Python 3.12 + FastAPI + httpx + Pydantic v2 + uvicorn
  database: なし（MVP）

ポート設定:
  frontend: 3847
  backend: 8291

## 環境変数

- frontend: frontend/.env.local（VITE_*プレフィックス必須）
  - 設定モジュール: src/config/index.ts（import.meta.env集約）
  - VITE_API_URL: バックエンドのURL
- backend: backend/.env.local
  - 設定モジュール: app/config.py（os.environ集約）
  - CLOUDFLARE_ACCOUNT_ID: CloudflareアカウントID
  - CLOUDFLARE_API_TOKEN: Cloudflare APIトークン
  - GEMINI_API_KEY: Google Gemini APIキー
- ハードコード禁止: 環境変数はconfig経由のみ
- **絶対禁止**: .env, .env.test, .env.development, .env.example は作成しない

## 命名規則

- コンポーネント: PascalCase.tsx / その他: camelCase.ts
- 変数・関数: camelCase / 定数: UPPER_SNAKE_CASE / 型: PascalCase
- Python: snake_case（関数・変数）/ PascalCase（クラス）/ UPPER_SNAKE_CASE（定数）

## 型定義

- 単一真実源: frontend/src/types/index.ts
- backend/app/schemas.py はフロントエンドの型と同期
- 変更時はフロントエンド → バックエンドの順序で更新

## コード品質

- 関数: 100行以下 / ファイル: 700行以下 / 複雑度: 10以下 / 行長: 120文字

## 開発ルール

### サーバー起動
- サーバーは1つのみ維持。別ポートでの重複起動禁止
- 起動前に既存プロセスを確認
- 環境変数変更時のみ再起動（Viteはホットリロードで環境変数を再読み込みしない）

### エラー対応
- 環境変数エラー → 全タスク停止、即報告（試行錯誤禁止）
- 同じエラー3回 → Web検索で最新情報を収集

### デプロイ
- デプロイはユーザーの明示的な承認を得てから実行する
- 詳細: docs/DEPLOYMENT.md

### ドキュメント管理
許可されたドキュメントのみ作成可能:
- docs/SCOPE_PROGRESS.md（実装計画・進捗）
- docs/requirements.md（要件定義）
- docs/DEPLOYMENT.md（デプロイ情報）
- docs/e2e-specs/（E2Eテスト仕様書）
上記以外のドキュメント作成はユーザー許諾が必要。
実装済みの記載は積極的に削除する。

## 外部API

### Cloudflare Workers AI（ロゴ画像生成）
- モデル: @cf/black-forest-labs/flux-1-schnell
- エンドポイント: https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell
- 認証: Bearer Token
- 無料枠: 1日10,000 Neurons（約2,000枚/日 @512x512）
- 出力: Base64エンコードPNG

### Google Gemini API（テキスト生成）
- モデル: gemini-2.5-flash-lite
- 無料枠: 1日1,000リクエスト
- 用途: 要件分析、プロンプト生成、提案文生成

## Playwright

スクリーンショット保存先: /tmp/bluelamp-screenshots/
