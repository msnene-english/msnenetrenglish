/* tank.js — game "Xe Tăng 1990" (phong cách Battle City, cùng bảng màu với trang "Tank 1990 Reading"):
   lái xe tăng bảo vệ căn cứ đại bàng, hạ các đợt xe tăng địch qua 4 STAGE, stage cuối có trùm "Siêu Tăng".
   Cùng giao diện với Climb/Brick: init(canvas, stage, seed, hooks, level) · S · pl · alt() · topAlt() · release() · place() · measure()
   + extra() · hud() · label() · kind = 'tank' */
window.Tank = (function () {
const { clamp, rng } = GC;
const U = 12, N = 26, F = U * N, NS = 4;   // 1 ô = 12px · sân 26×26 ô · 4 stage
const C = { bg: '#141C30', dot: '#202B48', brick: '#F7A8C0', brickD: '#B05A7B', brickL: '#FFDCE8', steel: '#CBD7EE', steelD: '#7484AA', steelL: '#FFFFFF', water: '#4FA8F0', waterL: '#C6EAFF', forest: '#4FC58C', forestD: '#1F6E49', forestL: '#B5F2D3', ice: '#DDEBFF' };
const TK = {
  y: { T: '#5E5638', t: '#BDAF78', b: '#7A6420', h: '#FFF3B0', d: '#E6CB66', c: '#FFE68F', L: '#FFFFFF', B: '#FFF8D6' },
  g: { T: '#22473A', t: '#7FB39B', b: '#1A6146', h: '#B5F5D6', d: '#4CC48D', c: '#86E8B9', L: '#FFFFFF', B: '#E2FFF2' },
  l: { T: '#3A2F66', t: '#9C8FD0', b: '#4B3699', h: '#E2D8FF', d: '#9B7BFF', c: '#C3B0FF', L: '#FFFFFF', B: '#F1EBFF' },
  s: { T: '#22405E', t: '#86B3D9', b: '#1D5E99', h: '#CDEBFF', d: '#5DB2F5', c: '#9FD4FF', L: '#FFFFFF', B: '#E8F6FF' },
  p: { T: '#5E2742', t: '#D98FB0', b: '#9A2F5C', h: '#FFD6E6', d: '#FF7FB0', c: '#FFB0CF', L: '#FFFFFF', B: '#FFEAF2' } };
const TANK = ['TT___BB___TT', 'TT___BB___TT', 'TTbbbBBbbbTT', 'TTbhhBBhhbTT', 'TTbhcBBcdbTT', 'TTbhcLLcdbTT', 'TTbhccccdbTT', 'TTbhhccddbTT', 'TTbhhhdddbTT', 'TTbddddddbTT', 'TTbbbbbbbbTT', 'TT________TT'];
const EAGLE = ['_____ll_____', 'l___lwwl___l', 'll__wkkw__ll', 'lwl_lwwl_lwl', 'lwwlwyywlwwl', 'lwwwwwwwwwwl', '_lwwwwwwwwl_', '__lwwwwwwl__', '___lwppwl___', '____pppp____', '___pp__pp___', '__pp____pp__'];
const EAGLE_X = ['____k__k____', '_k__kkkk_k__', '__kkkwkkk___', '_kkwkkkkwk__', 'kkkkkkkkkkk_', '_kkwkkkwkk__', '__kkkkkkk___', '_k_kkkkk_k__', '___kk_kk____', '__k_____k___', '____________', '____________'];
const PE = { l: '#7E62E8', w: '#EEE8FF', k: '#1F2A44', y: '#FFE89A', p: '#FF8FB8' };
const STAR = ['____o____', '___oyo___', 'oooyyyooo', 'oyyyyyyyo', '_oyyyyyo_', '__oyyyo__', '_oyyoyyo_', '_oyo_oyo_', '_oo___oo_'];
const MINI = ['T_BB_T', 'TbBBbT', 'TbccbT', 'TbccbT', 'TbbbbT', 'T____T'];
const ITEMS = {   // vật phẩm 12×12
  star: STAR,
  helmet: ['____kkkk____', '__kkwwwwkk__', '_kwwwwwwwwk_', '_kwwkwwwwwk_', 'kwwkwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', 'k_k______k_k'],
  shovel: ['_______kkk__', '______kwwwk_', '_____kwwwk__', '____kwwk____', '___kbk______', '__kbk_______', '_kbbk_______', 'kbbbk_______', 'kbbk________', '_kk_________'],
  bomb: ['_____kk_____', '____kyyk____', '___kkkkkk___', '__kwwwwwwk__', '_kwwkkkkwwk_', '_kwkwwwwkwk_', '_kwkwwwwkwk_', '_kwwkkkkwwk_', '__kwwwwwwk__', '___kkkkkk___'],
  clock: ['___kkkkkk___', '__kwwwwwwk__', '_kwwwkwwwwk_', 'kwwwwkwwwwwk', 'kwwwwkkkwwwk', 'kwwwwwwwwwwk', '_kwwwwwwwwk_', '__kwwwwwwk__', '___kkkkkk___'],
  bolt: ['______kkk___', '_____kyyk___', '____kyyk____', '___kyyyykk__', '__kyyyyyyk__', '__kkkyyyk___', '____kyyk____', '___kyyk_____', '___kyk______', '___kk_______'] };
const PIT = { o: '#FF7FB0', y: '#FFF1A0', k: '#1F2A44', w: '#FFFFFF', b: '#C98A3E' };
const STAGES = [
  { name: 'Thành phố gạch hồng', ic: '🏙', p: { e: .36, b: .46, s: .05, w: .05, f: .08 } },
  { name: 'Sông xanh rừng thẳm', ic: '🌊', p: { e: .32, b: .30, s: .05, w: .17, f: .16 } },
  { name: 'Pháo đài thép', ic: '🏰', p: { e: .32, b: .32, s: .24, w: .04, f: .08 } },
  { name: 'Trận chiến Siêu Tăng', ic: '💥', p: { e: .36, b: .38, s: .12, w: .06, f: .08 } }];
const LVS = {
  1: { need: 8, field: 3, mix: [.6, .25, .1, .05], fire: 1.0, boss: 10, bonusEvery: 3, cost: { walk: .12, jump: 0, shot: 1, battery: 20, stomp: 8, hurt: 15 } },
  2: { need: 12, field: 4, mix: [.45, .3, .15, .1], fire: .8, boss: 14, bonusEvery: 3, cost: { walk: .16, jump: 0, shot: 2, battery: 20, stomp: 8, hurt: 22 } },
  3: { need: 16, field: 5, mix: [.3, .3, .2, .2], fire: .62, boss: 18, bonusEvery: 4, cost: { walk: .2, jump: 0, shot: 2, battery: 20, stomp: 8, hurt: 30 } } };
const ETYPE = [   // thường · nhanh · đạn mạnh · bọc giáp
  { k: 's', sp: .6, bs: 2.4, hp: 1, name: 'thường' }, { k: 'g', sp: 1.25, bs: 2.6, hp: 1, name: 'nhanh' },
  { k: 'y', sp: .8, bs: 3.8, hp: 1, name: 'đạn mạnh' }, { k: 'l', sp: .6, bs: 2.6, hp: 4, name: 'bọc giáp' }];
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 8 * U, y: 24 * U, w: 24, h: 24, face: 1, d: 0, up: 0, shield: 0, inv: 0, fr: 0, moving: false, spawn: 0 };
const keys = { l: 0, r: 0, u: 0, d: 0, f: 0, fp: 0, j: 0, jp: 0, order: [] };
let seed0 = 1, lvSel = 2, map = [], tanks = [], buls = [], fx = [], parts = [], items = [], queue = [], done = 0, need = 8, boss = null, frozenE = 0, shovel = 0, baseLost = 0, banner = null, cleared = 0;
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0, side = true, emptyT = 0;

/* ═════ bản đồ: 0 trống · 1 gạch · 2 thép · 3 nước · 4 rừng · 5 đại bàng ═════ */
const at = (c, r) => c < 0 || r < 0 || c >= N || r >= N ? -1 : map[r * N + c];
const set = (c, r, v) => { if (c >= 0 && r >= 0 && c < N && r < N) map[r * N + c] = v };
function buildMap(si) {
  const r0 = rng(seed0 * 17 + si * 131 + lvSel * 7), P = STAGES[si].p;
  map = new Array(N * N).fill(0);
  const pick = (mr, mc) => {
    let x = r0(), safe = mc === 6 || mr % 3 === 0;   // cột giữa & các hàng 3,6,9 không có thép/nước → luôn có đường đi
    if (x < P.e) return 'e'; x -= P.e; if (x < P.b) return r0() < .55 ? 'B' : ['bt', 'bb', 'bl', 'br'][Math.floor(r0() * 4)]; x -= P.b;
    if (x < P.s) return safe ? 'B' : r0() < .5 ? 'S' : 'st'; x -= P.s; if (x < P.w) return safe ? 'e' : 'W'; return 'T';
  };
  const fill = (mr, mc, k) => {
    for (let dr = 0; dr < 2; dr++)for (let dc = 0; dc < 2; dc++) {
      const c = mc * 2 + dc, r = mr * 2 + dr; let v = 0;
      if (k === 'B') v = 1; else if (k === 'bt') v = dr === 0 ? 1 : 0; else if (k === 'bb') v = dr === 1 ? 1 : 0; else if (k === 'bl') v = dc === 0 ? 1 : 0; else if (k === 'br') v = dc === 1 ? 1 : 0;
      else if (k === 'S') v = 2; else if (k === 'st') v = dr === 0 ? 2 : 0; else if (k === 'W') v = 3; else if (k === 'T') v = 4;
      set(c, r, v);
    }
  };
  const mirror = { bl: 'br', br: 'bl' };
  for (let mr = 1; mr < 12; mr++)for (let mc = 0; mc <= 6; mc++) { const k = pick(mr, mc); fill(mr, mc, k); if (mc < 6) fill(mr, 12 - mc, mirror[k] || k) }
  for (let mc = 4; mc <= 8; mc++)fill(11, mc, mc === 6 ? 'e' : (r0() < .5 ? 'e' : 'B'));
  // căn cứ đại bàng + tường gạch bao quanh
  for (let r = 23; r < 26; r++)for (let c = 11; c < 15; c++)set(c, r, 1);
  for (let r = 24; r < 26; r++)for (let c = 12; c < 14; c++)set(c, r, 5);
  for (const [c, r] of [[8, 24], [9, 24], [8, 25], [9, 25], [16, 24], [17, 24], [16, 25], [17, 25]]) set(c, r, 0);
  for (let c = 0; c < N; c++) { set(c, 0, 0); set(c, 1, 0) }
}
function baseWall(v) { for (let r = 23; r < 26; r++)for (let c = 11; c < 15; c++) if (at(c, r) !== 5) set(c, r, v) }
function loadStage(si) {
  S.level = si; buildMap(si); tanks = []; buls = []; fx = []; items = []; boss = null; frozenE = 0; shovel = 0; done = 0; cleared = 0;
  need = LVC.need; const r0 = rng(seed0 * 7 + si * 29);
  queue = []; for (let i = 0; i < need; i++) { let x = r0(), t = 0; while (t < 3 && x > LVC.mix[t]) { x -= LVC.mix[t]; t++ } queue.push({ t, bonus: (i + 1) % LVC.bonusEvery === 0 }) }
  if (si === NS - 1) { boss = { x: F / 2 - 24, y: 2 * U, w: 48, h: 48, hp: LVC.boss, max: LVC.boss, t: 0, cd: 90, hurt: 0, dead: false }; need = Math.ceil(need * .6); queue.length = need }
  respawn(true);
  banner = { t: 170, w: 'STAGE ' + (si + 1), text: STAGES[si].ic + ' ' + STAGES[si].name };
  spawnT = 60;
}
let spawnT = 0, spawnI = 0;
const SP = [[0, 0], [12 * U, 0], [24 * U, 0]];
function spawnEnemy() {
  if (!queue.length || tanks.length >= LVC.field) return;
  for (let k = 0; k < 3; k++) {
    const [x, y] = SP[(spawnI + k) % 3];
    if (!tankAt(x, y, 24, 24, null) && !hit({ x, y, w: 24, h: 24 }, pl)) {
      const q = queue.shift(), T = ETYPE[q.t]; spawnI = (spawnI + k + 1) % 3;
      tanks.push({ x, y, w: 24, h: 24, d: 2, t: q.t, k: T.k, sp: T.sp, bs: T.bs, hp: T.hp, bonus: q.bonus, spawn: 50, cd: 40 + Math.random() * 60, fr: 0, dead: false, think: 0 });
      return;
    }
  }
}
const prog = () => S.won ? 1 : clamp((S.level + (boss ? (1 - boss.hp / boss.max) * .5 + done / Math.max(1, need) * .5 : done / Math.max(1, need))) / NS, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ═════ va chạm ═════ */
function blockedAt(x, y, w, h) {   // gạch, thép, nước, đại bàng chặn xe
  if (x < 0 || y < 0 || x + w > F || y + h > F) return true;
  const c0 = Math.floor(x / U), c1 = Math.floor((x + w - .01) / U), r0 = Math.floor(y / U), r1 = Math.floor((y + h - .01) / U);
  for (let r = r0; r <= r1; r++)for (let c = c0; c <= c1; c++) { const v = at(c, r); if (v === 1 || v === 2 || v === 3 || v === 5) return true }
  return false;
}
function tankAt(x, y, w, h, me) {
  for (const t of tanks) if (t !== me && !t.dead && hit({ x, y, w, h }, t)) return t;
  if (me !== pl && !pl.dead && hit({ x, y, w, h }, pl)) return pl;
  if (boss && !boss.dead && me !== boss && hit({ x, y, w, h }, boss)) return boss;
  return null;
}
/* đi 1 bước; quay ngang thì nắn thẳng vào lưới · gần góc thì tự trượt cho dễ lách */
function moveTank(o, d, sp) {
  if (d !== o.d) { if ((d % 2) !== (o.d % 2)) { if (d % 2 === 0) o.x = Math.round(o.x / (U / 2)) * (U / 2); else o.y = Math.round(o.y / (U / 2)) * (U / 2) } o.d = d }
  const nx = o.x + DX[d] * sp, ny = o.y + DY[d] * sp;
  if (!blockedAt(nx, ny, o.w, o.h) && !tankAt(nx, ny, o.w, o.h, o)) { o.x = nx; o.y = ny; return true }
  if (o === pl) for (const k of [3, 6]) for (const s of [-1, 1]) {   // trượt góc cho em dễ lách vào đường hẹp
    const px = d % 2 === 0 ? o.x + s * k : o.x, py = d % 2 === 0 ? o.y : o.y + s * k;
    if (!blockedAt(px + DX[d] * sp, py + DY[d] * sp, o.w, o.h) && !tankAt(px + DX[d] * sp, py + DY[d] * sp, o.w, o.h, o)) { o.x = px + DX[d] * sp; o.y = py + DY[d] * sp; return true }
  }
  return false;
}
function shoot(o, speed, owner) {
  let n = 0; for (const b of buls) if (b.o === o) n++;
  if (n >= (owner === 'p' && pl.up >= 2 ? 2 : 1)) return false;
  buls.push({ x: o.x + o.w / 2 - 2 + DX[o.d] * (o.w / 2), y: o.y + o.h / 2 - 2 + DY[o.d] * (o.h / 2), d: o.d, sp: speed, o, p: owner, steel: owner === 'p' && pl.up >= 3 });
  return true;
}
function boom(x, y, big) { fx.push({ k: big ? 'boom' : 'spark', x, y, t: 0, life: big ? 34 : 14 }) }
function breakCell(c, r, d, steel) {
  const v = at(c, r);
  if (v === 1 || (v === 2 && steel)) { set(c, r, 0); for (let i = 0; i < 4; i++)parts.push({ x: c * U + 6, y: r * U + 6, vx: (Math.random() - .5) * 2 - DX[d], vy: -1 - Math.random() * 1.5 - DY[d] * .6, l: 30, c: i % 2 ? (v === 2 ? C.steel : C.brick) : C.brickL }); return true }
  return v === 2;
}

/* ═════ cập nhật mỗi khung hình ═════ */
function step() {
  S.tick++;
  if (baseLost) { if (--baseLost === 0) { S.falls++; S.hooks.onFall && S.hooks.onFall(0, '🦅 Căn cứ bị phá! Chơi lại STAGE ' + (S.level + 1) + ' — lần này giữ chặt căn cứ nhé!'); loadStage(S.level) } stepFx(); return }
  if (cleared) { if (--cleared === 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); loadStage(S.level + 1) } stepFx(); return }
  if (shovel > 0 && --shovel === 0) baseWall(1);
  if (frozenE > 0) frozenE--;
  if (pl.inv) pl.inv--; if (pl.shield) pl.shield--; if (pl.spawn) pl.spawn--;
  // xe của em
  const can = S.energy > 0 && !frozen() && !pl.spawn;
  const dk = keys.order.length ? keys.order[keys.order.length - 1] : null, dir = { u: 0, r: 1, d: 2, l: 3 }[dk];
  pl.moving = false;
  if (can && dir !== undefined) { if (moveTank(pl, dir, 1.15)) { pl.moving = true; use(COST.walk); if (S.tick % 4 === 0) pl.fr ^= 1 } else pl.d = dir }
  if (keys.fp) { keys.fp = 0; if (can && shoot(pl, pl.up >= 1 ? 4.6 : 3.2, 'p')) { use(COST.shot); GC.sfx('fireball') } }
  // xe địch
  if (--spawnT <= 0) { spawnT = 110; spawnEnemy() }
  for (const t of tanks) {
    if (t.dead) continue;
    if (t.spawn > 0) { t.spawn--; continue }
    if (frozenE) continue;
    if (S.tick % 5 === 0) t.fr ^= 1;
    t.think--;
    const aligned = Math.abs(t.x / U - Math.round(t.x / U)) < .05 && Math.abs(t.y / U - Math.round(t.y / U)) < .05;
    if (!moveTank(t, t.d, t.sp) || (aligned && t.think <= 0 && Math.random() < .08)) {
      t.think = 30;
      const goal = Math.random() < .5 ? { x: 12 * U, y: 24 * U } : pl, opts = [];
      for (let d = 0; d < 4; d++) { const w = d === 2 ? 3 : 1; const toward = (DX[d] * (goal.x - t.x) + DY[d] * (goal.y - t.y)) > 0 ? 2 : 0; for (let k = 0; k < w + toward; k++)opts.push(d) }
      t.d = opts[Math.floor(Math.random() * opts.length)];
    }
    if (--t.cd <= 0) { t.cd = (50 + Math.random() * 90) * LVC.fire; shoot(t, t.bs, 'e') }
  }
  if (boss && !boss.dead) stepBoss();
  // đạn
  for (let i = buls.length - 1; i >= 0; i--) {
    const b = buls[i]; let dead = false;
    for (let s = 0; s < 3 && !dead; s++) {
      b.x += DX[b.d] * b.sp / 3; b.y += DY[b.d] * b.sp / 3;
      if (b.x < 0 || b.y < 0 || b.x > F - 4 || b.y > F - 4) { boom(clamp(b.x, 2, F - 2), clamp(b.y, 2, F - 2), false); dead = true; break }
      const cx = b.x + 2, cy = b.y + 2, pts = b.d % 2 === 0 ? [[cx - 6, cy], [cx + 5, cy]] : [[cx, cy - 6], [cx, cy + 5]];
      let hitW = false;
      for (const [px, py] of pts) {
        const c = Math.floor(px / U), r = Math.floor(py / U), v = at(c, r);
        if (v === 5) { if (!baseLost && !S.won) { baseLost = 90; boom(12.5 * U, 24.5 * U, true); GC.sfx('bossDown') } hitW = true }
        else if (v === 1 || v === 2) { if (breakCell(c, r, b.d, b.steel)) hitW = true; else hitW = true }
      }
      if (hitW) { boom(cx, cy, false); GC.sfx(b.p === 'p' ? 'bump' : 'crack'); dead = true; break }
      for (let j = buls.length - 1; j >= 0; j--) { const o = buls[j]; if (o !== b && o.p !== b.p && Math.abs(o.x - b.x) < 5 && Math.abs(o.y - b.y) < 5) { buls.splice(j, 1); if (j < i) i--; dead = true; boom(cx, cy, false); break } }
      if (dead) break;
      const box = { x: b.x, y: b.y, w: 4, h: 4 };
      if (b.p === 'p') {
        for (const t of tanks) if (!t.dead && !t.spawn && hit(box, t)) {
          dead = true; t.hp--; GC.sfx('bossHit');
          if (t.bonus) { t.bonus = false; dropItem() }
          if (t.hp <= 0) { t.dead = true; boom(t.x + 12, t.y + 12, true); done++; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) }
          break;
        }
        if (!dead && boss && !boss.dead && hit(box, boss)) { dead = true; boss.hp--; boss.hurt = 10; GC.sfx('bossHit'); if (boss.hp <= 0) { boss.dead = true; for (let k = 0; k < 6; k++)boom(boss.x + Math.random() * 48, boss.y + Math.random() * 48, true); GC.sfx('bossDown'); S.hooks.onBoss && S.hooks.onBoss('tankdown') } }
      } else if (hit(box, pl) && !pl.spawn) { dead = true; hurt() }
    }
    if (dead) buls.splice(i, 1);
  }
  tanks = tanks.filter(t => !t.dead);
  // vật phẩm
  for (const it of items) if (!it.got && hit(pl, it)) { it.got = true; grab(it.k) }
  items = items.filter(it => !it.got && --it.l > 0);
  // qua stage
  if (!cleared && !baseLost && !queue.length && !tanks.length && (!boss || boss.dead)) {
    if (S.level >= NS - 1) { if (!S.won) { S.won = true; GC.sfx('flag'); S.hooks.onWin && S.hooks.onWin() } }
    else { cleared = 110; GC.sfx('flag') }
  }
  stepFx();
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function stepBoss() {   // Siêu Tăng: lượn qua lại phía trên, húc vỡ gạch, bắn toả 3 hướng
  const B = boss; B.t++; if (B.hurt) B.hurt--; if (frozenE) return;
  B.x = F / 2 - 24 + Math.sin(B.t * .012) * (F / 2 - 40); B.y = 2 * U + (Math.sin(B.t * .007) * .5 + .5) * 8 * U;
  const c0 = Math.floor(B.x / U), r0 = Math.floor(B.y / U); for (let r = r0; r < r0 + 4; r++)for (let c = c0; c < c0 + 4; c++)if (at(c, r) === 1) set(c, r, 0);
  if (--B.cd <= 0) {
    B.cd = 110 * LVC.fire; GC.sfx('roar');
    for (const dx of [-1, 0, 1]) buls.push({ x: B.x + 22 + dx * 14, y: B.y + 48, d: 2, sp: 2.6, o: B, p: 'e', vx: dx * .9 });
  }
  if (hit(pl, B)) hurt();
  for (const b of buls) if (b.o === B && b.vx) b.x += b.vx;
}
function dropItem() {
  const ks = ['star', 'helmet', 'shovel', 'bomb', 'clock', 'bolt', 'star', 'bolt'], k = ks[Math.floor(Math.random() * ks.length)];
  for (let tries = 0; tries < 40; tries++) { const x = Math.floor(Math.random() * 22 + 2) * U, y = Math.floor(Math.random() * 18 + 3) * U; if (!blockedAt(x, y, 24, 24)) { items.push({ k, x, y, w: 24, h: 24, l: 900, got: false }); GC.sfx('power'); return } }
}
function grab(k) {
  GC.sfx('grow');
  if (k === 'star') pl.up = Math.min(3, pl.up + 1);
  else if (k === 'helmet') pl.shield = 600;
  else if (k === 'shovel') { baseWall(2); shovel = 900 }
  else if (k === 'bomb') { for (const t of tanks) if (!t.dead && !t.spawn) { t.dead = true; boom(t.x + 12, t.y + 12, true); done++; S.stomps++ } GC.sfx('bossDown') }
  else if (k === 'clock') frozenE = 480;
  else if (k === 'bolt') { S.energy += COST.battery; S.hooks.onBat && S.hooks.onBat(COST.battery, 'bolt') }
  S.hooks.onPower && S.hooks.onPower('t_' + k);
}
function hurt() {
  if (pl.shield || pl.inv) { boom(pl.x + 12, pl.y + 12, false); return }
  S.hits++; use(COST.hurt); pl.up = Math.max(0, pl.up - 1); boom(pl.x + 12, pl.y + 12, true); GC.sfx('hurt');
  S.hooks.onHurt && S.hooks.onHurt(COST.hurt); respawn(false);
}
function respawn(fresh) { pl.x = 8 * U; pl.y = 24 * U; pl.d = 0; pl.spawn = fresh ? 30 : 50; pl.inv = 150; if (fresh) pl.shield = 180 }
function stepFx() {
  for (let i = fx.length - 1; i >= 0; i--)if (++fx[i].t >= fx[i].life) fx.splice(i, 1);
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += .12; if (--p.l <= 0) parts.splice(i, 1) }
}

/* ═════ vẽ (pixel art y như trang mẫu) ═════ */
const spr = {};
function paint(c2, rows, pal, s, x0, y0, fr) {
  for (let y = 0; y < rows.length; y++)for (let x = 0; x < rows[y].length; x++) {
    const k = rows[y][x]; let col = k === 'T' ? ((y + (fr || 0)) % 2 ? pal.t : pal.T) : pal[k];
    if (col) { c2.fillStyle = col; c2.fillRect(x0 + x * s, y0 + y * s, s, s) }
  }
}
function hex(c) { c = parseInt(c.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255] }
function mix(a, b, t) { a = hex(a); b = hex(b); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('') }
const myPal = c => ({ T: mix(c, '#000000', .55), t: mix(c, '#ffffff', .25), b: mix(c, '#000000', .35), h: mix(c, '#ffffff', .72), d: c, c: mix(c, '#ffffff', .42), L: '#FFFFFF', B: mix(c, '#ffffff', .86) });
function tankImg(key, pal, fr, s) { const id = key + fr + s; if (spr[id]) return spr[id]; const c = document.createElement('canvas'); c.width = c.height = 12 * s; paint(c.getContext('2d'), TANK, pal, s, 0, 0, fr); return spr[id] = c }
function drawTank(o, img) { ctx.save(); ctx.translate(Math.round(o.x) + o.w / 2, Math.round(o.y) + o.h / 2); ctx.rotate(o.d * Math.PI / 2); ctx.drawImage(img, -o.w / 2, -o.h / 2, o.w, o.h); ctx.restore() }
function twinkle(x, y, k) { const a = Math.round(4 + k * 8); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, y - a, 2, a * 2); ctx.fillRect(x - a, y - 1, a * 2, 2); ctx.fillStyle = '#BFE6FF'; const b = Math.round(a * .55); ctx.fillRect(x - b, y - b, 2, 2); ctx.fillRect(x + b - 2, y - b, 2, 2); ctx.fillRect(x - b, y + b - 2, 2, 2); ctx.fillRect(x + b - 2, y + b - 2, 2, 2) }
function cell(c, r) {
  const x = c * U, y = r * U, v = at(c, r);
  if (v === 1) { ctx.fillStyle = C.brickD; ctx.fillRect(x, y, U, U); ctx.fillStyle = C.brick; ctx.fillRect(x, y, U, 5); ctx.fillRect(x, y + 6, U, 5); ctx.fillStyle = C.brickD; ctx.fillRect(x + 6, y, 1, 5); ctx.fillRect(x + 2, y + 6, 1, 5); ctx.fillRect(x + 9, y + 6, 1, 5); ctx.fillStyle = C.brickL; ctx.fillRect(x, y, 6, 1); ctx.fillRect(x + 7, y, 5, 1); ctx.fillRect(x + 3, y + 6, 6, 1) }
  else if (v === 2) { ctx.fillStyle = C.steelD; ctx.fillRect(x, y, U, U); ctx.fillStyle = C.steel; ctx.fillRect(x, y, U - 1, U - 1); ctx.fillStyle = C.steelL; ctx.fillRect(x + 3, y + 3, 5, 5) }
  else if (v === 3) { const ph = Math.floor(S.tick / 24) % 3; ctx.fillStyle = C.water; ctx.fillRect(x, y, U, U); ctx.fillStyle = C.waterL; ctx.fillRect(x + ((ph * 4) % 12), y + 2, 4, 1); ctx.fillRect(x + ((ph * 4 + 6) % 12), y + 6, 4, 1); ctx.fillRect(x + ((ph * 4 + 3) % 12), y + 10, 3, 1) }
}
function forest(c, r) { const x = c * U, y = r * U; ctx.fillStyle = C.forestD; ctx.fillRect(x, y, U, U); ctx.fillStyle = C.forest; ctx.fillRect(x + 1, y + 1, 4, 4); ctx.fillRect(x + 7, y + 1, 4, 4); ctx.fillRect(x + 4, y + 6, 4, 4); ctx.fillRect(x, y + 8, 3, 3); ctx.fillRect(x + 9, y + 8, 3, 3); ctx.fillStyle = C.forestL; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 8, y + 2, 1, 1); ctx.fillRect(x + 5, y + 7, 1, 1) }
const pixFont = px => px + 'px "Press Start 2P", monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#141C30'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0E1424'; ctx.fillRect(0, 0, cw, ch);
  for (let y = 0; y < ch; y += 12)for (let x = (y / 12 % 2) * 6; x < cw; x += 12) { ctx.fillStyle = '#1A2340'; ctx.fillRect(x, y, 2, 2) }   // nền chấm bi
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, Math.round(ox * dpr), Math.round(oy * dpr)); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.steelD; ctx.fillRect(-6, -6, F + 12, F + 12); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, F, F);
  for (let r = 0; r < N; r++)for (let c = 0; c < N; c++) { ctx.fillStyle = C.dot; ctx.fillRect(c * U, r * U, 1, 1); cell(c, r) }
  paint(ctx, baseLost || (S.won && false) ? EAGLE_X : EAGLE, baseLost ? { k: '#5D6B85', w: '#2A2A3E' } : PE, 2, 12 * U, 24 * U, 0);
  for (const it of items) if (((it.l > 180) || (S.tick >> 3) & 1)) { ctx.fillStyle = '#ffffff22'; ctx.fillRect(it.x, it.y, 24, 24); paint(ctx, ITEMS[it.k], it.k === 'star' ? { o: '#FF7FB0', y: '#FFF1A0' } : PIT, 2, it.x, it.y + (ITEMS[it.k].length < 12 ? (12 - ITEMS[it.k].length) : 0), 0) }
  for (const t of tanks) {
    if (t.spawn > 0) { twinkle(t.x + 12, t.y + 12, Math.abs(Math.sin(t.spawn * .3))); continue }
    const key = t.bonus && (S.tick >> 3) & 1 ? 'p' : t.k === 'l' && t.hp < 4 ? ['g', 'y', 's'][t.hp - 1] || 'l' : t.k;
    drawTank(t, tankImg('e' + key, TK[key], t.fr, 2));
    if (frozenE && (S.tick >> 3) & 1) { ctx.fillStyle = '#BFE8FF55'; ctx.fillRect(t.x, t.y, 24, 24) }
  }
  if (boss && !boss.dead) {
    const pal = boss.hurt && (boss.hurt >> 1) & 1 ? { T: '#fff', t: '#fff', b: '#fff', h: '#fff', d: '#fff', c: '#fff', L: '#fff', B: '#fff' } : { T: '#3A1020', t: '#C2607F', b: '#7A1638', h: '#FFC2D6', d: '#E8457A', c: '#FF8FB0', L: '#FFE89A', B: '#FFF1A0' };
    drawTank({ x: boss.x, y: boss.y, w: 48, h: 48, d: 2 }, tankImg('boss' + (boss.hurt ? 'h' : ''), pal, (S.tick >> 3) & 1, 4));
    ctx.fillStyle = '#FFE89A'; for (let i = 0; i < 3; i++)ctx.fillRect(boss.x + 16 + i * 6, boss.y - 6, 4, 4);   // vương miện trùm
  }
  if (!pl.spawn || (S.tick >> 2) & 1) {
    if (pl.spawn) twinkle(pl.x + 12, pl.y + 12, 1);
    else if (!(pl.inv && !pl.shield && (S.tick >> 2) & 1)) drawTank(pl, tankImg('me' + S.color, myPal(S.color), pl.fr, 2));
  }
  if (pl.shield) { const k = (S.tick >> 2) & 1; ctx.strokeStyle = k ? '#FFFFFF' : '#9FD4FF'; ctx.lineWidth = 2; ctx.strokeRect(pl.x - 3, pl.y - 3, 30, 30); ctx.fillStyle = '#FFFFFF'; for (const [a, b] of [[-4, -4], [26, -4], [-4, 26], [26, 26]]) ctx.fillRect(pl.x + a, pl.y + b, 2, 2) }
  if (frozen()) { ctx.fillStyle = '#BFE8FF88'; ctx.fillRect(pl.x - 2, pl.y - 2, 28, 28) }
  ctx.fillStyle = '#FFF8D6'; for (const b of buls) ctx.fillRect(Math.round(b.x), Math.round(b.y), 4, 4);
  for (const p of parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3) }
  for (const f of fx) {
    const k = f.t / f.life;
    if (f.k === 'boom') { const rr = Math.round(6 + k * 16); ctx.fillStyle = k < .5 ? '#FFFFFF' : '#FFB0CF'; ctx.fillRect(f.x - rr, f.y - 2, rr * 2, 4); ctx.fillRect(f.x - 2, f.y - rr, 4, rr * 2); ctx.fillStyle = '#FF7FB0'; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(f.x + a * rr * .7 - 2.5, f.y + b * rr * .7 - 2.5, 5, 5); ctx.fillStyle = '#9FD4FF'; ctx.fillRect(f.x - 4, f.y - 4, 8, 8) }
    else { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(f.x - 3, f.y - 3, 6, 6); ctx.fillStyle = '#BFE6FF'; ctx.fillRect(f.x - 6, f.y - 1, 12, 2); ctx.fillRect(f.x - 1, f.y - 6, 2, 12) }
  }
  for (let r = 0; r < N; r++)for (let c = 0; c < N; c++)if (at(c, r) === 4) forest(c, r);   // rừng che xe
  if (S.name && !pl.spawn) label(S.name, pl.x + 12, pl.y - 5, 10, '#fff', '#141C30');
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x + 12, y = pl.y - 16; ctx.fillStyle = '#141C30'; ctx.fillRect(cx - 24, y - 16, 48, 18); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 22, y - 14, 44, 14); ctx.font = pixFont(7); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E8457A'; ctx.fillText('⚡0!', cx, y - 12) }
  if (baseLost) { ctx.fillStyle = '#141C30cc'; ctx.fillRect(0, F / 2 - 26, F, 52); ctx.font = pixFont(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FF7FB0'; ctx.fillText('BASE LOST', F / 2, F / 2 - 6); label('Căn cứ bị phá — chơi lại stage!', F / 2, F / 2 + 18, 11, '#FFE89A') }
  if (cleared) { ctx.fillStyle = '#141C30cc'; ctx.fillRect(0, F / 2 - 26, F, 52); ctx.font = pixFont(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#86E8B9'; ctx.fillText('STAGE CLEAR!', F / 2, F / 2 - 6); label('Chuẩn bị STAGE ' + (S.level + 2) + '…', F / 2, F / 2 + 18, 11, '#FFE89A') }
  drawPanel();
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.fillStyle = '#141C30dd'; ctx.fillRect(0, F * .36 - 28, F, 66); ctx.font = pixFont(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(banner.w, F / 2, F * .36 - 4); label(banner.text, F / 2, F * .36 + 28, 13, '#FFE89A'); ctx.globalAlpha = 1 }
}
function drawPanel() {   // bảng tím kiểu NES: xe địch còn lại · stage · nâng cấp · trùm
  const pw = 60, ph = side ? F : 44, px = side ? F + 12 : 0, py = side ? 0 : -ph - 12, pwid = side ? pw : F;
  ctx.fillStyle = '#C9C2EA'; ctx.fillRect(px, py, pwid, ph); ctx.fillStyle = '#9B7BFF'; ctx.fillRect(px, py, pwid, 3); ctx.fillRect(px, py + ph - 3, pwid, 3);
  const left = queue.length + tanks.length, dark = { T: '#3B3366', t: '#3B3366', b: '#3B3366', B: '#3B3366', c: '#3B3366' };
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (side) {
    for (let i = 0; i < Math.min(left, 20); i++)paint(ctx, MINI, dark, 2, px + 12 + (i % 2) * 20, py + 12 + Math.floor(i / 2) * 18, 0);
    let y = py + 200; ctx.fillStyle = '#2B2460'; ctx.font = pixFont(7); ctx.fillText('STAGE', px + pw / 2, y); ctx.font = pixFont(14); ctx.fillText(String(S.level + 1), px + pw / 2, y + 12);
    y += 36; for (let i = 0; i < 3; i++)paint(ctx, STAR, i < pl.up ? { o: '#FF7FB0', y: '#FFF1A0' } : { o: '#9C8FD0', y: '#B9B0E0' }, 1, px + 6 + i * 17, y, 0);
    y += 18; ctx.font = pixFont(6); ctx.fillStyle = '#2B2460'; ctx.fillText('💥' + S.stomps, px + pw / 2, y);
    const fy = py + ph - 26, fx0 = px + pw / 2 - 8; ctx.fillStyle = '#2B2460'; ctx.fillRect(fx0, fy, 2, 16); ctx.fillStyle = '#FF7FB0'; ctx.fillRect(fx0 + 2, fy, 9, 4); ctx.fillRect(fx0 + 2, fy + 4, 6, 3); ctx.fillRect(fx0 + 2, fy + 7, 3, 2);
  } else {
    for (let i = 0; i < Math.min(left, 20); i++)paint(ctx, MINI, dark, 2, px + 8 + i * 14, py + 8, 0);
    ctx.fillStyle = '#2B2460'; ctx.font = pixFont(8); ctx.textAlign = 'right'; ctx.fillText('STAGE ' + (S.level + 1), px + pwid - 8, py + 8);
    for (let i = 0; i < 3; i++)paint(ctx, STAR, i < pl.up ? { o: '#FF7FB0', y: '#FFF1A0' } : { o: '#9C8FD0', y: '#B9B0E0' }, 1, px + pwid - 40 + i * 12, py + 24, 0);
    ctx.textAlign = 'left'; ctx.font = pixFont(7); ctx.fillText('💥' + S.stomps, px + 8, py + 28);
  }
  if (boss && !boss.dead) {   // thanh máu trùm phía trên sân
    const bw = F * .7, bx = (F - bw) / 2, by = side ? -20 : F + 6; ctx.fillStyle = '#141C30'; ctx.fillRect(bx - 2, by - 2, bw + 4, 16); ctx.fillStyle = '#5D6B85'; ctx.fillRect(bx, by, bw, 12); ctx.fillStyle = '#E8457A'; ctx.fillRect(bx, by, bw * boss.hp / boss.max, 12);
    ctx.font = pixFont(7); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff'; ctx.fillText('BOSS', F / 2, by + 3);
  }
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  side = cw / ch > 1.02;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), room = touch && !side ? 190 : 66;   // chừa chỗ cho nút chữ thập / nút trả lời + hướng dẫn phím ở dưới
  const tw = side ? F + 12 + 60 + 24 : F + 24, th = side ? F + 48 : F + 44 + 12 + 30;
  sc = Math.min(cw / tw, (ch - 8 - room) / th); ox = (cw - (side ? (F + 72) : F) * sc) / 2; oy = side ? (ch - room - F * sc) / 2 + 10 * sc : 8 + 56 * sc;
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else { acc = 0; S.tick++; stepFx() }
  draw(); S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: mũi tên/WASD lái 4 hướng · Space/F bắn ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ' ': 'f', f: 'f', F: 'f', x: 'f', X: 'f', j: 'f', J: 'f' };
const press = k => { if (k === 'f') { if (!keys.f) keys.fp = 1; keys.f = 1; return } keys[k] = 1; keys.order = keys.order.filter(q => q !== k).concat(k) };
const unpress = k => { keys[k] = 0; if (k !== 'f') keys.order = keys.order.filter(q => q !== k) };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (!e.repeat || k !== 'f') press(k) }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) unpress(k) });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd'], ['bF', 'f']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } press(k); b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { unpress(k); b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = keys.f = 0; keys.order = [] }
function place(x, y, old) { const si = old && old.lvl != null ? old.lvl : 0; S.stomps = old && old.sp || 0; if (si !== S.level) loadStage(si); if (old && old.up) pl.up = old.up }
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Stage ' + (S.level + 1) + '/' + NS + ' · 🎯 ' + done + '/' + need + (boss && !boss.dead ? ' · trùm ' + boss.hp + '❤' : '');
function extra() { return { lvl: S.level, wk: 'tank', lb: label2(), up: pl.up } }
function hud() { return (S.won ? '🏆 Phá đảo' : '🎯 Stage ' + (S.level + 1) + '/' + NS) + ' · 💥 ' + S.stomps }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: F, kind: 'tank', NL: NS,
  winTitle: '🏆 Bảo vệ căn cứ — phá đảo Xe Tăng 1990!', winToast: '🏆 HẠ GỤC SIÊU TĂNG! Căn cứ an toàn — em là chiến binh xe tăng số 1!' };
})();
