/* snow.js — game "❄️ Đêm Tuyết Sinh Tồn" (lối chơi đuổi bắt sinh tồn kiểu Snowy Survival, vẽ lại & thêm nhiều thứ mới · mã game: snow).
   Nhìn từ trên xuống, đi tự do mọi hướng trên bản đồ tuyết 6 khu: 🌲 Rừng Thông · 🎄 Đồi Giáng Sinh · 🏘 Làng Lều Tuyết · 🧊 Hồ Băng (trơn trượt) · 💎 Hang Pha Lê · 🛷 Trại Xe Trượt.
   2 phe: 🧑 NGƯỜI SỐNG SÓT (máu + khăn len) ném ❄️ bóng tuyết đóng băng xác ướp · 🧟 XÁC ƯỚP BĂNG (bị yểm) chạm để hút máu và bắn 🔮 cầu lời nguyền (mất máu + chậm lại).
   Hết máu = bị yểm thành xác ướp. KHÔNG có giải lời nguyền (bỏ từ 12/11): ai thành xác ướp thì làm xác ướp tới hết trận.
   Phòng chơi chung (bản 12/11): 🔮 cầu lời nguyền RẤT MẠNH — mất 50 máu (×hệ số đơn độc) → 2–3 phát là bị yểm; xác ướp chạm / đi xuyên qua người: mất 40.
   Xác ướp có 100 máu — trúng bóng tuyết chỉ mất 10 (chia hệ số đơn độc), hết máu thì ĐÓNG BĂNG tại chỗ 2,5 giây rồi đầy máu lại (người ném hạ được +5⭐).
   XÁC ƯỚP GỐC (trang cô chọn lúc đầu) và bạn bị yểm giữa trận đều làm xác ướp tới hết trận.
   ĐI LẠI cũng tốn ⚡ (1⚡ / 1/3 giây, cả hai phe) — hết ⚡ là đứng im, phải trả lời câu hỏi.
   Kịch tính: 💓 viền đỏ đập khi xác ướp tới gần · 🔥 NGƯỜI CUỐI CÙNG (ném 3 tia, chạy nhanh, điểm sống sót ×3) · 😈 CUỒNG NỘ (yểm được 1 bạn → chạy nhanh 4 giây) · 🌨 bão tuyết thổi lệch bóng tuyết & cầu.
   Cân bằng: xác ướp chạy nhanh hơn người; xác ướp càng ít so với người càng mạnh (chạy nhanh, đánh đau, chịu đòn tốt — tối đa ×1,6).
   Kết thúc: cả lớp bị yểm → xác ướp thắng (trang cô tự kết thúc phòng) · hết giờ → ai còn là người thắng, +15⭐.
   Ngày → đêm theo giờ chung: đêm tối, chỉ còn ánh sáng quanh nhân vật / lửa trại / đèn lồng, có cực quang, xác ướp nhanh hơn. 🌨 Bão tuyết thổi bất chợt (báo trước).
   🔥 Lửa trại hồi máu cho người, làm xác ướp chậm lại. Quà trên tuyết (mọi máy thấy giống nhau): ☕ ca cao · 🧣 khăn len · ❄️ bão 3 tia · 👢 giày trượt · 🔥 đuốc xua xác ướp · 🔋 pin.
   ⚡ là sức: ném tuyết, bắn cầu VÀ đi lại đều tốn ⚡ — hết ⚡ phải trả lời câu hỏi; lúc trả lời nhân vật mờ đi 📝, không ai chạm / ném trúng được (nhưng không được tính điểm sống sót).
   Điểm ⭐: sống sót +1 mỗi 5 giây · đóng băng xác ướp +2 · xác ướp chạm trúng +1, yểm được 1 bạn +8 · giải lời nguyền +5.
   Mạng: vị trí, bóng tuyết đi kênh nhanh net.fast; máy bị chạm / bị ném tự tính (máu, đóng băng, bị yểm) rồi báo cho cả phòng.
   Vai lúc bắt đầu: trang cô chọn ngẫu nhiên ~1/5 lớp làm xác ướp (info.cu), phòng 2 bạn cũng có 1 xác ướp.
   Chơi một mình (bài về nhà / chơi thử / phòng 1 bạn): ĐẤU BOT ngang vũ khí — bot xác ướp có máu, bóng tuyết trúng là mất máu, hết máu là tan biến (+5⭐);
   3 đợt, mỗi đợt thêm 1 bot; hạ hết đợt 3 là em thắng. Em hết máu không bị yểm mà bị hạ 2 giây rồi đứng dậy ở làng (−3⭐). Nhạc nền: snd/snow-bgm.mp3 (cô Chí Nên chọn). Cùng giao diện: init · S · pl · alt() · … · kind = 'snow' */
window.Snow = (function () {
const { clamp, rng } = GC;
const W = 3600, H = 2600, BR = 26, SB = 13, SBL = 50, FRZ = 96, INV = 120, O = '#1D2340';
const LVS = { 1: { cs: 6, cd: 8, cur: 1, sur: 0, bs: .82, aim: .45, react: 22 }, 2: { cs: 7, cd: 9, cur: 2, sur: 0, bs: .92, aim: .6, react: 16 }, 3: { cs: 8, cd: 10, cur: 3, sur: 0, bs: 1.02, aim: .75, react: 10 } };   // cs / cd: ⚡ mỗi lần ném tuyết / bắn cầu lời nguyền · cur: số bot xác ướp (bot chỉ làm xác ướp, không có bot người) · bs: tốc độ bot
const AREAS = [
  { k: 'forest', name: '🌲 Rừng Thông', x: 0, y: 0, w: 1300, h: 1350, sx: 650, sy: 610 },
  { k: 'xmas', name: '🎄 Đồi Giáng Sinh', x: 1300, y: 0, w: 1150, h: 700, sx: 1870, sy: 560 },
  { k: 'lake', name: '🧊 Hồ Băng', x: 2450, y: 0, w: 1150, h: 1500, sx: 3000, sy: 1260 },
  { k: 'village', name: '🏘 Làng Lều Tuyết', x: 1300, y: 700, w: 1150, h: 1100, sx: 1870, sy: 1700 },
  { k: 'cave', name: '💎 Hang Pha Lê', x: 2450, y: 1500, w: 1150, h: 1100, sx: 3020, sy: 1580 },
  { k: 'camp', name: '🛷 Trại Xe Trượt', x: 0, y: 1350, w: 1300, h: 1250, sx: 650, sy: 1430 }];
const LAKE = { cx: 3010, cy: 740, rx: 470, ry: 420 }, CAVE = [[2470, 1720], [2700, 1560], [3200, 1600], [3580, 1800], [3560, 2560], [2520, 2560]];
const FIRES = [{ x: 650, y: 820 }, { x: 1870, y: 1250 }, { x: 640, y: 2060 }, { x: 3020, y: 2080 }];
const ITEMS = [
  { k: 'coco', ic: '☕', name: 'Ca cao nóng', wt: 18, col: '#E8A870', txt: '+40 máu', sur: 1 },
  { k: 'scarf', ic: '🧣', name: 'Khăn len', wt: 16, col: '#FF8FB0', txt: '+50 khăn (chặn chạm)', sur: 1 },
  { k: 'tri', ic: '❄️', name: 'Bão tuyết 3 tia', wt: 13, col: '#9EE3FF', txt: 'Ném 3 bóng tuyết 10 giây', sur: 1 },
  { k: 'boot', ic: '👢', name: 'Giày trượt', wt: 14, col: '#C9B6FF', txt: 'Chạy nhanh gấp rưỡi 10 giây' },
  { k: 'torch', ic: '🔥', name: 'Đuốc lửa', wt: 11, col: '#FFB36B', txt: 'Xua xác ướp ra xa 6 giây', sur: 1 },
  { k: 'bat', ic: '🔋', name: 'Pin năng lượng', wt: 20, col: '#7CF29A', txt: '+40 ⚡' },
  { k: 'life', ic: '💗', name: 'Trái tim tuyết', wt: 8, col: '#FF8FB8', txt: '+1 mạng', sur: 1 }];   // đấu bot: +1 mạng · phòng chơi chung: +30 máu
const SLOT = 4500, ILIFE = 24000, DAY = 240, BSLOT = 75000, BLEN = 9000, GRACE = 6000;   // GRACE: 6 giây đầu ván xác ướp chưa thức dậy
/* ═════ bản đồ: vật cản sinh cố định (mọi máy giống nhau) ═════ */
const OBS = [], DECO = [];
(function buildMap() {
  const r = rng(777), clear = (x, y, m) => FIRES.every(f => Math.hypot(f.x - x, f.y - y) > 170) && OBS.every(o => Math.hypot(o.x - x, o.y - y) > o.r + m) && AREAS.every(a => Math.hypot(a.sx - x, a.sy - y) > 110) && !inLake(x, y, 1.08) && x > 70 && x < W - 70 && y > 70 && y < H - 70;
  const add = (o) => OBS.push(o), scatter = (n, A, k, r0, r1, m) => { for (let t = 0, c = 0; t < n * 30 && c < n; t++) { const x = A.x + 60 + r() * (A.w - 120), y = A.y + 60 + r() * (A.h - 120), rr0 = r0 + r() * (r1 - r0); if (clear(x, y, rr0 + m) && !onPath(x, y)) { add({ x, y, r: rr0, k }); c++ } } };
  add({ x: 1870, y: 300, r: 74, k: 'bigtree' });
  [[1620, 380], [2120, 380], [1700, 470], [2040, 470], [1870, 470]].forEach(([x, y], i) => add({ x, y, r: 22, k: 'gift', c: ['#FF5C7A', '#4CC3FF', '#7CDB6E', '#C79BFF', '#FFD84C'][i] }));
  [[1500, 900], [2250, 900], [1500, 1560], [2250, 1560]].forEach(([x, y]) => add({ x, y, r: 74, k: 'igloo' }));
  [[1690, 1060], [2060, 1440], [1450, 1250]].forEach(([x, y], i) => add({ x, y, r: 24, k: 'snowman', c: ['#FF5C7A', '#4CC3FF', '#7CDB6E'][i] }));
  [[1660, 1250], [2080, 1250], [1870, 1050], [1870, 1450]].forEach(([x, y]) => add({ x, y, r: 10, k: 'lantern' }));
  add({ x: 420, y: 1760, r: 96, k: 'cabin' }); add({ x: 930, y: 2150, r: 46, k: 'sleigh' }); add({ x: 1080, y: 1760, r: 46, k: 'sleigh', f: -1 });
  [[300, 2250], [520, 2380], [1050, 2420]].forEach(([x, y]) => add({ x, y, r: 26, k: 'log' }));
  for (let i = 0; i < 7; i++) add({ x: 120 + i * 60, y: 2480, r: 10, k: 'fence' });
  for (let i = 0; i < 16; i++) { for (let t = 0; t < 40; t++) { const x = 2520 + r() * 1040, y = 1780 + r() * 760; if (inCave(x, y) && clear(x, y, 70)) { add({ x, y, r: 28 + r() * 16, k: 'crystal', c: ['#B79CFF', '#8FE3FF', '#FF9EE5'][i % 3] }); break } } }
  scatter(40, AREAS[0], 'pine', 30, 40, 70); scatter(10, AREAS[5], 'pine', 30, 38, 80); scatter(9, AREAS[1], 'pine', 26, 34, 90); scatter(8, AREAS[2], 'pine', 30, 38, 80); scatter(6, AREAS[3], 'pine', 28, 34, 110);
  scatter(8, AREAS[0], 'rock', 22, 30, 60); scatter(5, AREAS[5], 'rock', 22, 28, 70); scatter(6, AREAS[2], 'rock', 22, 30, 60);
  for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = .35 + r() * .4; DECO.push({ k: 'hole', x: LAKE.cx + Math.cos(a) * LAKE.rx * d, y: LAKE.cy + Math.sin(a) * LAKE.ry * d }) }
  for (let i = 0; i < 70; i++) DECO.push({ k: 'tuft', x: r() * W, y: r() * H, s: .6 + r() * .8 });
})();
function inLake(x, y, k) { const dx = (x - LAKE.cx) / LAKE.rx, dy = (y - LAKE.cy) / LAKE.ry; return dx * dx + dy * dy < (k || 1) }
function inCave(x, y) { let c = false; for (let i = 0, j = CAVE.length - 1; i < CAVE.length; j = i++) { const [xi, yi] = CAVE[i], [xj, yj] = CAVE[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
function onPath(x, y) { const P = [[1870, 1250, 650, 820], [1870, 1250, 1870, 360], [1870, 1250, 3010, 1160], [1870, 1250, 3020, 2080], [1870, 1250, 640, 2060]]; return P.some(([x0, y0, x1, y1]) => { const dx = x1 - x0, dy = y1 - y0, u = clamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(x0 + dx * u - x, y0 + dy * u - y) < 70 }) }
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#FF8FB8', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: null, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, score: 0, frz: 0, tags: 0, cures: 0, surv: 0, now: () => Date.now(), hooks: {} };
const PLS = { x: 0, y: 0, face: 1 };   // vị trí đưa lên trang cô (cố định → vị trí thật đi kênh nhanh)
const keys = { l: 0, r: 0, u: 0, d: 0, sh: 0 }, ptr = { on: 0, x: 0, y: 0, tap: 0 };
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, cam = { x: 1300, y: 900 }, seed0 = 7, LV = LVS[2], last = 0, acc = 0, shotN = 0, shake = 0, flashT = 0;
let groundP = null, nightC = null, link = null, me = 'me', aloneT = 0, roomN = 0, emptyT = 0, sendT = 0, lastSig = '', T0 = 0, cureN = 0, survT = 0, roundT = 0, blizWas = false, nightWas = false, flakes = [];
const pl = body('me', '', '#FF8FB8', false), bots = [], R = {}, SH = [], PT = [], FEED = [], BAN = [], taken = new Set();
const now = () => S.now(), myV = () => typeof APPV !== 'undefined' ? APPV : '';   // APPV: số bản game của trang (play.html)
let staleT = 0, allCurT = 0, botMode = false, wave = 0, waveT = 0, moveT = 0, lastOne = false, lastWas = false, huntWas = false;
const WAVES = 3, BOTN = ['Xác ướp Bông', 'Xác ướp Băng', 'Xác ướp Gió', 'Xác ướp Sương', 'Xác ướp Bão', 'Xác ướp Đêm'];
function body(id, n, c, bot) { return { id, n, c, bot, x: 1870, y: 1330, vx: 0, vy: 0, a: 0, face: 1, mv: 0, hp: 100, shd: 50, cur: false, frz: 0, inv: 0, stun: 0, cd: 0, dashT: 0, dcd: 0, tri: 0, spd: 0, torch: 0, last: null, walk: 0, flash: 0, score: 0, tagCD: {}, I: { mx: 0, my: 0, act: 0, a: null }, think: 0, fireT: 0, cuT: 0 } }
const everyone = () => [pl].concat(bots);
const safe = () => !S.running;   // đang trả lời / chưa bắt đầu / đã nộp
const nameOf = id => id === me ? (S.name || 'Em') : (R[id] && R[id].n) || ((bots.find(b => b.id === id) || {}).n) || 'Một bạn';
const colOf = id => id === me ? S.color : (R[id] && R[id].c) || ((bots.find(b => b.id === id) || {}).c) || '#ccc';
function mix(a, b, t) { if (!/^#?[0-9a-f]{3,6}$/i.test(String(a))) return a; const p = s => { s = String(s).replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) || 0) }, A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('') }
const lt = (c, t) => mix(c, '#ffffff', t), dk = (c, t) => mix(c, '#101830', t);
function rr(x, X, Y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath() }
const F = (s, w, it) => (it ? 'italic ' : '') + (w || 800) + ' ' + s + "px 'Baloo 2', Nunito, system-ui, sans-serif";
function snd(k, b) {
  if (b && b !== pl && !b.near) return;
  try {
    if (k === 'throw') GC.tone(620, .08, 'triangle', .04, 300); else if (k === 'splat') GC.tone(260, .1, 'square', .04, 120); else if (k === 'freeze') [1600, 1200, 900].forEach((f, i) => GC.tone(f, .14, 'sine', .06, 0, i * .05));
    else if (k === 'hurt') { GC.sfx('hurt') } else if (k === 'cursed') { GC.tone(300, .7, 'sawtooth', .07, 70); GC.tone(150, .9, 'square', .05, 60, .1) } else if (k === 'cure') [523, 659, 784, 1047, 1319].forEach((f, i) => GC.tone(f, .16, 'triangle', .06, 0, i * .07));
    else if (k === 'dash') GC.tone(200, .2, 'sawtooth', .05, 700); else if (k === 'item') GC.sfx('bat'); else if (k === 'tag') { GC.tone(180, .15, 'square', .07, 90) } else if (k === 'night') [392, 330, 262].forEach((f, i) => GC.tone(f, .5, 'sine', .05, 0, i * .25));
    else if (k === 'wind') GC.tone(200, 1.2, 'sawtooth', .025, 120);
  } catch (e) { }
}
/* ═════ giờ chung: ngày/đêm, bão tuyết, quà — mọi máy ra giống nhau ═════ */
function darkAt(t) { const p = (((t - T0) / 1000) % DAY + DAY) % DAY; return p < 150 ? 0 : p < 172 ? (p - 150) / 22 * .8 : p < 228 ? .8 : (240 - p) / 12 * .8 }   // 0 = ngày · .8 = đêm
function nightLeft(t) { const p = (((t - T0) / 1000) % DAY + DAY) % DAY; return p < 150 ? 150 - p : p < 228 ? 228 - p : 0 }
function blizAt(t) { const w = Math.floor(t / BSLOT), st = w * BSLOT + 40000, a = rng(seed0 * 31 + w)() * 6.283; return { on: t >= st && t < st + BLEN, warn: t >= st - 2500 && t < st, dx: Math.cos(a), dy: Math.sin(a), left: st + BLEN - t } }
function walkable(x, y, m) { return x > 50 && x < W - 50 && y > 50 && y < H - 50 && OBS.every(o => Math.hypot(o.x - x, o.y - y) > o.r + (m || 0)) && FIRES.every(f => Math.hypot(f.x - x, f.y - y) > 40 + (m || 0)) }
function itemAt(k) {
  const r = rng(seed0 * 977 + k * 131 + 7); r(); let s = r() * 100, ty = ITEMS[0];
  for (const it of ITEMS) { if ((s -= it.wt) < 0) { ty = it; break } }
  for (let t = 0; t < 30; t++) { const x = 120 + r() * (W - 240), y = 120 + r() * (H - 240); if (walkable(x, y, 40)) return { k, ty, x, y, t0: k * SLOT } }
  return { k, ty, x: 1870, y: 1330, t0: k * SLOT };
}
function activeItems(t0) { const t = t0 || now(), k1 = Math.floor(t / SLOT), out = []; for (let k = k1 - 6; k <= k1; k++) { if (taken.has(k)) continue; const it = itemAt(k); if (t >= it.t0 && t < it.t0 + ILIFE) out.push(it) } return out }
/* ═════ vật lí ═════ */
function pay(b, c) {
  if (b.bot) return true;
  if (S.energy >= c) { S.energy -= c; return true }
  if (performance.now() - emptyT > 1500) { emptyT = performance.now(); banner('⚡ Hết sức rồi! Trả lời câu hỏi để nạp ⚡ nhé', '#FFE680', 1600); S.hooks.onEmpty && S.hooks.onEmpty() }
  return false;
}
function collide(b) {
  for (const o of OBS) { const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy), m = o.r + BR * .8; if (d < m && d > .01) { b.x = o.x + dx / d * m; b.y = o.y + dy / d * m; const vn = (b.vx * dx + b.vy * dy) / d; if (vn < 0) { b.vx -= vn * dx / d; b.vy -= vn * dy / d } } }
  for (const f of FIRES) { const dx = b.x - f.x, dy = b.y - f.y, d = Math.hypot(dx, dy), m = 34 + BR * .8; if (d < m && d > .01) { b.x = f.x + dx / d * m; b.y = f.y + dy / d * m } }
  b.x = clamp(b.x, 50, W - 50); b.y = clamp(b.y, 60, H - 40);
}
function phys(b, I, env) {
  for (const k of ['inv', 'cd', 'dashT', 'dcd', 'tri', 'spd', 'torch', 'flash', 'stun', 'slow']) if (b[k] > 0) b[k]--;
  const lake = inLake(b.x, b.y);
  if (b.frz > 0) { b.frz--; if (!b.frz && b.cur && b.hp <= 0) { b.hp = 100; ring(b.x, b.y, '#B57BFF', 50) } b.vx *= .9; b.vy *= .9; b.x += b.vx; b.y += b.vy; collide(b); return }
  const nearFire = FIRES.some(f => Math.hypot(f.x - b.x, f.y - b.y) < 130);
  let max = (b.cur ? 5.9 * (env.dark > .5 ? 1.1 : 1) * (1 + (mBoost() - 1) * .25) : 5.2) * (b.bot ? LV.bs : 1) * (b.spd > 0 ? 1.45 : 1) * (env.bliz.on ? .8 : 1) * (b.cur && nearFire ? .8 : 1) * (b === pl && lastOne ? 1.12 : 1);
  if (b.slow > 0) max *= .6;   // trúng cầu lời nguyền: chậm lại
  if (botMode && b.bot) max = Math.min(max, env.dark > .5 ? 5.1 : 4.7);   // đấu bot: bot chạy chậm hơn em một chút
  const L = Math.hypot(I.mx, I.my), acc = (lake ? .36 : .9) * (b.stun > 0 ? .25 : 1);
  if (L > .1) { b.vx += I.mx / L * acc; b.vy += I.my / L * acc; b.mv = Math.atan2(I.my, I.mx); if (Math.abs(I.mx) > .2) b.face = I.mx > 0 ? 1 : -1 }
  const sp = Math.hypot(b.vx, b.vy); if (sp > max) { const k = Math.max(max, sp * .88) / sp; b.vx *= k; b.vy *= k }
  if (L <= .1) { const f = lake ? .985 : b.stun > 0 ? .92 : .78; b.vx *= f; b.vy *= f }
  if (env.bliz.on) { b.vx += env.bliz.dx * .2; b.vy += env.bliz.dy * .2 }
  b.x += b.vx; b.y += b.vy; collide(b);
  b.walk = L > .1 ? b.walk + Math.min(.35, sp * .06) : b.walk * .8;
  if (I.a != null) b.a = I.a;
  if (!b.cur && nearFire && b.hp < 100) { b.hp = Math.min(100, b.hp + .1); if (S.tick % 20 === 0) PT.push({ x: b.x + (Math.random() - .5) * 30, y: b.y, z: 60, vx: 0, vy: 0, vz: 1, life: 30, max: 30, txt: '+', col: '#7CF29A' }) }
  if (I.act && b.cd <= 0 && b.stun <= 0) { if (!b.cur) throwSnow(b); else throwOrb(b) }
}
function throwSnow(b) {
  if (!pay(b, LV.cs)) { b.cd = 20; return }
  const a = b.a, x = b.x + Math.cos(a) * 30, y = b.y + Math.sin(a) * 22, id = b.id + '.' + (++shotN).toString(36), k = b.tri > 0 ? 1 : 0;
  b.cd = 16; spawnShot(b.id, x, y, a, k, id, 0);
  if (b === pl && link) send({ e: 's', i: me, x: Math.round(x), y: Math.round(y), a: Math.round(a * 1000), k, id, t: Math.round(now()) });
  snd('throw', b);
}
function throwOrb(b) {   // xác ướp bắn cầu lời nguyền
  if (!pay(b, LV.cd)) { b.cd = 20; return }
  const a = b.a, x = b.x + Math.cos(a) * 30, y = b.y + Math.sin(a) * 22, id = b.id + '.' + (++shotN).toString(36);
  b.cd = 18; spawnShot(b.id, x, y, a, 2, id, 0);
  if (b === pl && link) send({ e: 's', i: me, x: Math.round(x), y: Math.round(y), a: Math.round(a * 1000), k: 2, id, t: Math.round(now()) });
  snd('dash', b);
}
function spawnShot(own, x, y, a, k, id, age) {
  const orb = k === 2, sp = orb ? 14 : SB, mk = (da, sid) => { const s = { own, orb, x, y, vx: Math.cos(a + da) * sp, vy: Math.sin(a + da) * sp, life: orb ? 50 : SBL, id: sid, tr: [] }; for (let i = 0; i < age; i++) { s.x += s.vx; s.y += s.vy; s.life-- } SH.push(s) };
  if (k === 1) { mk(-.22, id + 'a'); mk(0, id + 'b'); mk(.22, id + 'c') } else mk(0, id);
}
function freezeBody(b, s) {   // bóng tuyết trúng xác ướp (máy của xác ướp tự tính)
  if (botMode && b.bot) return hitBot(b, s);
  if (!b.cur || b.ko > 0 || b.inv > 0 || (b === pl && safe())) return false;
  b.hp -= 10 / mBoost(); b.frz = Math.max(b.frz, 5); b.inv = 6; const sp = Math.hypot(s.vx, s.vy) || 1; b.vx = s.vx / sp * 4; b.vy = s.vy / sp * 4; b.flash = 8;   /* mất 10 máu (xác ướp đơn độc mất ít hơn), khựng rất ngắn */
  burst(b.x, b.y, '#BFEFFF', 16); snd('freeze', b);
  if (b === pl) { shake = 6; if (link && s.own !== me) send({ e: 'h', i: me, by: s.own, id: s.id }) }
  if (s.own === me && b !== pl) gain(2, '❄️ TRÚNG!');
  { const t = bots.find(x => x.id === s.own); if (t) t.score += 2 }
  if (b.hp <= 0) mummyDown(b, s.own);
  return true;
}
function mummyDown(b, by) {   // xác ướp hết máu: đóng băng tại chỗ 2,5 giây, tan băng là đầy máu lại
  b.frz = 150; b.inv = 190; b.hp = 0; b.vx = b.vy = 0; burst(b.x, b.y, '#FFFFFF', 26); ring(b.x, b.y, '#8FE3FF', 60); snd('cure', b);
  FEED.unshift({ t: performance.now(), a: nameOf(by), ac: colOf(by), b: b === pl ? (S.name || 'Em') : b.n, k: 'kill', me: by === me || b === pl }); FEED.length = Math.min(FEED.length, 4);
  if (b === pl) { shake = 12; flashT = 8; banner('🧊 Em bị ĐÓNG BĂNG 2,5 giây! Tan băng là đầy máu — săn tiếp nào', '#8FE3FF', 2600); if (link) send({ e: 'd', i: me, by }) }
  if (by === me && b !== pl) gain(5, '🧊 ĐÓNG BĂNG XÁC ƯỚP!');
}
function hitBot(b, s) {   // đấu bot: bóng tuyết trúng bot xác ướp → mất 25 máu, khựng lại; hết máu thì tan thành tuyết
  if (b.inv > 0) return false;
  b.hp -= 25; b.frz = 22; b.inv = 6; const sp = Math.hypot(s.vx, s.vy) || 1; b.vx = s.vx / sp * 8; b.vy = s.vy / sp * 8; b.flash = 8;
  burst(b.x, b.y, '#BFEFFF', 12); snd('freeze', b);
  if (s.own === me) gain(2, '❄️ TRÚNG!');
  if (b.hp <= 0) killBot(b);
  return true;
}
function killBot(b) {
  const i = bots.indexOf(b); if (i < 0) return;
  burst(b.x, b.y, '#FFFFFF', 30); burst(b.x, b.y, '#BFEFFF', 20); ring(b.x, b.y, '#8FE3FF', 60); snd('cure', b);
  FEED.unshift({ t: performance.now(), a: S.name || 'Em', ac: S.color, b: b.n, k: 'kill', me: true }); FEED.length = Math.min(FEED.length, 4);
  bots.splice(i, 1); S.tags++; gain(5, '💥 HẠ ' + b.n.toUpperCase());
  if (!bots.length) { if (wave >= WAVES) { S.won = true; banner('🏆 EM ĐÃ ĐÁNH BẠI TOÀN BỘ XÁC ƯỚP! Xứ Tuyết được cứu rồi!', '#FFE680', 4000); S.hooks.onWin && S.hooks.onWin() } else { waveT = 240; banner('🎉 Xong đợt ' + wave + '/' + WAVES + '! Đợt ' + (wave + 1) + ' sẽ tới sau 4 giây — nạp ⚡ đi nào!', '#7CF29A', 3800) } }
}
function knockOut() {   // đấu bot: em hết máu → bị hạ 2 giây rồi đứng dậy ở làng (không bị yểm)
  pl.ko = 120; pl.inv = 260; pl.vx = pl.vy = 0; S.falls++; S.score = Math.max(0, S.score - 3); shake = 14; flashT = 10; burst(pl.x, pl.y, '#B8C2E0', 24); snd('cursed', pl);
  S.lives = (S.lives || 1) - 1;
  if (S.lives > 0) banner('💫 Em bị hạ rồi! Còn ' + S.lives + ' mạng — đứng dậy sau 2 giây (−3⭐)', '#FFB36B', 3000);
  else { S.lives = 5; for (const b of bots) burst(b.x, b.y, '#ffffff', 12); bots.length = 0; wave = Math.max(0, wave - 1); waveT = 200; banner('💔 Hết 5 mạng! Chơi lại đợt ' + (wave + 1) + ' với 5 mạng mới — cố lên nào!', '#FF8FB8', 3800) }
}
function tagBody(b, by, from, orb) {   // xác ướp chạm / cầu lời nguyền trúng người (máy của người bị trúng tự tính)
  if (b.cur || b.inv > 0 || (b === pl && safe())) return false;
  let d = (botMode ? (orb ? 25 : 34) : (orb ? 50 : 40)) * mBoost(); if (b.shd > 0) { const u = Math.min(b.shd, d); b.shd -= u; d -= u } b.hp -= d;
  const dx = b.x - from.x, dy = b.y - from.y, dd = Math.hypot(dx, dy) || 1; b.flash = 8;
  if (orb) { b.inv = 24; b.slow = 100; b.vx += dx / dd * 7; b.vy += dy / dd * 7 } else { b.inv = 50; b.vx += dx / dd * 15; b.vy += dy / dd * 15; b.stun = 12 }   // bị chạm: mất 25, văng xa, 1,2 giây không bị chạm tiếp · trúng cầu: mất 18, chậm 1,7 giây
  burst(b.x, b.y, '#B8C2E0', 10); snd('hurt', b);
  if (b === pl) { S.hits++; shake = 9; if (link) send({ e: 'g', i: me, by }) }
  if (by === me && b !== pl) gain(1, '🧟 CHẠM TRÚNG!');
  { const t = bots.find(x => x.id === by); if (t) t.score += 1 }
  if (b.hp <= 0) { if (botMode && b === pl) knockOut(); else curse(b, by) }
  return true;
}
function curse(b, by) {
  b.cur = true; b.hp = 100; b.shd = 0; b.inv = INV; b.frz = 0; b.tri = 0; b.torch = 0; b.cuT = S.tick; if (b === pl) cureN = 0;
  burst(b.x, b.y, '#9AA6C8', 30); snd('cursed', b); feed(by, b.id, 'cu');
  if (b === pl) { S.falls++; shake = 14; flashT = 10; banner('🧟 Em bị yểm thành XÁC ƯỚP rồi! Giờ súng 🔮 của em cực mạnh — bắn yểm các bạn, cả lớp thành xác ướp là phe em thắng!', '#C9B6FF', 4200); if (link) send({ e: 'c', i: me, by }); S.hooks.onFall && S.hooks.onFall(0, '🧟 Bị ' + nameOf(by) + ' yểm rồi! Giờ em là xác ướp — trả lời để nạp ⚡ rồi đi săn các bạn nhé!') }
  if (by === me && b !== pl) { S.tags++; rage(); gain(8, '🧟 YỂM ĐƯỢC ' + b.n + '!'); S.hooks.onKO && S.hooks.onKO(b.n, S.tags) }
  { const t = bots.find(x => x.id === by); if (t) t.score += 8 }
}
function rage() { pl.spd = Math.max(pl.spd, 240); ring(pl.x, pl.y, '#FF5C7A', 70); banner('😈 CUỒNG NỘ! Yểm thêm 1 bạn — em chạy nhanh 4 giây, săn tiếp!', '#FF8FB8', 2200) }
function cure(b) {
  b.cur = false; b.hp = 60; b.shd = 0; b.inv = 180; b.frz = 0; burst(b.x, b.y, '#FFE680', 30); snd('cure', b); feed(null, b.id, 'cure');
  if (b === pl) { S.cures++; gain(5, '✨ Giải lời nguyền!'); banner('✨ GIẢI ĐƯỢC LỜI NGUYỀN! Em đã trở lại làm người — chạy mau!', '#FFE680', 3200); if (link) send({ e: 'u', i: me }) }
}
function gain(n, txt) { S.score += n; if (txt) pop(pl.x, pl.y - 110, txt + ' +' + n + '⭐', '#7CF29A'); const lv = Math.floor(S.score / 25); if (lv > S.level) { S.level = lv; S.hooks.onCP && S.hooks.onCP(lv, 'lv') } }
function applyItem(b, it) {
  const k = it.ty.k;
  if (k === 'coco') b.hp = Math.min(100, b.hp + 40); else if (k === 'scarf') b.shd = Math.min(100, b.shd + 50); else if (k === 'tri') b.tri = 600; else if (k === 'boot') b.spd = 600; else if (k === 'torch') b.torch = 360;
  else if (k === 'bat' && b === pl) S.energy = S.cap ? Math.min(S.cap, S.energy + 40) : S.energy + 40;
  else if (k === 'life') { if (botMode && b === pl) S.lives = Math.min(9, (S.lives || 0) + 1); else b.hp = Math.min(100, b.hp + 30) }
  ring(it.x, it.y, it.ty.col, 34); pop(b.x, b.y - 96, it.ty.ic + ' ' + it.ty.name, it.ty.col);
  if (b === pl) { snd('item'); banner(it.ty.ic + ' ' + it.ty.name + ': ' + (k === 'life' && !botMode ? '+30 máu' : it.ty.txt) + (k === 'life' && botMode ? ' · còn ' + S.lives + ' mạng' : ''), it.ty.col, 1800) }
}
function spawnAt(b) {   // người: quanh làng / lửa trại · xác ướp: ở xa (rừng, hang)
  const pts = b.cur ? [[300, 260], [3350, 2380], [3420, 1350], [260, 1150], [900, 2450], [2650, 2420], [1300, 150]] : [[1870, 1330], [1760, 1170], [1990, 1170], [1870, 1080], [1700, 1360], [2040, 1360]];
  const far = (x, y) => !b.cur || everyone().every(o => o === b || o.cur || Math.hypot(o.x - x, o.y - y) > 1100);   // xác ướp luôn xuất hiện xa người
  for (let t = 0; t < 60; t++) { const [px, py] = pts[Math.floor(Math.random() * pts.length)], x = px + (Math.random() - .5) * (b.cur ? 260 : 200), y = py + (Math.random() - .5) * (b.cur ? 200 : 140); if (walkable(x, y, 40) && far(x, y)) { b.x = x; b.y = y; break } }
  b.vx = b.vy = 0; b.inv = 90;
}
/* ═════ ngắm: chuột / chạm màn hình → về chỗ đó · phím / nút → hướng đang đi ═════ */
function myAim() { if (ptr.on) return Math.atan2(ptr.y - pl.y, ptr.x - pl.x); return pl.mv != null ? pl.mv : (pl.face > 0 ? 0 : Math.PI) }
/* ═════ bot ═════ */
function losClear(x0, y0, x1, y1) { for (const o of OBS) { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = clamp(((o.x - x0) * dx + (o.y - y0) * dy) / L2, 0, 1); if (Math.hypot(x0 + dx * u - o.x, y0 + dy * u - o.y) < o.r + 6) return false } return true }
function steer(b, tx, ty, away) {   // hướng tới (hoặc chạy khỏi) 1 điểm, tránh vật cản & mép bản đồ
  let vx = tx - b.x, vy = ty - b.y; const d = Math.hypot(vx, vy) || 1; vx /= d; vy /= d; if (away) { vx = -vx; vy = -vy }
  for (const o of OBS) { const dx = b.x - o.x, dy = b.y - o.y, dd = Math.hypot(dx, dy), m = o.r + 70; if (dd < m && dd > 1) { const k = (m - dd) / m * 1.6; vx += dx / dd * k + (-dy / dd) * k * .6; vy += dy / dd * k + (dx / dd) * k * .6 } }
  const edge = 220; if (b.x < edge) vx += (edge - b.x) / edge * 1.5; if (b.x > W - edge) vx -= (b.x - W + edge) / edge * 1.5; if (b.y < edge) vy += (edge - b.y) / edge * 1.5; if (b.y > H - edge) vy -= (b.y - H + edge) / edge * 1.5;
  return [vx, vy];
}
function targets(cur) { const L = []; for (const o of everyone()) if (o.cur === cur && !(o === pl && safe())) L.push(o); for (const id in R) { const r = R[id]; if (!!(r.s & 4096) === cur && !(r.s & 1)) L.push(r) } return L }
function botAI(b) {
  const I = b.I; I.mx = I.my = 0; I.act = 0; I.a = null;
  if (b.frz > 0) return I;
  if (--b.think <= 0) { b.think = LV.react + Math.floor(Math.random() * 8); b.wan = b.wan || [b.x, b.y] }
  if (b.cur && now() - T0 < GRACE) return I;   // chưa thức dậy
  if (b.cur) {   // xác ướp: đuổi người gần nhất, lại gần thì lướt
    let tg = null, td = 1e9; for (const o of targets(false)) { if ((o.inv > 0 && o !== pl) || o.ko > 0) continue; const d = Math.hypot(o.x - b.x, o.y - b.y); if (d < td) { td = d; tg = o } }
    if (tg && td < 1500) { const [vx, vy] = steer(b, tg.x + (tg.vx || 0) * 8, tg.y + (tg.vy || 0) * 8); I.mx = vx; I.my = vy; I.a = Math.atan2(tg.y + (tg.vy || 0) * td / 11.5 * .5 - b.y, tg.x + (tg.vx || 0) * td / 11.5 * .5 - b.x) + (Math.random() - .5) * (1 - LV.aim) * .5; if (b.fireT > 0) b.fireT--; else if (td < 460 && td > 90 && losClear(b.x, b.y, tg.x, tg.y)) { if (Math.random() < LV.aim) I.act = 1; b.fireT = 70 + Math.floor(Math.random() * 50) } }
    else { if (!b.goal || Math.hypot(b.goal[0] - b.x, b.goal[1] - b.y) < 80) b.goal = [300 + Math.random() * (W - 600), 300 + Math.random() * (H - 600)]; const [vx, vy] = steer(b, b.goal[0], b.goal[1]); I.mx = vx * .7; I.my = vy * .7 }
  } else {   // người: chạy khỏi xác ướp gần nhất, ném tuyết khi trong tầm
    let th = null, td = 1e9; for (const o of targets(true)) { if (o.frz > 0 || (o.s & 256)) continue; const d = Math.hypot(o.x - b.x, o.y - b.y); if (d < td) { td = d; th = o } }
    if (th && td < 560) { const [vx, vy] = steer(b, th.x, th.y, true); I.mx = vx; I.my = vy; if (td < 430 && b.fireT <= 0 && losClear(b.x, b.y, th.x, th.y)) { I.a = Math.atan2(th.y + (th.vy || 0) * td / SB * .6 - b.y, th.x + (th.vx || 0) * td / SB * .6 - b.x) + (Math.random() - .5) * (1 - LV.aim) * .6; if (Math.random() < LV.aim) I.act = 1; b.fireT = 34 + Math.floor(Math.random() * 26) } }
    else { const it = activeItems().find(it => it.ty.sur && Math.hypot(it.x - b.x, it.y - b.y) < 500), f = b.hp < 60 ? FIRES.reduce((a, z) => Math.hypot(z.x - b.x, z.y - b.y) < Math.hypot(a.x - b.x, a.y - b.y) ? z : a) : null; const g = it ? [it.x, it.y] : f ? [f.x + 70, f.y] : (b.goal && Math.hypot(b.goal[0] - b.x, b.goal[1] - b.y) > 80 ? b.goal : (b.goal = [400 + Math.random() * (W - 800), 400 + Math.random() * (H - 800)])); const [vx, vy] = steer(b, g[0], g[1]); const k = f && Math.hypot(f.x - b.x, f.y - b.y) < 110 ? 0 : .75; I.mx = vx * k; I.my = vy * k }
    if (b.fireT > 0) b.fireT--;
    if (I.a == null && (I.mx || I.my)) I.a = Math.atan2(I.my, I.mx);
  }
  // bot bị yểm lâu thì "trả lời đúng 3 câu" → giải lời nguyền (chỉ khi còn xác ướp khác)
  if (b.cur && b.wasHuman && S.tick - b.cuT > 1800 && Math.random() < .002 && targets(true).length > 1) cure(b);
  return I;
}
function wantBots() { return !link || (roomN <= 1 && aloneT > 210) }
function syncBots() {   // đấu bot theo đợt (chơi một mình / phòng 1 bạn) · có bạn vào phòng thì bot rút lui
  const want = wantBots();
  if (want && !botMode) { botMode = true; wave = 0; waveT = 90; pl.cur = false; S.lives = 5 }   // đấu bot: em có 5 mạng
  else if (!want && botMode) { botMode = false; S.lives = null; for (const b of bots) burst(b.x, b.y, '#ffffff', 12); bots.length = 0; banner('👋 Có bạn vào phòng rồi — bot rút lui, chơi thật nào!', '#8FE3FF', 2400) }
  if (!botMode || S.won) return;
  if (waveT > 0) { waveT--; return }
  if (!bots.length && wave < WAVES) {
    wave++; const n = LV.cur + wave - 1;
    for (let k = 0; k < n; k++) { const b = body('bot' + wave + '_' + k, BOTN[k % BOTN.length], '#C9CFE0', true); b.cur = true; b.hp = 100; b.shd = 0; bots.push(b); spawnAt(b); b.inv = 60 }
    banner('🧟 ĐỢT ' + wave + '/' + WAVES + ': ' + n + ' xác ướp xuất hiện! Ném tuyết hạ hết chúng!', '#C9B6FF', 3200);
  }
}
function soloRound() { }
/* ═════ mạng: kênh nhanh ═════ */
function send(m) { try { link && link.send(m) } catch (e) { } }
function flags(b) { return (b.ko > 0 ? 8192 : 0) | (safe() && b === pl ? 1 : 0) | (b.slow > 0 ? 2 : 0) | (b.inv > 0 ? 4 : 0) | (b.spd > 0 ? 8 : 0) | (b.tri > 0 ? 32 : 0) | (b.torch > 0 ? 64 : 0) | (b.dashT > 0 ? 128 : 0) | (b.frz > 0 ? 256 : 0) | (b.stun > 0 ? 1024 : 0) | (b.cur ? 4096 : 0) }
function onNet(m) {
  if (!m || !m.i || m.i === me) return;
  const at = performance.now(), r = R[m.i] || (R[m.i] = { buf: [], n: m.n || '…', c: m.c || '#ccc', a: 0, f: 1, s: 0, k: 0, hp: 100, sd: 0, flash: 0, x: m.x || 1870, y: m.y || 1330, walk: 0, vx: 0, vy: 0 });
  r.last = at; if (m.n) r.n = m.n; if (m.c) r.c = m.c;
  if (m.v && m.v > myV() && performance.now() - staleT > 8000) { staleT = performance.now(); banner('⚠️ Máy em đang chạy bản game CŨ — bấm tải lại trang (↻) để chơi đúng luật nhé!', '#FFB36B', 5000) }   // bạn khác có bản mới hơn
  if (m.e === 'p') { r.buf.push({ at, x: m.x, y: m.y }); if (r.buf.length > 8) r.buf.shift(); r.a = (m.a || 0) / 1000; r.f = m.f || 1; r.s = m.s || 0; r.k = m.k || 0; r.hp = m.h != null ? m.h : 100; r.sd = m.sd || 0; r.mv = !!m.m; r.vx = m.vx || 0; r.vy = m.vy || 0 }
  else if (m.e === 's') spawnShot(m.i, m.x, m.y, (m.a || 0) / 1000, m.k, m.id, clamp(Math.round((now() - m.t) / 16.7), 0, 12));
  else if (m.e === 'h') { for (let i = SH.length - 1; i >= 0; i--) if (SH[i].id === m.id) SH.splice(i, 1); burst(r.x, r.y, '#BFEFFF', 12); if (m.by === me) gain(2, '❄️ ĐÓNG BĂNG!') }
  else if (m.e === 'g') { r.flash = 8; burst(r.x, r.y, '#B8C2E0', 8); if (m.by === me) gain(1, '🧟 CHẠM TRÚNG!') }
  else if (m.e === 'c') { r.s |= 4096; burst(r.x, r.y, '#9AA6C8', 26); feed(m.by, m.i, 'cu'); if (m.by === me) { S.tags++; rage(); gain(8, '🧟 YỂM ĐƯỢC ' + r.n + '!'); S.hooks.onKO && S.hooks.onKO(r.n, S.tags) } }
  else if (m.e === 'd') { burst(r.x, r.y, '#FFFFFF', 22); FEED.unshift({ t: performance.now(), a: nameOf(m.by), ac: colOf(m.by), b: r.n, k: 'kill', me: m.by === me }); FEED.length = Math.min(FEED.length, 4); if (m.by === me) gain(5, '🧊 ĐÓNG BĂNG XÁC ƯỚP!') }
  else if (m.e === 'u') { r.s &= ~4096; burst(r.x, r.y, '#FFE680', 26); feed(null, m.i, 'cure') }
  else if (m.e === 't') taken.add(m.k);
}
function rpos(r, t) {
  const b = r.buf; if (!b.length) return null; const rt = t - 110, l = b[b.length - 1];
  if (b.length === 1 || rt >= l.at) { const u = clamp((rt - l.at) / 16.7, 0, 10); return { x: l.x + r.vx * u, y: l.y + r.vy * u } }
  for (let i = b.length - 1; i > 0; i--) if (b[i - 1].at <= rt) { const a = b[i - 1], c = b[i], u = (rt - a.at) / ((c.at - a.at) || 1); return { x: a.x + (c.x - a.x) * u, y: a.y + (c.y - a.y) * u } }
  return { x: b[0].x, y: b[0].y };
}
function netTick(ts) {
  if (!link) return;
  const p = pl, s = flags(p), mv = Math.hypot(p.vx, p.vy) > .4 ? 1 : 0, sig = Math.round(p.x) + ',' + Math.round(p.y) + ',' + s + ',' + Math.round(p.hp) + ',' + Math.round(p.shd) + ',' + Math.round(p.a * 20) + ',' + S.score;
  if (ts - sendT < (sig === lastSig ? 1000 : 105)) return;
  sendT = ts; lastSig = sig;
  send({ e: 'p', i: me, n: S.name, c: S.color, x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.vx * 10) / 10, vy: Math.round(p.vy * 10) / 10, a: Math.round(p.a * 1000), f: p.face, s, k: S.score, h: Math.round(p.hp), sd: Math.round(p.shd), m: mv, v: myV() });
}
function attachNet(L) { link = L; me = L.me || me; pl.id = me; L.on(onNet); bots.length = 0 }
function setPlayers(n) { roomN = n }
function onBegin(info, pid) {   // vai lúc bắt đầu: trang cô chọn sẵn ai là xác ướp (info.cu) · giờ chung bắt đầu (info.sa)
  T0 = info && info.sa || now(); if (!pl.cur) spawnAt(pl);
  S.orig = !!(info && info.cu && info.cu[pid || me]);
  if (S.orig) { pl.cur = true; pl.hp = 100; pl.shd = 0; spawnAt(pl); banner('🧟 Em là XÁC ƯỚP GỐC! Súng 🔮 của em cực mạnh — 2–3 phát là yểm được 1 bạn. Yểm cả lớp là thắng!', '#C9B6FF', 5000) }
  else banner(!link ? '❄️ ĐẤU BOT: hạ hết xác ướp qua 3 đợt là em thắng! Ném ❄️ bóng tuyết, đừng để chúng áp sát' : '❄️ Em là NGƯỜI SỐNG SÓT! Trúng 2–3 phát 🔮 là bị yểm — né đi, ném thật nhiều ❄️ để đóng băng xác ướp', '#8FE3FF', 4500);
}
function onAnswer(ok) {   // xác ướp trả lời đúng 3 câu liên tiếp → giải lời nguyền
  return;   /* bỏ giải lời nguyền (12/11): ai thành xác ướp thì làm tới hết trận */
  if (S.cures >= 1) { if (ok && performance.now() - emptyT > 4000) { emptyT = performance.now(); banner('🧟 Em đã giải nguyền 1 lần rồi — lần này chiến đấu tới cùng với phe xác ướp nhé!', '#C9B6FF', 2600) } return }
  cureN = ok ? cureN + 1 : 0;
  if (cureN >= 3) { if (targets(true).filter(o => o !== pl).length >= 1) { cureN = 0; cure(pl) } else banner('🧟 Em là xác ướp cuối cùng — phải yểm thêm 1 bạn mới giải được lời nguyền!', '#C9B6FF', 3000) }
  else if (ok) banner('🔥 Giải lời nguyền: ' + cureN + '/3 câu đúng liên tiếp!', '#FFE680', 1600);
}
/* ═════ hiệu ứng ═════ */
function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 5; PT.push({ x, y, z: 26, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, vz: 2 + Math.random() * 3, life: 20 + Math.random() * 10, max: 30, col, r: 3 + Math.random() * 4 }) } }
function ring(x, y, col, r) { PT.push({ x, y, z: 0, ring: r, life: 22, max: 22, col }) }
function pop(x, y, txt, col) { PT.push({ x, y, z: 0, vx: 0, vy: -1.1, life: 55, max: 55, txt, col }) }
function feed(by, vid, k) { FEED.unshift({ t: performance.now(), a: by ? nameOf(by) : null, ac: by ? colOf(by) : '#fff', b: nameOf(vid), k, me: by === me || vid === me }); FEED.length = Math.min(FEED.length, 4) }
function banner(txt, col, ms) { BAN.length = 0; BAN.push({ txt, col, t: performance.now(), ms: ms || 2000 }) }
/* ═════ vòng lặp ═════ */
let roleWas = null;
function step() {
  S.tick++;
  if (roleWas !== pl.cur) { roleWas = pl.cur; const bf = document.getElementById('bF'); if (bf) { bf.textContent = pl.cur ? '🔮' : '❄️'; bf.setAttribute('aria-label', pl.cur ? 'Bắn cầu lời nguyền' : 'Ném tuyết') } }
  const t = now(), env = { dark: darkAt(t), bliz: blizAt(t) };
  if (env.bliz.warn && !blizWas) { banner('🌨 BÃO TUYẾT sắp tới! Gió đẩy người, thổi lệch cả bóng tuyết lẫn cầu 🔮…', '#8FE3FF', 2800); blizWas = true; snd('wind') }
  if (!env.bliz.warn && !env.bliz.on) blizWas = false;
  if (env.dark > .6 && !nightWas) { nightWas = true; banner('🌙 ĐÊM XUỐNG! Xác ướp mạnh hơn trong bóng tối — đứng gần lửa trại cho an toàn', '#C9B6FF', 3200); snd('night') } else if (env.dark < .1) nightWas = false;
  if (pl.ko > 0) { if (--pl.ko === 0) { pl.hp = 100; pl.shd = pl.cur ? 0 : 50; pl.slow = 0; spawnAt(pl); pl.inv = 150 } }
  else if (S.running) { let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if ((mx || my) && pl.frz <= 0) { if (S.energy < 1) { pay(pl, 1); mx = my = 0 } else if (++moveT >= 20) { moveT = 0; S.energy -= 1 } }   /* đi lại tốn ⚡: 1⚡ mỗi 1/3 giây · hết ⚡ đứng im, mở câu hỏi */
    if (lastOne) pl.tri = Math.max(pl.tri, 2);
    phys(pl, { mx, my, act: keys.sh || ptr.on, a: myAim() }, env); if (ptr.tap) { ptr.tap = 0; ptr.on = 0 } if (!pl.cur && ++survT >= 300) { survT = 0; S.surv += 5; gain(lastOne ? 3 : 1) } }
  else { pl.vx = pl.vy = 0 }
  const tn = performance.now(); let others = 0; for (const id in R) { if (tn - R[id].last > 6000) delete R[id]; else if (tn - R[id].last < 3000) others++ }
  aloneT = others ? 0 : aloneT + 1; syncBots(); soloRound();
  { const [c, n] = counts(), one = !!link && !botMode && n >= 3 && n - c === 1 && t - T0 > GRACE; lastOne = one && !pl.cur;   /* chỉ còn 1 người sống sót */
    if (lastOne && !lastWas) { banner('🔥 EM LÀ NGƯỜI CUỐI CÙNG! Ném 3 tia, chạy nhanh hơn, điểm sống sót ×3 — trụ tới hết giờ!', '#FFE680', 4200); ring(pl.x, pl.y, '#FFE680', 90); snd('cure', pl) }
    if (one && pl.cur && !huntWas) banner('🎯 Chỉ còn 1 NGƯỜI CUỐI CÙNG — cả bầy xác ướp săn thôi!', '#FF8FB8', 3200);
    lastWas = lastOne; huntWas = one && pl.cur }
  if (link && S.running && pl.cur && !bots.length) {   /* phòng chơi chung: không còn ai là người (6 giây không thấy người nào) → phe xác ướp thắng, tự kết thúc trên máy em (không cần chờ trang cô) */
    const seen = Object.values(R).filter(r => tn - r.last < 6000), human = seen.some(r => !(r.s & 4096));
    allCurT = seen.length && !human ? allCurT + 1 : 0;
    if (allCurT === 240) S.hooks.onAllCursed && S.hooks.onAllCursed();
  } else allCurT = 0;
  for (const b of bots) phys(b, botAI(b), env);
  // chạm: máy của người tự tính khi bị xác ướp chạm (bot người do máy này tính)
  const awake = t - T0 > GRACE, humans = awake ? everyone().filter(b => !b.cur) : [];
  if (!awake && S.tick % 60 === 0 && S.running) banner('🧟 Xác ướp sắp thức dậy sau ' + Math.ceil((GRACE - (t - T0)) / 1000) + ' giây — chạy đi nào!', '#C9B6FF', 1100);
  for (const h of humans) {
    const cs = everyone().filter(b => b.cur && b.frz <= 0 && !(b.ko > 0) && !(b === pl && safe())).map(b => ({ id: b.id, x: b.x, y: b.y })).concat(h === pl ? Object.entries(R).filter(([, r]) => (r.s & 4096) && !(r.s & (1 | 256 | 8192)) && tn - r.last < 3000).map(([id, r]) => ({ id, x: r.x, y: r.y })) : []);
    for (const c of cs) { if (Math.hypot(c.x - h.x, c.y - h.y) < BR * 1.85) { tagBody(h, c.id, c); break } }
    if (h.torch > 0) for (const b of bots) if (b.cur) { const dx = b.x - h.x, dy = b.y - h.y, d = Math.hypot(dx, dy); if (d < 190 && d > 1) { b.vx += dx / d * 1.6; b.vy += dy / d * 1.6 } }
  }
  if (pl.cur) for (const id in R) { const r = R[id]; if ((r.s & 64) && !(r.s & 4096)) { const dx = pl.x - r.x, dy = pl.y - r.y, d = Math.hypot(dx, dy); if (d < 190 && d > 1) { pl.vx += dx / d * 1.6; pl.vy += dy / d * 1.6 } } }   // đuốc của bạn xua em (xác ướp)
  // quà
  for (const it of activeItems()) for (const b of everyone()) { if (b.frz > 0 || (b === pl && safe())) continue; if (b.cur && it.ty.sur) continue; if (Math.hypot(b.x - it.x, b.y - it.y) < BR + 24) { taken.add(it.k); applyItem(b, it); if (b === pl) send({ e: 't', i: me, k: it.k }); break } }
  // bóng tuyết
  for (let i = SH.length - 1; i >= 0; i--) {
    const s = SH[i]; s.tr.push(s.x, s.y); if (s.tr.length > 10) s.tr.splice(0, 2); if (env.bliz.on) { s.vx += env.bliz.dx * .22; s.vy += env.bliz.dy * .22 } s.x += s.vx; s.y += s.vy; s.life--;
    let gone = s.life <= 0 || s.x < 0 || s.x > W || s.y < 0 || s.y > H;
    if (!gone) for (const o of OBS) if (Math.hypot(s.x - o.x, s.y - o.y) < o.r + 4) { gone = true; break }
    if (!gone) for (const b of everyone()) { if (b.id === s.own || b.cur !== !s.orb) continue; if (Math.hypot(s.x - b.x, s.y - b.y) < BR + 9) { if (s.orb ? (t - T0 > GRACE && tagBody(b, s.own, s, 1)) : freezeBody(b, s)) { gone = true; break } } }
    if (!gone && s.own === me) for (const id in R) { const r = R[id]; if (!!(r.s & 4096) !== !s.orb || (r.s & (1 | 4 | 256))) continue; if (Math.hypot(s.x - r.x, s.y - r.y) < BR + 9) { gone = true; break } }
    if (gone) { if (s.orb) burst(s.x, s.y, '#B57BFF', 8); else splat(s.x, s.y); SH.splice(i, 1) }
  }
  for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; if (p.vx != null) { p.x += p.vx; p.y += p.vy; if (p.vz != null) { p.z += p.vz; p.vz -= .3; if (p.z < 0) p.z = 0 } if (!p.txt) { p.vx *= .93; p.vy *= .93 } } if (--p.life <= 0) PT.splice(i, 1) }
  if (shake > 0) shake *= .86; if (flashT > 0) flashT--;
}
function splat(x, y) { for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28; PT.push({ x, y, z: 20, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 1.5, vz: 2, life: 16, max: 16, col: '#FFFFFF', r: 3 + Math.random() * 2 }) } }
function loop(ts) {
  const dt = Math.min(100, ts - (last || ts)); last = ts; acc += dt;
  requestAnimationFrame(loop);   // xin khung kế tiếp TRƯỚC: lỡ có lỗi lạ trong 1 khung thì game vẫn chạy tiếp
  try { while (acc >= 16.67) { step(); acc -= 16.67 } } catch (e) { acc = 0; console.error(e) }
  for (const id in R) { const r = R[id], p = rpos(r, ts); if (p) { if (r.mv) r.walk += .3; r.x = p.x; r.y = p.y } if (r.flash > 0) r.flash-- }
  try { draw(ts) } catch (e) { console.error(e) }
  try { netTick(ts) } catch (e) { }
  S.hooks.onFrame && S.hooks.onFrame(ts);
}
/* ═════ vẽ: mặt tuyết (ô lặp lại có vệt tuyết, lấp lánh) ═════ */
function makeGround() {
  const T = 512, c = document.createElement('canvas'); c.width = c.height = T; const x = c.getContext('2d'), r = rng(99);
  x.fillStyle = '#F2F6FE'; x.fillRect(0, 0, T, T);
  for (let i = 0; i < 26; i++) { const px = r() * T, py = r() * T, rd = 30 + r() * 70; const g = x.createRadialGradient(px, py, 0, px, py, rd); g.addColorStop(0, 'rgba(205,218,242,.55)'); g.addColorStop(1, 'rgba(205,218,242,0)'); x.fillStyle = g; x.fillRect(px - rd, py - rd, rd * 2, rd * 2) }
  x.strokeStyle = 'rgba(190,205,235,.55)'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = 0; i < 22; i++) { const px = r() * T, py = r() * T, w = 14 + r() * 22; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + w / 2, py - 5, px + w, py); x.stroke() }
  for (let i = 0; i < 60; i++) { x.fillStyle = r() < .5 ? 'rgba(255,255,255,.95)' : 'rgba(180,215,255,.7)'; const s = 1.5 + r() * 2; x.fillRect(r() * T, r() * T, s, s) }
  return c;
}
function drawGround(x, vw, vh, t) {
  x.fillStyle = groundP; x.fillRect(cam.x - 20, cam.y - 20, vw + 40, vh + 40);
  // đường mòn từ quảng trường làng tỏa ra các khu
  x.lineCap = 'round'; x.strokeStyle = 'rgba(214,224,242,.9)'; x.lineWidth = 120; [[650, 820], [1870, 360], [3010, 1160], [3020, 2080], [640, 2060]].forEach(([tx, ty]) => { x.beginPath(); x.moveTo(1870, 1250); x.lineTo(tx, ty); x.stroke() });
  x.strokeStyle = 'rgba(196,208,232,.6)'; x.lineWidth = 4; x.setLineDash([2, 26]); [[650, 820], [1870, 360], [3010, 1160], [3020, 2080], [640, 2060]].forEach(([tx, ty]) => { x.beginPath(); x.moveTo(1870, 1250); x.lineTo(tx, ty); x.stroke() }); x.setLineDash([]);
  // quảng trường làng (lát đá tuyết)
  x.fillStyle = '#DCE4F2'; x.beginPath(); x.arc(1870, 1250, 270, 0, 7); x.fill(); x.strokeStyle = '#C3CFE6'; x.lineWidth = 6; x.stroke();
  x.strokeStyle = 'rgba(170,186,220,.45)'; x.lineWidth = 3; for (let rad = 80; rad < 270; rad += 60) { x.beginPath(); x.arc(1870, 1250, rad, 0, 7); x.stroke() } for (let a = 0; a < 6.28; a += .52) { x.beginPath(); x.moveTo(1870 + Math.cos(a) * 80, 1250 + Math.sin(a) * 80); x.lineTo(1870 + Math.cos(a) * 270, 1250 + Math.sin(a) * 270); x.stroke() }
  // hang pha lê: nền xanh tím lấp lánh
  x.fillStyle = '#CFD7F6'; x.beginPath(); CAVE.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); x.strokeStyle = '#A9B6E8'; x.lineWidth = 10; x.stroke();
  x.save(); x.clip(); for (let i = 0; i < 40; i++) { const px = 2470 + ((i * 397) % 1100), py = 1560 + ((i * 251) % 1000), tw = .5 + .5 * Math.sin(t / 400 + i); x.fillStyle = 'rgba(255,255,255,' + (.3 + tw * .6) + ')'; x.beginPath(); x.moveTo(px, py - 7); x.lineTo(px + 3, py); x.lineTo(px, py + 7); x.lineTo(px - 3, py); x.closePath(); x.fill() } x.restore();
  // đồi giáng sinh: nền tuyết sáng + vòng đèn
  x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(1870, 380, 380, 230, 0, 0, 7); x.fill();
  // trại xe trượt: sàn gỗ quanh nhà
  x.fillStyle = '#E7D7C3'; rr(x, 290, 1650, 290, 230, 16); x.fill(); x.strokeStyle = 'rgba(160,120,80,.35)'; x.lineWidth = 2; for (let gy = 1665; gy < 1880; gy += 22) { x.beginPath(); x.moveTo(296, gy); x.lineTo(574, gy); x.stroke() }
  // hồ băng
  const g = x.createRadialGradient(LAKE.cx - 120, LAKE.cy - 120, 40, LAKE.cx, LAKE.cy, LAKE.rx); g.addColorStop(0, '#D9F3FF'); g.addColorStop(.7, '#A8DDF7'); g.addColorStop(1, '#8CCBEE');
  x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(LAKE.cx, LAKE.cy, LAKE.rx + 26, LAKE.ry + 26, 0, 0, 7); x.fill();
  x.fillStyle = g; x.beginPath(); x.ellipse(LAKE.cx, LAKE.cy, LAKE.rx, LAKE.ry, 0, 0, 7); x.fill(); x.strokeStyle = '#7FBFE6'; x.lineWidth = 5; x.stroke();
  x.save(); x.beginPath(); x.ellipse(LAKE.cx, LAKE.cy, LAKE.rx, LAKE.ry, 0, 0, 7); x.clip();
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 3; const cr = rng(5); for (let i = 0; i < 9; i++) { let px = LAKE.cx + (cr() - .5) * LAKE.rx * 1.6, py = LAKE.cy + (cr() - .5) * LAKE.ry * 1.6; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (cr() - .5) * 120; py += (cr() - .5) * 120; x.lineTo(px, py) } x.stroke() }
  x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(LAKE.cx - 200 + i * 90, LAKE.cy - 220 + i * 40, 60, 12, -.4, 0, 7); x.fill() } x.restore();
  for (const d of DECO) if (d.k === 'hole') { x.fillStyle = '#2F6FA5'; x.beginPath(); x.ellipse(d.x, d.y, 26, 15, 0, 0, 7); x.fill(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 5; x.stroke(); if ((Math.floor(t / 1600) + d.x) % 5 < 1) { const u = (t % 1600) / 1600; x.fillStyle = '#FFB36B'; x.beginPath(); x.ellipse(d.x - 20 + u * 40, d.y - Math.sin(u * Math.PI) * 40, 9, 5, -.6 + u * 1.2, 0, 7); x.fill() } }
  else if (d.k === 'tuft') { x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(d.x, d.y, 22 * d.s, 9 * d.s, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(190,205,235,.5)'; x.beginPath(); x.ellipse(d.x, d.y + 4 * d.s, 22 * d.s, 5 * d.s, 0, 0, Math.PI); x.fill() }
  // lửa trại: vòng sưởi
  for (const f of FIRES) { const pu = .5 + .5 * Math.sin(t / 300); const gg = x.createRadialGradient(f.x, f.y, 10, f.x, f.y, 130); gg.addColorStop(0, 'rgba(255,180,90,' + (.35 + pu * .1) + ')'); gg.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = gg; x.beginPath(); x.arc(f.x, f.y, 130, 0, 7); x.fill() }
  // bảng tên khu
  for (const A of AREAS) drawSign(x, A.sx, A.sy, A.name);
}
function drawSign(x, X, Y, txt) {
  x.font = F(22); const w = x.measureText(txt).width + 30;
  x.fillStyle = '#8A5A33'; x.fillRect(X - 5, Y - 6, 10, 40); x.strokeStyle = O; x.lineWidth = 3; x.strokeRect(X - 5, Y - 6, 10, 40);
  rr(x, X - w / 2, Y - 44, w, 38, 10); x.fillStyle = '#B47A48'; x.fill(); x.stroke(); x.fillStyle = '#FFFFFF'; rr(x, X - w / 2 + 3, Y - 47, w - 6, 9, 5); x.fill();
  x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 4; x.strokeStyle = O; x.strokeText(txt, X, Y - 24); x.fillText(txt, X, Y - 24);
}
/* ═════ vẽ: cây, lều tuyết, người tuyết, pha lê, nhà gỗ… ═════ */
function shadow(x, X, Y, rx, ry) { x.fillStyle = 'rgba(40,60,110,.18)'; x.beginPath(); x.ellipse(X, Y, rx, ry, 0, 0, 7); x.fill() }
function drawObs(x, o, t) {
  const X = o.x, Y = o.y; x.lineJoin = 'round'; x.strokeStyle = O; x.lineWidth = 3.5;
  if (o.k === 'pine' || o.k === 'bigtree') {
    const s = o.r / 34; shadow(x, X + 8, Y + 6, o.r * 1.2, o.r * .45);
    x.fillStyle = '#8A5A33'; x.fillRect(X - 7 * s, Y - 18 * s, 14 * s, 22 * s); x.strokeRect(X - 7 * s, Y - 18 * s, 14 * s, 22 * s);
    [[0, 62, 46], [1, 46, 38], [2, 30, 28]].forEach(([i, w, h]) => { const by = Y - 14 * s - i * 30 * s; x.fillStyle = i % 2 ? '#2F9B63' : '#287F55'; x.beginPath(); x.moveTo(X - w * s, by); x.lineTo(X, by - h * 1.4 * s); x.lineTo(X + w * s, by); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(X - w * s * .55, by - h * .62 * s); x.lineTo(X, by - h * 1.4 * s); x.lineTo(X + w * s * .55, by - h * .62 * s); for (let k = 4; k >= 0; k--) x.lineTo(X - w * s * .55 + k * w * s * .275, by - h * .62 * s + (k % 2 ? 7 : 0) * s); x.closePath(); x.fill(); x.lineWidth = 2.5; x.stroke(); x.lineWidth = 3.5 });
    if (o.k === 'bigtree') {
      [[-34, -50], [26, -62], [-14, -92], [20, -118], [-24, -128], [6, -150], [-40, -24], [40, -28]].forEach(([a, b], i) => { const on = (Math.floor(t / 400) + i) % 3; x.fillStyle = ['#FF5C7A', '#FFD84C', '#4CC3FF', '#C79BFF'][i % 4]; x.globalAlpha = on ? 1 : .55; x.beginPath(); x.arc(X + a * s, Y + b * s, 7 * s, 0, 7); x.fill(); x.lineWidth = 2; x.stroke(); x.globalAlpha = 1 });
      const sy = Y - 196 * s, gl = x.createRadialGradient(X, sy, 0, X, sy, 60 * s); gl.addColorStop(0, 'rgba(255,230,128,.7)'); gl.addColorStop(1, 'rgba(255,230,128,0)'); x.fillStyle = gl; x.fillRect(X - 60 * s, sy - 60 * s, 120 * s, 120 * s);
      x.fillStyle = '#FFD84C'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rd = (i % 2 ? 9 : 20) * s; x.lineTo(X + Math.cos(a) * rd, sy + Math.sin(a) * rd) } x.closePath(); x.fill(); x.lineWidth = 3; x.stroke();
    }
  } else if (o.k === 'igloo') {
    shadow(x, X + 10, Y + 8, o.r * 1.15, o.r * .42);
    const g = x.createRadialGradient(X - 30, Y - 70, 10, X, Y - 30, o.r * 1.1); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C8DDF4');
    x.fillStyle = g; x.beginPath(); x.ellipse(X, Y, o.r, o.r * .95, 0, Math.PI, 0); x.lineTo(X + o.r, Y + 6); x.lineTo(X - o.r, Y + 6); x.closePath(); x.fill(); x.stroke();
    x.save(); x.clip(); x.strokeStyle = 'rgba(120,150,200,.55)'; x.lineWidth = 2.5; for (let k = 1; k < 4; k++) { x.beginPath(); x.ellipse(X, Y, o.r, o.r * .95 * k / 4 + o.r * .1, 0, Math.PI, 0); x.stroke() } for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(X + k * o.r / 3.5, Y); x.lineTo(X + k * o.r / 3.5 * .9, Y - o.r * .25 * (1 + (k + 4) % 2)); x.stroke() } x.restore();
    x.fillStyle = '#DCEBFA'; x.beginPath(); x.ellipse(X, Y + 2, 30, 34, 0, Math.PI, 0); x.lineTo(X + 30, Y + 10); x.lineTo(X - 30, Y + 10); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#2D3A66'; x.beginPath(); x.ellipse(X, Y + 6, 18, 24, 0, Math.PI, 0); x.lineTo(X + 18, Y + 8); x.lineTo(X - 18, Y + 8); x.closePath(); x.fill();
  } else if (o.k === 'snowman') {
    shadow(x, X + 6, Y + 4, 30, 10);
    [[0, 0, 26], [0, -32, 20], [0, -58, 15]].forEach(([a, b, r]) => { x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(X + a, Y + b - 10, r, 0, 7); x.fill(); x.stroke() });
    x.fillStyle = O; x.beginPath(); x.arc(X - 5, Y - 72, 2.6, 0, 7); x.arc(X + 5, Y - 72, 2.6, 0, 7); x.fill(); x.fillStyle = '#FF8A3C'; x.beginPath(); x.moveTo(X, Y - 67); x.lineTo(X + 16, Y - 64); x.lineTo(X, Y - 62); x.closePath(); x.fill();
    x.fillStyle = o.c; x.fillRect(X - 18, Y - 56, 36, 7); x.fillRect(X + 6, Y - 52, 8, 16); x.fillStyle = O; x.fillRect(X - 13, Y - 96, 26, 18); x.fillRect(X - 19, Y - 80, 38, 5);
    x.fillStyle = O; [[-12, -22], [12, -22]].forEach(([a]) => { }); x.fillRect(X - 1.5, Y - 46, 3, 3); x.fillRect(X - 1.5, Y - 36, 3, 3);
  } else if (o.k === 'lantern') {
    x.fillStyle = '#5A4630'; x.fillRect(X - 3, Y - 70, 6, 72); x.strokeRect(X - 3, Y - 70, 6, 72);
    const gl = x.createRadialGradient(X, Y - 80, 0, X, Y - 80, 40); gl.addColorStop(0, 'rgba(255,220,130,.8)'); gl.addColorStop(1, 'rgba(255,220,130,0)'); x.fillStyle = gl; x.fillRect(X - 40, Y - 120, 80, 80);
    x.fillStyle = '#FFE08A'; rr(x, X - 10, Y - 92, 20, 24, 5); x.fill(); x.lineWidth = 2.5; x.stroke(); x.fillStyle = '#C0392B'; x.fillRect(X - 12, Y - 96, 24, 5);
  } else if (o.k === 'cabin') {
    shadow(x, X + 14, Y + 10, 120, 30);
    x.fillStyle = '#9C6A3A'; x.fillRect(X - 95, Y - 90, 190, 96); x.strokeRect(X - 95, Y - 90, 190, 96);
    x.strokeStyle = 'rgba(60,35,15,.45)'; x.lineWidth = 2; for (let gy = Y - 78; gy < Y + 6; gy += 14) { x.beginPath(); x.moveTo(X - 95, gy); x.lineTo(X + 95, gy); x.stroke() } x.strokeStyle = O; x.lineWidth = 3.5;
    x.fillStyle = '#6B4424'; x.beginPath(); x.moveTo(X - 112, Y - 86); x.lineTo(X, Y - 160); x.lineTo(X + 112, Y - 86); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(X - 112, Y - 86); x.lineTo(X, Y - 160); x.lineTo(X + 112, Y - 86); x.lineTo(X + 90, Y - 98); x.lineTo(X, Y - 146); x.lineTo(X - 90, Y - 98); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#5A3418'; x.fillRect(X - 18, Y - 46, 36, 52); x.strokeRect(X - 18, Y - 46, 36, 52);
    x.fillStyle = '#FFE08A'; [[-62, -62], [44, -62]].forEach(([a, b]) => { x.fillRect(X + a, Y + b, 22, 20); x.strokeRect(X + a, Y + b, 22, 20) });
    x.fillStyle = '#7A7A85'; x.fillRect(X + 50, Y - 150, 18, 40); x.strokeRect(X + 50, Y - 150, 18, 40);
    if (S.tick % 30 < 1) PT.push({ x: X + 59, y: Y, z: 160, vx: .4, vy: 0, vz: .8, life: 90, max: 90, col: 'rgba(220,220,235,.6)', r: 9 });
  } else if (o.k === 'sleigh') {
    const f = o.f || 1; shadow(x, X + 6, Y + 6, 58, 14); x.save(); x.translate(X, Y); x.scale(f, 1);
    x.strokeStyle = '#C79B3C'; x.lineWidth = 5; x.beginPath(); x.moveTo(-54, 0); x.lineTo(44, 0); x.quadraticCurveTo(62, 0, 58, -16); x.stroke();
    x.strokeStyle = O; x.lineWidth = 3.5; x.fillStyle = '#E0344F'; x.beginPath(); x.moveTo(-50, -8); x.lineTo(40, -8); x.quadraticCurveTo(50, -44, 30, -48); x.lineTo(-30, -48); x.quadraticCurveTo(-56, -40, -50, -8); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#FFD84C'; x.fillRect(-36, -30, 64, 6); x.fillStyle = '#4CC3FF'; rr(x, -26, -70, 30, 26, 4); x.fill(); x.stroke(); x.fillStyle = '#FF5C7A'; x.fillRect(-14, -70, 6, 26); x.restore();
  } else if (o.k === 'log') { shadow(x, X + 4, Y + 4, 44, 10); x.fillStyle = '#8A5A33'; rr(x, X - 42, Y - 24, 84, 24, 12); x.fill(); x.stroke(); x.fillStyle = '#C99A62'; x.beginPath(); x.ellipse(X + 38, Y - 12, 8, 12, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#FFFFFF'; rr(x, X - 40, Y - 28, 70, 9, 5); x.fill() }
  else if (o.k === 'fence') { x.fillStyle = '#9C6A3A'; x.fillRect(X - 5, Y - 40, 10, 42); x.strokeRect(X - 5, Y - 40, 10, 42); x.fillRect(X - 30, Y - 30, 60, 6); x.fillStyle = '#FFFFFF'; x.fillRect(X - 6, Y - 44, 12, 5) }
  else if (o.k === 'rock') { shadow(x, X + 6, Y + 4, o.r * 1.1, o.r * .4); x.fillStyle = '#8D97AE'; x.beginPath(); x.ellipse(X, Y - o.r * .4, o.r, o.r * .75, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(X - o.r * .1, Y - o.r * .8, o.r * .7, o.r * .32, 0, 0, 7); x.fill() }
  else if (o.k === 'crystal') {
    shadow(x, X + 6, Y + 4, o.r * 1.1, o.r * .4); const gl = x.createRadialGradient(X, Y - 30, 0, X, Y - 30, o.r * 2); gl.addColorStop(0, o.c + '77'); gl.addColorStop(1, o.c + '00'); x.fillStyle = gl; x.fillRect(X - o.r * 2, Y - 30 - o.r * 2, o.r * 4, o.r * 4);
    [[-o.r * .45, 0, o.r * .38, o.r * 1.6], [o.r * .4, 2, o.r * .32, o.r * 1.2], [0, 4, o.r * .48, o.r * 2.1]].forEach(([a, b, w, h]) => { x.fillStyle = o.c; x.beginPath(); x.moveTo(X + a - w, Y + b); x.lineTo(X + a - w, Y + b - h * .7); x.lineTo(X + a, Y + b - h); x.lineTo(X + a + w, Y + b - h * .7); x.lineTo(X + a + w, Y + b); x.closePath(); x.fill(); x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(X + a - w * .5, Y + b - h * .65, w * .35, h * .5) });
  } else if (o.k === 'gift') { shadow(x, X + 4, Y + 4, 26, 9); x.fillStyle = o.c; x.fillRect(X - 20, Y - 34, 40, 34); x.strokeRect(X - 20, Y - 34, 40, 34); x.fillStyle = lt(o.c, .3); x.fillRect(X - 23, Y - 42, 46, 10); x.strokeRect(X - 23, Y - 42, 46, 10); x.fillStyle = '#FFFFFF'; x.fillRect(X - 4, Y - 42, 8, 42); x.beginPath(); x.ellipse(X - 9, Y - 46, 9, 6, -.4, 0, 7); x.ellipse(X + 9, Y - 46, 9, 6, .4, 0, 7); x.fill(); x.stroke() }
}
function drawFire(x, f, t) {
  shadow(x, f.x, f.y + 4, 40, 12);
  x.fillStyle = '#8A8FA0'; for (let i = 0; i < 8; i++) { const a = i * .785; x.beginPath(); x.ellipse(f.x + Math.cos(a) * 30, f.y + Math.sin(a) * 14, 9, 7, 0, 0, 7); x.fill(); x.strokeStyle = O; x.lineWidth = 2; x.stroke() }
  x.fillStyle = '#7A4A26'; x.save(); x.translate(f.x, f.y - 4); x.rotate(.4); x.fillRect(-26, -5, 52, 10); x.rotate(-.8); x.fillRect(-26, -5, 52, 10); x.restore();
  for (let i = 0; i < 3; i++) { const h = 40 + Math.sin(t / 90 + i * 2) * 8 - i * 9, w = 16 - i * 4; x.fillStyle = ['#FF6B2C', '#FFB02E', '#FFF07A'][i]; x.beginPath(); x.moveTo(f.x - w, f.y - 6); x.quadraticCurveTo(f.x - w * .6, f.y - h * .6, f.x + Math.sin(t / 120 + i) * 4, f.y - h); x.quadraticCurveTo(f.x + w * .6, f.y - h * .6, f.x + w, f.y - 6); x.closePath(); x.fill() }
  if (S.tick % 6 === 0) PT.push({ x: f.x + (Math.random() - .5) * 20, y: f.y, z: 40, vx: (Math.random() - .5) * .6, vy: 0, vz: 1.2, life: 40, max: 40, col: '#FFB02E', r: 2.5 });
}
/* ═════ vẽ: nhân vật — người sống sót đội mũ len, xác ướp quấn băng mắt đỏ ═════ */
function gim(x, o) {
  const s = o.scale || 1, w = 56 * s, h = 48 * s, cx = o.X, gy = o.Y - (o.z || 0), cur = o.cur, c = cur ? '#D6DBE8' : o.c;
  if (o.safe) x.globalAlpha = .38; else if (o.alpha != null) x.globalAlpha = o.alpha;
  if (!o.noShadow) shadow(x, cx, o.Y + 3, w * .46, 9 * s);
  const wk = o.walk || 0; x.lineWidth = 3.5; x.strokeStyle = O;
  [-1, 1].forEach(sd => { const lift = Math.max(0, Math.sin(wk + (sd > 0 ? Math.PI : 0))) * 5 * s; rr(x, cx + sd * w * .22 - w * .14, gy - h * .14 - lift, w * .28, h * .26, h * .12); x.fillStyle = cur ? '#B7BFD2' : dk(c, .25); x.fill(); x.stroke() });
  const bob = Math.abs(Math.sin(wk)) * 2 * s, top = gy - h - bob, bot = gy - h * .08;
  const body = () => { x.beginPath(); x.moveTo(cx - w / 2, bot - h * .22); x.bezierCurveTo(cx - w / 2, top - h * .08, cx + w / 2, top - h * .08, cx + w / 2, bot - h * .22); x.quadraticCurveTo(cx + w / 2, bot, cx + w * .36, bot); x.lineTo(cx - w * .36, bot); x.quadraticCurveTo(cx - w / 2, bot, cx - w / 2, bot - h * .22); x.closePath() };
  body(); const g = x.createLinearGradient(0, top, 0, bot); g.addColorStop(0, lt(c, .3)); g.addColorStop(.55, c); g.addColorStop(1, dk(c, .14));
  x.fillStyle = o.flash ? '#FFFFFF' : g; x.fill(); x.lineWidth = 4 * Math.max(.8, s * .9); x.strokeStyle = O; x.stroke();
  x.save(); body(); x.clip();
  if (cur) { x.strokeStyle = 'rgba(140,150,175,.85)'; x.lineWidth = 3; for (let k = -3; k < 5; k++) { x.beginPath(); x.moveTo(cx - w, top + k * h * .24); x.lineTo(cx + w, top + k * h * .24 + h * .3); x.stroke() } x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; for (let k = -3; k < 5; k++) { x.beginPath(); x.moveTo(cx - w, top + k * h * .24 + 4); x.lineTo(cx + w, top + k * h * .24 + h * .3 + 4); x.stroke() } }
  else { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(cx - w * .22, top + h * .26, w * .13, h * .08, -.5, 0, 7); x.fill(); x.fillStyle = o.sc || dk(c, .05); x.fillRect(cx - w, bot - h * .3, w * 2, h * .14); x.fillStyle = 'rgba(255,255,255,.4)'; for (let k = -3; k <= 3; k++) x.fillRect(cx + k * w * .14, bot - h * .3, w * .05, h * .14) }
  x.restore();
  // mắt (nhìn theo hướng ngắm) · xác ướp: mắt đỏ phát sáng trong khe băng
  const a = o.a || 0, ex = Math.cos(a) * w * .09, ey = Math.sin(a) * h * .05, eyY = top + h * .5 + ey, blink = (S.tick + (o.seed || 0)) % 230 < 6;
  if (cur) { x.fillStyle = '#2A2F45'; rr(x, cx - w * .36 + ex, eyY - h * .12, w * .72, h * .24, h * .1); x.fill(); [-1, 1].forEach(sd => { const px = cx + ex + sd * w * .15, gl = x.createRadialGradient(px, eyY, 0, px, eyY, 11 * s); gl.addColorStop(0, 'rgba(255,60,60,.9)'); gl.addColorStop(1, 'rgba(255,60,60,0)'); x.fillStyle = gl; x.fillRect(px - 11 * s, eyY - 11 * s, 22 * s, 22 * s); x.fillStyle = '#FF4040'; x.beginPath(); x.ellipse(px, eyY, 4.6 * s, 3.6 * s, 0, 0, 7); x.fill() }) }
  else if (o.stun) { x.strokeStyle = O; x.lineWidth = 3.5; x.lineCap = 'round'; [-1, 1].forEach(sd => { const px = cx + ex + sd * w * .14; x.beginPath(); x.moveTo(px - 5 * s, eyY - 5 * s); x.lineTo(px + 5 * s, eyY + 5 * s); x.moveTo(px + 5 * s, eyY - 5 * s); x.lineTo(px - 5 * s, eyY + 5 * s); x.stroke() }) }
  else [-1, 1].forEach(sd => { x.fillStyle = O; x.beginPath(); x.ellipse(cx + ex + sd * w * .14, eyY, 4.4 * s, blink ? 1.2 * s : 8.4 * s, 0, 0, 7); x.fill(); if (!blink) { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(cx + ex + sd * w * .14 - 1.2 * s, eyY - 4 * s, 1.5 * s, 0, 7); x.fill() } });
  // mũ len có quả bông (người) · dải băng bay (xác ướp)
  if (!cur) { const hc = o.hat || lt(c, .1); x.fillStyle = hc; x.beginPath(); x.ellipse(cx, top + h * .12, w * .4, h * .2, 0, Math.PI, 0); x.closePath(); x.fill(); x.lineWidth = 3; x.stroke(); x.fillStyle = '#FFFFFF'; rr(x, cx - w * .42, top + h * .08, w * .84, h * .12, 5); x.fill(); x.stroke(); x.beginPath(); x.arc(cx, top - h * .1, 7 * s, 0, 7); x.fill(); x.stroke() }
  else { x.strokeStyle = '#D6DBE8'; x.lineWidth = 5; x.lineCap = 'round'; const fl = Math.sin(S.tick * .2) * 6; x.beginPath(); x.moveTo(cx - w * .4, top + h * .3); x.quadraticCurveTo(cx - w * .7, top + h * .2 + fl, cx - w * .85, top + h * .4 - fl); x.stroke(); x.strokeStyle = O; x.lineWidth = 1.5; x.stroke() }
  x.globalAlpha = 1;
  if (o.frz) { x.fillStyle = 'rgba(170,225,255,.5)'; rr(x, cx - w * .62, gy - h * 1.25, w * 1.24, h * 1.3, 10); x.fill(); x.strokeStyle = '#E6F7FF'; x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(cx - w * .5, gy - h * 1.15, w * .16, h * .7) }
  if (o.safe) { x.font = F(22, 400); x.textAlign = 'center'; x.textBaseline = 'middle'; x.globalAlpha = .9; x.fillText('📝', cx + w * .5, gy - h * 1.2); x.globalAlpha = 1 }
  if (o.torch) { const gl = x.createRadialGradient(cx, gy - h * .5, 10, cx, gy - h * .5, 190); gl.addColorStop(0, 'rgba(255,170,80,.25)'); gl.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = gl; x.beginPath(); x.arc(cx, gy - h * .5, 190, 0, 7); x.fill(); x.font = F(24, 400); x.textAlign = 'center'; x.fillText('🔥', cx + w * .55, gy - h * .7) }
  if (o.slow) { x.strokeStyle = 'rgba(181,123,255,.85)'; x.lineWidth = 3; for (let i = 0; i < 2; i++) { const an = S.tick * .12 + i * Math.PI; x.beginPath(); x.ellipse(cx, gy - h * .1, w * .55, h * .16, 0, an, an + 2.2); x.stroke() } }
  if (o.spd) { x.strokeStyle = 'rgba(200,190,255,.85)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { const yy = gy - h * (.3 + i * .2); x.beginPath(); x.moveTo(cx - (o.f || 1) * w * .55, yy); x.lineTo(cx - (o.f || 1) * w * (.9 + i * .1), yy); x.stroke() } }
}
function tag(x, cx, y, n, mine, cur, hp, sd, k, bar) {   // tên dưới chân + thanh máu nhỏ (người)
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  const nm = (cur ? '🧟 ' : '') + (n.length > 15 ? n.slice(0, 14) + '…' : n) + (k ? '  ⭐' + k : '');
  x.font = F(16); x.lineWidth = 5; x.strokeStyle = O; x.strokeText(nm, cx, y + 16); x.fillStyle = mine ? '#FFE680' : cur ? '#D9DEEA' : '#FFFFFF'; x.fillText(nm, cx, y + 16);
  if (!cur || bar) { /* thanh máu luôn hiện trên người sống sót (và trên bot khi đấu bot) */ const bw = 66; rr(x, cx - bw / 2, y + 28, bw, 11, 5); x.fillStyle = 'rgba(29,35,64,.8)'; x.fill(); rr(x, cx - bw / 2 + 1.5, y + 29.5, (bw - 3) * clamp(hp / 100, 0, 1), 8, 4); x.fillStyle = cur ? '#B57BFF' : hp > 50 ? '#5BD17A' : hp > 25 ? '#FFC44D' : '#FF5C7A'; x.fill(); if (sd > 0) { rr(x, cx - bw / 2 + 1.5, y + 41, (bw - 3) * clamp(sd / 100, 0, 1), 5, 2.5); x.fillStyle = '#6FB8FF'; x.fill() } }
}
function drawItem(x, it, t) {
  const age = t - it.t0, left = it.t0 + ILIFE - t; if (left < 3000 && Math.floor(t / 150) % 2) return;
  const sp = clamp(age / 400, .05, 1), y = it.y - 30 + Math.sin(t / 300 + it.k) * 5, r = 21 * sp;
  shadow(x, it.x, it.y + 2, 18 * sp, 6 * sp);
  const g = x.createRadialGradient(it.x, y, 0, it.x, y, r * 2.2); g.addColorStop(0, it.ty.col + 'AA'); g.addColorStop(1, it.ty.col + '00'); x.fillStyle = g; x.fillRect(it.x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(it.x, y, r, 0, 7); x.fill(); x.lineWidth = 3; x.strokeStyle = O; x.stroke();
  x.font = F(Math.round(24 * sp), 400); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it.ty.ic, it.x, y + 1);
}
function drawShot(x, s) {
  if (s.orb) { const z = 30; shadow(x, s.x, s.y + 3, 9, 3); for (let i = 0; i < s.tr.length; i += 2) { x.globalAlpha = i / s.tr.length * .5; x.fillStyle = '#B57BFF'; x.beginPath(); x.arc(s.tr[i], s.tr[i + 1] - z, 7, 0, 7); x.fill() } x.globalAlpha = 1; const g = x.createRadialGradient(s.x, s.y - z, 0, s.x, s.y - z, 22); g.addColorStop(0, 'rgba(200,140,255,.9)'); g.addColorStop(1, 'rgba(200,140,255,0)'); x.fillStyle = g; x.fillRect(s.x - 22, s.y - z - 22, 44, 44); x.fillStyle = '#6A2FB8'; x.beginPath(); x.arc(s.x, s.y - z, 10, 0, 7); x.fill(); x.strokeStyle = '#E8D4FF'; x.lineWidth = 2.5; x.stroke(); x.fillStyle = '#FF5C7A'; x.beginPath(); x.arc(s.x - 3, s.y - z - 1, 2.4, 0, 7); x.arc(s.x + 3, s.y - z - 1, 2.4, 0, 7); x.fill(); return }
  const u = 1 - s.life / SBL, z = 24 + Math.sin(Math.min(1, u * 1.2) * Math.PI) * 18;
  shadow(x, s.x, s.y + 3, 8, 3);
  for (let i = 0; i < s.tr.length; i += 2) { x.globalAlpha = i / s.tr.length * .4; x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(s.tr[i], s.tr[i + 1] - z, 6, 0, 7); x.fill() }
  x.globalAlpha = 1; x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(s.x, s.y - z, 9, 0, 7); x.fill(); x.strokeStyle = '#9DB2D8'; x.lineWidth = 2.5; x.stroke(); x.fillStyle = '#DCE8FA'; x.beginPath(); x.arc(s.x + 3, s.y - z + 3, 4, 0, 7); x.fill();
}
function drawFx(x) {
  for (const p of PT) {
    const a = p.life / p.max, py = p.y - (p.z || 0);
    if (p.ring) { x.globalAlpha = a; x.strokeStyle = p.col; x.lineWidth = 4 * a + 1; x.beginPath(); x.ellipse(p.x, py, p.ring * (1.4 - a) * 1.3, p.ring * (1.4 - a) * .6, 0, 0, 7); x.stroke() }
    else if (p.txt) { x.globalAlpha = Math.min(1, a * 2); x.font = F(p.txt.length > 2 ? 19 : 22); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 5; x.strokeStyle = O; x.strokeText(p.txt, p.x, py); x.fillStyle = p.col; x.fillText(p.txt, p.x, py) }
    else { x.globalAlpha = a; x.fillStyle = p.col; x.beginPath(); x.arc(p.x, py, p.r * (.5 + a * .5), 0, 7); x.fill() }
  }
  x.globalAlpha = 1;
}
/* ═════ vẽ: khung hình ═════ */
function draw(ts) {
  if (!groundP) groundP = ctx.createPattern(makeGround(), 'repeat');
  const t = now(), dark = darkAt(t), bliz = blizAt(t), vw = cw / sc, vh = ch / sc, tn = performance.now();
  cam.x += (clamp(pl.x - vw / 2, -40, W + 40 - vw) - cam.x) * .14; cam.y += (clamp(pl.y - 40 - vh / 2, -40, H + 40 - vh) - cam.y) * .14;
  const sx = shake > .4 ? (Math.random() - .5) * shake : 0, sy = shake > .4 ? (Math.random() - .5) * shake : 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#DDE6F5'; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, (-cam.x * sc + sx) * dpr, (-cam.y * sc + sy) * dpr);
  drawGround(ctx, vw, vh, tn);
  const vis = (x, y, m) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - m && y < cam.y + vh + m + 120;
  const L = [];
  for (const o of OBS) if (vis(o.x, o.y, 220)) L.push({ y: o.y, f: () => drawObs(ctx, o, tn) });
  for (const f of FIRES) if (vis(f.x, f.y, 120)) L.push({ y: f.y, f: () => drawFire(ctx, f, tn) });
  for (const it of activeItems(t)) if (vis(it.x, it.y, 80)) L.push({ y: it.y, f: () => drawItem(ctx, it, t) });
  for (const id in R) { const r = R[id]; if (!r.buf.length || tn - r.last > 4000) continue; r.near = Math.hypot(r.x - pl.x, r.y - pl.y) < 900; if (!vis(r.x, r.y, 120)) continue; const cur = !!(r.s & 4096); L.push({ y: r.y, f: () => { gim(ctx, { X: r.x, Y: r.y, c: r.c, a: r.a, f: r.f, walk: r.walk, cur, flash: r.flash > 0, safe: r.s & 1, frz: r.s & 256, torch: r.s & 64, spd: r.s & 8, slow: r.s & 2, stun: (r.s & 1024) || (r.s & 8192), alpha: r.s & 8192 ? .35 : r.s & 4 ? (Math.floor(tn / 90) % 2 ? .45 : 1) : null, seed: id.length * 37 }); tag(ctx, r.x, r.y, r.n, false, cur, r.hp, r.sd, r.k, true) } }) }
  for (const b of bots) { b.near = true; if (!vis(b.x, b.y, 120)) continue; L.push({ y: b.y, f: () => { gim(ctx, { X: b.x, Y: b.y, c: b.c, a: b.a, f: b.face, walk: b.walk, cur: b.cur, flash: b.flash > 0, stun: b.stun > 0, frz: b.frz > 0, torch: b.torch > 0, spd: b.spd > 0, slow: b.slow > 0, alpha: b.inv > 0 ? (Math.floor(tn / 90) % 2 ? .5 : 1) : null, seed: 91 }); tag(ctx, b.x, b.y, b.n, false, b.cur, b.hp, b.shd, 0, botMode) } }) }
  L.push({ y: pl.y, f: () => { gim(ctx, { X: pl.x, Y: pl.y, c: S.color, a: pl.a, f: pl.face, walk: pl.walk, cur: pl.cur, flash: pl.flash > 0, frz: pl.frz > 0, torch: pl.torch > 0, spd: pl.spd > 0, slow: pl.slow > 0, safe: safe() && !S.over, stun: pl.stun > 0 || pl.ko > 0, alpha: pl.ko > 0 ? .35 : pl.inv > 0 && S.running ? (Math.floor(tn / 90) % 2 ? .5 : 1) : null, seed: 3 }); tag(ctx, pl.x, pl.y, S.name || 'Em', true, pl.cur, pl.hp, pl.shd, S.score, true) } });
  L.sort((a, z) => a.y - z.y).forEach(o => o.f());
  for (const s of SH) if (vis(s.x, s.y, 40)) drawShot(ctx, s);
  drawFx(ctx);
  // bóng tối ban đêm: chừa ánh sáng quanh em, các bạn người, lửa trại, đèn lồng, pha lê
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (dark > .02) {
    if (!nightC || nightC.width !== cv.width || nightC.height !== cv.height) { nightC = document.createElement('canvas'); nightC.width = cv.width; nightC.height = cv.height }
    const n = nightC.getContext('2d'), toS = (x, y) => [(x - cam.x) * sc * dpr, (y - cam.y) * sc * dpr];
    n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, nightC.width, nightC.height); n.fillStyle = 'rgba(10,16,48,' + dark + ')'; n.fillRect(0, 0, nightC.width, nightC.height);
    n.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r0) => { const [px, py] = toS(x, y), rd = r0 * sc * dpr; if (px < -rd || py < -rd || px > nightC.width + rd || py > nightC.height + rd) return; const g = n.createRadialGradient(px, py, rd * .2, px, py, rd); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = g; n.beginPath(); n.arc(px, py, rd, 0, 7); n.fill() };
    hole(pl.x, pl.y - 30, pl.cur ? 340 : 290); for (const f of FIRES) hole(f.x, f.y - 20, 320 + Math.sin(tn / 200) * 10); for (const o of OBS) if (o.k === 'lantern') hole(o.x, o.y - 80, 190); else if (o.k === 'crystal') hole(o.x, o.y - 30, 110); else if (o.k === 'bigtree') hole(o.x, o.y - 120, 260); else if (o.k === 'cabin') hole(o.x, o.y - 50, 150);
    for (const b of bots) if (!b.cur) hole(b.x, b.y - 30, b.torch > 0 ? 220 : 130); for (const id in R) { const r = R[id]; if (!(r.s & 4096)) hole(r.x, r.y - 30, r.s & 64 ? 220 : 130) }
    ctx.drawImage(nightC, 0, 0, cw, ch);
    // cực quang trên trời đêm
    ctx.globalAlpha = Math.min(1, dark * 1.2) * .5; for (let i = 0; i < 3; i++) { const yb = 30 + i * 26, g = ctx.createLinearGradient(0, yb - 30, 0, yb + 40); g.addColorStop(0, 'rgba(120,255,200,0)'); g.addColorStop(.5, ['rgba(120,255,200,.55)', 'rgba(140,180,255,.5)', 'rgba(220,140,255,.45)'][i]); g.addColorStop(1, 'rgba(120,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, yb + 40); for (let xx = 0; xx <= cw; xx += 30) ctx.lineTo(xx, yb + Math.sin(xx / 140 + tn / 1600 + i) * 18); ctx.lineTo(cw, yb + 40); ctx.closePath(); ctx.fill() } ctx.globalAlpha = 1;
    // xác ướp trong bóng tối: mắt đỏ vẫn thấy được
    const eyes = (x, y) => { const px = (x - cam.x) * sc, py = (y - 40 - cam.y) * sc; if (px < -20 || py < -20 || px > cw + 20 || py > ch + 20) return; ctx.fillStyle = 'rgba(255,70,70,' + (dark + .1) + ')'; ctx.beginPath(); ctx.ellipse(px - 7 * sc, py, 3.6 * sc, 2.8 * sc, 0, 0, 7); ctx.ellipse(px + 7 * sc, py, 3.6 * sc, 2.8 * sc, 0, 0, 7); ctx.fill() };
    for (const b of bots) if (b.cur) eyes(b.x, b.y); for (const id in R) if (R[id].s & 4096) eyes(R[id].x, R[id].y);
  }
  // tuyết rơi (bão tuyết thì dày & bay ngang)
  const want = bliz.on ? 420 : 110; while (flakes.length < want) flakes.push({ x: Math.random() * cw, y: Math.random() * ch, s: 1 + Math.random() * 2.6, v: .6 + Math.random() * 1.4 }); if (flakes.length > want) flakes.length = want;
  ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const f of flakes) { f.y += f.v * (bliz.on ? 3 : 1) + (bliz.on ? bliz.dy * 5 : 0); f.x += Math.sin((f.y + f.s * 50) / 60) * .4 + (bliz.on ? bliz.dx * 7 : -.3); if (f.y > ch + 5) f.y = -5; if (f.y < -6) f.y = ch + 4; if (f.x < -5) f.x = cw + 5; if (f.x > cw + 6) f.x = -4; ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, 7); ctx.fill() }
  if (bliz.on) { ctx.fillStyle = 'rgba(230,240,255,.28)'; ctx.fillRect(0, 0, cw, ch) }
  for (const o of everyone().filter(b => b !== pl).concat(Object.values(R).filter(r => r.buf.length && tn - r.last < 4000))) { const cur = o.bot ? o.cur : !!(o.s & 4096), px = (o.x - cam.x) * sc, py = (o.y - 30 - cam.y) * sc; if (px > 0 && px < cw && py > 0 && py < ch) continue; const ax = clamp(px, 26, cw - 26), ay = clamp(py, 120, ch - 26), an = Math.atan2(py - ay, px - ax); ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.fillStyle = cur ? '#FF5C5C' : (o.c || '#fff'); ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore() }
  if (!pl.cur && S.running && t - T0 > GRACE) { let nd = 1e9; for (const b of bots) if (b.cur) nd = Math.min(nd, Math.hypot(b.x - pl.x, b.y - pl.y)); for (const id in R) { const r = R[id]; if ((r.s & 4096) && !(r.s & 256) && tn - r.last < 3000) nd = Math.min(nd, Math.hypot(r.x - pl.x, r.y - pl.y)) }
    if (nd < 560) { const k = (1 - nd / 560) * (.55 + .45 * Math.sin(tn / (nd < 260 ? 90 : 160))), g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * .32, cw / 2, ch / 2, Math.max(cw, ch) * .72); g.addColorStop(0, 'rgba(255,40,70,0)'); g.addColorStop(1, 'rgba(255,40,70,' + clamp(k * .6, 0, .6).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch) } }   /* 💓 xác ướp càng gần viền đỏ càng đập nhanh */
  drawHUD(tn, t, dark); const fy = drawMini(tn); drawFeed(tn, fy); drawBanner(tn);
  if (flashT > 0) { ctx.fillStyle = 'rgba(200,180,255,' + flashT / 25 + ')'; ctx.fillRect(0, 0, cw, ch) }
}
function mBoost() { const [c, n] = counts(), s = n - c; return c > 0 ? clamp(s / (c * 2), 1, 1.6) : 1 }   /* 1 xác ướp / 3 người → ×1,5: chạy nhanh hơn, đánh đau hơn, chịu đòn tốt hơn */
function counts() { let c = 0, n = 0; for (const b of everyone()) { n++; if (b.cur) c++ } for (const id in R) if (performance.now() - R[id].last < 4000) { n++; if (R[id].s & 4096) c++ } return [c, n] }
function drawHUD(tn, t, dark) {   // góc trên trái: vai · máu & khăn (người) / giải lời nguyền (xác ướp) · số xác ướp · giờ đêm
  const small = ch < 460 || cw < 700, x0 = 12, y = 10, w = small ? 200 : 240, hh = small ? 70 : 112;
  rr(ctx, x0, y, w, hh, 14); ctx.fillStyle = 'rgba(20,28,60,.72)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pl.cur ? '#C9B6FF' : '#8FE3FF'; ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = F(small ? 13 : 16); ctx.fillStyle = pl.cur ? '#D9C8FF' : '#BFEFFF'; ctx.fillText(pl.cur ? '🧟 XÁC ƯỚP BĂNG' : '🧑 NGƯỜI SỐNG SÓT', x0 + 10, y + (small ? 13 : 17));
  ctx.font = F(small ? 12 : 13); ctx.fillStyle = '#FFE680'; ctx.textAlign = 'right'; ctx.fillText((botMode && !small ? '❤️×' + S.lives + '  ' : '') + '⭐ ' + S.score, x0 + w - 10, y + (small ? 13 : 17)); ctx.textAlign = 'left';
  const bar = (yy, v, col, ic, bh) => { ctx.font = F(small ? 11 : 13, 400); ctx.fillStyle = '#FFFFFF'; ctx.fillText(ic, x0 + 9, yy + bh / 2 + 1); rr(ctx, x0 + 30, yy, w - 42, bh, bh / 2); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fill(); rr(ctx, x0 + 30, yy, (w - 42) * clamp(v, 0, 1), bh, bh / 2); ctx.fillStyle = col; ctx.fill() };
  const hpCol = pl.hp > 50 ? '#5BD17A' : pl.hp > 25 ? '#FFC44D' : '#FF5C7A';
  if (!pl.cur) { bar(y + (small ? 24 : 33), pl.hp / 100, hpCol, '❤️', small ? 8 : 11); bar(y + (small ? 36 : 51), pl.shd / 100, '#6FB8FF', '🧣', small ? 7 : 11) }
  else { bar(y + (small ? 24 : 33), pl.hp / 100, '#B57BFF', '🧟', small ? 8 : 11); ctx.font = F(small ? 11 : 13); ctx.fillStyle = '#FFE680'; ctx.fillText(S.orig ? '👑 Xác ướp gốc — yểm cả lớp để thắng!' : '🧟 Yểm cả lớp để phe em thắng!', x0 + 10, y + (small ? 44 : 57)); }
  const [c, n] = counts(), nl = Math.ceil(nightLeft(t)), cy = y + (small ? 56 : 80);
  ctx.font = F(small ? 11 : 13); ctx.fillStyle = '#FFFFFF'; ctx.fillText(botMode ? '⚔️ Đợt ' + Math.max(1, wave) + '/' + WAVES + ' · còn ' + bots.length + ' 🧟' : '🧟 ' + c + '/' + n + ' bị yểm', x0 + 10, cy);
  ctx.textAlign = 'right'; ctx.fillStyle = dark > .5 ? '#C9B6FF' : '#FFE680'; ctx.fillText(dark > .5 ? '🌙 ' + nl + 's' : dark > .02 ? '🌆' : '☀️ ' + nl + 's', x0 + w - 10, cy);   /* còn bao lâu tới đêm / tới sáng */
  if (!small) { ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = F(12, 700); ctx.fillText(pl.cur ? 'Đã yểm ' + S.tags + ' bạn' : 'Sống sót ' + Math.floor(S.surv / 60) + ':' + String(S.surv % 60).padStart(2, '0'), x0 + 12, y + 99) }
}
function drawMini(tn) {
  const mw = cw < 700 ? 120 : 170, k = mw / W, mh = H * k, x0 = cw - mw - 12, y0 = 10;
  rr(ctx, x0 - 5, y0 - 5, mw + 10, mh + 10, 10); ctx.fillStyle = 'rgba(20,28,60,.65)'; ctx.fill();
  ctx.fillStyle = '#EEF3FC'; ctx.fillRect(x0, y0, mw, mh);
  ctx.fillStyle = '#A8DDF7'; ctx.beginPath(); ctx.ellipse(x0 + LAKE.cx * k, y0 + LAKE.cy * k, LAKE.rx * k, LAKE.ry * k, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#CFD7F6'; ctx.beginPath(); CAVE.forEach(([a, b], i) => i ? ctx.lineTo(x0 + a * k, y0 + b * k) : ctx.moveTo(x0 + a * k, y0 + b * k)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5FAF7E'; for (const o of OBS) if (o.k === 'pine') ctx.fillRect(x0 + o.x * k - 1, y0 + o.y * k - 1, 2, 2);
  ctx.fillStyle = '#FF9A3C'; for (const f of FIRES) { ctx.beginPath(); ctx.arc(x0 + f.x * k, y0 + f.y * k, 2.5, 0, 7); ctx.fill() }
  const dot = (x, y, c, cur, big) => { ctx.fillStyle = cur ? '#FF5C5C' : c; ctx.beginPath(); ctx.arc(x0 + x * k, y0 + y * k, big ? 4.5 : 3.2, 0, 7); ctx.fill(); ctx.lineWidth = big ? 2.5 : 1.2; ctx.strokeStyle = big ? '#FFE680' : O; ctx.stroke() };
  for (const id in R) { const r = R[id]; if (r.buf.length && tn - r.last < 4000) dot(r.x, r.y, r.c, r.s & 4096) }
  for (const b of bots) dot(b.x, b.y, b.c, b.cur); dot(pl.x, pl.y, S.color, pl.cur, 1);
  return y0 + mh + 12;
}
function drawFeed(tn, y) {
  ctx.textBaseline = 'middle';
  for (const f of FEED) {
    const age = tn - f.t; if (age > 6000) continue; ctx.globalAlpha = Math.min(1, (6000 - age) / 600);
    ctx.font = F(cw < 700 ? 12 : 13); const s = f.k === 'kill' ? f.a + ' ❄️ hạ ' + f.b : f.k === 'cure' ? '✨ ' + f.b + ' giải lời nguyền' : (f.a ? f.a + ' 🧟 yểm ' : '🧟 ') + f.b, w = ctx.measureText(s).width + 22, x0 = cw - w - 12;
    rr(ctx, x0, y, w, 26, 13); ctx.fillStyle = f.me ? 'rgba(255,230,128,.92)' : 'rgba(20,28,60,.78)'; ctx.fill();
    ctx.fillStyle = f.me ? O : '#FFFFFF'; ctx.textAlign = 'left'; ctx.fillText(s, x0 + 11, y + 13); y += 31;
  }
  ctx.globalAlpha = 1;
}
function drawBanner(tn) {
  const b = BAN[0]; if (!b || tn - b.t >= b.ms) return;
  const a = Math.min(1, (b.ms - (tn - b.t)) / 300);
  ctx.globalAlpha = a; ctx.font = F(cw < 700 ? 14 : 18); const w = Math.min(cw - 24, ctx.measureText(b.txt).width + 36), y = ch - (cw < 700 ? 64 : 120);
  rr(ctx, cw / 2 - w / 2, y, w, 36, 18); ctx.fillStyle = 'rgba(20,28,60,.86)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = b.col; ctx.stroke();
  ctx.fillStyle = b.col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.txt, cw / 2, y + 19, w - 20); ctx.globalAlpha = 1;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.max(.45, Math.min(cw / 1150, ch / 640)) }
/* ═════ điều khiển: ← ↑ ↓ → / W A S D đi · Space / F ném tuyết (xác ướp: lướt) · bấm chuột / chạm màn hình = ném về chỗ đó ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ' ': 'sh', f: 'sh', F: 'sh', j: 'sh', J: 'sh', k: 'sh', K: 'sh' };
function toWorld(e) { const r = cv.getBoundingClientRect(); return [cam.x + (e.clientX - r.left) / sc, cam.y + (e.clientY - r.top) / sc + 26] }
function bindInput() {
  addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return; const k = KM[e.key]; if (k) { e.preventDefault(); keys[k] = 1 } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk() });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd'], ['bF', 'sh']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
  });
  const upd = e => { const [x, y] = toWorld(e); ptr.x = x; ptr.y = y };
  cv.addEventListener('pointermove', e => { if (ptr.on) upd(e) });
  cv.addEventListener('pointerdown', e => { e.preventDefault(); upd(e); ptr.on = 1; try { cv.setPointerCapture(e.pointerId) } catch (x2) { } });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if (ptr.on && pl.cd > 0) ptr.on = 0; else if (ptr.on) ptr.tap = 1 }));
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {}; seed0 = seed || 7; LV = LVS[level] || LVS[2]; T0 = now();
  GC.music.files({ bgm: { src: 'snd/snow-bgm.mp3' } }, 'snow');   // nhạc nền cô Chí Nên chọn
  pl.n = S.name; pl.c = S.color; spawnAt(pl); pl.inv = 0;
  addEventListener('resize', resize); resize(); cam.x = pl.x - cw / sc / 2; cam.y = pl.y - ch / sc / 2; bindInput(); requestAnimationFrame(loop);
}
function onEnd(why) { if (why === 'time' && !pl.cur && !S.won) { S.won = false; gain(15); S.survivor = 1 } }   // hết giờ mà còn là người: +15⭐
function endTitle(why, info) {
  if (why === 'cursed' || (info && info.ew === 'cursed')) return '🧟 Cả lớp đã bị yểm — PHE XÁC ƯỚP CHIẾN THẮNG!';
  if (why === 'time') return pl.cur ? '⏰ Hết giờ! Phe người sống sót đã trụ vững' : '🏆 Hết giờ — EM ĐÃ SỐNG SÓT TỚI CUỐI! +15⭐';
  return null;
}
function release() { keys.l = keys.r = keys.u = keys.d = keys.sh = 0; ptr.on = 0 }
function place(x, y, old) { if (old) { S.score = old.sc || 0; S.level = Math.floor(S.score / 25); if (old.cur) { pl.cur = true; pl.shd = 0 } } }
const label = () => (pl.cur ? '🧟 Xác ướp' : '🧑 Sống sót') + ' · ⭐ ' + S.score;
function extra() { return { lvl: S.level, wk: 'snow', lb: label(), sc: S.score, cur: pl.cur ? 1 : 0, tg: S.tags } }
const hud = () => (pl.cur ? '🧟 Xác ướp' : '❤️ ' + Math.ceil(pl.hp)) + ' · ⭐ ' + S.score;
return { init, S, pl: PLS, keys, alt: () => S.score, topAlt: () => 60, release, place, measure: () => 60, extra, hud, label, W, kind: 'snow', NL: 1, attachNet, setPlayers, onBegin, onAnswer, onEnd, endTitle, winTitle: '🏆 Em đã đánh bại toàn bộ xác ướp băng — XỨ TUYẾT ĐƯỢC CỨU!', winToast: '🏆 CHIẾN THẮNG! Em đã hạ hết xác ướp qua 3 đợt!',
  _dbg: { step, draw, me: pl, bots, R, SH, PT, OBS, FIRES, AREAS, activeItems, darkAt, blizAt, curse, cure, tagBody, freezeBody, onNet, cam, ptr, setT0: v => { T0 = v } } };
})();
