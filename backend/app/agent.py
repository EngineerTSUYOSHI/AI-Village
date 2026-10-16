from typing import List, Optional
from app.brain import AgentBrain
from app.models import AgentDecision, AgentProfile, MemoryItem, PerceptionContext


class Agent:
    """自律型AIエージェントのクラス"""

    def __init__(self, profile: AgentProfile, brain: Optional[AgentBrain] = None):
        self.profile = profile
        self.brain = brain or AgentBrain()
        self.memories: List[MemoryItem] = []

    def add_memory(self, content: str, kind: str = "dialogue"):
        """記憶リストに新しい出来事・発言を追加する"""
        item = MemoryItem(content=content, kind=kind)
        self.memories.append(item)

    def perceive(self, context_description: str):
        """周囲の状況や出来事を知覚して記憶する"""
        self.add_memory(context_description, kind="observation")

    def react(self, context: PerceptionContext) -> AgentDecision:
        """相手の発言や状況を受け取り、思考・発言・行動を決定する"""
        # 相手からの発言がある場合はまず記憶に登録
        if context.incoming_message:
            self.add_memory(
                f"{context.target_name}が『{context.incoming_message}』と言った。",
                kind="dialogue"
            )

        # Brain（Gemini）に思考させる
        decision = self.brain.think(
            profile=self.profile,
            memories=self.memories,
            context=context
        )

        # 自分の行動・発言も自身の記憶として記録
        if decision.dialogue:
            self.add_memory(
                f"私は{context.target_name}に『{decision.dialogue}』と言い、{decision.action}。",
                kind="dialogue"
            )
        else:
            self.add_memory(
                f"私は発言せず、{decision.action}。",
                kind="observation"
            )

        return decision
