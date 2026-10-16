import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.world import WorldEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ワールドエンジンの初期化
world = WorldEngine()


class ConnectionManager:
    """接続中の WebSocket クライアントを管理するクラス"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket クライアント接続: 現在 {len(self.active_connections)} 台")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket クライアント切断: 残り {len(self.active_connections)} 台")

    async def broadcast(self, message: dict):
        """全接続クライアントにメッセージを JSON でブロードキャスト"""
        json_str = json.dumps(message, ensure_ascii=False)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json_str)
            except Exception as e:
                logger.warning(f"送信失敗、クライアントを除去します: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


async def background_tick_loop():
    """1秒ごとに世界の時間を進めてブロードキャストするループタスク"""
    logger.info("時間進行バックグラウンドループを開始しました")
    while True:
        try:
            await world.tick_time(manager.broadcast)
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"tick_loop エラー: {e}")
            await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI の起動・終了ライフサイクル管理"""
    tick_task = asyncio.create_task(background_tick_loop())
    yield
    tick_task.cancel()
    try:
        await tick_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="AI Village Simulation Server", version="0.2.0", lifespan=lifespan)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
async def get_status():
    """サーバーおよびエージェントの状態を返す"""
    return {
        "status": "online",
        "day": world.day,
        "time": world.get_time_string(),
        "time_speed": world.time_speed,
        "is_paused": world.is_paused,
        "is_conversing": world.is_conversing,
        "agents": {
            key: {
                "name": agent.profile.name,
                "role": agent.profile.role,
                "goal": agent.profile.goal,
                "memory_count": len(agent.memories),
            }
            for key, agent in world.agents.items()
        },
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """リアルタイム双方向通信エンドポイント"""
    await manager.connect(websocket)

    # 初回接続時のシステム状態通知
    await websocket.send_text(json.dumps({
        "type": "connected",
        "message": "🧠 FastAPI 自律思考サーバーに接続しました",
        "day": world.day,
        "time_display": world.get_time_string(),
        "speed": world.time_speed,
        "is_paused": world.is_paused,
        "is_conversing": world.is_conversing
    }, ensure_ascii=False))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == "trigger_conversation":
                    logger.info("クライアントから会話トリガーリクエストを受信")
                    if not world.is_conversing:
                        spk_a = msg.get("speaker_a", "alice")
                        spk_b = msg.get("speaker_b", "bob")
                        asyncio.create_task(world.execute_conversation_flow(
                            manager.broadcast,
                            speaker_a_key=spk_a,
                            speaker_b_key=spk_b
                        ))
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "info",
                            "message": "既に別の会話が進行中です"
                        }, ensure_ascii=False))

                elif msg_type == "god_event":
                    # 神様介入イベント
                    text = msg.get("text", "").strip()
                    if text:
                        asyncio.create_task(world.inject_god_event(manager.broadcast, text))

                elif msg_type == "set_speed":
                    # 速度変更
                    new_speed = float(msg.get("speed", 1.0))
                    world.time_speed = new_speed
                    world.is_paused = False
                    logger.info(f"シミュレーション速度変更: {new_speed}x")
                    await manager.broadcast({
                        "type": "speed_changed",
                        "speed": world.time_speed,
                        "is_paused": world.is_paused
                    })

                elif msg_type == "toggle_pause":
                    # 一時停止切り替え
                    world.is_paused = not world.is_paused
                    logger.info(f"一時停止トグル: paused={world.is_paused}")
                    await manager.broadcast({
                        "type": "speed_changed",
                        "speed": world.time_speed,
                        "is_paused": world.is_paused
                    })

            except json.JSONDecodeError:
                logger.warning(f"不正なJSONを受信: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket エラー: {e}", exc_info=True)
        manager.disconnect(websocket)
