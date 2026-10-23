/* climb.js — thế giới leo núi "Đừng Nhìn Xuống" (vật lý + vẽ).
   Climb.init(canvas, stage, seed, hooks)  ·  Climb.S: trạng thái (energy, running, ghosts…)
   hooks: onCP(n), onWin(), onFall(cp), onBat(n), onStomp(n), onHurt(n), onEmpty(), onAsk(), onFrame(ts) */
window.Climb = (function () {
const { clamp, rng } = GC;
const W = 720, G = 0.62, JV = -13.2, SPD = 4.3, SPRING = -19.5;
const ZONES = [
  { name: 'Thung lũng hoa', cap: '#8fe3b0', capD: '#5fc792', rock: '#d3c4f7', rockD: '#a58fe3', deco: 'flower' },
  { name: 'Rừng thông', cap: '#74d6a4', capD: '#45b081', rock: '#bccbf7', rockD: '#8a9fe6', deco: 'grass' },
  { name: 'Vách pha lê', cap: '#e9defe', capD: '#c2acf5', rock: '#b3a4ec', rockD: '#7f6dd0', deco: 'crystal' },
  { name: 'Sườn tuyết', cap: '#ffffff', capD: '#d6e6fb', rock: '#a9bdf1', rockD: '#7489d6', deco: 'snow' },
  { name: 'Đỉnh mây', cap: '#ffeaf5', capD: '#f7c4de', rock: '#9a8ade', rockD: '#6656bd', deco: 'star' }];
/* độ khó: 1 Dễ · 2 Vừa · 3 Khó (cô chọn trên trang của cô) */
const LEVELS = {
  1: { per: 9, dy: [80, 114], w: [140, 190], shrink: 12, enemy: [.3, .4, .45, .5, .55], spd: 1, crumble: 42, birdZ: 3, bird: .32, spiky: .35, ice: 0, move: .22, bat: .2, cost: { walk: .3, jump: 6, battery: 20, stomp: 10, hurt: 15 } },
  2: { per: 11, dy: [88, 118], w: [122, 168], shrink: 12, enemy: [.42, .52, .58, .62, .68], spd: 1.3, crumble: 32, birdZ: 2, bird: .38, spiky: .42, ice: .32, move: .26, bat: .14, cost: { walk: .36, jump: 7, battery: 20, stomp: 10, hurt: 22 } },
  3: { per: 13, dy: [94, 122], w: [108, 150], shrink: 11, enemy: [.52, .62, .68, .72, .78], spd: 1.6, crumble: 24, birdZ: 1, bird: .46, spiky: .5, ice: .42, move: .3, bat: .1, cost: { walk: .42, jump: 8, battery: 20, stomp: 10, hurt: 30 } }
};
let LV = LEVELS[2], COST = LV.cost;
const ICE = { cap: '#e6f7ff', capD: '#9fd8ff', rock: '#bcd8f7', rockD: '#7fa9e6', deco: 'ice' };
const S = { energy: 0, cap: 0, rescue: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, maxAlt: 0, won: false, cpAt: null, now: () => Date.now(), hooks: {} };
const pl = { x: W / 2 - 17, y: -40, w: 34, h: 40, vx: 0, vy: 0, on: null, face: 1, coy: 0, buf: 0, sq: 0, walk: 0, inv: 0, kb: 0 };
const keys = { l: 0, r: 0, j: 0, jp: 0 };
const parts = [], cam = { x: 0, y: -500 };
let P = [], BAT = [], E = [], CPS = [], TREES = [], TOPY = -1, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, vh = 0, emptyT = 0;

/* ═════ dựng núi (cùng seed → cả lớp cùng một ngọn núi) ═════ */
/* khoảng ngang tối đa (mép tới mép) nhảy tới được khi bậc sau cao hơn dy — chừa 20% an toàn */
function reach(dy, v) { const d = v * v - 2 * G * dy; return d <= 0 ? 0 : SPD * (v + Math.sqrt(d)) / G * .8 }
function build(seed, level) {
  LV = LEVELS[level] || LEVELS[2]; COST = LV.cost;
  const PER = LV.per, r0 = rng(seed || 7), R = (a, b) => a + r0() * (b - a), N = PER * ZONES.length;
  P = [{ x: 0, y: 0, w: W, h: 70, type: 'ground', z: 0, deco: [] }]; BAT = []; E = [];
  let y = 0, cx = W / 2, pw = W, prevSpring = false;
  for (let i = 1; i <= N; i++) {
    const z = Math.min(ZONES.length - 1, Math.floor((i - 1) / PER)), cp = i % PER === 0, top = i === N;
    let w = top ? 270 : cp ? 210 : Math.max(66, R(LV.w[0] - z * LV.shrink, LV.w[1] - z * LV.shrink * 1.2)), type = 'plain';
    if (!cp && !top) {
      const r = r0();
      if (z >= 1 && r < LV.move) type = 'move';
      else if (z >= 2 && !prevSpring && r < LV.move + .12) { type = 'spring'; w = 100 }
      else if (z >= 2 && r < LV.move + .3) type = 'crumble';
      else if (z >= 3 && r0() < LV.ice) type = 'ice';
    }
    const dy = prevSpring ? R(175, 225) : R(LV.dy[0], LV.dy[1]); y -= dy;
    const side = r0() < .5 ? -1 : 1; let nx = cx + side * R(110, 240);
    if (nx < w / 2 + 16 || nx > W - w / 2 - 16) nx = cx - side * R(110, 240);
    nx = clamp(nx, w / 2 + 16, W - w / 2 - 16);
    const far = reach(dy, prevSpring ? -SPRING : -JV), gap = Math.abs(nx - cx) - (w + pw) / 2;   // luôn nhảy tới được
    if (gap > far) nx = clamp(cx + Math.sign(nx - cx) * (far + (w + pw) / 2 - 4), w / 2 + 16, W - w / 2 - 16);
    const p = { x: nx - w / 2, y, w, h: 30, type, z, cp: cp ? Math.floor(i / PER) : 0, top, dx: 0, sq: 0, st: 0, t: 0, fy: 0, fv: 0, deco: [] };
    if (type === 'move') { p.amp = R(45, 85); p.sp = R(.014, .024); p.ph = R(0, 6.28); p.bx = clamp(p.x, p.amp + 4, W - w - p.amp - 4) }
    for (let k = 0; k < 7; k++)p.deco.push(r0());
    // kẻ địch: nấm (giẫm được) · nhím gai (phải nhảy qua) — không đặt trên trạm, lò xo, bậc trôi, bậc sụp
    if ((type === 'plain' || type === 'ice') && !cp && !top && i > 2 && w >= 96 && r0() < LV.enemy[z]) {
      const spiky = z >= 2 && r0() < LV.spiky, ew = spiky ? 36 : 34;
      E.push({ k: spiky ? 'spiky' : 'shroom', p, x: p.x + R(8, w - ew - 8), w: ew, h: spiky ? 26 : 30, vx: (r0() < .5 ? -1 : 1) * R(.7, 1.1 + z * .18) * LV.spd, dead: 0, rev: 0 });
    } else if (!cp && !top && type !== 'spring' && r0() < LV.bat) BAT.push({ x: nx - 12, y: y - 46, got: false });
    // chim bay ở vùng cao, lượn giữa hai bậc
    if (z >= LV.birdZ && !cp && i < N - 1 && r0() < LV.bird) E.push({ k: 'bird', bx: R(120, W - 160), by: y - R(55, 75), amp: R(90, 160), sp: R(.012, .02) * LV.spd, ph: R(0, 6.28), x: 0, y: 0, w: 38, h: 26, dead: 0, rev: 0, f: 1 });
    P.push(p); cx = nx; pw = w; prevSpring = type === 'spring';
  }
  TOPY = P[P.length - 1].y; CPS = P.filter(p => p.cp || p.type === 'ground'); S.cpAt = CPS[0];
  TREES = Array.from({ length: 26 }, (_, i) => ({ x: i / 25 + R(-.02, .02), h: R(.5, 1), l: i % 2 }));
}
const alt = () => Math.max(0, Math.round(-(pl.y + pl.h) / 8));
const topAlt = () => Math.round(-TOPY / 8);
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };
const solid = p => p.type !== 'crumble' || p.st < 2;

/* ═════ vật lý ═════ */
function stepWorld() {
  for (const p of P) {
    if (p.type === 'move') { const nx = p.bx + Math.sin(S.tick * p.sp + p.ph) * p.amp; p.dx = nx - p.x; p.x = nx }
    if (p.sq > 0) p.sq--;
    if (p.type === 'crumble') {
      if (p.st === 1 && --p.t <= 0) { p.st = 2; p.fv = 0; GC.sfx('crack'); puff(p.x + p.w / 2, p.y + 10, 12, [ZONES[p.z].rock, ZONES[p.z].rockD], 4) }
      else if (p.st === 2) { p.fv += .5; p.fy += p.fv; if (p.fy > 700) { p.st = 3; p.t = 200 } }
      else if (p.st === 3 && --p.t <= 0) { p.st = 0; p.fy = 0 }
    }
  }
  for (const e of E) {
    if (e.dead) { if (e.dead > 1) e.dead--; if (e.rev && --e.rev <= 0) { e.dead = 0 } continue }
    if (e.k === 'bird') { const a = S.tick * e.sp + e.ph, nx = e.bx + Math.sin(a) * e.amp; e.f = nx > e.x ? 1 : -1; e.x = nx; e.y = e.by + Math.sin(a * 3) * 10 }
    else { e.x += e.vx; if (e.x < e.p.x + 6 || e.x > e.p.x + e.p.w - e.w - 6) { e.vx = -e.vx; e.x = clamp(e.x, e.p.x + 6, e.p.x + e.p.w - e.w - 6) } e.y = e.p.y - e.h }
  }
}
function step() {
  S.tick++; stepWorld();
  const can = S.energy > 0 && !frozen(), dir = can && !pl.kb ? (keys.r - keys.l) : 0;
  if (pl.kb) { pl.kb--; pl.vx *= .96 } else pl.vx += (dir * SPD - pl.vx) * (pl.on ? (pl.on.type === 'ice' ? .045 : .35) : .16);   // băng: trơn trượt
  if (pl.inv) pl.inv--;
  if (dir) { pl.face = dir; use(COST.walk) }
  if (pl.on && Math.abs(pl.vx) > .5) pl.walk += .35;
  if (keys.jp) { pl.buf = 7; keys.jp = 0 }
  if (pl.on) pl.coy = 7; else if (pl.coy > 0) pl.coy--;
  if (pl.buf > 0) { pl.buf--; if (pl.coy > 0 && can) { pl.vy = JV; pl.coy = 0; pl.buf = 0; use(COST.jump); GC.sfx('jump'); puff(pl.x + 17, pl.y + 40, 6, ['#fff', '#e9e0ff']) } }
  if (!keys.j && pl.vy < -6 && pl.vy > JV - 1) pl.vy *= .88;      // thả nút sớm = nhảy thấp, đỡ tốn
  pl.vy = Math.min(pl.vy + G, 17);
  if (pl.on && pl.on.type === 'move') pl.x += pl.on.dx;
  pl.x = clamp(pl.x + pl.vx, 0, W - pl.w);
  const pb = pl.y + pl.h; pl.y += pl.vy; const nb = pl.y + pl.h; pl.on = null;
  if (pl.vy >= 0) for (const p of P) {
    if (solid(p) && pl.x + pl.w > p.x + 5 && pl.x < p.x + p.w - 5 && pb <= p.y + .5 && nb >= p.y) {
      pl.y = p.y - pl.h; if (pl.vy > 7) { pl.sq = .5; puff(pl.x + 17, p.y, 5, ['#fff', '#e9e0ff']) }
      if (p.type === 'spring') { pl.vy = SPRING; p.sq = 10; pl.sq = .6; GC.sfx('spring'); break }
      if (p.type === 'crumble' && p.st === 0) { p.st = 1; p.t = LV.crumble }
      pl.vy = 0; pl.on = p;
      if (p.cp && p.y < S.cpAt.y) { S.cpAt = p; GC.sfx('cp'); puff(p.x + p.w - 30, p.y - 50, 26, ['#ff7eb6', '#5ab0ff', '#3fbf86', '#9b7bff', '#ffe08a'], 6); S.hooks.onCP && S.hooks.onCP(p.cp) }
      if (p.top && !S.won) { S.won = true; S.hooks.onWin && S.hooks.onWin() }
      break;
    }
  }
  pl.sq *= .85;
  // kẻ địch: rơi từ trên xuống trúng đầu = giẫm bẹp; chạm ngang (hoặc giẫm nhím gai) = bị hất văng
  for (const e of E) {
    if (e.dead || Math.abs(e.y - pl.y) > 90) continue;
    if (pl.x + pl.w - 4 > e.x && pl.x + 4 < e.x + e.w && pl.y + pl.h > e.y + 2 && pl.y < e.y + e.h) {
      if (e.k !== 'spiky' && pl.vy > 0 && pb <= e.y + 12) {
        e.dead = 40; e.rev = 1500; pl.vy = -10.5; pl.y = e.y - pl.h; S.energy += COST.stomp; S.stomps++;
        GC.sfx('stomp'); puff(e.x + e.w / 2, e.y + e.h / 2, 16, ['#fff', '#ffe08a', '#ff9cc8'], 5); S.hooks.onStomp && S.hooks.onStomp(COST.stomp);
      } else if (!pl.inv) {
        pl.inv = 75; pl.kb = 16; S.hits++; use(COST.hurt); pl.vx = (pl.x + 17 < e.x + e.w / 2 ? -1 : 1) * 7.5; pl.vy = -7.5; pl.on = null;
        GC.sfx('hurt'); puff(pl.x + 17, pl.y + 20, 10, ['#ff6b81', '#fff'], 4); S.hooks.onHurt && S.hooks.onHurt(COST.hurt);
      }
    }
  }
  for (const b of BAT) if (!b.got && pl.x < b.x + 24 && pl.x + pl.w > b.x && pl.y < b.y + 28 && pl.y + pl.h > b.y) { b.got = true; S.energy += COST.battery; GC.sfx('bat'); puff(b.x + 12, b.y + 14, 14, ['#3fbf86', '#fff6a8'], 4); S.hooks.onBat && S.hooks.onBat(COST.battery) }
  if (pl.y > S.cpAt.y + 560) { S.falls++; GC.sfx('fall'); respawn(); S.hooks.onFall && S.hooks.onFall(S.cpAt.cp) }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;   // bình năng lượng đầy
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function respawn() { const c = S.cpAt; pl.x = c.type === 'ground' ? W / 2 - 17 : c.x + c.w / 2 - 17; pl.y = c.y - pl.h - 2; pl.vx = pl.vy = 0; pl.kb = 0; pl.inv = 60 }
function puff(x, y, n, cols, sp) { for (let i = 0; i < n; i++)parts.push({ x, y, vx: (Math.random() - .5) * (sp || 3), vy: -Math.random() * (sp || 3), r: Math.random() * 3 + 2, l: 30 + Math.random() * 20, L: 50, c: GC.pick(cols) }) }

/* ═════ vẽ ═════ */
function hex(c) { c = parseInt(c.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255] }
function mix(a, b, t) { a = hex(a); b = hex(b); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('') }
function grad(st, t) { t = clamp(t, 0, 1) * (st.length - 1); const i = Math.min(st.length - 2, Math.floor(t)); return mix(st[i], st[i + 1], t - i) }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
function star(x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) } ctx.fill() }
function cloud(x, y, r, a) { ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r * .9, y + r * .2, r * .75, 0, 7); ctx.arc(x - r * .9, y + r * .25, r * .7, 0, 7); ctx.arc(x + r * .2, y - r * .45, r * .7, 0, 7); ctx.fill(); ctx.globalAlpha = 1 }
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#5b4bb0'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
const STARS = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, t: Math.random() * 6 }));
const CLOUDS = Array.from({ length: 14 }, (_, i) => ({ x: Math.random() * 1400 - 300, y: i * 110, s: Math.random() * .6 + .6, v: Math.random() * .25 + .08 }));
const MT = [0, 1, 2].map(L => { const n = 10 + L * 3; return Array.from({ length: n }, (_, i) => ({ x: i / (n - 1), h: .3 + Math.random() * .38 - L * .1 })) });
const FLOCK = Array.from({ length: 5 }, () => ({ x: Math.random(), y: Math.random() * .4 + .1, v: Math.random() * .0006 + .0004, p: Math.random() * 6 }));

function drawBg() {
  const t = clamp(-cam.y / (-TOPY), 0, 1), g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, grad(['#a9dcff', '#bcd0ff', '#a594f0', '#4f40a8', '#1d1650'], t));
  g.addColorStop(.6, grad(['#d7ecff', '#e2dcff', '#cbb8ff', '#8a72dc', '#3c2f86'], t));
  g.addColorStop(1, grad(['#ffe4f2', '#ffe0f0', '#f1cdf2', '#c49ae6', '#7a5cbf'], t));
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  const sa = clamp((t - .35) * 1.7, 0, 1);
  if (sa > 0) {
    for (const s of STARS) { ctx.globalAlpha = sa * (.5 + .5 * Math.sin(S.tick * .04 + s.t)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x * cw, s.y * ch * .8, s.r, 0, 7); ctx.fill() }
    ctx.globalAlpha = sa * .25; for (let i = 0; i < 3; i++) {   // cực quang
      const ag = ctx.createLinearGradient(0, ch * .05, 0, ch * .4); ag.addColorStop(0, '#7fffd400'); ag.addColorStop(.5, ['#7fffd4', '#ff9cf0', '#9cc8ff'][i]); ag.addColorStop(1, '#7fffd400');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(0, ch * .1); for (let x = 0; x <= cw; x += 30) ctx.lineTo(x, ch * (.12 + i * .06) + Math.sin(x * .006 + S.tick * .01 + i) * 30); ctx.lineTo(cw, ch * .45); ctx.lineTo(0, ch * .45); ctx.fill();
    } ctx.globalAlpha = 1;
  }
  // mặt trời (thấp) → mặt trăng (cao)
  const sx = cw * .78, sy = ch * (.2 + t * .05), sun = t < .5;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120); glow.addColorStop(0, sun ? '#fff6d0cc' : '#ffffffaa'); glow.addColorStop(1, '#ffffff00');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, 120, 0, 7); ctx.fill();
  ctx.fillStyle = sun ? '#fff1b8' : '#f4f1ff'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, 7); ctx.fill();
  if (!sun) { ctx.fillStyle = '#ddd6fb'; [[-10, -6, 7], [9, 8, 5], [12, -12, 3.5], [-6, 14, 4]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(sx + dx, sy + dy, r, 0, 7); ctx.fill() }) }
  // ba lớp núi xa, trôi chậm dần (parallax)
  MT.forEach((m, L) => {
    const base = ch * (.55 + L * .12) + (-cam.y) * (.03 + L * .025) * sc;
    const c1 = mix(['#e2d8fd', '#cbbcf7', '#b3a0ef'][L], ['#5d4dae', '#4a3c98', '#3a2e80'][L], t);
    const mg = ctx.createLinearGradient(0, base - ch * .35, 0, base + ch * .3); mg.addColorStop(0, c1); mg.addColorStop(1, mix(c1, '#ffffff', .25));
    ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(0, ch); m.forEach((p, i) => { const px = p.x * cw, py = base - p.h * ch * .5; if (i) ctx.lineTo(px - cw / m.length * .3, py + 18); ctx.lineTo(px, py) }); ctx.lineTo(cw, ch); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = [.55, .45, .3][L];
    m.forEach(p => { if (p.h < .38 - L * .1) return; const px = p.x * cw, py = base - p.h * ch * .5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 16, py + 18); ctx.lineTo(px - 6, py + 14); ctx.lineTo(px, py + 20); ctx.lineTo(px + 7, py + 13); ctx.lineTo(px + 16, py + 18); ctx.fill() });
    ctx.globalAlpha = 1;
  });
  // rừng thông gần (chỉ thấy ở chân núi)
  const tb = ch * .95 + (-cam.y) * .12 * sc;
  if (tb - ch * .3 < ch) TREES.forEach(tr => { const x = tr.x * cw, h = tr.h * ch * .18, y = tb - tr.l * 14; ctx.fillStyle = tr.l ? '#9fd9c0' : '#86cdb0'; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * .32, y); ctx.lineTo(x + h * .32, y); ctx.fill(); ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * .1, y - h * .7); ctx.lineTo(x + h * .1, y - h * .7); ctx.fill() });
  // đàn chim xa
  ctx.strokeStyle = t < .6 ? '#7d6bb8aa' : '#ffffff88'; ctx.lineWidth = 2;
  FLOCK.forEach(b => { b.x = (b.x + b.v) % 1.1; const x = b.x * cw, y = b.y * ch, wv = Math.sin(S.tick * .15 + b.p) * 4; ctx.beginPath(); ctx.moveTo(x - 8, y - wv); ctx.quadraticCurveTo(x - 4, y - 4, x, y); ctx.quadraticCurveTo(x + 4, y - 4, x + 8, y - wv); ctx.stroke() });
  for (const c of CLOUDS) { c.x += c.v; if (c.x > 1500) c.x = -300; const y = ((c.y - cam.y * .3) % 1540 + 1540) % 1540 - 200; cloud(c.x / 1400 * cw * 1.2 - cw * .1, y * sc * .7, 40 * c.s * sc + 20, t < .7 ? .7 : .45) }
}
/* đảo đá bay: mặt cỏ gợn sóng + thân đá nhọn dần xuống dưới */
function island(p, oy, a) {
  const Z = p.type === 'ice' ? ICE : ZONES[p.z], x = p.x, y = p.y + oy, w = p.w, d = p.deco, depth = 26 + d[0] * 22;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#2d235018'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + depth + 22, w * .32, 6, 0, 0, 7); ctx.fill();
  const rg = ctx.createLinearGradient(0, y, 0, y + depth + 14); rg.addColorStop(0, Z.rock); rg.addColorStop(1, Z.rockD);
  ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x, y + 4);
  const n = 5; for (let i = 0; i <= n; i++) { const fx = x + w * (i / n), dip = Math.sin(Math.PI * i / n); ctx.lineTo(fx, y + 10 + dip * depth + (i % 2 ? d[i] * 8 : 0)) }
  ctx.lineTo(x + w, y + 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * .2, y + 16); ctx.lineTo(x + w * .45, y + 16 + depth * .3); ctx.moveTo(x + w * .62, y + 14); ctx.lineTo(x + w * .78, y + 14 + depth * .25); ctx.stroke();
  ctx.fillStyle = Z.capD; rr(x - 4, y - 2, w + 8, 14, 7); ctx.fill();
  ctx.fillStyle = Z.cap; rr(x - 4, y - 4, w + 8, 11, 6); ctx.fill();
  for (let bx = x + 6; bx < x + w; bx += 16) { ctx.beginPath(); ctx.arc(bx, y + 8, 6, 0, Math.PI); ctx.fillStyle = Z.capD; ctx.fill() }
  ctx.fillStyle = '#ffffff70'; rr(x + 4, y - 3, w * .4, 3, 2); ctx.fill();
  [d[1], d[3], d[5]].forEach((dv, i) => {
    const px = x + 10 + dv * (w - 20), py = y - 4;
    if (Z.deco === 'flower') { ctx.fillStyle = '#4fae80'; ctx.fillRect(px - 1, py - 9, 2, 9); ctx.fillStyle = ['#ff9cc8', '#9cd2ff', '#d8c8ff'][i]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(px + Math.cos(k * 1.26) * 3.5, py - 11 + Math.sin(k * 1.26) * 3.5, 2.6, 0, 7); ctx.fill() } ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(px, py - 11, 2, 0, 7); ctx.fill() }
    else if (Z.deco === 'grass') { ctx.fillStyle = '#3fa77a'; ctx.beginPath(); ctx.moveTo(px - 7, py + 2); ctx.lineTo(px - 2, py - 12); ctx.lineTo(px, py - 3); ctx.lineTo(px + 3, py - 15); ctx.lineTo(px + 7, py + 2); ctx.fill() }
    else if (Z.deco === 'crystal') { const cc = ['#c7a8ff', '#a8d4ff', '#ffb8dc'][i]; ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(px, py - 16); ctx.lineTo(px + 6, py - 6); ctx.lineTo(px, py + 1); ctx.lineTo(px - 6, py - 6); ctx.fill(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.moveTo(px, py - 16); ctx.lineTo(px + 2, py - 6); ctx.lineTo(px, py); ctx.fill() }
    else if (Z.deco === 'ice') { ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.moveTo(px - 9, py + 3); ctx.lineTo(px - 3, py + 3); ctx.lineTo(px + 3, py - 1); ctx.lineTo(px - 3, py - 1); ctx.fill(); ctx.fillStyle = '#e6f7ff'; ctx.beginPath(); ctx.moveTo(px - 4, y + 9); ctx.lineTo(px + 4, y + 9); ctx.lineTo(px, y + 24); ctx.fill() }
    else if (Z.deco === 'snow') { ctx.fillStyle = '#f2f8ff'; ctx.beginPath(); ctx.moveTo(px - 5, y + 9); ctx.lineTo(px + 5, y + 9); ctx.lineTo(px, y + 22); ctx.fill() }
    else { ctx.fillStyle = '#fff3a8'; star(px, py - 10 + Math.sin(S.tick * .05 + i) * 2, 5) }
  });
  ctx.globalAlpha = 1;
}
function drawPlat(p) {
  if (p.type === 'ground') {
    ctx.fillStyle = '#c3b3f2'; ctx.fillRect(-400, p.y + 10, W + 800, p.h);
    ctx.fillStyle = '#5fc792'; rr(-400, p.y - 2, W + 800, 20, 9); ctx.fill(); ctx.fillStyle = '#8fe3b0'; rr(-400, p.y - 4, W + 800, 14, 7); ctx.fill();
    for (let x = -380; x < W + 400; x += 46) { ctx.fillStyle = ['#ff9cc8', '#ffd6ea', '#bfe0ff', '#d8c8ff'][(x / 46 | 0) & 3]; ctx.beginPath(); ctx.arc(x, p.y - 7, 5, 0, 7); ctx.fill() }
    for (let i = 0; i < 9; i++)cloud(-300 + i * 170, p.y + p.h + 20, 60, .95);
    ctx.fillStyle = '#fff'; ctx.fillRect(-400, p.y + p.h + 30, W + 800, 1400); return;
  }
  if (p.type === 'crumble') {
    if (p.st === 3) return;
    const shake = p.st === 1 ? Math.sin(S.tick * 1.7) * 2.5 : 0;
    ctx.save(); ctx.translate(shake, 0); island(p, p.fy, p.st === 2 ? Math.max(0, 1 - p.fy / 500) : 1);
    ctx.strokeStyle = '#5b4bb0aa'; ctx.lineWidth = 2; ctx.beginPath(); const cx = p.x + p.w * .35, cy = p.y + p.fy;
    ctx.moveTo(cx, cy + 6); ctx.lineTo(cx + 8, cy + 16); ctx.lineTo(cx + 2, cy + 24); ctx.moveTo(cx + p.w * .35, cy + 6); ctx.lineTo(cx + p.w * .3, cy + 18); ctx.stroke(); ctx.restore(); return;
  }
  if (p.top) { castle(p); return }
  island(p, 0, 1);
  if (p.type === 'move') { ctx.fillStyle = '#ffffffcc'; for (let k = 0; k < 2; k++) { const ax = p.x + p.w / 2 + (k ? 18 : -18); ctx.beginPath(); ctx.moveTo(ax + (k ? 6 : -6), p.y + 17); ctx.lineTo(ax, p.y + 12); ctx.lineTo(ax, p.y + 22); ctx.fill() } }
  if (p.type === 'spring') {
    const cx = p.x + p.w / 2, b = p.sq > 0 ? 6 : 0;
    ctx.fillStyle = '#fff4e8'; rr(cx - 10, p.y - 19 + b, 20, 19 - b, 6); ctx.fill();
    ctx.fillStyle = '#ff7eb6'; ctx.beginPath(); ctx.ellipse(cx, p.y - 19 + b, 32, 16 - b / 2, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(cx - 10, p.y - 27 + b, 10, 4, -.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; [[-16, -24], [3, -30], [17, -22]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(cx + dx, p.y + dy + b, 3.8, 0, 7); ctx.fill() });
  }
  if (p.cp) {
    const on = S.cpAt === p || S.cpAt.y < p.y, fx = p.x + p.w - 34, fy = p.y - 3, wv = Math.sin(S.tick * .12) * 4;
    ctx.fillStyle = '#7d6bb8'; ctx.fillRect(fx, fy - 64, 4, 64); ctx.beginPath(); ctx.arc(fx + 2, fy - 66, 4, 0, 7); ctx.fillStyle = '#ffe08a'; ctx.fill();
    ctx.fillStyle = on ? '#3fbf86' : '#c9b8ff'; ctx.beginPath(); ctx.moveTo(fx + 4, fy - 64); ctx.quadraticCurveTo(fx + 24, fy - 58 + wv, fx + 44, fy - 52); ctx.quadraticCurveTo(fx + 24, fy - 46 - wv, fx + 4, fy - 40); ctx.fill();
    label('🚩 Trạm ' + p.cp + ' · ' + ZONES[Math.min(p.cp, ZONES.length - 1)].name, p.x + p.w / 2 - 20, p.y + 62, 15);
  }
}
/* ═════ đỉnh núi: lâu đài + công chúa bị nhốt trong lồng ═════ */
function castle(p) {
  const x = p.x, y = p.y, w = p.w, t = S.tick;
  const glow = ctx.createRadialGradient(x + w / 2, y - 50, 0, x + w / 2, y - 50, 160); glow.addColorStop(0, S.won ? '#ffe3f3cc' : '#fff6c088'); glow.addColorStop(1, '#ffffff00');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x + w / 2, y - 50, 160, 0, 7); ctx.fill();
  const bg = ctx.createLinearGradient(x, 0, x + w, 0); bg.addColorStop(0, '#cbbcf5'); bg.addColorStop(1, '#9a88dc');
  ctx.fillStyle = bg; ctx.fillRect(x + 14, y + 6, w - 28, 300);                                   // thân tháp
  ctx.strokeStyle = '#ffffff45'; ctx.lineWidth = 2;
  for (let r = 0; r < 13; r++) { const yy = y + 28 + r * 22; ctx.beginPath(); ctx.moveTo(x + 14, yy); ctx.lineTo(x + w - 14, yy); ctx.stroke(); for (let c = (r % 2) * 22; c < w - 28; c += 44) { ctx.beginPath(); ctx.moveTo(x + 14 + c, yy - 22); ctx.lineTo(x + 14 + c, yy); ctx.stroke() } }
  [[.3, 70], [.7, 70], [.5, 170]].forEach(([fx, fy]) => { const wx = x + w * fx; ctx.fillStyle = '#5b4bb0'; ctx.beginPath(); ctx.moveTo(wx - 12, y + fy + 34); ctx.lineTo(wx - 12, y + fy + 12); ctx.arc(wx, y + fy + 12, 12, Math.PI, 0); ctx.lineTo(wx + 12, y + fy + 34); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.globalAlpha = .55 + .25 * Math.sin(t * .05 + fx * 9); ctx.fillRect(wx - 8, y + fy + 12, 16, 20); ctx.globalAlpha = 1 });
  ctx.fillStyle = '#e9defe'; rr(x - 4, y - 4, w + 8, 14, 5); ctx.fill(); ctx.fillStyle = '#c2acf5'; ctx.fillRect(x - 4, y + 8, w + 8, 4);
  for (const ex of [x - 4, x + w - 26]) { ctx.fillStyle = '#d9cbfb'; rr(ex, y - 30, 30, 28, 4); ctx.fill(); ctx.fillStyle = '#ff7eb6'; ctx.fillRect(ex + 14, y - 74, 3, 44); ctx.beginPath(); ctx.moveTo(ex + 17, y - 74); ctx.quadraticCurveTo(ex + 30, y - 68 + Math.sin(t * .12) * 3, ex + 42, y - 62); ctx.lineTo(ex + 17, y - 54); ctx.fill() }
  const cx = x + w / 2 + 10, by = y - 4, lift = Math.min(150, S.rescue * 2.2), hop = S.won ? Math.abs(Math.sin(t * .14)) * 16 : 0;
  princess(cx, by - hop, S.won);
  if (lift < 150) {   // lồng sắt: mở bay lên khi được giải cứu
    ctx.save(); ctx.globalAlpha = 1 - lift / 150; const cy = by - lift;
    ctx.strokeStyle = '#6d5fa8'; ctx.lineWidth = 3.5; for (let k = 0; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(cx - 30 + k * 10, cy); ctx.lineTo(cx - 30 + k * 10, cy - 66); ctx.stroke() }
    ctx.fillStyle = '#8a7bd0'; rr(cx - 36, cy - 74, 72, 10, 4); ctx.fill(); rr(cx - 36, cy - 4, 72, 8, 4); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 80, 7, Math.PI, 0); ctx.stroke(); ctx.restore();
  }
  const msg = S.won ? 'Cảm ơn cậu! 💖' : (Math.floor(t / 90) % 2 ? 'Cứu tớ với! 🆘' : 'Leo lên đây nào! 👋');
  ctx.font = '800 15px Nunito,sans-serif'; const mw = ctx.measureText(msg).width + 24, mx = cx - mw / 2, my = by - 128 - (S.won ? 0 : Math.sin(t * .08) * 3);
  ctx.fillStyle = '#ffffff'; rr(mx, my, mw, 30, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 6, my + 30); ctx.lineTo(cx, my + 38); ctx.lineTo(cx + 6, my + 30); ctx.fill();
  ctx.fillStyle = '#e0457a'; ctx.textAlign = 'center'; ctx.fillText(msg, cx, my + 21);
  if (S.won && t % 14 === 0) parts.push({ x: cx + (Math.random() - .5) * 60, y: by - 60, vx: (Math.random() - .5) * 1.2, vy: -2 - Math.random() * 1.5, r: 5, l: 70, L: 70, c: GC.pick(['#ff7eb6', '#ff9cc8', '#ffd1e6', '#ffe08a']), heart: 1 });
  label('👸 LÂU ĐÀI CÔNG CHÚA', x + w / 2, y + 66, 17);
}
function princess(cx, by, happy) {
  const t = S.tick, wave = Math.sin(t * .2) * .5;
  ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.ellipse(cx, by - 30, 13, 20, 0, 0, 7); ctx.fill();               // tóc dài
  ctx.fillStyle = '#ff8cc0'; ctx.beginPath(); ctx.moveTo(cx - 18, by); ctx.lineTo(cx + 18, by); ctx.lineTo(cx + 8, by - 28); ctx.lineTo(cx - 8, by - 28); ctx.fill();   // váy
  ctx.fillStyle = '#ffb3d5'; ctx.beginPath(); ctx.moveTo(cx - 12, by - 6); ctx.lineTo(cx + 12, by - 6); ctx.lineTo(cx + 9, by - 12); ctx.lineTo(cx - 9, by - 12); ctx.fill();
  ctx.strokeStyle = '#ffe0cc'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const armL = happy ? -2.4 + wave : -.5, armR = happy ? -.7 - wave : -2.3 + wave;                                 // tay vẫy
  [[-7, armL], [7, armR]].forEach(([dx, a]) => { ctx.beginPath(); ctx.moveTo(cx + dx, by - 24); ctx.lineTo(cx + dx + Math.cos(a) * 13 * Math.sign(dx), by - 24 + Math.sin(a) * 13); ctx.stroke() });
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#ffe6d6'; ctx.beginPath(); ctx.arc(cx, by - 38, 10, 0, 7); ctx.fill();                          // mặt
  ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(cx, by - 41, 10.5, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(cx - 8, by - 49); ctx.lineTo(cx - 8, by - 58); ctx.lineTo(cx - 4, by - 53); ctx.lineTo(cx, by - 60); ctx.lineTo(cx + 4, by - 53); ctx.lineTo(cx + 8, by - 58); ctx.lineTo(cx + 8, by - 49); ctx.fill();   // vương miện
  ctx.fillStyle = '#ff7eb6'; ctx.beginPath(); ctx.arc(cx, by - 55, 1.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(cx - 3.5, by - 38, 1.6, 0, 7); ctx.arc(cx + 3.5, by - 38, 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e0457a'; ctx.lineWidth = 1.6; ctx.beginPath(); if (happy) ctx.arc(cx, by - 35, 3.5, .15, Math.PI - .15); else ctx.arc(cx, by - 31.5, 2.5, Math.PI + .3, -.3); ctx.stroke();
  ctx.fillStyle = '#ff9cc888'; ctx.beginPath(); ctx.arc(cx - 6.5, by - 35, 2, 0, 7); ctx.arc(cx + 6.5, by - 35, 2, 0, 7); ctx.fill();
}
function drawBat(b) {
  if (b.got) return; const y = b.y + Math.sin(S.tick * .08 + b.x) * 4;
  ctx.fillStyle = '#fff'; ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(b.x + 12, y + 14, 19, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#3fbf86'; rr(b.x + 2, y, 20, 28, 5); ctx.fill(); ctx.fillStyle = '#2c8f78'; ctx.fillRect(b.x + 8, y - 4, 8, 5);
  ctx.fillStyle = '#fff6a8'; ctx.beginPath(); ctx.moveTo(b.x + 14, y + 4); ctx.lineTo(b.x + 7, y + 16); ctx.lineTo(b.x + 12, y + 16); ctx.lineTo(b.x + 10, y + 25); ctx.lineTo(b.x + 17, y + 12); ctx.lineTo(b.x + 12, y + 12); ctx.fill();
}
function eyes(x, y, f, angry) {
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 6, y, 4.5, 5.5, 0, 0, 7); ctx.ellipse(x + 6, y, 4.5, 5.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(x - 6 + f * 1.6, y + 1, 2.4, 0, 7); ctx.arc(x + 6 + f * 1.6, y + 1, 2.4, 0, 7); ctx.fill();
  if (angry) { ctx.strokeStyle = '#2d2350'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 11, y - 7); ctx.lineTo(x - 3, y - 4); ctx.moveTo(x + 11, y - 7); ctx.lineTo(x + 3, y - 4); ctx.stroke() }
}
function drawEnemy(e) {
  const f = e.k === 'bird' ? e.f : (e.vx > 0 ? 1 : -1), x = e.x, y = e.y, cx = x + e.w / 2;
  if (e.dead) {
    if (e.dead <= 1) return; ctx.globalAlpha = e.dead / 40;
    if (e.k === 'shroom') { ctx.fillStyle = '#ff6f91'; ctx.beginPath(); ctx.ellipse(cx, y + e.h - 5, 20, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 7, y + e.h - 7, 2.5, 0, 7); ctx.arc(cx + 6, y + e.h - 6, 2.5, 0, 7); ctx.fill() }
    else { ctx.fillStyle = '#9b7bff'; ctx.beginPath(); ctx.ellipse(cx, y + e.h / 2, 16, 6, 0, 0, 7); ctx.fill() }
    ctx.globalAlpha = 1; return;
  }
  const bob = Math.sin(S.tick * .25 + x * .1);
  if (e.k === 'shroom') {   // nấm đỏ chấm trắng, mắt cau có
    ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(cx, y + e.h, 15, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5b4bb0'; ctx.beginPath(); ctx.ellipse(cx - 7 + bob * 2, y + e.h - 2, 6, 3.5, 0, 0, 7); ctx.ellipse(cx + 7 - bob * 2, y + e.h - 2, 6, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff1e0'; rr(cx - 10, y + 12, 20, e.h - 13, 7); ctx.fill();
    ctx.fillStyle = '#ff6f91'; ctx.beginPath(); ctx.ellipse(cx, y + 14, 19, 15, 0, Math.PI, 0); ctx.lineTo(cx + 19, y + 15); ctx.lineTo(cx - 19, y + 15); ctx.fill();
    ctx.fillStyle = '#fff'; [[-9, 6, 4], [5, 3, 4.5], [13, 10, 2.8], [-15, 12, 2.5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx, y + dy, r, 0, 7); ctx.fill() });
    eyes(cx + f * 2, y + 20, f, true);
  } else if (e.k === 'spiky') {   // nhím gai tím — không giẫm được
    ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(cx, y + e.h, 17, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a5cd6'; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8, r = i % 2 ? 22 : 13; ctx.lineTo(cx + Math.cos(a) * r - f * 2, y + e.h - 4 + Math.sin(a) * r) } ctx.fill();
    ctx.fillStyle = '#b59cff'; ctx.beginPath(); ctx.ellipse(cx, y + e.h - 6, 15, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd9ea'; ctx.beginPath(); ctx.ellipse(cx + f * 9, y + e.h - 6, 8, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(cx + f * 11, y + e.h - 8, 2.2, 0, 7); ctx.arc(cx + f * 17, y + e.h - 5, 2, 0, 7); ctx.fill();
  } else {   // chim xanh vỗ cánh
    const wing = Math.sin(S.tick * .4) * 9;
    ctx.fillStyle = '#5ab0ff'; ctx.beginPath(); ctx.ellipse(cx, y + 14, 17, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9fd2ff'; ctx.beginPath(); ctx.moveTo(cx - 4, y + 10); ctx.quadraticCurveTo(cx - 18, y + 2 - wing, cx - 24, y + 6 - wing); ctx.quadraticCurveTo(cx - 14, y + 16, cx - 4, y + 16); ctx.fill();
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.moveTo(cx + f * 15, y + 12); ctx.lineTo(cx + f * 24, y + 15); ctx.lineTo(cx + f * 15, y + 18); ctx.fill();
    eyes(cx + f * 6, y + 10, f, true);
  }
}
/* nhân vật: dùng cho cả mình và các bạn (o = {x,y,f,c,walk,sq,tired,fz,sh,a}) */
function climber(o) {
  const cx = o.x + 17, by = o.y + 40, s = o.sq || 0, f = o.f || 1, line = mix(o.c, '#2d2350', .55);
  ctx.save(); ctx.globalAlpha = o.a || 1; ctx.translate(cx, by); ctx.scale(1 + s * .25, 1 - s * .25);
  ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 4, 0, 0, 7); ctx.fill();
  const st = o.walk ? Math.sin(o.walk) * 4 : 0;
  ctx.fillStyle = '#4a3c98'; ctx.beginPath(); ctx.ellipse(-8, -3 + Math.min(0, st), 7, 4.5, 0, 0, 7); ctx.ellipse(8, -3 + Math.min(0, -st), 7, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = mix(o.c, '#5b4bb0', .4); rr(-f * 19 - 6, -32, 12, 21, 5); ctx.fill();   // ba lô
  ctx.lineWidth = 2.5; ctx.strokeStyle = line; ctx.fillStyle = o.c; rr(-17, -42, 34, 38, 15); ctx.fill(); ctx.stroke();
  ctx.fillStyle = mix(o.c, '#ffffff', .45); rr(-12, -37, 12, 9, 4); ctx.fill();
  const tail = Math.sin(S.tick * .25) * 3 - (o.vx || 0) * 1.5;                        // khăn quàng
  ctx.fillStyle = mix(o.c, '#3b3b9a', .5); rr(-17, -19, 34, 7, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(-f * 12, -16); ctx.lineTo(-f * 26 + tail, -9); ctx.lineTo(-f * 22 + tail, -3); ctx.lineTo(-f * 8, -13); ctx.fill();
  ctx.fillStyle = mix(o.c, '#ffffff', .7); ctx.beginPath(); ctx.ellipse(0, -41, 15, 7, 0, Math.PI, 0); ctx.fill();   // mũ len
  ctx.fillStyle = mix(o.c, '#3b3b9a', .3); rr(-15, -44, 30, 6, 3); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f * -3, -50, 4.5, 0, 7); ctx.fill();
  const ex = f * 4;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-6 + ex, -29, 5.5, o.tired ? 3 : 6.5, 0, 0, 7); ctx.ellipse(7 + ex, -29, 5.5, o.tired ? 3 : 6.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(-5 + ex + f * 1.5, -28, 2.6, 0, 7); ctx.arc(8 + ex + f * 1.5, -28, 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4 + ex + f * 1.5, -29.5, 1, 0, 7); ctx.arc(9 + ex + f * 1.5, -29.5, 1, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff5c9a77'; ctx.beginPath(); ctx.arc(-11 + ex, -22, 3, 0, 7); ctx.arc(12 + ex, -22, 3, 0, 7); ctx.fill();
  ctx.restore();
  if (o.fz) { ctx.save(); ctx.globalAlpha = .55 * (o.a || 1); ctx.fillStyle = '#bfe8ff'; rr(o.x - 8, o.y - 14, 50, 58, 8); ctx.fill(); ctx.globalAlpha = .9 * (o.a || 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x - 2, o.y - 4); ctx.lineTo(o.x + 10, o.y - 10); ctx.moveTo(o.x + 30, o.y + 40); ctx.lineTo(o.x + 38, o.y + 30); ctx.stroke(); ctx.restore() }
  if (o.sh) { ctx.save(); ctx.globalAlpha = (.35 + .15 * Math.sin(S.tick * .15)) * (o.a || 1); ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, o.y + 16, 36, 0, 7); ctx.stroke(); ctx.restore() }
}
function drawGhosts() {
  const now = S.now();
  for (const id in S.ghosts) {
    const g = S.ghosts[id]; if (g.x == null) { g.x = g.tx; g.y = g.ty }
    const dx = g.tx - g.x; g.moving = Math.abs(dx) > .3; g.x += dx * .2; g.y += (g.ty - g.y) * .2; if (g.moving) g.walk = (g.walk || 0) + .35;
    if (Math.abs(g.y - cam.y - vh / 2) > vh) continue;
    climber({ x: g.x, y: g.y, f: g.f, c: g.c, walk: g.moving ? g.walk : 0, a: .6, fz: g.fz > now, sh: g.sh > now });
    label(g.n, g.x + 17, g.y - 22, 13, '#fff', mix(g.c, '#2d2350', .4));
  }
}
function drawMeter() {
  const x = cw - 20, y0 = ch - 30, y1 = 24, H = y0 - y1;
  ctx.fillStyle = '#ffffff66'; rr(x - 5, y1, 10, H, 5); ctx.fill();
  CPS.concat([P[P.length - 1]]).forEach(p => { const y = y0 - H * (p.y / TOPY); ctx.fillStyle = p.top ? '#ffe08a' : S.cpAt.y <= p.y ? '#3fbf86' : '#d8c8ff'; ctx.beginPath(); ctx.arc(x, y, p.top ? 7 : 5, 0, 7); ctx.fill() });
  for (const id in S.ghosts) { const g = S.ghosts[id], y = y0 - H * clamp((g.ty + 40) / TOPY, 0, 1); ctx.fillStyle = g.c; ctx.globalAlpha = .85; ctx.beginPath(); ctx.arc(x - 12, y, 4.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1 }
  const py = y0 - H * clamp((pl.y + pl.h) / TOPY, 0, 1); ctx.fillStyle = S.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, py, 8, 0, 7); ctx.fill(); ctx.stroke();
}
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawBg();
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -cam.x * sc * dpr, -cam.y * sc * dpr);
  const top = cam.y - 120, bot = cam.y + vh + 160;
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; if (p.y > top && p.y < bot + (p.top ? 320 : 0) || p.type === 'ground') drawPlat(p) }   // vẽ từ trên xuống: tháp lâu đài không che bậc bên dưới
  for (const b of BAT) if (b.y > top && b.y < bot) drawBat(b);
  for (const e of E) if (e.y > top && e.y < bot) drawEnemy(e);
  for (const q of parts) { ctx.globalAlpha = Math.max(0, q.l / q.L); ctx.fillStyle = q.c; ctx.beginPath(); if (q.heart) { ctx.moveTo(q.x, q.y + q.r); ctx.bezierCurveTo(q.x - q.r * 2, q.y - q.r * .6, q.x - q.r * .7, q.y - q.r * 2, q.x, q.y - q.r * .7); ctx.bezierCurveTo(q.x + q.r * .7, q.y - q.r * 2, q.x + q.r * 2, q.y - q.r * .6, q.x, q.y + q.r) } else ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill() } ctx.globalAlpha = 1;
  drawGhosts();
  const now = S.now();
  climber({ x: pl.x, y: pl.y, f: pl.face, c: S.color, vx: pl.vx, sq: pl.sq, walk: pl.on && Math.abs(pl.vx) > .5 ? pl.walk : 0, tired: S.energy <= 0, fz: now < S.fz, sh: now < S.sh, a: pl.inv && (S.tick >> 2) & 1 ? .4 : 1 });
  if (S.name) label(S.name, pl.x + 17, pl.y - 22, 14, '#fff', '#5b4bb0');
  if (S.energy <= 0 && S.running && !S.over) {
    const cx = pl.x + 17, y = pl.y - 52 + Math.sin(S.tick * .1) * 3;
    ctx.fillStyle = '#fff'; rr(cx - 26, y - 22, 52, 26, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 5, y + 4); ctx.lineTo(cx, y + 11); ctx.lineTo(cx + 5, y + 4); ctx.fill();
    ctx.font = '800 15px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5c7a'; ctx.fillText('⚡ 0!', cx, y - 4);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawMeter();
}
function camera(k) {
  const ty = Math.min(pl.y - vh * .58, 160 - vh); cam.y += (ty - cam.y) * k;
  if (vw >= W) cam.x = (W - vw) / 2; else cam.x += (clamp(pl.x + pl.w / 2 - vw / 2, -30, W - vw + 30) - cam.x) * k;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / 700, cw / 480); vw = cw / sc; vh = ch / sc }
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } }
  else { acc = 0; S.tick++; stepWorld() }
  if (S.won) S.rescue++;
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += q.heart ? -.01 : .12; if (--q.l <= 0) parts.splice(i, 1) }
  camera(S.running ? .12 : .05); draw();
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: bàn phím + nút cảm ứng (#bL #bR #bJ) ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = 0 });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  build(seed, level); respawn(); pl.inv = 0; pl.y = -pl.h; cam.y = pl.y - 500;
  addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.j = 0 }
/* vào lại phòng sau khi lỡ tải lại trang: đặt về chỗ cũ, trạm = trạm cao nhất nằm dưới chân */
function place(x, y) { pl.x = clamp(x, 0, W - pl.w); pl.y = y; pl.vx = pl.vy = 0; S.cpAt = CPS.filter(c => c.y >= y + pl.h - 1).sort((a, b) => a.y - b.y)[0] || CPS[0]; cam.y = pl.y - vh * .58 }
function measure(seed, level) { build(seed, level); return topAlt() }   // trang của cô: biết độ cao đỉnh để vẽ thanh tiến độ
return { init, S, pl, keys, alt, topAlt, release, place, measure, W, resize };
})();
