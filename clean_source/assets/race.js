/* race.js — game "Đua xe" (đường 3D giả lập kiểu arcade): đường cong, dốc lên dốc xuống, cảnh hai bên & phong cảnh chạy theo.
   5 chặng: Biển dừa · Đồng hoa · Sa mạc hoàng hôn · Núi tuyết (trơn trượt) · Thành phố đêm — xe cộ đông dần, cua gắt dần, có vết dầu.
   Xe tự chạy (tốn ⚡ theo tốc độ) · ← → lái · ↓ phanh · đâm xe/đâm cây khi đang nhanh = mất 1 mạng · 5 mạng, hết mạng chạy lại chặng.
   Cùng giao diện với các game khác: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · label() · kind = 'race' */
window.Race = (function () {
const { clamp, rng } = GC;
const NL = 5, LIVES = 5, SEG = 200, RUMBLE = 3, ROADW = 2000, CAMH = 1000, DRAW = 160, CAMD = 1 / Math.tan(50 * Math.PI / 180), PLZ = CAMH * CAMD;
const MAXSP = SEG * 44, ACCEL = MAXSP / 4.5, BRAKE = -MAXSP * 1.1, DECEL = -MAXSP / 5, OFFDEC = -MAXSP / 1.6, OFFLIM = MAXSP / 4, CENTRI = .3, PW = .28;
const STAGES = [
  { name: 'Biển dừa', ic: '🏖', bg: 'sea', sky: ['#2E9BF0', '#BFE8FF'], fog: '#CFEFFF', grass: ['#F0DCA0', '#E6CD86'], rumble: ['#FFFFFF', '#E8457A'], road: ['#8C8C9C', '#848494'], lane: '#FFFFFF', props: ['palm', 'palm', 'umbrella', 'rock'], traffic: 10, curve: 3, hill: 30, oil: 0, grip: 1, len: 1100, fogD: 3 },
  { name: 'Đồng hoa', ic: '🌼', bg: 'hills', sky: ['#62B8FF', '#E8F7FF'], fog: '#E8F7FF', grass: ['#5CCB4C', '#4CBB3E'], rumble: ['#FFFFFF', '#FFB627'], road: ['#7A7A88', '#727280'], lane: '#FFFFFF', props: ['tree', 'tree', 'bush', 'flower', 'house'], traffic: 16, curve: 4, hill: 45, oil: 4, grip: 1, len: 1250, fogD: 3 },
  { name: 'Sa mạc hoàng hôn', ic: '🏜', bg: 'mesa', sky: ['#5B2A86', '#FF8A5C'], fog: '#FFB48A', grass: ['#E8A060', '#DC9254'], rumble: ['#FFFFFF', '#C83A3A'], road: ['#6E6070', '#665868'], lane: '#FFE08A', props: ['cactus', 'cactus', 'rock', 'skull'], traffic: 22, curve: 5, hill: 60, oil: 8, grip: 1, len: 1400, fogD: 4 },
  { name: 'Núi tuyết', ic: '❄️', bg: 'snow', sky: ['#8EC8F5', '#F2FAFF'], fog: '#F2FAFF', grass: ['#F4F8FF', '#E2ECF8'], rumble: ['#FFFFFF', '#3A7BD5'], road: ['#9AA4B4', '#929CAC'], lane: '#FFFFFF', props: ['pine', 'pine', 'snowman', 'rock'], traffic: 26, curve: 6, hill: 60, oil: 10, grip: .6, len: 1500, fogD: 6 },
  { name: 'Thành phố đêm', ic: '🌃', bg: 'city', sky: ['#070A24', '#3A2470'], fog: '#2A1E50', grass: ['#2A2440', '#24203A'], rumble: ['#FF4DD2', '#38E8FF'], road: ['#3A3A4A', '#34344A'], lane: '#FFE135', props: ['building', 'building', 'lamp'], traffic: 34, curve: 6, hill: 40, oil: 12, grip: 1, len: 1650, fogD: 7 }];
const LVS = {   // tốn ⚡ cân đối với các game khác: chạy hết tốc lực, 1 câu đúng (100⚡) ≈ 10 · 8 · 6,5 giây
  1: { len: .8, traffic: .65, carSp: .9, cost: { drive: .167, can: 8, hurt: 0 } },
  2: { len: 1, traffic: 1, carSp: 1, cost: { drive: .208, can: 8, hurt: 0 } },
  3: { len: 1.15, traffic: 1.35, carSp: 1.08, cost: { drive: .256, can: 8, hurt: 0 } } };
let LVC = LVS[2], COST = LVC.cost;
const S = { energy: 0, cap: 0, running: false, over: false, fz: 0, sh: 0, color: '#E8457A', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, maxAlt: 0, won: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 0, y: 0, face: 1 };
const keys = { l: 0, r: 0, u: 0, d: 0 };
let seed0 = 1, lvSel = 2, segs = [], cars = [], finishZ = 0, pos = 0, plX = 0, speed = 0, phase = 'count', phT = 0, inv = 0, spin = 0, skyOff = 0, smoke = [], emptyT = 0, bg = null, passed = 0, best = 0, banner = null;
let cv, ctx, stage, cw = 0, ch = 0, dpr = 1, VW = 0, VH = 0, room = 66;

/* ═════ dựng đường ═════ */
const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
function addSeg(curve, y) {
  const n = segs.length;
  segs.push({ index: n, p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} }, curve, sprites: [], dark: Math.floor(n / RUMBLE) % 2, clip: 0 });
}
const easeIn = (a, b, p) => a + (b - a) * Math.pow(p, 2), easeInOut = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + .5);
function addRoad(enter, hold, leave, curve, y) {
  const sy = lastY(), ey = sy + y * SEG, tot = enter + hold + leave;
  for (let n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeInOut(sy, ey, n / tot));
  for (let n = 0; n < hold; n++) addSeg(curve, easeInOut(sy, ey, (enter + n) / tot));
  for (let n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, (enter + hold + n) / tot));
}
function buildTrack(li) {
  const st = STAGES[li], r0 = rng(seed0 * 41 + li * 733 + lvSel * 19), R = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), sg = () => r0() < .5 ? -1 : 1;
  segs = []; const target = Math.round(st.len * LVC.len);
  addRoad(10, 40, 10, 0, 0);   // vạch xuất phát
  while (segs.length < target) {
    const k = r0(), c = R(1.5, st.curve) * sg(), h = R(10, st.hill) * sg();
    if (k < .2) addRoad(RI(20, 40), RI(20, 50), RI(20, 40), 0, r0() < .5 ? h : 0);
    else if (k < .55) addRoad(RI(15, 35), RI(25, 60), RI(15, 35), c, r0() < .4 ? h : 0);
    else if (k < .75) { addRoad(15, 30, 15, c, 0); addRoad(15, 30, 15, -c, r0() < .5 ? h : 0) }   // khúc cua chữ S
    else addRoad(RI(10, 25), RI(15, 30), RI(10, 25), r0() < .5 ? c * .5 : 0, h * 1.2);   // dốc
  }
  addRoad(20, 30, 20, 0, -lastY() / SEG);   // về đường bằng trước đích
  finishZ = segs.length * SEG; addRoad(0, DRAW + 60, 0, 0, 0);
  // cảnh hai bên đường
  for (let n = 20; n < segs.length - 20; n += RI(3, 6)) {
    const k = st.props[Math.floor(r0() * st.props.length)], side = sg();
    if (k === 'building') { segs[n].sprites.push({ k, offset: side * R(1.9, 3.2), w: 2.2 + r0() * .8 }); continue }
    segs[n].sprites.push({ k, offset: side * R(1.25, 2.6), w: PROP[k].w });
  }
  if (st.bg === 'city') for (let n = 15; n < segs.length; n += 12) { segs[n].sprites.push({ k: 'lamp', offset: -1.18, w: PROP.lamp.w }); segs[n].sprites.push({ k: 'lamp', offset: 1.18, w: PROP.lamp.w }) }
  const words = ['GOOD LUCK!', 'ENGLISH!', 'MS NENE', 'CÔ CHÍ NÊN', 'FASTER!', 'YOU CAN!', 'WELL DONE!', 'KEEP GOING!'];
  for (let n = 60, i = 0; n < finishZ / SEG - 40; n += RI(90, 140), i++) segs[n].sprites.push({ k: 'board', text: words[(i + li) % words.length], offset: (i % 2 ? 1 : -1) * 1.35, w: 1.3 });
  // vết dầu + bình ⚡ trên đường
  for (let i = 0; i < Math.round(st.oil * LVC.traffic); i++) { const n = RI(80, Math.floor(finishZ / SEG) - 30); segs[n].sprites.push({ k: 'oil', offset: R(-.7, .7), w: .4, road: true }) }
  for (let n = 50; n < finishZ / SEG - 20; n += RI(55, 90)) segs[n].sprites.push({ k: 'can', offset: R(-.7, .7), w: .16, road: true });
  // xe cộ
  cars = []; const nCar = Math.round(st.traffic * LVC.traffic);
  for (let i = 0; i < nCar; i++) {
    const truck = r0() < .25, lane = [-.66, 0, .66][RI(0, 2)];
    cars.push({ z: R(40, finishZ / SEG - 10) * SEG, offset: lane, lane, speed: MAXSP * R(.25, .55) * LVC.carSp * (1 + li * .04), k: truck ? 'truck' : 'car', col: GC.pick(['#3C7CF0', '#2DB84B', '#FFB627', '#F2F2F2', '#9B5CE0', '#FF7A1A']), w: truck ? .38 : .3, t: R(0, 9) });
  }
  bg = null;
}
const findSeg = z => segs[Math.min(segs.length - 1, Math.max(0, Math.floor(z / SEG)))];
const overlap = (x1, w1, x2, w2, p) => { const h = (p || 1) / 2; return !(x1 + w1 * h < x2 - w2 * h || x1 - w1 * h > x2 + w2 * h) };
function loadStage(li) {
  S.level = li; buildTrack(li); pos = 0; plX = 0; speed = 0; inv = 0; spin = 0; passed = 0; smoke = [];
  phase = 'count'; phT = 240; banner = { t: 220, w: 'CHẶNG ' + (li + 1), text: STAGES[li].ic + ' ' + STAGES[li].name };
  GC.music.hush(false); GC.music.scene('play', true);
}
const prog = () => S.won ? 1 : clamp((S.level + clamp(pos / finishZ, 0, 1)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ mỗi khung hình ═════ */
function step() {
  S.tick++; const dt = 1 / 60;
  for (const s of smoke) { s.x += s.vx; s.y += s.vy; s.l-- } smoke = smoke.filter(s => s.l > 0);
  for (const c of cars) stepCar(c, dt);
  if (phase === 'count') { if (phT % 60 === 0 && phT > 0) GC.tone(phT > 60 ? 520 : 1040, .18, 'square', .06); if (--phT <= 0) phase = 'race'; GC.music.motor && GC.music.motor(.08); return }
  if (phase === 'over') { speed = Math.max(0, speed - MAXSP * dt); pos += speed * dt; if (--phT <= 0) { S.lives = LIVES; loadStage(S.level); S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chạy lại Chặng ' + (S.level + 1) + ' (không phải từ Chặng 1) — có ' + LIVES + ' mạng mới, cố lên!') } return }
  if (phase === 'finish') { speed = Math.max(0, speed - MAXSP * .6 * dt); pos += speed * dt; GC.music.motor && GC.music.motor(speed / MAXSP * .5); if (--phT <= 0) { S.hooks.onCP && S.hooks.onCP(S.level + 1, 'stage'); if (S.level >= NL - 1) { S.won = true; phase = 'won'; S.hooks.onWin && S.hooks.onWin() } else loadStage(S.level + 1) } return }
  if (phase === 'won') return;
  if (phase === 'crash') { speed = Math.max(0, speed - MAXSP * 1.5 * dt); pos += speed * dt; if (S.tick % 3 === 0) puff(VW / 2, VH - 40, '#8A8A9A'); if (--phT <= 0) afterCrash(); GC.music.motor && GC.music.motor(0); return }
  const st = STAGES[S.level], sp = speed / MAXSP, plSeg = findSeg(pos + PLZ), dx = dt * 2 * sp * st.grip;
  const can = S.energy > 0 && !frozen();
  if (inv) inv--;
  // lái
  if (spin > 0) { spin--; plX += Math.sin(spin * .4) * .03 } else { if (keys.l) plX -= dx; if (keys.r) plX += dx }
  plX -= dx * sp * plSeg.curve * CENTRI / st.grip * (st.grip < 1 ? 1.15 : 1);
  if (keys.d) speed += BRAKE * dt;
  else if (can) { speed += ACCEL * dt; use(COST.drive * Math.max(.25, sp)) }
  else speed += DECEL * 2 * dt;   // hết xăng: xe chậm dần rồi dừng
  const off = plX < -1 || plX > 1;
  if (off && speed > OFFLIM) speed += OFFDEC * dt;
  plX = clamp(plX, -2.4, 2.4); speed = clamp(speed, 0, MAXSP);
  pos += speed * dt; skyOff += plSeg.curve * sp * .0012;
  // va chạm cảnh hai bên (khi ra khỏi đường)
  const seg2 = findSeg(pos + PLZ);
  for (const s of seg2.sprites) {
    if (s.road) {   // vết dầu / bình ⚡ trên đường
      if (s.got || !overlap(plX, PW, s.offset, s.w)) continue;
      if (s.k === 'can') { s.got = true; S.energy += COST.can; GC.sfx('coin'); S.hooks.onBat && S.hooks.onBat(COST.can, 'can') }
      else if (!spin && !inv) { spin = 50; speed *= .7; GC.sfx('ice'); S.hooks.onPower && S.hooks.onPower('r_oil') }
      continue;
    }
    if (!off || s.k === 'lamp' && Math.abs(plX) < 1.05) continue;
    const sw = s.w, cx = s.offset + sw / 2 * (s.offset > 0 ? 1 : -1);
    if (overlap(plX, PW, cx, sw * .8)) { if (speed > MAXSP * .3 && !inv) return crash('tree'); speed = Math.min(speed, MAXSP * .1); pos = Math.max(0, pos - SEG * .3) }
  }
  // va chạm xe
  for (const c of cars) {
    const dz = c.z - (pos + PLZ);
    if (dz < -SEG * .6 || dz > SEG * .9 || !overlap(plX, PW, c.offset, c.w, .85) || speed <= c.speed) continue;
    if (inv) continue;
    if (speed - c.speed > MAXSP * .33) return crash('car');
    speed = c.speed * .7; pos = c.z - PLZ - SEG; GC.sfx('bump');
  }
  // vượt xe (đếm)
  passed = cars.filter(c => c.z < pos + PLZ).length;
  // đích
  if (pos + PLZ >= finishZ) { phase = 'finish'; phT = 170; GC.sfx('flag'); GC.music.hush(true); setTimeout(() => GC.music.hush(false), 2600) }
  GC.music.motor && GC.music.motor(.1 + sp * .9);
  pl.x = Math.round(plX * 1000); pl.y = Math.round(pos);
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && speed < MAXSP * .05 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 700);
}
function stepCar(c, dt) {   // xe khác: chạy theo làn, thấy em ở ngay sau thì né sang làn bên
  c.t += dt; const dz = c.z - (pos + PLZ);
  if (dz > 0 && dz < SEG * 18 && speed > c.speed && overlap(plX, PW, c.offset, c.w, 1.2) && phase === 'race') { const to = c.offset > plX ? 1 : -1; c.lane = clamp(c.lane + to * .66, -.66, .66) }
  else if (Math.random() < .0015) c.lane = [-.66, 0, .66][Math.floor(Math.random() * 3)];
  c.offset += clamp(c.lane - c.offset, -.012, .012);
  c.z += c.speed * dt; if (c.z > finishZ + SEG * 40) c.z = Math.max(pos + PLZ + DRAW * SEG * .9, SEG * 40);   // xe đã về đích → quay lại phía trước em
}
function crash(why) {
  phase = 'crash'; phT = 100; S.hits++; S.falls++; speed *= .5; GC.sfx('bossDown');
  for (let i = 0; i < 14; i++) puff(VW / 2 + (Math.random() - .5) * 60, VH - 50, i % 2 ? '#FF7A1A' : '#FFD23F');
  S.hooks.onPower && S.hooks.onPower(why === 'car' ? 'r_car' : 'r_tree');
}
function afterCrash() {
  S.lives--;
  if (S.lives <= 0) { phase = 'over'; phT = 170; GC.sfx('bad'); GC.music.hush(true); return }
  plX = clamp(plX, -.6, .6); speed = 0; inv = 150; phase = 'race';
  S.hooks.onFall && S.hooks.onFall(0, '💥 Tông xe rồi! 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · lái cẩn thận nhé!');
}
function puff(x, y, col) { smoke.push({ x, y, vx: (Math.random() - .5) * 2, vy: -1 - Math.random() * 1.5, l: 40, L: 40, r: 6 + Math.random() * 8, c: col }) }

/* ═════ hình ảnh: cây, nhà, xe… vẽ pixel sẵn vào canvas nhỏ ═════ */
function cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, (col, a, b, ww, hh) => { x.fillStyle = col; x.fillRect(a, b, ww || 1, hh || 1) }); return c }
const PROP = {
  palm: { w: 1.1 }, umbrella: { w: .7 }, rock: { w: .7 }, tree: { w: 1.0 }, bush: { w: .6 }, flower: { w: .5 }, house: { w: 1.4 }, cactus: { w: .5 }, skull: { w: .45 },
  pine: { w: 1.0 }, snowman: { w: .45 }, lamp: { w: .22 }, building: { w: 2.4 }, board: { w: 1.3 }, oil: { w: .4 }, can: { w: .16 } };
const IMG = {};
function img(k, extra) {
  const id = k + (extra || ''); if (IMG[id]) return IMG[id];
  const night = STAGES[S.level].bg === 'city';
  let c;
  if (k === 'palm') c = cnv(40, 64, (x, f) => { for (let i = 0; i < 40; i++) f(i % 6 < 3 ? '#8A5A2E' : '#A8743E', 18 + Math.round(Math.sin(i / 12) * 3), 24 + i, 5, 1); [[-1, 0], [1, 0], [-.7, -.6], [.7, -.6], [0, -1]].forEach(([dx, dy]) => { for (let j = 0; j < 16; j++) { const px = 20 + dx * j, py = 22 + dy * j * .6 + j * j * .05; f(j % 3 ? '#2DB84B' : '#1F8A3A', px - 2, py - 1, 4, 3) } }); f('#6B3A1E', 17, 21, 6, 4) });
  else if (k === 'umbrella') c = cnv(32, 36, (x, f) => { for (let i = 0; i < 16; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 16) / 16, 2)) * 15); for (let j = -w; j < w; j++) f(Math.floor((j + 16) / 5) % 2 ? '#FFFFFF' : '#E8457A', 16 + j, i + 2) } f('#6B3A1E', 15, 16, 2, 20) });
  else if (k === 'rock') c = cnv(40, 28, (x, f) => { const sn = STAGES[S.level].bg === 'snow'; x.fillStyle = '#7A7A8A'; x.beginPath(); x.ellipse(20, 20, 19, 12, 0, Math.PI, 0); x.lineTo(39, 28); x.lineTo(1, 28); x.fill(); x.fillStyle = sn ? '#FFFFFF' : '#A6A6B6'; x.beginPath(); x.ellipse(16, 14, 9, 5, 0, Math.PI, 0); x.fill() });
  else if (k === 'tree') c = cnv(48, 56, (x, f) => { f('#7A4A20', 21, 34, 6, 22); [[24, 18, 16], [14, 26, 11], [34, 26, 11], [24, 30, 12]].forEach(([a, b, r], i) => { x.fillStyle = i % 2 ? '#3FAE4A' : '#2D9A3C'; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill() }); x.fillStyle = '#8CEB7A'; x.beginPath(); x.arc(19, 12, 5, 0, 7); x.fill(); f('#FF5A5A', 15, 24, 3, 3); f('#FF5A5A', 30, 18, 3, 3) });
  else if (k === 'bush') c = cnv(40, 24, (x, f) => { [[10, 16, 9], [20, 12, 11], [30, 16, 9]].forEach(([a, b, r]) => { x.fillStyle = '#2D9A3C'; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill() }); f('#FFE08A', 14, 10, 2, 2); f('#FF7EB6', 24, 8, 2, 2); f('#FFFFFF', 30, 13, 2, 2) });
  else if (k === 'flower') c = cnv(32, 24, (x, f) => { for (let i = 0; i < 7; i++) { const a = 3 + i * 4, b = 8 + (i % 3) * 4; f('#2DB84B', a + 1, b + 2, 1, 22 - b); const col = ['#FFE135', '#FF7EB6', '#FFFFFF', '#9B7BFF'][i % 4]; f(col, a - 1, b - 1, 4, 4); f('#FF9A1A', a, b, 2, 2) } });
  else if (k === 'house') c = cnv(56, 48, (x, f) => { f('#FFF1D6', 6, 20, 44, 28); x.fillStyle = '#E8457A'; x.beginPath(); x.moveTo(2, 22); x.lineTo(28, 2); x.lineTo(54, 22); x.fill(); f('#8A5A2E', 24, 32, 9, 16); f('#7FD6FF', 10, 28, 9, 8); f('#7FD6FF', 38, 28, 9, 8); f('#FFFFFF', 14, 28, 1, 8); f('#FFFFFF', 42, 28, 1, 8) });
  else if (k === 'cactus') c = cnv(24, 48, (x, f) => { f('#2D9A3C', 9, 4, 7, 44); f('#2D9A3C', 2, 16, 5, 14); f('#2D9A3C', 2, 28, 9, 4); f('#2D9A3C', 18, 12, 5, 12); f('#2D9A3C', 14, 22, 9, 4); f('#5CCB4C', 11, 6, 2, 40); f('#FF7EB6', 10, 2, 5, 3) });
  else if (k === 'skull') c = cnv(28, 18, (x, f) => { f('#F2EAD8', 4, 4, 20, 10); f('#F2EAD8', 0, 6, 4, 3); f('#F2EAD8', 24, 6, 4, 3); f('#3A2A20', 8, 7, 4, 3); f('#3A2A20', 16, 7, 4, 3); f('#F2EAD8', 10, 14, 8, 4) });
  else if (k === 'pine') c = cnv(40, 64, (x, f) => { f('#6B3A1E', 17, 50, 6, 14); for (let i = 0; i < 4; i++) { const top = 4 + i * 11, w = 8 + i * 5; x.fillStyle = '#1F6E49'; x.beginPath(); x.moveTo(20, top); x.lineTo(20 - w, top + 16); x.lineTo(20 + w, top + 16); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(20, top); x.lineTo(20 - w * .45, top + 7); x.lineTo(20 + w * .45, top + 7); x.fill() } });
  else if (k === 'snowman') c = cnv(24, 36, (x, f) => { x.fillStyle = '#FFFFFF'; [[12, 27, 9], [12, 13, 6]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill() }); f('#1A1A1A', 7, 2, 10, 6); f('#1A1A1A', 5, 7, 14, 2); f('#1A1A1A', 9, 11, 2, 2); f('#1A1A1A', 13, 11, 2, 2); f('#FF7A1A', 11, 14, 5, 2); f('#E8457A', 6, 18, 12, 3) });
  else if (k === 'lamp') c = cnv(16, 72, (x, f) => { f('#5A5A6E', 7, 8, 3, 64); f('#5A5A6E', 3, 6, 10, 3); const g = x.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, '#FFF7C2'); g.addColorStop(1, '#FFE13500'); x.fillStyle = g; x.fillRect(0, 0, 16, 16); f('#FFF7C2', 5, 9, 6, 2) });
  else if (k === 'building') c = cnv(64, 120, (x, f) => { const r0 = rng((+extra || 0) * 7 + 3), col = ['#2A2850', '#33305E', '#24224A', '#3A2A5E'][Math.floor(r0() * 4)]; f(col, 0, 0, 64, 120); f('#14122E', 0, 0, 64, 3); for (let r = 0; r < 14; r++)for (let cc = 0; cc < 5; cc++) if (r0() < .55) f(r0() < .15 ? '#FF7EB6' : r0() < .3 ? '#7FD6FF' : '#FFE08A', 5 + cc * 12, 8 + r * 8, 6, 4); if (r0() < .6) { f('#FF4DD2', 6, 2, 52, 2) } });
  else if (k === 'board') c = cnv(96, 56, (x, f) => { f('#5A5A6E', 14, 34, 4, 22); f('#5A5A6E', 78, 34, 4, 22); f(night ? '#FF4DD2' : '#FFFFFF', 0, 0, 96, 36); f(night ? '#1A1033' : '#2E9BF0', 3, 3, 90, 30); x.font = '800 13px Nunito,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = night ? '#38E8FF' : '#FFFFFF'; x.fillText(String(extra).replace(/\d+$/, ''), 48, 19) });
  else if (k === 'oil') c = cnv(40, 12, (x) => { x.fillStyle = '#14141E'; x.beginPath(); x.ellipse(20, 6, 19, 5, 0, 0, 7); x.fill(); x.fillStyle = '#5A3A8A'; x.beginPath(); x.ellipse(14, 5, 6, 2, 0, 0, 7); x.fill() });
  else if (k === 'can') c = cnv(16, 22, (x, f) => { f('#1A1A1A', 2, 2, 12, 20); f('#FFD23F', 3, 3, 10, 18); f('#1A1A1A', 5, 0, 6, 3); x.fillStyle = '#E8457A'; x.beginPath(); x.moveTo(9, 5); x.lineTo(4, 13); x.lineTo(8, 13); x.lineTo(6, 19); x.lineTo(12, 10); x.lineTo(8, 10); x.fill() });
  else if (k === 'car' || k === 'truck' || k === 'me') c = carImg(k, extra);
  return IMG[id] = c;
}
function carImg(k, col) {   // xe nhìn từ phía sau (pixel)
  const dk = shade(col, -.35), lt = shade(col, .3);
  if (k === 'truck') return cnv(44, 40, (x, f) => { f('#1A1A1A', 3, 34, 9, 6); f('#1A1A1A', 32, 34, 9, 6); f(col, 1, 0, 42, 32); f(dk, 1, 28, 42, 6); f(lt, 3, 2, 38, 2); f(dk, 21, 4, 2, 22); f('#C8C8D4', 2, 33, 40, 3); f('#FF2A2A', 2, 26, 5, 4); f('#FF2A2A', 37, 26, 5, 4); f('#FFE08A', 18, 30, 8, 2) });
  return cnv(40, 26, (x, f) => {
    f('#1A1A1A', 2, 18, 8, 8); f('#1A1A1A', 30, 18, 8, 8);
    f(col, 0, 9, 40, 12); f(dk, 0, 17, 40, 4); f(col, 7, 2, 26, 8); f(lt, 8, 2, 24, 1);
    f('#2A3A5E', 10, 4, 20, 5); f('#7FB6FF', 11, 4, 6, 2);
    f('#FF2A2A', 2, 11, 7, 3); f('#FF2A2A', 31, 11, 7, 3); f('#FFE08A', 3, 11, 2, 1); f('#FFE08A', 35, 11, 2, 1);
    f('#C8C8D4', 0, 20, 40, 2); f('#FFFFFF', 15, 14, 10, 3); f('#1A1A1A', 16, 15, 8, 1);
    if (k === 'me') { f(dk, 4, 0, 32, 2); f(dk, 6, 2, 2, 2); f(dk, 32, 2, 2, 2) }   // cánh gió xe đua
  });
}
function shade(h, k) { const c = parseInt(h.slice(1), 16), ch = s => clamp(Math.round(k < 0 ? s * (1 + k) : s + (255 - s) * k), 0, 255); return '#' + [c >> 16, (c >> 8) & 255, c & 255].map(ch).map(v => v.toString(16).padStart(2, '0')).join('') }

/* ═════ phong cảnh xa (vẽ sẵn, cuộn theo khúc cua) ═════ */
function bgLayers() {
  const st = STAGES[S.level], W = 1024, H = 220, t = st.bg;
  const far = cnv(W, H, (x, f) => {
    if (t === 'sea') { x.fillStyle = '#2A7FD4'; x.fillRect(0, H - 34, W, 34); x.fillStyle = '#9FD8FF'; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % W, H - 30 + (i * 13) % 26, 18, 2); [[180, 40, 90], [620, 30, 140], [880, 26, 70]].forEach(([a, h, w]) => { x.fillStyle = '#4FA8A0'; x.beginPath(); x.ellipse(a, H - 34, w, h, 0, Math.PI, 0); x.fill() }) }
    else if (t === 'hills') { [['#8CC8E8', 90, 1], ['#6FBF73', 60, 2]].forEach(([c, hh, k]) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= W; i += 8) x.lineTo(i, H - hh - Math.sin(i / (90 * k)) * 26 - Math.sin(i / 37) * 6); x.lineTo(W, H); x.fill() }) }
    else if (t === 'mesa') { x.fillStyle = '#FFD86B'; x.beginPath(); x.arc(W * .62, H - 40, 70, 0, 7); x.fill(); x.fillStyle = '#FF8A5C'; for (let i = 0; i < 5; i++) x.fillRect(W * .62 - 72, H - 60 + i * 9, 144, 3); x.fillStyle = '#6A2A6E'; [[60, 120, 70], [300, 200, 95], [520, 90, 60], [760, 220, 110], [960, 100, 75]].forEach(([a, w, h]) => { x.fillRect(a - w / 2, H - h, w, h); x.fillRect(a - w / 2 - 14, H - h + 18, w + 28, h - 18) }) }
    else if (t === 'snow') { [[0, 150], [200, 190], [420, 140], [640, 200], [860, 160], [1024, 150]].forEach(([a, h], i, A) => { if (i === A.length - 1) return; const b = A[i + 1][0], m = (a + b) / 2; x.fillStyle = '#7A9CC8'; x.beginPath(); x.moveTo(a - 60, H); x.lineTo(m, H - h); x.lineTo(b + 60, H); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(m, H - h); x.lineTo(m - h * .22, H - h * .72); x.lineTo(m - h * .05, H - h * .78); x.lineTo(m + h * .08, H - h * .7); x.lineTo(m + h * .22, H - h * .72); x.fill() }) }
    else { for (let i = 0; i < 60; i++) { x.fillStyle = '#FFFFFF'; x.globalAlpha = .4 + (i % 3) * .2; x.fillRect((i * 173) % W, (i * 61) % (H - 90), 2, 2) } x.globalAlpha = 1; x.fillStyle = '#FFF4C2'; x.beginPath(); x.arc(W * .8, 40, 22, 0, 7); x.fill(); x.fillStyle = '#3A2470'; x.beginPath(); x.arc(W * .8 + 9, 34, 20, 0, 7); x.fill();
      const r0 = rng(77); for (let a = 0; a < W; a += 26 + Math.floor(r0() * 20)) { const w = 22 + r0() * 30, h = 40 + r0() * 110; x.fillStyle = '#1A1640'; x.fillRect(a, H - h, w, h); for (let yy = H - h + 6; yy < H - 4; yy += 8)for (let xx = a + 3; xx < a + w - 4; xx += 7) if (r0() < .4) { x.fillStyle = r0() < .2 ? '#FF7EB6' : '#FFE08A'; x.fillRect(xx, yy, 3, 3) } } }
  });
  const near = cnv(W, 120, (x, f) => {
    if (t === 'sea' || t === 'hills') for (let i = 0; i < 9; i++) { const a = i * 120 + 30, h = 18 + (i % 3) * 10; x.fillStyle = t === 'sea' ? '#3FAE4A' : '#2D9A3C'; x.beginPath(); x.ellipse(a, 120, 70, h, 0, Math.PI, 0); x.fill() }
    else if (t === 'snow') for (let i = 0; i < 30; i++) { const a = i * 36 + 10, h = 26 + (i * 7) % 20; x.fillStyle = '#2D5A50'; x.beginPath(); x.moveTo(a, 120 - h); x.lineTo(a - 10, 120); x.lineTo(a + 10, 120); x.fill() }
    else if (t === 'mesa') for (let i = 0; i < 16; i++) { x.fillStyle = '#B05A4A'; x.beginPath(); x.ellipse(i * 70, 120, 50, 12 + (i % 3) * 6, 0, Math.PI, 0); x.fill() }
  });
  const sky = cnv(4, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]); x.fillStyle = g; x.fillRect(0, 0, 4, 256) });
  const clouds = cnv(W, 120, (x) => { if (t === 'city') return; for (let i = 0; i < 6; i++) { const a = i * 180 + 40, b = 20 + (i * 37) % 70; x.fillStyle = t === 'mesa' ? '#FFB48A' : '#FFFFFF'; x.globalAlpha = .9; [[0, 0, 26], [22, 4, 20], [-22, 6, 18], [8, -10, 18]].forEach(([dx, dy, r]) => { x.beginPath(); x.arc(a + dx, b + dy, r, 0, 7); x.fill() }) } x.globalAlpha = 1 });
  return { far, near, sky, clouds };
}

/* ═════ vẽ ═════ */
function project(p, camX, camY, camZ) {
  p.camera.x = -camX; p.camera.y = (p.world.y || 0) - camY; p.camera.z = p.world.z - camZ;
  p.screen.scale = CAMD / p.camera.z;
  p.screen.x = Math.round(VW / 2 + p.screen.scale * p.camera.x * VW / 2);
  p.screen.y = Math.round(VH / 2 - p.screen.scale * p.camera.y * VH / 2);
  p.screen.w = Math.round(p.screen.scale * ROADW * VW / 2);
}
function poly(x1, y1, x2, y2, x3, y3, x4, y4, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill() }
function segDraw(seg, st) {
  const p1 = seg.p1.screen, p2 = seg.p2.screen, d = seg.dark, x1 = p1.x, y1 = p1.y, w1 = p1.w, x2 = p2.x, y2 = p2.y, w2 = p2.w;
  ctx.fillStyle = st.grass[d]; ctx.fillRect(0, y2, VW, y1 - y2 + 1);
  const r1 = w1 / 6, r2 = w2 / 6;
  poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, st.rumble[d]); poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, st.rumble[d]);
  const fin = seg.index * SEG >= finishZ && seg.index * SEG < finishZ + SEG * 3 || seg.index >= 8 && seg.index < 11;
  if (fin) { for (let k = 0; k < 8; k++) { const a = -1 + k / 4, b = a + .25; poly(x1 + w1 * a, y1, x1 + w1 * b, y1, x2 + w2 * b, y2, x2 + w2 * a, y2, (k + seg.index) % 2 ? '#FFFFFF' : '#1A1A1A') } }
  else poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, st.road[d]);
  if (!d && !fin) { const l1 = w1 / 40, l2 = w2 / 40; for (const k of [-1 / 3, 1 / 3]) poly(x1 + w1 * k * 2 - l1, y1, x1 + w1 * k * 2 + l1, y1, x2 + w2 * k * 2 + l2, y2, x2 + w2 * k * 2 - l2, y2, st.lane) }
  if (seg.fog < 1) { ctx.globalAlpha = 1 - seg.fog; ctx.fillStyle = st.fog; ctx.fillRect(0, y2, VW, y1 - y2 + 1); ctx.globalAlpha = 1 }
}
function spr(im, w, scale, dx, dy, offX, offY, clipY, alpha) {
  const dw = w * scale * ROADW * VW / 2, dh = dw * im.height / im.width; if (dw < 1 || dw > VW * 4) return;
  dx += dw * offX; dy += dh * offY;
  const clipH = clipY ? Math.max(0, dy + dh - clipY) : 0; if (clipH >= dh) return;
  ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.drawImage(im, 0, 0, im.width, im.height * (1 - clipH / dh), dx, dy, dw, dh - clipH); ctx.globalAlpha = 1;
}
function draw() {
  if (!segs.length) return;
  const st = STAGES[S.level]; if (!bg) bg = bgLayers();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg.sky, 0, 0, VW, VH);
  const base = findSeg(pos), basePct = (pos % SEG) / SEG, plSeg = findSeg(pos + PLZ), plPct = ((pos + PLZ) % SEG) / SEG, plY = plSeg.p1.world.y + (plSeg.p2.world.y - plSeg.p1.world.y) * plPct;
  const hz = VH / 2 - plY / 600, layer = (im, k, y, h, a) => { const w = Math.max(VW, 900) * 1.4, o = (((skyOff * k) % 1) + 1) % 1 * w; ctx.globalAlpha = a || 1; for (let i = -1; i < 2; i++) ctx.drawImage(im, i * w - o, y, w, h); ctx.globalAlpha = 1 };
  ctx.imageSmoothingEnabled = true;
  layer(bg.clouds, 300, hz - VH * .42, VH * .3, 1); layer(bg.far, 600, hz - VH * .3 + 2, VH * .3); layer(bg.near, 1200, hz - VH * .12 + 2, VH * .12);
  ctx.imageSmoothingEnabled = false;
  // đường: từ gần ra xa, cắt bớt phần bị đồi che
  let maxy = VH, x = 0, dx = -(base.curve * basePct);
  const n0 = base.index;
  for (let n = 0; n < DRAW; n++) {
    const seg = segs[n0 + n]; if (!seg) break;
    seg.fog = 1 / Math.pow(Math.E, Math.pow(n / DRAW, 2) * st.fogD); seg.clip = maxy;
    project(seg.p1, plX * ROADW - x, plY + CAMH, pos); project(seg.p2, plX * ROADW - x - dx, plY + CAMH, pos);
    x += dx; dx += seg.curve;
    if (seg.p1.camera.z <= CAMD || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) { seg.vis = false; continue }
    seg.vis = true; segDraw(seg, st); maxy = seg.p1.screen.y;
  }
  // cảnh, xe khác, bạn cùng lớp: từ xa vào gần
  const byIdx = {}; for (const c of cars) { const i = Math.floor(c.z / SEG); if (i >= n0 && i < n0 + DRAW) (byIdx[i] = byIdx[i] || []).push(c) }
  const ghostBy = {}, wk = 'race' + S.level, now = performance.now();
  for (const id in S.ghosts) {   // xe các bạn: đoán vị trí giữa 2 lần cập nhật (≈ 0,3 giây/lần) cho chạy mượt
    const g = S.ghosts[id]; if (g.wk !== wk || g.ty == null) continue;
    if (g.ty !== g._ly) { if (g._ly != null && now > g._lt) g._v = clamp((g.ty - g._ly) / ((now - g._lt) / 1000), 0, MAXSP * 1.1); if (g._ly == null || Math.abs(g.ty - g._ly) > SEG * 60) g._v = 0; g._ly = g.ty; g._lt = now }
    const tz = g.ty + (g._v || 0) * Math.min(.6, (now - g._lt) / 1000); g.rz = g.rz == null || Math.abs(tz - g.rz) > SEG * 40 ? tz : g.rz + (tz - g.rz) * .35; g.rx = g.rx == null ? g.tx : g.rx + (g.tx - g.rx) * .25;
    const i = Math.floor((g.rz + PLZ) / SEG); if (i > n0 && i < n0 + DRAW) (ghostBy[i] = ghostBy[i] || []).push(g);
  }
  for (let n = DRAW - 1; n > 0; n--) {
    const seg = segs[n0 + n]; if (!seg || seg.p1.camera.z <= CAMD) continue;
    const sc = seg.p1.screen.scale, sx = seg.p1.screen.x, sy = seg.p1.screen.y;
    for (const s of seg.sprites) {
      if (s.got) continue;
      const im = img(s.k, s.k === 'board' ? s.text + S.level : s.k === 'building' ? seg.index % 12 : s.k === 'rock' ? S.level : '');
      const ox = s.road ? -.5 : s.offset < 0 ? -1 : 0;
      spr(im, s.w, sc, sx + sc * s.offset * ROADW * VW / 2, sy, ox, s.k === 'oil' ? -.6 : -1, seg.clip);
    }
    for (const c of byIdx[seg.index] || []) { const pct = (c.z % SEG) / SEG, scc = sc + (seg.p2.screen.scale - sc) * pct, xx = sx + (seg.p2.screen.x - sx) * pct + scc * c.offset * ROADW * VW / 2, yy = sy + (seg.p2.screen.y - sy) * pct; spr(img(c.k, c.col), c.w, scc, xx, yy, -.5, -1, seg.clip) }
    for (const g of ghostBy[seg.index] || []) { const pct = ((g.rz + PLZ) % SEG) / SEG, scc = sc + (seg.p2.screen.scale - sc) * pct, yy = sy + (seg.p2.screen.y - sy) * pct, xx = sx + (seg.p2.screen.x - sx) * pct + scc * (g.rx / 1000) * ROADW * VW / 2, dw = PW * scc * ROADW * VW / 2; spr(img('me', g.c || '#FF7EB6'), PW, scc, xx, yy, -.5, -1, seg.clip, .82); if (dw > 14 && yy < seg.clip) label(g.n, xx, yy - dw * .62 - 4, Math.max(10, Math.min(15, dw / 5)), '#fff', g.c ? shade(g.c, -.5) : '#1A1033') }
  }
  // xe của em
  const bounce = speed > 10 ? Math.round(Math.sin(S.tick * .8) * 1.5 * (speed / MAXSP)) : 0, dwMe = PW * VW * .72, me = img('me', S.color), dhMe = dwMe * me.height / me.width;
  const tilt = phase === 'crash' ? Math.sin(phT * .5) * .5 : spin ? Math.sin(spin * .5) * .25 : (keys.l ? -.05 : keys.r ? .05 : 0);
  if (!(inv && (S.tick >> 2) & 1) && phase !== 'over') { ctx.save(); ctx.translate(VW / 2, VH - 12 - dhMe / 2 + bounce); ctx.rotate(tilt); ctx.drawImage(me, -dwMe / 2, -dhMe / 2, dwMe, dhMe); ctx.restore() }
  if (frozen()) { ctx.fillStyle = '#BFE8FF88'; ctx.fillRect(VW / 2 - dwMe / 2 - 6, VH - 18 - dhMe, dwMe + 12, dhMe + 12) }
  for (const s of smoke) { ctx.globalAlpha = s.l / s.L * .7; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1.6 - s.l / s.L), 0, 7); ctx.fill() } ctx.globalAlpha = 1;
  if (S.name) label(S.name, VW / 2, VH - 18 - dhMe, 13, '#fff');
  hud(st);
}
const pixFont = n => n + 'px "Press Start 2P", monospace';
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1A1033'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function hud(st) {
  // thanh tiến độ trên cùng + vị trí các bạn
  const bw = Math.min(VW - 24, 520), bx = (VW - bw) / 2, by = 10, wk = 'race' + S.level;
  ctx.fillStyle = '#1A1033cc'; ctx.fillRect(bx - 4, by - 4, bw + 8, 22); ctx.fillStyle = '#ffffff44'; ctx.fillRect(bx, by + 5, bw, 4);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#1A1A1A' : '#FFFFFF'; ctx.fillRect(bx + bw - 8, by + i * 2, 8, 2) }
  for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== wk || g.ty == null) continue; ctx.fillStyle = g.c || '#fff'; ctx.beginPath(); ctx.arc(bx + bw * clamp(g.ty / finishZ, 0, 1), by + 7, 4, 0, 7); ctx.fill() }
  ctx.fillStyle = S.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + bw * clamp(pos / finishZ, 0, 1), by + 7, 6, 0, 7); ctx.fill(); ctx.stroke();
  // đồng hồ tốc độ
  const kmh = Math.round(speed / MAXSP * 240), r = 34, cx = VW - r - 14, cy = VH - r - 14 - (room > 100 ? 0 : 0);
  ctx.fillStyle = '#1A1033cc'; ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, 7); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff33'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
  ctx.strokeStyle = kmh > 200 ? '#FF4D7A' : '#38E8FF'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .75, Math.PI * (.75 + 1.5 * speed / MAXSP)); ctx.stroke();
  ctx.font = pixFont(11); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kmh, cx, cy - 2); ctx.font = '800 10px Nunito,sans-serif'; ctx.fillText('km/h', cx, cy + 14);
  // chặng · mạng
  const tl = (t, y, col) => { ctx.font = '800 14px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1033'; ctx.strokeText(t, 12, y); ctx.fillStyle = col; ctx.fillText(t, 12, y) };
  tl(st.ic + ' Chặng ' + (S.level + 1) + '/' + NL + ' · ' + st.name, 36, '#FFE08A');
  tl('❤️×' + S.lives + '   🚗 vượt ' + passed + '/' + cars.length + ' xe', 56, '#FFFFFF');
  // bảng xếp hạng đua (cả lớp) + bạn bám sát phía sau
  const rows = [{ n: S.name || 'Em', c: S.color, lv: S.level, z: pos, me: 1 }];
  for (const id in S.ghosts) { const g = S.ghosts[id], m = /^race(\d+)$/.exec(g.wk || ''); if (!m || g.ty == null) continue; rows.push({ n: g.n || '?', c: g.c || '#fff', lv: +m[1], z: g.rz != null && +m[1] === S.level ? g.rz : g.ty }) }
  if (rows.length > 1) {
    rows.sort((a, b) => b.lv - a.lv || b.z - a.z); const myRank = rows.findIndex(r => r.me) + 1, show = rows.slice(0, 5); if (myRank > 5) show.push(rows[myRank - 1]);
    const px = 10, py = 78, w = 172; ctx.fillStyle = '#1A1033bb'; ctx.fillRect(px, py, w, 22 + show.length * 19);
    ctx.font = '800 12px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFE08A'; ctx.fillText('🏁 Bảng đua · em hạng ' + myRank + '/' + rows.length, px + 8, py + 11);
    show.forEach((r, i) => { const y = py + 30 + i * 19, rk = rows.indexOf(r) + 1; if (r.me) { ctx.fillStyle = '#ffffff22'; ctx.fillRect(px + 2, y - 9, w - 4, 18) } ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(px + 30, y, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(rk + '.', px + 8, y); ctx.fillText(String(r.n).slice(0, 11), px + 40, y); ctx.textAlign = 'right'; ctx.fillStyle = r.lv === S.level ? '#9FE8FF' : '#C9B8FF'; ctx.fillText(r.lv === S.level ? 'C' + (r.lv + 1) + ' · ' + Math.round(clamp(r.z / finishZ, 0, 1) * 100) + '%' : 'Chặng ' + (r.lv + 1), px + w - 8, y); ctx.textAlign = 'left' });
  }
  for (const id in S.ghosts) { const g = S.ghosts[id]; if (g.wk !== 'race' + S.level || g.rz == null) continue; const dz = pos - g.rz; if (dz > 0 && dz < SEG * 14) { const xx = clamp(VW / 2 + (g.rx / 1000 - plX) * VW * .35, 60, VW - 60); ctx.globalAlpha = 1 - dz / (SEG * 14) * .6; label('⬇ ' + g.n + ' bám sát!', xx, VH - 4, 12, g.c || '#fff'); ctx.globalAlpha = 1 } }
  // chữ giữa màn hình
  if (phase === 'count') { const n = Math.ceil(phT / 60) - 1; ctx.font = pixFont(n > 0 ? 44 : 34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = '#1A1033'; const tx = n > 0 ? String(n) : 'GO!'; ctx.strokeText(tx, VW / 2, VH * .36); ctx.fillStyle = n > 0 ? '#FFE08A' : '#5CFF8A'; ctx.fillText(tx, VW / 2, VH * .36) }
  if (banner && banner.t > 0) { banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); label(banner.w + ' · ' + banner.text, VW / 2, VH * .22, 20, '#FFFFFF'); ctx.globalAlpha = 1 }
  if (phase === 'crash') label('💥 TÔNG XE!', VW / 2, VH * .36, 30, '#FF7A1A');
  if (phase === 'over') label('💀 GAME OVER — chạy lại chặng này', VW / 2, VH * .36, 22, '#FF4D7A');
  if (phase === 'finish' || phase === 'won') label(S.level >= NL - 1 ? '🏆 PHÁ ĐẢO 5 CHẶNG!' : '🏁 VỀ ĐÍCH!', VW / 2, VH * .36, 30, '#5CFF8A');
  if (S.energy <= 0 && S.running && !S.over && phase === 'race') label('⚡ HẾT XĂNG — trả lời câu hỏi để đổ xăng!', VW / 2, VH * .5, 16, '#FFE08A');
}
function resize() {
  const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
  const pad = document.getElementById('pad'), touch = pad && pad.classList.contains('on'), port = cw / ch < 1.02; room = touch && port ? 150 : 0;
  VW = cw; VH = Math.max(200, ch - room);
}
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } } else { acc = 0; GC.music.motor && GC.music.motor(0) }
  draw(); if (room) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#1A1033'; ctx.fillRect(0, VH, cw, ch - VH) }
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: ← → lái · ↓ phanh (xe tự chạy khi còn ⚡) ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ' ': 'd' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', release);
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'u'], ['bD', 'd']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  GC.music.files({ play: { synth: 'race' } }, 'race');
  loadStage(0); addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.u = keys.d = 0 }
function place(x, y, old) {
  const li = old && old.lvl != null ? old.lvl : 0; S.lives = old && old.lf || LIVES;
  if (li !== S.level) loadStage(li);
}
function measure() { return 1000 }
const label2 = () => S.won ? '🏆 Phá đảo' : 'Chặng ' + (S.level + 1) + '/' + NL + ' · 🏁 ' + Math.round(clamp(pos / (finishZ || 1), 0, 1) * 100) + '%';
function extra() { return { lvl: S.level, wk: 'race' + S.level, lb: label2(), lf: S.lives } }
function hudTxt() { return (S.won ? '🏆 Phá đảo' : '🏎 Chặng ' + (S.level + 1) + '/' + NL) + ' · ' + Math.round(speed / MAXSP * 240) + ' km/h' }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud: hudTxt, label: label2, W: 1000, kind: 'race', NL,
  _dbg: { step, draw, loadStage, cars: () => cars, segs: () => segs, phase: () => phase, st: () => ({ pos, plX, speed, finishZ, passed }), set: o => { if (o.plX != null) plX = o.plX; if (o.speed != null) speed = o.speed; if (o.pos != null) pos = o.pos } },
  winTitle: '🏆 Phá đảo Đua xe — về đích cả 5 chặng!', winToast: '🏆 PHÁ ĐẢO! Em đã về đích cả 5 chặng — tay lái lụa số 1!' };
})();
