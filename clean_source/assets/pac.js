/* pac.js — game "Pac-Man" (phong cách arcade năm xưa): ăn hết chấm trong mê cung để qua màn, 5 màn 5 mê cung khác nhau.
   4 con ma cổ điển mỗi con một tính (đỏ đuổi thẳng · hồng chặn đầu · xanh đánh kẹp · cam lúc đuổi lúc né) + quái lạ:
   ma tàng hình (màn 2) · nhện giăng tơ làm chậm (màn 3) · rắn dài thân cũng cắn (màn 4) · quỷ dịch chuyển (màn 5).
   Viên năng lượng → ma hoá xanh, ăn được · trái cây thưởng ⚡ · 5 mạng, hết mạng chơi lại màn đang chơi.
   Cùng giao diện với Climb/Brick/Tank/Bomb: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'pac' */
window.Pac = (function () {
const { clamp, rng } = GC;
const T = 16, COLS = 28, ROWS = 31, MW = COLS * T, MH = ROWS * T, HT = 28, HB = 28, NL = 5, LIVES = 5;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], ES = 1.5;   // ES: phóng to nhân vật cho học sinh dễ nhìn (to hơn ô đường đi như arcade)   // 0 lên · 1 phải · 2 xuống · 3 trái
/* 5 mê cung (nửa trái 14 cột, lật gương thành 28) · # tường · . chấm · o viên năng lượng · - cửa chuồng ma */
const MAZES = [
  ['##############', '#............#', '#.####.#####.#', '#o####.#####.#', '#.####.#####.#', '#.............', '#.####.##.####', '#.####.##.####', '#......##....#', '######.##### #', '######.##### #', '######.##     ', '######.## ###-', '######.## #   ', '      .   #   ', '######.## #   ', '######.## ####', '######.##     ', '######.## ####', '######.## ####', '#............#', '#.####.#####.#', '#.####.#####.#', '#o..##....... ', '###.##.##.####', '###.##.##.####', '#......##....#', '#.##########.#', '#.##########.#', '#.............', '##############'],
  ['##############', '#.............', '#.####.#####.#', '#o####.#####.#', '#.####.#####..', '#............#', '#.##.####.##.#', '#.##.####.##.#', '#.............', '######.##### #', '######.##### #', '######.##     ', '######.## ###-', '######.## #   ', '      .   #   ', '######.## #   ', '######.## ####', '######.##     ', '######.## ####', '######.## ####', '#.........##..', '#.###.##.###.#', '#.###.##.###.#', '#o##..##..##. ', '#.##.####.##.#', '#.##.####.##.#', '#.........##.#', '#.####.##.##..', '#.####.##.##.#', '#............#', '##############'],
  ['##############', '#............#', '#.####.#####.#', '#o####.#####.#', '#.####.#####..', '#......##....#', '#.##.####.##.#', '#.##.####.##.#', '#.............', '######.##### #', '######.##### #', '######.##     ', '######.## ###-', '######.## #   ', '      .   #   ', '######.## #   ', '######.## ####', '######.##     ', '######.## ####', '######.## ####', '#......##.##..', '#.###.###.##.#', '#.###.###.##.#', '#o....###.... ', '###.##....##.#', '###.##.##.##.#', '#...##.##....#', '#.####.##.##.#', '#.####.##.##.#', '#.........##..', '##############'],
  ['##############', '#............#', '#.####.#####.#', '#o####.#####..', '#.####.#####.#', '#............#', '#.#####.####.#', '#.#####.####..', '#............#', '######.##### #', '######.##### #', '######.##     ', '######.## ###-', '######.## #   ', '      .   #   ', '######.## #   ', '######.## ####', '######.##     ', '######.## ####', '######.## ####', '#.............', '#.##########.#', '#.##########.#', '#o........... ', '##.##.######.#', '##.##.######.#', '#..##.....##.#', '#.####.##.##..', '#.####.##.##.#', '#......##....#', '##############'],
  ['##############', '#............#', '#.####.#####..', '#o####.#######', '#.####.#######', '#......##....#', '#.###.###.##..', '#.###.###.##.#', '#.........##.#', '######.##### #', '######.##### #', '######.##     ', '######.## ###-', '######.## #   ', '      .   #   ', '######.## #   ', '######.## ####', '######.##     ', '######.## ####', '######.## ####', '#.........##..', '#.####.#####.#', '#.####.#####.#', '#o........... ', '###.###.######', '###.###.######', '#.......##....', '#.####.###.###', '#.####.###.###', '#.............', '##############'],
];
const THEMES = [   // màu tường mỗi màn: [viền ngoài, viền trong]
  { name: 'Mê cung cổ điển', ic: '🟦', wall: ['#2121DE', '#5A5AFF'], dot: '#FFB8AE' },
  { name: 'Mê cung kẹo hồng', ic: '🍬', wall: ['#E8457A', '#FF9CC8'], dot: '#FFE0EC' },
  { name: 'Mê cung hoàng hôn', ic: '🌇', wall: ['#E8781E', '#FFC16B'], dot: '#FFF0C8' },
  { name: 'Mê cung rừng rắn', ic: '🌿', wall: ['#2DB84B', '#8CEB7A'], dot: '#E8FFD8' },
  { name: 'Mê cung quỷ tím', ic: '👹', wall: ['#8B4FE0', '#C9A8FF'], dot: '#F1E8FF' }];
const LVS = {
  1: { sp: 1.45, gs: .82, fright: 480, extra: 1, cost: { walk: .19, dot: .25, power: 5, fruit: 15, ghost: 6 } },   // 1 câu đúng (100⚡) ≈ 10 giây chạy
  2: { sp: 1.6, gs: .92, fright: 360, extra: 2, cost: { walk: .23, dot: .25, power: 5, fruit: 15, ghost: 6 } },   // ≈ 8 giây
  3: { sp: 1.7, gs: 1.0, fright: 270, extra: 3, cost: { walk: .28, dot: .25, power: 5, fruit: 15, ghost: 6 } } };   // ≈ 6,5 giây
const EXTRAS = [[], ['phantom'], ['spider', 'phantom'], ['snake', 'spider', 'phantom'], ['demon', 'snake', 'phantom']];
const GH = {   // tên · màu · góc tản ra
  blinky: { col: '#FF2A2A', name: 'Đỏ', home: [-3, 25] }, pinky: { col: '#FFB8DE', name: 'Hồng', home: [-3, 2] },
  inky: { col: '#38E8FF', name: 'Xanh', home: [33, 27] }, clyde: { col: '#FFB852', name: 'Cam', home: [33, 0] },
  phantom: { col: '#E8E8FF', name: 'Ma tàng hình', home: [14, 14] }, spider: { col: '#9B5CE0', name: 'Nhện', home: [30, 14] },
  snake: { col: '#3FD26B', name: 'Rắn', home: [-3, 14] }, demon: { col: '#FF4D7A', name: 'Quỷ', home: [14, 0] } };
const FRUITS = ['cherry', 'strawberry', 'orange', 'apple', 'melon'];
const FR = {
  cherry: [['______gg____', '_____g_g____', '____g___g___', '___g____g___', '__rr____g___', '_rrwr__rr___', '_rrrr_rrwr__', '__rr__rrrr__', '_______rr___'], { g: '#2DB84B', r: '#FF2A2A', w: '#FFFFFF' }],
  strawberry: [['____gggg____', '___gggggg___', '__rrrrrrrr__', '_rrwrrrwrrr_', '_rrrrrrrrrr_', '_rwrrrwrrwr_', '__rrrrrrrr__', '___rwrrrr___', '____rrrr____', '_____rr_____'], { g: '#2DB84B', r: '#FF2A2A', w: '#FFE8A0' }],
  orange: [['_____g______', '____gg______', '___oooooo___', '__oooooooo__', '_oowoooooooo', '_oooooooooo_', '_oooooooooo_', '__oooooooo__', '___oooooo___'], { g: '#2DB84B', o: '#FF9A1A', w: '#FFE0A0' }],
  apple: [['_____b______', '____b__gg___', '__rrrbrrr___', '_rwrrrrrrr__', '_rrrrrrrrr__', '_rrrrrrrrr__', '__rrrrrrrr__', '___rr__rr___'], { b: '#8A4B1E', g: '#2DB84B', r: '#E8202A', w: '#FFFFFF' }],
  melon: [['_____gg_____', '___gGgGgg___', '__gGgGgGgg__', '_gGgGgGgGgg_', '_ggGgGgGgGg_', '_gGgGgGgGgg_', '__gGgGgGgg__', '___ggGgGg___', '_____gg_____'], { g: '#2DB84B', G: '#B5F5B5' }] };
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#FFE135', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0, c: 14, r: 23, p: 8, dir: 3, want: -1, face: -1, moving: false, mouth: 0 };
const keys = { l: 0, r: 0, u: 0, d: 0, order: [] };
let needJ = false, seed0 = 1, lvSel = 2, grid = [], dots = 0, dotsLeft = 0, ghosts = [], webs = [], fruit = null, fruitsShown = 0, score = 0, best = 0, phase = 'ready', phT = 0, fright = 0, frightK = 0, modeT = 0, waka = 0, pops = [], banner = null, emptyT = 0, seen = {}, eatenGot = [];
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0, mazeImg = null, mazeWhite = null;

/* ═════ mê cung ═════ */
const wrapC = c => ((c % COLS) + COLS) % COLS;
const at = (c, r) => r < 0 || r >= ROWS ? '#' : grid[r][wrapC(c)];
const cx = c => c * T + T / 2;
function buildLevel(li) {
  const m = MAZES[li % MAZES.length]; grid = m.map(r => (r + r.split('').reverse().join('')).split(''));
  dots = 0; for (const row of grid) for (const ch of row) if (ch === '.' || ch === 'o') dots++;
  dotsLeft = dots; webs = []; fruit = null; fruitsShown = 0; mazeImg = drawMaze(THEMES[li].wall, '#000000'); mazeWhite = drawMaze(['#FFFFFF', '#FFFFFF'], '#000000');
}
function drawMaze(cols, bg) {   // vẽ sẵn tường kiểu arcade: 2 đường viền song song bám theo mép hành lang
  const c = document.createElement('canvas'); c.width = MW; c.height = MH; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, MW, MH);
  const W = (cc, rr) => rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS ? true : grid[rr][cc] === '#';
  const insets = [[3, cols[0], 2], [7, cols[1], 1.5]];
  for (const [ins, col, lw] of insets) {
    x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath();
    for (let r = 0; r < ROWS; r++)for (let cc = 0; cc < COLS; cc++) {
      if (!W(cc, r)) continue;
      const x0 = cc * T, y0 = r * T, x1 = x0 + T, y1 = y0 + T, up = !W(cc, r - 1), dn = !W(cc, r + 1), lf = !W(cc - 1, r), rt = !W(cc + 1, r);
      if (r === 0 && !dn && !lf && !rt) continue;
      if (up) { x.moveTo(lf ? x0 + ins : x0, y0 + ins); x.lineTo(rt ? x1 - ins : x1, y0 + ins) }
      if (dn) { x.moveTo(lf ? x0 + ins : x0, y1 - ins); x.lineTo(rt ? x1 - ins : x1, y1 - ins) }
      if (lf) { x.moveTo(x0 + ins, up ? y0 + ins : y0); x.lineTo(x0 + ins, dn ? y1 - ins : y1) }
      if (rt) { x.moveTo(x1 - ins, up ? y0 + ins : y0); x.lineTo(x1 - ins, dn ? y1 - ins : y1) }
      // góc lõm: 2 cạnh là tường nhưng ô chéo trống
      const corner = (wa, wb, dg, px, py, sx, sy) => { if (!wa && !wb && dg) { x.moveTo(px + sx * ins, py); x.lineTo(px + sx * ins, py + sy * ins); x.lineTo(px, py + sy * ins) } };
      corner(up, lf, !W(cc - 1, r - 1), x0, y0, 1, 1); corner(up, rt, !W(cc + 1, r - 1), x1, y0, -1, 1);
      corner(dn, lf, !W(cc - 1, r + 1), x0, y1, 1, -1); corner(dn, rt, !W(cc + 1, r + 1), x1, y1, -1, -1);
    }
    x.stroke();
  }
  x.fillStyle = '#FFB8DE'; x.fillRect(13 * T, 12 * T + 6, 2 * T, 4);   // cửa chuồng ma
  return c;
}
const canGo = (c, r, who) => { const ch = at(c, r); if (ch === '#') return false; if (ch === '-') return !!who && (who.st === 'leave' || who.st === 'enter'); return true };

/* ═════ dựng màn ═════ */
function newGhost(k, i) {
  const inside = k !== 'blinky', pos = inside ? [[13, 14], [11, 14], [16, 14], [12, 14], [15, 14], [14, 14]][i % 6] : [13, 11];
  return { k, c: pos[0], r: pos[1], p: 0, dir: inside ? 0 : 3, st: inside ? 'house' : 'out', rel: [0, 60, 240, 420, 600, 760, 900, 1040][i] || 900 + i * 120, fr: 0, trail: [], tp: 420, warn: null, web: 200 + i * 37, bob: i };
}
function resetActors() {
  pl.c = 14; pl.r = 23; pl.p = 8; pl.dir = 3; pl.want = -1; pl.moving = false; pl.face = -1; place2(pl);
  const list = ['blinky', 'pinky', 'inky', 'clyde'].concat(EXTRAS[S.level].slice(0, LVC.extra));
  ghosts = list.map((k, i) => newGhost(k, i)); ghosts.forEach(place2); fright = 0; modeT = 0;
  for (const g of ghosts) if (!['blinky', 'pinky', 'inky', 'clyde'].includes(g.k) && !seen[g.k]) { seen[g.k] = 1; setTimeout(() => S.hooks.onPower && S.hooks.onPower('p_' + g.k), 2600) }
}
function loadLevel(li, keepDots) {
  S.level = li; if (!keepDots) buildLevel(li); resetActors();
  phase = 'ready'; phT = 150; banner = { t: 150, w: 'Màn ' + (li + 1), text: THEMES[li].ic + ' ' + THEMES[li].name };
  needJ = true; GC.music.hush(false); GC.music.scene('play', true);
}
function place2(o) { o.x = cx(o.c) + DX[o.dir] * o.p; o.y = cx(o.r) + DY[o.dir] * o.p }
const prog = () => S.won ? 1 : clamp((S.level + (dots ? 1 - dotsLeft / dots : 0)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ âm thanh: tiếng "waka" ăn chấm, ăn ma, viên năng lượng, nhạc mở màn (tự soạn) ═════ */
const tone = GC.tone;
function jingle() { [[523, 0], [659, .12], [784, .24], [1047, .36], [988, .54], [784, .66], [880, .84], [1047, 1.02], [1319, 1.2]].forEach(([f, t]) => tone(f, .16, 'square', .045, 0, t)); [[131, 0], [196, .36], [175, .72], [262, 1.08]].forEach(([f, t]) => tone(f, .3, 'triangle', .1, 0, t)) }
function sWaka() { waka ^= 1; if (waka) tone(500, .07, 'triangle', .07, 230); else tone(230, .07, 'triangle', .07, 500) }
function sPower() { tone(300, .35, 'square', .05, 900); tone(600, .35, 'triangle', .06, 1400, .05) }
function sGhost() { tone(240, .28, 'square', .06, 1800) }

/* ═════ di chuyển trên lưới ═════ */
function stepEnt(o, sp, choose) {   // o.c,o.r = ô đang rời · o.p = đã đi được bao nhiêu px về phía ô kế
  let rem = sp;
  while (rem > 0) {
    if (o.p === 0 && o.stop) return;
    const need = T - o.p;
    if (rem < need) { o.p += rem; rem = 0; break }
    rem -= need; o.p = 0; o.c = wrapC(o.c + DX[o.dir]); o.r += DY[o.dir];
    choose(o);
    if (o.stop) break;
  }
  place2(o);
}
/* em: rẽ ngay khi tới giữa ô · quay đầu được giữa chừng */
function pacChoose(o) {
  o.stop = false;
  if (o.want >= 0 && canGo(o.c + DX[o.want], o.r + DY[o.want])) o.dir = o.want;
  if (!canGo(o.c + DX[o.dir], o.r + DY[o.dir])) o.stop = true;
  eatAt(o.c, o.r);
}
function eatAt(c, r) {
  const ch = at(c, r); if (ch !== '.' && ch !== 'o') return;
  grid[r][wrapC(c)] = ' '; dotsLeft--;
  if (ch === '.') { score += 10; S.energy += COST.dot; sWaka() }
  else { score += 50; S.energy += COST.power; sPower(); frighten() }
  const eaten = dots - dotsLeft;
  if ((eaten === 70 || eaten === 170) && !fruit) { fruit = { k: FRUITS[S.level % 5], t: 560 }; fruitsShown++ }
  if (dotsLeft <= 0) { phase = 'clear'; phT = 150; GC.music.hush(true); GC.sfx('flag') }
}
function frighten() {
  fright = Math.round(LVC.fright * Math.pow(.86, S.level)); frightK = 0;
  for (const g of ghosts) if (g.st === 'out') { g.fz = 1; g.dir = (g.dir + 2) % 4; g.p = T - g.p; g.c = wrapC(g.c - DX[g.dir]); g.r -= DY[g.dir]; place2(g) }
  for (const g of ghosts) if (g.st === 'house' || g.st === 'leave') g.fz = 1;
  GC.music.scene('power', true);
}
const isChase = () => { const s = [420, 1200, 420, 1200, 300, 1200, 300]; let t = modeT; for (let i = 0; i < s.length; i++) { if (t < s[i]) return i % 2 === 1; t -= s[i] } return true };
function targetOf(g) {
  if (g.st === 'eyes') return [11, 13];
  const pc = pl.c, pr = pl.r, home = GH[g.k].home;
  if (g.k === 'phantom' || g.k === 'snake' || g.k === 'demon') return [pr, pc];   // quái lạ luôn đuổi
  if (!isChase()) return home;
  if (g.k === 'blinky') return [pr, pc];
  if (g.k === 'pinky') return [pr + DY[pl.dir] * 4, pc + DX[pl.dir] * 4];
  if (g.k === 'inky') { const b = ghosts[0], ar = pr + DY[pl.dir] * 2, ac = pc + DX[pl.dir] * 2; return [ar * 2 - b.r, ac * 2 - b.c] }
  if (g.k === 'clyde') return (g.r - pr) ** 2 + (g.c - pc) ** 2 > 64 ? [pr, pc] : home;
  return [pr, pc];
}
function ghostChoose(g) {
  if (g.st === 'eyes' && g.r === 11 && (g.c === 13 || g.c === 14)) { g.st = 'enter'; g.c = 13; g.dir = 2; return }
  if (g.st === 'enter') { if (g.r >= 14) { g.st = 'leave'; g.fz = 0; g.dir = 0 } return }
  if (g.st === 'leave') { if (g.r <= 11) { g.st = 'out'; g.dir = 3 } else g.dir = g.c < 13 ? 1 : g.c > 13 ? 3 : 0; return }
  const rev = (g.dir + 2) % 4, opts = [];
  for (const d of [0, 3, 2, 1]) if (d !== rev && canGo(g.c + DX[d], g.r + DY[d], g)) opts.push(d);
  if (!opts.length) { g.dir = rev; return }
  if ((g.fz && g.st === 'out') || g.k === 'spider') { g.dir = opts[Math.floor(Math.random() * opts.length)]; return }
  const [tr, tc] = targetOf(g); let bd = 1e9;
  for (const d of opts) { const dr = g.r + DY[d] - tr, dc = g.c + DX[d] - tc, dd = dr * dr + dc * dc; if (dd < bd) { bd = dd; g.dir = d } }
}
function ghostSpeed(g) {
  const base = LVC.sp * LVC.gs * (1 + S.level * .04);
  if (g.st === 'eyes' || g.st === 'enter') return 3.2;
  if (g.st === 'leave') return 1;
  if (g.fz) return base * .55;
  if (g.r === 14 && (g.c <= 5 || g.c >= 22)) return base * .5;   // chậm trong đường hầm
  return base * ({ phantom: .9, spider: .75, snake: .82, demon: .85 }[g.k] || 1) * (g.k === 'blinky' && dotsLeft < 30 ? 1.12 : 1);
}

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++;
  for (const p of pops) p.t--; pops = pops.filter(p => p.t > 0);
  if (phase === 'ready') { if (needJ) { needJ = false; jingle() } if (--phT <= 0) phase = 'play'; return }
  if (phase === 'dying') { if (--phT <= 0) afterDeath(); return }
  if (phase === 'over') { if (--phT <= 0) { S.lives = LIVES; loadLevel(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chơi lại Màn ' + (S.level + 1) + ' (không phải từ Màn 1) — có ' + LIVES + ' mạng mới, cố lên!') } return }
  if (phase === 'won') return;
  if (phase === 'clear') { if (--phT <= 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NL - 1) { S.won = true; phase = 'won'; S.hooks.onWin && S.hooks.onWin() } else loadLevel(S.level + 1) } return }
  // em
  const dk = keys.order.length ? keys.order[keys.order.length - 1] : null, want = { u: 0, r: 1, d: 2, l: 3 }[dk];
  if (want !== undefined) pl.want = want;
  const can = S.energy > 0 && !frozen();
  pl.moving = false;
  if (can && pl.want >= 0) {
    if (pl.stop || (pl.p === 0 && pl.dir !== pl.want)) { if (canGo(pl.c + DX[pl.want], pl.r + DY[pl.want])) { pl.dir = pl.want; pl.stop = false } }
    else if (pl.want === (pl.dir + 2) % 4 && pl.p > 0) { pl.c = wrapC(pl.c + DX[pl.dir]); pl.r += DY[pl.dir]; pl.p = T - pl.p; pl.dir = pl.want }   // quay đầu giữa chừng
    if (!pl.stop && canGo(pl.c + DX[pl.dir], pl.r + DY[pl.dir])) {
      const onWeb = webs.some(w => w.c === Math.round((pl.x - T / 2) / T) && w.r === Math.round((pl.y - T / 2) / T));
      stepEnt(pl, LVC.sp * (fright ? 1.1 : 1) * (onWeb ? .45 : 1), pacChoose); pl.moving = true; pl.mouth += .25; use(COST.walk);
      if (onWeb && S.tick % 40 === 0) S.hooks.onPower && S.hooks.onPower('p_web');
    } else if (pl.p === 0) pl.stop = true;
    pl.face = pl.dir;
  }
  // ma
  if (!fright) modeT++;
  if (fright > 0 && --fright === 0) { for (const g of ghosts) g.fz = 0; GC.music.scene('play') }
  for (const g of ghosts) {
    g.fr = (S.tick >> 3) & 1;
    if (g.st === 'house') { if (--g.rel <= 0) { g.st = 'leave'; g.dir = g.c < 13 ? 1 : g.c > 13 ? 3 : 0; g.p = 0 } else { g.y = cx(g.r) + Math.sin(S.tick * .12 + g.bob) * 3; g.x = cx(g.c); continue } }
    if (g.k === 'demon' && g.st === 'out' && !g.fz) demonStep(g);
    if (g.k === 'spider' && g.st === 'out' && --g.web <= 0) { g.web = 220; if (!webs.some(w => w.c === g.c && w.r === g.r)) { webs.push({ c: g.c, r: g.r, t: 900 }); if (webs.length > 7) webs.shift() } }
    if (g.warn) continue;
    stepEnt(g, ghostSpeed(g), ghostChoose);
    if (g.k === 'snake') { g.trail.push([g.x, g.y]); if (g.trail.length > 80) g.trail.shift() }
  }
  for (const w of webs) w.t--; webs = webs.filter(w => w.t > 0);
  // va chạm
  for (const g of ghosts) {
    if (g.st === 'house' || g.st === 'eyes' || g.st === 'enter') continue;
    const near = Math.hypot(wrapX(g.x - pl.x), g.y - pl.y) < 13;
    let bodyHit = false;
    if (g.k === 'snake' && !g.fz && g.st === 'out') for (let i = 12; i < g.trail.length; i += 12) { const [sx, sy] = g.trail[g.trail.length - 1 - i] || []; if (sx != null && Math.hypot(wrapX(sx - pl.x), sy - pl.y) < 12) bodyHit = true }
    if (!near && !bodyHit) continue;
    if (g.fz && near) { eatGhost(g); continue }
    if (!g.fz) { die(); return }
  }
  // trái cây
  if (fruit) { if (--fruit.t <= 0) fruit = null; else if (Math.hypot(pl.x - 14 * T, pl.y - cx(17)) < 10) { const k = fruit.k; fruit = null; score += 100 * (S.level + 1); S.energy += COST.fruit; GC.sfx('pfruit'); pops.push({ x: 14 * T, y: cx(17), t: 60, s: '+' + COST.fruit + '⚡' }); eatenGot.push(k); S.hooks.onBat && S.hooks.onBat(COST.fruit, 'fruit') } }
  if (score > best) best = score;
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
const wrapX = d => d > MW / 2 ? d - MW : d < -MW / 2 ? d + MW : d;
function demonStep(g) {   // quỷ: cứ ~7 giây báo vòng đỏ rồi dịch chuyển tới gần em
  if (g.warn) { if (--g.warn.t <= 0) { g.c = g.warn.c; g.r = g.warn.r; g.p = 0; g.warn = null; place2(g); ghostChoose(g); tone(900, .25, 'sawtooth', .05, 200) } return }
  if (--g.tp > 0) return; g.tp = 430;
  const cand = [];
  for (let r = 1; r < ROWS - 1; r++)for (let c = 1; c < COLS - 1; c++) { const d = Math.abs(r - pl.r) + Math.abs(c - pl.c); if (d >= 5 && d <= 8 && canGo(c, r) && at(c, r) !== '-' && !(r >= 12 && r <= 16 && c >= 10 && c <= 17)) cand.push([c, r]) }
  if (!cand.length) return; const [c, r] = cand[Math.floor(Math.random() * cand.length)];
  g.warn = { c, r, t: 70 }; tone(200, .4, 'sawtooth', .04, 700);
}
function eatGhost(g) {
  const pts = 200 * Math.pow(2, Math.min(3, frightK)); frightK++; score += pts; S.stomps++; S.energy += COST.ghost; g.st = 'eyes'; g.fz = 0; g.trail = []; g.warn = null;
  sGhost(); pops.push({ x: g.x, y: g.y, t: 60, s: String(pts) }); S.hooks.onStomp && S.hooks.onStomp(COST.ghost);
}
function die() {
  phase = 'dying'; phT = 110; S.hits++; S.falls++; GC.music.hush(true); GC.sfx('pdie');
}
function afterDeath() {
  S.lives--;
  if (S.lives <= 0) { phase = 'over'; phT = 160; GC.sfx('bad'); return }
  resetActors(); phase = 'ready'; phT = 110; GC.music.hush(false); GC.music.scene('play', true);
  S.hooks.onFall && S.hooks.onFall(0, '👻 Bị ma bắt! 💔 Mất 1 mạng — còn ' + S.lives + ' mạng');
}

/* ═════ vẽ ═════ */
const PXC = {};
function pix(key, rows, pal) { if (PXC[key]) return PXC[key]; const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const x = c.getContext('2d'); rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1) } } }); return PXC[key] = c }
const pixFont = n => n + 'px "Press Start 2P", monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = stroke || '#000'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function pacman(x, y, dir, mouth, col, a, r) {
  r = r || 7.5 * ES; const open = mouth, rot = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][dir < 0 ? 3 : dir];
  ctx.globalAlpha = a || 1; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, rot + open, rot + Math.PI * 2 - open); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
function ghostBody(x, y, col, fr, eyesDir, scared, flash, a) {
  ctx.globalAlpha = a == null ? 1 : a;
  const body = scared ? (flash ? '#FFFFFF' : '#2121FF') : col;
  if (body) {
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y - 1, 7, Math.PI, 0); ctx.lineTo(x + 7, y + 7);
    const n = 4, w = 14 / n; for (let i = 0; i < n; i++) { const xx = x + 7 - i * w; ctx.lineTo(xx - w / 2, y + (fr ? 4 : 5.5) - (i % 2 ? 0 : 0)); ctx.lineTo(xx - w, y + 7) }
    ctx.closePath(); ctx.fill();
  }
  if (scared) { ctx.fillStyle = flash ? '#FF2A2A' : '#FFB8AE'; ctx.fillRect(x - 4, y - 3, 2, 2); ctx.fillRect(x + 2, y - 3, 2, 2); for (let i = 0; i < 6; i++)ctx.fillRect(x - 6 + i * 2, y + 2 + (i % 2), 2, 1); ctx.globalAlpha = 1; return }
  const ex = DX[eyesDir] * 1.5, ey = DY[eyesDir] * 1.5;
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(x - 3, y - 2, 2.4, 3, 0, 0, 7); ctx.ellipse(x + 3, y - 2, 2.4, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2121DE'; ctx.fillRect(x - 4 + ex, y - 3 + ey, 2, 2); ctx.fillRect(x + 2 + ex, y - 3 + ey, 2, 2);
  ctx.globalAlpha = 1;
}
function drawGhost(g) {   // vòng báo của quỷ + thân rắn vẽ theo toạ độ thật · thân con ma phóng to quanh tâm
  const flash = g.fz && fright < 120 && (S.tick >> 3) & 1;
  if (g.warn && g.st === 'out') { ctx.strokeStyle = (S.tick >> 2) & 1 ? '#FF4D7A' : '#FFE08A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx(g.warn.c), cx(g.warn.r), 4 + g.warn.t / 6, 0, 7); ctx.stroke() }
  if (g.k === 'snake' && g.st === 'out') {
    for (let i = g.trail.length - 13, k = 0; i >= 0 && k < 6; i -= 12, k++) { const [sx, sy] = g.trail[i]; ctx.fillStyle = g.fz ? (flash ? '#FFFFFF' : '#2121FF') : k % 2 ? '#2DB84B' : '#8CEB7A'; ctx.beginPath(); ctx.arc(sx, sy, (6 - k * .4) * ES, 0, 7); ctx.fill() }
  }
  const x = Math.round(g.x), y = Math.round(g.y); ctx.save(); ctx.translate(x, y); ctx.scale(ES, ES); ctx.translate(-x, -y); drawGhost0(g); ctx.restore();
}
function drawGhost0(g) {
  const flash = g.fz && fright < 120 && (S.tick >> 3) & 1, x = Math.round(g.x), y = Math.round(g.y);
  if (g.st === 'eyes' || g.st === 'enter') return ghostBody(x, y, null, 0, g.dir, false, false);
  if (g.k === 'spider' && !g.fz) {   // nhện: thân tròn + 8 chân động đậy
    ctx.strokeStyle = '#1A1033'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 4; i++) { const k = Math.sin(S.tick * .3 + i) * 2; ctx.moveTo(x - 3, y - 2 + i * 2); ctx.lineTo(x - 9, y - 5 + i * 3 + k); ctx.moveTo(x + 3, y - 2 + i * 2); ctx.lineTo(x + 9, y - 5 + i * 3 - k) }
    ctx.stroke(); ctx.fillStyle = GH.spider.col; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#C9A8FF'; ctx.beginPath(); ctx.arc(x, y - 4, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#FF2A2A'; ctx.fillRect(x - 3, y - 5, 2, 2); ctx.fillRect(x + 1, y - 5, 2, 2); return;
  }
  if (g.k === 'snake' && g.st === 'out') {   // rắn: các đốt thân đi theo đầu
    if (!g.fz) { ctx.fillStyle = '#3FD26B'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE08A'; ctx.fillRect(x - 4, y - 3, 3, 3); ctx.fillRect(x + 1, y - 3, 3, 3); ctx.fillStyle = '#000'; ctx.fillRect(x - 3 + DX[g.dir], y - 2, 1, 2); ctx.fillRect(x + 2 + DX[g.dir], y - 2, 1, 2); if ((S.tick >> 3) & 1) { ctx.fillStyle = '#FF2A2A'; ctx.fillRect(x + DX[g.dir] * 7 - 1, y + DY[g.dir] * 7 + 2, 2, 3) } return }
  }
  let a = 1;
  if (g.k === 'phantom' && !g.fz) { const d = Math.hypot(g.c - pl.c, g.r - pl.r); a = clamp(1 - (d - 3) / 4, .07, 1) * (.75 + .25 * Math.sin(S.tick * .2)) }
  ghostBody(x, y, GH[g.k].col, g.fr, g.dir, !!g.fz, flash, a);
  if (g.k === 'demon' && !g.fz) { ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 4, y - 12); ctx.lineTo(x - 2, y - 6); ctx.moveTo(x + 6, y - 5); ctx.lineTo(x + 4, y - 12); ctx.lineTo(x + 2, y - 6); ctx.fill() }
}
function draw() {
  const TH = THEMES[S.level];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, Math.round(ox * dpr), Math.round(oy * dpr));
  // thanh điểm trên
  ctx.font = pixFont(9); ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('1UP', 16, -HT + 2); ctx.fillText(String(score).padStart(5, '0'), 16, -HT + 14);
  ctx.textAlign = 'center'; ctx.fillText('HIGH SCORE', MW / 2, -HT + 2); ctx.fillText(String(best).padStart(5, '0'), MW / 2, -HT + 14);
  ctx.textAlign = 'right'; ctx.fillStyle = TH.wall[1]; ctx.fillText('LEVEL ' + (S.level + 1) + '/' + NL, MW - 12, -HT + 2); ctx.fillStyle = '#FFFFFF'; ctx.fillText(Math.round(prog() * 100) + '%', MW - 12, -HT + 14);
  // mê cung (nhấp nháy trắng khi qua màn)
  ctx.drawImage(phase === 'clear' && (phT >> 4) & 1 ? mazeWhite : mazeImg, 0, 0);
  // tơ nhện
  for (const w of webs) { const x = cx(w.c), y = cx(w.r); ctx.globalAlpha = Math.min(1, w.t / 120) * .85; ctx.strokeStyle = '#E8E8FF'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.moveTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8) } ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 }
  // chấm
  const pw = (S.tick >> 4) & 1 || phase !== 'play';
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) {
    const v = grid[r][c]; if (v === '.') { ctx.fillStyle = TH.dot; ctx.fillRect(c * T + 6, r * T + 6, 4, 4) }
    else if (v === 'o' && pw) { ctx.fillStyle = TH.dot; ctx.beginPath(); ctx.arc(cx(c), cx(r), 7, 0, 7); ctx.fill() }
  }
  if (fruit) { const [rows, pal] = FR[fruit.k], img = pix('f' + fruit.k, rows, pal); ctx.drawImage(img, 14 * T - img.width * 1.5, cx(17) - img.height * 1.5, img.width * 3, img.height * 3) }
  // các bạn khác (cùng màn)
  const wk = 'pac' + S.level;
  for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== wk) continue; if (g.x == null) { g.x = g.tx; g.y = g.ty } g.x += (g.tx - g.x) * .25; g.y += (g.ty - g.y) * .25; pacman(g.x, g.y, g.f >= 0 ? g.f : 3, .5, g.c || '#FFE135', .45); label(g.n, g.x, g.y - 15, 11, '#fff') }
  if (phase !== 'dying' || phT > 80) for (const g of ghosts) drawGhost(g);
  // em
  if (phase === 'dying') { const k = 1 - phT / 110; if (k < .95) pacman(pl.x, pl.y, 0, Math.min(Math.PI, .2 + k * Math.PI * 1.05), S.color) }
  else if (phase !== 'over') { const m = pl.moving ? Math.abs(Math.sin(pl.mouth)) * .8 + .05 : .35; pacman(pl.x, pl.y, pl.face, m, S.color) }
  if (frozen()) { ctx.fillStyle = '#BFE8FF88'; ctx.beginPath(); ctx.arc(pl.x, pl.y, 15, 0, 7); ctx.fill() }
  if (S.name && phase !== 'over') label(S.name, pl.x, pl.y - 15, 12, '#fff');
  for (const p of pops) { ctx.globalAlpha = Math.min(1, p.t / 20); ctx.font = pixFont(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#38E8FF'; ctx.fillText(p.s, p.x, p.y - (60 - p.t) * .3); ctx.globalAlpha = 1 }
  if (S.energy <= 0 && S.running && !S.over && phase === 'play') { ctx.fillStyle = '#fff'; ctx.fillRect(pl.x - 20, pl.y - 38, 40, 15); ctx.font = pixFont(8); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E52521'; ctx.fillText('⚡0!', pl.x, pl.y - 36) }
  // chữ giữa sân
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (phase === 'ready') { ctx.font = pixFont(12); ctx.fillStyle = '#FFE135'; ctx.fillText('READY!', MW / 2, cx(17)) }
  if (phase === 'over') { ctx.font = pixFont(12); ctx.fillStyle = '#FF2A2A'; ctx.fillText('GAME  OVER', MW / 2, cx(17)) }
  if (phase === 'clear' && S.level >= NL - 1) { ctx.font = pixFont(11); ctx.fillStyle = '#FFE135'; ctx.fillText('ALL CLEAR!', MW / 2, cx(17)) }
  // thanh dưới: mạng · trái cây đã ăn
  for (let i = 0; i < Math.min(S.lives - (phase === 'ready' ? 0 : 1), 6); i++) pacman(16 + i * 24, MH + 14, 3, .55, S.color, 1, 9);
  const fl = FRUITS.slice(0, S.level + 1); fl.forEach((k, i) => { const [rows, pal] = FR[k], img = pix('f' + k, rows, pal); ctx.drawImage(img, MW - 22 - i * 22, MH + 5, img.width * 1.5, img.height * 1.5) });
  if (banner && banner.t > 0) { banner.t--; if (banner.t < 150) { ctx.globalAlpha = Math.min(1, banner.t / 30); label(banner.w + ' · ' + banner.text, MW / 2, cx(11) + 4, 14, TH.wall[1]); ctx.globalAlpha = 1 } }
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), port = cw / ch < 1.02, room = touch && port ? 190 : 66;
  sc = Math.min(cw / (MW + 16), (ch - room - 8) / (MH + HT + HB)); ox = (cw - MW * sc) / 2; oy = port ? 8 + HT * sc : (ch - room - (MH + HT + HB) * sc) / 2 + HT * sc;
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else { acc = 0; S.tick++ }
  draw(); S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: mũi tên/WASD (nhớ hướng bấm trước, tới ngã rẽ tự rẽ) ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
const press = k => { keys[k] = 1; keys.order = keys.order.filter(q => q !== k).concat(k) };
const unpress = k => { keys[k] = 0; keys.order = keys.order.filter(q => q !== k) };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); press(k) }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) unpress(k) });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } press(k); b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { unpress(k); b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  try { best = +localStorage.getItem('pacBest') || 0 } catch (e) { }
  GC.music.files({ play: { synth: 'pac' }, power: { synth: 'pacpow' } }, 'pac');
  GC.sfxFiles({ pdie: { src: 'snd/pac-death.mp3', a: .08, d: 1.6, vol: .6 }, pfruit: { src: 'snd/pac-fruit.mp3', vol: .6 } });
  loadLevel(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
  setInterval(() => { try { localStorage.setItem('pacBest', best) } catch (e) { } }, 5000);
}
function release() { keys.l = keys.r = keys.u = keys.d = 0; keys.order = [] }
function place(x, y, old) {
  const li = old && old.lvl != null ? old.lvl : 0; score = old && old.sc || 0; S.stomps = old && old.sp || 0; S.lives = old && old.lf || LIVES;
  if (li !== S.level) loadLevel(li);
}
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Màn ' + (S.level + 1) + '/' + NL + ' · 🟡 ' + Math.round((dots ? 1 - dotsLeft / dots : 0) * 100) + '% chấm';
function extra() { return { lvl: S.level, wk: 'pac' + S.level, lb: label2(), sc: score, lf: S.lives } }
function hud() { return (S.won ? '🏆 Phá đảo' : '🟡 Màn ' + (S.level + 1) + '/' + NL) + ' · ⭐ ' + score }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: MW, kind: 'pac', NL,
  _dbg: { step, draw, loadLevel, ghosts: () => ghosts, grid: () => grid, left: () => dotsLeft, phase: () => phase, eatAt },
  winTitle: '🏆 Phá đảo Pac-Man — ăn sạch 5 mê cung!', winToast: '🏆 ALL CLEAR! Em đã ăn sạch cả 5 mê cung — vua Pac-Man là đây!' };
})();
