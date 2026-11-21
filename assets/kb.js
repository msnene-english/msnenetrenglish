/* kb.js — game "🌌 Đấu Trường Ngân Hà" (lối chơi kiểu "bắn văng khỏi thanh", mã game: kb).
   Nhìn ngang, có trọng lực: 5 KHU đánh số 1 → 5 nối nhau theo chiều ngang (số to mờ phía trên mỗi khu, mũi tên ← → chỉ sang khu bên cạnh),
   mỗi khu có 1 thanh gạch dài + thanh nhỏ phía trên để nhảy lên. Thanh gạch vẽ 3D: mặt trên vàng kẻ ô, mặt trước khối gạch hồng / xanh / tím, viền vàng, tấm vàng bên dưới.
   Nhân vật "gim" như bản gốc (thân vòm, 2 mắt đen dọc, chân ngắn) — tên & % ngay dưới chân. Camera bám sát em.
   Bắn súng năng lượng hất văng bạn: càng bị trúng nhiều, % càng cao, càng dễ bay xa. Rơi xuống vực / văng ra ngoài = bị hạ gục (K.O.),
   người bắn trúng cuối cùng (trong 7 giây) được +1 ⭐. Hồi sinh sau 1,5 giây, rơi từ trời xuống, bất tử 2,5 giây.
   ⚡ là đạn: bắn & nhảy tốn ⚡ (đi bộ không tốn) — hết ⚡ phải trả lời câu hỏi; lúc trả lời câu hỏi nhân vật mờ đi 📝, đạn bay xuyên qua, không ai bắn được.
   Súng chỉ bắn NGANG theo hướng quay mặt (← → để quay) — muốn bắn bạn ở trên cao phải nhảy lên thanh đó. F / bấm chuột / chạm màn hình / nút 💥 để bắn (bấm bên nào của nhân vật thì quay sang bên đó).
   Vật phẩm trên các thanh (mọi máy thấy giống nhau, tính theo giờ chung của phòng): 🔋 pin · 🔥 đạn khủng · 🌟 bắn 3 tia · 🫧 khiên · 👟 giày tốc độ · 🩹 băng cứu · 🍄 nấm khổng lồ.
   Mạng: vị trí & phát bắn đi kênh nhanh net.fast (không qua trang cô); máy bị bắn tự tính trúng / văng / ai hạ.
   Bot (2–3 bạn) khi chơi một mình: link bài tập về nhà / chơi thử, hoặc phòng chỉ có 1 học sinh (lớp 1-1). Phòng từ 2 học sinh trở lên: các bạn đấu với nhau, KHÔNG có bot. Nhạc nền: snd/kb-bgm.mp3 (cô Chí Nên chọn).
   Cùng giao diện: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'kb' */
window.Knock = (function () {
const { clamp, rng } = GC;
const G = .8, GH = .32, JUMP = -13.5, JUMP2 = -11, HOLD = 22,   /* giữ nút nhảy lâu: 1 cú là lên tới thanh xanh / hộp tím (không cần nhảy 2 lần) */ RUN = 5.8, BSP = 17, BLIFE = 58, KO_DELAY = 90, INV = 150, DROP = 46, BW = 44, BH = 46, O = '#1D1336';
const COL = { pink: ['#D9365E', '#B5244A'], green: ['#23B57B', '#178A5C'], purple: ['#C978E8', '#9F52C4'] };
// 5 khu nối nhau theo chiều ngang: mỗi khu 1 thanh dài (cùng độ cao) + thanh xanh & hộp tím phía trên · khe giữa 2 khu 220 (nhảy qua được)
const ZX = [0, 1320, 2640, 3960, 5280], BARS = [];
ZX.forEach((x0, z) => {
  BARS.push({ x: x0, y: 680, w: 1100, c: 'pink', z });
  if (z === 2) BARS.push({ x: x0 + 140, y: 480, w: 300, c: 'green', z }, { x: x0 + 660, y: 480, w: 300, c: 'green', z }, { x: x0 + 480, y: 300, w: 140, c: 'purple', z });
  else if (z % 2) BARS.push({ x: x0 + 470, y: 470, w: 400, c: 'green', z }, { x: x0 + 140, y: 510, w: 150, c: 'purple', z });
  else BARS.push({ x: x0 + 220, y: 480, w: 380, c: 'green', z }, { x: x0 + 780, y: 520, w: 150, c: 'purple', z });
});
const W = 6380, ZC = ZX.map(x => x + 550), MAIN = BARS.map((B, i) => B.c === 'pink' ? i : -1).filter(i => i >= 0), CX = ZC[2], ZY = ZC.map((c, i) => Math.min(...BARS.filter(B => B.z === i).map(B => B.y)) - 120);   // ZY: chỗ in số khu (trên thanh cao nhất của khu)
const ITEMS = [
  { k: 'bat', ic: '🔋', name: 'Pin năng lượng', wt: 26, col: '#7CF29A', txt: '+40 ⚡' },
  { k: 'mega', ic: '🔥', name: 'Đạn khủng', wt: 13, col: '#FF9A6B', txt: '3 phát đạn khủng — văng cực xa!' },
  { k: 'spread', ic: '🌟', name: 'Bắn 3 tia', wt: 13, col: '#FFE680', txt: 'Bắn 3 tia trong 10 giây' },
  { k: 'shield', ic: '🫧', name: 'Khiên bong bóng', wt: 12, col: '#8FE3FF', txt: 'Khiên chặn đạn 6 giây' },
  { k: 'speed', ic: '👟', name: 'Giày tốc độ', wt: 12, col: '#B9F2FF', txt: 'Chạy nhanh, nhảy xa 10 giây' },
  { k: 'heal', ic: '🩹', name: 'Băng cứu', wt: 12, col: '#FFA8CC', txt: 'Giảm 50% sát thương' },
  { k: 'giant', ic: '🍄', name: 'Nấm khổng lồ', wt: 9, col: '#FF7B7B', txt: 'To & nặng 8 giây — khó bị văng!' }];
const SLOT = 4500, ILIFE = 24000;
const LVS = { 1: { cs: 8, cj: 3, bots: 2, aim: .45, react: 24, bpw: .75 }, 2: { cs: 10, cj: 4, bots: 3, aim: .65, react: 15, bpw: .9 }, 3: { cs: 12, cj: 5, bots: 3, aim: .85, react: 9, bpw: 1 } };   // cs / cj: ⚡ mỗi phát bắn / mỗi lần nhảy · bpw: sức đẩy đạn của bot
const BOTS = [['Bot Mèo Mun', '#9FA8FF'], ['Bot Thỏ Ngọc', '#FFB3D1'], ['Bot Cún Vàng', '#FFD98A']];
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#FF8FB8', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: null, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, kos: 0, now: () => Date.now(), hooks: {} };
const PLS = { x: 0, y: 0, face: 1 };   // vị trí đưa lên trang cô (cố định → không gửi toạ độ liên tục qua trang cô; vị trí thật đi kênh nhanh)
const keys = { l: 0, r: 0, u: 0, d: 0, sh: 0, up: 0 }, ptr = { on: 0, x: 0, y: 0, mouse: 0, t: 0, tap: 0 };
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, cam = { x: 0, y: 0 }, seed0 = 7, LV = LVS[2], last = 0, acc = 0, shotN = 0, shake = 0, flashT = 0;
let bgP = null, link = null, me = 'me', aloneT = 0, roomN = 0, emptyT = 0, sendT = 0, lastSig = '';
const pl = body('me', '', '#FF8FB8', false), bots = [], R = {}, SH = [], PT = [], FEED = [], BAN = [], taken = new Set();
const now = () => S.now(), myV = () => typeof APPV !== 'undefined' ? APPV : '';   // APPV: số bản game của trang (play.html)
let staleT = 0;
function body(id, n, c, bot) { return { id, n, c, bot, x: CX, y: 680, vx: 0, vy: 0, a: 0, face: 1, gnd: -1, jumps: 1, d: 0, stun: 0, inv: 0, cd: 0, dead: 0, drop: 0, z: 0, ddrop: 0, mega: 0, spread: 0, shield: 0, speed: 0, giant: 0, last: null, walk: 0, flash: 0, recoil: 0, sq: 0, kos: 0, I: { l: 0, r: 0, jp: 0, dn: 0, sh: 0, a: null }, think: 0, fireT: 0 } }
const alive = b => b && !b.dead;
const safe = () => !S.running;   // đang trả lời / chưa bắt đầu / đã nộp: bong bóng bảo vệ
const sz = b => b.giant > 0 ? 1.4 : 1;
const zoneOf = x => { let bi = 0, bd = 1e9; ZC.forEach((c, i) => { const d = Math.abs(c - x); if (d < bd) { bd = d; bi = i } }); return bi };
const nameOf = id => id === me ? (S.name || 'Em') : (R[id] && R[id].n) || ((bots.find(b => b.id === id) || {}).n) || 'Một bạn';
const colOf = id => id === me ? S.color : (R[id] && R[id].c) || ((bots.find(b => b.id === id) || {}).c) || '#ccc';
function mix(a, b, t) { if (!/^#?[0-9a-f]{3,6}$/i.test(String(a))) return a; const p = s => { s = String(s).replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) || 0) }, A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('') }
const lt = (c, t) => mix(c, '#ffffff', t), dk = (c, t) => mix(c, '#140A2E', t);
function rr(x, X, Y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath() }
const F = (s, w, it) => (it ? 'italic ' : '') + (w || 800) + ' ' + s + "px 'Baloo 2', Nunito, system-ui, sans-serif";
function snd(k, b) {   // chỉ phát tiếng của mình / gần mình cho đỡ ồn
  if (b && b !== pl && !b.near) return;
  try {
    if (k === 'shot') GC.tone(820, .07, 'square', .03, 380); else if (k === 'mega') GC.tone(300, .25, 'sawtooth', .07, 80);
    else if (k === 'hit') { GC.tone(220, .13, 'square', .07, 90); GC.tone(1200, .05, 'triangle', .04, 600) } else if (k === 'tink') GC.tone(1500, .06, 'triangle', .04, 1900);
    else if (k === 'ko') { GC.sfx('cannon'); GC.tone(900, .5, 'triangle', .06, 120, .05) } else if (k === 'kome') [523, 659, 784, 1047, 1319].forEach((f, i) => GC.tone(f, .16, 'square', .05, 0, i * .07));
    else if (k === 'item') GC.sfx('bat'); else if (k === 'jump') GC.tone(400, .12, 'square', .03, 720); else if (k === 'jump2') GC.tone(560, .12, 'triangle', .045, 1100);
    else if (k === 'spawn') GC.tone(420, .3, 'sine', .07, 1260);
  } catch (e) { }
}
/* ═════ vật phẩm theo giờ chung của phòng (mọi máy giống nhau) ═════ */
function itemAt(k) {
  const r = rng(seed0 * 977 + k * 131 + 7); r(); let s = r() * 97, ty = ITEMS[0];
  for (const it of ITEMS) { if ((s -= it.wt) < 0) { ty = it; break } }
  const B = BARS[Math.floor(r() * BARS.length)];
  return { k, ty, x: B.x + 30 + r() * (B.w - 60), y: B.y, t0: k * SLOT };
}
function activeItems(t0) { const t = t0 || now(), k1 = Math.floor(t / SLOT), out = []; for (let k = k1 - 5; k <= k1; k++) { if (taken.has(k)) continue; const it = itemAt(k); if (t >= it.t0 && t < it.t0 + ILIFE) out.push(it) } return out }
/* ═════ vật lí chung cho em & bot: chạy, nhảy 2 lần, đứng trên thanh (đi xuyên từ dưới lên), ↓ xuống thanh dưới ═════ */
function pay(b, c) {
  if (b.bot) return true;
  if (S.energy >= c) { S.energy -= c; return true }
  if (performance.now() - emptyT > 1500) { emptyT = performance.now(); banner('⚡ Hết năng lượng! Trả lời câu hỏi để nạp ⚡ nhé', '#FFE680', 1600); S.hooks.onEmpty && S.hooks.onEmpty() }
  return false;
}
function phys(b, I) {
  for (const k of ['stun', 'inv', 'cd', 'shield', 'speed', 'giant', 'spread', 'flash', 'recoil', 'sq', 'ddrop']) if (b[k] > 0) b[k]--;
  if (b.drop > 0) { b.drop--; b.z = Math.pow(b.drop / DROP, 2) * 600; if (!b.drop) { b.z = 0; dust(b.x, b.y, 8); ring(b.x, b.y, lt(b.c, .3), 46) } return }
  const onG = b.gnd >= 0, stun = b.stun > 0, max = (b.giant > 0 ? 4.8 : RUN) * (b.speed > 0 ? 1.4 : 1), a = (onG ? 1.15 : .62) * (stun ? .22 : 1);
  const mv = I.l && !I.r ? -1 : I.r && !I.l ? 1 : 0;
  if (mv) { b.vx += mv * a; b.face = mv }   // bấm ← → là quay mặt ngay (kể cả lúc đang bị choáng)
  if (!stun && Math.abs(b.vx) > max) b.vx = Math.sign(b.vx) * Math.max(max, Math.abs(b.vx) * .86);
  if (!mv || stun) b.vx *= onG ? (stun ? .9 : .72) : .978;
  if (I.jp && !stun) {
    if (onG) { if (pay(b, LV.cj)) { b.vy = JUMP * (b.giant > 0 ? .93 : 1); b.hold = HOLD; b.gnd = -1; b.jumps = 1; b.sq = 6; dust(b.x, b.y, 5); snd('jump', b) } }
    else if (b.jumps < 2) { if (pay(b, LV.cj)) { b.vy = JUMP2; b.hold = HOLD - 2; b.jumps = 2; ring(b.x, b.y, '#ffffff', 24); snd('jump2', b) } }
  }
  if (I.dn && onG) { const P0 = BARS[b.gnd]; if (BARS.some((B, i) => i !== b.gnd && B.y > P0.y + 20 && b.x > B.x + 16 && b.x < B.x + B.w - 16)) { b.gnd = -1; b.ddrop = 14; b.y += 3; b.jumps = 1 } }   // ↓ chỉ thả xuống khi ngay bên dưới có thanh khác để đáp · đứng ở thanh dài thấp nhất thì ↓ không làm rơi
  const oy = b.y;
  if (b.gnd < 0) {   // giữ nút nhảy càng lâu càng bay cao (chạm nhanh = nhảy thấp) · bot luôn nhảy hết sức
    if (b.hold > 0 && b.vy < 0 && (b.bot || I.hu)) { b.vy += GH; b.hold-- } else { b.hold = 0; b.vy += G }
    b.vy = Math.min(b.vy, 18);
  }
  b.x += b.vx; b.y += b.vy;
  const hw = BW * sz(b) / 2;
  if (b.gnd >= 0) { const p = BARS[b.gnd]; if (b.x + hw * .6 > p.x && b.x - hw * .6 < p.x + p.w) { b.y = p.y; b.vy = 0 } else { b.gnd = -1; b.jumps = Math.max(1, b.jumps) } }
  else if (b.vy >= 0 && b.ddrop <= 0) {
    for (let i = 0; i < BARS.length; i++) { const p = BARS[i]; if (oy <= p.y + 2 && b.y >= p.y && b.x + hw * .6 > p.x && b.x - hw * .6 < p.x + p.w) { if (b.vy > 9) dust(b.x, p.y, 7); b.y = p.y; b.vy = 0; b.gnd = i; b.jumps = 0; b.sq = 5; break } }
  }
  b.walk = onG && mv ? b.walk + Math.min(.35, Math.abs(b.vx) * .06) : b.walk * .8;
  if (I.a != null) { b.a = I.a; b.face = Math.cos(I.a) >= 0 ? 1 : -1 }
  if (I.sh && b.cd <= 0 && !stun) fire(b);
  if (b.y > 1350 || b.x < -600 || b.x > W + 600 || b.y < -1100) ko(b);
}
function fire(b) {
  if (!pay(b, LV.cs)) { b.cd = 20; return }
  const k = b.mega > 0 ? 1 : b.spread > 0 ? 2 : 0; if (k === 1) b.mega--;
  const big = b.giant > 0, a = b.a, s = sz(b), x = b.x + Math.cos(a) * 36 * s, y = b.y - 24 * s + Math.sin(a) * 30 * s, id = b.id + '.' + (++shotN).toString(36);
  b.cd = big ? 18 : 14; const kk = (k === 1 ? 2.6 : .7) * (b.gnd >= 0 ? .4 : 1); b.vx -= Math.cos(a) * kk; if (b.gnd < 0) b.vy -= Math.sin(a) * kk; b.recoil = 6;
  spawnShot(b.id, b.c, x, y, a, k, id, 0, big);
  if (b === pl && link) send({ e: 's', i: me, x: Math.round(x), y: Math.round(y), a: Math.round(a * 1000), k, id, g: big ? 1 : 0, t: Math.round(now()) });
  snd(k === 1 ? 'mega' : 'shot', b);
}
function spawnShot(own, col, x, y, a, k, id, age, big) {
  const mk = (da, sid) => {
    const s = { own, col: lt(col, .15), x, y, vx: Math.cos(a + da) * BSP, vy: Math.sin(a + da) * BSP, r: k === 1 ? 13 : big ? 10 : 8, pw: (k === 1 ? 1.7 : big ? 1.2 : 1) * (/^bot/.test(own) ? LV.bpw : 1), dm: k === 1 ? 15 : k === 2 ? 6 : 9, life: BLIFE, id: sid, k, tr: [] };
    for (let i = 0; i < age; i++) { s.x += s.vx; s.y += s.vy; s.life-- }
    SH.push(s);
  };
  if (k === 2) { mk(-.2, id + 'a'); mk(0, id + 'b'); mk(.2, id + 'c') } else mk(0, id);
  for (let i = 0; i < 6; i++) PT.push({ x, y, vx: Math.cos(a) * (2 + Math.random() * 4) + (Math.random() - .5) * 2, vy: Math.sin(a) * (2 + Math.random() * 4) + (Math.random() - .5) * 2, life: 12, max: 12, col: k === 1 ? '#FFB36B' : '#FFF6B0', r: 3 + Math.random() * 3 });
}
const hitBox = (b, x, y, r) => { const s = sz(b); return x + r > b.x - BW * s / 2 && x - r < b.x + BW * s / 2 && y + r > b.y - BH * s && y - r < b.y };
function hitBody(b, s) {
  if (!alive(b) || b.drop > 0 || (b === pl && safe())) return false;   // đang trả lời câu hỏi: nhân vật mờ, đạn bay xuyên qua như bản gốc
  if (b.inv > 0 || b.shield > 0) { snd('tink', b); spark(s.x, s.y, '#BFF4FF', 8); return true }
  b.d += s.dm; const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, kb = (6.5 + b.d * .085) * s.pw * (b.giant > 0 ? .5 : 1);
  b.vx = ux * kb + b.vx * .2; b.vy = Math.min(b.vy, 0) + uy * kb * .6 - (kb * .35 + 2.4); b.gnd = -1; b.jumps = 1; b.stun = Math.round(9 + kb * 1.3); b.flash = 9;
  b.last = { by: s.own, t: now() };
  spark(s.x, s.y, s.col, 14); pop(b.x, b.y - 80, '+' + s.dm + '%', '#FFE680'); snd('hit', b);
  if (b === pl) { S.hits++; shake = Math.max(shake, 7 + kb * .5); if (link && s.own !== me) send({ e: 'h', i: me, by: s.own, id: s.id }) }
  else if (s.own === me) { S.stomps++; pop(b.x, b.y - 108, 'TRÚNG!', '#7CF29A'); shake = Math.max(shake, 3) }
  return true;
}
function ko(b) {
  if (b.dead) return;
  const by = b.last && now() - b.last.t < 7000 ? b.last.by : null;
  blast(clamp(b.x, cam.x + 40, cam.x + cw / sc - 40), clamp(b.y - 20, cam.y + 40, cam.y + ch / sc - 40), b === pl ? S.color : b.c);
  b.dead = KO_DELAY; b.vx = b.vy = 0; b.last = null;
  feed(by, b.id); snd('ko', b);
  if (b === pl) {
    S.falls++; shake = 16; flashT = 10;
    if (link) send({ e: 'k', i: me, by, t: Math.round(now()) });
    S.hooks.onFall && S.hooks.onFall(0, by ? '💫 Bị ' + nameOf(by) + ' bắn văng! Hồi sinh ngay — phục thù nào!' : '💫 Lỡ rơi xuống rồi! Hồi sinh ngay nè');
  }
  { const k = bots.find(x => x.id === by); if (k) k.kos++ }
  if (by === me && b !== pl) myKO(b.n);
}
function myKO(vn) {
  S.kos++; S.level = Math.floor(S.kos / 5); snd('kome'); S.hooks.onKO && S.hooks.onKO(vn, S.kos);
  banner('💥 K.O.! Em đã hạ ' + vn + ' · ⭐ ' + S.kos, '#7CF29A', 2200);
  for (let i = 0; i < 26; i++) PT.push({ x: pl.x, y: pl.y - 60, vx: (Math.random() - .5) * 9, vy: -Math.random() * 9 - 2, g: .3, life: 50, max: 50, col: ['#FF6FA5', '#FFE680', '#7CF29A', '#8FE3FF', '#C79BFF'][i % 5], r: 3 + Math.random() * 3, cf: 1 });
  if (S.kos % 5 === 0) S.hooks.onCP && S.hooks.onCP(S.kos / 5, 'lv');
}
function spawn(b) {   // hồi sinh ở khu vắng người nhất, rơi từ trời xuống thanh dài của khu đó
  const cnt = ZC.map((c, i) => { let n = Math.random() * .9; for (const o of everyone()) if (o !== b && alive(o) && zoneOf(o.x) === i) n++; for (const id in R) if (!R[id].dead && zoneOf(R[id].x) === i) n++; return [n, i] }).sort((a, z) => a[0] - z[0]);
  const B = BARS[MAIN[cnt[0][1]]], x = B.x + 120 + Math.random() * (B.w - 240);
  Object.assign(b, { x, y: B.y, vx: 0, vy: 0, gnd: MAIN[cnt[0][1]], jumps: 0, d: 0, inv: INV, dead: 0, drop: DROP, z: 600, stun: 0, mega: 0, spread: 0, shield: 0, speed: 0, giant: 0, face: x < B.x + B.w / 2 ? 1 : -1 });
  b.a = b.face > 0 ? 0 : Math.PI; snd('spawn', b);
}
function applyItem(b, it) {
  const k = it.ty.k;
  if (k === 'bat') { if (b === pl) S.energy = S.cap ? Math.min(S.cap, S.energy + 40) : S.energy + 40 }
  else if (k === 'mega') b.mega = 3; else if (k === 'spread') b.spread = 600; else if (k === 'shield') b.shield = 360; else if (k === 'speed') b.speed = 600;
  else if (k === 'heal') b.d = Math.max(0, b.d - 50); else if (k === 'giant') b.giant = 480;
  ring(it.x, it.y - 30, it.ty.col, 34); pop(b.x, b.y - 100, it.ty.ic + ' ' + it.ty.name, it.ty.col);
  if (b === pl) { snd('item'); banner(it.ty.ic + ' ' + it.ty.name + ': ' + it.ty.txt, it.ty.col, 1800) }
}
const everyone = () => [pl].concat(bots);
/* ═════ ngắm của em: chuột / chạm màn hình / nút 💥 tự ngắm bạn gần nhất ═════ */
function myAim() {   // súng luôn bắn NGANG theo hướng quay mặt · bấm chuột / chạm màn hình bên nào của nhân vật thì quay sang bên đó
  if (ptr.on && Math.abs(ptr.x - pl.x) > 8) pl.face = ptr.x > pl.x ? 1 : -1;
  return pl.face > 0 ? 0 : Math.PI;
}
/* ═════ bot (chỉ khi em đang chơi một mình): đi theo đường nối giữa các thanh, nhảy kép, không tự đi ra mép ═════ */
const gapOf = (A, B) => Math.max(0, Math.max(A.x, B.x) - Math.min(A.x + A.w, B.x + B.w));
const LINK = BARS.map((A, i) => BARS.map((B, j) => j).filter(j => j !== i && gapOf(A, BARS[j]) <= 320 && A.y - BARS[j].y <= 245 && (gapOf(A, BARS[j]) > 0 || Math.abs(A.y - BARS[j].y) > 60)));
function nextHop(a, z) { if (a === z) return a; const prev = { [a]: -1 }, q = [a]; while (q.length) { const c = q.shift(); if (c === z) break; for (const n of LINK[c]) if (!(n in prev)) { prev[n] = c; q.push(n) } } if (!(z in prev)) return -1; let c = z; while (prev[c] !== a) c = prev[c]; return c }
function barUnder(x, y) { let best = -1, bd = 1e9; BARS.forEach((B, i) => { if (x > B.x - 10 && x < B.x + B.w + 10 && B.y >= y - 10 && B.y - y < bd) { bd = B.y - y; best = i } }); return best }
function botAI(b) {
  const I = b.I; I.jp = I.sh = I.dn = 0; I.l = I.r = 0; I.a = null;
  if (b.dead || b.drop > 0) return I;
  const go = x => { if (x < b.x - 10) I.l = 1; else if (x > b.x + 10) I.r = 1 };
  if (--b.think <= 0) {   // nhịp suy nghĩ: chọn bạn để bắn + chỗ đứng (luôn là một điểm TRÊN thanh)
    b.think = LV.react + Math.floor(Math.random() * 8);
    let tg = null, td = 1e9; for (const o of everyone()) { if (o === b || !alive(o) || o.drop > 0 || o.inv > 30 || (o === pl && safe())) continue; const d = Math.hypot(o.x - b.x, (o.y - b.y) * 1.5); if (d < td) { td = d; tg = o } }
    b.tg = tg; const here = b.gnd >= 0 ? b.gnd : barUnder(b.x, b.y), it = activeItems().find(it => Math.abs(it.x - b.x) < 360 && Math.abs(it.y - b.y) < 260);
    if (it) { b.gi = barUnder(it.x, it.y - 5); b.gx = it.x }
    else if (tg) { const ti = tg.gnd >= 0 ? tg.gnd : barUnder(tg.x, tg.y); b.gi = ti >= 0 ? ti : here >= 0 ? here : 6; const T = BARS[b.gi], side = b.x < tg.x ? -1 : 1; let gx = tg.x + side * (180 + Math.random() * 140); if (gx < T.x + 30 || gx > T.x + T.w - 30) gx = tg.x - side * (180 + Math.random() * 140); b.gx = gx }
    else { b.gi = 6; b.gx = CX + (Math.random() - .5) * 600 }
    if (b.gi < 0) b.gi = 6; const T = BARS[b.gi]; b.gx = clamp(b.gx, T.x + 30, T.x + T.w - 30);
  }
  if (b.gnd < 0) {   // trên không: lái về thanh đích (hoặc thanh gần nhất còn với tới), hụt thì nhảy kép
    const top = b.y - (b.vy < 0 ? b.vy * b.vy / (2 * G) : 0) - (b.jumps < 2 ? 100 : 0), reach = i => BARS[i].y >= top;
    if (b.stun > 0 || b.air == null || !reach(b.air)) { let bi = -1, bd = 1e9; BARS.forEach((D, i) => { if (!reach(i)) return; const d = (b.x < D.x ? D.x - b.x : b.x > D.x + D.w ? b.x - D.x - D.w : 0) + Math.max(0, D.y - b.y) * .15; if (d < bd) { bd = d; bi = i } }); b.air = bi >= 0 ? bi : MAIN[zoneOf(b.x)] }
    const D = BARS[b.air]; go(clamp(b.air === b.gi ? b.gx : D.x + D.w / 2, D.x + 40, D.x + D.w - 40));
    const over = b.x > D.x + 12 && b.x < D.x + D.w - 12;
    if (b.vy > 1 && b.jumps < 2 && (b.y > D.y - 8 || (!over && b.y > D.y - 80))) I.jp = 1;
  } else {
    const c = b.gnd, C = BARS[c];
    if (c === b.gi) go(b.gx);
    else {
      const h = nextHop(c, b.gi), Hh = h >= 0 ? BARS[h] : null;
      if (!Hh) go(b.gx);
      else { b.air = h; const gap = gapOf(C, Hh);
        if (gap === 0 && Hh.y < C.y) { const o0 = Math.max(C.x, Hh.x) + 30, o1 = Math.min(C.x + C.w, Hh.x + Hh.w) - 30, tx = (o0 + o1) / 2; go(tx); if (Math.abs(b.x - tx) < Math.max(40, (o1 - o0) / 2)) I.jp = 1 }
        else if (gap === 0) { const o0 = Math.max(C.x, Hh.x) + 30, o1 = Math.min(C.x + C.w, Hh.x + Hh.w) - 30; go((o0 + o1) / 2); if (b.x > o0 && b.x < o1) I.dn = 1 }
        else { const dir = Hh.x > C.x ? 1 : -1, ex = dir > 0 ? C.x + C.w - 12 : C.x + 12; if (dir > 0) I.r = 1; else I.l = 1; if (dir > 0 ? b.x > ex - 22 : b.x < ex + 22) I.jp = 1 }   // nhảy sát mép cho bay được xa nhất
      }
    }
    // mép thanh: không bước ra ngoài nếu không định nhảy
    if (!I.jp && !I.dn) { const nx = b.x + b.vx * 6 + (I.r ? 14 : I.l ? -14 : 0); if (nx < C.x + 12 || nx > C.x + C.w - 12) { I.l = I.r = 0; if (Math.abs(b.vx) > 2) { if (b.vx > 0) I.l = 1; else I.r = 1 } } }
    // né đạn: nhảy tại chỗ
    for (const s of SH) if (s.own !== b.id && Math.abs(s.y - (b.y - 24)) < 30 && Math.sign(b.x - s.x) === Math.sign(s.vx) && Math.abs(b.x - s.x) < 180 && Math.random() < LV.aim * .08) { I.jp = 1; break }
  }
  // kẹt một chỗ quá lâu → đổi đích
  if (S.tick % 60 === 0) { if (b.sx != null && Math.abs(b.x - b.sx) < 20 && (I.l || I.r)) { b.gi = MAIN[zoneOf(b.x)]; b.gx = BARS[b.gi].x + BARS[b.gi].w * (.25 + Math.random() * .5); b.think = 90 } b.sx = b.x }
  // bắn: trong tầm, có nhịp nghỉ (bot không tốn ⚡ nên bắn thưa hơn người)
  if (b.fireT > 0) b.fireT--;
  const tg = b.tg && alive(b.tg) && b.tg.drop <= 0 ? b.tg : null;
  if (tg) { const dx = tg.x - b.x, dy = tg.y - b.y; if (Math.abs(dx) < 720 && Math.abs(dx) > 20 && Math.abs(dy) < 34) { I.a = dx > 0 ? 0 : Math.PI; if (b.fireT <= 0 && b.stun <= 0) { if (Math.random() < LV.aim) I.sh = 1; b.fireT = Math.round(42 - LV.aim * 20 + Math.random() * 18) } } }   // bot cũng chỉ bắn ngang, khi đứng cùng tầng với bạn
  if (I.a == null) I.a = I.l ? Math.PI : I.r ? 0 : b.face > 0 ? 0 : Math.PI;
  return I;
}
function syncBots() {   // có bot khi chơi MỘT MÌNH: link bài tập về nhà / chơi thử, hoặc phòng chỉ có 1 học sinh (lớp 1-1) · phòng từ 2 bạn trở lên: không có bot
  const want = !link || (roomN <= 1 && aloneT > 210);
  if (want) { while (bots.length < LV.bots) { const [n, c] = BOTS[bots.length]; const b = body('bot' + bots.length, n, c, true); bots.push(b); spawn(b) } }
  else if (bots.length) { for (const b of bots) if (alive(b)) ring(b.x, b.y - 24, '#ffffff', 40); bots.length = 0; banner('👋 Có bạn vào phòng rồi — bot rút lui, đấu thật nào!', '#8FE3FF', 2400) }
}
function setPlayers(n) { roomN = n }   // play.html báo số bạn đang online trong phòng
/* ═════ mạng: kênh nhanh (vị trí ~9 lần/giây, phát bắn, trúng, hạ gục, nhặt đồ) ═════ */
function send(m) { try { link && link.send(m) } catch (e) { } }
function onNet(m) {
  if (!m || !m.i || m.i === me) return;
  const at = performance.now(), r = R[m.i] || (R[m.i] = { buf: [], n: m.n || '…', c: m.c || '#ccc', a: 0, f: 1, d: 0, s: 0, k: 0, z: 0, flash: 0, x: m.x || CX, y: m.y || 680, dead: false, walk: 0, vx: 0, vy: 0 });
  r.last = at; if (m.n) r.n = m.n; if (m.c) r.c = m.c;
  if (m.v && m.v > myV() && performance.now() - staleT > 8000) { staleT = performance.now(); banner('⚠️ Máy em đang chạy bản game CŨ — bấm tải lại trang (↻) để chơi đúng luật nhé!', '#FFB36B', 5000) }   // bạn khác có bản mới hơn
  if (m.e === 'p') {
    const dead = !!(m.s & 16); if (r.dead && !dead) r.buf = []; r.dead = dead;
    r.buf.push({ at, x: m.x, y: m.y, vx: m.vx || 0, vy: m.vy || 0, z: m.z || 0 }); if (r.buf.length > 8) r.buf.shift();
    r.a = (m.a || 0) / 1000; r.f = m.f || 1; r.d = m.d || 0; r.s = m.s || 0; r.k = m.k || 0; r.mv = !!m.m; r.vx = m.vx || 0; r.vy = m.vy || 0;
  } else if (m.e === 's') spawnShot(m.i, r.c, m.x, m.y, (m.a || 0) / 1000, m.k, m.id, clamp(Math.round((now() - m.t) / 16.7), 0, 12), m.g);
  else if (m.e === 'h') {
    for (let i = SH.length - 1; i >= 0; i--) if (SH[i].id === m.id) SH.splice(i, 1);
    r.flash = 9; spark(r.x, r.y - 24, '#FFF6B0', 12);
    if (m.by === me) { S.stomps++; pop(r.x, r.y - 108, 'TRÚNG!', '#7CF29A'); snd('hit') }
  } else if (m.e === 'k') { blast(clamp(r.x, cam.x + 40, cam.x + cw / sc - 40), clamp(r.y - 20, cam.y + 40, cam.y + ch / sc - 40), r.c); r.dead = true; r.buf = []; feed(m.by, m.i); if (m.by === me) myKO(r.n) }
  else if (m.e === 't') taken.add(m.k);
}
function rpos(r, t) {
  const b = r.buf; if (!b.length) return null; const rt = t - 110, l = b[b.length - 1];
  if (b.length === 1 || rt >= l.at) { const u = clamp((rt - l.at) / 16.7, 0, 10); return { x: l.x + l.vx * u, y: l.y + l.vy * u, z: l.z } }
  for (let i = b.length - 1; i > 0; i--) if (b[i - 1].at <= rt) { const a = b[i - 1], c = b[i], u = (rt - a.at) / ((c.at - a.at) || 1); return { x: a.x + (c.x - a.x) * u, y: a.y + (c.y - a.y) * u, z: a.z + (c.z - a.z) * u } }
  return { x: b[0].x, y: b[0].y, z: b[0].z };
}
function netTick(ts) {
  if (!link) return;
  const p = pl, s = (safe() ? 1 : 0) | (p.shield > 0 ? 2 : 0) | (p.inv > 0 ? 4 : 0) | (p.speed > 0 ? 8 : 0) | (p.dead ? 16 : 0) | (p.spread > 0 ? 32 : 0) | (p.mega > 0 ? 64 : 0) | (p.drop > 0 ? 128 : 0) | (p.giant > 0 ? 512 : 0) | (p.stun > 0 ? 1024 : 0);
  const mv = p.gnd >= 0 && Math.abs(p.vx) > .4 ? 1 : 0, sig = Math.round(p.x) + ',' + Math.round(p.y) + ',' + s + ',' + Math.round(p.d) + ',' + Math.round(p.a * 20) + ',' + S.kos + ',' + Math.round(p.z);
  if (ts - sendT < (sig === lastSig ? 1000 : 105)) return;
  sendT = ts; lastSig = sig;
  send({ e: 'p', i: me, n: S.name, c: S.color, x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.vx * 10) / 10, vy: Math.round(p.vy * 10) / 10, a: Math.round(p.a * 1000), f: p.face, d: Math.round(p.d), s, k: S.kos, z: Math.round(p.z), m: mv, v: myV() });
}
function attachNet(L) { link = L; me = L.me || me; pl.id = me; L.on(onNet); bots.length = 0 }
/* ═════ hiệu ứng ═════ */
function spark(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 6; PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 18 + Math.random() * 10, max: 26, col, r: 2 + Math.random() * 3 }) } }
function dust(x, y, n) { for (let i = 0; i < n; i++) PT.push({ x: x + (Math.random() - .5) * 30, y: y - 4, vx: (Math.random() - .5) * 3, vy: -Math.random() * 1.5, life: 20, max: 20, col: 'rgba(255,255,255,.75)', r: 4 + Math.random() * 4 }) }
function ring(x, y, col, r) { PT.push({ x, y, ring: r, life: 22, max: 22, col }) }
function pop(x, y, txt, col) { PT.push({ x, y, vx: 0, vy: -1.1, life: 50, max: 50, txt, col }) }
function blast(x, y, col) { PT.push({ x, y, blast: 1, life: 40, max: 40, col: lt(col, .2) }); spark(x, y, lt(col, .3), 30); spark(x, y, '#FFFFFF', 16) }
function feed(by, vid) { FEED.unshift({ t: performance.now(), a: by ? nameOf(by) : null, ac: by ? colOf(by) : '#fff', b: nameOf(vid), bc: colOf(vid), me: by === me || vid === me }); FEED.length = Math.min(FEED.length, 4) }
function banner(txt, col, ms) { BAN.length = 0; BAN.push({ txt, col, t: performance.now(), ms: ms || 2000 }) }
/* ═════ vòng lặp ═════ */
function step() {
  S.tick++;
  if (pl.dead) { if (--pl.dead === 0) spawn(pl) }
  else if (S.running) { phys(pl, { l: keys.l, r: keys.r, jp: keys.up, hu: keys.u, dn: keys.d, sh: keys.sh || ptr.on, a: myAim() }); keys.up = 0; if (ptr.tap) { ptr.tap = 0; ptr.on = 0 } }
  else { keys.up = 0; pl.vx = 0; if (pl.drop > 0) phys(pl, {}) }
  const tn = performance.now(); let others = 0; for (const id in R) { if (tn - R[id].last > 6000) delete R[id]; else if (tn - R[id].last < 3000) others++ }
  aloneT = others ? 0 : aloneT + 1; syncBots();
  for (const b of bots) { if (b.dead) { if (--b.dead === 0) spawn(b); continue } phys(b, botAI(b)) }
  for (const it of activeItems()) for (const b of everyone()) { if (!alive(b) || b.drop > 0 || (b === pl && safe())) continue; if (hitBox(b, it.x, it.y - 34, 20)) { taken.add(it.k); applyItem(b, it); if (b === pl) send({ e: 't', i: me, k: it.k }); break } }
  for (let i = SH.length - 1; i >= 0; i--) {
    const s = SH[i]; s.tr.push(s.x, s.y); if (s.tr.length > 14) s.tr.splice(0, 2); s.x += s.vx; s.y += s.vy; s.life--;
    let gone = s.life <= 0;
    if (!gone) for (const B of BARS) if (s.x > B.x && s.x < B.x + B.w && s.y > B.y + 4 && s.y < B.y + 58) { spark(s.x, s.y, s.col, 6); gone = true; break }   // đạn trúng thân thanh gạch thì vỡ
    if (!gone) for (const b of everyone()) { if (b.id === s.own || !alive(b)) continue; if (hitBox(b, s.x, s.y, s.r)) { if (hitBody(b, s)) { gone = true; break } } }
    if (!gone && s.own === me) for (const id in R) { const r = R[id]; if (r.dead || (r.s & (1 | 2 | 4 | 128))) continue; const z = r.s & 512 ? 1.4 : 1; if (s.x + s.r > r.x - BW * z / 2 && s.x - s.r < r.x + BW * z / 2 && s.y + s.r > r.y - BH * z && s.y - s.r < r.y) { spark(s.x, s.y, s.col, 8); gone = true; break } }
    if (gone) SH.splice(i, 1);
  }
  for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; if (p.vx != null) { p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g; else if (!p.txt) { p.vx *= .92; p.vy *= .92 } } if (--p.life <= 0) PT.splice(i, 1) }
  if (shake > 0) shake *= .86; if (flashT > 0) flashT--;
}
function loop(ts) {
  const dt = Math.min(100, ts - (last || ts)); last = ts; acc += dt;
  requestAnimationFrame(loop);   // xin khung hình kế tiếp TRƯỚC: lỡ có lỗi lạ trong 1 khung thì game vẫn chạy tiếp, không đứng hình
  try { while (acc >= 16.67) { step(); acc -= 16.67 } } catch (e) { acc = 0; console.error(e) }
  for (const id in R) { const r = R[id], p = rpos(r, ts); if (p) { if (r.mv) r.walk += .3; r.x = p.x; r.y = p.y; r.z = p.z } if (r.flash > 0) r.flash-- }
  try { draw(ts) } catch (e) { console.error(e) }
  try { netTick(ts) } catch (e) { }
  S.hooks.onFrame && S.hooks.onFrame(ts);
}
/* ═════ vẽ: nền vũ trụ tím (ô sao + mây mờ lặp lại, trôi chậm theo camera) ═════ */
function makeBg() {
  const T = 640, c = document.createElement('canvas'); c.width = c.height = T; const x = c.getContext('2d'), r = rng(seed0 + 5);
  for (let i = 0; i < 7; i++) { const px = r() * T, py = r() * T, rd = 30 + r() * 40; x.fillStyle = 'rgba(190,170,255,.12)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(px + (k - 1.5) * rd * .55, py + (k % 2 ? -rd * .25 : 0), rd * (.45 + .15 * (k % 2)), 0, 7); x.fill() } }
  for (let i = 0; i < 170; i++) { const s = r() < .88 ? 1.6 : 2.6; x.globalAlpha = .35 + r() * .6; x.fillStyle = r() < .8 ? '#FFFFFF' : ['#FFE680', '#8FE3FF', '#FF9EC4', '#9DFFB0'][Math.floor(r() * 4)]; x.fillRect(r() * T, r() * T, s, s) }
  for (let i = 0; i < 14; i++) { const px = r() * T, py = r() * T, s = 1.6 + r() * 1.6; x.globalAlpha = .85; x.fillStyle = ['#FFFFFF', '#8FE3FF', '#FF9EC4', '#9DFFB0'][i % 4]; x.fillRect(px - s * 2, py - s / 2, s * 4, s); x.fillRect(px - s / 2, py - s * 2, s, s * 4) }
  x.globalAlpha = 1; return c;
}
/* ═════ vẽ: thanh gạch 3D như bản gốc ═════ */
function drawBar(x, B) {
  const X = B.x, Y = B.y, Wd = B.w, D = 18, FH = 34, LB = 22, [fr, fd] = COL[B.c], top = '#F8DF4E', TL = 34;
  x.lineJoin = 'round'; x.strokeStyle = O; x.lineWidth = 3.5;
  // dải dưới (lùi vào trong) + tấm vàng
  x.fillStyle = fd; x.fillRect(X + 12, Y + FH + 7, Wd - 26, LB); x.strokeRect(X + 12, Y + FH + 7, Wd - 26, LB);
  x.beginPath(); x.moveTo(X + Wd - 14, Y + FH + 7); x.lineTo(X + Wd - 14 + D * .6, Y + FH + 7 - D * .6); x.lineTo(X + Wd - 14 + D * .6, Y + FH + 7 + LB - D * .6); x.lineTo(X + Wd - 14, Y + FH + 7 + LB); x.closePath(); x.fillStyle = dk(fd, .25); x.fill(); x.stroke();
  for (let gx = X + 40, i = 0; gx < X + Wd - 60; gx += 130 + (i++ % 3) * 30) { x.fillStyle = '#F5D63D'; x.fillRect(gx, Y + FH + 12, 30, 13); x.lineWidth = 2.5; x.strokeRect(gx, Y + FH + 12, 30, 13); x.fillStyle = dk('#F5D63D', .35); x.fillRect(gx + 9, Y + FH + 17, 12, 4) }
  x.lineWidth = 3.5;
  // viền vàng dưới khối gạch
  x.fillStyle = '#F5D63D'; x.fillRect(X + 6, Y + FH, Wd - 12, 7); x.strokeRect(X + 6, Y + FH, Wd - 12, 7);
  // mặt hông phải
  x.fillStyle = dk(fr, .3); x.beginPath(); x.moveTo(X + Wd, Y); x.lineTo(X + Wd + D, Y - D); x.lineTo(X + Wd + D, Y + FH - D); x.lineTo(X + Wd, Y + FH); x.closePath(); x.fill(); x.stroke();
  // mặt trước: hàng khối gạch vuông
  x.fillStyle = fr; x.fillRect(X, Y, Wd, FH); x.fillStyle = lt(fr, .18); x.fillRect(X, Y + 2, Wd, 6);
  x.strokeStyle = dk(fr, .45); x.lineWidth = 3; for (let gx = X + TL; gx < X + Wd - 2; gx += TL) { x.beginPath(); x.moveTo(gx, Y); x.lineTo(gx, Y + FH); x.stroke() }
  x.strokeStyle = O; x.lineWidth = 3.5; x.strokeRect(X, Y, Wd, FH);
  // mặt trên vàng kẻ ô chéo
  x.fillStyle = top; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Wd, Y); x.lineTo(X + Wd + D, Y - D); x.lineTo(X + D, Y - D); x.closePath(); x.fill();
  x.strokeStyle = dk(top, .45); x.lineWidth = 2.5; for (let gx = X + TL; gx < X + Wd; gx += TL) { x.beginPath(); x.moveTo(gx, Y); x.lineTo(gx + D, Y - D); x.stroke() }
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + D + 2, Y - D + 3); x.lineTo(X + Wd + D - 4, Y - D + 3); x.stroke();
  x.strokeStyle = O; x.lineWidth = 3.5; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Wd, Y); x.lineTo(X + Wd + D, Y - D); x.lineTo(X + D, Y - D); x.closePath(); x.stroke();
}
function arrow(x, cx, cy, dir, a) {   // mũi tên mờ chỉ sang khu bên cạnh
  x.save(); x.translate(cx, cy); x.scale(dir, 1); x.globalAlpha = a; x.strokeStyle = 'rgba(200,190,255,.9)'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(-50, 0); x.lineTo(46, 0); x.moveTo(14, -30); x.lineTo(46, 0); x.lineTo(14, 30); x.stroke(); x.restore();
}
/* ═════ vẽ: nhân vật "gim" giống bản gốc — thân vòm tròn, 2 mắt đen dọc, chân ngắn, viền đậm ═════ */
function gim(x, o) {
  const s = (o.giant ? 1.4 : 1) * (o.scale || 1), w = 58 * s, h = 50 * s, cx = o.X, gy = o.Y - (o.z || 0) - 7, c = o.c, sq = o.sq ? 1 + o.sq * .03 : 1;
  if (o.safe) x.globalAlpha = .38; else if (o.alpha != null) x.globalAlpha = o.alpha;   // đang trả lời câu hỏi: mờ đi
  x.save(); x.translate(cx, gy); x.scale(sq, 1 / sq); x.translate(-cx, -gy);
  const a = o.a || 0, gunBack = Math.sin(a) < -.45, drawGun = () => {
    const gx = cx + Math.cos(a) * w * .44 - Math.cos(a) * (o.recoil || 0), gyy = gy - h * .44 + Math.sin(a) * h * .26;
    x.save(); x.translate(gx, gyy); x.rotate(a); if (Math.cos(a) < 0) x.scale(1, -1);
    rr(x, -8 * s, -6.5 * s, 27 * s, 13 * s, 5 * s); x.fillStyle = '#3B3F72'; x.fill(); x.lineWidth = 3; x.strokeStyle = O; x.stroke();
    x.fillStyle = o.mega ? '#FF8A4C' : o.spread ? '#FFD84C' : lt(c, .1); x.beginPath(); x.arc(3 * s, 0, 3.8 * s, 0, 7); x.fill();
    rr(x, 16 * s, -4.5 * s, 7 * s, 9 * s, 2 * s); x.fillStyle = '#5A5FA0'; x.fill(); x.stroke(); x.restore();
  };
  if (gunBack) drawGun();
  const wk = o.walk || 0; x.lineWidth = 3.5; x.strokeStyle = O;
  [-1, 1].forEach(sd => { const lift = Math.max(0, Math.sin(wk + (sd > 0 ? Math.PI : 0))) * 5 * s; rr(x, cx + sd * w * .22 - w * .14, gy - h * .26 - lift, w * .28, h * .28, h * .13); x.fillStyle = dk(c, .22); x.fill(); x.stroke() });
  const bob = Math.abs(Math.sin(wk)) * 2 * s, top = gy - h * 1.1 - bob, bot = gy - h * .16;
  x.beginPath(); x.moveTo(cx - w / 2, bot - h * .22); x.bezierCurveTo(cx - w / 2, top - h * .08, cx + w / 2, top - h * .08, cx + w / 2, bot - h * .22);
  x.quadraticCurveTo(cx + w / 2, bot, cx + w * .36, bot); x.lineTo(cx - w * .36, bot); x.quadraticCurveTo(cx - w / 2, bot, cx - w / 2, bot - h * .22); x.closePath();
  const g = x.createLinearGradient(0, top, 0, bot); g.addColorStop(0, lt(c, .3)); g.addColorStop(.55, c); g.addColorStop(1, dk(c, .14));
  x.fillStyle = o.flash ? '#FFFFFF' : g; x.fill(); x.lineWidth = 4 * Math.max(.8, s * .9); x.strokeStyle = O; x.stroke();
  x.save(); x.clip(); x.fillStyle = dk(c, .16); x.fillRect(cx - w, bot - h * .16, w * 2, h * .3); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(cx - w * .22, top + h * .24, w * .13, h * .08, -.5, 0, 7); x.fill(); x.restore();
  const ex = Math.cos(a) * w * .1, ey = Math.sin(a) * h * .06, eyY = top + h * .5 + ey, blink = (S.tick + (o.seed || 0)) % 230 < 6;
  if (o.stun) { x.strokeStyle = O; x.lineWidth = 3.5; x.lineCap = 'round'; [-1, 1].forEach(sd => { const px = cx + ex + sd * w * .14; x.beginPath(); x.moveTo(px - 5 * s, eyY - 5 * s); x.lineTo(px + 5 * s, eyY + 5 * s); x.moveTo(px + 5 * s, eyY - 5 * s); x.lineTo(px - 5 * s, eyY + 5 * s); x.stroke() }) }
  else [-1, 1].forEach(sd => { x.fillStyle = O; x.beginPath(); x.ellipse(cx + ex + sd * w * .14, eyY, 4.4 * s, blink ? 1.2 * s : 8.6 * s, 0, 0, 7); x.fill(); if (!blink) { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(cx + ex + sd * w * .14 - 1.2 * s, eyY - 4 * s, 1.5 * s, 0, 7); x.fill() } });
  if (!gunBack) drawGun();
  x.restore(); x.globalAlpha = 1;
  if (o.safe) { x.font = F(22, 400); x.textAlign = 'center'; x.textBaseline = 'middle'; x.globalAlpha = .9; x.fillText('📝', cx + w * .5, gy - h * 1.25); x.globalAlpha = 1 }
  if (o.shield) {
    const R0 = w * .8 + Math.sin(S.tick * .12) * 2, cy = gy - h * .58;
    const gr = x.createRadialGradient(cx - R0 * .3, cy - R0 * .3, R0 * .1, cx, cy, R0); gr.addColorStop(0, o.safe ? 'rgba(255,255,255,.06)' : 'rgba(143,227,255,.05)'); gr.addColorStop(.85, o.safe ? 'rgba(255,255,255,.22)' : 'rgba(143,227,255,.3)'); gr.addColorStop(1, o.safe ? 'rgba(255,255,255,.55)' : 'rgba(143,227,255,.7)');
    x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R0, 0, 7); x.fill(); x.lineWidth = 2.5; x.strokeStyle = o.safe ? 'rgba(255,255,255,.9)' : '#8FE3FF'; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(cx - R0 * .4, cy - R0 * .45, R0 * .18, R0 * .09, -.6, 0, 7); x.fill();
  }
  if (o.stun) { x.fillStyle = '#FFE680'; x.font = F(13); x.textAlign = 'center'; for (let i = 0; i < 3; i++) { const an = S.tick * .15 + i * 2.1; x.fillText('★', cx + Math.cos(an) * w * .5, top - 6 + Math.sin(an) * 5) } }
  if (o.speed) { x.strokeStyle = 'rgba(185,242,255,.85)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { const yy = gy - h * (.4 + i * .2); x.beginPath(); x.moveTo(cx - (o.f || 1) * w * .55, yy); x.lineTo(cx - (o.f || 1) * w * (.9 + i * .1), yy); x.stroke() } }
}
function tag(x, cx, y, n, d, mine, kos) {   // tên + % ngay dưới chân như bản gốc
  const dc = d < 40 ? '#FFFFFF' : d < 80 ? '#FFE680' : d < 120 ? '#FFB36B' : '#FF5C7A', jig = d >= 120 ? Math.sin(S.tick * .8) * 1.5 : 0;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  const nm = (n.length > 16 ? n.slice(0, 15) + '…' : n) + (kos ? '  ⭐' + kos : '');
  x.font = F(17); x.lineWidth = 5; x.strokeStyle = O; x.strokeText(nm, cx, y + 14); x.fillStyle = mine ? '#FFE680' : '#FFFFFF'; x.fillText(nm, cx, y + 14);
  x.font = F(25, 800, true); x.lineWidth = 6; x.strokeText(Math.round(d) + '%', cx + jig, y + 38); x.fillStyle = dc; x.fillText(Math.round(d) + '%', cx + jig, y + 38);
}
function drawItem(x, it, t) {
  const age = t - it.t0, left = it.t0 + ILIFE - t; if (left < 3000 && Math.floor(t / 150) % 2) return;
  const sp = clamp(age / 400, .05, 1), y = it.y - 44 + Math.sin(t / 300 + it.k) * 6, r = 22 * sp;
  const g = x.createRadialGradient(it.x, y, 0, it.x, y, r * 2.2); g.addColorStop(0, it.ty.col + 'AA'); g.addColorStop(1, it.ty.col + '00'); x.fillStyle = g; x.fillRect(it.x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  x.save(); x.translate(it.x, y); x.rotate(t / 900); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2; x.setLineDash([5, 6]); x.beginPath(); x.arc(0, 0, r + 6, 0, 7); x.stroke(); x.setLineDash([]); x.restore();
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(it.x, y, r, 0, 7); x.fill(); x.lineWidth = 3; x.strokeStyle = O; x.stroke();
  x.font = F(Math.round(26 * sp), 400); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it.ty.ic, it.x, y + 1);
}
function drawShot(x, s) {
  const big = s.k === 1, col = big ? '#FF8A4C' : s.col;
  for (let i = 0; i < s.tr.length; i += 2) { const a = i / s.tr.length; x.globalAlpha = a * .55; x.fillStyle = col; x.beginPath(); x.arc(s.tr[i], s.tr[i + 1], s.r * (.4 + a * .6), 0, 7); x.fill() }
  x.globalAlpha = 1; const g = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.4); g.addColorStop(0, col + 'CC'); g.addColorStop(1, col + '00');
  x.fillStyle = g; x.fillRect(s.x - s.r * 2.4, s.y - s.r * 2.4, s.r * 4.8, s.r * 4.8);
  x.save(); x.translate(s.x, s.y); x.rotate(Math.atan2(s.vy, s.vx)); rr(x, -s.r * 1.3, -s.r * .8, s.r * 2.6, s.r * 1.6, s.r * .8); x.fillStyle = col; x.fill(); x.lineWidth = 2.5; x.strokeStyle = O; x.stroke(); x.fillStyle = '#FFFFFF'; rr(x, -s.r * .3, -s.r * .35, s.r * 1.2, s.r * .5, s.r * .25); x.fill(); x.restore();
}
function drawFx(x) {
  for (const p of PT) {
    const a = p.life / p.max;
    if (p.ring) { x.globalAlpha = a; x.strokeStyle = p.col; x.lineWidth = 4 * a + 1; x.beginPath(); x.arc(p.x, p.y, p.ring * (1.4 - a), 0, 7); x.stroke() }
    else if (p.blast) { const rd = 30 + (1 - a) * 170; x.globalAlpha = a; const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, rd); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.35, p.col); g.addColorStop(1, p.col + '00'); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, rd, 0, 7); x.fill(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 3; for (let i = 0; i < 10; i++) { const an = i * .628 + p.x; x.beginPath(); x.moveTo(p.x + Math.cos(an) * rd * .5, p.y + Math.sin(an) * rd * .5); x.lineTo(p.x + Math.cos(an) * rd * 1.1, p.y + Math.sin(an) * rd * 1.1); x.stroke() } }
    else if (p.txt) { x.globalAlpha = Math.min(1, a * 2); x.font = F(20); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = O; x.strokeText(p.txt, p.x, p.y); x.fillStyle = p.col; x.fillText(p.txt, p.x, p.y) }
    else { x.globalAlpha = a; x.fillStyle = p.col; if (p.cf) x.fillRect(p.x - p.r, p.y - p.r / 2, p.r * 2, p.r); else { x.beginPath(); x.arc(p.x, p.y, p.r * (.5 + a * .5), 0, 7); x.fill() } }
  }
  x.globalAlpha = 1;
}
/* ═════ vẽ: khung hình ═════ */
function draw(ts) {
  if (!bgP) bgP = ctx.createPattern(makeBg(), 'repeat');
  const t = now(), vw = cw / sc, vh = ch / sc, tn = performance.now();
  const fx0 = pl.dead ? cam.x + vw / 2 : pl.x, fy0 = pl.dead ? cam.y + vh * .55 : pl.y - pl.z - 60;
  cam.x += (clamp(fx0 - vw / 2, -500, W + 500 - vw) - cam.x) * .12; cam.y += (clamp(fy0 - vh * .55, -900, 1000 - vh) - cam.y) * .12;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2C1C7E'); g.addColorStop(.6, '#4A2FB8'); g.addColorStop(1, '#5B3CC9'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  ctx.save(); ctx.translate(-((cam.x * .2) % 640 + 640) % 640, -((cam.y * .2) % 640 + 640) % 640); ctx.fillStyle = bgP; ctx.fillRect(0, 0, cw + 1300, ch + 1300); ctx.restore();
  ctx.save(); ctx.globalAlpha = .5; ctx.scale(1.5, 1.5); ctx.translate(-((cam.x * .35) % 640 + 640) % 640 - 200, -((cam.y * .35) % 640 + 640) % 640 - 120); ctx.fillStyle = bgP; ctx.fillRect(0, 0, cw + 1500, ch + 1500); ctx.restore();
  const sx = shake > .4 ? (Math.random() - .5) * shake : 0, sy = shake > .4 ? (Math.random() - .5) * shake : 0;
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, (-cam.x * sc + sx) * dpr, (-cam.y * sc + sy) * dpr);
  const vis = (x0, x1, y0, y1) => x1 > cam.x - 40 && x0 < cam.x + vw + 40 && y1 > cam.y - 40 && y0 < cam.y + vh + 40;
  // số khu 1 → 5 to mờ phía trên + mũi tên chỉ sang khu bên cạnh
  ZY.forEach((zy, i) => { const c = ZC[i]; if (!vis(c - 200, c + 200, zy - 100, zy + 100)) return; ctx.font = F(150, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(200,190,255,.32)'; ctx.fillText(String(i + 1), c, zy) });
  MAIN.forEach((m, i) => { const B = BARS[m]; if (i < 4 && vis(B.x + B.w - 200, B.x + B.w, B.y - 200, B.y)) arrow(ctx, B.x + B.w - 90, B.y - 115, 1, .5); if (i > 0 && vis(B.x, B.x + 200, B.y - 200, B.y)) arrow(ctx, B.x + 90, B.y - 115, -1, .5) });   // mũi tên trên 2 đầu thanh dài: chỉ đường sang khu bên cạnh
  for (const B of BARS) if (vis(B.x, B.x + B.w + 20, B.y - 20, B.y + 70)) drawBar(ctx, B);
  for (const it of activeItems(t)) if (vis(it.x - 40, it.x + 40, it.y - 90, it.y)) drawItem(ctx, it, t);
  for (const id in R) { const r = R[id]; if (r.dead || !r.buf.length || tn - r.last > 4000) continue; r.near = Math.abs(r.x - pl.x) < 1000; if (!vis(r.x - 60, r.x + 60, r.y - r.z - 120, r.y + 50)) continue; gim(ctx, { X: r.x, Y: r.y, z: r.z, c: r.c, a: r.a, f: r.f, walk: r.walk, flash: r.flash > 0, stun: r.s & 1024, shield: r.s & 2, safe: r.s & 1, alpha: r.s & 4 ? (Math.floor(tn / 90) % 2 ? .45 : 1) : null, speed: r.s & 8, spread: r.s & 32, mega: r.s & 64, giant: r.s & 512, seed: id.length * 37 }); tag(ctx, r.x, r.y - r.z, r.n, r.d, false, r.k) }
  for (const b of bots) { if (!alive(b)) continue; b.near = true; if (!vis(b.x - 60, b.x + 60, b.y - b.z - 120, b.y + 50)) continue; gim(ctx, { X: b.x, Y: b.y, z: b.z, c: b.c, a: b.a, f: b.face, walk: b.walk, flash: b.flash > 0, stun: b.stun > 0, shield: b.shield > 0, alpha: b.inv > 0 ? (Math.floor(tn / 90) % 2 ? .45 : 1) : null, speed: b.speed > 0, spread: b.spread > 0, mega: b.mega > 0, recoil: b.recoil, sq: b.sq, giant: b.giant > 0, seed: 91 }); tag(ctx, b.x, b.y - b.z, b.n, b.d, false, b.kos) }
  if (!pl.dead) { gim(ctx, { X: pl.x, Y: pl.y, z: pl.z, c: S.color, a: pl.a, f: pl.face, walk: pl.walk, flash: pl.flash > 0, stun: pl.stun > 0, shield: pl.shield > 0, safe: safe() && !S.over, alpha: pl.inv > 0 && S.running ? (Math.floor(tn / 90) % 2 ? .45 : 1) : null, speed: pl.speed > 0, spread: pl.spread > 0, mega: pl.mega > 0, recoil: pl.recoil, sq: pl.sq, giant: pl.giant > 0, seed: 3 }); tag(ctx, pl.x, pl.y - pl.z, S.name || 'Em', pl.d, true, S.kos) }
  for (const s of SH) if (vis(s.x - 30, s.x + 30, s.y - 30, s.y + 30)) drawShot(ctx, s);
  drawFx(ctx);
  // màn hình: mũi tên chỉ bạn ngoài khung · thanh khu 1–5 · bảng hạ gục · thẻ % · thông báo
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const o of Object.values(R).filter(r => !r.dead && r.buf.length && tn - r.last < 4000).concat(bots.filter(alive))) { const px = (o.x - cam.x) * sc, py = (o.y - 30 - cam.y) * sc; if (px > 0 && px < cw && py > 0 && py < ch) continue; const ax = clamp(px, 24, cw - 24), ay = clamp(py, 76, ch - 24), an = Math.atan2(py - ay, px - ax); ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.fillStyle = o.c; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore() }
  const fy = drawZones(tn); drawFeed(tn, fy); drawCard(); drawBanner(tn);
  if (flashT > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flashT / 25 + ')'; ctx.fillRect(0, 0, cw, ch) }
}
function drawZones(tn) {   // thanh khu 1 → 5 góc trên phải: chấm màu từng bạn đang ở khu nào (em có viền vàng)
  const bw = cw < 700 ? 34 : 46, gap = 5, tw = bw * 5 + gap * 4, x0 = cw - tw - 12, y0 = 10, bh = cw < 700 ? 30 : 36, list = {};
  const add = (x, c, mine) => { const z = zoneOf(x); (list[z] || (list[z] = [])).push({ c, mine }) };
  for (const id in R) { const r = R[id]; if (!r.dead && r.buf.length && tn - r.last < 4000) add(r.x, r.c) }
  for (const b of bots) if (alive(b)) add(b.x, b.c);
  if (!pl.dead) add(pl.x, S.color, 1);
  const myZ = zoneOf(pl.x);
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * (bw + gap); rr(ctx, x, y0, bw, bh, 9); ctx.fillStyle = i === myZ && !pl.dead ? 'rgba(255,230,128,.92)' : 'rgba(29,19,54,.65)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.stroke();
    ctx.font = F(cw < 700 ? 13 : 15); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = i === myZ && !pl.dead ? O : '#FFFFFF'; ctx.fillText(String(i + 1), x + 5, y0 + 3);
    (list[i] || []).slice(0, 8).forEach((p, k) => { const dx = x + bw - 9 - (k % 4) * 8, dy = y0 + (k < 4 ? bh - 9 : bh - 17); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(dx, dy, 3.4, 0, 7); ctx.fill(); ctx.lineWidth = p.mine ? 2 : 1; ctx.strokeStyle = p.mine ? '#FFFFFF' : O; ctx.stroke() });
  }
  return y0 + bh + 10;
}
function drawFeed(tn, y) {
  ctx.textBaseline = 'middle';
  for (const f of FEED) {
    const age = tn - f.t; if (age > 6000) continue; ctx.globalAlpha = Math.min(1, (6000 - age) / 600);
    ctx.font = F(cw < 700 ? 12 : 14); const a = f.a || '', mid = f.a ? '  💥  ' : '💫 ', b = f.b + (f.a ? '' : ' tự rơi'), w = ctx.measureText(a + mid + b).width + 22, x0 = cw - w - 12;
    rr(ctx, x0, y, w, 26, 13); ctx.fillStyle = f.me ? 'rgba(255,230,128,.92)' : 'rgba(29,19,54,.78)'; ctx.fill();
    let x = x0 + 11; ctx.textAlign = 'left';
    if (f.a) { ctx.fillStyle = f.me ? O : lt(f.ac, .3); ctx.fillText(a, x, y + 13); x += ctx.measureText(a).width }
    ctx.fillStyle = f.me ? O : '#FFFFFF'; ctx.fillText(mid, x, y + 13); x += ctx.measureText(mid).width;
    ctx.fillStyle = f.me ? O : lt(f.bc, .3); ctx.fillText(b, x, y + 13); y += 31;
  }
  ctx.globalAlpha = 1;
}
function drawCard() {   // thẻ % của em: giữa dưới (máy cảm ứng) / góc phải dưới (máy tính)
  const touch = (document.getElementById('pad') || { classList: { contains: () => false } }).classList.contains('on'), small = ch < 460;
  if (small) { ctx.save(); ctx.translate(cw / 2, ch - 4); ctx.scale(.72, .72); ctx.translate(-cw / 2, -(ch - 4)) }
  const w = 154, h = 56, x = touch ? cw / 2 - w / 2 : cw - w - 14, y = ch - h - (touch ? 10 : 14), d = Math.round(pl.d), dc = d < 40 ? '#FFFFFF' : d < 80 ? '#FFE680' : d < 120 ? '#FFB36B' : '#FF5C7A';
  rr(ctx, x, y, w, h, 18); ctx.fillStyle = 'rgba(29,19,54,.84)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = S.color; ctx.stroke();
  gim(ctx, { X: x + 28, Y: y + h - 4, c: S.color, a: 0, scale: .62 });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = F(28, 800, true); ctx.lineWidth = 5; ctx.strokeStyle = O; const jig = d >= 120 ? Math.sin(S.tick * .8) * 1.5 : 0; ctx.strokeText(d + '%', x + 56 + jig, y + 22); ctx.fillStyle = dc; ctx.fillText(d + '%', x + 56 + jig, y + 22);
  ctx.font = F(12); ctx.fillStyle = '#FFE680'; ctx.fillText('⭐ ' + S.kos + ' hạ gục · khu ' + (zoneOf(pl.x) + 1), x + 58, y + 43);
  const fx = [pl.mega > 0 && '🔥' + pl.mega, pl.spread > 0 && '🌟', pl.shield > 0 && '🫧', pl.speed > 0 && '👟', pl.giant > 0 && '🍄'].filter(Boolean).join(' ');
  if (fx) { ctx.font = F(16, 400); ctx.textAlign = 'center'; ctx.fillText(fx, x + w / 2, y - 14) }
  if (small) ctx.restore();
  if (pl.dead) { ctx.font = F(22); ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = O; const s = '💫 Hồi sinh sau ' + Math.ceil(pl.dead / 60) + '…'; ctx.strokeText(s, cw / 2, ch * .42); ctx.fillStyle = '#FFFFFF'; ctx.fillText(s, cw / 2, ch * .42) }
}
function drawBanner(tn) {
  const b = BAN[0]; if (!b || tn - b.t >= b.ms) return;
  const a = Math.min(1, (b.ms - (tn - b.t)) / 300);
  ctx.globalAlpha = a; ctx.font = F(cw < 700 ? 15 : 19); const w = Math.min(cw - 24, ctx.measureText(b.txt).width + 36), y = ch - (cw < 700 ? 118 : 130);
  rr(ctx, cw / 2 - w / 2, y, w, 36, 18); ctx.fillStyle = 'rgba(29,19,54,.86)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = b.col; ctx.stroke();
  ctx.fillStyle = b.col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.txt, cw / 2, y + 19, w - 20); ctx.globalAlpha = 1;
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  sc = Math.max(.45, Math.min(cw / 1250, ch / 640));   // camera gần: nhân vật to rõ như bản gốc
}
/* ═════ điều khiển: ← → / A D chạy · ↑ / W / Space nhảy (2 lần) · ↓ / S xuống thanh dưới · chuột ngắm + bấm bắn · F / J bắn ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ' ': 'u', ArrowDown: 'd', s: 'd', S: 'd', f: 'sh', F: 'sh', j: 'sh', J: 'sh', k: 'sh', K: 'sh', x: 'sh', X: 'sh' };
function toWorld(e) { const r = cv.getBoundingClientRect(); return [cam.x + (e.clientX - r.left) / sc, cam.y + (e.clientY - r.top) / sc] }
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'u' && !keys.u) keys.up = 1; if (k === 'l' || k === 'r') pl.face = k === 'l' ? -1 : 1; keys[k] = 1 }   // ← →: quay mặt ngay
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd'], ['bF', 'sh']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'u' && !keys.u) keys.up = 1; keys[k] = 1; if (k === 'l' || k === 'r') pl.face = k === 'l' ? -1 : 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
  });
  const upd = e => { const [x, y] = toWorld(e); ptr.x = x; ptr.y = y; if (e.pointerType === 'mouse') { ptr.mouse = 1; ptr.t = performance.now() } };
  cv.addEventListener('pointermove', upd);
  cv.addEventListener('pointerdown', e => { e.preventDefault(); upd(e); ptr.t = performance.now(); ptr.on = 1; try { cv.setPointerCapture(e.pointerId) } catch (x2) { } });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if (ptr.on && pl.cd > 0) ptr.on = 0; else if (ptr.on) ptr.tap = 1 }));   // chạm nhanh vẫn bắn được ít nhất 1 phát
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {}; seed0 = seed || 7; LV = LVS[level] || LVS[2];
  GC.music.files({ bgm: { src: 'snd/kb-bgm.mp3' } }, 'kb');   // nhạc nền cô Chí Nên chọn
  pl.n = S.name; pl.c = S.color; spawn(pl); pl.drop = 0; pl.z = 0; pl.inv = 0;
  addEventListener('resize', resize); resize(); cam.x = pl.x - cw / sc / 2; cam.y = pl.y - 60 - ch / sc * .55; bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = keys.sh = keys.up = 0; ptr.on = 0 }
function place(x, y, old) { if (old) { S.kos = old.kos || 0; S.level = Math.floor(S.kos / 5) } }
const label = () => '⭐ ' + S.kos + ' hạ gục · 😵 ' + S.falls + ' lần rơi';
function extra() { return { lvl: S.level, wk: 'kb', lb: label(), kos: S.kos, sc: S.kos } }
const hud = () => '⭐ ' + S.kos + ' hạ gục · 💢 ' + Math.round(pl.d) + '% · khu ' + (zoneOf(pl.x) + 1);
return { init, S, pl: PLS, keys, alt: () => S.kos, topAlt: () => 20, release, place, measure: () => 20, extra, hud, label, W, kind: 'kb', NL: 1, attachNet, setPlayers,
  _dbg: { step, draw, me: pl, bots, R, SH, PT, BARS, LINK, activeItems, spawn, ko, onNet, fire, items: ITEMS, applyItem, cam, ptr } };
})();
