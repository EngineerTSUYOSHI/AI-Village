from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MemoryItem(BaseModel):
    """エージェントの記憶の1コマ"""
    timestamp: str = Field(
        default_factory=lambda: datetime.now().strftime("%H:%M"),
        description="記憶が形成された時刻・ターン"
    )
    content: str = Field(description="記憶の内容（例: 『ボブがハーブパンの話題を出した』）")
    kind: str = Field(default="dialogue", description="記憶の種別 (dialogue / observation / reflection)")


class AgentProfile(BaseModel):
    """エージェントの基本情報・性格・目的"""
    name: str = Field(description="名前")
    role: str = Field(description="職業や村での役割")
    personality: str = Field(description="性格・口調の特徴")
    goal: str = Field(description="現在の目的や関心事")


class PerceptionContext(BaseModel):
    """エージェントが現在知覚している状況"""
    location: str = Field(default="村の広場・噴水前", description="現在の場所")
    target_name: str = Field(description="現在相対している相手の名前")
    incoming_message: Optional[str] = Field(default=None, description="相手からの発言（初回接触時はNone）")
    situation: str = Field(description="直前の状況や周囲の様子")


class AgentDecision(BaseModel):
    """LLMが判断した思考・発言・行動（Structured Output用）"""
    inner_thought: str = Field(
        description="相手の言葉や状況を受けて心の中で考えたこと（本音・次の意図）"
    )
    dialogue: Optional[str] = Field(
        default=None,
        description="相手に向かって実際に口に出して発言するセリフ。何も言わない場合はnull"
    )
    action: str = Field(
        description="発言に伴う行動や表情（例: 『笑顔で会釈する』『首をかしげる』『立ち去る』）"
    )
