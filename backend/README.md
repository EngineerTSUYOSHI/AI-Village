# 🏰 AI-Village バックエンド (Python / uv)

自律型AIエージェントの思考コアおよびシミュレーションバックエンドです。

---

## 🚀 セットアップ & 実行手順 (Step 1: 頭脳コア検証)

### 1. APIキーの設定 (Gemini API)
`backend/.env.example` をコピーして `.env` を作成し、Google Gemini APIキーを設定します。

```bash
cp .env.example .env
```

`.env` 内の `GEMINI_API_KEY` に実際のAPIキーを貼り付けます：
```env
GEMINI_API_KEY=AIzaSy...あなたのAPIキー
GEMINI_MODEL=gemini-2.5-flash
```
※ APIキーが未設定の場合は、動作確認用のモックモードで自動起動します。

### 2. 実行
`uv` を用いて、CLI対話シミュレーションを実行します：

```bash
uv run python -m app.step1_cli
```

---

## 📂 ディレクトリ構成
```text
backend/
├── app/
│   ├── models.py        # Pydanticデータ構造（プロフィール、記憶、意思決定）
│   ├── brain.py         # Google GenAI SDKを用いた思考・発言生成ロジック
│   ├── agent.py         # エージェントクラス（知覚・記憶蓄積・反応制御）
│   ├── config.py        # 環境変数ロード
│   └── step1_cli.py     # Step 1 CLI検証デモ
├── pyproject.toml       # 依存関係定義 (uv)
└── .env.example         # 環境変数テンプレート
```
