/* garden.js — game "🌻 Hoa Quả Nổi Giận" (thủ vườn theo hàng: trồng cây chặn bầy ma đói · mã game: garden).
   Sân cỏ 11 cột × 5 hàng (dài hơn bản đầu), ma đi từ phải sang trái; cuối mỗi hàng có 1 xe cắt cỏ cứu nguy 1 lần. Ma vào tới nhà = thua màn (chơi lại màn đó).
   ☀️ NẮNG chính là ⚡ năng lượng của trang (S.energy): trả lời đúng câu hỏi → thêm nắng · nắng rơi / nắng của Cúc Nắng chỉ +10 và hiếm (Cúc Nắng 40 giây mới ra 1 lần) → muốn trồng nhiều phải trả lời câu hỏi (đầu màn chỉ có 50 ☀️).
   Cây (nhân vật tự thiết kế): 🌼 Cúc Nắng (tạo nắng) · 🌽 Bắp Bắn (bắn hạt) · 🥔 Củ Cải Mìn (chôn 14 giây rồi nổ khi ma chạm) · 🥥 Dừa Khiên (chắn đường)
   · cửa hàng bán thêm: 🌿 Bạc Hà Băng (bắn băng làm chậm) · 🪴 Cây Đớp Mồi (nuốt chửng 1 con ma) · 🍉 Dưa Hấu Nổ (nổ 3×3) · 🌽🌽 Bắp Đôi (bắn 2 hạt).
   Ma (tự thiết kế): Ma Đói · Ma Mũ Rơm (trâu hơn) · Ma Nồi Gang (rất trâu) · Ma Chạy Bộ (nhanh) · Ma Ếch (nhảy qua cây đầu tiên) · MA KHỔNG LỒ (trùm màn 4, đập nát cây).
   4 màn = 4 môi trường: 🌤 Sân cỏ ban ngày → 🌫 Đêm sương mù (sương che nửa sân, trồng 🍄 Nấm Đèn để soi; không có nắng rơi) → 🏊 Hồ bơi (2 hàng nước giữa sân: phải thả 🍃 Lá Bè rồi mới trồng lên)
   → 🏠 Mái nhà (đặt chậu, 5 cột đầu dùng cây ném) → 🪦 Nghĩa địa đêm trăng (bia mộ chắn ô trồng, ma chui lên từ mộ — dùng 🐛 Sâu Gặm Mộ) → ⚡ Nghĩa địa bão tố (trận cuối, trùm Ma Khổng Lồ).
   (cũ: 🏠 Mái nhà (ô nào cũng phải đặt 🪴 Chậu Đất; cây bắn thẳng ở 5 cột đầu bị mái dốc chắn → dùng 🍿 Bắp Rang Ném bắn cầu vồng; có trùm). Giữa các màn: 🛒 CỬA HÀNG của bác Tí (mua cây mới & nâng cấp bằng 🪙 xu).
   Điều khiển: bấm / chạm thẻ cây rồi bấm ô đất · bấm ☀️ 🪙 để nhặt (không nhặt cũng tự bay về) · 🪓 xẻng nhổ cây · phím 1–8 chọn cây, mũi tên di ô, Space trồng.
   Nhạc: snd/garden-*.mp3 (cô Chí Nên chọn). Cùng giao diện: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'garden' */
window.Garden = (function () {
const { clamp, rng } = GC;
const BW = 900, BH = 600, X0 = 112, Y0 = 100, CW = 68, CH = 94, COLS = 11, ROWS = 5, PI = Math.PI, OL = '#2A2140';
const PLANTS = {   // cost: nắng · hp · cd: thời gian hồi thẻ (khung hình)
  sun: { n: 'Cúc Nắng', cost: 50, hp: 300, cd: 450 }, corn: { n: 'Bắp Ném', cost: 100, hp: 300, cd: 450 }, pea: { n: 'Đậu Bắn', cost: 100, hp: 300, cd: 450 }, mine: { n: 'Củ Cải Mìn', cost: 25, hp: 300, cd: 1300 }, wall: { n: 'Dừa Khiên', cost: 50, hp: 4000, cd: 1500 },
  pult: { n: 'Bắp Rang Ném', cost: 100, hp: 300, cd: 450 }, lamp: { n: 'Nấm Đèn', cost: 25, hp: 300, cd: 500, only: 'fog' }, raft: { n: 'Lá Bè', cost: 25, hp: 300, cd: 240, base: 1, only: 'pool' }, pot: { n: 'Chậu Đất', cost: 25, hp: 300, cd: 240, base: 1, only: 'roof' },
  ice: { n: 'Bạc Hà Băng', cost: 150, hp: 300, cd: 450 }, trap: { n: 'Cây Đớp Mồi', cost: 150, hp: 400, cd: 600 }, melon: { n: 'Dưa Hấu Nổ', cost: 150, hp: 9999, cd: 2200 }, twin: { n: 'Đậu Đôi', cost: 200, hp: 300, cd: 450 },
  star: { n: 'Khế Ba Hướng', cost: 175, hp: 300, cd: 450 }, boxer: { n: 'Su Hào Đấm Bốc', cost: 125, hp: 550, cd: 450 }, cannon: { n: 'Bí Ngô Đại Bác', cost: 200, hp: 400, cd: 900 }, buster: { n: 'Sâu Gặm Mộ', cost: 75, hp: 300, cd: 600, only: 'grave' } };
const ORDER = ['sun', 'pea', 'corn', 'pult', 'mine', 'wall', 'lamp', 'raft', 'pot', 'buster', 'ice', 'twin', 'star', 'boxer', 'cannon', 'trap', 'melon'], MAXC = 10;
const ZT = {   // hp · sp: px / khung · arm: giáp (mũ) · pts
  basic: { n: 'Ma Đói', hp: 200, sp: .15, pts: 1 }, hat: { n: 'Ma Mũ Rơm', hp: 200, arm: 190, sp: .15, pts: 2 }, pot: { n: 'Ma Nồi Gang', hp: 200, arm: 650, sp: .15, pts: 3 },
  run: { n: 'Ma Chạy Bộ', hp: 170, sp: .36, pts: 2 }, frog: { n: 'Ma Ếch', hp: 240, sp: .3, pts: 3, jump: true }, giant: { n: 'MA KHỔNG LỒ', hp: 3200, sp: .09, pts: 20, boss: true },
  news: { n: 'Ma Đọc Báo', hp: 200, arm: 150, sp: .13, pts: 2, rage: true }, board: { n: 'Ma Vác Ván', hp: 200, arm: 900, sp: .14, pts: 3, shield: true },   // đọc báo: mất báo là NỔI ĐIÊN chạy nhanh · vác ván: ván gỗ chặn đạn bắn thẳng (đạn ném cầu vồng bay qua được)
  balloon: { n: 'Ma Bóng Bay', hp: 200, sp: .22, pts: 3, fly: true }, mini: { n: 'Ma Tí Hon', hp: 90, sp: .34, pts: 1, mini: true }, cracker: { n: 'Ma Ôm Pháo', hp: 260, sp: .15, pts: 3, boomer: true } };   // bóng bay: bay qua đầu cây, trúng 1 phát là vỡ bóng rơi xuống · tí hon: đi thành nhóm 3 · ôm pháo: cắn cây 2,5 giây là pháo nổ phá 3 ô
const STAGES = [   // give: cây được tặng khi vào màn · fog / pool / roof: môi trường · tod: 0 ngày · 2 đêm
  { n: 'Sân cỏ ban ngày', ic: '🌤', rows: [1, 2, 3], N: 15, dur: 7600, pool: [['basic', 3], ['hat', 1], ['news', 1]], late: [['basic', 2], ['hat', 2], ['pot', 1], ['news', 1], ['run', 1], ['mini', 1]], tod: 0, music: 'play', give: [] },
  { n: 'Đêm sương mù', ic: '🌫', rows: [0, 1, 2, 3, 4], N: 24, dur: 9400, pool: [['basic', 3], ['hat', 2], ['news', 1], ['pot', 1]], late: [['basic', 2], ['hat', 2], ['pot', 2], ['run', 2], ['news', 2], ['mini', 2], ['balloon', 1], ['frog', 1]], tod: 2, fog: true, music: 'night', give: ['mine', 'lamp'] },
  { n: 'Hồ bơi', ic: '🏊', rows: [0, 1, 2, 3, 4], N: 32, dur: 11200, pool: [['basic', 3], ['hat', 2], ['run', 1], ['mini', 1], ['news', 1]], late: [['basic', 2], ['hat', 2], ['run', 1], ['pot', 2], ['frog', 2], ['board', 2], ['balloon', 2], ['cracker', 1]], tod: 0, water: [2, 3], music: 'loon', give: ['wall', 'raft'] },
  { n: 'Mái nhà', ic: '🏠', rows: [0, 1, 2, 3, 4], N: 38, dur: 13000, pool: [['basic', 3], ['hat', 2], ['run', 2], ['frog', 1], ['mini', 1]], late: [['hat', 2], ['run', 1], ['pot', 2], ['frog', 1], ['board', 2], ['balloon', 2], ['cracker', 2], ['news', 1], ['mini', 1]], tod: 1, roof: true, music: 'play', give: ['pult', 'pot'] },
  { n: 'Nghĩa địa đêm trăng', ic: '🪦', rows: [0, 1, 2, 3, 4], N: 40, dur: 13000, pool: [['basic', 2], ['hat', 2], ['pot', 1], ['news', 1], ['mini', 1]], late: [['hat', 2], ['pot', 2], ['run', 1], ['frog', 1], ['board', 2], ['balloon', 1], ['cracker', 2], ['news', 1]], tod: 2, graves: 7, music: 'night', give: ['buster', 'star'] },
  { n: 'Nghĩa địa bão tố — trận cuối', ic: '⚡', rows: [0, 1, 2, 3, 4], N: 46, dur: 15000, pool: [['basic', 2], ['hat', 2], ['run', 2], ['news', 1], ['mini', 1]], late: [['hat', 2], ['pot', 3], ['run', 2], ['frog', 2], ['board', 2], ['balloon', 2], ['cracker', 2], ['mini', 1]], tod: 2, graves: 10, storm: true, music: 'battle', boss: true, give: ['boxer'] }];
const NS = STAGES.length;
const SHOP = [   // cửa hàng bác Tí
  { k: 'ice', price: 120, plant: true, d: 'Bắn hạt băng: ma trúng đạn đi CHẬM một nửa' }, { k: 'boxer', price: 180, plant: true, d: 'Đấm liên hoàn con ma đứng sát trước mặt' },
  { k: 'trap', price: 160, plant: true, d: 'NUỐT CHỬNG 1 con ma đứng sát trước mặt' }, { k: 'melon', price: 200, plant: true, d: 'Đặt xuống là NỔ tung vùng 3×3 ô' },
  { k: 'twin', price: 220, plant: true, d: 'Mỗi lần bắn 2 hạt đậu' }, { k: 'star', price: 240, plant: true, d: 'Bắn cùng lúc 3 hàng: trên, giữa, dưới' }, { k: 'cannon', price: 300, plant: true, d: 'Bắn quả bí khổng lồ, nổ trúng cả bầy' },
  { k: 'fert', price: 150, ic: '🧪', n: 'Phân bón thần kỳ', d: 'Mọi thẻ cây hồi nhanh hơn 30%' }, { k: 'tank', price: 120, ic: '🫙', n: 'Hũ nắng', d: 'Đầu mỗi màn có sẵn thêm 75 ☀️' }, { k: 'mow', price: 180, ic: '🚜', n: 'Xe cắt cỏ dự phòng', d: 'Mỗi hàng được cứu nguy 2 lần' }];
const LVS = { 1: { hp: .85, n: .8, sp: .95 }, 2: { hp: 1, n: 1, sp: 1 }, 3: { hp: 1.18, n: 1.25, sp: 1.1 } };
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: 1, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0, face: 1 }, keys = {};
let LV = LVS[2], seed0 = 7, lvSel = 2, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0;
let own = { sun: 1, pea: 1, corn: 1 }, ups = {}, loadout = null, graves = [], bases = [], grid = [], zs = [], shots = [], suns = [], drops = [], mow = [], fx = [], sched = [], si = 0, T = 0, state = 'intro', stT = 0, sel = null, shovel = false, cur = { c: 2, r: 2, on: false }, hover = null, cds = {}, score = 0, killed = 0, total = 0, banner = null, gift = null, lostWhy = '', seen = {}, bigAt = [], bossIn = false, shopMsg = '';
const cellX = c => X0 + c * CW + CW / 2, cellY = r => Y0 + r * CH + CH / 2, rowOK = r => STAGES[S.level].rows.includes(r);
const P = (r, c) => grid[r * COLS + c];
const envOK = k => { const o = PLANTS[k].only, st = STAGES[S.level]; return !o || (o === 'fog' && st.fog) || (o === 'pool' && st.water) || (o === 'roof' && st.roof) || (o === 'grave' && st.graves) };
const cards = () => (loadout || []).filter(k => own[k] && envOK(k));
function autoLoad() { const L = ORDER.filter(k => own[k] && envOK(k)); loadout = L.filter(k => PLANTS[k].only).concat(L.filter(k => !PLANTS[k].only)).slice(0, MAXC); loadout.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)) }   /* mang tối đa 10 cây · cây bắt buộc của môi trường xếp trước */
const needBase = (r, c) => { const st = STAGES[S.level]; return st.roof ? 'pot' : st.water && st.water.includes(r) ? 'raft' : null };
const cdOf = k => Math.round(PLANTS[k].cd * (ups.fert ? .7 : 1));

/* ═════ dựng màn ═════ */
function loadStage(n) {
  S.level = n; const st = STAGES[n], r0 = rng(seed0 * 17 + n * 131 + lvSel * 7);
  for (const k of st.give) own[k] = 1;
  graves = new Array(COLS * ROWS).fill(0); if (st.graves) { let n2 = 0, g = 0; while (n2 < st.graves && g++ < 300) { const c = 4 + Math.floor(r0() * (COLS - 5)), r = Math.floor(r0() * ROWS); if (!graves[r * COLS + c]) { graves[r * COLS + c] = 1; n2++ } } }
  autoLoad();
  grid = new Array(COLS * ROWS).fill(null); bases = new Array(COLS * ROWS).fill(0); if (st.roof) for (let r = 0; r < ROWS; r++) for (let c = 0; c < 4; c++) bases[r * COLS + c] = 300;   /* mái nhà: 4 cột đầu có sẵn chậu */ zs = []; shots = []; suns = []; drops = []; fx = []; T = 0; si = 0; sel = null; shovel = false; cds = {}; killed = 0; bossIn = false;
  mow = [0, 1, 2, 3, 4].map(r => ({ x: X0 - 46, st: rowOK(r) ? 0 : 2, left: ups.mow ? 2 : 1 }));
  const N = Math.round(st.N * LV.n); sched = []; bigAt = [Math.floor(N * .55), N - 1];
  const pick = L => { let s = 0; for (const [, w] of L) s += w; let x = r0() * s; for (const [k, w] of L) { if (x < w) return k; x -= w } return L[0][0] };
  for (let i = 0; i < N; i++) { const u = i / Math.max(1, N - 1), t = 1500 + Math.pow(u, .8) * st.dur; sched.push({ t: Math.round(t), k: pick(u < .45 ? st.pool : st.late), r: st.rows[Math.floor(r0() * st.rows.length)], g: st.graves && u > .3 && r0() < .4 ? 1 : 0 }) }
  for (const b of bigAt) { const t0 = sched[b].t; for (let q = 0; q < (b === N - 1 ? 3 : 1) + n; q++) sched.push({ t: t0 + 30 + q * 38, k: pick(st.late), r: st.rows[Math.floor(r0() * st.rows.length)], big: 1 }); sched[b].flag = b === N - 1 ? 2 : 1 }
  if (st.boss) sched.push({ t: sched[N - 1].t + 260, k: 'giant', r: 2, big: 1 });
  sched.sort((a, b) => a.t - b.t); total = sched.length;
  S.energy = Math.max(S.energy, 50 + (ups.tank ? 75 : 0));   /* chỉ đủ 1 Cúc Nắng: muốn trồng thêm phải TRẢ LỜI câu hỏi */ if (S.cap) S.energy = Math.min(S.cap, S.energy);
  state = 'intro'; stT = 0; banner = null; cur = { c: 2, r: 2, on: false }; flash = 0;
  GC.music.scene('seeds');
}
function begin() { state = 'play'; GC.music.scene(STAGES[S.level].music); banner = { t: 150, w: 'SẴN SÀNG… TRỒNG CÂY!', sub: 'Ma sẽ tới sau 25 giây — bấm ⚡ Trả lời để có nắng trồng cây!' } }
const prog = () => S.won ? 1 : clamp((S.level + (total ? killed / total : 0) * .95) / NS, 0, 1);
const alt = () => Math.round(prog() * 1000), topAlt = () => 1000;

/* ═════ luật chơi ═════ */
function spawn(e) {
  const Z = ZT[e.k]; if (Z.mini && !e.sub) { for (let q = 1; q < 3; q++) spawn({ k: e.k, r: e.r, sub: q }); total += 2 }
  let gx = null; if (e.g) { const L = []; graves.forEach((v, i) => { if (v) L.push(i) }); if (L.length) { const i = L[Math.floor(Math.random() * L.length)]; e.r = Math.floor(i / COLS); gx = cellX(i % COLS) + 8 } }
  zs.push({ k: e.k, Z, r: e.r, x: gx != null ? gx : BW + 30 + Math.random() * 40 + (e.sub || 0) * 34, rise: gx != null ? 60 : 0, stun: 0, fly: !!Z.fly, fuse: 0, hp: Z.hp * LV.hp, arm: (Z.arm || 0) * LV.hp, sp: Z.sp * LV.sp * (.92 + Math.random() * .16), slow: 0, eat: 0, dead: 0, ph: Math.random() * 6, jumped: !Z.jump, jt: 0, sm: 0, hit: 0 });
  if (Z.boss) { bossIn = true; GC.music.scene('battle'); banner = { t: 200, w: '👹 MA KHỔNG LỒ XUẤT HIỆN!', sub: 'Dùng 🍉 Dưa Hấu Nổ và 🥔 mìn — nó đập nát cây đó!' }; GC.sfx('roar') }
  if (S.tick - lastGroan > 150) { lastGroan = S.tick; GC.sfx('ggroan') }
  if (!seen[e.k] && e.k !== 'basic') { seen[e.k] = 1; S.hooks.onPower && S.hooks.onPower('g_z_' + e.k) }
}
function hurt(z, d, ice, lob) {
  if (z.dead) return; z.hit = 6; if (ice) z.slow = 420;
  if (z.fly) { z.fly = false; z.drop = 30; fx.push({ k: 'pop', x: z.x - 20, y: cellY(z.r) - 150, t: 0, life: 22 }); GC.sfx('pop'); return }   /* bóng bay: phát đầu tiên chỉ làm vỡ bóng */
  if (z.arm > 0 && !(lob && z.Z.shield)) { z.arm -= d; if (z.arm <= 0) { if (z.Z.rage) { z.sp *= 2.6; z.angry = 1; GC.sfx('roar') } fx.push({ k: 'hat', x: z.x, y: cellY(z.r) - 80, t: 0, life: 40, zk: z.k }); GC.sfx('bump') } return }
  z.hp -= d; if (z.hp <= 0) kill(z);
}
function kill(z) {
  z.dead = 1; killed++; score += z.Z.pts; S.stomps++; GC.sfx('stomp');
  if (Math.random() < (z.Z.boss ? 1 : .55)) drops.push({ x: z.x, y: cellY(z.r) + 10, vy: -4, v: z.Z.boss ? 100 : z.Z.pts > 2 ? 20 : 10, t: 0 });
  if (z.Z.boss) { S.hooks.onPower && S.hooks.onPower('g_bossdown'); GC.music.scene(STAGES[S.level].music) }
}
function boom(x, y, r, rows, dmg) { fx.push({ k: 'boom', x, y, r, t: 0, life: 34 }); GC.sfx('boom'); for (let q = 0; q < graves.length; q++) if (graves[q] && rows.includes(Math.floor(q / COLS)) && Math.abs(cellX(q % COLS) - x) < r) graves[q] = 0; for (const z of zs) if (!z.dead && rows.includes(z.r) && Math.abs(z.x - x) < r) { z.arm = 0; hurt(z, z.Z.boss ? dmg * .5 : dmg) } }
function plantAt(c, r) {
  if (state !== 'play' || c < 0 || c >= COLS || !rowOK(r)) return false;
  if (shovel) { if (P(r, c) || bases[r * COLS + c]) { if (P(r, c)) grid[r * COLS + c] = null; else bases[r * COLS + c] = 0; GC.sfx('pop'); fx.push({ k: 'puff', x: cellX(c), y: cellY(r), t: 0, life: 20 }) } shovel = false; return true }
  if (!sel) return false;
  const D = PLANTS[sel], nb = needBase(r, c), hb = bases[r * COLS + c] > 0, gv = graves[r * COLS + c] > 0;
  if (gv && sel !== 'buster') { tip('Ô này có BIA MỘ — trồng 🐛 Sâu Gặm Mộ lên để dọn'); return false }
  if (sel === 'buster' && !gv) { tip('🐛 Sâu Gặm Mộ chỉ trồng lên BIA MỘ'); return false }
  if (D.base) {
    if (nb !== sel) { tip(sel === 'raft' ? 'Lá Bè chỉ thả được xuống ô NƯỚC' : 'Ô này không cần chậu'); return false }
    if (hb) { tip('Ô này có ' + D.n + ' rồi — giờ trồng cây lên trên nhé'); return false }
    if (cds[sel] > 0) { tip('Thẻ ' + D.n + ' đang hồi — chờ chút nhé'); return false }
    if (S.energy < D.cost) { tip('Chưa đủ ☀️ nắng! Trả lời câu hỏi để có thêm nắng'); return false }
    S.energy -= D.cost; cds[sel] = cdOf(sel); bases[r * COLS + c] = D.hp; GC.sfx('pop'); fx.push({ k: 'puff', x: cellX(c), y: cellY(r) + 20, t: 0, life: 20 }); return true;
  }
  if (nb && !hb) { tip(nb === 'raft' ? 'Ô NƯỚC: thả 🍃 Lá Bè xuống trước rồi mới trồng cây lên' : 'MÁI NHÀ: đặt 🪴 Chậu Đất trước rồi mới trồng cây'); return false }
  if (P(r, c)) { tip('Ô này có cây rồi — chọn ô đất trống nhé'); return false }
  if (cds[sel] > 0) { tip('Thẻ ' + D.n + ' đang hồi — chờ chút nhé'); return false }
  if (S.energy < D.cost) { tip('Chưa đủ ☀️ nắng! Trả lời câu hỏi để có thêm nắng'); S.hooks.onEmpty && S.energy < 25 && S.hooks.onEmpty(); return false }
  S.energy -= D.cost; cds[sel] = cdOf(sel); grid[r * COLS + c] = { k: sel, hp: D.hp, t: 0, next: sel === 'sun' ? 1200 : 0, cd: 30 + Math.random() * 30, chew: 0, bob: Math.random() * 6 };
  GC.sfx('pop'); fx.push({ k: 'puff', x: cellX(c), y: cellY(r) + 20, t: 0, life: 20 }); if (sel === 'melon' || sel === 'mine') sel = null;
  return true;
}
let tipT = 0, tipS = '', lastGroan = -999, flash = 0;
function tip(s) { tipS = s; tipT = 120; GC.sfx('bump') }
function grabAt(x, y) {   // nhặt nắng / xu
  for (const s of suns) if (!s.got && Math.hypot(s.x - x, s.y - y) < 40) { take(s); return true }
  for (const d of drops) if (!d.got && Math.hypot(d.x - x, d.y - y) < 36) { takeCoin(d); return true }
  return false;
}
function take(s) { s.got = 1; S.energy += s.val; if (S.cap) S.energy = Math.min(S.cap, S.energy); GC.sfx('gsun') }
function takeCoin(d) { d.got = 1; S.coins += d.v; GC.sfx('coin') }
function step() {
  S.tick++;
  if (state === 'intro') { if (++stT > ITIME) begin(); return }
  if (state === 'clear') { if (++stT > 170) { S.coins += 60 + S.level * 40; S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NS - 1) { S.won = true; state = 'won'; S.hooks.onWin && S.hooks.onWin() } else { gift = STAGES[S.level + 1].give.map(k => PLANTS[k].n).join(' + '); state = 'shop'; shopMsg = ''; GC.music.scene('shop') } } stepFx(); return }
  if (state === 'lost') { if (++stT > 190) { S.falls++; loadStage(S.level); S.hooks.onFall && S.hooks.onFall(0, '🧟 ' + lostWhy + ' Chơi lại màn ' + (S.level + 1) + ' nhé — trồng thêm 🌼 Cúc Nắng sớm và giữ đủ cây bắn ở mọi hàng!') } stepFx(); return }
  if (state !== 'play') return;
  T++; const st = STAGES[S.level];
  if (S.tick - lastGroan > 520 && zs.some(z => !z.dead)) { lastGroan = S.tick; GC.sfx('ggroan') }   /* ma rên rỉ từng lúc */
  for (const k in cds) if (cds[k] > 0) cds[k]--;
  if (st.tod < 2 && T % 1500 === 600) suns.push({ x: X0 + 40 + Math.random() * (COLS * CW - 80), y: 60, ty: Y0 + 40 + Math.random() * (ROWS * CH - 90), val: 10, t: 0 });   /* nắng rơi hiếm (25 giây / lần) */
  while (si < sched.length && sched[si].t <= T) { const e = sched[si++]; if (e.flag) { banner = { t: 170, w: e.flag === 2 ? '⚠️ ĐỢT TẤN CÔNG CUỐI CÙNG!' : '⚠️ MỘT BẦY MA LỚN ĐANG TỚI!', sub: '' }; GC.sfx('roar'); if (e.flag === 2 && !st.boss) GC.music.scene('battle') } spawn(e) }
  // cây
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const p = P(r, c); if (!p) continue; p.t++; const px = cellX(c), py = cellY(r);
    if (p.k === 'sun') { if (p.t >= p.next) { p.next = p.t + 2400; suns.push({ x: px + (Math.random() - .5) * 30, y: py - 30, ty: py + 14, val: 10, t: 0, vy: -3 }); p.glow = 30 } }
    else if (p.k === 'buster') { if (p.t >= 260) { graves[r * COLS + c] = 0; grid[r * COLS + c] = null; fx.push({ k: 'puff', x: px, y: py, t: 0, life: 26 }); GC.sfx('crack'); score += 2 } }   /* gặm xong bia mộ thì tự đi */
    else if (p.k === 'star') {
      if (p.cd > 0) p.cd--;
      if (p.cd <= 0 && zs.some(z => !z.dead && Math.abs(z.r - r) <= 1 && z.x > px - 10 && z.x < BW + 10)) { p.cd = 96; p.rec = 8; for (const rr2 of [r - 1, r, r + 1]) if (rr2 >= 0 && rr2 < ROWS && rowOK(rr2)) shots.push({ r: rr2, x: px + 20, y: cellY(rr2) - 16, d: 20, star: 1, blk: st.roof && c < 5 }); GC.sfx('tshot') }
    }
    else if (p.k === 'boxer') { if (p.cd > 0) p.cd--; const z = zs.find(z => !z.dead && z.r === r && !z.jt && !z.fly && !z.rise && z.x - px > -14 && z.x - px < CW * .95); if (z && p.cd <= 0) { p.cd = 20; p.rec = 8; p.side = !p.side; hurt(z, 16); fx.push({ k: 'hit', x: z.x - 18, y: py - 30, t: 0, life: 10 }); if (S.tick % 2) GC.sfx('bump') } }
    else if (p.k === 'cannon') { if (p.cd > 0) p.cd--; if (p.cd <= 0 && zs.some(z => !z.dead && z.r === r && z.x > px && z.x < BW)) { p.cd = 720; p.rec = 14; shots.push({ r, x: px + 30, y: py - 4, d: 260, big: 1, blk: st.roof && c < 5 }); GC.sfx('cannon') } }
    else if (p.k === 'corn') {   // 🌽 Bắp Ném: ném hạt bắp cầu vồng · cứ 4 lần thì ném 1 cục MẬT ONG làm ma đứng hình 4 giây
      if (p.cd > 0) p.cd--;
      if (p.cd <= 0) { const z = zs.filter(z => !z.dead && z.r === r && z.x > px - 10 && z.x < BW && !z.rise).sort((a, b) => a.x - b.x)[0]; if (z) { p.cd = 104; p.rec = 14; p.n = (p.n || 0) + 1; const honey = p.n % 4 === 0; shots.push({ r, lob: 1, corn: 1, honey, x: px - 8, y: py - 50, x0: px - 8, y0: py - 50, tz: z, u: 0, d: honey ? 40 : 24 }); GC.sfx('tshot') } }
    }
    else if (p.k === 'pea' || p.k === 'ice' || p.k === 'twin') {
      if (p.cd > 0) p.cd--;
      if (p.cd <= 0 && zs.some(z => !z.dead && z.r === r && z.x > px - 10 && z.x < BW + 10)) { p.cd = 86; p.rec = 8; const blk = st.roof && c < 5; shots.push({ r, x: px + 26, y: py - 16, ice: p.k === 'ice', pea: p.k !== 'ice', d: 20, blk }); if (p.k === 'twin') shots.push({ r, x: px + 4, y: py - 16, pea: 1, d: 20, blk }); GC.sfx('tshot') }
    }
    else if (p.k === 'pult') {   // ném cầu vồng: trúng con ma đầu hàng, không bị mái dốc chắn
      if (p.cd > 0) p.cd--;
      if (p.cd <= 0) { const z = zs.filter(z => !z.dead && z.r === r && z.x > px - 10 && z.x < BW).sort((a, b) => a.x - b.x)[0]; if (z) { p.cd = 104; p.rec = 12; shots.push({ r, lob: 1, x: px, y: py - 30, x0: px, y0: py - 30, tz: z, u: 0, d: 30 }); GC.sfx('tshot') } }
    }
    else if (p.k === 'mine') { if (p.t === 840) { GC.sfx('pop'); fx.push({ k: 'puff', x: px, y: py + 16, t: 0, life: 20 }) } if (p.t >= 840 && zs.some(z => !z.dead && z.r === r && !z.jt && !z.fly && z.x - px > -34 && z.x - px < CW + 6)) { grid[r * COLS + c] = null; boom(px + 10, py, CW + 14, [r], 1800) }   /* ma vừa bước vào ô (chỗ nó dừng lại cắn) là nổ ngay */ }
    else if (p.k === 'melon') { if (p.t >= 66) { grid[r * COLS + c] = null; boom(px, py, CW * 1.55, [r - 1, r, r + 1], 1800) } }
    else if (p.k === 'trap') { if (p.chew > 0) p.chew--; else { const z = zs.find(z => !z.dead && z.r === r && z.x - px > -8 && z.x - px < CW * 1.25 && !z.jt); if (z) { p.bite = 16; GC.sfx('stomp'); if (z.Z.boss) { hurt(z, 500); p.chew = 500 } else { z.arm = 0; z.hp = 0; z.eaten = 1; kill(z); p.chew = 1200 } } } if (p.bite) p.bite-- }
    if (p.rec) p.rec--; if (p.glow) p.glow--;
  }
  // đạn
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    if (s.lob) { s.u += 1 / 46; const tx = s.tz.dead ? s.tx || s.tz.x : (s.tx = s.tz.x); s.x = s.x0 + (tx - s.x0) * s.u; s.y = s.y0 + (cellY(s.r) - 30 - s.y0) * s.u - Math.sin(s.u * PI) * 120; if (s.u >= 1) { if (!s.tz.dead) { hurt(s.tz, s.d, 0, 1); if (s.honey) s.tz.stun = s.tz.Z.boss ? 90 : 240 } fx.push({ k: 'hit', x: s.x, y: s.y, t: 0, life: 10 }); shots.splice(i, 1) } continue }
    s.x += s.big ? 4.6 : 6.4; if (s.blk && s.x > X0 + 5 * CW - 6) { fx.push({ k: 'hit', x: s.x, y: s.y, t: 0, life: 10 }); shots.splice(i, 1); if (!seen.blk) { seen.blk = 1; tip('Mái dốc chắn đạn bắn thẳng! Ở 5 cột đầu hãy trồng 🍿 Bắp Rang Ném') } continue }
    let hitZ = null, best = 1e9;
    for (const z of zs) if (!z.dead && z.r === s.r && !z.jt && !z.rise && s.x > z.x - 20 && s.x < z.x + 22 && z.x < best) { best = z.x; hitZ = z }
    if (hitZ && s.big) { for (const z2 of zs) if (!z2.dead && z2.r === s.r && Math.abs(z2.x - hitZ.x) < 70) hurt(z2, s.d, 0, 1); fx.push({ k: 'boom', x: hitZ.x, y: cellY(s.r) - 20, r: 46, t: 0, life: 26 }); GC.sfx('boom'); shots.splice(i, 1); continue }
    if (hitZ) { hurt(hitZ, s.d, s.ice, 0); fx.push({ k: 'hit', x: s.x, y: s.y, t: 0, life: 10, ice: s.ice }); shots.splice(i, 1) } else if (s.x > BW + 20) shots.splice(i, 1);
  }
  // ma
  for (const z of zs) {
    if (z.dead) { z.dead++; continue }
    if (z.slow) z.slow--; if (z.hit) z.hit--;
    const k = z.slow ? .5 : 1;
    if (z.jt > 0) { z.jt--; z.x -= CW * 1.45 / 44; continue }
    if (z.drop) z.drop--;
    if (z.rise > 0) { z.rise--; continue }   /* đang chui lên từ mộ */
    if (z.stun > 0) { z.stun--; continue }   /* dính mật ong: đứng hình */
    if (z.fly) { z.x -= z.sp * k; if (z.x < X0 - 4) { const m = mow[z.r]; if (m.st === 0 && m.left > 0) { m.st = 1; m.left--; GC.sfx('cannon') } } if (z.x < X0 - 64) { state = 'lost'; stT = 0; lostWhy = 'Ma bóng bay đã bay vào nhà!'; GC.sfx('gover'); S.hits++; return } continue }   /* bay qua đầu cây */
    const c = Math.floor((z.x - 24 - X0) / CW), inG = c >= 0 && c < COLS, p = inG ? P(z.r, c) : null, bs = inG && !p && bases[z.r * COLS + c] > 0;
    if (bs) { z.eat++; if (z.Z.boss) { if (++z.sm >= 60) { z.sm = 0; bases[z.r * COLS + c] = 0; GC.sfx('thud') } } else { bases[z.r * COLS + c] -= 1.65 * k; if (bases[z.r * COLS + c] <= 0) { bases[z.r * COLS + c] = 0; GC.sfx('crack') } } }
    else if (p && p.k !== 'melon') {
      if (!z.jumped) { z.jumped = true; z.jt = 44; z.sp = ZT.basic.sp * LV.sp; GC.sfx('jump'); continue }
      z.eat++;
      if (z.Z.boss) { if (++z.sm >= 95) { z.sm = 0; grid[z.r * COLS + c] = null; fx.push({ k: 'boom', x: cellX(c), y: cellY(z.r), r: 40, t: 0, life: 20, dust: 1 }); GC.sfx('thud') } }
      else if (z.Z.boomer && ++z.fuse >= 150) { for (let q = c - 1; q <= c + 1; q++) if (q >= 0 && q < COLS) { grid[z.r * COLS + q] = null; bases[z.r * COLS + q] = 0 } fx.push({ k: 'boom', x: cellX(c), y: cellY(z.r), r: CW * 1.5, t: 0, life: 34 }); GC.sfx('boom'); z.hp = 0; z.arm = 0; kill(z); S.hooks.onPower && S.hooks.onPower('g_cracker') }   /* pháo nổ phá 3 ô */
      else { p.hp -= 1.65 * k; p.bit = 4; if (z.eat % 34 === 0) GC.sfx('bump'); if (p.hp <= 0) { grid[z.r * COLS + c] = null; GC.sfx('crack') } }
    } else { z.eat = 0; z.sm = 0; z.x -= z.sp * k }
    if (z.x < X0 - 4) { const m = mow[z.r]; if (m.st === 0 && m.left > 0) { m.st = 1; m.left--; GC.sfx('cannon'); S.hooks.onPower && !seen.mow && (seen.mow = 1) && S.hooks.onPower('g_mow') } }
    if (z.x < X0 - 64) { state = 'lost'; stT = 0; lostWhy = 'Ma đã vào tới nhà rồi!'; GC.music.hush && GC.music.hush(true); setTimeout(() => GC.music.hush && GC.music.hush(false), 3200); GC.sfx('gover'); S.hits++; return }
  }
  zs = zs.filter(z => !z.dead || z.dead < 46);
  for (const m of mow) if (m.st === 1) { m.x += 5.2; for (const z of zs) if (!z.dead && z.r === mow.indexOf(m) && Math.abs(z.x - m.x) < 34) { if (z.Z.boss) { hurt(z, 1200); m.x = BW + 99 } else { z.arm = 0; z.hp = 0; kill(z) } } if (m.x > BW + 60) { m.st = m.left > 0 ? 0 : 2; m.x = X0 - 46 } }
  // nắng & xu
  for (const s of suns) { s.t++; if (s.vy != null) { s.vy += .25; s.y += s.vy; if (s.y >= s.ty) { s.y = s.ty; s.vy = null } } else if (s.y < s.ty) s.y += 1.1; if (!s.got && s.t > 330) take(s); if (s.got) { s.x += (48 - s.x) * .16; s.y += (46 - s.y) * .16; s.g = (s.g || 0) + 1 } }
  suns = suns.filter(s => !(s.g > 18));
  for (const d of drops) { d.t++; if (d.vy) { d.vy += .4; d.y += d.vy; if (d.vy > 0 && d.t > 14) d.vy = 0 } if (!d.got && d.t > 260) takeCoin(d); if (d.got) { d.x += (740 - d.x) * .16; d.y += (46 - d.y) * .16; d.g = (d.g || 0) + 1 } }
  drops = drops.filter(d => !(d.g > 18));
  stepFx();
  if (si >= sched.length && !zs.some(z => !z.dead)) { state = 'clear'; stT = 0; GC.sfx('flag'); for (const s of suns) if (!s.got) take(s); for (const d of drops) if (!d.got) takeCoin(d) }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
}
function stepFx() { for (const e of fx) e.t++; fx = fx.filter(e => e.t < e.life); if (tipT) tipT--; if (banner && banner.t > 0) banner.t-- }
function onAnswer(ok) { if (ok) { fx.push({ k: 'txt', x: 52, y: 110, t: 0, life: 60, s: '☀️ +nắng!' }); S.coins += 5; fx.push({ k: 'txt', x: 740, y: 80, t: 0, life: 50, s: '+5 🪙' }) } }

/* ═════ vẽ ═════ */
const el = (x, y, rx, ry, col, rot) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, 7); ctx.fill() };
const elo = (x, y, rx, ry, col, oc, w, rot) => { el(x, y, rx, ry, col, rot); ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, 7); ol(oc, w) };
const ol = (col, w) => { ctx.strokeStyle = col || OL; ctx.lineWidth = w || 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke() };
const rr = (x, y, w, h, r, col) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if (col) { ctx.fillStyle = col; ctx.fill() } };
const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill() };
const line = (pts, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke() };
const glow = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, col.slice(0, 7) + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill() };
const grad = (x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g };
const rgrad = (x, y, r, a, b) => { const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, a); g.addColorStop(1, b); return g };
function txt(s, x, y, size, fill, stroke, al) { ctx.font = '800 ' + size + "px 'Baloo 2',Nunito,sans-serif"; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; if (stroke !== 0) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size * .26); ctx.strokeStyle = stroke || OL; ctx.strokeText(s, x, y) } ctx.fillStyle = fill || '#fff'; ctx.fillText(s, x, y) }
const emo = (s, x, y, size) => { ctx.font = size + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(s, x, y) };
/* mắt to long lanh (dùng chung cho cây) */
function eye(x, y, r, lx, mood) {
  elo(x, y, r, r * 1.12, '#fff', OL, 1.6); el(x + lx * r * .28, y + r * .12, r * .58, r * .66, '#2A1E3A'); el(x + lx * r * .28 - r * .2, y - r * .2, r * .22, r * .24, '#fff'); el(x + lx * r * .28 + r * .2, y + r * .3, r * .1, r * .1, '#ffffffcc');
  if (mood === 1) line([x - r * 1.1, y - r * 1.25, x + r * .7, y - r * .75], OL, 2);   // cau mày (trái)
  if (mood === 2) line([x + r * 1.1, y - r * 1.25, x - r * .7, y - r * .75], OL, 2);
}
const leaf = (x, y, w, h, rot, a, b) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = grad(0, -h, 0, h, a, b); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w * .5, -h, w, 0); ctx.quadraticCurveTo(w * .5, h, 0, 0); ctx.fill(); ol('#1F6B34', 2); line([w * .12, 0, w * .82, 0], '#1F6B3488', 1.4); ctx.restore() };
const PD = {
  sun: (p, t) => {   // 🌼 Cúc Nắng: bông cúc trắng nhuỵ vàng má hồng, đung đưa
    const sw = Math.sin(t * .05 + p.bob) * 3, gl = p.glow ? p.glow / 30 : 0;
    line([0, 34, sw * .4, 2], '#2E8B45', 7); line([0, 34, sw * .4, 2], '#4CC267', 4); leaf(0, 26, 24, 9, -.5 + sw * .01, '#7BE08A', '#2FA552'); leaf(0, 28, 22, 8, PI + .45, '#7BE08A', '#2FA552');
    if (gl) glow(sw, -12, 46, '#FFF2A0' + Math.round(gl * 200).toString(16).padStart(2, '0'));
    ctx.save(); ctx.translate(sw, -12); ctx.rotate(Math.sin(t * .03 + p.bob) * .08);
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * PI / 6); ctx.fillStyle = grad(0, -30, 0, -10, '#FFFFFF', '#FFE9A8'); ctx.beginPath(); ctx.ellipse(0, -21, 6.6, 11.5, 0, 0, 7); ctx.fill(); ol('#C98A1E', 1.6); ctx.restore() }
    ctx.fillStyle = rgrad(0, 0, 17, '#FFE66B', '#F5A623'); ctx.beginPath(); ctx.arc(0, 0, 16.5, 0, 7); ctx.fill(); ol('#B26A00', 2.2);
    eye(-6, -2, 4.6, .4); eye(6, -2, 4.6, -.4); el(-10.5, 5, 3, 1.8, '#FF8FA8aa'); el(10.5, 5, 3, 1.8, '#FF8FA8aa'); ctx.beginPath(); ctx.arc(0, 4, 4.4, .15, PI - .15); ol('#8A4A00', 1.8);
    ctx.restore();
  },
  corn: (p, t) => {   // 🌽 Bắp Ném: trái bắp mũm mĩm, có cánh tay dây leo cầm cái muỗng lá để ném hạt bắp / mật ong
    const k = p.rec ? p.rec / 14 : 0, bob = Math.sin(t * .08 + p.bob) * 1.5, honey = ((p.n || 0) + 1) % 4 === 0;
    el(0, 36, 22, 5, '#00000026');
    ctx.save(); ctx.translate(0, bob);
    // tay ném: dây leo cong ra sau, đầu là muỗng lá (vung lên khi ném)
    ctx.save(); ctx.translate(-6, -30); ctx.rotate(-.35 + k * 1.6); ctx.strokeStyle = '#1F6B34'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-8, -18, -26, -22, -34, -10); ctx.stroke(); ctx.strokeStyle = '#5CD070'; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.translate(-38, -8); ctx.rotate(-.3); ctx.fillStyle = grad(-14, -6, 14, 6, '#9BEA8A', '#2FA552'); ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, PI); ctx.lineTo(-15, -1); ctx.closePath(); ctx.fill(); ol('#1F6B34', 2); line([-12, 0, 12, 0], '#1F6B34', 1.4);
    if (!p.rec) { if (honey && !p.card) { elo(0, -3, 8, 6, '#FFB020', '#A86A00', 1.6); el(-3, -5, 2.4, 1.6, '#FFE9A0') } else { ctx.fillStyle = rgrad(0, -4, 8, '#FFF6A0', '#F2B01E'); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-6, -10, 0, -11); ctx.quadraticCurveTo(6, -10, 6, 0); ctx.closePath(); ctx.fill(); ol('#9A5E00', 1.6) } }
    ctx.restore(); ctx.restore();
    leaf(-4, 30, 30, 11, -1.15, '#8BE38A', '#2FA552'); leaf(4, 30, 30, 11, -1.95, '#8BE38A', '#2FA552');
    ctx.fillStyle = rgrad(0, -6, 30, '#FFF3A0', '#F2B01E'); ctx.beginPath(); ctx.moveTo(-18, 22); ctx.quadraticCurveTo(-24, -24, 0, -42); ctx.quadraticCurveTo(24, -24, 18, 22); ctx.quadraticCurveTo(0, 30, -18, 22); ctx.fill(); ol('#9A5E00', 2.4);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-18, 22); ctx.quadraticCurveTo(-24, -24, 0, -42); ctx.quadraticCurveTo(24, -24, 18, 22); ctx.closePath(); ctx.clip();
    for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) { const kx = i * 6.4 + (j % 2) * 3.2, ky = -38 + j * 7.6; elo(kx, ky, 3.4, 3.2, j < 2 ? '#FFF6B0' : '#FFE070', '#D89A1A', .9) }
    ctx.restore(); el(-8, -26, 4.5, 8, '#ffffff66', .35);
    leaf(-16, 22, 26, 10, -1.25, '#7BE08A', '#249148'); leaf(16, 22, 26, 10, -1.9, '#7BE08A', '#249148');
    eye(-6, -6, 5, .5, 1); eye(7, -6, 5, .3, 2); line([-11, -15, -2, -12], OL, 2.2); line([12, -15, 3, -12], OL, 2.2); ctx.beginPath(); ctx.arc(.5, 4, 3.4, PI + .3, -.3); ol('#7A4A00', 1.8);
    ctx.restore();
  },
  pea: (p, t, twin) => {   // 🫛 Đậu Bắn: quả đậu Hà Lan nằm ngang trên cuống, các hạt đậu ló mặt ra, hạt đầu chu miệng bắn
    const rec = p.rec ? -p.rec * .5 : 0, bob = Math.sin(t * .08 + p.bob) * 1.5;
    el(0, 36, 22, 5, '#00000026'); line([0, 34, 0, 8], '#2E8B45', 7); line([0, 34, 0, 8], '#5CD070', 4); leaf(0, 28, 26, 9, -.4, '#8BE38A', '#2FA552'); leaf(0, 30, 26, 9, PI + .4, '#8BE38A', '#2FA552');
    ctx.save(); ctx.translate(rec, bob - 6);
    ctx.fillStyle = grad(0, -20, 0, 12, '#9BEA6A', '#3E9A2A'); ctx.beginPath(); ctx.moveTo(-30, 2); ctx.quadraticCurveTo(-28, -20, 0, -20); ctx.quadraticCurveTo(26, -20, 30, -4); ctx.quadraticCurveTo(28, 12, 0, 12); ctx.quadraticCurveTo(-24, 12, -30, 2); ctx.fill(); ol('#1F6B24', 2.4);
    poly([-30, 2, -38, -6, -34, 4], '#3E9A2A'); line([-30, 2, -38, -6], '#1F6B24', 2); ctx.fillStyle = '#C8F5A0'; ctx.beginPath(); ctx.moveTo(-24, -4); ctx.quadraticCurveTo(0, -12, 24, -6); ctx.quadraticCurveTo(0, 2, -24, -4); ctx.fill();
    const peas = twin ? [[-14, -4, 7.5], [8, -5, 9]] : [[-17, -3, 6.5], [-3, -4, 7.5], [12, -5, 9]];
    peas.forEach(([x, y, r], i) => { const last = i === peas.length - 1 || twin; ctx.fillStyle = rgrad(x, y, r, '#B8F58A', '#4EB83A'); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ol('#1F6B24', 1.8); el(x - r * .35, y - r * .4, r * .3, r * .22, '#ffffffaa');
      eye(x - r * .3, y - r * .1, r * .36, .5, last ? 1 : 0); eye(x + r * .3, y - r * .14, r * .36, .4, last ? 2 : 0);
      if (last) { ctx.fillStyle = '#4EB83A'; rr(x + r * .7, y - 4, 10, 8, 3); ctx.fill(); ol('#1F6B24', 1.6); el(x + r * .7 + 10, y, 3.4 + (p.rec ? 1.4 : 0), 4.2 + (p.rec ? 1.4 : 0), '#1A3A12') } });
    ctx.restore();
  },
  twin: (p, t) => PD.pea(p, t, true),
  star: (p, t) => {   // ⭐ Khế Ba Hướng: lát khế vàng xanh 5 cánh, mặt cười, bắn 3 hàng
    const sp = Math.sin(t * .05 + p.bob) * .08, rec = p.rec ? p.rec / 8 : 0;
    el(0, 36, 22, 5, '#00000026'); line([0, 34, 0, 14], '#2E8B45', 6); leaf(0, 30, 22, 8, -.45, '#8BE38A', '#2FA552'); leaf(0, 30, 22, 8, PI + .45, '#8BE38A', '#2FA552');
    ctx.save(); ctx.translate(0, -4); ctx.rotate(sp); ctx.scale(1 + rec * .08, 1 + rec * .08);
    ctx.fillStyle = rgrad(0, 0, 32, '#FFF6A0', '#D8C020'); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * PI / 5 - PI / 2, q = i % 2 ? 13 : 30; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q) } ctx.closePath(); ctx.lineJoin = 'round'; ctx.fill(); ol('#8A7A00', 2.4);
    for (let i = 0; i < 5; i++) { const a = i * PI * .4 - PI / 2; line([0, 0, Math.cos(a) * 22, Math.sin(a) * 22], '#E0C84066', 1.6) } el(0, 0, 7, 7, '#F2E070'); el(-8, -14, 4, 6, '#ffffff77', .4);
    eye(-6, 0, 4.4, .4); eye(6, 0, 4.4, -.4); ctx.beginPath(); ctx.arc(0, 6, 3.6, .15, PI - .15); ol('#7A6A00', 1.8);
    ctx.restore();
  },
  boxer: (p, t) => {   // 🥊 Su Hào Đấm Bốc: củ su hào tím, tóc lá dựng, đeo găng đỏ, mặt cau có
    const bob = Math.sin(t * .1 + p.bob) * 1.5, pu = p.rec ? p.rec / 8 : 0;
    el(0, 36, 24, 5, '#00000026'); ctx.save(); ctx.translate(0, bob);
    for (const a of [-2.1, -1.6, -1.1]) leaf(0, -24, 24, 8, a, '#8BE38A', '#2FA552');
    ctx.fillStyle = rgrad(0, 6, 30, '#D8A8F0', '#7A3EB0'); ctx.beginPath(); ctx.ellipse(0, 8, 24, 26, 0, 0, 7); ctx.fill(); ol('#3E1A6A', 2.6); el(-9, -4, 6, 9, '#ffffff55', .4);
    for (const [x, y] of [[-24, 4], [24, 6], [-12, 30], [14, 30]]) { line([x * .8, y * .8, x * 1.15, y * 1.05 + 4], '#3E1A6A', 2) }
    eye(-7, 4, 4.8, .5, 1); eye(8, 4, 4.8, .3, 2); line([-6, 18, 6, 17], '#3E1A6A', 2.4); rr(-3, 17, 5, 4, 1, '#fff');
    for (const sd of [-1, 1]) { const out = (p.side ? sd > 0 : sd < 0) ? pu * 18 : 0, gx = sd * 26 + (sd > 0 ? out : 0), gy = 8 - (sd > 0 ? 0 : 0); line([sd * 16, 10, gx, gy], '#2FA552', 5); ctx.fillStyle = rgrad(gx, gy, 12, '#FF7A7A', '#C81E2A'); ctx.beginPath(); ctx.ellipse(gx + sd * 2, gy, 11, 10, 0, 0, 7); ctx.fill(); ol('#6A0A12', 2); el(gx + sd * 2 - 3, gy - 4, 3.4, 2.2, '#ffffffaa'); rr(gx - 6 + sd * 2, gy + 7, 12, 5, 2, '#F4F0E4') }
    ctx.restore();
  },
  cannon: (p, t) => {   // 🎃 Bí Ngô Đại Bác: quả bí nằm ngang có nòng khoét, dây ngòi cháy xèo xèo
    const rec = p.rec ? -p.rec * .6 : 0, ready = !p.card && (p.cd || 0) <= 0;
    el(0, 36, 30, 6, '#00000030'); ctx.save(); ctx.translate(rec, 6);
    for (const [x, y] of [[-16, 22], [14, 22]]) { elo(x, y, 9, 9, '#6A4420', OL, 2); el(x, y, 3, 3, '#C8A070') }
    ctx.fillStyle = rgrad(-4, -4, 34, '#FFB04A', '#C8601A'); ctx.beginPath(); ctx.ellipse(-2, 0, 30, 24, 0, 0, 7); ctx.fill(); ol('#6A2A0A', 2.6);
    for (const dx of [-14, 0, 14]) { ctx.beginPath(); ctx.ellipse(-2 + dx * .6, 0, 9, 23, 0, 0, 7); ol('#B8501888', 1.4) }
    ctx.fillStyle = grad(20, -12, 40, 12, '#8A4A1A', '#4A2008'); rr(18, -13, 22, 26, 8); ctx.fill(); ol(OL, 2.2); el(39, 0, 8, 11, '#1A0A04'); el(39, 0, 5, 7, '#000');
    line([-20, -20, -26, -32], '#5A3A1A', 2); if (ready) { glow(-27, -34, 10, '#FFE08Acc'); el(-27, -34, 2.4, 2.4, '#fff') }
    eye(-12, -4, 4.6, .5, 1); eye(0, -5, 4.6, .4, 2); el(-4, 8, 6, 2.4, '#6A2A0A');
    poly([-4, -24, 2, -32, 6, -22], '#3E9A3A'); ol('#1F6B34', 1.4);
    ctx.restore();
  },
  buster: (p, t) => {   // 🐛 Sâu Gặm Mộ: chú sâu xanh cuộn tròn trên bia mộ, nhe răng gặm
    const k = clamp((p.t || 0) / 260, 0, 1), ch = Math.abs(Math.sin(t * .4));
    ctx.save(); ctx.translate(0, -6 + (p.card ? 6 : 0));
    for (let i = 4; i >= 0; i--) { const x = -18 + i * 9, y = 14 - Math.sin(i * .9 + t * .2) * 4; elo(x, y, 9, 9, i % 2 ? '#8BE36A' : '#6CCB4A', '#2A7A1A', 1.8); el(x - 2, y - 3, 2.6, 2, '#ffffff88') }
    elo(22, -2, 14, 13, '#9BEA7A', '#2A7A1A', 2.2); eye(18, -6, 4.4, .6, 1); eye(28, -7, 3.8, .5, 2); for (const d of [-1, 1]) { line([22 + d * 4, -14, 24 + d * 7, -24], '#2A7A1A', 1.6); el(24 + d * 7, -25, 2.2, 2.2, '#FF8AC0') }
    elo(26, 6, 7, 3 + ch * 3, '#5A1A2A', OL, 1.6); rr(21, 3, 4, 3.6, 1, '#fff'); rr(27, 3, 4, 3.6, 1, '#fff');
    if (!p.card) { rr(-20, 30, 40, 6, 3, '#00000044'); rr(-20, 30, 40 * k, 6, 3, '#7AE08A') }
    ctx.restore();
  },
  pult: (p, t) => {   // 🍿 Bắp Rang Ném: hộp bắp rang sọc đỏ trắng có tay ném là cái muỗng gỗ
    const rec = p.rec ? p.rec / 12 : 0, bob = Math.sin(t * .08 + p.bob) * 1.2;
    el(0, 36, 24, 5.5, '#00000026'); ctx.save(); ctx.translate(0, bob);
    ctx.save(); ctx.translate(-14, 6); ctx.rotate(-.9 + rec * 1.5); rr(-3, -44, 6, 46, 3, '#C8924E'); ol('#6A4420', 2); elo(0, -48, 11, 9, '#E0B070', '#6A4420', 2); if (!rec) { elo(0, -51, 6, 5.5, '#FFF6D8', '#C8A040', 1.6) } ctx.restore();
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(20, -12); ctx.lineTo(15, 32); ctx.lineTo(-15, 32); ctx.closePath(); ctx.fillStyle = '#FFFDF4'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#F0485A'; for (let i = -2; i <= 2; i += 2) ctx.fillRect(i * 8 - 4, -14, 8, 50); ctx.restore(); ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(20, -12); ctx.lineTo(15, 32); ctx.lineTo(-15, 32); ctx.closePath(); ol('#8A1C28', 2.4);
    for (const [dx, dy, r] of [[-13, -16, 7], [-2, -21, 8.5], [10, -17, 7.5], [3, -13, 6], [-8, -11, 6]]) elo(dx, dy, r, r * .9, '#FFF6D8', '#C8A040', 1.6);
    eye(-7, 6, 5, .5, 1); eye(7, 6, 5, .3, 2); ctx.beginPath(); ctx.arc(0, 17, 4.5, .15, PI - .15); ol('#8A1C28', 2);
    ctx.restore();
  },
  lamp: (p, t) => {   // 🍄 Nấm Đèn: cây nấm vàng phát sáng xua sương mù
    const pu = .8 + Math.sin(t * .08 + p.bob) * .2; if (!p.card) glow(0, -4, 86 * pu, '#FFF2A055'); glow(0, -6, 40, '#FFF2A0aa');
    el(0, 36, 20, 5, '#00000026'); rr(-9, 6, 18, 28, 8, '#FFF6E0'); ol('#B89A5A', 2.2);
    ctx.fillStyle = rgrad(0, -6, 30, '#FFF9B0', '#F5A623'); ctx.beginPath(); ctx.ellipse(0, 8, 28, 26, 0, PI, 0); ctx.quadraticCurveTo(0, 16, -28, 8); ctx.fill(); ol('#B26A00', 2.4);
    for (const [dx, dy, r] of [[-14, -4, 5], [2, -10, 6], [15, -2, 4.5]]) el(dx, dy, r, r * .8, '#FFFFFFcc');
    eye(-5, 18, 4.2, .4); eye(5, 18, 4.2, -.4); ctx.beginPath(); ctx.arc(0, 25, 3.4, .15, PI - .15); ol('#8A6A2A', 1.6);
  },
  raft: (p, t) => { const b = Math.sin(t * .06 + (p.bob || 0)) * 1.5; ctx.save(); ctx.translate(0, 26 + b); ctx.fillStyle = grad(0, -12, 0, 12, '#9BEA8A', '#2FA552'); ctx.beginPath(); ctx.ellipse(0, 0, 34, 14, 0, .25, PI * 2 - .25); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill(); ol('#1F6B34', 2.4); for (const a of [-2.4, -1.6, -.8, .8, 1.6, 2.4]) line([0, 0, Math.cos(a) * 28, Math.sin(a) * 11], '#1F6B3466', 1.3); elo(-14, -3, 5, 4, '#FF9AC8', '#B84A7A', 1.6); el(-14, -3, 2, 1.6, '#FFE24A'); ctx.restore() },
  pot: (p, t) => { ctx.save(); ctx.translate(0, 22); ctx.fillStyle = grad(-22, 0, 22, 0, '#E8935A', '#A8502A'); ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(22, -6); ctx.lineTo(16, 18); ctx.lineTo(-16, 18); ctx.closePath(); ctx.fill(); ol('#5A2810', 2.4); rr(-25, -12, 50, 9, 4, '#F0A46A'); ol('#5A2810', 2.2); el(0, -8, 20, 3.4, '#5A3A1C'); el(-12, 4, 3.4, 6, '#ffffff44', .2); ctx.restore() },
  mine: (p, t) => {   // 🥔 Củ Cải Mìn: chôn dưới đất, chỉ lộ chùm lá; nở xong thì nhô lên mắt lim dim, đèn đỏ nhấp nháy
    const up = p.t >= 840 || p.card, k = up ? 1 : clamp(p.t / 840, 0, 1);
    el(0, 30, 30, 9, '#7A4E2A'); el(0, 28, 26, 6.5, '#96643A'); for (const [dx, dy] of [[-18, 30], [14, 32], [22, 27], [-8, 33]]) el(dx, dy, 3, 2, '#5E3A1C');
    if (up) {
      ctx.fillStyle = rgrad(0, 8, 26, '#FFB3C8', '#E0457A'); ctx.beginPath(); ctx.ellipse(0, 12, 22, 19, 0, PI, 0); ctx.lineTo(22, 26); ctx.lineTo(-22, 26); ctx.closePath(); ctx.fill(); ol('#8A1C48', 2.4);
      el(-9, 2, 5, 3, '#ffffff88', -.5); eye(-7, 12, 4.6, .3, 1); eye(7, 12, 4.6, -.3, 2); line([-4, 21, 0, 19, 4, 21], '#8A1C48', 1.8);
      line([0, -6, 0, -16], '#555', 2.4); const on = (t >> 3) & 1; if (on) glow(0, -19, 13, '#FF3A3Aaa'); elo(0, -19, 4.2, 4.2, on ? '#FF4A4A' : '#8A1A1A', OL, 1.6);
    } else { el(0, 24, 9 + k * 6, 4, '#E0457A'); txt(Math.ceil((840 - p.t) / 60) + 's', 0, 6, 13, '#fff') }
    leaf(-2, up ? -4 : 22, 16, 6, -2.2, '#8BE38A', '#2FA552'); leaf(2, up ? -4 : 22, 16, 6, -.95, '#8BE38A', '#2FA552');
  },
  wall: (p, t) => {   // 🥥 Dừa Khiên: trái dừa nâu lì lợm; bị cắn thì nứt dần, mắt rưng rưng
    const dmg = p.card ? 0 : 1 - p.hp / PLANTS.wall.hp, sh = p.bit ? Math.sin(t * 1.4) * 1.5 : 0;
    el(0, 36, 26, 5.5, '#00000026'); ctx.save(); ctx.translate(sh, 0);
    ctx.fillStyle = rgrad(0, 2, 36, '#C98C52', '#6E3F1C'); ctx.beginPath(); ctx.ellipse(0, 2, 28, 33, 0, 0, 7); ctx.fill(); ol('#3E2110', 2.6);
    ctx.strokeStyle = '#5A3418aa'; ctx.lineWidth = 1.3; for (let i = 0; i < 9; i++) { const a = i * .7 + .3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, 2 + Math.sin(a) * 15); ctx.lineTo(Math.cos(a) * 24, 2 + Math.sin(a) * 29); ctx.stroke() }
    el(-11, -15, 7, 10, '#ffffff44', .5); leaf(0, -30, 18, 6, -2.3, '#8BE38A', '#2FA552'); leaf(0, -30, 18, 6, -.85, '#8BE38A', '#2FA552');
    eye(-9, -2, 6.2, .35, dmg > .34 ? 0 : 1); eye(9, -2, 6.2, -.35, dmg > .34 ? 0 : 2);
    if (dmg > .34) { ctx.beginPath(); ctx.arc(0, 17, 5, PI + .3, -.3); ol('#3E2110', 2); if (dmg > .66) { el(-15, 8, 2.2, 3.4, '#8AD8FF'); el(15, 9, 2.2, 3.4, '#8AD8FF') } } else line([-6, 14, 6, 14], '#3E2110', 2.2);
    if (dmg > .34) line([10, -30, 6, -20, 13, -14, 9, -6], '#2A1408', 2); if (dmg > .66) { line([-16, -24, -12, -14, -19, -8], '#2A1408', 2); poly([18, 14, 28, 20, 20, 30], '#3E2110') }
    ctx.restore();
  },
  ice: (p, t) => {   // 🌿 Bạc Hà Băng: búp bạc hà xanh ngọc đội mũ băng, thở ra hơi lạnh
    const rec = p.rec ? -p.rec * .5 : 0, bob = Math.sin(t * .08 + p.bob) * 1.5;
    el(0, 36, 22, 5, '#00000026'); line([0, 34, 0, 10], '#2A9A8A', 7); line([0, 34, 0, 10], '#5CD8C4', 4); leaf(0, 28, 24, 9, -.45, '#9AF0E0', '#2FB5A0'); leaf(0, 30, 24, 9, PI + .45, '#9AF0E0', '#2FB5A0');
    ctx.save(); ctx.translate(rec, bob - 8); glow(0, 0, 38, '#BDF4FF55');
    for (const a of [-2.5, -1.9, -1.25, -.65]) leaf(0, -8, 26, 9, a, '#C8FBFF', '#48C8E8');
    ctx.fillStyle = rgrad(0, 0, 24, '#D8FFFA', '#35B8B0'); ctx.beginPath(); ctx.arc(0, 0, 21, 0, 7); ctx.fill(); ol('#12706C', 2.4); el(-8, -9, 5, 7, '#ffffff99', .5);
    eye(-6, -3, 5, .5); eye(8, -3, 5, .3); el(-11, 6, 3, 1.8, '#8AD8FFaa'); elo(18, 5, 5 + (p.rec ? 2 : 0), 4.6, '#0E5A60', '#0A3E44', 1.8);
    for (let i = 0; i < 3; i++) { const u = ((t * .04 + i * .33) % 1); ctx.globalAlpha = (1 - u) * .7; el(26 + u * 16, 4 - u * 6 + i * 2, 2 + u * 3, 2 + u * 3, '#E0FBFF'); ctx.globalAlpha = 1 }
    ctx.restore();
  },
  trap: (p, t) => {   // 🪴 Cây Đớp Mồi: cái miệng tím hồng đầy răng trên thân dây leo, đang nhai thì phồng má
    const chew = p.chew > 0, op = p.bite ? 0 : chew ? .12 + Math.abs(Math.sin(t * .2)) * .12 : .55 + Math.sin(t * .06 + p.bob) * .1, sw = Math.sin(t * .05 + p.bob) * 2;
    el(0, 36, 22, 5, '#00000026'); ctx.strokeStyle = '#2E8B45'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 34); ctx.quadraticCurveTo(-22, 10, 2 + sw, -6); ctx.stroke(); ctx.strokeStyle = '#5CD070'; ctx.lineWidth = 4.5; ctx.stroke();
    leaf(-6, 30, 26, 10, -.3, '#8BE38A', '#2FA552'); leaf(-6, 32, 24, 9, PI + .5, '#8BE38A', '#2FA552');
    ctx.save(); ctx.translate(6 + sw, -10);
    const jaw = (sg) => { ctx.save(); ctx.rotate(sg * op); ctx.fillStyle = rgrad(4, sg * -10, 30, '#F59AE0', '#9A2EA8'); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-12, sg * -26, 12, sg * -24); ctx.quadraticCurveTo(30, sg * -18, 32, 0); ctx.closePath(); ctx.fill(); ol('#4E1260', 2.4);
      for (let i = 0; i < 5; i++) poly([-2 + i * 7, 0, 1.5 + i * 7, sg * 7, 5 + i * 7, 0], '#FFFDF0'); for (const [dx, dy] of [[-2, -14], [12, -17], [22, -10]]) el(dx, sg * -dy * -1 * -1, 2.6, 2.6, '#FFD0F4aa'); ctx.restore() };
    el(8, 0, 16, 5 + op * 14, '#5A0E3E'); if (chew) { el(6, 0, 18, 13, '#C860C8'); } jaw(-1); jaw(1);
    eye(0, -22 - op * 6, 4.8, .5, 1); eye(13, -24 - op * 8, 4.8, .3, 2);
    if (p.bite) txt('NGOẠM!', 10, -46, 14, '#FFE24A');
    ctx.restore();
  },
  melon: (p, t) => {   // 🍉 Dưa Hấu Nổ: quả dưa đỏ mặt, phồng to dần rồi nổ
    const k = p.card ? 0 : clamp(p.t / 66, 0, 1), s = 1 + k * .35, sh = k ? Math.sin(t * 1.6) * 2 * k : 0;
    el(0, 36, 26, 5.5, '#00000026'); ctx.save(); ctx.translate(sh, 4); ctx.scale(s, s);
    ctx.fillStyle = rgrad(0, 0, 32, k > .5 ? '#FF9A7A' : '#9BEA7A', k > .5 ? '#C82A2A' : '#1E8A3C'); ctx.beginPath(); ctx.ellipse(0, 0, 30, 26, 0, 0, 7); ctx.fill(); ol('#0E4A1E', 2.6);
    ctx.strokeStyle = '#0E5A2499'; ctx.lineWidth = 3.4; for (const dx of [-18, -6, 6, 18]) { ctx.beginPath(); ctx.moveTo(dx * .5, -25); ctx.quadraticCurveTo(dx * 1.5, 0, dx * .5, 25); ctx.stroke() }
    el(-12, -13, 7, 5, '#ffffff66', -.5); line([0, -26, 4, -34], '#5A3A1A', 3); leaf(4, -34, 14, 5, -.3, '#8BE38A', '#2FA552');
    eye(-9, -2, 5.6, .3, 1); eye(9, -2, 5.6, -.3, 2); poly([-8, 9, 8, 9, 6, 15, -6, 15], '#3A0A0A'); for (let i = 0; i < 3; i++) poly([-6 + i * 4.4, 9, -4 + i * 4.4, 12.5, -2 + i * 4.4, 9], '#fff');
    ctx.restore();
  }
};
function drawGrave(x, y, sd) {   // 🪦 bia mộ đá rêu phong, nứt, gò đất phía trước
  const h = 52 + (sd % 3) * 6, w = 40 + (sd % 2) * 6, tilt = ((sd % 5) - 2) * .04;
  el(x, y + 36, 32, 8, '#00000033'); ctx.save(); ctx.translate(x, y + 30); ctx.rotate(tilt);
  ctx.fillStyle = grad(-w / 2, 0, w / 2, 0, '#B8BCC8', '#6E7488'); ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h + w / 2); ctx.arc(0, -h + w / 2, w / 2, PI, 0); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ol('#2E3244', 2.4);
  rr(-w / 2 + 5, -h + 10, 6, h - 16, 3, '#ffffff22');
  line([0, -h + 10, 0, -h + 34], '#4A5064', 4); line([-9, -h + 18, 9, -h + 18], '#4A5064', 4);
  line([w / 4, -h + 26, w / 4 - 5, -h + 36, w / 4 + 2, -h + 44], '#2E3244', 1.6);
  for (const [dx, dy, r] of [[-w / 2 + 4, -6, 7], [w / 2 - 6, -h + w / 2 + 2, 5], [-w / 2 + 10, -h + 14, 4]]) el(dx, dy, r, r * .7, '#5E8A3A');
  ctx.restore();
  ctx.fillStyle = '#6A4A2E'; ctx.beginPath(); ctx.ellipse(x, y + 36, 30, 9, 0, PI, 0); ctx.fill(); el(x - 10, y + 32, 3, 2, '#8A6A4A'); el(x + 8, y + 31, 2.4, 1.6, '#8A6A4A');
}
function drawPlant(p, x, y, t, s) { ctx.save(); ctx.translate(x, y); if (s) ctx.scale(s, s); PD[p.k](p, t); ctx.restore() }
/* ma (thiết kế riêng, kiểu hoạt hình): đầu to tròn, da xám xanh đổ bóng mềm, mắt lồi 1 to 1 nhỏ, lưng gù, 2 tay giơ ra trước, áo màu trầm theo loại */
const ZC = { basic: ['#6A7290', '#454B66'], hat: ['#6C8CBA', '#45618C'], pot: ['#857C5C', '#59533A'], run: ['#C25E50', '#863C32'], frog: ['#74B25E', '#4A7E3A'], giant: ['#74563C', '#4A3522'], news: ['#9C968A', '#6C685E'], board: ['#AE5E42', '#763C28'], balloon: ['#52989A', '#326A6C'], mini: ['#C68098', '#8E5068'], cracker: ['#BC9E48', '#826C2A'] };
const ZO = '#2E2B28';
function zHead() { ctx.beginPath(); ctx.moveTo(-20, -6); ctx.bezierCurveTo(-25, -27, -5, -35, 10, -30); ctx.bezierCurveTo(25, -25, 27, -6, 22, 6); ctx.bezierCurveTo(18, 16, 8, 22, -2, 23); ctx.bezierCurveTo(-12, 24, -21, 18, -22, 8); ctx.bezierCurveTo(-22.5, 2, -21, -2, -20, -6); ctx.closePath() }
function zTorso() { ctx.beginPath(); ctx.moveTo(-14, -71); ctx.quadraticCurveTo(-21, -54, -16, -36); ctx.lineTo(-11, -40); ctx.lineTo(-7, -34); ctx.lineTo(-2, -39); ctx.lineTo(3, -33); ctx.lineTo(8, -38); ctx.lineTo(12, -33); ctx.lineTo(16, -36); ctx.quadraticCurveTo(23, -58, 11, -75); ctx.quadraticCurveTo(-1, -80, -14, -71); ctx.closePath() }
function drawZombie(z, x, y, t) {
  const Z = z.Z, big = Z.boss ? 1.7 : Z.mini ? .62 : 1, eating = z.eat > 0, fast = Z.sp > .25, ph = t * (fast ? .3 : .13) + z.ph, wk = Math.sin(ph), wk2 = Math.cos(ph), ch2 = Math.abs(Math.sin(t * .45 + z.ph)), [c1, c2] = ZC[z.k];
  const SK = z.slow ? ['#DCEAFA', '#A8C4E6', '#7C9AC6', '#56709C'] : ['#D4DFBA', '#A7BB8C', '#7E9568', '#56694A'];   // sáng · nền · bóng · đậm
  const pant = '#525A74', pant2 = '#3C4258';
  const limb = (pts, col, w) => { line(pts, ZO, w + 3.4); line(pts, col, w) };
  const hand = (hx, hy, col, sc) => { ctx.save(); ctx.translate(hx, hy); ctx.scale(sc || 1, sc || 1); for (const [dx, dy, a] of [[-7, -2.6, .25], [-8, 1.2, .55], [-6.4, 4.6, .9]]) { ctx.save(); ctx.translate(dx, dy); ctx.rotate(a); rr(-5, -1.7, 7, 3.4, 1.7, col); ol(ZO, 1.3); ctx.restore() } elo(-1, 0, 5.6, 5, col, ZO, 1.6); el(-2, -1.6, 2.2, 1.2, '#ffffff44'); ctx.restore() };
  ctx.save(); ctx.translate(x, y);
  if (z.dead) { const k = z.dead / 46; ctx.globalAlpha = 1 - k; if (z.eaten) ctx.scale(1 - k, 1 - k); else { ctx.rotate(-k * 1.35); ctx.translate(0, k * 12) } }
  if (z.jt > 0) ctx.translate(0, -Math.sin((44 - z.jt) / 44 * PI) * 78);
  if (z.fly) ctx.translate(0, -46 + Math.sin(t * .06 + z.ph) * 5); else if (z.drop) ctx.translate(0, -46 * z.drop / 30);
  ctx.scale(big, big); el(0, 1, 25, 5.5, '#00000033'); ctx.rotate(eating ? Math.sin(t * .45) * .04 - .05 : -.05 + wk * .025);
  const bob = eating ? ch2 * 1.5 : Math.abs(wk2) * 2.2;
  // chân sau · chân trước: bước lê, gối hơi khuỵu, ống quần rách, giày há mõm
  for (const [hx, k, col] of [[7, -wk, pant2], [-3, wk, pant]]) {
    const st = eating ? hx * .5 : hx - k * 9, lift = eating ? 0 : Math.max(0, k) * 5, kx = (hx + st) / 2 - 3 - Math.max(0, k) * 2, ky = -22 - lift * .5;
    limb([st, -12 - lift, st + .5, -5 - lift], SK[2], 4);
    limb([hx, -40 - bob, kx, ky, st, -11 - lift], col, 9.5);
    poly([st - 6, -13 - lift, st + 6, -13 - lift, st + 6.5, -9 - lift, st + 3, -11 - lift, st + 1, -8 - lift, st - 2, -11 - lift, st - 5.5, -8.5 - lift], col); line([st - 5.5, -8.5 - lift, st - 2, -11 - lift, st + 1, -8 - lift, st + 3, -11 - lift, st + 6.5, -9 - lift], ZO, 1.2);
    ctx.save(); ctx.translate(st - 2, -3 - lift); ctx.rotate(eating ? 0 : -k * .16); ctx.fillStyle = grad(0, -6, 0, 5, '#6E5038', '#3A2818'); ctx.beginPath(); ctx.moveTo(7, -5.5); ctx.quadraticCurveTo(-3, -7.5, -11, -2); ctx.quadraticCurveTo(-14, 4, -7, 4.5); ctx.lineTo(8, 4.5); ctx.quadraticCurveTo(10.5, 0, 7, -5.5); ctx.fill(); ol(ZO, 1.8); line([-12, 3.2, 8, 3.2], '#241608', 1.8); el(-6, -2.4, 3.4, 1.4, '#ffffff30'); ctx.restore();
  }
  ctx.translate(0, -bob);
  // tay sau (sau lưng, cũng giơ ra trước)
  { const hy = -68 + (eating ? Math.sin(t * .45) * 4 : wk * 2); limb([9, -70, -5, -67 + wk2], c2, 8.5); limb([-5, -67 + wk2, -22, hy], SK[2], 5.4); hand(-26, hy, SK[2], .95) }
  if (z.k === 'cracker') { ctx.save(); ctx.translate(18, -50); ctx.rotate(.25); line([-12, -8, 10, 12], '#5A3A1A', 2.4); for (const dx of [-7, 0, 7]) { ctx.fillStyle = grad(dx - 4, 0, dx + 4, 0, '#F0503A', '#B02018'); rr(dx - 3.8, -16, 7.6, 25, 2); ctx.fill(); ol(ZO, 1.5); rr(dx - 3.8, -12, 7.6, 3, 1, '#F2D04A'); el(dx - 1.4, -4, 1, 6, '#ffffff44') } line([0, -16, 2, -26], '#4A3020', 1.8); const sp = 1 + (z.fuse ? z.fuse / 50 : 0); glow(2, -28, 9 * sp, '#FFE08Acc'); for (let q = 0; q < 5; q++) { const a = q * 1.26 + t * .4; line([2, -28, 2 + Math.cos(a) * 7 * sp, -28 + Math.sin(a) * 7 * sp], '#FFB020', 1.4) } ctx.restore() }
  // thân: áo khoác gù lưng, vạt rách, bóng đổ phía lưng
  zTorso(); ctx.fillStyle = grad(-16, -76, 16, -34, c1, c2); ctx.fill();
  ctx.save(); zTorso(); ctx.clip();
  el(16, -54, 9, 26, '#00000026'); el(-12, -62, 3.4, 10, '#ffffff22', .15);
  if (z.k === 'board') { ctx.globalAlpha *= .3; for (let q = -20; q < 24; q += 7) { line([q, -80, q, -30], '#2A1208', 2.2); } for (let q = -76; q < -30; q += 7) line([-24, q, 24, q], '#2A1208', 2.2); ctx.globalAlpha /= .3 }
  if (z.k === 'balloon') for (const [dx, dy] of [[-12, -46], [8, -60], [12, -42], [-4, -66], [2, -48]]) el(dx, dy, 2.4, 2.4, '#ffffff55');
  if (z.k === 'run') { line([-18, -40, -12, -74], '#ffffffcc', 2.4); line([14, -36, 18, -70], '#ffffffaa', 2.4) }
  ctx.restore(); zTorso(); ol(ZO, 2.2);
  // cổ áo sơ mi + ve áo
  ctx.fillStyle = grad(0, -76, 0, -50, '#EEE8D2', '#C8C0A4'); ctx.beginPath(); ctx.moveTo(-10, -74); ctx.lineTo(-2, -50); ctx.lineTo(5, -76); ctx.closePath(); ctx.fill(); ol(ZO, 1.4);
  poly([-10, -74, -4, -70, -7, -64], '#F4F0DE'); line([-10, -74, -4, -70, -7, -64], ZO, 1.2); poly([5, -76, 0, -71, 3, -65], '#F4F0DE'); line([5, -76, 0, -71, 3, -65], ZO, 1.2);
  line([-12, -72, -3, -50], mix2(c2, '#000000', .25), 1.6); line([7, -75, -1, -50], mix2(c2, '#000000', .25), 1.6);
  for (const by of [-46, -40]) { elo(-4.5, by, 1.6, 1.6, mix2(c2, '#000000', .3), ZO, .8) }
  rr(4, -49, 8, 7, 1.5, mix2(c1, '#000000', .12)); ctx.setLineDash([1.6, 1.6]); ol('#ffffff66', .9); ctx.setLineDash([]);
  if (z.k === 'basic') { line([-2, -50, -3.5, -45], '#3A3020', .8); elo(-3.6, -44, 1.6, 1.6, '#C8BC9A', ZO, .8) }
  else if (z.k === 'news') { poly([-6, -71, -2, -68, -6, -65], '#8A2A2A'); poly([2, -71, -2, -68, 2, -65], '#8A2A2A'); el(-2, -68, 1.6, 1.6, '#6A1A1A') }
  else if (z.k === 'run') { rr(-9, -64, 14, 13, 2, '#F4F0DE'); ol(ZO, 1); txt('7', -2, -57, 11, '#C25E50', 0) }
  else if (z.k === 'hat' || z.k === 'mini') { const bc = z.k === 'hat' ? '#4A6E9E' : '#E8B6C6'; rr(-9, -58, 19, 22, 3, bc); ol(ZO, 1.4); line([-7, -73, -7, -57], bc, 3.2); line([7, -74, 7, -57], bc, 3.2); el(-7, -57, 1.8, 1.8, '#E8C84A'); el(7, -57, 1.8, 1.8, '#E8C84A'); rr(-4, -51, 8, 6, 1, mix2(bc, '#000000', .2)) }
  else if (z.k === 'pot') { rr(-10, -60, 20, 24, 3, '#EAE4CE'); ol(ZO, 1.3); for (const yy of [-53, -47, -41]) line([-7, yy, 7, yy], '#B8463A', 1.4) }
  else if (z.k === 'frog') { elo(0, -51, 9.5, 12, '#DDF2BC', ZO, 1.3); for (const yy of [-57, -51, -45]) line([-6, yy, 6, yy], '#9ACB7A', 1.2) }
  else if (z.k === 'giant') { line([-14, -70, 13, -36], '#2E1A0C', 4); elo(0, -53, 3.6, 3.6, '#D8B44A', ZO, 1.2) }
  // cổ
  rr(-8, -82, 12, 11, 3, SK[2]); ol(ZO, 1.6);
  // tay trước giơ ra, cổ tay áo rách
  { const ax = -36, ay = -61 + (eating ? Math.sin(t * .45 + 1) * 5 : wk * 3), ex = -22, ey = -63 + (eating ? 0 : wk2 * 1.5);
    limb([-8, -71, ex, ey], c1, 8.5); limb([ex, ey, ax, ay], SK[1], 5.6); poly([ex + 1, ey - 6, ex - 3, ey - 3, ex + 1, ey, ex - 3, ey + 3, ex + 1, ey + 6, ex + 4, ey], c1); line([ex + 1, ey - 6, ex - 3, ey - 3, ex + 1, ey, ex - 3, ey + 3, ex + 1, ey + 6], ZO, 1.2);
    hand(ax - 3, ay, SK[1]);
    if (Z.boss) { ctx.save(); ctx.translate(ax - 2, ay); ctx.rotate(-.6 + (z.sm > 70 ? (z.sm - 70) * -.06 : 0)); ctx.fillStyle = grad(-4, 0, 5, 0, '#9A6A3A', '#6A4420'); rr(-4, -48, 9, 54, 4); ctx.fill(); ol(ZO, 2); elo(0, -50, 11, 13, '#6A4420', ZO, 2); el(-3, -54, 3, 5, '#ffffff22'); for (const [dx, dy] of [[-8, -56], [8, -48], [0, -62]]) poly([dx - 3, dy + 3, dx, dy - 5, dx + 3, dy + 3], '#D8D0C0'); ctx.restore() } }
  if (z.fly) { const bx = -40 + Math.sin(t * .05) * 3; line([-38, -62, bx, -150], '#ffffffcc', 1.4); ctx.fillStyle = rgrad(bx - 2, -172, 26, '#FF9AA8', '#D8304A'); ctx.beginPath(); ctx.ellipse(bx, -172, 19, 23, 0, 0, 7); ctx.fill(); ol('#7A1028', 2); el(bx - 6, -182, 5, 7, '#ffffffaa', -.4); poly([bx - 3, -149, bx + 3, -149, bx, -144], '#D8304A') }
  // ĐẦU: to tròn, tai nhỏ phía sau, đổ bóng nửa sau đầu
  ctx.save(); ctx.translate(-8, -98 + (eating ? ch2 * 2.5 : 0)); ctx.rotate((eating ? -.08 : wk * .04) + .03);
  elo(20, 2, 5, 6.5, SK[1], ZO, 1.6); el(20.5, 2.5, 2.4, 3.6, SK[2]);
  zHead(); ctx.fillStyle = rgrad(-6, -12, 34, SK[0], SK[1]); ctx.fill();
  ctx.save(); zHead(); ctx.clip();
  el(22, 2, 14, 30, SK[2] + 'aa'); el(4, 24, 22, 7, SK[2] + '88'); el(-6, -24, 10, 4.5, '#ffffff55', -.3);
  for (const [bx, by, br] of [[12, -18, 4.4], [16, 10, 3]]) el(bx, by, br, br * .8, SK[3] + '44');
  if (z.hit) { ctx.fillStyle = '#ffffff99'; ctx.fillRect(-30, -40, 60, 70) }
  ctx.restore(); zHead(); ol(ZO, 2.2);
  if (z.k === 'frog') { ctx.fillStyle = grad(0, -34, 0, -4, '#8ED87A', '#4A9A3E'); ctx.beginPath(); ctx.ellipse(1, -6, 27, 25, 0, PI * .98, PI * 2.02); ctx.closePath(); ctx.fill(); ol(ZO, 2); el(-8, -24, 8, 3, '#ffffff44', -.2); for (const d of [-12, 11]) { elo(d, -30, 7.5, 7.5, '#8ED87A', ZO, 1.8); elo(d, -30, 4.2, 4.6, '#fff', ZO, 1); el(d - 1.2, -30, 2, 2.4, ZO) } }
  // mắt: hốc thâm, 1 mắt lồi to · 1 mắt nhỏ mí sụp, con ngươi bé xíu
  el(-11, -4, 12.5, 12, SK[2] + 'aa'); el(6, -6, 9, 8.6, SK[2] + 'aa');
  for (const [ex, ey, r, lid] of [[-11, -6, 10, .28], [6, -8, 7, .52]]) {
    ctx.fillStyle = rgrad(ex, ey, r, '#FFFFF4', '#DCD6BC'); ctx.beginPath(); ctx.ellipse(ex, ey, r, r * 1.04, 0, 0, 7); ctx.fill(); ol(ZO, 1.6);
    const px = ex - r * .38, py = ey + r * .08; el(px, py, r * .2, r * .22, z.angry ? '#C8102A' : '#1E1A24'); el(px - r * .06, py - r * .1, r * .07, r * .07, '#fff');
    for (let q = 0; q < 3; q++) { const a = q * 1.9 + .6; line([ex + Math.cos(a) * r * .95, ey + Math.sin(a) * r, ex + Math.cos(a) * r * .55, ey + Math.sin(a) * r * .6], '#D88A7A88', .8) }
    ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, r, r * 1.04, 0, 0, 7); ctx.clip(); ctx.fillStyle = SK[1]; ctx.fillRect(ex - r, ey - r * 1.1, r * 2, r * 2.1 * (z.hit ? Math.max(lid, .55) : lid)); ctx.restore();
    line([ex - r * .95, ey - r * 1.04 + r * 2.08 * (z.hit ? Math.max(lid, .55) : lid), ex + r * .95, ey - r * 1.04 + r * 2.08 * (z.hit ? Math.max(lid, .55) : lid)], ZO, 1.4);
  }
  if (z.angry || Z.boss) { line([-22, -19, -4, -14], ZO, 2.6); line([0, -15, 13, -19], ZO, 2.4) } else { line([-20, -20, -6, -19], SK[3], 1.8); line([1, -19, 11, -18], SK[3], 1.6) }
  // mũi · má hóp · miệng há lệch, răng thưa
  ctx.fillStyle = SK[1]; ctx.beginPath(); ctx.moveTo(-20, 1); ctx.quadraticCurveTo(-27, 5, -21, 8); ctx.fill(); ol(ZO, 1.5); el(-21.5, 6.5, 1.2, .9, ZO);
  line([4, 5, 10, 12], SK[3] + '99', 1.4);
  { const op = eating ? 2 + ch2 * 5 : 2.2; ctx.fillStyle = '#3A1418'; ctx.beginPath(); ctx.moveTo(-18, 11); ctx.quadraticCurveTo(-8, 9.5, 5, 12); ctx.quadraticCurveTo(-4, 14 + op * 1.6, -16, 13 + op); ctx.closePath(); ctx.fill(); ol(ZO, 1.6);
    if (eating) el(-7, 14 + op, 4.4, 1.8, '#C85A6A');
    for (const [tx, tw, th] of [[-15, 3.4, 3.6], [-6, 3.6, 4.2], [0, 3, 3]]) { rr(tx, 10.6 + (tx + 6) * -.02, tw, th, .8, '#EDE6C4'); ol(ZO, .8) }
    line([-14, 16 + op, -3, 17.5 + op], SK[3], 1.2);
    { const dr = (t * .018 + z.ph * .37) % 1, L = 3 + Math.min(dr, .75) * 17, my = 13 + op, dc = z.slow ? '#E4F2FFdd' : '#D2F2F2dd';   /* nước dãi: sợi dãi dài dần rồi giọt rơi xuống */
      ctx.strokeStyle = dc; ctx.lineWidth = 2.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, my); ctx.quadraticCurveTo(-14.6, my + L * .5, -16.4, my + L); ctx.stroke(); el(-16.6, my + 1.4, 3, 1.6, dc);
      if (dr < .75) { el(-16.4, my + L + 1.4, 2.2, 2.9, dc); el(-17.2, my + L + .6, .7, 1, '#ffffff') } else { const fy = my + L + 2 + (dr - .75) * 90; ctx.globalAlpha *= 1 - (dr - .75) * 3; el(-16.4, fy, 1.8, 2.5, dc); ctx.globalAlpha /= 1 - (dr - .75) * 3; el(-16.4, my + L + 1, 1.3, 1.6, dc) } } }
  // tóc / mũ theo loại
  if (z.k === 'basic' || z.k === 'balloon' || z.k === 'board') { for (const [a, l, b] of [[-6, 9, -4], [1, 12, 3], [8, 9, 6], [13, 6, 4]]) { ctx.strokeStyle = '#2A2620'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a, -31 + Math.abs(a) * .08); ctx.quadraticCurveTo(a + b, -31 - l, a + b * 1.6, -28 - l * .6); ctx.stroke() } }
  else if (z.k === 'mini') { ctx.strokeStyle = '#2A2620'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(2, -31); ctx.bezierCurveTo(0, -44, 14, -42, 8, -36); ctx.stroke() }
  else if (z.k === 'cracker') { for (const [a, l] of [[-8, 8], [-1, 11], [6, 10], [12, 7]]) poly([a - 3, -29, a, -29 - l, a + 3, -29], '#2A2620') }
  else if (z.k === 'run') { ctx.fillStyle = grad(0, -26, 0, -18, '#E8584A', '#B83A30'); rr(-23, -26, 45, 8, 3); ctx.fill(); ol(ZO, 1.6); line([-22, -22, 21, -22], '#ffffffcc', 1.3); poly([20, -24, 33, -30 + wk * 3, 31, -17 + wk * 3], '#D04A3E'); line([20, -24, 33, -30 + wk * 3, 31, -17 + wk * 3], ZO, 1.4); for (const a of [-6, 3, 10]) line([a, -27, a + 3, -36], '#2A2620', 2) }
  else if (z.k === 'giant') { for (let q = 0; q < 6; q++) poly([-19 + q * 7, -25, -15 + q * 7, -40 - (q % 2) * 6, -11 + q * 7, -26], '#2E1A0C'); line([-4, -14, 4, 2], '#8A5A5A', 1.6); for (const u of [.25, .55, .85]) line([-4 + 8 * u - 2, -14 + 16 * u + 1, -4 + 8 * u + 2, -14 + 16 * u - 1], '#8A5A5A', 1.2) }
  else if (z.k === 'news') { for (const [ex, r] of [[-11, 12], [6, 9]]) { ctx.beginPath(); ctx.arc(ex, ex < 0 ? -6 : -8, r, 0, 7); ol('#2A2A3A', 2) } line([1, -9, -1, -9], '#2A2A3A', 2); line([15, -9, 21, -6], '#2A2A3A', 1.8); for (const [a, l] of [[-18, 6], [16, 7], [20, 4]]) { ctx.strokeStyle = '#D8D8D4'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(a, -24); ctx.quadraticCurveTo(a + 4, -24 - l, a + 6, -20 - l * .4); ctx.stroke() } if (z.angry) for (const d of [-1, 1]) el(d * 20 + 2, -32 - (t * .3 % 6), 4 + (t * .3 % 6) * .5, 3, '#ffffffaa') }
  if (z.stun > 0) { ctx.fillStyle = '#FFB020dd'; ctx.beginPath(); ctx.moveTo(-20, -16); ctx.quadraticCurveTo(-2, -32, 18, -16); for (let q = 0; q < 4; q++) ctx.quadraticCurveTo(12 - q * 9, -6 + (q % 2) * 6, 8 - q * 9, -12); ctx.closePath(); ctx.fill(); ol('#A86A00', 1.6); el(-6, -22, 4, 2, '#FFE9A0') }   /* dính mật ong */
  if (z.arm > 0) {
    if (z.k === 'hat') { ctx.fillStyle = grad(0, -50, 0, -18, '#F6E2A0', '#C8963A'); ctx.beginPath(); ctx.ellipse(1, -23, 35, 8, -.06, 0, 7); ctx.fill(); ol('#6A4A14', 2); ctx.fillStyle = grad(0, -52, 0, -22, '#F6E2A0', '#D0A040'); ctx.beginPath(); ctx.moveTo(-17, -24); ctx.quadraticCurveTo(-15, -50, 1, -50); ctx.quadraticCurveTo(16, -50, 17, -25); ctx.closePath(); ctx.fill(); ol('#6A4A14', 2); rr(-17, -31, 34, 6, 2, '#B8463A'); ol('#6A2A20', 1); ctx.strokeStyle = '#A8782A77'; ctx.lineWidth = 1; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(q * 5 + 1, -49); ctx.lineTo(q * 6.5 + 1, -32); ctx.stroke() } for (const a of [-27, 26]) line([a, -22, a + (a < 0 ? -5 : 5), -17], '#A8782A', 1.6); el(-8, -44, 4, 2, '#ffffff55', -.4) }
    else if (z.k === 'pot') { const crack = z.arm < 330; ctx.fillStyle = grad(-20, -50, 20, -16, '#A6AEC2', '#353B50'); ctx.beginPath(); ctx.moveTo(-24, -18); ctx.lineTo(-21, -45); ctx.quadraticCurveTo(0, -51, 21, -45); ctx.lineTo(24, -18); ctx.closePath(); ctx.fill(); ol(ZO, 2.2); rr(-28, -22, 56, 7, 3.5, '#4C5268'); ol(ZO, 1.8); el(-11, -35, 4, 8, '#ffffff55', .3); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 26, -34, 5, d > 0 ? -PI / 2 : PI / 2, d > 0 ? PI / 2 : PI * 1.5); ol(ZO, 3) } if (crack) line([4, -48, -1, -38, 6, -31, 2, -22], '#12141E', 2.2) }
  }
  ctx.restore();
  if (!z.dead) for (let q = 0; q < (Z.mini ? 2 : 3); q++) {   /* ruồi bay vo ve quanh đầu: cánh đập, vệt bay chấm chấm */
    const fa = a => [-6 + Math.cos(a) * (25 + q * 5), -127 + Math.sin(a * 1.6 + q) * 7 - q * 3], a = t * (.08 + q * .022) + z.ph * 1.3 + q * 2.1, [fx, fy] = fa(a), fl = Math.abs(Math.sin(t * 1.9 + q * 1.3));
    for (let k = 1; k <= 4; k++) { const [px, py] = fa(a - k * .16); el(px, py, .7, .7, '#2E2B2833') }
    el(fx - 1, fy - 2.6, 2.8, 1 + fl * 1.8, '#EAF6FFcc', -.5); el(fx + 1.6, fy - 2.6, 2.8, 1 + fl * 1.8, '#EAF6FFcc', .5);
    el(fx, fy, 2.8, 2, '#1E1C22'); el(fx + 1.4, fy + .6, 1.4, 1, '#3A3640'); el(fx - 2, fy - .3, 1.1, 1.1, '#C0202A'); el(fx - .4, fy - 1.1, 1, .5, '#ffffff66') }
  if (z.k === 'news' && z.arm > 0) { ctx.save(); ctx.translate(-36, -66); ctx.rotate(-.08); ctx.fillStyle = grad(-14, 0, 16, 0, '#F6F2E6', '#D8D2C2'); rr(-14, -18, 30, 36, 2); ctx.fill(); ol('#5A5A5A', 1.6); rr(-11, -14, 24, 5, 1, '#3A3A3A'); for (let q = 0; q < 6; q++) line([-11, -5 + q * 3.6, q % 3 === 2 ? 2 : 12, -5 + q * 3.6], '#9A9A9A', 1.2); rr(-11, -5, 9, 9, 1, '#BFBFBF'); line([0, -18, 0, 18], '#C0BCB0', 1); ctx.restore() }
  if (z.k === 'board' && z.arm > 0) { const crack = z.arm < 450; ctx.save(); ctx.translate(-42, -54); ctx.fillStyle = grad(-12, 0, 12, 0, '#D8A464', '#94602E'); rr(-12, -52, 24, 104, 4); ctx.fill(); ol('#4A2C12', 2.2); for (const yy of [-34, -2, 30]) { line([-12, yy, 12, yy], '#6A4420', 1.6); el(-7, yy + 4, 1.6, 1.6, '#3A3A3A'); el(7, yy + 4, 1.6, 1.6, '#3A3A3A') } ctx.strokeStyle = '#8A5A2A88'; ctx.lineWidth = 1; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(-6 + q * 6, -50); ctx.quadraticCurveTo(-3 + q * 6, 0, -6 + q * 6, 50); ctx.stroke() } el(-6, -40, 2.4, 14, '#ffffff22'); if (crack) line([4, -46, -3, -20, 5, 0, -2, 20], '#2A1408', 2.2); ctx.restore() }
  if (z.slow) { ctx.globalAlpha *= .85; emo('❄️', 18, -128, 12) }
  ctx.restore();
  if (Z.boss && !z.dead) { const w = 76, by = Math.max(4, y - 232); rr(x - w / 2 - 2, by, w + 4, 11, 5.5, '#1A1030'); rr(x - w / 2, by + 2, w * clamp(z.hp / (Z.hp * LV.hp), 0, 1), 7, 3.5, '#FF4A6A') }
}
function mix2(a, b, k) { const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('') }
function drawMower(m, y, t) {
  const x = m.x, run = m.st === 1, j = run ? Math.sin(t * 1.2) * 1.2 : 0;
  ctx.save(); ctx.translate(x, y + 22 + j); el(0, 12, 26, 5, '#00000030');
  line([-14, -6, -30, -34], OL, 6); line([-14, -6, -30, -34], '#8A90A8', 3); line([-36, -34, -24, -34], OL, 6);
  ctx.fillStyle = grad(0, -18, 0, 8, '#FF6A6A', '#C81E3A'); rr(-22, -16, 46, 22, 8); ctx.fill(); ol(OL, 2.4); rr(-10, -24, 20, 10, 4, '#FFD23F'); ol(OL, 2); el(-12, -10, 6, 3, '#ffffff77', -.3);
  rr(20, -8, 10, 14, 3, '#4A5068'); ol(OL, 2); for (const dx of [-13, 13]) { elo(dx, 8, 7.5, 7.5, '#2A2A3A', OL, 2); el(dx, 8, 3, 3, '#C8CCD8'); line([dx, 8, dx + Math.cos(t * (run ? .8 : 0)) * 6, 8 + Math.sin(t * (run ? .8 : 0)) * 6], '#8A90A8', 1.6) }
  if (run) for (let i = 0; i < 4; i++) el(-26 - i * 9, 6 - (t * 3 + i * 7) % 14, 3, 2, '#5CD070');
  if (m.left > 1) txt('×2', 0, -34, 12, '#FFE24A');
  ctx.restore();
}
let BG = null, BGK = '';

/* ═════ khu vườn vẽ kỹ (sân trước nhà): hàng cây xa · hàng rào gỗ trắng · thảm cỏ dày · luống đất · bờ giậu lớn bên phải · lối lát đá · ngôi nhà mái ngói ═════ */
function bush(x, y, r, a, b, hl, R) { for (let i = 0; i < 7; i++) { const ang = i / 7 * PI * 2 + R() * .6, rr2 = r * (.45 + R() * .25); el(x + Math.cos(ang) * r * .55, y + Math.sin(ang) * r * .45, rr2, rr2 * .92, i % 2 ? a : b) } el(x, y, r * .62, r * .58, a); for (let i = 0; i < 9; i++) { const ang = R() * PI * 2, d = R() * r * .7; el(x + Math.cos(ang) * d - r * .12, y + Math.sin(ang) * d * .8 - r * .18, r * .12, r * .09, hl) } }
function hedge(x0, y0, w, h, R) {   /* bờ giậu lá dày nhiều lớp */
  ctx.fillStyle = '#2E7A2E'; ctx.fillRect(x0, y0, w, h);
  for (let y = y0 - 10; y < y0 + h + 12; y += 15) for (let x = x0 - 6; x < x0 + w + 8; x += 15) { const r = 11 + R() * 6, jx = (R() - .5) * 8, jy = (R() - .5) * 6; el(x + jx, y + jy + 3, r, r * .9, '#2A6E2A'); el(x + jx - 1, y + jy, r * .86, r * .78, R() < .5 ? '#3E9A3A' : '#47A842'); for (let q = 0; q < 4; q++) el(x + jx - r * .4 + R() * r * .6, y + jy - r * .45 + R() * r * .4, 2.6, 2, '#7FD06A') }
}
function fence(x0, x1, yb, R, night) {   /* hàng rào gỗ trắng nhọn đầu, cao thấp không đều, có thanh ngang phía sau */
  for (const yy of [yb - 30, yb - 12]) { ctx.fillStyle = night ? '#8A90A8' : '#D8D2C4'; ctx.fillRect(x0, yy, x1 - x0, 6); ctx.fillStyle = '#00000022'; ctx.fillRect(x0, yy + 5, x1 - x0, 2) }
  for (let x = x0; x < x1; x += 24) {
    const h = 44 + R() * 10, w = 18, lean = (R() - .5) * .05; ctx.save(); ctx.translate(x + w / 2, yb); ctx.rotate(lean);
    ctx.fillStyle = grad(-w / 2, 0, w / 2, 0, night ? '#C8CCE0' : '#FFFFFF', night ? '#8A90A8' : '#D2CCBE'); ctx.beginPath(); ctx.moveTo(-w / 2, 4); ctx.lineTo(-w / 2, -h + 9); ctx.lineTo(0, -h); ctx.lineTo(w / 2, -h + 9); ctx.lineTo(w / 2, 4); ctx.closePath(); ctx.fill(); ol('#6E6658', 1.8);
    ctx.strokeStyle = '#B8B0A066'; ctx.lineWidth = 1; for (let q = 0; q < 2; q++) { const gx = -4 + q * 7; ctx.beginPath(); ctx.moveTo(gx, -h + 14); ctx.quadraticCurveTo(gx + 2, -h / 2, gx - 1, -4); ctx.stroke() }
    el(0, -h + 20, 1.6, 1.6, '#8A8070'); el(0, -14, 1.6, 1.6, '#8A8070'); if (R() < .3) el(-3, -h * .6, 2.6, 4, '#BEB6A6');
    ctx.restore();
  }
}
function paintYard(st) {
  const R = rng(seed0 * 7 + S.level * 3 + 11), night = st.tod === 2, xr = X0 + COLS * CW, yb = Y0 + ROWS * CH;
  // hàng cây xa sau hàng rào
  for (let x = X0 - 40; x < BW + 40; x += 46) bush(x + R() * 14, Y0 - 44 + R() * 10, 30 + R() * 10, night ? '#1E3A3E' : '#5DAA4A', night ? '#25464A' : '#6CBB55', night ? '#2F5A5A' : '#9BD97A', R);
  fence(X0 - 30, xr + 10, Y0 + 2, R, night);
  // luống đất (hàng không trồng) + bờ cỏ rủ
  for (let r = 0; r < ROWS; r++) {
    const y = Y0 + r * CH;
    if (st.water && st.water.includes(r)) continue;
    if (!st.rows.includes(r)) {
      ctx.fillStyle = grad(0, y, 0, y + CH, night ? '#5A4A3A' : '#B98A56', night ? '#4A3A2A' : '#A47744'); ctx.fillRect(X0, y, COLS * CW, CH);
      for (let q = 0; q < 40; q++) { const px = X0 + R() * COLS * CW, py = y + 8 + R() * (CH - 16); el(px, py, 2 + R() * 3, 1.5 + R() * 2, R() < .5 ? '#8E6638' : '#D2A874'); if (R() < .25) el(px + 1, py - 1, 1, .8, '#F0D4A8') }
      continue;
    }
    // thảm cỏ: sọc đậm nhạt theo cột như sân vừa cắt
    for (let cc = 0; cc < COLS; cc++) {
      const x = X0 + cc * CW, dark = (cc + r) % 2;
      ctx.fillStyle = grad(x, y, x, y + CH, night ? (dark ? '#2E5E3A' : '#356A42') : (dark ? '#4FB43A' : '#5EC548'), night ? (dark ? '#264E30' : '#2C5A36') : (dark ? '#43A332' : '#51B53E')); ctx.fillRect(x, y, CW, CH);
      for (let q = 0; q < 34; q++) { const gx = x + R() * CW, gy = y + 6 + R() * (CH - 8), h = 4 + R() * 6; ctx.strokeStyle = night ? (R() < .5 ? '#3E7A4A' : '#20462A') : (R() < .5 ? '#78D85A' : '#3A9A2A'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + (R() - .5) * 4, gy - h * .6, gx + (R() - .5) * 5, gy - h); ctx.stroke() }
      if (!night && R() < .35) { const fx = x + 10 + R() * (CW - 20), fy = y + 14 + R() * (CH - 24), col = ['#FF5A4A', '#FFE24A', '#FFFFFF'][Math.floor(R() * 3)]; for (let k = 0; k < 5; k++) el(fx + Math.cos(k * 1.26) * 2.6, fy + Math.sin(k * 1.26) * 2.6, 2, 2, col); el(fx, fy, 1.4, 1.4, '#FFB020') }
    }
    // mép cỏ rủ lên/xuống luống đất bên cạnh
    for (const [edge, dir] of [[y, -1], [y + CH, 1]]) { const nb = r + dir, nbOn = nb >= 0 && nb < ROWS && (st.rows.includes(nb) || (st.water && st.water.includes(nb))); if (nbOn) continue; for (let x = X0; x < xr; x += 7) { const h = 4 + R() * 7; ctx.fillStyle = night ? '#2C5A36' : (R() < .5 ? '#51B53E' : '#5EC548'); ctx.beginPath(); ctx.moveTo(x, edge); ctx.lineTo(x + 3.5, edge + dir * h); ctx.lineTo(x + 7, edge); ctx.fill() } }
  }
  // bờ giậu lớn bên phải (ma chui ra từ đây) + lối lát đá phía dưới
  hedge(xr + 2, Y0 - 30, BW - xr + 10, ROWS * CH + 40, R); if (night) { ctx.fillStyle = '#0A104055'; ctx.fillRect(xr, Y0 - 40, BW - xr, ROWS * CH + 50) }
  ctx.fillStyle = night ? '#6A6E80' : '#D8D2C2'; ctx.fillRect(0, yb, BW, BH - yb);
  for (let x = -20; x < BW; x += 62) { const w = 54 + R() * 12, sx = x + R() * 6; rr(sx, yb + 4, w, BH - yb + 6, 5, night ? '#7A7E92' : '#E8E2D2'); ol(night ? '#4A4E60' : '#A8A090', 1.6); el(sx + 10, yb + 10, 6, 2, '#ffffff55'); if (R() < .4) { ctx.strokeStyle = night ? '#3E7A4A' : '#5EB848'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx - 2, yb + 22); ctx.lineTo(sx - 4, yb + 14); ctx.moveTo(sx, yb + 22); ctx.lineTo(sx + 1, yb + 12); ctx.stroke() } }
  ctx.fillStyle = '#00000022'; ctx.fillRect(0, yb, BW, 4);
  // ngôi nhà: tường kem ốp gỗ, mái ngói cam, cửa sổ kính xanh, cửa vòm, đèn hiên, chậu cây
  const hw = X0 - 52;
  ctx.fillStyle = grad(0, 0, hw, 0, night ? '#B8A890' : '#FFF2DA', night ? '#9A8C76' : '#EAD6B0'); ctx.fillRect(0, Y0 - 20, hw, yb - Y0 + 24);
  ctx.strokeStyle = night ? '#7A6C58' : '#D2BC94'; ctx.lineWidth = 1; for (let y = Y0; y < yb; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(hw, y); ctx.stroke() }
  // mái ngói chìa ra phía trên
  ctx.save(); ctx.beginPath(); ctx.moveTo(-10, Y0 - 76); ctx.lineTo(hw + 26, Y0 - 76); ctx.lineTo(hw + 40, Y0 - 8); ctx.lineTo(-10, Y0 - 8); ctx.closePath(); ctx.fillStyle = grad(0, Y0 - 76, 0, Y0 - 8, '#E8763A', '#B84A22'); ctx.fill(); ctx.clip();
  for (let y = Y0 - 76; y < Y0; y += 11) for (let x = -14 + ((y / 11) % 2) * 9; x < hw + 44; x += 18) { ctx.beginPath(); ctx.arc(x, y, 9, 0, PI); ctx.fillStyle = '#D85E2C'; ctx.fill(); ctx.strokeStyle = '#8A2E12'; ctx.lineWidth = 1.4; ctx.stroke(); el(x - 3, y + 3, 3, 1.4, '#FFB07A88') }
  ctx.restore(); ctx.beginPath(); ctx.moveTo(-10, Y0 - 8); ctx.lineTo(hw + 40, Y0 - 8); ol('#6A2410', 3); rr(-4, Y0 - 10, hw + 46, 6, 2, '#F2EAD8'); ol('#8A7A5A', 1.4);
  elo(hw - 12, Y0 - 50, 13, 13, '#D84A3A', '#6A2410', 2.4); poly([hw - 18, Y0 - 50, hw - 6, Y0 - 50, hw - 12, Y0 - 44], '#fff');   // huy hiệu tròn trên mái
  // cửa sổ có rèm
  for (const y of [Y0 + 46, Y0 + 312]) { rr(6, y, hw - 12, 62, 6, night ? '#FFE08A' : '#9AD4F4'); ol('#7A5A3A', 3); if (!night) { poly([9, y + 3, 26, y + 3, 9, y + 40], '#ffffff66') } else glow(hw / 2, y + 31, 50, '#FFE08A55'); line([hw / 2, y, hw / 2, y + 62], '#7A5A3A', 2.6); line([6, y + 31, hw - 6, y + 31], '#7A5A3A', 2.6); rr(2, y + 64, hw - 4, 7, 2, '#8A6A4A'); ol('#4A3420', 1.4) }
  // cửa vòm + đèn hiên + chậu cây + thảm
  ctx.fillStyle = grad(0, Y0 + 160, 0, Y0 + 280, '#9A6234', '#6E4020'); ctx.beginPath(); ctx.moveTo(6, Y0 + 284); ctx.lineTo(6, Y0 + 186); ctx.quadraticCurveTo(hw / 2, Y0 + 146, hw - 6, Y0 + 186); ctx.lineTo(hw - 6, Y0 + 284); ctx.closePath(); ctx.fill(); ol('#3E2410', 3);
  for (const x of [14, 30, 46]) if (x < hw - 8) line([x, Y0 + 186, x, Y0 + 280], '#4E2E14', 1.4); el(hw - 13, Y0 + 238, 3.2, 3.2, '#FFD23F'); rr(2, Y0 + 284, hw + 8, 8, 2, '#C8A878'); ol('#7A5A3A', 1.4);
  line([hw + 2, Y0 + 168, hw + 12, Y0 + 168], '#3A3A44', 2.4); rr(hw + 7, Y0 + 168, 12, 18, 3, '#3A3A44'); rr(hw + 9, Y0 + 171, 8, 12, 2, night ? '#FFF2A0' : '#FFE9A0'); if (night) glow(hw + 13, Y0 + 178, 40, '#FFE08A66');
  rr(hw - 2, Y0 + 268, 22, 18, 3, '#C8643A'); ol('#6A2A12', 2); bush(hw + 9, Y0 + 258, 14, '#3E9A3A', '#4FB048', '#8FD878', R);
  ctx.fillStyle = '#00000022'; ctx.fillRect(hw - 4, Y0 - 4, 6, yb - Y0 + 8);
}
function makeBg() {   // nền vẽ 1 lần mỗi màn: trời · nhà · hàng rào · sân cỏ kẻ sọc · lối đi
  const st = STAGES[S.level], k = S.level + '|' + lvSel; if (BG && BGK === k) return BG;
  const c = document.createElement('canvas'); c.width = BW * 2; c.height = BH * 2; const keep = ctx; ctx = c.getContext('2d'); ctx.scale(2, 2);
  const sky = [['#6EC6FF', '#CDEEFF'], ['#58B8FF', '#FFE2B8'], ['#0E1440', '#2E3A7A']][st.tod];
  ctx.fillStyle = grad(0, 0, 0, Y0 + 20, sky[0], sky[1]); ctx.fillRect(0, 0, BW, Y0 + 20);
  if (st.tod === 2) { for (let i = 0; i < 40; i++) el((i * 137) % BW, (i * 53) % 86, 1 + (i % 3) * .5, 1 + (i % 3) * .5, '#ffffffcc'); glow(820, 44, 60, '#FFFFFF55'); elo(820, 44, 22, 22, '#FFF8D8', '#C8C0A0', 2); el(812, 38, 4, 4, '#E8E0C0'); el(826, 50, 3, 3, '#E8E0C0') }
  else { glow(810, 40, 70, st.tod ? '#FFE08Aaa' : '#FFFFFFaa'); elo(810, 40, 22, 22, '#FFE66B', '#E8A820', 2); for (const [x, y, s] of [[300, 30, 1], [520, 52, .8], [680, 26, .7]]) { ctx.fillStyle = st.tod ? '#FFE0C8' : '#fff'; ctx.beginPath(); for (const [dx, dy, r] of [[-22, 6, 14], [-6, -2, 19], [14, 2, 16], [30, 8, 11]]) ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill() } }
  // đồi xa + hàng rào
  ctx.fillStyle = ['#8ED37A', '#C8A24E', '#1E3A4E'][st.tod]; ctx.beginPath(); ctx.moveTo(0, Y0 + 6); for (let x = 0; x <= BW; x += 60) ctx.quadraticCurveTo(x + 30, Y0 - 34 - (x % 180) * .12, x + 60, Y0 + 6); ctx.lineTo(BW, Y0 + 20); ctx.lineTo(0, Y0 + 20); ctx.fill();
  for (let x = X0 - 10; x < BW; x += 26) { ctx.fillStyle = grad(0, Y0 - 34, 0, Y0 + 6, '#FFFDF4', '#D8CDB8'); ctx.beginPath(); ctx.moveTo(x, Y0 + 6); ctx.lineTo(x, Y0 - 24); ctx.lineTo(x + 9, Y0 - 34); ctx.lineTo(x + 18, Y0 - 24); ctx.lineTo(x + 18, Y0 + 6); ctx.closePath(); ctx.fill(); ol('#8A7A5A', 1.6) } rr(X0 - 14, Y0 - 16, BW, 6, 2, '#EFE6D2'); ol('#8A7A5A', 1.2);
  // sân cỏ
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { const on = st.rows.includes(r), x = X0 + cc * CW, y = Y0 + r * CH;
    if (st.roof) { ctx.fillStyle = grad(x, y, x, y + CH, cc < 5 ? '#E8694A' : '#D8563E', cc < 5 ? '#C84A32' : '#B8402C'); ctx.fillRect(x, y, CW, CH); ctx.strokeStyle = '#8A2A1A88'; ctx.lineWidth = 1.6; for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 2; tx++) { const px = x + tx * CW / 2 + (ty % 2) * CW / 4, py = y + ty * 31 + 31; ctx.beginPath(); ctx.arc(px, py - 31, CW / 4, .15, PI - .15); ctx.stroke() } ctx.fillStyle = '#ffffff18'; ctx.fillRect(x, y, CW, 5); if (cc < 5) { ctx.fillStyle = '#00000014'; ctx.fillRect(x, y, CW, CH) } if (cc === 5) { ctx.fillStyle = '#7A2418'; ctx.fillRect(x - 5, y, 10, CH); ctx.fillStyle = '#F08A6A'; ctx.fillRect(x - 5, y, 3, CH) } continue }
    if (st.water && st.water.includes(r)) { ctx.fillStyle = grad(x, y, x, y + CH, '#5CC8F0', '#2E8AD0'); ctx.fillRect(x, y, CW, CH); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { const wy = y + 20 + q * 28, wx = x + ((q * 31 + cc * 17) % 40); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 9, wy - 5, wx + 18, wy); ctx.quadraticCurveTo(wx + 27, wy + 5, wx + 36, wy); ctx.stroke() } if (r === st.water[0]) { ctx.fillStyle = '#E8F0F8'; ctx.fillRect(x, y, CW, 7); ctx.fillStyle = '#A8B8C8'; ctx.fillRect(x, y + 7, CW, 2) } if (r === st.water[st.water.length - 1]) { ctx.fillStyle = '#E8F0F8'; ctx.fillRect(x, y + CH - 7, CW, 7) } continue }
    ctx.fillStyle = on ? ((r + cc) % 2 ? '#6FCB52' : '#84DA63') : ((r + cc) % 2 ? '#B08A5A' : '#BE986A'); ctx.fillRect(x, y, CW, CH); if (on) { ctx.fillStyle = '#ffffff14'; ctx.fillRect(x, y, CW, CH * .5); ctx.strokeStyle = '#4EA83E66'; ctx.lineWidth = 1.4; for (let q = 0; q < 5; q++) { const gx = x + 8 + ((q * 37 + r * 13 + cc * 29) % (CW - 16)), gy = y + 12 + ((q * 53 + cc * 17) % (CH - 20)); ctx.beginPath(); ctx.moveTo(gx - 3, gy); ctx.lineTo(gx - 1, gy - 6); ctx.moveTo(gx, gy); ctx.lineTo(gx + 1, gy - 7); ctx.moveTo(gx + 3, gy); ctx.lineTo(gx + 4, gy - 5); ctx.stroke() } if ((r * 7 + cc * 3) % 11 === 0) { for (let q = 0; q < 5; q++) el(x + 20 + Math.cos(q * 1.26) * 4, y + 70 + Math.sin(q * 1.26) * 4, 2.6, 2.6, '#fff'); el(x + 20, y + 70, 2, 2, '#FFD23F') } } else for (let q = 0; q < 4; q++) el(x + 10 + (q * 23 + cc * 7) % 60, y + 14 + (q * 31) % 66, 3, 2, '#8A6A42') }
  // lối đi bên phải + mép sân
  if (st.roof) { ctx.fillStyle = grad(X0 + COLS * CW, 0, BW, 0, '#A83A28', '#7A2418'); ctx.fillRect(X0 + COLS * CW, Y0, BW - X0 - COLS * CW, ROWS * CH); ctx.fillStyle = '#C8CCD8'; ctx.fillRect(X0 + COLS * CW + 6, Y0, 8, ROWS * CH) }
  else { ctx.fillStyle = grad(X0 + COLS * CW, 0, BW, 0, '#B8BCC8', '#8E93A4'); ctx.fillRect(X0 + COLS * CW, Y0, BW - X0 - COLS * CW, ROWS * CH); for (let y = Y0 + 20; y < Y0 + ROWS * CH; y += 46) rr(X0 + COLS * CW + 16, y, 6, 22, 3, '#ffffffaa') }
  if (st.water) { ctx.fillStyle = '#E8F0F8'; ctx.fillRect(X0 - 8, Y0 + st.water[0] * CH, 8, st.water.length * CH); ctx.fillRect(X0 + COLS * CW, Y0 + st.water[0] * CH, 10, st.water.length * CH) }
  ctx.fillStyle = '#5A8A3A'; ctx.fillRect(0, Y0 + ROWS * CH, BW, BH); ctx.fillStyle = '#4A7A2E'; ctx.fillRect(0, Y0 + ROWS * CH, BW, 5);
  // nhà bên trái (mái nhà: ống khói gạch)
  if (st.roof) { ctx.fillStyle = grad(0, 0, X0 - 54, 0, '#9A4A34', '#7A3424'); ctx.fillRect(0, Y0 - 4, X0 - 54, ROWS * CH + 8); for (let y = Y0; y < Y0 + ROWS * CH; y += 18) { ctx.strokeStyle = '#5A2014'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(X0 - 54, y); ctx.stroke(); for (let x = (y / 18 % 2) * 17; x < X0 - 54; x += 34) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke() } } rr(4, Y0 + 150, 56, 170, 6, '#5A4A4A'); ol('#2A1E1E', 3); rr(-2, Y0 + 138, 68, 20, 5, '#7A6A6A'); ol('#2A1E1E', 3); ctx.fillStyle = '#9AA0B0'; ctx.fillRect(X0 - 54, Y0, 8, ROWS * CH); ctx = keep; BG = c; BGK = k; return c }
  ctx.fillStyle = grad(0, Y0, X0 - 52, Y0, '#FFE9C8', '#F2CF9A'); ctx.fillRect(0, Y0 - 4, X0 - 54, ROWS * CH + 8); ctx.strokeStyle = '#B8905A'; ctx.lineWidth = 1.2; for (let y = Y0 + 18; y < Y0 + ROWS * CH; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(X0 - 54, y); ctx.stroke() }
  poly([0, Y0 - 4, X0 - 40, Y0 - 4, X0 - 54, Y0 + 26, 0, Y0 + 26], '#E0563E'); ctx.strokeStyle = '#8A2A1A'; ctx.lineWidth = 2; ctx.strokeRect(-2, Y0 - 4, X0 - 40, 30);
  rr(8, Y0 + 190, 44, 86, 8, '#8A5A2A'); ol('#4A2E10', 2.4); rr(14, Y0 + 198, 32, 30, 4, '#A8743A'); rr(14, Y0 + 236, 32, 32, 4, '#A8743A'); el(44, Y0 + 236, 3, 3, '#FFD23F');
  for (const y of [Y0 + 60, Y0 + 330]) { rr(8, y, 44, 44, 6, st.tod === 2 ? '#FFE08A' : '#BFE8FF'); ol('#8A5A2A', 3); line([30, y, 30, y + 44], '#8A5A2A', 2.4); line([8, y + 22, 52, y + 22], '#8A5A2A', 2.4); if (st.tod === 2) glow(30, y + 22, 44, '#FFE08A55') }
  ctx.fillStyle = '#9AA0B0'; ctx.fillRect(X0 - 54, Y0, 8, ROWS * CH);
  if (!st.roof) paintYard(st);
  if (st.tod === 2) { ctx.fillStyle = '#0A104066'; ctx.fillRect(0, Y0 - 40, BW, BH) }
  ctx = keep; BG = c; BGK = k; return c;
}
function cardBox(i) { return { x: 102 + i * 54, y: 8, w: 51, h: 80 } }
const SHV = { x: 646, y: 14, w: 52, h: 66 };
function drawTop(t) {
  ctx.fillStyle = grad(0, 0, 0, 94, '#9A6A3A', '#6E4520'); rr(2, 2, BW - 4, 92, 12); ctx.fill(); ol('#3E2410', 3); ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, 8); ctx.lineTo(BW - 14, 8); ctx.stroke();
  // ô nắng
  rr(8, 8, 88, 80, 10, '#3E2410'); glow(52, 38, 34, '#FFE66Baa'); ctx.save(); ctx.translate(52, 36); ctx.rotate(t * .01); for (let i = 0; i < 10; i++) { ctx.rotate(PI / 5); poly([-4, -15, 0, -24, 4, -15], '#FFD23F') } ctx.restore(); elo(52, 36, 15, 15, '#FFE66B', '#C88A00', 2.2); el(47, 31, 4, 3, '#fff8');
  rr(14, 62, 76, 22, 8, '#FFF6DC'); txt(String(Math.floor(S.energy)), 52, 74, 17, '#3E2410', 0);
  // thẻ cây
  cards().forEach((k, i) => {
    const b = cardBox(i), D = PLANTS[k], can = S.energy >= D.cost && !(cds[k] > 0), on = sel === k;
    ctx.fillStyle = grad(0, b.y, 0, b.y + b.h, on ? '#FFF6B0' : '#E8F6D8', on ? '#FFD84A' : '#A8D88A'); rr(b.x, b.y - (on ? 4 : 0), b.w, b.h, 8); ctx.fill(); ol(on ? '#FF7A1A' : '#3E2410', on ? 3.4 : 2.2);
    drawPlant({ k, t: 999, hp: D.hp, bob: 0, card: 1 }, b.x + b.w / 2, b.y + (D.base ? 22 : 36) - (on ? 4 : 0), 0, .46);
    rr(b.x + 3, b.y + b.h - 22 - (on ? 4 : 0), b.w - 6, 18, 7, '#FFFDF0'); txt(D.cost + '☀', b.x + b.w / 2, b.y + b.h - 12.5 - (on ? 4 : 0), 12, can ? '#3E2410' : '#C23A55', 0);
    if (cds[k] > 0) { ctx.fillStyle = '#12101Eaa'; rr(b.x, b.y, b.w, b.h * cds[k] / cdOf(k), 8); ctx.fill() } else if (S.energy < D.cost) { ctx.fillStyle = '#12101E55'; rr(b.x, b.y, b.w, b.h, 8); ctx.fill() }
    txt(String((i + 1) % 10), b.x + 9, b.y + 10, 11, '#fff');
  });
  // xẻng · xu · màn
  rr(SHV.x, SHV.y - (shovel ? 4 : 0), SHV.w, SHV.h, 10, shovel ? '#FFE24A' : '#D8C8A8'); ol(shovel ? '#FF7A1A' : '#3E2410', shovel ? 3.4 : 2.2); ctx.save(); ctx.translate(SHV.x + 26, SHV.y + 32 - (shovel ? 4 : 0)); ctx.rotate(.6); rr(-3, -24, 6, 30, 3, '#A8743A'); ol(OL, 1.6); ctx.fillStyle = grad(-10, 4, 10, 24, '#E0E4F0', '#8A90A8'); ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, 4); ctx.lineTo(9, 16); ctx.quadraticCurveTo(0, 28, -9, 16); ctx.closePath(); ctx.fill(); ol(OL, 2); rr(-8, -28, 16, 6, 3, '#6A4420'); ctx.restore();
  rr(704, 14, 92, 30, 10, '#3E2410'); elo(720, 29, 10, 10, '#FFD23F', '#B87A00', 2); txt('$', 720, 30, 12, '#B87A00', 0); txt(String(S.coins), 764, 30, 16, '#FFE9A0', 0);
  rr(704, 50, 92, 30, 10, '#3E2410'); txt('Màn ' + (S.level + 1) + '/' + NS, 750, 66, 14, '#fff', 0);
  rr(802, 14, 90, 66, 10, '#3E2410'); txt(STAGES[S.level].ic, 847, 34, 22, '#fff', 0); txt('⭐ ' + score, 847, 64, 14, '#FFE24A', 0);
}
function drawProg() {
  const x = 600, y = 584, w = 270, k = total ? clamp(si / total, 0, 1) : 0; rr(x - 6, y - 9, w + 12, 20, 10, '#1A1030cc'); rr(x, y - 4, w, 10, 5, '#3A3458'); ctx.fillStyle = grad(x, 0, x + w, 0, '#7AE08A', '#FF6A6A'); rr(x + w * (1 - k), y - 4, w * k, 10, 5); ctx.fill();
  for (const b of bigAt) { const fx2 = x + w * (1 - (sched.findIndex(e => e.flag && e === sched.filter(q => q.flag)[bigAt.indexOf(b)]) + 1) / total); line([fx2, y - 16, fx2, y + 4], '#fff', 2); poly([fx2, y - 16, fx2 + 11, y - 12, fx2, y - 8], '#FF4A6A') }
  elo(x + w * (1 - k), y + 1, 9, 9, '#8FD9B6', OL, 2); el(x + w * (1 - k) - 3, y, 2.4, 2.6, '#fff'); el(x + w * (1 - k) + 3, y, 1.8, 2, '#fff');
  txt('Bầy ma', x - 40, y + 1, 12, '#fff');
}
function draw() {
  const t = S.tick, st = STAGES[S.level];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  { /* hai bên sân: trời + đồi + bụi cây nối liền với cảnh trong sân (không để nền trơn) */
    const hy = oy + (Y0 + 6) * sc, night = st.tod === 2, sk = night ? ['#0E1440', '#2E3A7A'] : st.tod ? ['#58B8FF', '#FFE2B8'] : ['#6EC6FF', '#CDEEFF'];
    ctx.fillStyle = grad(0, 0, 0, hy, sk[0], sk[1]); ctx.fillRect(0, 0, cw, hy + 2);
    ctx.fillStyle = st.roof ? grad(0, hy, 0, ch, '#B8402C', '#7A2418') : night ? grad(0, hy, 0, ch, '#1E4A3A', '#102A26') : grad(0, hy, 0, ch, '#6FCB52', '#3E8E34'); ctx.fillRect(0, hy, cw, ch - hy);
    if (!st.roof) {
      const R = rng(77), xl = ox, xr2 = ox + BW * sc, yt = oy + (Y0 - 30) * sc;
      if (xl > 4) { ctx.save(); ctx.translate(xl, 0); ctx.scale(sc, sc); const hh = ch / sc; ctx.fillStyle = grad(-400, 0, 0, 0, night ? '#8A7C66' : '#E4CFA6', night ? '#B8A890' : '#FFF2DA'); ctx.fillRect(-xl / sc - 2, (Y0 - 20) + oy / sc * 0 - oy / sc, xl / sc + 2, hh + 40); ctx.strokeStyle = night ? '#7A6C58' : '#D2BC94'; ctx.lineWidth = 1; for (let y = -oy / sc + Y0 % 14; y < hh; y += 14) { ctx.beginPath(); ctx.moveTo(-xl / sc - 2, y); ctx.lineTo(0, y); ctx.stroke() } ctx.restore() }
      if (cw - xr2 > 4) { ctx.save(); ctx.translate(xr2, oy); ctx.scale(sc, sc); hedge(-4, (-oy / sc) - 20, (cw - xr2) / sc + 12, ch / sc + 40, R); if (night) { ctx.fillStyle = '#0A104055'; ctx.fillRect(-4, -oy / sc - 20, (cw - xr2) / sc + 12, ch / sc + 40) } ctx.restore() }
    }
  }
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, ox * dpr, oy * dpr); ctx.imageSmoothingEnabled = true;
  ctx.save(); rr(0, 0, BW, BH, 14); ctx.shadowColor = '#00000066'; ctx.shadowBlur = 18; ctx.fillStyle = st.roof ? '#8A3020' : st.tod === 2 ? '#27503A' : '#62B84C'; ctx.fill(); ctx.shadowBlur = 0; ctx.clip(); ctx.drawImage(makeBg(), 0, 0, BW, BH);
  if (state === 'shop') { drawShop(t); ctx.restore(); return }
  // ô đang trỏ
  const hv = hover || (cur.on ? cur : null);
  if (state === 'play' && hv && rowOK(hv.r) && hv.c >= 0 && hv.c < COLS && (sel || shovel)) { const x = X0 + hv.c * CW, y = Y0 + hv.r * CH; ctx.fillStyle = shovel ? '#FF6A6A44' : '#ffffff44'; ctx.fillRect(x, y, CW, CH); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.strokeRect(x + 2, y + 2, CW - 4, CH - 4); ctx.setLineDash([]); if (sel && !P(hv.r, hv.c) && (PLANTS[sel].base ? !bases[hv.r * COLS + hv.c] : true)) { ctx.globalAlpha = .5; drawPlant({ k: sel, t: 999, hp: PLANTS[sel].hp, bob: 0, card: 1 }, cellX(hv.c), cellY(hv.r), 0); ctx.globalAlpha = 1 } }
  for (let r = 0; r < ROWS; r++) {
    if (mow[r] && mow[r].st !== 2) drawMower(mow[r], cellY(r), t);
    for (let c = 0; c < COLS; c++) if (graves[r * COLS + c]) drawGrave(cellX(c), cellY(r), r * 13 + c);
    for (let c = 0; c < COLS; c++) { const nb = needBase(r, c); if (nb && bases[r * COLS + c] > 0) drawPlant({ k: nb, bob: c }, cellX(c), cellY(r), t); const p = P(r, c); if (p) { if (p.bit) p.bit--; drawPlant(p, cellX(c), cellY(r) - (nb ? 12 : 0), t) } }
    for (const z of zs) if (z.r === r && z.rise) { const gy = cellY(r) + 40; ctx.save(); ctx.beginPath(); ctx.rect(z.x - 120, gy - 300, 240, 300); ctx.clip(); drawZombie(z, z.x, gy + z.rise * 2.2, t); ctx.restore(); for (let q = 0; q < 4; q++) el(z.x - 20 + q * 13 + Math.sin(t * .4 + q) * 3, gy - 2 - Math.abs(Math.sin(t * .3 + q)) * 6, 4, 3, '#6A4A2E') }
    for (const z of zs) if (z.r === r && !z.rise) { const wet = st.water && st.water.includes(r) && z.x < X0 + COLS * CW + 6 && !z.jt; if (wet) { ctx.save(); ctx.beginPath(); ctx.rect(z.x - 110, cellY(r) - 240, 220, 256); ctx.clip(); drawZombie(z, z.x, cellY(r) + 36 + 30 + Math.sin(t * .08 + z.ph) * 2, t); ctx.restore(); if (!z.dead) { const fy = cellY(r) + 17 + Math.sin(t * .08 + z.ph) * 2; ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.ellipse(z.x, fy, 22, 8, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#FF6A8A'; ctx.setLineDash([9, 13]); ctx.stroke(); ctx.setLineDash([]) } } else drawZombie(z, z.x, cellY(r) + 36, t) }
    for (const s of shots) if (s.r === r) { if (s.lob && s.corn) { if (s.honey) { elo(s.x, s.y, 8, 6.5, '#FFB020', '#A86A00', 1.8); el(s.x - 2, s.y - 2, 2.4, 1.6, '#FFE9A0') } else { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.u * 8); ctx.fillStyle = rgrad(0, -2, 8, '#FFF6A0', '#F2B01E'); ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(-6, -7, 0, -8); ctx.quadraticCurveTo(6, -7, 6, 4); ctx.closePath(); ctx.fill(); ol('#9A5E00', 1.6); ctx.restore() } } else if (s.big) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.x * .05); elo(0, 0, 14, 13, '#FF9A3A', '#6A2A0A', 2); for (const dx of [-5, 5]) { ctx.beginPath(); ctx.ellipse(dx, 0, 4, 12, 0, 0, 7); ol('#C8601A88', 1.2) } ctx.restore() } else if (s.star) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.x * .08); ctx.fillStyle = '#FFE24A'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * PI / 5, q = i % 2 ? 3.4 : 8; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q) } ctx.closePath(); ctx.fill(); ol('#8A7A00', 1.4); ctx.restore() } else if (s.pea) { elo(s.x, s.y, 7.5, 7.5, '#7AE04A', '#2A7A1A', 1.8); el(s.x - 2.4, s.y - 2.4, 2.4, 2, '#E0FFC0') } else if (s.lob) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.u * 9); elo(0, 0, 8.5, 7.5, '#FFF6D8', '#C8A040', 1.8); elo(4, -3, 4.5, 4, '#FFFDF4', '#C8A040', 1.4); ctx.restore() } else if (s.ice) { glow(s.x, s.y, 14, '#BDF4FFaa'); elo(s.x, s.y, 7, 7, '#8AE8FF', '#1E7AA8', 1.8); el(s.x - 2, s.y - 2, 2.4, 2, '#fff') } else { elo(s.x, s.y, 7.5, 6.5, '#FFD84A', '#9A5E00', 1.8); el(s.x - 2, s.y - 2, 2.6, 2, '#FFF6C0') } }
  }
  if (st.storm && state === 'play') { ctx.strokeStyle = '#C8D8FF66'; ctx.lineWidth = 1.4; for (let q = 0; q < 70; q++) { const rx = (q * 131 + t * 9) % (BW + 60) - 30, ry = (q * 71 + t * 17) % BH; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 14); ctx.stroke() } if (t % 520 < 8 || (t + 37) % 760 < 5) { ctx.fillStyle = '#FFFFFF66'; ctx.fillRect(0, 0, BW, BH) } }
  if (st.fog && state !== 'intro') {   // sương mù che từ cột 6 trở đi — quanh 🍄 Nấm Đèn (2 ô) thì quang
    const lamps = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = P(r, c); if (p && p.k === 'lamp') lamps.push([r, c]) }
    for (let r = 0; r < ROWS; r++) for (let c = 5; c <= COLS; c++) { let near = 9; for (const [lr, lc] of lamps) near = Math.min(near, Math.hypot((lr - r) * 1.1, lc - c)); const a = clamp((near - 1.6) / 1.2, 0, 1) * (c === 5 ? .5 : .9); if (a < .03) continue; ctx.globalAlpha = a; const x = cellX(c), y = cellY(r); for (let q = 0; q < 4; q++) el(x - 26 + q * 18 + Math.sin(t * .012 + r * 2 + c + q) * 9, y + ((q * 37 + c * 11) % 50) - 22, 40, 30, q % 2 ? '#C4CCE0' : '#DDE3F2') }
    ctx.globalAlpha = 1;
  }
  for (const e of fx) {
    const k = e.t / e.life;
    if (e.k === 'boom') { ctx.globalAlpha = 1 - k; if (e.dust) { for (let i = 0; i < 6; i++) el(e.x + Math.cos(i) * e.r * k, e.y + Math.sin(i) * e.r * k * .6, 10, 10, '#C8B090') } else { glow(e.x, e.y, e.r * (1 + k), '#FFE08A'); for (let i = 0; i < 12; i++) { const a = i * PI / 6; el(e.x + Math.cos(a) * e.r * k * 1.1, e.y + Math.sin(a) * e.r * k * .9, 14 * (1 - k) + 4, 14 * (1 - k) + 4, ['#FF7A1A', '#FFD23F', '#FF4A4A'][i % 3]) } if (k < .5) txt('BÙM!', e.x, e.y - 20 - k * 30, 30, '#FFE24A', '#C8321E') } ctx.globalAlpha = 1 }
    else if (e.k === 'puff') { ctx.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) el(e.x + Math.cos(i * 1.05) * 22 * k, e.y + Math.sin(i * 1.05) * 12 * k, 7 * (1 - k) + 2, 7 * (1 - k) + 2, '#C8A878'); ctx.globalAlpha = 1 }
    else if (e.k === 'hit') { ctx.globalAlpha = 1 - k; for (let i = 0; i < 5; i++) el(e.x + Math.cos(i * 1.3) * 14 * k, e.y + Math.sin(i * 1.3) * 14 * k, 3, 3, e.ice ? '#BDF4FF' : '#FFE08A'); ctx.globalAlpha = 1 }
    else if (e.k === 'hat') { ctx.globalAlpha = 1 - k; ctx.save(); ctx.translate(e.x + k * 30, e.y - Math.sin(k * PI) * 40 + k * 60); ctx.rotate(k * 4); if (e.zk === 'pot') { rr(-18, -12, 36, 22, 5, '#4A5068'); ol(OL, 2) } else { el(0, 0, 26, 7, '#E8C060'); el(0, -6, 13, 10, '#E8C060') } ctx.restore(); ctx.globalAlpha = 1 }
    else if (e.k === 'pop') { ctx.globalAlpha = 1 - k; for (let i = 0; i < 8; i++) { const a = i * PI / 4; el(e.x + Math.cos(a) * 28 * k, e.y + Math.sin(a) * 28 * k, 4 * (1 - k) + 1, 4 * (1 - k) + 1, '#E8304A') } txt('BỤP!', e.x, e.y - 20 * k, 18, '#fff', '#E8304A'); ctx.globalAlpha = 1 }
    else if (e.k === 'txt') { ctx.globalAlpha = 1 - k; txt(e.s, e.x, e.y - k * 24, 16, '#FFE24A'); ctx.globalAlpha = 1 }
  }
  for (const s of suns) { const b = Math.sin(t * .1 + s.x) * 2, a = s.t > 270 && !s.got ? .5 + .5 * Math.sin(t * .5) : 1; ctx.globalAlpha = a; glow(s.x, s.y + b, 34, '#FFF2A0cc'); ctx.save(); ctx.translate(s.x, s.y + b); ctx.rotate(t * .02); for (let i = 0; i < 10; i++) { ctx.rotate(PI / 5); poly([-4.5, -15, 0, -25, 4.5, -15], '#FFD23F') } ctx.restore(); elo(s.x, s.y + b, 16, 16, '#FFE66B', '#C88A00', 2.2); el(s.x - 5, s.y + b - 5, 5, 3.6, '#ffffffaa', -.5); txt(String(s.val), s.x, s.y + b + 1, 12, '#8A5A00', 0); ctx.globalAlpha = 1 }
  for (const d of drops) { const w = Math.abs(Math.cos(t * .12 + d.x)); elo(d.x, d.y, 11 * w + 2, 11, d.v >= 100 ? '#8AE8FF' : '#FFD23F', '#8A5A00', 2); if (w > .5) txt(d.v >= 100 ? '💎' : '$', d.x, d.y + 1, 11, '#8A5A00', 0) }
  ctx.restore();
  drawTop(t); if (state === 'play' || state === 'clear') drawProg();
  if (tipT) { ctx.globalAlpha = Math.min(1, tipT / 20); const w = Math.min(560, tipS.length * 9.4 + 40); rr(BW / 2 - w / 2, BH - 62, w, 34, 14, '#1A1030ee'); txt(tipS, BW / 2, BH - 44, 15, '#FFE9A0', 0); ctx.globalAlpha = 1 }
  if (S.name) txt('🏠 Nhà của ' + S.name, 34, Y0 + 44, 1, '#0000', 0);
  if (banner && banner.t > 0) { const a = Math.min(1, banner.t / 25), s = 1 + Math.max(0, (banner.t - 130) / 60); ctx.globalAlpha = a; ctx.fillStyle = '#12101Ebb'; ctx.fillRect(0, 250, BW, 96); txt(banner.w, BW / 2, 286, 34 * s, '#FFE24A', '#C8321E'); if (banner.sub) txt(banner.sub, BW / 2, 326, 17, '#fff'); ctx.globalAlpha = 1 }
  if (state === 'intro') drawIntro(t);
  if (state === 'clear') { ctx.fillStyle = '#12101Ebb'; ctx.fillRect(0, 240, BW, 120); txt(S.level >= NS - 1 ? '🏆 GIỮ ĐƯỢC NHÀ RỒI!' : '🎉 QUA MÀN ' + (S.level + 1) + '!', BW / 2, 284, 40, '#86E8B9', '#1A5A3A'); txt('+' + (60 + S.level * 40) + ' 🪙 thưởng qua màn', BW / 2, 330, 18, '#FFE9A0') }
  if (state === 'lost') { ctx.fillStyle = '#3A0A14cc'; ctx.fillRect(0, 230, BW, 140); txt('🧟 MA ĐÃ VÀO NHÀ!', BW / 2, 280, 42, '#FF8FB0', '#5A0A1E'); txt('Chơi lại màn này nhé — lần này trồng kín các hàng!', BW / 2, 332, 18, '#fff') }
}
const IBTN = { x: BW / 2 - 130, y: 520, w: 260, h: 50 }, ITIME = 720;
function introBox(i) { return { x: 150 + (i % 10) * 61, y: 344 + Math.floor(i / 10) * 64, w: 56, h: 58 } }
const introPool = () => ORDER.filter(k => own[k] && envOK(k));
function drawIntro(t) {
  const st = STAGES[S.level]; ctx.fillStyle = '#12101Ecc'; ctx.fillRect(0, 0, BW, BH);
  rr(110, 96, 680, 412, 24, '#FFF6E0'); ol('#6E4520', 5); rr(110, 96, 680, 62, 24, '#8A5A2A'); txt('MÀN ' + (S.level + 1) + '/' + NS + ' · ' + st.ic + ' ' + st.n, BW / 2, 128, 24, '#FFE9A0', '#3E2410');
  txt('Bầy ma sắp tới:', 190, 176, 15, '#6E4520', 0);
  const kinds = [...new Set(sched.map(e => e.k))], gap = Math.min(92, 620 / Math.max(1, kinds.length));
  kinds.forEach((k, i) => { const x = 160 + gap / 2 + i * gap; ctx.save(); ctx.translate(x, 290); ctx.scale(.66, .66); drawZombie({ k, Z: ZT[k], arm: ZT[k].arm || 0, hp: 1, slow: 0, eat: 0, dead: 0, ph: i, jt: 0, sm: 0, hit: 0, fly: !!ZT[k].fly, stun: 0 }, 0, 0, t); ctx.restore(); txt(ZT[k].n.replace('Ma ', ''), x, 304, Math.min(11, gap / 6.5), '#6E4520', 0) });
  const pool = introPool(); txt('Chọn cây mang theo (tối đa ' + MAXC + ') — bấm để chọn / bỏ:  ' + cards().length + '/' + MAXC, BW / 2, 330, 14, '#2E7A3A', 0);
  pool.forEach((k, i) => { const b = introBox(i), on = loadout.includes(k); rr(b.x, b.y, b.w, b.h, 10, on ? '#D8F6C0' : '#E8E0D0'); ol(on ? '#2FA552' : '#B8A890', on ? 3 : 1.6); ctx.globalAlpha = on ? 1 : .45; drawPlant({ k, t: 999, hp: PLANTS[k].hp, bob: i, card: 1 }, b.x + b.w / 2, b.y + 26, t, .42); ctx.globalAlpha = 1; txt(PLANTS[k].cost + '☀', b.x + b.w / 2, b.y + b.h - 8, 10, on ? '#2E5A1A' : '#8A7A6A', 0); if (on) txt('✓', b.x + b.w - 8, b.y + 9, 13, '#2FA552', 0) });
  const hint = st.graves ? '🪦 Bia mộ chắn ô trồng và ma CHUI LÊN từ mộ — trồng 🐛 Sâu Gặm Mộ lên bia để dọn' + (st.storm ? ' · ⚡ trận cuối có Ma Khổng Lồ!' : '') : st.fog ? '🌫 Sương mù che nửa sân — trồng 🍄 Nấm Đèn để soi · đêm không có nắng rơi' : st.water ? '🏊 2 hàng giữa là NƯỚC — thả 🍃 Lá Bè xuống trước rồi trồng cây lên' : st.roof ? '🏠 Ô nào cũng cần 🪴 Chậu Đất · 5 cột đầu dùng cây NÉM (🌽 Bắp Ném, 🍿 Bắp Rang)' : '🌤 Trồng 🌼 Cúc Nắng trước, rồi 🫛 Đậu Bắn và 🌽 Bắp Ném ở mỗi hàng';
  txt(hint, BW / 2, 488, 13, '#B83A5A', 0);
  const pu = 1 + Math.sin(t * .15) * .04; ctx.save(); ctx.translate(IBTN.x + IBTN.w / 2, IBTN.y + IBTN.h / 2); ctx.scale(pu, pu); ctx.fillStyle = grad(0, -22, 0, 22, '#FF8AC0', '#E8457A'); rr(-130, -25, 260, 50, 25); ctx.fill(); ol('#8A1C48', 3); txt('▶ BẮT ĐẦU (' + Math.ceil((ITIME - stT) / 60) + ')', 0, 1, 20, '#fff', '#8A1C48'); ctx.restore();
}
const SBTN = { x: 610, y: 520, w: 250, h: 56 };
function shopBox(i) { return { x: 288 + (i % 5) * 120, y: 104 + Math.floor(i / 5) * 200, w: 114, h: 190 } }
function drawShop(t) {
  ctx.fillStyle = grad(0, 0, 0, BH, '#FFE6B8', '#F5B870'); ctx.fillRect(0, 0, BW, BH);
  // sạp chợ: mái bạt sọc
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#FF6A8A' : '#FFFDF4'; ctx.beginPath(); ctx.moveTo(i * 75, 0); ctx.lineTo(i * 75 + 75, 0); ctx.lineTo(i * 75 + 75, 62); ctx.quadraticCurveTo(i * 75 + 37, 84, i * 75, 62); ctx.closePath(); ctx.fill(); ol('#8A2A3A', 2) }
  rr(250, 22, 400, 44, 14, '#8A5A2A'); ol('#3E2410', 3); txt('🛒 CỬA HÀNG CỦA BÁC TÍ', 450, 45, 24, '#FFE9A0', '#3E2410');
  rr(700, 24, 170, 40, 14, '#3E2410'); elo(724, 44, 12, 12, '#FFD23F', '#B87A00', 2); txt('$', 724, 45, 14, '#B87A00', 0); txt(String(S.coins) + ' xu', 800, 45, 20, '#FFE9A0', 0);
  // bác Tí: nông dân mũ lá, râu trắng, áo bà ba nâu
  ctx.save(); ctx.translate(140, 470 + Math.sin(t * .05) * 2); el(0, 110, 90, 14, '#00000022');
  ctx.fillStyle = grad(0, -10, 0, 120, '#A8703A', '#6E4520'); ctx.beginPath(); ctx.moveTo(-70, 120); ctx.quadraticCurveTo(-78, 10, -30, -6); ctx.lineTo(30, -6); ctx.quadraticCurveTo(78, 10, 70, 120); ctx.closePath(); ctx.fill(); ol('#3E2410', 3); line([0, -4, 0, 118], '#3E2410', 2); for (const y of [20, 50, 80]) el(0, y, 4, 4, '#FFE9A0');
  elo(0, -52, 46, 48, '#FFD8B0', '#8A5A3A', 3); el(-34, -40, 8, 6, '#FF9A8Aaa'); el(34, -40, 8, 6, '#FF9A8Aaa');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-38, -40); ctx.quadraticCurveTo(-40, 6, 0, 14); ctx.quadraticCurveTo(40, 6, 38, -40); ctx.quadraticCurveTo(20, -24, 0, -30); ctx.quadraticCurveTo(-20, -24, -38, -40); ctx.fill(); ol('#B8B0A0', 2.4);
  ctx.beginPath(); ctx.arc(0, -26, 12, .2, PI - .2); ol('#8A3A3A', 3); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 16, -58, 7, PI, 0); ol('#3E2410', 3.4); line([d * 8, -72, d * 26, -70], '#fff', 5) } elo(0, -46, 7, 6, '#F0A888', '#8A5A3A', 2);
  ctx.fillStyle = grad(0, -130, 0, -84, '#FFF0B8', '#D8A440'); ctx.beginPath(); ctx.moveTo(-80, -84); ctx.lineTo(0, -138); ctx.lineTo(80, -84); ctx.quadraticCurveTo(0, -72, -80, -84); ctx.fill(); ol('#7A5410', 3); for (let i = -3; i <= 3; i++) line([0, -136, i * 22, -82], '#B8842A66', 1.2);
  ctx.restore();
  rr(24, 96, 240, 96, 18, '#FFFFFF'); ol('#3E2410', 3); poly([110, 190, 130, 190, 112, 218], '#FFFFFF'); line([110, 191, 112, 218, 130, 191], '#3E2410', 3);
  const say = shopMsg || (gift ? 'Giỏi lắm! Màn tới bác tặng cháu: ' + gift + '!' : 'Cháu mua gì nào?'); wrap(say, 144, 128, 216, 17, '#3E2410');
  SHOP.forEach((it, i) => {
    const b = shopBox(i), has = it.plant ? own[it.k] : ups[it.k], can = S.coins >= it.price && !has;
    ctx.fillStyle = grad(0, b.y, 0, b.y + b.h, has ? '#D8F6D8' : '#FFFDF4', has ? '#A8E0A8' : '#FFE9C0'); rr(b.x, b.y, b.w, b.h, 14); ctx.fill(); ol(has ? '#2FA552' : '#6E4520', 3);
    if (it.plant) drawPlant({ k: it.k, t: 999, hp: PLANTS[it.k].hp, bob: i, card: 1 }, b.x + b.w / 2, b.y + 54, t, .62); else emo(it.ic, b.x + b.w / 2, b.y + 50, 40);
    txt(it.plant ? PLANTS[it.k].n : it.n, b.x + b.w / 2, b.y + 100, 12, '#3E2410', 0); wrap(it.d, b.x + b.w / 2, b.y + 118, b.w - 10, 10, '#6E4520');
    rr(b.x + 14, b.y + b.h - 30, b.w - 28, 24, 12, has ? '#2FA552' : can ? '#FF8A2A' : '#B8B0A0'); txt(has ? '✓ Đã có' : it.price + ' xu', b.x + b.w / 2, b.y + b.h - 17, 14, '#fff', 0);
  });
  const pu = 1 + Math.sin(t * .15) * .03; ctx.save(); ctx.translate(SBTN.x + SBTN.w / 2, SBTN.y + SBTN.h / 2); ctx.scale(pu, pu); ctx.fillStyle = grad(0, -28, 0, 28, '#7AE08A', '#2FA552'); rr(-SBTN.w / 2, -SBTN.h / 2, SBTN.w, SBTN.h, 28); ctx.fill(); ol('#1A5A2A', 3.4); txt('▶ VÀO MÀN ' + (S.level + 2), 0, 1, 24, '#fff', '#1A5A2A'); ctx.restore();
  txt('Hạ ma rơi xu · trả lời đúng +5 xu', 440, 548, 14, '#6E4520', 0);
}
function wrap(s, x, y, w, size, col) { ctx.font = '800 ' + size + "px 'Baloo 2',Nunito,sans-serif"; const ws = s.split(' '); let ln = '', yy = y; for (const q of ws) { if (ctx.measureText(ln + q).width > w && ln) { txt(ln.trim(), x, yy, size, col, 0); ln = ''; yy += size * 1.25 } ln += q + ' ' } txt(ln.trim(), x, yy, size, col, 0) }

/* ═════ điều khiển ═════ */
const inB = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
function toL(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - ox) / sc, (e.clientY - r.top - oy) / sc] }
function cellOfXY(x, y) { return { c: Math.floor((x - X0) / CW), r: Math.floor((y - Y0) / CH) } }
function tap(x, y) {
  if (!S.running || S.over) return;
  if (state === 'intro') {
    if (inB(IBTN, x, y)) { begin(); return }
    introPool().forEach((k, i) => { if (!inB(introBox(i), x, y)) return; stT = Math.min(stT, 120); if (loadout.includes(k)) { if (loadout.length > 1) loadout = loadout.filter(q => q !== k) } else if (loadout.length >= MAXC) tip('Tối đa ' + MAXC + ' cây — bỏ bớt 1 cây trước'); else { loadout.push(k); loadout.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)) } GC.sfx('pop') });
    return;
  }
  if (state === 'shop') {
    if (inB(SBTN, x, y)) { gift = null; loadStage(S.level + 1); GC.sfx('pop'); return }
    SHOP.forEach((it, i) => { if (!inB(shopBox(i), x, y)) return; const has = it.plant ? own[it.k] : ups[it.k]; if (has) shopMsg = 'Món này cháu có rồi mà!'; else if (S.coins < it.price) { shopMsg = 'Chưa đủ xu rồi cháu ơi — hạ thêm ma nhé!'; GC.sfx('bump') } else { S.coins -= it.price; if (it.plant) own[it.k] = 1; else ups[it.k] = 1; shopMsg = 'Cảm ơn cháu! ' + (it.plant ? PLANTS[it.k].n : it.n) + ' là của cháu rồi!'; GC.sfx('power') } });
    return;
  }
  if (state !== 'play') return;
  if (grabAt(x, y)) return;
  const L = cards(); for (let i = 0; i < L.length; i++) if (inB(cardBox(i), x, y)) { pick(L[i]); return }
  if (inB(SHV, x, y)) { shovel = !shovel; sel = null; GC.sfx('pop'); return }
  if (y > Y0) { const c = cellOfXY(x, y); plantAt(c.c, c.r) }
}
function pick(k) { shovel = false; if (sel === k) { sel = null; return } if (cds[k] > 0) return tip('Thẻ ' + PLANTS[k].n + ' đang hồi — chờ chút nhé'); if (S.energy < PLANTS[k].cost) { tip('Cần ' + PLANTS[k].cost + ' ☀️ — trả lời câu hỏi để có thêm nắng'); if (S.energy < 50) S.hooks.onEmpty && S.hooks.onEmpty(); return } sel = k; GC.sfx('pop') }
function bindInput() {
  cv.addEventListener('pointerdown', e => { e.preventDefault(); const [x, y] = toL(e); cur.on = false; hover = y > Y0 ? cellOfXY(x, y) : null; tap(x, y) });
  cv.addEventListener('pointermove', e => { const [x, y] = toL(e); hover = y > Y0 ? cellOfXY(x, y) : null; if (e.pointerType === 'mouse' && state === 'play') for (const s of suns) if (!s.got && Math.hypot(s.x - x, s.y - y) < 30) take(s) });
  cv.addEventListener('pointerleave', () => { hover = null });
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = e.key;
    if (k === 'e' || k === 'E' || k === 'Enter') { if (state === 'intro') begin(); else S.hooks.onAsk && S.hooks.onAsk(); return }
    if (state === 'intro' && k === ' ') { e.preventDefault(); begin(); return }
    if (state !== 'play') return;
    if (k >= '0' && k <= '9') { const L = cards(), i = k === '0' ? 9 : +k - 1; if (L[i]) pick(L[i]); return }
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] }[k];
    if (mv) { e.preventDefault(); hover = null; cur.on = true; cur.c = clamp(cur.c + mv[0], 0, COLS - 1); cur.r = clamp(cur.r + mv[1], 0, ROWS - 1); return }
    if (k === ' ' || k === 'f' || k === 'F') { e.preventDefault(); if (cur.on) plantAt(cur.c, cur.r) } else if (k === 'x' || k === 'X') { shovel = !shovel; sel = null }
  });
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  sc = Math.min((cw - 6) / BW, (ch - 6) / BH); ox = (cw - BW * sc) / 2; oy = Math.max(3, (ch - BH * sc) / 2);
  placeAsk(); placeSpeed();
}
const HEART = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 92"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7AC8"/><stop offset=".35" stop-color="#FF2D55"/><stop offset=".7" stop-color="#E8102E"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient><radialGradient id="h" cx=".3" cy=".25" r=".35"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><path d="M50 89C21 67 3 51 3 29C3 13 15 3 29 3C39 3 46 9 50 17C54 9 61 3 71 3C85 3 97 13 97 29C97 51 79 67 50 89Z" fill="url(#g)" stroke="#fff" stroke-width="3.5"/><path d="M50 89C21 67 3 51 3 29C3 13 15 3 29 3C39 3 46 9 50 17C54 9 61 3 71 3C85 3 97 13 97 29C97 51 79 67 50 89Z" fill="url(#h)"/><path d="M20 30a9 9 0 0 1 9-11" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".85"/><g fill="#FFE24A"><path d="M84 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M12 52l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/></g><g fill="#8AF0FF"><circle cx="76" cy="58" r="2.4"/><circle cx="26" cy="68" r="1.8"/></g></svg>') + '")';
function placeAsk() {   /* nút ⚡ Trả lời: TRÁI TIM đỏ nhiều màu nằm trong bãi cỏ trống bên trái sân (màn hình rộng) · màn hình hẹp: nút nhỏ ở góc dưới trái */
  const b = document.getElementById('eBtn'); if (!b) return;
  const side = Math.min(ox - 12, 260);
  if (side >= 120) { const top = oy + (Y0 + 40) * sc, h = side * .92; Object.assign(b.style, { left: Math.max(6, (ox - side) / 2) + 'px', right: 'auto', top: top + 'px', bottom: 'auto', width: side + 'px', height: h + 'px', whiteSpace: 'normal', lineHeight: '1.18', padding: (h * .2) + 'px ' + (side * .09) + 'px 0', fontSize: Math.round(Math.min(21, Math.max(13, side / 9.5))) + 'px', borderRadius: '0', textAlign: 'center', background: HEART + ' center/100% 100% no-repeat', border: '0', boxShadow: 'none', filter: 'drop-shadow(0 6px 10px #b3003a88)', textShadow: '0 2px 0 #9A0A2A, 0 0 6px #9A0A2A', color: '#fff', animation: 'gheart 1.15s ease-in-out infinite' }); b.classList.add('heart') }
  else { Object.assign(b.style, { left: '6px', right: 'auto', top: 'auto', bottom: '6px', width: 'auto', height: '', whiteSpace: 'nowrap', lineHeight: '', padding: '7px 12px', fontSize: '13px', borderRadius: '999px', textAlign: '', background: '', border: '', boxShadow: '', filter: '', textShadow: '', animation: '' }); b.classList.remove('heart') }
}
let last = 0, acc = 0, SPD = 1;
/* ⏩ nút TỐC ĐỘ ở bên phải màn hình: x1 · x1.5 · x2 (chỉ tăng tốc lúc đang chơi) */
const SPEEDS = [1, 1.5, 2], SPC = ['#3FA9FF', '#2FBF71', '#FF8A1F', '#FF2D7A'];
function speedUI() {
  let box = document.getElementById('gSpeed'); if (box) return box;
  box = document.createElement('div'); box.id = 'gSpeed'; stage.appendChild(box);
  const st = document.createElement('style'); st.textContent = '#gSpeed{position:absolute;z-index:4;display:flex;gap:6px;align-items:center;font-family:Nunito,sans-serif}#gSpeed .lab{font-weight:900;color:#fff;font-size:13px;line-height:1.3;text-align:center;background:linear-gradient(135deg,#FF3D8B,#9B5BFF);border:3px solid #fff;border-radius:14px;padding:7px 9px;text-shadow:0 1px 2px #0006;box-shadow:0 4px 12px #0004;position:relative;animation:gsb 1.2s ease-in-out infinite}#gSpeed.col .lab{width:118px;margin-bottom:4px}#gSpeed.col .lab:after{content:"";position:absolute;left:50%;bottom:-11px;margin-left:-8px;border:8px solid transparent;border-top-color:#fff;border-bottom:0}@keyframes gsb{50%{transform:translateY(-3px)}}#gSpeed button{border:3px solid #fff;border-radius:999px;color:#fff;font-weight:900;font-size:16px;padding:6px 12px;cursor:pointer;text-shadow:0 1px 2px #0006;box-shadow:0 3px 0 #0003,0 4px 12px #0003;transition:transform .12s}#gSpeed button.on{transform:scale(1.15);box-shadow:0 0 0 3px #FFE24A,0 0 16px #FFE24A}#gSpeed button:active{transform:scale(.94)}#gSpeed.col{flex-direction:column}';
  document.head.appendChild(st);
  box.innerHTML = '<div class="lab"></div>' + SPEEDS.map((v, i) => '<button data-v="' + v + '" style="background:linear-gradient(135deg,' + SPC[i] + ',' + SPC[i + 1] + ')">x' + v + '</button>').join('');
  box.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); SPD = +b.dataset.v; markSpeed(); GC.sfx('pop') });
  markSpeed(); return box;
}
function markSpeed() { const box = document.getElementById('gSpeed'); if (box) box.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === SPD)) }
function placeSpeed() {
  const box = speedUI(), right = cw - (ox + BW * sc);
  const lab = box.querySelector('.lab');
  if (right >= 96) { lab.innerHTML = '⏩ Nếu các con muốn<br>TĂNG TỐC trò chơi<br>hãy bấm vào đây 👇'; box.classList.add('col'); Object.assign(box.style, { right: Math.max(4, (right - 130) / 2) + 'px', left: 'auto', top: (oy + (Y0 + 40) * sc) + 'px', bottom: 'auto', transform: '' }) }
  else { lab.innerHTML = '⏩ Muốn tăng tốc? Bấm đây 👉'; box.classList.remove('col'); Object.assign(box.style, { right: '8px', left: 'auto', top: (oy + (Y0 + 6) * sc) + 'px', bottom: 'auto', transform: 'scale(.82)', transformOrigin: 'top right' }) }
}
function loop() {
  requestAnimationFrame(loop);
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  try { if (S.running && !S.over) { acc += dt * (state === 'play' ? SPD : 1); let n = 0; while (acc >= 16.67 && n++ < 12) { step(); acc -= 16.67 } if (n >= 12) acc = 0 } else acc = 0; draw() } catch (e) { if (!loop.err) { loop.err = 1; console.error(e) } }
  S.hooks.onFrame && S.hooks.onFrame(ts);
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {}; seed0 = seed || 7; lvSel = level || 2; LV = LVS[lvSel] || LVS[2];
  GC.music.files({ seeds: { src: 'snd/garden-seeds.mp3' }, play: { src: 'snd/garden-day.mp3' }, loon: { src: 'snd/garden-loon.mp3' }, night: { src: 'snd/garden-night.mp3' }, battle: { src: 'snd/garden-battle.mp3' }, shop: { src: 'snd/garden-shop.mp3' } }, 'garden');
  GC.sfxFiles({ ggroan: { src: 'snd/garden-groan.mp3', vol: .6 }, gsun: { src: 'snd/garden-sun.mp3', vol: .55 }, gover: { src: 'snd/garden-over.mp3', vol: .7 } });   // tiếng ma rên · nhặt nắng · thua màn (file cô Chí Nên đưa)
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { }
function place(x, y, old) { if (!old) return; S.coins = old.cn || 0; score = old.sc || 0; if (old.own) { own = { sun: 1, pea: 1, corn: 1 }; for (let q = 0; q <= Math.min(NS - 1, old.lvl || 0); q++) for (const k of STAGES[q].give) own[k] = 1; String(old.own).split(',').forEach(k => { if (PLANTS[k]) own[k] = 1 }) } if (old.up) { ups = {}; String(old.up).split(',').forEach(k => { if (k) ups[k] = 1 }) } if (old.lvl != null && old.lvl !== S.level) loadStage(clamp(old.lvl, 0, NS - 1)) }
function measure() { return 1000 }
const label = () => S.won ? '🏆 Giữ được nhà' : 'Màn ' + (S.level + 1) + '/' + NS + ' · 🧟 ' + killed + '/' + total + ' · 🪙 ' + S.coins;
function extra() { return { lvl: S.level, wk: 'garden', lb: label(), sc: score, cn: S.coins, own: Object.keys(own).join(','), up: Object.keys(ups).join(',') } }
const hud = () => (S.won ? '🏆 Giữ được nhà' : '🌻 Màn ' + (S.level + 1) + '/' + NS) + ' · ⭐ ' + score;
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label, onAnswer, resize, W: BW, kind: 'garden', NL: NS, winTitle: '🏆 Giữ vững ngôi nhà qua cả 6 màn!', winToast: '🏆 CHIẾN THẮNG! Khu vườn của em đã đánh bại cả bầy ma và MA KHỔNG LỒ!',
  _dbg: { step, draw, loadStage, begin, tap, plantAt, PD, ZT, PLANTS, drawZombie, drawPlant, st: () => state, setState: v => { state = v }, zs: () => zs, graves: () => graves, loadout: () => loadout, own: () => own, sel: k => { sel = k }, grid: () => grid, sched: () => sched, setT: v => { T = v }, ctx: () => ctx, spawn } };
})();
