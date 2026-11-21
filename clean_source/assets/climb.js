/* climb.js — thế giới leo núi "Đừng Nhìn Xuống" (vật lý + vẽ).
   Climb.init(canvas, stage, seed, hooks)  ·  Climb.S: trạng thái (energy, running, ghosts…)
   Kiểu Don't Look Down: đường đi kéo dài sang phải — đầu mỗi vùng là đoạn đi bộ dài, xen đảo nổi qua hố, càng lên cao càng nhiều bậc leo.
   hooks: onCP(n), onWin(), onFall(cp), onBat(n), onStomp(n), onHurt(n), onPower(k), onEmpty(), onAsk(), onFrame(ts)
   Vẽ kiểu hoạt hình như Gimkit: đảo cỏ / đảo cát viền đậm, nhân vật đội mũ bảo hộ · con vật: dê húc, cua, chim cánh cụt, nhím gai, ong, chim
   · xu (30 xu = +1 mạng) · vật phẩm có đồng hồ: 🕊️ nhảy 2 lần, 👟 nhảy cao, 🛡️ khiên, 🧲 nam châm, 🌼 hoa lửa (F bắn cầu lửa)
   · nút ⏫ NHẢY CAO (↓ / S / Shift): nhảy cao gấp đôi, tốn ⚡ hơn
   · 14 vùng, đỉnh 1000 m: Đồng cỏ · Rừng thông · Rừng hoa anh đào (cánh hoa bay) · Thác nước cầu vồng · Đảo cát · Rừng lá phong đỏ · Vách pha lê · Hang nấm phát sáng
     · Sườn tuyết · Băng nguyên cực quang (tuyết rơi dày) · Xứ sở kẹo ngọt · Đỉnh mây · Lễ hội đèn lồng · Núi lửa rồng — khó tăng dần đều theo quãng đường
   · PHẦN 2 (Climb.setPart(2), vẽ & luật riêng ở climb2.js + climb2b.js): 14 vùng mới, đỉnh 1200 m, quái mới, nhân vật mới, boss Quỷ Vương Bóng Đêm 16 máu
   · đỉnh núi: đánh BOSS RỒNG LỬA (10 máu) — giẫm đầu (−2) hoặc bắn 🔥 (−1), né lửa phun thấp/cao, hạ rồng rồi vào lâu đài cứu công chúa */
window.Climb = (function () {
const { clamp, rng } = GC;
const W = 720, G = 0.62, JV = -13.2, SPD = 4.3, SPRING = -19.5;
let ZONES = [   // top: mặt đảo · dirt: thân đảo · kind: kiểu đảo · walker: con vật đi trên đảo · fly: con vật bay · fx: hiệu ứng bay trên màn hình · sky: màu trời (trên · giữa · dưới) · mt: màu núi xa · nt: độ tối (đêm)
  { id: 'meadow', name: 'Đồng cỏ xanh', top: '#7ED957', topD: '#46A83A', dirt: '#BE8650', dirtD: '#8E5A30', dirtL: '#DCA468', kind: 'grass', deco: 'flower', walker: 'goat', fly: 'bee', fx: 'petal', fxN: 8, sky: ['#5EC0F8', '#A6DEFF', '#D8F2FF'], mt: '#8CB8E8' },
  { id: 'pine', name: 'Rừng thông', top: '#5CCB6A', topD: '#2E9A4A', dirt: '#A8743F', dirtD: '#764C26', dirtL: '#C89058', kind: 'grass', deco: 'pine', walker: 'slime', fly: 'bee', fx: 'leaf', fxN: 14, sky: ['#6CC4F8', '#B4E2FF', '#E0F4FF'], mt: '#76A6DC' },
  { id: 'sakura', name: 'Rừng hoa anh đào', top: '#FFC6DA', topD: '#F08AB0', dirt: '#B8846A', dirtD: '#86563E', dirtL: '#D8A88A', kind: 'grass', deco: 'sakura', walker: 'slime', fly: 'bee', fx: 'petal', fxN: 60, sky: ['#F7A8C8', '#FFD0E0', '#FFE8EE'], mt: '#C8A0D8' },
  { id: 'falls', name: 'Thác nước cầu vồng', top: '#8EE07A', topD: '#4CB04A', dirt: '#9C9488', dirtD: '#6E665C', dirtL: '#BCB4A8', kind: 'grass', deco: 'fern', walker: 'goat', fly: 'bird', fx: 'bubble', fxN: 22, sky: ['#48B8F0', '#9EE0FF', '#E0FAFF'], mt: '#78B0E0' },
  { id: 'sand', name: 'Đảo cát vàng', top: '#FBE7AE', topD: '#E4C27A', dirt: '#EBCB8A', dirtD: '#C99E5C', dirtL: '#FAE6B8', kind: 'sand', deco: 'shell', walker: 'crab', fly: 'bird', fx: '', fxN: 0, sky: ['#4EB8F4', '#9ED8FF', '#FFF0C8'], mt: '#9AB4DA' },
  { id: 'maple', name: 'Rừng lá phong đỏ', top: '#F8B04A', topD: '#D8782A', dirt: '#A0663C', dirtD: '#704020', dirtL: '#C88A5A', kind: 'grass', deco: 'maple', walker: 'slime', fly: 'bird', fx: 'maple', fxN: 38, sky: ['#F49A58', '#FCC890', '#FFEAD0'], mt: '#C8907A' },
  { id: 'crystal', name: 'Vách pha lê', top: '#E4D4FF', topD: '#A88AF0', dirt: '#8A70D0', dirtD: '#5A44A0', dirtL: '#B8A2F4', kind: 'crystal', deco: 'crystal', walker: 'golem', fly: 'bat', fx: 'spark', fxN: 24, sky: ['#8A70D8', '#C4B0F4', '#E8DCFF'], mt: '#9A84D8' },
  { id: 'shroom', name: 'Hang nấm phát sáng', top: '#7AE0C8', topD: '#3AA890', dirt: '#5A4A7A', dirtD: '#33285A', dirtL: '#7A6A9A', kind: 'grass', deco: 'shroom', walker: 'slime', fly: 'bat', fx: 'firefly', fxN: 30, sky: ['#141C48', '#2E2E6E', '#4E3E80'], mt: '#2E3466', nt: .75 },
  { id: 'snow', name: 'Sườn tuyết', top: '#FFFFFF', topD: '#C8DEF2', dirt: '#93AECE', dirtD: '#64809E', dirtL: '#BCD0E8', kind: 'snow', deco: 'snow', walker: 'peng', fly: 'bird', fx: 'snow', fxN: 40, sky: ['#7FB8EC', '#C8E2FA', '#F0F8FF'], mt: '#A4C4EA' },
  { id: 'aurora', name: 'Băng nguyên cực quang', top: '#F4FAFF', topD: '#B8D4EC', dirt: '#86A4CC', dirtD: '#58749C', dirtL: '#B0C8E4', kind: 'snow', deco: 'snowman', walker: 'peng', fly: 'bird', fx: 'snow', fxN: 85, sky: ['#061430', '#14325E', '#36588A'], mt: '#2A3E6E', nt: .9 },
  { id: 'candy', name: 'Xứ sở kẹo ngọt', top: '#FF9AD0', topD: '#E85AA8', dirt: '#8A5434', dirtD: '#5E3418', dirtL: '#B07A50', kind: 'candy', deco: 'candy', walker: 'slime', fly: 'bee', fx: 'sprinkle', fxN: 30, sky: ['#FF9AC8', '#FFC8E4', '#FFF0F8'], mt: '#F0A8D0' },
  { id: 'cloud', name: 'Đỉnh mây', top: '#FFE8F4', topD: '#F4B4D4', dirt: '#CDBCF4', dirtD: '#9A86D8', dirtL: '#E2D6FC', kind: 'cloud', deco: 'star', walker: 'ghost', fly: 'bird', fx: 'petal', fxN: 14, sky: ['#F59BC0', '#FFC6D8', '#FFE2E8'], mt: '#D0A8D8' },
  { id: 'lantern', name: 'Lễ hội đèn lồng', top: '#58B888', topD: '#2E8060', dirt: '#5A3A4A', dirtD: '#3A2030', dirtL: '#7A5A6A', kind: 'grass', deco: 'lantern', walker: 'ghost', fly: 'bat', fx: 'lantern', fxN: 18, sky: ['#0E0A2A', '#2A1A4A', '#6A2A4A'], mt: '#241C44', nt: 1 },
  { id: 'lava', name: 'Núi lửa rồng', top: '#5A4A50', topD: '#3A2A30', dirt: '#4A3036', dirtD: '#2A1418', dirtL: '#6A4A50', kind: 'lava', deco: 'ember', walker: 'lavablob', fly: 'imp', fx: 'ember', fxN: 34, sky: ['#2A0A24', '#7A2028', '#C8502A'], mt: '#4A1828', nt: .8 }];
let NZ = ZONES.length, TOPH = 8000, ZI = {};   // tổng độ cao đỉnh (đơn vị) = 1000 m
ZONES.forEach((z, i) => ZI[z.id] = i);
const zz = z => Math.min(4, Math.floor(z * 5 / NZ));   // vùng mới → mức khó cũ (5 mức)
/* độ khó: 1 Dễ · 2 Vừa · 3 Khó (cô chọn trên trang của cô) */
// tốn ⚡ cân đối giữa các game: 1 câu đúng (100⚡) ≈ 10 · 8 · 6,5 giây chơi liên tục (Dễ · Vừa · Khó)
const LEVELS = {
  1: { per: 10, dy: [80, 114], w: [140, 190], shrink: 12, enemy: [.3, .4, .45, .5, .55], spd: 1, crumble: 42, birdZ: 3, bird: .32, spiky: .35, ice: 0, move: .22, bat: .2, cost: { walk: .12, jump: 3, battery: 20, stomp: 10, hurt: 15 } },
  2: { per: 12, dy: [88, 118], w: [122, 168], shrink: 12, enemy: [.42, .52, .58, .62, .68], spd: 1.3, crumble: 32, birdZ: 2, bird: .38, spiky: .42, ice: .32, move: .26, bat: .14, cost: { walk: .15, jump: 3.5, battery: 20, stomp: 10, hurt: 22 } },
  3: { per: 14, dy: [94, 122], w: [108, 150], shrink: 11, enemy: [.52, .62, .68, .72, .78], spd: 1.6, crumble: 24, birdZ: 1, bird: .46, spiky: .5, ice: .42, move: .3, bat: .1, cost: { walk: .18, jump: 4, battery: 20, stomp: 10, hurt: 30 } }
};
let LV = LEVELS[2], COST = LV.cost;
const ICE = { top: '#E2F7FF', topD: '#98D4F2', dirt: '#A8D6F0', dirtD: '#6EA6D0', dirtL: '#D2EEFC', kind: 'ice', deco: 'ice' };
const PWF = { fea: 720, boot: 720, shd: 900, mag: 720, flw: 900 }, PWI = { fea: '🕊️', boot: '👟', shd: '🛡️', mag: '🧲', flw: '🌼' }, PWC = { fea: '#9AD8FF', boot: '#FF9A2A', shd: '#5AB0FF', mag: '#FF5A7A', flw: '#FF7A1A' };   // vật phẩm: thời lượng (khung hình) · biểu tượng · màu
const PW = { fea: 0, boot: 0, shd: 0, mag: 0, flw: 0 }, FB = [];   // FB: cầu lửa đang bay
let fbCool = 0, fireCls = false, BOSS = null, BF = [], FXP = [];   // BOSS: rồng · BF: lửa rồng phun · FXP: hiệu ứng bay (hoa anh đào, tuyết, tàn lửa…)
let BOSSHP = 10, PART = 1, X2 = null, ALTK = 8;   // ALTK: số đơn vị cho 1 m (P2: chia sao cho đỉnh đúng 1200 m)   // PART 2 = Leo núi P2 (climb2.js): 14 vùng mới, đỉnh 1200 m, Quỷ Vương 16 máu
const ZONES1 = ZONES;
const LIVES = 5;   // 5 mạng: rơi là mất 1 mạng · hết mạng thì lùi về trạm trước đó
const S = { energy: 0, cap: 0, rescue: 0, coins: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, lives: LIVES, bestCp: 0, maxAlt: 0, won: false, cpAt: null, now: () => Date.now(), hooks: {} };
const pl = { x: W / 2 - 17, y: -40, w: 34, h: 40, vx: 0, vy: 0, on: null, face: 1, coy: 0, buf: 0, sq: 0, walk: 0, inv: 0, kb: 0 };
const keys = { l: 0, r: 0, j: 0, jp: 0, hp: 0, fp: 0 };   // hp: nút NHẢY CAO · fp: bắn cầu lửa
const parts = [], cam = { x: 0, y: -500 };
let P = [], BAT = [], E = [], CPS = [], COINS = [], ITEMS = [], XMIN = -360, XMAX = 2000, TREES = [], TOPY = -1, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, vh = 0, emptyT = 0;

/* ═════ dựng núi (cùng seed → cả lớp cùng một ngọn núi) ═════ */
/* khoảng ngang tối đa (mép tới mép) nhảy tới được khi bậc sau cao hơn dy — chừa 20% an toàn */
function reach(dy, v) { const d = v * v - 2 * G * dy; return d <= 0 ? 0 : SPD * (v + Math.sqrt(d)) / G * .8 }
function build(seed, level) {
  LV = LEVELS[level] || LEVELS[2]; COST = LV.cost;
  const PER = LV.per, r0 = rng(seed || 7), R = (a, b) => a + r0() * (b - a), N = PER * NZ;
  P = [{ x: -360, y: 0, w: 860, h: 70, type: 'ground', z: 0, deco: [], pat: 'run' }]; BAT = []; E = []; COINS = []; ITEMS = [];
  let prev = P[0], prevSpring = false, itemGap = 3; const zc = new Array(NZ).fill(0), cap = z => Math.round(PER * (.08 + .52 * Math.pow(z / (NZ - 1), .8)) * (level === 1 ? .7 : level === 3 ? 1.25 : 1));   // số quái tối đa mỗi vùng: tăng dần đều
  for (let i = 1; i <= N; i++) {
    const z = Math.min(NZ - 1, Math.floor((i - 1) / PER)), Z0 = zz(z), cp = i % PER === 0, top = i === N, k = i % PER, behind = prev.y > -TOPH * (i / N) + 40, ahead = prev.y < -TOPH * (i / N) - 110;   // giữ đúng nhịp leo để đỉnh cao 1000 m
    // kiểu đoạn: đầu mỗi vùng là đường đi bộ dài · xen đảo nổi qua hố · càng lên cao càng nhiều bậc leo
    let pat;
    if (top || cp) pat = 'run'; else if (prevSpring) pat = 'high'; else if (prev.type === 'crumble' || prev.type === 'move') pat = 'run';   // sau đảo sụp / đảo trôi: đảo kế tiếp rộng, ngang tầm
    else { const q = r0(), runP = [.6, .44, .34, .28, .24][Z0] * (k > 0 && k < 3 ? 1.6 : 1), floatP = [.18, .22, .26, .28, .3][Z0]; pat = q < runP ? 'run' : q < runP + floatP ? 'float' : 'step'; if (behind && pat !== 'step' && !(k > 0 && k < 2)) pat = 'step'; else if (ahead && pat === 'step') pat = r0() < .5 ? 'run' : 'float' }
    let w, gx, dy;
    if (pat === 'run') { w = top ? (PART === 2 ? 900 : 760) : cp ? 260 : Math.max(200, R(250, 500) - Z0 * 30); dy = top ? 20 : R(-6, 30); gx = top ? 60 : R(46, 104) }   // đỉnh: đấu trường rộng đánh rồng
    else if (pat === 'float') { w = Math.max(72, R(82, 132) - Z0 * 6); dy = R(-22, 26); gx = R(72, 138) }
    else if (pat === 'high') { w = R(130, 180); dy = R(175, 215); gx = R(-50, 30) }
    else { w = Math.max(90, R(115, 175) - Z0 * 8); dy = R(70, 96) + Z0 * 3 + (LV.dy[0] - 88) * .3; gx = R(-w * .2, 64) }   // bậc leo: cao vừa sức (nhảy tối đa ~140)
    const far = reach(Math.max(0, dy), prevSpring ? -SPRING : -JV) * .88;   // luôn nhảy tới được
    if (gx > far) gx = far;
    if (prev.type === 'move') gx = Math.min(gx, far - prev.amp - 10);   // đảo trôi: tính cả lúc trôi xa nhất
    let type = 'plain';
    if (!cp && !top && pat !== 'run' && pat !== 'high') {   // đảo sụp chỉ khi đủ rộng
      const q = r0();
      if (Z0 >= 1 && q < LV.move) type = 'move';
      else if (Z0 >= 2 && pat === 'step' && q < LV.move + .12) { type = 'spring'; w = 100 }
      else if (Z0 >= 2 && w >= 100 && q < LV.move + .3) type = 'crumble';
      else if (ZONES[z].kind === 'snow' && r0() < LV.ice) type = 'ice';
    } else if (!cp && !top && ZONES[z].kind === 'snow' && r0() < LV.ice * .5) type = 'ice';
    const x = prev.x + prev.w + gx, y = prev.y - dy;
    const p = { x, y, w, h: 30, type, z, cp: cp ? Math.floor(i / PER) : 0, top, dx: 0, sq: 0, st: 0, t: 0, fy: 0, fv: 0, deco: [], pat };
    if (type === 'move') { p.amp = R(34, 58); p.sp = R(.014, .022); p.ph = R(0, 6.28); p.bx = p.x }
    for (let q = 0; q < 7; q++) p.deco.push(r0());
    // con vật đi tuần trên đảo (đường dài có thể 2 con) — không đặt trên trạm, lò xo, bậc trôi, bậc sụp
    let hasE = false;
    const ramp = clamp((i - 4) / (N * .8), 0, 1), eP = LV.enemy[Z0] * (.25 + .75 * ramp);   // quái tăng dần đều theo quãng đường: mấy đảo đầu không có quái
    if ((type === 'plain' || type === 'ice') && !cp && !top && i > 4 && w >= 96 && r0() < eP * (pat === 'run' ? 1.1 : .7) && zc[z] < cap(z)) {
      const nE = Z0 >= 2 && w > 340 && zc[z] + 1 < cap(z) && r0() < .2 + ramp * .4 ? 2 : 1; zc[z] += nE;
      for (let q = 0; q < nE; q++) {
        const spiky = Z0 >= 2 && r0() < LV.spiky * .3, kk = spiky ? (PART === 2 ? 'urchin' : 'spiky') : ZONES[z].walker, sz2 = X2 && X2.SZ[kk], ew = sz2 ? sz2[0] : { spiky: 36, goat: 40, crab: 38, peng: 32, slime: 34, golem: 40, ghost: 34, lavablob: 36 }[kk], v0 = R(.6, .85 + Z0 * .12) * (1 + (LV.spd - 1) * ramp) * (kk === 'golem' ? .7 : 1) * (X2 && X2.SPD[kk] || 1), seg = w / nE;
        E.push({ k: kk, p, x: p.x + q * seg + R(8, Math.max(9, seg - ew - 8)), w: ew, ns: spiky ? 1 : 0, h: sz2 ? sz2[1] : { spiky: 26, goat: 34, crab: 26, peng: 34, slime: 28, golem: 40, ghost: 34, lavablob: 30 }[kk], vx: (r0() < .5 ? -1 : 1) * v0, v0, dead: 0, rev: 0, ph: R(0, 6.28) });
      }
      hasE = true;
    } else if (!cp && !top && type !== 'spring' && r0() < LV.bat) BAT.push({ x: x + w / 2 - 12, y: y - 46, got: false });
    // ong / chim lượn phía trên hố giữa 2 đảo
    if (z === NZ - 1 && !cp && !top && gx > 60 && r0() < .45) E.push({ k: 'podo', x: x - gx / 2 - 14, y: Math.max(y, prev.y) + 160, by: Math.max(y, prev.y) + 160, w: 28, h: 32, vy: 0, t: Math.floor(R(0, 120)), dead: 0, rev: 0 });   // cầu lửa nhảy lên từ vực
    if (z >= Math.max(1, LV.birdZ - 1) && !cp && !top && i < N - 1 && gx > 40 && zc[z] < cap(z) && r0() < LV.bird * (.3 + .7 * ramp) && ++zc[z]) E.push({ k: ZONES[z].fly, bx: x - gx / 2 - 19, by: Math.min(y, prev.y) - R(55, 80), amp: R(50, 100), sp: R(.012, .02) * LV.spd, ph: R(0, 6.28), x: 0, y: 0, w: 38, h: 26, dead: 0, rev: 0, f: 1 });
    // xu: dãy xu dọc đường dài · vòng cung xu qua hố
    if (pat === 'run' && !top) { const n2 = clamp(Math.floor(w / 44), 3, 9); for (let q = 0; q < n2; q++) if (r0() < .85) COINS.push({ x: x + 24 + q * (w - 48) / Math.max(1, n2 - 1), y: y - 30, got: false }) }
    else if (!top && type !== 'spring') { const ax = prev.x + prev.w - 10, bx2 = x + w / 2; for (let q = 1; q <= 4; q++) { const t = q / 5; COINS.push({ x: ax + (bx2 - ax) * t, y: prev.y + (y - prev.y) * t - Math.sin(t * Math.PI) * 60 - 26, got: false }) } }
    if (i >= N - 2 && !top) ITEMS.push({ x: x + w / 2, y: y - 40, k: i === N - 1 ? 'flw' : 'shd', got: false });   // trước trận rồng: luôn có hoa lửa + khiên
    else if (--itemGap <= 0 && !cp && !top && (type === 'plain' || type === 'move') && !hasE && r0() < .45) { ITEMS.push({ x: x + w / 2, y: y - 40, k: ['flw', 'fea', 'boot', 'flw', 'shd', 'mag'][Math.floor(r0() * 6)], got: false }); itemGap = 4 }
    P.push(p); prev = p; prevSpring = type === 'spring';
  }
  const last = P[P.length - 1];
  TOPY = last.y; ALTK = PART === 2 ? -TOPY / 1200 : 8; XMAX = last.x + last.w + 260; CPS = P.filter(p => p.cp || p.type === 'ground'); S.cpAt = CPS[0];
  BOSS = { x: last.x + last.w - 400, y: last.y, hp: BOSSHP, inv: 0, t: 160, act: false, dead: 0, mouth: 0, hop: 0, vy: 0, dy: 0 }; BF = [];   // rồng lửa giữ lâu đài
  TREES = [];
}
const alt = () => Math.max(0, Math.round(-(pl.y + pl.h) / ALTK));
const topAlt = () => Math.round(-TOPY / ALTK);
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };
const solid = p => p.type !== 'crumble' || p.st < 2;

/* ═════ vật lý ═════ */
function stepWorld() {
  for (const p of P) {
    if (p.type === 'move') { const nx = p.bx + Math.sin(S.tick * p.sp + p.ph) * p.amp; p.dx = nx - p.x; p.x = nx }
    if (p.sq > 0) p.sq--;
    if (p.type === 'crumble') {
      if (p.st === 1 && --p.t <= 0) { p.st = 2; p.fv = 0; GC.sfx('crack'); puff(p.x + p.w / 2, p.y + 10, 12, [ZONES[p.z].dirt, ZONES[p.z].dirtD], 4) }
      else if (p.st === 2) { p.fv += .5; p.fy += p.fv; if (p.fy > 700) { p.st = 3; p.t = 200 } }
      else if (p.st === 3 && --p.t <= 0) { p.st = 0; p.fy = 0 }
    }
  }
  for (const e of E) {
    if (e.dead) { if (e.dead > 1) e.dead--; if (e.rev && --e.rev <= 0) { e.dead = 0 } continue }
    if (e.k === 'podo') { if (--e.t <= 0) { e.vy = -12.5; e.t = 150 } e.vy += .32; e.y = Math.min(e.by, e.y + e.vy); continue }
    if (e.bx != null && X2 && X2.fly[e.k]) { const ox = e.x; X2.fly[e.k](e, S.tick * e.sp + e.ph); e.f = e.x > ox ? 1 : -1 }
    else if (e.bx != null) { const a = S.tick * e.sp + e.ph, nx = e.bx + Math.sin(a) * e.amp; e.f = nx > e.x ? 1 : -1; e.x = nx; e.y = e.by + Math.sin(a * (e.k === 'bee' || e.k === 'bat' ? 5 : 3)) * (e.k === 'bee' || e.k === 'bat' ? 18 : 10) }
    else {
      if (e.k === 'goat') { const near = pl.on === e.p && Math.abs(pl.x - e.x) < 230; e.ch = near;   /* dê vùng đầu lao chậm, càng lên cao lao càng nhanh */ e.vx = Math.sign(near ? (pl.x - e.x) || 1 : e.vx || 1) * (near ? e.v0 * (1.5 + e.p.z * .2) : e.v0); if (near && S.tick % 8 === 0) puff(e.x + e.w / 2 - Math.sign(e.vx) * 16, e.y + e.h, 2, ['#E8D8C0', '#fff'], 1.5) }
      e.x += e.vx * (X2 && X2.ai[e.k] ? X2.ai[e.k](e, pl, S.tick) : e.k === 'slime' ? (Math.sin(S.tick * .12 + e.ph) > 0 ? 1.6 : .15) : 1); if (e.x < e.p.x + 6 || e.x > e.p.x + e.p.w - e.w - 6) { e.vx = -e.vx; e.x = clamp(e.x, e.p.x + 6, e.p.x + e.p.w - e.w - 6) } e.y = e.p.y - e.h + (e.oy || 0) }
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
  for (const k in PW) if (PW[k] > 0) PW[k]--;
  const jv = JV * (PW.boot ? 1.2 : 1);
  if (pl.buf > 0) { pl.buf--;
    if (pl.coy > 0 && can) { pl.vy = jv; pl.coy = 0; pl.buf = 0; pl.air2 = 0; use(COST.jump); GC.sfx('jump'); puff(pl.x + 17, pl.y + 40, 6, ['#fff', '#e9e0ff']) }
    else if (PW.fea && !pl.on && !pl.air2 && pl.coy <= 0 && can && keys.j) { pl.vy = jv * .92; pl.air2 = 1; pl.buf = 0; use(COST.jump); GC.sfx('jump'); puff(pl.x + 17, pl.y + 34, 10, ['#ffffff', '#cfeeff', '#9ad8ff'], 3) }   // 🕊️ nhảy lần 2 trên không
  }
  if (keys.hp) { keys.hp = 0; if (pl.coy > 0 && can) { pl.vy = jv * 1.42; pl.hj = 1; pl.coy = 0; pl.buf = 0; pl.air2 = 0; use(COST.jump * 2.5); GC.sfx('spring'); pl.sq = .5; puff(pl.x + 17, pl.y + 40, 14, ['#fff', '#FFE08A', '#9ad8ff'], 4) } }   // ⏫ NHẢY CAO: cao gấp đôi, tốn ⚡ hơn
  if (pl.vy >= 0) pl.hj = 0;
  if (!keys.j && !pl.hj && pl.vy < -6 && pl.vy > jv - 1) pl.vy *= .88;      // thả nút sớm = nhảy thấp, đỡ tốn
  if (fbCool) fbCool--;
  if (keys.fp) { keys.fp = 0; if (PW.flw && !fbCool && FB.length < 3) { fbCool = 14; FB.push({ x: pl.x + 17 + pl.face * 18, y: pl.y + 16, vx: pl.face * 8.5, vy: -1, l: 90 }); GC.sfx('fireball') } }   // 🌼 hoa lửa: bấm F để bắn
  for (let i = FB.length - 1; i >= 0; i--) {
    const b = FB[i]; b.vy = Math.min(b.vy + .45, 9); b.x += b.vx; b.y += b.vy; b.l--;
    for (const p of P) if (solid(p) && b.x > p.x && b.x < p.x + p.w && b.y + 6 >= p.y && b.y + 6 - b.vy <= p.y + 2) { b.y = p.y - 6; b.vy = -5.5; break }
    let hitE = false;
    for (const e of E) if (!e.dead && e.k !== 'podo' && b.x > e.x - 6 && b.x < e.x + e.w + 6 && b.y > e.y - 6 && b.y < e.y + e.h + 6) { e.dead = 40; e.rev = 1500; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); puff(e.x + e.w / 2, e.y + e.h / 2, 16, ['#FF7A1A', '#FFE08A', '#fff'], 5); hitE = true; break }
    if (hitE || b.l <= 0 || b.y > pl.y + 700) FB.splice(i, 1);
  }
  if (fireCls !== PW.flw > 0) { fireCls = PW.flw > 0; document.body.classList.toggle('fire', fireCls) }   // hiện nút 🔥 trên điện thoại khi có hoa
  pl.vy = Math.min(pl.vy + G, 17);
  if (pl.on && pl.on.type === 'move') pl.x += pl.on.dx;
  pl.x = clamp(pl.x + pl.vx, XMIN, XMAX - pl.w);
  const pb = pl.y + pl.h; pl.y += pl.vy; const nb = pl.y + pl.h; pl.on = null;
  if (pl.vy >= 0) for (const p of P) {
    if (solid(p) && pl.x + pl.w > p.x + 5 && pl.x < p.x + p.w - 5 && pb <= p.y + .5 && nb >= p.y) {
      pl.y = p.y - pl.h; if (pl.vy > 7) { pl.sq = .5; puff(pl.x + 17, p.y, 5, ['#fff', '#e9e0ff']) }
      if (p.type === 'spring') { pl.vy = SPRING; p.sq = 10; pl.sq = .6; GC.sfx('spring'); break }
      if (p.type === 'crumble' && p.st === 0) { p.st = 1; p.t = Math.round(LV.crumble * (1.7 - p.z * .15)) }   // vùng đầu sụp chậm hơn
      pl.vy = 0; pl.on = p; pl.air2 = 0; pl.hj = 0;
      if (p.cp && p.y < S.cpAt.y) { S.cpAt = p; GC.sfx('cp'); puff(p.x + p.w - 30, p.y - 50, 26, ['#ff7eb6', '#5ab0ff', '#3fbf86', '#9b7bff', '#ffe08a'], 6); if (p.cp > S.bestCp) { S.bestCp = p.cp; S.hooks.onCP && S.hooks.onCP(p.cp) } }

      break;
    }
  }
  pl.sq *= .85;
  // kẻ địch: rơi từ trên xuống trúng đầu = giẫm bẹp; chạm ngang (hoặc giẫm nhím gai) = bị hất văng
  for (const e of E) {
    if (e.dead || e.gh || Math.abs(e.y - pl.y) > 90) continue;
    if (e.k === 'podo' && PW.shd) continue;
    if (pl.x + pl.w - 4 > e.x && pl.x + 4 < e.x + e.w && pl.y + pl.h > e.y + 2 && pl.y < e.y + e.h) {
      if (PW.shd) { e.dead = 40; e.rev = 1500; S.stomps++; GC.sfx('stomp'); puff(e.x + e.w / 2, e.y + e.h / 2, 16, ['#7fd6ff', '#fff'], 5) }   // 🛡️ khiên: đụng là hạ luôn
      else if (e.k !== 'spiky' && !e.ns && e.k !== 'podo' && pl.vy > 0 && pb <= e.y + 12) {
        e.dead = 40; e.rev = 1500; pl.vy = -10.5; pl.y = e.y - pl.h; S.energy += COST.stomp; S.stomps++;
        GC.sfx('stomp'); puff(e.x + e.w / 2, e.y + e.h / 2, 16, ['#fff', '#ffe08a', '#ff9cc8'], 5); S.hooks.onStomp && S.hooks.onStomp(COST.stomp);
      } else if (!pl.inv) {
        pl.inv = 75; pl.kb = 16; S.hits++; use(COST.hurt); pl.vx = (pl.x + 17 < e.x + e.w / 2 ? -1 : 1) * 7.5; pl.vy = -7.5; pl.on = null;
        GC.sfx('hurt'); puff(pl.x + 17, pl.y + 20, 10, ['#ff6b81', '#fff'], 4); S.hooks.onHurt && S.hooks.onHurt(COST.hurt);
      }
    }
  }
  bossStep();
  // xu (🧲 nam châm hút xu lại gần) · vật phẩm
  const pcx = pl.x + 17, pcy = pl.y + 20;
  for (const c of COINS) {
    if (c.got || Math.abs(c.y - pcy) > 260) continue;
    if (PW.mag) { const dx = pcx - c.x, dy = pcy - c.y, d = Math.hypot(dx, dy); if (d < 190) { c.x += dx / d * 7; c.y += dy / d * 7 } }
    if (Math.abs(c.x - pcx) < 24 && Math.abs(c.y - pcy) < 30) { c.got = true; S.coins++; GC.sfx('coin'); puff(c.x, c.y, 5, ['#FFD23F', '#fff6a8'], 2); if (S.coins % 30 === 0 && S.lives < LIVES + 2) { S.lives++; GC.sfx('power'); S.hooks.onPower && S.hooks.onPower('c_life') } }
  }
  for (const it of ITEMS) if (!it.got && Math.abs(it.x - pcx) < 28 && Math.abs(it.y - pcy) < 34) { it.got = true; PW[it.k] = PWF[it.k]; GC.sfx('power'); puff(it.x, it.y, 18, [PWC[it.k], '#fff', '#FFD23F'], 4); S.hooks.onPower && S.hooks.onPower('c_' + it.k) }
  for (const b of BAT) if (!b.got && pl.x < b.x + 24 && pl.x + pl.w > b.x && pl.y < b.y + 28 && pl.y + pl.h > b.y) { b.got = true; S.energy += COST.battery; GC.sfx('bat'); puff(b.x + 12, b.y + 14, 14, ['#3fbf86', '#fff6a8'], 4); S.hooks.onBat && S.hooks.onBat(COST.battery) }
  if (pl.y > S.cpAt.y + 560) {
    S.falls++; S.lives--; GC.sfx('fall');
    if (S.lives <= 0) { S.lives = LIVES; const i = CPS.indexOf(S.cpAt); if (i > 0) S.cpAt = CPS[i - 1]; respawn(); GC.sfx('bad'); S.hooks.onFall && S.hooks.onFall(S.cpAt.cp, '💀 Hết ' + LIVES + ' mạng! Lùi về ' + (S.cpAt.cp ? 'Trạm ' + S.cpAt.cp : 'chân núi') + ' — có ' + LIVES + ' mạng mới, leo tiếp nào!') }
    else { respawn(); S.hooks.onFall && S.hooks.onFall(S.cpAt.cp, '😱 Rơi rồi! 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · quay về ' + (S.cpAt.cp ? 'Trạm ' + S.cpAt.cp : 'chân núi')) }
  }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;   // bình năng lượng đầy
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function hurtPl(fromX, amt) {
  if (pl.inv || PW.shd) return; pl.inv = 75; pl.kb = 16; S.hits++; use(amt); pl.vx = (pl.x + 17 < fromX ? -1 : 1) * 7.5; pl.vy = -7.5; pl.on = null;
  GC.sfx('hurt'); puff(pl.x + 17, pl.y + 20, 10, ['#ff6b81', '#fff'], 4); S.hooks.onHurt && S.hooks.onHurt(amt);
}
function bossStep() {   // 🐉 rồng lửa ở đỉnh: phun lửa thấp (nhảy qua) / cao (đứng yên hoặc cúi) · giẫm đầu hoặc bắn 🔥 để hạ
  const B = BOSS, top = P[P.length - 1]; if (!B) return;
  const onArena = pl.y < top.y + 60 && pl.x > top.x - 40;
  if (B.dead) { B.dead++; B.dy = Math.min(900, B.dy + B.dead * .6); if (!S.won && pl.on === top && pl.x > top.x + top.w - 260) { S.won = true; S.hooks.onWin && S.hooks.onWin() } }
  else {
    if (!B.act && onArena && pl.on === top) { B.act = true; GC.sfx('roar'); GC.music.scene('boss'); S.hooks.onPower && S.hooks.onPower(PART === 2 ? 'c2_boss' : 'c_boss') }
    if (B.act) {
      if (B.inv) B.inv--; if (B.mouth) B.mouth--;
      if (--B.t <= 0) {   // phun lửa: 2–3 quả, thấp hoặc cao
        if (PART === 2) { X2.bossAtk(B, top, BF, pl); GC.sfx('fireball') } else {
        const hi = Math.random() < .4, n = B.hp <= 4 ? 3 : 2;
        for (let k = 0; k < n; k++) BF.push({ x: B.x + 10, y: top.y - (hi ? 74 : 20), vx: -(4.2 + (BOSSHP - B.hp) * .12), d: k * 26, l: 260 });
        B.mouth = 40; B.t = (B.hp <= 4 ? 120 : 160) + Math.floor(Math.random() * 40); GC.sfx('fireball'); }
      }
      if (!B.vy && Math.random() < (PART === 2 ? (B.hp <= 8 ? .012 : .007) : .004)) B.vy = -9;   // thỉnh thoảng nhảy dậm đất
      if (B.vy || B.hop < 0) { B.vy += .45; B.hop += B.vy; if (B.hop >= 0) { B.hop = 0; B.vy = 0; puff(B.x + 60, top.y, 14, ['#8A6A5A', '#FFB070'], 4); if (PART === 2) { BF.push({ k: 'wave', x: B.x, y: top.y - 12, vx: -6, d: 0, l: 170 }); GC.sfx('crack') } } }
      // giẫm đầu rồng
      const hx = B.x + 6, hy = top.y - 110 + B.hop;
      if (pl.vy > 0 && pl.x + pl.w > hx && pl.x < hx + 70 && pl.y + pl.h > hy && pl.y + pl.h < hy + 30) { pl.vy = -12; bossHit(2) }
      else if (pl.x + pl.w > B.x + 10 && pl.x < B.x + 130 && pl.y + pl.h > top.y - 90 + B.hop) hurtPl(B.x + 60, COST.hurt);   // đụng thân rồng
      for (let i = FB.length - 1; i >= 0; i--) { const b = FB[i]; if (b.x > B.x && b.x < B.x + 130 && b.y > top.y - 120 + B.hop && b.y < top.y) { FB.splice(i, 1); bossHit(1) } }
    }
  }
  for (let i = BF.length - 1; i >= 0; i--) { const f = BF[i]; if (f.d > 0) { f.d--; continue } f.x += f.vx; if (f.vy) { f.y += f.vy; if (f.y > top.y - 6) { puff(f.x, top.y, 12, ['#B57BFF', '#FF7A1A', '#fff'], 4); BF.splice(i, 1); continue } } f.l--; if (Math.abs(f.x - (pl.x + 17)) < 22 && Math.abs(f.y - (pl.y + 20)) < 26) { hurtPl(f.x, COST.hurt); BF.splice(i, 1); continue } if (f.l <= 0 || f.x < top.x - 60) BF.splice(i, 1) }
}
function bossHit(n) {
  const B = BOSS; if (B.inv || B.dead) return; B.hp = Math.max(0, B.hp - n); B.inv = 40; GC.sfx('bossHit'); puff(B.x + 40, P[P.length - 1].y - 80, 18, ['#FFD23F', '#FF7A1A', '#fff'], 5);
  if (!B.hp) { B.dead = 1; BF.length = 0; GC.sfx('roar'); GC.music.scene('play'); S.stomps += 5; S.energy += 50; S.hooks.onPower && S.hooks.onPower(PART === 2 ? 'c2_bossdown' : 'c_bossdown'); for (let k = 0; k < 40; k++) puff(B.x + 60, P[P.length - 1].y - 60, 1, ['#FF7EB6', '#FFD23F', '#5AB0FF', '#3FBF86'], 7) }
}
function respawn() { const c = S.cpAt; pl.x = c.type === 'ground' ? 100 : c.top ? c.x + 40 : c.x + c.w / 2 - 17; pl.y = c.y - pl.h - 2; pl.vx = pl.vy = 0; pl.kb = 0; pl.inv = 60 }
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
const MT = [0, 1, 2].map(L => { const n = 10 + L * 3, a = Array.from({ length: n }, (_, i) => ({ x: i / (n - 1), h: .3 + Math.random() * .38 - L * .1 })); a[n - 1].h = a[0].h; return a });
const FLOCK = Array.from({ length: 5 }, () => ({ x: Math.random(), y: Math.random() * .4 + .1, v: Math.random() * .0006 + .0004, p: Math.random() * 6 }));

const OLW = '#3B2A20', OLC = '#3E4A78';   // màu viền đậm kiểu hoạt hình
function strokeOL(c, w) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = c || OLW; ctx.lineWidth = w || 3; ctx.stroke() }
function puffyCloud(x, y, r, a, pink) {   // mây phồng kiểu hoạt hình: thân trắng, đáy hồng nhạt
  ctx.globalAlpha = a; ctx.fillStyle = pink ? '#F6D2E6' : '#DDEBFA'; ctx.beginPath(); ctx.ellipse(x, y + r * .35, r * 1.9, r * .55, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - r * .9, y + r * .1, r * .62, 0, 7); ctx.arc(x, y - r * .2, r * .85, 0, 7); ctx.arc(x + r * .95, y + r * .05, r * .66, 0, 7); ctx.arc(x + r * .4, y - r * .55, r * .55, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.ellipse(x - r * .2, y - r * .55, r * .35, r * .16, -.3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
}
function drawBg() {
  const t = clamp((pl.y + pl.h) / TOPY, 0, 1), g = ctx.createLinearGradient(0, 0, 0, ch), nf = znum(ZNT, t);   // t theo độ cao của em → trời đúng màu vùng đang đứng   // nf: độ tối của vùng đang leo (đêm → hiện sao, trăng)
  g.addColorStop(0, zgrad(ZSKY[0], t)); g.addColorStop(.65, zgrad(ZSKY[1], t)); g.addColorStop(1, zgrad(ZSKY[2], t));
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  const sa = clamp((nf - .3) * 1.6, 0, 1);
  if (sa > 0) for (const s of STARS) { ctx.globalAlpha = sa * (.5 + .5 * Math.sin(S.tick * .04 + s.t)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x * cw, s.y * ch * .8, s.r, 0, 7); ctx.fill() }
  ctx.globalAlpha = 1;
  const sx = cw * .8, sy = ch * (.16 + t * .05), sun = nf < .5;   // mặt trời → mặt trăng
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 110); glow.addColorStop(0, sun ? '#FFF6C8dd' : '#ffffffaa'); glow.addColorStop(1, '#ffffff00');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, 110, 0, 7); ctx.fill();
  ctx.fillStyle = sun ? '#FFE680' : '#F4F1FF'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, 7); ctx.fill(); ctx.strokeStyle = sun ? '#F2B23A' : '#C8C0F0'; ctx.lineWidth = 3; ctx.stroke();
  // núi xa màu xanh, đỉnh tuyết, viền đậm (parallax)
  MT.forEach((m, L) => {
    const base = ch * (.62 + L * .1) + (-cam.y) * (.03 + L * .025) * sc, col = mix(zgrad(ZMT, t), '#10183A', L * .14), off = -(((cam.x * sc * (.05 + L * .04)) % cw) + cw) % cw;
    for (const tile of [0, 1]) { const ox = off + tile * cw;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox - 2, ch + 10); m.forEach((p, i) => { const px = p.x * cw + ox, py = base - p.h * ch * .45; if (i) ctx.lineTo(px - cw / m.length * .32, py + 26); ctx.lineTo(px, py) }); ctx.lineTo(ox + cw + 2, ch + 10); ctx.closePath(); ctx.fill(); strokeOL(mix(col, '#1A2A5A', .45), 2.5);
    ctx.fillStyle = '#FFFFFF'; m.forEach(p => { if (p.h < .4 - L * .08) return; const px = p.x * cw + ox, py = base - p.h * ch * .45; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 18, py + 20); ctx.lineTo(px - 8, py + 15); ctx.lineTo(px - 2, py + 22); ctx.lineTo(px + 6, py + 14); ctx.lineTo(px + 18, py + 20); ctx.closePath(); ctx.fill() }); }
  });
  farProps(t);
  for (const c of CLOUDS) { c.x += c.v; if (c.x > 1500) c.x = -300; const y = ((c.y - cam.y * .3) % 1540 + 1540) % 1540 - 200, W2 = cw * 1.5, xx = (((c.x / 1400 * cw * 1.2 - cam.x * sc * .22) % W2) + W2) % W2 - cw * .25; puffyCloud(xx, y * sc * .7, 26 * c.s * sc + 16, nf > .5 ? .45 : .92, c.s > .9) }
  ctx.strokeStyle = nf < .4 ? '#4A6A9Aaa' : '#ffffff88'; ctx.lineWidth = 2;   // đàn chim xa
  FLOCK.forEach(b => { b.x = (b.x + b.v) % 1.1; const x = b.x * cw, y = b.y * ch, wv = Math.sin(S.tick * .15 + b.p) * 4; ctx.beginPath(); ctx.moveTo(x - 8, y - wv); ctx.quadraticCurveTo(x - 4, y - 4, x, y); ctx.quadraticCurveTo(x + 4, y - 4, x + 8, y - wv); ctx.stroke() });
}
let ZSKY = [0, 1, 2].map(k => ZONES.map(z => z.sky[k])), ZMT = ZONES.map(z => z.mt), ZNT = ZONES.map(z => z.nt || 0);
const zf0 = t => { const f = clamp(t * NZ - .5, 0, NZ - 1), i = Math.min(NZ - 2, Math.floor(f)), k = clamp((f - i - .3) / .4, 0, 1); return [i, k * k * (3 - 2 * k)] };   // giữa vùng giữ đúng màu vùng đó, chỉ chuyển màu ở ranh giới
function zgrad(st, t) { const [i, k] = zf0(t); return mix(st[i], st[i + 1], k) }   // màu trời / núi chuyển dần giữa 2 vùng kề nhau
function znum(st, t) { const [i, k] = zf0(t); return st[i] + (st[i + 1] - st[i]) * k }
function farProps(t) {   // cảnh xa đặc trưng từng vùng
  if (PART === 2) return X2.far(t * NZ);
  const zf = t * NZ, show = (id, fn) => { const a = clamp(1 - Math.abs(zf - ZI[id] - .5) * 1.1, 0, 1); if (a > .02) { ctx.globalAlpha = a; fn(); ctx.globalAlpha = 1 } };
  const off = k => -(((cam.x * sc * k) % cw) + cw) % cw, base = ch * .8;
  show('sakura', () => { for (const tile of [0, 1]) { const ox = off(.12) + tile * cw; for (let i = 0; i < 7; i++) { const tx = ox + i * cw / 7 + 30, th = 60 + (i * 37) % 50; ctx.fillStyle = '#7A4A3A'; ctx.fillRect(tx - 4, base - th, 8, th + 30); for (const [dx, dy, r2] of [[0, -th - 10, 34], [-26, -th + 4, 24], [26, -th + 2, 26]]) { ctx.fillStyle = (i % 2 ? '#F4A8C4' : '#F9C4D6'); ctx.beginPath(); ctx.arc(tx + dx, base + dy, r2, 0, 7); ctx.fill() } } } });
  show('falls', () => {   // vách đá có thác nước trắng xoá + cầu vồng
    const rx = cw * .5 - (((cam.x * sc * .03) % cw) + cw) % cw * .2; const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * .55; ctx.lineWidth = 9; ['#FF5A5A', '#FF9A3A', '#FFE04A', '#5AD86A', '#4AA8FF', '#7A6AF0', '#C86AF0'].forEach((c, k) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(rx, base + 60, ch * .5 - k * 9, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke() }); ctx.globalAlpha = a0;
    for (const tile of [0, 1]) { const ox = off(.1) + tile * cw; for (let i = 0; i < 3; i++) {
      const px = ox + (i + .25) * cw / 3, w = 90, h = 120 + i * 34, top = base + 30 - h;
      ctx.fillStyle = '#8C8478'; rr(px - w / 2, top, w, h + 40, 14); ctx.fill(); ctx.fillStyle = '#6E665C'; rr(px + w * .2, top + 6, w * .3, h + 34, 10); ctx.fill(); ctx.fillStyle = '#6CC86A'; rr(px - w / 2 - 4, top - 6, w + 8, 16, 8); ctx.fill();
      const wg = ctx.createLinearGradient(0, top, 0, base + 40); wg.addColorStop(0, '#E8F8FF'); wg.addColorStop(1, '#9ED8FF'); ctx.fillStyle = wg; ctx.fillRect(px - 16, top + 4, 26, h + 30);
      ctx.fillStyle = '#ffffffcc'; for (let k = 0; k < 6; k++) { const yy = top + 4 + ((S.tick * 2.4 + k * 30) % (h + 20)); ctx.fillRect(px - 14 + (k % 3) * 8, yy, 3, 14) }
      ctx.fillStyle = '#ffffffaa'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(px - 22 + k * 10, base + 34 + Math.sin(S.tick * .1 + k) * 3, 9, 0, 7); ctx.fill() }
    } } });
  show('sand', () => { for (const tile of [0, 1]) { const ox = off(.08) + tile * cw; for (let i = 0; i < 3; i++) { const px = ox + (i + .5) * cw / 3, h = 90 + i * 30; ctx.fillStyle = '#E8C080'; ctx.beginPath(); ctx.moveTo(px - h, base + 20); ctx.lineTo(px, base + 20 - h); ctx.lineTo(px + h, base + 20); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#C89A5A'; ctx.beginPath(); ctx.moveTo(px, base + 20 - h); ctx.lineTo(px + h, base + 20); ctx.lineTo(px + h * .2, base + 20); ctx.closePath(); ctx.fill() } } });
  show('maple', () => { for (const tile of [0, 1]) { const ox = off(.12) + tile * cw; for (let i = 0; i < 7; i++) { const tx = ox + i * cw / 7 + 40, th = 54 + (i * 41) % 50, cs = ['#E8502A', '#F48A2A', '#F8C040', '#D83A2A'][i % 4]; ctx.fillStyle = '#5A3420'; ctx.fillRect(tx - 4, base - th, 8, th + 30); for (const [dx, dy, r2] of [[0, -th - 12, 30], [-22, -th + 2, 22], [22, -th, 24], [0, -th + 8, 20]]) { ctx.fillStyle = cs; ctx.beginPath(); ctx.arc(tx + dx, base + dy, r2, 0, 7); ctx.fill() } ctx.fillStyle = '#ffffff33'; ctx.beginPath(); ctx.arc(tx - 8, base - th - 22, 10, 0, 7); ctx.fill() } } });
  show('crystal', () => { for (const tile of [0, 1]) { const ox = off(.1) + tile * cw; for (let i = 0; i < 6; i++) { const px = ox + i * cw / 6 + 20, h = 80 + (i * 53) % 90; ctx.fillStyle = i % 2 ? '#B49AF0' : '#9A84E8'; ctx.beginPath(); ctx.moveTo(px - 18, base + 20); ctx.lineTo(px, base + 20 - h); ctx.lineTo(px + 18, base + 20); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.moveTo(px - 4, base + 10); ctx.lineTo(px, base + 20 - h); ctx.lineTo(px + 4, base + 10); ctx.closePath(); ctx.fill() } } });
  show('shroom', () => {   // nấm khổng lồ phát sáng
    for (const tile of [0, 1]) { const ox = off(.1) + tile * cw; for (let i = 0; i < 5; i++) {
      const px = ox + (i + .3) * cw / 5, h = 70 + (i * 41) % 70, cw2 = 34 + (i * 23) % 26, cc = ['#5AE0D0', '#B07AF0', '#F07AC0', '#7AF0A0', '#7AB0FF'][i];
      ctx.fillStyle = '#D8D0E8'; rr(px - 7, base + 30 - h, 14, h, 6); ctx.fill();
      ctx.shadowColor = cc; ctx.shadowBlur = 26; ctx.fillStyle = cc; ctx.beginPath(); ctx.ellipse(px, base + 34 - h, cw2, cw2 * .55, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffffaa'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(px - cw2 * .5 + k * cw2 * .5, base + 26 - h - (k % 2) * 8, 4, 0, 7); ctx.fill() }
    } } });
  show('aurora', () => {   // cực quang uốn lượn + rừng thông phủ tuyết
    for (let k = 0; k < 3; k++) { const ag = ctx.createLinearGradient(0, ch * (.06 + k * .05), 0, ch * (.36 + k * .05)); ag.addColorStop(0, k === 1 ? 'rgba(180,110,255,0)' : 'rgba(70,255,170,0)'); ag.addColorStop(.45, k === 1 ? 'rgba(180,110,255,.42)' : 'rgba(70,255,170,.5)'); ag.addColorStop(1, 'rgba(70,255,170,0)'); ctx.fillStyle = ag; ctx.beginPath(); for (let x = 0; x <= cw + 20; x += 20) ctx.lineTo(x, ch * (.08 + k * .05) + Math.sin(x * .006 + S.tick * .012 + k * 2) * 26); for (let x = cw + 20; x >= 0; x -= 20) ctx.lineTo(x, ch * (.34 + k * .05) + Math.sin(x * .009 + k + S.tick * .016) * 18); ctx.fill() }
    for (const tile of [0, 1]) { const ox = off(.12) + tile * cw; for (let i = 0; i < 9; i++) { const px = ox + i * cw / 9 + 20, h = 60 + (i * 37) % 50; ctx.fillStyle = '#1A2E50'; ctx.beginPath(); ctx.moveTo(px, base + 30 - h); ctx.lineTo(px - h * .32, base + 30); ctx.lineTo(px + h * .32, base + 30); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#E8F2FF'; ctx.beginPath(); ctx.moveTo(px, base + 30 - h); ctx.lineTo(px - h * .12, base + 30 - h * .62); ctx.lineTo(px + h * .12, base + 30 - h * .62); ctx.closePath(); ctx.fill() } } });
  show('candy', () => {   // kẹo mút khổng lồ · gậy kẹo · đồi kem
    for (const tile of [0, 1]) { const ox = off(.1) + tile * cw; for (let i = 0; i < 5; i++) {
      const px = ox + (i + .3) * cw / 5, h = 80 + (i * 37) % 60;
      if (i % 2 === 0) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(px - 3, base + 30 - h, 6, h); const r2 = 26 + (i * 7) % 10, cy = base + 30 - h; ['#FF6AA8', '#FFFFFF', '#6AC8FF', '#FFFFFF', '#FFD24A'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, cy, r2 * (1 - k * .18), 0, 7); ctx.fill() }) }
      else { ctx.lineWidth = 9; ctx.lineCap = 'round'; for (const [c, dash] of [['#FFFFFF', []], ['#E83A4A', [8, 10]]]) { ctx.strokeStyle = c; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(px, base + 40); ctx.lineTo(px, base + 30 - h + 16); ctx.arc(px + 14, base + 30 - h + 16, 14, Math.PI, 0); ctx.stroke() } ctx.setLineDash([]) }
    }
    for (let i = 0; i < 4; i++) { const px = off(.06) + tile * cw + (i + .5) * cw / 4; ctx.fillStyle = ['#FFD0E8', '#D8F0FF', '#FFF0C0', '#E0D8FF'][i]; ctx.beginPath(); ctx.ellipse(px, base + 50, cw / 7, 40, 0, Math.PI, 0); ctx.fill() } } });
  show('lantern', () => {   // chùa nhiều tầng · cổng torii · đèn lồng sáng
    for (const tile of [0, 1]) { const ox = off(.09) + tile * cw; for (let i = 0; i < 3; i++) {
      const px = ox + (i + .4) * cw / 3;
      if (i === 1) { ctx.fillStyle = '#C8302A'; ctx.fillRect(px - 50, base - 70, 10, 110); ctx.fillRect(px + 40, base - 70, 10, 110); ctx.fillRect(px - 66, base - 84, 132, 12); ctx.fillRect(px - 56, base - 62, 112, 8) }
      else { for (let k = 0; k < 4; k++) { const tw = 70 - k * 12, ty = base + 20 - k * 34; ctx.fillStyle = '#2A1A3A'; ctx.fillRect(px - tw * .35, ty - 26, tw * .7, 26); ctx.beginPath(); ctx.moveTo(px - tw * .7, ty - 22); ctx.lineTo(px + tw * .7, ty - 22); ctx.lineTo(px + tw * .4, ty - 34); ctx.lineTo(px - tw * .4, ty - 34); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFB040'; ctx.fillRect(px - 5, ty - 18, 10, 10) } ctx.fillStyle = '#2A1A3A'; ctx.fillRect(px - 2, base - 136 - 20, 4, 24) }
    } } });
  show('lava', () => { const ox = off(.05); for (const tile of [0, 1]) { const px = ox + tile * cw + cw * .45, h = ch * .42; ctx.fillStyle = '#3A1A1E'; ctx.beginPath(); ctx.moveTo(px - h * 1.3, base + 40); ctx.lineTo(px - h * .22, base + 40 - h); ctx.lineTo(px + h * .22, base + 40 - h); ctx.lineTo(px + h * 1.3, base + 40); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FF6A1A'; ctx.beginPath(); ctx.moveTo(px - h * .22, base + 40 - h); ctx.lineTo(px - h * .1, base + 40 - h * .7); ctx.lineTo(px, base + 40 - h * .85); ctx.lineTo(px + h * .12, base + 40 - h * .62); ctx.lineTo(px + h * .22, base + 40 - h); ctx.closePath(); ctx.fill(); for (let k = 0; k < 5; k++) { const sy2 = base + 40 - h - 20 - ((S.tick * .4 + k * 30) % 150); ctx.fillStyle = 'rgba(80,60,70,' + (.5 - ((S.tick * .4 + k * 30) % 150) / 300) + ')'; ctx.beginPath(); ctx.arc(px + Math.sin(k + S.tick * .01) * 20, sy2, 26 + ((S.tick * .4 + k * 30) % 150) * .25, 0, 7); ctx.fill() } } });
}
/* đảo nổi kiểu Gimkit: mặt cỏ rủ viền + thân đất nhiều lớp (hoặc cát gợn sóng / tuyết / mây), viền đậm */
function island(p, oy, a) {
  const Z = p.type === 'ice' ? ICE : ZONES[p.z], x = p.x, y = p.y + oy, w = p.w, d = p.deco, depth = 30 + d[0] * 26, ol = Z.kind === 'snow' || Z.kind === 'ice' || Z.kind === 'cloud' || Z.kind === 'crystal' ? OLC : Z.kind === 'lava' ? '#1A0A0C' : OLW;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#1A2A4A18'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + depth + 30, w * .34, 6, 0, 0, 7); ctx.fill();
  // thân đảo
  const body = () => { ctx.beginPath(); ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + 4, y + depth * .55); ctx.quadraticCurveTo(x + w * .06, y + depth + 4, x + w * .2, y + depth + 6 + d[1] * 6); ctx.lineTo(x + w * .45, y + depth + 10 + d[2] * 8); ctx.lineTo(x + w * .7, y + depth + 6 + d[3] * 8); ctx.quadraticCurveTo(x + w * .94, y + depth + 2, x + w - 4, y + depth * .55); ctx.lineTo(x + w - 2, y + 6); ctx.closePath() };
  if (Z.kind === 'cloud') { ctx.fillStyle = Z.dirt; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + w * (.12 + i * .19), y + 18 + Math.sin(i * 2) * 5, Math.min(w * .2, 32), 0, 7); ctx.fill() } ctx.strokeStyle = OLC; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + w * (.12 + i * .19), y + 18 + Math.sin(i * 2) * 5, Math.min(w * .2, 32), .15, Math.PI - .15); ctx.stroke() } ctx.fillStyle = '#ffffff88'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + w * (.2 + i * .3), y + 14, Math.min(w * .08, 12), 4, 0, 0, 7); ctx.fill() } }
  else {
    body(); const bg = ctx.createLinearGradient(0, y, 0, y + depth + 12); bg.addColorStop(0, Z.dirt); bg.addColorStop(1, Z.dirtD); ctx.fillStyle = bg; ctx.fill();
    ctx.save(); body(); ctx.clip();
    if (Z.kind === 'sand') { ctx.strokeStyle = Z.dirtD; ctx.lineWidth = 2.5; for (let ry = y + 16; ry < y + depth + 12; ry += 9) { ctx.beginPath(); for (let rx = x - 6; rx <= x + w + 6; rx += 12) ctx.quadraticCurveTo(rx + 3, ry - 4, rx + 6, ry), ctx.quadraticCurveTo(rx + 9, ry + 4, rx + 12, ry); ctx.stroke() } }
    else { ctx.strokeStyle = Z.dirtD; ctx.lineWidth = 3; for (const fy of [.42, .72]) { ctx.beginPath(); ctx.moveTo(x, y + depth * fy + 6); for (let rx = x; rx <= x + w; rx += 18) ctx.quadraticCurveTo(rx + 9, y + depth * fy + 6 + (((rx / 18) | 0) % 2 ? 5 : -5), rx + 18, y + depth * fy + 6); ctx.stroke() }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? Z.dirtD : Z.dirtL; ctx.beginPath(); ctx.ellipse(x + 10 + ((d[i % 7] * 997 + i * 37) % 1) * (w - 20), y + 14 + ((d[(i + 2) % 7] * 613 + i * .21) % 1) * depth * .8, 3.2, 2.4, 0, 0, 7); ctx.fill() } }
    if (Z.kind === 'lava') { ctx.strokeStyle = '#FF7A1A'; ctx.lineWidth = 3; ctx.shadowColor = '#FFB040'; ctx.shadowBlur = 8; for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = x + w * (.2 + i * .3), py = y + 8; ctx.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (d[(i + k) % 7] - .5) * 24; py += depth * .3; ctx.lineTo(px, py) } ctx.stroke() } ctx.shadowBlur = 0 }
    if (Z.kind === 'crystal') for (let i = 0; i < 4; i++) { const px = x + w * (.15 + i * .23), py = y + depth * (.4 + d[i] * .3), s2 = 7 + d[i + 1] * 6; ctx.fillStyle = i % 2 ? '#E8D8FF' : '#C8A8FF'; ctx.beginPath(); ctx.moveTo(px, py - s2); ctx.lineTo(px + s2 * .6, py); ctx.lineTo(px, py + s2); ctx.lineTo(px - s2 * .6, py); ctx.closePath(); ctx.fill() }
    if (Z.tex && X2) X2.tex(Z, x, y, w, depth, d);
    ctx.restore(); body(); strokeOL(ol, 3);
    if (Z.kind === 'snow' || Z.kind === 'ice') { ctx.fillStyle = Z.kind === 'ice' ? '#E8F8FF' : '#F2F8FF'; [d[2], d[4], d[6]].forEach(dv => { const px = x + 12 + dv * (w - 24); ctx.beginPath(); ctx.moveTo(px - 5, y + depth * .6); ctx.lineTo(px + 5, y + depth * .6); ctx.lineTo(px, y + depth + 14); ctx.closePath(); ctx.fill(); strokeOL(OLC, 1.5) }) }
  }
  // mặt đảo: dải cỏ / cát / tuyết có viền rủ xuống
  const cap = () => { ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.quadraticCurveTo(x - 6, y - 6, x + 4, y - 7); ctx.lineTo(x + w - 4, y - 7); ctx.quadraticCurveTo(x + w + 6, y - 6, x + w + 4, y + 2); let k = 0; for (let bx = x + w + 2; bx > x - 2; bx -= 14) { const dr = (k++ % 3 === 1 ? 9 : 5) + (Z.kind === 'grass' ? 2 : Z.kind === 'candy' ? 5 : 0); ctx.quadraticCurveTo(bx - 3, y + dr + 4, bx - 7, y + 4); ctx.quadraticCurveTo(bx - 11, y + 2, bx - 14, y + 3) } ctx.closePath() };
  cap(); ctx.fillStyle = Z.top; ctx.fill(); strokeOL(ol, 3);
  ctx.fillStyle = '#ffffff66'; rr(x + 6, y - 5, w * .45, 3, 2); ctx.fill();
  if (Z.kind === 'grass') { ctx.fillStyle = Z.topD; for (let bx = x + 10; bx < x + w - 6; bx += 22) { ctx.beginPath(); ctx.moveTo(bx - 4, y + 1); ctx.lineTo(bx, y - 4); ctx.lineTo(bx + 4, y + 1); ctx.fill() } }
  if (Z.kind === 'candy') for (let i = 0; i < Math.floor(w / 14); i++) { ctx.fillStyle = ['#FFE24A', '#6AC8FF', '#7AE07A', '#FFFFFF', '#B07AF0'][i % 5]; ctx.save(); ctx.translate(x + 8 + ((d[i % 7] * 577 + i * .37) % 1) * (w - 16), y - 3 + (i % 3) * 2); ctx.rotate(i * 1.3); rr(-3.5, -1, 7, 2.2, 1.1); ctx.fill(); ctx.restore() }   // cốm màu trên lớp kem
  if (Z.kind === 'sand') { ctx.fillStyle = Z.topD; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x + 8 + ((d[i % 7] * 331 + i * .13) % 1) * (w - 16), y - 2 + (i % 2) * 3, 1.6, 0, 7); ctx.fill() } }
  [d[1], d[3], d[5]].forEach((dv, i) => {   // trang trí trên mặt đảo
    const px = x + 12 + dv * (w - 24), py = y - 6;
    if (X2 && X2.deco[Z.deco]) return X2.deco[Z.deco](px, py, i, w);
    if (Z.deco === 'flower') { ctx.strokeStyle = '#2E8A2E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 11); ctx.stroke(); ctx.fillStyle = i === 1 ? '#FFB8D8' : '#FFFFFF'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(px + Math.cos(k * 1.05) * 4, py - 13 + Math.sin(k * 1.05) * 4, 2.8, 2.8, 0, 0, 7); ctx.fill() } ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(px, py - 13, 2.4, 0, 7); ctx.fill() }
    else if (Z.deco === 'pine') { if (i === 1) { ctx.fillStyle = '#6A4424'; ctx.fillRect(px - 2, py - 8, 4, 8); ctx.fillStyle = '#2E9A4A'; ctx.beginPath(); ctx.moveTo(px, py - 30); ctx.lineTo(px - 11, py - 6); ctx.lineTo(px + 11, py - 6); ctx.closePath(); ctx.fill(); strokeOL(OLW, 2) } else { ctx.fillStyle = '#2E9A4A'; ctx.beginPath(); ctx.moveTo(px - 6, py + 4); ctx.lineTo(px - 2, py - 8); ctx.lineTo(px, py); ctx.lineTo(px + 3, py - 10); ctx.lineTo(px + 7, py + 4); ctx.fill() } }
    else if (Z.deco === 'shell') { if (i === 1) { ctx.fillStyle = '#FF8A7A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a2 = k * Math.PI / 5 - Math.PI / 2, q = k % 2 ? 3 : 7; ctx.lineTo(px + Math.cos(a2) * q, py - 5 + Math.sin(a2) * q) } ctx.closePath(); ctx.fill(); strokeOL(OLW, 1.5) } else { ctx.fillStyle = '#FFF0F4'; ctx.beginPath(); ctx.arc(px, py - 1, 5, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL(OLW, 1.5) } }
    else if (Z.deco === 'snow') { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(px, py + 1, 9, 5, 0, Math.PI, 0); ctx.fill() }
    else if (Z.deco === 'ice') { ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.moveTo(px - 9, py + 3); ctx.lineTo(px - 3, py + 3); ctx.lineTo(px + 3, py - 1); ctx.lineTo(px - 3, py - 1); ctx.fill() }
    else if (Z.deco === 'sakura') { if (i === 1 && w > 150) { ctx.fillStyle = '#6A3A2A'; ctx.fillRect(px - 3, py - 26, 6, 26); strokeOL(OLW, 1.5); for (const [ox, oy, rr2] of [[0, -34, 15], [-12, -26, 11], [12, -27, 11], [0, -22, 10]]) { ctx.fillStyle = '#FFB8D0'; ctx.beginPath(); ctx.arc(px + ox, py + oy, rr2, 0, 7); ctx.fill() } ctx.fillStyle = '#FFE0EA'; ctx.beginPath(); ctx.arc(px - 4, py - 38, 5, 0, 7); ctx.fill() } else { ctx.fillStyle = '#FF9AC0'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(px + Math.cos(k * 1.26) * 4, py - 6 + Math.sin(k * 1.26) * 4, 3, 2, k, 0, 7); ctx.fill() } ctx.fillStyle = '#FFE24A'; ctx.beginPath(); ctx.arc(px, py - 6, 1.8, 0, 7); ctx.fill() } }
    else if (Z.deco === 'crystal') { const cc = ['#C8A8FF', '#9AD8FF', '#FFB8E0'][i]; ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(px, py - 18); ctx.lineTo(px + 7, py - 6); ctx.lineTo(px, py + 2); ctx.lineTo(px - 7, py - 6); ctx.closePath(); ctx.fill(); strokeOL(OLC, 1.5); ctx.fillStyle = '#ffffffbb'; ctx.beginPath(); ctx.moveTo(px, py - 18); ctx.lineTo(px + 2, py - 6); ctx.lineTo(px, py); ctx.closePath(); ctx.fill() }
    else if (Z.deco === 'fern') { if (i === 1) { ctx.strokeStyle = '#2E9A4A'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (const a2 of [-1.1, -.55, 0, .55, 1.1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.sin(a2) * 10, py - 16, px + Math.sin(a2) * 18, py - 12 + Math.abs(a2) * 6); ctx.stroke() } } else { ctx.fillStyle = '#A8A49C'; ctx.beginPath(); ctx.ellipse(px, py + 1, 8, 5, 0, Math.PI, 0); ctx.fill(); strokeOL(OLW, 1.5); ctx.fillStyle = '#7AD06A'; ctx.beginPath(); ctx.ellipse(px - 1, py - 3, 5, 2, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FF8AC0'; ctx.beginPath(); ctx.arc(px + 4, py - 5, 2.2, 0, 7); ctx.fill() } }   // dương xỉ · đá rêu có hoa
    else if (Z.deco === 'maple') { if (i === 1 && w > 150) { ctx.fillStyle = '#5A3420'; ctx.fillRect(px - 3, py - 26, 6, 26); strokeOL(OLW, 1.5); for (const [ox, oy, rr2, c] of [[0, -34, 14, '#E8502A'], [-12, -26, 11, '#F48A2A'], [12, -27, 11, '#D83A2A'], [0, -22, 10, '#F8B040']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px + ox, py + oy, rr2, 0, 7); ctx.fill() } } else { for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#E8502A', '#F48A2A', '#F8C040', '#D83A2A'][(k + i) % 4]; ctx.beginPath(); ctx.ellipse(px - 6 + k * 4, py + 1 - (k % 2) * 2, 4, 2.2, k, 0, 7); ctx.fill() } } }   // cây phong · đống lá
    else if (Z.deco === 'shroom') { const cc = ['#5AE0D0', '#B07AF0', '#F07AC0'][i], hh = i === 1 ? 16 : 10, r2 = i === 1 ? 12 : 8; ctx.fillStyle = '#EDE6F4'; rr(px - 2.5, py - hh, 5, hh, 2); ctx.fill(); ctx.shadowColor = cc; ctx.shadowBlur = 14; ctx.fillStyle = cc; ctx.beginPath(); ctx.ellipse(px, py - hh, r2, r2 * .65, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; strokeOL(OLC, 1.5); ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(px - r2 * .4, py - hh - r2 * .3, 1.8, 0, 7); ctx.arc(px + r2 * .3, py - hh - r2 * .45, 1.4, 0, 7); ctx.fill() }   // nấm phát sáng
    else if (Z.deco === 'snowman') { if (i === 1) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(px, py - 9, 10, 0, 7); ctx.fill(); strokeOL(OLC, 2); ctx.beginPath(); ctx.arc(px, py - 25, 7.5, 0, 7); ctx.fill(); strokeOL(OLC, 2); ctx.fillStyle = '#1A1A2A'; ctx.beginPath(); ctx.arc(px - 2.6, py - 27, 1.3, 0, 7); ctx.arc(px + 2.6, py - 27, 1.3, 0, 7); ctx.arc(px, py - 12, 1.2, 0, 7); ctx.arc(px, py - 7, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = '#FF8A2A'; ctx.beginPath(); ctx.moveTo(px, py - 25); ctx.lineTo(px + 8, py - 24); ctx.lineTo(px, py - 23); ctx.fill(); ctx.fillStyle = '#E83A4A'; rr(px - 8, py - 19.5, 16, 3.5, 1.7); ctx.fill(); ctx.fillRect(px + 3, py - 19, 3.5, 8) } else { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(px, py + 1, 9, 5, 0, Math.PI, 0); ctx.fill() } }   // người tuyết
    else if (Z.deco === 'candy') { if (i === 1) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(px - 1.5, py - 20, 3, 20); ['#FF6AA8', '#FFFFFF', '#6AC8FF', '#FFFFFF'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py - 24, 9 - k * 2, 0, 7); ctx.fill() }); ctx.beginPath(); ctx.arc(px, py - 24, 9, 0, 7); strokeOL(OLW, 1.5) } else if (i === 0) { ctx.lineCap = 'round'; ctx.lineWidth = 4; for (const [c, dash] of [['#FFFFFF', []], ['#E83A4A', [3, 4]]]) { ctx.strokeStyle = c; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px, py - 12); ctx.arc(px + 4, py - 12, 4, Math.PI, 0); ctx.stroke() } ctx.setLineDash([]) } else { ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.ellipse(px, py - 4, 5, 3.5, 0, 0, 7); ctx.fill(); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px + sd * 4, py - 4); ctx.lineTo(px + sd * 9, py - 8); ctx.lineTo(px + sd * 9, py); ctx.closePath(); ctx.fill() } } }   // kẹo mút · gậy kẹo · kẹo gói
    else if (Z.deco === 'lantern') { if (i === 1) { ctx.fillStyle = '#4A2A1A'; ctx.fillRect(px - 1.5, py - 30, 3, 30); ctx.fillRect(px - 1.5, py - 30, 12, 2.5); const ly = py - 22 + Math.sin(S.tick * .05) * 1.2; ctx.shadowColor = '#FFB040'; ctx.shadowBlur = 18; ctx.fillStyle = '#E8402A'; ctx.beginPath(); ctx.ellipse(px + 9, ly, 6, 7.5, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#FFD080'; ctx.beginPath(); ctx.ellipse(px + 9, ly, 2.6, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3A1A10'; ctx.fillRect(px + 6, ly - 8.5, 6, 2); ctx.fillRect(px + 6, ly + 6.5, 6, 2) } else { ctx.fillStyle = '#9A94A0'; ctx.fillRect(px - 3, py - 8, 6, 8); ctx.fillRect(px - 6, py - 12, 12, 3); ctx.shadowColor = '#FFB040'; ctx.shadowBlur = 10; ctx.fillStyle = '#FFC860'; ctx.fillRect(px - 2, py - 7, 4, 3); ctx.shadowBlur = 0 } }   // đèn lồng đỏ · đèn đá
    else if (Z.deco === 'ember') { flameAt(px, py - 4 + Math.sin(S.tick * .2 + i) * 1.5, 4.5) }
    else { ctx.fillStyle = '#FFE24A'; star(px, py - 8 + Math.sin(S.tick * .05 + i) * 2, 5.5) }
  });
  ctx.globalAlpha = 1;
}
function drawPlat(p) {
  if (p.type === 'ground') {   // chân núi: vách cỏ lớn + biển xanh, có chiếc thuyền
    const y = p.y, sy = y + 112, L0 = p.x, L1 = p.x + p.w;
    // thuyền đậu bên trái
    const bx = p.x - 170, by = sy + 6 + Math.sin(S.tick * .05) * 3; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(bx - 120, by - 30); ctx.lineTo(bx + 120, by - 30); ctx.lineTo(bx + 80, by + 18); ctx.lineTo(bx - 100, by + 18); ctx.closePath(); ctx.fill(); strokeOL('#2A3A5A', 3);
    ctx.fillStyle = '#5A6A84'; ctx.fillRect(bx - 110, by - 14, 210, 8); ctx.fillStyle = '#E8EEF6'; rr(bx - 50, by - 74, 90, 44, 6); ctx.fill(); strokeOL('#2A3A5A', 3); ctx.fillStyle = '#5A84B8'; rr(bx - 40, by - 66, 30, 18, 3); ctx.fill(); rr(bx, by - 66, 30, 18, 3); ctx.fill(); ctx.fillStyle = '#5A6A84'; rr(bx - 60, by - 84, 110, 12, 4); ctx.fill(); strokeOL('#2A3A5A', 2.5);
    // vách cỏ
    ctx.fillStyle = '#BE8650'; ctx.beginPath(); ctx.moveTo(L0, y + 4); ctx.lineTo(L0 + 6, sy + 30); ctx.lineTo(L1 - 6, sy + 30); ctx.lineTo(L1, y + 4); ctx.closePath(); ctx.fill(); strokeOL(OLW, 3); ctx.save(); ctx.beginPath(); ctx.rect(L0, y, L1 - L0, sy + 30 - y); ctx.clip(); ctx.strokeStyle = '#8E5A30'; ctx.lineWidth = 4;
    for (const fy of [44, 84]) { ctx.beginPath(); ctx.moveTo(L0, y + fy); for (let rx = L0; rx < L1; rx += 30) ctx.quadraticCurveTo(rx + 15, y + fy + ((rx / 30 | 0) % 2 ? 8 : -8), rx + 30, y + fy); ctx.stroke() }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 2 ? '#8E5A30' : '#DCA468'; ctx.beginPath(); ctx.ellipse(L0 + (i * 157) % (L1 - L0), y + 24 + (i * 53) % 100, 4, 3, 0, 0, 7); ctx.fill() } ctx.restore();
    ctx.fillStyle = '#7ED957'; ctx.beginPath(); ctx.moveTo(L0 - 6, y - 6); ctx.lineTo(L1 + 6, y - 6); ctx.lineTo(L1 + 6, y + 10); let k = 0; for (let bx2 = L1 + 6; bx2 > L0 - 6; bx2 -= 16) { const dr = k++ % 3 === 1 ? 14 : 8; ctx.quadraticCurveTo(bx2 - 4, y + dr + 6, bx2 - 8, y + 8); ctx.quadraticCurveTo(bx2 - 12, y + 6, bx2 - 16, y + 8) } ctx.closePath(); ctx.fill(); strokeOL(OLW, 3);
    for (let x2 = L0 + 20; x2 < L1 - 20; x2 += 54) { const px = x2 + 20, py2 = y - 8; ctx.strokeStyle = '#2E8A2E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py2); ctx.lineTo(px, py2 - 10); ctx.stroke(); ctx.fillStyle = (x2 / 54 | 0) % 3 ? '#FFFFFF' : '#FFB8D8'; for (let k2 = 0; k2 < 6; k2++) { ctx.beginPath(); ctx.arc(px + Math.cos(k2 * 1.05) * 4, py2 - 12 + Math.sin(k2 * 1.05) * 4, 2.7, 0, 7); ctx.fill() } ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(px, py2 - 12, 2.3, 0, 7); ctx.fill() }
    return;
  }
  if (p.type === 'crumble') {
    if (p.st === 3) return;
    const shake = p.st === 1 ? Math.sin(S.tick * 1.7) * 2.5 : 0;
    ctx.save(); ctx.translate(shake, 0); island(p, p.fy, p.st === 2 ? Math.max(0, 1 - p.fy / 500) : 1);
    ctx.strokeStyle = OLW; ctx.lineWidth = 2.5; ctx.beginPath(); const cx = p.x + p.w * .35, cy = p.y + p.fy;
    ctx.moveTo(cx, cy + 6); ctx.lineTo(cx + 8, cy + 16); ctx.lineTo(cx + 2, cy + 26); ctx.moveTo(cx + p.w * .35, cy + 6); ctx.lineTo(cx + p.w * .3, cy + 20); ctx.stroke(); ctx.restore(); return;
  }
  if (p.top) { const ar = Object.assign({}, p, { w: p.w - 250 }); island(ar, 0, 1); for (let k = 0; k < 6; k++) { const lx = p.x + 40 + k * (p.w - 330) / 5, fl = Math.sin(S.tick * .3 + k) * 3; ctx.fillStyle = '#6A4A3A'; ctx.fillRect(lx - 3, p.y - 30, 6, 24); flameAt(lx, p.y - 36 + fl, 7) } castle(Object.assign({}, p, { x: p.x + p.w - 280, w: 270 })); return }
  island(p, 0, 1);
  if (p.type === 'move') { ctx.fillStyle = '#ffffffdd'; for (let k = 0; k < 2; k++) { const ax = p.x + p.w / 2 + (k ? 20 : -20); ctx.beginPath(); ctx.moveTo(ax + (k ? 7 : -7), p.y + 22); ctx.lineTo(ax, p.y + 16); ctx.lineTo(ax, p.y + 28); ctx.closePath(); ctx.fill(); strokeOL(OLW, 1.5) } }
  if (p.type === 'spring') {   // nấm lò xo
    const cx = p.x + p.w / 2, b = p.sq > 0 ? 6 : 0;
    ctx.fillStyle = '#FFF4E8'; rr(cx - 10, p.y - 19 + b, 20, 19 - b, 6); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#FF6A8A'; ctx.beginPath(); ctx.ellipse(cx, p.y - 19 + b, 32, 16 - b / 2, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL(OLW, 3);
    ctx.fillStyle = '#fff'; [[-16, -24], [3, -30], [17, -22]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(cx + dx, p.y + dy + b, 3.8, 0, 7); ctx.fill() });
  }
  if (p.cp) {
    const on = S.cpAt === p || S.cpAt.y < p.y, fx = p.x + p.w - 34, fy = p.y - 6, wv = Math.sin(S.tick * .12) * 4;
    ctx.fillStyle = '#6A4424'; ctx.fillRect(fx, fy - 64, 5, 64); ctx.strokeStyle = OLW; ctx.lineWidth = 2; ctx.strokeRect(fx, fy - 64, 5, 64); ctx.beginPath(); ctx.arc(fx + 2.5, fy - 66, 5, 0, 7); ctx.fillStyle = '#FFD23F'; ctx.fill(); strokeOL(OLW, 2);
    ctx.fillStyle = on ? '#3FBF86' : '#FF7EB6'; ctx.beginPath(); ctx.moveTo(fx + 5, fy - 64); ctx.quadraticCurveTo(fx + 25, fy - 58 + wv, fx + 46, fy - 52); ctx.quadraticCurveTo(fx + 25, fy - 46 - wv, fx + 5, fy - 40); ctx.closePath(); ctx.fill(); strokeOL(OLW, 2.5);
    label('🚩 Trạm ' + p.cp + ' · ' + ZONES[Math.min(p.cp, ZONES.length - 1)].name, p.x + p.w / 2 - 20, p.y + 70, 15);
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
  const msg = S.won ? 'Cảm ơn cậu! 💖' : BOSS && BOSS.act && !BOSS.dead ? (Math.floor(t / 90) % 2 ? 'Cẩn thận lửa rồng! 🔥' : 'Giẫm đầu nó đi! 💪') : (Math.floor(t / 90) % 2 ? 'Cứu tớ với! 🆘' : 'Leo lên đây nào! 👋');
  ctx.font = '800 15px Nunito,sans-serif'; const mw = ctx.measureText(msg).width + 24, mx = cx - mw / 2, my = by - 128 - (S.won ? 0 : Math.sin(t * .08) * 3);
  ctx.fillStyle = '#ffffff'; rr(mx, my, mw, 30, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 6, my + 30); ctx.lineTo(cx, my + 38); ctx.lineTo(cx + 6, my + 30); ctx.fill();
  ctx.fillStyle = '#e0457a'; ctx.textAlign = 'center'; ctx.fillText(msg, cx, my + 21);
  if (S.won && t % 14 === 0) parts.push({ x: cx + (Math.random() - .5) * 60, y: by - 60, vx: (Math.random() - .5) * 1.2, vy: -2 - Math.random() * 1.5, r: 5, l: 70, L: 70, c: GC.pick(['#ff7eb6', '#ff9cc8', '#ffd1e6', '#ffe08a']), heart: 1 });
  label('👸 LÂU ĐÀI CÔNG CHÚA', x + w / 2, y + 66, 17);
  if (BOSS && !BOSS.dead) label(PART === 2 ? '👹 Hạ QUỶ VƯƠNG để mở cổng!' : '🐉 Hạ RỒNG LỬA để mở cổng!', x + w / 2, y + 92, 14, '#FFE08A');
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
function drawSea() {   // biển dưới chân núi (chạy dài theo camera)
  const sy = 112, x0 = cam.x - 80, x1 = cam.x + vw + 80; if (cam.y + vh < sy) return;
  ctx.fillStyle = '#3AA8E8'; ctx.fillRect(x0, sy, x1 - x0, 1600); ctx.fillStyle = '#2E8ACC'; ctx.fillRect(x0, sy + 120, x1 - x0, 1500);
  ctx.strokeStyle = '#FFFFFFcc'; ctx.lineWidth = 3; for (let row = 0; row < 4; row++) { ctx.beginPath(); for (let wx = Math.floor(x0 / 40) * 40; wx < x1; wx += 40) { const yy = sy + 14 + row * 30 + Math.sin(wx * .05 + S.tick * .05 + row) * 3; ctx.moveTo(wx, yy); ctx.quadraticCurveTo(wx + 10, yy - 6, wx + 20, yy) } ctx.stroke() }
}
function drawBat(b) {   // pin năng lượng: quả cầu tia sét
  if (b.got) return; const y = b.y + Math.sin(S.tick * .08 + b.x) * 4, cx = b.x + 12, cy = y + 14;
  const gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24); gl.addColorStop(0, '#FFFFFFcc'); gl.addColorStop(1, '#7AF0A000'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.fill();
  ctx.fillStyle = '#3FCF86'; rr(b.x + 2, y, 20, 28, 6); ctx.fill(); strokeOL('#1E5A3A', 2.5); ctx.fillStyle = '#2C8F68'; rr(b.x + 8, y - 5, 8, 6, 2); ctx.fill(); strokeOL('#1E5A3A', 2);
  ctx.fillStyle = '#FFF6A8'; ctx.beginPath(); ctx.moveTo(b.x + 14, y + 4); ctx.lineTo(b.x + 7, y + 16); ctx.lineTo(b.x + 12, y + 16); ctx.lineTo(b.x + 10, y + 25); ctx.lineTo(b.x + 17, y + 12); ctx.lineTo(b.x + 12, y + 12); ctx.closePath(); ctx.fill();
}
function drawCoin(c) {   // xu vàng xoay
  const sq = Math.abs(Math.cos(S.tick * .08 + c.x * .05)), r = 9;
  ctx.fillStyle = '#E8A010'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r * sq + 1, r, 0, 0, 7); ctx.fill(); strokeOL('#8A5A08', 2);
  ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.ellipse(c.x, c.y, (r - 3) * sq + .5, r - 3, 0, 0, 7); ctx.fill();
  if (sq > .5) { ctx.fillStyle = '#FFF6C0'; ctx.fillRect(c.x - 2 * sq, c.y - 5, 2 * sq, 4) }
}
function drawItem(it) {   // vật phẩm: bong bóng sáng có biểu tượng
  const y = it.y + Math.sin(S.tick * .07 + it.x) * 5, R = 17, col = PWC[it.k];
  const gl = ctx.createRadialGradient(it.x, y, 3, it.x, y, R * 1.9); gl.addColorStop(0, '#FFFFFFdd'); gl.addColorStop(1, col + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(it.x, y, R * 1.9, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFFFFFee'; ctx.beginPath(); ctx.arc(it.x, y, R, 0, 7); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x, y, R + 5, S.tick * .08, S.tick * .08 + 2.4); ctx.stroke();
  ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(PWI[it.k], it.x, y + 1); ctx.textBaseline = 'alphabetic';
}
function eyes(x, y, f, angry, s) {
  s = s || 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 6 * s, y, 4.5 * s, 5.5 * s, 0, 0, 7); ctx.ellipse(x + 6 * s, y, 4.5 * s, 5.5 * s, 0, 0, 7); ctx.fill(); strokeOL(OLW, 1.6);
  ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(x - 6 * s + f * 1.6, y + 1, 2.4 * s, 0, 7); ctx.arc(x + 6 * s + f * 1.6, y + 1, 2.4 * s, 0, 7); ctx.fill();
  if (angry) { ctx.strokeStyle = '#2d2350'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 11 * s, y - 7 * s); ctx.lineTo(x - 3 * s, y - 4 * s); ctx.moveTo(x + 11 * s, y - 7 * s); ctx.lineTo(x + 3 * s, y - 4 * s); ctx.stroke() }
}
function flameAt(x, y, r) { const fl = 1 + Math.sin(S.tick * .5 + x) * .15; ctx.fillStyle = '#FF5A1Acc'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.6 * fl, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFC23A'; ctx.beginPath(); ctx.ellipse(x, y + r * .3, r * .6, r * 1.1 * fl, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFF6C0'; ctx.beginPath(); ctx.ellipse(x, y + r * .6, r * .3, r * .5, 0, 0, 7); ctx.fill() }
function drawEnemy(e) {   // con vật trên đường: dê húc · cua · chim cánh cụt · nhím gai · ong · chim · slime · golem pha lê · ma mây · quái dung nham · dơi · tiểu quỷ lửa · cầu lửa
  const fly = e.bx != null, f = fly ? e.f : (e.vx > 0 ? 1 : -1), x = e.x, y = e.y, cx = x + e.w / 2, by = y + e.h;
  if (e.dead) { if (e.dead <= 1) return; ctx.globalAlpha = e.dead / 40; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(cx, by - 5, 20, 6, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2); ctx.fillStyle = '#FFD23F'; star(cx - 8, by - 16, 5); star(cx + 9, by - 20, 4); ctx.globalAlpha = 1; return }
  const bob = Math.sin(S.tick * .25 + x * .1), legs = Math.sin(S.tick * (e.ch ? .7 : .35) + x);
  if (X2 && X2.enemy[e.k]) return X2.enemy[e.k](e, f, cx, by, bob, legs);
  if (!fly && e.k !== 'podo' && e.k !== 'ghost') { ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(cx, by, 17, 3.5, 0, 0, 7); ctx.fill() }
  if (e.k === 'goat') {   // dê sừng xoắn (thấy em là lao tới húc)
    ctx.fillStyle = '#E8D8C0'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * 9 + legs * d * 2, by - 4, 4, 6, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2) }
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(cx - f * 3, by - 16, 17, 12, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    const hx = cx + f * 11, hy = by - 24 + bob; ctx.fillStyle = '#F4E8DA'; ctx.beginPath(); ctx.ellipse(hx, hy, 11, 10, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#9A5A2E'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + d * 8, hy - 7, 6, 0, 7); ctx.fill(); strokeOL(OLW, 2); ctx.strokeStyle = '#6A3A1A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx + d * 8, hy - 7, 3, 0, 5); ctx.stroke() }
    ctx.fillStyle = '#B8763A'; ctx.beginPath(); ctx.moveTo(hx - 3, hy + 6); ctx.lineTo(hx + 3, hy + 6); ctx.lineTo(hx, hy + 13); ctx.closePath(); ctx.fill();
    eyes(hx + f * 1, hy - 1, f, e.ch, .7);
    if (e.ch) { ctx.fillStyle = '#9A6BFF'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(hx - f * 14 + i * 6, hy - 22); ctx.lineTo(hx - f * 10 + i * 6, hy - 14); ctx.lineTo(hx - f * 16 + i * 6, hy - 15); ctx.closePath(); ctx.fill() } }
  } else if (e.k === 'crab') {   // cua đỏ đi ngang
    ctx.strokeStyle = '#C83A2A'; ctx.lineWidth = 3; for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx + d * 10, by - 8); ctx.lineTo(cx + d * (16 + k * 3), by - 2 + Math.sin(S.tick * .5 + k + d) * 2); ctx.stroke() }
    ctx.fillStyle = '#FF6A4A'; ctx.beginPath(); ctx.ellipse(cx, by - 11, 15, 10, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    for (const d of [-1, 1]) { ctx.fillStyle = '#FF6A4A'; ctx.beginPath(); ctx.arc(cx + d * 17, by - 22 + bob * 2, 6, 0, 7); ctx.fill(); strokeOL(OLW, 2); ctx.fillStyle = '#FFE0D0'; ctx.beginPath(); ctx.moveTo(cx + d * 17, by - 22 + bob * 2); ctx.lineTo(cx + d * 23, by - 27 + bob * 2); ctx.lineTo(cx + d * 21, by - 19 + bob * 2); ctx.closePath(); ctx.fill() }
    ctx.strokeStyle = OLW; ctx.lineWidth = 2; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * 4, by - 18); ctx.lineTo(cx + d * 5, by - 25); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + d * 5, by - 27, 3.5, 0, 7); ctx.fill(); strokeOL(OLW, 1.5); ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(cx + d * 5 + f, by - 27, 1.6, 0, 7); ctx.fill() }
  } else if (e.k === 'peng') {   // chim cánh cụt trượt băng
    ctx.fillStyle = '#FFA21E'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * 6, by - 2, 6, 3, 0, 0, 7); ctx.fill(); strokeOL(OLW, 1.5) }
    ctx.fillStyle = '#2A3048'; ctx.beginPath(); ctx.ellipse(cx, by - 17, 14, 17, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(cx + f * 2, by - 13, 9, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2A3048'; ctx.beginPath(); ctx.ellipse(cx - f * 12, by - 16, 4, 9, f * .5 + legs * .3, 0, 7); ctx.fill();
    eyes(cx + f * 3, by - 25, f, true, .6); ctx.fillStyle = '#FFA21E'; ctx.beginPath(); ctx.moveTo(cx + f * 8, by - 22); ctx.lineTo(cx + f * 16, by - 20); ctx.lineTo(cx + f * 8, by - 18); ctx.closePath(); ctx.fill(); strokeOL(OLW, 1.5);
  } else if (e.k === 'spiky') {   // nhím gai — không giẫm được
    ctx.fillStyle = '#8A5A3A'; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const a = Math.PI + i * Math.PI / 10, r = i % 2 ? 23 : 14; ctx.lineTo(cx + Math.cos(a) * r - f * 2, by - 4 + Math.sin(a) * r) } ctx.closePath(); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#E8C8A0'; ctx.beginPath(); ctx.ellipse(cx + f * 10, by - 8, 9, 8, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2);
    ctx.fillStyle = '#2d2350'; ctx.beginPath(); ctx.arc(cx + f * 11, by - 11, 2.2, 0, 7); ctx.arc(cx + f * 18, by - 7, 2.4, 0, 7); ctx.fill();
  } else if (e.k === 'slime') {   // slime thạch hồng nảy tưng tưng
    const sq = Math.sin(S.tick * .12 + e.ph), hgt = 18 + sq * 6, wid = 17 - sq * 3, col = e.p.z === 1 ? '#7AE07A' : '#FF8AB8';
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - wid, by); ctx.quadraticCurveTo(cx - wid, by - hgt * 1.6, cx, by - hgt * 1.5); ctx.quadraticCurveTo(cx + wid, by - hgt * 1.6, cx + wid, by); ctx.closePath(); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#ffffff88'; ctx.beginPath(); ctx.ellipse(cx - wid * .4, by - hgt * 1.1, 4, 6, -.4, 0, 7); ctx.fill(); eyes(cx + f * 3, by - hgt * .8, f, true, .65);
  } else if (e.k === 'golem') {   // người đá pha lê
    ctx.fillStyle = '#6A58B8'; for (const d of [-1, 1]) { rr(cx + d * 8 - 6, by - 12 + (d * legs > 0 ? -2 : 0), 12, 12, 3); ctx.fill(); strokeOL(OLC, 2) }
    ctx.fillStyle = '#9A84E8'; rr(cx - 17, by - 36, 34, 26, 7); ctx.fill(); strokeOL(OLC, 2.5);
    ctx.fillStyle = '#E0D0FF'; ctx.beginPath(); ctx.moveTo(cx - 6, by - 36); ctx.lineTo(cx, by - 50); ctx.lineTo(cx + 6, by - 36); ctx.closePath(); ctx.fill(); strokeOL(OLC, 1.5); ctx.beginPath(); ctx.moveTo(cx + 8, by - 36); ctx.lineTo(cx + 13, by - 45); ctx.lineTo(cx + 16, by - 36); ctx.closePath(); ctx.fill(); strokeOL(OLC, 1.5);
    ctx.fillStyle = '#7AF0FF'; ctx.shadowColor = '#7AF0FF'; ctx.shadowBlur = 8; ctx.fillRect(cx + f * 4 - 9, by - 28, 6, 5); ctx.fillRect(cx + f * 4 + 3, by - 28, 6, 5); ctx.shadowBlur = 0;
  } else if (e.k === 'ghost') {   // ma mây lơ lửng
    const fy = by - 6 + Math.sin(S.tick * .08 + e.ph) * 5; ctx.globalAlpha = .9;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, fy - 18, 16, Math.PI, 0); ctx.lineTo(cx + 16, fy); for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(cx + 12 - k * 8, fy + 6, cx + 8 - k * 8, fy); ctx.closePath(); ctx.fill(); strokeOL(OLC, 2.5);
    ctx.fillStyle = '#3A3A5A'; ctx.beginPath(); ctx.ellipse(cx + f * 3 - 5, fy - 20, 3, 4.5, 0, 0, 7); ctx.ellipse(cx + f * 3 + 5, fy - 20, 3, 4.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FF9AC0'; ctx.beginPath(); ctx.ellipse(cx + f * 3, fy - 11, 4, 3, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  } else if (e.k === 'lavablob') {   // quái dung nham
    const g2 = ctx.createRadialGradient(cx, by - 14, 2, cx, by - 14, 22); g2.addColorStop(0, '#FFE070'); g2.addColorStop(.6, '#FF6A1A'); g2.addColorStop(1, '#B8200A'); ctx.fillStyle = g2;
    ctx.beginPath(); ctx.ellipse(cx, by - 13, 18, 14 + bob * 1.5, 0, 0, 7); ctx.fill(); strokeOL('#3A0A04', 2.5);
    for (let k = 0; k < 3; k++) flameAt(cx - 9 + k * 9, by - 28 - Math.abs(Math.sin(S.tick * .3 + k)) * 4, 4);
    eyes(cx + f * 3, by - 15, f, true, .6);
  } else if (e.k === 'podo') {   // cầu lửa bật lên từ vực (không giẫm được)
    if (e.y >= e.by - 1) return; const up = e.vy < 0; ctx.save(); ctx.translate(cx, y + 16); if (!up) ctx.rotate(Math.PI);
    const g3 = ctx.createRadialGradient(0, 0, 2, 0, 0, 22); g3.addColorStop(0, '#FFF6C0'); g3.addColorStop(.5, '#FF8A1A'); g3.addColorStop(1, '#FF3A0A00'); ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#FF5A1A'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); strokeOL('#6A1A04', 2); ctx.fillStyle = '#FFC23A'; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(0, 30, 10, 6); ctx.fill(); ctx.restore(); eyes(cx, y + 13, 0, true, .55);
  } else if (e.k === 'bat' || e.k === 'imp') {   // dơi pha lê · tiểu quỷ lửa
    const wing = Math.sin(S.tick * .6) * 8, imp = e.k === 'imp', bc = imp ? '#C8301A' : '#5A4A8A', wc = imp ? '#FF7A3A' : '#8A7AC8';
    ctx.fillStyle = wc; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * 6, y + 12); ctx.quadraticCurveTo(cx + d * 20, y - 2 - wing, cx + d * 28, y + 8 - wing); ctx.lineTo(cx + d * 22, y + 12); ctx.lineTo(cx + d * 17, y + 8); ctx.lineTo(cx + d * 12, y + 16); ctx.closePath(); ctx.fill(); strokeOL(OLW, 2) }
    ctx.fillStyle = bc; ctx.beginPath(); ctx.ellipse(cx, y + 13, 11, 11, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = bc; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * 4, y + 4); ctx.lineTo(cx + d * 9, y - 6); ctx.lineTo(cx + d * 10, y + 5); ctx.closePath(); ctx.fill() }
    if (imp) { ctx.strokeStyle = bc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - f * 10, y + 18); ctx.quadraticCurveTo(cx - f * 20, y + 26, cx - f * 16, y + 32); ctx.stroke(); path2([cx - f * 18, y + 30, cx - f * 13, y + 31, cx - f * 16, y + 37], bc) }
    eyes(cx + f * 2, y + 11, f, true, .55);
  } else if (e.k === 'bee') {   // ong vằn vàng đen
    const wing = Math.sin(S.tick * 1.2) * 4; ctx.fillStyle = '#FFFFFFcc'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * 6, y + 2 - wing, 7, 10, d * .5, 0, 7); ctx.fill(); strokeOL(OLC, 1.5) }
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.ellipse(cx, y + 14, 16, 11, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#2A1E14'; for (const sx2 of [-5, 3]) ctx.fillRect(cx + sx2 - f * 0, y + 4, 4, 20);
    ctx.fillStyle = '#2A1E14'; ctx.beginPath(); ctx.moveTo(cx - f * 16, y + 13); ctx.lineTo(cx - f * 23, y + 15); ctx.lineTo(cx - f * 16, y + 17); ctx.closePath(); ctx.fill();
    eyes(cx + f * 7, y + 11, f, true, .6);
  } else {   // chim xanh vỗ cánh
    const wing = Math.sin(S.tick * .4) * 9;
    ctx.fillStyle = '#5AB0FF'; ctx.beginPath(); ctx.ellipse(cx, y + 14, 17, 12, 0, 0, 7); ctx.fill(); strokeOL(OLW, 2.5);
    ctx.fillStyle = '#9FD2FF'; ctx.beginPath(); ctx.moveTo(cx - 4, y + 10); ctx.quadraticCurveTo(cx - 18, y + 2 - wing, cx - 24, y + 6 - wing); ctx.quadraticCurveTo(cx - 14, y + 16, cx - 4, y + 16); ctx.closePath(); ctx.fill(); strokeOL(OLW, 2);
    ctx.fillStyle = '#FFC23A'; ctx.beginPath(); ctx.moveTo(cx + f * 15, y + 12); ctx.lineTo(cx + f * 24, y + 15); ctx.lineTo(cx + f * 15, y + 18); ctx.closePath(); ctx.fill(); strokeOL(OLW, 1.5);
    eyes(cx + f * 6, y + 10, f, true, .8);
  }
}
function path2(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill() }
function drawDragon() {   // 🐉 rồng lửa đỏ có cánh, sừng, bụng vàng
  if (PART === 2) return X2.boss(BOSS, P[P.length - 1], BF);
  const B = BOSS, top = P[P.length - 1]; if (!B || (B.dead && B.dy > 880)) return;
  const x = B.x, gy = top.y + B.hop + B.dy, t = S.tick, fl = B.inv && (t >> 2) & 1, br = Math.sin(t * .06) * 3, op = B.mouth > 0 ? 1 : 0;
  ctx.save(); if (B.dead) { ctx.globalAlpha = Math.max(0, 1 - B.dy / 900); ctx.translate(x + 60, gy - 60); ctx.rotate(B.dy * .004); ctx.translate(-(x + 60), -(gy - 60)) }
  if (fl) ctx.globalAlpha *= .5;
  ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(x + 70, top.y, 80, 10, 0, 0, 7); ctx.fill();
  // cánh
  const wg = Math.sin(t * .1) * 14; ctx.fillStyle = '#8A1A2A';
  ctx.beginPath(); ctx.moveTo(x + 80, gy - 80); ctx.quadraticCurveTo(x + 110, gy - 170 - wg, x + 170, gy - 150 - wg); ctx.lineTo(x + 150, gy - 120 - wg * .5); ctx.lineTo(x + 165, gy - 100); ctx.lineTo(x + 130, gy - 95); ctx.lineTo(x + 135, gy - 70); ctx.closePath(); ctx.fill(); strokeOL('#3A0A10', 3);
  // đuôi
  ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 110, gy - 24); ctx.quadraticCurveTo(x + 160, gy - 10 + Math.sin(t * .08) * 8, x + 190, gy - 40); ctx.stroke(); path2([x + 186, gy - 52, x + 206, gy - 54, x + 196, gy - 32], '#FFC23A');
  // chân
  ctx.fillStyle = '#A81E30'; for (const lx of [x + 40, x + 92]) { rr(lx, gy - 34, 22, 34, 8); ctx.fill(); strokeOL('#3A0A10', 2.5); ctx.fillStyle = '#FFF0D0'; for (let k = 0; k < 3; k++) path2([lx + 2 + k * 7, gy, lx + 6 + k * 7, gy - 6, lx + 9 + k * 7, gy], '#FFF0D0'); ctx.fillStyle = '#A81E30' }
  // thân + bụng
  ctx.fillStyle = '#D8303E'; ctx.beginPath(); ctx.ellipse(x + 75, gy - 58 + br * .3, 52, 38, 0, 0, 7); ctx.fill(); strokeOL('#3A0A10', 3);
  ctx.fillStyle = '#FFD06A'; ctx.beginPath(); ctx.ellipse(x + 62, gy - 50, 30, 26, -.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#E8A040'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 40, gy - 66 + k * 11); ctx.lineTo(x + 82, gy - 64 + k * 11); ctx.stroke() }
  for (let k = 0; k < 5; k++) path2([x + 70 + k * 14, gy - 92 + Math.abs(k - 2) * 4, x + 78 + k * 14, gy - 108 + Math.abs(k - 2) * 4, x + 84 + k * 14, gy - 90 + Math.abs(k - 2) * 4], '#FFC23A');
  // cổ + đầu
  ctx.fillStyle = '#D8303E'; ctx.beginPath(); ctx.ellipse(x + 40, gy - 92 + br, 20, 26, -.5, 0, 7); ctx.fill(); strokeOL('#3A0A10', 3);
  const hx = x + 24, hy = gy - 116 + br;
  ctx.fillStyle = '#E03A48'; ctx.beginPath(); ctx.ellipse(hx, hy, 32, 24, 0, 0, 7); ctx.fill(); strokeOL('#3A0A10', 3);
  ctx.fillStyle = '#E03A48'; ctx.beginPath(); ctx.moveTo(hx - 10, hy - 4); ctx.lineTo(hx - 50, hy + 2 - op * 4); ctx.lineTo(hx - 48, hy + 14); ctx.lineTo(hx - 8, hy + 16); ctx.closePath(); ctx.fill(); strokeOL('#3A0A10', 2.5);
  if (op) { ctx.fillStyle = '#3A0A10'; path2([hx - 48, hy + 10, hx - 10, hy + 12, hx - 10, hy + 26, hx - 46, hy + 22], '#3A0A10'); for (let k = 0; k < 3; k++) flameAt(hx - 58 - k * 10, hy + 15 + Math.sin(t * .5 + k) * 3, 9 - k * 2) }
  else { ctx.fillStyle = '#FFFFFF'; for (let k = 0; k < 3; k++) path2([hx - 44 + k * 10, hy + 14, hx - 40 + k * 10, hy + 20, hx - 36 + k * 10, hy + 14], '#FFFFFF') }
  circ2(hx - 44, hy + 1, 2.5, '#3A0A10');
  for (const d of [0, 1]) path2([hx + 6 + d * 16, hy - 18, hx + 16 + d * 18, hy - 46, hx + 20 + d * 16, hy - 16], '#FFE0A0');
  ctx.fillStyle = '#FFE24A'; ctx.beginPath(); ctx.ellipse(hx - 8, hy - 8, 8, 7, 0, 0, 7); ctx.fill(); strokeOL('#3A0A10', 2); circ2(hx - 11, hy - 7, 3.5, '#1A0A0A'); ctx.strokeStyle = '#3A0A10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 20, hy - 18); ctx.lineTo(hx, hy - 12); ctx.stroke();
  ctx.fillStyle = '#ffffff55'; for (const [sx2, sy2] of [[hx - 22, hy + 4], [hx - 30, hy + 3]]) circ2(sx2, sy2, 2, '#5A0A10');
  ctx.restore();
  // lửa rồng phun
  for (const f of BF) { if (f.d > 0) continue; const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 22); g.addColorStop(0, '#FFF6C0'); g.addColorStop(.5, '#FF8A1Add'); g.addColorStop(1, '#FF3A0A00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 22, 0, 7); ctx.fill(); flameAt(f.x + 12, f.y, 8); flameAt(f.x, f.y, 10) }
}
function circ2(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill() }
function drawBossBar() {   // thanh máu rồng
  const B = BOSS; if (!B || !B.act || B.dead) return;
  const w = Math.min(320, cw - 120), x = (cw - w) / 2, y = 58;
  ctx.fillStyle = '#1A0A10cc'; rr(x - 8, y - 6, w + 16, 34, 12); ctx.fill(); ctx.strokeStyle = '#FFB040'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#4A1A20'; rr(x + 40, y + 6, w - 48, 12, 6); ctx.fill(); ctx.fillStyle = B.hp <= BOSSHP * .5 ? '#FF3A3A' : PART === 2 ? '#B57BFF' : '#FF8A1A'; rr(x + 40, y + 6, (w - 48) * B.hp / BOSSHP, 12, 6); ctx.fill();
  ctx.font = '800 14px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFE08A'; ctx.fillText(PART === 2 ? '👹' : '🐉', x, y + 18); ctx.textAlign = 'center';
}
/* hiệu ứng bay khắp màn hình theo vùng: cánh hoa anh đào · lá · tuyết · tàn lửa · lấp lánh · bong bóng nước · lá phong · đom đóm · cốm kẹo · đèn lồng bay */
function drawFX() {
  const z = clamp(S.cpAt && S.cpAt.cp ? Math.min(NZ - 1, S.cpAt.cp) : 0, 0, NZ - 1), zn = ZONES[Math.min(NZ - 1, curZone())], want = zn.fxN;
  while (FXP.length < want) FXP.push({ x: Math.random() * cw, y: Math.random() * ch, vx: 0, vy: 0, a: Math.random() * 6, s: .6 + Math.random() * .8, k: zn.fx });
  if (FXP.length > want) FXP.length = want;
  for (const q of FXP) {
    if (q.k !== zn.fx) q.k = zn.fx;
    const k = q.k;
    const up = k === 'ember' || k === 'lantern' || k === 'bubble' || (X2 && X2.fxUp[k]);
    if (X2 && X2.fxMove[k]) X2.fxMove[k](q); else if (up) { q.y -= (k === 'ember' ? 1.2 : k === 'lantern' ? .45 : .75) * q.s; q.x += Math.sin(q.a += .04) * (k === 'lantern' ? .3 : .6) } else if (k === 'firefly') { q.a += .03; q.x += Math.cos(q.a * 1.3) * .7; q.y += Math.sin(q.a) * .5 } else if (k === 'snow') { q.y += 1.3 * q.s; q.x += Math.sin(q.a += .03) * .7 } else if (k === 'spark') { q.a += .08; q.y += .3 } else { q.y += 1.1 * q.s; q.x += -0.8 * q.s + Math.sin(q.a += .04) * 1.2 }
    if (q.y > ch + 10) { q.y = -10; q.x = Math.random() * cw * 1.2 } if (q.y < -12 && (up || k === 'firefly')) { q.y = ch + 8; q.x = Math.random() * cw } if (q.x < -12) q.x = cw + 10; if (q.x > cw + 14) q.x = -10;
    if (X2 && X2.fx[k]) X2.fx[k](q);
    else if (k === 'petal') { ctx.fillStyle = '#FFB4CC'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 * q.s, 3.4 * q.s * Math.abs(Math.cos(q.a)) + .8, q.a, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE0EA'; ctx.beginPath(); ctx.ellipse(q.x - 1, q.y - 1, 2.4 * q.s, 1.2 * q.s, q.a, 0, 7); ctx.fill() }
    else if (k === 'leaf') { ctx.fillStyle = '#7ACB5A'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 * q.s, 2.6 * q.s, q.a, 0, 7); ctx.fill() }
    else if (k === 'snow') { ctx.fillStyle = '#FFFFFFdd'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6 * q.s, 0, 7); ctx.fill() }
    else if (k === 'ember') { ctx.fillStyle = (S.tick + q.x | 0) % 20 < 10 ? '#FFB040' : '#FF6A1A'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.2 * q.s, 0, 7); ctx.fill() }
    else if (k === 'spark') { ctx.globalAlpha = .5 + .5 * Math.sin(q.a); ctx.fillStyle = '#F4E8FF'; star(q.x, q.y, 3.5 * q.s); ctx.globalAlpha = 1 }
    else if (k === 'maple') { ctx.fillStyle = ['#E8402A', '#F48A2A', '#F8C83A'][(q.s * 100 | 0) % 3]; ctx.beginPath(); for (let j = 0; j < 10; j++) { const a2 = q.a + j * Math.PI / 5, r2 = (j % 2 ? 2.4 : 6.5) * q.s; ctx.lineTo(q.x + Math.cos(a2) * r2, q.y + Math.sin(a2) * r2) } ctx.closePath(); ctx.fill() }
    else if (k === 'sprinkle') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a * 2); ctx.fillStyle = ['#FF6AA8', '#FFE24A', '#6AC8FF', '#7AE07A', '#B07AF0'][(q.s * 100 | 0) % 5]; rr(-4.5 * q.s, -1.4, 9 * q.s, 2.8, 1.4); ctx.fill(); ctx.restore() }
    else if (k === 'bubble') { const r2 = 3 + 4 * q.s; ctx.fillStyle = 'rgba(190,235,255,.22)'; ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(q.x, q.y, r2, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffffdd'; ctx.beginPath(); ctx.arc(q.x - r2 * .35, q.y - r2 * .35, r2 * .25, 0, 7); ctx.fill() }
    else if (k === 'firefly') { const b = .35 + .65 * Math.abs(Math.sin(q.a * 2.2)), gl = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 9 * q.s); gl.addColorStop(0, 'rgba(230,255,140,' + (.7 * b).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(230,255,140,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(q.x, q.y, 9 * q.s, 0, 7); ctx.fill(); ctx.fillStyle = '#F6FFB0'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, 7); ctx.fill() }
    else if (k === 'lantern') { const s2 = q.s, gl = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 18 * s2); gl.addColorStop(0, 'rgba(255,190,90,.55)'); gl.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(q.x, q.y, 18 * s2, 0, 7); ctx.fill(); ctx.fillStyle = '#FF7A2A'; rr(q.x - 5 * s2, q.y - 7 * s2, 10 * s2, 13 * s2, 4 * s2); ctx.fill(); ctx.fillStyle = '#FFD890'; rr(q.x - 2.5 * s2, q.y - 4 * s2, 5 * s2, 8 * s2, 2 * s2); ctx.fill(); ctx.fillStyle = '#B83A1A'; ctx.fillRect(q.x - 5 * s2, q.y - 7 * s2, 10 * s2, 1.6 * s2) }
  }
}
let zoneCache = 0;
function curZone() { const p = pl.on; if (p && p.z != null) zoneCache = p.z; return zoneCache }
/* nhân vật: dùng cho cả mình và các bạn (o = {x,y,f,c,walk,sq,tired,fz,sh,a}) */
function climber(o) {   // nhà leo núi kiểu Gimkit: thân tròn, mũ bảo hộ cam, ba lô có cuộn dây
  const cx = o.x + 17, by = o.y + 40, s = o.sq || 0, f = o.f || 1, ol = mix(o.c, '#14201A', .62);
  if (PART === 2) X2.hero(o, cx, by); else {
  ctx.save(); ctx.globalAlpha = o.a || 1; ctx.translate(cx, by); ctx.scale(1 + s * .25, 1 - s * .25);
  ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 4, 0, 0, 7); ctx.fill();
  const st = o.walk ? Math.sin(o.walk) * 4 : 0;
  ctx.fillStyle = mix(o.c, '#14201A', .35); for (const [dx, k] of [[-8, st], [8, -st]]) { ctx.beginPath(); ctx.ellipse(dx, -3 + Math.min(0, k), 6.5, 4.5, 0, 0, 7); ctx.fill(); strokeOL(ol, 2) }
  ctx.fillStyle = '#4A8AD8'; rr(-f * 15 - 8, -33, 15, 22, 5); ctx.fill(); strokeOL(ol, 2.5);   // ba lô
  ctx.strokeStyle = '#C8904A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-f * 13, -15, 6, 0, 7); ctx.stroke(); ctx.strokeStyle = '#8A5A2A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-f * 13, -15, 3, 0, 7); ctx.stroke();
  ctx.fillStyle = o.c; ctx.beginPath(); ctx.ellipse(0, -19, 15.5, 18, 0, 0, 7); ctx.fill(); strokeOL(ol, 3);   // thân
  ctx.fillStyle = mix(o.c, '#ffffff', .45); ctx.beginPath(); ctx.ellipse(-f * 6, -24, 4, 6, -.4 * f, 0, 7); ctx.fill();
  ctx.fillStyle = mix(o.c, '#14201A', .15); ctx.beginPath(); ctx.ellipse(f * 14, -13 + st * .3, 5, 6, 0, 0, 7); ctx.fill(); strokeOL(ol, 2);   // tay
  const ex = f * 4;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-5 + ex, -21, 4.5, o.tired ? 2.5 : 6, 0, 0, 7); ctx.ellipse(6 + ex, -21, 4.5, o.tired ? 2.5 : 6, 0, 0, 7); ctx.fill(); strokeOL(ol, 1.6);
  ctx.fillStyle = '#1A1A2A'; ctx.beginPath(); ctx.arc(-4 + ex + f * 1.4, -20, 2.4, 0, 7); ctx.arc(7 + ex + f * 1.4, -20, 2.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3.4 + ex + f * 1.4, -21.4, .9, 0, 7); ctx.arc(7.6 + ex + f * 1.4, -21.4, .9, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFA81E'; ctx.beginPath(); ctx.arc(0, -29, 16.5, Math.PI, 0); ctx.closePath(); ctx.fill(); strokeOL(ol, 3);   // mũ bảo hộ
  ctx.fillStyle = '#E8860A'; rr(-19, -31, 38, 6, 3); ctx.fill(); strokeOL(ol, 2.5);
  ctx.fillStyle = '#FFD07A'; ctx.beginPath(); ctx.ellipse(-f * 5, -38, 5, 2.5, -.3 * f, 0, 7); ctx.fill();
  ctx.strokeStyle = ol; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(0, -31); ctx.stroke();
  ctx.fillStyle = '#FFF2B0'; ctx.beginPath(); ctx.arc(f * 9, -37, 3, 0, 7); ctx.fill(); strokeOL(ol, 1.5);
  ctx.restore(); }
  if (o.fz) { ctx.save(); ctx.globalAlpha = .55 * (o.a || 1); ctx.fillStyle = '#bfe8ff'; rr(o.x - 8, o.y - 14, 50, 58, 8); ctx.fill(); ctx.globalAlpha = .9 * (o.a || 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x - 2, o.y - 4); ctx.lineTo(o.x + 10, o.y - 10); ctx.moveTo(o.x + 30, o.y + 40); ctx.lineTo(o.x + 38, o.y + 30); ctx.stroke(); ctx.restore() }
  if (o.sh) { ctx.save(); ctx.globalAlpha = (.35 + .15 * Math.sin(S.tick * .15)) * (o.a || 1); ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, o.y + 16, 36, 0, 7); ctx.stroke(); ctx.restore() }
}
function drawTimers() {   // đồng hồ vật phẩm ngay cạnh nhân vật (vòng tròn đếm ngược + số giây)
  if (PW.flw) { ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌼', pl.x + 17 + pl.face * 20, pl.y + 22 + Math.sin(S.tick * .2) * 2); ctx.textBaseline = 'alphabetic' }
  const L = Object.keys(PW).filter(k => PW[k] > 0), R = 14;
  L.forEach((k, i) => {
    const t = PW[k], cx = pl.x + 17 + (pl.face > 0 ? -42 : 42), cy = pl.y + 2 + i * 32, col = PWC[k];
    ctx.fillStyle = '#1A1033cc'; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = t < 120 && (S.tick >> 3) & 1 ? '#FFFFFF' : col; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t / PWF[k]); ctx.stroke();
    ctx.font = '15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(PWI[k], cx, cy + 1); ctx.textBaseline = 'alphabetic';
    label(Math.ceil(t / 60) + 's', cx + (pl.face > 0 ? -30 : 30), cy + 5, 14, t < 120 ? '#FF8A9A' : '#FFFFFF');
  });
  if (PW.shd) { ctx.save(); ctx.globalAlpha = .35 + .15 * Math.sin(S.tick * .15); ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(pl.x + 17, pl.y + 18, 34, 0, 7); ctx.stroke(); ctx.restore() }
  if (PW.fea && !pl.on) { ctx.fillStyle = '#FFFFFFcc'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(pl.x + 17 + d * 20, pl.y + 14, 10, 5, d * -.5 + Math.sin(S.tick * .4) * .3 * d, 0, 7); ctx.fill() } }
}
function drawGhosts() {
  const now = S.now();
  for (const id in S.ghosts) {
    const g = S.ghosts[id]; if (g.x == null) { g.x = g.tx; g.y = g.ty }
    const dx = g.tx - g.x; g.moving = Math.abs(dx) > .3; g.x += dx * .2; g.y += (g.ty - g.y) * .2; if (g.moving) g.walk = (g.walk || 0) + .35;
    if (Math.abs(g.y - cam.y - vh / 2) > vh || g.x < cam.x - 200 || g.x > cam.x + vw + 200) continue;
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
  const top = cam.y - 120, bot = cam.y + vh + 160, lf = cam.x - 120, rt = cam.x + vw + 120, inX = (x, w) => x + (w || 0) > lf && x < rt;
  drawSea();
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; if ((p.y > top && p.y < bot + (p.top ? 320 : 0) || p.type === 'ground') && inX(p.x - 200, p.w + 400)) drawPlat(p) }   // vẽ từ trên xuống: tháp lâu đài không che bậc bên dưới
  for (const b of BAT) if (b.y > top && b.y < bot && inX(b.x)) drawBat(b);
  for (const c of COINS) if (!c.got && c.y > top && c.y < bot && inX(c.x)) drawCoin(c);
  for (const it of ITEMS) if (!it.got && it.y > top && it.y < bot && inX(it.x)) drawItem(it);
  for (const e of E) if (e.y > top && e.y < bot && inX(e.x)) drawEnemy(e);
  drawDragon();
  for (const b of FB) { const g2 = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 14); g2.addColorStop(0, '#FFF6C0'); g2.addColorStop(.5, '#FF9A1Acc'); g2.addColorStop(1, '#FF5A1A00'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(b.x, b.y, 14, 0, 7); ctx.fill(); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, 7); ctx.fill() }
  for (const q of parts) { ctx.globalAlpha = Math.max(0, q.l / q.L); ctx.fillStyle = q.c; ctx.beginPath(); if (q.heart) { ctx.moveTo(q.x, q.y + q.r); ctx.bezierCurveTo(q.x - q.r * 2, q.y - q.r * .6, q.x - q.r * .7, q.y - q.r * 2, q.x, q.y - q.r * .7); ctx.bezierCurveTo(q.x + q.r * .7, q.y - q.r * 2, q.x + q.r * 2, q.y - q.r * .6, q.x, q.y + q.r) } else ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill() } ctx.globalAlpha = 1;
  drawGhosts();
  const now = S.now();
  climber({ x: pl.x, y: pl.y, f: pl.face, c: S.color, vx: pl.vx, sq: pl.sq, walk: pl.on && Math.abs(pl.vx) > .5 ? pl.walk : 0, tired: S.energy <= 0, fz: now < S.fz, sh: now < S.sh, a: pl.inv && (S.tick >> 2) & 1 ? .4 : 1 });
  if (S.name) label(S.name, pl.x + 17, pl.y - 22, 14, '#fff', '#5b4bb0');
  drawTimers();
  if (S.energy <= 0 && S.running && !S.over) {
    const cx = pl.x + 17, y = pl.y - 52 + Math.sin(S.tick * .1) * 3;
    ctx.fillStyle = '#fff'; rr(cx - 26, y - 22, 52, 26, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 5, y + 4); ctx.lineTo(cx, y + 11); ctx.lineTo(cx + 5, y + 4); ctx.fill();
    ctx.font = '800 15px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5c7a'; ctx.fillText('⚡ 0!', cx, y - 4);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawFX(); drawMeter(); drawBossBar();
  const hl = '⛰ Độ cao: ' + alt() + ' m'; ctx.font = '800 15px Nunito,sans-serif'; const hw = ctx.measureText(hl).width + 26;   // ô độ cao kiểu Gimkit
  ctx.fillStyle = '#ffffffee'; rr(12, 12, hw, 32, 16); ctx.fill(); ctx.strokeStyle = '#5AB0FF'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#2E3A5A'; ctx.textAlign = 'left'; ctx.fillText(hl, 25, 33);
  const cl = '🪙 ' + S.coins; const cw2 = ctx.measureText(cl).width + 26; ctx.fillStyle = '#ffffffee'; rr(18 + hw, 12, cw2, 32, 16); ctx.fill(); ctx.strokeStyle = '#FFC23A'; ctx.stroke(); ctx.fillStyle = '#7A4A08'; ctx.fillText(cl, 31 + hw, 33); ctx.textAlign = 'center';
}
function camera(k) {   // camera chạy theo em cả ngang lẫn dọc (nhìn về phía trước nhiều hơn)
  const ty = Math.min(pl.y - vh * .58, 160 - vh); cam.y += (ty - cam.y) * k;
  const tx = clamp(pl.x + pl.w / 2 - vw * .38, XMIN - 60, XMAX - vw + 60); cam.x += (tx - cam.x) * Math.min(1, k * 1.4);
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / 700, cw / (cw > ch ? 1400 : 480)); vw = cw / sc; vh = ch / sc }
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
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j', ArrowDown: 'h', s: 'h', S: 'h', Shift: 'h', f: 'f', F: 'f' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k === 'h' || k === 'f') { e.preventDefault(); if (!e.repeat) keys[k + 'p'] = 1 }
    else if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = 0 });
  [['bD', 'hp'], ['bF', 'fp']].forEach(([id, k]) => { const b = document.getElementById(id); if (!b) return; b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = 1; b.classList.add('dn') }); ['pointerup', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('dn'))) });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  GC.music.files({ play: { src: 'snd/climb-bgm.mp3' }, boss: { synth: 'race' } }, 'climb');   // nhạc nền Don't Look Down · đánh rồng: nhạc dồn dập
  build(seed, level); respawn(); pl.inv = 0; pl.y = -pl.h; cam.y = pl.y - 500;
  addEventListener('resize', resize); resize(); cam.x = pl.x - vw * .38; bindInput(); requestAnimationFrame(loop);
}
const KIT = { get ctx() { return ctx }, get cw() { return cw }, get ch() { return ch }, get sc() { return sc }, cam, S, pl, rr, star, ol: strokeOL, eyes, flame: flameAt, mix, clamp };
function setPart(n) {   // 1 = Leo núi (1000 m, rồng lửa) · 2 = Leo núi P2 (climb2.js: 1200 m, Quỷ Vương) — gọi TRƯỚC init / measure
  n = n === 2 && window.Climb2 && window.Climb2.far ? 2 : 1; if (n === PART) return;
  PART = n; X2 = n === 2 ? window.Climb2 : null; if (X2) X2.use(KIT);
  ZONES = X2 ? X2.ZONES : ZONES1; NZ = ZONES.length; TOPH = X2 ? 9600 : 8000; BOSSHP = X2 ? 16 : 10;
  for (const k in ZI) delete ZI[k]; ZONES.forEach((z, i) => ZI[z.id] = i);
  ZSKY = [0, 1, 2].map(k => ZONES.map(z => z.sky[k])); ZMT = ZONES.map(z => z.mt); ZNT = ZONES.map(z => z.nt || 0); FXP.length = 0; zoneCache = 0;
}
function release() { keys.l = keys.r = keys.j = 0 }
/* vào lại phòng sau khi lỡ tải lại trang: đặt về chỗ cũ, trạm = trạm cao nhất nằm dưới chân */
function place(x, y, old) { S.lives = old && old.lf || LIVES; S.coins = old && old.cn || 0; pl.x = clamp(x, XMIN, XMAX - pl.w); pl.y = y; pl.vx = pl.vy = 0; S.cpAt = CPS.filter(c => c.x <= x + 40 && c.y >= y + pl.h - 1).sort((a, b) => b.x - a.x)[0] || CPS[0]; cam.y = pl.y - vh * .58; cam.x = pl.x - vw * .38 }
function measure(seed, level) { build(seed, level); return topAlt() }   // trang của cô: biết độ cao đỉnh để vẽ thanh tiến độ
function extra() { return { lf: S.lives, cn: S.coins } }   // (rồng không đồng bộ giữa các máy — mỗi bạn tự đánh rồng của mình)
const hud = () => '⛰ ' + alt() + ' m · 🪙 ' + S.coins;
return { get NST() { return NZ - 1 }, get part() { return PART }, setPart, init, S, pl, keys, alt, topAlt, release, place, measure, W, resize, extra, hud, _dbg: { step, draw, cam: camera, FB: () => FB, boss: () => BOSS, BF: () => BF, give: k => { PW[k] = PWF[k] }, P: () => P, E: () => E, COINS: () => COINS, ITEMS: () => ITEMS, zones: () => ZONES, plat: () => P } };
})();
