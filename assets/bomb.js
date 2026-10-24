/* bomb.js — game "Đặt Bom Cổ Điển" (đủ luật bản gốc năm xưa): sân 15×13, gạch vỡ được, bom nổ chữ thập + nổ dây chuyền,
   cửa ra & vật phẩm giấu dưới gạch, bom trúng cửa thì quái mới chui ra, 6 loại quái, 8 màn + 1 màn thưởng, 3 mức độ khó.
   Cùng giao diện với Climb/Brick/Tank: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'bomb' */
window.Bomb = (function () {
const { clamp, rng } = GC;
const U = 32, COLS = 15, ROWS = 13, FW = COLS * U, FH = ROWS * U, HB = 48, PX = 2;
const STAGES = [   // 8 màn + màn thưởng (sau màn 4)
  { n: '1', th: 0, en: ['bal', 'bal', 'oni'] }, { n: '2', th: 0, en: ['bal', 'oni', 'oni'] }, { n: '3', th: 1, en: ['oni', 'bar', 'bal'] }, { n: '4', th: 1, en: ['bar', 'smi', 'oni'] },
  { n: 'BONUS', th: 4, bonus: true, en: ['bal', 'oni', 'smi'] },
  { n: '5', th: 2, en: ['smi', 'gho', 'bar'] }, { n: '6', th: 2, en: ['gho', 'cha', 'smi'] }, { n: '7', th: 3, en: ['cha', 'gho', 'bar', 'smi'] }, { n: '8', th: 3, en: ['cha', 'cha', 'gho', 'smi'] }];
const NS = STAGES.length;
const THEMES = [
  { name: 'Đồng cỏ', ic: '🌿', floor: ['#3F9E4D', '#47AA56'], hard: ['#A6ACB4', '#5E636B', '#E1E5EA'], soft: ['#8C94A3', '#4E5560', '#CDD2DA'], bar: '#F08A24' },
  { name: 'Sa mạc', ic: '🏜', floor: ['#E0B466', '#E8C27A'], hard: ['#B5895A', '#6E5428', '#EBD3A2'], soft: ['#C98E54', '#7A5226', '#F2CC98'], bar: '#E86A3A' },
  { name: 'Băng tuyết', ic: '❄️', floor: ['#BFE3F5', '#CCEAFA'], hard: ['#8FB4D9', '#4F7099', '#E6F3FF'], soft: ['#A3C6E6', '#5A7FA8', '#F0F8FF'], bar: '#4F8FE0' },
  { name: 'Núi lửa', ic: '🌋', floor: ['#4A2A30', '#553338'], hard: ['#75606C', '#3A2C34', '#B09CA8'], soft: ['#A8503C', '#5A2418', '#E48A6A'], bar: '#C8324A' },
  { name: 'Vòng thưởng', ic: '🎁', floor: ['#7A4FD0', '#865CDC'], hard: ['#B9A6F0', '#6B4FC0', '#EEE8FF'], soft: ['#B9A6F0', '#6B4FC0', '#EEE8FF'], bar: '#9B7BFF' }];
const ETYPES = {   // tốc độ · đi xuyên gạch · khôn (đuổi theo em) · đổi hướng
  bal: { sp: .7, wall: false, smart: 0, turn: .25, pts: 1 }, oni: { sp: 1.0, wall: false, smart: .25, turn: .35, pts: 1 }, bar: { sp: 1.0, wall: false, smart: 0, turn: .7, pts: 1 },
  smi: { sp: 1.55, wall: false, smart: .3, turn: .4, pts: 2 }, gho: { sp: .75, wall: true, smart: .4, turn: .3, pts: 2 }, cha: { sp: 1.6, wall: false, smart: .75, turn: .3, pts: 3 } };
const LVS = {
  1: { soft: .42, base: 3, add: .45, spd: .9, fuse: 160, cost: { walk: .1, bomb: 2, battery: 20, stomp: 8, hurt: 15 } },
  2: { soft: .52, base: 4, add: .65, spd: 1.05, fuse: 150, cost: { walk: .14, bomb: 3, battery: 20, stomp: 8, hurt: 22 } },
  3: { soft: .6, base: 5, add: .9, spd: 1.22, fuse: 140, cost: { walk: .18, bomb: 3, battery: 20, stomp: 8, hurt: 30 } } };
const ITEMS = ['bomb', 'fire', 'speed', 'remote', 'kick', 'wall', 'flame', 'vest'];
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: U * 1.5, y: U * 1.5, d: 2, fr: 0, walk: 0, inv: 0, bombs: 1, fire: 1, speed: 0, remote: false, kick: false, wall: false, flame: 0, vest: 0, moving: false };
const keys = { l: 0, r: 0, u: 0, d: 0, b: 0, bp: 0, x: 0, xp: 0, order: [] };
let seed0 = 1, lvSel = 2, map = [], bombs = [], flames = [], enemies = [], items = [], door = null, fx = [], parts = [], score = 0, banner = null, clearT = 0, bonusT = 0, spawnT = 0, doorHits = 0, total = 0;
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
    const pool = si < 2 ? ['bomb', 'fire'] : si < 4 ? ['bomb', 'fire', 'speed', 'kick'] : ITEMS;
    const nItems = 2 + (si >= 5 ? 1 : 0);
    for (let k = 0; k < nItems; k++) {
      for (let t = 0; t < 30; t++) { const s = softs[Math.floor(r0() * softs.length)]; if (s && !(s[0] === door.c && s[1] === door.r) && !items.some(i => i.c === s[0] && i.r === s[1])) { items.push({ c: s[0], r: s[1], k: pool[Math.floor(r0() * pool.length)], show: false, got: false }); break } }
    }
    const n = Math.round(LVC.base + si * LVC.add);
    for (let k = 0; k < n; k++) addEnemy(st.en[k % st.en.length], r0, 6);
  } else { bonusT = 1500; spawnT = 30 }
  total = enemies.length;
}
function addEnemy(k, r0, minDist, at0) {
  r0 = r0 || Math.random;
  for (let t = 0; t < 80; t++) {
    const c = at0 ? at0.c : 1 + Math.floor(r0() * (COLS - 2)), r = at0 ? at0.r : 1 + Math.floor(r0() * (ROWS - 2));
    if (at(c, r) !== 0 && !at0) continue;
    if (!at0 && Math.abs(c - cellOf(pl.x)) + Math.abs(r - cellOf(pl.y)) < minDist) continue;
    const T = ETYPES[k]; enemies.push({ k, x: mid(c), y: mid(r), d: Math.floor(Math.random() * 4), sp: T.sp * LVC.spd, T, dead: 0, fr: 0, born: at0 ? 40 : 0 }); return;
  }
}
function loadStage(si) {
  S.level = si; resetPlayer(true); buildStage(si);
  const st = STAGES[si], T = THEMES[st.th];
  banner = { t: 170, w: st.bonus ? 'BONUS STAGE' : 'STAGE ' + st.n, text: st.bonus ? '🎁 Bất tử 25 giây — săn quái lấy ⚡!' : T.ic + ' ' + T.name };
  if (st.bonus) pl.vest = 1500;
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
  const b = bombAt(c, r); if (b && !(o.T && o.T.wall && o.k === 'gho')) return false;
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
  if (at(c, r) !== 0 || bombAt(c, r) || bombs.filter(b => !b.gone).length >= pl.bombs) return;
  bombs.push({ c, r, x: mid(c), y: mid(r), t: pl.remote ? 1e9 : LVC.fuse, fire: pl.fire, slide: null, gone: false });
  use(COST.bomb); GC.sfx('bump');
}
function explode(b) {
  if (b.gone) return; b.gone = true; GC.sfx('boom');
  addFlame(b.c, b.r, 'c');
  for (let d = 0; d < 4; d++) {
    const dx = [0, 1, 0, -1][d], dy = [-1, 0, 1, 0][d];
    for (let k = 1; k <= b.fire; k++) {
      const c = b.c + dx * k, r = b.r + dy * k, v = at(c, r);
      if (v === 1) break;
      if (v === 2) { set(c, r, 3); fx.push({ k: 'brk', c, r, t: 0 }); break }
      if (v === 3) break;
      addFlame(c, r, k === b.fire ? 'e' + d : (d % 2 ? 'h' : 'v'));
      const ob = bombAt(c, r); if (ob) ob.t = Math.min(ob.t, 4);   // nổ dây chuyền
    }
  }
  for (let i = 0; i < 6; i++)parts.push({ x: b.x, y: b.y, vx: (Math.random() - .5) * 3, vy: -Math.random() * 3, l: 24, c: GC.pick(['#FFB627', '#FF7A3D', '#FFF3B0']) });
}
function addFlame(c, r, k) {
  flames.push({ c, r, k, t: 32 });
  if (door && door.show && door.c === c && door.r === r && !STAGES[S.level].bonus && doorHits < 2) {   // bom trúng cửa → quái mới chui ra
    doorHits++; for (let i = 0; i < 2; i++)addEnemy(STAGES[Math.min(NS - 1, S.level + 1)].en[i % 2], null, 0, { c, r }); S.hooks.onPower && S.hooks.onPower('b_door');
  }
}
/* phá gạch là có thể rơi đồ (như bản Super ngày xưa) · cả lớp cùng bảng rơi: cùng viên gạch → cùng món */
const DROPS = [['bomb', .075], ['fire', .075], ['full', .01], ['apple', .02], ['berry', .015], ['banana', .015], ['speed', .015], ['kick', .008], ['flame', .008], ['vest', .005], ['wall', .005], ['remote', .008]];   // ~25%: khoảng 4 viên gạch rơi 1 món
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
  if (clearT) { if (--clearT === 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NS - 1) { S.won = true; S.hooks.onWin && S.hooks.onWin() } else loadStage(S.level + 1) } stepFx(); return }
  if (pl.inv) pl.inv--; if (pl.flame) pl.flame--; if (pl.vest) pl.vest--;
  // em
  const can = S.energy > 0 && !frozen();
  const dk = keys.order.length ? keys.order[keys.order.length - 1] : null, dir = { u: 0, r: 1, d: 2, l: 3 }[dk];
  pl.moving = false;
  if (can && dir !== undefined) { pl.d = dir; if (moveOn(pl, dir, (1.7 + pl.speed * .4))) { pl.moving = true; pl.walk += .18; use(COST.walk) } }
  if (keys.bp) { keys.bp = 0; if (can) placeBomb() }
  if (keys.xp) { keys.xp = 0; if (pl.remote) { const b = bombs.find(q => !q.gone); if (b) b.t = 0 } }
  // bom
  for (const b of bombs) {
    if (b.gone) continue;
    if (b.slide !== null && b.slide !== undefined) {   // bom bị đá trượt
      const dx = [0, 1, 0, -1][b.slide], dy = [-1, 0, 1, 0][b.slide], nc = b.c + dx, nr = b.r + dy;
      const blocked = at(nc, nr) !== 0 || bombAt(nc, nr) || enemies.some(e => !e.dead && cellOf(e.x) === nc && cellOf(e.y) === nr);
      if (blocked && Math.abs(b.x - mid(b.c)) < 3 && Math.abs(b.y - mid(b.r)) < 3) { b.slide = null; b.x = mid(b.c); b.y = mid(b.r) }
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
    const centered = Math.abs(e.x - mid(cellOf(e.x))) < e.sp && Math.abs(e.y - mid(cellOf(e.y))) < e.sp;
    if (centered && Math.random() < e.T.turn * .25 || !moveOn(e, e.d, e.sp)) {
      if (centered) { e.x = mid(cellOf(e.x)); e.y = mid(cellOf(e.y)) }
      const c = cellOf(e.x), r = cellOf(e.y), opts = [];
      for (let d = 0; d < 4; d++) if (passable(e, c + [0, 1, 0, -1][d], r + [-1, 0, 1, 0][d])) opts.push(d);
      if (opts.length) {
        if (Math.random() < e.T.smart) {   // quái khôn: chọn hướng gần em hơn
          opts.sort((a, b) => dist(c + [0, 1, 0, -1][a], r + [-1, 0, 1, 0][a]) - dist(c + [0, 1, 0, -1][b], r + [-1, 0, 1, 0][b])); e.d = opts[0];
        } else e.d = opts[Math.floor(Math.random() * opts.length)];
      }
    }
    if (inFlame(cellOf(e.x), cellOf(e.y))) { e.dead = 1; score += e.T.pts; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) }
    else if (!pl.inv && Math.hypot(e.x - pl.x, e.y - pl.y) < 22) { if (pl.vest) { e.dead = 1; S.stomps++; score += e.T.pts; GC.sfx('stomp') } else hurt() }
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
const dist = (c, r) => Math.abs(c - cellOf(pl.x)) + Math.abs(r - cellOf(pl.y));
const inFlame = (c, r) => flames.some(f => f.c === c && f.r === r);
function hurt() {
  S.hits++; use(COST.hurt); GC.sfx('hurt'); for (let i = 0; i < 10; i++)parts.push({ x: pl.x, y: pl.y, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, l: 30, c: '#FF6B81' });
  S.hooks.onHurt && S.hooks.onHurt(COST.hurt); resetPlayer(false);
}
function grab(k) {
  GC.sfx('grow');
  if (k === 'bomb') pl.bombs = Math.min(8, pl.bombs + 1); else if (k === 'fire') pl.fire = Math.min(8, pl.fire + 1); else if (k === 'speed') pl.speed = Math.min(3, pl.speed + 1);
  else if (k === 'remote') { pl.remote = true; document.body.classList.add('remote') } else if (k === 'kick') pl.kick = true; else if (k === 'wall') pl.wall = true;
  else if (k === 'flame') pl.flame = 1800; else if (k === 'vest') pl.vest = 600; else if (k === 'full') pl.fire = 8;
  else if (k === 'apple' || k === 'berry' || k === 'banana') { score += 3; S.energy += 5; S.coins++; GC.sfx('coin'); pops.push({ x: pl.x, y: pl.y - 20, t: 40 }); S.hooks.onPower && S.hooks.onPower('b_fruit'); return }
  S.hooks.onPower && S.hooks.onPower('b_' + k);
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
const PEN = { bal: { p: '#FF8CC0', w: '#FFFFFF', k: '#1A1A1A', m: '#C2185B' }, oni: { b: '#5AB0FF', w: '#FFFFFF', k: '#1A1A1A', m: '#1D4E99' }, bar: { o: '#FFB36B', O: '#C9733A', w: '#FFFFFF', k: '#1A1A1A', m: '#7A3E00' },
  smi: { y: '#FFE08A', k: '#7A5A00' }, gho: { l: '#C9B8FF', w: '#FFFFFF', k: '#3B2F78', m: '#7A6AA8' }, cha: { r: '#FF5C7A', w: '#FFFFFF', k: '#3A0010' } };
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
const TC = {};
function tiles(th) {
  if (TC[th]) return TC[th];
  const T = THEMES[th], [f0, f1] = T.floor, [h, hd, hl] = T.hard, [s, sd, sl] = T.soft;
  return TC[th] = {
    f0: cnv(16, 16, f => { f(f0, 0, 0, 16, 16); f(mix(f0, '#000000', .12), 0, 15, 16, 1); f(mix(f0, '#ffffff', .1), 3, 4, 2, 1); f(mix(f0, '#ffffff', .1), 10, 10, 2, 1) }),
    f1: cnv(16, 16, f => { f(f1, 0, 0, 16, 16); f(mix(f1, '#000000', .12), 0, 15, 16, 1); f(mix(f1, '#ffffff', .1), 11, 3, 2, 1); f(mix(f1, '#ffffff', .1), 4, 11, 2, 1) }),
    shade: cnv(16, 16, f => { f('#00000033', 0, 0, 16, 4) }),
    hard: cnv(16, 16, f => { f(hd, 0, 0, 16, 16); f(hl, 0, 0, 15, 2); f(hl, 0, 0, 2, 15); f(h, 2, 2, 12, 12); f(mix(h, hd, .4), 13, 2, 1, 12); f(mix(h, hd, .4), 2, 13, 12, 1); f(hl, 4, 4, 3, 1) }),
    soft: cnv(16, 16, f => { f(sd, 0, 0, 16, 16); f(s, 0, 0, 16, 7); f(s, 0, 8, 16, 7); f(sd, 7, 0, 1, 7); f(sd, 3, 8, 1, 7); f(sd, 11, 8, 1, 7); f(sl, 0, 0, 7, 1); f(sl, 8, 0, 7, 1); f(sl, 0, 8, 3, 1); f(sl, 4, 8, 7, 1); f(sl, 12, 8, 3, 1) })
  };
}
function blit(img, x, y, s, flip) { if (flip) { ctx.save(); ctx.translate(Math.round(x + img.width * s), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width * s, img.height * s); ctx.restore() } else ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s) }
const pixFont = n => n + 'px "Press Start 2P", monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1A1A1A'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function flameDraw(f) {
  const x = f.c * U, y = f.r * U, k = Math.min(1, f.t / 10), w = Math.round((8 + 8 * k) / 2) * 2, flick = (S.tick >> 1) & 1;
  const layers = [['#FF7A1A', w + 6], ['#FFB627', w + 1], ['#FFF3B0', Math.max(2, w - 6)]];
  for (const [col, ww] of layers) {
    ctx.fillStyle = col; const hw = ww / 2 + (flick ? 1 : 0);
    if (f.k === 'c') { ctx.fillRect(x + U / 2 - hw, y, hw * 2, U); ctx.fillRect(x, y + U / 2 - hw, U, hw * 2) }
    else if (f.k === 'h') ctx.fillRect(x, y + U / 2 - hw, U, hw * 2);
    else if (f.k === 'v') ctx.fillRect(x + U / 2 - hw, y, hw * 2, U);
    else { const d = +f.k[1]; if (d === 1) ctx.fillRect(x, y + U / 2 - hw, U - 4, hw * 2); else if (d === 3) ctx.fillRect(x + 4, y + U / 2 - hw, U - 4, hw * 2); else if (d === 0) ctx.fillRect(x + U / 2 - hw, y + 4, hw * 2, U - 4); else ctx.fillRect(x + U / 2 - hw, y, hw * 2, U - 4) }
  }
}
function draw() {
  const st = STAGES[S.level], T = THEMES[st.th], TL = tiles(st.th);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1C2A1E'; ctx.fillRect(0, 0, cw, ch);
  for (let y = 0; y < ch; y += 14)for (let x = (y / 14 % 2) * 7; x < cw; x += 14) { ctx.fillStyle = '#ffffff0d'; ctx.fillRect(x, y, 2, 2) }
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, Math.round(ox * dpr), Math.round(oy * dpr)); ctx.imageSmoothingEnabled = false;
  // thanh trên kiểu bản gốc
  ctx.fillStyle = mix(T.bar, '#000000', .35); ctx.fillRect(-4, -HB - 4, FW + 8, HB); ctx.fillStyle = T.bar; ctx.fillRect(-4, -HB - 4, FW + 8, HB - 6);
  blit(pix('hhead' + S.color, HERO_F.slice(0, 8), heroPal(S.color)), 8, -HB + 6, 2);
  ctx.font = pixFont(13); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(String(score).padStart(3, '0'), 46, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText(String(score).padStart(3, '0'), 44, -HB + 21);
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(FW / 2 - 70, -HB + 6, 140, 30); ctx.fillStyle = '#FFFFFF'; ctx.font = pixFont(11); ctx.textAlign = 'center'; ctx.fillText(st.bonus ? 'BONUS ' + Math.ceil(bonusT / 60) : 'STAGE ' + st.n, FW / 2, -HB + 22);
  const left = enemies.filter(e => !e.dead).length; blit(pix('enbal', EN.bal, PEN.bal), FW - 168, -HB + 8, 1.6); ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.font = pixFont(12); ctx.fillText('×' + left, FW - 140, -HB + 22);
  ctx.font = pixFont(12); ctx.textBaseline = 'middle';   // 💣 số bom · 🔥 độ dài lửa — to, dễ thấy
  blit(pix('ibomb', ICON.bomb, PIC), FW - 112, -HB + 6, 1.8); ctx.fillStyle = '#1A1A1A'; ctx.fillText('×' + pl.bombs, FW - 82, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText('×' + pl.bombs, FW - 84, -HB + 21);
  blit(pix('ifire', ICON.fire, PIC), FW - 58, -HB + 7, 2); ctx.fillStyle = '#1A1A1A'; ctx.fillText('×' + pl.fire, FW - 28, -HB + 23); ctx.fillStyle = '#FFFFFF'; ctx.fillText('×' + pl.fire, FW - 30, -HB + 21);
  // sân: viền đá + cỏ ô cờ
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(-4, -4, FW + 8, FH + 8);
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) {
    const v = at(c, r), x = c * U, y = r * U;
    if (v === 1) { ctx.drawImage(TL.hard, x, y, U, U); continue }
    ctx.drawImage((c + r) % 2 ? TL.f1 : TL.f0, x, y, U, U);
    if (at(c, r - 1) === 1 || at(c, r - 1) === 2) ctx.drawImage(TL.shade, x, y, U, U);
  }
  if (door && door.show) { const open = !enemies.some(e => !e.dead), x = door.c * U, y = door.r * U; ctx.fillStyle = '#5A3A1A'; ctx.fillRect(x + 4, y + 2, U - 8, U - 2); ctx.fillStyle = open && (S.tick >> 3) & 1 ? '#FFE08A' : '#2A1A0A'; ctx.fillRect(x + 8, y + 6, U - 16, U - 6); ctx.fillStyle = '#C9A06A'; ctx.fillRect(x + 4, y + 2, U - 8, 3); ctx.fillStyle = '#FFE08A'; ctx.fillRect(x + U - 12, y + 18, 3, 3) }
  for (const it of items) if (it.show && !it.got) {
    const x = it.c * U, y = it.r * U, flash = (S.tick >> 3) & 1, fr = FRUIT[it.k], ic = pix('i' + it.k, ICON[it.k], ICPAL[it.k] || PIC);
    if (fr) { const b = Math.round(Math.sin(S.tick * .12 + it.c) * 2); ctx.fillStyle = '#00000033'; ctx.fillRect(x + 8, y + U - 7, U - 16, 3); blit(ic, x + (U - ic.width * 2) / 2 + 2, y + (U - ic.height * 2) / 2 + b, 2); continue }
    ctx.fillStyle = it.k === 'bomb' || it.k === 'fire' || it.k === 'full' ? (flash ? '#FF7A1A' : '#FFB627') : (flash ? '#FF7EB6' : '#9B7BFF'); ctx.fillRect(x + 2, y + 2, U - 4, U - 4); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 4, y + 4, U - 8, U - 8);
    blit(ic, x + (U - ic.width * 1.6) / 2, y + (U - ic.height * 1.6) / 2, 1.6);
    if (it.k === 'full') { ctx.font = pixFont(6); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E52521'; ctx.fillText('MAX', x + U / 2, y + U - 10) }
  }
  for (let r = 0; r < ROWS; r++)for (let c = 0; c < COLS; c++) { const v = at(c, r); if (v === 2) ctx.drawImage(TL.soft, c * U, r * U, U, U) }
  for (const e of fx) if (e.k === 'brk') { const k = e.t / 22, x = e.c * U, y = e.r * U; ctx.globalAlpha = 1 - k; ctx.drawImage(TL.soft, x + k * 4, y + k * 4, U - k * 8, U - k * 8); ctx.globalAlpha = 1; ctx.fillStyle = '#FFB627'; ctx.fillRect(x + U / 2 - 6 + Math.sin(e.t) * 4, y + 6, 4, 4); ctx.fillRect(x + 6, y + U / 2 + Math.cos(e.t) * 4, 4, 4) }
  for (const b of bombs) { const s = 1 + Math.sin(S.tick * .35) * .08, img = pix('bomb', BOMB, PBOMB), w = img.width * PX * s, h = img.height * PX * s; ctx.drawImage(img, Math.round(b.x - w / 2), Math.round(b.y - h / 2 + 1), w, h); if (pl.remote) { ctx.fillStyle = (S.tick >> 3) & 1 ? '#E52521' : '#FFE08A'; ctx.fillRect(b.x + 6, b.y - 12, 4, 4) } }
  for (const f of flames) flameDraw(f);
  for (const e of enemies) {
    const img = pix('en' + e.k, EN[e.k], PEN[e.k]), x = e.x - img.width, y = e.y - img.height + 2 - (e.fr ? 2 : 0);
    if (e.born) { if ((S.tick >> 2) & 1) { ctx.globalAlpha = .6; blit(img, x, y, PX); ctx.globalAlpha = 1 } continue }
    if (e.dead) { ctx.globalAlpha = Math.max(0, 1 - e.dead / 40); blit(img, x, y + e.dead * .3, PX); ctx.globalAlpha = 1; label('+' + e.T.pts, e.x, e.y - 18 - e.dead * .5, 11, '#FFE08A'); continue }
    ctx.globalAlpha = e.k === 'gho' ? .8 : 1; blit(img, x, y, PX, e.d === 3); ctx.globalAlpha = 1;
  }
  // em
  if (!(pl.inv && (S.tick >> 2) & 1)) {
    const wf = pl.moving && (Math.floor(pl.walk) & 1), rows = pl.d === 0 ? (wf ? HERO_B2 : HERO_B) : pl.d === 2 ? (wf ? HERO_F2 : HERO_F) : (wf ? HERO_S2 : HERO_S);
    let pal = heroPal(S.color);
    if (pl.vest && (S.tick >> 2) & 1) pal = heroPal(['#FF4D4D', '#FFD23F', '#3FD29A', '#5AB0FF', '#C77DFF'][(S.tick >> 2) % 5]);
    const img = pix('hero' + pl.d + wf + pal.c, rows, pal); blit(img, pl.x - 16, pl.y - 22, PX, pl.d === 3);
    if (pl.flame) { ctx.strokeStyle = (S.tick >> 3) & 1 ? '#FF7A1A' : '#FFE08A'; ctx.lineWidth = 2; ctx.strokeRect(pl.x - 15, pl.y - 21, 30, 32) }
    if (frozen()) { ctx.fillStyle = '#BFE8FF88'; ctx.fillRect(pl.x - 16, pl.y - 22, 32, 34) }
    if (S.now() < S.sh) { ctx.strokeStyle = '#7FD6FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pl.x, pl.y - 4, 22, 0, 7); ctx.stroke() }
  }
  for (const p of parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3) }
  for (const p of pops) { p.t--; ctx.globalAlpha = Math.min(1, p.t / 15); label('+5⚡ ngon!', p.x, p.y - (40 - p.t) * .6, 11, '#FFE08A'); ctx.globalAlpha = 1 } pops = pops.filter(p => p.t > 0);
  if (S.name) label(S.name, pl.x, pl.y - 26, 11, '#fff');
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x, y = pl.y - 40; ctx.fillStyle = '#1A1A1A'; ctx.fillRect(cx - 24, y - 16, 48, 18); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 22, y - 14, 44, 14); ctx.font = pixFont(7); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#E52521'; ctx.fillText('⚡0!', cx, y - 12) }
  if (door && door.show && !enemies.some(e => !e.dead) && !clearT && (S.tick >> 4) & 1) label('🚪 Vào cửa!', door.c * U + U / 2, door.r * U - 4, 12, '#FFE08A');
  if (clearT) { ctx.fillStyle = '#000000aa'; ctx.fillRect(0, FH / 2 - 30, FW, 60); ctx.font = pixFont(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#86E8B9'; ctx.fillText(S.level >= NS - 1 ? 'ALL CLEAR!' : 'STAGE CLEAR!', FW / 2, FH / 2 - 6); label(S.level >= NS - 1 ? 'Phá đảo 8 màn!' : 'Chuẩn bị màn tiếp theo…', FW / 2, FH / 2 + 20, 13, '#FFE08A') }
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
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = keys.b = keys.x = 0; keys.order = [] }
function place(x, y, old) {
  const si = old && old.lvl != null ? old.lvl : 0; S.stomps = old && old.sp || 0; score = old && old.sc || 0;
  if (old && old.pb) { pl.bombs = old.pb; pl.fire = old.pf || 1; pl.speed = old.ps || 0 }
  if (si !== S.level) loadStage(si);
}
function measure() { return 1000 }
const stName = () => STAGES[S.level].bonus ? 'Màn thưởng' : 'Màn ' + STAGES[S.level].n + '/8';
const label2 = () => S.won ? '🏆 Phá đảo' : stName() + ' · 👾 ' + enemies.filter(e => !e.dead).length + ' quái · 💣' + pl.bombs + ' 🔥' + pl.fire;
function extra() { return { lvl: S.level, wk: 'bomb', lb: label2(), sc: score, pb: pl.bombs, pf: pl.fire, ps: pl.speed } }
function hud() { return (S.won ? '🏆 Phá đảo' : '💣 ' + stName()) + ' · ⭐ ' + score }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: FW, kind: 'bomb', NL: NS,
  winTitle: '🏆 Phá đảo Đặt Bom Cổ Điển — 8 màn!', winToast: '🏆 ALL CLEAR! Em đã phá đảo cả 8 màn — chuyên gia đặt bom là đây!' };
})();
