import Phaser from 'phaser';

export class AgentSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, key, name, colorHex) {
    super(scene, x, y);

    this.agentName = name;
    this.colorHex = colorHex;
    this.state = 'IDLE'; // IDLE, WALKING, TALKING
    this.targetX = x;
    this.targetY = y;
    this.walkSpeed = 50; // px/sec

    // 1. キャラクタースプライト本体
    this.sprite = scene.add.sprite(0, 0, key);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);

    // 2. 頭上ネームタグ
    this.nameTag = scene.add.text(0, -24, name, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0.5);
    this.add(this.nameTag);

    // 3. エモーション表示用（！や💭）
    this.emotionText = scene.add.text(0, -42, '', {
      fontSize: '16px'
    }).setOrigin(0.5, 0.5);
    this.emotionText.setAlpha(0);
    this.add(this.emotionText);

    // 4. 吹き出し（Speech Bubble Container）
    this.bubbleContainer = scene.add.container(0, -56);
    this.bubbleContainer.setAlpha(0);
    this.bubbleContainer.setVisible(false);

    this.bubbleBg = scene.add.graphics();
    this.bubbleText = scene.add.text(0, 0, '', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '12px',
      color: '#0f172a',
      wordWrap: { width: 140 },
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.bubbleContainer.add([this.bubbleBg, this.bubbleText]);
    this.add(this.bubbleContainer);

    scene.add.existing(this);

    // 歩行のボビング（上下揺れ）アニメーショントゥイーン
    this.bobTween = scene.tweens.add({
      targets: this.sprite,
      y: -2,
      duration: 250,
      yoyo: true,
      repeat: -1,
      paused: true
    });
  }

  moveTo(targetX, targetY, onComplete) {
    this.state = 'WALKING';
    this.bobTween.resume();

    // 左右の向きを反転
    if (targetX < this.x) {
      this.sprite.setFlipX(true);
    } else if (targetX > this.x) {
      this.sprite.setFlipX(false);
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const duration = (distance / this.walkSpeed) * 1000;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        this.state = 'IDLE';
        this.bobTween.pause();
        this.sprite.y = 0;
        if (onComplete) onComplete();
      }
    });
  }

  say(message, duration = 4000) {
    this.state = 'TALKING';
    this.bubbleText.setText(message);

    const padding = 10;
    const bounds = this.bubbleText.getBounds();
    const w = Math.max(bounds.width + padding * 2, 80);
    const h = bounds.height + padding * 2;

    this.bubbleBg.clear();
    // 吹き出し背景（白ベース）
    this.bubbleBg.fillStyle(0xffffff, 0.95);
    this.bubbleBg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    // 吹き出し枠線
    this.bubbleBg.lineStyle(2, 0x0f172a, 0.9);
    this.bubbleBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    // 吹き出しのしっぽ（三角）
    this.bubbleBg.fillStyle(0xffffff, 0.95);
    this.bubbleBg.fillTriangle(-4, h / 2, 4, h / 2, 0, h / 2 + 6);
    this.bubbleBg.lineStyle(2, 0x0f172a, 0.9);
    this.bubbleBg.lineBetween(-4, h / 2, 0, h / 2 + 6);
    this.bubbleBg.lineBetween(0, h / 2 + 6, 4, h / 2);

    this.bubbleContainer.setVisible(true);
    this.bubbleContainer.setAlpha(0);
    this.bubbleContainer.setScale(0.7);

    // ポップアップアニメーション
    this.scene.tweens.add({
      targets: this.bubbleContainer,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // 指定時間後にフェードアウト
    if (this.bubbleTimer) this.bubbleTimer.remove();
    this.bubbleTimer = this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: this.bubbleContainer,
        alpha: 0,
        scale: 0.8,
        duration: 200,
        onComplete: () => {
          this.bubbleContainer.setVisible(false);
          if (this.state === 'TALKING') this.state = 'IDLE';
        }
      });
    });
  }

  showEmotion(emoji, duration = 1500) {
    this.emotionText.setText(emoji);
    this.emotionText.setAlpha(1);
    this.emotionText.y = -36;

    this.scene.tweens.add({
      targets: this.emotionText,
      y: -44,
      duration: 250,
      yoyo: true,
      repeat: 1
    });

    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: this.emotionText,
        alpha: 0,
        duration: 200
      });
    });
  }
}
