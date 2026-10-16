/**
 * FastAPI WebSocket クライアント管理
 */
export class NetworkClient {
  constructor(url = 'ws://localhost:8001/ws') {
    this.url = url;
    this.ws = null;
    this.listeners = {};
    this.isConnected = false;
    this.shouldReconnect = true;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (err) {
          console.error('WebSocket メッセージパースエラー:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', { status: 'disconnected' });
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket 接続待機中またはエラー:', err);
        this.ws.close();
      };
    } catch (e) {
      console.warn('WebSocket 接続試行失敗:', e);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), 3000);
      }
    }
  }

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  emit(type, payload) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(cb => cb(payload));
    }
  }

  send(data) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  triggerConversation() {
    this.send({ type: 'trigger_conversation' });
  }

  sendGodEvent(text) {
    this.send({ type: 'god_event', text });
  }

  setSpeed(speed) {
    this.send({ type: 'set_speed', speed });
  }

  togglePause() {
    this.send({ type: 'toggle_pause' });
  }
}

export const networkClient = new NetworkClient();
