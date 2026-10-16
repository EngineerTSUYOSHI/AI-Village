/**
 * 10人のドット絵キャラクタースプライト & ワールドテクスチャ生成
 */

export function generateGameTextures(scene) {
  // 1. 草原タイル (32x32)
  if (!scene.textures.exists('tile_grass')) {
    const canvas = scene.textures.createCanvas('tile_grass', 32, 32);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#38a169';
    for (let i = 0; i < 8; i++) {
      const rx = (i * 7 + 3) % 28;
      const ry = (i * 11 + 5) % 28;
      ctx.fillRect(rx, ry, 2, 4);
    }
    ctx.fillStyle = '#2f855a';
    ctx.fillRect(8, 12, 2, 3);
    ctx.fillRect(20, 22, 2, 3);
    canvas.refresh();
  }

  // 2. 石畳・小道タイル (32x32)
  if (!scene.textures.exists('tile_path')) {
    const canvas = scene.textures.createCanvas('tile_path', 32, 32);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 15, 32, 2);
    ctx.fillRect(15, 0, 2, 16);
    ctx.fillRect(24, 16, 2, 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(18, 18, 2, 2);
    canvas.refresh();
  }

  // 3. 水面・噴水タイル (32x32)
  if (!scene.textures.exists('tile_water')) {
    const canvas = scene.textures.createCanvas('tile_water', 32, 32);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(8, 8, 8, 4);
    ctx.fillRect(16, 18, 6, 3);
    canvas.refresh();
  }

  // 4. 木のオブジェクト (64x64)
  if (!scene.textures.exists('obj_tree')) {
    const canvas = scene.textures.createCanvas('obj_tree', 64, 64);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(26, 38, 12, 24);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(32, 28, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(30, 24, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(26, 18, 8, 0, Math.PI * 2);
    ctx.fill();
    canvas.refresh();
  }

  // 5. 建物：パン屋
  if (!scene.textures.exists('bldg_bakery')) {
    const canvas = scene.textures.createCanvas('bldg_bakery', 96, 80);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(8, 24, 80, 56);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(48, 4);
    ctx.lineTo(94, 28);
    ctx.lineTo(2, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(38, 50, 20, 30);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(16, 40, 16, 16);
    ctx.fillRect(64, 40, 16, 16);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(36, 32, 24, 10);
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('BAKERY', 38, 40);
    canvas.refresh();
  }

  // 6. 建物：薬草小屋
  if (!scene.textures.exists('bldg_herbalist')) {
    const canvas = scene.textures.createCanvas('bldg_herbalist', 96, 80);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(8, 24, 80, 56);
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(48, 4);
    ctx.lineTo(94, 28);
    ctx.lineTo(2, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#065f46';
    ctx.fillRect(38, 50, 20, 30);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(16, 40, 16, 16);
    ctx.fillRect(64, 40, 16, 16);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(36, 32, 24, 10);
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('HERBS', 40, 40);
    canvas.refresh();
  }

  // 7. 建物：鍛冶屋工房
  if (!scene.textures.exists('bldg_forge')) {
    const canvas = scene.textures.createCanvas('bldg_forge', 96, 80);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(8, 24, 80, 56);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(48, 4);
    ctx.lineTo(94, 28);
    ctx.lineTo(2, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(38, 50, 20, 30);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(16, 40, 16, 16);
    ctx.fillRect(64, 40, 16, 16);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(36, 32, 24, 10);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('FORGE', 40, 40);
    canvas.refresh();
  }

  // 8. 建物：村役場 / 教会
  if (!scene.textures.exists('bldg_hall')) {
    const canvas = scene.textures.createCanvas('bldg_hall', 110, 90);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(10, 30, 90, 60);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(55, 6);
    ctx.lineTo(105, 34);
    ctx.lineTo(5, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(45, 54, 20, 36);
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(20, 46, 16, 20);
    ctx.fillRect(74, 46, 16, 20);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('HALL', 44, 46);
    canvas.refresh();
  }

  // 10人のドット絵キャラスプライト生成ヘルパー
  const createCharTexture = (key, hairColor, skinColor, eyeColor, clothColor, detailColor) => {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 24, 32);
    const ctx = canvas.getContext();

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(12, 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = hairColor;
    ctx.fillRect(6, 4, 12, 9);
    ctx.fillRect(4, 7, 16, 8);

    // 肌
    ctx.fillStyle = skinColor;
    ctx.fillRect(7, 8, 10, 8);

    // 目
    ctx.fillStyle = eyeColor;
    ctx.fillRect(9, 10, 2, 3);
    ctx.fillRect(13, 10, 2, 3);

    // 服
    ctx.fillStyle = clothColor;
    ctx.fillRect(6, 16, 12, 10);

    // ディテール（エプロン、鎧、サッシュなど）
    if (detailColor) {
      ctx.fillStyle = detailColor;
      ctx.fillRect(8, 18, 8, 6);
    }

    // 足
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(7, 26, 3, 4);
    ctx.fillRect(14, 26, 3, 4);

    canvas.refresh();
  };

  // 10人のドット絵登録
  createCharTexture('char_alice', '#facc15', '#ffedd5', '#0284c7', '#f472b6', '#ffffff'); // アリス: 金髪/ピンク
  createCharTexture('char_bob', '#78350f', '#fed7aa', '#059669', '#059669', '#d97706');   // ボブ: 茶髪/緑
  createCharTexture('char_eddie', '#1e293b', '#fed7aa', '#dc2626', '#475569', '#94a3b8'); // エディ: 黒髪/銀鎧
  createCharTexture('char_clara', '#a855f7', '#ffedd5', '#d97706', '#7e22ce', '#fbbf24'); // クララ: 紫髪/豪商
  createCharTexture('char_gilbert', '#e2e8f0', '#ffedd5', '#475569', '#1d4ed8', '#fbbf24'); // ギルバート: 白髪/青衣
  createCharTexture('char_david', '#b45309', '#fed7aa', '#b91c1c', '#b45309', '#475569'); // デイビッド: 赤茶/鍛冶
  createCharTexture('char_elena', '#fef08a', '#ffedd5', '#0284c7', '#f8fafc', '#fbbf24'); // エレナ: 聖職者白衣
  createCharTexture('char_felix', '#ef4444', '#fed7aa', '#10b981', '#dc2626', '#10b981'); // フェリックス: 詩人
  createCharTexture('char_hana', '#ca8a04', '#fed7aa', '#047857', '#3b82f6', '#fde047');   // ハナ: 農家オーバーオール
  createCharTexture('char_iris', '#334155', '#ffedd5', '#6366f1', '#4338ca', '#a5b4fc');   // アイリス: 学者眼鏡紺色
}
