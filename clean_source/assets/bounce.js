/* bounce.js — game "Bounce Tales": bóng đỏ lăn trên đồi cỏ, nhảy qua hố gai, nhặt trứng vàng, tới cổng đích.
   6 màn: Rừng xanh · Đồi hoa · Hang động · Bờ biển (hố nước — bóng nổi) · Núi tuyết (băng trơn) · Lâu đài ban đêm.
   ← → lăn · ↑ / Space nhảy · chướng ngại: hố gai, bụi gai, tường cao (nấm lò xo), đảo nổi, ván trôi, bọ / ong / dơi / cua / nhím.
   Vật phẩm có đồng hồ: ⭐ bất tử · 🪶 nhảy cao · 🧲 hút trứng · 🎈 bóng bay lơ lửng · ❤️ thêm mạng · 🔋 năng lượng.
   5 mạng · rơi hố gai = mất 1 mạng, về cờ gần nhất · hết mạng chơi lại màn đang chơi. Lăn & nhảy tốn ⚡ — trả lời đúng để chơi tiếp.
   PHẦN 2 (setPart(2)): Rừng lá nảy · Đầm sen · Đáy biển (bơi) · Hang nấm phát sáng (leo dọc) · Hang san hô (bơi) · Đầm lầy Hypnotoad (trùm ếch).
   Cùng giao diện với các game khác: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'bounce' */
window.Bounce = (function () {
const { clamp, rng } = GC;
const LIVES = 5, G = .4, JV = 10.4, MAXV = 3.2, SPRING = 15;
let R = 16;   // bán kính bóng: to dần khi ăn trứng
const GROW = [   // cứ 5 trứng lên 1 cấp: bóng to dần, đổi 9 màu (giữ nguyên khi sang màn mới · mất mạng thì nhỏ lại 1 cấp)
  { r: 16, c: '#F2453A', n: 'đỏ' }, { r: 17.3, c: '#FF9A3C', n: 'cam' }, { r: 18.6, c: '#F8D25A', n: 'vàng' }, { r: 19.9, c: '#6AD65A', n: 'xanh lá' }, { r: 21.2, c: '#3CD6C8', n: 'xanh ngọc' },
  { r: 22.5, c: '#4A9CF2', n: 'xanh dương' }, { r: 23.8, c: '#A67CF2', n: 'tím' }, { r: 25.1, c: '#FF7EC0', n: 'hồng' }, { r: 26.5, c: 'rainbow', n: 'cầu vồng' }], EGG_STEP = 5;
const hsl2hex = (h, s2, l) => { const k = n => (n + h / 30) % 12, a = s2 * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') };
const growCol = lv => GROW[lv].c === 'rainbow' ? hsl2hex((S.tick * 3) % 360, .85, .62) : GROW[lv].c;   // cấp cuối: cầu vồng đổi màu liên tục
const THEMES1 = [
  { name: 'Rừng xanh', ic: '🌳', sky: ['#5DBDF0', '#BDE8FF', '#E2F6FF'], far: '#8CCFC4', farD: '#6AB4AC', body: '#2F6B2F', bodyD: '#24582A', grass: '#8BE03A', grassD: '#3A8A20', deco: ['flowerW', 'bush', 'flowerR', 'vine'], walker: 'beetle', fly: 'bee', pit: 'spike' },
  { vert: 1, name: 'Vách hoa leo dọc', ic: '🌸', sky: ['#7FC8F4', '#FFE4F0', '#FFF4E8'], far: '#E8B8D8', farD: '#C890B8', body: '#3A7A34', bodyD: '#2C6428', grass: '#A4EA48', grassD: '#4E9A28', deco: ['flowerR', 'flowerW', 'flowerP', 'bush', 'flowerR'], walker: 'beetle', fly: 'bee', pit: 'spike' },
  { name: 'Hang động', ic: '🦇', sky: ['#141A2A', '#24304A', '#34405A'], far: '#3A3458', farD: '#2A2442', body: '#4A3A5E', bodyD: '#36284A', grass: '#B48AF0', grassD: '#6A48B0', deco: ['shroom', 'crystal', 'shroom'], walker: 'beetle', fly: 'bat', pit: 'spike', cave: 1, shell: '#7A5AC8' },
  { name: 'Bờ biển', ic: '🏖', sky: ['#48B8F4', '#A8E2FF', '#FFF2D0'], far: '#9AD8E8', farD: '#6ABCD4', body: '#E2B868', bodyD: '#C49A50', grass: '#FFE7A8', grassD: '#D8B060', deco: ['palm', 'shell', 'palm'], walker: 'crab', fly: 'bird', pit: 'water' },
  { vert: 1, name: 'Vách băng leo dọc', ic: '❄️', sky: ['#8ECDF4', '#D8F0FF', '#F4FBFF'], far: '#B8D4EE', farD: '#90B4DA', body: '#6E90B8', bodyD: '#56789E', grass: '#FFFFFF', grassD: '#B8D2EA', deco: ['pine', 'snowman', 'pine'], walker: 'beetle', fly: 'bird', pit: 'spike', ice: 1, shell: '#5A8AC8' },
  { vert: 1, name: 'Tháp lâu đài ban đêm', ic: '🏰', sky: ['#0E1230', '#2A2456', '#4A3A7A'], far: '#2E2A58', farD: '#221E44', body: '#4A4A60', bodyD: '#36364A', grass: '#9AA0B8', grassD: '#5A5E78', deco: ['torch', 'banner', 'torch'], walker: 'beetle', fly: 'bat', pit: 'spike', night: 1, brick: 1, shell: '#6A6A84' }];
const THEMES2 = [   // PHẦN 2 — giống bản gốc hơn: lá nảy, ao sen, đáy biển, hang nấm, hang san hô, trùm ếch Hypnotoad
  { leafy: 1, name: 'Rừng lá nảy', ic: '🌿', sky: ['#4FB8C8', '#B8EEDC', '#F0FFE8'], far: '#6FC0A0', farD: '#4FA080', body: '#2A5A34', bodyD: '#1E4628', grass: '#7AD83A', grassD: '#2E7A22', deco: ['fern', 'bush', 'flowerW', 'fern', 'vine'], walker: 'snail', fly: 'dfly', pit: 'spike', shell: '#E89A3A' },
  { pools: 1, name: 'Đầm sen', ic: '🪷', sky: ['#7AC8F0', '#D8F2F4', '#FFEFF4'], far: '#9AD0B8', farD: '#78B49C', body: '#4A7A34', bodyD: '#3A6228', grass: '#A8E05A', grassD: '#4E8A28', deco: ['reed', 'flowerP', 'reed', 'bush'], walker: 'frog', fly: 'dfly', pit: 'water', water: '#3AB0D8' },
  { under: 1, name: 'Đáy biển', ic: '🐠', sky: ['#3AA8E8', '#1E74C4', '#0E4A90'], far: '#1A5A8A', farD: '#134A74', body: '#1F4A2C', bodyD: '#123620', grass: '#4A8A4A', grassD: '#2A5A32', deco: ['weed', 'coralP', 'weed', 'shellU', 'weed'], walker: 'urchin', fly: 'fish', pit: 'spike' },
  { vert: 1, leafV: 1, cave: 1, name: 'Hang nấm phát sáng', ic: '🍄', sky: ['#120E2A', '#24204A', '#2E3A5A'], far: '#2E2A58', farD: '#221E44', body: '#3A3058', bodyD: '#2A2244', grass: '#7AF0D8', grassD: '#3A9A8A', deco: ['gshroom', 'shroom', 'crystal', 'gshroom'], walker: 'beetle', fly: 'bat', pit: 'spike', shell: '#7A5AC8' },
  { under: 1, coral: 1, name: 'Hang san hô', ic: '🪸', sky: ['#2A90D8', '#165EA8', '#0A3470'], far: '#3A3A7A', farD: '#2A2A60', body: '#4A2A5A', bodyD: '#2E1A3E', grass: '#FF8AB8', grassD: '#B04A80', deco: ['coralP', 'coralO', 'anem', 'weed', 'coralO'], walker: 'urchin', fly: 'fish', pit: 'spike' },
  { pools: 1, boss: 1, ff: 1, name: 'Đầm lầy Hypnotoad', ic: '🐸', sky: ['#2A2A5A', '#6A5A8A', '#D8A8B0'], far: '#4A5A6A', farD: '#3A4858', body: '#3A4A28', bodyD: '#2A381E', grass: '#8AB840', grassD: '#4A6A22', deco: ['reed', 'mushS', 'deadtree', 'reed'], walker: 'frog', fly: 'dfly', pit: 'water', water: '#4A9A7A' }];
const LVMUS1 = ['ov', 'ci', 'mi', 'bn', 'ov', 'bs'], LVMUS2 = ['ci', 'ov', 'bn', 'mi', 'bn', 'ov'];   // màn → bài nhạc (P1: Rừng & Núi tuyết: Overworld · Đồi hoa: Circus · Hang: Mines · Bờ biển: Bonus · Lâu đài: Boss)
let PART = 1, THEMES = THEMES1, NL = THEMES1.length, LVMUS = LVMUS1;
function setPart(p) { PART = p === 2 ? 2 : 1; THEMES = PART === 2 ? THEMES2 : THEMES1; LVMUS = PART === 2 ? LVMUS2 : LVMUS1; NL = THEMES.length }
const WKP = () => PART === 2 ? 'bn2' : 'bnc';
const AIR = k => k === 'bee' || k === 'bat' || k === 'bird' || k === 'dfly' || k === 'fish' || k === 'jelly' || k === 'leap';   // con vật bay / bơi (không đi trên đất)
const NOST = k => k === 'spiky' || k === 'jelly' || k === 'urchin';   // có gai: không giẫm được
const ENAME = { beetle: 'bọ cánh cứng', crab: 'cua', spiky: 'nhím gai', bee: 'ong', bat: 'dơi', bird: 'chim', snail: 'ốc sên', frog: 'ếch', dfly: 'chuồn chuồn', fish: 'cá', jelly: 'sứa', urchin: 'nhím biển', leap: 'cá chép nhảy' };
const HC = ['#FF5AA0', '#FFE24A', '#5AD8FF', '#A67CF2', '#6AD65A'];   // màu vòng thôi miên   // màn → bài nhạc: Rừng & Núi tuyết: Overworld · Đồi hoa: Circus · Hang động: Mines · Bờ biển: Bonus · Lâu đài: Boss
const LVS = {   // tốn ⚡ cân đối với các game khác · mức Dễ / Vừa / Khó
  1: { pit: .85, en: .6, spd: .85, len: .9, cost: { walk: .12, jump: 3, bat: 20, stomp: 8 } },
  2: { pit: 1, en: 1, spd: 1, len: 1, cost: { walk: .15, jump: 3.5, bat: 20, stomp: 8 } },
  3: { pit: 1.12, en: 1.3, spd: 1.15, len: 1.1, cost: { walk: .18, jump: 4, bat: 20, stomp: 8 } } };
let LVC = LVS[2], COST = LVC.cost;
const PWF = { star: 480, fea: 600, mag: 600, bal: 300 }, PWI = { star: '⭐', fea: '🪶', mag: '🧲', bal: '🎈' }, PWC = { star: '#FFD23F', fea: '#9AD8FF', mag: '#FF5A7A', bal: '#FF7EB6' };
const PW = { star: 0, fea: 0, mag: 0, bal: 0 };
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#E8202A', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: null, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, on: null, onP: null, coy: 0, inv: 0, face: 1, sq: 0, lvl: 0, grow: 0, sad: 0, eggc: 0 };
const keys = { l: 0, r: 0, j: 0, jp: 0 };
let WALLS = [], CEIL = [], SPK = [], BOSS = null, WAVES = [], GATE = null, MAXY = 900, VERT = false, EXITY = 0, SHAFT = [0, 460], seed0 = 1, lvSel = 2, BOX = [], MYS = [], POLY = [], SEGS = [], BUCK = {}, PITS = [], PLATS = [], EGGS = [], ITEMS = [], ENEM = [], SPR = [], THORN = [], FLAGS = [], DECO = [], EXITX = 0, LEN = 0, eggTot = 0, eggGot = 0;
let phase = 'play', phT = 0, t0 = 0, tLevel = 0, parts = [], banner = null, emptyT = 0, cam = { x: 0, y: 0 };
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, vh = 0;

/* ═════ dựng màn (cùng seed → cả lớp cùng một màn) ═════ */
function buildVert(li, T, r0, Rn, RI, pick) {   // MÀN LEO DỌC: giếng vách đá, bậc cỏ so le hai bên, leo lên cổng đích trên cao
  const W = 460, diff = li / (NL - 1), H = Math.round((2300 + li * 160) * LVC.len), rise0 = 70 + diff * 12;
  SHAFT = [0, W]; VERT = true; LEN = H;
  POLY.push([[-40, 700], [-40, 0], [W + 40, 0], [W + 40, 700]]);   // đáy giếng
  DECO.push({ x: 70, y: 0, k: 'arrowUp' });
  let y = 0, side = 1, n = 0, lastFlag = 0;
  while (-y < H) {
    y -= Rn(rise0, rise0 + 14); n++; side = -side;
    const w = Rn(190, 235) - diff * 10, lx = side < 0 ? 0 : W - w, mid = r0() < .18 + diff * .12;
    if (mid) { const mw = Rn(110, 150); PLATS.push({ x: W / 2 - mw / 2, y, w: mw, kind: 'isle' }); EGGS.push({ x: W / 2, y: y - 30, got: false }); side = -side; continue }   // đảo nổi giữa giếng
    const p = { x: lx, y, w, kind: 'isle', wall: side };
    PLATS.push(p);
    if (r0() < .55) for (let k = 0; k < 2; k++) EGGS.push({ x: lx + w * (.3 + k * .4), y: y - 30, got: false });
    else EGGS.push({ x: side < 0 ? lx + w + 30 : lx - 30, y: y - 60, got: false });
    if (r0() < .4) DECO.push({ x: lx + Rn(30, w - 30), y, k: pick(T.deco) });
    const room = w > 160 && -y > 300;
    if (T.leafV && room && r0() < .3) { SPR.push({ x: side < 0 ? lx + w - 42 : lx + 42, y, sq: 0, kind: 'leaf', f: side < 0 ? 1 : -1 }); for (let q = 0; q < 3; q++) EGGS.push({ x: W / 2 + (q - 1) * 34, y: y - 190 - (q === 1 ? 20 : 0), got: false }) }   // lá nảy trên bậc: bật lên 2–3 tầng
    else if (room && r0() < (.12 + diff * .25) * LVC.en) { ENEM.push({ k: li >= 4 && r0() < .3 ? 'spiky' : T.walker, x: lx + w / 2, x1: lx + 20, x2: lx + w - 20, vx: Rn(.5, .8 + diff * .4) * LVC.spd, dead: 0, plat: p }) }
    else if (room && li >= 1 && r0() < .14 + diff * .1) { const tw = Rn(30, 44), tx = side < 0 ? lx + 20 : lx + w - 20 - tw; THORN.push({ x1: tx, x2: tx + tw, y }) }   // bụi gai trên bậc: nhảy qua
    else if (r0() < .1) ITEMS.push({ x: lx + w / 2, y: y - 50, k: pick(['star', 'fea', 'mag', 'bal', 'heart', 'bat']), got: false });
    if (-y > H * .2 && r0() < (.1 + diff * .12) * LVC.en) ENEM.push({ k: T.fly, bx: W / 2, by: y - 40, amp: Rn(80, 150), sp: Rn(.012, .018) * LVC.spd, ph: Rn(0, 6), x: 0, y: 0, dead: 0 });
    if (-y > lastFlag + H / 3 && -y < H * .9 && !THORN.some(t => t.y === y)) { FLAGS.push({ x: lx + w / 2, y, got: false }); lastFlag = -y }
  }
  y -= rise0; side = -side; const top = { x: side < 0 ? 0 : W - 260, y, w: 260, kind: 'isle', wall: side }; PLATS.push(top); EXITX = top.x + top.w / 2; EXITY = y;
  // vách đá hai bên (khối đặc)
  for (const wx of [0, W]) { const pts = []; for (let yy = 40; yy > y - 500; yy -= 60) pts.push([wx + (wx ? 1 : -1) * (((yy * 7919) >>> 0) % 7), yy]); WALLS.push(pts) }
  MAXY = 900;
}
function buildUnder(li, T, r0, Rn, RI, pick) {   // MÀN DƯỚI NƯỚC (như bản gốc): hang biển có trần & đáy rêu xanh thẫm, gai bạc trên dốc · dưới trần · dưới bụng đảo đá — bấm ↑ để bơi lên
  const diff = li / (NL - 1); LEN = Math.round((6400 + li * 600) * LVC.len);
  const fl = [[-500, 700], [-500, 0], [0, 0]], ce = [[-500, -1400], [-500, -330], [0, -330]]; let x = 0, fy = 0, cy = -330, maxG = 0, itemGap = 2;
  const go = (nx, nf, nc) => { const sx = x, sf = fy, s2 = cy, n = Math.max(1, Math.round((nx - sx) / 30)); for (let i = 1; i <= n; i++) { const t = i / n, px = sx + (nx - sx) * t; fl.push([px, sf + (nf - sf) * t]); ce.push([px, s2 + (nc - s2) * t]) } x = nx; fy = nf; cy = nc; if (nf > maxG) maxG = nf };
  const egg = (ex, ey) => EGGS.push({ x: ex, y: ey, got: false });
  const spk = (x1, y1, x2, y2, dir) => SPK.push({ x1, y1, x2, y2, dir });
  const H0 = () => Rn(310, 350), fishC = () => pick(['#FFB070', '#FFD25A', '#FF8AB8', '#7AD8FF']);
  DECO.push({ x: 60, k: 'sign' }); go(420, 0, -330);
  while (x < LEN) {
    const ramp = clamp(x / LEN, 0, 1), types = ['wave', 'wave', 'spikes', 'stal', 'isle', 'school', 'jelly'];
    if (T.coral) types.push('mound', 'stal', 'spikes', 'jelly');
    const k = x < 800 ? 'wave' : pick(types);
    if (k === 'wave') {   // đáy & trần uốn lượn
      const L = Rn(300, 460), sx = x, sf = fy, s0 = cy, nf = clamp(fy + Rn(-60, 60), -90, 90), nc = nf - H0(), aF = Rn(0, 40), aC = Rn(0, 36), n = Math.round(L / 30);
      for (let i = 1; i <= n; i++) { const t = i / n, px = sx + L * t; fl.push([px, sf + (nf - sf) * t - Math.sin(t * Math.PI) * aF]); ce.push([px, s0 + (nc - s0) * t + Math.sin(t * Math.PI) * aC]) } x = sx + L; fy = nf; cy = nc; if (nf > maxG) maxG = nf;
      for (let q = 0; q < 3; q++) { const ex = sx + L * (.25 + q * .25); egg(ex, (gyAt(fl, ex) + gyAt(ce, ex)) / 2 + Math.sin(q * 2) * 40) }
      for (let d = 0; d < 2; d++) if (r0() < .8) DECO.push({ x: sx + Rn(30, L - 30), k: pick(T.deco) });
      if (sx > 900 && r0() < (.25 + .4 * ramp) * LVC.en) ENEM.push({ k: 'fish', bx: sx + L / 2, by: (sf + s0) / 2 + Rn(-40, 40), amp: Rn(70, 130), sp: Rn(.012, .02) * LVC.spd, ph: Rn(0, 6), x: 0, y: 0, dead: 0, c: fishC() });
      if (sx > 900 && r0() < (.15 + .3 * ramp * (.5 + diff)) * LVC.en) ENEM.push({ k: 'urchin', x: sx + L * .5, x1: sx + 60, x2: sx + L - 60, vx: (r0() < .5 ? -1 : 1) * Rn(.25, .45) * LVC.spd, dead: 0, poly: fl });
    } else if (k === 'spikes') {   // thung lũng gai bạc dưới đáy: bơi vượt qua
      go(x + 60, fy, cy); const d = Rn(50, 80), L = Rn(150, 230 + diff * 60), a0 = [x, fy];
      go(x + 45, fy + d, cy); spk(a0[0], a0[1], x, fy, 1); const b0 = [x, fy]; go(x + L, fy, cy); spk(b0[0], b0[1], x, fy, 1); const c0 = [x, fy]; go(x + 45, fy - d, cy); spk(c0[0], c0[1], x, fy, 1);
      for (let q = 0; q < 4; q++) egg(b0[0] - 20 + (L + 40) * q / 3, a0[1] - 110 - Math.sin(q / 3 * Math.PI) * 40);
      go(x + 70, fy, cy);
    } else if (k === 'stal') {   // trần thò xuống có gai: lặn xuống luồn qua bên dưới
      go(x + 60, fy, cy); const low = fy - (Rn(170, 190) - diff * 8), L = Rn(80, 150), a0 = [x, cy];
      go(x + 100, fy, low); spk(a0[0], a0[1], x, low, -1); const b0 = [x, low]; go(x + L, fy, low); spk(b0[0], b0[1], x, low, -1); const c0 = [x, low], back = fy - H0(); go(x + 90, fy, back); spk(c0[0], c0[1], x, back, -1);
      for (let q = 0; q < 3; q++) egg(b0[0] + L * q / 2, fy - 45);
      go(x + 60, fy, cy);
    } else if (k === 'mound') {   // gò san hô gai dưới đáy: bơi vượt lên sát trần
      go(x + 60, fy, cy); const rise = (fy - cy) - Rn(175, 195), L = Rn(80, 140), a0 = [x, fy];
      go(x + 60, fy - rise, cy); spk(a0[0], a0[1], x, fy, 1); const b0 = [x, fy]; go(x + L, fy, cy); spk(b0[0], b0[1], x, fy, 1); const c0 = [x, fy]; go(x + 60, fy + rise, cy); spk(c0[0], c0[1], x, fy, 1);
      for (let q = 0; q < 3; q++) egg(b0[0] + L * q / 2, cy + 52);
      go(x + 60, fy, cy);
    } else if (k === 'isle') {   // đảo đá nổi giữa nước, gai bạc treo dưới bụng: đi bên trên hoặc luồn bên dưới
      go(x + 80, fy + 40, fy + 40 - 450); const iw = Rn(160, 210), ix = x + 40, iy = fy - 215;
      go(x + iw + 80, fy, cy); PLATS.push({ x: ix, y: iy, w: iw, kind: 'rock' }); spk(ix + 6, iy + 34, ix + iw - 6, iy + 34, -1);
      for (let q = 0; q < 3; q++) egg(ix + iw * (q + 1) / 4, iy - 30); egg(ix + iw / 2, fy - 50);
      if (MYS.length < 2 && r0() < .3) MYS.push({ x: ix + iw / 2, y: iy - 85, got: false });
      go(x + 80, fy - 40, fy - 40 - H0());
    } else if (k === 'school') {   // đàn cá bơi qua lại
      const sx = x; go(x + Rn(320, 420), clamp(fy + Rn(-30, 30), -90, 90), cy); const n = 1 + (ramp > .4 ? 1 : 0) + (diff > .6 ? 1 : 0);
      for (let i = 0; i < n; i++) ENEM.push({ k: 'fish', bx: (sx + x) / 2, by: cy + (fy - cy) * (i + 1) / (n + 1), amp: (x - sx) / 2 - 30, sp: Rn(.014, .02) * LVC.spd, ph: i * 2.1, x: 0, y: 0, dead: 0, c: fishC() });
      for (let q = 0; q < 3; q++) egg(sx + (x - sx) * (q + 1) / 4, fy - 40); DECO.push({ x: sx + 60, k: pick(T.deco) });
    } else if (k === 'jelly') {   // sứa bập bềnh lên xuống (không giẫm được — né!)
      const sx = x; go(x + Rn(300, 380), fy, cy); const n = r0() < .5 + diff * .3 ? 2 : 1;
      for (let i = 0; i < n; i++) ENEM.push({ k: 'jelly', bx: sx + (x - sx) * (i + 1) / (n + 1), by: (fy + cy) / 2, amp: (fy - cy) / 2 - 95, sp: Rn(.016, .024) * LVC.spd, ph: i * 3, x: 0, y: 0, dead: 0 });
      for (let q = 0; q < 3; q++) egg(sx + (x - sx) * (q + .5) / 3, (fy + cy) / 2); DECO.push({ x: x - 40, k: pick(T.deco) });
    }
    if (--itemGap <= 0 && r0() < .45) { ITEMS.push({ x: x - 60, y: (fy + cy) / 2, k: pick(['star', 'fea', 'mag', 'heart', 'bat', 'mag']), got: false }); itemGap = 3 }
  }
  go(x + 420, fy, cy); EXITX = x - 200; POLY.push(fl); CEIL.push(ce); return maxG;
}
function build(li) {
  const T = THEMES[li], r0 = rng(seed0 * 37 + li * 131 + lvSel * 7), Rn = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(Rn(a, b + 1)), pick = a => a[Math.floor(r0() * a.length)];
  BOX = []; MYS = []; POLY = []; PITS = []; PLATS = []; EGGS = []; ITEMS = []; ENEM = []; SPR = []; THORN = []; FLAGS = []; DECO = []; VERT = false; EXITY = 0; WALLS = []; CEIL = []; SPK = []; BOSS = null; WAVES = []; GATE = null;
  if (T.under) { const mg = buildUnder(li, T, r0, Rn, RI, pick); return finishBuild(li, r0, mg, EXITX) }
  if (T.vert) { buildVert(li, T, r0, Rn, RI, pick); return finishBuild(li, r0) }
  LEN = Math.round((T.boss ? 6500 : 9000 + li * 1500) * LVC.len);
  let cur = [[-500, 700], [-500, 0], [0, 0]], x = 0, y = 0, itemGap = 2, baseY = 0, nTower = 0, lastTower = 0;
  let maxG = 0; const pt = (px, py) => { cur.push([px, py]); x = px; y = py; if (py > maxG) maxG = py };
  const egg = (ex, ey) => EGGS.push({ x: ex, y: ey, got: false });
  const lineEggs = (x1, x2, yf, n) => { for (let k = 0; k < n; k++) { const ex = x1 + (x2 - x1) * (k + .5) / n; egg(ex, yf(ex)) } };
  const arcEggs = (x1, y1, x2, y2, n, h) => { for (let k = 1; k <= n; k++) { const t = k / (n + 1); egg(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * h - 30) } };
  const endPoly = (deep) => { cur.push([x, y + deep]); POLY.push(cur) };
  const newPoly = (nx, ny, deep) => { cur = [[nx, ny + deep], [nx, ny]]; x = nx; y = ny };
  const flatTo = (nx) => { const sx = x; for (let px = sx + 24; px < nx; px += 24) pt(px, y); pt(nx, y) };
  const deco = (dx, k) => DECO.push({ x: dx, k: k || pick(T.deco) });
  DECO.push({ x: 60, k: 'sign' });
  flatTo(420);
  const ramp = () => clamp(x / LEN, 0, 1), diff = li / (NL - 1);   // độ khó tăng dần trong màn và qua từng màn
  while (x < LEN) {
    const types = ['hill', 'hill', 'flat', 'pit', 'tower', 'drop'];
    if (li >= 0) types.push('isles'); if (li >= 1) types.push('step', 'thorn', 'pit'); if (li >= 2) types.push('mover', 'spring', 'tower'); if (li >= 3) types.push('pit', 'isles'); if (li >= 4) types.push('mover', 'thorn', 'tower');
    if (T.leafy) types.push('leafchain', 'leafchain', 'leafchain', 'spring'); if (T.pools) types.push('pond', 'pond', 'pond', 'leafchain');
    let k = x < 700 ? 'hill' : pick(types); if (k === 'tower' && (nTower >= (li < 2 ? 2 : 3) || x - lastTower < 1800)) k = 'hill'; if (k === 'tower') { nTower++; lastTower = x }
    if (k === 'hill' || k === 'flat') {
      const L = k === 'hill' ? Rn(320, 560) : Rn(180, 280), amp = k === 'hill' ? Rn(26, (T.ice ? 40 : 60) + diff * 24) : 0, sx = x, sy = y, drift = clamp(Rn(-50, 50), -120 - (y - baseY), 120 - (y - baseY));
      for (let px = sx + 24; px <= sx + L; px += 24) { const t = (px - sx) / L; pt(px, sy + drift * t - Math.sin(t * Math.PI) * amp) }
      if (r0() < .7) lineEggs(sx + 40, x - 40, ex => gyAt(cur, ex) - 34, RI(2, 4));
      for (let d = 0; d < 2; d++) if (r0() < .8) deco(sx + Rn(30, L - 30));
      // con vật đi tuần (tăng dần)
      if (k === 'hill' && sx > 900 && r0() < (.18 + .5 * ramp() * (.5 + diff)) * LVC.en) ENEM.push({ k: li >= 4 && r0() < .3 ? 'spiky' : T.walker, x: sx + L * .5, x1: sx + 70, x2: sx + L - 70, vx: (r0() < .5 ? -1 : 1) * Rn(.7, 1.1 + diff * .5) * LVC.spd, dead: 0, poly: cur });
      if (sx > 1100 && r0() < (.1 + .35 * ramp() * (.4 + diff)) * LVC.en) ENEM.push({ k: T.fly, bx: sx + L / 2, by: sy - Rn(90, 130), amp: Rn(60, 110), sp: Rn(.012, .02) * LVC.spd, ph: Rn(0, 6), x: 0, y: 0, dead: 0 });
      if (sx > 500 && (k === 'flat' || amp < 70)) { if (r0() < .5) { const bx = sx + L * Rn(.3, .7), by = gyAt(cur, bx) - 108; BOX.push({ x: bx - 17, y: by - 34, w: 34, h: 34, used: false, bump: 0 }); if (r0() < .6 && L >= 300 && bx + 260 < sx + L) { const lx = bx - Rn(70, 90); SPR.push({ x: lx, y: gyAt(cur, lx), sq: 0, kind: 'leaf', f: 1 }) } }   // hộp ? như Mario: nhảy húc từ dưới · lá bập bênh bên cạnh để lên nóc hộp
        else if (L >= 320 && r0() < .45) { const lx = sx + Rn(70, L - 260), gy2 = gyAt(cur, lx), leaf = r0() < .6; SPR.push({ x: lx, y: gy2, sq: 0, kind: leaf ? 'leaf' : 'shroom', f: r0() < .5 ? 1 : -1 }); for (let q = 0; q < 4; q++) EGGS.push({ x: lx - 30 + q * 20, y: gy2 - 190 - Math.sin(q / 3 * Math.PI) * 25, got: false }); if (r0() < .35) ITEMS.push({ x: lx, y: gy2 - 250, k: pick(['star', 'fea', 'mag', 'heart']), got: false }) } }   // chùm trứng trên cao: lá / nấm bật lên ăn
      if (--itemGap <= 0 && r0() < .5) { ITEMS.push({ x: sx + L / 2, y: gyAt(cur, sx + L / 2) - 60, k: pick(['star', 'fea', 'mag', 'bal', 'heart', 'bat', 'fea', 'mag']), got: false }); itemGap = 3 }
    } else if (k === 'pit') {   // hố gai (bờ biển: hố nước — bóng nổi lên)
      flatTo(x + 90); const w = Math.round(Rn(55, 80 + diff * 42) * LVC.pit), px1 = x, py = y, ny = clamp(y + Rn(-30, 30), baseY - 150, baseY + 150);
      endPoly(T.pit === 'water' ? 230 : 700); PITS.push({ x1: px1, x2: px1 + w, y: Math.max(py, ny), kind: T.pit });
      arcEggs(px1, py, px1 + w, ny, 3, 70); newPoly(px1 + w, ny, T.pit === 'water' ? 230 : 700); flatTo(x + 60);
      if (T.pit === 'water') { const wp = PITS[PITS.length - 1]; POLY.push([[px1 - 2, wp.y + 230], [px1 + w + 2, wp.y + 230]]) }   // đáy hồ
    } else if (k === 'isles') {   // đảo nổi qua vực
      flatTo(x + 100); const n = RI(1, li >= 3 ? 3 : 2), gapW = Rn(70, 90 + diff * 12) * LVC.pit, px1 = x, py = y; let cx2 = px1;
      for (let i = 0; i < n; i++) { cx2 += gapW; const iy = py - Rn(8, 40), iw = Rn(130, 180); PLATS.push({ x: cx2, y: iy, w: iw, kind: 'isle' }); if (MYS.length < 2 && r0() < .1) MYS.push({ x: cx2 + iw / 2, y: iy - 70, got: false }); /* đồng tiền bí ẩn: hiếm (tối đa 2 đồng mỗi màn) */ arcEggs(cx2 - gapW, i ? PLATS[PLATS.length - 2].y : py, cx2 + iw / 2, iy, 2, 50); lineEggs(cx2 + 20, cx2 + iw - 20, () => iy - 28, 2); cx2 += iw }
      const endX = cx2 + gapW, ny = clamp(py + Rn(-40, 20), baseY - 150, baseY + 150);
      endPoly(700); PITS.push({ x1: px1, x2: endX, y: Math.max(py, ny), kind: T.pit === 'water' ? 'spike' : T.pit }); newPoly(endX, ny, 700); flatTo(x + 70);
    } else if (k === 'mover') {   // ván gỗ treo trượt qua vực rộng
      flatTo(x + 100); const w = Rn(240, 300), px1 = x, py = y, pw = 140;
      PLATS.push({ x: px1 + 20, y: py - 6, w: pw, kind: 'mover', bx: px1 + 20, amp: (w - pw - 40) / 2, sp: Rn(.01, .014) * LVC.spd, ph: -Math.PI / 2, dx: 0 });
      endPoly(700); PITS.push({ x1: px1, x2: px1 + w, y: py, kind: 'spike' }); arcEggs(px1, py, px1 + w, py, 4, 30); newPoly(px1 + w, py, 700); flatTo(x + 70);
    } else if (k === 'tower') {   // THÁP LEO: bậc đảo nổi so le, nhảy dần lên vách đá cao rồi đi tiếp trên đỉnh
      flatTo(x + 80); const n = RI(3, 3 + Math.min(3, li)) + (li === 0 ? 0 : 1), rise = Rn(72, 84), sx = x, W2 = 300, y0 = y;
      for (let i = 0; i < n; i++) { const left = (n - 1 - i) % 2 === 1, lx = sx + (left ? 20 : W2 - 170), ly = y0 - rise * (i + 1); PLATS.push({ x: lx, y: ly, w: 150, kind: 'isle' }); lineEggs(lx + 30, lx + 120, () => ly - 28, i % 2 ? 2 : 1) }
      flatTo(sx + W2); DECO.push({ x: sx + 40, k: 'arrowUp' });
      const top = y0 - rise * n; pt(x + 2, top); flatTo(x + 160); baseY = top; DECO.push({ x: x - 100, k: 'sign' });
    } else if (k === 'drop') {   // VÁCH THẢ: rơi xuống đoạn dưới (không mất mạng)
      flatTo(x + 120); const down = Rn(140, 220); pt(x + 2, y + down); baseY = y; flatTo(x + 200); arcEggs(x - 200, y - down, x - 40, y, 3, 30);
    } else if (k === 'step') {   // bậc cao vừa nhảy được
      flatTo(x + 60); const up = Rn(60, 95), sx = x; pt(sx + 4, y - up); flatTo(sx + Rn(160, 260)); lineEggs(sx + 30, x - 20, () => y - 32, 2);
      if (r0() < .5) { const down = Rn(40, 80); pt(x + 4, y + down); flatTo(x + 110) }   // xuống bậc rồi có đoạn phẳng đủ dài trước chướng ngại kế tiếp
    } else if (k === 'spring') {   // tường cao: nấm lò xo bật lên
      flatTo(x + 90); SPR.push(T.leafy || T.pools ? { x: x - 52, y, sq: 0, kind: 'leaf', f: 1 } : { x: x - 20, y, sq: 0 }); /* nấm (phần 2: lá nảy) sát chân tường: lăn tới là bật lên */ const up = Rn(150, 190), sx = x; pt(sx + 4, y - up); flatTo(sx + Rn(200, 300)); arcEggs(sx - 20, y + up, sx + 60, y, 3, 40);
    } else if (k === 'leafchain') {   // CHUỖI LÁ NẢY như bản gốc: lá mọc trên cuống dài giữa hố gai, nảy từ lá này sang lá kia
      flatTo(x + 90); const n = RI(2, 2 + Math.min(2, li + 1)), gap = Rn(175, 195), g0 = Rn(125, 145), px1 = x, py = y, w = g0 + gap * n;
      endPoly(700); PITS.push({ x1: px1, x2: px1 + w, y: py, kind: 'spike' });
      for (let i = 1; i <= n; i++) { const lx = px1 + g0 + gap * (i - 1), ly = py + 14; SPR.push({ x: lx, y: ly, sq: 0, kind: 'leaf', f: i % 2 ? 1 : -1, stem: 140 }); egg(lx, ly - 160); egg(lx, ly - 205); egg(lx + gap / 2, ly - 150) }
      newPoly(px1 + w, py, 700); flatTo(x + 80); deco(x - 40);
    } else if (k === 'pond') {   // AO SEN rộng: lá sen bập bềnh làm bậc, cá chép nhảy khỏi mặt nước
      flatTo(x + 90); const w = Rn(280, 420 + diff * 60), px1 = x, py = y;
      endPoly(230); PITS.push({ x1: px1, x2: px1 + w, y: py, kind: 'water' }); POLY.push([[px1 - 2, py + 230], [px1 + w + 2, py + 230]]);
      const nP = Math.max(1, Math.floor((w - 60) / 120)); for (let i = 0; i < nP; i++) { const lx = px1 + 40 + (w - 80) * (i + .5) / nP - 35; PLATS.push({ x: lx, y: py + 28, by: py + 28, w: 70, kind: 'lily', ph: Rn(0, 6), fl: r0() < .45 }); egg(lx + 35, py - 6) }
      if (px1 > 900 && r0() < (.5 + diff * .4) * LVC.en) ENEM.push({ k: 'leap', cx: px1 + w / 2, wy: py + 30, per: RI(150, 210), ph: RI(0, 150), h: Rn(110, 150), x: px1 + w / 2, y: py + 70, dead: 0, hid: 1, f: 1 });
      arcEggs(px1, py, px1 + w, py, 3, 90); newPoly(px1 + w, py, 230); flatTo(x + 70);
    } else if (k === 'thorn') {   // bụi gai trên đường: nhảy qua
      flatTo(x + 80); const w = Rn(38, 60 + diff * 30), sx = x; flatTo(sx + w); THORN.push({ x1: sx, x2: sx + w, y }); arcEggs(sx - 30, y, sx + w + 30, y, 2, 60); flatTo(x + 80);
    }
  }
  if (T.boss) {   // ĐẤU TRƯỜNG TRÙM: ếch Hypnotoad canh cổng — giẫm lên đầu 3 lần; 2 lá nảy hai bên để bật cao
    flatTo(x + 140); const ax = x; DECO.push({ x: ax - 70, k: 'sign' }); flatTo(ax + 980); const bx2 = x;
    SPR.push({ x: ax + 140, y, sq: 0, kind: 'leaf', f: 1 }, { x: bx2 - 140, y, sq: 0, kind: 'leaf', f: -1 });
    BOSS = { x: ax + 640, y, vx: 0, vy: 0, hp: 3, hurt: 0, dead: 0, act: 0, air: 0, t: 0, n: 0, x1: ax, x2: bx2, f: -1 }; GATE = { x: bx2 + 10, y };
  }
  flatTo(x + 420); EXITX = x - 200; POLY.push(cur); cur = null;
  finishBuild(li, r0, maxG, x);
}
function finishBuild(li, r0, maxG, endX) {
  if (!VERT) {
  // cờ trạm (2 cờ giữa màn)
  for (const f of [.34, .67]) { const fx = nearestGround(LEN * f); if (fx != null) FLAGS.push({ x: fx, y: groundY(fx), got: false }) }
  if (BOSS) FLAGS.push({ x: BOSS.x1 - 40, y: groundY(BOSS.x1 - 40), got: false });
  } else { /* màn dọc: cờ đã đặt trên bậc */ }
  const want = 30 + li * 3; if (EGGS.length > want) { const keep = want / EGGS.length; EGGS = EGGS.filter(() => r0() < keep) }   // khoảng 30–45 trứng mỗi màn (như bản gốc)
  eggTot = EGGS.length; eggGot = 0; if (!VERT) MAXY = maxG + 900;
  // va chạm: tách đoạn thẳng + chia ô để tra nhanh
  SEGS = []; BUCK = {};
  for (const p of POLY.concat(WALLS, CEIL)) for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; if (a[0] === b[0] && a[1] === b[1]) continue; SEGS.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] }) }
  for (const b of BOX) { const x1 = b.x, x2 = b.x + b.w, y1 = b.y, y2 = b.y + b.h; [[x1, y1, x2, y1], [x2, y1, x2, y2], [x2, y2, x1, y2], [x1, y2, x1, y1]].forEach(q => SEGS.push({ x1: q[0], y1: q[1], x2: q[2], y2: q[3], box: b })) }   // hộp ? là khối đặc
  if (GATE) SEGS.push({ x1: GATE.x - 16, y1: GATE.y + 10, x2: GATE.x - 16, y2: GATE.y - 700, gate: 1 });   // cổng tre: mở khi hạ trùm
  SEGS.forEach((s, i) => { for (let bk = Math.floor(Math.min(s.x1, s.x2) / 128) - 1; bk <= Math.floor(Math.max(s.x1, s.x2) / 128) + 1; bk++) (BUCK[bk] = BUCK[bk] || []).push(i) });
}
function gyAt(poly, x) { for (let i = 0; i < poly.length - 1; i++) { const a = poly[i], b = poly[i + 1]; if (b[0] > a[0] && x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]) } return poly[poly.length - 1][1] }
function groundY(x) { for (const p of POLY) if (p.length > 2 && x >= p[1][0] && x <= p[p.length - 2][0]) return gyAt(p, x); return null }
function nearestGround(x) { for (let d = 0; d < 600; d += 24) { for (const xx of [x + d, x - d]) if (groundY(xx) != null && !PITS.some(p => xx > p.x1 - 40 && xx < p.x2 + 40) && !THORN.some(t => xx > t.x1 - 40 && xx < t.x2 + 40) && !SPK.some(k => xx > Math.min(k.x1, k.x2) - 50 && xx < Math.max(k.x1, k.x2) + 50)) return xx } return null }
const findPoly = x => POLY.find(p => p.length > 2 && x >= p[1][0] && x <= p[p.length - 2][0]);
function loadLevel(li) {
  S.level = li; build(li); for (const k in PW) PW[k] = 0; setGrow(li === 0 && !S.coins ? 0 : pl.lvl); S.cpAt = { x: 120, y: groundY(120) };
  respawn(); pl.inv = 0; phase = 'play'; phT = 0; tLevel = 0; parts = [];
  GC.music.hush(false); GC.music.scene(LVMUS[li], true);
  banner = { t: 180, text: 'MÀN ' + (li + 1) + ' · ' + THEMES[li].ic + ' ' + THEMES[li].name + (THEMES[li].under ? ' — bấm ↑ để BƠI' : '') }; cam.x = pl.x - vw * .38; cam.y = pl.y - vh * .6;
}
function respawn() { const c = S.cpAt; pl.x = c.x; pl.y = c.y - R - 2; pl.sad = 0; pl.vx = pl.vy = 0; pl.inv = 90; pl.on = null; pl.onP = null }
const frac = () => VERT ? clamp(-pl.y / -EXITY, 0, 1) : clamp(pl.x / EXITX, 0, 1);
const prog = () => S.won ? 1 : clamp((S.level + frac()) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000), topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ vật lý: bóng tròn va chạm với đoạn thẳng ═════ */
function collide() {
  pl.on = null; pl.onP = null; let best = null;
  const bk = Math.floor(pl.x / 128), list = BUCK[bk] || [];
  for (const i of list) {
    const s = SEGS[i]; if (s.gate && (!BOSS || BOSS.dead)) continue; const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy; let t = ((pl.x - s.x1) * dx + (pl.y - s.y1) * dy) / L2; t = clamp(t, 0, 1);
    const cx = s.x1 + dx * t, cy = s.y1 + dy * t, ex = pl.x - cx, ey = pl.y - cy, d = Math.hypot(ex, ey);
    if (d < R + 1.5 && d > .0001) { const nx = ex / d, ny = ey / d; if (d < R) { if (s.box && ny > .6 && pl.vy < -1) bumpBox(s.box); push(nx, ny, R - d) } if (ny < -.5 && (!best || ny < best)) { best = ny; pl.on = s; pl.gn = [nx, ny] } }   // chạm đất (chừa 1,5 px để biết đang đứng trên mặt đất)
  }
  for (const p of PLATS) {   // đảo nổi / ván trượt: chỉ đỡ từ trên xuống
    if (pl.vy < -.5 || pl.x < p.x - 4 || pl.x > p.x + p.w + 4) continue;
    if (pl.y + R > p.y - 1.5 && pl.y + R < p.y + 18 && pl.y < p.y) { pl.y = p.y - R; if (pl.vy > 0) { if (pl.vy > 6) { pl.vy = -pl.vy * .35; pl.sq = .4 } else pl.vy = 0 } pl.on = p; pl.onP = p; pl.gn = [0, -1] }
  }
}
function bumpBox(b) {   // húc hộp ?: bung phần thưởng ngẫu nhiên
  b.bump = 10; if (b.used) { GC.sfx('bump'); return } b.used = true; GC.sfx('coin');
  const q = Math.random(), k = q < .4 ? 'eggs' : q < .55 ? 'star' : q < .68 ? 'fea' : q < .8 ? 'bal' : q < .9 ? 'mag' : 'heart';
  if (k === 'eggs') { for (let i = 0; i < 5; i++) EGGS.push({ x: b.x + 17 + (i - 2) * 22, y: b.y - 26 - Math.abs(i - 2) * 8, got: false, pop: 1 }); eggTot += 5; S.hooks.onPower && S.hooks.onPower('bt_box') }
  else ITEMS.push({ x: b.x + 17, y: b.y - 34, k, got: false, fall: 1 });   // rơi từ từ xuống đất như nấm Mario
  puff(b.x + 17, b.y, 14, ['#FFD23F', '#FFFFFF', '#FF9A2A'], 4);
}
function push(nx, ny, pen) {
  pl.x += nx * pen; pl.y += ny * pen; const vn = pl.vx * nx + pl.vy * ny;
  if (vn < 0) { const e = vn < -6 && ny < -.5 ? (keys.j ? .55 : .42) : 0; /* chỉ nảy rõ khi rơi từ trên cao xuống */ pl.vx -= (1 + e) * vn * nx; pl.vy -= (1 + e) * vn * ny; if (e > .4) { pl.sq = Math.min(.55, -vn * .06); if (-vn > 4) GC.tone(260 + Math.min(300, -vn * 30), .06, 'sine', .04, 520) } }   // giữ nút nhảy: nảy cao hơn
}
function step() {
  S.tick++; tLevel++; const T = THEMES[S.level];
  for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vy += q.g != null ? q.g : .15; q.l-- } parts = parts.filter(q => q.l > 0);
  for (const p of PLATS) if (p.kind === 'mover') { const nx = p.bx + p.amp + Math.sin(S.tick * p.sp + p.ph) * p.amp; p.dx = nx - p.x; p.x = nx }
  for (const p of PLATS) if (p.kind === 'lily') p.y = p.by + Math.sin(S.tick * .05 + p.ph) * 2.5;   // lá sen bập bềnh
  for (const s of SPR) if (s.sq) s.sq--;
  for (const e of ENEM) {
    if (e.dead) { e.dead++; continue }
    if (e.k === 'bee' || e.k === 'bat' || e.k === 'bird' || e.k === 'dfly' || e.k === 'fish') { const a = S.tick * e.sp + e.ph; e.x = e.bx + Math.sin(a) * e.amp; e.y = e.by + Math.sin(a * 3) * (e.k === 'fish' ? 6 : 12); e.f = Math.cos(a) > 0 ? 1 : -1 }
    else if (e.k === 'jelly') { const a = S.tick * e.sp + e.ph; e.x = e.bx + Math.sin(a * .6) * 16; e.y = e.by + Math.sin(a) * e.amp }   // sứa nhấp nhô lên xuống
    else if (e.k === 'leap') { const c = S.tick + e.ph, t = c % e.per, air = 64; if (t < air) { const u = t / air, d = Math.floor(c / e.per) % 2 ? -1 : 1; if (e.hid) puff(e.cx - d * 65, e.wy, 6, ['#ffffff', '#BFEFFF'], 3); e.hid = 0; e.x = e.cx + d * (u - .5) * 130; e.y = e.wy - Math.sin(u * Math.PI) * e.h; e.f = d; e.u = u } else { if (!e.hid) puff(e.x, e.wy, 6, ['#ffffff', '#BFEFFF'], 3); e.hid = 1; e.y = e.wy + 40 } }   // cá chép nhảy vọt khỏi mặt ao
    else { const fr = e.k === 'frog', hp = fr ? Math.max(0, Math.sin(S.tick * .07 + e.x1 * .013)) : 1; e.hop = fr ? hp * 30 : 0; e.x += e.vx * (fr ? hp * 1.8 : 1); if (e.x < e.x1) { e.x = e.x1; e.vx = Math.abs(e.vx) } else if (e.x > e.x2) { e.x = e.x2; e.vx = -Math.abs(e.vx) } e.y = e.plat ? e.plat.y : gyAt(e.poly, e.x); e.f = e.vx > 0 ? 1 : -1 }
  }
  if (phase === 'dead') { if (--phT <= 0) { if (S.lives <= 0) { S.lives = LIVES; loadLevel(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chơi lại Màn ' + (S.level + 1) + ' (không phải từ Màn 1) — có ' + LIVES + ' mạng mới!') } else { respawn(); phase = 'play'; GC.music.hush(false) } } return }
  if (phase === 'clear') { if (--phT <= 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NL - 1) { S.won = true; phase = 'won'; S.hooks.onWin && S.hooks.onWin() } else loadLevel(S.level + 1) } return }
  if (phase === 'won') return;
  for (const k in PW) if (PW[k] > 0) PW[k]--;
  if (pl.inv) pl.inv--; if (pl.grow) pl.grow--; if (pl.sad) pl.sad--;
  const can = S.energy > 0 && !frozen(), dir = can ? keys.r - keys.l : 0;
  const onG = !!pl.on; if (onG) pl.coy = 9; else if (pl.coy > 0) pl.coy--;
  // nước (bờ biển): bóng nổi lên
  const pit = PITS.find(p => pl.x > p.x1 && pl.x < p.x2), inWater = pit && pit.kind === 'water' && pl.y > pit.y + 34;
  const UW = !!T.under, iceN = T.ice && !pl.onP, acc = UW ? .1 : onG ? (iceN ? .16 : .19) : .13;   // trên đảo / ván gỗ không trơn
  if (dir) { pl.vx += dir * acc; pl.face = dir; use(COST.walk); if (onG && pl.gn && dir * pl.gn[0] < 0) pl.vx += dir * G * Math.abs(pl.gn[0]) * 1.05 }   // lên dốc: đẩy thêm bằng lực dốc → dốc nào cũng leo được
  else if (onG) pl.vx *= iceN ? .992 : .95;
  if (UW) pl.vx *= .985;   /* nước cản */
  { const mv = MAXV * (PW.star ? 1.15 : 1) * (UW ? .85 : 1); pl.vx = clamp(pl.vx, -mv, mv) }
  if (keys.jp) { keys.jp = 0; pl.buf = 8 }
  if (UW) { if (pl.swc) pl.swc--; if (pl.buf > 0) { pl.buf--; if (can && !pl.swc) { pl.buf = 0; pl.swc = 12; pl.vy = Math.max(-5.8, Math.min(pl.vy, 0) - 3.9 * (PW.fea ? 1.3 : 1)); use(COST.jump * .7); GC.tone(480, .08, 'sine', .05, 820); pl.sq = .3; bubbles(pl.x, pl.y + R * .6, 5) } } }   // DƯỚI NƯỚC: bấm ↑ là bơi lên (bấm liên tục để lên cao)
  else if (pl.buf > 0) { pl.buf--; if ((pl.coy > 0 || inWater) && can) { const g = pl.gn || [0, -1]; pl.vy = -JV * (PW.fea ? 1.3 : 1) * (1 + pl.lvl * .015); pl.jmp = true; /* bóng to nhảy cao hơn chút cho bù kích thước */ pl.vx += g[0] * 2; pl.coy = 0; pl.buf = 0; use(COST.jump); GC.sfx('jump'); pl.sq = .4; puff(pl.x, pl.y + R, 5, ['#ffffff', '#E8F8D8']) } }
  if (!keys.j && pl.jmp && pl.vy < -4) pl.vy += .35; if (pl.vy >= 0) pl.jmp = false;   /* thả nút sớm = nhảy thấp (chỉ với cú nhảy tự bấm) */   // thả nút sớm = nhảy thấp
  if (UW) { pl.vy += keys.j && can ? -.035 : .1; pl.vy *= .975; if (S.tick % 40 === 0) bubbles(pl.x + pl.face * R * .5, pl.y - R * .5, 1) }   // chìm từ từ · giữ ↑ thì nổi lên chầm chậm
  else { pl.vy += PW.bal ? -.05 : G; if (PW.bal && pl.vy < -2.5) pl.vy = -2.5 }
  if (inWater) { pl.vy -= .82; pl.vx *= .97; pl.vy *= .94 }
  pl.vy = Math.min(pl.vy, 15);
  if (pl.onP && pl.onP.kind === 'mover') pl.x += pl.onP.dx;
  const vyIn = pl.vy, wasAir = !pl.on; for (let sub = 0; sub < 2; sub++) { pl.x += pl.vx / 2; pl.y += pl.vy / 2; collide() }
  if (wasAir && pl.on && vyIn > 3) pl.sq = Math.min(.55, vyIn * .05);   // nhún khi rơi xuống đất
  pl.x = Math.max(-480, pl.x); pl.rot += pl.vx / R; pl.sq *= .85;
  // nấm lò xo
  for (const s of SPR) { const lf = s.kind === 'leaf', top = s.y - (lf ? 20 : 22); if (Math.abs(pl.x - s.x) < (lf ? 34 : 26) && pl.y + R > top && pl.y + R < s.y + 4 && pl.vy >= 0) { pl.vy = -(lf ? 13.6 : SPRING) * (keys.j ? 1.06 : 1); pl.jmp = false; s.sq = 14; GC.sfx('spring'); pl.sq = .6; puff(s.x, s.y - 16, 6, lf ? ['#8BE03A', '#ffffff'] : ['#FF6A6A', '#ffffff'], 3) } }
  // gai bạc (màn dưới nước) · bụi gai · hố gai · rơi xuống vực
  if (!PW.star && !pl.inv) for (const k of SPK) if (Math.max(k.x1, k.x2) > pl.x - 70 && Math.min(k.x1, k.x2) < pl.x + 70 && segD(pl.x, pl.y, k) < R + 7) return die('🦔 Đụng gai bạc nhọn!');
  if (!PW.star && !pl.inv) for (const t of THORN) if (pl.x + R * .6 > t.x1 && pl.x - R * .6 < t.x2 && pl.y + R > t.y - 14 && pl.y < t.y + 6) return die('🌵 Đụng bụi gai!');
  if (pit && pit.kind !== 'water' && pl.y > pit.y + 120) return die('😱 Rơi xuống hố gai!');
  if (pl.y > MAXY) return die('😱 Rơi xuống vực!');
  // con vật: rơi trúng đầu = giẫm bẹp · chạm ngang = mất mạng (⭐ bất tử thì hạ luôn)
  for (const e of ENEM) {
    if (e.dead || e.hid) continue; const ey = AIR(e.k) ? e.y : e.y - 14 - (e.hop || 0), d = Math.hypot(pl.x - e.x, pl.y - ey);
    if (d < R + 15) {
      if (PW.star || (!NOST(e.k) && pl.vy > 1 && pl.y < ey - 6)) { e.dead = 1; S.stomps++; S.energy += COST.stomp; pl.vy = UW ? -4.5 : -8.5; GC.sfx('stomp'); puff(e.x, ey, 14, ['#fff', '#FFE08A', '#FF9AB8'], 4); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) }
      else if (!pl.inv) { if (hurt('💥 Bị ' + (ENAME[e.k] || 'quái') + ' tông!', e.x)) return }   // đụng quái: mất mạng, bị hất ra (không phải về cờ)
    }
  }
  if (BOSS) { bossStep(); if (phase !== 'play') return }
  // trứng vàng (🧲 hút lại gần) · vật phẩm · cờ · đích
  for (const g of EGGS) {
    if (g.got) continue; if (PW.mag) { const dx = pl.x - g.x, dy = pl.y - g.y, d = Math.hypot(dx, dy); if (d < 200) { g.x += dx / d * 7; g.y += dy / d * 7 } }
    if (Math.abs(g.x - pl.x) < R + 10 && Math.abs(g.y - pl.y) < R + 12) { g.got = true; eggGot++; S.coins++; GC.sfx('coin'); puff(g.x, g.y, 6, ['#FFE08A', '#fff'], 2); if (++pl.eggc >= EGG_STEP && pl.lvl < GROW.length - 1) { pl.eggc = 0; setGrow(pl.lvl + 1); GC.sfx('power'); S.hooks.onPower && S.hooks.onPower('bt_grow' + pl.lvl) } if (S.coins % 30 === 0 && S.lives < LIVES + 2) { S.lives++; GC.sfx('power'); S.hooks.onPower && S.hooks.onPower('bt_life') } }
  }
  for (const b of BOX) if (b.bump) b.bump--;
  for (const m of MYS) if (!m.got && Math.abs(m.x - pl.x) < R + 16 && Math.abs(m.y - pl.y) < R + 18) { m.got = true; GC.sfx('power'); const k = ['star', 'fea', 'bal', 'mag', 'heart'][Math.floor(Math.random() * 5)]; if (k === 'heart') S.lives = Math.min(LIVES + 2, S.lives + 1); else PW[k] = PWF[k]; S.energy += 15; for (let i = 0; i < 20; i++) puff(m.x, m.y, 1, ['#FFD23F', '#FF7EB6', '#5AB0FF', '#3FBF86'], 6); S.hooks.onPower && S.hooks.onPower('bt_mys_' + k) }
  for (const it of ITEMS) if (it.fall && !it.got) { const g = groundY(it.x + 30 * it.fall); it.x += 1.1 * it.fall; if (g != null) { if (it.y < g - 30) it.y = Math.min(g - 30, it.y + 1.6); else it.y = g - 30 } else it.fall = -it.fall }
  for (const it of ITEMS) if (!it.got && Math.abs(it.x - pl.x) < R + 14 && Math.abs(it.y - pl.y) < R + 16) {
    it.got = true; GC.sfx('power'); puff(it.x, it.y, 16, ['#FFD23F', '#fff', '#FF9AB8'], 4);
    if (it.k === 'heart') { S.lives = Math.min(LIVES + 2, S.lives + 1) } else if (it.k === 'bat') { S.energy += COST.bat; S.hooks.onBat && S.hooks.onBat(COST.bat) } else PW[it.k] = PWF[it.k];
    if (it.k !== 'bat') S.hooks.onPower && S.hooks.onPower('bt_' + it.k);
  }
  for (const f of FLAGS) if (!f.got && Math.abs(pl.x - f.x) < 30 && pl.y > f.y - 90) { f.got = true; S.cpAt = { x: f.x, y: f.y }; GC.sfx('cp'); puff(f.x, f.y - 60, 20, ['#FF7EB6', '#5AB0FF', '#3FBF86', '#FFE08A'], 5); S.hooks.onCP && S.hooks.onCP(S.level + 1, 'mid') }
  if (VERT ? (pl.onP && pl.onP.y === EXITY) : pl.x > EXITX) { phase = 'clear'; phT = 130; GC.sfx('flag'); for (let k = 0; k < 40; k++) puff(EXITX, pl.y - 30, 1, ['#FFD23F', '#FF7EB6', '#5AB0FF', '#3FBF86'], 7) }
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function hurt(nm, fx) {   // mất 1 mạng, bị hất ra (không phải về cờ) · trả về true nếu hết mạng
  if (pl.inv || PW.star) return false; if (S.lives <= 1) { die(nm); return true }
  S.lives--; S.hits++; pl.inv = 100; pl.vx = (pl.x < fx ? -1 : 1) * 6; pl.vy = THEMES[S.level].under ? -3 : -7; GC.sfx('hurt'); puff(pl.x, pl.y, 10, ['#ff6b81', '#fff'], 4);
  S.hooks.onFall && S.hooks.onFall(0, nm + ' 💔 Mất 1 mạng — còn ' + S.lives + ' mạng'); return false;
}
function bossStep() {   // TRÙM ẾCH HYPNOTOAD: nhảy ầm ầm về phía bóng, thỉnh thoảng phun vòng thôi miên lăn trên đất — giẫm lên đầu 3 lần
  const b = BOSS;
  for (const w of WAVES) { w.x += w.vx; w.l-- } WAVES = WAVES.filter(w => w.l > 0 && w.x > b.x1 - 30 && w.x < b.x2 + 30);
  if (b.dead) { b.dead++; return }
  if (!b.act) { if (pl.x > b.x1 + 40) { b.act = 1; GC.music.scene('bs', true); banner = { t: 220, text: '🐸 TRÙM HYPNOTOAD! Nhảy lên ĐẦU nó 3 lần!' }; S.hooks.onPower && S.hooks.onPower('bt_boss') } return }
  if (b.hurt) b.hurt--; const fury = 3 - b.hp;
  if (b.air) { b.vy += .45; b.x = clamp(b.x + b.vx, b.x1 + 70, b.x2 - 70); b.y += b.vy; const g2 = groundY(b.x); if (g2 != null && b.y >= g2 && b.vy > 0) { b.y = g2; b.air = 0; b.t = 0; S.sh = 10; GC.tone(90, .18, 'square', .08, 60); puff(b.x, b.y, 12, ['#8AB840', '#ffffff'], 4) } }
  else { b.t++; b.f = pl.x < b.x ? -1 : 1; if (b.t > [100, 80, 62][fury]) { b.t = 0; b.n++; if (b.n % 3 === 0) { WAVES.push({ x: b.x + b.f * 50, y: b.y - 24, vx: b.f * (2.2 + fury * .4), l: 600 }); GC.tone(300, .3, 'sine', .07, 900) } else { b.air = 1; b.vy = -(9 + Math.random() * 2.5 + fury * .6); b.vx = b.f * (1.6 + Math.random() * 1.2 + fury * .5) } } }
  const cx = b.x, cy = b.y - 38, dx = (pl.x - cx) / (54 + R), dy = (pl.y - cy) / (40 + R);
  if (dx * dx + dy * dy < 1) {
    if (pl.y < cy - 16 && pl.vy > -1) {   // rơi trúng đầu
      pl.vy = -11; pl.jmp = false; pl.sq = .5;
      if (!b.hurt) { b.hp--; b.hurt = 80; GC.sfx('stomp'); S.sh = 8; puff(cx, cy - 30, 20, ['#FFE24A', '#FF7EB6', '#ffffff'], 5);
        if (b.hp <= 0) { b.dead = 1; WAVES = []; GC.music.scene(LVMUS[S.level], true); GC.sfx('power'); banner = { t: 220, text: '🎉 HẠ ĐƯỢC HYPNOTOAD! Cổng đích đã mở!' }; for (let k = 0; k < 40; k++) puff(cx, cy, 1, ['#FFD23F', '#FF7EB6', '#5AB0FF', '#3FBF86'], 7); S.energy += 30; S.hooks.onPower && S.hooks.onPower('bt_bossdown') }
        else S.hooks.onPower && S.hooks.onPower('bt_bosshit' + b.hp) }
    } else { pl.vx = (pl.x < cx ? -1 : 1) * 5; if (hurt('🐸 Bị Hypnotoad đè!', cx)) return }
  }
  for (const w of WAVES) if (Math.abs(pl.x - w.x) < R + 12 && Math.abs(pl.y - w.y) < R + 16) { if (hurt('🌀 Trúng vòng thôi miên!', w.x)) return }
}
function segD(px, py, k) { const dx = k.x2 - k.x1, dy = k.y2 - k.y1, t = clamp(((px - k.x1) * dx + (py - k.y1) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - k.x1 - dx * t, py - k.y1 - dy * t) }
function bubbles(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + (Math.random() - .5) * 10, y, vx: (Math.random() - .5) * .6, vy: -.4 - Math.random() * .6, g: -.02, r: 2 + Math.random() * 3, l: 50 + Math.random() * 30, c: '#E8F8FFcc' }) }
function setGrow(n) { const o = R; pl.lvl = clamp(n, 0, GROW.length - 1); R = GROW[pl.lvl].r; pl.y -= R - o; pl.grow = 30 }
function die(why) {
  S.falls++; S.hits++; S.lives--; phase = 'dead'; phT = 150; pl.sad = 150; if (pl.lvl) setGrow(pl.lvl - 1); /* mất mạng: nhỏ lại 1 cấp, mặt khóc */ GC.music.hush(true); GC.sfx('bdeath'); /* nhạc mất mạng gốc rồi mới chơi tiếp */ puff(pl.x, pl.y, 20, ['#E8202A', '#fff', '#FF9AB8'], 5);
  S.hooks.onFall && S.hooks.onFall(0, why + ' 💔 Mất 1 mạng — còn ' + Math.max(0, S.lives) + ' mạng' + (S.lives > 0 ? ' · về cờ gần nhất' : ''));
}
function puff(x, y, n, cols, sp) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * (sp || 3), vy: -Math.random() * (sp || 3), r: 2 + Math.random() * 3, l: 30 + Math.random() * 20, c: cols[i % cols.length] }) }

/* ═════ vẽ ═════ */
const OL = '#1E3A14';
function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('') }
function strokeOL(c, w) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke() }
function circ(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill() }
function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h) }
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1A3A1A'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
const STARS = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * .7, r: Math.random() * 1.5 + .4, t: Math.random() * 6 }));
const PILL = Array.from({ length: 14 }, (_, i) => ({ x: i * 260 + Math.random() * 120, h: .35 + Math.random() * .35, w: 26 + Math.random() * 22, isl: Math.random() < .6 }));
const BUB = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 5, s: .3 + Math.random() * .7 })), FF = Array.from({ length: 22 }, () => ({ x: Math.random(), y: .2 + Math.random() * .7, t: Math.random() * 6 }));
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: i * 340 + Math.random() * 200, y: .1 + Math.random() * .3, s: .6 + Math.random() * .7 }));
function drawBg(T) {
  const g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, T.sky[0]); g.addColorStop(.6, T.sky[1]); g.addColorStop(1, T.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  if (T.night || T.cave || T.ff) for (const s of STARS) { ctx.globalAlpha = T.cave ? .25 : .5 + .5 * Math.sin(S.tick * .04 + s.t); circ(s.x * cw, s.y * ch, s.r, T.cave ? '#B48AF0' : '#fff') } ctx.globalAlpha = 1;
  if (T.night) { circ(cw * .78, ch * .18, 30, '#FFF6D8'); circ(cw * .78 + 9, ch * .18 - 6, 6, '#E8E0C0') }
  else if (!T.cave && !T.under) { const gl = ctx.createRadialGradient(cw * .82, ch * .16, 0, cw * .82, ch * .16, 90); gl.addColorStop(0, '#FFF8D0'); gl.addColorStop(1, '#FFF8D000'); ctx.fillStyle = gl; ctx.fillRect(cw * .82 - 90, ch * .16 - 90, 180, 180) }
  if (!T.cave && !T.under) for (const c of CLOUDS) { const W2 = 9 * 340, xx = ((c.x - cam.x * sc * .1 + S.tick * .15) % W2 + W2) % W2 - 200, yy = c.y * ch; ctx.globalAlpha = T.night ? .25 : T.ff ? .45 : .9; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(xx, yy, 26 * c.s, 0, 7); ctx.arc(xx + 30 * c.s, yy + 6, 20 * c.s, 0, 7); ctx.arc(xx - 28 * c.s, yy + 8, 18 * c.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1 }
  // cột đá xa + đảo nổi (như bản gốc)
  for (const L of [0, 1]) {
    const k = .12 + L * .12, col = L ? T.far : mix(T.far, T.sky[1], .45), colD = L ? T.farD : mix(T.farD, T.sky[1], .45), W2 = 14 * 260;
    for (const p of PILL) {
      const xx = ((p.x * (1 + L * .3) - cam.x * sc * k) % W2 + W2) % W2 - 150, base = ch * (.95 - L * .02) - (cam.y * sc * (.05 + L * .05)), top = base - p.h * ch * (1 - L * .2), w = p.w * (1 + L * .4);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(xx - w * .5, base + 40); ctx.lineTo(xx - w * .35, top + 20); ctx.quadraticCurveTo(xx, top - 6, xx + w * .35, top + 20); ctx.lineTo(xx + w * .5, base + 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = colD; ctx.fillRect(xx + w * .1, top + 22, w * .18, base - top);
      if (p.isl && !T.under) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(xx, top + 14, w * 1.3, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = colD; ctx.beginPath(); ctx.moveTo(xx - w * 1.2, top + 16); ctx.quadraticCurveTo(xx, top + 40, xx + w * 1.2, top + 16); ctx.fill() }
    }
  }
  if (T.under) {   // tia nắng xuyên mặt nước + bong bóng nổi
    for (let i = 0; i < 6; i++) { const x0 = ((i * 260 - cam.x * sc * .05 + Math.sin(S.tick * .01 + i) * 30) % (cw + 400) + cw + 400) % (cw + 400) - 200, g2 = ctx.createLinearGradient(0, 0, 0, ch); g2.addColorStop(0, '#FFFFFF30'); g2.addColorStop(1, '#FFFFFF00'); ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 50 + i % 3 * 20, 0); ctx.lineTo(x0 - 90, ch); ctx.lineTo(x0 - 200, ch); ctx.closePath(); ctx.fill() }
    ctx.strokeStyle = '#FFFFFF66'; ctx.lineWidth = 1.5; for (const b of BUB) { const yy = ((b.y * ch - S.tick * b.s) % (ch + 40) + ch + 40) % (ch + 40) - 20, xx = b.x * cw + Math.sin(S.tick * .03 + b.y * 9) * 6; ctx.beginPath(); ctx.arc(xx, yy, b.r, 0, 7); ctx.stroke() }
  }
  if (T.ff) for (const f of FF) { const xx = ((f.x * cw + Math.sin(S.tick * .01 + f.t) * 40 - cam.x * sc * .2) % cw + cw) % cw, yy = f.y * ch + Math.cos(S.tick * .013 + f.t) * 20, a = .4 + .6 * Math.max(0, Math.sin(S.tick * .05 + f.t * 3)); ctx.globalAlpha = a; const g3 = ctx.createRadialGradient(xx, yy, 0, xx, yy, 13); g3.addColorStop(0, '#F8FFA0ee'); g3.addColorStop(.35, '#D8FF6088'); g3.addColorStop(1, '#C8FF6000'); ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(xx, yy, 13, 0, 7); ctx.fill(); circ(xx, yy, 2.2, '#FFFFD0'); ctx.globalAlpha = 1 }   // đom đóm đầm lầy
  if (T.cave) { ctx.fillStyle = '#0E1220'; for (let i = 0; i < 22; i++) { const xx = ((i * 97 - cam.x * sc * .3) % (cw + 200) + cw + 200) % (cw + 200) - 100, L = 30 + (i * 37) % 90; ctx.beginPath(); ctx.moveTo(xx - 18, 0); ctx.lineTo(xx + 18, 0); ctx.lineTo(xx, L); ctx.closePath(); ctx.fill() } }
}
function drawWalls(T) {   // vách đá hai bên giếng (màn leo dọc)
  if (!VERT) return; const top = cam.y - 100, bot = cam.y + vh + 100;
  for (const [i, pts] of WALLS.entries()) {
    const out = i === 0 ? -3000 : 3500; ctx.beginPath(); ctx.moveTo(out, bot); for (const q of pts) if (q[1] > top - 80 && q[1] < bot + 80) ctx.lineTo(q[0], q[1]); ctx.lineTo(out, top); ctx.closePath();
    const g = ctx.createLinearGradient(i === 0 ? -200 : SHAFT[1] + 200, 0, i === 0 ? 0 : SHAFT[1], 0); g.addColorStop(0, T.bodyD); g.addColorStop(1, T.body); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip(); for (let yy = Math.floor(top / 70) * 70; yy < bot; yy += 70) { ctx.fillStyle = mix(T.body, '#000000', .2); ctx.beginPath(); ctx.ellipse((i === 0 ? -40 : SHAFT[1] + 40) + ((yy * 13) % 50) * (i ? 1 : -1), yy + 20, 14, 8, 0, 0, 7); ctx.fill() } ctx.restore();
    ctx.beginPath(); let st = false; for (const q of pts) if (q[1] > top - 80 && q[1] < bot + 80) { if (!st) { ctx.moveTo(q[0], q[1]); st = true } else ctx.lineTo(q[0], q[1]) } strokeOL(T.grassD, 12); ctx.beginPath(); st = false; for (const q of pts) if (q[1] > top - 80 && q[1] < bot + 80) { if (!st) { ctx.moveTo(q[0] + (i ? -3 : 3), q[1]); st = true } else ctx.lineTo(q[0] + (i ? -3 : 3), q[1]) } strokeOL(T.grass, 6);
    for (let yy = Math.floor(top / 110) * 110; yy < bot; yy += 110) { const vx = i === 0 ? 4 : SHAFT[1] - 4; ctx.strokeStyle = '#2E7A1E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(vx, yy); ctx.quadraticCurveTo(vx + (i ? -16 : 16), yy + 30, vx + (i ? -6 : 6), yy + 60); ctx.stroke(); ctx.fillStyle = '#5AB82A'; ctx.beginPath(); ctx.ellipse(vx + (i ? -12 : 12), yy + 34, 7, 3.5, i ? -.6 : .6, 0, 7); ctx.fill() }
  }
}
function drawGround(T) {
  const lf = cam.x - 60, rt = cam.x + vw + 60;
  for (const p of POLY) {
    if (p[p.length - 1][0] < lf || p[0][0] > rt) continue;
    if (p.length === 2) { ctx.fillStyle = T.bodyD; ctx.fillRect(p[0][0], p[0][1], p[1][0] - p[0][0], 400); continue }   // đáy hồ
    ctx.beginPath(); ctx.moveTo(p[0][0], 1400); for (const q of p) ctx.lineTo(q[0], q[1]); ctx.lineTo(p[p.length - 1][0], 1400); ctx.closePath();
    const g = ctx.createLinearGradient(0, -200, 0, 500); g.addColorStop(0, T.body); g.addColorStop(1, T.bodyD); ctx.fillStyle = g; ctx.fill();
    if (T.brick) { ctx.save(); ctx.clip(); ctx.strokeStyle = '#00000022'; ctx.lineWidth = 2; for (let yy = -300; yy < 900; yy += 26) { ctx.beginPath(); ctx.moveTo(lf, yy); ctx.lineTo(rt, yy); ctx.stroke(); for (let xx = Math.floor(lf / 52) * 52 + ((yy / 26) & 1) * 26; xx < rt; xx += 52) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 26); ctx.stroke() } } ctx.restore() }
    else { ctx.save(); ctx.clip(); for (let i = 0; i < 30; i++) { const xx = p[1][0] + ((i * 173) % Math.max(1, p[p.length - 2][0] - p[1][0])), yy = gyAt(p, xx) + 40 + (i * 61) % 220; ctx.fillStyle = mix(T.body, '#000000', .18); ctx.beginPath(); ctx.ellipse(xx, yy, 9 + i % 4 * 3, 5 + i % 3, 0, 0, 7); ctx.fill() } ctx.restore() }
    // viền cỏ trên mặt (bỏ qua vách đứng)
    for (const [w, c] of [[16, T.grassD], [10, T.grass]]) { ctx.beginPath(); let on = false; for (let i = 1; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; const flat = Math.abs(b[1] - a[1]) < Math.abs(b[0] - a[0]) * 2.6 + .1 && b[0] > a[0]; if (flat) { if (!on) { ctx.moveTo(a[0], a[1] + (w > 12 ? 3 : 0)); on = true } ctx.lineTo(b[0], b[1] + (w > 12 ? 3 : 0)) } else on = false } strokeOL(c, w) }
    ctx.beginPath(); let on2 = false; for (let i = 1; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; if (b[0] > a[0] && Math.abs(b[1] - a[1]) < Math.abs(b[0] - a[0]) * 2.6) { if (!on2) { ctx.moveTo(a[0], a[1] - 3); on2 = true } ctx.lineTo(b[0], b[1] - 3) } else on2 = false } strokeOL(mix(T.grass, '#ffffff', .45), 2.5);
    if (!T.ice && !T.night && T.pit !== 'water') for (let i = 1; i < p.length - 2; i += 2) { const a = p[i]; if (a[0] < lf || a[0] > rt) continue; ctx.fillStyle = T.grass; ctx.beginPath(); ctx.moveTo(a[0] - 5, a[1] + 3); ctx.lineTo(a[0] - 1, a[1] - 7 - (i % 3) * 2); ctx.lineTo(a[0] + 3, a[1] + 3); ctx.fill() }
  }
}
function drawCeil(T) {   // trần hang biển: khối rêu xanh thẫm phủ xuống
  const lf = cam.x - 80, rt = cam.x + vw + 80, top = cam.y - 400;
  for (const p of CEIL) {
    const pts = p.filter(q => q[0] > lf && q[0] < rt && q[1] > -1300); if (pts.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(pts[0][0], top); for (const q of pts) ctx.lineTo(q[0], q[1]); ctx.lineTo(pts[pts.length - 1][0], top); ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, cam.y + vh * .5); g.addColorStop(0, T.bodyD); g.addColorStop(1, T.body); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip(); for (let i = 0; i < 26; i++) { const xx = Math.floor(lf / 90) * 90 + i * 90 + (i * 37) % 40; const cy2 = gyAt(p, xx) - 40 - (i * 53) % 150; ctx.fillStyle = mix(T.body, '#000000', .2); ctx.beginPath(); ctx.ellipse(xx, cy2, 12 + i % 3 * 4, 6 + i % 2 * 2, 0, 0, 7); ctx.fill() } ctx.restore();
    for (const [w, c] of [[14, T.grassD], [7, T.grass]]) { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1] - (w > 10 ? 2 : 0)) : ctx.moveTo(q[0], q[1] - (w > 10 ? 2 : 0))); strokeOL(c, w) }
  }
}
function drawSpk() {   // gai bạc nhọn (màn dưới nước): mọc trên dốc · treo dưới trần · dưới bụng đảo đá
  for (const k of SPK) {
    if (Math.max(k.x1, k.x2) < cam.x - 40 || Math.min(k.x1, k.x2) > cam.x + vw + 40) continue;
    const dx = k.x2 - k.x1, dy = k.y2 - k.y1, L = Math.hypot(dx, dy), tx = dx / L, ty = dy / L, nx = ty * k.dir, ny = -tx * k.dir, n = Math.max(1, Math.round(L / 16)), st = L / n;
    for (let i = 0; i < n; i++) {
      const ax = k.x1 + tx * st * i, ay = k.y1 + ty * st * i, bx = ax + tx * st, by = ay + ty * st, mx = (ax + bx) / 2 + nx * 17, my = (ay + by) / 2 + ny * 17;
      ctx.fillStyle = '#C8D0DA'; ctx.beginPath(); ctx.moveTo(ax - nx * 3, ay - ny * 3); ctx.lineTo(mx, my); ctx.lineTo(bx - nx * 3, by - ny * 3); ctx.closePath(); ctx.fill(); strokeOL('#3A4250', 1.6);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * .3, ay + (by - ay) * .3); ctx.lineTo(mx, my); ctx.lineTo(ax + (bx - ax) * .48, ay + (by - ay) * .48); ctx.closePath(); ctx.fill();
    }
  }
}
function drawPits(T) {
  for (const p of PITS) {
    if (p.x2 < cam.x - 50 || p.x1 > cam.x + vw + 50) continue;
    if (p.kind === 'water') { const wy = p.y + 30, wc = T.water || '#3AA8E8', gw = ctx.createLinearGradient(0, wy, 0, wy + 200); gw.addColorStop(0, wc + 'dd'); gw.addColorStop(1, mix(wc, '#000000', .45) + 'ee'); ctx.fillStyle = gw; ctx.fillRect(p.x1, wy, p.x2 - p.x1, 200);
      ctx.fillStyle = '#FFFFFF55'; for (let x = p.x1 + 20; x < p.x2 - 20; x += 46) { const yy = wy + 14 + ((x * 7) % 30); ctx.fillRect(x + Math.sin(S.tick * .05 + x) * 6, yy, 14, 2) } ctx.strokeStyle = '#FFFFFFcc'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = p.x1; x < p.x2; x += 20) { const yy = wy + Math.sin(x * .1 + S.tick * .08) * 3; ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 5, yy - 4, x + 10, yy) } ctx.stroke(); continue }
    const by = p.y + 150; ctx.fillStyle = T.bodyD; ctx.fillRect(p.x1, by, p.x2 - p.x1, 600);
    for (let x = p.x1; x < p.x2; x += 16) { ctx.fillStyle = '#C8CED8'; ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + 8, by - 22); ctx.lineTo(x + 16, by); ctx.closePath(); ctx.fill(); strokeOL('#4A5060', 1.5); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x + 6, by - 4); ctx.lineTo(x + 8, by - 18); ctx.lineTo(x + 9, by - 4); ctx.fill() }
  }
  for (const t of THORN) { if (t.x2 < cam.x - 50 || t.x1 > cam.x + vw + 50) continue; for (let x = t.x1; x < t.x2; x += 12) { const h = 16 + ((x * 7) % 9); ctx.fillStyle = T.ice ? '#A8D8F8' : '#4E7A2A'; ctx.beginPath(); ctx.moveTo(x, t.y + 2); ctx.lineTo(x + 6, t.y - h); ctx.lineTo(x + 12, t.y + 2); ctx.closePath(); ctx.fill(); strokeOL(T.ice ? '#4A78A8' : '#1E3A10', 2); circ(x + 6, t.y - h + 2, 2, T.ice ? '#fff' : '#FF5A7A') } }
}
function drawPlats(T) {
  for (const p of PLATS) {
    if (p.x + p.w < cam.x - 60 || p.x > cam.x + vw + 60 || p.y < cam.y - 80 || p.y > cam.y + vh + 80) continue;
    if (p.kind === 'mover') {   // ván gỗ treo dây
      ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 2; for (const ax of [p.x + 10, p.x + p.w - 10]) { ctx.beginPath(); ctx.moveTo(ax, p.y); ctx.lineTo(ax, p.y - 700); ctx.stroke() }
      ctx.fillStyle = '#9A5A2E'; rr(p.x, p.y, p.w, 14, 3); ctx.fill(); strokeOL('#4A2A12', 2.5); ctx.fillStyle = '#B8743E'; ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 4);
      ctx.strokeStyle = '#4A2A12'; ctx.lineWidth = 1.5; for (let x = p.x + 22; x < p.x + p.w; x += 22) { ctx.beginPath(); ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + 13); ctx.stroke() }
    } else if (p.kind === 'rock') {   // đảo đá rêu dưới biển (gai bạc treo dưới bụng)
      ctx.fillStyle = T.body; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.quadraticCurveTo(p.x + p.w + 8, p.y + 20, p.x + p.w - 8, p.y + 36); ctx.lineTo(p.x + 8, p.y + 36); ctx.quadraticCurveTo(p.x - 8, p.y + 20, p.x, p.y); ctx.closePath(); ctx.fill(); strokeOL(T.bodyD, 2.5);
      ctx.beginPath(); ctx.moveTo(p.x - 2, p.y + 2); ctx.lineTo(p.x + p.w + 2, p.y + 2); strokeOL(T.grassD, 10); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); strokeOL(T.grass, 5);
    } else if (p.kind === 'lily') {   // lá sen nổi (có khía) · có hoa sen hồng
      const cx = p.x + p.w / 2, cy = p.y + 3; ctx.fillStyle = '#2E7A2A'; ctx.beginPath(); ctx.ellipse(cx, cy + 3, p.w / 2 + 3, 10, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6AD04A'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.ellipse(cx, cy, p.w / 2 + 2, 9, 0, .3, Math.PI * 2 - .05); ctx.closePath(); ctx.fill(); strokeOL('#1E5A1A', 2);
      ctx.strokeStyle = '#A8EA7A'; ctx.lineWidth = 1.5; for (const a of [1.2, 2.2, 3.2, 4.2, 5.2]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (p.w / 2 - 4), cy + Math.sin(a) * 7); ctx.stroke() }
      if (p.fl) { const fx = cx - 12, fy = cy - 4; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .45; ctx.fillStyle = i % 2 ? '#FF9AC8' : '#FFC2DE'; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 4, 9, a + Math.PI / 2, 0, 7); ctx.fill() } circ(fx, fy - 2, 3.5, '#FFE24A') }
    } else {   // đảo cỏ nổi
      ctx.fillStyle = T.body; ctx.beginPath(); ctx.moveTo(p.x, p.y + 4); ctx.quadraticCurveTo(p.x + p.w * .1, p.y + 34, p.x + p.w * .5, p.y + 40); ctx.quadraticCurveTo(p.x + p.w * .9, p.y + 34, p.x + p.w, p.y + 4); ctx.closePath(); ctx.fill(); strokeOL(OL, 2.5);
      ctx.beginPath(); ctx.moveTo(p.x - 4, p.y + 3); ctx.lineTo(p.x + p.w + 4, p.y + 3); strokeOL(T.grassD, 14); ctx.beginPath(); ctx.moveTo(p.x - 4, p.y); ctx.lineTo(p.x + p.w + 4, p.y); strokeOL(T.grass, 9);
      for (let x = p.x + 6; x < p.x + p.w; x += 14) { ctx.fillStyle = T.grass; ctx.beginPath(); ctx.moveTo(x - 4, p.y + 4); ctx.quadraticCurveTo(x, p.y + 14, x + 4, p.y + 4); ctx.fill() }
    }
  }
}
function drawDeco(T) {
  for (const d of DECO) {
    if (d.x < cam.x - 80 || d.x > cam.x + vw + 80) continue; const gy = d.y != null ? d.y : groundY(d.x); if (gy == null) continue; if (gy < cam.y - 150 || gy > cam.y + vh + 150) continue; const x = d.x, y = gy - 2, k = d.k;
    if (k === 'flowerW') { ctx.strokeStyle = '#3A8A20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 8, y - 30, x + 4, y - 56); ctx.stroke(); ctx.fillStyle = '#5AB82A'; ctx.beginPath(); ctx.ellipse(x - 10, y - 26, 10, 4, -.6, 0, 7); ctx.fill(); for (let i = 0; i < 6; i++) { const a = i * 1.047 + .3; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(x + 4 + Math.cos(a) * 14, y - 60 + Math.sin(a) * 14, 15, 7, a, 0, 7); ctx.fill(); strokeOL('#B8C8D0', 1.2) } circ(x + 4, y - 60, 6, '#FFD23F') }
    else if (k === 'flowerR' || k === 'flowerP') { const c = k === 'flowerR' ? '#FF3A4A' : '#FF8AC8'; ctx.strokeStyle = '#3A8A20'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = i * 1.047; circ(x + Math.cos(a) * 9, y - 30 + Math.sin(a) * 9, 7, c) } circ(x, y - 30, 6, '#FFE24A'); strokeOL('#8A1A1A', 1) }
    else if (k === 'bush') { ctx.fillStyle = '#3A9A2A'; ctx.beginPath(); ctx.moveTo(x - 30, y + 2); for (let i = 0; i <= 6; i++) { const t = i / 6; ctx.lineTo(x - 30 + t * 60, y - (i % 2 ? 22 : 40) * Math.sin(t * Math.PI) - 4) } ctx.closePath(); ctx.fill(); strokeOL(OL, 2); ctx.fillStyle = '#6AD03A'; ctx.beginPath(); ctx.moveTo(x - 14, y - 10); ctx.lineTo(x, y - 34); ctx.lineTo(x + 6, y - 12); ctx.fill() }
    else if (k === 'vine') { ctx.strokeStyle = '#2E7A1E'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30, y - 40, x - 30, y - 80, x + 10, y - 120); ctx.stroke(); for (let i = 1; i < 5; i++) { ctx.fillStyle = '#5AB82A'; ctx.beginPath(); ctx.ellipse(x + (i % 2 ? 12 : -8), y - i * 26, 9, 4, i % 2 ? .5 : -.5, 0, 7); ctx.fill() } }
    else if (k === 'arrowUp') { ctx.fillStyle = '#8A5A2E'; ctx.fillRect(x - 3, y - 50, 6, 50); rr(x - 22, y - 92, 44, 44, 5); ctx.fillStyle = '#B8743E'; ctx.fill(); strokeOL('#4A2A12', 2.5); ctx.fillStyle = '#FFC23A'; ctx.beginPath(); ctx.moveTo(x, y - 86); ctx.lineTo(x + 14, y - 70); ctx.lineTo(x + 6, y - 70); ctx.lineTo(x + 6, y - 54); ctx.lineTo(x - 6, y - 54); ctx.lineTo(x - 6, y - 70); ctx.lineTo(x - 14, y - 70); ctx.closePath(); ctx.fill(); strokeOL('#8A5A08', 1.5) }
    else if (k === 'sign') { ctx.fillStyle = '#8A5A2E'; ctx.fillRect(x - 3, y - 50, 6, 50); rr(x - 26, y - 76, 52, 34, 4); ctx.fillStyle = '#B8743E'; ctx.fill(); strokeOL('#4A2A12', 2.5); ctx.fillStyle = '#FFC23A'; ctx.beginPath(); ctx.moveTo(x - 14, y - 64); ctx.lineTo(x + 4, y - 64); ctx.lineTo(x + 4, y - 70); ctx.lineTo(x + 16, y - 59); ctx.lineTo(x + 4, y - 48); ctx.lineTo(x + 4, y - 54); ctx.lineTo(x - 14, y - 54); ctx.closePath(); ctx.fill(); strokeOL('#8A5A08', 1.5) }
    else if (k === 'shroom') { ctx.fillStyle = '#E8D8F0'; ctx.fillRect(x - 4, y - 18, 8, 18); ctx.fillStyle = '#7AF0D8'; ctx.shadowColor = '#7AF0D8'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.ellipse(x, y - 18, 16, 10, 0, Math.PI, 0); ctx.fill(); ctx.shadowBlur = 0 }
    else if (k === 'crystal') { ctx.fillStyle = '#B48AF0'; ctx.shadowColor = '#C8A8FF'; ctx.shadowBlur = 10; for (const [ox, h] of [[-8, 28], [4, 40], [14, 22]]) { ctx.beginPath(); ctx.moveTo(x + ox - 6, y); ctx.lineTo(x + ox, y - h); ctx.lineTo(x + ox + 6, y); ctx.closePath(); ctx.fill() } ctx.shadowBlur = 0 }
    else if (k === 'palm') { ctx.strokeStyle = '#8A5A2E'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 50, x + 6, y - 96); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = -Math.PI + i * Math.PI / 5; ctx.strokeStyle = '#3A9A2A'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 6, y - 96); ctx.quadraticCurveTo(x + 6 + Math.cos(a) * 30, y - 110 + Math.sin(a) * 20, x + 6 + Math.cos(a) * 52, y - 86 + Math.sin(a) * 26); ctx.stroke() } circ(x + 2, y - 90, 5, '#6A4A1E'); circ(x + 11, y - 92, 5, '#6A4A1E') }
    else if (k === 'shell') { ctx.fillStyle = '#FF9A8A'; ctx.beginPath(); ctx.arc(x, y, 9, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL('#8A3A2A', 1.5) }
    else if (k === 'pine') { ctx.fillStyle = '#5A3A1E'; ctx.fillRect(x - 4, y - 14, 8, 14); for (let i = 0; i < 3; i++) { const t = y - 14 - i * 22, w2 = 30 - i * 7; ctx.fillStyle = '#2A7A50'; ctx.beginPath(); ctx.moveTo(x, t - 30); ctx.lineTo(x - w2, t); ctx.lineTo(x + w2, t); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x, t - 30); ctx.lineTo(x - w2 * .5, t - 14); ctx.lineTo(x + w2 * .5, t - 14); ctx.closePath(); ctx.fill() } }
    else if (k === 'snowman') { circ(x, y - 14, 14, '#FFFFFF'); circ(x, y - 36, 10, '#FFFFFF'); strokeOL('#90B4DA', 1.5); circ(x - 3, y - 38, 1.6, '#2A2A3A'); circ(x + 3, y - 38, 1.6, '#2A2A3A'); ctx.fillStyle = '#FF8A1A'; ctx.beginPath(); ctx.moveTo(x, y - 35); ctx.lineTo(x + 9, y - 34); ctx.lineTo(x, y - 33); ctx.fill() }
    else if (k === 'torch') { ctx.fillStyle = '#5A4A3A'; ctx.fillRect(x - 3, y - 46, 6, 46); const fl = Math.sin(S.tick * .4 + x) * 2; ctx.fillStyle = '#FF8A1Acc'; ctx.beginPath(); ctx.ellipse(x, y - 54 + fl, 7, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE070'; ctx.beginPath(); ctx.ellipse(x, y - 51 + fl, 3.5, 6, 0, 0, 7); ctx.fill() }
    else if (k === 'fern') { for (const a of [-1.1, -.6, -.15, .3, .8]) { const ex = x + Math.sin(a) * 42, ey = y - Math.cos(a) * 44; ctx.strokeStyle = '#3A9A2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(a) * 12, y - 34, ex, ey); ctx.stroke(); ctx.fillStyle = '#5AC23A'; for (let t = .35; t < 1; t += .18) { ctx.beginPath(); ctx.ellipse(x + (ex - x) * t, y + (ey - y) * t - Math.sin(t * Math.PI) * 5, 6, 2.6, a - .7, 0, 7); ctx.fill() } } }
    else if (k === 'reed') { for (const [ox, h] of [[-8, 52], [0, 68], [9, 46]]) { const sw = Math.sin(S.tick * .03 + ox) * 3; ctx.strokeStyle = '#4A8A2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + ox, y); ctx.quadraticCurveTo(x + ox + 3, y - h / 2, x + ox + sw, y - h); ctx.stroke(); ctx.fillStyle = '#8A5A2E'; rr(x + ox + sw - 3.5, y - h - 2, 7, 18, 3.5); ctx.fill() } ctx.strokeStyle = '#6AB83A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.quadraticCurveTo(x - 20, y - 26, x - 26, y - 40); ctx.stroke() }
    else if (k === 'weed') { ctx.lineCap = 'round'; for (const [ox, h, c] of [[-9, 70, '#2E8A4A'], [6, 98, '#3AAA5A'], [17, 60, '#4AC26A']]) { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + ox, y + 2); for (let t = 1; t <= 6; t++) ctx.lineTo(x + ox + Math.sin(S.tick * .04 + t * .9 + ox) * 7 * t / 6, y - h * t / 6); ctx.stroke() } }
    else if (k === 'coralP') { const br = (bx, by, a, L, d) => { const ex = bx + Math.sin(a) * L, ey = by - Math.cos(a) * L; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); if (d > 0) { br(ex, ey, a - .5, L * .72, d - 1); br(ex, ey, a + .45, L * .72, d - 1) } else circ(ex, ey, 4, '#FFC2DE') }; ctx.strokeStyle = '#FF7EB6'; ctx.lineWidth = 6; ctx.lineCap = 'round'; br(x, y + 2, -.1, 26, 2) }
    else if (k === 'coralO') { ctx.fillStyle = '#FFB27A'; ctx.beginPath(); ctx.ellipse(x, y, 26, 24, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL('#B8603A', 2); ctx.strokeStyle = '#E8884A'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y, 26 - i * 6, 24 - i * 6, 0, Math.PI, 0); ctx.stroke() } }
    else if (k === 'anem') { for (let i = 0; i < 9; i++) { const a = -1.2 + i * .3, sw = Math.sin(S.tick * .06 + i) * 4; ctx.strokeStyle = '#C88AF0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + a * 10, y - 6); ctx.quadraticCurveTo(x + a * 18 + sw, y - 22, x + a * 22 + sw * 1.5, y - 34); ctx.stroke(); circ(x + a * 22 + sw * 1.5, y - 34, 3, '#FFD0F8') } ctx.fillStyle = '#8A4AC8'; ctx.beginPath(); ctx.ellipse(x, y - 3, 16, 8, 0, 0, 7); ctx.fill() }
    else if (k === 'shellU') { ctx.fillStyle = '#FF9A8A'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? 5 : 13; ctx.lineTo(x + Math.cos(a) * r2, y - 11 + Math.sin(a) * r2) } ctx.closePath(); ctx.fill(); strokeOL('#B8504A', 1.6); circ(x, y - 11, 2, '#FFE0D8') }
    else if (k === 'gshroom') { for (const [ox, h, c, s2] of [[-14, 22, '#7AF0D8', 12], [4, 34, '#FF8AD8', 16], [18, 16, '#B48AFF', 9]]) { ctx.fillStyle = '#E8E0F0'; ctx.fillRect(x + ox - 3, y - h, 6, h); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 16; ctx.beginPath(); ctx.ellipse(x + ox, y - h, s2, s2 * .65, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; circ(x + ox - s2 * .4, y - h - s2 * .3, 2, '#ffffffcc') } }
    else if (k === 'mushS') { ctx.fillStyle = '#F0E6D0'; ctx.fillRect(x - 3, y - 14, 6, 14); ctx.fillStyle = '#C8503A'; ctx.beginPath(); ctx.ellipse(x, y - 14, 13, 9, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL('#5A1A0A', 1.5); circ(x - 4, y - 18, 2, '#fff'); circ(x + 5, y - 17, 1.6, '#fff') }
    else if (k === 'deadtree') { ctx.strokeStyle = '#4A3A2A'; ctx.lineCap = 'round'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 6, y - 50, x + 4, y - 96); ctx.stroke(); ctx.lineWidth = 4; for (const [a, b2, c2, d2] of [[x - 2, y - 56, x - 30, y - 80], [x + 2, y - 74, x + 28, y - 92], [x + 4, y - 96, x - 10, y - 116]]) { ctx.beginPath(); ctx.moveTo(a, b2); ctx.lineTo(c2, d2); ctx.stroke() } ctx.fillStyle = '#6A8A4A'; ctx.beginPath(); ctx.ellipse(x - 30, y - 78, 6, 9, 0, 0, 7); ctx.fill() }
    else if (k === 'banner') { ctx.fillStyle = '#5A4A3A'; ctx.fillRect(x - 2, y - 80, 4, 80); ctx.fillStyle = '#B8303A'; ctx.beginPath(); ctx.moveTo(x + 2, y - 78); ctx.lineTo(x + 30, y - 78); ctx.lineTo(x + 30, y - 40); ctx.lineTo(x + 16, y - 48); ctx.lineTo(x + 2, y - 40); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(x + 16, y - 62, 5, 0, 7); ctx.fill() }
  }
}
function drawLeaf(s) {   // lá bập bênh cong như bản gốc: cuống mọc từ đất, phiến lá cong lên, đầu lá cuộn
  const f = s.f || 1, b = s.sq ? Math.sin(s.sq / 14 * Math.PI) * 8 : 0, x = s.x, y = s.y, dark = '#1E5A1A';
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  if (s.stem) { ctx.strokeStyle = '#2E7A22'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-14, s.stem * .5, -4, s.stem); ctx.stroke(); ctx.strokeStyle = '#5AB82A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-5, 2); ctx.quadraticCurveTo(-12, s.stem * .5, -3, s.stem); ctx.stroke(); ctx.fillStyle = '#4FB82E'; ctx.beginPath(); ctx.ellipse(-16, s.stem * .45, 10, 4, -.6, 0, 7); ctx.fill() }
  ctx.strokeStyle = '#2E7A22'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-8, -8, 4, -12 + b * .5); ctx.stroke();
  ctx.fillStyle = '#4FB82E'; ctx.beginPath(); ctx.moveTo(-46, -22 + b); ctx.quadraticCurveTo(-30, -6 + b, 4, -12 + b); ctx.quadraticCurveTo(34, -16 + b, 48, -40 + b * .6); ctx.quadraticCurveTo(54, -52 + b * .4, 44, -54 + b * .4); ctx.quadraticCurveTo(38, -40 + b * .6, 22, -30 + b); ctx.quadraticCurveTo(-4, -26 + b, -26, -32 + b); ctx.quadraticCurveTo(-42, -36 + b, -46, -22 + b); ctx.closePath(); ctx.fill(); strokeOL(dark, 2.5);
  ctx.strokeStyle = '#8BE03A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-36, -26 + b); ctx.quadraticCurveTo(0, -20 + b, 38, -42 + b * .6); ctx.stroke();
  ctx.strokeStyle = '#2E7A22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(44, -48 + b * .4, 5, 0, 5); ctx.stroke();
  ctx.restore();
}
function drawEgg(x, y, s) { ctx.fillStyle = '#F2C88E'; ctx.beginPath(); ctx.ellipse(x, y, 9 * s, 11.5 * s, 0, 0, 7); ctx.fill(); strokeOL('#9A6A3A', 1.8); ctx.fillStyle = '#FFF0D8'; ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 4 * s, 3 * s, 4.5 * s, -.4, 0, 7); ctx.fill() }
function drawBall(x, y, rot, col, a, sq, face, eyes, mood, rad) {   // bóng mặt cười kiểu dễ thương · mood: 'happy' · 'cry' · 'ouch'
  const RR = rad || R, ol = '#4A2410'; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + (sq || 0) * RR * .25); ctx.scale(1 + (sq || 0) * .28, 1 - (sq || 0) * .28);
  ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(0, RR * 1.04, RR * .8, RR * .16, 0, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(-RR * .3, -RR * .35, RR * .2, 0, 0, RR); g.addColorStop(0, mix(col, '#ffffff', .28)); g.addColorStop(.7, col); g.addColorStop(1, mix(col, '#000000', .18));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, RR, 0, 7); ctx.fill();
  ctx.fillStyle = mix(col, '#000000', .16); ctx.beginPath(); ctx.arc(0, 0, RR, .15, Math.PI - .15); ctx.arc(0, -RR * .12, RR * .9, Math.PI - .2, .2, true); ctx.closePath(); ctx.fill();   // bóng tối nửa dưới
  ctx.strokeStyle = ol; ctx.lineWidth = Math.max(2.2, RR * .13); ctx.beginPath(); ctx.arc(0, 0, RR, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#FFFFFFdd'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, RR * .14); ctx.beginPath(); ctx.arc(0, 0, RR * .74, Math.PI * 1.12, Math.PI * 1.42); ctx.stroke();   // vệt sáng
  if (eyes) {
    const f = (face || 1) * RR * .12, m = mood || 'happy', ex = RR * .38, ey = -RR * .1, er = RR * .235;
    ctx.fillStyle = '#FF8AA8b0'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(f + d * RR * .56, RR * .2, RR * .17, RR * .11, 0, 0, 7); ctx.fill() }   // má hồng
    ctx.lineCap = 'round';
    if (m === 'cry') {
      ctx.strokeStyle = ol; ctx.lineWidth = Math.max(1.8, RR * .1); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(f + d * ex, ey - RR * .02, er * .85, Math.PI * .15, Math.PI * .85); ctx.stroke() }
      ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(f, RR * .38, RR * .16, RR * .12, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#7AC8FF'; for (const d of [-1, 1]) { const ty = RR * .08 + ((S.tick * 1.4) % (RR * .8)); ctx.beginPath(); ctx.ellipse(f + d * ex, ty, RR * .07, RR * .13, 0, 0, 7); ctx.fill() }
    } else {
      const big = m === 'ouch' ? 1.12 : 1, blink = m === 'happy' && S.tick % 220 < 7;
      for (const d of [-1, 1]) {
        const cx = f + d * ex;
        if (blink) { ctx.strokeStyle = ol; ctx.lineWidth = Math.max(1.8, RR * .09); ctx.beginPath(); ctx.moveTo(cx - er * .8, ey); ctx.lineTo(cx + er * .8, ey); ctx.stroke(); continue }
        ctx.fillStyle = '#3A1A08'; ctx.beginPath(); ctx.ellipse(cx, ey, er * big, er * 1.08 * big, 0, 0, 7); ctx.fill();   // mắt to tròn
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx - er * .32, ey - er * .38, er * .38, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx + er * .36, ey + er * .3, er * .17, 0, 7); ctx.fill();   // 2 chấm long lanh
      }
      ctx.strokeStyle = ol; ctx.lineWidth = Math.max(1.6, RR * .09);
      if (m === 'ouch') { ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(f, RR * .34, RR * .09, RR * .11, 0, 0, 7); ctx.fill() }
      else { ctx.beginPath(); ctx.arc(f, RR * .2, RR * .16, .35, Math.PI - .35); ctx.stroke() }   // miệng cười nhỏ
    }
  }
  ctx.restore();
}
function drawEnemy(e) {
  if (e.dead > 30) return; const x = e.x, f = e.f || 1; ctx.globalAlpha = e.dead ? 1 - e.dead / 30 : 1;
  if (DRAW2[e.k]) { if (!e.hid) { ctx.save(); ctx.translate(x, e.y - (e.hop || 0)); DRAW2[e.k](e, f); ctx.restore() } ctx.globalAlpha = 1; return }
  if (e.k === 'bee' || e.k === 'bat' || e.k === 'bird') {
    const y = e.y, w = Math.sin(S.tick * .6) * 6;
    if (e.k === 'bee') { ctx.fillStyle = '#FFFFFFcc'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 5, y - 9 - w * .5, 6, 9, d * .5, 0, 7); ctx.fill() } ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.ellipse(x, y, 14, 10, 0, 0, 7); ctx.fill(); strokeOL('#3A2A0A', 2); ctx.fillStyle = '#2A1E14'; ctx.fillRect(x - 5, y - 9, 4, 18); ctx.fillRect(x + 3, y - 9, 4, 18); circ(x + f * 9, y - 2, 2, '#1A1A1A') }
    else if (e.k === 'bat') { ctx.fillStyle = '#4A3A6A'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + d * 16, y - 14 - w, x + d * 24, y - 2 - w); ctx.lineTo(x + d * 14, y + 4); ctx.closePath(); ctx.fill() } circ(x, y, 9, '#3A2A5A'); circ(x - 3, y - 1, 2, '#FF4A4A'); circ(x + 3, y - 1, 2, '#FF4A4A') }
    else { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(x, y, 13, 9, 0, 0, 7); ctx.fill(); strokeOL('#5A6A84', 2); ctx.fillStyle = '#E8EEF6'; ctx.beginPath(); ctx.moveTo(x - 2, y - 2); ctx.quadraticCurveTo(x - 14, y - 16 - w, x - 22, y - 8 - w); ctx.quadraticCurveTo(x - 12, y + 2, x - 2, y + 3); ctx.fill(); ctx.fillStyle = '#FFA21E'; ctx.beginPath(); ctx.moveTo(x + f * 12, y - 2); ctx.lineTo(x + f * 20, y); ctx.lineTo(x + f * 12, y + 2); ctx.fill(); circ(x + f * 6, y - 3, 1.8, '#1A1A1A') }
  } else {
    const y = e.y, lg = Math.sin(S.tick * .4 + x * .1);
    if (e.k === 'crab') { ctx.strokeStyle = '#C83A2A'; ctx.lineWidth = 3; for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + d * 8, y - 8); ctx.lineTo(x + d * (14 + k * 3), y - 1 + Math.sin(S.tick * .5 + k) * 2); ctx.stroke() } ctx.fillStyle = '#FF6A4A'; ctx.beginPath(); ctx.ellipse(x, y - 10, 14, 9, 0, 0, 7); ctx.fill(); strokeOL('#6A1A0A', 2); for (const d of [-1, 1]) { circ(x + d * 15, y - 20, 5, '#FF6A4A') } circ(x - 4, y - 21, 3, '#fff'); circ(x + 4, y - 21, 3, '#fff'); circ(x - 4 + f, y - 21, 1.4, '#111'); circ(x + 4 + f, y - 21, 1.4, '#111') }
    else if (e.k === 'spiky') { ctx.fillStyle = '#5A4A6A'; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const a = Math.PI + i * Math.PI / 10, r = i % 2 ? 20 : 12; ctx.lineTo(x + Math.cos(a) * r, y - 3 + Math.sin(a) * r) } ctx.closePath(); ctx.fill(); strokeOL('#1A0A2A', 2); ctx.fillStyle = '#E8C8A0'; ctx.beginPath(); ctx.ellipse(x + f * 9, y - 6, 7, 6, 0, 0, 7); ctx.fill(); circ(x + f * 11, y - 8, 1.8, '#111') }
    else { const shell = THEMES[S.level].shell || '#3A7AD8'; ctx.strokeStyle = '#1A1A2A'; ctx.lineWidth = 2.5; for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 7, y - 6); ctx.lineTo(x + d * 9 + lg * 2, y); ctx.stroke() } ctx.fillStyle = shell; ctx.beginPath(); ctx.ellipse(x, y - 11, 15, 11, 0, Math.PI, 0); ctx.lineTo(x + 15, y - 7); ctx.lineTo(x - 15, y - 7); ctx.closePath(); ctx.fill(); strokeOL('#1A1A3A', 2); ctx.strokeStyle = mix(shell, '#000000', .35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 21); ctx.lineTo(x, y - 8); ctx.stroke(); ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.ellipse(x - 5, y - 16, 4, 2.5, -.4, 0, 7); ctx.fill(); circ(x + f * 15, y - 10, 6, '#2A2A3A'); circ(x + f * 17, y - 12, 2, '#fff') }
  }
  ctx.globalAlpha = 1;
}
const DRAW2 = {   // con vật phần 2 (vẽ quanh gốc 0,0 = chân / tâm)
  snail(e, f) { ctx.scale(f, 1); ctx.fillStyle = '#F2D88A'; ctx.beginPath(); ctx.ellipse(4, -5, 21, 6, 0, 0, 7); ctx.fill(); strokeOL('#8A6A2A', 1.8); ctx.beginPath(); ctx.ellipse(19, -11, 6, 9, .3, 0, 7); ctx.fill(); strokeOL('#8A6A2A', 1.8); ctx.strokeStyle = '#8A6A2A'; ctx.lineWidth = 2; for (const [a, b] of [[20, -27], [27, -24]]) { ctx.beginPath(); ctx.moveTo(19, -17); ctx.lineTo(a, b); ctx.stroke(); circ(a, b, 2.6, '#3A2A0A') }
    const sh = THEMES[S.level].shell || '#E89A3A'; circ(-3, -17, 13, sh); strokeOL('#6A3A10', 2); ctx.strokeStyle = mix(sh, '#000000', .35); ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < 12; a += .3) { const rr2 = 11 - a * .85; ctx.lineTo(-3 + Math.cos(a) * rr2, -17 + Math.sin(a) * rr2) } ctx.stroke() },
  frog(e, f) { ctx.scale(f, 1); ctx.fillStyle = '#4AA83A'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 11, -4, 8, 5, 0, 0, 7); ctx.fill() } ctx.fillStyle = '#5AC23A'; ctx.beginPath(); ctx.ellipse(0, -11, 16, 11, 0, 0, 7); ctx.fill(); strokeOL('#1E5A1A', 2); ctx.fillStyle = '#E8F0A0'; ctx.beginPath(); ctx.ellipse(3, -7, 9, 5, 0, 0, 7); ctx.fill(); for (const d of [-1, 1]) { circ(4 + d * 7, -21, 5.5, '#5AC23A'); circ(4 + d * 7, -21, 3.6, '#fff'); circ(5 + d * 7, -21, 1.8, '#111') } ctx.strokeStyle = '#1E5A1A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(6, -12, 6, .2, 1.4); ctx.stroke() },
  dfly(e, f) { ctx.scale(f, 1); const w = Math.sin(S.tick * .9) * 5; ctx.fillStyle = '#DFF4FFaa'; for (const [ox, d] of [[-2, -1], [4, -1], [-2, 1], [4, 1]]) { ctx.beginPath(); ctx.ellipse(ox, d * (7 + w * .4), 12, 4, d * (ox < 0 ? -.35 : .35), 0, 7); ctx.fill() } ctx.strokeStyle = '#2A6AC8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(10, 0); ctx.stroke(); ctx.strokeStyle = '#7AD8FF'; ctx.lineWidth = 1.5; for (let x2 = -20; x2 < 8; x2 += 6) { ctx.beginPath(); ctx.moveTo(x2, -2); ctx.lineTo(x2, 2); ctx.stroke() } circ(14, 0, 6, '#3A8AE8'); circ(16, -2, 2.4, '#fff'); circ(16.5, -2, 1.2, '#111') },
  fish(e, f) { ctx.scale(f, 1); const c = e.c || '#FFB070', tw = Math.sin(S.tick * .3 + e.ph) * 4; ctx.fillStyle = mix(c, '#000000', .15); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-24, -9 + tw); ctx.lineTo(-24, 9 + tw); ctx.closePath(); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, 7); ctx.fill(); strokeOL(mix(c, '#000000', .45), 2); ctx.strokeStyle = '#FFFFFFaa'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-2, 8); ctx.stroke(); circ(8, -2, 3.4, '#fff'); circ(9, -2, 1.8, '#111'); ctx.fillStyle = mix(c, '#ffffff', .3); ctx.beginPath(); ctx.ellipse(-2, -10, 6, 3, -.4, 0, 7); ctx.fill() },
  leap(e, f) { ctx.rotate(f * (e.u - .5) * 2.2); DRAW2.fish({ c: '#FF8A4A', ph: 0 }, f); },
  jelly(e) { const p2 = Math.sin(S.tick * .12 + e.ph) * 2; ctx.strokeStyle = '#FFB0E0cc'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5, 2); for (let t = 1; t <= 4; t++) ctx.lineTo(i * 5 + Math.sin(S.tick * .1 + t + i) * 3, 2 + t * 6); ctx.stroke() } const g = ctx.createRadialGradient(-4, -8, 2, 0, -4, 18); g.addColorStop(0, '#FFE8F8'); g.addColorStop(1, '#FF8AD0cc'); ctx.fillStyle = g; ctx.shadowColor = '#FF9AD8'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.ellipse(0, 2, 16 + p2, 16 - p2, 0, Math.PI, 0); ctx.quadraticCurveTo(8, 6, 0, 3); ctx.quadraticCurveTo(-8, 6, -16 - p2, 2); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; strokeOL('#C84A98', 1.6); circ(-5, -4, 1.8, '#5A1A4A'); circ(5, -4, 1.8, '#5A1A4A') },
  urchin(e) { ctx.strokeStyle = '#2A1A3A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + S.tick * .01, L = 19 + Math.sin(S.tick * .1 + i) * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, -12 + Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * L, -12 + Math.sin(a) * L); ctx.stroke() } circ(0, -12, 11, '#4A2A5A'); strokeOL('#1A0A2A', 2); circ(-4, -14, 2.4, '#fff'); circ(4, -14, 2.4, '#fff'); circ(-4, -14, 1.1, '#111'); circ(4, -14, 1.1, '#111') }
};
function drawBoss() {   // ếch khổng lồ Hypnotoad: mắt vòng thôi miên xoay màu
  const b = BOSS; if (!b || b.dead > 90) return; const wait = [100, 80, 62][3 - b.hp] || 62, sq = b.air ? -.1 : b.t > wait - 16 ? .12 : 0;
  ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(b.x, groundY(b.x) || b.y, 54, 9, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(b.x, b.y - 38); if (b.dead) { ctx.globalAlpha = Math.max(0, 1 - b.dead / 90); ctx.rotate(Math.min(Math.PI, b.dead * .07)) } ctx.scale(1 + sq * .5, 1 - sq);
  const fl = b.hurt && (b.hurt >> 2) & 1, body = fl ? '#FFFFFF' : '#7AB83A', ol = '#24400E';
  ctx.fillStyle = fl ? '#FFFFFF' : '#5A9A2A'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 46, 24, 24, 15, d * .3, 0, 7); ctx.fill(); strokeOL(ol, 2.5) }
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, 58, 40, 0, 0, 7); ctx.fill(); strokeOL(ol, 3);
  ctx.fillStyle = fl ? '#FFFFFF' : '#E8E8A0'; ctx.beginPath(); ctx.ellipse(0, 14, 36, 22, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fl ? '#FFFFFF' : '#5A9A2A'; for (const [wx, wy, wr] of [[-36, -10, 5], [30, -16, 4], [-18, -24, 3.5], [40, 4, 4]]) { ctx.beginPath(); ctx.arc(wx, wy, wr, 0, 7); ctx.fill() }
  for (const d of [-1, 1]) { ctx.fillStyle = body; ctx.beginPath(); ctx.arc(d * 24, -32, 20, 0, 7); ctx.fill(); strokeOL(ol, 3); for (let i = 0; i < 5; i++) { circ(d * 24, -32, 15 - i * 2.8, HC[(i + (S.tick >> 3)) % 5]) } circ(d * 24, -32, 2.5, '#1A1A2A') }
  ctx.strokeStyle = ol; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-36, 2); ctx.quadraticCurveTo(0, 20, 36, 2); ctx.stroke();
  ctx.fillStyle = fl ? '#FFFFFF' : '#4A8A2A'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 22, 38, 12, 6, 0, 0, 7); ctx.fill(); strokeOL(ol, 2) }
  ctx.restore();
  for (const w of WAVES) for (let i = 0; i < 4; i++) { ctx.strokeStyle = HC[(i + (S.tick >> 2)) % 5]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w.x, w.y, 5 + i * 4, 8 + i * 5, 0, 0, 7); ctx.stroke() }
}
function drawGate() {   // cổng tre chắn đường tới đích — nâng lên khi hạ trùm
  if (!GATE) return; const op = BOSS && BOSS.dead ? Math.min(240, BOSS.dead * 3) : 0; if (op >= 240) return;
  for (let i = 0; i < 3; i++) { const gx = GATE.x - 14 + i * 12; ctx.fillStyle = '#9A8A3A'; rr(gx - 5, GATE.y - 200 - op, 10, 200, 4); ctx.fill(); strokeOL('#3A3A0A', 2); ctx.strokeStyle = '#6A5A1A'; ctx.lineWidth = 1.5; for (let yy = GATE.y - 180 - op; yy < GATE.y - op; yy += 34) { ctx.beginPath(); ctx.moveTo(gx - 5, yy); ctx.lineTo(gx + 5, yy); ctx.stroke() } }
  ctx.fillStyle = '#5AB82A'; for (const [ox, oy] of [[-18, -150], [16, -110], [-16, -60]]) { ctx.beginPath(); ctx.ellipse(GATE.x + ox, GATE.y + oy - op, 10, 4, ox < 0 ? -.5 : .5, 0, 7); ctx.fill() }
}
function drawItem(it) {
  const y = it.y + Math.sin(S.tick * .07 + it.x) * 5, col = it.k === 'heart' ? '#FF5A7A' : it.k === 'bat' ? '#3FCF86' : PWC[it.k], R2 = 16;
  const gl = ctx.createRadialGradient(it.x, y, 3, it.x, y, R2 * 1.9); gl.addColorStop(0, '#FFFFFFdd'); gl.addColorStop(1, col + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(it.x, y, R2 * 1.9, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFFFFFee'; ctx.beginPath(); ctx.arc(it.x, y, R2, 0, 7); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.font = '19px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.k === 'heart' ? '❤️' : it.k === 'bat' ? '🔋' : PWI[it.k], it.x, y + 1); ctx.textBaseline = 'alphabetic';
}
function drawWorld(T) {
  drawPits(T); drawWalls(T); drawDeco(T); drawGround(T); drawCeil(T); drawSpk(); drawPlats(T); drawGate();
  for (const s of SPR) { if (s.kind === 'leaf') { drawLeaf(s); continue } const b = s.sq ? 6 : 0; ctx.fillStyle = '#FFF0E0'; rr(s.x - 8, s.y - 18 + b, 16, 18 - b, 5); ctx.fill(); strokeOL('#6A3A2A', 2); ctx.fillStyle = '#E8303A'; ctx.beginPath(); ctx.ellipse(s.x, s.y - 18 + b, 26, 14 - b / 2, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL('#6A1A1A', 2.5); for (const [dx, dy] of [[-12, -24], [3, -29], [14, -21]]) circ(s.x + dx, s.y + dy + b, 3.5, '#fff') }
  for (const f of FLAGS) { ctx.fillStyle = '#6A4424'; ctx.fillRect(f.x - 2, f.y - 80, 5, 80); circ(f.x + .5, f.y - 82, 5, '#FFD23F'); ctx.fillStyle = f.got ? '#3FBF86' : '#FF5A7A'; ctx.beginPath(); ctx.moveTo(f.x + 3, f.y - 80); ctx.quadraticCurveTo(f.x + 22, f.y - 74 + Math.sin(S.tick * .12) * 3, f.x + 40, f.y - 68); ctx.quadraticCurveTo(f.x + 22, f.y - 62, f.x + 3, f.y - 56); ctx.closePath(); ctx.fill(); strokeOL('#3A1A0A', 2) }
  { const gy = VERT ? EXITY : groundY(EXITX) || 0, last = S.level === NL - 1; ctx.fillStyle = last ? '#E8B030' : '#8A5A2E'; rr(EXITX - 50, gy - 140, 14, 140, 4); ctx.fill(); strokeOL('#3A2A0A', 2.5); rr(EXITX + 36, gy - 140, 14, 140, 4); ctx.fill(); strokeOL('#3A2A0A', 2.5); rr(EXITX - 58, gy - 156, 116, 22, 6); ctx.fill(); strokeOL('#3A2A0A', 2.5);
    const g = ctx.createRadialGradient(EXITX, gy - 70, 5, EXITX, gy - 70, 70); g.addColorStop(0, '#FFFFFFdd'); g.addColorStop(1, '#FFE08A22'); ctx.fillStyle = g; ctx.fillRect(EXITX - 36, gy - 134, 72, 134); label(last ? '👑 ĐÍCH' : '🏁 ĐÍCH', EXITX, gy - 140, 14, '#FFF6C8', '#4A2A0A') }
  for (const b of BOX) { if (b.x < cam.x - 50 || b.x > cam.x + vw + 50) continue; const oy = b.bump ? -Math.sin(b.bump / 10 * Math.PI) * 8 : 0, x = b.x, y = b.y + oy;
    ctx.fillStyle = b.used ? '#A87A50' : '#FFB21E'; rr(x, y, b.w, b.h, 5); ctx.fill(); strokeOL('#6A3A10', 2.5); ctx.fillStyle = b.used ? '#8A5A30' : '#FFD86A'; ctx.fillRect(x + 3, y + 3, b.w - 6, 4);
    for (const [cx, cy] of [[5, 5], [b.w - 5, 5], [5, b.h - 5], [b.w - 5, b.h - 5]]) circ(x + cx, y + cy, 1.8, '#6A3A10');
    if (!b.used) label('?', x + b.w / 2, y + b.h / 2 + 8, 22, '#FFFFFF', '#B85A00') }
  for (const m of MYS) { if (m.got || m.x < cam.x - 40 || m.x > cam.x + vw + 40) continue; const y = m.y + Math.sin(S.tick * .08 + m.x) * 5, sq2 = Math.abs(Math.cos(S.tick * .06)), gl2 = ctx.createRadialGradient(m.x, y, 2, m.x, y, 34); gl2.addColorStop(0, '#FFF6C0'); gl2.addColorStop(1, '#FFD23F00'); ctx.fillStyle = gl2; ctx.beginPath(); ctx.arc(m.x, y, 34, 0, 7); ctx.fill();
    ctx.fillStyle = '#E8A010'; ctx.beginPath(); ctx.ellipse(m.x, y, 17 * sq2 + 1, 17, 0, 0, 7); ctx.fill(); strokeOL('#8A5A08', 2.5); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.ellipse(m.x, y, 12 * sq2 + .5, 12, 0, 0, 7); ctx.fill(); if (sq2 > .45) label('?', m.x, y + 7, 18, '#FFFFFF', '#B8780C') }
  for (const g of EGGS) if (!g.got && g.x > cam.x - 30 && g.x < cam.x + vw + 30) drawEgg(g.x, g.y + Math.sin(S.tick * .06 + g.x) * 2, 1);
  for (const it of ITEMS) if (!it.got && it.x > cam.x - 40 && it.x < cam.x + vw + 40) drawItem(it);
  for (const e of ENEM) if ((e.x || e.bx) > cam.x - 60 && (e.x || e.bx) < cam.x + vw + 60) drawEnemy(e);
  drawBoss();
}
function draw() {
  if (!POLY.length) return; const T = THEMES[S.level];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawBg(T);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -cam.x * sc * dpr, -cam.y * sc * dpr);
  drawWorld(T);
  const wk = WKP() + S.level;
  for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== wk || g.tx == null) continue; g.rx = g.rx == null ? g.tx : g.rx + (g.tx - g.rx) * .2; g.ry = g.ry == null ? g.ty : g.ry + (g.ty - g.ry) * .2; drawBall(g.rx, g.ry, g.rx / 16, g.c || '#5AB0FF', .55, 0, 1, true, 'happy', 16); label(g.n || '?', g.rx, g.ry - R - 8, 12, '#fff') }
  { const mood = phase === 'dead' || pl.sad ? 'cry' : pl.inv > 70 ? 'ouch' : 'happy', gl = GROW[pl.lvl];
    if (pl.lvl >= GROW.length - 2) { ctx.globalAlpha = .3 + .2 * Math.sin(S.tick * .2); ctx.fillStyle = growCol(pl.lvl); ctx.beginPath(); ctx.arc(pl.x, pl.y, R + 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1; if (S.tick % 6 === 0) puff(pl.x + (Math.random() - .5) * R * 2, pl.y - R, 1, [growCol(pl.lvl), '#FFFFFF'], 1) }
    if (pl.grow && (pl.grow >> 2) & 1) { ctx.globalAlpha = .6; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x, pl.y, R + 10 - pl.grow * .2, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 }
    drawBall(pl.x, pl.y, pl.rot, growCol(pl.lvl), phase !== 'dead' && pl.inv && (S.tick >> 2) & 1 ? .45 : 1, pl.sq, pl.face, true, mood, R); }
  if (phase !== 'dead') { if (PW.star) { ctx.globalAlpha = .5 + .3 * Math.sin(S.tick * .3); ctx.strokeStyle = '#FFE24A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x, pl.y, R + 6, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 } if (PW.bal) { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pl.x, pl.y - R); ctx.lineTo(pl.x + 4, pl.y - R - 34); ctx.stroke(); ctx.fillStyle = '#FF7EB6'; ctx.beginPath(); ctx.ellipse(pl.x + 4, pl.y - R - 48, 13, 16, 0, 0, 7); ctx.fill(); strokeOL('#B83A6A', 2) } }
  if (S.name && phase !== 'dead') label(S.name, pl.x, pl.y - R - (PW.bal ? 70 : 10), 13, '#fff');
  for (const q of parts) { ctx.globalAlpha = Math.min(1, q.l / 30); circ(q.x, q.y, q.r, q.c) } ctx.globalAlpha = 1;
  drawTimers();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); hud(T);
}
function drawTimers() {   // đồng hồ vật phẩm ngay cạnh bóng
  const L = Object.keys(PW).filter(k => PW[k] > 0), Rr = 13;
  L.forEach((k, i) => {
    const t = PW[k], cx = pl.x - 44, cy = pl.y - 20 + i * 30, col = PWC[k];
    ctx.fillStyle = '#1A1033cc'; ctx.beginPath(); ctx.arc(cx, cy, Rr + 3, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 7); ctx.stroke();
    ctx.strokeStyle = t < 120 && (S.tick >> 3) & 1 ? '#FFFFFF' : col; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(cx, cy, Rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t / PWF[k]); ctx.stroke();
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(PWI[k], cx, cy + 1); ctx.textBaseline = 'alphabetic'; label(Math.ceil(t / 60) + 's', cx - 28, cy + 5, 13, t < 120 ? '#FF8A9A' : '#FFFFFF');
  });
}
const mmss = f => { const s2 = Math.floor(f / 60); return Math.floor(s2 / 60) + ':' + String(s2 % 60).padStart(2, '0') };
function hud(T) {
  // trứng (góc trái) · giờ màn (góc phải) — giống bản gốc
  ctx.fillStyle = '#00000033'; rr(10, 10, 118, 34, 17); ctx.fill(); drawEgg(30, 27, 1.05);
  ctx.font = '900 19px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#1A2A1A'; const et = eggGot + '/' + eggTot; ctx.strokeText(et, 46, 28); ctx.fillStyle = '#FFFFFF'; ctx.fillText(et, 46, 28);
  ctx.fillStyle = '#00000033'; rr(cw - 118, 10, 108, 34, 17); ctx.fill(); ctx.textAlign = 'right'; const tt = mmss(tLevel); ctx.strokeText(tt, cw - 50, 28); ctx.fillStyle = '#FFFFFF'; ctx.fillText(tt, cw - 50, 28);
  circ(cw - 30, 27, 12, '#FFFFFF'); ctx.strokeStyle = '#2A3A5A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cw - 30, 27, 12, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cw - 30, 27); ctx.lineTo(cw - 30 + Math.cos(tLevel / 60 * Math.PI / 30 - Math.PI / 2) * 9, 27 + Math.sin(tLevel / 60 * Math.PI / 30 - Math.PI / 2) * 9); ctx.moveTo(cw - 30, 27); ctx.lineTo(cw - 30, 20); ctx.stroke();
  ctx.textAlign = 'left'; ctx.font = '800 14px Nunito,sans-serif'; ctx.fillStyle = '#00000033'; rr(10, 50, 196, 26, 13); ctx.fill(); ctx.lineWidth = 3; const lt = '❤️×' + S.lives + '  ' + T.ic + ' Màn ' + (S.level + 1) + '/' + NL; ctx.strokeText(lt, 20, 63); ctx.fillStyle = '#FFF'; ctx.fillText(lt, 20, 63); ctx.textBaseline = 'alphabetic';
  // thanh tiến độ tới đích
  const pw = Math.min(cw - 280, 380), px = (cw - pw) / 2; if (pw > 80) { ctx.fillStyle = '#00000044'; rr(px - 4, 20, pw + 8, 14, 7); ctx.fill(); ctx.fillStyle = '#ffffff55'; ctx.fillRect(px, 25, pw, 4); ctx.fillStyle = '#FFD23F'; ctx.fillRect(px, 25, pw * frac(), 4);
    for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== WKP() + S.level || g.tx == null) continue; circ(px + pw * (VERT ? clamp(-g.ty / -EXITY, 0, 1) : clamp(g.tx / EXITX, 0, 1)), 27, 4, g.c || '#fff') }
    circ(px + pw * frac(), 27, 6, '#E8202A'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + pw * frac(), 27, 6, 0, 7); ctx.stroke() }
  if (BOSS && BOSS.act && !BOSS.dead) label('🐸 HYPNOTOAD  ' + '❤️'.repeat(BOSS.hp) + '🖤'.repeat(3 - BOSS.hp), cw / 2, 60, 17, '#D8FF8A', '#1A2A0A');
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); label(banner.text, cw / 2, ch * .3, 24, '#FFE58A'); ctx.globalAlpha = 1 }
  if (phase === 'clear' || phase === 'won') label(S.level >= NL - 1 ? '👑 PHÁ ĐẢO BOUNCE TALES' + (PART === 2 ? ' P2' : '') + '!' : '🏁 QUA MÀN! 🥚 ' + eggGot + '/' + eggTot + ' · ⏱ ' + mmss(tLevel), cw / 2, ch * .36, 24, '#5CFF8A');
  if (S.energy <= 0 && S.running && !S.over && phase === 'play') label('⚡ HẾT SỨC — trả lời câu hỏi để lăn tiếp!', cw / 2, ch * .5, 16, '#FFE08A');
}
function camera(k) {
  const tx = VERT ? (vw >= SHAFT[1] + 120 ? SHAFT[1] / 2 - vw / 2 : clamp(pl.x - vw / 2, -60, SHAFT[1] + 60 - vw)) : clamp(pl.x - vw * .38, -500, EXITX + 400 - vw); let ty = VERT ? Math.min(pl.y - vh * .62, 120 - vh) : pl.y - vh * .58;
  if (CEIL[0]) { const g = groundY(pl.x); if (g != null) { const mid = (g + gyAt(CEIL[0], pl.x)) / 2; ty = mid + (pl.y - mid) * .35 - vh / 2 } }   // dưới nước: thấy cả trần lẫn đáy
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k * .5;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / 430, cw / 520); const pad = document.getElementById('pad'); if (pad && pad.classList.contains('on') && cw / ch < 1.02) sc = Math.min(sc, (ch - 150) / 430); vw = cw / sc; vh = ch / sc }
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else acc = 0;
  camera(.08); draw(); S.hooks.onFrame && S.hooks.onFrame(ts); requestAnimationFrame(loop);
}
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j' };
function bindInput() {
  addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return; const k = KM[e.key]; if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1 } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk() });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = 0 });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j']].forEach(([id, k]) => { const b = document.getElementById(id); if (!b) return; b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1; b.classList.add('dn') }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') })); b.addEventListener('contextmenu', e => e.preventDefault()) });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  GC.music.files({ ov: { src: 'snd/bounce-overworld.mp3' }, ci: { src: 'snd/bounce-circus.mp3' }, mi: { src: 'snd/bounce-mines.mp3' }, bn: { src: 'snd/bounce-bonus.mp3' }, bs: { src: 'snd/bounce-boss.mp3' } }, 'bounce');   // nhạc gốc Bounce Tales theo từng màn
  GC.sfxFiles({ bdeath: { src: 'snd/bounce-death.mp3', vol: .7 } });
  addEventListener('resize', resize); resize(); loadLevel(0); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.j = 0 }
function place(x, y, old) { const li = old && old.lvl != null ? old.lvl : 0; S.lives = old && old.lf || LIVES; S.coins = old && old.cn || 0; if (li !== S.level) loadLevel(li) }
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Màn ' + (S.level + 1) + '/' + NL + ' · 🥚 ' + eggGot + '/' + eggTot;
function extra() { return { lvl: S.level, wk: WKP() + (S.won ? NL : S.level), lb: label2(), lf: S.lives, cn: S.coins } }
function hudTxt() { return (S.won ? '🏆 Phá đảo' : '🔴 ' + (PART === 2 ? 'P2 · ' : '') + 'Màn ' + (S.level + 1) + '/' + NL) + ' · 🥚 ' + S.coins }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud: hudTxt, label: label2, W: 1000, kind: 'bounce', setPart, get NL() { return NL }, get part() { return PART },
  _dbg: { ball: (...a) => drawBall(...a), GROW, setGrow, step, draw, loadLevel, cam: camera, BOX: () => BOX, MYS: () => MYS, give: k => { PW[k] = PWF[k] }, st: () => ({ DECO, PW, pl: { ...pl }, phase, EXITX, LEN, eggTot, eggGot, PITS, PLATS, ENEM, SPR, THORN, FLAGS, POLY, SPK, CEIL, BOSS, WAVES, GATE, R }), groundY, setPhase: v => { phase = v } },
  get winTitle() { return PART === 2 ? '🏆 Phá đảo Bounce Tales P2 — hạ được trùm Hypnotoad!' : '🏆 Phá đảo Bounce Tales — vượt qua cả 6 màn!' },
  get winToast() { return PART === 2 ? '🏆 PHÁ ĐẢO P2! Quả bóng đã lặn đáy biển và hạ gục ếch Hypnotoad!' : '🏆 PHÁ ĐẢO! Quả bóng đỏ đã lăn qua cả 6 vùng đất!' } };
})();
