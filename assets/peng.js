/* peng.js — game "Chim cánh cụt phiêu lưu" (Antarctic Adventure, Konami 1983): chim cánh cụt chạy băng qua Nam Cực tới các trạm nghiên cứu.
   Đường băng 3D giả lập cong trái phải · mỗi chặng một cảnh (biển trái/phải/2 bên/không biển · núi băng · núi tuyết · núi lửa Erebus · cá voi · tảng băng trôi · chim đứng vẫy) · về trạm chim quay lại vẫy chào. 7 chặng tới 7 trạm (Úc · Pháp · New Zealand · Mỹ · Argentina · Anh · Nhật).
   Chướng ngại như bản gốc: 🕳 lỗ băng (vấp ngã) · khe nứt (rơi xuống, mất thời gian) · 🦭 hải cẩu thò đầu khỏi lỗ.
   Ăn được như bản gốc: 🐟 cá nhảy vọt khỏi lỗ băng khi chim chạy tới (chạm vào là bắt được, +⚡) · 🚩 cờ xanh (+điểm) · 🚁 cờ chong chóng: bay qua mọi chướng ngại 15 giây
   + 🌟 cá vàng hiếm (nhiều ⚡). Hết giờ trước khi tới trạm = mất 1 mạng (đồng hồ chỉ chạy khi còn ⚡ — lúc trả lời câu hỏi không bị tính giờ).
   Cảnh vẽ ở độ phân giải thấp như máy MSX rồi phóng to → điểm ảnh sắc nét; chữ (tên, thông báo, bảng điểm) vẽ ở độ phân giải thật.
   ← → rẽ · ↑ / Space nhảy · ↓ chạy chậm lại · tự chạy khi còn ⚡. Cùng giao diện: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'peng' */
window.Peng = (function () {
const { clamp, rng } = GC;
const NL = 7, LIVES = 5, D0 = 110, DRAWD = 1500, SAMP = 20, HALF = 1.5, FLY = 900;
const STAGES = [
  { name: 'Trạm Úc', flag: 'AU', sky: ['#38B8F8', '#A8E4FF'], sea: '#0058F8', wave: '#3880F8', ground: '#FCFCFC', streak: '#E0F0FC', field: ['#DCDCE4', '#A4A4B4'], mus: 'waltz', curve: .35, holes: .9, cracks: .25, seals: .15, fish: .35, len: 13000 },
  { name: 'Trạm Pháp', flag: 'FR', sky: ['#38B8F8', '#B8ECFF'], sea: '#0050E8', wave: '#3078F0', ground: '#FCFCFC', streak: '#E0F0FC', field: ['#DCDCE4', '#A4A4B4'], mus: 'waltz', curve: .45, holes: 1, cracks: .4, seals: .25, fish: .35, len: 14000 },
  { name: 'Trạm New Zealand', flag: 'NZ', sky: ['#58C8F8', '#D0F4FF'], sea: '#0048D8', wave: '#2C70E8', ground: '#F8FCFF', streak: '#D8ECF8', field: ['#D8DCE8', '#A0A8B8'], mus: 'river', curve: .55, holes: 1.1, cracks: .5, seals: .35, fish: .4, len: 15000 },
  { name: 'Trạm Mỹ', flag: 'US', sky: ['#F87858', '#FCD8A8'], sea: '#2848B8', wave: '#5068C8', ground: '#FFF4EC', streak: '#F8E4D4', field: ['#F0D8CC', '#C8A498'], mus: 'waltz', curve: .6, holes: 1.15, cracks: .6, seals: .45, fish: .4, len: 16000, dusk: 1 },
  { name: 'Trạm Argentina', flag: 'AR', sky: ['#000830', '#1C2C78'], sea: '#081C68', wave: '#203C98', ground: '#C8DCF8', streak: '#B0C8EC', field: ['#8EA0C8', '#62749C'], mus: 'river', curve: .65, holes: 1.2, cracks: .65, seals: .5, fish: .45, len: 17000, night: 1 },
  { name: 'Trạm Anh', flag: 'UK', sky: ['#98ACC0', '#E0E8F0'], sea: '#3868A8', wave: '#5884B8', ground: '#F0F4F8', streak: '#DCE4EC', field: ['#D4DCE6', '#A8B4C4'], mus: 'bonus', curve: .7, holes: 1.25, cracks: .7, seals: .55, fish: .45, len: 18000, snow: 1 },
  { name: 'Trạm Nhật Bản', flag: 'JP', sky: ['#2878F8', '#A8E0FF'], sea: '#0040C8', wave: '#2868E0', ground: '#FCFCFC', streak: '#D8ECF8', field: ['#DCDCE4', '#A4A4B4'], mus: 'boss', curve: .8, holes: 1.35, cracks: .8, seals: .65, fish: .5, len: 19000 }];
const SCN = [   // cảnh riêng từng chặng: biển bên nào · chân trời · đồ trang trí bên đường
  { seaL: 1, seaR: 0, hzn: 'berg', deco: ['floe', 'peng', 'peng', 'spike'] },
  { seaL: 0, seaR: 1, hzn: 'mount', deco: ['peng', 'fin', 'floe', 'peng'] },
  { seaL: 1, seaR: 1, hzn: 'berg', deco: ['whale', 'floe', 'fin', 'floe'] },
  { seaL: 1, seaR: 0, hzn: 'mount', mcol: ['#C890A8', '#A07090', '#FFEAE4'], deco: ['peng', 'spike', 'whale', 'peng'] },
  { seaL: 0, seaR: 1, hzn: 'berg', deco: ['floe', 'fin', 'peng', 'spike'] },
  { seaL: 0, seaR: 0, hzn: 'mount', deco: ['spike', 'peng', 'spike', 'peng'] },
  { seaL: 1, seaR: 0, hzn: 'volcano', deco: ['whale', 'peng', 'floe', 'fin'] }];
SCN.forEach((c, i) => Object.assign(STAGES[i], c));
const STN = 170;   // trạm nằm sau vạch đích một đoạn → chim dừng trước cửa, quay lại vẫy chào
const LVS = {   // vmax: m/khung hình · slack: thời gian cho phép so với chạy hết tốc lực
  1: { vmax: 5, slack: 1.6, dens: .8, cost: { run: .14, fish: 6, flag: 3 } },
  2: { vmax: 5.6, slack: 1.45, dens: 1, cost: { run: .17, fish: 6, flag: 3 } },
  3: { vmax: 6.2, slack: 1.36, dens: 1.2, cost: { run: .2, fish: 6, flag: 3 } } };
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#1A1A2A', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0 };
const keys = { l: 0, r: 0, u: 0, d: 0, up: 0 };
let seed0 = 1, lvSel = 2, L = 0, pos = 0, px = 0, speed = 0, hz = 0, vz = 0, stun = 0, fall = 0, fly = 0, inv = 0, phase = 'start', phT = 0, timeLeft = 0, timeMax = 0, score = 0, best = 0;
let curves = [], objs = [], decos = [], shift = [], skyOff = 0, flakes = [], banner = null, emptyT = 0, pops = [], walk = 0;
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, VW = 0, VH = 0, room = 0;

/* ═════ nhạc: mỗi lúc chỉ 1 bản — đoạn nhạc ngắn (vào chặng · về trạm · thua) phát HẾT rồi mới bật nhạc nền ═════ */
let jT = 0, jK = '';
function stopJingle() { clearTimeout(jT); if (jK && GC.sfxStop) GC.sfxStop(jK); jK = '' }
function playMus(k) { stopJingle(); GC.music.scene(k, true); GC.music.hush(false) }
function jingle(k, ms, then) { stopJingle(); jK = k; GC.music.hush(true); GC.sfx(k); jT = setTimeout(() => { jK = ''; then && then() }, ms) }

/* ═════ dựng chặng (cùng seed → cả lớp cùng đường) ═════ */
function buildStage(li) {
  const st = STAGES[li], r0 = rng(seed0 * 53 + li * 911 + lvSel * 23), R = (a, b) => a + r0() * (b - a);
  L = Math.round(st.len * (lvSel === 1 ? .9 : lvSel === 3 ? 1.1 : 1));
  curves = []; for (let z = 0; z < L + DRAWD + 400; z += 100) curves.push(0);
  for (let z = 600; z < L; ) { const len = R(500, 1400), c = (r0() < .5 ? -1 : 1) * R(.3, 1) * st.curve; if (r0() < .7) for (let k = Math.floor(z / 100); k < Math.floor((z + len) / 100) && k < curves.length; k++) curves[k] = c; z += len + R(200, 600) }
  objs = []; const D = LVC.dens, ramp = z => .55 + .45 * z / L;
  for (let z = 700; z < L - 400; ) {
    const rz = ramp(z); let gap = R(260, 460) / (D * (.8 + .4 * rz));
    const W = { hole: 2.4 * st.holes, hole2: li >= 1 ? .5 + li * .1 : 0, crack: (li ? 1.4 : .5) * st.cracks * rz * 2, seal: 1.6 * st.seals, fish: 3 * st.fish, flag: 1.5 };   // tỉ lệ từng loại: chặng đầu chủ yếu lỗ băng, khe nứt tăng dần
    let q = r0() * Object.values(W).reduce((a, b) => a + b, 0), k = 'flag'; for (const kk in W) { q -= W[kk]; if (q < 0) { k = kk; break } }
    if (k === 'hole') objs.push({ k: 'hole', z, x: R(-1, 1), w: .45 });
    else if (k === 'hole2') { const x = R(-.6, .6); objs.push({ k: 'hole', z, x: x - .42, w: .4 }, { k: 'hole', z, x: x + .42, w: .4 }) }   // 2 lỗ cạnh nhau: luồn giữa hoặc nhảy
    else if (k === 'crack') { objs.push({ k: 'crack', z, w: R(26, 34) + li * 2, gap: li >= 2 && r0() < .4 ? R(-.8, .8) : null }); gap += 120 }   // khe nứt ngang đường: phải nhảy (chặng sau có cầu băng hẹp)
    else if (k === 'seal') objs.push({ k: 'seal', z, x: R(-.9, .9), w: .5, up: 0 });
    else if (k === 'fish') objs.push({ k: 'fishhole', z, x: R(-.9, .9), w: .5, t: 0, got: false, gold: r0() < .12 });   // 🌟 cá vàng hiếm
    else { const n = r0() < .5 ? 1 : 3; for (let i = 0; i < n; i++) objs.push({ k: 'flag', z: z + i * 60, x: R(-1.1, 1.1), w: .4, got: false }); gap += 60 }
    z += gap;
  }
  if (li >= 1) { const z = L * R(.35, .6); objs.push({ k: 'prop', z, x: R(-.6, .6), w: .45, got: false }) }   // cờ chong chóng: 1 lá mỗi chặng (từ chặng 2)
  objs.sort((a, b) => a.z - b.z);
  const r1 = rng(seed0 * 71 + li * 313 + 5), PC = ['#E40028', '#2878F8', '#20B060', '#F8A800', '#A050E0', '#F860A0']; decos = [];   // đồ trang trí bên đường (không chạm được)
  for (let z = 250; z < L + 900; z += 160 + r1() * 240) {
    const k = st.deco[Math.floor(r1() * st.deco.length)], wet = k === 'floe' || k === 'fin' || k === 'whale', sides = [-1, 1].filter(sd => (sd < 0 ? st.seaL : st.seaR) ? wet : !wet);
    if (!sides.length) continue; const sd = sides[Math.floor(r1() * sides.length)];
    decos.push({ k, z, x: sd * (HALF + (wet ? 1.5 + r1() * 2.4 : 1.3 + r1() * 2.6)), ph: Math.floor(r1() * 240), c: PC[Math.floor(r1() * PC.length)] });
  }
  timeMax = Math.round(L / (LVC.vmax * 60) * (LVC.slack - li * .012)); timeLeft = timeMax * 60;
}
const curveAt = z => curves[Math.max(0, Math.min(curves.length - 1, Math.floor(z / 100)))] || 0;
function calcShift() {   // độ lệch tâm đường theo độ sâu (đường cong)
  shift.length = 0; let x = 0, dx = 0; for (let d = 0; d <= DRAWD + SAMP; d += SAMP) { shift.push(x); dx += curveAt(pos + d) * .0009 * SAMP; x += dx * SAMP * .02 }
}
const shiftAt = d => { const i = clamp(d / SAMP, 0, shift.length - 1.001), i0 = Math.floor(i); return shift[i0] + (shift[i0 + 1] - shift[i0]) * (i - i0) };
function loadStage(li) {
  S.level = li; buildStage(li); pos = 0; px = 0; speed = 0; hz = 0; vz = 0; stun = fall = fly = inv = 0; pops = [];
  phase = 'start'; phT = 200; banner = { t: 220, w: 'STAGE-0' + (li + 1), text: '🐧 Chạy tới ' + STAGES[li].name };
  jingle('pgstart', 5450, () => { if (S.level === li && phase !== 'over') playMus(STAGES[li].mus) });
}
const prog = () => S.won ? 1 : clamp((S.level + clamp(pos / L, 0, 1)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++;
  for (const p of pops) p.t--; pops = pops.filter(p => p.t > 0);
  const st = STAGES[S.level];
  if (st.snow) { if (flakes.length < 90) flakes.push({ x: Math.random(), y: Math.random(), v: .004 + Math.random() * .006 }); for (const f of flakes) { f.y += f.v; f.x -= .004 + curveAt(pos) * .004; if (f.y > 1) { f.y = 0; f.x = Math.random() } if (f.x < 0) f.x += 1 } }
  if (phase === 'start') { if (--phT <= 0) phase = 'run'; calcShift(); return }
  if (phase === 'clear') {
    speed = Math.max(0, speed - .08); pos = Math.min(L + 30, pos + speed); px += (0 - px) * .03; walk += .2; calcShift();   // dừng trước cửa trạm
    if (phT % 6 === 0 && timeLeft > 0) { const k = Math.min(timeLeft, 60); timeLeft -= k; score += 10; S.energy += .5 }   // giờ còn lại đổi thành điểm & ⚡
    if (--phT <= 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NL - 1) { S.won = true; phase = 'won'; S.hooks.onWin && S.hooks.onWin() } else loadStage(S.level + 1) }
    return;
  }
  if (phase === 'over') { if (--phT <= 0) { S.lives = LIVES; loadStage(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chạy lại chặng ' + (S.level + 1) + ' — có ' + LIVES + ' mạng mới, cố lên!') } return }
  if (phase === 'won') return;
  const can = S.energy > 0 && !frozen(), vmax = LVC.vmax * (fly ? 1.1 : 1);
  // đồng hồ: chỉ chạy khi đang có ⚡ để chạy
  if (can && --timeLeft <= 0) {
    S.lives--; S.hits++; GC.sfx('bad');
    if (S.lives <= 0) { phase = 'over'; phT = 330; jingle('pgover', 5450); return }
    timeLeft = Math.round(timeMax * 60 * .5); S.hooks.onFall && S.hooks.onFall(0, '⏰ Hết giờ! 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · được thêm ' + Math.round(timeMax * .5) + ' giây, chạy nhanh lên!');
  }
  if (inv) inv--; if (fly) { fly--; if (!fly) playMus(st.mus) }
  // ngã / rơi xuống khe
  if (fall) { fall--; speed = 0; if (fall === 1) { pos = fall0; inv = 40 } calcShift(); return }
  if (stun) { stun--; speed *= .9; pos += speed; calcShift(); return }
  // chạy · rẽ · nhảy
  if (can && !keys.d) { speed = Math.min(vmax, speed + .045 * vmax / 5); use(COST.run * Math.max(.3, speed / vmax)) } else speed = Math.max(0, speed - (keys.d ? .16 : .06));
  const sr = speed / LVC.vmax, dir = can ? keys.r - keys.l : 0;
  px += dir * .032 * (.45 + .55 * sr) - curveAt(pos) * sr * .016;   // đường cong đẩy ra ngoài
  if (Math.abs(px) > HALF - .15) { px = clamp(px, -(HALF - .15), HALF - .15); speed *= .985 }
  if (keys.up && hz === 0 && can && !fly) { vz = 6.2; keys.up = 0; GC.sfx('jump'); use(2) } keys.up = 0;
  if (hz > 0 || vz > 0) { hz += vz; vz -= .42; if (hz <= 0) { hz = 0; vz = 0 } }
  if (fly) hz = 46 + Math.sin(S.tick * .2) * 4; else if (hz > 0 && fly === 0 && vz === 0) hz = 0;
  const p0 = pos; pos += speed; walk += speed * .04;
  skyOff += curveAt(pos) * sr * 1.6;
  calcShift();
  // va chạm khi vật đi qua chân
  for (const o of objs) {
    if (o.z < p0 - 40) continue; if (o.z > pos + 600) break;
    if (o.k === 'seal' && o.z - pos < 520) o.up++;
    if (o.k === 'fishhole' && !o.got) { if (!o.t) { if (o.z - pos < 30 + speed * 40) o.t = 1 } else if (++o.t > 220) o.t = 0 }   // cá nhảy vọt lên đúng lúc chim chạy tới
    const passing = o.z >= p0 - (o.w || 0) && o.z <= pos + 6, near = Math.abs(px - (o.x || 0)) < (o.w || 0) / 2 + .2;
    if (!passing) continue;
    if (o.k === 'flag' && !o.got && near) { o.got = true; score += 100; S.coins++; S.energy += COST.flag; GC.sfx('coin'); pops.push({ t: 50, s: '🚩 +100' }); continue }
    if (o.k === 'prop' && !o.got && near) { o.got = true; fly = FLY; hz = 40; playMus('wings'); S.hooks.onPower && S.hooks.onPower('pg_prop'); continue }
    if (o.k === 'fishhole' && near && !o.got && fishH(o) > 4) {   // chạm vào cá đang nhảy là bắt được (đứng hay nhảy đều được)
      const e = o.gold ? COST.fish * 2.5 : COST.fish; o.got = true; score += o.gold ? 1000 : 300; S.coins++; S.energy += e; GC.sfx('pfruit');
      pops.push({ t: 60, s: (o.gold ? '🌟 Cá vàng +' : '🐟 +') + e + '⚡' }); S.hooks.onBat && S.hooks.onBat(e, 'fish'); continue;
    }
    if (fly || inv) continue;
    if ((o.k === 'hole' || o.k === 'fishhole' || o.k === 'seal') && near && hz < (o.k === 'seal' ? 22 : 12)) { trip(o.k === 'seal' ? '🦭 Đụng hải cẩu!' : '🕳 Vấp lỗ băng!'); continue }
    if (o.k === 'crack' && hz < 10 && !(o.gap != null && Math.abs(px - o.gap) < .28)) { fall = 80; fall0 = o.z + o.w + 8; speed = 0; S.falls++; GC.sfx('fall'); S.hooks.onPower && S.hooks.onPower('pg_fall'); return }
  }
  if (pos >= L) { phase = 'clear'; phT = 310; jingle('pgcp', 5100) }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  if (score > best) best = score;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && speed < .3 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 700);
}
let fall0 = 0;
const fishH = o => o.t > 0 && o.t < 80 ? Math.sin(o.t / 80 * Math.PI) * 60 : 0;   // cá nhảy vọt lên rồi rơi xuống lỗ
function trip(msg) { stun = 42; speed *= .25; inv = 30; S.hits++; GC.sfx('hurt'); if (S.tick - (trip.last || 0) > 300) { trip.last = S.tick; S.hooks.onPower && S.hooks.onPower('pg_trip') } }

/* ═════ vẽ: đúng độ phân giải thật của màn hình (kể cả màn hình nét cao) → viền mượt, không vỡ hạt ═════
   Kích thước hình vẽ tính theo "điểm gốc" (khung 300 điểm ngang) × Q, nên màn to hay nhỏ đều cùng tỉ lệ. */
let lo = null, lx = null, mc = null, PK = 1, FW = 0, FH = 0, Q = 1;
const OV = [];   // chữ vẽ sau cùng (tên · điểm bay lên · tên trạm)
const pixFont = n => '700 ' + n + 'px "Press Start 2P", Consolas, monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#0A1A3A'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
const hsh = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v) };
function ov(g, cx, cy, rx, ry, col, ang) { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, Math.max(rx, .3), Math.max(ry, .3), ang || 0, 0, Math.PI * 2); g.fill() }
function poly(g, col, pts) { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill() }
function line(g, col, w, pts) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke() }
const SPR = {};
function mk(key, w, h, fn) {   // hình vẽ sẵn ở đúng độ nét đang cần (Q), vẽ 1 lần rồi dùng lại
  const q = Math.max(1, Math.round(Q * 4) / 4), k = key + '@' + q; if (SPR[k]) return SPR[k];
  const c = document.createElement('canvas'); c.width = Math.ceil(w * q); c.height = Math.ceil(h * q); const g = c.getContext('2d'); g.scale(q, q); fn(g); c.bw = w; return SPR[k] = c;
}
/* chim cánh cụt nhìn từ phía sau như bản gốc: thân đen viền xanh, chân vàng cam · khăn quàng màu nhân vật. f: 0/1 bước chân · 'j' nhảy/bay · 't' ngã */
const PK_K = '#101020', PK_H = '#3850A8', PK_G = '#8CA4F0', PK_O = '#F8A800', PK_OD = '#B86000';
function peng(f) {
  const col = S.color && !/^#f{3,6}$/i.test(S.color) ? S.color : '#E40028';
  return mk('pg' + f + col, 38, 38, g => {
    g.translate(3, 0);   // chừa chỗ cho 2 vây giang ra
    if (f === 't') {   // ngã sấp: đầu chúi xuống, vây giang ra, chân chổng lên
      ov(g, 16.6, 24, 7, 5, PK_H); ov(g, 16, 24, 7, 5, PK_K);
      ov(g, 4, 29, 5, 2, PK_K, .35); ov(g, 28, 29, 5, 2, PK_K, -.35);
      ov(g, 16.8, 29.5, 12, 6.5, PK_H); ov(g, 16, 29.5, 12, 6.5, PK_K); ov(g, 21, 26, 4, 1.4, '#2A3A78', -.15);
      ov(g, 9, 35.4, 3.6, 2.2, PK_OD, -.5); ov(g, 9, 35, 3.6, 2.2, PK_O, -.5); ov(g, 23, 35.4, 3.6, 2.2, PK_OD, .5); ov(g, 23, 35, 3.6, 2.2, PK_O, .5); return;
    }
    const j = f === 'j', b = f === 1 ? 1 : 0;
    if (j) { ov(g, 11, 35, 3.2, 2.3, PK_OD); ov(g, 11, 34.5, 3.2, 2.2, PK_O); ov(g, 21, 35, 3.2, 2.3, PK_OD); ov(g, 21, 34.5, 3.2, 2.2, PK_O) }   // chân buông thõng khi nhảy
    else for (const [x, y] of [[10.5, f ? 33.6 : 35], [21.5, f ? 35 : 33.6]]) { ov(g, x, y + .6, 4.4, 2, PK_OD); ov(g, x, y, 4.4, 1.9, PK_O); line(g, PK_OD, .5, [[x - 1.5, y + .4], [x - 1.2, y + 1.6]]); line(g, PK_OD, .5, [[x + 1.5, y + .4], [x + 1.2, y + 1.6]]) }   // chân có màng
    const fy = j ? 15 : 21 + b, fa = j ? 2.3 : f ? .78 : .6, fb = j ? 2.3 : f ? .6 : .78;   // vây đánh qua lại theo bước chân · giơ lên khi nhảy
    for (const [cx, a] of [[j ? 5 : 4.6, fa], [j ? 27 : 27.4, -fb]]) { ov(g, cx + .7, fy, 2.7, 7.2, PK_H, a); ov(g, cx, fy, 2.6, 7.2, PK_K, a) }
    ov(g, 17, 23 + b, 10.5, 11, PK_H); ov(g, 16, 23 + b, 10.5, 11, PK_K);
    ov(g, 16.8, 9.5 + b, 8, 7.8, PK_H); ov(g, 16, 9.5 + b, 8, 7.8, PK_K);
    ov(g, 21.8, 26 + b, 1.6, 5.5, '#1A2450', .15);   // ánh sáng mờ trên lưng
    ov(g, 19.5, 5 + b, 2.4, 1.3, PK_G, -.5); ov(g, 21.6, 7.2 + b, .8, .6, PK_G);   // bóng sáng trên đầu
    line(g, col, 2.4, [[8.6, 16.2 + b], [12, 17.8 + b], [16, 18.4 + b], [20, 17.8 + b], [23.4, 16.2 + b]]);   // khăn quàng
    poly(g, col, [[18.6, 17.6 + b], [21.6, 17.6 + b], [22.4, 23.4 + b], [20.6, 22.4 + b], [19, 23.6 + b]]);
    line(g, 'rgba(255,255,255,.45)', .6, [[10, 16.4 + b], [16, 17.6 + b], [21, 16.9 + b]]);
  });
}
function seal() {   // hải cẩu vàng cam thò đầu khỏi lỗ: mắt nhắm cười, mõm trắng, ria
  return mk('seal', 30, 27, g => {
    const Y = '#F8B000', D = '#A05000', M = '#FCEBC0';
    ov(g, 15, 22, 13.5, 9.5, D); ov(g, 15, 10, 10.5, 9.5, D); ov(g, 15, 22, 12.6, 8.6, Y); ov(g, 15, 10, 9.6, 8.6, Y);
    ov(g, 18.5, 18, 4, 6, '#E89A00', .3); ov(g, 11.5, 5.5, 3.2, 1.6, '#FCD860', -.3);
    g.strokeStyle = '#201000'; g.lineWidth = 1.1; g.lineCap = 'round';
    for (const x of [10, 20]) { g.beginPath(); g.arc(x, 10.6, 1.9, Math.PI * 1.12, Math.PI * 1.88); g.stroke() }   // mắt nhắm cười ^ ^
    ov(g, 6.6, 12.4, 1.6, 1, '#F89070'); ov(g, 23.4, 12.4, 1.6, 1, '#F89070');
    ov(g, 15, 15, 5.4, 3.4, M); ov(g, 15, 13.2, 2, 1.25, '#201000'); ov(g, 14.4, 12.8, .6, .35, '#fff');
    g.lineWidth = .7; g.beginPath(); g.arc(13.8, 15.6, 1.2, .15 * Math.PI, .85 * Math.PI); g.stroke(); g.beginPath(); g.arc(16.2, 15.6, 1.2, .15 * Math.PI, .85 * Math.PI); g.stroke();
    for (const s of [-1, 1]) { line(g, D, .5, [[15 + s * 4.6, 14.4], [15 + s * 9, 13.2]]); line(g, D, .5, [[15 + s * 4.6, 15.6], [15 + s * 9, 16.6]]) }   // ria
  });
}
function fishImg(gold) {
  return mk('fish' + (gold ? 'g' : ''), 18, 10, g => {
    const B = gold ? '#F8D020' : '#F87890', D = gold ? '#B87800' : '#C03050', W = gold ? '#FFF8C0' : '#FFD8E0';
    poly(g, D, [[12, 5], [17.6, 1.2], [16.4, 5], [17.6, 8.8]]); poly(g, D, [[7, 1.8], [10.5, .2], [11, 2.4]]);
    ov(g, 8, 5, 6.6, 3.6, D); ov(g, 8, 4.9, 6, 3.05, B); ov(g, 8.4, 6.3, 4.6, 1.4, W);
    line(g, D, .4, [[11, 2.6], [11.3, 7.4]]); ov(g, 3.8, 3.8, 1.25, 1.25, '#fff'); ov(g, 3.6, 3.8, .65, .65, '#000');
    if (gold) { ov(g, 8, 3.4, 1.3, .5, '#fff'); ov(g, 10.5, 4.2, .5, .5, '#fff') }
  });
}
function flagImg(k) {   // cờ cắm trên băng · cờ chong chóng màu đỏ
  return mk('flag' + k, 12, 24, g => {
    g.fillStyle = '#6A4A2A'; g.fillRect(2.2, 3, 1.6, 21); g.fillStyle = '#B89060'; g.fillRect(2.2, 3, .6, 21); ov(g, 3, 2.4, 1.6, 1.6, '#F8D000');
    const c = k === 'prop' ? '#F83800' : '#00B800', cd = k === 'prop' ? '#A02000' : '#007800';
    poly(g, cd, [[3.8, 3.2], [12, 7.6], [3.8, 11.6]]); poly(g, c, [[3.8, 3.2], [12, 7.2], [3.8, 10.6]]);
  });
}
function cloudImg() { return mk('cloud', 30, 12, g => { for (const [x, y, rx, ry] of [[8, 7, 6, 4], [14, 5, 6.5, 4.5], [21, 6.5, 6, 4], [15, 8.5, 12.5, 3]]) ov(g, x, y, rx, ry, '#FFFFFF'); ov(g, 15, 10.4, 10, 1.2, '#DCEFFC') }) }
function spr(img, x, y, sc, flip) {   // sc: số điểm thật cho mỗi "điểm gốc" của hình
  const w = img.bw * sc, h = img.height / img.width * w, x0 = x - w / 2, y0 = y - h;
  if (flip) { ctx.save(); ctx.translate(x0 + w, y0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore() } else ctx.drawImage(img, x0, y0, w, h);
}
const hy = () => Math.round(VH * .4), footY = () => Math.round(VH * .85);   // chân chim đứng cao hơn đáy → không bị nút bấm che
const yAt = d => hy() + (footY() - hy()) * D0 / (Math.max(d, -D0 * .5) + D0);   // chặn chia cho 0 khi vật ở sau lưng
const dAt = y => D0 * (footY() - hy()) / Math.max(.01, y + .5 - hy()) - D0;   // ngược lại: hàng điểm ảnh → độ sâu
const scAt = d => VW * .42 * D0 / (Math.max(d, -D0 * .5) + D0);   // nửa chiều rộng đường (đơn vị 1) ra điểm ảnh
const camX = () => px * .55;
const xAt = (d, wx) => VW / 2 + (wx - camX() - shiftAt(d)) * scAt(d);
function drawFlag(code, x, y, s) {   // cờ các nước
  const W2 = 18 * s, H2 = 12 * s, F = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a * s, y + b * s, w * s, h * s) };
  if (code === 'JP') { F('#FFFFFF', 0, 0, 18, 12); ov(ctx, x + 9 * s, y + 6 * s, 3.5 * s, 3.5 * s, '#E40028') }
  else if (code === 'FR') { F('#0038A8', 0, 0, 6, 12); F('#FFFFFF', 6, 0, 6, 12); F('#E40028', 12, 0, 6, 12) }
  else if (code === 'US') { for (let i = 0; i < 7; i++)F(i % 2 ? '#FFFFFF' : '#E40028', 0, i * 12 / 7, 18, 12 / 7); F('#0038A8', 0, 0, 8, 6.9); for (let i = 0; i < 6; i++) ov(ctx, x + (1.5 + (i % 3) * 2.5) * s, y + (1.6 + Math.floor(i / 3) * 3) * s, .5 * s, .5 * s, '#fff') }
  else if (code === 'AR') { F('#78C8F8', 0, 0, 18, 4); F('#FFFFFF', 0, 4, 18, 4); F('#78C8F8', 0, 8, 18, 4); ov(ctx, x + 9 * s, y + 6 * s, 1.4 * s, 1.4 * s, '#F8B800') }
  else if (code === 'UK') { F('#0038A8', 0, 0, 18, 12); ctx.save(); ctx.beginPath(); ctx.rect(x, y, W2, H2); ctx.clip(); line(ctx, '#FFFFFF', 2.4 * s, [[x, y], [x + W2, y + H2]]); line(ctx, '#FFFFFF', 2.4 * s, [[x + W2, y], [x, y + H2]]); line(ctx, '#E40028', .9 * s, [[x, y], [x + W2, y + H2]]); line(ctx, '#E40028', .9 * s, [[x + W2, y], [x, y + H2]]); ctx.restore(); F('#FFFFFF', 7, 0, 4, 12); F('#FFFFFF', 0, 4, 18, 4); F('#E40028', 8, 0, 2, 12); F('#E40028', 0, 5, 18, 2) }
  else { F('#0038A8', 0, 0, 18, 12); F('#FFFFFF', 0, 0, 8, 6); F('#E40028', 3, 0, 2, 6); F('#E40028', 0, 2, 8, 2); for (const [a, b] of [[13, 3], [15, 7], [12, 8.5], [16, 4]]) ov(ctx, x + a * s, y + b * s, .8 * s, .8 * s, code === 'NZ' ? '#E40028' : '#FFFFFF') }
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, s * .4); ctx.strokeRect(x, y, W2, H2);
}
function draw() {
  const st = STAGES[S.level]; OV.length = 0;
  ctx = lx; lx.setTransform(1, 0, 0, 1, 0, 0); lx.imageSmoothingEnabled = true; lx.imageSmoothingQuality = 'high';
  world(st);
  ctx = mc; mc.setTransform(1, 0, 0, 1, 0, 0); mc.drawImage(lo, 0, 0);
  mc.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const f of OV) f();
  hud(st);
}
function world(st) {
  const H0 = hy(), FY = footY(), q = Q;
  // trời · sao & cực quang ban đêm · mây
  const g = ctx.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, H0 + 1);
  if (st.night) {
    for (let k = 0; k < 3; k++) {   // cực quang: dải sáng uốn lượn
      const ag = ctx.createLinearGradient(0, (14 + k * 7) * q, 0, (40 + k * 7) * q); ag.addColorStop(0, k === 1 ? 'rgba(170,110,255,.0)' : 'rgba(60,240,170,.0)'); ag.addColorStop(.4, k === 1 ? 'rgba(170,110,255,.38)' : 'rgba(60,240,170,.42)'); ag.addColorStop(1, 'rgba(60,240,170,0)');
      ctx.fillStyle = ag; ctx.beginPath(); for (let x = 0; x <= VW + 8 * q; x += 4 * q) ctx.lineTo(x, (16 + k * 7 + Math.sin(x / q * .035 + S.tick * .02 + k) * 7) * q); for (let x = VW + 8 * q; x >= 0; x -= 4 * q) ctx.lineTo(x, (40 + k * 7 + Math.sin(x / q * .05 + k * 2 + S.tick * .025) * 5) * q); ctx.fill();
    }
    for (let i = 0; i < 60; i++) { const r = ((S.tick >> 4) + i) % 5 ? .55 : .9; ov(ctx, ((i * 97 * q + skyOff * .1 * q) % VW + VW) % VW, (17 + (i * 37) % Math.max(1, H0 / q - 22)) * q, r * q, r * q, i % 7 ? '#FFFFFF' : '#C8D4FF') }
  } else { const cl = cloudImg(); for (let i = 0; i < 5; i++) { const per = VW + 70 * q, x = ((i * 77 * q - skyOff * .12 * q) % per + per) % per - 35 * q; if (st.dusk) ctx.globalAlpha = .85; spr(cl, x, (30 + (i * 11) % Math.max(1, H0 / q - 40)) * q, q * (i % 2 ? 1.2 : 1)); ctx.globalAlpha = 1 } }
  if (st.dusk) { ov(ctx, VW * .75, H0, 16 * q, 16 * q, 'rgba(255,230,170,.35)'); ov(ctx, VW * .75, H0, 10 * q, 10 * q, '#FCE0A0') }
  horizon(st, H0, q);
  // mặt đất vẽ từng hàng: biển · mép băng răng cưa đen · đường băng · đồng tuyết sọc
  const fc = st.field, rs = 1, sL = st.seaL, sR = st.seaR;
  for (let y = H0; y < VH; y += rs) {
    const d = Math.min(DRAWD, dAt(y)), s = scAt(d), z = pos + d, far = d >= DRAWD;
    const xl = xAt(d, -HALF - .25), xr = xAt(d, HALF + .35);
    ctx.fillStyle = sL ? st.sea : fc[0]; ctx.fillRect(0, y, Math.max(0, xl), rs);
    ctx.fillStyle = st.ground; ctx.fillRect(xl, y, xr - xl, rs);
    ctx.fillStyle = sR ? st.sea : fc[0]; ctx.fillRect(xr, y, VW - xr, rs);
    if (far) continue;
    const wb = Math.floor(z / 45); if (wb % 4 === 0) { ctx.fillStyle = st.wave; for (let j = 0; j < 3; j++) { const o = .9 + j * 1.6 + hsh(wb * 3 + j) * 1.2; if (sL) { const wx = xAt(d, -HALF - o); if (wx < xl - 2 * q) ctx.fillRect(wx, y, s * .22, rs) } if (sR) { const wx = xAt(d, HALF + .2 + o); if (wx > xr + 2 * q) ctx.fillRect(wx, y, s * .22, rs) } } }   // sóng lăn tăn
    const tb = Math.floor(z / 80); if (tb % 3 === 0) { const w = Math.min(7 * q, s * .2 * (z % 80) / 80); if (w > .5) { ctx.fillStyle = '#000000'; if (sL) ctx.fillRect(xl - w, y, w, rs); if (sR) ctx.fillRect(xr, y, w, rs) } }   // mép băng răng cưa
    const lw = Math.max(1, s * .03); ctx.fillStyle = '#A8D0F8'; if (sL) ctx.fillRect(xl, y, lw, rs); if (sR) ctx.fillRect(xr - lw, y, lw, rs);
    const b = Math.floor(z / 22); if (b % 2) { ctx.fillStyle = fc[1]; for (let j = 0; j < 5; j++) { const ww = s * (.15 + hsh(b * 13 + j * 5) * .45), o = .6 + j * 1.15 + hsh(b * 7 + j) * .9; if (!sR) ctx.fillRect(xAt(d, HALF + o), y, ww, rs); if (!sL) ctx.fillRect(xAt(d, -HALF - .1 - o) - ww, y, ww, rs) } }   // đồng tuyết sọc
    if (Math.floor(z / 140) % 4 === 1 && d < 900) { ctx.fillStyle = st.streak; ctx.fillRect(xAt(d, -.6), y, s * .5, rs); ctx.fillRect(xAt(d, .4), y, s * .4, rs) }
  }
  // vật thể: xa vẽ trước · vật đã ở sau chân chim vẽ sau cùng
  const vis = objs.filter(o => o.z - pos > -30 && o.z - pos < DRAWD).sort((a, b) => b.z - a.z);
  const sD = L + STN - pos, dv = decos.filter(o => o.z - pos > -20 && o.z - pos < DRAWD).sort((a, b) => b.z - a.z);
  for (const o of dv) if (o.z - pos > sD) drawDeco(o, o.z - pos);
  if (sD < DRAWD + 200) drawStation(sD, st);
  for (const o of dv) if (o.z - pos <= sD) drawDeco(o, o.z - pos);
  for (const o of vis) if (o.z - pos >= 0 || o.k === 'hole' || o.k === 'crack') drawObj(o, o.z - pos);   // vật đã ra sau lưng: chỉ còn hố trên mặt băng, chim luôn vẽ đè lên
  // chim cánh cụt
  const bx = VW / 2 + (px - camX()) * scAt(0), by = FY, lift = hz * .62 * q;
  ov(ctx, bx, by - q, Math.max(6, 12 - hz * .1) * q, 2.4 * q, st.night ? 'rgba(40,60,150,.55)' : 'rgba(70,120,230,.45)');   // bóng xanh dưới chân
  if (fall) { const k = fall > 40 ? (80 - fall) / 40 : fall / 40; ov(ctx, bx, by - q, 15 * q, 3.5 * q, '#081840'); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, by - 2 * q); ctx.clip(); spr(peng('j'), bx, by + k * 34 * q, q); ctx.restore() }
  else {
    const home = (phase === 'clear' && speed < .6) || phase === 'won', img = home ? pengFront([0, 1, 2, 1][(S.tick >> 3) & 3]) : stun ? peng('t') : hz > 4 || fly ? peng('j') : peng(Math.floor(walk) % 2);   // về tới trạm: quay mặt lại vẫy chào
    if (!(inv && (S.tick >> 2) & 1 && !stun)) spr(img, bx, by - lift, q);
    if (stun) for (let i = 0; i < 3; i++) { const a = S.tick * .2 + i * 2.1, sx = bx + Math.cos(a) * 11 * q, sy = by - 20 * q + Math.sin(a) * 3 * q; poly(ctx, '#F8E000', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => [sx + Math.cos(k * Math.PI / 5 - 1.57) * (k % 2 ? .7 : 1.8) * q, sy + Math.sin(k * Math.PI / 5 - 1.57) * (k % 2 ? .7 : 1.8) * q])) }   // sao quay quanh đầu
    if (fly) { const py = by - lift - 39 * q, w = Math.abs(Math.cos(S.tick * .6)) * 11 * q; ctx.fillStyle = '#E40028'; ctx.fillRect(bx - q, py, 2 * q, 4 * q); ov(ctx, bx, py, Math.max(q * .6, w), 1.2 * q, '#F8D000'); ov(ctx, bx, py, 1.2 * q, 1.2 * q, '#E40028') }   // chong chóng trên đầu
  }
  if (st.snow) { ctx.fillStyle = '#FFFFFF'; for (const f of flakes) ov(ctx, f.x * VW, f.y * VH, (f.v > .007 ? 1.2 : .7) * q, (f.v > .007 ? 1.2 : .7) * q, '#FFFFFF'); ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fillRect(0, 0, VW, VH) }
  const nameY = by - lift - (fly ? 44 : 41) * q;
  OV.push(() => { if (S.name) label(S.name, bx * PK, nameY * PK, 14, '#fff'); for (const p of pops) { ctx.globalAlpha = Math.min(1, p.t / 20); label(p.s, bx * PK, (nameY - 6 * q) * PK - (60 - p.t) * .8, 19, '#FFE135'); ctx.globalAlpha = 1 } });
}
function drawObj(o, d) {
  const y = yAt(d), s = scAt(d), x = xAt(d, o.x || 0), q = Q;
  if (o.k === 'crack') {   // khe nứt ngang đường: mép băng sáng · nước sâu tối · vệt nước xanh
    const ya = Math.round(yAt(d + o.w)), yb = Math.max(ya + 1, Math.round(y));
    const xs = (dd, k) => xAt(dd, k ? HALF + .3 : -HALF - .2);
    poly(ctx, '#081840', [[xs(d + o.w, 0), ya], [xs(d + o.w, 1), ya], [xs(d, 1), yb], [xs(d, 0), yb]]);
    ctx.fillStyle = '#081840'; for (let k = xs(d + o.w, 0); k < xs(d + o.w, 1); k += 6 * q * s / scAt(0)) ctx.fillRect(k, ya - 1.2 * q * s / scAt(0), 3 * q * s / scAt(0), 1.2 * q * s / scAt(0) + 1);   // răng cưa mép xa
    const ym = ya + (yb - ya) * .5, yn = ya + (yb - ya) * .72; poly(ctx, '#2058C8', [[xs(d + o.w * .5, 0), ym], [xs(d + o.w * .5, 1), ym], [xs(d + o.w * .28, 1), yn], [xs(d + o.w * .28, 0), yn]]);
    const lip = Math.max(1, (yb - ya) * .14); poly(ctx, '#A8D0F8', [[xs(d, 0), yb - lip], [xs(d, 1), yb - lip], [xs(d, 1), yb], [xs(d, 0), yb]]);
    if (o.gap != null) { const gw = s * .5, ga = xAt(d + o.w, o.gap), gb = xAt(d, o.gap), wa = scAt(d + o.w) * .5; poly(ctx, STAGES[S.level].ground, [[ga - wa / 2, ya - 2 * q], [ga + wa / 2, ya - 2 * q], [gb + gw / 2, yb + 1], [gb - gw / 2, yb + 1]]); line(ctx, '#90C0F0', Math.max(1, q * .6), [[ga - wa / 2, ya - 2 * q], [gb - gw / 2, yb]]); line(ctx, '#90C0F0', Math.max(1, q * .6), [[ga + wa / 2, ya - 2 * q], [gb + gw / 2, yb]]) }   // cầu băng hẹp
    return;
  }
  if (o.k === 'hole' || o.k === 'seal' || o.k === 'fishhole') {
    const rw = s * o.w / 2, rh = Math.max(1, rw * .26);
    ov(ctx, x, y, rw, rh, '#5C8CF8'); ov(ctx, x, y + rh * .12, rw * .88, rh * .8, '#1C48D0'); ov(ctx, x, y - rh * .28, rw * .72, rh * .42, '#0A1C70'); ov(ctx, x + rw * .35, y + rh * .4, rw * .25, rh * .12, 'rgba(255,255,255,.35)');
    if (o.k === 'seal' && o.up > 0) { const k = Math.min(1, o.up / 24), sc = s * .5 / 30, img = seal(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, y + rh * .1); ctx.clip(); spr(img, x, y + 2 + (1 - k) * 27 * sc, sc); ctx.restore() }
    if (o.k === 'fishhole' && !o.got) {
      const fh = fishH(o), sc = s * .26 / 18;
      if (fh > 1) { const t = o.t / 80, fx = xAt(d, o.x + (t - .5) * .5); ctx.save(); ctx.translate(fx, y - fh * s / 130); ctx.rotate((t - .5) * 1.2); spr(fishImg(o.gold), 0, 5 * sc, sc, true); ctx.restore() }   // cá vọt lên thành vòng cung
      else if ((S.tick >> 3) & 1 && rw > 3) ov(ctx, x - rw * .15, y - rh * .2, rw * .28, rh * .35, o.gold ? '#F8D020' : '#F87890');   // lưng cá lấp ló trong lỗ
    }
    return;
  }
  if (o.k === 'flag' || o.k === 'prop') {
    if (o.got) return; const sc = s * .5 / 24;
    ov(ctx, x, y, 3 * sc, 1 * sc, 'rgba(60,90,160,.35)'); spr(flagImg(o.k), x + 3 * sc, y, sc);
    if (o.k === 'prop') { const w = Math.abs(Math.cos(S.tick * .5)) * 6 * sc; ov(ctx, x, y - 24 * sc, Math.max(sc * .5, w), sc * .8, '#F8D000') }
  }
}
function horizon(st, H0, q) {   // chân trời: núi băng trôi · dãy núi tuyết · núi lửa Erebus bốc khói
  const nt = st.night, k = st.hzn;
  if (k === 'mount' || k === 'volcano') {
    const m = st.mcol || (nt ? ['#4A5C90', '#36487A', '#B8C8E8'] : ['#93ABD0', '#7088B8', '#FFFFFF']);
    for (let i = 0; i < 8; i++) {
      const per = VW + 200 * q, x = ((i * 71 * q - skyOff * .22 * q) % per + per) % per - 100 * q, w = (46 + (i * 29) % 40) * q, h = (14 + (i * 17) % 16) * q * (k === 'volcano' ? .65 : 1);
      poly(ctx, m[0], [[x - w / 2, H0], [x - w * .05, H0 - h], [x + w * .05, H0 - h], [x + w / 2, H0]]);
      poly(ctx, m[1], [[x + w * .05, H0 - h], [x + w / 2, H0], [x + w * .12, H0]]);
      poly(ctx, m[2], [[x - w * .05, H0 - h], [x + w * .05, H0 - h], [x + w * .17, H0 - h * .62], [x + w * .07, H0 - h * .7], [x, H0 - h * .58], [x - w * .08, H0 - h * .68], [x - w * .16, H0 - h * .6]]);
    }
  }
  if (k === 'volcano') {   // núi lửa Erebus thật ở Nam Cực, khói bay lên
    const per = VW + 300 * q, x = ((VW * .3 - skyOff * .15 * q) % per + per) % per - 50 * q, w = 96 * q, h = 26 * q;
    for (let i = 0; i < 7; i++) { const t = ((S.tick * .25 + i * 17) % 120) / 120; ov(ctx, x + t * 34 * q + Math.sin(i * 2) * 3 * q, H0 - h - 2 * q - t * 30 * q, (3 + t * 8) * q, (2.4 + t * 5) * q, 'rgba(236,238,246,' + (.85 - t * .75).toFixed(2) + ')') }
    poly(ctx, '#7A86A8', [[x - w / 2, H0], [x - w * .07, H0 - h], [x + w * .07, H0 - h], [x + w / 2, H0]]);
    poly(ctx, '#5E6A90', [[x + w * .07, H0 - h], [x + w / 2, H0], [x + w * .15, H0]]);
    poly(ctx, '#FFFFFF', [[x - w * .07, H0 - h], [x + w * .07, H0 - h], [x + w * .2, H0 - h * .55], [x + w * .1, H0 - h * .62], [x + w * .02, H0 - h * .5], [x - w * .08, H0 - h * .63], [x - w * .2, H0 - h * .52]]);
    ov(ctx, x, H0 - h, w * .06, q, '#4A4A60');
  }
  if (k !== 'mount') for (let i = 0; i < 9; i++) {   // núi băng trôi: mặt trắng · sườn khuất xanh
    const per = VW + 100 * q, x = ((i * 61 * q - skyOff * .35 * q) % per + per) % per - 50 * q, w = (14 + (i * 37) % 26) * q, h = (3 + (i * 13) % 5) * q, ice = nt ? '#8098C8' : '#FCFCFC', sh = nt ? '#5870A8' : '#9CC8F0';
    poly(ctx, ice, [[x, H0], [x + 2 * q, H0 - h], [x + w * .3, H0 - h - 2 * q], [x + w * .62, H0 - h - 1.2 * q], [x + w - 2 * q, H0 - h], [x + w, H0]]);
    poly(ctx, sh, [[x + w * .62, H0 - h - 1.2 * q], [x + w - 2 * q, H0 - h], [x + w, H0], [x + w * .55, H0]]);
    ctx.fillStyle = sh; for (let k2 = 3 * q; k2 < w * .5; k2 += 4 * q) ctx.fillRect(x + k2, H0 - h + 2 * q, q * .8, h - 2 * q);
  }
}
/* chim quay mặt lại như bản gốc lúc về trạm: mặt & bụng trắng, mỏ cam, má hồng, vẫy vây. fr: 0-2 vẫy · 3 đứng yên */
function pengFront(fr, col) {
  col = col || (S.color && !/^#f{3,6}$/i.test(S.color) ? S.color : '#E40028');
  return mk('pf' + fr + col, 38, 40, g => {
    g.translate(3, 1);
    for (const x of [11, 21]) { ov(g, x, 36.6, 4.3, 1.9, PK_OD); ov(g, x, 36, 4.3, 1.8, PK_O) }
    ov(g, 6.5 - Math.sin(.5) * 6, 17 + Math.cos(.5) * 6, 2.6, 7.4, PK_K, .5);   // vây trái buông xuôi
    const a = fr === 3 ? -.5 : [-2.0, -2.5, -2.9][fr]; ov(g, 25.5 - Math.sin(a) * 6, 17 + Math.cos(a) * 6, 2.6, 7.4, PK_K, a);   // vây phải vẫy chào
    ov(g, 16, 23.5, 10.5, 11.2, PK_K); ov(g, 16, 10, 8.5, 8, PK_K); ov(g, 18.5, 5, 2.4, 1.2, '#3A4A8A', -.4);
    ov(g, 16, 25.5, 7.4, 8.6, '#FFFFFF'); ov(g, 17, 27, 5.4, 6.4, '#F2F6FF');
    ov(g, 16, 11.6, 6.6, 5, '#FFFFFF'); ov(g, 12.6, 8.4, 2.6, 2.8, '#FFFFFF'); ov(g, 19.4, 8.4, 2.6, 2.8, '#FFFFFF');
    ov(g, 13, 8.8, 1.3, 1.7, '#101020'); ov(g, 19, 8.8, 1.3, 1.7, '#101020'); ov(g, 13.4, 8.2, .45, .5, '#fff'); ov(g, 19.4, 8.2, .45, .5, '#fff');
    ov(g, 10.4, 12.6, 1.6, .9, '#F8A0B0'); ov(g, 21.6, 12.6, 1.6, .9, '#F8A0B0');
    ov(g, 16, 12.4, 3.8, 1.8, '#F88020'); ov(g, 16, 13.4, 2.8, 1, '#D04818'); line(g, '#A03010', .4, [[12.6, 12.5], [19.4, 12.5]]);   // mỏ cười
    line(g, col, 2.4, [[8.2, 17.2], [12, 18.8], [16, 19.4], [20, 18.8], [23.8, 17.2]]);   // khăn quàng
    poly(g, col, [[10.6, 18.4], [13.6, 18.9], [13.2, 24.4], [11.6, 23.4], [10.2, 24.4]]);
  });
}
function floeImg() { return mk('floe', 40, 14, g => { ov(g, 20, 9.4, 19, 4.4, '#6E9EDC'); ov(g, 20, 7.6, 19, 4.4, '#F4FAFF'); ov(g, 14, 6.6, 8, 1.4, '#FFFFFF'); ov(g, 27, 8.4, 6, 1, '#DCEBFA') }) }
function whaleImg() { return mk('whale', 44, 13, g => { ov(g, 22, 14, 19, 9, '#283860'); ov(g, 17, 9.4, 10, 2, '#46588C'); ov(g, 8.5, 10.6, .9, .9, '#E8F0FF'); line(g, 'rgba(255,255,255,.6)', .6, [[3, 12.6], [41, 12.6]]) }) }
function finImg() { return mk('fin', 14, 18, g => { g.fillStyle = '#101018'; g.beginPath(); g.moveTo(1, 18); g.quadraticCurveTo(4, 8, 6, 1); g.quadraticCurveTo(9, 6, 13, 18); g.fill(); line(g, '#3A4060', .6, [[5.6, 4], [4.4, 14]]) }) }
function spikeImg() {
  return mk('spike', 26, 30, g => {
    poly(g, '#BEE0FA', [[3, 30], [7, 9], [11, 30]]); poly(g, '#E8F6FF', [[9, 30], [13, 2], [18, 30]]); poly(g, '#9CCAF0', [[13, 2], [18, 30], [14.6, 30]]);
    poly(g, '#D0ECFC', [[16, 30], [20, 13], [24, 30]]); poly(g, '#A8D4F4', [[20, 13], [24, 30], [21.5, 30]]); ov(g, 13, 29.4, 12.5, 2, '#FFFFFF');
  });
}
function drawDeco(o, d) {   // đồ trang trí bên đường: chim đứng vẫy · tảng băng trôi · cá voi phun nước · vây cá voi sát thủ · cột băng
  const y = yAt(d), s = scAt(d), x = xAt(d, o.x), t = S.tick + o.ph;
  if (x < -s * 3 || x > VW + s * 3) return;
  if (o.k === 'floe') { const sc = s * 1.1 / 40, bob = Math.sin(t * .04) * sc * .8; spr(floeImg(), x, y + bob, sc); if (o.ph % 3 === 0) spr(pengFront(3, o.c), x, y + bob - 6 * sc, s * .2 / 38) }
  else if (o.k === 'whale') {
    const sc = s * 1.1 / 44; spr(whaleImg(), x, y, sc); const ph = t % 220;
    if (ph < 60) { const k = Math.sin(ph / 60 * Math.PI); for (let i = 0; i < 5; i++) ov(ctx, x - 13 * sc + (i - 2) * 2 * sc * (.4 + k), y - 10 * sc - k * (7 + (i % 2) * 4) * sc, 1.6 * sc, (1 + 3 * k) * sc, 'rgba(235,248,255,.9)') }   // phun nước
  }
  else if (o.k === 'fin') { const sc = s * .28 / 18, fx = xAt(d, o.x + Math.sin(t * .012) * .9); spr(finImg(), fx, y, sc); ov(ctx, fx, y, 9 * sc, 1.3 * sc, 'rgba(255,255,255,.55)') }
  else if (o.k === 'spike') spr(spikeImg(), x, y, s * .55 / 26);
  else if (o.k === 'peng') { const fr = (t >> 4) % 6 < 3 ? (t >> 3) % 3 : 3; ov(ctx, x, y, s * .12, s * .03, 'rgba(70,110,200,.3)'); spr(pengFront(fr, o.c), x, y, s * .36 / 38) }
}
function drawStation(d, st) {   // trạm như bản gốc: nhà dài màu cam hồng · mái tuyết nhũ băng · cửa sổ xanh · cửa ra vào · cờ nước cắm trên mái
  const y = yAt(d), s = scAt(d), x = xAt(d, 0), w = s * 2.6, h = s * .62, x0 = x - w / 2, top = y - h, n = 26;
  ctx.fillStyle = 'rgba(80,110,170,.25)'; ctx.fillRect(x0 + s * .05, y - s * .02, w, s * .06);
  ctx.fillStyle = '#F08C74'; ctx.fillRect(x0, top, w, h); ctx.fillStyle = '#E07862'; ctx.fillRect(x0 + w * .97, top, w * .03, h);
  ctx.fillStyle = '#E8A040'; ctx.beginPath(); ctx.moveTo(x0, top); for (let i = 0; i <= n; i++) { const xi = x0 + w * i / n; ctx.lineTo(xi - w / n * .5, top); ctx.lineTo(xi - w / n * .25, top + h * (.1 + hsh(i * 3) * .14)) } ctx.lineTo(x0 + w, top); ctx.fill();   // nhũ băng vàng cam
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x0 - s * .03, top - h * .14); ctx.lineTo(x0 + w + s * .03, top - h * .14); for (let i = n; i >= 0; i--) ctx.lineTo(x0 + w * i / n, top + h * (i % 2 ? .02 : .08)); ctx.fill();   // tuyết phủ mái
  ctx.beginPath(); ctx.moveTo(x0 - s * .03, y + 1); for (let i = 0; i <= n; i++) ctx.lineTo(x0 + w * i / n, y - h * (i % 2 ? .1 : .04)); ctx.lineTo(x0 + w + s * .03, y + 1); ctx.fill();   // tuyết đọng chân tường
  for (const k of [.2, .4]) { ctx.fillStyle = '#3848E0'; ctx.fillRect(x0 + w * k, top + h * .3, w * .085, h * .3); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x0 + w * k, top + h * .6, w * .085, h * .05) }   // cửa sổ
  ctx.fillStyle = '#101010'; ctx.fillRect(x0 + w * .64, top + h * .25, Math.max(1, s * .02), h * .75); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x0 + w * .64, top + h * .25, w * .16, Math.max(1, s * .012)); ctx.fillStyle = '#101010'; ctx.fillRect(x0 + w * .67, top + h * .55, s * .03, s * .02);   // cửa ra vào
  const fx = x0 + w * .4, fh = h * .85; ctx.fillStyle = '#101010'; ctx.fillRect(fx, top - h * .14 - fh, Math.max(1, s * .025), fh); poly(ctx, '#101010', [[fx - s * .12, top - h * .12], [fx + s * .14, top - h * .12], [fx + s * .01, top - h * .26]]);   // cột cờ trên mái
  drawFlag(st.flag, fx + Math.max(1, s * .025), top - h * .14 - fh, Math.max(.3, s * .024));
  if (d < 700) OV.push(() => label('🏁 ' + st.name, x * PK, (top - h * 1.5) * PK, Math.max(13, Math.min(22, s * PK * .08)), '#FFFFFF'));
}
function hud(st) {   // thanh trên đen kiểu MSX: điểm · TIME · REST km · SPEED
  const sm = FW < 520, u = sm ? 1 : clamp(FW / 1000, 1, 1.6), Y1 = 5 * u, Y2 = 25 * u;   // màn to → chữ to theo
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, FW, 46 * u);
  ctx.font = pixFont(sm ? 11 : Math.round(15 * u)); ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(score).padStart(6, '0') + '  HI-' + String(best).padStart(6, '0'), 10, Y1);
  ctx.textAlign = 'right'; ctx.fillText('STAGE-0' + (S.level + 1), FW - 10, Y1);
  const tl = Math.max(0, Math.ceil(timeLeft / 60)); ctx.textAlign = 'left'; ctx.fillStyle = tl <= 10 && (S.tick >> 3) & 1 ? '#FF4D4D' : '#FFFFFF'; ctx.fillText('TIME-' + String(tl).padStart(4, '0'), 10, Y2);
  ctx.fillStyle = '#FFFFFF'; const rest = Math.max(0, Math.ceil((L - pos) / 40)); ctx.fillText('REST ' + String(rest).padStart(4, '0') + 'km', sm ? 120 : 190 * u, Y2);
  const n = 10, sw = sm ? 4 : Math.round(6 * u), sx = FW - 10 - n * (sw + 2); ctx.textAlign = 'right'; ctx.fillText('SPEED', sx - 6, Y2); for (let i = 0; i < n; i++) { ctx.fillStyle = i < Math.round(speed / LVC.vmax * n) ? '#FFFFFF' : '#404040'; ctx.fillRect(sx + i * (sw + 2), Y2 + 2 * u, sw, 12 * u) }
  ctx.textBaseline = 'alphabetic'; ctx.font = '800 13px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#0A1A3A'; ctx.lineWidth = 3; const lt = '❤️×' + S.lives + '  🐟🚩 ' + S.coins + (fly ? '  🚁 ' + Math.ceil(fly / 60) + 's' : ''); ctx.strokeText(lt, 10, 46 * u + 20); ctx.fillText(lt, 10, 46 * u + 20);
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.font = pixFont(22); ctx.textAlign = 'center'; ctx.fillStyle = '#0A1A3A'; ctx.fillText(banner.w, FW / 2 + 2, FH * .3 + 2); ctx.fillStyle = '#FFFFFF'; ctx.fillText(banner.w, FW / 2, FH * .3); label(banner.text, FW / 2, FH * .3 + 36, 20, '#FFE135'); ctx.globalAlpha = 1 }
  if (phase === 'clear') label(S.level >= NL - 1 ? '🏆 PHÁ ĐẢO! Tới đủ 7 trạm!' : '🏁 TỚI ' + st.name.toUpperCase() + '! Giờ còn lại đổi thành điểm', FW / 2, FH * .3, 22, '#5CFF8A');
  if (phase === 'over') label('💀 GAME OVER — chạy lại chặng này', FW / 2, FH * .36, 22, '#FF4D7A');
  if (fall) label('🥶 Rơi xuống khe nứt! Đang trèo lên…', FW / 2, FH * .36, 18, '#BCE4FC');
  if (S.energy <= 0 && S.running && !S.over && phase === 'run') label('⚡ HẾT SỨC — trả lời câu hỏi để chạy tiếp (đồng hồ đang dừng)', FW / 2, FH * .5, 15, '#FFE08A');
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), port = cw / ch < 1.02; room = touch && port ? 150 : 0;
  FW = cw; FH = Math.max(200, ch - room); PK = 1 / dpr; VW = Math.round(FW * dpr); VH = Math.round(FH * dpr); Q = VW / 300; lo.width = VW; lo.height = VH;   // vẽ đúng số điểm ảnh thật của màn hình
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else { acc = 0; calcShift() }
  draw(); if (room) { mc.setTransform(dpr, 0, 0, dpr, 0, 0); mc.fillStyle = '#0A1A3A'; mc.fillRect(0, FH, cw, ch - FH) }
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}
/* ═════ điều khiển: ← → rẽ · ↑ / Space nhảy · ↓ chậm lại ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ' ': 'u', ArrowDown: 'd', s: 'd', S: 'd' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'u' && !keys.u) keys.up = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'u' && !keys.u) keys.up = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; mc = ctx = cv.getContext('2d'); lo = document.createElement('canvas'); lx = lo.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  try { best = +localStorage.getItem('pgBest') || 0 } catch (e) { }
  GC.music.files({ waltz: { src: 'snd/pg-waltz.mp3' }, river: { src: 'snd/pg-river.mp3' }, bonus: { src: 'snd/pg-bonus.mp3' }, boss: { src: 'snd/pg-boss.mp3' }, wings: { src: 'snd/pg-wings.mp3' } }, 'race');   // nhạc gốc: điệu valse "Skater's Waltz" · nhạc bay khi cầm cờ chong chóng
  GC.sfxFiles({ pgstart: { src: 'snd/pg-start.mp3', vol: .6 }, pgcp: { src: 'snd/pg-checkpoint.mp3', vol: .6 }, pgover: { src: 'snd/pg-over.mp3', vol: .6 } });
  addEventListener('resize', resize); resize(); loadStage(0); bindInput(); requestAnimationFrame(loop);
  setInterval(() => { try { localStorage.setItem('pgBest', best) } catch (e) { } }, 5000);
}
function release() { keys.l = keys.r = keys.u = keys.d = 0 }
function place(x, y, old) { const li = old && old.lvl != null ? old.lvl : 0; S.lives = old && old.lf || LIVES; score = old && old.sc || 0; if (li !== S.level) loadStage(li) }
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Chặng ' + (S.level + 1) + '/' + NL + ' · 🏁 ' + Math.round(clamp(pos / (L || 1), 0, 1) * 100) + '%';
function extra() { return { lvl: S.level, wk: 'pg' + S.level, lb: label2(), lf: S.lives, sc: score } }
function hudTxt() { return (S.won ? '🏆 Phá đảo' : '🐧 Chặng ' + (S.level + 1) + '/' + NL) + ' · ⏱ ' + Math.max(0, Math.ceil(timeLeft / 60)) + 's' }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud: hudTxt, label: label2, W: 1000, kind: 'peng', NL,
  _dbg: { step, draw, loadStage, st: () => ({ pos, px, speed, L, timeLeft, timeMax, phase, hz, fall, stun, fly, score, objs }), set: o => { if (o.px != null) px = o.px; if (o.pos != null) pos = o.pos; if (o.speed != null) speed = o.speed; if (o.timeLeft != null) timeLeft = o.timeLeft; if (o.stun != null) stun = o.stun; if (o.fly != null) fly = o.fly } },
  winTitle: '🏆 Phá đảo Chim cánh cụt phiêu lưu — tới đủ 7 trạm Nam Cực!', winToast: '🏆 PHÁ ĐẢO! Chú chim cánh cụt đã chạy khắp Nam Cực, tới đủ 7 trạm!' };
})();
