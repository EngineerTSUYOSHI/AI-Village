import asyncio
import json
import logging
import random
from pathlib import Path
from typing import Callable, Dict, List, Optional

from app.agent import Agent
from app.brain import AgentBrain
from app.models import AgentProfile, PerceptionContext

logger = logging.getLogger(__name__)


class WorldEngine:
    """10人の住人と10日間の社会創発シミュレーションを統括するエンジン"""

    def __init__(self):
        self.brain = AgentBrain()
        self.agents: Dict[str, Agent] = {}
        self.is_conversing = False

        # 時間管理 (20倍速: 1秒で20分進む -> 1日約72秒)
        self.day = 1
        self.hour = 8
        self.minute = 0
        self.time_speed = 20.0
        self.is_paused = False

        # シナリオイベント
        self.scenario_events: List[dict] = []
        self.triggered_event_ids: set = set()
        self.recent_village_news: str = "村は穏やかな朝を迎えています。"

        self._init_10_agents()
        self._load_scenario()

    def _init_10_agents(self):
        """10人の個性と価値観が対立する住人を初期化"""
        profiles = [
            AgentProfile(
                name="アリス",
                role="パン屋見習い",
                personality="明るく好奇心旺盛。助け合いと平和を愛する民衆のムードメーカー。",
                goal="新作パンを焼き、村のみんなが笑顔で暮らせる平和を守りたい。"
            ),
            AgentProfile(
                name="ボブ",
                role="森の薬草師",
                personality="物静かで人見知りだが観察眼が鋭い。自然と薬草を愛する孤高の人物。",
                goal="ハーブの良さを伝え、傷ついた人を手当てしたいが、濡れ衣を着せられるのを恐れている。"
            ),
            AgentProfile(
                name="エディ",
                role="自警団隊長",
                personality="厳格で好戦的。法と武力による絶対的な秩序を信奉するリーダー志望。",
                goal="村の危機を排除して自警団の権限を強化し、村の真の指導者になりたい。"
            ),
            AgentProfile(
                name="クララ",
                role="旅の商人",
                personality="抜け目がなく金と情報に貪欲。都合の良い噂を流して利益を得ようとする。",
                goal="村の混乱に乗じて貴重な物資を高値で売りさばき、一儲けしたい。"
            ),
            AgentProfile(
                name="ギルバート",
                role="現村長",
                personality="温厚だが高齢で決断力に欠ける。伝統と体裁を何より重んじる事なかれ主義。",
                goal="任期満了まで大きな揉め事を起こさず、平穏に村長を勤め上げたい。"
            ),
            AgentProfile(
                name="デイビッド",
                role="頑固な鍛冶屋",
                personality="職人気質で無骨。理屈より力と武器の実用性を重んじるエディの支持者。",
                goal="自慢の鉄製品で村の防衛を固め、盗まれた短剣を取り戻したい。"
            ),
            AgentProfile(
                name="エレナ",
                role="教会司祭",
                personality="慈悲深く誰の悩みも平等に聞く。争いを嫌い、祈りと対話を説く聖職者。",
                goal="疑心暗鬼に陥った村人の心を癒やし、暴力による対立を食い止めたい。"
            ),
            AgentProfile(
                name="フェリックス",
                role="吟遊詩人",
                personality="自由奔放で風刺好き。権力やルールを嘲笑し、民衆を煽る反体制派。",
                goal="面白いスキャンダルを歌にして村中に広め、自警団の鼻を明かしたい。"
            ),
            AgentProfile(
                name="ハナ",
                role="農家の娘",
                personality="素朴で働き者。大地と作物を愛し、食糧問題に誰よりも敏感。",
                goal="丹精込めて育てた作物を守り、食料危機や略奪から村の食卓を守りたい。"
            ),
            AgentProfile(
                name="アイリス",
                role="図書館司書・学者",
                personality="冷静沈着で理知的。感情に流されず証拠と論理に基づいて真実を追究する。",
                goal="村で起きる不可解な事件の謎を科学的・論理的に解明し、真犯人を突き止めたい。"
            )
        ]

        keys = ["alice", "bob", "eddie", "clara", "gilbert", "david", "elena", "felix", "hana", "iris"]
        for key, p in zip(keys, profiles):
            self.agents[key] = Agent(profile=p, brain=self.brain)

    def _load_scenario(self):
        """scenario.json をロード"""
        scenario_path = Path(__file__).parent / "scenario.json"
        if scenario_path.exists():
            try:
                with open(scenario_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.scenario_events = data.get("events", [])
                    logger.info(f"シナリオイベント {len(self.scenario_events)} 件をロードしました")
            except Exception as e:
                logger.error(f"scenario.json ロード失敗: {e}")

    def get_time_string(self) -> str:
        period = "AM" if self.hour < 12 else "PM"
        display_hour = self.hour if self.hour <= 12 else self.hour - 12
        if display_hour == 0:
            display_hour = 12
        return f"Day {self.day} - {display_hour:02d}:{self.minute:02d} {period}"

    async def tick_time(self, broadcast_fn: Callable):
        """時間進行ループ (1秒ごとに呼び出される)"""
        if self.is_paused or self.time_speed <= 0:
            return

        delta_minutes = int(1 * self.time_speed)
        self.minute += delta_minutes

        while self.minute >= 60:
            self.minute -= 60
            self.hour += 1
            if self.hour >= 24:
                self.hour = 0
                self.day += 1

        time_str = f"{self.hour:02d}:{self.minute:02d}"
        await broadcast_fn({
            "type": "time_tick",
            "day": self.day,
            "time": time_str,
            "display": self.get_time_string(),
            "speed": self.time_speed,
            "is_paused": self.is_paused
        })

        await self._check_events(broadcast_fn)

        # 10日目終了判定
        if self.day > 10:
            self.is_paused = True
            await broadcast_fn({
                "type": "world_event",
                "title": "🎉 10日間の社会シミュレーション完結！",
                "description": "10日間の全日程が終了しました。これまでの会話ログと人間関係の変化をご覧ください。",
                "event_type": "finish",
                "time": self.get_time_string()
            })

    async def _check_events(self, broadcast_fn: Callable):
        """シナリオイベントチェック"""
        current_time_str = f"{self.hour:02d}:{self.minute:02d}"
        for idx, ev in enumerate(self.scenario_events):
            event_id = f"{ev.get('day')}_{ev.get('time')}_{idx}"
            if event_id in self.triggered_event_ids:
                continue

            if ev.get("day") == self.day and ev.get("time") <= current_time_str:
                self.triggered_event_ids.add(event_id)
                self.recent_village_news = f"【{ev.get('title')}】{ev.get('description')}"

                logger.info(f"シナリオイベント発火: {ev.get('title')}")

                for agent in self.agents.values():
                    agent.perceive(f"村の重要事件: {ev.get('title')} - {ev.get('description')}")

                await broadcast_fn({
                    "type": "world_event",
                    "title": ev.get("title"),
                    "description": ev.get("description"),
                    "event_type": ev.get("type"),
                    "time": self.get_time_string()
                })

                if not self.is_conversing:
                    # イベントに深く関わる住人同士を自動マッチング
                    speakers = self._select_event_participants(ev.get("type", ""))
                    asyncio.create_task(self.execute_conversation_flow(
                        broadcast_fn,
                        speaker_a_key=speakers[0],
                        speaker_b_key=speakers[1],
                        situation=f"村で『{ev.get('title')}』が発生した直後。2人はその話題で議論を始めた。"
                    ))
                break

    def _select_event_participants(self, event_type: str) -> List[str]:
        """イベント種別に応じた議論参加者ペアを選出"""
        if event_type == "crime":
            return ["alice", "eddie"]   # 被害者のアリスと自警団長エディ
        elif event_type == "rumor":
            return ["clara", "bob"]     # 噂を流すクララと疑われるボブ
        elif event_type == "crisis":
            return ["david", "eddie"]   # 短剣を盗まれた鍛冶屋と自警団長
        elif event_type == "politics":
            return ["eddie", "felix"]   # 権力志向のエディと反権力の詩人
        elif event_type == "investigation":
            return ["iris", "alice"]    # 推理するアイリスとアリス
        elif event_type == "election":
            return ["eddie", "alice"]   # 次期リーダー候補同士
        else:
            keys = list(self.agents.keys())
            return random.sample(keys, 2)

    async def inject_god_event(self, broadcast_fn: Callable, text: str):
        """神様介入"""
        logger.info(f"神様介入: {text}")
        self.recent_village_news = f"【神の介入・異変】{text}"

        for agent in self.agents.values():
            agent.perceive(f"天から轟く神の声・異変を感じた: 『{text}』")

        await broadcast_fn({
            "type": "god_event",
            "text": text,
            "time": self.get_time_string()
        })

        if not self.is_conversing:
            keys = list(self.agents.keys())
            pair = random.sample(keys, 2)
            asyncio.create_task(self.execute_conversation_flow(
                broadcast_fn,
                speaker_a_key=pair[0],
                speaker_b_key=pair[1],
                situation=f"天から『{text}』という異変が起きた！2人は広場で驚き、議論を始めた。"
            ))

    async def execute_conversation_flow(
        self,
        broadcast_fn: Callable,
        speaker_a_key: str = "alice",
        speaker_b_key: str = "bob",
        max_turns: int = 3,
        situation: Optional[str] = None
    ):
        """2人の自律対話フローを実行"""
        if self.is_conversing:
            return

        self.is_conversing = True
        current_key = speaker_a_key
        listener_key = speaker_b_key
        last_message: Optional[str] = None
        situation_text = situation or f"村の中央広場ですれ違いました。（村の状況: {self.recent_village_news}）"

        try:
            for turn in range(1, max_turns + 1):
                speaker = self.agents[current_key]
                listener = self.agents[listener_key]

                context = PerceptionContext(
                    location="村の広場・噴水前",
                    target_name=listener.profile.name,
                    incoming_message=last_message,
                    situation=situation_text
                )

                await broadcast_fn({
                    "type": "agent_thinking",
                    "speaker": current_key,
                    "speaker_name": speaker.profile.name
                })

                loop = asyncio.get_running_loop()
                decision = await loop.run_in_executor(None, speaker.react, context)

                payload = {
                    "type": "dialogue_step",
                    "turn": turn,
                    "speaker": current_key,
                    "speaker_name": speaker.profile.name,
                    "listener": listener_key,
                    "listener_name": listener.profile.name,
                    "thought": decision.inner_thought,
                    "dialogue": decision.dialogue or "（沈黙）",
                    "action": decision.action,
                    "location": "中央噴水広場"
                }
                await broadcast_fn(payload)

                last_message = decision.dialogue
                situation_text = f"{speaker.profile.name}が『{decision.dialogue}』と言い、{decision.action}。"

                current_key, listener_key = listener_key, current_key
                await asyncio.sleep(3.5)

            await broadcast_fn({
                "type": "dialogue_end",
                "summary": f"{self.agents[speaker_a_key].profile.name}と{self.agents[speaker_b_key].profile.name}の会話が一段落しました。"
            })

        except Exception as e:
            logger.error(f"会話フローエラー: {e}", exc_info=True)
            await broadcast_fn({
                "type": "error",
                "message": f"会話生成中エラー: {str(e)}"
            })
        finally:
            self.is_conversing = False
