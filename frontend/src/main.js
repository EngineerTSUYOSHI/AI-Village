import Phaser from 'phaser';
import { VillageScene } from './game/villageScene.js';
import { networkClient } from './game/network.js';

// 10人の住人のプロファイルデータ
const AGENT_DATA = {
  alice: {
    name: 'アリス',
    role: 'パン屋見習い',
    avatar: '👩‍🍳',
    color: '#f472b6',
    goal: '新作パンを焼き、村のみんなが笑顔で暮らせる平和を守りたい。',
    defaultThought: '良い天気だな〜。新しい小麦粉でみんなに喜ばれるパンを焼こう！'
  },
  bob: {
    name: 'ボブ',
    role: '森の薬草師',
    avatar: '🌿',
    color: '#34d399',
    goal: 'ハーブの良さを伝えたいが、濡れ衣を着せられるのを恐れている。',
    defaultThought: '森の薬草は静かで落ち着く。村の争いに巻き込まれなければいいが…'
  },
  eddie: {
    name: 'エディ',
    role: '自警団隊長',
    avatar: '⚔️',
    color: '#94a3b8',
    goal: '村の危機を排除して自警団の権限を強化し、村の真の指導者になりたい。',
    defaultThought: '村長は頼りにならん。規律と力でこの村を守り、秩序を正さねば。'
  },
  clara: {
    name: 'クララ',
    role: '旅の商人',
    avatar: '💰',
    color: '#a855f7',
    goal: '村の混乱に乗じて貴重な物資を高値で売りさばき、一儲けしたい。',
    defaultThought: '噂ひとつで相場が跳ね上がる。誰が犯人でも儲かればそれでいいのよ。'
  },
  gilbert: {
    name: 'ギルバート',
    role: '現村長',
    avatar: '👑',
    color: '#60a5fa',
    goal: '任期満了まで大きな揉め事を起こさず、平穏に村長を勤め上げたい。',
    defaultThought: '厄介な事件ばかりだ…どうか何事もなく穏便に収まってくれ。'
  },
  david: {
    name: 'デイビッド',
    role: '頑固な鍛冶屋',
    avatar: '🔨',
    color: '#f97316',
    goal: '自慢の鉄製品で村の防衛を固め、盗まれた短剣を取り戻したい。',
    defaultThought: '俺の打った短剣が悪党の手に渡ったとなれば鍛冶屋の恥だ！'
  },
  elena: {
    name: 'エレナ',
    role: '教会司祭',
    avatar: '🕊️',
    color: '#facc15',
    goal: '疑心暗鬼に陥った村人の心を癒やし、暴力による対立を食い止めたい。',
    defaultThought: '疑い合う心こそが災いの種。祈りと許しの心を思い出してほしい。'
  },
  felix: {
    name: 'フェリックス',
    role: '吟遊詩人',
    avatar: '🪕',
    color: '#ef4444',
    goal: '面白いスキャンダルを歌にして村中に広め、自警団の鼻を明かしたい。',
    defaultThought: '真実なんて退屈さ！人々が熱狂する物語こそが最高の歌になる。'
  },
  hana: {
    name: 'ハナ',
    role: '農家の娘',
    avatar: '🌾',
    color: '#22c55e',
    goal: '丹精込めて育てた作物を守り、食料危機や略奪から村の食卓を守りたい。',
    defaultThought: '畑の作物が荒らされたら大変。みんなが食べるご飯がなくなっちゃう。'
  },
  iris: {
    name: 'アイリス',
    role: '図書館司書・学者',
    avatar: '📖',
    color: '#818cf8',
    goal: '村で起きる不可解な事件の謎を科学的・論理的に解明し、真犯人を突き止めたい。',
    defaultThought: '感情論に流されては真実を見誤る。状況証拠を冷静に分析すべきだ。'
  }
};

let currentSelectedAgent = 'alice';
let logCount = 0;

// Phaser ゲーム設定
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [VillageScene]
};

const game = new Phaser.Game(config);

// DOM要素取得
const agentSelectorContainer = document.getElementById('agent-selector-container');
const agentAvatar = document.getElementById('agent-avatar-display');
const agentName = document.getElementById('agent-name');
const agentRole = document.getElementById('agent-role');
const agentGoal = document.getElementById('agent-goal');
const agentThought = document.getElementById('agent-thought');
const agentStateBadge = document.getElementById('agent-state-badge');
const activityFeed = document.getElementById('activity-feed');
const logCountBadge = document.getElementById('log-count');

const villageTimeDisplay = document.getElementById('village-time');
const toastContainer = document.getElementById('toast-container');

const btnTriggerDialogue = document.getElementById('btn-trigger-dialogue');
const btnFocusAlice = document.getElementById('btn-focus-alice');
const btnFocusBob = document.getElementById('btn-focus-bob');
const btnResetCam = document.getElementById('btn-reset-cam');

const serverStatusPill = document.querySelector('.status-pill');
const statusLabel = document.querySelector('.status-label');

const godForm = document.getElementById('god-form');
const godInput = document.getElementById('god-input');

const speedButtons = {
  pause: document.getElementById('btn-speed-pause'),
  s1: document.getElementById('btn-speed-1'),
  s5: document.getElementById('btn-speed-5'),
  s20: document.getElementById('btn-speed-20')
};

// 10人のセレクターチップを動的生成
function initAgentChips() {
  agentSelectorContainer.innerHTML = '';
  for (const [key, data] of Object.entries(AGENT_DATA)) {
    const chip = document.createElement('button');
    chip.className = `agent-chip ${key === currentSelectedAgent ? 'active' : ''}`;
    chip.dataset.agent = key;
    chip.innerHTML = `
      <span class="chip-avatar">${data.avatar}</span>
      <span>${data.name}</span>
    `;
    chip.addEventListener('click', () => selectAgent(key));
    agentSelectorContainer.appendChild(chip);
  }
}

// UI表示更新関数
function selectAgent(agentKey) {
  currentSelectedAgent = agentKey;
  const data = AGENT_DATA[agentKey];

  document.querySelectorAll('.agent-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.agent === agentKey);
  });

  agentAvatar.textContent = data.avatar;
  agentAvatar.style.borderColor = data.color;
  agentName.textContent = data.name;
  agentRole.textContent = data.role;
  agentGoal.textContent = data.goal;
  agentThought.textContent = `「${data.currentThought || data.defaultThought}」`;

  const scene = game.scene.getScene('VillageScene');
  if (scene) scene.focusAgent(agentKey);
}

// トースト通知を表示
function showToast(icon, title, message) {
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `
    <span style="font-size: 1.4rem;">${icon}</span>
    <div>
      <div style="font-weight: 700; color: #fbbf24;">${title}</div>
      <div style="font-size: 0.8rem; color: #e2e8f0; margin-top: 0.1rem;">${message}</div>
    </div>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 5000);
}

// タイムラインログ追加関数
function addLog(senderKey, text, detail, customClass = '') {
  logCount++;
  logCountBadge.textContent = `${logCount}件`;

  const item = document.createElement('div');
  item.className = `feed-item ${customClass}`;

  const timeStr = villageTimeDisplay.textContent.replace('☀️ ', '') || new Date().toLocaleTimeString();
  
  const senderData = AGENT_DATA[senderKey];
  let senderName = senderData ? senderData.name : '村の出来事';
  if (senderKey === 'god') senderName = '⚡ 神の介入';
  else if (senderKey === 'world') senderName = '📢 事件発生';

  item.innerHTML = `
    <div class="feed-meta">
      <span class="feed-sender ${senderKey}" style="color: ${senderData ? senderData.color : '#818cf8'}">${senderName}</span>
      <span class="feed-time">${timeStr}</span>
    </div>
    <div class="feed-content">${text}</div>
    ${detail ? `<div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 0.25rem;">${detail}</div>` : ''}
  `;

  activityFeed.prepend(item);

  while (activityFeed.children.length > 35) {
    activityFeed.removeChild(activityFeed.lastChild);
  }
}

// 初期化実行
initAgentChips();
selectAgent('alice');

addLog('system', '🏰 10人の住人による10日間社会シミュレーション開始。', '速度: 20倍速 (1日 約72秒)');

// WebSocket 接続開始
networkClient.connect();

networkClient.on('connection_change', ({ status }) => {
  if (status === 'connected') {
    statusLabel.textContent = '🧠 接続中 (Gemini 20x Active)';
    serverStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    serverStatusPill.style.color = '#34d399';
  } else {
    statusLabel.textContent = '⚠ 再接続試行中...';
    serverStatusPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    serverStatusPill.style.color = '#f87171';
  }
});

// 時間更新
networkClient.on('time_tick', (data) => {
  villageTimeDisplay.textContent = data.display;
});

// 速度変更
networkClient.on('speed_changed', (data) => {
  const { speed, is_paused } = data;
  Object.values(speedButtons).forEach(b => b.classList.remove('active'));

  if (is_paused) {
    speedButtons.pause.classList.add('active');
  } else if (speed === 1) {
    speedButtons.s1.classList.add('active');
  } else if (speed === 5) {
    speedButtons.s5.classList.add('active');
  } else if (speed === 20) {
    speedButtons.s20.classList.add('active');
  }
});

// シナリオイベント発生
networkClient.on('world_event', (data) => {
  showToast('📢', `事件発生: ${data.title}`, data.description);
  addLog('world', `【${data.title}】${data.description}`, `日時: ${data.time}`, 'world-event-feed');
});

// 神様介入発生
networkClient.on('god_event', (data) => {
  showToast('⚡', '神様の介入・天変地異', data.text);
  addLog('god', data.text, `全住人が神の異変を知覚しました (${data.time})`, 'god-event-feed');
});

// ゲームシーン準備完了時のフック
game.events.once('ready', () => {
  const scene = game.scene.getScene('VillageScene');

  scene.onAgentEvent = (type, payload) => {
    if (type === 'select_agent') {
      selectAgent(payload);
    } else if (type === 'agent_thinking') {
      const { speaker } = payload;
      if (currentSelectedAgent === speaker) {
        agentStateBadge.textContent = '思考中 (Gemini)...';
        agentStateBadge.className = 'badge-state';
        agentStateBadge.style.color = '#818cf8';
        agentStateBadge.style.borderColor = '#818cf8';
      }
    } else if (type === 'dialogue') {
      const { speaker, listener, thought, dialogue, action } = payload;
      if (AGENT_DATA[speaker]) {
        AGENT_DATA[speaker].currentThought = thought;
      }

      if (currentSelectedAgent === speaker) {
        agentThought.textContent = `「${thought}」`;
        agentStateBadge.textContent = '会話中';
        agentStateBadge.className = 'badge-state talking';
      }

      const lisName = AGENT_DATA[listener] ? AGENT_DATA[listener].name : '';
      addLog(speaker, `「${dialogue}」`, `🎬 ${action} ${lisName ? `(対 ${lisName})` : ''}`);
    } else if (type === 'dialogue_end') {
      agentStateBadge.textContent = '徘徊中';
      agentStateBadge.className = 'badge-state walking';
      agentStateBadge.style.color = '';
      agentStateBadge.style.borderColor = '';
    }
  };

  btnTriggerDialogue.addEventListener('click', () => {
    scene.forceTriggerRandomDialogue();
  });

  btnFocusAlice.addEventListener('click', () => selectAgent('alice'));
  btnFocusBob.addEventListener('click', () => selectAgent('bob'));
  btnResetCam.addEventListener('click', () => scene.resetCamera());

  godForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = godInput.value.trim();
    if (!text) return;
    networkClient.sendGodEvent(text);
    godInput.value = '';
    scene.forceTriggerRandomDialogue();
  });

  speedButtons.pause.addEventListener('click', () => networkClient.togglePause());
  speedButtons.s1.addEventListener('click', () => networkClient.setSpeed(1));
  speedButtons.s5.addEventListener('click', () => networkClient.setSpeed(5));
  speedButtons.s20.addEventListener('click', () => networkClient.setSpeed(20));
});
