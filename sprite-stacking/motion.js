"use strict";
// 歩き・走りのポーズ。stack.js が作った立体（静止）を、パーツごとに「高さ1行ずつ前後へずらす」だけで動かす。
// 回転させずに行単位でずらすので、スライスに穴が開かない。設計（design.js）には触らない。
// 向き: 前 = -y。左足が前のとき右腕が前。足が交差する瞬間に体が1px沈む。
// 歩きは跳ねない。走りは足を開いた瞬間に体ごと跳ね、毛先としっぽが遅れて跳ねる（ピョンピョン）。
const MOTION_FRAMES = 8;
// stride: 歩幅(足先px) / lift: 足の上げ / hop: 跳ねる高さ(0=跳ねない) / arm: 腕の振り / lean: 前傾 / tw: ツインテの [なびき, 揺れ幅, 毛先の上がり]
const MOTIONS = {
  walk: {label: '歩く', stride: 5, lift: 3, hop: 0, arm: 4, lean: 2, tw: [3, 1.2, 2.5]},
  run:  {label: '走る', stride: 7, lift: 4, hop: 3, arm: 5, lean: 2, tw: [2.5, 1.5, 2]},
};
function restVoxels() {                                           // [x, y, z, 色, パーツ名] を下から順に
  const owner = Array.from({length:H}, () => Array.from({length:D}, () => Array(W).fill(null)));
  const vox = buildVox(owner), out = [];
  for (let z = 0; z < H; z++) for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) if (vox[z][y][x]) out.push([x, y, z, vox[z][y][x], owner[z][y][x]]);
  return out;
}
const HIP = 10, SHOULDER = 24, TW_ROOT = 30, TAIL_ROOT = 12;
function pose(rest, M, f) {                                    // M: MOTIONS の1つ
  const ph = 2 * Math.PI * f / MOTION_FRAMES, s = Math.sin(ph), c = Math.cos(ph), R = Math.round;
  const hopAt = p => R(M.hop * Math.abs(Math.sin(p)));         // 足を開いた瞬間がいちばん高い
  const up = hopAt(ph), upLate = hopAt(ph - 0.8);                 // 毛先としっぽは少し遅れて跳ねる
  const dip = Math.abs(s) < 0.5 ? -1 : 0;                         // 着地で体が1px沈む
  const lean = z => -R(Math.max(0, z - HIP) * M.lean / 37);    // 前傾
  const seen = new Set(), out = [];
  for (const [x, y, z, col, name] of rest) {
    let nx = x, ny = y, nz = z;
    const side = name.endsWith('左') ? 1 : -1;
    if (/^(脚|ブーツ)/.test(name)) {                              // 腰を支点に前後へ振る。前へ戻す足と後ろ足は持ち上げる
      const sw = side * s, v = side * c, t = (HIP - z) / HIP;
      ny = y - R(M.stride * sw * t);
      nz = Math.min(HIP - 1, z + R((M.lift * Math.max(0, v) + 2 * Math.max(0, -sw)) * t));
      if (z >= 5) nz = Math.max(0, nz + dip);                     // 沈む分は脚で吸収し、靴底は地面に残す
      nz += up;
    } else if (/^腕/.test(name)) {                                // 肩を支点に足と逆へ。肘から先は前へ曲げる
      const sw = -side * s, t = (SHOULDER - z) / 14, fore = Math.max(0, 17 - z) / 7;
      ny = y - R(M.arm * sw * t + 2 * fore) + lean(SHOULDER);
      nz = z + R(2 * Math.abs(sw) * t + fore) + dip + up;
    } else if (/^ツインテ/.test(name)) {                          // 後ろへなびき、毛先が揺れる
      const t = (TW_ROOT - z) / 24;
      ny = y + R((M.tw[0] + M.tw[1] * Math.sin(2 * ph + 1)) * t) + lean(TW_ROOT);
      nz = z + dip + R(up * (1 - t) + upLate * t + M.tw[2] * t * (0.5 + 0.5 * Math.sin(2 * ph + 2)));
    } else if (name === 'しっぽ') {                               // 先が左右に振れる
      const t = (TAIL_ROOT - z) / 7;
      nx = x + R(2 * s * t); ny = y + R(t) + lean(TAIL_ROOT); nz = z + dip + R(up * (1 - t) + upLate * t + t);
    } else { ny = y + lean(z); nz = z + dip + up; }
    const k = (nz + 8) * 4096 + (ny + 16) * 64 + (nx + 16);
    if (seen.has(k)) continue;                                    // 重なったら先に置いた方を残す
    seen.add(k); out.push([nx, ny, nz, col, name]);
  }
  return out;
}
// 外から見える画素だけを、renderVox が読む形（体の中心を原点にした座標と色）にする
function surfaceList(list) {
  const key = (x, y, z) => (z + 8) * 4096 + (y + 16) * 64 + (x + 16), occ = new Set(list.map(v => key(v[0], v[1], v[2])));
  const out = [];
  for (const [x, y, z, col] of list) {
    if (occ.has(key(x-1,y,z)) && occ.has(key(x+1,y,z)) && occ.has(key(x,y-1,z)) && occ.has(key(x,y+1,z)) && occ.has(key(x,y,z-1)) && occ.has(key(x,y,z+1))) continue;
    out.push([x + .5 - W / 2, y - CY, z + .5 - H / 2, ...hex(col)]);
  }
  return out;
}
