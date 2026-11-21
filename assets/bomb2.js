/* bomb2.js — game "💣 Bomberman P2: Vua Bom" (tạo từ bomb.js bằng claude gen_bomb2 — luật lưới / bom / lửa giữ nguyên phần 1, mọi thứ còn lại là mới).
   (Tách 2 phần: Bomb2.setPart(2) = Bomberman P2, setPart(3) = Bomberman P3 — xem PARTS.) Tổng 9 màn + 2 màn thưởng, 5 cảnh vẽ nét mượt: 🍭 Xứ sở bánh kẹo · 🪸 Đáy biển san hô · 🍄 Rừng nấm đêm · 🛸 Trạm vũ trụ · 🏰 Lâu đài ma.
   14 quái MỚI: kẹo cao su · bánh cupcake · donut LĂN nhanh khi thẳng hàng với em · cua · cá nóc 2 máu (phồng to) · sứa xuyên gạch · nấm tách 2 bào tử · dơi (bị gạch chắn như quái thường)
   · đĩa bay DỊCH CHUYỂN · rô-bốt đặt bom · người ngoài hành tinh đuổi nhanh · bí ngô TÀNG HÌNH từng lúc · hiệp sĩ giáp 2 máu · trùm 👑 VUA BOM 8 máu (thả bom, gọi đệ tử).
   Vũ khí MỚI: 🚀 bom tên lửa (bom bay thẳng theo hướng em nhìn, chạm gì là nổ) · ⚡ súng laser (X: quét cả hàng, phá 2 gạch) · 💥 bom khổng lồ (lửa XUYÊN gạch)
   · 🧊 đồng hồ băng (đóng băng mọi quái 6 giây) · 🛡️ khiên bong bóng (đỡ 1 đòn). Vật phẩm cũ vẫn còn: 💣 🔥 👟 📡 🦵 👻 🧯 ⭐ + trái cây.
   Nhân vật mới: phi công bom nhí. Âm thanh / nhạc: y hệt phần 1. Cùng giao diện: init · S · pl · alt() · … · kind = 'bomb' */
window.Bomb2 = (function () {
const { clamp, rng } = GC;
const U = 32, COLS = 15, ROWS = 13, FW = COLS * U, FH = ROWS * U, HB = 48, PX = 2;
/* 2 phần dùng chung file này (Bomb2.setPart): P2 = 4 màn + thưởng (bánh kẹo, đáy biển · trùm HOÀNG TỬ BOM 5 máu) · P3 = 5 màn + thưởng (rừng nấm, vũ trụ, lâu đài ma · trùm VUA BOM 8 máu)
   df: độ khó nối tiếp từ P2 sang P3 (số quái, loại vật phẩm) · khp: máu trùm · bn: tên trùm */
const PARTS = {
  2: [{ n: '1', th: 0, df: 0, en: ['gum', 'gum', 'cup'] }, { n: '2', th: 0, df: 1, en: ['gum', 'cup', 'don'] }, { n: 'BONUS', th: 5, bonus: true, en: ['gum', 'cup', 'crab'] },
    { n: '3', th: 1, df: 2, en: ['crab', 'puf', 'gum', 'crab'] }, { n: '4', th: 1, df: 3, boss: true, khp: 5, bn: 'HOÀNG TỬ BOM', en: ['jel', 'puf', 'crab'] }],
  3: [{ n: '1', th: 2, df: 4, cnt: 4, en: ['gum', 'shr', 'bat', 'cup'] }, { n: '2', th: 3, df: 5, cnt: 5, en: ['shr', 'ufo', 'bat', 'bot'] }, { n: 'BONUS', th: 5, bonus: true, en: ['shr', 'bat', 'crab'] },
    { n: '3', th: 3, df: 6, cnt: 6, en: ['ufo', 'ali', 'bot', 'bat', 'jel'] }, { n: '4', th: 4, df: 7, cnt: 7, en: ['pum', 'kni', 'bat', 'ali', 'bot'] }, { n: '5', th: 4, df: 8, boss: true, khp: 8, bn: 'VUA BOM', en: ['pum', 'kni', 'bat'] }] };
let PART = 2, STAGES = PARTS[2], NS = STAGES.length, NREAL = 4;
const THEMES = [   // id: bộ hình vẽ (PAINT) · bg: nền ngoài sân · fx: hạt bay ngoài sân
  { id: 'candy', name: 'Xứ sở bánh kẹo', ic: '🍭', floor: ['#FFE6F0', '#FFD6E6'], bar: '#FF7AB0', bg: ['#FFB8D8', '#C8A0FF'], fx: 'sprinkle' },
  { id: 'sea', name: 'Đáy biển san hô', ic: '🪸', floor: ['#F4E6B8', '#ECDBA6'], bar: '#2EA8D8', bg: ['#0A4A8A', '#1E86C0'], fx: 'bubble' },
  { id: 'forest', name: 'Rừng nấm đêm', ic: '🍄', floor: ['#2F5E4C', '#366856'], bar: '#2E9E7A', bg: ['#0E1E3A', '#1E4A4A'], fx: 'firefly' },
  { id: 'space', name: 'Trạm vũ trụ', ic: '🛸', floor: ['#3A4368', '#434C74'], bar: '#6A5AE0', bg: ['#04041A', '#1E1450'], fx: 'star' },
  { id: 'castle', name: 'Lâu đài ma', ic: '🏰', floor: ['#4B405C', '#564A68'], bar: '#B83A5A', bg: ['#1A0624', '#5A1438'], fx: 'ember' },
  { id: 'bonus', name: 'Vòng thưởng', ic: '🎁', floor: ['#FFF0B0', '#FFE690'], bar: '#FFB020', bg: ['#FF9AC8', '#8AC8FF'], fx: 'sprinkle' }];
const ETYPES = {   // tốc độ · wall: đi xuyên gạch · thru: xuyên cả bom · smart: khôn (đuổi theo em) · turn: hay đổi hướng
  gum: { sp: .7, smart: 0, turn: .25, pts: 1 }, cup: { sp: 1.0, smart: .1, turn: .7, pts: 1 }, don: { sp: .95, smart: .2, turn: .2, pts: 2, dash: true },   // bánh donut: thấy em thẳng hàng là LĂN nhanh tới
  crab: { sp: 1.45, smart: .25, turn: .4, pts: 2 }, puf: { sp: .8, smart: .3, turn: .3, pts: 3, hp: 2 }, jel: { sp: .7, wall: true, thru: true, smart: .4, turn: .3, pts: 2 },   // cá nóc 2 máu (trúng bom thì phồng to) · sứa xuyên gạch
  shr: { sp: .9, smart: .2, turn: .35, pts: 2, split: 'spo' }, spo: { sp: 1.6, smart: .35, turn: .5, pts: 1, small: true }, bat: { sp: 1.05, smart: .3, turn: .4, pts: 2 },   // nấm chết tách 2 bào tử · dơi (bị gạch chắn như quái thường)
  ufo: { sp: 1.0, smart: .3, turn: .35, pts: 3, tele: true }, bot: { sp: 1.0, smart: .25, turn: .35, pts: 3, bomber: true }, ali: { sp: 1.6, smart: .75, turn: .3, pts: 3 },   // đĩa bay DỊCH CHUYỂN tức thời · rô-bốt đặt bom · người ngoài hành tinh đuổi nhanh
  pum: { sp: 1.1, smart: .5, turn: .3, pts: 3, cloak: true }, kni: { sp: .85, smart: .4, turn: .3, pts: 4, hp: 2 },   // bí ngô TÀNG HÌNH từng lúc · hiệp sĩ giáp 2 máu
  king: { sp: .6, smart: .55, turn: .3, pts: 25, hp: 8, bomber: true, boss: true } };   // 👑 VUA BOM: 8 máu, thả bom, gọi đệ tử
const MON_TIP = { don: 1, puf: 1, jel: 1, shr: 1, ufo: 1, bot: 1, pum: 1, kni: 1, king: 1 };
// tốn ⚡ cân đối giữa các game: 1 câu đúng (100⚡) ≈ 10 · 8 · 6,5 giây chơi liên tục (Dễ · Vừa · Khó)
const LVS = {
  1: { soft: .42, base: 3, add: .45, spd: .9, fuse: 160, cost: { walk: .15, bomb: 3, battery: 20, stomp: 8, hurt: 15 } },
  2: { soft: .52, base: 4, add: .65, spd: 1.05, fuse: 150, cost: { walk: .18, bomb: 3.5, battery: 20, stomp: 8, hurt: 22 } },
  3: { soft: .6, base: 5, add: .9, spd: 1.22, fuse: 140, cost: { walk: .22, bomb: 4, battery: 20, stomp: 8, hurt: 30 } } };
const ITEMS = ['bomb', 'fire', 'speed', 'remote', 'kick', 'wall', 'flame', 'vest', 'laser', 'rocket', 'mega', 'ice', 'shield', 'rocket', 'laser'], LIVES = 5;   // 5 mạng: hết mạng chơi lại màn đang chơi
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: U * 1.5, y: U * 1.5, d: 2, fr: 0, walk: 0, inv: 0, bombs: 1, fire: 1, speed: 0, remote: false, kick: false, wall: false, flame: 0, vest: 0, moving: false, laser: 0, rocket: 0, mega: 0, shd: 0 };
function setPart(n) { PART = n === 3 ? 3 : 2; STAGES = PARTS[PART]; NS = STAGES.length; NREAL = STAGES.filter(q => !q.bonus).length; if (PART === 3) { pl.bombs = Math.max(pl.bombs, 2); pl.fire = Math.max(pl.fire, 2) } }   // gọi TRƯỚC init · P3 quái đông ngay từ đầu nên em có sẵn 2 bom, lửa dài 2
const keys = { l: 0, r: 0, u: 0, d: 0, b: 0, bp: 0, x: 0, xp: 0, order: [] };
let seenMon = {}, lastBoom = 0, overT = 0, seed0 = 1, lvSel = 2, map = [], bombs = [], flames = [], enemies = [], items = [], door = null, fx = [], parts = [], score = 0, banner = null, clearT = 0, bonusT = 0, spawnT = 0, doorHits = 0, total = 0;
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0, emptyT = 0;
const R0 = () => 0;

/* ═════ bản đồ: 0 cỏ · 1 cột đá · 2 gạch · 3 gạch đang vỡ ═════ */
const at = (c, r) => c < 0 || r < 0 || c >= COLS || r >= ROWS ? 1 : map[r * COLS + c];
const set = (c, r, v) => { if (c >= 0 && r >= 0 && c < COLS && r < ROWS) map[r * COLS + c] = v };
const cellOf = v => Math.floor(v / U), mid = c => c * U + U / 2;
function buildStage(si) {
  const st = STAGES[si], r0 = rng(seed0 * 13 + si * 101 + lvSel * 7), RI = (a, b) => a + Math.floor(r0() * (b - a + 1));
  map = new Array(COLS * ROWS).fill(0); bombs = []; flames = []; enemies = []; items = []; fx = []; door = null; doorHits = 0; clearT = 0;
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 || (r % 2 === 0 && c % 2 === 0)) set(c, r, 1);
  const safe = (c, r) => c + r <= 3;
  const softs = [];
  if (!st.bonus) for (let r = 1; r < ROWS - 1; r++)for (let c = 1; c < COLS - 1; c++) if (at(c, r) === 0 && !safe(c, r) && r0() < LVC.soft) { set(c, r, 2); softs.push([c, r]) }
  if (!st.bonus) {
    softs.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]));   // cửa ra giấu ở nửa xa
    const far = softs.slice(0, Math.max(1, Math.floor(softs.length * .45)));
    const dc = far[Math.floor(r0() * far.length)]; door = { c: dc[0], r: dc[1], show: false };
    const df = st.df || 0, pool = df < 1 ? ['bomb', 'fire', 'shield', 'rocket'] : df < 2 ? ['bomb', 'fire', 'rocket', 'shield', 'laser'] : df < 4 ? ['bomb', 'fire', 'rocket', 'laser', 'ice', 'speed', 'mega'] : ITEMS;
    const nItems = 3 + (df >= 4 ? 1 : 0);
    for (let k = 0; k < nItems; k++) {
      for (let t = 0; t < 30; t++) { const s = softs[Math.floor(r0() * softs.length)]; if (s && !(s[0] === door.c && s[1] === door.r) && !items.some(i => i.c === s[0] && i.r === s[1])) { items.push({ c: s[0], r: s[1], k: pool[Math.floor(r0() * pool.length)], show: false, got: false }); break } }
    }
    const n = st.boss ? 3 : st.cnt ? Math.round(st.cnt * (lvSel === 1 ? .75 : lvSel === 3 ? 1.25 : 1)) : Math.round(LVC.base + df * LVC.add);   // cnt: số quái định sẵn (P3 tăng dần 4 → 7 ở mức Vừa)
    for (let k = 0; k < n; k++) addEnemy(st.en[k % st.en.length], r0, 6);
    if (st.boss) { addEnemy('king', r0, 9); const kg = enemies[enemies.length - 1]; if (kg && kg.k === 'king') kg.hp = kg.mhp = st.khp || 8 }
  } else { bonusT = 1500; spawnT = 30 }
  total = enemies.length;
}
function addEnemy(k, r0, minDist, at0) {
  r0 = r0 || Math.random;
  for (let t = 0; t < 80; t++) {
    const c = at0 ? at0.c : 1 + Math.floor(r0() * (COLS - 2)), r = at0 ? at0.r : 1 + Math.floor(r0() * (ROWS - 2));
    if (at(c, r) !== 0 && !at0) continue;
    if (!at0 && Math.abs(c - cellOf(pl.x)) + Math.abs(r - cellOf(pl.y)) < minDist) continue;
    const T = ETYPES[k]; enemies.push({ k, x: mid(c), y: mid(r), d: Math.floor(Math.random() * 4), sp: T.sp * LVC.spd, T, dead: 0, fr: 0, born: at0 ? 40 : 0, hp: T.hp || 1, hurtT: 0, bt: 150 + Math.floor(Math.random() * 200), frz: 0, tt: 200 + Math.floor(Math.random() * 200), sm: 420, ph: Math.random() * 6 });
    if (MON_TIP[k] && !seenMon[k]) { seenMon[k] = 1; setTimeout(() => S.hooks.onPower && S.hooks.onPower('b2_m_' + k), 1800) }
    return;
  }
}
function loadStage(si) {
  S.level = si; resetPlayer(true); buildStage(si);
  const st = STAGES[si], T = THEMES[st.th];
  banner = { t: 170, w: st.bonus ? 'BONUS STAGE' : st.boss ? 'BOSS STAGE' : 'STAGE ' + st.n, text: st.bonus ? '🎁 Bất tử 25 giây — săn quái lấy ⚡!' : st.boss ? '👑 ' + st.bn + ' xuất hiện — nổ trúng ' + st.khp + ' lần mới hạ được!' : T.ic + ' ' + T.name };
  if (st.bonus) pl.vest = 1500;
  GC.music.scene(st.bonus ? 'bonus' : 'play');
}
function resetPlayer(fresh) { pl.x = mid(1); pl.y = mid(1); pl.d = 2; pl.inv = fresh ? 90 : 150 }
const prog = () => S.won ? 1 : clamp((S.level + (STAGES[S.level].bonus ? 1 - bonusT / 1500 : (total ? 1 - enemies.filter(e => !e.dead).length / total : 0) * .9)) / NS, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ di chuyển trên lưới (tự nắn vào giữa hàng/cột, trượt góc như bản gốc) ═════ */
const bombAt = (c, r) => bombs.find(b => b.c === c && b.r === r && !b.gone);
function passable(o, c, r) {
  const v = at(c, r); if (v === 1) return false;
  if ((v === 2 || v === 3) && !(o === pl ? pl.wall : o.T && o.T.wall)) return false;
  const b = bombAt(c, r); if (b && !(o.T && o.T.thru)) return false;
  return true;
}
function moveOn(o, d, sp) {
  const dx = [0, 1, 0, -1][d], dy = [-1, 0, 1, 0][d], c = cellOf(o.x), r = cellOf(o.y);
  if (dx) {
    const cyc = mid(r);
    if (Math.abs(o.y - cyc) > .01) {
      if (passable(o, c + dx, r)) { o.y += clamp(cyc - o.y, -sp, sp); return true }
      const r2 = o.y > cyc ? r + 1 : r - 1;   // trượt góc sang hàng bên cạnh
      if (o === pl && Math.abs(o.y - cyc) > U * .22 && passable(o, c, r2) && passable(o, c + dx, r2)) { o.y += clamp(mid(r2) - o.y, -sp, sp); return true }
      return false;
    }
    let nx = o.x + dx * sp; const cxc = mid(c);
    if (!passable(o, c + dx, r)) { nx = dx > 0 ? Math.min(nx, cxc) : Math.max(nx, cxc); if (Math.abs(nx - o.x) < .01) return blockedBy(o, c + dx, r, d) }
    o.x = nx; return true;
  } else {
    const cxc = mid(c);
    if (Math.abs(o.x - cxc) > .01) {
      if (passable(o, c, r + dy)) { o.x += clamp(cxc - o.x, -sp, sp); return true }
      const c2 = o.x > cxc ? c + 1 : c - 1;
      if (o === pl && Math.abs(o.x - cxc) > U * .22 && passable(o, c2, r) && passable(o, c2, r + dy)) { o.x += clamp(mid(c2) - o.x, -sp, sp); return true }
      return false;
    }
    let ny = o.y + dy * sp; const cyc = mid(r);
    if (!passable(o, c, r + dy)) { ny = dy > 0 ? Math.min(ny, cyc) : Math.max(ny, cyc); if (Math.abs(ny - o.y) < .01) return blockedBy(o, c, r + dy, d) }
    o.y = ny; return true;
  }
}
function blockedBy(o, c, r, d) {   // đá bom
  if (o === pl && pl.kick) { const b = bombAt(c, r); if (b && !b.slide) { b.slide = d; GC.sfx('pop') } }
  return false;
}

/* ═════ bom & lửa ═════ */
function placeBomb() {
  const c = cellOf(pl.x), r = cellOf(pl.y);
  if (at(c, r) !== 0 || bombAt(c, r) || bombs.filter(b => !b.gone && !b.en).length >= pl.bombs) return;
  const b = { c, r, x: mid(c), y: mid(r), t: pl.remote ? 1e9 : LVC.fuse, fire: pl.fire, slide: null, gone: false };
  if (pl.mega > 0) { pl.mega--; b.mega = 1; b.fire = Math.max(b.fire, 3) }   // 💥 bom khổng lồ: lửa xuyên gạch
  if (pl.rocket > 0) { const nc = c + [0, 1, 0, -1][pl.d], nr = r + [-1, 0, 1, 0][pl.d]; if (at(nc, nr) === 0 && !bombAt(nc, nr)) { pl.rocket--; b.rk = 1; b.slide = pl.d; b.t = 600 } }   // 🚀 bom tên lửa: bay thẳng, chạm gì là nổ (ô trước mặt phải trống)
  bombs.push(b);
  use(COST.bomb); GC.sfx('bplace');
}
function fireLaser() {   // ⚡ súng laser: quét thẳng theo hướng em nhìn tới khi gặp cột đá, phá được 2 viên gạch
  if (pl.laser <= 0) return; pl.laser--; use(COST.bomb); GC.sfx('bboom');
  const dx = [0, 1, 0, -1][pl.d], dy = [-1, 0, 1, 0][pl.d], c0 = cellOf(pl.x), r0 = cellOf(pl.y); let n = 0;
  for (let k = 1; k < COLS; k++) {
    const c = c0 + dx * k, r = r0 + dy * k, v = at(c, r); if (v === 1) break;
    if (v === 2) { set(c, r, 3); fx.push({ k: 'brk', c, r, t: 0 }); if (++n >= 2) break; continue }
    if (v === 3) continue;
    addFlame(c, r, dx ? 'h' : 'v'); flames[flames.length - 1].lz = 1; flames[flames.length - 1].t = 20;
    const ob = bombAt(c, r); if (ob) ob.t = Math.min(ob.t, 4);
  }
  syncX();
}
function syncX() { document.body.classList.toggle('remote', !!(pl.remote || pl.laser > 0)) }   // hiện nút X trên máy cảm ứng
function explode(b) {
  if (b.gone) return; b.gone = true; if (S.tick - lastBoom > 5) { lastBoom = S.tick; GC.sfx('bboom') }   // nổ dây chuyền: 1 tiếng thôi
  addFlame(b.c, b.r, 'c', b.en);
  for (let d = 0; d < 4; d++) {
    const dx = [0, 1, 0, -1][d], dy = [-1, 0, 1, 0][d];
    for (let k = 1; k <= b.fire; k++) {
      const c = b.c + dx * k, r = b.r + dy * k, v = at(c, r);
      if (v === 1) break;
      if (v === 2) { set(c, r, 3); fx.push({ k: 'brk', c, r, t: 0 }); if (b.mega) continue; break }
      if (v === 3) { if (b.mega) continue; break }
      addFlame(c, r, k === b.fire ? 'e' + d : (d % 2 ? 'h' : 'v'), b.en);
      const ob = bombAt(c, r); if (ob) ob.t = Math.min(ob.t, 4);   // nổ dây chuyền
    }
  }
  for (let i = 0; i < 6; i++)parts.push({ x: b.x, y: b.y, vx: (Math.random() - .5) * 3, vy: -Math.random() * 3, l: 24, c: GC.pick(['#FFB627', '#FF7A3D', '#FFF3B0']) });
}
function addFlame(c, r, k, en) {
  flames.push({ c, r, k, t: 32, en: !!en });
  if (!en && door && door.show && door.c === c && door.r === r && !STAGES[S.level].bonus && doorHits < 2) {   // bom trúng cửa → quái mới chui ra (màn 6+: Pontan như bản gốc)
    doorHits++; for (let i = 0; i < 2; i++)addEnemy((STAGES[S.level].df || 0) >= 6 ? 'ali' : STAGES[Math.min(NS - 1, S.level + 1)].en[i % 2], null, 0, { c, r }); S.hooks.onPower && S.hooks.onPower('b_door');
  }
}
/* phá gạch là có thể rơi đồ (như bản Super ngày xưa) · cả lớp cùng bảng rơi: cùng viên gạch → cùng món */
const DROPS = [['bomb', .075], ['fire', .075], ['full', .01], ['apple', .02], ['berry', .015], ['banana', .015], ['speed', .015], ['kick', .008], ['flame', .008], ['vest', .005], ['wall', .005], ['remote', .008], ['rocket', .018], ['laser', .014], ['mega', .01], ['ice', .01], ['shield', .012]];   // ~25%: khoảng 4 viên gạch rơi 1 món
function hash01(a) { a |= 0; a = (a ^ 61) ^ (a >>> 16); a = a + (a << 3) | 0; a ^= a >>> 4; a = Math.imul(a, 0x27d4eb2d); a ^= a >>> 15; return (a >>> 0) / 4294967296 }   // trộn số: mỗi viên gạch một kết quả
function rollDrop(c, r) {
  let x = hash01(((seed0 % 100000) * 31 + S.level * 977 + 13) * 4099 + c * 197 + r * 7919);
  for (const [k, p] of DROPS) { if (k === 'remote' && S.level < 2) continue; if (x < p) return k; x -= p }
  return null;
}
function brickGone(c, r) {
  set(c, r, 0);
  if (door && door.c === c && door.r === r && !door.show) { door.show = true; S.hooks.onPower && S.hooks.onPower('b_found'); return }
  let hidden = false; for (const it of items) if (it.c === c && it.r === r) { it.show = true; hidden = true }
  if (!hidden && !STAGES[S.level].bonus) { const k = rollDrop(c, r); if (k) items.push({ c, r, k, show: true, got: false }) }
}

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++;
  const st = STAGES[S.level];
  if (overT) { if (--overT === 0) { loadStage(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chơi lại ' + stName() + ' (không phải từ Màn 1) — có ' + LIVES + ' mạng mới, cố lên!') } stepFx(); return }
  if (clearT) { if (--clearT === 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NS - 1) { S.won = true; S.hooks.onWin && S.hooks.onWin() } else loadStage(S.level + 1) } stepFx(); return }
  if (pl.inv) pl.inv--; if (pl.flame) pl.flame--; if (pl.vest) pl.vest--;
  // em
  const can = S.energy > 0 && !frozen();
  const dk = keys.order.length ? keys.order[keys.order.length - 1] : null, dir = { u: 0, r: 1, d: 2, l: 3 }[dk];
  pl.moving = false;
  if (can && dir !== undefined) { pl.d = dir; if (moveOn(pl, dir, (1.7 + pl.speed * .4))) { pl.moving = true; pl.walk += .18; use(COST.walk) } }
  if (keys.bp) { keys.bp = 0; if (can) placeBomb() }
  if (keys.xp) { keys.xp = 0; const b = pl.remote && bombs.find(q => !q.gone && !q.en); if (b) b.t = 0; else if (can) fireLaser() }
  // bom
  for (const b of bombs) {
    if (b.gone) continue;
    if (b.slide !== null && b.slide !== undefined) {   // bom bị đá trượt
      const dx = [0, 1, 0, -1][b.slide], dy = [-1, 0, 1, 0][b.slide], nc = b.c + dx, nr = b.r + dy;
      const blocked = at(nc, nr) !== 0 || bombAt(nc, nr) || enemies.some(e => !e.dead && cellOf(e.x) === nc && cellOf(e.y) === nr);
      if (blocked && Math.abs(b.x - mid(b.c)) < 3 && Math.abs(b.y - mid(b.r)) < 3) { b.slide = null; b.x = mid(b.c); b.y = mid(b.r); if (b.rk) b.t = 0 }
      else { b.x += dx * 4; b.y += dy * 4; b.c = cellOf(b.x); b.r = cellOf(b.y) }
    }
    if (--b.t <= 0) explode(b);
  }
  bombs = bombs.filter(b => !b.gone);
  for (const f of flames) f.t--; flames = flames.filter(f => f.t > 0);
  for (const e of fx) if (e.k === 'brk' && ++e.t === 22) brickGone(e.c, e.r);
  fx = fx.filter(e => !(e.k === 'brk' && e.t >= 22) && !(e.k !== 'brk' && ++e.t > e.life));
  // quái
  for (const e of enemies) {
    if (e.dead) { e.dead++; continue }
    if (e.born) { e.born--; continue }
    if (S.tick % 8 === 0) e.fr ^= 1;
    if (e.hurtT) e.hurtT--; if (e.frz) e.frz--;
    const centered = Math.abs(e.x - mid(cellOf(e.x))) < e.sp && Math.abs(e.y - mid(cellOf(e.y))) < e.sp;
    e.dashing = !!e.T.dash && !e.frz && lined(e);   // donut thẳng hàng với em: lăn nhanh
    if (!e.frz && (centered && Math.random() < e.T.turn * (e.dashing ? 0 : .25) || !moveOn(e, e.d, e.sp * (e.dashing ? 2.3 : 1)))) {
      if (centered) { e.x = mid(cellOf(e.x)); e.y = mid(cellOf(e.y)) }
      const c = cellOf(e.x), r = cellOf(e.y), opts = [];
      for (let d = 0; d < 4; d++) if (passable(e, c + [0, 1, 0, -1][d], r + [-1, 0, 1, 0][d])) opts.push(d);
      if (opts.length) {
        if (Math.random() < e.T.smart) {   // quái khôn: chọn hướng gần em hơn
          opts.sort((a, b) => dist(c + [0, 1, 0, -1][a], r + [-1, 0, 1, 0][a]) - dist(c + [0, 1, 0, -1][b], r + [-1, 0, 1, 0][b])); e.d = opts[0];
        } else e.d = opts[Math.floor(Math.random() * opts.length)];
      }
    }
    if (e.T.tele && !e.frz && --e.tt <= 0 && centered) {   // đĩa bay: dịch chuyển tức thời sang ô trống khác (nhấp nháy vàng báo trước)
      e.tt = 260 + Math.floor(Math.random() * 220);
      for (let q = 0; q < 40; q++) { const c = 1 + Math.floor(Math.random() * (COLS - 2)), r = 1 + Math.floor(Math.random() * (ROWS - 2)); if (at(c, r) === 0 && !bombAt(c, r) && dist(c, r) >= 3) { fx.push({ k: 'tp', x: e.x, y: e.y, t: 0, life: 24 }); e.x = mid(c); e.y = mid(r); e.born = 24; fx.push({ k: 'tp', x: e.x, y: e.y, t: 0, life: 24 }); GC.sfx('pop'); break } }
    }
    if (e.T.boss && !e.frz && --e.sm <= 0) { e.sm = 520; if (enemies.filter(q => !q.dead).length < 6) { const L = STAGES[S.level].en; addEnemy(L[Math.floor(Math.random() * L.length)], null, 0, { c: cellOf(e.x), r: cellOf(e.y) }); total++; S.hooks.onPower && S.hooks.onPower('b2_summon') } }   // Vua Bom gọi đệ tử
    if (!e.frz && e.T.bomber && --e.bt <= 0 && centered) {   // quỷ đặt bom: thả bom tại chỗ rồi bỏ chạy
      const c = cellOf(e.x), r = cellOf(e.y); e.bt = (e.T.boss ? (e.hp <= (e.mhp || 8) / 2 ? 110 : 170) : 260) + Math.floor(Math.random() * (e.T.boss ? 60 : 220)) / LVC.spd;
      if (!bombAt(c, r) && Math.abs(c - cellOf(pl.x)) + Math.abs(r - cellOf(pl.y)) > 1) { bombs.push({ c, r, x: mid(c), y: mid(r), t: 150, fire: e.T.boss || lvSel >= 3 ? 3 : 2, slide: null, gone: false, en: true }); GC.sfx('bplace') }
    }
    if (!e.hurtT && inFlame(cellOf(e.x), cellOf(e.y), true)) {
      if (e.hp > 1) { e.hp--; e.hurtT = 70; GC.sfx('bump') }   // rùa giáp: mất mũ sắt, nổ lần nữa mới chết
      else {
        e.dead = 1; score += e.T.pts; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp); if (e.T.boss) { S.energy += 40; S.hooks.onPower && S.hooks.onPower(PART === 3 ? 'b2_kingdown' : 'b2_princedown') }
        if (e.T.split) { const c = cellOf(e.x), r = cellOf(e.y); for (let i = 0; i < 2; i++) { addEnemy(e.T.split, null, 0, { c, r }); const n = enemies[enemies.length - 1]; n.born = 50; n.d = i ? 1 : 3 } total += 2 }
      }
    }
    else if (!pl.inv && !e.frz && Math.hypot(e.x - pl.x, e.y - pl.y) < (e.T.boss ? 30 : 22)) { if (pl.vest) { if (!e.T.boss) { e.dead = 1; S.stomps++; score += e.T.pts; GC.sfx('stomp') } } else hurt() }
  }
  enemies = enemies.filter(e => !e.dead || e.dead < 40);
  // lửa trúng em
  if (!pl.inv && !pl.flame && !pl.vest && inFlame(cellOf(pl.x), cellOf(pl.y))) hurt();
  // vật phẩm
  for (const it of items) if (it.show && !it.got && cellOf(pl.x) === it.c && cellOf(pl.y) === it.r) { it.got = true; grab(it.k) }
  // màn thưởng: quái ra liên tục
  if (st.bonus) {
    if (--spawnT <= 0) { spawnT = 70; if (enemies.filter(e => !e.dead).length < 8) addEnemy(st.en[Math.floor(Math.random() * 3)], null, 4) }
    if (--bonusT <= 0) { clearT = 90; GC.sfx('flag') }
  } else if (door && door.show && !enemies.some(e => !e.dead) && cellOf(pl.x) === door.c && cellOf(pl.y) === door.r) { clearT = 100; GC.sfx('flag') }
  stepFx();
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
const lined = e => (cellOf(e.y) === cellOf(pl.y) && Math.sign(pl.x - e.x) === [0, 1, 0, -1][e.d] && Math.abs(pl.x - e.x) < U * 7) || (cellOf(e.x) === cellOf(pl.x) && Math.sign(pl.y - e.y) === [-1, 0, 1, 0][e.d] && Math.abs(pl.y - e.y) < U * 7);
const dist = (c, r) => Math.abs(c - cellOf(pl.x)) + Math.abs(r - cellOf(pl.y));
const inFlame = (c, r, mine) => flames.some(f => f.c === c && f.r === r && !(mine && f.en));   // quái không chết vì bom của quỷ
function hurt() {
  if (pl.shd) { pl.shd = 0; pl.inv = 100; GC.sfx('bump'); for (let i = 0; i < 14; i++)parts.push({ x: pl.x, y: pl.y - 6, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4, l: 26, c: '#8AE0FF' }); S.hooks.onPower && S.hooks.onPower('b2_shdbreak'); return }   // 🛡️ khiên bong bóng đỡ 1 đòn
  S.hits++; S.lives--; GC.sfx('bdie'); GC.music.hush(true); setTimeout(() => GC.music.hush(false), 1300); for (let i = 0; i < 10; i++)parts.push({ x: pl.x, y: pl.y, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, l: 30, c: '#FF6B81' });
  if (S.lives <= 0) { S.lives = LIVES; overT = 130; return }
  S.hooks.onFall && S.hooks.onFall(0, '💥 Trúng đòn! 💔 Mất 1 mạng — còn ' + S.lives + ' mạng'); resetPlayer(false);
}
function grab(k) {
  GC.sfx('bitem');
  if (k === 'bomb') pl.bombs = Math.min(8, pl.bombs + 1); else if (k === 'fire') pl.fire = Math.min(8, pl.fire + 1); else if (k === 'speed') pl.speed = Math.min(3, pl.speed + 1);
  else if (k === 'remote') pl.remote = true; else if (k === 'kick') pl.kick = true; else if (k === 'wall') pl.wall = true;
  else if (k === 'flame') pl.flame = 1800; else if (k === 'vest') pl.vest = 600; else if (k === 'full') pl.fire = 8;
  else if (k === 'laser') pl.laser = Math.min(9, pl.laser + 3); else if (k === 'rocket') pl.rocket = Math.min(9, pl.rocket + 4); else if (k === 'mega') pl.mega = Math.min(9, pl.mega + 3); else if (k === 'shield') pl.shd = 1;
  else if (k === 'ice') { for (const e of enemies) if (!e.dead) e.frz = e.T.boss ? 150 : 360; fx.push({ k: 'ice', t: 0, life: 30 }); GC.sfx('cp') }   // 🧊 đóng băng mọi quái 6 giây (Vua Bom 2,5 giây)
  else if (k === 'apple' || k === 'berry' || k === 'banana') { score += 3; S.energy += 5; S.coins++; pops.push({ x: pl.x, y: pl.y - 20, t: 40 }); S.hooks.onPower && S.hooks.onPower('b_fruit'); return }
  syncX(); S.hooks.onPower && S.hooks.onPower((NEWW[k] ? 'b2_' : 'b_') + k);
}
function stepFx() { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += .12; if (--p.l <= 0) parts.splice(i, 1) } }

/* ═════ hình ảnh pixel ═════ */
function hex(c) { c = parseInt(c.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255] }
function mix(a, b, t) { a = hex(a); b = hex(b); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('') }
const PXC = {};
function pix(key, rows, pal) { if (PXC[key]) return PXC[key]; const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const x = c.getContext('2d'); rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1) } } }); return PXC[key] = c }
function cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn((col, px, py, ww, hh) => { x.fillStyle = col; x.fillRect(px, py, ww || 1, hh || 1) }); return c }
const HERO_F = ['_____CCCCCC_____', '___CCccwwcccCC__', '__CcccwwcccccC__', '__CccssssssccC__', '__CcsskssksscC__', '__CcsskssksscC__', '__CccssmmssccC__', '___CCccccccCC___', '____gBBBBBBg____', '___ggBBuuBBgg___', '___gBBBuuBBBg___', '____BBBBBBBB____', '____BBB__BBB____', '___ffff__ffff___', '___ffff__ffff___', '________________'];
const HERO_F2 = HERO_F.slice(0, 12).concat(['___BBB____BBB___', '__ffff____fff___', '__fff___________', '________________']);
const HERO_B = HERO_F.map((r, i) => i >= 3 && i <= 6 ? '__CcccccccccccC_'.slice(0, 13) + 'C__' : r);
const HERO_B2 = HERO_B.slice(0, 12).concat(HERO_F2.slice(12));
const HERO_S = ['_____CCCCCC_____', '___CCccwwcccC___', '__CcccwwccccCC__', '__Cccccsssssc___', '__Cccccsskssc___', '__Cccccsskssc___', '__Cccccssmssc___', '___CCcccccccC___', '_____gBBBBBg____', '____gBBuuBBBg___', '____BBBuuBBB____', '____BBBBBBBB____', '_____BBBBBB_____', '____ffff_fff____', '____ffff_fff____', '________________'];
const HERO_S2 = HERO_S.slice(0, 12).concat(['____BBB__BBB____', '___fff____fff___', '___ff______ff___', '________________']);
const heroPal = c => ({ C: mix(c, '#000000', .45), c, w: '#FFFFFF', s: '#FFD8B8', k: '#1A1A1A', m: '#E8508A', g: '#FF9CC8', B: mix(c, '#ffffff', .82), u: mix(c, '#000000', .2), f: '#5A3A8A' });
const BOMB = ['__________yo____', '_________o__y___', '________kk______', '______kkkkk_____', '____kkkkkkkkk___', '___kkwwkkkkkkk__', '__kkwwkkkkkkkkk_', '__kkwkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '___kkkkkkkkkkk__', '____kkkkkkkkk___', '______kkkkk_____'];
const PBOMB = { k: '#22223A', w: '#9AA8D8', o: '#FF7A1A', y: '#FFE08A' };
const EN = {
  bal: ['_____pppppp_____', '___pppppppppp___', '__pppwwppppwwpp_', '_ppppwkppppwkpp_', '_ppppwkppppwkpp_', 'pppppppppppppppp', 'ppppppppppppppp_', 'pppmpppppppmppp_', '_ppppmmmmmmpppp_', '__pppppppppppp__', '___pppppppppp___', '_____pppppp_____', '______p__p______', '_____p____p_____'],
  oni: ['_______bb_______', '______bbbb______', '_____bbbbbb_____', '____bbbbbbbb____', '___bbwwbbwwbb___', '__bbbwkbbwkbbb__', '__bbbwkbbwkbbb__', '_bbbbbbbbbbbbbb_', '_bbbbmbbbbmbbbb_', '_bbbbbmmmmbbbbb_', '__bbbbbbbbbbbb__', '___bbbbbbbbbb___', '____bb____bb____', '___bbb____bbb___'],
  bar: ['____oooooooo____', '___oOOOOOOOOo___', '__oooooooooooo__', '__oOOOOOOOOOOo__', '__owwoooooowwo__', '__owkoooooowko__', '__oooooooooooo__', '__oOOOOOOOOOOo__', '__ooommmmmmooo__', '__oooooooooooo__', '__oOOOOOOOOOOo__', '___oooooooooo___', '____oo____oo____', '___ooo____ooo___'],
  smi: ['_____yyyyyy_____', '___yyyyyyyyyy___', '__yyyyyyyyyyyy__', '_yyyykyyyykyyyy_', '_yyyykyyyykyyyy_', 'yyyyyyyyyyyyyyyy', 'yyyyyyyyyyyyyyyy', 'yykyyyyyyyyyykyy', 'yyykyyyyyyyykyyy', '_yyykkkkkkkkyyy_', '__yyyyyyyyyyyy__', '___yyyyyyyyyy___', '_____yyyyyy_____'],
  gho: ['_____llllll_____', '___llllllllll___', '__llllllllllll__', '_lllwwllllwwlll_', '_lllwkllllwklll_', '_lllwkllllwklll_', 'llllllllllllllll', 'lllllllmmlllllll', 'llllllllllllllll', 'llllllllllllllll', 'llllllllllllllll', 'll_lll_ll_lll_ll', 'l___l___l___l__l'],
  cha: ['___r___rr___r___', '____r_rrrr_r____', '___rrrrrrrrrr___', '__rrrrrrrrrrrr__', '_rrrwwrrrrwwrrr_', '_rrrwkrrrrkwrrr_', 'rrrrrrrrrrrrrrrr', 'rrrrkkkkkkkkrrrr', 'rrrrkwkwkwkkrrrr', '_rrrrrrrrrrrrrr_', '__rrrrrrrrrrrr__', '___rr__rr__rr___', '__rr__rr__rr__r_'] };
EN.dor = ['________________', '_____oooooo_____', '___oooooooooo___', '__oooOOooOOooo__', '_oooOwkOOwkOooo_', '_oooOwkOOwkOooo_', 'ooooOOOOOOOOoooo', 'oooooommmmoooooo', 'oooooooooooooooo', '_oooooooooooooo_', 'o_oooo_oo_oooo_o', '_o__o__o__o__o__'];
EN.pon = ['_____kkkkkk_____', '___kkyyyyyykk___', '__kyyyOOOOyyyk__', '_kyyOOyyyyOOyyk_', '_kyOywkyywkyOyk_', 'kyyOywkyywkyOyyk', 'kyyOyyyyyyyyOyyk', 'kyyOyymmmmyyOyyk', '_kyOyyyyyyyyOyk_', '_kyyOOyyyyOOyyk_', '__kyyyOOOOyyyk__', '___kkyyyyyykk___', '_____kkkkkk_____'];
EN.kab = ['______gggg______', '____gggggggg____', '___ggGggggGgg___', '__ggwkggggwkgg__', '__ggwkggggwkgg__', '_gggggggggggggg_', '_gggggkggkggggg_', '_ggggggkkgggggg_', '_gGgggggggggGgg_', '__gggggggggggg__', '___gg_gggg_gg___', '__g__g____g__g__'];
EN.kab2 = EN.kab;
EN.tor = ['____kkkkkkkk____', '___kSSSSSSSSk___', '__kSsSSsSSsSSk__', '__kSSSSSSSSSSk__', '_kkkkkkkkkkkkkk_', '_krrwkrrrrwkrrk_', '_krrwkrrrrwkrrk_', '_krrrrrrrrrrrrk_', '_krrrkkkkkkrrrk_', '__krrrrrrrrrrk__', '___kk______kk___', '__kkk______kkk__'];
EN.tor2 = EN.tor.map((r, i) => i < 4 ? '________________' : r);
EN.bmb = ['__k__________k__', '__kk__vvvv__kk__', '___kvvvvvvvvk___', '___vvwwvvwwvv___', '__vvvwkvvwkvvv__', '__vvvvvvvvvvvv__', '__vvvvmmmmvvvv__', '___vvvwvvwvvv___', '____vvvvvvvv____', '___vv_vvvv_vv___', '__vv________vv__'];
const PEN = { bal: { p: '#FF8CC0', w: '#FFFFFF', k: '#1A1A1A', m: '#C2185B' }, oni: { b: '#5AB0FF', w: '#FFFFFF', k: '#1A1A1A', m: '#1D4E99' }, bar: { o: '#FFB36B', O: '#C9733A', w: '#FFFFFF', k: '#1A1A1A', m: '#7A3E00' },
  smi: { y: '#FFE08A', k: '#7A5A00' }, gho: { l: '#C9B8FF', w: '#FFFFFF', k: '#3B2F78', m: '#7A6AA8' }, cha: { r: '#FF5C7A', w: '#FFFFFF', k: '#3A0010' },
  dor: { o: '#D9894A', O: '#F2B27A', w: '#FFFFFF', k: '#3A1A08', m: '#7A3A10' }, pon: { k: '#7A4A00', y: '#FFD23F', O: '#FF9A1A', w: '#FFFFFF', m: '#C2185B' },
  kab: { g: '#5CD65C', G: '#B5F5B5', w: '#FFFFFF', k: '#0B4F12' }, kab2: { g: '#8CEB7A', G: '#E0FFD0', w: '#FFFFFF', k: '#0B4F12' },
  tor: { k: '#1A1A2E', S: '#A6B4CC', s: '#FFFFFF', r: '#E8457A', w: '#FFFFFF' }, tor2: { k: '#1A1A2E', S: '#A6B4CC', s: '#FFFFFF', r: '#FF8FB0', w: '#FFFFFF' },
  bmb: { k: '#1A1A1A', v: '#8B4FE0', w: '#FFFFFF', m: '#FFE08A' } };
const ICON = {
  bomb: BOMB.slice(2), fire: ['______o_______', '_____oyo______', '____oyyyo_____', '___oyywyyo____', '__oyywwwyyo___', '__oyywwwyyo___', '___oyywyyo____', '____ooooo_____'],
  speed: ['____kkk_______', '___kwwwk______', '___kwwwk______', '___kwwwkkkk___', '___kwwwwwwwk__', '___kkkkkkkkk__', '__k__k___k____', '_kkk_kkk_kkk__'],
  remote: ['_______k______', '______k_k_____', '_____k___k____', '____kkkkkk____', '____krrrrk____', '____kkkkkk____', '____kwkwkk____', '____kkkkkk____', '____kwkwkk____', '____kkkkkk____'],
  kick: ['____kkkk______', '____kwwk______', '____kwwk______', '____kwwk______', '____kwwkkkkk__', '____kwwwwwwwk_', '____kkkkkkkkk_'],
  wall: ['___llllllll___', '__llllllllll__', '_lllwwllwwlll_', '_lllkwllkwlll_', '_llllllllllll_', '_llllllllllll_', '_ll_ll__ll_ll_'],
  flame: ['____kkkkkk____', '___krrrrrrk___', '___krwwwwrk___', '___krrrrrrk___', '___krrrrrrk___', '___krrrrrrk___', '____kkkkkk____'],
  vest: ['___kk____kk___', '__kyykkkkyyk__', '__kyyyyyyyyk__', '__kyyykkyyyk__', '__kyyyyyyyyk__', '__kyyyyyyyyk__', '___kkkkkkkk___'],
  apple: ['____gg______', '___g________', '__rrrrrr____', '_rrwrrrrr___', 'rrwrrrrrrr__', 'rrrrrrrrrr__', 'rrrrrrrrrr__', '_rrrrrrrr___', '__rrrrrr____', '___rr_rr____'],
  berry: ['___gggg_____', '____gg______', '__pppppp____', '_pypppypp___', '_pppppppp___', '_ppyppypp___', '__pppppp____', '__ppyppp____', '___pppp_____', '____pp______'],
  banana: ['_________kk_', '________yy__', '_______yyy__', '______yyyy__', '____yyyyy___', '__yyyyyyy___', '_yyyyyyy____', 'yyyyyy______', '_yyy________'] };
ICON.full = ICON.fire;
const ICPAL = { full: { o: '#E52521', y: '#FF7A1A', w: '#FFE08A', k: '#1A1A1A' }, apple: { r: '#E52521', g: '#2DB84B', w: '#FFFFFF' }, berry: { p: '#FF4D7A', y: '#FFE08A', g: '#2DB84B' }, banana: { y: '#FFD23F', k: '#6B3A1E' } };
const FRUIT = { apple: 1, berry: 1, banana: 1 };
let pops = [];
const PIC = { k: '#1A1A1A', w: '#FFFFFF', o: '#FF7A1A', y: '#FFE08A', r: '#E52521', l: '#C9B8FF', ...PBOMB };
/* ═════ phần 2: vẽ nét mượt (không pixel) — gạch / nền mỗi cảnh một kiểu, quái & nhân vật vẽ bằng hình ═════ */
const TC = {}, PI = Math.PI, OL = '#2A2140';
const el = (x, y, rx, ry, col, rot) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, 7); ctx.fill() };
const ol = (col, w) => { ctx.strokeStyle = col || OL; ctx.lineWidth = w || 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke() };
const rr = (x, y, w, h, r, col) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if (col) { ctx.fillStyle = col; ctx.fill() } };
const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill() };
const line = (pts, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke() };
const glow = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, col.slice(0, 7) + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill() };
const eyes = (x, y, f, angry, s) => { s = s || 1; for (const d of [-4.2, 4.2]) { el(x + d * s, y, 3.2 * s, 3.8 * s, '#fff'); ctx.beginPath(); ctx.ellipse(x + d * s, y, 3.2 * s, 3.8 * s, 0, 0, 7); ol(OL, 1.2); el(x + d * s + f * 1.1 * s, y + .5, 1.6 * s, 2 * s, '#1A1030') } if (angry) line([x - 8 * s, y - 5.5 * s, x - 2 * s, y - 3 * s, x - 2 * s, y - 3 * s, x - 2 * s, y - 3 * s], OL, 1.6), line([x + 8 * s, y - 5.5 * s, x + 2 * s, y - 3 * s], OL, 1.6) };
function paint(fn) { const c = document.createElement('canvas'); c.width = c.height = 64; const keep = ctx; ctx = c.getContext('2d'); ctx.scale(2, 2); fn(); ctx = keep; return c }
const PAINT = {
  candy: {
    floor: i => { for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(6 + ((k * 11 + i * 7) % 22), 6 + ((k * 13 + i * 5) % 20)); ctx.rotate(k + i); rr(-2.5, -.8, 5, 1.6, .8, ['#FF8AC0', '#8AD0FF', '#FFD84A'][(k + i) % 3]); ctx.restore() } },
    hard: () => { rr(1, 1, 30, 30, 6, '#7A4A2A'); ol('#3E2412', 2); for (const sx of [4, 17]) for (const sy of [4, 17]) { rr(sx, sy, 11, 11, 2.5, '#925C34'); rr(sx, sy, 11, 4, 2, '#A87044') } el(9, 7, 3, 1.4, '#ffffff55', -.4) },
    soft: () => { rr(2, 9, 28, 21, 4, '#FF9EC0'); ol('#B84A7A', 2); rr(4, 19, 24, 3, 1.5, '#FFF2E0'); ctx.fillStyle = '#FFF6EC'; ctx.beginPath(); ctx.moveTo(1, 12); ctx.quadraticCurveTo(1, 4, 9, 5); ctx.lineTo(23, 5); ctx.quadraticCurveTo(31, 4, 31, 12); ctx.quadraticCurveTo(28, 17, 25, 12); ctx.quadraticCurveTo(21, 19, 17, 12); ctx.quadraticCurveTo(12, 18, 8, 12); ctx.quadraticCurveTo(4, 16, 1, 12); ctx.fill(); ol('#B84A7A', 1.8); el(16, 5, 3.6, 3.6, '#E8304A'); ctx.beginPath(); ctx.arc(16, 5, 3.6, 0, 7); ol('#8A1028', 1.4); el(15, 4, 1.1, .8, '#ffffffaa'); for (const [sx, sy, c] of [[7, 9, '#8AD0FF'], [24, 9, '#FFD84A'], [11, 26, '#fff'], [22, 25, '#fff']]) el(sx, sy, 1.2, 1.2, c) }
  },
  sea: {
    floor: i => { for (let k = 0; k < 4; k++) el(5 + ((k * 9 + i * 6) % 24), 6 + ((k * 7 + i * 11) % 22), 1, 1, '#D8C48A'); if (i) { el(22, 23, 3.4, 2.6, '#FFB8C8'); line([22, 21, 22, 25], '#E88AA0', .8) } },
    hard: () => { ctx.fillStyle = '#7E96B4'; ctx.beginPath(); ctx.moveTo(4, 30); ctx.quadraticCurveTo(0, 18, 5, 7); ctx.quadraticCurveTo(12, 0, 22, 3); ctx.quadraticCurveTo(32, 8, 30, 22); ctx.quadraticCurveTo(30, 30, 24, 30); ctx.closePath(); ctx.fill(); ol('#3A4E6E', 2); el(11, 10, 5, 3, '#A4BAD4', -.4); el(21, 20, 4, 3, '#5E7898'); el(10, 22, 2.4, 2, '#5E7898'); ctx.fillStyle = '#FF8A6A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * PI / 5 - PI / 2, q = k % 2 ? 2 : 5; ctx.lineTo(22 + Math.cos(a) * q, 9 + Math.sin(a) * q) } ctx.closePath(); ctx.fill(); ol('#B84A3A', 1) },
    soft: () => { rr(2, 3, 28, 27, 3, '#C8924E'); ol('#6A4420', 2); for (const y of [11, 20]) line([3, y, 29, y], '#8A5E2C', 1.6); rr(2, 3, 28, 4, 2, '#E0B070'); for (const [x, y] of [[6, 7], [26, 7], [6, 25], [26, 25]]) el(x, y, 1.4, 1.4, '#5A3A18'); line([10, 30, 8, 20, 12, 14], '#3EB87A', 2.6); line([22, 30, 25, 22, 21, 17], '#2E9E6A', 2.6); el(16, 16, 4, 3, '#FFE08A'); ctx.beginPath(); ctx.ellipse(16, 16, 4, 3, 0, 0, 7); ol('#8A5E2C', 1.2) }
  },
  forest: {
    floor: i => { for (let k = 0; k < 3; k++) { const x = 6 + ((k * 10 + i * 5) % 22), y = 10 + ((k * 9 + i * 7) % 18); line([x - 2, y, x - 1, y - 4, x, y, x + 1, y - 5, x + 2, y], '#4E8A6A', 1) } if (i) el(8, 24, 1.4, 1.4, '#B8F0A0') },
    hard: () => { el(16, 20, 14, 10, '#7A4E2C'); ctx.beginPath(); ctx.ellipse(16, 20, 14, 10, 0, 0, 7); ol('#3E2412', 2); rr(2, 12, 28, 9, 2, '#7A4E2C'); line([2, 13, 2, 21], '#3E2412', 2); line([30, 13, 30, 21], '#3E2412', 2); el(16, 12, 14, 9, '#DDB07A'); ctx.beginPath(); ctx.ellipse(16, 12, 14, 9, 0, 0, 7); ol('#3E2412', 2); for (const r of [9, 5.5, 2.5]) { ctx.beginPath(); ctx.ellipse(16, 12, r, r * .62, 0, 0, 7); ol('#B07E48', 1.1) } el(6, 24, 4, 2.4, '#4EA86A'); el(26, 25, 3, 2, '#4EA86A') },
    soft: () => { glow(16, 12, 18, '#5AF0E055'); rr(11, 15, 10, 15, 4, '#F4EBD8'); ol('#6A5A8A', 1.8); ctx.fillStyle = '#3ED8C8'; ctx.beginPath(); ctx.ellipse(16, 16, 14, 12, 0, PI, 0); ctx.closePath(); ctx.fill(); ol('#1A6A7A', 2); for (const [x, y, r] of [[9, 11, 2.4], [16, 8, 2.8], [23, 12, 2.2]]) el(x, y, r, r * .8, '#E8FFFA'); rr(4, 23, 6, 7, 2.5, '#F4EBD8'); ol('#6A5A8A', 1.3); ctx.fillStyle = '#B07AF0'; ctx.beginPath(); ctx.ellipse(7, 24, 5.5, 4.5, 0, PI, 0); ctx.closePath(); ctx.fill(); ol('#5A2A9A', 1.4) }
  },
  space: {
    floor: i => { ctx.strokeStyle = '#2A3254'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, 31, 31); el(4, 4, 1, 1, '#6A74A0'); el(28, 28, 1, 1, '#6A74A0'); if (i) { rr(12, 14, 8, 4, 2, '#2A3254'); el(16, 16, 1.2, 1.2, '#5AF0FF') } },
    hard: () => { rr(1, 1, 30, 30, 5, '#56608C'); ol('#1E2444', 2); rr(5, 5, 22, 22, 3, '#7882B2'); rr(5, 5, 22, 7, 3, '#939CC8'); for (const [x, y] of [[4, 4], [28, 4], [4, 28], [28, 28]]) el(x, y, 1.6, 1.6, '#C8CEE8'); glow(16, 17, 9, '#5AF0FFaa'); el(16, 17, 4, 4, '#C8FBFF'); ctx.beginPath(); ctx.arc(16, 17, 4, 0, 7); ol('#1E2444', 1.4) },
    soft: () => { rr(3, 3, 26, 26, 6, '#6A3AB8'); ol('#2A1260', 2); rr(6, 6, 20, 20, 4, '#8A5AD8'); glow(16, 16, 11, '#F0C8FFcc'); poly([16, 9, 22, 16, 16, 23, 10, 16], '#F4DCFF'); ol('#2A1260', 1.2); for (const [x, y, a, b] of [[4, 4, 1, 1], [28, 4, -1, 1], [4, 28, 1, -1], [28, 28, -1, -1]]) line([x + a * 4, y, x, y, x, y + b * 4], '#FFE24A', 1.6) }
  },
  castle: {
    floor: i => { line([0, 16, 32, 16], '#3A3048', 1); line([i ? 10 : 20, 0, i ? 10 : 20, 16], '#3A3048', 1); line([i ? 22 : 8, 16, i ? 22 : 8, 32], '#3A3048', 1) },
    hard: () => { rr(1, 1, 30, 30, 3, '#6E6486'); ol('#221A30', 2); rr(3, 3, 26, 6, 2, '#8A80A4'); line([2, 12, 30, 12], '#3E3452', 1.4); line([2, 21, 30, 21], '#3E3452', 1.4); line([16, 3, 16, 12], '#3E3452', 1.4); line([9, 12, 9, 21], '#3E3452', 1.4); line([23, 12, 23, 21], '#3E3452', 1.4); line([16, 21, 16, 29], '#3E3452', 1.4); line([20, 14, 22, 17, 20, 19], '#221A30', 1) },
    soft: () => { rr(5, 2, 22, 28, 9, '#A86A3A'); ol('#4A2812', 2); rr(8, 4, 5, 24, 3, '#C88A52'); for (const y of [7, 21]) { rr(4, y, 24, 4, 2, '#5A4E66'); ctx.beginPath(); ctx.rect(4, y, 24, 4); ol('#221A30', 1.2) } el(16, 16, 3, 3, '#4A2812'); el(16, 16, 1.4, 1.4, '#FFB040') }
  },
  bonus: {
    floor: i => { ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); const x = i ? 22 : 9, y = i ? 9 : 22; for (let k = 0; k < 8; k++) { const a = k * PI / 4, q = k % 2 ? 1 : 3.4; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) } ctx.fill() },
    hard: () => { rr(1, 1, 30, 30, 7, '#FFB020'); ol('#8A4A00', 2); rr(4, 4, 24, 9, 4, '#FFD060'); ctx.fillStyle = '#FFF6C0'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * PI / 5 - PI / 2, q = k % 2 ? 4.5 : 10; ctx.lineTo(16 + Math.cos(a) * q, 17 + Math.sin(a) * q) } ctx.closePath(); ctx.fill(); ol('#8A4A00', 1.6) },
    soft: () => { rr(3, 3, 26, 26, 6, '#FF8AC0'); ol('#8A2A5A', 2) }
  }
};
function tiles(th) {
  if (TC[th]) return TC[th];
  const T = THEMES[th], P = PAINT[T.id], fl = i => paint(() => { ctx.fillStyle = T.floor[i]; ctx.fillRect(0, 0, 32, 32); ctx.fillStyle = '#00000012'; ctx.fillRect(0, 31, 32, 1); P.floor(i) });
  return TC[th] = { f0: fl(0), f1: fl(1), hard: paint(P.hard), soft: paint(P.soft), shade: paint(() => { const g = ctx.createLinearGradient(0, 0, 0, 9); g.addColorStop(0, '#00000040'); g.addColorStop(1, '#00000000'); ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 9) }) };
}
function blit(img, x, y, s, flip) { if (flip) { ctx.save(); ctx.translate(Math.round(x + img.width * s), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width * s, img.height * s); ctx.restore() } else ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s) }
const pixFont = n => n + 'px "Press Start 2P", monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1A1A1A'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
const emo = (t, x, y, size) => { ctx.font = size + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(t, x, y) };
function flameDraw(f) {
  const x = f.c * U, y = f.r * U, k = Math.min(1, f.t / 10), w = Math.round((8 + 8 * k) / 2) * 2, flick = (S.tick >> 1) & 1;
  const layers = f.lz ? [['#2A8AFF', w + 2], ['#5AE0FF', w - 3], ['#FFFFFF', Math.max(2, w - 9)]] : f.en ? [['#8A2AD8', w + 6], ['#E07AFF', w + 1], ['#FFE8FF', Math.max(2, w - 6)]] : [['#FF7A1A', w + 6], ['#FFB627', w + 1], ['#FFF3B0', Math.max(2, w - 6)]];
  for (const [col, ww] of layers) {
    const hw = ww / 2 + (flick ? 1 : 0), R = Math.min(hw, 8);
    if (f.k === 'c') { rr(x + U / 2 - hw, y, hw * 2, U, 2, col); rr(x, y + U / 2 - hw, U, hw * 2, 2, col); el(x + U / 2, y + U / 2, hw + 4, hw + 4, col) }
    else if (f.k === 'h') { ctx.fillStyle = col; ctx.fillRect(x, y + U / 2 - hw, U, hw * 2) }
    else if (f.k === 'v') { ctx.fillStyle = col; ctx.fillRect(x + U / 2 - hw, y, hw * 2, U) }
    else { const d = +f.k[1]; if (d === 1) rr(x - R, y + U / 2 - hw, U - 4 + R, hw * 2, R, col); else if (d === 3) rr(x + 4, y + U / 2 - hw, U - 4 + R, hw * 2, R, col); else if (d === 0) rr(x + U / 2 - hw, y + 4, hw * 2, U - 4 + R, R, col); else rr(x + U / 2 - hw, y - R, hw * 2, U - 4 + R, R, col) }
  }
}
/* nhân vật: phi công bom nhí — mũ trắng có mào & ăng-ten màu của em, áo màu của em, mắt to (d: 0 lưng · 2 mặt · 1/3 nghiêng) */
function hero2(x, y, d, wf, col, sc2) {
  const dk = mix(col, '#000000', .45), side = d === 1 ? 1 : d === 3 ? -1 : 0, bob = wf ? -1.2 : 0;
  ctx.save(); ctx.translate(x, y); if (sc2) ctx.scale(sc2, sc2);
  el(0, 11.5, 10, 3.2, '#00000033');
  for (const sx of [-5, 5]) { el(sx + side * 1.5, 9.5 - (wf && sx < 0 ? 2.2 : 0) - (!wf && 0), 4.8, 3.3, '#5A3A8A'); ctx.beginPath(); ctx.ellipse(sx + side * 1.5, 9.5 - (wf && sx < 0 ? 2.2 : 0), 4.8, 3.3, 0, 0, 7); ol(OL, 1.5) }
  if (d !== 2) { ctx.fillStyle = '#FFD84A'; ctx.beginPath(); const w = Math.sin(S.tick * .25) * 2; ctx.moveTo(-side * 5, -2 + bob); ctx.quadraticCurveTo(-side * 13 - (side ? 0 : 9), 1 + w + bob, -side * 15 - (side ? 0 : 11), 7 + bob); ctx.lineTo(-side * 9 - (side ? 0 : 6), 6 + bob); ctx.closePath(); ctx.fill(); ol(OL, 1.4) }
  rr(-8, -3.5 + bob, 16, 13, 6, col); ol(dk, 2); rr(-8, 4 + bob, 16, 3, 1.5, '#FFFFFF'); if (d !== 0) el(side * 3, 5.5 + bob, 2, 2, '#FFD23F');
  for (const sx of [-1, 1]) { el(sx * 9.8, 1.5 + bob + (wf ? sx * 1.6 : 0), 3.2, 3.2, '#FFE0C4'); ctx.beginPath(); ctx.arc(sx * 9.8, 1.5 + bob + (wf ? sx * 1.6 : 0), 3.2, 0, 7); ol(OL, 1.3) }
  for (const sx of [-1, 1]) { el(sx * 12, -11 + bob, 2.8, 3.8, col); ctx.beginPath(); ctx.ellipse(sx * 12, -11 + bob, 2.8, 3.8, 0, 0, 7); ol(dk, 1.3) }
  el(0, -12 + bob, 12.5, 11.5, '#FFFFFF'); ctx.beginPath(); ctx.ellipse(0, -12 + bob, 12.5, 11.5, 0, 0, 7); ol(OL, 2.2);
  rr(-3, -24.5 + bob, 6, 9, 3, col); ol(dk, 1.4); line([0, -24 + bob, 2.5, -29 + bob], OL, 1.6); el(2.8, -30 + bob, 2.6, 2.6, col); ctx.beginPath(); ctx.arc(2.8, -30 + bob, 2.6, 0, 7); ol(dk, 1.3);
  if (d !== 0) {
    el(side * 3, -10 + bob, 8.6 - Math.abs(side) * 1.4, 6.6, '#FFE6CE'); ctx.beginPath(); ctx.ellipse(side * 3, -10 + bob, 8.6 - Math.abs(side) * 1.4, 6.6, 0, 0, 7); ol(OL, 1.5);
    for (const ex of side ? [side * 5.6, side * 1] : [-3.4, 3.4]) { el(ex, -10.6 + bob, 1.8, 3, '#2A1E3A'); el(ex + .5, -11.8 + bob, .8, 1, '#fff') }
    el(side * 3 - 5.4 * (side ? side : 1) * (side ? .2 : 1), -7.4 + bob, 1.8, 1.1, '#FF9AB0aa'); if (!side) el(5.4, -7.4 + bob, 1.8, 1.1, '#FF9AB0aa');
    ctx.beginPath(); ctx.arc(side * 4, -8 + bob, 1.8, .2, PI - .2); ol('#8A3A3A', 1.1);
  } else { rr(-6, -2.5 + bob, 12, 9, 3, dk); ol(OL, 1.4); rr(-3, -15 + bob, 6, 6, 2, col) }
  el(-5, -19 + bob, 3, 1.6, '#ffffffcc', -.5);
  ctx.restore();
}
/* quái phần 2 (x, y = tâm ô · f = hướng ±1) */
const MON = {
  gum: (e, x, y, t, f) => { const b = 4 + Math.sin(t * .1 + e.ph) * 3; el(x, y + 11, 9, 2.6, '#00000030'); ctx.fillStyle = '#FF8CC0'; ctx.beginPath(); ctx.moveTo(x - 11, y + 10); ctx.quadraticCurveTo(x - 13, y - 10, x, y - 10); ctx.quadraticCurveTo(x + 13, y - 10, x + 11, y + 10); ctx.quadraticCurveTo(x + 6, y + 13, x + 3, y + 9); ctx.quadraticCurveTo(x, y + 13, x - 3, y + 9); ctx.quadraticCurveTo(x - 6, y + 13, x - 11, y + 10); ctx.fill(); ol('#B83A7A', 2); el(x - 5, y - 6, 3, 1.6, '#ffffff99', -.5); eyes(x, y - 2, f); el(x + f * 5, y + 5, b, b, '#FFD0E6cc'); ctx.beginPath(); ctx.arc(x + f * 5, y + 5, b, 0, 7); ol('#E85AA0', 1.2); el(x + f * 5 - b * .35, y + 5 - b * .35, b * .25, b * .2, '#fff') },
  cup: (e, x, y, t, f) => { const bo = e.fr ? -1 : 0; el(x, y + 12, 9, 2.6, '#00000030'); poly([x - 9, y + 1, x + 9, y + 1, x + 7, y + 12, x - 7, y + 12], '#7AC8FF'); ol('#2A5A9A', 2); for (const d of [-4, 0, 4]) line([x + d, y + 2, x + d * .8, y + 11], '#4A98E0', 1.2); for (const [dy, rx, ry] of [[-1, 11.5, 5.5], [-6, 8.5, 4.6], [-10.5, 5.2, 3.6]]) { el(x, y + dy + bo, rx, ry, '#FFF0F6'); ctx.beginPath(); ctx.ellipse(x, y + dy + bo, rx, ry, 0, 0, 7); ol('#C87A9A', 1.6) } el(x, y - 15 + bo, 3, 3, '#E8304A'); ctx.beginPath(); ctx.arc(x, y - 15 + bo, 3, 0, 7); ol('#8A1028', 1.2); for (const [dx, dy, c] of [[-5, -2, '#FF8AC0'], [4, -4, '#FFD84A'], [0, -9, '#8AD0FF']]) el(x + dx, y + dy + bo, 1.1, 1.1, c); eyes(x, y + 6, f, false, .8) },
  don: (e, x, y, t, f) => { el(x, y + 12, 10, 2.6, '#00000030'); if (e.dashing) for (let k = 1; k <= 3; k++) line([x - f * (12 + k * 4), y - 6 + k * 4, x - f * (20 + k * 5), y - 6 + k * 4], '#ffffffaa', 1.6); ctx.save(); ctx.translate(x, y); ctx.rotate(t * (e.dashing ? .4 : .12) * f); el(0, 0, 12, 12, '#E8A860'); ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ol('#8A5420', 2); ctx.fillStyle = '#FF7AB0'; ctx.beginPath(); for (let k = 0; k <= 16; k++) { const a = k * PI / 8; ctx.lineTo(Math.cos(a) * (10 + (k % 2)), Math.sin(a) * (10 + (k % 2))) } ctx.fill(); el(0, 0, 4, 4, '#3A2440'); ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ol('#8A5420', 1.4); for (let k = 0; k < 7; k++) { ctx.save(); ctx.rotate(k * .9); rr(6, -1, 3.4, 1.5, .7, ['#fff', '#FFE24A', '#8AD0FF', '#7AE08A'][k % 4]); ctx.restore() } ctx.restore(); eyes(x, y - 7, f, e.dashing, .72) },
  crab: (e, x, y, t, f) => { const sn = Math.sin(t * .3 + e.ph), lg = e.fr ? 2 : -2; el(x, y + 12, 11, 2.6, '#00000030'); for (const d of [-1, 1]) { for (let k = 0; k < 3; k++) line([x + d * (6 + k * 2), y + 6, x + d * (11 + k * 2), y + 11 + (k % 2 ? lg : -lg) * .5], '#B8301E', 2); line([x + d * 10, y, x + d * 14, y - 5], '#B8301E', 2.4); el(x + d * 15, y - 8 + sn * d, 4.6, 3.6, '#F0503E', d * .5); ctx.beginPath(); ctx.ellipse(x + d * 15, y - 8 + sn * d, 4.6, 3.6, d * .5, 0, 7); ol('#7A1A10', 1.5); line([x + d * 13, y - 9, x + d * 17, y - 11 - sn * 2], '#7A1A10', 1.2) } el(x, y + 3, 12, 8.5, '#F0503E'); ctx.beginPath(); ctx.ellipse(x, y + 3, 12, 8.5, 0, 0, 7); ol('#7A1A10', 2); el(x - 4, y - 1, 4, 2, '#FF9A8A99', -.3); for (const d of [-4, 4]) { line([x + d, y - 3, x + d, y - 9], '#7A1A10', 1.6); el(x + d, y - 10, 2.8, 3, '#fff'); ctx.beginPath(); ctx.arc(x + d, y - 10, 2.8, 0, 7); ol(OL, 1.1); el(x + d + f, y - 10, 1.3, 1.6, '#1A1030') } ctx.beginPath(); ctx.arc(x, y + 4, 4, .3, PI - .3); ol('#7A1A10', 1.3) },
  puf: (e, x, y, t, f) => { const big = e.hp < 2, r = big ? 13 : 9.5, sw = Math.sin(t * .2 + e.ph); el(x, y + 12, r * .8, 2.6, '#00000030'); ctx.fillStyle = big ? '#FFB04A' : '#FFD84A'; ctx.beginPath(); const n = 14; for (let k = 0; k < n * 2; k++) { const a = k * PI / n, q = k % 2 ? r : r + (big ? 5 : 2); ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) } ctx.closePath(); ctx.fill(); ol('#8A5A00', 1.6); el(x, y, r, r, big ? '#FFB04A' : '#FFD84A'); el(x, y + r * .35, r * .75, r * .5, '#FFF6D0'); poly([x - f * r, y, x - f * (r + 6), y - 4 + sw, x - f * (r + 6), y + 4 + sw], '#F09A2A'); eyes(x + f * 2, y - 2, f, big, big ? 1 : .8); el(x + f * 3, y + 4, big ? 2.6 : 1.6, big ? 2.6 : 1.6, '#C83A4A') },
  jel: (e, x, y, t, f) => { const p = Math.sin(t * .12 + e.ph); glow(x, y, 20, '#B8E0FF44'); for (let k = 0; k < 4; k++) { const x0 = x - 7.5 + k * 5; ctx.strokeStyle = k % 2 ? '#FFB0E8cc' : '#B0D8FFcc'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y + 2); ctx.bezierCurveTo(x0 + Math.sin(t * .1 + k) * 4, y + 7, x0 - Math.sin(t * .1 + k) * 4, y + 10, x0, y + 13 + p); ctx.stroke() } ctx.fillStyle = '#C8E8FFdd'; ctx.beginPath(); ctx.ellipse(x, y + 2, 12 + p, 12 - p, 0, PI, 0); ctx.quadraticCurveTo(x + 7, y + 6, x + 4, y + 3); ctx.quadraticCurveTo(x, y + 6, x - 4, y + 3); ctx.quadraticCurveTo(x - 7, y + 6, x - 12 - p, y + 2); ctx.fill(); ol('#4A7AC8', 1.8); el(x - 5, y - 6, 3, 1.6, '#ffffffbb', -.5); el(x - 3.6 + f, y - 2, 1.7, 2.4, '#2A3A7A'); el(x + 3.6 + f, y - 2, 1.7, 2.4, '#2A3A7A'); el(x - 7, y, 1.8, 1, '#FF9AC8aa'); el(x + 7, y, 1.8, 1, '#FF9AC8aa') },
  shr: (e, x, y, t, f, sp) => { const cap = sp ? '#3ED8C8' : '#E8483E', co = sp ? '#1A6A7A' : '#8A1A14', bo = e.fr ? -1 : 0; el(x, y + 12, 9, 2.6, '#00000030'); for (const d of [-4, 4]) el(x + d, y + 11 - (d > 0 === !!e.fr ? 1.5 : 0), 3.4, 2.4, '#C8A888'); rr(x - 6.5, y - 1 + bo, 13, 12, 5, '#FFF0DC'); ol('#8A6A4A', 1.8); ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, y + bo, 13.5, 11.5, 0, PI, 0); ctx.quadraticCurveTo(x, y + 4 + bo, x - 13.5, y + bo); ctx.fill(); ol(co, 2); for (const [dx, dy, r] of [[-7, -5, 2.6], [1, -8, 3], [8, -4, 2.2]]) el(x + dx, y + dy + bo, r, r * .8, '#fff'); eyes(x, y + 5 + bo, f, false, .7) },
  spo: (e, x, y, t, f) => { ctx.save(); ctx.translate(x, y + 3); ctx.scale(.68, .68); MON.shr(e, 0, 0, t, f, true); ctx.restore() },
  bat: (e, x, y, t, f) => { const fl = Math.sin(t * .4 + e.ph) * 7; el(x, y + 13, 7, 2, '#00000030'); for (const d of [-1, 1]) { ctx.fillStyle = '#5A32A8'; ctx.beginPath(); ctx.moveTo(x + d * 4, y - 2); ctx.lineTo(x + d * 15, y - 9 - fl); ctx.lineTo(x + d * 17, y + 1 - fl * .4); ctx.lineTo(x + d * 13, y - 1 - fl * .3); ctx.lineTo(x + d * 11, y + 5); ctx.lineTo(x + d * 8, y + 2); ctx.lineTo(x + d * 5, y + 6); ctx.closePath(); ctx.fill(); ol(OL, 1.6) } for (const d of [-1, 1]) poly([x + d * 3, y - 7, x + d * 7, y - 14, x + d * 8, y - 5], '#7A4AC8'); el(x, y, 8, 9, '#7A4AC8'); ctx.beginPath(); ctx.ellipse(x, y, 8, 9, 0, 0, 7); ol(OL, 2); el(x - 3 + f, y - 2, 2.2, 2.6, '#FFE24A'); el(x + 3 + f, y - 2, 2.2, 2.6, '#FFE24A'); el(x - 3 + f * 1.5, y - 2, .9, 1.4, OL); el(x + 3 + f * 1.5, y - 2, .9, 1.4, OL); poly([x - 3, y + 3, x - 1.5, y + 6.5, x, y + 3, x + 1.5, y + 6.5, x + 3, y + 3], '#fff') },
  ufo: (e, x, y, t, f) => { const ti = Math.sin(t * .08 + e.ph) * .1, soon = e.tt < 50 && (t >> 2) & 1; ctx.save(); ctx.translate(x, y - 2 + Math.sin(t * .1 + e.ph) * 1.5); ctx.rotate(ti); poly([-5, 4, 5, 4, 10, 15, -10, 15], soon ? '#FFE24A55' : '#7AF0C833'); ctx.fillStyle = '#8AE0FF99'; ctx.beginPath(); ctx.arc(0, -2, 8, PI, 0); ctx.closePath(); ctx.fill(); ol(OL, 1.6); el(0, -4, 3.4, 3, '#7AE86A'); el(.8, -4.4, 1.2, 1.4, '#1A1030'); el(0, 1.5, 14, 5, soon ? '#FFE8A0' : '#B8BED8'); ctx.beginPath(); ctx.ellipse(0, 1.5, 14, 5, 0, 0, 7); ol(OL, 2); el(0, 0, 9.5, 2.2, '#E0E4F4'); for (let k = -2; k <= 2; k++) el(k * 5, 3, 1.4, 1.4, ['#FF5A8A', '#FFE24A', '#5AE08A', '#5AB0FF'][(k + 2 + (t >> 3)) % 4]); ctx.restore() },
  bot: (e, x, y, t, f) => { const hot = e.bt < 40, lg = e.fr ? 1.5 : -1.5; el(x, y + 12, 9, 2.6, '#00000030'); for (const d of [-4.5, 4.5]) { rr(x + d - 3, y + 8 + (d > 0 ? lg : -lg) * .5, 6, 4.5, 1.5, '#4A5478'); ol(OL, 1.3) } rr(x - 7, y + 1, 14, 9, 3, '#6A7AA8'); ol(OL, 1.8); el(x, y + 5.5, 2.2, 2.2, hot ? '#FF4A4A' : '#FFE24A'); for (const d of [-1, 1]) { rr(x + d * 9.5 - 2, y + 2, 4, 7, 2, '#4A5478'); ol(OL, 1.2) } rr(x - 9.5, y - 13, 19, 14, 4.5, '#8A9AC8'); ol(OL, 2); rr(x - 7 + f, y - 10, 14, 7.5, 2.5, '#12102A'); ctx.shadowColor = hot ? '#FF4A6A' : '#5AF0FF'; ctx.shadowBlur = 6; for (const d of [-3.2, 3.2]) rr(x + d - 1.6 + f, y - 8.5, 3.2, hot ? 2 : 4.2, 1, hot ? '#FF4A6A' : '#5AF0FF'); ctx.shadowBlur = 0; line([x, y - 13, x, y - 17], OL, 1.6); el(x, y - 18, 2.2, 2.2, hot && (t >> 2) & 1 ? '#fff' : '#FF5A8A'); if (hot && (t >> 2) & 1) emo('💣', x, y - 26, 12) },
  ali: (e, x, y, t, f) => { const lg = e.fr ? 2 : -2; el(x, y + 12, 8, 2.4, '#00000030'); for (const d of [-3.5, 3.5]) line([x + d, y + 6, x + d + (d > 0 ? lg : -lg), y + 11], '#3A9A3A', 2.4); el(x, y + 6, 6, 4.5, '#5AC84A'); ctx.beginPath(); ctx.ellipse(x, y + 6, 6, 4.5, 0, 0, 7); ol('#1A5A1A', 1.6); for (const d of [-1, 1]) { line([x + d * 5, y - 11, x + d * 9, y - 17], '#1A5A1A', 1.5); el(x + d * 9, y - 18, 2, 2, '#FFE24A') } el(x, y - 4, 11.5, 10, '#7AE86A'); ctx.beginPath(); ctx.ellipse(x, y - 4, 11.5, 10, 0, 0, 7); ol('#1A5A1A', 2); el(x - 5, y - 9, 3, 1.5, '#ffffff88', -.5); for (const [dx, dy, r] of [[-5.5, -4, 2.8], [5.5, -4, 2.8], [0, -8, 2.4]]) { el(x + dx, y + dy, r, r * 1.15, '#fff'); el(x + dx + f * .9, y + dy + .4, r * .5, r * .6, '#1A1030') } ctx.beginPath(); ctx.arc(x, y + .5, 3.4, .2, PI - .2); ol('#1A5A1A', 1.3) },
  pum: (e, x, y, t, f) => { el(x, y + 12, 10, 2.6, '#00000030'); glow(x, y, 20, '#FFB04044'); rr(x - 2, y - 14, 4, 6, 1.5, '#4EA84A'); ol('#1A5A1A', 1.2); el(x, y + 1, 12.5, 10.5, '#FF8A1A'); for (const d of [-6, 0, 6]) { ctx.beginPath(); ctx.ellipse(x + d, y + 1, 4.5, 10, 0, 0, 7); ol('#D8660A', 1.1) } ctx.beginPath(); ctx.ellipse(x, y + 1, 12.5, 10.5, 0, 0, 7); ol('#7A3400', 2); ctx.shadowColor = '#FFE24A'; ctx.shadowBlur = 8; for (const d of [-4.5, 4.5]) poly([x + d - 3 + f, y - 1, x + d + f, y - 6, x + d + 3 + f, y - 1], '#FFE24A'); poly([x - 7, y + 3, x - 4, y + 6, x - 2, y + 3.5, x, y + 6.5, x + 2, y + 3.5, x + 4, y + 6, x + 7, y + 3, x + 4, y + 8.5, x - 4, y + 8.5], '#FFE24A'); ctx.shadowBlur = 0 },
  kni: (e, x, y, t, f) => { const lg = e.fr ? 1.5 : -1.5; el(x, y + 12, 9, 2.6, '#00000030'); for (const d of [-4, 4]) { rr(x + d - 3, y + 8 + (d > 0 ? lg : -lg) * .5, 6, 4.5, 1.5, '#4A5270'); ol(OL, 1.3) } rr(x - 7, y + 2, 14, 8.5, 3, '#6A7490'); ol(OL, 1.8); poly([x - 2, y - 13, x + f * -6, y - 20, x + 3, y - 13], '#E8304A'); ol('#8A1028', 1.2); rr(x - 9.5, y - 13, 19, 16, 7, '#9AA4C0'); ol(OL, 2); rr(x - 7.5, y - 12, 5, 13, 2.5, '#C0C8DE'); rr(x - 7 + f, y - 7, 14, 4.2, 1.6, '#12102A'); ctx.shadowColor = '#FF4A4A'; ctx.shadowBlur = 6; for (const d of [-3, 3]) el(x + d + f * 1.4, y - 5, 1.5, 1.5, '#FF5A4A'); ctx.shadowBlur = 0; line([x, y - 3, x, y + 2], '#5A6480', 1.2); if (e.hp > 1) { const sx = x + f * 9; poly([sx - 5.5, y - 3, sx + 5.5, y - 3, sx + 5.5, y + 5, sx, y + 10, sx - 5.5, y + 5], '#3A7AE0'); ol(OL, 1.6); line([sx, y - 1, sx, y + 7], '#FFD23F', 1.8); line([sx - 3.5, y + 2, sx + 3.5, y + 2], '#FFD23F', 1.8) } },
  king: (e, x, y, t, f) => { const rage = e.hp <= (e.mhp || 8) / 2, br = Math.sin(t * .1) * .8; ctx.save(); ctx.translate(x, y - 4); ctx.scale(1.75, 1.75); el(0, 13.5, 11, 2.6, '#00000040'); if (rage) glow(0, 0, 24, '#FF2A4A55'); ctx.fillStyle = '#B8203A'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-17, 6 + br, -14, 13); for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(-11 + k * 7, 9 + Math.sin(t * .15 + k) * 1.2, -7.5 + k * 7, 13); ctx.quadraticCurveTo(17, 6 + br, 9, -4); ctx.closePath(); ctx.fill(); ol(OL, 1.2); for (const d of [-5, 5]) { el(d, 12, 4, 2.6, '#FFD23F'); ctx.beginPath(); ctx.ellipse(d, 12, 4, 2.6, 0, 0, 7); ol(OL, 1) } el(0, 2 + br * .3, 11.5, 11.5, '#1E1A30'); ctx.beginPath(); ctx.arc(0, 2 + br * .3, 11.5, 0, 7); ol(OL, 1.4); el(-4.5, -3, 3.4, 2, '#ffffff66', -.6); for (const d of [-1, 1]) { el(d * 12.5, 4 + Math.sin(t * .2 + d) * 1.2, 3.2, 3.2, '#fff'); ctx.beginPath(); ctx.arc(d * 12.5, 4 + Math.sin(t * .2 + d) * 1.2, 3.2, 0, 7); ol(OL, 1) } poly([-8, -8, -9.5, -15.5, -4.5, -11, 0, -17.5, 4.5, -11, 9.5, -15.5, 8, -8], '#FFD23F'); ol('#8A5A00', 1); for (const [gx, gy, c] of [[-9.5, -15.5, '#5AE0FF'], [0, -17.5, '#FF4A6A'], [9.5, -15.5, '#5AE08A']]) el(gx, gy, 1.5, 1.5, c); ctx.shadowColor = rage ? '#FF2A2A' : '#FFE24A'; ctx.shadowBlur = 6; for (const d of [-4.2, 4.2]) poly([d - 3 + f, 0, d + 3 + f, -1.6 * Math.sign(d) * -1 - 1, d + 2.6 + f, 3.4, d - 2.6 + f, 3.4], rage ? '#FF3A3A' : '#FFE24A'); ctx.shadowBlur = 0; line([-7 + f, -3.6, -1.5 + f, -1.4], OL, 1.2); line([7 + f, -3.6, 1.5 + f, -1.4], OL, 1.2); poly([-5, 6.5, -3, 8.6, -1, 6.5, 1, 8.6, 3, 6.5, 5, 6.5, 3, 10, -3, 10], '#fff'); if (e.bt < 50 && (t >> 2) & 1) emo('💣', 0, -24, 9); ctx.restore() }
};
function bombDraw(b) {
  const s = 1 + Math.sin(S.tick * .35) * .08, x = b.x, y = b.y + 1, fl = (S.tick >> 2) & 1;
  if (b.rk && b.slide != null) {   // 🚀 bom tên lửa đang bay
    ctx.save(); ctx.translate(x, y); ctx.rotate([-PI / 2, 0, PI / 2, PI][b.slide]);
    poly([-12, -4, -19 - fl * 4, 0, -12, 4], '#FFE24A'); poly([-12, -2.4, -16 - fl * 2, 0, -12, 2.4], '#FF7A1A');
    poly([-10, -5, -14, -10, -4, -5], '#3A7AE0'); poly([-10, 5, -14, 10, -4, 5], '#3A7AE0'); rr(-11, -6, 19, 12, 5, '#F0F2FA'); ol(OL, 1.8); ctx.fillStyle = '#F04A5A'; ctx.beginPath(); ctx.moveTo(6, -6); ctx.quadraticCurveTo(15, -4, 16, 0); ctx.quadraticCurveTo(15, 4, 6, 6); ctx.closePath(); ctx.fill(); ol(OL, 1.8); el(0, 0, 3, 3, '#8AE0FF'); ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ol(OL, 1.2);
    ctx.restore(); return;
  }
  const r = (b.mega ? 12.5 : 10.5) * s, body = b.en ? '#5A1A4A' : b.mega ? '#8A1A2A' : '#22223A';
  el(x, y + r * .95, r * .8, 3, '#00000033'); if (b.mega) glow(x, y, r + 9, '#FF5A3A66');
  el(x, y, r, r, body); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ol(OL, 2); el(x - r * .38, y - r * .42, r * .32, r * .2, '#ffffff88', -.6);
  if (b.mega) { ctx.fillStyle = '#FFE24A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * PI / 5 - PI / 2, q = k % 2 ? 2.2 : 5; ctx.lineTo(x + Math.cos(a) * q, y + 2 + Math.sin(a) * q) } ctx.fill() }
  else { el(x - 3, y + 1, 1.5, 2.2, b.en ? '#FF8FB8' : '#fff'); el(x + 3, y + 1, 1.5, 2.2, b.en ? '#FF8FB8' : '#fff') }
  rr(x - 2.5, y - r - 2.5, 5, 4, 1.2, '#8A90A8'); ol(OL, 1.2); line([x, y - r - 2.5, x + 3, y - r - 6, x + 6, y - r - 5], '#C8A06A', 1.8);
  glow(x + 6, y - r - 5, 6, fl ? '#FFE08Acc' : '#FF7A1Acc'); el(x + 6, y - r - 5, 1.8, 1.8, fl ? '#fff' : '#FFE08A');
  if (pl.remote && !b.en) el(x + r * .7, y - r * .5, 2.2, 2.2, fl ? '#FF3A3A' : '#FFE08A');
}
const EMO = { bomb: '💣', fire: '🔥', full: '🔥', speed: '👟', remote: '📡', kick: '🦵', wall: '👻', flame: '🧯', vest: '⭐', apple: '🍎', berry: '🍓', banana: '🍌', laser: '⚡', rocket: '🚀', mega: '💥', ice: '🧊', shield: '🛡️' };
const NEWW = { laser: 1, rocket: 1, mega: 1, ice: 1, shield: 1 };
let BGP = [];
function backdrop(T) {
  const g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  while (BGP.length < 46) BGP.push({ x: Math.random(), y: Math.random(), s: .5 + Math.random(), a: Math.random() * 6 });
  for (const p of BGP) {
    const k = T.fx; p.a += .03;
    if (k === 'bubble' || k === 'ember' || k === 'firefly') { p.y -= (k === 'firefly' ? .0004 : .0016) * p.s; if (p.y < -.03) { p.y = 1.03; p.x = Math.random() } p.x += Math.sin(p.a) * .0006 } else if (k === 'sprinkle') { p.y += .0012 * p.s; if (p.y > 1.03) { p.y = -.03; p.x = Math.random() } }
    const x = p.x * cw, y = p.y * ch;
    if (k === 'bubble') { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 3 + p.s * 4, 0, 7); ctx.stroke(); el(x - 1.5, y - 1.5, 1, 1, '#fff') }
    else if (k === 'star') { ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(p.a)); el(x, y, p.s * 1.5, p.s * 1.5, '#fff'); ctx.globalAlpha = 1 }
    else if (k === 'firefly') { glow(x, y, 8 * p.s, '#E6FF8C88'); el(x, y, 1.5, 1.5, '#F6FFB0') }
    else if (k === 'ember') { el(x, y, 1.8 * p.s, 1.8 * p.s, (p.a | 0) % 2 ? '#FFB040' : '#FF6A1A') }
    else { ctx.save(); ctx.translate(x, y); ctx.rotate(p.a); rr(-4 * p.s, -1.3, 8 * p.s, 2.6, 1.3, ['#FF6AA8', '#FFE24A', '#6AC8FF', '#7AE07A', '#fff'][(p.s * 100 | 0) % 5]); ctx.restore() }
  }
}
function draw() {
  const st = STAGES[S.level], T = THEMES[st.th], TL = tiles(st.th), t = S.tick;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true; backdrop(T);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, Math.round(ox * dpr), Math.round(oy * dpr));
  // thanh trên
  rr(-6, -HB - 6, FW + 12, HB + 2, 10, mix(T.bar, '#000000', .4)); rr(-6, -HB - 6, FW + 12, HB - 4, 10, T.bar); rr(0, -HB - 3, FW, 8, 4, '#ffffff33');
  hero2(22, -HB + 30, 2, 0, S.color, .78); ctx.font = '800 13px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('❤️×' + S.lives, 112, -HB + 21);
  ctx.font = pixFont(13); ctx.fillStyle = '#1A1A1A'; ctx.fillText(String(score).padStart(3, '0'), 48, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText(String(score).padStart(3, '0'), 46, -HB + 21);
  rr(FW / 2 - 72, -HB + 5, 144, 31, 8, '#1A1030'); ctx.fillStyle = '#FFFFFF'; ctx.font = pixFont(11); ctx.textAlign = 'center'; ctx.fillText(st.bonus ? 'BONUS ' + Math.ceil(bonusT / 60) : st.boss ? 'BOSS ' + st.n : 'STAGE ' + st.n, FW / 2, -HB + 22);
  const left = enemies.filter(e => !e.dead).length; ctx.save(); ctx.translate(FW - 156, -HB + 21); ctx.scale(.72, .72); MON.gum({ ph: 0, fr: 0 }, 0, 0, t, 1); ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.font = pixFont(12); ctx.fillText('×' + left, FW - 142, -HB + 22);
  emo('💣', FW - 100, -HB + 21, 17); ctx.font = pixFont(12); ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText('×' + pl.bombs, FW - 86, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText('×' + pl.bombs, FW - 88, -HB + 21);
  emo('🔥', FW - 46, -HB + 21, 17); ctx.font = pixFont(12); ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText('×' + pl.fire, FW - 32, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText('×' + pl.fire, FW - 34, -HB + 21);
  // sân
  rr(-5, -5, FW + 10, FH + 10, 8, '#1A1030');
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) {
    const v = at(c, r), x = c * U, y = r * U;
    if (v === 1) continue;
    ctx.drawImage((c + r) % 2 ? TL.f1 : TL.f0, x, y, U, U);
    if (at(c, r - 1) === 1 || at(c, r - 1) === 2) ctx.drawImage(TL.shade, x, y, U, U);
  }
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) if (at(c, r) === 1) { ctx.fillStyle = T.floor[0]; ctx.fillRect(c * U, r * U, U, U); ctx.drawImage(TL.hard, c * U, r * U, U, U) }
  if (door && door.show) {   // cổng dịch chuyển: mở ra khi hết quái
    const open = !enemies.some(e => !e.dead), x = door.c * U + U / 2, y = door.r * U + U / 2;
    rr(x - 12, y - 14, 24, 29, 11, '#3A2A5A'); ol('#1A1030', 2); rr(x - 9, y - 11, 18, 26, 8.5, open ? '#2A1A6A' : '#120A24');
    if (open) { glow(x, y, 20, '#B57BFFaa'); for (let k = 0; k < 3; k++) { ctx.strokeStyle = ['#FFE24A', '#5AE0FF', '#FF8AC0'][k]; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y + 2, 2.5 + k * 2.6, t * .12 + k * 2, t * .12 + k * 2 + 4); ctx.stroke() } } else { el(x + 4, y + 3, 1.6, 1.6, '#FFD23F'); line([x, y - 9, x, y + 13], '#3A2A5A', 1.2) }
  }
  for (const it of items) if (it.show && !it.got) {
    const x = it.c * U, y = it.r * U, fr = FRUIT[it.k], bob = Math.sin(t * .12 + it.c) * 1.5;
    if (fr) { el(x + U / 2, y + U - 5, 8, 2.4, '#00000033'); emo(EMO[it.k], x + U / 2, y + U / 2 + bob, 20); continue }
    const nw = NEWW[it.k], c1 = nw ? '#3AD8FF' : it.k === 'bomb' || it.k === 'fire' || it.k === 'full' ? '#FF9A2A' : '#B07AFF';
    if (nw) glow(x + U / 2, y + U / 2, 22, '#5AF0FF88'); rr(x + 2, y + 2, U - 4, U - 4, 7, (t >> 3) & 1 ? c1 : mix(c1, '#ffffff', .35)); ol(OL, 1.6); rr(x + 5, y + 5, U - 10, U - 10, 5, '#FFFFFF');
    emo(EMO[it.k], x + U / 2, y + U / 2 + 1, 17);
    if (it.k === 'full') { ctx.font = pixFont(6); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E52521'; ctx.fillText('MAX', x + U / 2, y + U - 10) }
  }
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) if (at(c, r) === 2) ctx.drawImage(TL.soft, c * U, r * U, U, U);
  for (const e of fx) {
    if (e.k === 'brk') { const k = e.t / 22, x = e.c * U, y = e.r * U; ctx.globalAlpha = 1 - k; ctx.drawImage(TL.soft, x + k * 5, y + k * 5, U - k * 10, U - k * 10); ctx.globalAlpha = 1; for (let q = 0; q < 4; q++) el(x + U / 2 + Math.cos(q * 1.6 + e.t * .3) * (6 + e.t * .5), y + U / 2 + Math.sin(q * 1.6 + e.t * .3) * (6 + e.t * .5), 2.2, 2.2, '#FFE08A') }
    else if (e.k === 'tp') { const k = e.t / e.life; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#7AF0C8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y, 4 + k * 18, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 }
    else if (e.k === 'ice') { const k = e.t / e.life; ctx.globalAlpha = (1 - k) * .5; ctx.fillStyle = '#BFE8FF'; ctx.fillRect(0, 0, FW, FH); ctx.globalAlpha = 1 }
  }
  for (const b of bombs) bombDraw(b);
  for (const f of flames) flameDraw(f);
  for (const e of enemies) {
    const f = e.d === 3 ? -1 : 1, fn = MON[e.k], y = e.y - (e.T.boss ? 0 : 2);
    if (e.born) { if ((t >> 2) & 1) { ctx.globalAlpha = .6; fn(e, e.x, y, t, f); ctx.globalAlpha = 1 } continue }
    if (e.dead) { ctx.globalAlpha = Math.max(0, 1 - e.dead / 40); ctx.save(); ctx.translate(e.x, y + e.dead * .3); ctx.rotate(e.dead * .08); ctx.scale(1 - e.dead / 60, 1 - e.dead / 60); fn(e, 0, 0, t, f); ctx.restore(); ctx.globalAlpha = 1; label('+' + e.T.pts, e.x, e.y - 18 - e.dead * .5, 11, '#FFE08A'); continue }
    if (e.hurtT && (e.hurtT >> 2) & 1) continue;
    const hid = e.T.cloak && (t + e.ph * 50 | 0) % 300 > 170;   // bí ngô tàng hình
    ctx.globalAlpha = hid ? .13 : e.T.wall ? .88 : 1; fn(e, e.x, y, t, f); ctx.globalAlpha = 1;
    if (e.frz) { el(e.x, y, 15, 15, '#BFE8FF99'); ctx.beginPath(); ctx.arc(e.x, y, 15, 0, 7); ol('#FFFFFF', 1.6); line([e.x - 8, y - 6, e.x - 3, y - 10], '#fff', 1.6); emo('❄️', e.x + 9, y - 12, 10) }
    if (e.T.boss) { const w = 54, hx = e.x - w / 2, hy = e.y - 44; rr(hx - 2, hy - 2, w + 4, 9, 4, '#1A1030'); rr(hx, hy, w * e.hp / (e.mhp || e.T.hp), 5, 2.5, e.hp <= (e.mhp || 8) / 2 ? '#FF3A3A' : '#FFB020'); emo('👑', hx - 8, hy + 2, 10) }
  }
  // em
  if (!(pl.inv && (t >> 2) & 1)) {
    const wf = pl.moving && (Math.floor(pl.walk) & 1), col = pl.vest && (t >> 2) & 1 ? ['#FF4D4D', '#FFD23F', '#3FD29A', '#5AB0FF', '#C77DFF'][(t >> 2) % 5] : S.color;
    hero2(pl.x, pl.y - 2, pl.d, wf, col);
    if (pl.shd) { ctx.strokeStyle = '#5AE0FF'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(pl.x, pl.y - 6, 21, 0, 7); ctx.stroke(); el(pl.x, pl.y - 6, 21, 21, '#8AE0FF2a'); el(pl.x - 9, pl.y - 18, 4, 2, '#ffffffaa', -.6) }
    if (pl.flame) { ctx.strokeStyle = (t >> 3) & 1 ? '#FF7A1A' : '#FFE08A'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(pl.x, pl.y - 6, 19, 0, 7); ctx.stroke(); ctx.setLineDash([]) }
    if (frozen()) { rr(pl.x - 16, pl.y - 34, 32, 46, 8, '#BFE8FF88') }
    if (S.now() < S.sh) { ctx.strokeStyle = '#7FD6FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pl.x, pl.y - 4, 24, 0, 7); ctx.stroke() }
  }
  for (const p of parts) el(p.x, p.y, 2, 2, p.c);
  for (const p of pops) { p.t--; ctx.globalAlpha = Math.min(1, p.t / 15); label('+5⚡ ngon!', p.x, p.y - (40 - p.t) * .6, 11, '#FFE08A'); ctx.globalAlpha = 1 } pops = pops.filter(p => p.t > 0);
  if (S.name) label(S.name, pl.x, pl.y - 38, 11, '#fff');
  // vũ khí đang có: hiện ở hàng tường dưới cùng
  { const L = []; if (pl.rocket) L.push('🚀×' + pl.rocket); if (pl.laser) L.push('⚡×' + pl.laser + ' (X)'); if (pl.mega) L.push('💥×' + pl.mega); if (pl.shd) L.push('🛡️'); if (pl.remote) L.push('📡 (X)'); if (pl.kick) L.push('🦵'); if (pl.wall) L.push('👻');
    let x = 6; ctx.font = '800 12px Nunito,sans-serif'; ctx.textBaseline = 'middle'; for (const s of L) { const w = ctx.measureText(s).width + 14; rr(x, FH - 27, w, 22, 11, '#1A1030dd'); ctx.strokeStyle = '#5AE0FF'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(s, x + 7, FH - 15.5); x += w + 5 } }
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x, y = pl.y - 52; rr(cx - 24, y - 16, 48, 20, 8, '#fff'); ol(OL, 1.6); ctx.font = pixFont(7); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E52521'; ctx.fillText('⚡0!', cx, y - 10) }
  if (door && door.show && !enemies.some(e => !e.dead) && !clearT && (t >> 4) & 1) label('🌀 Vào cổng!', door.c * U + U / 2, door.r * U - 6, 12, '#FFE08A');
  if (overT) { ctx.fillStyle = '#000000cc'; ctx.fillRect(0, FH / 2 - 30, FW, 60); ctx.font = pixFont(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FF7EB6'; ctx.fillText('GAME OVER', FW / 2, FH / 2 - 6); label('Hết 5 mạng — chơi lại màn này', FW / 2, FH / 2 + 20, 13, '#FFE08A') }
  if (clearT) { ctx.fillStyle = '#000000aa'; ctx.fillRect(0, FH / 2 - 30, FW, 60); ctx.font = pixFont(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#86E8B9'; ctx.fillText(S.level >= NS - 1 ? 'ALL CLEAR!' : 'STAGE CLEAR!', FW / 2, FH / 2 - 6); label(S.level >= NS - 1 ? (PART === 3 ? 'Hạ Vua Bom — phá đảo P3!' : 'Hạ Hoàng Tử Bom — phá đảo P2!') : 'Chuẩn bị màn tiếp theo…', FW / 2, FH / 2 + 20, 13, '#FFE08A') }
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.fillStyle = '#000000bb'; ctx.fillRect(0, FH * .38 - 30, FW, 70); ctx.font = pixFont(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(banner.w, FW / 2, FH * .38 - 6); label(banner.text, FW / 2, FH * .38 + 28, 15, '#FFE08A'); ctx.globalAlpha = 1 }
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), port = cw / ch < 1.02, room = touch && port ? 190 : 66;
  sc = Math.min(cw / (FW + 20), (ch - room - 8) / (FH + HB + 14)); ox = (cw - FW * sc) / 2; oy = port ? 10 + HB * sc : (ch - room - (FH + HB) * sc) / 2 + HB * sc;
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else { acc = 0; S.tick++; stepFx() }
  draw(); S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: mũi tên/WASD đi · Space/B đặt bom · X/R kích nổ (bom điều khiển) ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ' ': 'b', b: 'b', B: 'b', f: 'b', F: 'b', x: 'x', X: 'x', r: 'x', R: 'x', Shift: 'x' };
const press = k => { if (k === 'b' || k === 'x') { if (!keys[k]) keys[k + 'p'] = 1; keys[k] = 1; return } keys[k] = 1; keys.order = keys.order.filter(q => q !== k).concat(k) };
const unpress = k => { keys[k] = 0; if (k !== 'b' && k !== 'x') keys.order = keys.order.filter(q => q !== k) };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (!e.repeat || (k !== 'b' && k !== 'x')) press(k) }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) unpress(k) });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd'], ['bF', 'b'], ['bX', 'x']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } press(k); b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { unpress(k); b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  GC.music.files({ play: { synth: 'breeze' }, bonus: { src: 'snd/bomberman-bgm.mp3', a: .15, b: 10.8 } }, 'bomb');   // màn thường: nhạc êm 8-bit dài · màn thưởng: nhạc bonus gốc
  GC.sfxFiles({ bplace: { src: 'snd/bomberman-place.wav', a: .24, d: .25, vol: .55 }, bboom: { src: 'snd/bomberman-explode.wav', a: .18, d: 1.1, vol: .55 }, bdie: { src: 'snd/bomberman-death.mp3', a: .12, vol: .6 }, bitem: { src: 'snd/bomberman-item.mp3', vol: .5 } });
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = keys.b = keys.x = 0; keys.order = [] }
function place(x, y, old) {
  const si = old && old.lvl != null ? old.lvl : 0; S.stomps = old && old.sp || 0; score = old && old.sc || 0; S.lives = old && old.lf || LIVES;
  if (old && old.pb) { pl.bombs = old.pb; pl.fire = old.pf || 1; pl.speed = old.ps || 0 }
  if (si !== S.level) loadStage(si);
}
function measure() { return 1000 }
const stName = () => STAGES[S.level].bonus ? 'Màn thưởng' : 'Màn ' + STAGES[S.level].n + '/' + NREAL;
const label2 = () => S.won ? '🏆 Phá đảo' : stName() + ' · 👾 ' + enemies.filter(e => !e.dead).length + ' quái · 💣' + pl.bombs + ' 🔥' + pl.fire;
function extra() { return { lvl: S.level, wk: 'bomb', lb: label2(), sc: score, pb: pl.bombs, pf: pl.fire, ps: pl.speed, lf: S.lives } }
function hud() { return (S.won ? '🏆 Phá đảo' : '💣 ' + stName()) + ' · ⭐ ' + score }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: FW, kind: 'bomb', get part() { return PART }, get NL() { return NS }, get NREAL() { return NREAL }, setPart, _dbg: { step, draw, loadStage, grab, MON, ETYPES, pl2: pl, items: () => items, door: () => door, hurt, list: () => enemies, bombs: () => bombs, flames: () => flames },
  get winTitle() { return PART === 3 ? '👑 Hạ Vua Bom — phá đảo Bomberman P3!' : '👑 Hạ Hoàng Tử Bom — phá đảo Bomberman P2!' }, get winToast() { return PART === 3 ? '🏆 ALL CLEAR! Em đã hạ VUA BOM và phá đảo P3 — huyền thoại đặt bom là đây!' : '🏆 ALL CLEAR! Em đã hạ HOÀNG TỬ BOM và phá đảo P2 — sang P3 đấu VUA BOM nào!' } };
})();
