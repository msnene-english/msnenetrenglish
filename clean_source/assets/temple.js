/* temple.js — game "Temple Run" (kiểu chạy vô tận trong đền cổ, góc nhìn sau lưng 3D): 3 làn, ← → đổi làn, ↑ nhảy, ↓ trượt.
   2 phần × 5 màn — P1: Đền rừng xanh · Cầu đá trên mây · ⛏ Đường hầm mỏ (xe goòng) · Sa mạc kim tự tháp · Thác nước ngọc bích
                  P2: Đền băng · Đền hoa anh đào · 💎 Mỏ pha lê (xe goòng) · Hang dung nham · Đền vàng ban đêm (cuối màn là tượng vàng).
   Ngã rẽ kiểu Temple Run: đường cụt → bấm ← / → để rẽ (không rẽ là đâm tường).
   Chướng ngại: rễ cây (nhảy) · xà đá / vòi lửa (trượt) · tượng chắn làn (đổi làn) · hố vực (nhảy) · rắn (nhảy) · nhện / ma lồng đèn (đổi làn hoặc trượt) · dơi / chim (trượt)
   · bọ hung (nhảy / làn trống) · lưỡi rìu đung đưa (canh nhịp) · quái chạy tới: đá lăn, xác ướp, người tuyết, hồn lửa zig-zag, bộ xương vàng (đổi làn).
   Xu (50 xu = +1 mạng, tối đa 7 mạng) & vật phẩm (nam châm, khiên, tên lửa, kim cương ⚡).
   Vấp ngã = mất 1 mạng (khỉ quỷ đuổi theo) · 5 mạng, hết mạng chạy lại màn đang chơi. Chạy tốn ⚡ — trả lời đúng để chạy tiếp.
   Cùng giao diện với các game khác: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'temple' */
window.Temple = (function () {
const { clamp, rng } = GC;
const LIVES = 5, JUNC = 9, SEG = 200, ROADW = 850, CAMH = 1250, DRAW = 140, CAMD = 1 / Math.tan(50 * Math.PI / 180), PLZ = CAMD * CAMH / 1.06, RH = 470, HZ = .34, DEPTH = 1500;   // RH: chiều cao người chạy · HZ: đường chân trời (tỉ lệ màn hình) · DEPTH: mặt nước/vực dưới đường
const LANES = [-.62, 0, .62], WALLH = 260, LOGH = 200, BEAM = [330, 470], JV = 34, GRAV = 1.55;
const DEFS = {   // under: phía dưới đường · base: màu lớp dưới · mossP: rêu trên đá · kinds: chướng ngại/quái của màn · turns: số ngã rẽ · tunnel: đường hầm ngồi xe goòng
  jungle: { name: 'Đền rừng xanh', ic: '🌴', bg: 'jungle', under: 'water', sky: ['#4E9CB0', '#9ED2C8', '#CFEADF'], fog: '#B4DCCC', base: ['#9ED0C0', '#3E8E86', '#14585A', '#0C3E44'], stone: ['#CFAE74', '#B8935A', '#6E5634'], wall: ['#9C8458', '#C2A874'], mossP: .5, grass: true, props: ['tree', 'tree', 'ruin', 'palm', 'tree'], fogD: 3.2, kinds: ['log', 'log', 'arch', 'block', 'block', 'block2', 'gap', 'snake', 'spider', 'boulder'], turns: 1 },
  clouds: { name: 'Cầu đá trên mây', ic: '🌅', bg: 'clouds', under: 'clouds', sky: ['#C8506A', '#F28A5E', '#FFD7A0'], fog: '#FFD8B4', base: ['#FFE2C0', '#FFCFA8', '#F2B494', '#E09A84'], stone: ['#E2C89C', '#CCAE80', '#8E7450'], wall: ['#B49A74', '#D8BE94'], mossP: .25, props: ['pillar', 'isle', 'pillar', 'pillar'], fogD: 3, kinds: ['log', 'arch', 'block', 'block2', 'gap', 'gap', 'birds', 'birds', 'boulder'], turns: 2 },
  desert: { name: 'Sa mạc kim tự tháp', ic: '🏜', bg: 'desert', under: 'sand', sky: ['#4FA6E0', '#A8D8F0', '#F6E6C4'], fog: '#F0DDB4', base: ['#F2D9A2', '#E2BE7E', '#C89A5A', '#A87A40'], stone: ['#E8C88A', '#D4AE6A', '#8A6A3A'], wall: ['#C49A5A', '#E6C686'], mossP: 0, props: ['obelisk', 'palm', 'sphinx', 'obelisk', 'palm'], fogD: 3.4, kinds: ['log', 'arch', 'block', 'block2', 'gap', 'scarab', 'snake', 'mummy', 'mummy'], turns: 2, torch: 1 },
  cave: { name: 'Hang dung nham', ic: '🌋', bg: 'cave', under: 'lava', sky: ['#0E0406', '#2A0A08', '#5A160C'], fog: '#4A160C', base: ['#FF7A1A', '#E04A10', '#8A1E08', '#4A0E06'], stone: ['#6E5E58', '#5A4C46', '#2A201C'], wall: ['#54443E', '#74625A'], mossP: 0, props: ['spire', 'spire', 'torch'], fogD: 4, fire: 1, kinds: ['fire', 'fire', 'block', 'block2', 'gap', 'log', 'bats', 'spirit', 'spirit', 'boulder'], turns: 3 },
  falls: { name: 'Thác nước ngọc bích', ic: '🌊', bg: 'falls', under: 'river', sky: ['#3FA8C8', '#8ED8DA', '#D8F4EC'], fog: '#BDE8DE', base: ['#BFEFE8', '#5CC4C0', '#1E8C96', '#0E5A6A'], stone: ['#AEB89E', '#949E86', '#545E48'], wall: ['#7C8A6E', '#A4B090'], mossP: .7, grass: true, props: ['falls', 'tree', 'ruin', 'falls', 'palm'], fogD: 3.6, kinds: ['log', 'arch', 'block', 'block2', 'gap', 'gap', 'snake', 'spider', 'boulder'], turns: 3, croc: 1 },
  ice: { name: 'Đền băng', ic: '❄️', bg: 'ice', under: 'ice', sky: ['#5AA8E8', '#A8D8F8', '#EEF8FF'], fog: '#E4F2FF', base: ['#D8ECF8', '#7FB4DA', '#3E78A8', '#244E7A'], stone: ['#D4E6F4', '#B8D0E6', '#7E98B4'], wall: ['#A4BED8', '#D8EAF8'], mossP: 0, props: ['pine', 'crystal', 'berg', 'pine'], fogD: 4.5, kinds: ['log', 'arch', 'block', 'block2', 'gap', 'bats', 'yeti', 'yeti', 'boulder'], turns: 2 },
  sakura: { name: 'Đền hoa anh đào', ic: '🌸', bg: 'sakura', under: 'pond', sky: ['#C77AB8', '#F2A8C8', '#FFE4DC'], fog: '#FADCE6', base: ['#F8D0DC', '#C8A8C8', '#6E8AA8', '#3E5A7A'], stone: ['#DCD4CC', '#C6BCB2', '#7A7068'], wall: ['#C8323A', '#E8584E'], mossP: 0, props: ['sakura', 'pagoda', 'sakura', 'lantern', 'sakura'], fogD: 4, kinds: ['log', 'arch', 'block', 'block2', 'gap', 'blade', 'ghost', 'ghost', 'birds'], turns: 2, petals: 1 },
  gold: { name: 'Đền vàng ban đêm', ic: '👑', bg: 'gold', under: 'abyss', sky: ['#05061A', '#1A1640', '#3E2C66'], fog: '#2E2450', base: ['#4A3A6A', '#241A40', '#120C24', '#08060F'], stone: ['#E0BA66', '#C69E4C', '#6E5222'], wall: ['#A88236', '#DAB85E'], mossP: 0, props: ['pillarG', 'brazier', 'pillarG'], fogD: 5, fire: .5, kinds: ['fire', 'arch', 'block', 'block2', 'gap', 'blade', 'skeleton', 'skeleton', 'bats', 'snake', 'scarab', 'boulder'], turns: 3 },
  mine: { name: 'Đường hầm mỏ', ic: '⛏', bg: 'mine', under: 'tunnel', tunnel: 1, sky: ['#060302', '#120A06', '#1E120A'], fog: '#120A06', base: ['#1E120A', '#140C07', '#0C0704', '#060302'], stone: ['#8A6A46', '#74583A', '#3A2818'], wall: ['#4A3628', '#6A5240'], mossP: 0, props: [], fogD: 4.4, kinds: ['block', 'block', 'block2', 'arch', 'arch', 'gap', 'log', 'bats', 'boulder'], turns: 0 },
  crystal: { name: 'Mỏ pha lê', ic: '💎', bg: 'crystal', under: 'tunnel', tunnel: 1, sky: ['#04020A', '#0C0620', '#160E30'], fog: '#0E0820', base: ['#1A1030', '#100A22', '#0A0616', '#05030C'], stone: ['#7A6E8E', '#655A7A', '#2E2640'], wall: ['#3E3256', '#5E4E80'], mossP: 0, props: [], fogD: 4.4, kinds: ['block', 'block2', 'arch', 'arch', 'gap', 'log', 'bats', 'spider', 'boulder'], turns: 0 },
};
const PARTS = { 1: ['jungle', 'clouds', 'mine', 'desert', 'falls'], 2: ['ice', 'sakura', 'crystal', 'cave', 'gold'] };   // Temple Run P1 · P2 (màn 3 mỗi phần là đường hầm)
const PART_SP = { 1: [.72, .78, .84, .9, .96], 2: [.82, .88, .94, 1, 1.06] };   // tốc độ từng màn: tăng đều, không quá nhanh
const PART_GAP = { 1: [2.2, 2, 1.9, 1.75, 1.65], 2: [1.95, 1.8, 1.75, 1.6, 1.5] };   // tối thiểu bấy nhiêu GIÂY chạy giữa 2 chướng ngại → kịp né
let part = 1, STAGES = PARTS[1].map(k => DEFS[k]), NL = 5, STAGE_SP = PART_SP[1], GAPT = PART_GAP[1];
function setPart(p) { part = +p === 2 ? 2 : 1; STAGES = PARTS[part].map(k => DEFS[k]); NL = STAGES.length; STAGE_SP = PART_SP[part]; GAPT = PART_GAP[part]; for (const k in IMG) delete IMG[k] }
const WK = () => part === 2 ? 'tp2_' : 'temple';   // khoá bảng xếp hạng riêng cho mỗi phần
const MOVERS = { boulder: 9, mummy: 2.5, yeti: 7, spirit: 4, skeleton: 3.5 };   // quái chạy ngược về phía em (đoạn đường / giây)
const snakeX = o => Math.sin(S.tick * .045 + o.ph) * .62, bladeTh = o => Math.sin(S.tick * .05 + o.ph) * .62, bladeX = o => Math.sin(bladeTh(o)) * 1.35;
const LVS = {   // tốn ⚡ cân đối với các game khác: chạy liên tục, 1 câu đúng (100⚡) ≈ 10 · 8 · 6,5 giây
  1: { sp: .9, dens: 1.25, cost: { run: .167, gem: 10 } },
  2: { sp: 1, dens: 1, cost: { run: .208, gem: 10 } },
  3: { sp: 1.12, dens: .82, cost: { run: .256, gem: 10 } } };
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#3FBF86', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0, face: 1 };
const keys = { l: 0, r: 0, u: 0, d: 0, lp: 0, rp: 0, up: 0, dp: 0 };
let seed0 = 1, lvSel = 2, segs = [], movers = [], turnsL = [], seenK = {}, turnT = 0, turnDir = 0, petals = [], finishZ = 0, pos = 0, speed = 0, lane = 1, plX = 0, jy = 0, jv = 0, slideT = 0, inv = 0, shieldT = 0, magT = 0, boostT = 0, chaseT = 0;
let phase = 'count', phT = 0, fx = [], bg = null, bgX = 0, U = 300, banner = null, emptyT = 0, coinSfx = 0, score = 0, stageCoins = 0;
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, VW = 0, VH = 0, room = 0;

/* ═════ dựng đường đền ═════ */
const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
function addSeg(curve, y) { const n = segs.length; segs.push({ index: n, p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} }, curve, dark: Math.floor(n / 2) % 2, sprites: [], coins: [], ob: null, gap: false, clip: 0 }) }
const easeIn = (a, b, p) => a + (b - a) * p * p, easeInOut = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + .5);
function addRoad(enter, hold, leave, curve, y) {
  const sy = lastY(), ey = sy + y * SEG, tot = enter + hold + leave;
  for (let n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeInOut(sy, ey, n / tot));
  for (let n = 0; n < hold; n++) addSeg(curve, easeInOut(sy, ey, (enter + n) / tot));
  for (let n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, (enter + hold + n) / tot));
}
function buildStage(li) {
  const st = STAGES[li], r0 = rng(seed0 * 53 + li * 911 + lvSel * 23), R = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), sg = () => r0() < .5 ? -1 : 1;
  const v0 = 22 * LVC.sp * STAGE_SP[li];   // tốc độ màn này (đoạn đường / giây)
  segs = []; const target = Math.round(v0 * (st.tunnel ? 62 : 70) * (lvSel === 1 ? .9 : lvSel === 3 ? 1.08 : 1));
  addRoad(10, 50, 10, 0, 0);
  while (segs.length < target) { const k = r0(); if (k < .35) addRoad(RI(20, 40), RI(30, 60), RI(20, 40), 0, r0() < .4 ? R(-12, 12) : 0); else addRoad(RI(20, 35), RI(25, 55), RI(20, 35), R(1, 3.2 + li * .4) * sg(), r0() < .35 ? R(-14, 14) : 0) }
  addRoad(20, 30, 20, 0, -lastY() / SEG);
  finishZ = segs.length * SEG; addRoad(0, DRAW + 40, 0, 0, 0);
  const endI = Math.floor(finishZ / SEG);
  // ngã rẽ: đường thẳng quanh chỗ rẽ, không đặt chướng ngại gần đó
  movers = []; turnsL = []; const resv = new Uint8Array(segs.length + 1), nT = st.turns + (lvSel === 3 ? 1 : 0);
  for (let t = 0; t < nT; t++) {
    const c = Math.round(150 + (endI - 300) * (t + .5) / nT + R(-20, 20)), dir = part === 1 && li < 2 ? sg() : r0() < .35 ? 0 : sg();
    segs[c].turn = { dir, done: false }; turnsL.push(segs[c]);
    for (let i = c; i < c + JUNC; i++) segs[i].junc = dir === 0 ? 3 : dir < 0 ? 1 : 2;
    const bef = Math.ceil(v0 * 1.4), aft = Math.ceil(v0 * 1.6);   // chừa ~1,5 giây trống trước và sau ngã rẽ
    for (let i = Math.max(0, c - bef - 10); i < Math.min(segs.length, c + JUNC + aft + 6); i++) { segs[i].curve = 0; resv[i] = i >= c - bef && i < c + JUNC + aft ? 1 : 2 }
  }
  // cảnh hai bên
  const sideOK = (n, off) => { const j = segs[n].junc || (segs[n + 2] && segs[n + 2].junc) || (segs[n - 2] && segs[n - 2].junc) || 0; return !(j & (off < 0 ? 1 : 2)) };
  if (st.tunnel) for (let n = 3; n < segs.length; n += 6) segs[n].sprites.push({ k: 'frame', offset: 0 });   // khung gỗ chống hầm + đuốc / pha lê
  else {
    for (let n = 4; n < segs.length; n += 4) if (n % 12) for (const o of [-1.05, 1.05]) if (sideOK(n, o)) segs[n].sprites.push({ k: 'post', offset: o });
    for (let n = 12; n < segs.length; n += 12) { const k = st.fire || st.torch ? (st.bg === 'gold' ? 'brazier' : 'torch') : 'post'; for (const o of [-1.05, 1.05]) if (sideOK(n, o)) segs[n].sprites.push({ k, offset: o }) }
  }
  if (!st.tunnel) for (let n = 10; n < segs.length - 4; n += RI(3, 7)) { const k = st.props[Math.floor(r0() * st.props.length)]; if (k === 'torch' || k === 'brazier') continue; const off = sg() * (k === 'isle' ? R(4, 7) : k === 'tree' || k === 'berg' || k === 'sakura' || k === 'sphinx' ? R(1.35, 3) : R(1.3, 2.6)); if (resv[n] && !sideOK(n, off)) continue; let ok = true; for (let i = -12; i <= 12; i++) if (segs[n + i] && segs[n + i].junc && (segs[n + i].junc & (off < 0 ? 1 : 2))) ok = false; if (ok) segs[n].sprites.push({ k, offset: off }) }
  segs[endI].sprites.push({ k: 'gate', offset: 0 }); if (li === NL - 1) segs[endI + 8].sprites.push({ k: 'goldidol', offset: 0 });
  // chướng ngại + xu + vật phẩm
  let n = Math.round(v0 * 3.5); const gapS = Math.round(v0 * GAPT[li] * LVC.dens);   // khoảng cách tối thiểu (đoạn) giữa 2 chướng ngại
  while (n < endI - 30) {
    if (resv[n]) { n++; continue }
    const kinds = st.kinds.slice(); if (part === 2 && li >= 3) kinds.push('combo');
    let k = kinds[Math.floor(r0() * kinds.length)]; const s0 = segs[n];
    const mvAhead = MOVERS[k] ? Math.round(45 * MOVERS[k] / (v0 + MOVERS[k])) : 0;   // quái chạy tới: đặt xa hơn để gặp em đúng chỗ trống này
    if (MOVERS[k]) { let bad = false; for (let i = n; i <= n + mvAhead + 4; i++) if (resv[i]) bad = true; if (bad) k = 'block' }
    if (k === 'log') { s0.ob = { k: 'log' }; for (let i = -6; i <= 6; i++) if (segs[n + i]) segs[n + i].coins.push({ lane: RI(0, 2) === 3 ? 1 : 1, h: Math.max(0, 330 - i * i * 9), got: false }) }
    else if (k === 'arch') s0.ob = { k: st.fire && r0() < st.fire ? 'fire' : 'arch' };
    else if (k === 'block') { const L = RI(0, 2); s0.ob = { k: 'block', lanes: [L] }; const free = [0, 1, 2].filter(x => x !== L)[RI(0, 1)]; for (let i = -10; i < 0; i += 2) if (segs[n + i]) segs[n + i].coins.push({ lane: free, h: 0, got: false }) }
    else if (k === 'block2') { const free = RI(0, 2); s0.ob = { k: 'block', lanes: [0, 1, 2].filter(x => x !== free) }; for (let i = -12; i < 4; i += 2) if (segs[n + i]) segs[n + i].coins.push({ lane: free, h: 0, got: false }) }
    else if (k === 'gap') { const w = RI(3, 4 + Math.min(2, li >> 1)); let ok = true; for (let i = 0; i < w + 2; i++) if (resv[n + i]) ok = false; if (ok) { for (let i = 0; i < w; i++) if (segs[n + i]) segs[n + i].gap = true; s0.ob = { k: 'gap', len: w }; if (st.croc && segs[n + (w >> 1)]) segs[n + (w >> 1)].croc = r0() * 6; n += w } }
    else if (k === 'combo') { const L = RI(0, 2), n2 = n + Math.ceil(v0 * 1.35); s0.ob = { k: 'block', lanes: [L] }; if (segs[n2] && !resv[n2]) { segs[n2].ob = { k: 'log' }; n = n2 } }
    else if (k === 'fire') s0.ob = { k: 'fire' };
    else if (k === 'snake') { s0.ob = { k: 'snake', ph: R(0, 6) }; for (let i = -5; i <= 5; i++) if (segs[n + i]) segs[n + i].coins.push({ lane: RI(0, 2), h: Math.max(0, 300 - i * i * 11), got: false }) }
    else if (k === 'spider' || k === 'ghost') { const L = RI(0, 2); s0.ob = { k, lane: L, ph: R(0, 6) }; const free = (L + 1 + RI(0, 1)) % 3; for (let i = -10; i < 2; i += 2) if (segs[n + i]) segs[n + i].coins.push({ lane: free, h: 0, got: false }) }
    else if (k === 'bats' || k === 'birds') s0.ob = { k, ph: R(0, 6) };
    else if (k === 'scarab') { const free = RI(0, 2); s0.ob = { k: 'scarab', lanes: [0, 1, 2].filter(x => x !== free) }; for (let i = -10; i < 4; i += 2) if (segs[n + i]) segs[n + i].coins.push({ lane: free, h: 0, got: false }) }
    else if (k === 'blade') s0.ob = { k: 'blade', ph: R(0, 6) };
    else if (MOVERS[k]) movers.push({ k, z: (n + mvAhead) * SEG, lane: RI(0, 2), x: 0, ph: R(0, 6), act: false, done: false });
    // dãy xu giữa các chướng ngại
    if (r0() < .65) { const L = RI(0, 2), st2 = n + RI(6, 9); for (let i = 0; i < RI(6, 12); i += 1) if (segs[st2 + i * 2] && !segs[st2 + i * 2].ob && !resv[st2 + i * 2]) segs[st2 + i * 2].coins.push({ lane: L, h: 0, got: false }) }
    if (r0() < .16) { const L = RI(0, 2), sI = n + RI(8, 12); if (segs[sI] && !segs[sI].ob && !resv[sI]) segs[sI].item = { k: ['magnet', 'shield', 'boost', 'gem', 'gem'][RI(0, 4)], lane: L, got: false } }
    n += Math.round(gapS * R(1, 1.35));
  }
  bg = null;
}
const findSeg = z => segs[Math.min(segs.length - 1, Math.max(0, Math.floor(z / SEG)))];
function loadStage(li) {
  S.level = li; buildStage(li); pos = 0; speed = 0; lane = 1; plX = 0; jy = 0; jv = 0; slideT = 0; inv = 0; shieldT = 0; magT = 0; boostT = 0; chaseT = 0; fx = []; stageCoins = 0;
  turnT = 0; if (STAGES[li].tunnel) setTimeout(() => intro('mine'), 3400); phase = 'count'; phT = 200; banner = { t: 200, w: 'MÀN ' + (li + 1), text: STAGES[li].ic + ' ' + STAGES[li].name };
  GC.music.hush(false); GC.music.scene('play', true);
}
const prog = () => S.won ? 1 : clamp((S.level + clamp(pos / finishZ, 0, 1)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };
const baseSp = () => SEG * 22 * LVC.sp * STAGE_SP[S.level] * (1 + clamp(pos / finishZ, 0, 1) * .15);

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++; const dt = 1 / 60;
  for (const f of fx) { f.x += f.vx; f.y += f.vy; f.vy += f.g || 0; f.l-- } fx = fx.filter(f => f.l > 0);
  if (phase === 'count') { if (phT % 60 === 20 && phT > 30) GC.tone(phT > 80 ? 520 : 1040, .16, 'square', .05); if (--phT <= 0) phase = 'run'; return }
  if (phase === 'over') { if (--phT <= 0) { S.lives = LIVES; loadStage(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chạy lại Màn ' + (S.level + 1) + ' (không phải từ Màn 1) — có ' + LIVES + ' mạng mới, cố lên!') } return }
  if (phase === 'finish') { speed = Math.max(0, speed - SEG * 30 * dt); pos += speed * dt; if (--phT <= 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NL - 1) { S.won = true; phase = 'won'; S.hooks.onWin && S.hooks.onWin() } else loadStage(S.level + 1) } return }
  if (phase === 'won') return;
  if (phase === 'hit') { speed = Math.max(0, speed - SEG * 60 * dt); pos += speed * dt; chaseT = 200; if (--phT <= 0) afterHit(); return }
  if (inv) inv--; if (shieldT) shieldT--; if (magT) magT--; if (boostT) boostT--; if (chaseT) chaseT--;
  const can = S.energy > 0 && !frozen();
  const target = can ? baseSp() * (boostT ? 1.6 : 1) : 0;
  speed += (target - speed) * (can ? .04 : .06);
  if (can) use(COST.run * Math.max(.3, speed / baseSp()));
  if (turnT) turnT--;
  // ngã rẽ đang tới: trong khoảng rẽ thì ← → là RẼ, ngoài khoảng là đổi làn
  const tp = turnsL.find(t => !t.turn.done), zNow = pos + PLZ, inWin = tp && zNow > tp.index * SEG - SEG * 7 && zNow < (tp.index + JUNC - 1) * SEG;
  if (keys.lp) { keys.lp = 0; if (inWin && tp.turn.dir <= 0) doTurn(tp, -1); else if (lane > 0) { lane--; GC.sfx('tswish') } }
  if (keys.rp) { keys.rp = 0; if (inWin && tp.turn.dir >= 0) doTurn(tp, 1); else if (lane < 2) { lane++; GC.sfx('tswish') } }
  if (keys.up) { keys.up = 0; if (jy <= 0 && can) { jv = JV; slideT = 0; GC.sfx('tjump') } }
  if (keys.dp) { keys.dp = 0; if (jy > 0) jv = Math.min(jv, -24); slideT = 42; GC.sfx('twoosh') }
  plX += (LANES[lane] - plX) * .26;
  if (jy > 0 || jv > 0) { jy += jv; jv -= GRAV; if (jy <= 0) { jy = 0; jv = 0 } }
  if (slideT) slideT--;
  const z0 = pos + PLZ; pos += speed * dt; const z1 = pos + PLZ; bgX += findSeg(z1).curve * speed * dt / SEG * .0025;
  // chướng ngại trên đoạn vừa chạy qua
  for (let i = Math.floor(z0 / SEG); i <= Math.floor(z1 / SEG); i++) {
    const s = segs[i]; if (!s) continue;
    if (s.ob && !s.ob.done) {
      const o = s.ob, myLane = Math.round((plX + .62) / .62);
      let bad = false;
      if (o.k === 'log') bad = jy < LOGH * .8;
      else if (o.k === 'arch' || o.k === 'fire') bad = !slideT;
      else if (o.k === 'block') bad = o.lanes.includes(clamp(myLane, 0, 2)) && jy < 420;
      else if (o.k === 'snake') bad = Math.abs(plX - snakeX(o)) < .42 && jy < 170;
      else if (o.k === 'spider' || o.k === 'ghost') bad = clamp(myLane, 0, 2) === o.lane && !slideT;
      else if (o.k === 'bats' || o.k === 'birds') bad = !slideT;
      else if (o.k === 'scarab') bad = o.lanes.includes(clamp(myLane, 0, 2)) && jy < 150;
      else if (o.k === 'blade') bad = Math.abs(plX - bladeX(o)) < .34;
      if (bad && !boostT && !inv) { if (shieldT) { shieldT = 0; inv = 60; o.done = true; GC.sfx('bossHit'); for (let k = 0; k < 10; k++) puff('#7FD6FF') } else { o.done = true; return hit(o.k) } }
      if (o.k !== 'gap') o.done = true;
    }
    // xu & vật phẩm
    for (const c of s.coins) if (!c.got && (magT || (Math.abs(plX - LANES[c.lane]) < .3 && Math.abs(jy - c.h) < 260))) collectCoin(c);
    if (s.item && !s.item.got && Math.abs(plX - LANES[s.item.lane]) < .34 && jy < 380) grab(s.item);
  }
  if (magT) for (let i = Math.floor(z1 / SEG); i < Math.floor(z1 / SEG) + 8; i++) { const s = segs[i]; if (s) for (const c of s.coins) if (!c.got) collectCoin(c) }
  // đâm vào tường ở ngã rẽ (không rẽ kịp)
  if (tp && !tp.turn.done && z1 >= (tp.index + JUNC - 1) * SEG) { tp.turn.wall = 1; pos = (tp.index + JUNC - 1.4) * SEG - PLZ; return hit('turn') }
  // quái chạy tới (đá lăn, xác ướp, người tuyết, hồn lửa, bộ xương)
  const ntz = tp ? tp.index * SEG : 1e12;
  for (const m of movers) {
    if (m.done) continue;
    if (!m.act && m.z - z1 < SEG * 45 && (m.z < ntz || ntz < z1)) { m.act = true; intro(m.k) }
    if (!m.act) continue;
    m.z -= MOVERS[m.k] * SEG * dt; m.x = m.k === 'spirit' ? Math.sin(S.tick * .035 + m.ph) * .62 : LANES[m.lane];
    if (m.z <= z1) { m.done = true; if (Math.abs(plX - m.x) < .42 && !boostT && !inv) { if (shieldT) { shieldT = 0; inv = 60; GC.sfx('bossHit'); for (let k = 0; k < 10; k++) puff('#7FD6FF') } else return hit(m.k) } }
  }
  // lần đầu gặp loại quái / bẫy mới: nhắc cách vượt
  for (let i = Math.floor(z1 / SEG) + 18; i < Math.floor(z1 / SEG) + 26; i++) { const sg2 = segs[i]; if (!sg2) break; if (sg2.ob && sg2.ob.k !== 'log' && sg2.ob.k !== 'gap' && sg2.ob.k !== 'block' && sg2.ob.k !== 'arch') intro(sg2.ob.k); if (sg2.turn && !sg2.turn.done) intro('turn') }
  // rơi xuống hố
  const cur = findSeg(z1); if (cur.gap && jy <= 0 && !boostT) return hit('gap');
  if (z1 >= finishZ) { phase = 'finish'; phT = 170; GC.sfx('tscore'); GC.music.hush(true); setTimeout(() => GC.music.hush(false), 2600); for (let k = 0; k < 30; k++) puff(['#FFD23F', '#FF7EB6', '#5AB0FF'][k % 3]) }
  pl.x = Math.round(plX * 1000); pl.y = Math.round(pos);
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && speed < SEG * 2 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 700);
}
function intro(k) { if (seenK[k]) return; seenK[k] = 1; S.hooks.onPower && S.hooks.onPower('tp_see_' + k) }
function doTurn(t, d, quiet) {   // rẽ: xoá tường chắn, quay cảnh như vuốt rẽ trong game gốc
  t.turn.done = true; for (let i = t.index; i < t.index + JUNC; i++) if (segs[i]) segs[i].junc = 0;
  turnT = 24; turnDir = d; bgX += d * .2; if (!quiet) { GC.sfx('twoosh'); score += 50 }
}
function collectCoin(c) { c.got = true; S.coins++; stageCoins++; score += 10; if (S.tick - coinSfx > 3) { coinSfx = S.tick; GC.sfx('coin') } if (S.coins % 50 === 0 && S.lives < LIVES + 2) { S.lives++; GC.sfx('power'); S.hooks.onPower && S.hooks.onPower('tp_life') } }   // xu tính điểm · cứ 50 xu = +1 mạng (tối đa 7)
function grab(it) {
  it.got = true; GC.sfx('power');
  if (it.k === 'magnet') magT = 720; else if (it.k === 'shield') shieldT = 1200; else if (it.k === 'boost') { boostT = 330; GC.sfx('twoosh') } else { S.energy += COST.gem; S.hooks.onBat && S.hooks.onBat(COST.gem, 'gem') }
  if (it.k !== 'gem') S.hooks.onPower && S.hooks.onPower('tp_' + it.k);
  for (let k = 0; k < 12; k++) puff(['#FFD23F', '#7FD6FF', '#FF7EB6'][k % 3]);
}
function hit(why) {
  phase = 'hit'; phT = why === 'gap' ? 90 : 75; S.hits++; S.falls++; speed *= why === 'gap' ? .2 : .35; GC.sfx(why === 'gap' ? 'tscream' : 'tsplat'); setTimeout(() => GC.sfx('troar'), why === 'gap' ? 700 : 250);   /* tiếng ngã + khỉ quỷ gầm */
  hit.why = why; S.hooks.onPower && S.hooks.onPower('tp_hit_' + why);
}
function afterHit() {
  S.lives--;
  if (S.lives <= 0) { phase = 'over'; phT = 170; GC.sfx('bad'); GC.music.hush(true); return }
  // đứng dậy chạy tiếp: qua khỏi hố (nếu rơi) · được bất tử 2 giây
  if (hit.why === 'gap') { let z = pos + PLZ; while (findSeg(z).gap) z += SEG; pos = z - PLZ + SEG }
  if (hit.why === 'turn') { const t = turnsL.find(t => !t.turn.done); if (t) doTurn(t, t.turn.dir || 1, true) }
  jy = 0; jv = 0; slideT = 0; inv = 130; speed = baseSp() * .45; phase = 'run';
  S.hooks.onFall && S.hooks.onFall(0, (hit.why === 'gap' ? '😱 Rơi xuống vực!' : hit.why === 'turn' ? '🧱 Đâm vào tường!' : MOVERS[hit.why] || ['snake', 'spider', 'ghost', 'bats', 'birds', 'scarab', 'blade'].includes(hit.why) ? '👾 Trúng quái!' : '💥 Vấp ngã!') + ' 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · khỉ quỷ đang đuổi, chạy mau!');
}
function puff(col) { fx.push({ x: VW / 2 + (Math.random() - .5) * 80, y: VH * .74 + (Math.random() - .5) * 40, vx: (Math.random() - .5) * 5, vy: -Math.random() * 5, g: .2, l: 40, L: 40, r: 3 + Math.random() * 4, c: col }) }

/* ═════ hình ảnh: vẽ sẵn 1 lần mỗi màn (đường lát đá, lan can, cây đại thụ, phế tích, tượng, cổng đền…) ═════ */
function cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c }
const IMG = {};
const shade = (hex, f) => { const n = parseInt(hex.slice(1, 7), 16), c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)); return '#' + c.map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('') };
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('') };
const lg = (x, x0, y0, x1, y1, stops) => { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g };
const rg = (x, cx, cy, r0, r1, stops) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g };
function circ(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill() }
function path(x, pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill() }
function leafy(x, r, cx, cy, R, cols, n) {   // tán lá: nhiều chùm tròn, tối dưới sáng trên
  for (let k = 0; k < cols.length; k++) for (let i = 0; i < n; i++) { const a = r() * 7, d = r() * R * (1 - k * .18), rr = R * (.28 + r() * .22) * (1 - k * .15); circ(x, cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7 - k * R * .08, rr, cols[k]) }
}
function glyph(x, cx, cy, s, col) {   // hoa văn xoắn ốc kiểu đền cổ
  x.strokeStyle = col; x.lineWidth = Math.max(1.5, s * .12); x.beginPath(); x.moveTo(cx - s, cy - s); x.lineTo(cx + s, cy - s); x.lineTo(cx + s, cy + s); x.lineTo(cx - s * .6, cy + s); x.lineTo(cx - s * .6, cy - s * .4); x.lineTo(cx + s * .4, cy - s * .4); x.lineTo(cx + s * .4, cy + s * .4); x.lineTo(cx - s * .1, cy + s * .4); x.stroke();
}
function stoneBlock(x, x0, y0, w, h, base, r, moss) {   // một phiến đá: sáng trên-trái, tối dưới-phải
  const c = shade(base, (r() - .5) * .22);
  x.fillStyle = shade(c, -.35); x.fillRect(x0, y0, w, h);
  x.fillStyle = c; x.fillRect(x0, y0, w - 2, h - 2);
  x.fillStyle = shade(c, .18); x.fillRect(x0, y0, w - 2, Math.max(1, h * .14)); x.fillRect(x0, y0, Math.max(1, w * .07), h - 2);
  x.fillStyle = shade(c, -.14); x.fillRect(x0, y0 + h * .72, w - 2, h * .26);
  for (let i = 0; i < 5; i++) { x.fillStyle = r() < .5 ? shade(c, -.2) + '88' : shade(c, .2) + '88'; x.fillRect(x0 + r() * w, y0 + r() * h, 2, 2) }
  if (r() < .22) { x.strokeStyle = shade(c, -.4); x.lineWidth = 1; x.beginPath(); let px = x0 + r() * w, py = y0; x.moveTo(px, py); for (let i = 0; i < 4; i++) { px += (r() - .5) * w * .4; py += h / 4; x.lineTo(px, py) } x.stroke() }
  if (moss && r() < moss) { x.fillStyle = '#5E9A3Aaa'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(x0 + r() * w, y0 + h * (.6 + r() * .4), 2 + r() * 5, 0, 7); x.fill() } }
}
/* mặt đường lát đá: 256 × 512 px = cả bề ngang đường × 8 đoạn — lặp lại theo chiều dài */
function makeTex(st, li) {
  if (st.tunnel) return cnv(256, 512, x => {   // nền đất + 3 đường ray (tà vẹt gỗ, ray thép)
    const r = rng(li * 41 + 9); x.fillStyle = st.stone[1]; x.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 400; i++) { x.fillStyle = r() < .5 ? shade(st.stone[1], -.18) + '88' : shade(st.stone[0], .1) + '66'; x.fillRect(r() * 256, r() * 512, 2 + r() * 5, 2 + r() * 4) }
    const crys = st.bg === 'crystal';
    for (const c of [128 - .62 * 128, 128, 128 + .62 * 128]) {
      for (let y = 6; y < 512; y += 32) { x.fillStyle = crys ? '#4A3A2E' : '#5A3A1E'; x.fillRect(c - 34, y, 68, 14); x.fillStyle = crys ? '#6A5444' : '#7A5230'; x.fillRect(c - 34, y, 68, 4) }
      for (const d of [-20, 20]) { x.fillStyle = '#3A3A44'; x.fillRect(c + d - 3, 0, 7, 512); x.fillStyle = '#C8CCD8'; x.fillRect(c + d - 2, 0, 3, 512) }
    }
    if (crys) for (let i = 0; i < 18; i++) { const px = r() * 256, py = r() * 512; path(x, [px, py, px + 4, py - 10, px + 8, py], '#B89AFF88') }
  });
  return cnv(256, 512, x => {
    const r = rng(li * 97 + 5); x.fillStyle = st.stone[2]; x.fillRect(0, 0, 256, 512);
    let y = 0;
    while (y < 512) {
      let h = Math.round(30 + r() * 26); if (512 - y < 46) h = 512 - y;
      let xx = 22 - r() * 34;
      while (xx < 234) { const w = 40 + r() * 46, a = Math.max(22, xx), b = Math.min(234, xx + w); if (b - a > 6) stoneBlock(x, a + 1.5, y + 1.5, b - a - 3, h - 3, mix(st.stone[0], st.stone[1], r()), r, st.mossP); xx += w }
      y += h;
    }
    const curb = st.bg === 'sakura' ? '#9A9088' : st.wall[0]; for (let yy = 0; yy < 512; yy += 64) { stoneBlock(x, 0, yy + 1, 21, 62, shade(curb, .05), r, st.mossP); stoneBlock(x, 235, yy + 1, 21, 62, shade(curb, .05), r, st.mossP) }
    if (st.bg === 'desert') for (let i = 0; i < 14; i++) glyph(x, 40 + r() * 176, 20 + r() * 470, 6, '#8A6A3A88');
    if (st.bg === 'falls') { x.fillStyle = '#2A4A4A33'; for (let i = 0; i < 30; i++) { x.beginPath(); x.ellipse(r() * 256, r() * 512, 6 + r() * 14, 3 + r() * 6, 0, 0, 7); x.fill() } }
    if (st.bg === 'cave') { x.strokeStyle = '#FF6A1A'; x.lineWidth = 2; x.shadowColor = '#FF8A2A'; x.shadowBlur = 6; for (let i = 0; i < 9; i++) { x.beginPath(); let px = 30 + r() * 200, py = r() * 512; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - .5) * 40; py += 14 + r() * 14; x.lineTo(px, py) } x.stroke() } x.shadowBlur = 0 }
    if (st.bg === 'ice') { x.fillStyle = '#FFFFFF55'; for (let i = 0; i < 14; i++) { const px = r() * 256, py = r() * 512; path(x, [px, py, px + 24, py - 24, px + 30, py - 24, px + 6, py], '#FFFFFF44') } }
    if (st.bg === 'gold') for (let i = 0; i < 10; i++) glyph(x, 40 + r() * 176, 20 + r() * 470, 7, '#8E6E2E88');
    if (st.grass) { for (let i = 0; i < 160; i++) { const side = r() < .5, px = side ? 20 + r() * 16 : 236 - r() * 16, py = r() * 512; x.strokeStyle = r() < .5 ? '#4E8E2E' : '#6EAE3E'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (side ? 6 : -6) * r(), py - 6 - r() * 8); x.stroke() } }
  });
}
function img(k) {
  const key = k + S.level; if (IMG[key]) return IMG[key];
  const st = STAGES[S.level], r = rng(k.length * 131 + S.level * 17 + 3); let c;
  if (k === 'tree') c = cnv(600, 1100, x => {   // cây đại thụ mọc lên từ dưới nước, rễ bạnh, dây leo
    path(x, [120, 1100, 230, 980, 255, 700, 262, 300, 340, 300, 345, 700, 372, 980, 480, 1100], '#3A2616');
    x.fillStyle = lg(x, 230, 0, 380, 0, ['#3A2616', '#7A5636', '#9A7048', '#5A3E26', '#2E1E10']); x.beginPath(); x.moveTo(150, 1100); x.bezierCurveTo(240, 980, 250, 800, 262, 560); x.bezierCurveTo(270, 420, 245, 330, 255, 250); x.lineTo(345, 250); x.bezierCurveTo(340, 360, 330, 450, 338, 560); x.bezierCurveTo(350, 800, 370, 980, 460, 1100); x.closePath(); x.fill();
    x.fillStyle = '#4A3220'; [[60, 1100, 210, 960, 250, 1100], [470, 1100, 360, 950, 330, 1100], [10, 1100, 160, 1030, 190, 1100], [560, 1100, 420, 1020, 400, 1100]].forEach(p => path(x, p, '#4A3220'));
    x.strokeStyle = '#2A1A0C99'; x.lineWidth = 5; for (let i = 0; i < 7; i++) { const bx = 268 + i * 11; x.beginPath(); x.moveTo(bx, 300); x.bezierCurveTo(bx - 8, 500, bx + 10, 700, bx - 4 + (i - 3) * 14, 1050); x.stroke() }
    x.fillStyle = '#5E9A3A99'; for (let i = 0; i < 26; i++) { x.beginPath(); x.ellipse(262 + r() * 80, 320 + r() * 650, 6 + r() * 10, 10 + r() * 22, 0, 0, 7); x.fill() }
    x.strokeStyle = '#4A3220'; x.lineWidth = 22; x.beginPath(); x.moveTo(290, 330); x.quadraticCurveTo(170, 280, 90, 300); x.stroke(); x.beginPath(); x.moveTo(320, 320); x.quadraticCurveTo(440, 260, 530, 290); x.stroke();
    leafy(x, r, 300, 210, 230, ['#123E1E', '#1E5A2A', '#2E7A34', '#4C9A3E', '#7CC050'], 26);
    leafy(x, r, 100, 300, 110, ['#163E1E', '#245E2C', '#3E8A38', '#6AB04A'], 12); leafy(x, r, 510, 290, 110, ['#163E1E', '#245E2C', '#3E8A38', '#6AB04A'], 12);
    x.strokeStyle = '#2E6A22'; x.lineWidth = 3; for (let i = 0; i < 14; i++) { const vx = 60 + r() * 480, vy = 260 + r() * 80, L = 160 + r() * 380; x.beginPath(); x.moveTo(vx, vy); x.quadraticCurveTo(vx + (r() - .5) * 40, vy + L * .5, vx + (r() - .5) * 20, vy + L); x.stroke(); for (let j = 30; j < L; j += 34) circ(x, vx + (r() - .5) * 10, vy + j, 5, '#3E8A2E') }
  });
  else if (k === 'palm') c = cnv(420, 900, x => {
    x.lineCap = 'round'; for (let i = 0; i < 18; i++) { const t = i / 18, px = 200 + Math.sin(t * 2.2) * 50, py = 900 - t * 620; x.fillStyle = i % 2 ? '#7A5A36' : '#8E6A42'; x.beginPath(); x.ellipse(px, py, 26 - t * 8, 22, 0, 0, 7); x.fill() }
    const tx = 200 + Math.sin(2.2) * 50, ty = 280; for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8 + (r() - .5) * .2, L = 170 + r() * 60; x.strokeStyle = '#2E6A2A'; x.lineWidth = 7; x.beginPath(); x.moveTo(tx, ty); const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .5 + 60; x.quadraticCurveTo(tx + Math.cos(a) * L * .5, ty + Math.sin(a) * L * .5 - 40, ex, ey); x.stroke(); x.strokeStyle = '#4E9A3A'; x.lineWidth = 3; for (let j = 1; j < 10; j++) { const t = j / 10, qx = tx + (ex - tx) * t, qy = ty + (ey - ty) * t - Math.sin(t * Math.PI) * 40; x.beginPath(); x.moveTo(qx, qy); x.lineTo(qx + Math.cos(a + 1.4) * 34, qy + Math.sin(a + 1.4) * 34 + 10); x.moveTo(qx, qy); x.lineTo(qx + Math.cos(a - 1.4) * 34, qy + Math.sin(a - 1.4) * 34 + 10); x.stroke() } }
    circ(x, tx - 10, ty + 14, 14, '#6A4A1E'); circ(x, tx + 12, ty + 18, 13, '#7A5A26');
  });
  else if (k === 'ruin' || k === 'pillar' || k === 'pillarG') c = cnv(300, 900, x => {   // cột đá / tượng phế tích phủ rêu mọc từ dưới lên
    const g = k === 'pillarG', base = g ? '#C8A050' : k === 'pillar' ? '#C8B490' : '#9AA088', top = k === 'ruin' ? 120 : 60;
    for (let y = 900; y > top; y -= 80) { const w = 200 - (900 - y) * .03 + (r() - .5) * 20; stoneBlock(x, 150 - w / 2, y - 80, w, 80, base, r, k === 'ruin' ? .9 : k === 'pillar' ? .4 : 0); if (r() < .5) glyph(x, 150 + (r() - .5) * 60, y - 40, 16, shade(base, -.45)) }
    if (k === 'ruin') {   // đầu tượng chạm mặt người
      stoneBlock(x, 50, 20, 200, 120, base, r, .9); x.fillStyle = shade(base, -.5); x.fillRect(85, 60, 40, 22); x.fillRect(175, 60, 40, 22); x.fillRect(120, 104, 60, 14); x.fillStyle = shade(base, .2); x.fillRect(140, 40, 20, 50);
    } else { stoneBlock(x, 60, top - 50, 180, 50, shade(base, .1), r, 0); if (g) { circ(x, 150, top - 80, 34, '#FFD23F'); x.fillStyle = rg(x, 150, top - 80, 4, 90, ['#FFF6C8cc', '#FFD23F00']); x.fillRect(50, top - 180, 200, 200) } }
    x.fillStyle = '#4E8A2E99'; if (!g) for (let i = 0; i < 18; i++) { const px = 60 + r() * 180, py = top + r() * 700; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 8, py); x.lineTo(px + 4, py + 30 + r() * 60); x.fill() }
  });
  else if (k === 'isle') c = cnv(700, 700, x => {   // đảo đá lơ lửng trên biển mây
    path(x, [60, 300, 640, 300, 560, 380, 470, 520, 380, 690, 300, 560, 180, 440], '#8A5A4A'); path(x, [60, 300, 640, 300, 600, 340, 420, 380, 200, 360], '#A87060');
    x.fillStyle = '#6A4038'; for (let i = 0; i < 6; i++) path(x, [140 + i * 70, 320, 170 + i * 70, 320, 155 + i * 70, 420 + r() * 120], '#6A4038');
    x.fillStyle = '#7AAE4A'; x.beginPath(); x.ellipse(350, 300, 300, 34, 0, 0, 7); x.fill();
    for (let i = 0; i < 3; i++) stoneBlock(x, 180 + i * 50, 160 + i * 10, 46, 140 - i * 10, '#D8C8A8', r, .3); stoneBlock(x, 170, 140, 170, 26, '#E0D0B0', r, .2);
    x.fillStyle = '#5A3A22'; x.fillRect(470, 150, 14, 150); leafy(x, r, 478, 130, 80, ['#2E6A2A', '#4C9A3E', '#7CC050'], 10);
  });
  else if (k === 'spire') c = cnv(300, 900, x => { path(x, [20, 900, 90, 400, 130, 120, 160, 40, 190, 160, 230, 420, 290, 900], '#2A1A16'); path(x, [90, 400, 130, 120, 160, 40, 150, 300, 120, 900, 20, 900], '#3E2A24'); x.strokeStyle = '#FF6A1A'; x.lineWidth = 4; x.shadowColor = '#FF8A2A'; x.shadowBlur = 10; for (let i = 0; i < 5; i++) { x.beginPath(); let px = 100 + r() * 100, py = 300 + r() * 500; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (r() - .5) * 40; py += 30 + r() * 30; x.lineTo(px, py) } x.stroke() } x.shadowBlur = 0 });
  else if (k === 'pine') c = cnv(400, 900, x => {
    path(x, [40, 900, 80, 720, 160, 680, 280, 690, 350, 740, 380, 900], '#7A8EA8'); path(x, [60, 760, 160, 700, 280, 712, 340, 760, 200, 740], '#F4F9FF');
    x.fillStyle = '#4A3020'; x.fillRect(186, 560, 28, 160);
    for (let i = 0; i < 6; i++) { const t = 40 + i * 95, w = 50 + i * 26; path(x, [200, t, 200 - w, t + 150, 200 + w, t + 150], '#1E5A42'); path(x, [200, t, 200 - w * .9, t + 140, 200 - w * .2, t + 120, 200, t + 140, 200 + w * .3, t + 118, 200 + w * .9, t + 140], '#276E52'); path(x, [200, t, 200 - w * .55, t + 70, 200 + w * .55, t + 70], '#FFFFFF'); path(x, [200 - w, t + 150, 200 - w * .6, t + 132, 200 - w * .2, t + 150, 200 + w * .2, t + 134, 200 + w * .6, t + 150, 200 + w, t + 150, 200, t + 140], '#F0F8FF') }
  });
  else if (k === 'crystal' || k === 'berg') c = cnv(500, 700, x => {
    if (k === 'berg') { path(x, [0, 700, 60, 420, 150, 300, 230, 160, 320, 260, 420, 330, 500, 700], '#CFE8F8'); path(x, [60, 420, 150, 300, 230, 160, 200, 420, 160, 700, 0, 700], '#F4FBFF'); path(x, [320, 260, 420, 330, 500, 700, 360, 700], '#9FC4E0'); return }
    [[250, 60, 90], [140, 230, 60], [370, 200, 64], [70, 380, 44], [440, 360, 42]].forEach(([a, b, w]) => { path(x, [a, b, a + w * .55, b + 90, a + w * .4, 700, a - w * .4, 700, a - w * .55, b + 90], '#8FCFF8'); path(x, [a, b, a - w * .55, b + 90, a - w * .4, 700, a, 700], '#C8ECFF'); x.fillStyle = '#FFFFFF99'; x.fillRect(a - w * .25, b + 70, w * .1, 400) });
  });
  else if (k === 'post' && st.bg === 'sakura') c = cnv(130, 380, x => { x.fillStyle = lg(x, 20, 0, 110, 0, ['#8A1A22', '#E8584E', '#C8323A', '#7A1018']); x.fillRect(25, 60, 80, 320); x.fillStyle = '#1E1A1E'; x.fillRect(5, 30, 120, 34); x.fillStyle = '#E8C050'; x.fillRect(20, 64, 90, 10); x.fillRect(20, 340, 90, 10); path(x, [25, 30, 105, 30, 65, 0], '#E8C050') });
  else if (k === 'post') c = cnv(130, 380, x => {   // cột lan can chạm khắc
    stoneBlock(x, 15, 60, 100, 320, st.wall[0], r, st.mossP); stoneBlock(x, 0, 30, 130, 40, st.wall[1], r, 0); stoneBlock(x, 20, 0, 90, 34, st.wall[1], r, 0);
    glyph(x, 65, 160, 22, shade(st.wall[0], -.45)); glyph(x, 65, 260, 16, shade(st.wall[0], -.45));
    if (st.mossP) { x.fillStyle = '#4E8A2Eaa'; for (let i = 0; i < 8; i++) { const px = 15 + r() * 100; x.fillRect(px, 66, 6, 20 + r() * 70) } }
    if (st.bg === 'ice') { x.fillStyle = '#FFFFFF'; x.fillRect(0, 22, 130, 12); x.fillRect(20, -2, 90, 10) }
  });
  else if (k === 'torch' || k === 'brazier') c = cnv(120, 360, x => { const g = st.bg === 'gold'; x.fillStyle = lg(x, 40, 0, 80, 0, g ? ['#8E6E2E', '#E8C252', '#8E6E2E'] : ['#3A2A20', '#6A5040', '#3A2A20']); x.fillRect(46, 90, 28, 270); x.fillStyle = g ? '#D8B050' : '#5A4030'; x.beginPath(); x.moveTo(10, 60); x.lineTo(110, 60); x.lineTo(84, 104); x.lineTo(36, 104); x.closePath(); x.fill(); x.fillStyle = g ? '#FFE58A' : '#7A6050'; x.fillRect(10, 56, 100, 8); x.fillRect(30, 340, 60, 20) });
  else if (k === 'block') c = cnv(300, 380, x => blockArt(x, st, r));
  else if (k === 'obelisk') c = cnv(240, 1100, x => {   // cột tháp ai cập trên đụn cát
    path(x, [0, 1100, 40, 960, 200, 960, 240, 1100], '#D2A866');
    x.fillStyle = lg(x, 70, 0, 170, 0, ['#A8824A', '#F0D49A', '#D8B478', '#8A6A3A']); x.beginPath(); x.moveTo(68, 985); x.lineTo(172, 985); x.lineTo(150, 110); x.lineTo(90, 110); x.closePath(); x.fill();
    path(x, [90, 110, 150, 110, 120, 36], '#FFD23F'); path(x, [120, 36, 150, 110, 128, 110], '#C89A1E');
    for (let y = 170; y < 940; y += 64) glyph(x, 120, y, 13, '#7A5A2E');
  });
  else if (k === 'sphinx') c = cnv(900, 660, x => {   // tượng nhân sư
    path(x, [0, 660, 70, 580, 830, 580, 900, 660], '#D2A866');
    x.fillStyle = lg(x, 0, 380, 0, 600, ['#EED29A', '#C8A060']); x.beginPath(); x.moveTo(110, 590); x.lineTo(130, 400); x.quadraticCurveTo(450, 330, 790, 400); x.lineTo(820, 590); x.closePath(); x.fill();
    stoneBlock(x, 190, 500, 150, 96, '#E2C48A', r, 0); stoneBlock(x, 560, 500, 150, 96, '#E2C48A', r, 0);
    path(x, [320, 150, 580, 150, 640, 440, 260, 440], '#2E5AA8'); for (let i = 0; i < 9; i++) { x.fillStyle = '#E8C050'; x.fillRect(300 - i * 4, 176 + i * 30, 300 + i * 8, 11) }
    x.fillStyle = lg(x, 370, 0, 530, 0, ['#C8A060', '#F0D49A', '#C8A060']); x.fillRect(372, 150, 156, 210);
    x.fillStyle = '#3A2A1A'; x.fillRect(392, 214, 40, 12); x.fillRect(468, 214, 40, 12); x.fillRect(440, 236, 20, 50); x.fillRect(414, 310, 72, 10); x.fillStyle = '#2E5AA8'; x.fillRect(430, 360, 40, 70); x.fillStyle = '#E8C050'; for (let i = 0; i < 4; i++) x.fillRect(430, 368 + i * 16, 40, 6);
    path(x, [350, 150, 550, 150, 520, 100, 380, 100], '#E8C050');
  });
  else if (k === 'falls') c = cnv(520, 1200, x => {   // vách đá có thác nước đổ xuống sông
    path(x, [30, 1200, 70, 320, 150, 120, 260, 60, 380, 110, 460, 260, 490, 1200], '#55654F'); path(x, [30, 1200, 70, 320, 150, 120, 200, 110, 150, 600, 130, 1200], '#728466');
    leafy(x, r, 260, 90, 170, ['#1E5A2A', '#2E7A34', '#4C9A3E', '#7CC050'], 12);
    x.fillStyle = lg(x, 190, 0, 340, 0, ['#C8F4FF55', '#FFFFFFee', '#A8E8F8dd', '#FFFFFF66']); x.fillRect(190, 150, 150, 1000);
    x.strokeStyle = '#FFFFFF'; x.lineWidth = 4; for (let i = 0; i < 10; i++) { const px = 200 + r() * 130; x.beginPath(); x.moveTo(px, 160 + r() * 200); x.lineTo(px + (r() - .5) * 8, 600 + r() * 500); x.stroke() }
    for (let i = 0; i < 16; i++) circ(x, 170 + r() * 190, 1110 + r() * 80, 24 + r() * 30, '#FFFFFFdd');
  });
  else if (k === 'sakura') c = cnv(760, 1000, x => {   // cây anh đào trên mỏm đá
    path(x, [160, 1000, 230, 920, 540, 920, 610, 1000], '#6E6A72'); path(x, [230, 920, 540, 920, 500, 950, 260, 950], '#8A8690');
    x.lineCap = 'round'; x.strokeStyle = '#4A2A22'; x.lineWidth = 54; x.beginPath(); x.moveTo(390, 940); x.bezierCurveTo(330, 760, 440, 560, 380, 330); x.stroke();
    x.lineWidth = 22; x.beginPath(); x.moveTo(390, 560); x.quadraticCurveTo(250, 470, 150, 380); x.moveTo(400, 480); x.quadraticCurveTo(540, 400, 620, 330); x.stroke(); x.strokeStyle = '#6A4032'; x.lineWidth = 12; x.beginPath(); x.moveTo(378, 900); x.bezierCurveTo(338, 760, 430, 560, 372, 340); x.stroke();
    leafy(x, r, 380, 300, 290, ['#B84A7A', '#E07AA8', '#F49AB6', '#FBC4D4', '#FFE6EE'], 24); leafy(x, r, 150, 360, 130, ['#C8608A', '#F49AB6', '#FFD4E0'], 10); leafy(x, r, 620, 320, 130, ['#C8608A', '#F49AB6', '#FFD4E0'], 10);
    for (let i = 0; i < 30; i++) { x.fillStyle = '#FFC8D8'; x.beginPath(); x.ellipse(100 + r() * 560, 500 + r() * 420, 5, 3, r() * 3, 0, 7); x.fill() }
  });
  else if (k === 'pagoda') c = cnv(520, 1000, x => {   // chùa nhiều tầng
    path(x, [50, 1000, 110, 900, 410, 900, 470, 1000], '#6E6A72');
    for (let k2 = 0; k2 < 5; k2++) { const y = 890 - k2 * 150, w = 170 - k2 * 24; x.fillStyle = '#F2E8D8'; x.fillRect(260 - w * .6, y - 104, w * 1.2, 104); x.fillStyle = '#C8323A'; for (let i = 0; i < 5; i++) x.fillRect(260 - w * .6 + i * w * .28, y - 104, 8, 104); x.fillRect(260 - w * .6, y - 20, w * 1.2, 12); path(x, [260 - w - 34, y - 100, 260 + w + 34, y - 100, 260 + w * .7, y - 150, 260 - w * .7, y - 150], '#2E3442'); path(x, [260 - w - 34, y - 100, 260 - w - 50, y - 126, 260 - w - 8, y - 112], '#2E3442'); path(x, [260 + w + 34, y - 100, 260 + w + 50, y - 126, 260 + w + 8, y - 112], '#2E3442') }
    x.fillStyle = '#E8C050'; x.fillRect(254, 30, 12, 140); for (let i = 0; i < 5; i++) x.fillRect(244, 50 + i * 22, 32, 6);
  });
  else if (k === 'lantern') c = cnv(300, 640, x => { path(x, [10, 640, 50, 520, 250, 520, 290, 640], '#6E6A72'); x.translate(0, 150); lanternArt(x, r) });
  else if (k === 'boulder') c = cnv(256, 256, x => {   // đá lăn (mỗi màn một kiểu)
    const t = st.bg, cols = t === 'ice' ? ['#FFFFFF', '#D8ECFA', '#9AC0E0'] : t === 'cave' ? ['#6A4A40', '#3A2A24', '#1A1210'] : t === 'desert' ? ['#F4DAA4', '#D4AE6A', '#9A7A42'] : t === 'gold' ? ['#9A8A70', '#5A4E40', '#2E281E'] : ['#C0BAA6', '#8A8474', '#55513F'];
    x.fillStyle = rg(x, 92, 86, 10, 150, cols); x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill();
    x.strokeStyle = t === 'cave' ? '#FF7A1A' : shade(cols[2], -.35); x.lineWidth = t === 'cave' ? 6 : 4; if (t === 'cave') { x.shadowColor = '#FFAA3A'; x.shadowBlur = 10 }
    for (let i = 0; i < 6; i++) { x.beginPath(); let px = 128 + (r() - .5) * 150, py = 128 + (r() - .5) * 150; x.moveTo(px, py); for (let j = 0; j < 3; j++) { px += (r() - .5) * 70; py += (r() - .5) * 70; x.lineTo(px, py) } x.stroke() } x.shadowBlur = 0;
    if (st.mossP) leafy(x, r, 128, 40, 60, ['#3E7A2Ecc', '#5E9A3Acc'], 6);
    if (t === 'gold') { x.strokeStyle = '#FFD23F'; x.lineWidth = 12; x.beginPath(); x.arc(128, 128, 100, 0, 7); x.stroke(); x.beginPath(); x.moveTo(28, 128); x.lineTo(228, 128); x.stroke() }
  });
  else if (k === 'frame') c = cnv(760, 640, x => {   // khung gỗ chống hầm (2 cột + xà trên + giằng chéo)
    const crys = st.bg === 'crystal', w1 = crys ? '#3A2A22' : '#5A3A1E', w2 = crys ? '#5A463A' : '#8A5A30';
    for (const px of [0, 700]) { x.fillStyle = lg(x, px, 0, px + 60, 0, [w2, w1, shade(w1, -.3)]); x.fillRect(px, 40, 60, 600); x.fillStyle = shade(w1, -.35); for (let y = 90; y < 620; y += 90) x.fillRect(px, y, 60, 5) }
    x.fillStyle = lg(x, 0, 0, 0, 70, [w2, w1, shade(w1, -.3)]); x.fillRect(0, 0, 760, 70); x.fillStyle = shade(w1, -.35); for (let i = 1; i < 8; i++) x.fillRect(i * 95, 0, 5, 70);
    x.strokeStyle = w1; x.lineWidth = 24; x.beginPath(); x.moveTo(60, 200); x.lineTo(190, 70); x.moveTo(700, 200); x.lineTo(570, 70); x.stroke();
    x.fillStyle = '#9AA0AA'; for (const px of [30, 730]) for (let y = 120; y < 600; y += 140) circ(x, px, y, 6, '#9AA0AA');
    if (crys) for (const px of [30, 730]) { x.fillStyle = rg(x, px, 330, 4, 70, ['#F0D8FFdd', '#A070FF55', '#A070FF00']); x.fillRect(px - 70, 260, 140, 140); path(x, [px - 14, 360, px - 4, 290, px + 6, 360], '#E0C8FF'); path(x, [px + 2, 360, px + 14, 310, px + 22, 360], '#B890FF') }
    else for (const px of [30, 730]) { x.fillStyle = '#3A2A20'; x.fillRect(px - 8, 300, 16, 50); x.fillStyle = '#5A4030'; x.fillRect(px - 16, 292, 32, 12) }
  });
  else if (k === 'wallend') c = cnv(800, 800, x => {   // tường cụt ở ngã rẽ: mặt khỉ quỷ chạm đá
    const b = st.bg === 'sakura' ? '#A89C90' : st.wall[0], hi = st.bg === 'sakura' ? '#C4B8AC' : st.wall[1];
    for (let y = 0; y < 800; y += 80) for (let i = -1; i < 9; i++) stoneBlock(x, i * 100 + (y / 80 % 2) * 50, y, 100, 80, mix(b, hi, r()), r, st.mossP);
    circ(x, 400, 340, 200, shade(b, -.25)); circ(x, 400, 340, 172, shade(hi, -.05)); circ(x, 230, 230, 60, shade(hi, -.1)); circ(x, 570, 230, 60, shade(hi, -.1));
    x.fillStyle = shade(b, -.6); x.beginPath(); x.ellipse(330, 310, 46, 32, -.3, 0, 7); x.fill(); x.beginPath(); x.ellipse(470, 310, 46, 32, .3, 0, 7); x.fill();
    x.fillStyle = '#FF3A2A'; x.beginPath(); x.ellipse(335, 312, 16, 11, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(465, 312, 16, 11, 0, 0, 7); x.fill();
    x.fillStyle = shade(b, -.65); x.fillRect(310, 410, 180, 60); x.fillStyle = '#F2EAD0'; for (let i = 0; i < 5; i++) path(x, [316 + i * 36, 410, 340 + i * 36, 410, 328 + i * 36, 444], '#F2EAD0');
    if (st.mossP) { x.fillStyle = '#4E8A2Ecc'; for (let i = 0; i < 40; i++) x.fillRect(r() * 800, r() * 60, 8, 40 + r() * 120) }
    if (st.bg === 'ice') { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 800, 30); for (let i = 0; i < 30; i++) path(x, [r() * 800, 28, r() * 800 + 14, 28, r() * 800 + 7, 70], '#E8F6FF') }
  });
  else if (k === 'root') c = cnv(800, 200, x => rootArt(x, st, r));
  else if (k === 'arch') c = cnv(700, 520, x => archArt(x, st, r));
  else if (k === 'gate') c = cnv(760, 700, x => S.level === NL - 1 ? skullGate(x, r) : templeGate(x, st, r));
  else if (k === 'goldidol') c = cnv(300, 420, x => {
    x.fillStyle = rg(x, 150, 150, 10, 150, ['#FFF6C8', '#FFD23F88', '#FFD23F00']); x.fillRect(0, 0, 300, 300);
    stoneBlock(x, 60, 330, 180, 90, '#8A7A64', r, 0); stoneBlock(x, 40, 300, 220, 36, '#A8987E', r, 0);
    x.fillStyle = lg(x, 80, 0, 220, 0, ['#B8861E', '#FFE58A', '#E8B030', '#9A6A10']); x.fillRect(95, 90, 110, 120); x.fillRect(80, 200, 140, 100);
    x.fillStyle = '#7A5208'; x.fillRect(108, 118, 30, 22); x.fillRect(162, 118, 30, 22); x.fillRect(118, 168, 64, 16); for (let i = 0; i < 4; i++) x.fillRect(122 + i * 16, 184, 8, 10);
    x.fillStyle = '#FF3A3A'; x.fillRect(116, 124, 12, 10); x.fillRect(170, 124, 12, 10); x.fillStyle = '#FFF6C8'; x.fillRect(100, 94, 12, 100); x.fillStyle = '#E8B030'; x.fillRect(70, 70, 160, 26); for (let i = 0; i < 5; i++) path(x, [80 + i * 34, 72, 96 + i * 34, 30, 112 + i * 34, 72], '#E8B030');
  });
  else if (k === 'coin') c = cnv(64, 64, x => { x.fillStyle = rg(x, 26, 24, 2, 34, ['#FFF6B0', '#FFD23F', '#E8A010', '#9A6008']); x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill(); x.strokeStyle = '#8A5A08'; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 22, 0, 7); x.stroke(); x.fillStyle = '#B8780C'; x.fillRect(25, 25, 14, 14); x.fillStyle = '#FFF6C8'; x.fillRect(25, 25, 14, 4); circ(x, 20, 18, 5, '#FFFFFFcc') });
  else if (k === 'overlay') c = cnv(1024, 420, x => overlayArt(x, st, r));
  return IMG[key] = c;
}
function blockArt(x, st, r) {   // vật chắn 1 làn (theo từng màn)
  const t = st.bg;
  if (t === 'desert') {   // tượng pharaoh bằng đá cát
    stoneBlock(x, 20, 310, 260, 70, '#B8925A', r, 0); stoneBlock(x, 50, 160, 200, 160, '#D8B478', r, 0);
    path(x, [70, 30, 230, 30, 266, 210, 34, 210], '#2E5AA8'); for (let i = 0; i < 8; i++) { x.fillStyle = '#E8C050'; x.fillRect(48 - i * 2, 50 + i * 20, 204 + i * 4, 8) }
    stoneBlock(x, 98, 44, 104, 126, '#E6C68A', r, 0); x.fillStyle = '#1A1208'; x.fillRect(108, 84, 34, 9); x.fillRect(158, 84, 34, 9); x.fillStyle = '#FF3A2A'; x.fillRect(118, 86, 10, 6); x.fillRect(170, 86, 10, 6); x.fillStyle = '#9A7A42'; x.fillRect(130, 134, 40, 8);
    x.fillStyle = '#2E5AA8'; x.fillRect(136, 170, 28, 50); x.fillStyle = '#E8C050'; for (let i = 0; i < 3; i++) x.fillRect(136, 176 + i * 16, 28, 6); glyph(x, 150, 270, 20, '#8A6A3A'); return;
  }
  if (t === 'sakura') { x.translate(0, 0); lanternArt(x, r); return }
  if (t === 'mine') {   // rào chắn gỗ sọc đỏ-trắng trên đường ray
    for (let i = 0; i < 3; i++) { x.fillStyle = i % 2 ? '#8A5A30' : '#7A4A22'; x.fillRect(30, 160 + i * 70, 240, 64); x.strokeStyle = '#4A2A12'; x.lineWidth = 6; x.strokeRect(30, 160 + i * 70, 240, 64); x.beginPath(); x.moveTo(30, 160 + i * 70); x.lineTo(270, 224 + i * 70); x.moveTo(270, 160 + i * 70); x.lineTo(30, 224 + i * 70); x.stroke() }
    x.fillStyle = '#4A2A12'; x.fillRect(40, 40, 24, 340); x.fillRect(236, 40, 24, 340);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#FFFFFF' : '#E8203A'; x.beginPath(); x.moveTo(20 + i * 34, 60); x.lineTo(54 + i * 34, 60); x.lineTo(40 + i * 34, 120); x.lineTo(6 + i * 34, 120); x.closePath(); x.fill() }
    x.strokeStyle = '#1A0A04'; x.lineWidth = 4; x.strokeRect(10, 60, 280, 60); circ(x, 150, 36, 18, '#FF3A2A'); circ(x, 150, 36, 8, '#FFE0A0'); return;
  }
  if (t === 'crystal') {   // khối pha lê sáng chắn ray
    x.fillStyle = rg(x, 150, 220, 10, 190, ['#FFFFFFcc', '#7AF0FF66', '#7AF0FF00']); x.fillRect(0, 30, 300, 350);
    [[150, 40, 70], [80, 150, 46], [220, 130, 50], [40, 250, 30], [260, 240, 32]].forEach(([a2, b2, w]) => { path(x, [a2, b2, a2 + w * .55, b2 + 90, a2 + w * .4, 380, a2 - w * .4, 380, a2 - w * .55, b2 + 90], '#2EC8E8'); path(x, [a2, b2, a2 - w * .55, b2 + 90, a2 - w * .4, 380, a2, 380], '#A8F4FF'); x.fillStyle = '#FFFFFFaa'; x.fillRect(a2 - w * .2, b2 + 60, w * .1, 200) }); return;
  }
  if (t === 'jungle' || t === 'clouds' || t === 'falls') {   // tượng đá đầu thú rêu phong
    const b = t === 'jungle' ? '#9A9A84' : t === 'falls' ? '#8E9A80' : '#C8B490';
    stoneBlock(x, 20, 300, 260, 80, shade(b, -.1), r, st.mossP); stoneBlock(x, 40, 120, 220, 190, b, r, st.mossP); stoneBlock(x, 60, 20, 180, 110, shade(b, .08), r, st.mossP);
    x.fillStyle = shade(b, -.55); x.fillRect(90, 56, 36, 26); x.fillRect(174, 56, 36, 26); x.fillRect(110, 170, 80, 40); x.fillStyle = '#F2EAD0'; for (let i = 0; i < 4; i++) path(x, [114 + i * 20, 170, 124 + i * 20, 170, 119 + i * 20, 190], '#F2EAD0');
    x.fillStyle = '#FF3A2A'; x.fillRect(100, 62, 14, 12); x.fillRect(184, 62, 14, 12); glyph(x, 150, 260, 20, shade(b, -.5));
    if (st.mossP) { x.fillStyle = '#4E8A2Ecc'; for (let i = 0; i < 14; i++) { const px = 40 + r() * 220; x.fillRect(px, 20 + r() * 40, 8, 30 + r() * 60) } }
  } else if (t === 'cave') {
    path(x, [10, 380, 30, 160, 110, 40, 200, 30, 270, 140, 292, 380], '#2E201C'); path(x, [30, 160, 110, 40, 200, 30, 170, 150, 90, 380, 10, 380], '#46322C');
    x.strokeStyle = '#FF7A1A'; x.lineWidth = 5; x.shadowColor = '#FFAA3A'; x.shadowBlur = 14; for (let i = 0; i < 6; i++) { x.beginPath(); let px = 60 + r() * 180, py = 80 + r() * 100; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (r() - .5) * 50; py += 40; x.lineTo(px, py) } x.stroke() } x.shadowBlur = 0;
  } else if (t === 'ice') {
    path(x, [20, 380, 40, 120, 150, 10, 260, 110, 280, 380], '#3E7AC0'); path(x, [40, 120, 150, 10, 130, 200, 100, 380, 20, 380], '#7FB8F0'); path(x, [150, 10, 260, 110, 280, 380, 200, 380, 180, 160], '#2A5A9A');
    x.fillStyle = '#FFFFFFaa'; x.fillRect(70, 140, 10, 180); x.fillRect(96, 90, 6, 120); path(x, [20, 140, 150, 20, 280, 130, 260, 110, 150, 10, 40, 120], '#FFFFFF');
  } else {   // tượng vệ binh bằng vàng
    stoneBlock(x, 20, 310, 260, 70, '#6A5420', r, 0);
    x.fillStyle = lg(x, 50, 0, 250, 0, ['#0E0A14', '#4A3A5A', '#2E2440', '#0A0610']); x.fillRect(60, 110, 180, 210); x.fillRect(80, 20, 140, 110); x.strokeStyle = '#FFD23F'; x.lineWidth = 6; x.strokeRect(60, 110, 180, 210); x.strokeRect(80, 20, 140, 110);
    x.fillStyle = '#6A4A08'; x.fillRect(100, 52, 34, 24); x.fillRect(166, 52, 34, 24); x.fillRect(118, 96, 64, 14); x.fillRect(80, 150, 140, 10); x.fillRect(80, 230, 140, 10);
    x.fillStyle = '#FF3A3A'; x.fillRect(108, 58, 16, 12); x.fillRect(176, 58, 16, 12); glyph(x, 150, 200, 22, '#8A6A1E'); x.fillStyle = '#FFF6C8'; x.fillRect(66, 116, 10, 200);
  }
}
function lanternArt(x, r) {   // đèn đá kiểu Nhật (300 × 380)
  stoneBlock(x, 60, 330, 180, 50, '#9A9088', r, 0); stoneBlock(x, 112, 206, 76, 130, '#B4AAA0', r, 0); stoneBlock(x, 50, 176, 200, 36, '#A89E94', r, 0);
  x.fillStyle = '#C4BAB0'; x.fillRect(80, 94, 140, 84); x.fillStyle = rg(x, 150, 136, 4, 64, ['#FFF6C0', '#FFB040', '#FF804000']); x.fillRect(98, 106, 104, 60); x.fillStyle = '#5A5048'; x.fillRect(146, 100, 8, 70);
  path(x, [14, 98, 286, 98, 222, 48, 78, 48], '#8A8078'); path(x, [14, 98, 34, 84, 266, 84, 286, 98], '#A49A90'); circ(x, 150, 34, 22, '#9A9088');
}
function rootArt(x, st, r) {   // rễ cây khổng lồ / khúc gỗ chắn ngang đường (phải NHẢY)
  if (st.tunnel) {   // cây gỗ chống hầm đổ ngang đường ray, sơn sọc cảnh báo
    x.fillStyle = lg(x, 0, 50, 0, 180, ['#A8743E', '#7A4A22', '#3A2210']); x.fillRect(20, 56, 760, 120); x.fillStyle = '#C8945A'; x.beginPath(); x.ellipse(24, 116, 26, 60, 0, 0, 7); x.fill(); x.strokeStyle = '#7A4A22'; x.lineWidth = 4; x.beginPath(); x.ellipse(24, 116, 14, 32, 0, 0, 7); x.stroke();
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#1A1208' : '#FFD23F'; x.fillRect(120 + i * 56, 56, 28, 120) } return;
  }
  if (st.bg === 'desert') {   // cột đá đổ ngang đường
    x.fillStyle = lg(x, 0, 40, 0, 190, ['#8E9EAE', '#5A6A7A', '#2E3A48']); x.fillRect(40, 44, 720, 146); x.fillStyle = '#7A8A9A'; x.beginPath(); x.ellipse(40, 117, 34, 73, 0, 0, 7); x.fill(); x.strokeStyle = '#3E4A58'; x.lineWidth = 5; x.beginPath(); x.ellipse(40, 117, 20, 46, 0, 0, 7); x.stroke();
    x.strokeStyle = '#2E3A4888'; x.lineWidth = 3; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(60, 62 + i * 28); x.lineTo(760, 62 + i * 28); x.stroke() } for (let i = 0; i < 6; i++) glyph(x, 140 + i * 110, 117, 16, '#E8C050');
    path(x, [760, 44, 790, 80, 770, 110, 796, 150, 760, 190], '#4A5A6A'); return;
  }
  if (st.bg === 'sakura') {   // bó tre buộc dây
    for (const [y, h] of [[120, 70], [60, 70], [90, 66]]) { x.fillStyle = lg(x, 0, y, 0, y + h, ['#B8E070', '#6AA83A', '#3E7A22']); x.fillRect(10, y, 780, h); x.fillStyle = '#4E8A2A'; for (let i = 1; i < 6; i++) x.fillRect(i * 130, y, 10, h); x.fillStyle = '#E0F4A0'; x.fillRect(10, y + 8, 780, 6) }
    x.fillStyle = '#C8A060'; x.fillRect(220, 50, 26, 146); x.fillRect(560, 50, 26, 146); return;
  }
  const t = st.bg, cols = t === 'cave' ? ['#1A1210', '#3A2A24', '#5A4034'] : t === 'ice' ? ['#4A3426', '#7A5A40', '#A07A58'] : t === 'gold' ? ['#2A0E08', '#6A1E14', '#A8402A'] : ['#3A2414', '#6B4424', '#9A6A3E'];
  x.lineCap = 'round';
  const curve = (w, col, dy) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(0, 170 + dy); x.bezierCurveTo(180, 40 + dy, 320, 120 + dy, 420, 80 + dy); x.bezierCurveTo(540, 40 + dy, 660, 120 + dy, 800, 160 + dy); x.stroke() };
  curve(96, cols[0], 8); curve(80, cols[1], 0); curve(30, cols[2], -18);
  x.strokeStyle = cols[0]; x.lineWidth = 34; x.beginPath(); x.moveTo(250, 100); x.quadraticCurveTo(300, 170, 360, 200); x.stroke(); x.beginPath(); x.moveTo(560, 80); x.quadraticCurveTo(520, 160, 470, 200); x.stroke();
  x.strokeStyle = cols[1]; x.lineWidth = 20; x.beginPath(); x.moveTo(250, 100); x.quadraticCurveTo(300, 165, 350, 196); x.stroke();
  x.strokeStyle = shade(cols[0], -.3); x.lineWidth = 4; for (let i = 0; i < 12; i++) { const px = 40 + i * 62; x.beginPath(); x.moveTo(px, 120 - Math.sin(i) * 20); x.lineTo(px + 30, 110 - Math.sin(i + 1) * 20); x.stroke() }
  if (t === 'jungle' || t === 'clouds' || t === 'falls') { x.fillStyle = '#4E9A3A'; for (let i = 0; i < 16; i++) { x.beginPath(); x.ellipse(40 + r() * 720, 80 + r() * 60, 12, 6, r() * 3, 0, 7); x.fill() } }
  if (t === 'ice') { x.strokeStyle = '#FFFFFF'; x.lineWidth = 16; x.beginPath(); x.moveTo(10, 140); x.bezierCurveTo(180, 12, 320, 92, 420, 52); x.bezierCurveTo(540, 12, 660, 92, 790, 132); x.stroke() }
  if (t === 'cave') { x.fillStyle = '#FF7A1A'; x.shadowColor = '#FFAA3A'; x.shadowBlur = 12; for (let i = 0; i < 14; i++) circ(x, 40 + r() * 720, 90 + r() * 50, 4 + r() * 4, '#FF8A2A'); x.shadowBlur = 0 }
}
function archArt(x, st, r) {   // cổng vòm thấp: 2 cột + xà đá chạm khắc (phải TRƯỢT dưới xà)
  const b = st.wall[0], hi = st.wall[1];
  if (st.tunnel) {   // xà gỗ thấp trong hầm (cúi xuống) có sọc vàng-đen cảnh báo + đèn treo
    const top = Math.round(520 * (1 - (BEAM[1] + 30) / 620)), bot = Math.round(520 * (1 - BEAM[0] / 620));
    for (const px of [0, 646]) { x.fillStyle = '#5A3A1E'; x.fillRect(px, top - 30, 54, 560) }
    x.fillStyle = lg(x, 0, top, 0, bot, ['#9A6A3A', '#7A4A22', '#4A2A12']); x.fillRect(0, top, 700, bot - top);
    for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#1A1208' : '#FFD23F'; x.beginPath(); x.moveTo(i * 54, bot - 26); x.lineTo(i * 54 + 30, bot - 26); x.lineTo(i * 54 + 54, bot); x.lineTo(i * 54 + 24, bot); x.closePath(); x.fill() }
    x.strokeStyle = '#2A2A30'; x.lineWidth = 4; x.beginPath(); x.moveTo(350, bot); x.lineTo(350, bot + 30); x.stroke(); x.fillStyle = rg(x, 350, bot + 50, 2, 60, ['#FFF2B0', '#FFB040aa', '#FF804000']); x.fillRect(290, bot - 10, 120, 120); x.fillStyle = '#3A3A42'; x.fillRect(336, bot + 28, 28, 8); return;
  }
  if (st.bg === 'sakura') {   // xà cổng torii đỏ
    const top = Math.round(520 * (1 - (BEAM[1] + 30) / 620)), bot = Math.round(520 * (1 - BEAM[0] / 620));
    for (const px of [0, 640]) { x.fillStyle = lg(x, px, 0, px + 60, 0, ['#8A1A22', '#E8584E', '#7A1018']); x.fillRect(px, top - 40, 60, 560) }
    x.fillStyle = lg(x, 0, top, 0, bot, ['#E8584E', '#C8323A', '#8A1A22']); x.fillRect(0, top, 700, bot - top);
    x.fillStyle = '#1E1A1E'; x.beginPath(); x.moveTo(-10, top - 50); x.quadraticCurveTo(350, top - 20, 710, top - 50); x.lineTo(700, top - 6); x.quadraticCurveTo(350, top + 14, 0, top - 6); x.closePath(); x.fill();
    x.fillStyle = '#E8C050'; x.fillRect(320, top + 6, 60, bot - top - 12); x.fillStyle = '#1E1A1E'; x.fillRect(336, top + 16, 28, bot - top - 32); return;
  }
  for (let y = 520; y > 0; y -= 64) { stoneBlock(x, 0, y - 64, 52, 64, b, r, st.mossP); stoneBlock(x, 648, y - 64, 52, 64, b, r, st.mossP) }
  const top = Math.round(520 * (1 - (BEAM[1] + 30) / 620)), bot = Math.round(520 * (1 - BEAM[0] / 620));
  for (let i = 0; i < 7; i++) stoneBlock(x, i * 100, top, 100, bot - top, hi, r, st.mossP);
  x.fillStyle = shade(hi, -.4); x.fillRect(0, bot - 10, 700, 10);
  for (let i = 0; i < 6; i++) glyph(x, 60 + i * 116, (top + bot) / 2, 18, shade(hi, -.5));
  stoneBlock(x, 300, top - 70, 100, 74, hi, r, 0); x.fillStyle = shade(hi, -.55); x.fillRect(318, top - 50, 22, 16); x.fillRect(360, top - 50, 22, 16); x.fillRect(330, top - 20, 40, 10);
  if (st.mossP) { x.fillStyle = '#4E8A2Ecc'; for (let i = 0; i < 26; i++) { const px = r() * 700; x.fillRect(px, bot - 6, 6, 20 + r() * 50) } }
  if (st.bg === 'ice') { for (let i = 0; i < 24; i++) { const px = 10 + r() * 680; path(x, [px, bot, px + 12, bot, px + 6, bot + 20 + r() * 40], '#E0F4FF') } x.fillStyle = '#FFFFFF'; x.fillRect(0, top - 8, 700, 12) }
}
function templeGate(x, st, r) {   // cổng đền đích mỗi màn
  const b = st.wall[0], hi = st.wall[1];
  if (st.bg === 'sakura') {   // cổng torii lớn
    x.fillStyle = rg(x, 380, 460, 20, 300, ['#FFF8E8', '#FFD8E0cc', '#FFC8D833']); x.fillRect(150, 200, 460, 500);
    for (const px of [130, 570]) { x.fillStyle = lg(x, px, 0, px + 64, 0, ['#8A1A22', '#E8584E', '#7A1018']); x.fillRect(px, 120, 64, 580); x.fillStyle = '#1E1A1E'; x.fillRect(px - 8, 660, 80, 40) }
    x.fillStyle = '#C8323A'; x.fillRect(80, 230, 600, 40); x.fillStyle = '#E8584E'; x.fillRect(60, 120, 640, 46);
    x.fillStyle = '#1E1A1E'; x.beginPath(); x.moveTo(20, 60); x.quadraticCurveTo(380, 110, 740, 60); x.lineTo(720, 122); x.quadraticCurveTo(380, 150, 40, 122); x.closePath(); x.fill();
    x.fillStyle = '#E8C050'; x.fillRect(330, 160, 100, 76); x.font = '900 40px Nunito,sans-serif'; x.textAlign = 'center'; x.lineWidth = 8; x.strokeStyle = '#5A1A10'; x.strokeText('🏁 ĐÍCH', 380, 420); x.fillStyle = '#FFF6E8'; x.fillText('🏁 ĐÍCH', 380, 420); return;
  }
  for (let y = 700; y > 120; y -= 80) { stoneBlock(x, 0, y - 80, 130, 80, b, r, st.mossP); stoneBlock(x, 630, y - 80, 130, 80, b, r, st.mossP) }
  for (let i = 0; i < 8; i++) stoneBlock(x, i * 95, 60, 95, 90, hi, r, st.mossP); for (let i = 0; i < 6; i++) stoneBlock(x, 60 + i * 107, 0, 107, 64, b, r, st.mossP);
  x.fillStyle = rg(x, 380, 420, 20, 300, ['#FFF8D0', '#FFE58Acc', '#FFD23F33']); x.fillRect(130, 150, 500, 550);
  circ(x, 380, 105, 52, shade(hi, .1)); circ(x, 380, 105, 40, shade(hi, -.2)); x.fillStyle = shade(hi, -.6); x.fillRect(356, 90, 16, 12); x.fillRect(388, 90, 16, 12); x.fillRect(364, 116, 32, 8);
  for (let i = 0; i < 4; i++) { glyph(x, 65, 220 + i * 120, 26, shade(b, -.5)); glyph(x, 695, 220 + i * 120, 26, shade(b, -.5)) }
  if (st.mossP) { x.fillStyle = '#4E8A2Ecc'; for (let i = 0; i < 30; i++) x.fillRect(r() * 760, 140 + r() * 20, 7, 30 + r() * 90) }
  x.font = '900 46px Nunito,sans-serif'; x.textAlign = 'center'; x.lineWidth = 8; x.strokeStyle = '#5A3A10'; x.strokeText('🏁 ĐÍCH', 380, 330); x.fillStyle = '#FFF6C8'; x.fillText('🏁 ĐÍCH', 380, 330);
}
function skullGate(x, r) {   // cổng đầu lâu khổng lồ giữ tượng vàng (màn cuối)
  const bone = '#D8C8A0';
  x.fillStyle = lg(x, 0, 0, 0, 700, ['#E8DCB8', '#C8B488', '#9A8660']); x.beginPath(); x.moveTo(40, 700); x.lineTo(40, 300); x.bezierCurveTo(40, 40, 720, 40, 720, 300); x.lineTo(720, 700); x.closePath(); x.fill();
  x.fillStyle = '#2A1A10'; x.beginPath(); x.ellipse(240, 250, 92, 76, -.15, 0, 7); x.fill(); x.beginPath(); x.ellipse(520, 250, 92, 76, .15, 0, 7); x.fill();
  for (const ex of [240, 520]) { x.fillStyle = rg(x, ex, 260, 4, 70, ['#FFF6C8', '#FFB02A', '#FF5A1A00']); x.beginPath(); x.arc(ex, 260, 70, 0, 7); x.fill(); path(x, [ex - 30, 280, ex, 196, ex + 30, 280], '#FFD23F') }
  path(x, [380, 300, 344, 380, 416, 380], '#2A1A10');
  for (let i = 0; i < 6; i++) { stoneBlock(x, 200 + i * 60, 410, 56, 70, bone, r, 0) }
  x.fillStyle = '#1A0E08'; x.fillRect(200, 480, 360, 220);
  x.fillStyle = rg(x, 380, 600, 10, 220, ['#FFF8D0', '#FFD23Fcc', '#FF9A1A22']); x.fillRect(210, 480, 340, 220);
  x.strokeStyle = '#6A5A48'; x.lineWidth = 8; for (const cx of [120, 640]) { x.beginPath(); for (let j = 0; j < 10; j++) { x.moveTo(cx - 8, 300 + j * 40); x.ellipse(cx, 316 + j * 40, 10, 16, 0, 0, 7) } x.stroke() }
  x.font = '900 44px Nunito,sans-serif'; x.textAlign = 'center'; x.lineWidth = 8; x.strokeStyle = '#5A3A10'; x.strokeText('👑 ĐÍCH', 380, 560); x.fillStyle = '#FFF6C8'; x.fillText('👑 ĐÍCH', 380, 560);
}
function overlayArt(x, st, r) {   // khung cảnh tiền cảnh trên cùng: dây leo (rừng) · nhũ đá (hang) · băng (đền băng) · xích đèn (đền vàng)
  const t = st.bg;
  if (t === 'sakura') { for (const [sx, dir] of [[0, 1], [1024, -1]]) { x.lineCap = 'round'; x.strokeStyle = '#4A2A22'; x.lineWidth = 12; x.beginPath(); x.moveTo(sx, 14); x.quadraticCurveTo(sx + dir * 170, 30, sx + dir * 320, 110); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(sx + dir * 150, 34); x.quadraticCurveTo(sx + dir * 200, 110, sx + dir * 190, 170); x.stroke(); leafy(x, r, sx + dir * 140, 40, 100, ['#C8608A', '#F49AB6', '#FBC4D4', '#FFE6EE'], 12); leafy(x, r, sx + dir * 300, 110, 64, ['#C8608A', '#F49AB6', '#FFE6EE'], 8); leafy(x, r, sx + dir * 190, 170, 50, ['#E07AA8', '#FBC4D4'], 6) } return }
  if (t === 'jungle' || t === 'clouds' || t === 'falls') {
    if (t === 'clouds') return; const sides = [[0, 300], [1024, 300]];
    for (const [sx, w] of sides) { const dir = sx ? -1 : 1; for (let i = 0; i < 9; i++) { const vx = sx + dir * r() * w, L = 120 + r() * 300; x.strokeStyle = i % 2 ? '#1E5A22' : '#2E7A2A'; x.lineWidth = 4 + r() * 4; x.beginPath(); x.moveTo(vx, 0); x.quadraticCurveTo(vx + dir * 40, L * .5, vx + dir * (10 + r() * 30), L); x.stroke(); for (let j = 20; j < L; j += 26) { x.fillStyle = j % 52 ? '#3E8A2E' : '#5EAA3E'; x.beginPath(); x.ellipse(vx + dir * (j / L) * 30 + (r() - .5) * 8, j, 10, 5, dir * .6 + (r() - .5), 0, 7); x.fill() } } leafy(x, r, sx + dir * 60, 0, 120, ['#123E1E', '#1E5A2A', '#2E7A34', '#4C9A3E'], 10) }
  } else if (t === 'cave') { for (let i = 0; i < 26; i++) { const px = r() * 1024, L = 30 + r() * (px < 260 || px > 760 ? 200 : 60); path(x, [px - 18, 0, px + 18, 0, px + 2, L], i % 2 ? '#2A1612' : '#3A201A') } }
  else if (t === 'ice') { for (let i = 0; i < 40; i++) { const px = r() * 1024, L = 16 + r() * (px < 260 || px > 760 ? 110 : 30); path(x, [px - 8, 0, px + 8, 0, px, L], '#E4F4FFee') } x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 1024, 8) }
  else if (0) { for (const cx of [60, 964]) { x.strokeStyle = '#B8902E'; x.lineWidth = 6; x.beginPath(); for (let j = 0; j < 7; j++) { x.moveTo(cx + 9, j * 26); x.ellipse(cx, j * 26 + 10, 9, 13, 0, 0, 7) } x.stroke(); x.fillStyle = '#E8C252'; x.fillRect(cx - 26, 190, 52, 54); x.fillStyle = rg(x, cx, 216, 2, 60, ['#FFF6C8', '#FFB02A88', '#FFB02A00']); x.fillRect(cx - 60, 156, 120, 120) } }
}
function bgLayers() {   // trời + cảnh xa (vẽ sẵn, cuộn ngang theo khúc cua)
  const st = STAGES[S.level], W = 2048, H = 512, t = st.bg, r = rng(S.level * 7 + 1);
  const sky = cnv(4, 256, x => { x.fillStyle = lg(x, 0, 0, 0, 256, st.sky); x.fillRect(0, 0, 4, 256) });
  const far = cnv(W, H, x => {
    const ridge = (col, y0, amp, step, fn) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= W; i += step) x.lineTo(i, y0 - (fn ? fn(i) : r() * amp)); x.lineTo(W, H); x.closePath(); x.fill() };
    if (t === 'jungle') {
      for (let i = 0; i < 9; i++) { x.fillStyle = '#FFFFFF14'; path(x, [200 + i * 220, 0, 300 + i * 220, 0, 160 + i * 220 + 200, H, 60 + i * 220 + 200, H], '#FFFFFF10') }
      [['#8EC4B2', 330, .55], ['#6AAA92', 380, .8], ['#4A8E74', 430, 1]].forEach(([col, base, s], j) => {
        for (let i = 0; i < 14; i++) { const tx = (i * 157 + j * 70) % W, tw = (30 + r() * 30) * s; x.fillStyle = col; x.fillRect(tx - tw / 2, 60 + r() * 60, tw, H); leafy(x, r, tx, 70 + r() * 60, 120 * s, [col, shade(col, .08)], 8) }
        ridge(col, base, 50 * s, 40);
      });
      const px = 1300; for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#7EA890' : '#88B49A'; x.fillRect(px - 200 + i * 40, 180 + i * 40, 400 - i * 80, 44) } x.fillStyle = '#6E9A82'; x.fillRect(px - 50, 120, 100, 70); circ(x, px, 150, 26, '#8EBCA2');
      x.fillStyle = lg(x, 0, 300, 0, H, ['#C8E8DA00', st.fog]); x.fillRect(0, 300, W, H - 300);
    } else if (t === 'clouds') {
      x.fillStyle = rg(x, 1400, 330, 20, 420, ['#FFF6D8', '#FFD89Acc', '#FFB07A00']); x.fillRect(900, 0, 1000, H); circ(x, 1400, 330, 70, '#FFF2C8');
      for (let i = 0; i < 6; i++) { const ix = 150 + i * 340 + r() * 80, iy = 180 + r() * 120, iw = 90 + r() * 90; path(x, [ix - iw, iy, ix + iw, iy, ix + iw * .4, iy + iw * .7, ix, iy + iw * 1.2, ix - iw * .5, iy + iw * .6], '#C07A6A'); x.fillStyle = '#B0706088'; x.beginPath(); x.ellipse(ix, iy, iw, 14, 0, 0, 7); x.fill(); x.fillStyle = '#A0606A'; x.fillRect(ix - 20, iy - 60, 14, 60); x.fillRect(ix + 10, iy - 44, 12, 44); x.fillRect(ix - 26, iy - 66, 54, 10) }
      [['#FFE0C0', 400], ['#FFD0B0', 450], ['#FFEEDA', 490]].forEach(([col, y]) => { for (let i = 0; i < 40; i++) circ(x, (i * 53 + y) % W, y + r() * 20, 40 + r() * 50, col) });
    } else if (t === 'cave') {
      x.fillStyle = '#1A0A08'; for (let i = 0; i < W; i += 46) path(x, [i, 0, i + 46, 0, i + 23 + (r() - .5) * 20, 60 + r() * 160], '#1A0A08');
      for (let i = 0; i < 5; i++) { const lx = 200 + i * 420 + r() * 100; x.fillStyle = lg(x, lx - 20, 0, lx + 20, 0, ['#FF5A1A00', '#FFAA3A', '#FF5A1A00']); x.fillRect(lx - 24, 80 + r() * 60, 48, H) }
      ridge('#3A1610', 400, 160, 60); ridge('#2A100C', 460, 90, 44);
      x.fillStyle = lg(x, 0, 400, 0, H, ['#FF5A1A00', '#FF6A1Acc']); x.fillRect(0, 400, W, H - 400);
    } else if (t === 'ice') {
      for (let j = 0; j < 2; j++) for (let i = -1; i < 9; i++) { const m = i * 260 + j * 130 + r() * 60, h = 200 + r() * 140 - j * 60; path(x, [m - 230, H, m, H - h - 120, m + 230, H], j ? '#B8D2EE' : '#90B4DC'); path(x, [m, H - h - 120, m - 70, H - h - 30, m - 30, H - h - 50, m, H - h - 20, m + 40, H - h - 54, m + 70, H - h - 30], '#FFFFFF'); path(x, [m, H - h - 120, m + 230, H, m + 120, H], '#00305018') }
      const tx = 900; for (let i = 0; i < 6; i++) { x.fillStyle = '#D8ECFF'; x.fillRect(tx + i * 60, 260, 30, 200) } x.fillStyle = '#EAF6FF'; x.fillRect(tx - 20, 240, 360, 30); x.beginPath(); x.moveTo(tx - 10, 240); x.quadraticCurveTo(tx + 160, 120, tx + 330, 240); x.fill();
      x.fillStyle = lg(x, 0, 380, 0, H, ['#EAF4FF00', st.fog]); x.fillRect(0, 380, W, H - 380);
    } else if (t === 'mine' || t === 'crystal') {   // cuối đường hầm tối, ánh đuốc / pha lê xa xa
      const gl = t === 'mine' ? ['#FFB04A55', '#FF804022', '#FF804000'] : ['#B890FF55', '#7A50FF22', '#7A50FF00'];
      x.fillStyle = '#050302'; x.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { x.fillStyle = rg(x, i * 260 + 130, 400, 10, 200, gl); x.fillRect(i * 260 - 70, 200, 400, 312) }
    } else if (t === 'desert') {
      x.fillStyle = rg(x, 600, 150, 10, 300, ['#FFFFF4', '#FFF2C0aa', '#FFE8A000']); x.fillRect(300, 0, 600, 450); circ(x, 600, 150, 48, '#FFF8E4');
      [[1150, 300, 270], [1480, 230, 210], [1760, 330, 150], [320, 360, 130], [860, 400, 90]].forEach(([px, h, w]) => { path(x, [px - w, 440, px, 440 - h, px + w, 440], '#E6BE80'); path(x, [px, 440 - h, px + w, 440, px + w * .15, 440], '#B88A4E'); x.strokeStyle = '#C8985A66'; x.lineWidth = 2; for (let k = 1; k < 8; k++) { const yy = 440 - h + h * k / 8; x.beginPath(); x.moveTo(px - w * k / 8, yy); x.lineTo(px + w * k / 8, yy); x.stroke() } });
      ridge('#EAC890', 452, 0, 30, i => Math.sin(i * .004) * 26 + 20); ridge('#DDB070', 480, 0, 30, i => Math.sin(i * .006 + 2) * 20 + 14);
      x.fillStyle = lg(x, 0, 380, 0, H, ['#F0DDB400', st.fog]); x.fillRect(0, 380, W, H - 380);
    } else if (t === 'falls') {
      for (let i = 0; i < 6; i++) { x.strokeStyle = ['#FF6A6A44', '#FFB04A44', '#FFE85A44', '#6AE06A44', '#5AB0FF44', '#A06AFF44'][i]; x.lineWidth = 16; x.beginPath(); x.arc(1000, 560, 400 - i * 16, Math.PI, 0); x.stroke() }
      for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) { const cx = i * 270 + j * 135 + r() * 60, w = 110 + r() * 70, top = 70 + r() * 110 + j * 80, col = j ? '#5E8A6A' : '#86AE92';
        path(x, [cx - w, H, cx - w * .85, top + 40, cx - w * .3, top, cx + w * .4, top + 14, cx + w, H], col); leafy(x, r, cx, top + 6, w * .7, [shade(col, -.12), shade(col, .1)], 7);
        if (r() < .75) { x.fillStyle = lg(x, cx - 24, 0, cx + 24, 0, ['#FFFFFF00', '#F4FFFFee', '#FFFFFF00']); x.fillRect(cx - 24 - j * 6, top + 24, 48 + j * 12, H - top) } }
      x.fillStyle = lg(x, 0, 320, 0, H, ['#FFFFFF00', '#FFFFFF99', st.fog]); x.fillRect(0, 320, W, H - 320);
    } else if (t === 'sakura') {
      x.fillStyle = rg(x, 1500, 260, 10, 320, ['#FFF4E8', '#FFD8D0aa', '#FFC8D000']); x.fillRect(1180, 0, 640, 520); circ(x, 1500, 260, 62, '#FFEFE4');
      path(x, [480, H, 900, 150, 1010, 140, 1440, H], '#9A88B8'); path(x, [900, 150, 1010, 140, 1080, 232, 1036, 214, 1000, 246, 962, 218, 920, 250, 866, 226], '#FFFFFF');
      ridge('#B49ACA', 430, 0, 30, i => Math.sin(i * .006) * 34 + 26);
      for (const [px, sz] of [[300, 1], [1720, .8], [1240, .6]]) { for (let k2 = 0; k2 < 4; k2++) { const y = 430 - k2 * 50 * sz, w = (110 - k2 * 18) * sz; x.fillStyle = '#7A4A6A'; x.fillRect(px - w * .55, y - 30 * sz, w * 1.1, 30 * sz); path(x, [px - w, y - 30 * sz, px + w, y - 30 * sz, px + w * .7, y - 48 * sz, px - w * .7, y - 48 * sz], '#4A2A44') } x.fillStyle = '#4A2A44'; x.fillRect(px - 3, 430 - 230 * sz, 6, 44 * sz) }
      for (let i = 0; i < 30; i++) leafy(x, r, r() * W, 432 + r() * 40, 46 + r() * 40, ['#D884AC', '#F2AAC6', '#FFD4E0'], 5);
      x.fillStyle = lg(x, 0, 400, 0, H, ['#FADCE600', st.fog]); x.fillRect(0, 400, W, H - 400);
    } else {
      for (let i = 0; i < 160; i++) { x.globalAlpha = .3 + r() * .7; circ(x, r() * W, r() * 300, r() * 1.8 + .4, '#FFFFFF') } x.globalAlpha = 1;
      x.fillStyle = rg(x, 400, 110, 10, 120, ['#FFF8E0', '#FFF4C8aa', '#FFF4C800']); x.fillRect(280, 0, 240, 240); circ(x, 400, 110, 40, '#FFF6D8');
      ridge('#1E1838', 400, 80, 30); const px = 1300; for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#3A2A4E' : '#44325A'; x.fillRect(px - 300 + i * 50, 150 + i * 50, 600 - i * 100, 54) } x.fillStyle = '#FFD23F'; x.fillRect(px - 40, 110, 80, 50); x.fillStyle = rg(x, px, 130, 4, 140, ['#FFE58Acc', '#FFD23F00']); x.fillRect(px - 150, 0, 300, 280);
      for (let i = 0; i < 12; i++) { x.fillStyle = '#FFD23F99'; x.fillRect(px - 260 + r() * 520, 220 + r() * 200, 10, 14) }
      ridge('#141028', 460, 60, 26);
      x.fillStyle = lg(x, 0, 400, 0, H, ['#2E244800', st.fog]); x.fillRect(0, 400, W, H - 400);
    }
  });
  return { sky, far, tex: makeTex(st, S.level), over: img('overlay') };
}
/* lớp phía dưới đường (nước / biển mây / dung nham / băng / vực tối) có gợn chuyển động theo tốc độ chạy */
function drawBelow(st, hz, camX) {
  const t = st.under; ctx.fillStyle = (() => { const g = ctx.createLinearGradient(0, hz, 0, VH); st.base.forEach((c, i) => g.addColorStop(i / (st.base.length - 1), c)); return g })(); ctx.fillRect(0, hz, VW, VH - hz);
  const ZS = 900, N = 28, dY = CAMH + DEPTH;
  for (let i = N - 1; i >= 0; i--) {
    const z = ((i * ZS - pos) % (N * ZS) + N * ZS) % (N * ZS) + 400, sc = CAMD / z, y = hz + sc * dY * U, a = Math.min(1, (N * ZS - z) / (N * ZS) * 1.6), w = sc * 9000 * U;
    if (y > VH + 40) continue;
    const xs = VW / 2 - camX * sc * U;
    if (t === 'water' || t === 'ice' || t === 'abyss') {
      ctx.globalAlpha = a * (t === 'abyss' ? .35 : .45); ctx.strokeStyle = t === 'water' ? '#BFF0E0' : t === 'ice' ? '#FFFFFF' : '#FFD23F'; ctx.lineWidth = Math.max(1, sc * 30 * U);
      for (let k = -6; k <= 6; k++) { const xx = xs + (k + ((i * 37) % 10) / 10) * w * .2; ctx.beginPath(); ctx.moveTo(xx - w * .05, y); ctx.quadraticCurveTo(xx, y - sc * 40 * U, xx + w * .05, y); ctx.stroke() }
      if (t === 'ice' && i % 3 === 0) { ctx.globalAlpha = a; ctx.fillStyle = '#F4FBFF'; const bx = xs + ((i * 53) % 7 - 3) * w * .14; ctx.beginPath(); ctx.ellipse(bx, y, sc * 500 * U, sc * 120 * U, 0, 0, 7); ctx.fill() }
    } else if (t === 'clouds') {
      ctx.globalAlpha = a * .9; ctx.fillStyle = i % 2 ? '#FFF1DC' : '#FFE2C4';
      for (let k = -4; k <= 4; k++) { const xx = xs + (k + ((i * 29) % 10) / 10) * w * .26; ctx.beginPath(); ctx.ellipse(xx, y, sc * 900 * U, sc * 260 * U, 0, 0, 7); ctx.fill() }
    } else if (t === 'sand') {
      ctx.globalAlpha = a * .5; ctx.strokeStyle = i % 2 ? '#B8864A' : '#FFF0C8'; ctx.lineWidth = Math.max(1, sc * 40 * U);
      for (let k = -6; k <= 6; k++) { const xx = xs + (k + ((i * 37) % 10) / 10) * w * .2; ctx.beginPath(); ctx.moveTo(xx - w * .09, y); ctx.quadraticCurveTo(xx, y - sc * 120 * U, xx + w * .09, y); ctx.stroke() }
    } else if (t === 'river') {
      ctx.globalAlpha = a * .75; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1, sc * 45 * U);
      for (let k = -8; k <= 8; k++) { const xx = xs + (k + ((i * 37 + (S.tick >> 2)) % 10) / 10) * w * .15; ctx.beginPath(); ctx.moveTo(xx - w * .04, y); ctx.quadraticCurveTo(xx, y - sc * 70 * U, xx + w * .04, y); ctx.stroke() }
    } else if (t === 'pond') {
      ctx.globalAlpha = a * .35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1, sc * 30 * U);
      for (let k = -5; k <= 5; k++) { const xx = xs + (k + ((i * 37) % 10) / 10) * w * .22; ctx.beginPath(); ctx.ellipse(xx, y, w * .05, sc * 40 * U, 0, 0, 7); ctx.stroke() }
      ctx.globalAlpha = a * .9; for (let k = -4; k <= 4; k++) { const xx = xs + (k + ((i * 53) % 10) / 10) * w * .25; ctx.fillStyle = (i + k) % 3 ? '#FFB4CC' : '#FFFFFF'; ctx.beginPath(); ctx.ellipse(xx, y - sc * 20 * U, Math.max(1, sc * 60 * U), Math.max(.6, sc * 26 * U), k, 0, 7); ctx.fill() }
      if (i % 4 === 0) { const kx = xs + Math.sin(S.tick * .01 + i) * w * .4; ctx.fillStyle = i % 8 ? '#FF8A2A' : '#FFFFFF'; ctx.beginPath(); ctx.ellipse(kx, y + sc * 60 * U, Math.max(1, sc * 220 * U), Math.max(.6, sc * 70 * U), 0, 0, 7); ctx.fill(); ctx.fillStyle = '#E04A1A'; ctx.beginPath(); ctx.arc(kx, y + sc * 60 * U, Math.max(.5, sc * 50 * U), 0, 7); ctx.fill() }
    } else if (t === 'lava') {
      ctx.globalAlpha = a * .8; ctx.strokeStyle = i % 2 ? '#FFD23F' : '#FF8A2A'; ctx.lineWidth = Math.max(1, sc * 50 * U);
      for (let k = -5; k <= 5; k++) { const xx = xs + (k + ((i * 41) % 10) / 10) * w * .22; ctx.beginPath(); ctx.moveTo(xx - w * .06, y); ctx.lineTo(xx, y + sc * 30 * U); ctx.lineTo(xx + w * .07, y - sc * 10 * U); ctx.stroke() }
    }
  }
  ctx.globalAlpha = 1;
}
function project(p, camX, camY, camZ) {
  p.camera.x = -camX; p.camera.y = (p.world.y || 0) - camY; p.camera.z = p.world.z - camZ;
  p.screen.scale = CAMD / p.camera.z; p.screen.x = VW / 2 + p.screen.scale * p.camera.x * U; p.screen.y = VH * HZ - p.screen.scale * p.camera.y * U; p.screen.w = p.screen.scale * ROADW * U;
}
function poly(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill() }
function roadTex(seg, a, b) {   // dán mặt đá lát lên đoạn đường (chia dải ngang cho đúng phối cảnh)
  const T = bg.tex, v0 = 512 - (seg.index % 8 + 1) * 64, hgt = a.y - b.y, k = clamp(Math.ceil(hgt / 7), 1, 12);
  for (let j = 0; j < k; j++) {
    const t0 = j / k, t1 = (j + 1) / k, y0 = a.y - hgt * t0, y1 = a.y - hgt * t1, tm = (t0 + t1) / 2, cx = a.x + (b.x - a.x) * tm, w = a.w + (b.w - a.w) * tm;
    ctx.drawImage(T, 0, v0 + 64 * (1 - t1), 256, 64 / k, cx - w, y1, w * 2, y0 - y1 + .8);
  }
}
function tunnelWalls(seg, st) {   // vách đá hai bên + trần hầm
  const a = seg.p1.screen, b = seg.p2.screen, T = 2100, H1 = a.scale * T * U, H2 = b.scale * T * U, f = 1 - seg.fog, n = ((seg.index * 2654435761) >>> 0) % 5;
  for (const sd of [-1, 1]) {
    const x1 = a.x + sd * a.w * 1.04, x2 = b.x + sd * b.w * 1.04, base = shade(st.wall[0], (n - 2) * .04 + (sd < 0 ? .06 : -.06));
    poly([x1, a.y, x2, b.y, x2, b.y - H2, x1, a.y - H1], mix(base, st.fog, f));
    poly([x1, a.y, x2, b.y, x2, b.y - H2 * .08, x1, a.y - H1 * .08], mix(shade(base, -.25), st.fog, f));
    if (seg.index % 3 === 0) { ctx.fillStyle = mix(shade(base, -.3), st.fog, f); ctx.fillRect(Math.min(x1, x2), b.y - H2 * (.3 + n * .1), Math.abs(x2 - x1) + 1, Math.max(1, H1 * .015)) }
    for (let k = 0; k < 3; k++) {   // đá lồi lõm trên vách
      const q = ((seg.index * 7 + k * 13 + (sd > 0 ? 5 : 0)) * 2654435761 >>> 0) % 1000 / 1000, hy = .12 + q * .7, cx = x1 + (x2 - x1) * ((k + .5) / 3), cy = a.y - H1 * hy + (b.y - a.y) * ((k + .5) / 3), rw = Math.max(1, Math.abs(x2 - x1) * .45 + a.w * .02), rh = Math.max(1, H1 * (.05 + q * .06));
      ctx.fillStyle = mix(shade(base, q > .5 ? .14 : -.22), st.fog, f); ctx.beginPath(); ctx.ellipse(cx, cy, rw, rh, 0, 0, 7); ctx.fill();
    }
    if (st.bg === 'crystal' && n === 1) { const cx = (x1 + x2) / 2, cy = (a.y + b.y) / 2 - H1 * .25, r2 = Math.max(2, a.w * .12); ctx.globalAlpha = Math.max(.15, seg.fog); ctx.fillStyle = rg(ctx, cx, cy, 0, r2 * 2.5, ['#E8C8FFcc', '#A070FF44', '#A070FF00']); ctx.fillRect(cx - r2 * 2.5, cy - r2 * 2.5, r2 * 5, r2 * 5); path(ctx, [cx - r2 * .5, cy + r2, cx, cy - r2 * 1.4, cx + r2 * .5, cy + r2], '#D8B8FF'); path(ctx, [cx + r2 * .3, cy + r2, cx + r2 * .9, cy - r2 * .6, cx + r2 * 1.2, cy + r2], '#B890FF'); ctx.globalAlpha = 1 }
  }
  poly([a.x - a.w * 1.04, a.y - H1, a.x + a.w * 1.04, a.y - H1, b.x + b.w * 1.04, b.y - H2, b.x - b.w * 1.04, b.y - H2], mix(shade(st.wall[0], -.45), st.fog, f));
}
function segDraw(seg, st) {
  if (st.tunnel) tunnelWalls(seg, st);
  const a = seg.p1.screen, b = seg.p2.screen, h1 = a.scale * WALLH * U, h2 = b.scale * WALLH * U, fogA = 1 - seg.fog;
  if (seg.gap) {   // hố: chỉ vẽ vách đá phía xa (mặt cắt của đường) — nhìn xuyên xuống vực
    const nx = segs[seg.index + 1];
    if (seg.croc !== undefined) drawCroc(seg);
    if (nx && !nx.gap) { const d = b.scale * 700 * U; poly([b.x - b.w, b.y, b.x + b.w, b.y, b.x + b.w * .96, b.y + d, b.x - b.w * .96, b.y + d], shade(st.wall[0], -.35)); ctx.fillStyle = '#00000033'; for (let i = 1; i < 4; i++) ctx.fillRect(b.x - b.w, b.y + d * i / 4, b.w * 2, Math.max(1, d * .03)); poly([b.x - b.w, b.y, b.x + b.w, b.y, b.x + b.w, b.y + d * .12, b.x - b.w, b.y + d * .12], shade(st.stone[0], -.15)) }
    return;
  }
  roadTex(seg, a, b);
  const pv = segs[seg.index - 1]; if (pv && pv.gap) { ctx.fillStyle = '#00000055'; ctx.fillRect(a.x - a.w, a.y - Math.max(1, a.scale * 20 * U), a.w * 2, Math.max(1, a.scale * 20 * U)) }
  // lan can đá hai bên: mặt trong + mặt trên
  if (!st.tunnel) for (const sd of [-1, 1]) {
    if (seg.junc && (seg.junc & (sd < 0 ? 1 : 2))) continue;   // ngã rẽ: lan can mở ra phía rẽ
    const x1 = a.x + sd * a.w, x2 = b.x + sd * b.w, t1 = a.w * .1, t2 = b.w * .1, light = sd < 0 ? .06 : -.08;
    poly([x1, a.y, x2, b.y, x2, b.y - h2, x1, a.y - h1], shade(st.wall[0], light + (seg.index % 2 ? 0 : -.05)));
    poly([x1, a.y - h1, x2, b.y - h2, x2 + sd * t2, b.y - h2 * 1.06, x1 + sd * t1, a.y - h1 * 1.06], shade(st.wall[1], seg.index % 2 ? 0 : -.06));
    ctx.fillStyle = '#00000026'; ctx.fillRect(Math.min(x1, x2), b.y - h2 * .52, Math.abs(x2 - x1) + 1, Math.max(1, h1 * .04));
    if (seg.index % 2 === 0) { ctx.strokeStyle = '#0000002e'; ctx.lineWidth = Math.max(1, a.w * .008); ctx.beginPath(); ctx.moveTo(x1, a.y); ctx.lineTo(x1, a.y - h1); ctx.stroke() }
    if (st.mossP && (seg.index * 7 + (sd > 0 ? 3 : 0)) % 5 === 0) { ctx.fillStyle = '#4E8A2Ecc'; ctx.fillRect(x1 - sd * t1 * .2, a.y - h1, sd * t1 * .5, h1 * .6) }
    if (st.bg === 'ice') poly([x1, a.y - h1 * 1.06, x2, b.y - h2 * 1.06, x2 + sd * t2, b.y - h2 * 1.14, x1 + sd * t1, a.y - h1 * 1.14], '#FFFFFF');
  }
  if (fogA > .01) { ctx.globalAlpha = fogA; poly([a.x - a.w * 1.12, a.y, a.x + a.w * 1.12, a.y, b.x + b.w * 1.12, b.y - h2 * 1.15, b.x - b.w * 1.12, b.y - h2 * 1.15], st.fog); ctx.globalAlpha = 1 }
}
function spr(im, wWorld, sc, x, yBase, anchor, alpha) {   // vẽ ảnh dựng đứng: rộng wWorld (đơn vị thế giới) · anchor -1 phải, 0 giữa, 1 trái
  const dw = sc * wWorld * U, dh = dw * im.height / im.width; if (dw < .8 || dw > VW * 4) return;
  const dx = anchor < 0 ? x - dw : anchor > 0 ? x : x - dw / 2;
  if (alpha != null && alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(im, dx, yBase - dh, dw, dh); ctx.globalAlpha = 1;
}
const SPW = { obelisk: 520, sphinx: 2400, falls: 1500, sakura: 2600, pagoda: 1500, lantern: 460, tree: 3000, palm: 1300, ruin: 700, pillar: 520, pillarG: 480, isle: 2600, spire: 900, torch: 150, brazier: 150, pine: 1500, crystal: 1100, berg: 1800, post: 170 };
const LOW = { obelisk: 1, sphinx: 1, falls: 1, sakura: 1, pagoda: 1, lantern: 1, tree: 1, palm: 1, ruin: 1, pillar: 1, pillarG: 1, isle: 1, spire: 1, pine: 1, crystal: 1, berg: 1 };
function flame(fx0, fy, r, k) { const fl = 1 + Math.sin(S.tick * .5 + k) * .18; ctx.fillStyle = '#FF5A1A99'; ctx.beginPath(); ctx.ellipse(fx0, fy, r * 1.3, r * 2.2 * fl, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFB02A'; ctx.beginPath(); ctx.ellipse(fx0, fy + r * .3, r * .9, r * 1.6 * fl, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFF2B0'; ctx.beginPath(); ctx.ellipse(fx0, fy + r * .7, r * .45, r * .8, 0, 0, 7); ctx.fill() }
function drawOb(seg, st) {
  const o = seg.ob, a = seg.p1.screen, sc = a.scale, hh = v => sc * v * U;
  if (o.k === 'log' || o.k === 'block' || o.k === 'scarab' || o.k === 'snake') {   // quầng đỏ cảnh báo dưới vật cản cho dễ nhìn
    const pulse = .22 + Math.sin(S.tick * .2) * .08, lanesW = o.lanes ? o.lanes : null;
    ctx.fillStyle = 'rgba(255,40,60,' + pulse.toFixed(2) + ')';
    if (lanesW) for (const L of lanesW) { ctx.beginPath(); ctx.ellipse(a.x + LANES[L] * a.w, a.y, a.w * .34, Math.max(2, hh(70)), 0, 0, 7); ctx.fill() }
    else { ctx.beginPath(); ctx.ellipse(o.k === 'snake' ? a.x + snakeX(o) * a.w : a.x, a.y, o.k === 'snake' ? a.w * .5 : a.w * 1.02, Math.max(2, hh(70)), 0, 0, 7); ctx.fill() }
  }
  if (o.k === 'log') {
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.w * 1.02, hh(40), 0, 0, 7); ctx.fill();
    const im = img('root'), w = a.w * 2.16, h = hh(LOGH * 1.35); ctx.drawImage(im, a.x - w / 2, a.y - h, w, h);
  } else if (o.k === 'arch') {
    ctx.fillStyle = '#00000030'; ctx.fillRect(a.x - a.w, a.y - hh(30), a.w * 2, hh(30));
    const im = img('arch'), w = a.w * 2.3, h = hh(620); ctx.drawImage(im, a.x - w / 2, a.y - h, w, h);
  } else if (o.k === 'fire') {
    const lo = a.y - hh(BEAM[0]), hi = a.y - hh(BEAM[1]), mid = (lo + hi) / 2, r = (lo - hi) * .32;
    ctx.fillStyle = rg(ctx, a.x, a.y, 0, a.w * 1.1, ['#FF8A2A66', '#FF8A2A00']); ctx.fillRect(a.x - a.w * 1.1, a.y - a.w * .5, a.w * 2.2, a.w * .6);
    for (const sd of [-1, 1]) { const nx = a.x + sd * a.w; ctx.fillStyle = shade(st.wall[1], -.2); ctx.beginPath(); ctx.ellipse(nx, mid, a.w * .09, (lo - hi) * .45, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1A0A06'; ctx.beginPath(); ctx.ellipse(nx - sd * a.w * .03, mid, a.w * .04, (lo - hi) * .22, 0, 0, 7); ctx.fill() }
    for (let i = 0; i < 14; i++) { const t = (i + .5) / 14, fx0 = a.x - a.w * .95 + t * a.w * 1.9, jit = Math.sin(S.tick * .6 + i * 1.7) * r * .25; flame(fx0, mid + jit, r * (.8 + Math.sin(t * Math.PI) * .35), i) }
  } else if (o.k === 'snake') drawSnake(o, a, sc, st);
  else if (o.k === 'spider') drawSpider(o, a, sc);
  else if (o.k === 'ghost') drawGhostLantern(o, a, sc);
  else if (o.k === 'bats' || o.k === 'birds') drawFlock(o, a, sc, st);
  else if (o.k === 'scarab') drawScarabs(o, a, sc, st);
  else if (o.k === 'blade') drawBlade(o, a, sc, st);
  else if (o.k === 'block') {
    const im = img('block');
    for (const L of o.lanes) { const cx = a.x + LANES[L] * a.w; ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(cx, a.y, a.w * .3, hh(30), 0, 0, 7); ctx.fill(); spr(im, 470, sc, cx, a.y + hh(10), 0) }
  }
}
function drawSnake(o, a, sc, st) {   // rắn trườn qua lại (nhảy qua)
  const cx = a.x + snakeX(o) * a.w, dir = Math.cos(S.tick * .045 + o.ph) >= 0 ? 1 : -1, L = a.w * .8, th = Math.max(2, sc * 62 * U), g = st.bg === 'desert' || st.bg === 'gold', col = st.bg === 'desert' ? ['#3A2A1A', '#FF8A2A'] : st.bg === 'gold' ? ['#4A2A6A', '#C89AFF'] : st.bg === 'falls' ? ['#1E8A6A', '#A0E8A8'] : ['#2E8A2E', '#D0E840'];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const pts = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([cx - dir * L / 2 + dir * L * t, a.y - th * .55 - Math.sin(t * 9 - S.tick * .35) * th * .5]) }
  const line = (w, c, dy) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)); ctx.stroke() };
  ctx.fillStyle = '#00000038'; ctx.beginPath(); ctx.ellipse(cx, a.y, L * .55, th * .5, 0, 0, 7); ctx.fill();
  line(th, col[0], 0); ctx.setLineDash([th * .45, th * .6]); line(th * .38, col[1], -th * .12); ctx.setLineDash([]);
  const [hx, hy] = pts[16], qx = hx + dir * th * .4, qy = hy - th * 2.6;
  ctx.strokeStyle = col[0]; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + dir * th * 1.2, hy - th * 1.4, qx, qy); ctx.stroke();
  if (g) { ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(qx, qy + th * .9, th * 1.35, th * 1.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = col[1]; ctx.beginPath(); ctx.ellipse(qx, qy + th * 1, th * .55, th * 1.05, 0, 0, 7); ctx.fill() }
  ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(qx, qy, th * .95, th * .72, 0, 0, 7); ctx.fill();
  for (const d of [-1, 1]) { circ(ctx, qx + d * th * .38, qy - th * .12, th * .22, '#FFE020'); circ(ctx, qx + d * th * .38, qy - th * .12, th * .09, '#1A0A00') }
  if ((S.tick >> 3) & 1) { ctx.strokeStyle = '#E8203A'; ctx.lineWidth = Math.max(1, th * .12); ctx.beginPath(); ctx.moveTo(qx, qy + th * .5); ctx.lineTo(qx, qy + th * 1.1); ctx.lineTo(qx - th * .22, qy + th * 1.32); ctx.moveTo(qx, qy + th * 1.1); ctx.lineTo(qx + th * .22, qy + th * 1.32); ctx.stroke() }
}
function drawSpider(o, a, sc) {   // nhện khổng lồ thả tơ (đổi làn hoặc trượt)
  const cx = a.x + LANES[o.lane] * a.w, bob = Math.sin(S.tick * .06 + o.ph) * 30, cy = a.y - sc * (420 + bob) * U, R = Math.max(2, sc * 100 * U);
  ctx.fillStyle = '#00000030'; ctx.beginPath(); ctx.ellipse(cx, a.y, R * 1.6, R * .3, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#F0F0FAaa'; ctx.lineWidth = Math.max(1, R * .05); ctx.beginPath(); ctx.moveTo(cx, cy - sc * 1500 * U); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.strokeStyle = '#1E1426'; ctx.lineWidth = Math.max(1, R * .14); ctx.lineCap = 'round';
  for (const d of [-1, 1]) for (let k = 0; k < 4; k++) { const w = Math.sin(S.tick * .3 + k + d) * R * .15, ky = cy - R * .2 + k * R * .25, mx = cx + d * R * (1.1 + k * .1), my = ky - R * (.7 - k * .25) + w; ctx.beginPath(); ctx.moveTo(cx + d * R * .3, ky); ctx.lineTo(mx, my); ctx.lineTo(cx + d * R * (1.6 + k * .12), ky + R * (.6 + k * .15)); ctx.stroke() }
  ctx.fillStyle = rg(ctx, cx - R * .3, cy - R * .4, 0, R * 1.2, ['#5A3A6A', '#2A1A3A', '#120A1A']); ctx.beginPath(); ctx.ellipse(cx, cy - R * .2, R * .85, R, 0, 0, 7); ctx.fill();
  path(ctx, [cx, cy - R * .6, cx - R * .25, cy - R * .25, cx, cy + R * .1, cx + R * .25, cy - R * .25], '#E8203A');
  ctx.fillStyle = '#2A1A3A'; ctx.beginPath(); ctx.ellipse(cx, cy + R * .78, R * .55, R * .45, 0, 0, 7); ctx.fill();
  for (const [ex, ey, er] of [[-.18, .7, .12], [.18, .7, .12], [-.34, .82, .07], [.34, .82, .07]]) circ(ctx, cx + ex * R, cy + ey * R, er * R, '#FF3A3A');
}
function drawGhostLantern(o, a, sc) {   // ma lồng đèn (đổi làn hoặc trượt)
  const cx = a.x + LANES[o.lane] * a.w + Math.sin(S.tick * .04 + o.ph) * a.w * .05, cy = a.y - sc * (420 + Math.sin(S.tick * .07 + o.ph) * 40) * U, R = Math.max(2, sc * 120 * U);
  ctx.fillStyle = '#00000028'; ctx.beginPath(); ctx.ellipse(cx, a.y, R, R * .22, 0, 0, 7); ctx.fill();
  ctx.fillStyle = rg(ctx, cx, cy, R * .2, R * 2.2, ['#FFE8A066', '#FFB04A00']); ctx.fillRect(cx - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4);
  ctx.fillStyle = lg(ctx, cx - R, 0, cx + R, 0, ['#E8C8A0', '#FFF4E0', '#E8C8A0']); ctx.beginPath(); ctx.ellipse(cx, cy, R * .8, R, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#C8323A'; ctx.lineWidth = Math.max(1, R * .06); for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(cx, cy + i * R * .26, R * .8 * Math.sqrt(1 - (i * .26) ** 2), R * .05, 0, 0, 7); ctx.stroke() }
  ctx.fillStyle = '#1E1A1E'; ctx.fillRect(cx - R * .45, cy - R * 1.08, R * .9, R * .18); ctx.fillRect(cx - R * .45, cy + R * .9, R * .9, R * .18);
  circ(ctx, cx, cy - R * .25, R * .3, '#FFFFFF'); circ(ctx, cx + Math.sin(S.tick * .05) * R * .1, cy - R * .22, R * .14, '#1A0A10');
  ctx.fillStyle = '#3A0A10'; ctx.beginPath(); ctx.ellipse(cx, cy + R * .35, R * .38, R * .2, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#E8305A'; ctx.beginPath(); ctx.ellipse(cx + R * .08, cy + R * .6 + Math.sin(S.tick * .2) * R * .08, R * .14, R * .3, .2, 0, 7); ctx.fill();
}
function drawFlock(o, a, sc, st) {   // đàn dơi / chim bay ngang đầu (trượt)
  const s = Math.max(2, sc * 130 * U), kind = o.k === 'birds' ? (st.bg === 'sakura' ? 'crow' : 'gull') : st.bg === 'ice' ? 'icebat' : 'bat', col = { bat: ['#2A1E36', '#4A3A5A'], icebat: ['#4A6A9A', '#8AB0E0'], gull: ['#FFFFFF', '#9AA4B0'], crow: ['#1A1A22', '#3A3A48'] }[kind];
  ctx.fillStyle = '#00000028'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.w * .9, sc * 30 * U, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 7; i++) {
    const t = i / 6, x = a.x + (t * 1.8 - .9) * a.w + Math.sin(S.tick * .08 + i * 2 + o.ph) * a.w * .06, y = a.y - sc * (400 + Math.sin(S.tick * .1 + i * 1.3) * 45 + (i % 2) * 40) * U, f = Math.sin(S.tick * .5 + i);
    ctx.fillStyle = col[0]; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - s * .6, y - s * .5 * f - s * .1, x - s * 1.1, y - s * .2 * f); ctx.quadraticCurveTo(x - s * .6, y + s * .05, x, y + s * .12); ctx.quadraticCurveTo(x + s * .6, y + s * .05, x + s * 1.1, y - s * .2 * f); ctx.quadraticCurveTo(x + s * .6, y - s * .5 * f - s * .1, x, y); ctx.fill();
    if (kind === 'gull') { ctx.strokeStyle = col[1]; ctx.lineWidth = Math.max(1, s * .06); ctx.beginPath(); ctx.moveTo(x - s * 1.1, y - s * .2 * f); ctx.lineTo(x - s * .8, y - s * .25 * f); ctx.moveTo(x + s * 1.1, y - s * .2 * f); ctx.lineTo(x + s * .8, y - s * .25 * f); ctx.stroke() }
    ctx.fillStyle = col[1]; ctx.beginPath(); ctx.ellipse(x, y + s * .05, s * .22, s * .28, 0, 0, 7); ctx.fill();
    if (kind === 'bat' || kind === 'icebat') { circ(ctx, x - s * .08, y, s * .05, '#FF3A3A'); circ(ctx, x + s * .08, y, s * .05, '#FF3A3A'); path(ctx, [x - s * .18, y - s * .15, x - s * .1, y - s * .35, x - s * .02, y - s * .15], col[0]); path(ctx, [x + s * .18, y - s * .15, x + s * .1, y - s * .35, x + s * .02, y - s * .15], col[0]) }
    else path(ctx, [x - s * .05, y + s * .02, x + s * .05, y + s * .02, x, y + s * .16], '#F0A020');
  }
}
function drawScarabs(o, a, sc, st) {   // bầy bọ hung bò kín làn (nhảy qua)
  const s = Math.max(1.5, sc * 55 * U), g = false;
  for (const L of o.lanes) { const cx = a.x + LANES[L] * a.w; ctx.fillStyle = '#00000030'; ctx.beginPath(); ctx.ellipse(cx, a.y, a.w * .3, sc * 30 * U, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 9; i++) { const bx = cx + ((i % 3) - 1) * a.w * .17 + Math.sin(S.tick * .3 + i * 2) * s * .3, by = a.y - s * .4 - Math.floor(i / 3) * s * .45 + Math.cos(S.tick * .25 + i) * s * .1;
      ctx.strokeStyle = '#1A1A10'; ctx.lineWidth = Math.max(1, s * .08); for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(bx, by + (k - 1) * s * .2); ctx.lineTo(bx + d * s * .6, by + (k - 1) * s * .3 + Math.sin(S.tick * .8 + i + k) * s * .1); ctx.stroke() }
      ctx.fillStyle = rg(ctx, bx - s * .15, by - s * .15, 0, s * .6, g ? ['#FFF2A0', '#E8B030', '#7A5208'] : ['#7AF0C0', '#1E8A6A', '#0A3A2A']); ctx.beginPath(); ctx.ellipse(bx, by, s * .42, s * .5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#0A2A1A'; ctx.beginPath(); ctx.moveTo(bx, by - s * .5); ctx.lineTo(bx, by + s * .5); ctx.stroke(); circ(ctx, bx, by - s * .55, s * .2, '#0A2A1A') } }
}
function drawBlade(o, a, sc, st) {   // lưỡi rìu đung đưa (canh nhịp)
  const pv = a.y - sc * 1500 * U, L = sc * 1150 * U, th = bladeTh(o), bx = a.x + Math.sin(th) * L, by = pv + Math.cos(th) * L, pw = a.w * .12, red = st.bg === 'sakura';
  ctx.fillStyle = red ? '#A8222A' : shade(st.wall[0], -.15); ctx.fillRect(a.x - a.w - pw * .5, pv - sc * 80 * U, pw, a.y - pv + sc * 80 * U); ctx.fillRect(a.x + a.w - pw * .5, pv - sc * 80 * U, pw, a.y - pv + sc * 80 * U);
  ctx.fillStyle = red ? '#1E1A1E' : st.wall[1]; ctx.fillRect(a.x - a.w - pw, pv - sc * 120 * U, a.w * 2 + pw * 2, sc * 90 * U);
  ctx.fillStyle = '#00000038'; ctx.beginPath(); ctx.ellipse(a.x + bladeX(o) * a.w, a.y, a.w * .3, sc * 30 * U, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#4A4A52'; ctx.lineWidth = Math.max(1, sc * 28 * U); ctx.beginPath(); ctx.moveTo(a.x, pv); ctx.lineTo(bx, by); ctx.stroke();
  ctx.save(); ctx.translate(bx, by); ctx.rotate(-th); const R = sc * 340 * U;
  ctx.fillStyle = lg(ctx, -R, 0, R, 0, ['#7A848E', '#F4F8FF', '#B8C2CC', '#5A646E']); ctx.beginPath(); ctx.moveTo(-R, -R * .1); ctx.quadraticCurveTo(0, R * .95, R, -R * .1); ctx.quadraticCurveTo(0, R * .42, -R, -R * .1); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1, R * .03); ctx.beginPath(); ctx.moveTo(-R * .8, R * .05); ctx.quadraticCurveTo(0, R * .82, R * .8, R * .05); ctx.stroke();
  ctx.fillStyle = red ? '#C8323A' : '#C8A040'; ctx.fillRect(-R * .12, -R * .36, R * .24, R * .44); ctx.restore();
}
function drawCroc(seg) {   // cá sấu đớp dưới hố nước
  const a = seg.p1.screen, b = seg.p2.screen, cx = (a.x + b.x) / 2, cy = b.y + (a.y - b.y) * .75, s = a.w * .55, op = (Math.sin(S.tick * .12 + seg.croc) + 1) / 2;
  ctx.fillStyle = '#FFFFFF66'; ctx.beginPath(); ctx.ellipse(cx, cy, s * .75, s * .1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2E6A2A'; ctx.beginPath(); ctx.ellipse(cx, cy, s * .34, s * .12, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#C83A3A'; ctx.beginPath(); ctx.ellipse(cx, cy, s * .3, s * (.05 + op * .3), 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#4E9A3A'; ctx.beginPath(); ctx.moveTo(cx - s * .34, cy); ctx.quadraticCurveTo(cx, cy - s * (.2 + op * .8), cx + s * .34, cy - s * (.05 + op * .3)); ctx.lineTo(cx + s * .34, cy - s * (.05 + op * .3) - s * .06); ctx.quadraticCurveTo(cx, cy - s * (.28 + op * .85), cx - s * .36, cy - s * .04); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 6; i++) { const tx = cx - s * .28 + i * s * .11, ty = cy - s * (.04 + op * .3) * (i / 6); path(ctx, [tx, ty, tx + s * .05, ty, tx + s * .025, ty + s * .07], '#FFFFFF') }
  circ(ctx, cx - s * .1, cy - s * (.22 + op * .62), s * .06, '#E8E020'); circ(ctx, cx + s * .12, cy - s * (.2 + op * .55), s * .06, '#E8E020');
}
function drawMover(m, x, y, sc, st) {   // quái chạy tới: đá lăn · xác ướp · người tuyết · hồn lửa · bộ xương vàng
  const s = sc * U, t = S.tick * .25 + m.ph, sw = Math.sin(t);
  ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y, s * 230, s * 40, 0, 0, 7); ctx.fill();
  if (m.k === 'boulder') { const R = s * 280; ctx.save(); ctx.translate(x, y - R); ctx.rotate(-m.z / 280); ctx.drawImage(img('boulder'), -R, -R, R * 2, R * 2); ctx.restore(); return }
  if (m.k === 'spirit') {
    const H = s * 480, fy = y - s * 120 - Math.abs(sw) * s * 40;
    ctx.fillStyle = rg(ctx, x, fy - H * .4, 0, H * .9, ['#FFB04A88', '#FF5A1A00']); ctx.fillRect(x - H, fy - H * 1.3, H * 2, H * 1.6);
    for (let i = 0; i < 5; i++) flame(x + Math.sin(S.tick * .3 + i * 1.3) * H * .12, fy - H * (.15 + i * .14), H * (.2 - i * .028), i);
    for (const d of [-1, 1]) { circ(ctx, x + d * H * .1, fy - H * .42, H * .07, '#FFFFFF'); circ(ctx, x + d * H * .1, fy - H * .41, H * .035, '#1A0A00') }
    ctx.fillStyle = '#3A0A00'; ctx.beginPath(); ctx.ellipse(x, fy - H * .28, H * .08, H * .05 + Math.abs(sw) * H * .02, 0, 0, 7); ctx.fill(); return;
  }
  if (m.k === 'yeti') {
    const H = s * 680, w = H * .62, by = y - Math.abs(sw) * s * 30;
    ctx.fillStyle = '#E8F2FA'; for (const d of [-1, 1]) { ctx.save(); ctx.translate(x + d * w * .48, by - H * .72); ctx.rotate(d * (2.4 + sw * .4)); ctx.fillRect(-w * .12, 0, w * .24, H * .45); ctx.restore() }
    for (const d of [-1, 1]) { ctx.fillStyle = '#D0E2F0'; ctx.fillRect(x + d * w * .2 - w * .13, by - H * .3, w * .26, H * .3 + (d * sw) * s * 20) }
    ctx.fillStyle = rg(ctx, x - w * .2, by - H * .7, 0, w, ['#FFFFFF', '#E0ECF6', '#A8C4DA']); ctx.beginPath(); ctx.ellipse(x, by - H * .58, w * .5, H * .36, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 10; i++) circ(ctx, x + Math.cos(i * .63) * w * .5, by - H * .58 + Math.sin(i * .63) * H * .36, w * .08, '#F4FAFF');
    ctx.fillStyle = '#7A9AC0'; ctx.beginPath(); ctx.ellipse(x, by - H * .74, w * .26, H * .13, 0, 0, 7); ctx.fill();
    for (const d of [-1, 1]) { circ(ctx, x + d * w * .1, by - H * .78, w * .045, '#FF3A3A') }
    ctx.fillStyle = '#2A0A1A'; ctx.beginPath(); ctx.ellipse(x, by - H * .69, w * .12, H * .05 + Math.abs(sw) * H * .02, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; path(ctx, [x - w * .09, by - H * .72, x - w * .06, by - H * .72, x - w * .075, by - H * .68], '#FFFFFF'); path(ctx, [x + w * .06, by - H * .72, x + w * .09, by - H * .72, x + w * .075, by - H * .68], '#FFFFFF'); return;
  }
  const skel = m.k === 'skeleton', H = s * 560, w = H * .3, body = skel ? '#E8C050' : '#E8DCC0', line = skel ? '#8A6A1E' : '#B8A888', eye = skel ? '#FF3A2A' : '#7AFF6A';
  for (const d of [-1, 1]) { ctx.save(); ctx.translate(x + d * w * .22, y - H * .46); ctx.rotate(d * sw * .25); ctx.fillStyle = body; ctx.fillRect(-w * .1, 0, w * .2, H * .46); ctx.restore() }
  if (skel) { ctx.strokeStyle = body; ctx.lineWidth = w * .1; ctx.beginPath(); ctx.moveTo(x, y - H * .86); ctx.lineTo(x, y - H * .46); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y - H * (.78 - i * .08), w * (.46 - i * .04), H * .025, 0, 0, 7); ctx.stroke() } ctx.fillStyle = body; ctx.fillRect(x - w * .35, y - H * .5, w * .7, H * .06) }
  else { ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w * .5, y - H * .88, w, H * .46, w * .2) : ctx.rect(x - w * .5, y - H * .88, w, H * .46); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(1, H * .012); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(x - w * .5, y - H * (.84 - i * .06)); ctx.lineTo(x + w * .5, y - H * (.8 - i * .06)); ctx.stroke() } }
  for (const d of [-1, 1]) { ctx.save(); ctx.translate(x + d * w * .55, y - H * .82); ctx.rotate(d * (skel && d > 0 ? 2.6 + sw * .3 : .5 + sw * d * .2)); ctx.fillStyle = body; ctx.fillRect(-w * .09, 0, w * .18, H * .32); if (skel && d > 0) { ctx.fillStyle = '#D8E2EC'; ctx.fillRect(-w * .05, H * .3, w * .1, H * .4); ctx.fillStyle = '#C8A040'; ctx.fillRect(-w * .2, H * .28, w * .4, H * .04) } ctx.restore() }
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y - H * .96, w * .34, 0, 7); ctx.fill();
  if (!skel) { ctx.strokeStyle = line; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - w * .34, y - H * (1.03 - i * .045)); ctx.lineTo(x + w * .34, y - H * (1 - i * .045)); ctx.stroke() } }
  ctx.fillStyle = skel ? '#3A2A0A' : '#2A2018'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * w * .13, y - H * .97, w * .08, w * .06, 0, 0, 7); ctx.fill() }
  ctx.shadowColor = eye; ctx.shadowBlur = 8; for (const d of [-1, 1]) circ(ctx, x + d * w * .13, y - H * .97, w * .04, eye); ctx.shadowBlur = 0;
}
function drawJunction(t, last, st) {   // ngã rẽ chưa rẽ: đường ngang mở ra 2 bên + tường cụt chạm mặt khỉ quỷ phía trước
  const a = t.p1.screen, b = last.p2.screen, d0 = t.turn.dir, h1 = a.scale * WALLH * U, h2 = b.scale * WALLH * U;
  for (const d of [-1, 1]) {
    if (d0 && d0 !== d) continue;
    const xn = a.x + d * a.w, xf = b.x + d * b.w, X = d > 0 ? VW + 60 : -60;
    ctx.fillStyle = lg(ctx, 0, b.y, 0, a.y, [shade(st.stone[1], -.15), st.stone[0]]); ctx.beginPath(); ctx.moveTo(xn, a.y); ctx.lineTo(X, a.y); ctx.lineTo(X, b.y); ctx.lineTo(xf, b.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(st.stone[2], -.1) + '99'; ctx.lineWidth = Math.max(1, a.w * .006);
    for (let k = 2; k < JUNC; k += 2) { const sg = segs[t.index + k]; if (!sg) continue; const yy = sg.p1.screen.y, ex = sg.p1.screen.x + d * sg.p1.screen.w; ctx.beginPath(); ctx.moveTo(ex, yy); ctx.lineTo(X, yy); ctx.stroke() }
    for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(xn + d * i * a.w * .42, a.y); ctx.lineTo(xf + d * i * b.w * .42, b.y); ctx.stroke() }
    poly([xf, b.y, X, b.y, X, b.y - h2, xf, b.y - h2], shade(st.wall[0], -.1)); poly([xf, b.y - h2, X, b.y - h2, X, b.y - h2 * 1.12, xf, b.y - h2 * 1.12], st.wall[1]);
    poly([xn, a.y, X, a.y, X, a.y - h1, xn, a.y - h1], shade(st.wall[0], .05)); poly([xn, a.y - h1, X, a.y - h1, X, a.y - h1 * 1.1, xn, a.y - h1 * 1.1], st.wall[1]);
  }
  const im = img('wallend'), w = b.w * 2.3, h = b.scale * 1400 * U; ctx.drawImage(im, b.x - w / 2, b.y - h, w, h);
  const pul = .6 + Math.sin(S.tick * .25) * .4;
  for (const d of [-1, 1]) { if (d0 && d0 !== d) continue; const ax = b.x + d * b.w * .55, ay = b.y - h * .52, s2 = b.w * .3; ctx.globalAlpha = pul; ctx.fillStyle = '#FFE24A'; ctx.shadowColor = '#FFD23F'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(ax + d * s2, ay); ctx.lineTo(ax, ay - s2 * .7); ctx.lineTo(ax, ay - s2 * .3); ctx.lineTo(ax - d * s2 * .8, ay - s2 * .3); ctx.lineTo(ax - d * s2 * .8, ay + s2 * .3); ctx.lineTo(ax, ay + s2 * .3); ctx.lineTo(ax, ay + s2 * .7); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1 }
}
function drawCart(x, y, s, alpha) {   // xe goòng (nhìn từ sau)
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; const w = s * .78, h = s * .38, top = y - h - s * .1;
  for (const d of [-1, 1]) { circ(ctx, x + d * w * .36, y - s * .07, s * .075, '#2A2A30'); circ(ctx, x + d * w * .36, y - s * .07, s * .035, '#8A8E98') }
  ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, ['#5A5E68', '#9AA0AC', '#6A6E78', '#3E424A']); ctx.beginPath(); ctx.moveTo(x - w * .55, top); ctx.lineTo(x + w * .55, top); ctx.lineTo(x + w * .45, y - s * .1); ctx.lineTo(x - w * .45, y - s * .1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7A5230'; ctx.fillRect(x - w * .58, top - s * .03, w * 1.16, s * .05);
  ctx.fillStyle = '#3A3E46'; for (const fy of [.3, .7]) ctx.fillRect(x - w * .5, top + h * fy, w, s * .02); for (let i = -2; i <= 2; i++) circ(ctx, x + i * w * .2, top + h * .15, s * .012, '#C8CCD4');
  ctx.restore();
}
function drawRunner(x, y, s, col, alpha, mode) {   // nhà thám hiểm chạy (nhìn từ sau lưng) — s: chiều cao px
  if (STAGES[S.level] && STAGES[S.level].tunnel && mode !== 'fall') {   // trong hầm: ngồi xe goòng — cúi xuống khi trượt
    const dip = mode === 'slide' ? s * .42 : s * .22; drawRunnerBody(x, y - s * .1 + dip, s, col, alpha, mode === 'air' ? 'air' : 'ride'); drawCart(x, y, s, alpha); return;
  }
  drawRunnerBody(x, y, s, col, alpha, mode);
}
function drawRunnerBody(x, y, s, col, alpha, mode) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.translate(x, y);
  const t = S.tick * .42, sw = Math.sin(t), slide = mode === 'slide', fall = mode === 'fall', air = mode === 'air';
  if (fall) ctx.rotate(1.1);
  const bob = slide || air ? 0 : Math.abs(Math.cos(t)) * s * .03, H = slide ? s * .5 : s;
  ctx.translate(0, -bob);
  const pants = '#6B5A3A', pantsD = '#4E4028', boot = '#3A2414', skin = '#E8B48A', skinD = '#C88E66', shirt = col, shirtD = shade(col, -.3), shirtL = shade(col, .25), hair = '#A0441E';
  const limb = (x0, y0, ang, len, w, c1, c2) => { ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang); ctx.fillStyle = c1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, 0, w, len, w / 2) : ctx.rect(-w / 2, 0, w, len); ctx.fill(); if (c2) { ctx.fillStyle = c2; ctx.fillRect(w * .1, 0, w * .35, len * .9) } ctx.restore() };
  if (slide) {
    ctx.fillStyle = '#C8B08A66'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((i - 2) * s * .12 + Math.sin(S.tick + i) * 4, -s * .04, s * (.05 + i % 2 * .03), 0, 7); ctx.fill() }
    limb(-s * .1, -s * .14, -1.2, s * .3, s * .11, pants, pantsD); limb(s * .1, -s * .14, 1.2, s * .3, s * .11, pants, pantsD);
    ctx.fillStyle = boot; ctx.beginPath(); ctx.ellipse(-s * .36, -s * .04, s * .06, s * .045, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * .36, -s * .04, s * .06, s * .045, 0, 0, 7); ctx.fill();
  } else if (mode !== 'ride') {
    const k = air ? .5 : sw, legL = s * .24;
    for (const sd of [-1, 1]) {   // đùi + cẳng + giày
      const ph = sd * k, kx = sd * s * .065, hipY = -s * .46, th = ph * .55, knee = air ? .9 : Math.max(0, -ph) * 1.1 + .15;
      ctx.save(); ctx.translate(kx, hipY); ctx.rotate(th * .4); limb(0, 0, 0, legL, s * .1, pants, pantsD); ctx.translate(0, legL * .95); ctx.rotate(-th * .2); const shin = legL * (1 - knee * .35); limb(0, 0, 0, shin, s * .085, pantsD, null); ctx.fillStyle = boot; ctx.beginPath(); ctx.ellipse(0, shin, s * .055, s * .04 + knee * s * .02, 0, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  const by = slide ? -s * .44 : -s * .8, tw = s * .3, th = s * .36;
  // tay sau lưng (vung)
  const ak = air ? -1.2 : sw * .7;
  limb(-tw * .52, by + s * .04, .25 + ak, s * .3, s * .075, skin, skinD); limb(tw * .52, by + s * .04, -.25 + ak, s * .3, s * .075, skin, skinD);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * tw * .52, by + s * .04); ctx.rotate(sd * .25 + ak); ctx.fillStyle = shirtD; ctx.fillRect(-s * .045, 0, s * .09, s * .1); ctx.restore() }
  // thân áo
  ctx.fillStyle = lg(ctx, -tw / 2, 0, tw / 2, 0, [shirtL, shirt, shirtD]); ctx.beginPath(); ctx.moveTo(-tw * .55, by); ctx.lineTo(tw * .55, by); ctx.lineTo(tw * .44, by + th); ctx.lineTo(-tw * .44, by + th); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shirtD; ctx.lineWidth = Math.max(1, s * .01); ctx.beginPath(); ctx.moveTo(0, by + th * .1); ctx.lineTo(0, by + th); ctx.moveTo(-tw * .3, by + th * .4); ctx.quadraticCurveTo(0, by + th * .5, tw * .3, by + th * .38); ctx.stroke();
  ctx.fillStyle = '#5A3A1E'; ctx.fillRect(-tw * .46, by + th - s * .045, tw * .92, s * .05); ctx.fillStyle = '#C8A04A'; ctx.fillRect(-s * .025, by + th - s * .042, s * .05, s * .04);
  ctx.strokeStyle = '#6A4424'; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(-tw * .45, by + s * .02); ctx.lineTo(tw * .4, by + th * .85); ctx.stroke();
  ctx.fillStyle = '#7A5230'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(tw * .22, by + th * .62, s * .13, s * .12, s * .02) : ctx.rect(tw * .22, by + th * .62, s * .13, s * .12); ctx.fill(); ctx.fillStyle = '#5A3A1E'; ctx.fillRect(tw * .22, by + th * .62, s * .13, s * .03);
  // cổ + đầu (tóc nâu đỏ)
  ctx.fillStyle = skinD; ctx.fillRect(-s * .035, by - s * .04, s * .07, s * .05);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(-s * .085, by - s * .09, s * .02, s * .03, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * .085, by - s * .09, s * .02, s * .03, 0, 0, 7); ctx.fill();
  ctx.fillStyle = lg(ctx, -s * .09, 0, s * .09, 0, [shade(hair, .2), hair, shade(hair, -.3)]); ctx.beginPath(); ctx.ellipse(0, by - s * .1, s * .088, s * .1, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = shade(hair, -.35); ctx.lineWidth = Math.max(1, s * .008); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * .025, by - s * .19); ctx.quadraticCurveTo(i * s * .035, by - s * .1, i * s * .03, by - s * .02); ctx.stroke() }
  ctx.restore();
}
function drawMonkey(x, y, s, ph) {   // khỉ quỷ đuổi theo: lông đen xám, mặt trắng, mắt đỏ, nanh
  ctx.save(); const hop = Math.abs(Math.sin(S.tick * .38 + ph)); ctx.translate(x, y - hop * s * .18);
  const fur = '#2A2430', furL = '#4A4252', sw = Math.sin(S.tick * .38 + ph);
  ctx.fillStyle = fur; ctx.save(); ctx.translate(-s * .3, -s * .55); ctx.rotate(-.6 + sw * .7); ctx.fillRect(-s * .06, 0, s * .12, s * .5); ctx.restore(); ctx.save(); ctx.translate(s * .3, -s * .55); ctx.rotate(.6 - sw * .7); ctx.fillRect(-s * .06, 0, s * .12, s * .5); ctx.restore();
  ctx.fillStyle = lg(ctx, -s * .35, 0, s * .35, 0, [furL, fur, '#16121A']); ctx.beginPath(); ctx.ellipse(0, -s * .42, s * .33, s * .32, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fur; ctx.beginPath(); ctx.arc(0, -s * .82, s * .21, 0, 7); ctx.fill(); circ(ctx, -s * .2, -s * .9, s * .07, fur); circ(ctx, s * .2, -s * .9, s * .07, fur); circ(ctx, -s * .2, -s * .9, s * .035, '#C890A0'); circ(ctx, s * .2, -s * .9, s * .035, '#C890A0');
  ctx.fillStyle = '#E8DCD0'; ctx.beginPath(); ctx.ellipse(0, -s * .78, s * .14, s * .13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#FF1A1A'; ctx.shadowColor = '#FF3A3A'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(-s * .06, -s * .82, s * .035, s * .025, .3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * .06, -s * .82, s * .035, s * .025, -.3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#3A0A10'; ctx.beginPath(); ctx.ellipse(0, -s * .72, s * .07, s * .04 + hop * s * .02, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; path(ctx, [-s * .05, -s * .75, -s * .03, -s * .75, -s * .04, -s * .71], '#FFFFFF'); path(ctx, [s * .03, -s * .75, s * .05, -s * .75, s * .04, -s * .71], '#FFFFFF');
  ctx.restore();
}
function draw() {
  if (!segs.length) return;
  const st = STAGES[S.level]; if (!bg) bg = bgLayers();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true;
  const base = findSeg(pos), basePct = (pos % SEG) / SEG, plSeg = findSeg(pos + PLZ), plPct = ((pos + PLZ) % SEG) / SEG, plY = plSeg.p1.world.y + (plSeg.p2.world.y - plSeg.p1.world.y) * plPct;
  const hz = VH * HZ, camX = plX * ROADW * .6, ox = turnT ? turnDir * VW * .9 * Math.pow(turnT / 24, 2) : 0;
  ctx.drawImage(bg.sky, 0, 0, VW, hz + 2);
  const fh = hz * 1.02, fw = fh * 4; for (let i = -1; i < Math.ceil(VW / fw) + 1; i++) ctx.drawImage(bg.far, i * fw - (((bgX - ox / VW * .25) % 1 + 1) % 1) * fw, hz - fh + 2, fw, fh);
  drawBelow(st, hz, camX - ox / U * 3);
  ctx.save(); ctx.translate(ox, 0);
  // chiếu toàn bộ đoạn đường (gần → xa) rồi vẽ ngược từ xa → gần cho đúng che khuất
  let x = 0, dx = -(base.curve * basePct), stopAt = -1; const n0 = base.index, vis = [];
  for (let n = 0; n < DRAW; n++) {
    const seg = segs[n0 + n]; if (!seg || (stopAt >= 0 && seg.index > stopAt)) break;
    if (seg.turn && !seg.turn.done && stopAt < 0) stopAt = seg.index + JUNC - 1;   // ngã rẽ chưa rẽ: không vẽ đường phía sau tường
    seg.fog = 1 / Math.pow(Math.E, Math.pow(n / DRAW, 2) * st.fogD);
    project(seg.p1, camX - x, plY + CAMH, pos); project(seg.p2, camX - x - dx, plY + CAMH, pos);
    x += dx; dx += seg.curve;
    if (seg.p1.camera.z > CAMD && seg.p2.screen.y < seg.p1.screen.y + 1) vis.push(seg);
  }
  const wk = WK() + S.level, gBy = {};
  for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== wk || g.ty == null) continue; g.rz = g.rz == null || Math.abs(g.ty - g.rz) > SEG * 40 ? g.ty : g.rz + (g.ty - g.rz) * .2; g.rx = g.rx == null ? g.tx : g.rx + (g.tx - g.rx) * .25; const i = Math.floor((g.rz + PLZ) / SEG); if (i > n0 + 2 && i < n0 + DRAW) (gBy[i] = gBy[i] || []).push(g) }
  const coinIm = img('coin'), mBy = {};
  for (const m of movers) { const i = Math.floor(m.z / SEG); if (i > n0 && i < n0 + DRAW && (stopAt < 0 || i <= stopAt)) (mBy[i] = mBy[i] || []).push(m) }
  for (let v = vis.length - 1; v >= 0; v--) {
    const seg = vis[v], a = seg.p1.screen, sc = a.scale, al = Math.min(1, seg.fog * 1.25);
    if (seg.index === stopAt && segs[stopAt - JUNC + 1]) drawJunction(segs[stopAt - JUNC + 1], seg, st);
    segDraw(seg, st);
    for (const s of seg.sprites) {   // cảnh hai bên
      const im = img(s.k), sx = a.x + s.offset * a.w, yb = LOW[s.k] ? a.y + sc * DEPTH * U : a.y, anc = !LOW[s.k] ? 0 : s.offset < 0 ? -1 : 1;
      if (s.k === 'gate') { spr(im, ROADW * 2.6, sc, a.x, a.y, 0, al); continue }
      if (s.k === 'frame') { spr(im, ROADW * 2.3, sc, a.x, a.y, 0, al); if (st.bg === 'mine' && sc * 150 * U > 2) for (const d of [-1, 1]) { const fx0 = a.x + d * a.w * 1.06, fy = a.y - sc * 900 * U; ctx.globalAlpha = .35 * al; ctx.fillStyle = rg(ctx, fx0, fy, 0, sc * 420 * U, ['#FFB04A', '#FF804000']); ctx.fillRect(fx0 - sc * 420 * U, fy - sc * 420 * U, sc * 840 * U, sc * 840 * U); ctx.globalAlpha = 1; flame(fx0, fy - sc * 50 * U, sc * 50 * U, seg.index + d) } continue }
      if (s.k === 'goldidol') { const gl = sc * 900 * U; ctx.globalAlpha = .5 + Math.sin(S.tick * .08) * .2; ctx.fillStyle = rg(ctx, a.x, a.y - gl * .5, 0, gl, ['#FFF6C8', '#FFD23F00']); ctx.fillRect(a.x - gl, a.y - gl * 1.5, gl * 2, gl * 2); ctx.globalAlpha = 1; spr(im, 520, sc, a.x, a.y, 0, al); continue }
      spr(im, SPW[s.k] || 600, sc, sx, yb, anc, al);
      if ((s.k === 'torch' || s.k === 'brazier') && sc * 150 * U > 2) { const fw2 = sc * 150 * U; flame(sx, a.y - fw2 * 2.75, fw2 * .32, seg.index) }
    }
    if (seg.p1.camera.z < PLZ - SEG * .6) continue;   // đã chạy qua (sau lưng em): không vẽ chướng ngại / xu nữa
    if (seg.ob) drawOb(seg, st);
    for (const c of seg.coins) if (!c.got) { const cx = a.x + LANES[c.lane] * a.w, cy = a.y - sc * (c.h + 130) * U, r = Math.max(1.5, sc * 85 * U), ww = Math.abs(Math.cos(S.tick * .1 + seg.index * .4)); ctx.globalAlpha = al; ctx.drawImage(coinIm, cx - r * ww, cy - r, r * 2 * ww + .5, r * 2); if (r > 6 && (S.tick + seg.index * 5) % 40 < 4) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx - r * .7, cy - r * .7, r * .3, r * .3) } ctx.globalAlpha = 1 }
    if (seg.item && !seg.item.got) { const cx = a.x + LANES[seg.item.lane] * a.w, cy = a.y - sc * (270 + Math.sin(S.tick * .1) * 30) * U, r = Math.max(4, sc * 150 * U), cl = { magnet: '#FF5A7A', shield: '#5AB0FF', boost: '#FF9A2A', gem: '#5AE8C8' }[seg.item.k]; ctx.fillStyle = rg(ctx, cx, cy, 0, r * 1.8, ['#FFFFFFee', cl + 'aa', cl + '00']); ctx.fillRect(cx - r * 1.8, cy - r * 1.8, r * 3.6, r * 3.6); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1, r * .1); ctx.beginPath(); ctx.arc(cx, cy, r * 1.05, S.tick * .1, S.tick * .1 + 4.5); ctx.stroke(); ctx.font = Math.round(r * 1.4) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText({ magnet: '🧲', shield: '🛡', boost: '🚀', gem: '💎' }[seg.item.k], cx, cy) }
    for (const m of mBy[seg.index] || []) { const pct = (m.z % SEG) / SEG, b = seg.p2.screen, scc = sc + (b.scale - sc) * pct, mx = m.k === 'spirit' ? (m.act ? m.x : 0) : LANES[m.lane], xx = a.x + (b.x - a.x) * pct + mx * (a.w + (b.w - a.w) * pct), yy = a.y + (b.y - a.y) * pct; ctx.globalAlpha = al; drawMover(m, xx, yy, scc, st); ctx.globalAlpha = 1 }
    for (const g of gBy[seg.index] || []) { const pct = ((g.rz + PLZ) % SEG) / SEG, b = seg.p2.screen, scc = sc + (b.scale - sc) * pct, xx = a.x + (b.x - a.x) * pct + (g.rx / 1000) * (a.w + (b.w - a.w) * pct), yy = a.y + (b.y - a.y) * pct, hh = scc * RH * U; drawRunner(xx, yy, hh, g.c || '#FF7EB6', .62, 'run'); if (hh > 22) label(g.n, xx, yy - hh - 6, Math.max(10, Math.min(14, hh / 7)), '#fff') }
  }
  ctx.restore();
  // em
  const pss = CAMD / PLZ, gy = hz + pss * CAMH * U, pw = pss * RH * U, py = gy - jy * pss * U, px = VW / 2 + (plX * ROADW - camX) * pss * U;
  if (!(phase === 'hit' && hit.why === 'gap')) { ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(px, gy, pw * .2 * (1 - Math.min(.6, jy / 600)), pw * .045, 0, 0, 7); ctx.fill() }
  const fallDy = phase === 'hit' && hit.why === 'gap' ? (90 - phT) * pw * .03 : 0;
  if (phase !== 'over') drawRunner(px, py + fallDy, pw * (1 - fallDy / (pw * 8)), shirtCol(), inv && (S.tick >> 2) & 1 ? .35 : 1, phase === 'hit' ? 'fall' : slideT ? 'slide' : jy > 0 ? 'air' : 'run');
  if (chaseT || phase === 'hit') for (let i = 0; i < 3; i++) drawMonkey(px + (i - 1) * pw * .8, gy + pw * .62 - (phase === 'hit' ? pw * .3 : Math.min(1, chaseT / 60) * pw * .08), pw * .62, i);
  if (shieldT) { ctx.strokeStyle = (S.tick >> 3) & 1 ? '#7FD6FF' : '#FFFFFF'; ctx.lineWidth = 3; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(px, py - pw * .5, pw * .38, pw * .6, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1 }
  if (magT) { ctx.strokeStyle = '#FF5A7A88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py - pw * .5, pw * (.5 + (S.tick % 30) / 60), 0, 7); ctx.stroke() }
  if (boostT) for (let i = 0; i < 6; i++) flame(px + (Math.random() - .5) * pw * .2, py + pw * .05 + i * pw * .05, pw * .06, i);
  if (frozen()) { ctx.fillStyle = '#BFE8FF88'; ctx.fillRect(px - pw * .3, py - pw, pw * .6, pw) }
  if (S.name) label(S.name, px, py - pw - 8, 13, '#fff');
  // đồng hồ vật phẩm: vòng tròn đếm ngược + số giây ngay cạnh nhân vật
  const pws = [[magT, 720, '🧲', '#FF5A7A'], [shieldT, 1200, '🛡️', '#5AB0FF'], [boostT, 330, '🚀', '#FF9A2A']].filter(q => q[0] > 0), Rr = Math.max(15, Math.min(24, pw * .14));
  pws.forEach(([t, full, ic, col], i) => {
    const cx = px + pw * .42 + Rr, cy = py - pw * .78 + i * (Rr * 2.5);
    ctx.fillStyle = '#1A1033cc'; ctx.beginPath(); ctx.arc(cx, cy, Rr + 3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 7); ctx.stroke();
    ctx.strokeStyle = t < 120 && (S.tick >> 3) & 1 ? '#FFFFFF' : col; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(cx, cy, Rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t / full); ctx.stroke();
    ctx.font = Math.round(Rr * .95) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ic, cx, cy + 1);
    label(Math.ceil(t / 60) + 's', cx + Rr + 16, cy + 5, 15, t < 120 ? '#FF8A9A' : '#FFFFFF');
  });
  if (st.petals) {   // cánh hoa anh đào rơi
    while (petals.length < 36) petals.push({ x: Math.random() * VW * 1.2, y: -Math.random() * VH, vx: -.6 - Math.random(), vy: .8 + Math.random() * 1.2, r: 3 + Math.random() * 4, a: Math.random() * 6 });
    for (const q of petals) { q.x += q.vx - (turnT ? turnDir * 4 : 0); q.y += q.vy; q.a += .05; if (q.y > VH + 10 || q.x < -20) { q.x = Math.random() * VW * 1.2; q.y = -10 } ctx.fillStyle = '#FFB8CC'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * .55 * Math.abs(Math.cos(q.a)) + .5, q.a, 0, 7); ctx.fill() }
  }
  const tp = turnsL.find(t => !t.turn.done);   // nhắc RẼ khi tới gần ngã rẽ
  if (tp && phase === 'run') { const zN = pos + PLZ, c = tp.index * SEG; if (zN > c - SEG * 18 && zN < c + SEG * JUNC) { const d = tp.turn.dir; if (zN > c - SEG * 7 || (S.tick >> 3) & 1) label(d < 0 ? '⬅ RẼ TRÁI!' : d > 0 ? 'RẼ PHẢI ➡' : '⬅ RẼ TRÁI / PHẢI ➡', VW / 2, VH * .5, 28, '#FFE24A', '#5A2A00') } }
  if (bg.over) { const ow = VW, oh = ow * bg.over.height / bg.over.width; ctx.drawImage(bg.over, 0, Math.sin(S.tick * .02) * 3 - 6, ow, Math.min(oh, VH * .55)) }
  for (const f of fx) { ctx.globalAlpha = f.l / f.L; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill() } ctx.globalAlpha = 1;
  hud(st);
}
const shirtCol = () => mix(S.color || '#3FBF86', '#F2EAD8', .35);

function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1A1033'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h) }
function stoneBox(x, y, w, h) {   // khung đá viền vàng như game gốc
  ctx.fillStyle = '#1E140A'; rr(x - 4, y - 4, w + 8, h + 8, 12); ctx.fill();
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, ['#7A6040', '#4A3824', '#2E2214']); rr(x, y, w, h, 9); ctx.fill();
  ctx.strokeStyle = lg(ctx, x, 0, x + w, 0, ['#FFE58A', '#B8861E', '#FFF2B0', '#B8861E']); ctx.lineWidth = 2.5; rr(x + 2, y + 2, w - 4, h - 4, 8); ctx.stroke();
  for (const [cx, cy] of [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]]) circ(ctx, cx, cy, 2.5, '#FFE58A');
}
function hud(st) {
  // điểm + xu kiểu khung đá góc phải
  const narrow = VW < 640, bw = narrow ? 130 : 150, lw = narrow ? Math.min(200, VW - bw - 36) : 210; stoneBox(VW - bw - 10, 10, bw, 58);
  ctx.font = '900 22px Nunito,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFE58A'; ctx.fillText(String(score + Math.floor(pos / 50)).padStart(5, '0'), VW - 22, 30);
  ctx.font = '800 16px Nunito,sans-serif'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(stageCoins + ' 🪙', VW - 22, 54);
  // màn · mạng · vật phẩm
  stoneBox(10, 10, lw, 58); ctx.textAlign = 'left'; ctx.font = '800 14px Nunito,sans-serif'; ctx.fillStyle = '#FFE58A'; const t1 = st.ic + ' Màn ' + (S.level + 1) + '/' + NL; ctx.fillText(t1, 20, 28); const nx = 28 + ctx.measureText(t1).width; ctx.font = '700 12px Nunito,sans-serif'; ctx.fillStyle = '#E8DCC0'; ctx.fillText(st.name, nx, 28, lw + 2 - nx); ctx.font = '800 14px Nunito,sans-serif';
  ctx.fillStyle = '#FFFFFF'; ctx.fillText('❤️×' + S.lives + (shieldT ? '  🛡' : '') + (magT ? '  🧲' + Math.ceil(magT / 60) : '') + (boostT ? '  🚀' + Math.ceil(boostT / 60) : ''), 20, 52);
  // thanh tiến độ tới cổng đích
  const pw = narrow ? VW - 60 : Math.min(VW - 260, 420), px = (VW - pw) / 2 - (narrow ? 8 : 0), pyb = narrow ? 76 : 16; if (pw > 80) { ctx.fillStyle = '#1A1033aa'; ctx.fillRect(px - 3, pyb, pw + 6, 14); ctx.fillStyle = '#ffffff44'; ctx.fillRect(px, pyb + 5, pw, 4); ctx.fillStyle = '#FFD23F'; ctx.fillRect(px, pyb + 5, pw * clamp(pos / finishZ, 0, 1), 4);
    for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== WK() + S.level || g.ty == null) continue; ctx.fillStyle = g.c || '#fff'; ctx.beginPath(); ctx.arc(px + pw * clamp(g.ty / finishZ, 0, 1), pyb + 7, 4, 0, 7); ctx.fill() }
    ctx.fillStyle = S.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + pw * clamp(pos / finishZ, 0, 1), pyb + 7, 6, 0, 7); ctx.fill(); ctx.stroke(); ctx.font = '14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(S.level >= NL - 1 ? '👑' : '🏁', px + pw + 6, pyb + 8) }
  // bảng xếp hạng cả lớp
  const rows = [{ n: S.name || 'Em', c: S.color, lv: S.won ? NL : S.level, z: pos, me: 1 }];
  for (const id in S.ghosts) { const g = S.ghosts[id], m = new RegExp('^' + WK() + '(\\d+)$').exec(g.wk || ''); if (!m || g.ty == null) continue; rows.push({ n: g.n || '?', c: g.c || '#fff', lv: +m[1], z: g.ty }) }
  if (rows.length > 1) {
    rows.sort((a, b) => b.lv - a.lv || b.z - a.z); const myRank = rows.findIndex(r => r.me) + 1, show = rows.slice(0, 5); if (myRank > 5) show.push(rows[myRank - 1]);
    const bx = 10, by = narrow ? 98 : 78, w = 176; ctx.fillStyle = '#1A1033bb'; ctx.fillRect(bx, by, w, 22 + show.length * 19);
    ctx.font = '800 12px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFE08A'; ctx.fillText('🏃 Bảng chạy · em hạng ' + myRank + '/' + rows.length, bx + 8, by + 11);
    show.forEach((r, i) => { const y = by + 30 + i * 19, rk = rows.indexOf(r) + 1; if (r.me) { ctx.fillStyle = '#ffffff22'; ctx.fillRect(bx + 2, y - 9, w - 4, 18) } ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(bx + 30, y, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(rk + '.', bx + 8, y); ctx.fillText(String(r.n).slice(0, 11), bx + 40, y); ctx.textAlign = 'right'; ctx.fillStyle = r.lv === S.level ? '#9FE8FF' : '#C9B8FF'; ctx.fillText(r.lv >= NL ? '🏆' : r.lv === S.level ? 'M' + (r.lv + 1) + ' · ' + Math.round(clamp(r.z / finishZ, 0, 1) * 100) + '%' : 'Màn ' + (r.lv + 1), bx + w - 8, y); ctx.textAlign = 'left' });
  }
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); label(banner.w + ' · ' + banner.text, VW / 2, VH * (narrow ? .34 : .24), narrow ? 19 : 22, '#FFE58A'); ctx.globalAlpha = 1 }
  if (phase === 'count') { const n = Math.ceil((phT - 20) / 60); label(n > 0 ? String(n) : 'CHẠY!', VW / 2, VH * .4, n > 0 ? 56 : 44, n > 0 ? '#FFE58A' : '#5CFF8A') }
  if (phase === 'hit') label(hit.why === 'gap' ? '😱 RƠI XUỐNG VỰC!' : '💥 VẤP NGÃ!', VW / 2, VH * .38, 30, '#FF7A1A');
  if (phase === 'over') label('💀 GAME OVER — chạy lại màn này', VW / 2, VH * .38, 22, '#FF4D7A');
  if (phase === 'finish' || phase === 'won') label(S.level >= NL - 1 ? '👑 LẤY ĐƯỢC TƯỢNG VÀNG — PHÁ ĐẢO!' : '🏁 QUA MÀN!', VW / 2, VH * .38, 28, '#5CFF8A');
  if (S.energy <= 0 && S.running && !S.over && phase === 'run') label('⚡ HẾT SỨC — trả lời câu hỏi để chạy tiếp!', VW / 2, VH * .5, 16, '#FFE08A');
  if (chaseT && phase === 'run' && (S.tick >> 4) & 1) label('🐒 Khỉ quỷ đang đuổi!', VW / 2, VH * .33, 16, '#FF9AB8');
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), port = cw / ch < 1.02; room = touch && port ? 150 : 0;
  VW = cw; VH = Math.max(200, ch - room); U = VH / 2;
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else acc = 0;
  draw(); if (room) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#1A1033'; ctx.fillRect(0, VH, cw, ch - VH) }
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: ← → đổi làn · ↑/Space nhảy · ↓ trượt · vuốt trên màn hình cảm ứng ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ' ': 'u', ArrowDown: 'd', s: 'd', S: 'd' };
const press = k => { if (k === 'l') keys.lp = 1; if (k === 'r') keys.rp = 1; if (k === 'u') keys.up = 1; if (k === 'd') keys.dp = 1 };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (!e.repeat) press(k) }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd']].forEach(([id, k]) => { const b = document.getElementById(id); if (!b) return; b.addEventListener('pointerdown', e => { e.preventDefault(); press(k); b.classList.add('dn') }); ['pointerup', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('dn'))); b.addEventListener('contextmenu', e => e.preventDefault()) });
  let sx = 0, sy = 0, sw = false;   // vuốt
  cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; sw = true });
  cv.addEventListener('pointerup', e => { if (!sw) return; sw = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; if (Math.abs(dx) > Math.abs(dy)) press(dx < 0 ? 'l' : 'r'); else press(dy < 0 ? 'u' : 'd') });
}
function init(canvas, stageEl, seed, hooks, level) {
  seenK = {};
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  GC.music.files({ play: { src: 'snd/temple-bgm.mp3' } }, 'temple');   // cả P1 và P2 dùng chung nhạc (play.html gọi start với 'temple')   // nhạc nền gốc, lặp lại suốt lúc chơi
  GC.sfxFiles({ tjump: { src: 'snd/temple-jump.mp3', vol: .55 }, troar: { src: 'snd/temple-roar.mp3', d: .95, vol: .6 }, tscore: { src: 'snd/temple-score.mp3', a: .55, vol: .65 }, tscream: { src: 'snd/temple-scream.mp3', vol: 1 }, tsplat: { src: 'snd/temple-splat.mp3', vol: .45 }, tswish: { src: 'snd/temple-swish.mp3', vol: .9 }, twoosh: { src: 'snd/temple-woosh.mp3', vol: .6 } });
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = 0 }
function place(x, y, old) { const li = old && old.lvl != null ? old.lvl : 0; S.lives = old && old.lf || LIVES; S.coins = old && old.cn || 0; if (li !== S.level) loadStage(li) }
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Màn ' + (S.level + 1) + '/' + NL + ' · 🏁 ' + Math.round(clamp(pos / (finishZ || 1), 0, 1) * 100) + '%';
function extra() { return { lvl: S.level, wk: WK() + (S.won ? NL : S.level), lb: label2(), lf: S.lives, cn: S.coins } }
function hudTxt() { return (S.won ? '🏆 Phá đảo' : '🏃 Màn ' + (S.level + 1) + '/' + NL) + ' · 🪙 ' + S.coins }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud: hudTxt, label: label2, W: 1000, kind: 'temple', get NL() { return NL }, setPart, get part() { return part },
  _dbg: { step, draw, loadStage, segs: () => segs, phase: () => phase, st: () => ({ pos, lane, plX, jy, slideT, speed, finishZ, plz: PLZ }), movers: () => movers, turns: () => turnsL, JUNC, give: () => { magT = 500; shieldT = 1100; boostT = 100 }, keys },
  get winTitle() { return part === 2 ? '🏆 Phá đảo Temple Run P2 — lấy được tượng vàng!' : '🏆 Phá đảo Temple Run P1 — sẵn sàng chinh phục P2!' }, get winToast() { return part === 2 ? '🏆 PHÁ ĐẢO! Em đã vượt cả 5 màn P2 và lấy được tượng vàng 👑!' : '🏆 PHÁ ĐẢO P1! Em đã chạy qua cả 5 màn — thử sức Temple Run P2 nhé!' } };
})();
