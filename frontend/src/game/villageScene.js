import Phaser from 'phaser';
import { generateGameTextures } from './textures.js';
import { AgentSprite } from './agentSprite.js';
import { networkClient } from './network.js';

export class VillageScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VillageScene' });
    this.agents = {};
    this.isConversationActive = false;
    this.conversationCooldown = false;
    this.onAgentEvent = null;
  }

  create() {
    generateGameTextures(this);
    this.createWorldMap();
    this.create10Agents();
    this.setupNetworkEvents();

    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.centerOn(400, 300);

    // クリック判定でエージェント選択
    this.input.on('pointerdown', (pointer) => {
      for (const [key, agent] of Object.entries(this.agents)) {
        const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, agent.x, agent.y);
        if (dist < 30) {
          if (this.onAgentEvent) this.onAgentEvent('select_agent', key);
          break;
        }
      }
    });
  }

  createWorldMap() {
    // 草原
    for (let x = 0; x < 800; x += 32) {
      for (let y = 0; y < 600; y += 32) {
        this.add.image(x, y, 'tile_grass').setOrigin(0, 0);
      }
    }

    // 中央広場 (石畳)
    for (let x = 256; x <= 544; x += 32) {
      for (let y = 160; y <= 448; y += 32) {
        this.add.image(x, y, 'tile_path').setOrigin(0, 0);
      }
    }

    // 十字のメイン小道
    for (let x = 0; x < 800; x += 32) {
      this.add.image(x, 288, 'tile_path').setOrigin(0, 0);
    }
    for (let y = 0; y < 600; y += 32) {
      this.add.image(384, y, 'tile_path').setOrigin(0, 0);
    }

    // 噴水 (中央 400, 300)
    for (let fx = 368; fx <= 400; fx += 32) {
      for (let fy = 272; fy <= 304; fy += 32) {
        this.add.image(fx, fy, 'tile_water').setOrigin(0, 0);
      }
    }

    // 建物配置
    this.add.image(120, 140, 'bldg_bakery').setOrigin(0.5, 0.5);      // パン屋
    this.add.image(680, 140, 'bldg_herbalist').setOrigin(0.5, 0.5);   // 薬草小屋
    this.add.image(120, 480, 'bldg_forge').setOrigin(0.5, 0.5);       // 鍛冶屋
    this.add.image(680, 480, 'bldg_hall').setOrigin(0.5, 0.5);        // 教会/役場

    // 木々
    const treePositions = [
      { x: 50, y: 60 }, { x: 230, y: 70 }, { x: 570, y: 70 }, { x: 750, y: 60 },
      { x: 40, y: 310 }, { x: 760, y: 310 },
      { x: 230, y: 520 }, { x: 570, y: 520 }
    ];
    treePositions.forEach(pos => {
      this.add.image(pos.x, pos.y, 'obj_tree').setOrigin(0.5, 0.8);
    });

    this.add.text(400, 240, '中央噴水広場', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '11px',
      color: '#475569'
    }).setOrigin(0.5, 0.5);
  }

  create10Agents() {
    const configList = [
      { key: 'alice', name: 'アリス', color: '#f472b6', x: 180, y: 220, tex: 'char_alice' },
      { key: 'bob', name: 'ボブ', color: '#34d399', x: 620, y: 220, tex: 'char_bob' },
      { key: 'eddie', name: 'エディ', color: '#94a3b8', x: 280, y: 350, tex: 'char_eddie' },
      { key: 'clara', name: 'クララ', color: '#a855f7', x: 520, y: 350, tex: 'char_clara' },
      { key: 'gilbert', name: 'ギルバート', color: '#60a5fa', x: 400, y: 160, tex: 'char_gilbert' },
      { key: 'david', name: 'デイビッド', color: '#f97316', x: 180, y: 450, tex: 'char_david' },
      { key: 'elena', name: 'エレナ', color: '#facc15', x: 620, y: 450, tex: 'char_elena' },
      { key: 'felix', name: 'フェリックス', color: '#ef4444', x: 330, y: 280, tex: 'char_felix' },
      { key: 'hana', name: 'ハナ', color: '#22c55e', x: 400, y: 460, tex: 'char_hana' },
      { key: 'iris', name: 'アイリス', color: '#818cf8', x: 470, y: 220, tex: 'char_iris' }
    ];

    configList.forEach(cfg => {
      const agent = new AgentSprite(this, cfg.x, cfg.y, cfg.tex, cfg.name, cfg.color);
      this.agents[cfg.key] = agent;

      // 徘徊ルート設定
      this.scheduleWandering(agent, [
        { x: cfg.x, y: cfg.y },
        { x: 400, y: 340 },
        { x: 340, y: 260 },
        { x: 460, y: 260 },
        { x: 290, y: 380 },
        { x: 510, y: 380 }
      ]);
    });
  }

  scheduleWandering(agent, waypoints) {
    const step = () => {
      if (this.isConversationActive) return;
      const pt = Phaser.Utils.Array.GetRandom(waypoints);
      agent.moveTo(pt.x, pt.y, () => {
        this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
          if (!this.isConversationActive) step();
        });
      });
    };
    this.time.delayedCall(Phaser.Math.Between(500, 3000), step);
  }

  setupNetworkEvents() {
    networkClient.on('agent_thinking', (data) => {
      const ag = this.agents[data.speaker];
      if (ag) ag.showEmotion('💭', 2000);
      if (this.onAgentEvent) this.onAgentEvent('agent_thinking', data);
    });

    networkClient.on('dialogue_step', (data) => {
      this.isConversationActive = true;
      this.conversationCooldown = true;

      const spk = this.agents[data.speaker];
      const lis = this.agents[data.listener];

      if (spk && lis) {
        this.tweens.killTweensOf(spk);
        this.tweens.killTweensOf(lis);
        spk.sprite.setFlipX(lis.x < spk.x);
        lis.sprite.setFlipX(spk.x < lis.x);
        spk.say(data.dialogue, 3500);
      } else if (spk) {
        spk.say(data.dialogue, 3500);
      }

      if (this.onAgentEvent) this.onAgentEvent('dialogue', data);
    });

    networkClient.on('dialogue_end', (data) => {
      Object.values(this.agents).forEach(ag => {
        if (ag.state === 'TALKING') {
          ag.showEmotion('✨', 1200);
          ag.state = 'IDLE';
        }
      });

      this.time.delayedCall(2000, () => {
        this.isConversationActive = false;
        this.time.delayedCall(8000, () => {
          this.conversationCooldown = false;
        });
        if (this.onAgentEvent) this.onAgentEvent('dialogue_end', data);
      });
    });
  }

  update() {
    // 誰かと誰かが近づいたら会話をトリガー
    if (!this.isConversationActive && !this.conversationCooldown) {
      const keys = Object.keys(this.agents);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = this.agents[keys[i]];
          const b = this.agents[keys[j]];
          const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
          if (dist < 65) {
            this.triggerPairConversation(keys[i], keys[j]);
            return;
          }
        }
      }
    }
  }

  triggerPairConversation(keyA, keyB) {
    if (this.isConversationActive) return;
    this.isConversationActive = true;
    this.conversationCooldown = true;

    const agA = this.agents[keyA];
    const agB = this.agents[keyB];
    if (agA) agA.showEmotion('❗', 1200);
    if (agB) agB.showEmotion('❓', 1200);

    networkClient.send({
      type: 'trigger_conversation',
      speaker_a: keyA,
      speaker_b: keyB
    });
  }

  forceTriggerRandomDialogue() {
    if (this.isConversationActive) return;
    const keys = Object.keys(this.agents);
    const pair = Phaser.Utils.Array.Shuffle(keys).slice(0, 2);
    const agA = this.agents[pair[0]];
    const agB = this.agents[pair[1]];

    agA.moveTo(370, 340);
    agB.moveTo(430, 340);

    this.time.delayedCall(2000, () => {
      this.triggerPairConversation(pair[0], pair[1]);
    });
  }

  focusAgent(agentKey) {
    const target = this.agents[agentKey];
    if (target) {
      this.cameras.main.pan(target.x, target.y, 800, 'Power2');
      this.cameras.main.zoomTo(1.3, 800);
    }
  }

  resetCamera() {
    this.cameras.main.pan(400, 300, 800, 'Power2');
    this.cameras.main.zoomTo(1.0, 800);
  }
}
