/* brick.js — game "Nấm Mario" (phong cách 8-bit ngày xưa): chạy ngang qua 4 màn, hộp ? (xu · nấm năng lượng · nấm hoá to ·
   hoa lửa · sao bất tử), chui ống xuống 5 kiểu hầm bí mật, màn cuối đánh rồng phun lửa trên cầu dung nham rồi giải cứu công chúa.
   Cùng giao diện với Climb: init(canvas, stage, seed, hooks, level) · S · pl · alt() · topAlt() · release() · place() · measure()
   + extra() (dữ liệu gửi cho cả lớp) · hud() (chữ trên thanh trạng thái) · kind = 'brick' */
window.Brick = (function () {
const { clamp, rng } = GC;
const TS = 32, ROWS = 15, GH = .62, GL = .27, JV = -10.4, SPD = 3.4, RUN = 4.5, NL = 4;   // giữ ↑ càng lâu nhảy càng cao (tối đa ~6 ô)
const H_SMALL = 30, H_BIG = 46;
const THEMES = [   // bảng màu pixel: g = đất [nền, tối, sáng] · b = gạch [nền, vữa, sáng]
  { name: 'Đồng cỏ', ic: '🌳', bg: 'over', sky: ['#5C94FC', '#9DC4FF'], g: ['#E0782C', '#6E2A08', '#FCBC8C'], b: ['#D8691E', '#6E2A08', '#FCA060'] },
  { name: 'Hang ngầm', ic: '💎', bg: 'under', sky: ['#05051A', '#161640'], g: ['#2A6BE0', '#06205C', '#8CB4FF'], b: ['#1E5AD0', '#06205C', '#7AA8FF'] },
  { name: 'Xứ mây hồng', ic: '☁️', bg: 'cloud', sky: ['#FFA8D2', '#C7B2FF'], g: ['#F27BB4', '#8A1E55', '#FFD0E8'], b: ['#EC6AA8', '#8A1E55', '#FFC0DE'] },
  { name: 'Lâu đài rồng lửa', ic: '🐉', bg: 'castle', sky: ['#120814', '#3A0E22'], g: ['#8A8AA6', '#2A2A3E', '#D0D0E4'], b: ['#7A7A98', '#2A2A3E', '#C0C0D8'] }];
const LVS = {
  1: { chunks: 11, enemy: .45, spiky: .2, pit: [2, 3], plant: .25, speed: 1, boss: 5, bossFire: 160, cost: { walk: .22, jump: 4, coin: 3, battery: 20, stomp: 10, hurt: 15, shot: 1 } },
  2: { chunks: 15, enemy: .65, spiky: .35, pit: [2, 4], plant: .45, speed: 1.25, boss: 7, bossFire: 125, cost: { walk: .26, jump: 5, coin: 3, battery: 20, stomp: 10, hurt: 22, shot: 2 } },
  3: { chunks: 19, enemy: .85, spiky: .5, pit: [3, 4], plant: .65, speed: 1.5, boss: 9, bossFire: 95, cost: { walk: .3, jump: 6, coin: 3, battery: 20, stomp: 10, hurt: 30, shot: 2 } } };
let LVC = LVS[2], COST = LVC.cost;
const SOLID = new Set(['G', 'B', '?', 'U', 'H', 'P', 'Y']);   // C: mây (chỉ đứng trên được) · L: dung nham · Y: cầu của rồng
const S = { energy: 0, cap: 0, rescue: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, maxAlt: 0, won: false, boss: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 64, y: 300, w: 24, h: H_SMALL, vx: 0, vy: 0, on: false, face: 1, coy: 0, buf: 0, walk: 0, inv: 0, kb: 0, run: 0, pipe: null, auto: null, lift: null, pw: 0, star: 0 };
const keys = { l: 0, r: 0, j: 0, jp: 0, d: 0, f: 0, fp: 0 };
const parts = [], pops = [], FB = [];
let seed0 = 1, lvSel = 2, LVL = null, A = null, AI = 0, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, oy = 0, camX = 0, emptyT = 0, cp = null, banner = null;

/* ═════ dựng màn (cùng seed → cả lớp cùng bản đồ) ═════ */
function newArea(w, th) { const g = []; for (let x = 0; x < w; x++)g.push(new Array(ROWS).fill('.')); return { w, th, g, q: {}, en: [], coins: [], pipes: [], lifts: [], bars: [], items: [], bumps: [], ef: [], flag: null, castle: null, mid: null, princess: null } }
const getT = (a, x, y) => x < 0 || x >= a.w ? 'H' : y < 0 || y >= ROWS ? '.' : a.g[x][y];
const setT = (a, x, y, t) => { if (x >= 0 && x < a.w && y >= 0 && y < ROWS) a.g[x][y] = t };
/* nội dung hộp ?: xu nhiều nhất, rồi nấm năng lượng, nấm hoá to / hoa lửa, thỉnh thoảng sao */
const boxOf = r => r < .48 ? 'coin' : r < .68 ? 'mush' : r < .93 ? 'grow' : 'star';
/* 5 kiểu hầm bí mật khác nhau */
function buildBonus(kind, r0) {
  const RI = (a, b) => a + Math.floor(r0() * (b - a + 1)), w = [22, 24, 22, 24, 22][kind], b = newArea(w, 1);
  for (let i = 0; i < w; i++) { setT(b, i, 13, 'G'); setT(b, i, 14, 'G'); setT(b, i, 0, 'B'); setT(b, i, 1, 'B') }
  for (let r = 0; r < ROWS; r++) { setT(b, 0, r, 'B'); setT(b, w - 1, r, 'B') }
  const ex = { x: w - 4, top: 11, h: 2, to: null, enter: true, ph: 0 }; for (let r = 11; r <= 12; r++) { setT(b, ex.x, r, 'P'); setT(b, ex.x + 1, r, 'P') } b.pipes.push(ex);
  const coin = (cx, row) => { if (getT(b, cx, row) === '.' && cx < w - 4) b.coins.push({ x: cx * TS + 6, y: row * TS + 4, got: false }) };   // không đặt xu lẫn vào gạch / ống
  const box = (cx, row, k) => { setT(b, cx, row, '?'); b.q[cx + ',' + row] = k };
  b.bonusName = ['🪙 Hầm kho báu', '🪜 Hầm cầu thang', '🏛 Hầm cột đá', '🧱 Hầm gạch vàng', '💖 Hầm trái tim'][kind];
  if (kind === 0) {           // kho báu: 3 hàng xu + dãy hộp ?
    for (let i = 4; i < 18; i += 2)box(i, 9, i === 10 ? 'grow' : 'coin');
    [[3, 15, 11], [3, 15, 7], [5, 11, 5]].forEach(([x0, n, row]) => { for (let i = 0; i < n; i++)coin(x0 + i, row) });
  } else if (kind === 1) {    // cầu thang lên xuống, xu trên từng bậc
    for (let i = 0; i < 6; i++) { for (let r = 12 - i; r <= 12; r++) { setT(b, 3 + i, r, 'H'); setT(b, 18 - i, r, 'H') } coin(3 + i, 11 - i); coin(18 - i, 11 - i) }
    for (let i = 9; i <= 12; i++)for (let r = 7; r <= 12; r++)setT(b, i, r, 'H');
    for (let i = 8; i <= 13; i++) { coin(i, 5); coin(i, 4) } box(10, 2, 'mush'); box(11, 2, 'star');
  } else if (kind === 2) {    // các cột đá cao thấp, xu trên đỉnh
    [[4, 2], [7, 4], [10, 5], [13, 3], [16, 4]].forEach(([cx, h]) => { for (let r = 13 - h; r <= 12; r++) { setT(b, cx, r, 'B'); setT(b, cx + 1, r, 'B') } coin(cx, 12 - h); coin(cx + 1, 12 - h); coin(cx, 11 - h); coin(cx + 1, 11 - h) });
    box(9, 4, 'grow'); box(12, 4, 'mush'); for (let i = 3; i < 19; i++)coin(i, 12);
  } else if (kind === 3) {    // trần gạch thấp: đội gạch nào cũng ra xu
    for (let i = 3; i < 18; i++) { setT(b, i, 9, 'B'); b.q[i + ',9'] = 'coin' } box(11, 9, 'star');
    for (let i = 3; i < 20; i++) { coin(i, 12); coin(i, 11) } for (let i = 5; i < 17; i++)coin(i, 6);
  } else {                    // trái tim bằng xu
    const HEART = ['_##___##_', '####_####', '#########', '#########', '_#######_', '__#####__', '___###___', '____#____'];
    HEART.forEach((r, y) => { for (let i = 0; i < r.length; i++)if (r[i] === '#') coin(7 + i, 3 + y) });
    box(4, 9, 'mush'); box(17, 9, 'grow'); for (let i = 3; i < 19; i++)coin(i, 12);
  }
  b.drop = { x: 2 * TS + 4, y: 2 * TS };
  return { b, ex };
}
function buildLevel(li) {
  const r0 = rng(seed0 * 31 + li * 977 + lvSel * 13), R = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), th = li;
  const a = newArea(110 + LVC.chunks * 16, th), lv = { li, th, areas: [a], final: li === NL - 1 };
  const gnd = (x0, x1) => { for (let i = x0; i < x1; i++) { setT(a, i, 13, 'G'); setT(a, i, 14, 'G') } };
  const coinRow = (x0, n, row) => { for (let i = 0; i < n; i++)a.coins.push({ x: (x0 + i) * TS + 6, y: row * TS + 4, got: false }) };
  const enemy = (cx, k) => a.en.push({ k: k || (li >= 1 && r0() < LVC.spiky ? 'spiky' : 'shroom'), x: cx * TS + 4, y: 13 * TS - 24, w: 24, h: 22, vx: -.8 * LVC.speed, vy: 0, dead: 0, act: false });
  const pipe = (px, h, extra) => { for (let r = 13 - h; r <= 12; r++) { setT(a, px, r, 'P'); setT(a, px + 1, r, 'P') } const p = Object.assign({ x: px, top: 13 - h, h, to: null, plant: false, ph: RI(0, 239) }, extra || {}); a.pipes.push(p); return p };
  const box = (cx, row, k) => { setT(a, cx, row, '?'); a.q[cx + ',' + row] = k || boxOf(r0()) };
  if (th === 1 || th === 3) for (let i = 0; i < a.w; i++) { setT(a, i, 0, 'B'); setT(a, i, 1, 'B') }   // trần hang / lâu đài
  gnd(0, 14); let x = 14, exitQ = [], nb = 0;
  box(8, 9, li === 0 ? 'grow' : undefined);
  for (let c = 0; c < LVC.chunks; c++) {
    if (c === Math.floor(LVC.chunks / 2)) { gnd(x, x + 6); a.mid = { x: (x + 3) * TS }; x += 6; continue }
    if (exitQ.length && c >= exitQ[0].after) {   // ống trồi lên từ hầm xu
      gnd(x, x + 7); const e = pipe(x + 3, 2, { exit: true }); exitQ[0].bonusExit.to = { area: 0, pipe: e }; exitQ.shift(); x += 7; continue;
    }
    let kinds = ['flat', 'pit', 'pipes', 'blocks', 'stairs', 'flat'];
    if (th === 2) kinds = ['lift', 'bridge', 'bridge', 'pit', 'blocks', 'flat'];
    if (th === 3) kinds = ['firebar', 'lava', 'lava', 'blocks', 'stairs', 'flat', 'firebar'];
    if (th === 1) kinds.push('blocks', 'pipes');
    let k = kinds[Math.floor(r0() * kinds.length)];
    if ((c === 2 || c === Math.floor(LVC.chunks / 2) + 2) && th !== 2) k = 'bonus';
    if (k === 'flat') {
      const n = RI(8, 11); gnd(x, x + n);
      if (r0() < LVC.enemy) enemy(x + RI(4, n - 2)); if (r0() < LVC.enemy * .6) enemy(x + RI(2, n - 3));
      if (r0() < .5) coinRow(x + 2, 4, RI(8, 10)); else if (r0() < .5) box(x + RI(3, n - 3), 9);
      if (th === 2 && r0() < .6) a.en.push({ k: 'bird', bx: (x + n / 2) * TS, by: RI(6, 8) * TS, amp: R(60, 110), sp: R(.02, .03) * LVC.speed, ph: R(0, 6), x: 0, y: 0, w: 24, h: 16, dead: 0, act: true });
      x += n;
    } else if (k === 'pit' || k === 'lava') {
      gnd(x, x + 3); const w = RI(LVC.pit[0], LVC.pit[1]);
      if (k === 'lava') for (let i = x + 3; i < x + 3 + w; i++) { setT(a, i, 14, 'L'); setT(a, i, 13, 'L') }
      if (w >= 4) box(x + 3 + Math.floor(w / 2), 9, 'coin');
      x += 3 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'pipes') {
      const n = 14; gnd(x, x + n); let px = x + 2;
      for (let i = 0; i < RI(1, 3) && px < x + n - 2; i++) { const p = pipe(px, RI(2, 3)); p.plant = li >= 1 && r0() < LVC.plant || li === 0 && r0() < LVC.plant * .5; px += RI(4, 6) }
      if (r0() < LVC.enemy) enemy(x + n - 2); x += n;
    } else if (k === 'blocks') {
      const n = 11; gnd(x, x + n); const pat = ['B?B?B', '?B?', 'B??B', '?'][RI(0, 3)];
      for (let i = 0; i < pat.length; i++) { const cx = x + 3 + i; if (pat[i] === '?') box(cx, 9); else { setT(a, cx, 9, 'B'); if (r0() < .12) a.q[cx + ',9'] = 'coin' } }
      if (r0() < .6) { box(x + 4, 5); coinRow(x + 3, 3, 4) }
      if (r0() < LVC.enemy) enemy(x + RI(3, 8)); x += n;
    } else if (k === 'stairs') {
      const gap = lvSel >= 2 && r0() < .6; gnd(x, x + 4); gnd(x + (gap ? 6 : 4), x + 11);
      for (let i = 1; i <= 4; i++)for (let r = 13 - i; r <= 12; r++)setT(a, x + i - 1, r, 'H');
      for (let i = 4; i >= 1; i--)for (let r = 13 - i; r <= 12; r++)setT(a, x + (gap ? 6 : 4) + (4 - i), r, 'H');
      coinRow(x + 3, gap ? 4 : 2, 7); x += 11;
    } else if (k === 'bonus') {   // ống chui xuống hầm bí mật — mỗi hầm một kiểu
      gnd(x, x + 9); const ent = pipe(x + 4, 2, { enter: true });
      const { b, ex } = buildBonus((seed0 + li * 2 + nb++) % 5, r0), bi = lv.areas.length; lv.areas.push(b);
      ent.to = { area: bi }; exitQ.push({ after: c + 2, bonusExit: ex }); x += 9;
    } else if (k === 'lift') {   // thang máy chở qua vực rộng
      gnd(x, x + 2); const w = RI(7, 9); a.lifts.push({ x0: (x + 2) * TS, x1: (x + 2 + w - 3) * TS, y: 10 * TS, w: 3 * TS, sp: .012 * LVC.speed, ph: R(0, 6), x: 0, dx: 0 });
      coinRow(x + 3, w - 2, 8); x += 2 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'bridge') {   // các đám mây nhỏ bắc qua vực
      gnd(x, x + 2); let i = x + 2; const end = x + 2 + RI(8, 11);
      while (i < end) { const n = RI(2, 3); for (let j = 0; j < n; j++)setT(a, i + j, 11, 'C'); if (r0() < .5) coinRow(i, n, 9); i += n + RI(1, 2) }
      a.en.push({ k: 'bird', bx: (x + 6) * TS, by: 7 * TS, amp: R(70, 120), sp: R(.02, .03) * LVC.speed, ph: R(0, 6), x: 0, y: 0, w: 24, h: 16, dead: 0, act: true });
      x = i; gnd(x, x + 3); x += 3;
    } else if (k === 'firebar') {
      const n = 10; gnd(x, x + n); setT(a, x + 5, 9, 'H');
      a.bars.push({ cx: (x + 5.5) * TS, cy: 9.5 * TS, n: lvSel >= 3 ? 6 : 5, a: R(0, 6), sp: (.03 + .01 * lvSel) * (r0() < .5 ? 1 : -1) });
      if (r0() < LVC.enemy) enemy(x + 8); x += n;
    }
  }
  while (exitQ.length) { gnd(x, x + 7); const e = pipe(x + 3, 2, { exit: true }); exitQ[0].bonusExit.to = { area: 0, pipe: e }; exitQ.shift(); x += 7 }
  if (lv.final) {   // phòng vũ khí → cầu dung nham có rồng → rìu → công chúa
    gnd(x, x + 10); box(x + 3, 9, 'fire'); box(x + 6, 9, 'mush'); a.armory = { x: (x + 3) * TS }; x += 10;
    const bx = x; for (let i = 0; i < 14; i++) { setT(a, bx + i, 13, 'Y'); setT(a, bx + i, 14, 'L') }
    a.boss = { x: (bx + 9) * TS, y: 13 * TS - 54, w: 72, h: 54, vx: -.8 * LVC.speed, vy: 0, hp: LVC.boss, max: LVC.boss, minX: (bx + 3) * TS, maxX: (bx + 12) * TS, t: 0, fireT: 90, f: -1, act: false, fall: false, dead: false, hurtT: 0, on: true };
    a.bridge = { x0: bx, col: bx + 13, on: false, t: 0 };
    gnd(bx + 14, bx + 34); a.axe = { x: (bx + 14) * TS + 6, y: 11 * TS, w: 20, h: 64 };
    a.princess = { x: (bx + 22) * TS, y: 13 * TS }; a.w = bx + 34; a.end = (bx + 21) * TS;
  } else {          // bậc thang → cột cờ → lâu đài nhỏ
    gnd(x, x + 26);
    for (let i = 1; i <= 5; i++)for (let r = 13 - i; r <= 12; r++)setT(a, x + 1 + i, r, 'H');
    for (let r = 8; r <= 12; r++)setT(a, x + 7, r, 'H');
    a.flag = { x: (x + 11) * TS + 14, top: 3 * TS, y: 3 * TS, done: false }; a.castle = { x: (x + 14) * TS };
    a.w = x + 26; a.end = (x + 11) * TS;
  }
  a.g.length = a.w;
  if (th === 0 || th === 2) { a.deco = []; for (let i = 3; i < a.w - 4; i += RI(7, 12)) if ([0, 1, 2].every(k => getT(a, i + k, 13) === 'G' && getT(a, i + k, 12) === '.')) a.deco.push({ x: i, k: r0() < .4 ? 1 : 0 }) }
  return lv;
}
function loadLevel(li, keepPos) {
  S.level = li; LVL = buildLevel(li); A = LVL.areas[0]; AI = 0; FB.length = 0;
  cp = { x: 3 * TS, y: 13 * TS - pl.h, mid: false };
  if (!keepPos) { pl.x = cp.x; pl.y = cp.y; pl.vx = pl.vy = 0; pl.auto = null; pl.pipe = null }
  camX = 0; banner = { t: 160, w: 'WORLD 1-' + (li + 1), text: THEMES[li].ic + ' ' + THEMES[li].name };
}
const prog = () => S.won ? 1 : clamp((S.level + (AI === 0 ? clamp(pl.x / Math.max(1, A.end || A.w * TS), 0, 1) : .5)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ va chạm với ô gạch ═════ */
const solid = (x, y) => SOLID.has(getT(A, x, y));
function moveX(o) {
  o.x += o.vx; o.hitX = 0; const y0 = Math.floor(o.y / TS), y1 = Math.floor((o.y + o.h - .01) / TS);
  if (o.vx > 0) { const c = Math.floor((o.x + o.w - .01) / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = c * TS - o.w; o.vx = 0; o.hitX = 1; break } }
  else if (o.vx < 0) { const c = Math.floor(o.x / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = (c + 1) * TS; o.vx = 0; o.hitX = -1; break } }
}
function moveY(o) {
  const pb = o.y + o.h; o.y += o.vy; o.on = false; o.bump = null;
  const x0 = Math.floor((o.x + 1) / TS), x1 = Math.floor((o.x + o.w - 1.01) / TS), mid = Math.floor((o.x + o.w / 2) / TS);
  const cols = [mid]; for (let c = x0; c <= x1; c++)if (c !== mid) cols.push(c);
  if (o.vy > 0) { const r = Math.floor((o.y + o.h - .01) / TS); for (const c of cols) { const t = getT(A, c, r); if (SOLID.has(t) || (t === 'C' && pb <= r * TS + .5)) { o.y = r * TS - o.h; o.vy = 0; o.on = true; break } } }
  else if (o.vy < 0) { const r = Math.floor(o.y / TS); for (const c of cols) if (solid(c, r)) { o.y = (r + 1) * TS; o.vy = 0; o.bump = { c, r }; break } }
  return pb;
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ═════ biến hình: 0 nhỏ · 1 to · 2 to + bắn lửa ═════ */
function setPower(n) {
  const oh = pl.h; pl.pw = n; pl.h = n ? H_BIG : H_SMALL; pl.y -= pl.h - oh;
  document.body.classList.toggle('fire', n === 2);
}
function spawnItem(k, c, r) { A.items.push({ k, x: c * TS + 4, y: r * TS, w: 24, h: k === 'flower' ? 24 : 22, vx: k === 'flower' ? 0 : 1.5, vy: 0, rise: 24, got: false }); GC.sfx('power') }
function bumpBlock(c, r) {
  const t = getT(A, c, r), key = c + ',' + r, q = A.q[key];
  A.bumps.push({ c, r, t: 10 });
  for (const e of A.en) if (!e.dead && e.k !== 'bird' && Math.abs(e.x + e.w / 2 - (c + .5) * TS) < 26 && Math.abs(e.y + e.h - r * TS) < 4) { e.dead = 40; S.stomps++ }
  for (const it of A.items) if (!it.got && it.rise <= 0 && Math.abs(it.x + 12 - (c + .5) * TS) < 26 && Math.abs(it.y + it.h - r * TS) < 4) { it.vy = -6; it.vx = -it.vx || 1.5 }
  if (t === '?' || (t === 'B' && q)) {
    setT(A, c, r, 'U'); delete A.q[key];
    const k = q || 'coin';
    if (k === 'coin') { S.coins++; S.energy += COST.coin; pops.push({ x: c * TS + 16, y: r * TS - 8, t: 30 }); GC.sfx('coin') }
    else if (k === 'grow') spawnItem(pl.pw ? 'flower' : 'grow', c, r);
    else if (k === 'fire') spawnItem('flower', c, r);
    else spawnItem(k, c, r);
  } else if (t === 'B') {
    if (pl.pw) {   // to rồi mới đội vỡ gạch
      setT(A, c, r, '.'); GC.sfx('break');
      for (let i = 0; i < 8; i++)parts.push({ x: c * TS + 16, y: r * TS + 16, vx: (Math.random() - .5) * 6, vy: -3 - Math.random() * 4, r: 4, l: 50, L: 50, c: THEMES[A.th].b[0], g: .3 });
    } else GC.sfx('bump');
  } else GC.sfx('bump');
}
function step() {
  S.tick++;
  for (const L of A.lifts) { const nx = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)); L.dx = nx - L.x; L.x = nx }
  for (const b of A.bars) b.a += b.sp;
  for (let i = A.bumps.length - 1; i >= 0; i--)if (--A.bumps[i].t <= 0) A.bumps.splice(i, 1);
  stepItems(); stepEnemies(); stepFire(); stepBoss();
  if (pl.star > 0) pl.star--;
  if (pl.pipe) return stepPipe();
  if (pl.auto) return stepAuto();
  const can = S.energy > 0 && !frozen(), dir = can && !pl.kb ? (keys.r - keys.l) : 0;
  if (dir && dir === pl.face) pl.run++; else pl.run = 0;
  const top = pl.run > 45 ? RUN : SPD;
  if (pl.kb) { pl.kb--; pl.vx *= .96 } else pl.vx += (dir * top - pl.vx) * (pl.on ? .22 : .12);
  if (Math.abs(pl.vx) < .05) pl.vx = 0;
  if (dir) { pl.face = dir; use(COST.walk) }
  if (pl.on && Math.abs(pl.vx) > .4) pl.walk += .3 + Math.abs(pl.vx) * .06;
  if (pl.inv) pl.inv--;
  if (keys.jp) { pl.buf = 7; keys.jp = 0 }
  if (pl.on) pl.coy = 6; else if (pl.coy > 0) pl.coy--;
  if (pl.buf > 0) { pl.buf--; if (pl.coy > 0 && can) { pl.vy = JV - (pl.pw ? .4 : 0); pl.coy = 0; pl.buf = 0; pl.on = false; pl.lift = null; use(COST.jump); GC.sfx('jump') } }
  if (keys.fp) { keys.fp = 0; if (pl.pw === 2 && can && FB.length < 2) { use(COST.shot); FB.push({ x: pl.face > 0 ? pl.x + pl.w - 4 : pl.x - 8, y: pl.y + 14, vx: 6.5 * pl.face, vy: 1.5, l: 110 }); GC.sfx('fireball') } }
  pl.vy = Math.min(pl.vy + (keys.j && pl.vy < 0 ? GL : GH), 12);   // giữ nút nhảy = bay cao hơn
  if (pl.lift) { pl.x += pl.lift.dx }
  moveX(pl); if (pl.x < camX) { pl.x = camX; if (pl.vx < 0) pl.vx = 0 }
  const pb = moveY(pl);
  if (pl.bump) bumpBlock(pl.bump.c, pl.bump.r);
  pl.lift = null;
  if (pl.vy >= 0) for (const L of A.lifts) if (pl.x + pl.w > L.x + 2 && pl.x < L.x + L.w - 2 && pb <= L.y + .5 && pl.y + pl.h >= L.y) { pl.y = L.y - pl.h; pl.vy = 0; pl.on = true; pl.lift = L }
  // chui ống: đứng trên miệng ống có mũi tên + bấm ↓
  if (keys.d && pl.on) for (const p of A.pipes) if (p.enter && p.to && pl.x >= p.x * TS - 6 && pl.x + pl.w <= (p.x + 2) * TS + 6 && Math.abs(pl.y + pl.h - p.top * TS) < 1) { pl.pipe = { p, ph: 'down', t: 0 }; pl.vx = 0; GC.sfx('pipe'); return }
  // xu, vật phẩm
  for (const c of A.coins) if (!c.got && pl.x < c.x + 20 && pl.x + pl.w > c.x && pl.y < c.y + 24 && pl.y + pl.h > c.y) { c.got = true; S.coins++; S.energy += COST.coin; GC.sfx('coin') }
  for (const it of A.items) if (!it.got && it.rise <= 0 && hit(pl, it)) {
    it.got = true;
    if (it.k === 'mush') { S.energy += COST.battery; GC.sfx('bat'); S.hooks.onBat && S.hooks.onBat(COST.battery, 'mush') }
    else if (it.k === 'grow') { if (!pl.pw) setPower(1); GC.sfx('grow'); S.hooks.onPower && S.hooks.onPower('grow') }
    else if (it.k === 'flower') { setPower(2); GC.sfx('grow'); S.hooks.onPower && S.hooks.onPower('flower') }
    else if (it.k === 'star') { pl.star = 600; GC.sfx('star'); S.hooks.onPower && S.hooks.onPower('star') }
  }
  // cờ giữa màn
  if (A.mid && !cp.mid && AI === 0 && pl.x > A.mid.x) { cp = { x: A.mid.x, y: 13 * TS - pl.h, mid: true }; GC.sfx('cp'); S.hooks.onCP && S.hooks.onCP(S.level + 1, 'mid') }
  // quái, lửa, hoa ăn thịt
  for (const e of A.en) {
    if (e.dead || !e.act || !hit(pl, e)) continue;
    if (pl.star) { e.dead = 40; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); continue }
    if (e.k !== 'spiky' && pl.vy > 0 && pb <= e.y + 10) { e.dead = 40; pl.vy = -8.5; S.energy += COST.stomp; S.stomps++; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) }
    else hurt(e.x + e.w / 2);
  }
  for (const b of A.bars) for (let i = 1; i <= b.n; i++) { const fx = b.cx + Math.cos(b.a) * i * 14, fy = b.cy + Math.sin(b.a) * i * 14; if (fx > pl.x - 4 && fx < pl.x + pl.w + 4 && fy > pl.y - 4 && fy < pl.y + pl.h + 4) hurt(fx) }
  for (const p of A.pipes) { const k = plantK(p); if (k > .2 && hit(pl, { x: p.x * TS + 22, y: p.top * TS - 28 * k, w: 20, h: 28 * k })) { if (pl.star) { p.plant = false; GC.sfx('stomp') } else hurt(p.x * TS + 32) } }
  // cột cờ / rìu / công chúa
  if (A.flag && !A.flag.done && pl.x + pl.w > A.flag.x) { A.flag.done = true; pl.auto = { ph: 'slide', t: 0 }; pl.x = A.flag.x - pl.w + 2; pl.vx = 0; pl.vy = 0; GC.sfx('flag') }
  if (A.axe && !A.bridge.on && hit(pl, A.axe)) { A.bridge.on = true; GC.sfx('crack'); S.hooks.onBoss && S.hooks.onBoss('axe') }
  if (A.princess && !S.won && pl.x + pl.w > A.princess.x - 34) { if (A.boss && !A.boss.fall) bossDown(); S.won = true; pl.vx = 0; S.hooks.onWin && S.hooks.onWin() }
  // rơi vực / dung nham
  const lava = getT(A, Math.floor((pl.x + pl.w / 2) / TS), Math.floor((pl.y + pl.h + 2) / TS)) === 'L';
  if (pl.y > ROWS * TS + 30 || lava) {
    S.falls++; GC.sfx('fall'); respawn();
    S.hooks.onFall && S.hooks.onFall(0, (lava ? '🔥 Rơi vào dung nham!' : '😱 Rơi xuống vực!') + ' Quay lại ' + (cp.mid ? 'cờ giữa màn' : 'đầu màn ' + (S.level + 1)) + ' — cố lên, em làm được!');
  }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function hurt(fromX) {
  if (pl.inv || pl.star) return;
  if (pl.pw) { setPower(pl.pw - 1); pl.inv = 100; GC.sfx('shrink'); S.hooks.onPower && S.hooks.onPower('shrink'); return }   // đang to: chỉ thu nhỏ, không mất ⚡
  pl.inv = 75; pl.kb = 16; S.hits++; use(COST.hurt);
  pl.vx = (pl.x + pl.w / 2 < fromX ? -1 : 1) * 6; pl.vy = -6.5; pl.on = false;
  GC.sfx('hurt'); for (let i = 0; i < 10; i++)parts.push({ x: pl.x + 12, y: pl.y + 16, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, r: 3, l: 30, L: 30, c: '#ff6b81', g: .12 });
  S.hooks.onHurt && S.hooks.onHurt(COST.hurt);
}
function respawn() { if (AI !== 0) { A = LVL.areas[0]; AI = 0 } pl.x = cp.x; pl.y = 13 * TS - pl.h; pl.vx = pl.vy = 0; pl.kb = 0; pl.inv = 60; pl.pipe = null; FB.length = 0; camX = Math.max(0, cp.x - vw * .35) }
function plantK(p) {
  if (!p.plant) return 0;
  const t = (S.tick + p.ph) % 240;
  if (t < 30 && Math.abs(pl.x + pl.w / 2 - (p.x + 1) * TS) < 52 && AI === 0) { p.ph = (p.ph + 1) % 240; return 0 }   // em đứng sát ống thì hoa không trồi lên
  return t < 30 ? t / 30 : t < 100 ? 1 : t < 130 ? 1 - (t - 100) / 30 : 0;
}
function stepItems() {
  for (const it of A.items) {
    if (it.got) continue;
    if (it.rise > 0) { it.y -= 1; it.rise--; continue }
    if (it.k === 'flower') continue;
    it.vy = Math.min(it.vy + GH * .8, 9); moveX(it); if (it.hitX) it.vx = -it.hitX * 1.5; moveY(it);
    if (it.k === 'star' && it.on) it.vy = -7;
    if (it.y > ROWS * TS + 40) it.got = true;
  }
}
function stepFire() {   // cầu lửa của em: nảy trên mặt đất, diệt quái, bắn rồng
  for (let i = FB.length - 1; i >= 0; i--) {
    const f = FB[i]; f.l--; f.vy = Math.min(f.vy + .45, 7); f.x += f.vx;
    let dead = f.l <= 0 || f.x < camX - 40 || f.x > camX + vw + 40 || solid(Math.floor((f.x + 4) / TS), Math.floor((f.y + 4) / TS));
    f.y += f.vy; if (solid(Math.floor((f.x + 4) / TS), Math.floor((f.y + 8) / TS)) && f.vy > 0) { f.y = Math.floor((f.y + 8) / TS) * TS - 8; f.vy = -4.6 }
    const box = { x: f.x, y: f.y, w: 8, h: 8 };
    for (const e of A.en) if (!dead && !e.dead && e.act && hit(box, e)) { e.dead = 40; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); dead = true }
    for (const p of A.pipes) { const k = plantK(p); if (!dead && k > .2 && hit(box, { x: p.x * TS + 22, y: p.top * TS - 28 * k, w: 20, h: 28 * k })) { p.plant = false; GC.sfx('stomp'); dead = true } }
    const B = A.boss; if (!dead && B && B.act && !B.fall && hit(box, B)) { dead = true; B.hp--; B.hurtT = 16; GC.sfx('bossHit'); if (B.hp <= 0) bossDown() }
    if (dead) { for (let k = 0; k < 5; k++)parts.push({ x: f.x + 4, y: f.y + 4, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2, r: 2, l: 14, L: 14, c: '#FFB627', g: .05 }); FB.splice(i, 1) }
  }
}
function bossDown() { const B = A.boss; if (!B || B.fall) return; B.fall = true; B.vy = -7; S.boss = true; GC.sfx('bossDown'); S.hooks.onBoss && S.hooks.onBoss('down') }
function stepBoss() {
  const B = A.boss, Br = A.bridge; if (!B) return;
  if (Br && Br.on && Br.col >= Br.x0 && S.tick % 3 === 0) { setT(A, Br.col, 13, '.'); Br.col--; GC.sfx('crack') }   // cầu sập dần
  if (B.dead) return;
  if (B.fall) { B.vy = Math.min(B.vy + .45, 12); B.y += B.vy; if (B.y > ROWS * TS + 120) B.dead = true; return }
  if (!B.act) { if (AI === 0 && pl.x > B.minX - 7 * TS) { B.act = true; S.hooks.onBoss && S.hooks.onBoss('appear') } return }
  B.t++; if (B.hurtT) B.hurtT--;
  B.f = pl.x + pl.w / 2 < B.x + B.w / 2 ? -1 : 1;
  B.x += B.vx; if (B.x < B.minX || B.x > B.maxX) { B.vx = -B.vx; B.x = clamp(B.x, B.minX, B.maxX) }
  if (B.on && B.t % 170 === 80) { B.vy = -9; B.on = false }
  B.vy = Math.min(B.vy + GH, 12); B.y += B.vy;
  const under = getT(A, Math.floor((B.x + B.w / 2) / TS), 13);
  if (B.y + B.h >= 13 * TS && under === 'Y') { B.y = 13 * TS - B.h; B.vy = 0; B.on = true }
  if (B.y > 13 * TS - B.h + 4 && under !== 'Y') bossDown();
  if (--B.fireT <= 0) {   // phun lửa về phía em
    B.fireT = LVC.bossFire + Math.floor(Math.random() * 50);
    A.ef.push({ x: B.f < 0 ? B.x - 18 : B.x + B.w, y: B.y + 14, vx: 3.2 * B.f, vy: clamp((pl.y + pl.h / 2 - (B.y + 18)) / 110, -1.1, 1.1), l: 300 }); GC.sfx('roar');
  }
  if (hit(pl, { x: B.x + 6, y: B.y + 6, w: B.w - 12, h: B.h - 6 })) hurt(B.x + B.w / 2);
  for (let i = A.ef.length - 1; i >= 0; i--) { const f = A.ef[i]; f.x += f.vx; f.y += f.vy; if (--f.l <= 0) { A.ef.splice(i, 1); continue } if (hit(pl, { x: f.x, y: f.y, w: 20, h: 10 })) hurt(f.x + 10) }
}
function stepEnemies() {
  for (const e of A.en) {
    if (e.dead) { if (e.dead > 1) e.dead--; continue }
    if (!e.act) { if (e.x < camX + vw + 64) e.act = true; else continue }
    if (e.k === 'bird') { const a = S.tick * e.sp + e.ph, nx = e.bx + Math.sin(a) * e.amp; e.f = nx > e.x ? 1 : -1; e.x = nx; e.y = e.by + Math.sin(a * 2.3) * 14; continue }
    e.vy = Math.min(e.vy + GH, 10); e.vx = e.vx || -.8 * LVC.speed;
    moveX(e); if (e.hitX) e.vx = -e.hitX * .8 * LVC.speed;
    moveY(e);
    if (e.on && e.k === 'spiky') {   // nhím không tự lao xuống vực: quay đầu ở mép
      const ahead = Math.floor((e.vx > 0 ? e.x + e.w + 2 : e.x - 2) / TS), below = Math.floor((e.y + e.h + 4) / TS);
      if (!solid(ahead, below) && getT(A, ahead, below) !== 'C') e.vx = -e.vx;
    }
    if (e.y > ROWS * TS + 60) e.dead = 1;
  }
}
function stepPipe() {
  const P = pl.pipe; P.t++;
  if (P.ph === 'down') {
    pl.y += 1.3;
    if (P.t > 30) {
      const to = P.p.to; FB.length = 0;
      if (to.pipe) {   // trồi lên ở ống khác
        A = LVL.areas[to.area]; AI = to.area; const q = to.pipe;
        pl.x = (q.x + 1) * TS - pl.w / 2; pl.y = q.top * TS + 4; pl.pipe = { p: q, ph: 'up', t: 0 }; GC.sfx('pipe');
      } else {         // rơi xuống hầm bí mật
        A = LVL.areas[to.area]; AI = to.area; pl.x = A.drop.x; pl.y = A.drop.y; pl.vy = 0; pl.pipe = null;
        S.hooks.onBonus && S.hooks.onBonus(A.bonusName);
      }
      camX = clamp(pl.x - vw * .4, 0, Math.max(0, A.w * TS - vw));
    }
  } else { pl.y -= 1.3; if (P.t > 30 + (pl.pw ? 12 : 0)) { pl.y = P.p.top * TS - pl.h; pl.pipe = null } }
}
function stepAuto() {
  const T = pl.auto; T.t++;
  if (T.ph === 'slide') { A.flag.y = Math.min(12 * TS - 20, A.flag.y + 4); pl.y = Math.min(13 * TS - pl.h, pl.y + 4); if (T.t > 40) { T.ph = 'walk'; T.t = 0 } }
  else if (T.ph === 'walk') {
    pl.face = 1; pl.vx = 2.2; pl.walk += .35; moveX(pl); pl.vy = Math.min(pl.vy + GH, 12); moveY(pl);
    if (pl.x > A.castle.x + 2.2 * TS) { T.ph = 'door'; T.t = 0; GC.sfx('cp') }
  } else if (T.ph === 'door' && T.t > 50) {
    pl.auto = null; const done = S.level + 1;
    S.hooks.onCP && S.hooks.onCP(done, 'lv');
    loadLevel(Math.min(NL - 1, S.level + 1));
  }
}

/* ═════ hình ảnh: pixel art 8-bit (1 điểm ảnh = 2px thế giới) — cùng bộ sprite với trang "Mario Ad Reading" ═════ */
const PX = 2;
function hex(c) { c = parseInt(c.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255] }
function mix(a, b, t) { a = hex(a); b = hex(b); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('') }
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1a1033'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
const PXC = {};
function pix(key, rows, pal) {
  if (PXC[key]) return PXC[key];
  const W = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas'); c.width = W; c.height = rows.length; const x = c.getContext('2d');
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1) } } });
  return PXC[key] = c;
}
function cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn((col, px, py, ww, hh) => { x.fillStyle = col; x.fillRect(px, py, ww || 1, hh || 1) }); return c }
function blit(img, x, y, s, flip, sx, sy) {
  const w = img.width * s * (sx || 1), h = img.height * s * (sy || 1);
  if (flip) { ctx.save(); ctx.translate(Math.round(x + img.width * s), y); ctx.scale(-1, 1); ctx.drawImage(img, 0, img.height * s - h, w, h); ctx.restore() }
  else ctx.drawImage(img, x, y + img.height * s - h, w, h);
}
/* sprite chung với trang mẫu */
const CLOUD = ['_____kkkkk______', '___kkwwwwwk_kkk_', '__kwwwwwwwwkwwwk', '_kwwwwwwwwwwwwwk', 'kwwwwwwwwwwwwwwk', 'kwwbwwwwwwwwbwwk', '_kbbbwwwwwwbbbk_', '__kkkkkkkkkkkk__'];
const COIN = ['__ddd__', '_dyyyd_', 'dyywyyd', 'dyywyyd', 'dyywyyd', 'dyywyyd', 'dyywyyd', '_dyyyd_', '__ddd__'];
const WALKER = ['____nnnn____', '___nnnnnn___', '__nnnnnnnn__', '_nkknnnnkkn_', 'nnnwknnkwnnn', 'nnnwknnkwnnn', 'nnnnnnnnnnnn', '_nnnnnnnnnn_', '___ssssss___', '__ssssssss__', 'oooo____oooo'];
const MUSH = ['____gggg____', '__ggwwwwgg__', '_gggwwwwggg_', '_wgggwwgggw_', 'wwgggggggwww', 'wwggggggggww', 'gggggggggggg', '__ssssssss__', '__ssksskss__', '__ssksskss__', '___ssssss___'];
const STAR = ['_____y_____', '____yyy____', '____yyy____', 'yyyyyyyyyyy', '_yyykykyyy_', '__yykykyy__', '___yyyyy___', '__yyy_yyy__', '_yyy___yyy_', 'yy_______yy'];
const PLANT = ['___rrrrrr___', '__rrwrrrwrr_', '_rrrrrrrrrr_', '_rwrrrwrrrw_', '_wwwwwwwwww_', '__kkkkkkkk__', '_wwwwwwwwww_', '_rrrwrrrwrr_', '__rrrrrrrr__', '_____GG_____', '_GGG_GG_GGG_', 'GGGGGGGGGGGG', '_GGG_GG_GGG_', '_____GG_____', '_____GG_____'];
const PLANT_C = PLANT.map((r, i) => i === 4 || i === 6 ? '_rrrrrrrrrr_' : i === 5 ? '_rwrrrrrrwr_' : r);
const PC = { w: '#FFFFFF', b: '#A8D8FF', k: '#1E3A8A' }, PCP = { w: '#FFF4FA', b: '#FFC6E2', k: '#B04A86' }, PBU = { w: '#5CD65C', b: '#2E9A3A', k: '#0B4F12' }, PCO = { d: '#A86A00', y: '#FFD23F', w: '#FFF7C2' },
  PW = { n: '#B8551C', k: '#1A0A00', w: '#FFFFFF', s: '#F6C89A', o: '#2A1405' }, P1U = { g: '#2DB84B', w: '#FFFFFF', s: '#FFE6C7', k: '#1A1A1A' }, PRM = { g: '#E52521', w: '#FFFFFF', s: '#FFE6C7', k: '#1A1A1A' },
  PST = { y: '#FFD23F', k: '#1A1A1A' }, PPL = { r: '#E52521', w: '#FFFFFF', k: '#5A0000', G: '#2DB84B' };
/* nhân vật kiểu 8-bit ngày xưa: mũ lưỡi trai · áo · quần yếm · giày (c = màu em chọn) */
const HEAD = ['___ccccc____', '__ccccccccc_', '__hhhssks___', '_hshssssksss', '_hshhsssssss', '_hhssssssss_', '___ssssss___'];
const SM_S = HEAD.concat(['__ccbcccbc__', '_cccbcccbccc', 'ssccbbbbbcss', 'sssbybbbybss', '__bbbbbbbb__', '__bbb__bbb__', '_ooo____ooo_', 'oooo____oooo']);
const SM_W = HEAD.concat(['__ccbcccbc__', '_cccbcccbccc', 'ssccbbbbbcss', 'sssbybbbybss', '__bbbbbbbb__', '_bbbb__bbb__', '_oo_____ooo_', 'ooo______oo_']);
const SM_J = HEAD.concat(['ss_cbcccbcss', 'sscccbccbccs', '__ccbbbbbc__', '__bbybbbyb__', '_bbbbbbbbbb_', 'bbbb____bbbb', 'ooo______ooo', 'oo________oo']);
const BODY = ['__ccbccbcc__', '_cccbccbccc_', 'ccccbccbcccc', 'cccbbbbbbccc', 'sscbybbybcss', 'sssbbbbbbsss', 'ss_bbbbbb_ss', '___bbbbbb___', '__bbbbbbbb__', '__bbbbbbbb__'];
const BG_S = HEAD.concat(BODY, ['__bbb__bbb__', '__bbb__bbb__', '__bbb__bbb__', '_bbb____bbb_', '_ooo____ooo_', 'oooo____oooo']);
const BG_W = HEAD.concat(BODY, ['_bbbb__bbb__', '_bbb____bbb_', 'bbb_____bbb_', 'bbb______bb_', 'ooo______ooo', 'oo________oo']);
const BG_J = HEAD.concat(['ss_cbccbcss_', 'sscccbbcccss', '__ccbccbcc__', '_cccbbbbbbc_', '__cbybbybc__', '___bbbbbb___', '___bbbbbb___', '__bbbbbbbb__', '_bbbbbbbbbb_', '_bbbb__bbbb_'], ['bbbb____bbbb', 'bbb______bbb', 'bbb______bbb', 'ooo______ooo', 'ooo______ooo', 'oo________oo']);
const heroPal = (c, fire, star) => {
  if (star) { const cs = ['#FF4D4D', '#FFD23F', '#3FD29A', '#5AB0FF', '#C77DFF'], k = (S.tick >> 2) % 5; return { c: cs[k], b: cs[(k + 2) % 5], s: '#FFC99A', h: '#6B3A1E', k: '#1A1A1A', y: '#FFFFFF', o: cs[(k + 3) % 5] } }
  return fire ? { c: '#FFFFFF', b: c, s: '#FFC99A', h: '#6B3A1E', k: '#1A1A1A', y: '#FFD23F', o: '#6B3A1E' } : { c, b: '#2B4BD8', s: '#FFC99A', h: '#6B3A1E', k: '#1A1A1A', y: '#FFD23F', o: '#6B3A1E' };
};
const SPIKY = ['_v___v___v__', 'vVv_vVv_vVv_', 'vvvvvvvvvvvv', 'vVvvVvvVvvVv', 'vvvvvvvvvvvv', '_vvvvvvvvSSS', '__vvvvvvSwkS', '__vvvvvvSSSS', '___ssss_ss__', '__ss______ss'];
const BIRD = ['____bbbb____', '__bbbbbbbbw_', '_bbbbbbbbwkw', 'BBbbbbbbbbwy', 'BBBBbbbbbbyy', '_BBBbbbbbb__', '___bbbbbb___', '____o__o____'];
const BIRD2 = ['BB__bbbb____', 'BBBbbbbbbbw_', '_BBbbbbbbwkw', '__Bbbbbbbbwy', '___bbbbbbbyy', '__bbbbbbbb__', '___bbbbbb___', '____o__o____'];
const PRIN = ['____y_y_y___', '____yyyyy___', '___ggggggg__', '__ggsssssgg_', '__gskssksgg_', '__gsssssssg_', '__gssrrsssg_', '___gsssssg__', '____pppp____', '___pPppPp___', '__pppppppp__', '_ppPppppPpp_', 'pppppppppppp', 'pPpppPppppPp', 'pppppppppppp', '_kk______kk_'];
const PPR = { y: '#FFD23F', g: '#FFB84A', s: '#FFE0C8', k: '#1A1A1A', r: '#E8508A', p: '#FF7EB6', P: '#FFFFFF' };
const ARROW = ['__kkkk__', '__kyyk__', '__kyyk__', 'kkkyykkk', 'kyyyyyyk', '_kyyyyk_', '__kyyk__', '___kk___'];
const FIRE = ['__oooo__', '_oyyyyo_', 'oyywwyyo', 'oywwwwyo', 'oywwwwyo', 'oyywwyyo', '_oyyyyo_', '__oooo__'];
const FLOWER = ['___oooooo___', '__oyyyyyyo__', '_oyywwwwyyo_', '_oyywkkwyyo_', '__oyyyyyyo__', '___oooooo___', '_____GG_____', '_GG__GG__GG_', 'GGGG_GG_GGGG', '_GGGGGGGGGG_', '___GGGGGG___', '_____GG_____'];
const PFL = { o: '#E45C10', y: '#FFB627', w: '#FFFFFF', k: '#1A1A1A', G: '#2DB84B' };
const AXE = ['_kkkkk__', 'kwwwwwk_', 'kwwwwwwk', 'kwwwwwwk', 'kwwwwwk_', '_kkkkbb_', '_____bb_', '_____bb_', '_____bb_', '_____bb_', '_____bb_', '_____bb_', '_____bb_', '_____bb_', '____bbbb'];
const DRAGON = [   // rồng lửa (nhìn sang trái)
  '__________p___p___p_____', '_________pGp_pGp_pGp____', '____rr__GGGGGGGGGGGGp___', '___rGGrGGGGGGGGGGGGGGp__', '__rGGGGGGwwGGGGGGGGGGGp_',
  '_GGGGGGGGwkGGGGGGGGGGGGp', 'GkGGGGGGGGGGGGGGGGGGGGGG', 'GGGGGGGGGGGGGGGGGGGGGGG_', '_GGooooGGGGyyyyyGGGGGGG_', '__GwGwGGGGyyyyyyyGGGGG__',
  '______GGGyyyyyyyyGGGG___', '_____GGGGyyyyyyyyGGGGG__', '____GGGGGyyyyyyyGGGGGGG_', '____GGGGGGyyyyyGGGGG_GGG', '___GGGGGGGGGGGGGGGG___GG',
  '__GGG_GGGG___GGGGG_____G', '_kkk__GGG_____GGG_______', '______kkkk____kkkk______'];
const DRAGON_O = DRAGON.map((r, i) => i === 7 ? 'oooGGGGGGGGGGGGGGGGGGGG_' : i === 8 ? 'ooooooGGGGGyyyyyGGGGGGG_' : i === 9 ? '_wGwGGGGGGyyyyyyyGGGGG__' : r);
const PDR = { G: '#3FAE5A', p: '#E52521', r: '#FFFFFF', w: '#FFFFFF', k: '#1A1A1A', o: '#E52521', y: '#FFE08A' };
const FLAME = ['____oooo____', '__ooyyyyoo__', 'ooyyyywwyyoo', 'yyyywwwwyyyy', 'ooyyyywwyyoo', '__ooyyyyoo__'];
const TILEC = {};
function tiles(th) {
  if (TILEC[th]) return TILEC[th];
  const T = THEMES[th], [g, gd, gl] = T.g, [b, bd, bl] = T.b;
  const Q = sh => cnv(16, 16, f => {
    f('#7A3E00', 0, 0, 16, 16); f(sh ? '#FFC94A' : '#FFB627', 1, 1, 14, 14); f('#FFE08A', 1, 1, 14, 1); f('#FFE08A', 1, 1, 1, 14); f('#D9822B', 1, 14, 14, 1); f('#D9822B', 14, 1, 1, 14);
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => f('#7A3E00', x, y));
    const q = ['_###_', '##_##', '___##', '__##_', '__#__', '_____', '__#__'];
    q.forEach((r, y) => { for (let x = 0; x < 5; x++)if (r[x] === '#') f('#7A3E00', 6 + x, 5 + y) }); q.forEach((r, y) => { for (let x = 0; x < 5; x++)if (r[x] === '#') f('#FFFFFF', 5 + x, 4 + y) });
  });
  const lavaT = k => cnv(16, 16, f => { f('#FF7A1A', 0, 4, 16, 12); for (let x = 0; x < 16; x++) { const h = 2 + ((x + k * 4) % 8 < 4 ? 1 : 0) + ((x + k * 3) % 5 === 0 ? 1 : 0); f('#FFC23A', x, 4 - h + 2, 1, h) } f('#C8320A', 0, 12, 16, 4); f('#FFE08A', 3 + k * 5 % 10, 8, 2, 1); f('#FFE08A', 11 - k * 3 % 8, 10, 1, 1) });
  return TILEC[th] = {
    G: cnv(16, 16, f => { f(g, 0, 0, 16, 16); f(gl, 0, 0, 16, 1); f(gl, 0, 0, 1, 16); f(gd, 15, 0, 1, 16); f(gd, 0, 15, 16, 1); f(gd, 8, 1, 1, 6); f(gd, 1, 7, 7, 1); f(gl, 1, 8, 7, 1); f(gd, 9, 6, 6, 1); f(gl, 9, 7, 6, 1); f(gd, 4, 9, 1, 6); f(gl, 5, 9, 1, 5); f(gd, 11, 8, 1, 7); f(gl, 12, 8, 1, 5) }),
    B: cnv(16, 16, f => { f(b, 0, 0, 16, 16); f(bd, 0, 7, 16, 1); f(bd, 0, 15, 16, 1); f(bd, 7, 0, 1, 7); f(bd, 15, 0, 1, 7); f(bd, 3, 8, 1, 7); f(bd, 11, 8, 1, 7); f(bl, 0, 0, 7, 1); f(bl, 8, 0, 7, 1); f(bl, 0, 8, 3, 1); f(bl, 4, 8, 7, 1); f(bl, 12, 8, 3, 1) }),
    H: cnv(16, 16, f => { f(bd, 0, 0, 16, 16); f(bl, 0, 0, 15, 2); f(bl, 0, 0, 2, 15); f(b, 2, 2, 12, 12); f(mix(bd, b, .5), 14, 2, 2, 14); f(mix(bd, b, .5), 2, 14, 14, 2); f(bl, 4, 4, 8, 1); f(bd, 4, 11, 8, 1) }),
    U: cnv(16, 16, f => { f('#5A2E0A', 0, 0, 16, 16); f('#9C5A2A', 1, 1, 14, 14); f('#C47A3E', 1, 1, 14, 1); f('#C47A3E', 1, 1, 1, 14);[[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => f('#5A2E0A', x, y)) }),
    Y: cnv(16, 16, f => { f('#3A1A08', 0, 0, 16, 8); f('#C86F2C', 0, 1, 16, 5); f('#FCBC8C', 0, 1, 16, 1); f('#3A1A08', 3, 1, 1, 5); f('#3A1A08', 11, 1, 1, 5); f('#8A8AA6', 0, 8, 16, 1); for (let x = 0; x < 16; x += 4)f('#8A8AA6', x, 9, 2, 2) }),
    C: pix('cloudtile', ['___kkkk__kkkk___', '__kwwwwkkwwwwk__', '_kwwwwwwwwwwwwk_', 'kwwwwwwwwwwwwwwk', 'kwwwwwwwwwwwwwwk', 'kwwwwwwwwwwwwwwk', 'kbwwwwwwwwwwwwbk', '_kbbbwwwwwwbbbk_', '__kkkkkkkkkkkk__'], { k: '#C7A8E8', w: '#FFFFFF', b: '#FFD6EC' }),
    Q0: Q(0), Q1: Q(1), L0: lavaT(0), L1: lavaT(1), Lb: cnv(16, 16, f => { f('#FF6A12', 0, 0, 16, 16); f('#FF9A2A', 2, 3, 3, 2); f('#FF9A2A', 10, 9, 4, 2); f('#C8320A', 6, 13, 5, 2) }),
    lift: cnv(48, 8, f => { f('#6E2A08', 0, 0, 48, 8); f('#E0782C', 0, 1, 48, 6); f('#FCBC8C', 0, 1, 48, 1); for (let x = 3; x < 48; x += 6)f('#6E2A08', x, 3, 2, 2) })
  };
}
const HILL = cnv(48, 20, f => {
  for (let x = 0; x < 48; x++) { const d = Math.abs(x - 23.5) / 24, h = Math.round(Math.sqrt(Math.max(0, 1 - d * d)) * 19); if (h > 0) { f('#0B6B1A', x, 20 - h, 1, h); if (h > 1) f('#5CCB4C', x, 21 - h, 1, h - 1) } }
  [[16, 9], [27, 6], [31, 11], [20, 13]].forEach(([x, y]) => { f('#0B6B1A', x, y, 2, 3) });
});
function drawBg() {
  const T = THEMES[A.th], g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  const s = PX * sc, gy = oy + 13 * TS * sc, par = (k, per) => ((-(camX * sc * k)) % per + per) % per - per;
  if (T.bg === 'over' || T.bg === 'cloud') {
    if (T.bg === 'over') { const per = 330 * sc; for (let x = par(.45, per); x < cw + per; x += per) { ctx.drawImage(HILL, x, gy - HILL.height * s * 2, HILL.width * s * 2, HILL.height * s * 2); ctx.drawImage(HILL, x + 170 * sc, gy - HILL.height * s * 1.3, HILL.width * s * 1.3, HILL.height * s * 1.3) } }
    else for (let i = 0; i < 40; i++) { ctx.globalAlpha = .5 + .5 * Math.sin(S.tick * .04 + i); ctx.fillStyle = '#fff'; ctx.fillRect((i * 97) % cw, (i * 61) % Math.max(1, gy * .7), s, s) } ctx.globalAlpha = 1;
    const cl = pix(T.bg === 'over' ? 'cl' : 'clp', CLOUD, T.bg === 'over' ? PC : PCP);
    for (let i = 0; i < 7; i++) { const per = cw + 260 * sc, x = ((i * 271 * sc - camX * sc * .3 + S.tick * .2) % per + per) % per - 130 * sc, y = oy + (24 + (i * 53) % 150) * sc, k = i % 3 ? 2 : 3; ctx.drawImage(cl, x, y, cl.width * s * k, cl.height * s * k) }
  } else if (T.bg === 'under') {
    for (let i = 0; i < 30; i++) { const x = ((i * 137 - camX * sc * .3) % (cw + 60) + cw + 60) % (cw + 60) - 30, y = oy + (70 + (i * 71) % 300) * sc; ctx.globalAlpha = .25 + .35 * Math.abs(Math.sin(S.tick * .03 + i)); ctx.fillStyle = ['#7AA8FF', '#C9A8FF', '#FFB8E0'][i % 3]; ctx.fillRect(x, y, s * 2, s * 2); ctx.fillRect(x - s * 2, y + s * 2, s * 6, s * 2); ctx.fillRect(x, y + s * 4, s * 2, s * 2) } ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#2A1030'; const per = 240 * sc; for (let x = par(.2, per); x < cw + per; x += per) { const tw = 56 * sc, th = 200 * sc; ctx.fillRect(x, gy - th, tw, th); for (let k = 0; k < 4; k++)ctx.fillRect(x + k * 16 * sc, gy - th - 14 * sc, 8 * sc, 14 * sc); ctx.fillStyle = '#FF9A3A55'; ctx.fillRect(x + 22 * sc, gy - th * .7, 12 * sc, 18 * sc); ctx.fillStyle = '#2A1030' }
    const lg = ctx.createLinearGradient(0, gy - 120 * sc, 0, ch); lg.addColorStop(0, '#FF5A1A00'); lg.addColorStop(1, '#FF5A1A66'); ctx.fillStyle = lg; ctx.fillRect(0, gy - 120 * sc, cw, ch);
    for (let i = 0; i < 26; i++) { const x = (i * 89 + S.tick * .3 * (i % 3 + 1)) % cw, y = ch - ((S.tick * (.6 + i % 4 * .3) + i * 47) % (ch * .8)); ctx.fillStyle = ['#FFB36B', '#FF7A3D', '#FFE08A'][i % 3]; ctx.globalAlpha = .7; ctx.fillRect(x, y, s, s) } ctx.globalAlpha = 1;
  }
}
function drawTiles(c0, c1, rowsBelow) {
  const TL = tiles(A.th), fr = (S.tick >> 4) & 1;
  for (let c = c0; c <= c1; c++) {
    if (c < 0 || c >= A.w) continue;
    for (let r = 0; r < ROWS; r++) {
      const t = A.g[c][r]; if (t === '.' || t === 'P') continue;
      const b = A.bumps.find(q => q.c === c && q.r === r), dy = b ? -Math.round(Math.sin(b.t / 10 * Math.PI) * 4) * PX : 0, x = c * TS, y = r * TS + dy;
      if (t === '?') ctx.drawImage(TL[(S.tick >> 3) % 6 < 2 ? 'Q1' : 'Q0'], x, y, TS, TS);
      else if (t === 'L') ctx.drawImage(getT(A, c, r - 1) !== 'L' ? TL[fr ? 'L1' : 'L0'] : TL.Lb, x, y, TS, TS);
      else if (t === 'C') ctx.drawImage(TL.C, x, y, TS, TL.C.height * PX);
      else if (TL[t]) ctx.drawImage(TL[t], x, y, TS, TS);
    }
    if (A.g[c][14] === 'G') for (let r = ROWS; r < ROWS + rowsBelow; r++)ctx.drawImage(TL.G, c * TS, r * TS, TS, TS);
  }
}
function drawPipe(p) {
  const x = p.x * TS, y = p.top * TS, h = p.h * TS, K = '#0B3D10', D = '#137A2B', M = '#2DB84B', L = '#8CEB7A', W = '#E0FFD0';
  const body = [K, M, L, L, W, L, M, M, M, M, M, M, M, M, M, M, M, M, D, M, D, D, M, D, D, D, D, K];
  body.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + 4 + i * PX, y + 16, PX, h - 16) });
  const rim = [K, M, L, L, L, W, L, M, M, M, M, M, M, M, M, M, M, M, M, M, M, D, M, D, D, M, D, D, D, D, D, K];
  rim.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * PX, y, PX, 16) });
  ctx.fillStyle = K; ctx.fillRect(x, y, 64, PX); ctx.fillRect(x, y + 16 - PX, 64, PX);
  if (p.enter && p.to) blit(pix('arrow', ARROW, { k: '#7A3E00', y: '#FFD23F' }), x + 24, y - 22 + Math.round(Math.sin(S.tick * .12) * 2) * PX, PX);
}
function drawPlant(p) {
  const k = plantK(p); if (k <= 0) return;
  const img = (S.tick >> 3) & 1 ? pix('plant', PLANT, PPL) : pix('plantc', PLANT_C, PPL);
  blit(img, p.x * TS + 32 - 12, p.top * TS - Math.round(30 * k / PX) * PX, PX);
}
function drawEnemy(e) {
  const x = Math.round(e.x / PX) * PX, y = Math.round(e.y / PX) * PX;
  if (e.k === 'shroom') { const img = pix('walker', WALKER, PW); if (e.dead) { if (e.dead > 1) blit(img, x, y, PX, 0, 1, .45); return } blit(img, x, y, PX, (S.tick >> 3) & 1) }
  else if (e.k === 'spiky') { const img = pix('spiky', SPIKY, { v: '#7A4BD6', V: '#C8A8FF', S: '#FFC6DA', w: '#FFFFFF', k: '#1A1A1A', s: '#3A1E6E' }); if (e.dead) { if (e.dead > 1) blit(img, x, y, PX, 0, 1, .45); return } blit(img, x, y + ((S.tick >> 3) & 1) * PX, PX, e.vx > 0) }
  else { const pal = { b: '#3C7CF0', B: '#9CC8FF', w: '#FFFFFF', k: '#1A1A1A', y: '#FFB627', o: '#E45C10' }, img = (S.tick >> 3) & 1 ? pix('bird', BIRD, pal) : pix('bird2', BIRD2, pal); if (e.dead) { if (e.dead > 1) { ctx.globalAlpha = e.dead / 40; blit(img, x, y + (40 - e.dead), PX, e.f < 0); ctx.globalAlpha = 1 } return } blit(img, x, y, PX, e.f < 0) }
}
function hero(o) {   // nhân vật pixel: nhỏ / to / lửa · đứng / bước / nhảy
  const big = o.pw > 0, fr = !o.on ? 'J' : o.walk && (Math.floor(o.walk) & 1) ? 'W' : 'S';
  const rows = big ? { S: BG_S, W: BG_W, J: BG_J }[fr] : { S: SM_S, W: SM_W, J: SM_J }[fr];
  const star = o.star > 0, key = 'hero' + (big ? 'B' : 's') + fr + (o.pw === 2 ? 'F' : '') + (star ? 'st' + ((S.tick >> 2) % 5) : '') + o.c;
  const img = pix(key, rows, heroPal(o.c, o.pw === 2, star));
  ctx.globalAlpha = o.a || 1; blit(img, Math.round(o.x / PX) * PX, Math.round((o.y + o.h - img.height * PX) / PX) * PX, PX, o.f < 0); ctx.globalAlpha = 1;
  if (o.fz) { ctx.globalAlpha = .55; ctx.fillStyle = '#BFE8FF'; ctx.fillRect(o.x - 4, o.y - 4, 32, o.h + 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x - 2, o.y - 2, 6, 2); ctx.globalAlpha = 1 }
  if (o.sh) { ctx.globalAlpha = .4 + .2 * Math.sin(S.tick * .15); ctx.strokeStyle = '#7FD6FF'; ctx.lineWidth = 3; ctx.strokeRect(o.x - 6, o.y - 6, 36, o.h + 12); ctx.globalAlpha = 1 }
}
function coin(x, y, k) { const img = pix('coin', COIN, PCO), w = Math.max(.12, Math.abs(Math.cos(S.tick * .08 + k))); ctx.drawImage(img, Math.round(x + 10 - 7 * w), y + 3, 14 * w, 18) }
function drawItem(it) {
  if (it.got) return; const y = Math.round(it.y / PX) * PX;
  if (it.k === 'mush') blit(pix('mush', MUSH, P1U), it.x, y, PX);
  else if (it.k === 'grow') blit(pix('mushR', MUSH, PRM), it.x, y, PX);
  else if (it.k === 'flower') blit(pix('flower' + ((S.tick >> 3) & 1), FLOWER, (S.tick >> 3) & 1 ? PFL : Object.assign({}, PFL, { o: '#E52521', y: '#FFE08A' })), it.x, y, PX);
  else blit(pix('star' + ((S.tick >> 2) & 1), STAR, (S.tick >> 2) & 1 ? PST : { y: '#FFF3A0', k: '#1A1A1A' }), it.x + 1, y, PX);
}
function drawGoal() {
  const TL = tiles(A.th);
  if (A.flag) {
    const f = A.flag, gy = 13 * TS;
    ctx.fillStyle = '#137A2B'; ctx.fillRect(f.x - 2, f.top, 4, gy - f.top); ctx.fillStyle = '#8CEB7A'; ctx.fillRect(f.x - 2, f.top, 2, gy - f.top);
    ctx.fillStyle = '#0B3D10'; ctx.fillRect(f.x - 6, f.top - 10, 12, 12); ctx.fillStyle = '#2DB84B'; ctx.fillRect(f.x - 4, f.top - 8, 8, 8); ctx.fillStyle = '#8CEB7A'; ctx.fillRect(f.x - 4, f.top - 8, 4, 2);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = i === 0 || i === 13 ? '#1A1A1A' : '#FFFFFF'; ctx.fillRect(f.x - 4 - (14 - Math.abs(7 - i)) * 2 * 1.4, f.y + i * 2, (14 - Math.abs(7 - i)) * 2 * 1.4, 2) }
    blit(pix('starR', STAR, { y: '#E52521', k: '#FFFFFF' }), f.x - 30, f.y + 4, 1.6);
    ctx.drawImage(TL.H, f.x - 16, gy - TS, TS, TS);
    const c = A.castle.x;   // lâu đài nhỏ
    for (let i = 0; i < 5; i++)for (let r = 1; r <= 4; r++)ctx.drawImage(TL.B, c + i * TS, gy - r * TS, TS, TS);
    for (let i = 0; i < 5; i += 2)ctx.drawImage(TL.B, c + i * TS, gy - 5 * TS, TS, TS * .5);
    for (let i = 1; i < 4; i++)ctx.drawImage(TL.B, c + i * TS, gy - 6 * TS, TS, TS);
    for (let i = 1; i < 4; i += 2)ctx.drawImage(TL.B, c + i * TS, gy - 6.5 * TS, TS, TS * .5);
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(c + 2 * TS, gy - 1.5 * TS, TS, 1.5 * TS); ctx.fillRect(c + 2 * TS + 4, gy - 1.5 * TS - 4, TS - 8, 4); ctx.fillRect(c + 2 * TS + 8, gy - 1.5 * TS - 8, TS - 16, 4);
    ctx.fillRect(c + 1.3 * TS, gy - 5.5 * TS, 10, 14); ctx.fillRect(c + 3.4 * TS, gy - 5.5 * TS, 10, 14);
  }
  if (A.mid) { const x = A.mid.x, gy = 13 * TS; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(x, gy - 72, 4, 72); for (let i = 0; i < 10; i++) { ctx.fillStyle = cp && cp.mid ? '#2DB84B' : '#E52521'; ctx.fillRect(x + 4, gy - 72 + i * 2, (10 - Math.abs(5 - i)) * 3, 2) } }
  if (A.armory && !S.boss) { label('🔥 HỘP VŨ KHÍ', A.armory.x + 16, 9 * TS - 14, 13, '#FFD23F', '#1A1A1A') }
  if (A.axe && A.bridge && !A.bridge.on) { const a = A.axe; blit(pix('axe', AXE, { k: '#1A1A1A', w: '#D0D0E4', b: '#8A4B1E' }), a.x, a.y + Math.round(Math.sin(S.tick * .1)) * PX, PX * 2) }
  const B = A.boss;
  if (B && !B.dead) {
    const open = B.fireT < 22, img = pix(open ? 'dragonO' : 'dragon', open ? DRAGON_O : DRAGON, B.hurtT && (B.hurtT >> 1) & 1 ? { G: '#FFFFFF', p: '#FFFFFF', r: '#FFFFFF', w: '#FFFFFF', k: '#FFFFFF', o: '#FFFFFF', y: '#FFFFFF' } : PDR);
    const s = B.w / img.width; ctx.save(); if (B.fall) { ctx.translate(B.x + B.w / 2, B.y + B.h / 2); ctx.scale(1, -1); ctx.translate(-(B.x + B.w / 2), -(B.y + B.h / 2)) } blit(img, Math.round(B.x), Math.round(B.y + B.h - img.height * s), s, B.f > 0); ctx.restore();
    for (const f of A.ef) blit(pix('flame', FLAME, { o: '#E45C10', y: '#FFB627', w: '#FFF3B0' }), Math.round(f.x), Math.round(f.y), PX, f.vx > 0);
  }
  if (A.princess) {
    const P = A.princess, gy = P.y, t = S.tick, lift = Math.min(150, S.rescue * 2.2), hop = S.won ? Math.round(Math.abs(Math.sin(t * .14)) * 8) * PX : 0, bx = P.x - 3 * TS;
    for (let i = 0; i < 7; i++) { for (let r = 1; r <= 6; r++)ctx.drawImage(TL.B, bx + i * TS, gy - r * TS, TS, TS); if (i % 2 === 0) ctx.drawImage(TL.B, bx + i * TS, gy - 7 * TS, TS, TS * .6) }
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(P.x - 30, gy - 76, 60, 76); ctx.fillRect(P.x - 24, gy - 82, 48, 6); ctx.fillRect(P.x - 16, gy - 88, 32, 6);
    ctx.fillStyle = '#E52521'; ctx.fillRect(bx + 3.5 * TS - 2, gy - 10 * TS, 4, 3 * TS); for (let i = 0; i < 12; i++)ctx.fillRect(bx + 3.5 * TS + 2, gy - 10 * TS + i * 2, (12 - Math.abs(6 - i)) * 3, 2);
    const glow = ctx.createRadialGradient(P.x, gy - 40, 0, P.x, gy - 40, 80); glow.addColorStop(0, S.won ? '#FFD6ECCC' : '#FFF6C077'); glow.addColorStop(1, '#ffffff00'); ctx.fillStyle = glow; ctx.fillRect(P.x - 80, gy - 120, 160, 120);
    blit(pix('prin', PRIN, PPR), P.x - 12, gy - 32 - hop, PX);
    if (lift < 150) { ctx.globalAlpha = 1 - lift / 150; const cy = gy - lift; ctx.fillStyle = '#C8C8E0'; for (let k = 0; k <= 6; k++)ctx.fillRect(P.x - 28 + k * 9, cy - 60, 3, 60); ctx.fillStyle = '#8A8AA6'; ctx.fillRect(P.x - 32, cy - 64, 64, 6); ctx.fillRect(P.x - 32, cy - 4, 64, 4); ctx.globalAlpha = 1 }
    const msg = S.won ? 'Cảm ơn cậu! 💖' : B && !B.fall ? (Math.floor(t / 90) % 2 ? 'Cứu tớ với! 🆘' : 'Cẩn thận con rồng! 🐉') : 'Cậu hạ được rồng rồi! 🎉';
    ctx.font = '800 15px Nunito,sans-serif'; const mw = ctx.measureText(msg).width + 24, my = gy - 128;
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(P.x - mw / 2 - 2, my - 2, mw + 4, 34); ctx.fillStyle = '#fff'; ctx.fillRect(P.x - mw / 2, my, mw, 30); ctx.fillRect(P.x - 4, my + 30, 8, 6);
    ctx.fillStyle = '#E52521'; ctx.textAlign = 'center'; ctx.fillText(msg, P.x, my + 21);
    if (S.won && t % 12 === 0) parts.push({ x: P.x + (Math.random() - .5) * 60, y: gy - 60, vx: (Math.random() - .5) * 1.2, vy: -2 - Math.random() * 1.5, r: 4, l: 70, L: 70, c: GC.pick(['#E52521', '#FF7EB6', '#FFD23F']), heart: 1, g: -.01 });
  }
}
function drawDeco() {   // bụi cây pixel trên mặt đất
  if (!A.deco) return; const bu = pix('bush', CLOUD, PBU);
  for (const d of A.deco) { const x = d.x * TS; if (x > camX - 120 && x < camX + vw + 20) ctx.drawImage(bu, x, 13 * TS - bu.height * PX * (d.k + 1) + 2, bu.width * PX * (d.k + 1), bu.height * PX * (d.k + 1)) }
}
function draw() {
  const wk = S.level + '-' + AI, TL = tiles(A.th), B = A.boss;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false; drawBg();
  const cxs = Math.round(camX * sc * dpr) / (sc * dpr);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -cxs * sc * dpr, Math.round(oy * dpr)); ctx.imageSmoothingEnabled = false;
  const c0 = Math.floor(camX / TS) - 1, c1 = Math.ceil((camX + vw) / TS) + 1, below = Math.ceil((ch - oy) / sc / TS) - ROWS + 1;
  drawDeco();
  for (const it of A.items) if (it.rise > 0) drawItem(it);   // vật phẩm đang trồi lên nằm sau khối
  for (const p of A.pipes) if (p.x >= c0 - 2 && p.x <= c1) drawPlant(p);
  drawTiles(c0, c1, Math.max(0, below));
  for (const p of A.pipes) if (p.x >= c0 - 2 && p.x <= c1) drawPipe(p);
  drawGoal();
  for (const L of A.lifts) ctx.drawImage(TL.lift, Math.round(L.x / PX) * PX, L.y, L.w, 16);
  for (const c of A.coins) if (!c.got && c.x > camX - 40 && c.x < camX + vw + 40) coin(c.x, c.y, c.x);
  for (const it of A.items) if (it.rise <= 0) drawItem(it);
  const fire = pix('fire', FIRE, { o: '#C8320A', y: '#FF9A1A', w: '#FFE08A' });
  for (const b of A.bars) for (let i = 0; i <= b.n; i++) { const fx = b.cx + Math.cos(b.a) * i * 14, fy = b.cy + Math.sin(b.a) * i * 14, s = i ? PX * .9 : PX * .7; ctx.drawImage(fire, Math.round(fx - 4 * s), Math.round(fy - 4 * s), 8 * s, 8 * s) }
  for (const f of FB) { ctx.save(); ctx.translate(Math.round(f.x + 4), Math.round(f.y + 4)); ctx.rotate(Math.floor(S.tick / 4) * Math.PI / 2); ctx.drawImage(fire, -6, -6, 12, 12); ctx.restore() }
  for (const e of A.en) if (e.act && e.x > camX - 60 && e.x < camX + vw + 60) drawEnemy(e);
  const now = S.now();
  for (const id in S.ghosts) {
    const g = S.ghosts[id]; if (g.wk !== wk) { g.x = null; continue }
    if (g.x == null) { g.x = g.tx; g.y = g.ty } const dx = g.tx - g.x; g.x += dx * .2; g.y += (g.ty - g.y) * .2; if (Math.abs(dx) > .3) g.walk = (g.walk || 0) + .12;
    const gh = g.pw ? H_BIG : H_SMALL;
    hero({ x: g.x, y: g.y, h: gh, f: g.f, c: g.c, pw: g.pw || 0, on: Math.abs(g.ty - g.y) < 2, walk: Math.abs(dx) > .3 ? g.walk : 0, a: .55, fz: g.fz > now, sh: g.sh > now }); label(g.n, g.x + 12, g.y - 8, 12, '#fff', mix(g.c, '#1a1033', .5));
  }
  if (!(pl.inv && (S.tick >> 2) & 1)) hero({ x: pl.x, y: pl.y, h: pl.h, f: pl.face, c: S.color, pw: pl.pw, star: pl.star, on: pl.on || (pl.auto && pl.auto.ph === 'walk'), walk: (pl.on || pl.auto) && Math.abs(pl.vx) > .4 ? pl.walk * .4 : 0, fz: now < S.fz, sh: now < S.sh });
  if (pl.pipe) drawPipe(pl.pipe.p);   // chui vào trong ống
  if (S.name) label(S.name, pl.x + 12, pl.y - 8, 13, '#fff', '#1a1033');
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x + 12, y = pl.y - 38 + Math.round(Math.sin(S.tick * .1) * 2) * PX; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(cx - 28, y - 24, 56, 28); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 26, y - 22, 52, 24); ctx.font = '10px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#E52521'; ctx.fillText('⚡0!', cx, y - 5) }
  for (const q of parts) { ctx.globalAlpha = Math.max(0, q.l / q.L); ctx.fillStyle = q.c; if (q.heart) { const s = 3;[[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]].forEach(([a, b]) => ctx.fillRect(Math.round(q.x) + a * s, Math.round(q.y) + b * s, s, s)) } else ctx.fillRect(Math.round(q.x - q.r), Math.round(q.y - q.r), q.r * 2, q.r * 2) } ctx.globalAlpha = 1;
  for (const p of pops) { ctx.globalAlpha = Math.min(1, p.t / 12); coin(p.x - 10, p.y - (30 - p.t) * 1.6, p.t); ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; if (p.t < 20) ctx.fillText('+3⚡', p.x, p.y - 34 - (20 - p.t)) } ctx.globalAlpha = 1;
  // bảng WORLD kiểu NES góc phải + thanh máu rồng
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  const T = THEMES[A.th], w1 = AI ? 'BONUS' : 'WORLD 1-' + (S.level + 1), sub = AI ? (A.bonusName || '🪙 Hầm bí mật') : T.ic + ' ' + T.name;
  ctx.font = '11px "Press Start 2P",monospace'; const tw = Math.max(ctx.measureText(w1 + '  ×00').width + 34, 180), bx = cw - tw - 12;
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(bx - 3, 8, tw + 6, 50); ctx.fillStyle = '#ffffffee'; ctx.fillRect(bx, 11, tw, 44);
  ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(w1, bx + 10, 28);
  ctx.drawImage(pix('coin', COIN, PCO), bx + tw - 62, 16, 10, 13); ctx.fillText('×' + String(S.coins).padStart(2, '0'), bx + tw - 48, 28);
  ctx.font = '800 12px Nunito,sans-serif'; ctx.fillStyle = '#5D6B85'; ctx.fillText(sub + (pl.pw === 2 ? '  · 🔥 F bắn' : pl.pw ? '  · 🍄 to' : ''), bx + 10, 47);
  const bw = tw, by = 62; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(bx - 1, by - 1, bw + 2, 8); ctx.fillStyle = '#ffffff99'; ctx.fillRect(bx, by, bw, 6); ctx.fillStyle = '#E52521'; ctx.fillRect(bx, by, bw * prog(), 6);
  for (let i = 1; i < NL; i++) { ctx.fillStyle = '#1A1A1A'; ctx.fillRect(bx + bw * i / NL - 1, by - 2, 2, 10) }
  if (B && B.act && !B.fall) {
    const W2 = Math.min(360, cw * .6), x2 = (cw - W2) / 2; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(x2 - 3, 10, W2 + 6, 38); ctx.fillStyle = '#ffffffee'; ctx.fillRect(x2, 13, W2, 32);
    ctx.font = '800 14px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText('🐉 Rồng lửa', x2 + 8, 34);
    const hx = x2 + 104, hw = W2 - 114; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(hx - 2, 22, hw + 4, 14); for (let i = 0; i < B.max; i++) { ctx.fillStyle = i < B.hp ? '#E52521' : '#5D6B85'; ctx.fillRect(hx + i * hw / B.max + 1, 24, hw / B.max - 2, 10) }
  }
  if (banner && banner.t > 0) {
    banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.textAlign = 'center';
    ctx.font = '26px "Press Start 2P",monospace'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(banner.w, cw / 2 + 3, ch * .36 + 3); ctx.fillStyle = '#fff'; ctx.fillText(banner.w, cw / 2, ch * .36);
    label(banner.text, cw / 2, ch * .36 + 40, 22, '#FFD23F', '#1A1A1A'); ctx.globalAlpha = 1;
  }
}
function camera(k) {
  const max = Math.max(0, A.w * TS - vw), tx = clamp(pl.x - vw * .38, 0, max);
  camX += (tx - camX) * k; if (A.w * TS < vw) camX = (A.w * TS - vw) / 2;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / (ROWS * TS), cw / (12 * TS)); vw = cw / sc; oy = Math.max(0, (ch - ROWS * TS * sc) * .55) }
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } }
  else { acc = 0; S.tick++; for (const L of A.lifts) { L.x = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)) } for (const b of A.bars) b.a += b.sp }
  if (S.won) S.rescue++;
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += q.g ?? .12; if (--q.l <= 0) parts.splice(i, 1) }
  for (let i = pops.length - 1; i >= 0; i--)if (--pops[i].t <= 0) pops.splice(i, 1);
  camera(.14); draw();
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: ← → chạy · ↑ nhảy (giữ = cao) · ↓ chui ống · F bắn lửa ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j', ArrowDown: 'd', s: 'd', S: 'd', f: 'f', F: 'f', x: 'f', X: 'f', Shift: 'f' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = keys.d = keys.f = 0 });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j'], ['bD', 'd'], ['bF', 'f']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  loadLevel(0);
  addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.j = keys.d = keys.f = 0 }
function place(x, y, old) {
  const lv = old && old.lvl != null ? old.lvl : 0; S.coins = old && old.cn || 0; if (lv !== S.level) loadLevel(lv);
  if (old && old.pw) setPower(old.pw);
  pl.x = Math.max(TS, x); pl.y = Math.min(y, 11 * TS); pl.vx = pl.vy = 0; if (old && old.mid && A.mid) cp = { x: A.mid.x, y: 13 * TS - pl.h, mid: true }; camX = Math.max(0, pl.x - vw * .38);
}
function measure() { return 1000 }
const label2 = () => S.won ? '👸 Đã cứu công chúa' : 'Màn ' + (S.level + 1) + '/' + NL + ' · ' + (AI ? '🪙 hầm bí mật' : Math.round(clamp(pl.x / Math.max(1, LVL.areas[0].end || 1), 0, 1) * 100) + '%') + (S.boss ? ' · 🐉 hạ rồng' : '');
function extra() { return { lvl: S.level, wk: S.level + '-' + AI, cn: S.coins, lb: label2(), mid: cp && cp.mid ? 1 : 0, pw: pl.pw } }
function hud() { return (S.won ? '👸 Phá đảo' : '🏁 Màn ' + (S.level + 1) + '/' + NL) + ' · 🪙 ' + S.coins }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: 12 * TS, kind: 'brick', NL };
})();
