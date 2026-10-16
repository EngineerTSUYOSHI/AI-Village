import os
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトルートまたは backend ディレクトリの .env を探索してロード
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
if not env_path.exists():
    env_path = backend_dir.parent / ".env"

load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def check_api_key() -> bool:
    """GEMINI_API_KEY が設定されているかどうかを判定する"""
    return bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
