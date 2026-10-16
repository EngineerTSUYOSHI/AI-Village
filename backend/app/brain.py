import json
import logging
from typing import List, Optional
from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL, check_api_key
from app.models import AgentDecision, AgentProfile, MemoryItem, PerceptionContext

logger = logging.getLogger(__name__)


class AgentBrain:
    """Gemini API を用いてエージェントの思考・行動決定を行うクラス"""

    def __init__(self, model_name: str = GEMINI_MODEL):
        self.model_name = model_name
        self.client: Optional[genai.Client] = None
        if check_api_key():
            self.client = genai.Client(api_key=GEMINI_API_KEY)

    def think(
        self,
        profile: AgentProfile,
        memories: List[MemoryItem],
        context: PerceptionContext,
    ) -> AgentDecision:
        """エージェントの性格・記憶・現在の状況から、次の思考・発言・行動を決定する"""
        if not self.client:
            # APIキー未設定時のモック応答
            return self._mock_think(profile, context)

        # 直近の記憶テキスト
        recent_memories = memories[-5:] if memories else []
        memories_text = "\n".join(
            [f"- [{m.timestamp}] ({m.kind}) {m.content}" for m in recent_memories]
        ) or "（特になし）"

        # システムインストラクション
        system_instruction = f"""あなたは仮想の村に住む自律的なAI住人「{profile.name}」です。
以下のプロフィールと設定に完全になりきって行動・思考してください。

【あなたのプロフィール】
- 名前: {profile.name}
- 役割/職業: {profile.role}
- 性格・口調: {profile.personality}
- 現在の目標/関心事: {profile.goal}

【行動指針】
1. あなたは機械的なアシスタントではなく、感情と生活を持った村の住人です。
2. 相手の発言をそのままオウム返しせず、自分の性格や現在の目標に引き寄せて返答してください。
3. セリフ（dialogue）は2Dゲームの吹き出しに入るような自然で簡潔な長さにしてください（長文は避けて1〜2文程度）。
4. 心の声（inner_thought）には、相手の言葉から受け取った印象や、自分の次なる狙いを率直に言語化してください。
5. 行動（action）には、発言と同時に取る仕草や身振り（例: 「嬉しそうに頷く」「少し恥ずかしそうにする」など）を記述してください。
"""

        # 状況に応じたユーザープロンプト
        user_prompt = f"""【現在の状況】
- 場所: {context.location}
- 相手: {context.target_name}
- 状況: {context.situation}
- 相手からの発言: {f'「{context.incoming_message}」' if context.incoming_message else '（まだ相手は発言していません。あなたから話しかけるか、様子を見ることができます）'}

【あなたの直近の記憶】
{memories_text}

上記を踏まえて、あなたの「心の声(inner_thought)」「発言(dialogue)」「行動(action)」を決定してください。"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AgentDecision,
                    temperature=0.8,
                ),
            )

            # response.parsed が自動的に Pydantic モデルになる
            if response.parsed and isinstance(response.parsed, AgentDecision):
                return response.parsed

            # 万が一 parsed が使えなかった場合の JSON デコードフォールバック
            data = json.loads(response.text)
            return AgentDecision(**data)

        except Exception as e:
            logger.error(f"Gemini API 呼び出しエラー: {e}")
            return self._fallback_decision(profile, context, error_message=str(e))

    def _mock_think(self, profile: AgentProfile, context: PerceptionContext) -> AgentDecision:
        """APIキー未設定時のテスト用モック応答"""
        if context.incoming_message:
            return AgentDecision(
                inner_thought=f"（モック）{context.target_name}が「{context.incoming_message}」と言ってきた。私の目的は「{profile.goal}」だから、それに関連させて返そう。",
                dialogue=f"こんにちは、{context.target_name}さん！ちょうど{profile.role}の仕事中なんですよ。",
                action="笑顔で手を振る",
            )
        else:
            return AgentDecision(
                inner_thought=f"（モック）{context.target_name}を見かけたぞ。話しかけてみようかな。",
                dialogue=f"やあ、{context.target_name}さん！良い天気ですね。",
                action="相手に歩み寄る",
            )

    def _fallback_decision(self, profile: AgentProfile, context: PerceptionContext, error_message: str) -> AgentDecision:
        """エラー発生時の安全なフォールバック"""
        return AgentDecision(
            inner_thought=f"（通信エラーが発生したため、様子を伺うことにした: {error_message}）",
            dialogue="……あ、こんにちは！少しぼーっとしていました。",
            action="照れ笑いをする",
        )
