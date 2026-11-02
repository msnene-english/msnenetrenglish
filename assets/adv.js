/* adv.js — game "Đảo phiêu lưu P1" (Hudson's Adventure Island, phong cách 8-bit NES): 6 màn — Rừng nguyên sinh · Bãi biển · Hang động ·
   Rừng đêm · Đảo trên mây · Núi lửa (trùm Vua Quỷ). Cậu bé Higgins mũ trắng váy lá: chạy, nhảy, ném rìu đá, ăn trái cây giữ THANH NO.
   Trứng: 🪓 rìu đá · 🔥 cầu lửa · 🛹 ván trượt (đỡ 1 lần đụng) · 🧚 tiên Honey (bất tử) · 🥛 sữa (đầy thanh no) · 🍆 cà tím (hút thanh no).
   Không giẫm được quái (như bản gốc): ném rìu để hạ · vấp đá mất 2 vạch no · lửa trại, hố, nước, dung nham = mất mạng.
   Cùng giao diện: init(canvas, stage, seed, hooks, level) · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'adv' */
window.Adv = (function () {
const { clamp, rng } = GC;
const TS = 32, ROWS = 15, GH = .6, GL = .26, JV = -10.2, SPD = 3, RUN = 4.1, SKATE = 5, LIVES = 5, VMAX = 16, NL = 6, PX = 2;
const THEMES1 = [
  { name: 'Rừng nguyên sinh', ic: '🌴', bg: 'jungle', mus: 'jungle', en: ['snail', 'snail', 'frog', 'cobra'], ch: ['flat', 'flat', 'pit', 'rock', 'egg', 'fruit', 'ledge', 'rock', 'spring'] },
  { name: 'Bãi biển', ic: '🏝', bg: 'island', mus: 'island', en: ['frog', 'snail', 'cobra', 'bird'], ch: ['flat', 'water', 'water', 'rock', 'egg', 'fruit', 'spring', 'pit', 'ledge'] },
  { name: 'Hang động', ic: '🦇', bg: 'cave', mus: 'cave', en: ['bat', 'ghost', 'snail', 'cobra'], ch: ['flat', 'pit', 'stal', 'stal', 'boulder', 'egg', 'rock', 'ledge', 'fire'] },
  { name: 'Rừng đêm', ic: '🌙', bg: 'night', mus: 'night', en: ['spider', 'fox', 'bat', 'frog'], ch: ['flat', 'pit', 'fire', 'fire', 'rock', 'egg', 'spring', 'ledge', 'boulder'] },
  { name: 'Đảo trên mây', ic: '☁️', bg: 'sky', mus: 'island', en: ['bird', 'frog', 'snail', 'bat'], ch: ['flat', 'clouds', 'clouds', 'pit', 'spring', 'egg', 'rock', 'ledge', 'fruit'] },
  { name: 'Núi lửa Vua Quỷ', ic: '🌋', bg: 'volcano', mus: 'cave', en: ['ghost', 'cobra', 'fox', 'bat'], ch: ['flat', 'lava', 'lava', 'boulder', 'fire', 'egg', 'rock', 'stal', 'ledge'], boss: 1 }];
const THEMES2 = [   // PHẦN 2 (Adventure Island II): cưỡi khủng long · boomerang · băng trơn · xương rồng · trùm Vua Mèo
  { name: 'Rừng thu', ic: '🍂', bg: 'autumn', mus: 'over2', en: ['snail', 'pig', 'frog', 'cobra'], ch: ['flat', 'flat', 'pit', 'rock', 'egg', 'fruit', 'ledge', 'rock', 'spring'], dino: 'blue' },
  { name: 'Đảo hồ', ic: '🏖', bg: 'lake', mus: 'over2', en: ['pig', 'frog', 'bird', 'snail'], ch: ['flat', 'lake', 'lake', 'water', 'rock', 'egg', 'spring', 'ledge', 'fruit'], dino: 'sea' },
  { name: 'Đáy biển', ic: '🐠', bg: 'sea', mus: 'water2', en: ['fishU', 'squid', 'fishU', 'squid'], ch: ['open', 'open', 'coral', 'coral', 'urchin', 'reef', 'egg', 'open'], dino: 'sea', under: 1 },
  { name: 'Đồng hoang', ic: '🌵', bg: 'plains', mus: 'plains2', en: ['scorp', 'cobra', 'vulture', 'pig'], ch: ['flat', 'pit', 'cactus', 'cactus', 'rock', 'egg', 'fire', 'ledge', 'boulder'], dino: 'red' },
  { name: 'Đảo băng trên mây', ic: '🧊', bg: 'ice', mus: 'cloud2', en: ['penguin', 'bird', 'penguin', 'bat'], ch: ['flat', 'pit', 'stal', 'clouds', 'clouds', 'egg', 'rock', 'ledge', 'boulder'], dino: 'ptera', ice: 1 },
  { name: 'Hang núi lửa & Lâu đài Vua Mèo', ic: '🌋', bg: 'rockcave', mus: 'volc2', en: ['bat', 'ghost', 'cobra', 'scorp'], ch: ['flat', 'lava', 'lava', 'stal', 'boulder', 'fire', 'egg', 'rock', 'ledge'], boss: 2, dino: 'red' }];
let PART = 1, THEMES = THEMES1;
function setPart(p) { PART = p === 2 ? 2 : 1; THEMES = PART === 2 ? THEMES2 : THEMES1 }
const WKP = () => PART === 2 ? 'ai2' : 'ai';
// độ khó: thanh no tụt 1 vạch sau drain khung hình · ⚡ tốn cân đối với các game khác
const LVS = {
  1: { len: 250, en: .48, drain: 340, pit: [2, 3], boss: 6, spd: .85, cost: { walk: .13, jump: 3, fruit: 3, stomp: 10, shot: 1 } },
  2: { len: 290, en: .68, drain: 280, pit: [2, 3], boss: 8, spd: 1, cost: { walk: .16, jump: 3.5, fruit: 3, stomp: 10, shot: 1.5 } },
  3: { len: 330, en: .92, drain: 220, pit: [2, 4], boss: 10, spd: 1.2, cost: { walk: .19, jump: 4, fruit: 3, stomp: 10, shot: 2 } } };
let LVC = LVS[2], COST = LVC.cost;
const SOLID = new Set(['G', 'S']), SOLR = new Set(['G', 'S', 'L']), SOLW = new Set(['G', 'S', 'W']);   // C: mây (chỉ đứng được từ trên) · W: nước · L: dung nham
const FLY = new Set(['bat', 'ghost', 'bird', 'spider', 'fish', 'vulture', 'fishU', 'squid']);
const DSP = { blue: 3.6, red: 3.4, sea: 3.4, ptera: 3.3 }, DNAME = { blue: 'khủng long xanh', red: 'khủng long đỏ', sea: 'rồng biển', ptera: 'thằn lằn bay' };
const FRUITS = ['apple', 'banana', 'melon', 'pine', 'grape', 'tomato'];
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#ffffff', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, overs: 0, maxAlt: 0, won: false, boss: false, rescue: 0, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 64, y: 300, w: 22, h: 40, vx: 0, vy: 0, on: false, face: 1, coy: 0, buf: 0, walk: 0, inv: 0, kb: 0, run: 0, wp: 0, skate: 0, dino: null, whip: 0, flap: 0, fairy: 0, nasu: 0, vit: VMAX, auto: null, lift: null, thr: 0 };
const keys = { l: 0, r: 0, j: 0, jp: 0, d: 0, f: 0, fp: 0 };
const parts = [], pops = [], SH = [];
let seed0 = 1, lvSel = 2, A = null, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, oy = 0, camX = 0, emptyT = 0, cp = null, banner = null;

/* ═════ dựng màn (cùng seed → cả lớp cùng bản đồ) ═════ */
function newArea(w, th) { const g = []; for (let x = 0; x < w; x++)g.push(new Array(ROWS).fill('.')); return { w, th, g, en: [], fruits: [], eggs: [], items: [], rocks: [], fires: [], cacti: [], flee: [], urchins: [], springs: [], lifts: [], signs: [], falling: [], ef: [], deco: [], goal: null, boss: null, princess: null, lockX: 0, end: 0 } }
const getT = (a, x, y) => x < 0 ? 'S' : x >= a.w ? 'S' : y < 0 || y >= ROWS ? '.' : a.g[x][y];
const setT = (a, x, y, t) => { if (x >= 0 && x < a.w && y >= 0 && y < ROWS) a.g[x][y] = t };
function buildLevel(li) {
  const T = THEMES[li], r0 = rng(seed0 * 41 + li * 733 + lvSel * 17), R = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), pick = L => L[Math.floor(r0() * L.length)];
  const LEN = LVC.len + li * 24, W = LEN + (T.boss ? 28 : 26), a = newArea(W, li);
  const gnd = (x0, x1) => { for (let i = x0; i < x1; i++) { setT(a, i, 13, 'G'); setT(a, i, 14, 'G') } };
  const fruit = (cx, row, k) => a.fruits.push({ x: cx * TS + 6, y: row * TS + 4, k: k || pick(FRUITS), got: false });
  const fruitRow = (x0, n, row) => { for (let i = 0; i < n; i++)fruit(x0 + i, row) };
  const fruitArc = (x0, n, row) => { for (let i = 0; i < n; i++)fruit(x0 + i, row - Math.round(Math.sin((i + .5) / n * Math.PI) * 2)) };
  const egg = (cx, k) => a.eggs.push({ x: cx * TS + 6, y: T.under ? 9 * TS : 13 * TS - 28, w: 22, h: 28, k: k === 'dino' ? 'd_' + (T.dino || 'blue') : k, hit: 0, open: 0 });
  const eggK = () => { const q = r0(); if (PART === 2) return q < .2 ? 'wpn' : q < .42 ? 'dino' : q < .54 ? 'skate' : q < .62 ? 'fairy' : q < .74 ? 'milk' : q < .86 ? 'nasu' : q < .93 ? 'boom' : 'fire';
    return q < .2 ? 'wpn' : q < .44 ? 'skate' : q < .55 ? 'fairy' : q < .69 ? 'milk' : q < .8 && li >= 1 ? 'nasu' : q < .88 && li >= 2 ? 'fire' : 'milk' };   // P1: ván trượt vừa phải · P2: hay ra khủng long
  const enemy = (cx, k, ramp) => {
    k = k || pick(T.en); const fl = FLY.has(k), e = { k, x: cx * TS, y: 13 * TS - 22, w: 26, h: 22, vx: 0, vy: 0, dead: 0, act: false, hp: 1, t: RI(0, 99), by: 0 };
    if (k === 'cobra') { e.w = 20; e.h = 32; e.y = 13 * TS - 32 }
    if (k === 'bat') { e.by = RI(9, 10) * TS + 12; e.y = e.by; e.h = 16 }
    if (k === 'bird') { e.by = RI(10, 11) * TS + 8; e.y = e.by; e.h = 16 }
    if (k === 'ghost') { e.by = RI(9, 11) * TS; e.y = e.by; e.w = 22; e.h = 24 }
    if (k === 'spider') { e.by = 2 * TS; e.y = e.by; e.w = 24; e.h = 20; e.x = cx * TS + 4 }
    if (k === 'fox') { e.w = 32; e.h = 22 }
    if (k === 'vulture') { e.by = RI(6, 8) * TS; e.y = e.by; e.w = 30; e.h = 20 }
    if (k === 'fishU') { e.by = RI(4, 11) * TS; e.y = e.by; e.w = 28; e.h = 16 }
    if (k === 'squid') { e.by = RI(5, 10) * TS; e.y = e.by; e.w = 22; e.h = 28 }
    if (k === 'penguin') { e.w = 22; e.h = 26; e.y = 13 * TS - 26 }
    if (k === 'scorp') { e.w = 28; e.h = 18; e.y = 13 * TS - 18 }
    a.en.push(e); return e;
  };
  gnd(0, 14); egg(9, 'wpn'); if (PART === 2) egg(13, 'dino'); else if (li % 2 === 0) egg(13, 'skate'); fruitRow(4, 3, 10); a.deco.push({ x: 2, k: 'start' });   // đầu màn: trứng rìu (chưa có vũ khí) · P1: ván trượt màn lẻ · P2: trứng khủng long
  let x = 14, lastEgg = 9;
  while (x < LEN) {
    const ramp = x / LEN, pE = LVC.en * (.45 + .55 * ramp + li * .07) * (T.under ? .5 : 1);   // dưới biển: quái thưa hơn
    let k = pick(T.ch); if (k === 'egg' && x - lastEgg < 14) k = 'fruit'; if (k === 'flat' && x - lastEgg > 40 && r0() < .5) k = 'egg';   // trứng dày hơn
    if (k === 'flat' || k === 'fruit') {
      const L = RI(6, 10); gnd(x, x + L);
      if (k === 'fruit' || r0() < .6) (r0() < .5 ? fruitRow : fruitArc)(x + 1, RI(2, 4), RI(10, 11));   // trái cây vừa tầm nhảy
      if (r0() < pE) enemy(x + RI(3, L - 3)); if (r0() < pE * .5 && L > 7) enemy(x + L - 1);   // 2 con không đứng chồng lên nhau
      if (r0() < .3) a.deco.push({ x: x + RI(0, L - 2), k: 'bush' });
      x += L;
    } else if (k === 'pit' || k === 'water' || k === 'lava') {
      const gap = Math.min(4, RI(LVC.pit[0], LVC.pit[1]) + (li >= 3 && r0() < .4 ? 1 : 0)); gnd(x, x + 3); x += 3;
      for (let i = 0; i < gap; i++) { if (k === 'water') { setT(a, x + i, 13, 'W'); setT(a, x + i, 14, 'W') } if (k === 'lava') { setT(a, x + i, 13, 'L'); setT(a, x + i, 14, 'L') } }
      if (gap >= 4) { setT(a, x + 1, 10, 'S'); setT(a, x + 2, 10, 'S') }   // hố rộng: có bệ đá ở giữa
      fruitArc(x, gap, 9);
      if (k === 'water' && r0() < .6 + li * .1) { const f = enemy(x, 'fish'); f.x0 = x * TS; f.x1 = (x + gap) * TS; f.by = 13 * TS + 10; f.y = f.by; f.w = 28; f.h = 14; f.t = RI(0, 150) }
      x += gap; gnd(x, x + 3); x += 3;
    } else if (k === 'lake') {   // HỒ RỘNG: có đá kê chân ở giữa · cưỡi rồng biển thì đi thẳng trên mặt nước
      const gap = RI(5, 7); gnd(x, x + 3); x += 3;
      for (let i = 0; i < gap; i++) { setT(a, x + i, 13, 'W'); setT(a, x + i, 14, 'W') }
      for (let i = 1; i < gap - 1; i += 3) { setT(a, x + i, 11, 'S'); if (i + 1 < gap - 1) setT(a, x + i + 1, 11, 'S') }
      fruitRow(x + 1, gap - 2, 9); if (r0() < .7) { const f = enemy(x, 'fish'); f.x0 = x * TS; f.x1 = (x + gap) * TS; f.by = 13 * TS + 10; f.y = f.by; f.w = 28; f.h = 14; f.t = RI(0, 150) }
      x += gap; gnd(x, x + 3); x += 3;
    } else if (k === 'open') {   // biển khơi: trái cây lơ lửng giữa nước · cá & mực bơi tới
      const L = RI(7, 11); gnd(x, x + L); fruitArc(x + 1, RI(3, 5), RI(6, 10)); if (r0() < pE) enemy(x + RI(3, L - 1)); if (r0() < pE * .7) enemy(x + L - 1); if (r0() < .5) a.deco.push({ x: x + RI(0, L - 2), k: 'weed' }); x += L;
    } else if (k === 'coral') {   // cột san hô: bơi vượt lên trên
      gnd(x, x + 9); const h = RI(2, 3 + Math.min(3, li)); for (let rr = 13 - h; rr <= 12; rr++) { setT(a, x + 4, rr, 'S'); setT(a, x + 5, rr, 'S') } fruitRow(x + 3, 4, 12 - h - 1); if (r0() < pE * .6) enemy(x + 8); x += 9;
    } else if (k === 'urchin') {   // cầu gai dưới đáy: chạm là mất mạng
      gnd(x, x + 9); a.urchins.push({ x: (x + 3) * TS + 4, y: 13 * TS - 24, w: 24, h: 24 }); if (r0() < .6) a.urchins.push({ x: (x + 6) * TS + 4, y: 13 * TS - 24, w: 24, h: 24 }); fruitArc(x + 2, 5, 10); x += 9;
    } else if (k === 'reef') {   // rạn đá nổi giữa nước, cầu gai bên dưới
      gnd(x, x + 11); for (let i = x + 3; i <= x + 7; i++)setT(a, i, 7, 'S'); fruitRow(x + 3, 5, 6); a.urchins.push({ x: (x + 5) * TS + 4, y: 13 * TS - 24, w: 24, h: 24 }); if (r0() < pE) enemy(x + 9); x += 11;
    } else if (k === 'cactus') {   // xương rồng gai: nhảy qua (chạm là mất mạng)
      gnd(x, x + 8); a.cacti.push({ x: (x + 4) * TS + 2, y: 13 * TS - 44, w: 26, h: 44 }); fruitArc(x + 3, 3, 8); if (r0() < LVC.en * .5) enemy(x + 7); x += 8;
    } else if (k === 'rock') {
      gnd(x, x + 8); a.rocks.push({ x: (x + 4) * TS + 4, y: 13 * TS - 18, w: 24, h: 18 }); fruitArc(x + 3, 3, 10); if (r0() < pE * .6) enemy(x + 7); x += 8;
    } else if (k === 'fire') {
      gnd(x, x + 8); a.fires.push({ x: (x + 4) * TS + 2, y: 13 * TS - 28, w: 28, h: 28 }); fruitArc(x + 3, 3, 9); x += 8;
    } else if (k === 'egg') {
      gnd(x, x + 7); egg(x + 3, eggK()); lastEgg = x + 3; if (r0() < pE * .5) enemy(x + 6); x += 7;
    } else if (k === 'spring') {
      gnd(x, x + 11); a.springs.push({ x: (x + 3) * TS + 2, y: 13 * TS - 16, w: 28, h: 16, sq: 0 });
      for (let i = x + 5; i <= x + 8; i++)setT(a, i, 7, 'S'); fruitRow(x + 5, 4, 6); if (r0() < .5) fruit(x + 3, 4, 'pine'); x += 11;
    } else if (k === 'ledge') {
      gnd(x, x + 11); for (let i = x + 2; i <= x + 4; i++)setT(a, i, 10, 'S'); for (let i = x + 6; i <= x + 8; i++)setT(a, i, 8, 'S');
      fruitRow(x + 2, 3, 9); fruitRow(x + 6, 3, 7); if (r0() < pE) enemy(x + 9); x += 11;
    } else if (k === 'clouds') {   // khoảng trời rộng: mây trôi qua lại
      const gap = RI(7, 9); gnd(x, x + 3); x += 3;
      const n = gap > 8 ? 2 : 1; for (let i = 0; i < n; i++) { const x0 = (x + i * gap / n) * TS, x1 = (x + (i + 1) * gap / n) * TS - 4 * TS; a.lifts.push({ x: x0, x0, x1: Math.max(x0 + TS, x1), y: 12 * TS, w: 4 * TS, sp: .009 + r0() * .004, ph: r0() * 6, dx: 0 }) }   // mây thấp, rộng, trôi chậm: nhảy nhẹ là lên
      fruitArc(x + 1, gap - 2, 9); fruitRow(x + 1, gap - 2, 10); x += gap; gnd(x, x + 3); fruitRow(x, 3, 11); x += 3;   // đoạn mây: nhiều trái cây hơn (phải chờ mây lâu)
    } else if (k === 'stal') {   // nhũ đá rơi khi em chạy tới gần
      gnd(x, x + 8); a.falling.push({ x: (x + 4) * TS + 4, y: TS, w: 24, h: 34, vy: 0, go: false, done: false }); if (r0() < .5) a.falling.push({ x: (x + 6) * TS + 4, y: TS, w: 24, h: 34, vy: 0, go: false, done: false }); fruitRow(x + 2, 4, 11); x += 8;
    } else if (k === 'boulder') {   // đá tảng lăn tới: nhảy qua hoặc ném rìu
      gnd(x, x + 12); const b = enemy(x + 11, 'boulder'); b.w = 28; b.h = 28; b.y = 13 * TS - 28; b.hp = 1; fruitRow(x + 2, 3, 10); x += 12;
    }
  }
  gnd(x, W); a.end = (LEN + 6) * TS;
  for (let q = 1; q <= 4; q++) {   // biển số 1 · 2 · 3 · 4 (cờ trạm) như bản gốc
    let c = Math.round(LEN * q / 5); for (let d = 0; d < 40; d++) { const ok = cc => [-3, -2, -1, 0, 1, 2, 3, 4].every(d => getT(a, cc + d, 13) === 'G') && ![...a.rocks, ...a.fires, ...a.cacti, ...a.urchins].some(r => Math.abs(r.x - cc * TS) < 128); /* chỗ hồi sinh: cách đá, lửa, xương rồng, cầu gai, mép vực ≥ 4 ô */ if (ok(c + d)) { c += d; break } if (ok(c - d)) { c -= d; break } }
    a.signs.push({ x: c * TS + 4, n: q, got: false });
  }
  if (T.boss) {   // đấu trường trùm: rìu đảm bảo trước cửa · khoá màn hình khi vào
    const ax = LEN + 8; egg(LEN + 3, 'wpn'); a.arena = ax * TS; for (let r = 0; r < 13; r++)setT(a, W - 1, r, 'S');
    a.boss = { kind: T.boss, x: (W - 7) * TS, y: 13 * TS - 76, w: 60, h: 76, vx: 0, vy: 0, hp: LVC.boss, max: LVC.boss, act: false, t: 0, hurt: 0, fall: false, dead: false, on: true };
    a.princess = { x: (W - 3) * TS, y: 13 * TS, show: false };
  } else a.goal = { x: (LEN + 10) * TS };
  for (let i = 0; i < W; i += RI(5, 9)) if (getT(a, i, 13) === 'G' && r0() < .5) a.deco.push({ x: i, k: r0() < .5 ? 'bush' : 'grass' });
  return a;
}
/* nhạc gốc theo màn · đấu trùm: Boss */
let lastScene = '';
function syncMusic(restart) { const k = A.boss && A.boss.act && !A.boss.fall ? 'boss' : THEMES[S.level].mus; if (k !== lastScene || restart) { lastScene = k; GC.music.scene(k, restart) } }
function loadLevel(li, keepPos) {
  S.level = li; S.boss = false; A = buildLevel(li); SH.length = 0; pl.auto = null; pl.lift = null;
  cp = { x: 3 * TS, n: 0 }; pl.vit = VMAX; pl.nasu = 0;
  if (!keepPos) { pl.x = cp.x; pl.y = 13 * TS - pl.h; pl.vx = pl.vy = 0 }
  camX = 0; banner = { t: 170, w: (PART === 2 ? 'AREA II-' : 'ROUND ') + (li + 1), text: THEMES[li].ic + ' ' + THEMES[li].name };
  GC.music.hush(false); syncMusic(true); setWp(pl.wp);
}
const prog = () => S.won ? 1 : clamp((S.level + clamp(pl.x / Math.max(1, A.end), 0, 1)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };
function setWp(n) { pl.wp = n; syncBtn() }
function syncBtn() { const on = pl.wp > 0 || !!pl.dino; document.body.classList.toggle('fire', on); const b = document.getElementById('bF'); if (b && document.body.classList.contains('adv')) b.textContent = pl.dino ? { blue: '🦖', red: '🔥', sea: '🫧', ptera: '🪨' }[pl.dino] : pl.wp === 3 ? '🪃' : pl.wp === 2 ? '🔥' : '🪓' }

/* ═════ va chạm với ô ═════ */
const solid = (x, y) => SOLID.has(getT(A, x, y));
function moveX(o) {
  o.x += o.vx; o.hitX = 0; const y0 = Math.floor(o.y / TS), y1 = Math.floor((o.y + o.h - .01) / TS);
  if (o.vx > 0) { const c = Math.floor((o.x + o.w - .01) / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = c * TS - o.w; o.vx = 0; o.hitX = 1; break } }
  else if (o.vx < 0) { const c = Math.floor(o.x / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = (c + 1) * TS; o.vx = 0; o.hitX = -1; break } }
}
function moveY(o) {
  const pb = o.y + o.h; o.y += o.vy; o.on = false; const SOL = o === pl && pl.dino === 'red' ? SOLR : o === pl && pl.dino === 'sea' ? SOLW : SOLID;   // khủng long đỏ đi trên dung nham · rồng biển bơi trên mặt nước
  const x0 = Math.floor((o.x + 1) / TS), x1 = Math.floor((o.x + o.w - 1.01) / TS);
  if (o.vy > 0) { const r = Math.floor((o.y + o.h - .01) / TS); for (let c = x0; c <= x1; c++) { const t = getT(A, c, r); if (SOL.has(t) || (t === 'C' && pb <= r * TS + .5)) { o.y = r * TS - o.h; o.vy = 0; o.on = true; break } } }
  else if (o.vy < 0) { const r = Math.floor(o.y / TS); for (let c = x0; c <= x1; c++) if (solid(c, r)) { o.y = (r + 1) * TS; o.vy = 0; break } }
  return pb;
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const onScreen = (x, m) => x > camX - (m || 60) && x < camX + vw + (m || 60);

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++;
  for (const L of A.lifts) { const nx = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)); L.dx = nx - L.x; L.x = nx }
  for (const s of A.springs) if (s.sq) s.sq--;
  stepEggs(); stepEnemies(); stepShots(); stepBoss(); stepFalling();
  if (S.tick % 20 === 0) syncBtn();
  for (const f of A.flee) { f.x += f.vx; f.t++ } A.flee = A.flee.filter(f => f.t < 90);
  if (pl.auto) return stepAuto();
  const can = S.energy > 0 && !frozen(), dir = can && !pl.kb ? (keys.r - keys.l) : 0;
  if (dir && dir === pl.face) pl.run++; else pl.run = 0;
  const UW = !!THEMES[A.th].under, top = UW ? (pl.dino === 'sea' ? 3.6 : 2.5) : pl.dino ? DSP[pl.dino] * (pl.run > 40 ? 1.12 : 1) : pl.skate ? SKATE : pl.run > 40 ? RUN : SPD, icy = THEMES[A.th].ice && pl.on && !pl.lift && pl.dino !== 'ptera';
  if (pl.kb) { pl.kb--; pl.vx *= .92 } else pl.vx += (dir * top - pl.vx) * (UW ? .08 : pl.on ? (icy ? .045 : pl.skate ? .12 : .2) : .1);   // băng: trơn trượt khó dừng
  if (pl.skate && pl.on && !dir) pl.vx *= .985;   // ván trượt: thả tay vẫn trôi
  if (Math.abs(pl.vx) < .05) pl.vx = 0;
  if (dir) { pl.face = dir; use(COST.walk) }
  if (pl.on && Math.abs(pl.vx) > .4) pl.walk += .3 + Math.abs(pl.vx) * .06;
  if (pl.inv) pl.inv--; if (pl.fairy) pl.fairy--; if (pl.thr) pl.thr--;
  if (pl.nasu) pl.nasu--;
  // thanh no tụt dần (chỉ khi đang có ⚡ để chạy — lúc trả lời câu hỏi thì không tụt)
  if (can) { pl.vit -= (pl.nasu ? 3.2 : 1) / LVC.drain; if (pl.vit <= 0) { pl.vit = 0; return die('hungry') } }
  if (keys.jp) { pl.buf = 7; keys.jp = 0 }
  if (pl.on) pl.coy = 6; else if (pl.coy > 0) pl.coy--;
  if (UW && keys.j && S.tick % 18 === 0) pl.buf = 1;   // dưới nước: giữ ↑ cũng tự quạt bơi
  if (UW && pl.buf > 0) { pl.buf = 0; if (can) { pl.vy = -4.2 * (pl.dino === 'sea' ? 1.2 : 1); pl.on = false; use(COST.jump * .35); GC.sfx('swim') } }
  else if (pl.buf > 0) { pl.buf--; if (pl.coy > 0 && can) { pl.vy = JV - (pl.skate ? .5 : 0); pl.coy = 0; pl.buf = 0; pl.on = false; pl.lift = null; use(COST.jump); GC.sfx('jump') } }
  if (pl.whip) pl.whip--; if (pl.flap) pl.flap--;
  if (pl.dino === 'ptera' && !pl.on && pl.buf > 0 && !pl.flap && can) { pl.buf = 0; pl.vy = -7; pl.flap = 14; use(COST.jump * .5); GC.sfx('swim') }   // thằn lằn bay: bấm ↑ trên không để vỗ cánh
  if (keys.fp) { keys.fp = 0; if (can) { if (pl.dino) dinoAtk(); else if (pl.wp && SH.length < (pl.wp === 3 ? 1 : 2)) throwIt() } }
  if (UW) { pl.vy = Math.min(pl.vy + .13, 2.4); if (S.tick % 50 === 0) parts.push({ x: pl.x + (pl.face > 0 ? pl.w : 0), y: pl.y + 8, vx: 0, vy: -.7, r: 2, l: 70, L: 70, c: '#E0F4FF', g: -.004 }) }
  else pl.vy = Math.min(pl.vy + (keys.j && pl.vy < 0 ? GL : GH) * (pl.dino === 'ptera' ? .7 : 1), pl.dino === 'ptera' ? 6 : 12);
  if (pl.lift) pl.x += pl.lift.dx;
  moveX(pl); const minX = Math.max(camX, A.lockX); if (pl.x < minX) { pl.x = minX; if (pl.vx < 0) pl.vx = 0 }
  const pb = moveY(pl); pl.lift = null; if (UW && pl.y < 1.6 * TS) { pl.y = 1.6 * TS; if (pl.vy < 0) pl.vy = 0 }   // mặt nước
  if (pl.vy >= 0) for (const L of A.lifts) if (pl.x + pl.w > L.x + 4 && pl.x < L.x + L.w - 4 && pb <= L.y + .5 && pl.y + pl.h >= L.y) { pl.y = L.y - pl.h; pl.vy = 0; pl.on = true; pl.lift = L }
  for (const s of A.springs) if (pl.vy >= 0 && pl.x + pl.w > s.x + 2 && pl.x < s.x + s.w - 2 && pb <= s.y + 6 && pl.y + pl.h >= s.y) { pl.y = s.y - pl.h; pl.vy = -15.5; pl.on = false; s.sq = 12; GC.sfx('spring') }
  // trái cây · vật phẩm
  for (const f of A.fruits) if (!f.got && pl.x < f.x + 20 && pl.x + pl.w > f.x && pl.y < f.y + 20 && pl.y + pl.h > f.y) eatFruit(f);
  for (const it of A.items) if (!it.got && it.k !== 'nasu' && it.up <= 4 && hit({ x: pl.x - 8, y: pl.y - 10, w: pl.w + 16, h: pl.h + 10 }, it)) takeItem(it);
  for (const e of A.eggs) if (!e.open && hit(pl, e)) openEgg(e, true);
  // biển số (cờ trạm)
  for (const s of A.signs) if (!s.got && pl.x > s.x) { s.got = true; cp = { x: s.x, n: s.n }; GC.sfx('cp'); S.hooks.onCP && S.hooks.onCP(S.level + 1, 'mid'); for (let i = 0; i < 14; i++)parts.push({ x: s.x + 12, y: 13 * TS - 60, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, r: 3, l: 40, L: 40, c: ['#FFD23F', '#FF7EB6', '#5AB0FF'][i % 3], g: .12 }) }
  // đá: vấp ngã mất 2 vạch no · lửa trại: mất mạng
  for (const r of A.rocks) if (!r.gone && !pl.inv && pl.on && !pl.dino && hit(pl, { x: r.x + 4, y: r.y + 4, w: r.w - 8, h: r.h })) { pl.vit = Math.max(0, pl.vit - 2); pl.kb = 22; pl.vx = -2.2 * pl.face; pl.vy = -4; pl.inv = 50; GC.sfx('thud'); S.hits++; S.hooks.onPower && S.hooks.onPower('ai_trip'); if (pl.skate) loseSkate() }
  for (const f of A.fires) if (!pl.fairy && !pl.inv && pl.dino !== 'red' && hit(pl, { x: f.x + 6, y: f.y + 8, w: f.w - 12, h: f.h - 8 })) { if (pl.dino || pl.skate) { pl.dino ? loseDino() : loseSkate(); pl.vy = -6; pl.vx = -3 * pl.face; continue } return die('fire') }
  for (const u of A.urchins) if (!pl.fairy && !pl.inv && hit(pl, { x: u.x + 4, y: u.y + 4, w: u.w - 8, h: u.h - 6 })) { if (pl.dino || pl.skate) { pl.dino ? loseDino() : loseSkate(); pl.vy = -4; continue } return die('urchin') }
  for (const c of A.cacti) if (!pl.fairy && !pl.inv && hit(pl, { x: c.x + 5, y: c.y + 4, w: c.w - 10, h: c.h - 4 })) { if (pl.dino || pl.skate) { pl.dino ? loseDino() : loseSkate(); pl.vy = -6; pl.vx = -3 * pl.face; continue } return die('cactus') }
  for (const q of A.falling) if (!q.done && !pl.fairy && hit(pl, { x: q.x + 4, y: q.y + 4, w: q.w - 8, h: q.h - 6 })) return die('stone');
  // quái: không giẫm được — chỉ tiên Honey (bất tử) hạ được bằng cách chạm
  for (const e of A.en) {
    if (e.dead || !e.act || e.hid || !hit(pl, { x: e.x + 3, y: e.y + 3, w: e.w - 6, h: e.h - 4 })) continue;
    if (pl.fairy) { kill(e); continue }
    if (pl.inv) continue;
    if (pl.dino) { loseDino(); pl.vx = (pl.x < e.x ? -1 : 1) * 3; pl.vy = -5; continue }   // khủng long đỡ 1 lần rồi chạy mất
    if (pl.skate) { loseSkate(); pl.vx = (pl.x < e.x ? -1 : 1) * 3; pl.vy = -5; continue }
    return die('hit');
  }
  for (const f of A.ef) if (hit(pl, { x: f.x + 2, y: f.y + 2, w: f.w - 4, h: f.h - 4 })) { if (pl.fairy || pl.inv) continue; if (pl.dino) { loseDino(); f.l = 0; continue } if (pl.skate) { loseSkate(); f.l = 0; continue } return die('hit') }
  const B = A.boss; if (B && B.act && !B.fall && !pl.inv && hit(pl, { x: B.x + 8, y: B.y + 8, w: B.w - 16, h: B.h - 8 })) { if (pl.dino) { loseDino(); pl.vx = -4; pl.vy = -6 } else if (pl.skate) { loseSkate(); pl.vx = -4; pl.vy = -6 } else if (!pl.fairy) return die('hit') }
  // đích · trùm
  if (A.goal && !A.goal.done && pl.x + pl.w > A.goal.x + 8) { A.goal.done = true; GC.music.hush(true); GC.sfx('airound'); pl.auto = { ph: 'goal', t: 0 }; pl.vx = 0; return }
  if (A.arena && !B.act && pl.x > A.arena) { B.act = true; A.lockX = A.arena - 2 * TS; S.hooks.onPower && S.hooks.onPower('ai_boss'); syncMusic(true); banner = { t: 150, w: 'BOSS', text: A.boss.kind === 2 ? '😼 Vua Mèo đô vật — ném rìu / quất đuôi vào nó!' : '👹 Vua Quỷ Quiller — ném rìu vào nó!' } }
  // rơi hố · nước · dung nham
  const ft = getT(A, Math.floor((pl.x + pl.w / 2) / TS), Math.floor((pl.y + pl.h - 6) / TS));
  if ((ft === 'W' && pl.dino !== 'sea') || (ft === 'L' && pl.dino !== 'red')) { for (let i = 0; i < 16; i++)parts.push({ x: pl.x + 11, y: 13 * TS, vx: (Math.random() - .5) * 5, vy: -2 - Math.random() * 4, r: 3, l: 40, L: 40, c: ft === 'W' ? '#BFEFFF' : '#FFB23A', g: .2 }); return die(ft === 'W' ? 'water' : 'lava') }
  if (pl.y > ROWS * TS + 30) { S.falls++; return die('pit') }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function eatFruit(f) { f.got = true; S.coins++; S.energy += COST.fruit; pl.vit = Math.min(VMAX, pl.vit + (f.k === 'banana' || f.k === 'melon' || f.k === 'pine' ? 2 : 1)); GC.sfx('coin'); pops.push({ x: f.x + 10, y: f.y, t: 30, k: f.k }); if (S.coins % 40 === 0 && S.lives < 9) { S.lives++; GC.sfx('cp'); S.hooks.onPower && S.hooks.onPower('ai_life') } }
function loseDino() { const k = pl.dino; if (!k) return; pl.dino = null; pl.inv = 90; A.flee.push({ k, x: pl.x - 6, y: pl.y + 12, vx: -pl.face * 3.5, t: 0 }); GC.sfx('shrink'); S.hooks.onPower && S.hooks.onPower('ai_dinooff') }
function dinoAtk() {   // đòn của khủng long: xanh quất đuôi · đỏ phun lửa · rồng biển phun bong bóng · thằn lằn bay thả đá
  const k = pl.dino; use(COST.shot); pl.thr = 10;
  if (k === 'blue') { if (pl.whip) return; pl.whip = 16; GC.sfx('kick'); const box = { x: pl.face > 0 ? pl.x + pl.w - 4 : pl.x - 48, y: pl.y + 4, w: 52, h: 40 };
    for (const e of A.en) if (!e.dead && e.act && !e.hid && hit(box, e)) { e.hp -= 2; if (e.hp <= 0) kill(e); else e.flash = 10 }
    for (const r of A.rocks) if (!r.gone && hit(box, r)) { r.gone = true; GC.sfx('break'); for (let i = 0; i < 8; i++)parts.push({ x: r.x + 12, y: r.y + 8, vx: (Math.random() - .5) * 5, vy: -2 - Math.random() * 3, r: 3, l: 34, L: 34, c: '#A8A8A8', g: .25 }) }
    for (const e of A.eggs) if (!e.open && hit(box, e)) openEgg(e);
    const B = A.boss; if (B && B.act && !B.fall && !B.hurt && hit(box, B)) { B.hp -= 2; B.hurt = 26; GC.sfx('bump'); if (B.hp <= 0) bossDown() } return }
  if (SH.length >= 3) return;
  if (k === 'red') { SH.push({ k: 'fire', x: pl.x + (pl.face > 0 ? pl.w : -14), y: pl.y + 14, w: 16, h: 16, vx: 7.2 * pl.face, vy: 0, l: 80, rot: 0 }); GC.sfx('fireball') }
  else if (k === 'sea') { SH.push({ k: 'bub', x: pl.x + (pl.face > 0 ? pl.w : -14), y: pl.y + 18, w: 16, h: 16, vx: 5 * pl.face, vy: 0, l: 70, rot: 0 }); GC.sfx('pop') }
  else { SH.push({ k: 'drop', x: pl.x + 4, y: pl.y + 36, w: 14, h: 14, vx: pl.vx * .6, vy: 2, l: 80, rot: 0 }); GC.sfx('pop') }
}
function loseSkate() { pl.skate = 0; pl.inv = 80; GC.sfx('shrink'); S.hooks.onPower && S.hooks.onPower('ai_skateoff') }
function throwIt() {
  use(COST.shot); pl.thr = 12; const fire = pl.wp === 2;
  if (pl.wp === 3) { SH.push({ k: 'boom', x: pl.x + (pl.face > 0 ? pl.w - 4 : -10), y: pl.y + 12, w: 16, h: 16, vx: 7.5 * pl.face, f0: pl.face, vy: 0, l: 160, rot: 0, back: 0 }); GC.sfx('pop'); return }   // boomerang: bay xa rồi quay về tay
  const uw = !!THEMES[A.th].under; SH.push({ k: fire ? 'fire' : 'axe', uw, x: pl.x + (pl.face > 0 ? pl.w - 4 : -10), y: pl.y + 10, w: 16, h: 16, vx: (fire ? 7 : uw ? 4.6 : 5.2) * pl.face + pl.vx * .3, vy: fire ? 0 : uw ? -1 : -5.5, l: 90, rot: 0 });   // dưới nước rìu bay thẳng, chìm chậm
  GC.sfx(fire ? 'fireball' : 'pop');
}
function kill(e) { if (e.dead) return; e.dead = 40; e.vy = -6; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp); for (let i = 0; i < 8; i++)parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, r: 3, l: 30, L: 30, c: ['#FFFFFF', '#FFD23F', '#FF7EB6'][i % 3], g: .15 }) }
function openEgg(e, byHand) {
  e.open = 1; GC.sfx('crack'); for (let i = 0; i < 10; i++)parts.push({ x: e.x + 11, y: e.y + 12, vx: (Math.random() - .5) * 4, vy: -2 - Math.random() * 3, r: 3, l: 34, L: 34, c: i % 2 ? '#FFFFFF' : '#F8B8D8', g: .2 });
  let k = e.k; if (k === 'wpn') k = !pl.wp ? 'axe' : PART === 2 && pl.wp === 1 ? 'boom' : pl.wp === 1 && S.level >= 2 ? 'fire' : 'milk';
  A.items.push({ k, x: byHand ? e.x + 36 * pl.face : e.x - 1, y: e.y - 6, w: 24, h: 24, up: 16, got: false, t: 0 });
}
function takeItem(it) {
  it.got = true; GC.sfx('power');
  if (it.k === 'axe') { if (pl.wp < 1) setWp(1) } else if (it.k === 'fire') setWp(2); else if (it.k === 'boom') setWp(3);
  else if (it.k.startsWith('d_')) { pl.dino = it.k.slice(2); pl.skate = 0; S.hooks.onPower && S.hooks.onPower('ai_dino_' + pl.dino); return }
  else if (it.k === 'skate') { if (THEMES[A.th].under) pl.vit = VMAX; else if (!pl.dino) pl.skate = 1 } else if (it.k === 'fairy') pl.fairy = 600; else if (it.k === 'milk') pl.vit = VMAX;
  S.hooks.onPower && S.hooks.onPower('ai_' + it.k);
}
function stepEggs() {
  for (const it of A.items) {
    if (it.got) continue; if (it.up > 0) { it.up -= 2; it.y -= 2; continue } it.t++;
    if (it.k === 'nasu') {   // cà tím: bay tới bám theo em, hút thanh no
      const tx = pl.x + pl.w / 2 - 12, ty = pl.y - 30; it.x += (tx - it.x) * .05; it.y += (ty - it.y) * .05;
      if (Math.abs(it.x - tx) < 18 && Math.abs(it.y - ty) < 18) { it.got = true; pl.nasu = 480; GC.sfx('bad'); S.hooks.onPower && S.hooks.onPower('ai_nasu') }
    }
  }
}
function stepShots() {
  for (let i = SH.length - 1; i >= 0; i--) {
    const s = SH[i]; s.x += s.vx; s.rot += .4 * Math.sign(s.vx);
    if (s.k === 'axe' || s.k === 'drop') { s.vy += s.uw ? .04 : .35; s.y += s.vy } else if (s.k === 'boom') { s.vx -= .26 * s.f0; s.y += (pl.y + 12 - s.y) * .08; if (s.vx * s.f0 < 0) s.back = 1 } else s.y += Math.sin(S.tick * .5) * .8;
    let gone = --s.l <= 0 || (s.k !== 'boom' && (!onScreen(s.x, 20) || solid(Math.floor((s.x + 8) / TS), Math.floor((s.y + 8) / TS)) || s.y > 13 * TS)) || (s.back && hit(s, pl));
    for (const e of A.en) if (!gone && !e.dead && e.act && !e.hid && hit(s, e) && !(s.k === 'boom' && e.bh === s)) { e.hp -= s.k === 'fire' ? 2 : 1; if (e.hp <= 0) kill(e); else { e.flash = 10; GC.sfx('bump') } if (s.k === 'boom') e.bh = s; else gone = true }   // boomerang xuyên qua quái
    for (const e of A.eggs) if (!gone && !e.open && hit(s, e)) { openEgg(e); gone = true }
    const B = A.boss; if (!gone && B && B.act && !B.fall && hit(s, B)) { gone = true; if (!B.hurt) { B.hp -= s.k === 'fire' ? 2 : 1; B.hurt = 26; GC.sfx('bump'); if (B.hp <= 0) bossDown() } }
    if (gone) SH.splice(i, 1);
  }
}
function stepEnemies() {
  const SP = LVC.spd;
  for (const e of A.en) {
    if (!e.act) { if (e.x < camX + vw + 40) e.act = true; else continue }
    if (e.dead) { e.dead--; e.vy += .4; e.y += e.vy; continue }
    if (e.flash) e.flash--; e.t++;
    if (e.x < camX - 200) { e.dead = 1; continue }
    if (e.k === 'snail') { e.vx = -.55 * SP; moveX(e); e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'frog') { if (e.on && e.t % 80 === 0) { e.vy = -7; e.vx = (pl.x < e.x ? -1.6 : 1.6) * SP } if (e.on && e.t % 80 > 4) e.vx = 0; moveX(e); e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'cobra') { e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'fox') { if (e.x - pl.x < vw * .8) e.run = 1; if (e.run) { e.vx = -3.3 * SP; moveX(e) } e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'boulder') { e.vx = -1.9 * SP; moveX(e); e.vy = Math.min(e.vy + GH, 10); const wasOn = e.on; moveY(e); if (e.on && !wasOn) e.vy = -3; e.rot = (e.rot || 0) - .12 * SP }
    else if (e.k === 'fishU') { e.x -= .9 * SP; e.y = e.by + Math.sin(e.t * .06) * 20 }
    else if (e.k === 'squid') { e.x -= .6 * SP; e.y = e.by + Math.sin(e.t * .05) * 32 }   // mực nhấp nhô lên xuống
    else if (e.k === 'pig') { e.vx = -.95 * SP; moveX(e); if (e.hitX) e.x -= 1; e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'scorp') { const dash = e.t % 120 > 85; e.vx = (dash ? -2.6 : -.5) * SP; moveX(e); e.vy = Math.min(e.vy + GH, 10); moveY(e) }   // bọ cạp: thỉnh thoảng lao tới
    else if (e.k === 'penguin') { e.vx = -1.6 * SP; moveX(e); if (e.on && e.t % 70 === 0) e.vy = -6; e.vy = Math.min(e.vy + GH, 10); moveY(e) }
    else if (e.k === 'vulture') { e.x -= 1.5 * SP; const over = Math.abs(e.x - pl.x) < 120; e.by += over && e.by < 11.5 * TS ? 2.2 : e.by > 6 * TS ? -1 : 0; e.y = e.by + Math.sin(e.t * .08) * 6 }   // kền kền: lượn xuống khi bay qua đầu
    else if (e.k === 'bat') { e.x -= 1.3 * SP; e.y = e.by + Math.sin(e.t * .07) * 34 }
    else if (e.k === 'bird') { e.x -= 2 * SP; e.y = e.by + Math.sin(e.t * .1) * 10 }
    else if (e.k === 'ghost') { e.x -= .8 * SP; e.y = e.by + Math.sin(e.t * .05) * 40 }
    else if (e.k === 'spider') { const k = .5 + .5 * Math.sin(e.t * .035 * SP); e.y = e.by + k * 9.6 * TS }
    else if (e.k === 'fish') {   // cá kiếm nhảy vọt khỏi mặt nước
      const per = 150, t = e.t % per, air = 60;
      if (t < air) { const u = t / air; e.hid = 0; e.x = e.x0 + (e.x1 - e.x0 - e.w) * u; e.y = 13 * TS - 6 - Math.sin(u * Math.PI) * 4.4 * TS; e.face = 1 } else e.hid = 1;
    }
    if (!FLY.has(e.k) && e.y > ROWS * TS + 40) e.dead = 1;
  }
}
function stepFalling() {
  for (const q of A.falling) {
    if (q.done) continue;
    if (!q.go && pl.x + pl.w > q.x - 95 && pl.x < q.x + q.w) q.go = true;
    if (q.go) { q.vy = Math.min(q.vy + .45, 11); q.y += q.vy; if (q.y + q.h >= 13 * TS) { q.done = true; GC.sfx('thud'); for (let i = 0; i < 8; i++)parts.push({ x: q.x + 12, y: 13 * TS - 4, vx: (Math.random() - .5) * 4, vy: -Math.random() * 3, r: 3, l: 30, L: 30, c: '#B89880', g: .2 }) } }
  }
}
function stepBoss() {
  const B = A.boss; if (!B) return;
  for (let i = A.ef.length - 1; i >= 0; i--) { const f = A.ef[i]; f.x += f.vx; f.vy += .22; f.y += f.vy; if (f.y > 13 * TS - f.h) { f.y = 13 * TS - f.h; f.vy = -f.vy * .55; if (Math.abs(f.vy) < 1.5) f.vy = -3 } if (--f.l <= 0 || f.x < A.lockX - 40) A.ef.splice(i, 1) }
  if (B.fall) { B.vy += .4; B.y += B.vy; if (B.y > ROWS * TS + 100 && !B.dead) { B.dead = true } return }
  if (!B.act) return; B.t++; if (B.hurt) B.hurt--;
  const fury = 1 - B.hp / B.max;
  B.vy = Math.min(B.vy + .5, 12); B.y += B.vy; if (B.y >= 13 * TS - B.h) { B.y = 13 * TS - B.h; B.vy = 0; B.on = true } else B.on = false;
  if (B.on && B.t % Math.round(120 - fury * 40) === 0) { B.vy = -9 - fury * 3; B.jx = (pl.x < B.x ? -1 : 1) * (1.4 + fury) }
  if (!B.on) B.x = clamp(B.x + (B.jx || 0), A.lockX + 4 * TS, (A.w - 1) * TS - B.w);
  if (B.t % Math.round(95 - fury * 35) === 30) { A.ef.push({ x: B.x + 4, y: B.y + 22, w: 18, h: 18, vx: -2.6 - Math.random() * 1.6 - fury, vy: -5 - Math.random() * 3, l: 260 }); GC.sfx('fireball') }
}
function bossDown() { const B = A.boss; if (B.fall) return; B.fall = true; B.vy = -7; S.boss = true; A.ef.length = 0; GC.music.hush(true); GC.sfx(PART === 2 ? 'ai2win' : 'aiarea'); A.princess.show = true; S.hooks.onPower && S.hooks.onPower('ai_bossdown'); for (let i = 0; i < 40; i++)parts.push({ x: B.x + 30, y: B.y + 30, vx: (Math.random() - .5) * 8, vy: -Math.random() * 7, r: 4, l: 60, L: 60, c: ['#FFD23F', '#FF7EB6', '#5AB0FF', '#3FBF86'][i % 4], g: .15 }); pl.auto = { ph: 'win', t: 0 } }
/* ═════ mạng ═════ */
function die(why) {
  if (pl.dino && why !== 'pit') { loseDino(); return }   // đang cưỡi: khủng long đỡ thay (trừ rơi vực)
  if (pl.auto && pl.auto.ph === 'die') return;
  S.lives--; S.hits++; pl.skate = 0; pl.dino = null; pl.fairy = 0; pl.nasu = 0; pl.kb = 0; pl.vx = 0; pl.vy = 0; pl.on = false;
  GC.music.hush(true); GC.sfx('aimiss'); pl.auto = { ph: 'die', t: 0, why, pit: why === 'pit' || why === 'water' || why === 'lava' };
}
function afterDeath(why) {
  const msg = { urchin: '🦔 Đụng cầu gai!', cactus: '🌵 Đụng xương rồng gai!', pit: '😱 Rơi xuống vực!', water: '🌊 Rơi xuống nước!', lava: '🔥 Rơi vào dung nham!', hit: '💥 Bị quái đụng!', fire: '🔥 Chạm lửa trại!', stone: '🪨 Bị nhũ đá rơi trúng!', hungry: '🍎 Đói lả rồi — nhớ ăn trái cây!' }[why] || '';
  if (S.lives <= 0) {
    S.lives = LIVES; S.overs++; loadLevel(S.level); banner = { t: 220, w: 'GAME OVER', text: '💪 Chơi lại Màn ' + (S.level + 1) }; GC.sfx('bad');
    S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chơi lại từ đầu Màn ' + (S.level + 1) + ' (không phải từ Màn 1 đâu) — có ' + LIVES + ' mạng mới, cố lên!');
  } else { respawn(); GC.music.hush(false); syncMusic(true); S.hooks.onFall && S.hooks.onFall(0, msg + ' 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · quay lại ' + (cp.n ? 'biển số ' + cp.n : 'đầu màn ' + (S.level + 1)) + ' — cố lên!') }
}
function respawn() {
  pl.x = cp.x; pl.y = 13 * TS - pl.h; pl.vx = pl.vy = 0; pl.kb = 0; pl.inv = 70; pl.vit = VMAX; SH.length = 0; A.ef.length = 0; camX = Math.max(0, cp.x - vw * .35);
  for (const e of A.en) if (e.x < cp.x + 3 * TS && e.x > cp.x - 6 * TS && !e.dead) e.dead = 1;   // không để quái đứng ngay chỗ hồi sinh
  if (A.boss && A.boss.act && !A.boss.fall) { pl.x = A.arena - TS; A.boss.x = (A.w - 7) * TS }
}
function stepAuto() {
  const T = pl.auto; T.t++;
  if (T.ph === 'die') {   // khựng lại, bay lên rồi rơi khỏi màn hình như bản gốc
    if (!T.pit && T.t === 20) pl.vy = -9;
    if (!T.pit && T.t > 20) { pl.vy = Math.min(pl.vy + .5, 12); pl.y += pl.vy }
    if (T.t > 190) { pl.auto = null; afterDeath(T.why) }
    return;
  }
  if (T.ph === 'goal') {   // qua màn: đi vào cổng, nhạc Round Clear
    pl.face = 1; pl.vx = 2; pl.walk += .3; moveX(pl); pl.vy = Math.min(pl.vy + GH, 12); moveY(pl);
    if (T.t % 8 === 0 && pl.vit > 0) { pl.vit = Math.max(0, pl.vit - 1); S.energy += 1 }   // đổi thanh no còn lại thành ⚡ thưởng
    if (T.t > 300) { pl.auto = null; S.hooks.onCP && S.hooks.onCP(S.level + 1, 'lv'); loadLevel(Math.min(NL - 1, S.level + 1)) }
    return;
  }
  if (T.ph === 'win') {   // hạ trùm: chạy tới công chúa Tina
    pl.vy = Math.min(pl.vy + GH, 12); moveY(pl);
    if (T.t > 80) { pl.face = 1; if (pl.x < A.princess.x - 40) { pl.vx = 2; pl.walk += .3; moveX(pl) } else if (!S.won) { S.won = true; pl.vx = 0; S.hooks.onWin && S.hooks.onWin() } }
  }
}

/* ═════ hình ảnh: pixel art kiểu NES (1 điểm ảnh = 2px thế giới) ═════ */
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
function blit(img, x, y, s, flip) { if (flip) { ctx.save(); ctx.translate(Math.round(x + img.width * s), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width * s, img.height * s); ctx.restore() } else ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s) }
/* cậu bé Higgins: mũ trắng · tóc nâu · váy lá xanh (nhìn sang phải) */
const HTOP = ['____wwwwww____', '__wwwwwwwwww__', '_wwwwwwwwwwWW_', '_hhwwwwwwwwwWW', 'hhhhssssskss__', 'hhhssssssksS__', '_hhsssssssss__', '__hssssssrr___', '___sssssss____', '____ssssss____'];
const H_ST = HTOP.concat(['__ssssssssss__', '_sssssssssssss', '_ss_ssssssss_s', '_ss_ssssssss__', '____gggggggg__', '____gGgGgGgG__', '____gggggggg__', '_____ss__ss___', '_____ss__ss___', '____SSS__SSS__']);
const H_W1 = HTOP.concat(['__ssssssssss__', '_sssssssssssss', 's_s_ssssssss_s', '___sssssssss_s', '____gggggggg__', '____gGgGgGgG__', '___ggggggggg__', '___ss_____ss__', '__ss_______ss_', '_SSS______SSS_']);
const H_W2 = HTOP.concat(['__ssssssssss__', '_sssssssssssss', '_ss_ssssssss_s', '_ss_ssssssss__', '____gggggggg__', '____gGgGgGgG__', '____gggggggg__', '______sss_____', '______ss_s____', '_____SSS_SS___']);
const H_J = HTOP.concat(['s_ssssssssss_s', 'sssssssssssss_', '___sssssssss__', '____ssssssss__', '___ggggggggg__', '___gGgGgGgGg__', '__ggggggggggg_', '__sss____sss__', '_ss________ss_', 'SS__________SS']);
const H_T = HTOP.concat(['__ssssssssssss', '_ssssssssss_ss', '_ss_ssssssss__', '_ss_ssssssss__', '____gggggggg__', '____gGgGgGgG__', '____gggggggg__', '_____ss__ss___', '_____ss__ss___', '____SSS__SSS__']);
const PH = { w: '#F8F8F8', W: '#BCBCBC', h: '#7C2800', s: '#FCA044', S: '#C84C0C', k: '#000000', r: '#E40058', g: '#00A800', G: '#005800' };
/* quái (nhìn sang trái) */
const SNAIL = ['_e__e_________', '_e__e_________', '_ee_e___pppp__', '__eee__pPPPPp_', '__ggg_pPppppPp', '_gggg_pPpPPpPp', '_ggggggPpPppPp', '_gggggggPPPPp_', 'gggggggggggggg', '_gggggggggggg_'];
const FROG = ['__ww____ww__', '_wkww__wwkw_', '_wwwwggwwww_', 'gggggggggggg', 'gGgggggggggg', 'gggggggggggg', 'ggyyyyyyyygg', '_gyyyyyyyyg_', 'gg__gggg__gg', 'g____gg____g'];
const COBRA = ['__vvvv____', '_vvvvvv___', 'vwkvvkwv__', 'vvvvvvvv__', '_vvrrvv___', '__vvvv____', '___vvv____', '___vvvv___', '____vvv___', '___vvvv___', '__vvvvv___', '_vvvVvvv__', 'vvvVVVvvvv', 'vvVVVVVvvv', '_vvvvvvvvv', '__vvvvvvv_'];
const BAT1 = ['b______________b', 'bb____bbbb____bb', 'bbb__bbbbbb__bbb', 'bbbbbbwbbwbbbbbb', '_bbbbbbbbbbbbbb_', '__bbb_bbbb_bbb__', '_______bb_______'];
const BAT2 = ['______bbbb______', '__b__bbbbbb__b__', '_bbbbbwbbwbbbbb_', 'bbbbbbbbbbbbbbbb', 'bb__bbbbbbbb__bb', 'b______bb______b', '________________'];
const SPIDER = ['k__k____k__k', '_k_k_kk_k_k_', '__kkkkkkkk__', 'kkkkrkkrkkkk', '_kkkkkkkkkk_', 'k_kkkkkkkk_k', '_k_k_kk_k_k_', 'k__k____k__k'];
const FOX1 = ['__o______________', '_ooo_____________', 'oowoo___________o', 'okoooooooooooooo_', '_oowooooooooooo__', '___wwoooooooooo__', '____oo___o__oo___', '___oo___oo___oo__'];
const FOX2 = ['__o______________', '_ooo_____________', 'oowoo___________o', 'okoooooooooooooo_', '_oowooooooooooo__', '___wwoooooooooo__', '_____oo_oo_oo____', '_____o__o__o_____'];
const GHOST = ['____bbb____', '___bbwbb___', '__bbwwwbb__', '_bbwwwwwbb_', '_bwkwwwkwb_', 'bbwkwwwkwbb', 'bwwwwwwwwwb', 'bwwwrrrwwwb', 'bwwwwwwwwwb', '_bwbwbwbwb_', '_b_b_b_b_b_'];
const BIRD = ['____rrrr____', '__rrrrrrrw__', '_rrrrrrrrwkw', 'RRrrrrrrrrwy', 'RRRRrrrrrryy', '_RRRrrrrrr__', '___rrrrrr___', '____o__o____'];
const FISH = ['_____bb___________', '____bbbb__________', 'b__bbbbbbbbbbbbbbb', 'bbbbbbbwkbbbbb____', 'bbbbbbbbbbbbbb____', 'b__bbBBBBBbbb_____', '____bbbb__________'];
const ROCK = ['____gggg____', '__ggGGGGgg__', '_gGGwGGGGGg_', 'gGGwGGGGGGGg', 'gGGGGGGGGGGg', 'gGGGGGGGGGgg', 'ggGGGGGGGggg', '_gggggggggg_', '__gggggggg__'];
const EGG = ['____wwww____', '___wwwwww___', '__wwppwwww__', '_wwwppwwwww_', '_wwwwwwggww_', 'wwwwwwwggwww', 'wwggwwwwwwww', 'wwggwwwwwppw', 'wwwwwwwwwppw', 'wwwwppwwwwww', '_wwwppwwwww_', '_wwwwwwwwww_', '__wwwwwwww__', '____wwww____'];
const AXE = ['__gggg____', '_gGGGGg___', 'gGGwGGGg__', 'gGGGGGGgb_', '_gGGGGgbb_', '__gggbbb__', '_____bb___', '____bb____', '___bb_____', '__bb______'];
const FIREB = ['__oooo__', '_oyyyyo_', 'oyywwyyo', 'oywwwwyo', 'oywwwwyo', 'oyywwyyo', '_oyyyyo_', '__oooo__'];
const SKATEB = ['__rrrrrrrrrrrr__', '_rRRRRRRRRRRRRr_', 'rrrrrrrrrrrrrrrr', '___kk______kk___', '___kk______kk___'];
const FAIRY = ['_w__pppp__w_', 'ww_pPPPPp_ww', 'wwwpskskpwww', 'wwwpssssp_ww', '_w__prrp__w_', '___pppppp___', '__pppppppp__', '___pp__pp___'];
const MILK = ['__ww__', '_wbbw_', '_wwww_', 'wwwwww', 'wbbbbw', 'wbwwbw', 'wbbbbw', 'wwwwww', 'wwwwww', '_wwww_'];
const NASU = ['___gg_____', '__gggg____', '_gggggg___', '__vvvvvv__', '_vvwkvwkv_', '_vvvvvvvv_', 'vvvvvvvvvv', 'vvvrrrrvvv', 'vVvvvvvvvv', '_vVvvvvvv_', '__vvvvvv__', '___vvvv___'];
const FR = {
  apple: [['___k____', '___kg___', '_rrkrrr_', 'rrrrrwrr', 'rrrrrrwr', 'rrrrrrrr', 'rrrrrrrr', '_rrrrrr_', '__rrrr__'], { k: '#7C2800', g: '#00A800', r: '#E40058', w: '#FFFFFF' }],
  banana: [['________k__', '_______yy__', '______yyy__', '____yyyyy__', '__yyyyyyY__', 'yyyyyyyYY__', '_yyyyyYYY__', '__YYYYYY___'], { k: '#7C2800', y: '#F8D800', Y: '#C88C00' }],
  melon: [['___gGgGg___', '_gGgGgGgGg_', 'gGgGgGgGgGg', 'GgGgGgGgGgG', 'gGgGgGgGgGg', '_gGgGgGgGg_', '___gGgGg___'], { g: '#00A800', G: '#80D010' }],
  pine: [['__g_g_g__', '___ggg___', '__ggggg__', '___ggg___', '_yYyYyYy_', 'yYyYyYyYy', 'YyYyYyYyY', 'yYyYyYyYy', 'YyYyYyYyY', '_yYyYyYy_', '__yYyYy__'], { g: '#00A800', y: '#F8D800', Y: '#C88C00' }],
  grape: [['____g____', '___gk____', '__vVvVv__', '_vVvVvVv_', '__vVvVv__', '___vVv___', '____v____'], { g: '#00A800', k: '#7C2800', v: '#8800C8', V: '#C858F8' }],
  tomato: [['___ggg___', '_rgggggr_', 'rrrrrrrrr', 'rrrrrrwrr', 'rrrrrrrwr', 'rrrrrrrrr', '_rrrrrrr_', '__rrrrr__'], { g: '#00A800', r: '#F83800', w: '#FFFFFF' }] };
const DINO = ['__________bbbb____', '_________bbwkbb___', '_________bbbbbbb__', '____b_b__bbbbrrr__', '___bbbbbbbbbbb____', '__bbbbbbbbbbbb____', '_bbbbbbWWWbbb_____', 'bbbbbbbWWWWbb_____', 'bb_bbbbbWWWbb_____', 'b__bbbbbbbbbb_____', '___bbbbbbbbb______', '____bb____bb______', '____bb____bb______', '___bbb___bbb______'];
const DINO2 = DINO.slice(0, 11).concat(['___bb______bb_____', '__bb________bb____', '_bbb_______bbb____']);
const PLESIO = ['_____________pp___', '____________pwkp__', '____________pppp__', '____________pp____', '___________pp_____', '__________pp______', '____ppppppp_______', '__ppppppppppp_____', '_pppppPPPPpppp____', 'pppppPPPPPPppp____', '_ppppppppppppp____', '__pp_pp__pp_pp____'];
const PTERA = ['y______________y', 'yy_____oo_____yy', 'yyy___ooko___yyy', '_yyyyooooooyyyy_', '__yyyyoooooyyy__', '____ooooooooooo_', '_____oooooo_____', '______oo__oo____'];
const PTERA2 = ['________________', '_____oo_________', '____ooko________', 'yyyyoooooooyyyyy', '_yyyyooooooyyyy_', '____ooooooooooo_', '_____oooooo_____', '______oo__oo____'];
const PIG = ['__pp____pp__', '_pPpp__ppPp_', '_pppppppppp_', 'pwkppppppkwp', 'pppppppppppp', 'ppppPPPPpppp', 'pppPkPPkPppp', '_ppPPPPPPpp_', '__pppppppp__', '__pp____pp__', '_PPP____PPP_'];
const SCORP = ['_________ooo__', '__________oo__', '___________o__', '__o____ooooo__', '_ooo_oooooooo_', 'ooooooooookoo_', '_oOoOoOoOoOo__', 'o_o_o_o_o_o___', '_o_o_o_o_o____'];
const VULT = ['w__________________', 'ww_______bbbbb_____', '_ww____bbbbbbbbb___', '__wwbbbbbbbbbbbbbbb', '___bbbbbwwbbbbb____', '____bbbwkwbb_______', '_______wwwy________', '________yy_________', '_______b__b________'];
const PENG = ['___kkkk___', '__kkkkkk__', '_kkwkkwkk_', '_kkkyykkk_', 'kkkwwwwkkk', 'kkwwwwwwkk', 'kkwwwwwwkk', 'kkwwwwwwkk', '_kwwwwwwk_', '_kwwwwwwk_', '__kwwwwk__', '_yyy__yyy_'];
const CACTUS = ['_____gg_____', '____gGGg____', '____gGGg____', '_g__gGGg____', 'gGg_gGGg__g_', 'gGg_gGGg_gGg', 'gGggggGg_gGg', '_gGGGGGg_gGg', '__ggggGgggGg', '____gGGGGGg_', '____gGGgggg_', '____gGGg____', '____gGGg____', '____gGGg____', '____gGGg____', '____gGGg____', '___ggGGgg___'];
const BOOM = ['oo______', 'ooo_____', '_ooo____', '__ooo___', '___oooo_', '____oooo', '___oooo_', '__ooo___'];
const SQUIDS = ['____www____', '___wwwww___', '__wwwwwww__', '_wwwwwwwww_', '_wkwwwwwkw_', '_wwwwwwwww_', '__ppppppp__', '_w_w_w_w_w_', 'w__w___w__w', 'w__w___w__w'];
const URCH = ['_k__k__k__k_', '__k_k__k_k__', 'k_kkkkkkkk_k', '_kkvvvvvvkk_', 'kkvvwvvvvvkk', '_kvvvvvvvvk_', 'kkvvvvvvvvkk', '_kkvvvvvvkk_', 'k_kkkkkkkk_k', '__k_k__k_k__'];
const PRIN = ['___pppppp___', '__pppppppp__', '_ppsssssspp_', '_pskssksspp_', '_pssssssspp_', '_ppsrrsspp__', '__ssssss_p__', '__wwwwww____', '_wwwwwwww___', 'ssggggggss__', '__gGgGgGg___', '__gggggggg__', '___ss__ss___', '__SSS__SSS__'];
/* ── nền & mặt đất theo từng màn (vẽ bằng khối pixel) ── */
function drawBg() {
  const bg = A.boss && A.boss.kind === 2 && A.lockX ? 'castle' : THEMES[A.th].bg, s = sc, gy = oy + 13 * TS * s, X = (wx, k) => (wx - camX * k) * s, Y = wy => oy + wy * s, rep = (per, k, fn) => { const P = per * s, o = ((-(camX * k * s)) % P + P) % P - P; for (let x = o; x < cw + P; x += P) fn(x) };
  const sky = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch) };
  const blk = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)) };
  const trunks = (bark, dark, light, canopy, canD, bush, bushD) => {   // thân cây to + tán lá như bản gốc
    rep(170, .55, x => { const w = 58 * s; blk(bark, x, 0, w, gy); blk(dark, x + w * .72, 0, w * .28, gy); blk(light, x + w * .12, 0, w * .12, gy);
      for (let yy = 140; yy < 416; yy += 34) { blk(dark, x + w * .3, Y(yy), w * .26, 4 * s); blk(dark, x + w * .5, Y(yy + 16), w * .2, 4 * s) } blk(dark, x - 8 * s, Y(110), 14 * s, 6 * s); blk(dark, x + w - 6 * s, Y(126), 14 * s, 6 * s) });
    const bump = (c, cx, cy, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill() };
    blk(canD, 0, 0, cw, Y(70)); rep(56, .55, x => { bump(canD, x + 28 * s, Y(78), 30 * s); bump(canopy, x + 28 * s, Y(70), 28 * s); bump(canopy, x + 4 * s, Y(40), 22 * s); blk(canD, x + 20 * s, Y(56), 4 * s, 4 * s); blk(canD, x + 34 * s, Y(72), 4 * s, 4 * s); blk(mix(canopy, '#ffffff', .25), x + 18 * s, Y(50), 8 * s, 3 * s) }); blk(canopy, 0, 0, cw, Y(36));
    rep(80, .75, x => { bump(bushD, x + 40 * s, Y(372), 42 * s); bump(bush, x + 40 * s, Y(376), 40 * s); bump(bush, x + 4 * s, Y(384), 26 * s); blk(mix(bush, '#ffffff', .3), x + 26 * s, Y(346), 10 * s, 3 * s); blk(bushD, x + 52 * s, Y(372), 4 * s, 10 * s) }); blk(bush, 0, Y(392), cw, gy - Y(392));
  };
  if (bg === 'sea') { sky('#0078F8', '#002888'); const sy = Y(1.6 * TS); blk('#A8E4FC', 0, 0, cw, sy);
    ctx.globalAlpha = .12; for (let i = 0; i < 5; i++) { const per = cw + 300, x = ((i * 260 - camX * s * .15 + Math.sin(S.tick * .01 + i) * 30) % per + per) % per - 150; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + 70 * s, sy); ctx.lineTo(x + 170 * s, ch); ctx.lineTo(x + 60 * s, ch); ctx.fill() } ctx.globalAlpha = 1;
    rep(300, .25, x => { ctx.fillStyle = '#0030A8'; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + 40 * s, gy - 90 * s); ctx.lineTo(x + 90 * s, gy - 60 * s); ctx.lineTo(x + 150 * s, gy - 140 * s); ctx.lineTo(x + 220 * s, gy - 50 * s); ctx.lineTo(x + 280 * s, gy); ctx.fill() });
    ctx.strokeStyle = '#DFF4FF'; ctx.lineWidth = 1.5; ctx.globalAlpha = .45; for (let i = 0; i < 24; i++) { const x = ((i * 113 - camX * s * .4) % (cw + 40) + cw + 40) % (cw + 40) - 20, y = ch - ((S.tick * (.5 + (i % 4) * .25) + i * 67) % Math.max(1, ch - sy)); ctx.beginPath(); ctx.arc(x, y, (2 + i % 3) * s * 1.5, 0, 7); ctx.stroke() } ctx.globalAlpha = 1;
    for (let x = 0; x < cw; x += 8 * s) blk('#DFF4FF', x, sy - 5 * s + Math.round(Math.sin((x / s + S.tick * 2) * .03) * 2) * s, 8 * s, 3 * s) }   // biển sâu: tia nắng · bong bóng · mặt nước
  else if (bg === 'autumn') { sky('#000088', '#0000A8'); rep(180, .3, x => { ctx.fillStyle = '#005800'; ctx.beginPath(); ctx.moveTo(x, Y(400)); ctx.lineTo(x + 90 * s, Y(250)); ctx.lineTo(x + 180 * s, Y(400)); ctx.fill() }); trunks('#F87800', '#C84C0C', '#FCA044', '#C84C0C', '#7C2800', '#005800', '#003800') }   // rừng thu lá cam như bản gốc
  else if (bg === 'lake' || bg === 'plains') { sky('#3CBCFC', '#A8E4FC'); const cl = (x, y, k) => { blk('#FFFFFF', x, y + 10 * s * k, 70 * s * k, 16 * s * k); blk('#FFFFFF', x + 12 * s * k, y, 30 * s * k, 14 * s * k); blk('#FFFFFF', x + 34 * s * k, y + 4 * s * k, 26 * s * k, 10 * s * k) };
    for (let i = 0; i < 5; i++) { const per = cw + 200 * s, x = ((i * 257 * s - camX * s * .2 + S.tick * .15) % per + per) % per - 100 * s; cl(x, Y(30 + (i * 53) % 120), i % 2 ? 1 : 1.6) }
    if (bg === 'plains') rep(260, .4, x => { ctx.fillStyle = '#00A800'; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + 70 * s, Y(330)); ctx.lineTo(x + 140 * s, gy); ctx.fill(); ctx.fillStyle = '#005800'; ctx.beginPath(); ctx.moveTo(x + 70 * s, Y(330)); ctx.lineTo(x + 140 * s, gy); ctx.lineTo(x + 100 * s, gy); ctx.fill(); blk('#F8F8F8', x + 62 * s, Y(330), 16 * s, 4 * s) });
    rep(bg === 'lake' ? 230 : 340, .6, x => { for (let k = 0; k < 9; k++) blk(k % 2 ? '#C88C00' : '#AC7C00', x + 26 * s + Math.sin(k * .5) * 4 * s, Y(400 - k * 26), 14 * s, 26 * s); const tx = x + 33 * s, ty = Y(170); for (const [dx, dy] of [[-46, 10], [-30, -4], [14, -6], [32, 8], [-10, -14]]) { blk('#00A800', tx + dx * s - 2 * s, ty + dy * s, 34 * s, 8 * s); blk('#80D010', tx + dx * s, ty + dy * s + 2 * s, 26 * s, 3 * s) } blk('#C84C0C', tx - 6 * s, ty + 6 * s, 9 * s, 9 * s); blk('#C84C0C', tx + 4 * s, ty + 8 * s, 9 * s, 9 * s) }) }
  else if (bg === 'ice') { sky('#78C8FC', '#F0F8FF'); rep(300, .25, x => { ctx.fillStyle = '#BCD8F0'; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + 130 * s, Y(200)); ctx.lineTo(x + 260 * s, gy); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x + 100 * s, Y(232)); ctx.lineTo(x + 130 * s, Y(200)); ctx.lineTo(x + 160 * s, Y(232)); ctx.fill() });
    for (let i = 0; i < 30; i++) { const x = ((i * 113 + S.tick * (.3 + i % 3 * .2)) % cw), y = ((i * 67 + S.tick * (.8 + i % 4 * .3)) % ch); blk('#FFFFFF', x, y, s * 2, s * 2) } }
  else if (bg === 'rockcave') { sky('#3C1800', '#5C2C08');   // vách đá cuội nâu cam như bản gốc
    for (let r2 = 0; r2 < 12; r2++) rep(64, .45, x => { const yy = Y(40 + r2 * 32), ox = (r2 % 2) * 32 * s; ctx.fillStyle = '#7C3800'; ctx.beginPath(); ctx.ellipse(x + ox + 30 * s, yy + 16 * s, 28 * s, 15 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#C86C30'; ctx.beginPath(); ctx.ellipse(x + ox + 26 * s, yy + 12 * s, 22 * s, 10 * s, 0, 0, 7); ctx.fill(); blk('#F8A060', x + ox + 16 * s, yy + 6 * s, 10 * s, 3 * s) });
    blk('#383800', 0, 0, cw, Y(36)); rep(48, .45, x => { ctx.fillStyle = '#A8A800'; ctx.beginPath(); ctx.moveTo(x, Y(30)); ctx.lineTo(x + 26 * s, Y(30)); ctx.lineTo(x + 13 * s, Y(30 + 26 + (Math.abs(Math.round(x)) % 3) * 12)); ctx.fill(); blk('#D8D840', x + 4 * s, Y(30), 8 * s, 4 * s) }) }
  else if (bg === 'castle') { sky('#000058', '#0000A8');   // tường gạch xanh lâu đài
    rep(64, .5, x => { for (let r2 = 0; r2 < 14; r2++) { const yy = Y(r2 * 30), ox = (r2 % 2) * 32 * s; blk('#0058F8', x + ox + 2 * s, yy + 2 * s, 60 * s, 26 * s); blk('#3C8CFC', x + ox + 2 * s, yy + 2 * s, 60 * s, 4 * s); blk('#0000A8', x + ox + 2 * s, yy + 24 * s, 60 * s, 4 * s) } });
    rep(320, .5, x => { blk('#0000A8', x + 120 * s, 0, 56 * s, gy); blk('#3C8CFC', x + 126 * s, 0, 12 * s, gy); blk('#5CB4FC', x + 112 * s, Y(30), 72 * s, 14 * s); blk('#5CB4FC', x + 112 * s, Y(390), 72 * s, 14 * s) }) }
  else if (bg === 'jungle') { sky('#5CB4FC', '#A8E4FC'); trunks('#E07038', '#A83000', '#F8B070', '#00A800', '#005800', '#80D010', '#00A800') }
  else if (bg === 'night') { sky('#000020', '#102058'); for (let i = 0; i < 40; i++) { ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(S.tick * .03 + i)); blk('#FFFFFF', (i * 97) % cw, (i * 53) % Math.max(1, Y(330)), s * 1.5, s * 1.5) } ctx.globalAlpha = 1;
    blk('#F8F0C8', cw * .78, Y(40), 34 * s, 34 * s); blk('#000020', cw * .78 + 12 * s, Y(36), 30 * s, 30 * s); trunks('#583818', '#301800', '#806040', '#003800', '#001800', '#005800', '#003000') }
  else if (bg === 'island' || bg === 'sky') {
    if (bg === 'island') sky('#3CBCFC', '#A8E4FC'); else sky('#78C8FC', '#F8D8F8');
    const cl = (x, y, k) => { blk('#FFFFFF', x, y + 10 * s * k, 70 * s * k, 16 * s * k); blk('#FFFFFF', x + 12 * s * k, y, 30 * s * k, 14 * s * k); blk('#FFFFFF', x + 34 * s * k, y + 4 * s * k, 26 * s * k, 10 * s * k); blk('#BCE4FC', x, y + 22 * s * k, 70 * s * k, 4 * s * k) };
    for (let i = 0; i < 6; i++) { const per = cw + 200 * s, x = ((i * 237 * s - camX * s * .2 + S.tick * .15) % per + per) % per - 100 * s; cl(x, Y(30 + (i * 47) % 140), i % 2 ? 1 : 1.5) }
    if (bg === 'island') { blk('#0058F8', 0, Y(300), cw, gy - Y(300)); for (let r = 0; r < 6; r++) rep(48, .3 + r * .05, x => blk('#3CBCFC', x + (r % 2) * 20 * s, Y(308 + r * 18), 22 * s, 2 * s));
      rep(210, .6, x => { for (let k = 0; k < 9; k++) { blk(k % 2 ? '#C88C00' : '#AC7C00', x + 26 * s + Math.sin(k * .5) * 4 * s, Y(400 - k * 26), 14 * s, 26 * s) } const tx = x + 33 * s, ty = Y(170); for (const [dx, dy] of [[-46, 10], [-30, -4], [14, -6], [32, 8], [-10, -14]]) { blk('#00A800', tx + dx * s - 2 * s, ty + dy * s, 34 * s, 8 * s); blk('#80D010', tx + dx * s, ty + dy * s + 2 * s, 26 * s, 3 * s) } blk('#7C2800', tx - 6 * s, ty + 6 * s, 8 * s, 8 * s); blk('#7C2800', tx + 4 * s, ty + 8 * s, 8 * s, 8 * s) }) }
    else { rep(300, .35, x => { blk('#7C9C88', x, Y(170), 110 * s, gy - Y(170)); blk('#5C7C68', x + 80 * s, Y(170), 30 * s, gy - Y(170)); blk('#58D854', x - 4 * s, Y(160), 118 * s, 12 * s); blk('#00A800', x - 4 * s, Y(170), 118 * s, 4 * s); blk('#FFFFFF', x + 40 * s, Y(174), 22 * s, gy - Y(174)); blk('#BCE4FC', x + 46 * s, Y(174), 6 * s, gy - Y(174)); const k = (S.tick >> 2) % 3; for (let yy = 180 + k * 10; yy < 400; yy += 30) blk('#BCE4FC', x + 54 * s, Y(yy), 4 * s, 10 * s); blk('#FFFFFF', x + 30 * s, Y(392), 42 * s, 8 * s) }) }
  } else if (bg === 'cave') { sky('#100800', '#382010');
    rep(140, .4, x => { blk('#4C2C10', x, Y(60), 40 * s, gy - Y(60)); blk('#6C4420', x + 6 * s, Y(60), 8 * s, gy - Y(60)); blk('#2C1800', x + 30 * s, Y(60), 10 * s, gy - Y(60)) });
    blk('#2C1800', 0, 0, cw, Y(40)); rep(48, .4, x => { ctx.fillStyle = '#4C2C10'; ctx.beginPath(); ctx.moveTo(x, Y(40)); ctx.lineTo(x + 24 * s, Y(40)); ctx.lineTo(x + 12 * s, Y(40 + 30 + (Math.abs(x) % 3) * 14)); ctx.fill() }) }
  else if (bg === 'volcano') { sky('#280000', '#C83800');
    rep(620, .15, x => { const vx = x + 300 * s; ctx.fillStyle = '#500C0C'; ctx.beginPath(); ctx.moveTo(vx - 280 * s, gy); ctx.lineTo(vx - 50 * s, Y(160)); ctx.lineTo(vx + 50 * s, Y(160)); ctx.lineTo(vx + 280 * s, gy); ctx.fill(); ctx.fillStyle = '#3C0808'; ctx.beginPath(); ctx.moveTo(vx + 10 * s, Y(160)); ctx.lineTo(vx + 50 * s, Y(160)); ctx.lineTo(vx + 280 * s, gy); ctx.lineTo(vx + 120 * s, gy); ctx.fill(); blk('#F87800', vx - 44 * s, Y(154), 88 * s, 8 * s); blk('#F8D878', vx - 20 * s, Y(154), 30 * s, 3 * s); ctx.fillStyle = '#F83800'; ctx.beginPath(); ctx.moveTo(vx - 30 * s, Y(160)); ctx.lineTo(vx - 70 * s, Y(260)); ctx.lineTo(vx - 58 * s, Y(260)); ctx.lineTo(vx - 18 * s, Y(160)); ctx.fill();
      for (let i = 0; i < 8; i++) { const t = (S.tick * .4 + i * 40) % 160; ctx.globalAlpha = .55 * (1 - t / 160); blk('#806060', vx - 20 * s + Math.sin(i) * 20 * s, Y(140 - t), (16 + t * .2) * s, (16 + t * .2) * s) } ctx.globalAlpha = 1 });
    for (let i = 0; i < 24; i++) { const x = (i * 89 + S.tick * .3 * (i % 3 + 1)) % cw, y = ch - ((S.tick * (.6 + i % 4 * .3) + i * 47) % (ch * .8)); ctx.globalAlpha = .7; blk(['#FFB36B', '#FF7A3D', '#FFE08A'][i % 3], x, y, s * 2, s * 2) } ctx.globalAlpha = 1 }
}
const GCOL = { sea: ['#F8D878', '#C88C00', '#E8B860', '#A87C20', '#FCE0A8'], autumn: ['#00A800', '#005800', '#F87800', '#A83000', '#FCA044'], lake: ['#80D010', '#00A800', '#F8D878', '#C88C00', '#FCE0A8'], plains: ['#80D010', '#00A800', '#F8B8A8', '#E07070', '#F8D8D0'], ice: ['#FCFCFC', '#A8D8F8', '#A8D8F8', '#5CA8E8', '#E0F8FF'], rockcave: ['#D8D040', '#787800', '#A8A020', '#585800', '#E8E070'], castle: ['#F8B878', '#A86C30', '#C88C58', '#7C4C20', '#F8D8A8'], jungle: ['#80D010', '#00A800', '#E07038', '#A83000', '#F87858'], night: ['#00A800', '#005800', '#883000', '#501800', '#A84828'], island: ['#80D010', '#00A800', '#F8B8A8', '#E07070', '#F8D8D0'], sky: ['#80D010', '#00A800', '#F8D8A8', '#C89060', '#FFF0D0'], cave: ['#A86C30', '#6C3800', '#7C4C20', '#3C2008', '#A87C48'], volcano: ['#784040', '#401818', '#583030', '#280808', '#A04020'] };
function drawGround(c0, c1, below) {
  const bg = A.boss && A.boss.kind === 2 && A.lockX ? 'castle' : THEMES[A.th].bg, [gt, gd, dirt, dd, hl] = GCOL[bg], F = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h) };
  for (let c = c0; c <= c1; c++) {
    if (c < 0 || c >= A.w) continue;
    for (let r = 0; r < ROWS; r++) {
      const t = A.g[c][r], x = c * TS, y = r * TS; if (t === '.') continue;
      if (t === 'G') {
        const top = getT(A, c, r - 1) !== 'G';
        F(dirt, x, y, TS, TS);
        if (bg === 'lake' && r === 14) { F('#0058F8', x, y, TS, TS); for (let k = 0; k < 4; k++)F('#3CBCFC', x + k * 8 + ((S.tick >> 3) + c) % 6, y + 6 + (k % 2) * 10, 5, 2) }   // hồ nước dưới chân như bản gốc
        else if (bg === 'island' || bg === 'sky' || bg === 'plains' || bg === 'lake' || bg === 'sea') { for (let k = 0; k < 6; k++)F(dd, x + ((c * 7 + k * 11 + r * 5) % 28) + 2, y + ((k * 13 + c * 3) % 26) + 3, 2, 2); if (r === 14 && c % 3 === 0) { F('#FFFFFF', x + 6, y + 14, 14, 4); F('#FFFFFF', x + 4, y + 12, 4, 8); F('#FFFFFF', x + 18, y + 12, 4, 8) } }
        else if (r === 14 && bg !== 'cave' && bg !== 'volcano') { F(dd, x, y, TS, TS); F(hl, x + 2, y + 2, 13, 12); F(hl, x + 17, y + 2, 13, 12); F(hl, x + 9, y + 17, 14, 12); F(hl, x - 6 + 2, y + 17, 9, 12); F(hl, x + 25, y + 17, 7, 12) }   // hàng đá cuội như bản gốc
        else { F(dd, x + 4, y + 8, 10, 2); F(dd, x + 18, y + 20, 10, 2); F(hl, x + 8, y + 22, 6, 2); if (bg === 'volcano') { F('#F83800', x + 12, y + 12, 2, 8); F('#F83800', x + 14, y + 18, 6, 2) } }
        if (top) { F(gd, x, y, TS, 12); F(gt, x, y, TS, 8); for (let k = 0; k < 4; k++) { F(gt, x + k * 8 + 1, y + 8, 6, 4); F(gd, x + k * 8 + 2, y + 12, 4, 2) } F(mix(gt, '#ffffff', .4), x, y, TS, 2) }
      } else if (t === 'S') { F('#383838', x, y, TS, TS); F(bg === 'cave' || bg === 'volcano' ? '#A87C58' : '#BCBCBC', x + 2, y + 2, TS - 4, TS - 4); F('#FCFCFC', x + 2, y + 2, TS - 4, 3); F('#787878', x + 4, y + TS - 6, TS - 8, 3); F('#787878', x + 15, y + 6, 2, 16) }
      else if (t === 'W') { F('#0058F8', x, y, TS, TS); if (r === 13) { for (let k = 0; k < 4; k++)F('#BCE4FC', x + k * 8 + ((S.tick >> 3) + c) % 4, y + 2, 5, 2); F('#3CBCFC', x, y + 6, TS, 2) } }
      else if (t === 'L') { F('#F83800', x, y, TS, TS); if (r === 13) { for (let k = 0; k < 8; k++) { const h = 3 + ((k + (S.tick >> 3) + c) % 3); F('#FCA044', x + k * 4, y + 4 - h + 3, 4, h) } F('#F8D878', x + ((S.tick >> 2) % 28), y + 10, 3, 2) } }
    }
    const tb = A.g[c][14]; if (tb === 'G' || tb === 'W' || tb === 'L') for (let r = ROWS; r < ROWS + below; r++) { F(tb === 'G' ? (bg === 'lake' ? '#0058F8' : dd) : tb === 'W' ? '#0038B8' : '#C82800', c * TS, r * TS, TS, TS); if (tb === 'G') F(dirt, c * TS + 4, r * TS + 4, TS - 8, TS - 8) }
  }
}
function drawEnemy(e) {
  ctx.globalAlpha = e.dead ? Math.min(1, e.dead / 20) : 1; const fl = e.flash && (e.flash >> 1) & 1, f2 = (e.t >> 3) & 1, x = e.x, y = e.y, k = e.k;
  const W = fl ? { e: '#fff', g: '#fff', p: '#fff', P: '#fff', w: '#fff', k: '#fff', y: '#fff', v: '#fff', V: '#fff', r: '#fff', b: '#fff', B: '#fff', o: '#fff', R: '#fff' } : null;
  if (k === 'snail') blit(pix('snail', SNAIL, { e: '#383838', g: '#BCBCBC', p: '#F878F8', P: '#A800A8' }), x - 1, y + 2, PX, e.vx > 0);
  else if (k === 'frog') blit(pix('frog', FROG, { w: '#FFFFFF', k: '#000', g: '#00A800', G: '#005800', y: '#F8D878' }), x + 1, y + 2, PX, pl.x > x);
  else if (k === 'cobra') blit(pix('cobra' + f2, f2 ? COBRA.map((r, i) => i < 6 ? '_' + r.slice(0, -1) : r) : COBRA, { v: '#8800C8', V: '#F8D878', w: '#FFFFFF', k: '#000', r: '#F83800' }), x, y, PX, pl.x > x);
  else if (k === 'bat') blit(pix('bat' + f2, f2 ? BAT2 : BAT1, { b: '#0000BC', w: '#F8F8F8' }), x - 3, y, PX);
  else if (k === 'spider') { ctx.fillStyle = '#E0E0E0'; ctx.fillRect(x + 11, e.by - 2 * TS, 2, y - e.by + 2 * TS); blit(pix('spider', SPIDER, { k: '#000000', r: '#F83800' }), x, y, PX) }
  else if (k === 'fox') blit(pix('fox' + f2, f2 ? FOX2 : FOX1, { o: '#F87800', w: '#FFFFFF', k: '#000' }), x - 1, y + 6, PX);
  else if (k === 'ghost') blit(pix('ghost', GHOST, { b: '#0078F8', w: '#BCE4FC', k: '#000', r: '#F83800' }), x, y, PX);
  else if (k === 'bird') blit(pix('bird', BIRD, { r: '#F83800', R: '#A81000', w: '#FFFFFF', k: '#000', y: '#F8B800', o: '#F8B800' }), x, y, PX);
  else if (k === 'fish') { if (!e.hid) blit(pix('fish', FISH, { b: '#0078F8', B: '#BCE4FC', w: '#FFFFFF', k: '#000' }), x, y, PX, true) }
  else if (k === 'fishU') blit(pix('fishU', FISH, { b: '#F87800', B: '#FCE0A8', w: '#FFFFFF', k: '#000' }), x, y, PX, false);
  else if (k === 'squid') blit(pix('squid', SQUIDS, { w: '#FCFCFC', k: '#000', p: '#F878F8' }), x, y, PX);
  else if (k === 'pig') blit(pix('pig', PIG, { p: '#FCFCFC', P: '#F8B8D8', w: '#FFFFFF', k: '#000' }), x + 1, y, PX, false);
  else if (k === 'scorp') blit(pix('scorp', SCORP, { o: '#A83000', O: '#F87800', k: '#000' }), x, y, PX);
  else if (k === 'vulture') blit(pix('vult', VULT, { w: '#FCFCFC', b: '#7C4C20', k: '#000', y: '#F8B800' }), x - 4, y, PX);
  else if (k === 'penguin') blit(pix('peng', PENG, { k: '#000040', w: '#FCFCFC', y: '#F8B800' }), x + 1, y + 2, PX);
  else if (k === 'boulder' && THEMES[A.th].ice) { ctx.save(); ctx.translate(x + 14, y + 14); ctx.rotate(e.rot || 0); ctx.fillStyle = '#7CA8D8'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill(); ctx.fillStyle = fl ? '#fff' : '#F8F8F8'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#BCE4FC'; ctx.fillRect(-7, -3, 5, 5); ctx.fillRect(3, 3, 5, 4); ctx.restore() }   // quả cầu tuyết lăn
  else if (k === 'boulder') { ctx.save(); ctx.translate(x + 14, y + 14); ctx.rotate(e.rot || 0); ctx.fillStyle = '#383838'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill(); ctx.fillStyle = fl ? '#fff' : '#A8A8A8'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#787878'; ctx.fillRect(-8, -2, 6, 6); ctx.fillRect(3, 4, 5, 4); ctx.fillRect(0, -9, 4, 4); ctx.fillStyle = '#E0E0E0'; ctx.fillRect(-6, -8, 4, 3); ctx.restore() }
  if (W && k !== 'boulder') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, e.w, e.h); ctx.globalCompositeOperation = 'source-over' }
  ctx.globalAlpha = 1;
}
function drawDino(k, x, y, f, walk, a) {   // khủng long (nhìn sang phải), to hơn sprite gốc 1,25 lần
  ctx.globalAlpha = a || 1; const fr = Math.floor(walk || 0) % 2, PX = 2.5;
  if (k === 'blue' || k === 'red') blit(pix('dino' + k + fr, fr ? DINO2 : DINO, k === 'blue' ? { b: '#0058F8', W: '#BCE4FC', w: '#FFFFFF', k: '#000', r: '#F83800' } : { b: '#D82800', W: '#FCA044', w: '#FFFFFF', k: '#000', r: '#F8D878' }), x, y, PX, f < 0);
  else if (k === 'sea') blit(pix('plesio', PLESIO, { p: '#8800C8', P: '#C858F8', w: '#FFFFFF', k: '#000' }), x, y + 4, PX, f < 0);
  else blit(pix('ptera' + ((S.tick >> 3) & 1), (S.tick >> 3) & 1 ? PTERA2 : PTERA, { y: '#F8B800', o: '#C84C0C', k: '#000' }), x + 2, y + 10, PX, f < 0);
  ctx.globalAlpha = 1;
}
function hero(o) {
  const img = pix('h' + o.fr + o.key, { st: H_ST, w1: H_W1, w2: H_W2, j: H_J, t: H_T }[o.fr], o.pal);
  ctx.globalAlpha = o.a || 1;
  if (o.dino) { drawDino(o.dino, o.x - (o.f < 0 ? 12 : 14), o.y + 6, o.f, o.walk, o.a); blit(img, o.x - 3, o.y - 18, PX, o.f < 0); ctx.globalAlpha = 1; return }   // ngồi trên lưng khủng long
  if (o.skate) { blit(pix('skate', SKATEB, { r: '#F83800', R: '#FCA044', k: '#000' }), o.x - 5, o.y + 38, PX, o.f < 0) }
  blit(img, o.x - 3, o.y - (o.skate ? 8 : 0), PX, o.f < 0);
  ctx.globalAlpha = 1;
}
function heroFrame(p) { return p.thr ? 't' : THEMES[A.th].under && !p.on ? ((S.tick >> 4) & 1 ? 'j' : 'w1') : !p.on ? 'j' : Math.abs(p.vx) > .4 ? ((Math.floor(p.walk) % 2) ? 'w1' : 'w2') : 'st' }
function drawItem(it) {
  const bob = Math.round(Math.sin(S.tick * .1 + it.x) * 2) * PX, x = it.x, y = it.y + (it.up > 0 ? 0 : bob);
  if (it.k === 'axe') blit(pix('axe', AXE, { g: '#383838', G: '#A8A8A8', w: '#FFFFFF', b: '#A83000' }), x + 2, y + 2, PX);
  else if (it.k === 'fire') blit(pix('fireb', FIREB, { o: '#F83800', y: '#F8B800', w: '#FFF8C8' }), x + 4, y + 4, PX);
  else if (it.k === 'skate') blit(pix('skate', SKATEB, { r: '#F83800', R: '#FCA044', k: '#000' }), x - 4, y + 12, PX);
  else if (it.k === 'fairy') { blit(pix('fairy', FAIRY, { w: '#BCE4FC', p: '#F878F8', P: '#F8B8F8', s: '#FCA044', k: '#000', r: '#E40058' }), x, y + 4, PX); if (S.tick % 6 === 0) parts.push({ x: x + 12, y: y + 12, vx: (Math.random() - .5) * 2, vy: -1, r: 2, l: 24, L: 24, c: '#FFF6A0', g: 0 }) }
  else if (it.k === 'boom') blit(pix('boom', BOOM, { o: '#C88C00' }), x + 4, y + 4, PX);
  else if (it.k.startsWith('d_')) drawDino(it.k.slice(2), x - 8, y - 4, 1, S.tick * .1);
  else if (it.k === 'milk') blit(pix('milk', MILK, { w: '#FFFFFF', b: '#0058F8' }), x + 6, y + 2, PX);
  else if (it.k === 'nasu') blit(pix('nasu', NASU, { g: '#00A800', v: '#8800C8', V: '#C858F8', w: '#fff', k: '#000', r: '#F83800' }), x + 2, y, PX);
}
function drawSign(s) {
  const x = s.x, gy = 13 * TS; ctx.fillStyle = '#7C2800'; ctx.fillRect(x + 10, gy - 50, 6, 50); ctx.fillStyle = '#000'; ctx.fillRect(x - 2, gy - 72, 30, 26); ctx.fillStyle = s.got ? '#F8D878' : '#FCFCFC'; ctx.fillRect(x, gy - 70, 26, 22);
  ctx.font = '16px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(String(s.n), x + 14, gy - 51);
}
function drawGoal(g) {
  const x = g.x, gy = 13 * TS; ctx.fillStyle = '#7C2800'; ctx.fillRect(x + 4, gy - 64, 6, 64); ctx.fillRect(x + 74, gy - 64, 6, 64);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 4, gy - 100, 92, 40); ctx.fillStyle = '#FCFCFC'; ctx.fillRect(x - 2, gy - 98, 88, 36);
  ctx.font = '14px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#E40058'; ctx.fillText('GOAL', x + 42, gy - 73);
}
function drawBoss(B) {
  if (B.dead) return; const x = Math.round(B.x), y = Math.round(B.y), fl = B.hurt && (B.hurt >> 1) & 1, F = (c, a, b, w, h) => { ctx.fillStyle = fl ? '#FFFFFF' : c; ctx.fillRect(x + a * 2, y + b * 2, w * 2, h * 2) }, open = B.t % 90 > 60;
  ctx.save(); if (B.fall) { ctx.translate(x + 30, y + 38); ctx.scale(1, -1); ctx.translate(-(x + 30), -(y + 38)) }
  F('#000', 5, 0, 20, 2); F('#F83800', 6, 1, 18, 2); for (let i = 0; i < 5; i++)F('#F8B800', 6 + i * 4, -3, 2, 4);   // vương miện lông
  F('#000', 3, 3, 24, 16); F('#A87C00', 4, 4, 22, 14); F('#F8D878', 6, 6, 18, 3);   // mặt nạ gỗ
  F('#000', 7, 9, 5, 4); F('#000', 18, 9, 5, 4); F('#F83800', 9, 10, 2, 2); F('#F83800', 20, 10, 2, 2); F('#000', 9, open ? 14 : 15, 12, open ? 4 : 2); if (open) F('#F83800', 10, 15, 10, 2); F('#FFFFFF', 10, 14, 2, 2); F('#FFFFFF', 18, 14, 2, 2);
  F('#000', 2, 19, 26, 14); F('#C84C0C', 3, 19, 24, 13); F('#FCA044', 8, 21, 14, 9); F('#00A800', 3, 28, 24, 5); F('#005800', 5, 30, 3, 3); F('#005800', 12, 30, 3, 3); F('#005800', 19, 30, 3, 3);   // thân + váy lá
  F('#C84C0C', 0, 20, 3, 9); F('#C84C0C', 27, 20, 3, 9); F('#C84C0C', 6, 33, 5, 5); F('#C84C0C', 19, 33, 5, 5); F('#000', 5, 37, 7, 1); F('#000', 18, 37, 7, 1);
  ctx.restore();
}
function drawBoss2(B) {   // trùm phần 2: đô vật đeo mặt nạ mèo (như bản gốc)
  if (B.dead) return; const x = Math.round(B.x), y = Math.round(B.y), fl = B.hurt && (B.hurt >> 1) & 1, F = (c, a, b, w, h) => { ctx.fillStyle = fl ? '#FFFFFF' : c; ctx.fillRect(x + a * 2, y + b * 2, w * 2, h * 2) }, roar = B.t % 90 > 60;
  ctx.save(); if (B.fall) { ctx.translate(x + 30, y + 38); ctx.scale(1, -1); ctx.translate(-(x + 30), -(y + 38)) }
  F('#000', 6, 0, 4, 5); F('#000', 20, 0, 4, 5); F('#A81000', 7, 1, 2, 4); F('#A81000', 21, 1, 2, 4);   // tai mèo
  F('#000', 5, 3, 20, 15); F('#A81000', 6, 4, 18, 13); F('#D82800', 8, 5, 14, 3);
  F('#FFFFFF', 8, 8, 5, 3); F('#FFFFFF', 17, 8, 5, 3); F('#000', 10, 9, 2, 2); F('#000', 19, 9, 2, 2); F('#F8D878', 13, 11, 4, 2);
  F('#000', 9, roar ? 13 : 14, 12, roar ? 4 : 2); if (roar) { F('#FFFFFF', 10, 13, 2, 2); F('#FFFFFF', 18, 13, 2, 2) } F('#FCFCFC', 3, 12, 4, 1); F('#FCFCFC', 23, 12, 4, 1); F('#FCFCFC', 3, 14, 4, 1); F('#FCFCFC', 23, 14, 4, 1);   // râu
  F('#000', 3, 18, 24, 14); F('#A81000', 4, 18, 22, 13); F('#FCFCFC', 12, 21, 6, 5); F('#000', 13, 22, 2, 2); F('#000', 16, 22, 2, 2); F('#000', 14, 24, 2, 1);   // áo đô vật + mặt dây đầu lâu
  F('#FCFCFC', 0, 19, 4, 11); F('#FCFCFC', 26, 19, 4, 11); F('#F8B8D8', 0, 29, 4, 3); F('#F8B8D8', 26, 29, 4, 3);
  F('#FCFCFC', 6, 31, 7, 6); F('#FCFCFC', 17, 31, 7, 6); F('#A81000', 5, 36, 9, 2); F('#A81000', 16, 36, 9, 2);
  ctx.restore();
}
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false; drawBg();
  const cxs = Math.round(camX * sc * dpr) / (sc * dpr);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -cxs * sc * dpr, Math.round(oy * dpr)); ctx.imageSmoothingEnabled = false;
  const c0 = Math.floor(camX / TS) - 1, c1 = Math.ceil((camX + vw) / TS) + 1, below = Math.ceil((ch - oy) / sc / TS) - ROWS + 1;
  for (let d of A.deco) { const x = d.x * TS; if (x < camX - 100 || x > camX + vw + 40) continue; const g = 13 * TS; const bgk = THEMES[A.th].bg; if (d.k === 'bush' && bgk === 'sea') d = { x: d.x, k: 'weed' }; if (d.k === 'bush' && (bgk === 'cave' || bgk === 'volcano' || bgk === 'rockcave')) { ctx.fillStyle = bgk === 'cave' ? '#3C2008' : '#280808'; ctx.fillRect(x + 4, g - 14, 40, 14); ctx.fillStyle = bgk === 'cave' ? '#7C4C20' : '#583030'; ctx.fillRect(x + 8, g - 12, 32, 10); ctx.fillRect(x + 14, g - 20, 14, 8) } else if (d.k === 'bush') { ctx.fillStyle = '#005800'; ctx.fillRect(x, g - 18, 60, 18); ctx.fillStyle = '#80D010'; ctx.fillRect(x + 4, g - 16, 52, 12); ctx.fillRect(x + 12, g - 24, 20, 8); ctx.fillRect(x + 34, g - 22, 16, 6) } else if (d.k === 'weed') { for (let j = 0; j < 7; j++) { ctx.fillStyle = j % 2 ? '#00A800' : '#58D854'; ctx.fillRect(x + 6 + Math.round(Math.sin(S.tick * .04 + j * .5 + x) * j * .6) * 2, g - 10 - j * 10, 8, 10) } } else if (d.k === 'grass') { ctx.fillStyle = THEMES[A.th].bg === 'cave' ? '#A87C48' : '#00A800'; for (let k = 0; k < 4; k++)ctx.fillRect(x + k * 6, g - 8 - (k % 2) * 4, 2, 8 + (k % 2) * 4) } }
  drawGround(c0, c1, Math.max(0, below));
  for (const s of A.signs) if (onScreen(s.x, 40)) drawSign(s);
  if (A.goal && onScreen(A.goal.x, 100)) drawGoal(A.goal);
  for (const L of A.lifts) { const x = Math.round(L.x), y = L.y; ctx.fillStyle = '#BCBCBC'; ctx.fillRect(x, y + 10, L.w, 8); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 2, y, L.w - 4, 14); ctx.fillRect(x + 12, y - 8, 30, 10); ctx.fillRect(x + 50, y - 5, 24, 8) }
  for (const s of A.springs) { const q = s.sq ? 6 : 0; ctx.fillStyle = '#000'; ctx.fillRect(s.x, s.y + q, s.w, 6); ctx.fillStyle = '#F83800'; ctx.fillRect(s.x + 2, s.y + 1 + q, s.w - 4, 4); ctx.fillStyle = '#BCBCBC'; for (let i = 0; i < 3; i++)ctx.fillRect(s.x + 6, s.y + 7 + q + i * ((10 - q) / 3), s.w - 12, 2); ctx.fillStyle = '#000'; ctx.fillRect(s.x + 2, s.y + 14, s.w - 4, 2) }
  for (const f of A.flee) drawDino(f.k, f.x, f.y, f.vx > 0 ? 1 : -1, f.t * .3, 1 - f.t / 90);
  for (const u of A.urchins) if (onScreen(u.x)) blit(pix('urch', URCH, { k: '#000040', v: '#8800C8', w: '#F878F8' }), u.x, u.y + 4, PX);
  for (const c of A.cacti) if (onScreen(c.x)) blit(pix('cactus', CACTUS, { g: '#005800', G: '#00A800' }), c.x - 1, c.y + 10, PX);
  for (const r of A.rocks) if (!r.gone && onScreen(r.x)) blit(pix('rock', ROCK, { g: '#383838', G: '#A8A8A8', w: '#E8E8E8' }), r.x, r.y, PX);
  for (const f of A.fires) if (onScreen(f.x)) { ctx.fillStyle = '#7C2800'; ctx.fillRect(f.x, f.y + 22, 28, 6); ctx.fillStyle = '#A83000'; ctx.fillRect(f.x + 4, f.y + 18, 20, 6); const k = (S.tick >> 2) & 3; for (let i = 0; i < 5; i++) { const h = 10 + ((i + k) % 3) * 5; ctx.fillStyle = i % 2 ? '#F8B800' : '#F83800'; ctx.fillRect(f.x + 3 + i * 5, f.y + 18 - h, 5, h) } ctx.fillStyle = '#FFF8C8'; ctx.fillRect(f.x + 12, f.y + 8 + k, 4, 6) }
  for (const q of A.falling) if (onScreen(q.x)) { const icy = THEMES[A.th].ice; ctx.fillStyle = icy ? '#3CBCFC' : '#383838'; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + q.w, q.y); ctx.lineTo(q.x + q.w / 2, q.y + q.h); ctx.fill(); ctx.fillStyle = icy ? '#E0F8FF' : '#A87C58'; ctx.beginPath(); ctx.moveTo(q.x + 3, q.y + 2); ctx.lineTo(q.x + q.w - 3, q.y + 2); ctx.lineTo(q.x + q.w / 2, q.y + q.h - 5); ctx.fill() }
  for (const e of A.eggs) if (!e.open && onScreen(e.x)) { const dc = { d_blue: '#0058F8', d_red: '#F83800', d_sea: '#8800C8', d_ptera: '#F8B800' }[e.k]; blit(pix('egg' + (dc || ''), EGG, { w: '#FCFCFC', p: dc || '#F878F8', g: dc ? mix(dc, '#ffffff', .4) : '#58D854' }), e.x - 1, e.y, PX) }   // trứng khủng long: chấm màu theo loại
  for (const f of A.fruits) if (!f.got && onScreen(f.x)) { const [rows, pal] = FR[f.k]; blit(pix('fr_' + f.k, rows, pal), f.x, f.y + Math.round(Math.sin(S.tick * .08 + f.x) * 1.5) * PX, PX) }
  for (const it of A.items) if (!it.got) drawItem(it);
  for (const e of A.en) if (e.act && onScreen(e.x)) drawEnemy(e);
  if (A.boss) (A.boss.kind === 2 ? drawBoss2 : drawBoss)(A.boss);
  for (const f of A.ef) blit(pix('fireb', FIREB, { o: '#F83800', y: '#F8B800', w: '#FFF8C8' }), f.x, f.y, PX * 1.1);
  for (const s of SH) { ctx.save(); ctx.translate(Math.round(s.x + 8), Math.round(s.y + 8)); if (s.k === 'boom') { ctx.rotate(s.rot * 1.4); blit(pix('boom', BOOM, { o: '#C88C00' }), -8, -8, PX) } else if (s.k === 'bub') { ctx.strokeStyle = '#BCE4FC'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-3, -4, 3, 3) } else if (s.k === 'drop') blit(pix('rock', ROCK, { g: '#383838', G: '#A8A8A8', w: '#E8E8E8' }), -8, -6, PX * .7); else if (s.k === 'axe') { ctx.rotate(s.rot); blit(pix('axe', AXE, { g: '#383838', G: '#A8A8A8', w: '#FFFFFF', b: '#A83000' }), -10, -10, PX) } else blit(pix('fireb', FIREB, { o: '#F83800', y: '#F8B800', w: '#FFF8C8' }), -8, -8, PX); ctx.restore() }
  if (A.princess && A.princess.show) { const P = A.princess, hop = S.won ? Math.round(Math.abs(Math.sin(S.tick * .14)) * 6) * PX : 0; blit(pix('prin', PRIN, { p: '#F878F8', s: '#FCA044', k: '#000', r: '#E40058', w: '#FCFCFC', g: '#00A800', G: '#80D010', S: '#C84C0C' }), P.x, P.y - 28 - hop, PX);
    const msg = S.won ? 'Cảm ơn cậu, Higgins! 💖' : 'Tina đây! 🆘'; ctx.font = '800 15px Nunito,sans-serif'; const mw = ctx.measureText(msg).width + 24, my = P.y - 82; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(P.x + 12 - mw / 2 - 2, my - 2, mw + 4, 34); ctx.fillStyle = '#fff'; ctx.fillRect(P.x + 12 - mw / 2, my, mw, 30); ctx.fillStyle = '#E40058'; ctx.textAlign = 'center'; ctx.fillText(msg, P.x + 12, my + 21);
    if (S.won && S.tick % 12 === 0) parts.push({ x: P.x + 12 + (Math.random() - .5) * 60, y: P.y - 50, vx: (Math.random() - .5), vy: -2, r: 4, l: 70, L: 70, c: GC.pick(['#E40058', '#F878F8', '#F8D878']), heart: 1, g: -.01 }) }
  const wk = WKP() + S.level, now = S.now();
  for (const id in S.ghosts) {
    const g = S.ghosts[id]; if (g.wk !== wk) { g.x = null; continue }
    if (g.x == null) { g.x = g.tx; g.y = g.ty } const dx = g.tx - g.x; g.x += dx * .2; g.y += (g.ty - g.y) * .2; if (Math.abs(dx) > .3) g.walk = (g.walk || 0) + .12;
    hero({ dino: g.dn, x: g.x, y: g.y, f: g.f, fr: Math.abs(g.ty - g.y) > 2 ? 'j' : Math.abs(dx) > .3 ? (Math.floor(g.walk) % 2 ? 'w1' : 'w2') : 'st', key: 'g' + g.c, pal: Object.assign({}, PH, { w: g.c || '#BCE4FC' }), a: .55, skate: g.sk });
    label(g.n || '?', g.x + 11, g.y - 10, 12, '#fff', '#1a1033');
  }
  const dead = pl.auto && pl.auto.ph === 'die';
  if (!(pl.inv && !dead && (S.tick >> 2) & 1)) {
    const pal = pl.fairy ? Object.assign({}, PH, { w: ['#F878F8', '#F8D878', '#58D854', '#3CBCFC'][(S.tick >> 2) % 4] }) : dead ? Object.assign({}, PH, { s: '#F8B8A8' }) : Object.assign({}, PH, { w: S.color && S.color !== '#ffffff' ? mix('#F8F8F8', S.color, .45) : '#F8F8F8' });
    hero({ x: pl.x, y: pl.y, f: pl.face, fr: dead ? 'j' : pl.dino ? 'st' : heroFrame(pl), key: pl.fairy ? 'f' + ((S.tick >> 2) % 4) : dead ? 'd' : 'p' + S.color, pal, skate: pl.skate && !dead, dino: !dead && pl.dino, walk: pl.walk * .5 });
  if (pl.whip > 4) { const wx = pl.face > 0 ? pl.x + pl.w + 2 : pl.x - 44; ctx.fillStyle = '#BCE4FC'; ctx.globalAlpha = .7; for (let i = 0; i < 3; i++)ctx.fillRect(wx + i * 14, pl.y + 26 + Math.sin(S.tick + i) * 4, 10, 4); ctx.globalAlpha = 1 }
  }
  if (pl.fairy) { ctx.globalAlpha = .5 + .3 * Math.sin(S.tick * .3); ctx.strokeStyle = '#FFF6A0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x + 11, pl.y + 20, 30, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 }
  if (pl.nasu) blit(pix('nasu', NASU, { g: '#00A800', v: '#8800C8', V: '#C858F8', w: '#fff', k: '#000', r: '#F83800' }), pl.x + 1, pl.y - 30 + Math.round(Math.sin(S.tick * .2) * 2) * PX, PX);
  if (S.name) label(S.name, pl.x + 11, pl.y - (pl.nasu ? 36 : 10), 13, '#fff', '#1a1033');
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x + 11, y = pl.y - 40; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(cx - 28, y - 24, 56, 28); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 26, y - 22, 52, 24); ctx.font = '10px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#E40058'; ctx.fillText('⚡0!', cx, y - 5) }
  for (const q of parts) { ctx.globalAlpha = Math.max(0, q.l / q.L); ctx.fillStyle = q.c; if (q.heart) { const s = 3;[[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]].forEach(([a, b]) => ctx.fillRect(Math.round(q.x) + a * s, Math.round(q.y) + b * s, s, s)) } else ctx.fillRect(Math.round(q.x - q.r), Math.round(q.y - q.r), q.r * 2, q.r * 2) } ctx.globalAlpha = 1;
  for (const p of pops) { ctx.globalAlpha = Math.min(1, p.t / 12); ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('+' + COST.fruit + '⚡', p.x, p.y - (30 - p.t)) } ctx.globalAlpha = 1;
  hud2();
}
function hud2() {   // thanh no 16 vạch giữa trên cùng (như bản gốc) · bảng ROUND góc phải · thanh máu trùm
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  const n = VMAX, bw = Math.min(260, cw * .42), cell = bw / n, bx = (cw - bw) / 2, by = 12, low = pl.vit <= 4;
  ctx.fillStyle = '#000000bb'; ctx.fillRect(bx - 8, by - 6, bw + 16, 44);
  for (let i = 0; i < n; i++) { const full = i < Math.ceil(pl.vit); ctx.fillStyle = full ? (low && (S.tick >> 3) & 1 ? '#F83800' : pl.nasu ? '#C858F8' : '#FCFCFC') : '#404040'; ctx.fillRect(Math.round(bx + i * cell + 1), by, Math.max(2, Math.round(cell - 3)), 14) }
  ctx.font = '800 11px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = low ? '#FFB0B0' : '#FFFFFF'; ctx.fillText(low ? '🍎 SẮP ĐÓI — ăn trái cây!' : '🍎 THANH NO', cw / 2, by + 31);
  const T = THEMES[A.th], w1 = (PART === 2 ? 'II-' : 'ROUND ') + (S.level + 1), sub0 = T.ic + ' ' + T.name + (pl.dino ? ' · 🦖 F đòn' : pl.wp === 3 ? ' · 🪃 F ném' : pl.wp === 2 ? ' · 🔥 F bắn' : pl.wp ? ' · 🪓 F ném' : '');
  ctx.font = '800 12px Nunito,sans-serif'; let sub = sub0; const sw = ctx.measureText(sub).width + 70, avail = cw - (bx + bw + 16) - 12; ctx.font = '11px "Press Start 2P",monospace'; const tw = Math.min(avail, Math.max(ctx.measureText(w1 + '  ×000').width + 40, 170, sw)), rx = cw - tw - 12;
  ctx.font = '800 12px Nunito,sans-serif'; while (sub.length > 4 && ctx.measureText(sub).width + 70 > tw) sub = sub.slice(0, -2).trimEnd() + '…';   // bảng góc phải không đè thanh no
  if (avail >= 170) {
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(rx - 3, 8, tw + 6, 50); ctx.fillStyle = '#ffffffee'; ctx.fillRect(rx, 11, tw, 44);
    ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(w1, rx + 10, 28); const [ar, ap] = FR.apple; ctx.drawImage(pix('fr_apple', ar, ap), rx + tw - 70, 15, 16, 18); ctx.fillText('×' + String(S.coins).padStart(2, '0'), rx + tw - 52, 28);
    ctx.font = '800 12px Nunito,sans-serif'; ctx.fillStyle = '#5D6B85'; ctx.fillText(sub, rx + 10, 47); ctx.textAlign = 'right'; ctx.fillStyle = S.lives <= 1 ? '#E40058' : '#1A1A1A'; ctx.fillText('❤️×' + S.lives, rx + tw - 8, 47);
    const py = 62; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(rx - 1, py - 1, tw + 2, 8); ctx.fillStyle = '#ffffff99'; ctx.fillRect(rx, py, tw, 6); ctx.fillStyle = '#E40058'; ctx.fillRect(rx, py, tw * prog(), 6); for (let i = 1; i < NL; i++) { ctx.fillStyle = '#1A1A1A'; ctx.fillRect(rx + tw * i / NL - 1, py - 2, 2, 10) }
  } else { ctx.font = '800 13px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; const t = '❤️×' + S.lives + ' 🍎' + S.coins + ' · R' + (S.level + 1); ctx.strokeText(t, 10, 60); ctx.fillText(t, 10, 60) }
  const B = A.boss; if (B && B.act && !B.fall) { const W2 = Math.min(320, cw * .6), x2 = (cw - W2) / 2, y2 = 52; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(x2 - 3, y2, W2 + 6, 30); ctx.fillStyle = '#ffffffee'; ctx.fillRect(x2, y2 + 3, W2, 24); ctx.font = '800 13px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(B.kind === 2 ? '😼 Vua Mèo' : '👹 Vua Quỷ', x2 + 8, y2 + 20); const hx = x2 + 90, hw = W2 - 100; for (let i = 0; i < B.max; i++) { ctx.fillStyle = i < B.hp ? '#E40058' : '#BCBCBC'; ctx.fillRect(hx + i * hw / B.max + 1, y2 + 9, hw / B.max - 2, 12) } }
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.textAlign = 'center'; ctx.font = '26px "Press Start 2P",monospace'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(banner.w, cw / 2 + 3, ch * .36 + 3); ctx.fillStyle = '#fff'; ctx.fillText(banner.w, cw / 2, ch * .36); label(banner.text, cw / 2, ch * .36 + 40, 22, '#F8D878', '#1A1A1A'); ctx.globalAlpha = 1 }
  if (pl.auto && pl.auto.ph === 'goal') label('🏁 QUA MÀN! Thanh no còn lại đổi thành ⚡ thưởng', cw / 2, ch * .3, 20, '#5CFF8A');
}
function camera(k) {
  const max = Math.max(0, A.w * TS - vw), lo = Math.min(max, Math.max(0, A.lockX)), tx = clamp(pl.x - vw * .38, lo, max);
  camX += (tx - camX) * k; if (A.lockX && camX < lo) camX = lo;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / (ROWS * TS), cw / (12 * TS)); vw = cw / sc; oy = Math.max(0, (ch - ROWS * TS * sc) * .55) }
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } }
  else { acc = 0; S.tick++; for (const L of A.lifts) L.x = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)) }
  if (S.won) S.rescue++;
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += q.g ?? .12; if (--q.l <= 0) parts.splice(i, 1) }
  for (let i = pops.length - 1; i >= 0; i--)if (--pops[i].t <= 0) pops.splice(i, 1);
  camera(.14); draw();
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}
/* ═════ điều khiển: ← → chạy · ↑ nhảy (giữ = cao) · F / X / Shift ném rìu ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j', f: 'f', F: 'f', x: 'f', X: 'f', Shift: 'f' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = keys.f = 0 });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j'], ['bF', 'f']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2];
  if (PART === 2) LVC = Object.assign({}, LVC, { len: Math.round(LVC.len * 1.1), en: LVC.en * 1.1, drain: LVC.drain, spd: LVC.spd * 1.08, boss: LVC.boss + 4, pit: [LVC.pit[0], LVC.pit[1] + 1] });   // phần 2 khó hơn chút
  COST = LVC.cost;
  if (PART === 2) GC.music.files({ over2: { src: 'snd/ai2-overworld.mp3' }, water2: { src: 'snd/ai2-underwater.mp3' }, plains2: { src: 'snd/ai2-plains.mp3' }, cloud2: { src: 'snd/ai2-clouds.mp3' }, volc2: { src: 'snd/ai2-volcano.mp3' }, castle2: { src: 'snd/ai-cave.mp3' }, boss: { src: 'snd/ai2-boss.mp3' } }, 'bounce');   // nhạc gốc Adventure Island II
  else GC.music.files({ jungle: { src: 'snd/ai-jungle.mp3' }, island: { src: 'snd/ai-island.mp3' }, cave: { src: 'snd/ai-cave.mp3' }, night: { src: 'snd/ai-night.mp3' }, boss: { src: 'snd/ai-boss.mp3' } }, 'bounce');   // nhạc gốc Adventure Island
  GC.sfxFiles({ airound: { src: 'snd/ai-roundclear.mp3', vol: .6 }, aiarea: { src: 'snd/ai-areaclear.mp3', vol: .6 }, aimiss: { src: 'snd/ai-miss.mp3', vol: .6 }, ai2win: { src: 'snd/ai2-bossdown.mp3', vol: .6 } });
  loadLevel(0);
  addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.j = keys.f = 0 }
function place(x, y, old) {
  const lv = old && old.lvl != null ? old.lvl : 0; S.coins = old && old.cn || 0; S.lives = old && old.lf || LIVES; if (lv !== S.level) loadLevel(lv);
  if (old && old.wp) setWp(old.wp);
  pl.x = Math.max(TS, x); pl.y = Math.min(y, 11 * TS); pl.vx = pl.vy = 0; camX = Math.max(0, pl.x - vw * .38);
}
function measure() { return 1000 }
const label2 = () => S.won ? '👸 Đã cứu công chúa Tina' : 'Màn ' + (S.level + 1) + '/' + NL + ' · ' + Math.round(clamp(pl.x / Math.max(1, A.end), 0, 1) * 100) + '%' + (S.boss ? ' · 👹 hạ trùm' : '');
function extra() { return { dn: pl.dino, lvl: S.level, wk: WKP() + S.level, cn: S.coins, lb: label2(), wp: pl.wp, lf: S.lives, sk: pl.skate ? 1 : 0 } }
function hud() { return (S.won ? '👸 Phá đảo' : '🏝 Màn ' + (S.level + 1) + '/' + NL) + ' · 🍎 ' + S.coins }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: 12 * TS, kind: 'adv', NL, setPart, get part() { return PART },
  get winTitle() { return PART === 2 ? '🏆 Phá đảo Đảo phiêu lưu P2 — hạ được Vua Mèo, cứu công chúa Tina!' : '🏆 Phá đảo Đảo phiêu lưu — cứu được công chúa Tina!' }, get winToast() { return PART === 2 ? '🏆 PHÁ ĐẢO P2! Higgins cưỡi khủng long hạ gục Vua Mèo!' : '🏆 PHÁ ĐẢO! Higgins đã hạ Vua Quỷ và cứu công chúa Tina!' },
  _dbg: { step, draw, cam: camera, area: () => A, loadLevel, TS, setWp, die, give: k => takeItem({ k }), setPart } };
})();
