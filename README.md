# Bibliophile (蔵書・インサイトメモ管理)

Bibliophileは、読書状況の管理、フォルダによる整理、そして読書から得たインサイト（メモ）を効率的に管理するためのWebアプリケーションです。

## 🚀 主な機能

- **読書ステータス管理**: 「読みたい」「読んでいる」「読んだ」の3つのステータスで本を管理。
- **フォルダ機能**: ドラッグ＆ドロップで本をフォルダに整理。フォルダごとにカスタムカラーの設定が可能。
- **タグシステム**: 本にタグを付けて自由にフィルタリング。
- **インサイトメモ**: 読書中に得た気づきや引用をメモとして保存（今後のアップデートでさらに強化予定）。
- **モバイルフレンドリー**: スマートフォンでも快適に操作できるレスポンシブデザインとボトムシートUI。

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript
- **Styling**: Vanilla CSS, Framer Motion (アニメーション)
- **Backend/Database**: AWS Amplify Gen 2 (Data, Auth)
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit

## 📦 セットアップ

1. リポジトリをクローン:
   ```bash
   git clone https://github.com Taro470/bibliophile.git
   cd bibliophile
   ```

2. 依存関係をインストール:
   ```bash
   npm install
   ```

3. Amplify Sandboxを起動 (バックエンドの開発環境):
   ```bash
   npx ampx sandbox
   ```

4. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

## 🚀 デプロイ

このプロジェクトは AWS Amplify Hosting を使用してデプロイするように構成されています。

- `main` ブランチへのマージが本番環境へのデプロイをトリガーします。
- `develop` ブランチは開発環境の同期に使用されます。

> [!IMPORTANT]
> React 19 と一部のライブラリの互換性のため、ビルド時は `--legacy-peer-deps` フラグを使用してください。

## 📄 ライセンス

MIT
