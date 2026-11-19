"use strict";
// ============================================================================
// 東雲はつり 2.5頭身・三面図（正面 32×48 / 横 28×48 / 背面 32×48）
// パーツごとに3つの絵を持つ。ここは「設計」だけで、立体化は stack.js が絵から行う。
// 座標: x=左右(0..31) / y=前後(0=前, 27=後ろ) / z=高さ(0=足元, 47=耳の先)
// 参照: VRM レンダー3方向（正面・横・背面）
// ============================================================================
const W = 32, D = 28, H = 48, CX = 15.5, CY = 15.5;
const P = {
  H1:'#dcaef2', H2:'#b67fdc', H3:'#8d57bc',           // 髪（赤みのある薄紫）
  S1:'#ffe6d6', S2:'#f3b9a4', BL:'#ff9db2', MO:'#c9506e', // 肌・頬・口
  E1:'#58cfe0', E2:'#1f7f96', WH:'#ffffff',           // 瞳
  W1:'#ffffff', W2:'#d8d3e6', K1:'#3a3542', K2:'#1b1824', // 白・黒
  T:'#35c2b6',                                        // つばのティール
  J1:'#6f58ac', J2:'#58438e', J3:'#40306e',           // ジャケット胴（濃い紫）
  V1:'#f3ecfb', V2:'#cfc3e6',                         // 袖・フード（白ラベンダー）
  C1:'#7d5fc4', L1:'#c9a3e6',                         // カフス・インナーの裾
  B1:'#a57fd6', B2:'#7c58b4', RB:'#f8e1f1', PK:'#ffc9c0', // ブーツ・リボン・耳の内側
};
const parts = [];
const grid = w => Array.from({length:H}, () => Array(w).fill(null));
function part(name, n = 2) { const p = {name, n, front:grid(W), back:grid(W), side:grid(D)}; parts.push(p); return p; }
// 輪郭: 高さ z ごとに 正面の幅(cx±hw) と 横の奥行(cy±hd) を塗る
function prof(p, z0, z1, f) {
  for (let z = z0; z <= z1; z++) {
    const r = f(z), cx = r.cx ?? CX, cy = r.cy ?? CY;
    for (let x = Math.ceil(cx - r.hw); x <= Math.floor(cx + r.hw); x++) if (x >= 0 && x < W) p.front[z][x] = p.back[z][x] = r.c;
    for (let y = Math.ceil(cy - r.hd); y <= Math.floor(cy + r.hd); y++) if (y >= 0 && y < D) p.side[z][y] = r.c;
  }
}
// 描き込み: 輪郭の内側だけに色を置く
function px(g, a, z, c) { if (z >= 0 && z < H && a >= 0 && a < g[z].length && g[z][a] != null) g[z][a] = c; }
function box(g, a0, a1, z0, z1, c) { for (let z = z0; z <= z1; z++) for (let a = a0; a <= a1; a++) px(g, a, z, c); }
function sym(g, a, z, c) { px(g, a, z, c); px(g, W - 1 - a, z, c); }
function symbox(g, a0, a1, z0, z1, c) { for (let z = z0; z <= z1; z++) for (let a = a0; a <= a1; a++) sym(g, a, z, c); }
function mirror(p) { parts.push({name:p.name.replace('左','右'), n:p.n, depth:p.depth, front:p.front.map(r => r.slice().reverse()), back:p.back.map(r => r.slice().reverse()), side:p.side.map(r => r.slice())}); }

// ---- ツインテール（耳の後ろで低く結び、膝まで細く垂らす）----
{ const p = part('ツインテ左');
  prof(p, 6, 30, z => {
    const r = z >= 27 ? {cx: 5, hw: 1} : z >= 23 ? {cx: 4, hw: 1} : z >= 12 ? {cx: 3.5, hw: 2} : z >= 8 ? {cx: 4, hw: 1} : {cx: 4, hw: 0.5};
    return {...r, cy: CY + 2.5, hd: r.hw >= 2 ? 1.5 : r.hw >= 1 ? 1.5 : 0.5, c: z === 28 ? P.K1 : z <= 9 ? P.H3 : P.H2}; });
  for (const g of [p.front, p.back]) { box(g, 3, 3, 13, 21, P.H1); box(g, 5, 5, 10, 22, P.H3); }
  box(p.side, 0, 27, 16, 18, P.H1);
  mirror(p); }
// ---- 背中のリボン + 猫しっぽ（リボンのすぐ下から出て、下へ垂れて後ろへ流れる）----
{ const p = part('しっぽ');
  prof(p, 5, 12, z => { const t = (12 - z) / 7;
    return z <= 6 ? {cx: 17.5, hw: 1, cy: CY + 9.5, hd: 2, c: z === 5 ? P.H3 : P.H1}
                  : {cx: 15.5 + Math.round(t * 2), hw: 1, cy: CY + 6 + Math.round(t * 3), hd: 1, c: P.H2}; });
  const r = part('リボン', 4);
  prof(r, 13, 15, z => ({hw: z === 14 ? 1 : 3, cy: CY + 6, hd: 1, c: P.RB}));
  box(r.back, 15, 16, 13, 15, P.H1); }
// ---- フード（白ラベンダー）----
{ const p = part('フード');
  prof(p, 21, 26, z => ({hw: z >= 26 ? 5 : 6, cy: CY + 5, hd: z >= 26 || z <= 21 ? 2 : 3, c: z <= 21 ? P.V2 : P.V1})); }
// ---- 脚（黒スパッツ・素足・短いソックス）とブーツ（紫・黒いつま先・白い底）----
{ const p = part('脚左');
  prof(p, 5, 9, z => ({cx: 12, hw: 1, hd: 2, c: z >= 8 ? P.K1 : z === 5 ? P.V2 : P.S1}));
  mirror(p);
  const s = part('ブーツ左', 4);
  prof(s, 0, 4, z => z <= 1 ? {cx: 12, hw: 2, cy: CY - 1, hd: 4.5, c: z === 0 ? P.W1 : P.B2}
                    : z === 2 ? {cx: 12, hw: 2, cy: CY - 0.5, hd: 4, c: P.B1} : {cx: 12, hw: 2, cy: CY, hd: 2.5, c: z === 4 ? P.V1 : P.B1});
  box(s.front, 10, 14, 1, 1, P.K1); px(s.front, 12, 2, P.W1); px(s.front, 12, 3, P.W1);   // 黒いつま先・靴紐
  box(s.side, 10, 12, 1, 1, P.K1); box(s.side, 14, 15, 2, 3, P.W1); box(s.back, 10, 14, 1, 2, P.B2);
  mirror(s); }
// ---- ジャケット（濃い紫の胴・白い前立て・白リブ裾・両脇に猫顔ポケット）----
{ const p = part('ジャケット', 3);
  prof(p, 9, 24, z => ({hw: z <= 17 ? 7 : z <= 21 ? 6 : 5, hd: z <= 17 ? 6 : z <= 21 ? 5 : 4,
                        c: z === 9 ? P.W2 : z === 10 ? P.W1 : P.J1}));
  box(p.front, 13, 18, 24, 24, P.W1); box(p.front, 14, 17, 23, 23, P.W1); box(p.front, 15, 16, 22, 22, P.W1); // 襟元のV（白シャツ）
  box(p.front, 15, 16, 18, 21, P.J2);                                                   // 胸はジッパーで閉じる（細い線だけ）
  box(p.front, 15, 16, 16, 17, P.W1); box(p.front, 14, 17, 13, 15, P.W1);               // 胸の下から逆Vに開く
  box(p.front, 13, 18, 9, 12, P.L1); sym(p.front, 13, 12, P.W1); sym(p.front, 13, 11, P.W1); sym(p.front, 14, 12, P.W1); // 裾のインナー
  symbox(p.front, 11, 13, 23, 24, P.V1); symbox(p.front, 13, 13, 19, 22, P.J2);         // 襟（フードの縁）・前端の影
  symbox(p.front, 9, 11, 12, 14, P.J3); sym(p.front, 9, 13, P.W1); sym(p.front, 11, 13, P.W1); // 猫顔ポケット
  symbox(p.front, 9, 9, 15, 20, P.J2);
  box(p.side, 0, 27, 11, 11, P.J2); box(p.side, 10, 11, 12, 14, P.J3);
  box(p.back, 15, 16, 16, 23, P.J2); box(p.back, 0, 31, 11, 11, P.J2); box(p.back, 11, 20, 23, 24, P.V1); }
// ---- 首 ----
{ const p = part('首'); prof(p, 25, 25, () => ({hw: 2, hd: 2, c: P.K1})); }
// ---- 腕（白ラベンダーの袖・紫カフス・黒手袋）肩から少し開いて下ろす ----
{ const p = part('腕左');
  prof(p, 10, 24, z => ({...(z >= 24 ? {cx: 9.5, hw: 1} : z >= 21 ? {cx: 9, hw: 1} : z >= 16 ? {cx: 8, hw: 1} : {cx: 7, hw: 1}), hd: 2,
                         c: z <= 11 ? P.K1 : z <= 13 ? P.C1 : P.V1}));
  for (const g of [p.front, p.back]) { box(g, 6, 6, 14, 15, P.V2); box(g, 7, 7, 16, 20, P.V2); box(g, 8, 8, 21, 23, P.V2); }
  mirror(p); }
// ---- 首掛けヘッドホン（首の後ろの帯＋肩に乗るカップ）----
{ const b = part('ヘッドホン帯'); prof(b, 24, 25, () => ({hw: 5, cy: CY + 4, hd: 2, c: P.W2}));
  const c = part('ヘッドホン左');
  prof(c, 23, 27, z => ({cx: 9, hw: 1, hd: z === 23 || z === 27 ? 2 : 3, c: P.W1}));
  box(c.side, CY - 0.5, CY + 1.5, 24, 26, P.V2); px(c.side, CY + 0.5, 25, P.K1);
  mirror(c); }
// ---- 頭（顔・前髪・横髪・後ろ髪）----
{ const p = part('頭'); p.depth = 16;
  const k = z => Math.pow(Math.max(0, 1 - Math.pow(Math.abs((z - 35) / 9.6), 2.4)), 1 / 2.4);
  prof(p, 26, 44, z => ({hw: Math.max(4, Math.round(10 * k(z))), hd: Math.max(4, Math.round(9 * k(z))), c: z <= 27 ? P.H3 : P.H2}));
  const bz = [33, 35, 37, 37, 36, 37, 36, 34];           // 前髪の下端（x=8..15、左右対称）。中央に房
  for (let z = 26; z <= 37; z++) for (let x = 0; x < W; x++) {
    const i = x <= 15 ? x - 8 : 23 - x;
    if ((z <= 27) || (z <= 29 && i >= 1) || (i >= 0 && z < bz[i])) px(p.front, x, z, z > 29 && z === bz[i] - 1 ? P.S2 : P.S1);
  }
  box(p.front, 0, 31, 38, 38, P.H3);                                                   // キャップの影
  // 目（3×4）・頬・口
  [[P.K2, P.K2, P.K2], [P.E2, P.E2, P.WH], [P.E2, P.E1, P.E1], [P.E1, P.E1, P.E1]].forEach((row, r) => row.forEach((c, i) => sym(p.front, 10 + i, 33 - r, c)));
  sym(p.front, 9, 29, P.BL); sym(p.front, 10, 29, P.BL); box(p.front, 15, 16, 28, 28, P.MO);
  // 横: 顔は前側だけ、目を1つ、横髪を残す
  for (let z = 26; z <= 36; z++) for (let y = 0; y <= (z <= 29 ? 12 : 10); y++) px(p.side, y, z, P.S1);
  box(p.side, 7, 8, 33, 33, P.K2); box(p.side, 7, 8, 30, 32, P.E2); box(p.side, 8, 8, 30, 31, P.E1);   // 目は顔の最前面だけ（側面に回り込ませない）
  box(p.side, 11, 12, 28, 36, P.H2); box(p.side, 13, 20, 36, 37, P.H1);
  box(p.back, 9, 13, 36, 36, P.H1); box(p.back, 18, 22, 36, 36, P.H1); }
// ---- 前髪（顔より1px前に出る。隙間は絵の穴として抜く）と横髪（頬の横に張り出す房）----
{ const p = part('前髪'); p.depth = 9;
  prof(p, 33, 38, () => ({hw: 9, cy: 10, hd: 4, c: P.H2}));
  const bz = [33, 35, 37, 37, 36, 37, 36, 34];
  for (let z = 33; z <= 38; z++) for (let x = 7; x <= 24; x++) {
    const i = x <= 15 ? x - 8 : 23 - x;
    if (i >= 0 && z < bz[i]) p.front[z][x] = null; else if (z === 38) p.front[z][x] = P.H3;
  }
  for (let z = 33; z <= 38; z++) for (let x = 0; x < W; x++) p.back[z][x] = p.front[z][x];
  const s = part('横髪左'); s.depth = 10;
  prof(s, 28, 37, z => ({cx: 6.5, hw: 1.5, cy: CY - 2.5, hd: 2.5, c: z <= 29 ? P.H3 : P.H2}));   // 横顔を隠さない奥行にする
  box(s.front, 6, 6, 30, 36, P.H1);
  mirror(s); }
// ---- キャップ（頭の上に浅く乗る。前パネルが白、ほかは黒。前が立ち、後ろへなだらか）----
{ const hw = [10, 10, 10, 10, 9, 9, 7, 5];                         // z=39..46 の半幅
  const ys = [[6, 25], [6, 25], [6, 25], [6, 24], [7, 23], [7, 22], [8, 20], [10, 17]];   // 横の前端・後端
  const p = part('キャップ'); p.depth = 16;
  prof(p, 39, 46, z => { const [a, b] = ys[z - 39]; return {hw: hw[z - 39], cy: (a + b) / 2, hd: (b - a + 1) / 2 - 0.01, c: P.K1}; });
  box(p.front, 8, 23, 40, 45, P.W1); box(p.front, 9, 22, 46, 46, P.W1);               // 白い前パネル
  box(p.front, 18, 19, 42, 43, P.L1); px(p.front, 20, 42, P.L1);                        // 花のマーク
  for (let z = 40; z <= 46; z++) for (let y = 0; y <= 12; y++) px(p.side, y, z, P.W1);
  box(p.back, 0, 31, 39, 39, P.K2); box(p.back, 14, 17, 39, 41, P.H2); box(p.back, 13, 18, 41, 41, P.K2); // 後ろの穴とベルト
  const b = part('つば');                                           // 前へ長く、平たく
  prof(b, 38, 39, z => ({hw: 9, cy: 5, hd: 4, c: z === 38 ? P.K2 : P.K1}));
}
// ---- 猫耳（キャップの脇から出る）----
{ const p = part('猫耳左'); p.depth = 16;
  prof(p, 43, 47, z => z <= 45 ? {cx: 8.5, hw: 2, hd: 2, c: P.H2} : z === 46 ? {cx: 8.5, hw: 1, hd: 1, c: P.H2} : {cx: 8, hw: 0.5, hd: 1, c: P.H3});
  box(p.front, 8, 9, 44, 45, P.PK);
  mirror(p); }
// ---- 姿勢の調整: 頭まわりを後ろへ寄せて、顔が体より前に出すぎないようにする ----
const HEAD_BACK = 2;
for (const p of parts) if (/^(頭|前髪|横髪|キャップ|つば|猫耳|ツインテ)/.test(p.name))
  p.side = p.side.map(r => Array(HEAD_BACK).fill(null).concat(r.slice(0, D - HEAD_BACK)));
