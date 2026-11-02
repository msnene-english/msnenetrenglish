/* brick2.js — game "Nấm Mario P2": 6 màn mới, vẽ nét mượt kiểu 16-bit (không còn pixel 8-bit như P1):
   Đồi hoa nắng · Sa mạc kim tự tháp · Rừng nấm khổng lồ · Biển san hô (bơi dưới nước) · Xứ băng giá (mặt băng trơn, cột băng rơi) · Phi thuyền hoàng hôn · Lâu đài ma Vua Rùa.
   Quái mới: 💣 bom biết đi (giẫm → châm ngòi rồi nổ, nổ hạ cả quái xung quanh) · 🪽 rùa có cánh (nhảy tưng tưng, giẫm rụng cánh) · 🌵 xương rồng Pokey (không giẫm được)
   · 🪲 bọ cánh cứng (không sợ lửa, giẫm → đá mai) · 🐝 ong lượn · ⛓ chó xích Chomp (lao tới khi em lại gần) · 🐧 chim cánh cụt trượt băng · 🔧 chuột chũi ném cờ lê trên phi thuyền
   · 👻 ma Boo (em quay lưng là lén bám theo, nhìn thẳng thì nó che mặt đứng im) · 💀 rùa xương (giẫm → rã xương rồi sống lại)
   Đường đi: 🌱 hộp ? mọc dây leo lên vườn mây · ⚖ bập bênh · cân ròng rọc · 🍩 bánh rơi · nấm khổng lồ · mỗi màn 1 bí mật (dây leo hoặc ống xuống hầm)
   Thêm: ☁️ Lakitu thả nhím gai · 🔨 anh em ném búa · 🔥 hoa phun lửa · dưới biển: 🐟 cá · 🦑 mực · 🐡 cá nóc · 🪼 sứa · 🐍 lươn
   Trùm cuối: 🐢 VUA RÙA nhảy, phun lửa, ném búa — chạm rìu cho cầu sập rồi cứu công chúa. Cùng nhạc & tiếng động với P1.
   Cùng giao diện với Brick: init · S · pl · alt() · topAlt() · release() · place() · measure() · extra() · hud() · kind = 'brick' · part = 2 */
window.Brick2 = (function () {
const { clamp, rng } = GC;
const TS = 32, ROWS = 15, GH = .62, GL = .27, JV = -10.4, SPD = 3.4, RUN = 4.5, NL = 7;   // giữ ↑ càng lâu nhảy càng cao (tối đa ~6 ô)
const H_SMALL = 30, H_BIG = 46, LIVES = 5;   // 5 mạng: hết mạng thì chơi lại từ đầu màn đang chơi (không về màn 1)
const THEMES = [   // sky: trời · g: đất [thân, tối, sáng, mặt trên] · b: gạch [nền, vữa, sáng]
  { name: 'Đồi hoa nắng', ic: '🌻', bg: 'hills', sky: ['#3FA8FF', '#C4ECFF'], g: ['#C8803A', '#7A4418', '#E8A860', '#58C838'], b: ['#E07A34', '#7A3410', '#FFB070'] },
  { name: 'Sa mạc kim tự tháp', ic: '🏜', bg: 'desert', sky: ['#FF8A4A', '#FFE6A8'], g: ['#E0AC58', '#9A6624', '#FFD898', '#F8D888'], b: ['#D89048', '#7A4818', '#F8C080'] },
  { name: 'Rừng nấm khổng lồ', ic: '🍄', bg: 'shroom', sky: ['#48C8C0', '#DCFFF0'], g: ['#8A5A3A', '#4A2C18', '#B88058', '#6AD860'], b: ['#B868D0', '#5A2070', '#F0A8FF'] },
  { name: 'Biển san hô', ic: '🐠', bg: 'sea', sky: ['#2A9AE8', '#08306E'], g: ['#E8C872', '#9A7A3A', '#FFF0B8', '#F8E098'], b: ['#FF7EB6', '#A8306E', '#FFC6E2'] },
  { name: 'Xứ băng giá', ic: '❄️', bg: 'ice', sky: ['#6AA8EC', '#EAF6FF'], g: ['#9ACCF0', '#3A78B8', '#E0F4FF', '#FFFFFF'], b: ['#7EB0E4', '#2E5E9E', '#D4EEFF'], slip: true },
  { name: 'Phi thuyền hoàng hôn', ic: '🚢', bg: 'airship', sky: ['#4A2A7A', '#FF9A62'], g: ['#A0643A', '#4E2C14', '#D49660', '#C8884A'], b: ['#8A8AA0', '#3A3A50', '#C8C8E0'] },
  { name: 'Lâu đài ma Vua Rùa', ic: '🐢', bg: 'ghost', sky: ['#120A26', '#3A1A4A'], g: ['#686886', '#26263A', '#A0A0C0', '#7A7A98'], b: ['#58587A', '#20203A', '#9090B4'] },
  { name: 'Hầm kho báu', ic: '💎', bg: 'under', sky: ['#081028', '#1A2250'], g: ['#3A6AE0', '#0A2060', '#90B4FF', '#5A88F0'], b: ['#2A5AD0', '#0A2060', '#80A8FF'] },
  { name: 'Vườn mây trên trời', ic: '☁️', bg: 'sky', sky: ['#58B8FF', '#F0FAFF'], g: ['#FFFFFF', '#B8D8F8', '#FFFFFF', '#FFFFFF'], b: ['#FFD86A', '#B88A20', '#FFF2B0'] }];
// tốn ⚡ cân đối giữa các game: 1 câu đúng (100⚡) ≈ 10 · 8 · 6,5 giây chơi liên tục (Dễ · Vừa · Khó)
const LVS = {
  1: { chunks: 17, enemy: .55, pit: [2, 3], plant: .3, speed: 1, boss: 6, bossFire: 150, hammer: 120, hb: 125, lak: 280, canT: 210, cost: { walk: .14, jump: 3, coin: 3, battery: 20, stomp: 10, hurt: 15, shot: 1 } },
  2: { chunks: 21, enemy: .8, pit: [3, 4], plant: .55, speed: 1.25, boss: 8, bossFire: 115, hammer: 95, hb: 100, lak: 220, canT: 165, cost: { walk: .17, jump: 3.5, coin: 3, battery: 20, stomp: 10, hurt: 22, shot: 2 } },
  3: { chunks: 25, enemy: 1, pit: [3, 5], plant: .8, speed: 1.5, boss: 10, bossFire: 85, hammer: 75, hb: 80, lak: 180, canT: 125, cost: { walk: .2, jump: 4, coin: 3, battery: 20, stomp: 10, hurt: 30, shot: 2 } } };
let LVC = LVS[2], COST = LVC.cost;
const SOLID = new Set(['G', 'B', '?', 'U', 'H', 'P', 'Y', 'N', 'K']);   // M: mũ nấm & C: mây (chỉ đứng trên được) · S: thân nấm (trang trí) · L: dung nham · Y: cầu của Vua Rùa · N: đại bác
const SEMI = new Set(['C', 'M']);
const FLY = new Set(['bee', 'boo', 'fish', 'squid', 'puffer', 'jelly', 'eel', 'lakitu', 'shark']);   // quái bay: không đứng trên khối
const NOB = new Set(['bee', 'boo', 'chomp', 'rocky', 'fish', 'squid', 'puffer', 'jelly', 'eel', 'lakitu', 'shark']);   // đội gạch không hạ được
const HARD = new Set(['pokey', 'chomp', 'boo', 'spiny']);   // không giẫm được
const UNDER = 7, SKYB = 8;   // hầm bí mật dùng màu Hầm kho báu
const S = { energy: 0, cap: 0, rescue: 0, running: false, over: false, fz: 0, sh: 0, color: '#ff8cc0', name: '', ghosts: {}, tick: 0, falls: 0, stomps: 0, hits: 0, coins: 0, lives: LIVES, overs: 0, maxAlt: 0, won: false, boss: false, cpAt: { cp: 0 }, level: 0, now: () => Date.now(), hooks: {} };
const pl = { x: 64, y: 300, w: 24, h: H_SMALL, vx: 0, vy: 0, on: false, face: 1, coy: 0, buf: 0, walk: 0, inv: 0, kb: 0, run: 0, pipe: null, auto: null, lift: null, pw: 0, star: 0, climb: null, ct: 0, ss: null, plat: null };
const keys = { l: 0, r: 0, j: 0, jp: 0, d: 0, f: 0, fp: 0 };
const parts = [], pops = [], FB = [];
let seed0 = 1, lvSel = 2, LVL = null, A = null, AI = 0, cv, ctx, stage, cw = 0, ch = 0, dpr = 1, sc = 1, vw = 0, oy = 0, camX = 0, emptyT = 0, cp = null, banner = null, told = {};

/* ═════ dựng màn (cùng seed → cả lớp cùng bản đồ) ═════ */
function newArea(w, th) { const g = []; for (let x = 0; x < w; x++)g.push(new Array(ROWS).fill('.')); return { w, th, g, q: {}, en: [], coins: [], pipes: [], lifts: [], bars: [], items: [], bumps: [], ef: [], cr: [], cans: [], bul: [], proj: [], ic: [], booms: [], vines: [], ss: [], scl: [], dn: [], flag: null, castle: null, mid: null, princess: null } }
const getT = (a, x, y) => x < 0 || x >= a.w ? 'H' : y < 0 || y >= ROWS ? '.' : a.g[x][y];
const setT = (a, x, y, t) => { if (x >= 0 && x < a.w && y >= 0 && y < ROWS) a.g[x][y] = t };
/* nội dung hộp ?: xu nhiều nhất, rồi nấm năng lượng, nấm hoá to / hoa lửa, thỉnh thoảng sao */
const boxOf = r => r < .48 ? 'coin' : r < .68 ? 'mush' : r < .93 ? 'grow' : 'star';
/* 5 kiểu hầm bí mật khác nhau */
function buildBonus(kind, r0) {
  const RI = (a, b) => a + Math.floor(r0() * (b - a + 1)), w = [22, 24, 22, 24, 22][kind], b = newArea(w, UNDER);
  for (let i = 0; i < w; i++) { setT(b, i, 13, 'G'); setT(b, i, 14, 'G'); setT(b, i, 0, 'B'); setT(b, i, 1, 'B') }
  for (let r = 0; r < ROWS; r++) { setT(b, 0, r, 'B'); setT(b, w - 1, r, 'B') }
  const ex = { x: w - 4, top: 11, h: 2, to: null, enter: true, ph: 0 }; for (let r = 11; r <= 12; r++) { setT(b, ex.x, r, 'P'); setT(b, ex.x + 1, r, 'P') } b.pipes.push(ex);
  const coin = (cx, row) => { if (getT(b, cx, row) === '.' && cx < w - 4) b.coins.push({ x: cx * TS + 6, y: row * TS + 4, got: false }) };   // không đặt xu lẫn vào gạch / ống
  const box = (cx, row, k) => { setT(b, cx, row, '?'); b.q[cx + ',' + row] = k };
  b.bonusName = ['🪙 Hầm kho báu', '🪜 Hầm cầu thang', '🏛 Hầm cột đá', '🧱 Hầm gạch vàng', '💖 Hầm trái tim'][kind];
  if (kind === 0) {           // kho báu: 3 hàng xu + dãy hộp ?
    for (let i = 4; i < 18; i += 2)box(i, 9, i === 10 ? 'grow' : 'coin');
    [[3, 15, 11], [3, 15, 7], [5, 11, 5]].forEach(([x0, n, row]) => { for (let i = 0; i < n; i++)coin(x0 + i, row) });
  } else if (kind === 1) {    // cầu thang lên xuống, xu trên từng bậc
    for (let i = 0; i < 6; i++) { for (let r = 12 - i; r <= 12; r++) { setT(b, 3 + i, r, 'H'); setT(b, 18 - i, r, 'H') } coin(3 + i, 11 - i); coin(18 - i, 11 - i) }
    for (let i = 9; i <= 12; i++)for (let r = 7; r <= 12; r++)setT(b, i, r, 'H');
    for (let i = 8; i <= 13; i++) { coin(i, 5); coin(i, 4) } box(10, 3, 'mush'); box(11, 3, 'star');   // hộp ? cách đỉnh cầu thang 3 ô — vừa tầm nhảy
  } else if (kind === 2) {    // các cột đá cao thấp, xu trên đỉnh
    [[4, 2], [7, 4], [10, 5], [13, 3], [16, 4]].forEach(([cx, h]) => { for (let r = 13 - h; r <= 12; r++) { setT(b, cx, r, 'B'); setT(b, cx + 1, r, 'B') } coin(cx, 12 - h); coin(cx + 1, 12 - h); coin(cx, 11 - h); coin(cx + 1, 11 - h) });
    box(10, 4, 'grow'); box(14, 6, 'mush');   // hộp ? ngay trên đỉnh cột đá (cách 3 ô) — đứng trên cột nhảy là tới for (let i = 3; i < 19; i++)coin(i, 12);
  } else if (kind === 3) {    // trần gạch thấp: đội gạch nào cũng ra xu
    for (let i = 3; i < 18; i++) { setT(b, i, 9, 'B'); b.q[i + ',9'] = 'coin' } box(11, 9, 'star');
    for (let i = 3; i < 20; i++) { coin(i, 12); coin(i, 11) } for (let i = 5; i < 17; i++)coin(i, 6);
  } else {                    // trái tim bằng xu
    const HEART = ['_##___##_', '####_####', '#########', '#########', '_#######_', '__#####__', '___###___', '____#____'];
    HEART.forEach((r, y) => { for (let i = 0; i < r.length; i++)if (r[i] === '#') coin(7 + i, 3 + y) });
    box(4, 9, 'mush'); box(17, 9, 'grow'); for (let i = 3; i < 19; i++)coin(i, 12);
  }
  b.drop = { x: 2 * TS + 4, y: 2 * TS };
  return { b, ex };
}
/* vườn mây trên trời: leo dây lên — đi trên mây nhặt xu, cuối vườn nhảy xuống là về lại màn chính (xa hơn chỗ leo) */
function buildSky(r0) {
  const RI = (a, b) => a + Math.floor(r0() * (b - a + 1)), w = 62, b = newArea(w, SKYB);
  b.sky = true; b.bonusName = '☁️ Vườn mây trên trời'; b.fall = (w - 4) * TS;
  for (let i = 0; i < w - 7; i++) setT(b, i, 12, 'C');
  const coin = (cx, row) => b.coins.push({ x: cx * TS + 6, y: row * TS + 4, got: false });
  for (let i = 4; i < w - 9; i++) coin(i, 10);   // dãy xu dài trên mây
  for (let g = 0; g < 4; g++) { const cx = 8 + g * 12, row = RI(6, 8); for (let j = 0; j < 4; j++) { setT(b, cx + j, row, 'C'); coin(cx + j, row - 1); coin(cx + j, row - 2) } }
  for (const [cx, k] of [[14, 'grow'], [26, 'star'], [38, 'mush']]) { setT(b, cx, 8, '?'); b.q[cx + ',8'] = k }   // hộp ? cách nền mây 3 ô như hộp trên mặt đất — nhảy tới được
  b.drop = { x: 2 * TS, y: 8 * TS };
  return b;
}
/* màn Biển san hô: cả màn ngập nước — bấm ↑ để bơi · san hô, rãnh sâu, đường hầm · cá, mực, cá nóc phồng gai, sứa, lươn rình trong hang */
function buildSea2(li, a, lv, h) {
  const { R, RI, gnd, coinRow, box } = h, r0 = () => R(0, 1);
  a.water = true; a.deco = [];
  const coral = (cx, r1, r2) => { for (let r = r1; r <= r2; r++)setT(a, cx, r, 'K') };
  const sw = (k, cx, row, o) => a.en.push(Object.assign({ k, x: cx * TS, y: row * TS, by: row * TS, w: 24, h: 18, vx: 0, vy: 0, ph: R(0, 6), t: RI(0, 90), dead: 0, act: false }, o || {}));
  const fish = (cx, row) => sw('fish', cx, row, { amp: R(10, 36), vx: -R(.8, 1.4) * LVC.speed });
  const squid = (cx, row) => sw('squid', cx, row, { w: 22, h: 26 });
  const puffer = (cx, row) => sw('puffer', cx, row, { w: 24, h: 24, cx: cx * TS + 12, cy: row * TS + 12, big: 0 });
  const jelly = (cx, row) => sw('jelly', cx, row, { w: 24, h: 26, amp: R(40, 70) });
  const shark = (cx, row) => sw('shark', cx, row, { x0: (cx - 5) * TS, x1: (cx + 5) * TS, w: 84, h: 32, vx: -.9 * LVC.speed, hp: 3, rush: 0, cd: RI(40, 120), hurtT: 0 });   // 🦈 cá mập: tuần tra, thấy em ngang tầm là lao tới
  const eel = (cx, row, f) => sw('eel', cx, row, { w: 26, h: 16, hx: cx * TS, f, ext: 0 });
  const weed = (x0, x1) => { for (let i = x0; i < x1; i += RI(2, 4)) a.deco.push({ x: i, k: RI(2, 4), ph: R(0, 6), c: RI(0, 2) }) };
  gnd(0, 14); weed(1, 13); box(7, 9, 'grow'); coinRow(9, 3, 8);
  let x = 14;
  for (let c = 0; c < LVC.chunks; c++) {
    if (c === Math.floor(LVC.chunks / 2)) { gnd(x, x + 6); a.mid = { x: (x + 3) * TS }; x += 6; continue }
    const kinds = ['reef', 'reef', 'trench', 'tunnel', 'school', 'squid', 'puffers', 'jellies', 'eelwall', 'school', 'sharks', 'sharks', 'jellies'], k = kinds[Math.floor(r0() * kinds.length)], x0 = x;
    if (k === 'reef') {          // rạn san hô cao thấp — bơi vòng qua
      const n = RI(10, 12); gnd(x, x + n); weed(x, x + n);
      for (let cx = x + 2; cx < x + n - 1; cx += RI(3, 4)) { const up = r0() < .5, hh = Math.min(4, RI(2, 2 + lvSel)); if (up) coral(cx, 2, 1 + hh); else coral(cx, 13 - hh, 12); coinRow(cx, 1, up ? 3 + hh : 11 - hh) }
      if (r0() < LVC.enemy) fish(x + n, RI(4, 10)); x += n;
    } else if (k === 'trench') {  // rãnh sâu không đáy
      gnd(x, x + 3); const w = RI(LVC.pit[0], LVC.pit[1]) + 1; coinRow(x + 3, w, 8);
      for (let i = 0; i < Math.ceil(LVC.enemy * 2); i++)fish(x + 3 + RI(0, w), RI(5, 11));
      x += 3 + w; gnd(x, x + 3); weed(x, x + 3); x += 3;
    } else if (k === 'tunnel') {  // đường hầm san hô hẹp — có xu bên trong
      const n = 12, top = RI(6, 7); gnd(x, x + n);
      for (let i = x + 1; i < x + n - 1; i++) { coral(i, 2, top - 1); coral(i, top + 4, 12) }
      coinRow(x + 2, n - 4, top + 2); if (lvSel >= 2) fish(x + n + 2, top + 1); x += n;
    } else if (k === 'school') {  // đàn cá bơi ngược chiều
      const n = 12; gnd(x, x + n); weed(x, x + n);
      for (let i = 0; i < RI(2, 2 + lvSel); i++)fish(x + 6 + i * 3, RI(3, 11));
      if (r0() < .5) box(x + 5, 9); else coinRow(x + 3, 5, RI(5, 8)); x += n;
    } else if (k === 'squid') {   // mực trắng đuổi theo em
      const n = 11; gnd(x, x + n); weed(x, x + n); squid(x + 8, RI(5, 9)); if (lvSel >= 3) squid(x + 10, 3); coinRow(x + 3, 4, 10); x += n;
    } else if (k === 'puffers') { // 🐡 cá nóc: lại gần là phồng to đầy gai
      const n = 12; gnd(x, x + n); weed(x, x + n); puffer(x + 6, RI(5, 9)); if (lvSel >= 2) puffer(x + 10, RI(4, 8)); coinRow(x + 3, 6, RI(3, 4)); x += n;
    } else if (k === 'jellies') { // 🪼 sứa nhấp nhô lên xuống — canh khe mà bơi qua
      const n = 13; gnd(x, x + n); weed(x, x + n); jelly(x + 4, RI(5, 8)); jelly(x + 8, RI(4, 7)); if (lvSel >= 3) jelly(x + 11, 6); coinRow(x + 5, 3, 6); x += n;
    } else if (k === 'sharks') {  // 🦈 vùng cá mập
      const n = 14; gnd(x, x + n); weed(x, x + n); shark(x + 9, RI(4, 9)); if (lvSel >= 2) shark(x + 12, RI(8, 10)); coinRow(x + 3, 6, RI(6, 9)); if (r0() < .4) box(x + 6, 9, 'mush'); x += n;
    } else {                      // 🐍 lươn rình trong hang san hô, thò ra đớp
      const n = 12; gnd(x, x + n); weed(x, x + 4); coral(x + 6, 10, 12); coral(x + 6, 2, 4); coral(x + 7, 10, 12);
      eel(x + 8, 10.4, 1); if (lvSel >= 2) eel(x + 6, 3.4, -1); coinRow(x + 3, 7, 7); x += n;
    }
    if (c > 1 && k !== 'sharks' && r0() < .3) shark(x0 + RI(4, 8), RI(3, 10));   // cá mập rải rác khắp màn
    if (c > 1 && r0() < .5) fish(x + RI(2, 6), RI(3, 11));
  }
  gnd(x, x + 16); weed(x, x + 6);
  const e = { x: x + 9, top: 11, h: 2, to: { next: true }, enter: true, plant: false, ph: 0, st: 0 };
  for (let r = 11; r <= 12; r++) { setT(a, e.x, r, 'P'); setT(a, e.x + 1, r, 'P') } a.pipes.push(e);
  for (let r = 2; r <= 12; r++)setT(a, x + 15, r, 'K');
  a.exitPipe = e; a.w = x + 16; a.end = (x + 9) * TS; a.g.length = a.w;
  return lv;
}
function buildLevel(li) {
  const r0 = rng(seed0 * 41 + li * 977 + lvSel * 17), R = (a, b) => a + r0() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), th = li;
  const a = newArea(110 + LVC.chunks * 16, th), lv = { li, th, areas: [a], final: li === NL - 1 }, bg = THEMES[th].bg;
  const gnd = (x0, x1) => { for (let i = x0; i < x1; i++) { setT(a, i, 13, 'G'); setT(a, i, 14, 'G') } };
  const coinRow = (x0, n, row) => { for (let i = 0; i < n; i++)a.coins.push({ x: (x0 + i) * TS + 6, y: row * TS + 4, got: false }) };
  const EN = { hills: ['shroom', 'shroom', 'turtle', 'bob', 'para'], desert: ['shroom', 'beetle', 'pokey', 'turtle', 'bob'], shroom: ['shroom', 'turtle', 'para', 'beetle', 'shroom'], ice: ['pengu', 'pengu', 'shroom', 'turtle', 'para'], airship: ['shroom', 'bob', 'beetle', 'turtle', 'bob'], ghost: ['dry', 'dry', 'beetle', 'turtle', 'shroom'] }[bg];
  const DIM = { shroom: [24, 22], turtle: [24, 28], para: [24, 28], beetle: [24, 28], bob: [22, 24], pokey: [22, 58], pengu: [26, 34], dry: [24, 28] }, SPDK = { pengu: .7, pokey: .45 };
  const ED = Math.min(1.25, LVC.enemy * (1 + li * .08));   // màn sau đông quái hơn chút
  const enemy = (cx, k) => {   // quái đi bộ: màn đầu chủ yếu nấm nâu dễ giẫm
    k = k || (li === 0 && r0() < .45 ? 'shroom' : EN[Math.floor(r0() * EN.length)]);
    const [w, h] = DIM[k], sp = (SPDK[k] || .8) * (1 + li * .03);
    a.en.push({ k: k === 'beetle' ? 'turtle' : k, beetle: k === 'beetle' ? 1 : 0, x: cx * TS + 4, y: 13 * TS - h, w, h, vx: -sp * LVC.speed, vy: 0, spd: sp, dead: 0, act: false, sh: 0 });
  };
  const flyer = (cx, row, k) => a.en.push({ k, bx: cx * TS, by: row * TS, amp: R(60, 110), sp: R(.018, .028) * LVC.speed, ph: R(0, 6), x: cx * TS, y: row * TS, w: k === 'boo' ? 28 : 24, h: k === 'boo' ? 26 : 18, dead: 0, act: false, f: -1 });
  const pipe = (px, h, extra) => { for (let r = 13 - h; r <= 12; r++) { setT(a, px, r, 'P'); setT(a, px + 1, r, 'P') } const p = Object.assign({ x: px, top: 13 - h, h, to: null, plant: false, ph: RI(0, 239) }, extra || {}); a.pipes.push(p); return p };
  const box = (cx, row, k) => { setT(a, cx, row, '?'); a.q[cx + ',' + row] = k || boxOf(r0()) };
  const crusher = cx => a.cr.push({ x: cx * TS + 4, y0: 2 * TS, y: 2 * TS, w: 56, h: 60, st: 'wait', t: 0, vy: 0, floor: 13 * TS });
  const cannon = (cx, h) => { for (let r = 13 - h; r <= 12; r++)setT(a, cx, r, 'N'); a.cans.push({ c: cx, top: 13 - h, t: RI(0, 120) }) };
  if (bg === 'sea') return buildSea2(li, a, lv, { R, RI, gnd, coinRow, box });
  if (bg === 'ghost') for (let i = 0; i < a.w; i++) { setT(a, i, 0, 'B'); setT(a, i, 1, 'B') }   // trần lâu đài
  gnd(0, 14); let x = 14, exitQ = [], nb = 0, lak = 0;
  box(8, 9, li === 0 ? 'grow' : undefined); coinRow(10, 3, 9);
  const KINDS = {   // mỗi màn một bộ đoạn đường riêng · màn sau thêm bẫy & quái lạ
    hills: ['flat', 'pit', 'pipes', 'blocks', 'stairs', 'flat', 'bobs', 'seesaw', 'blocks', 'scale', 'lakitu'],
    desert: ['flat', 'pit', 'pyramid', 'pipes', 'blocks', 'pokeys', 'hammer', 'pyramid', 'seesaw', 'donut'],
    shroom: ['mushplat', 'mushplat', 'flat', 'pipes', 'bees', 'chomp', 'scale', 'mushplat', 'lakitu', 'seesaw'],
    ice: ['flat', 'pit', 'icicles', 'pipes', 'blocks', 'snowbro', 'pengus', 'icicles', 'donut', 'seesaw'],
    airship: ['deck', 'pit', 'cannon', 'rocky', 'lift', 'scale', 'rocky', 'hammer', 'donut', 'cannon'],
    ghost: ['firebar', 'lava', 'boos', 'drys', 'crusher', 'hammer', 'firebar', 'boos', 'donut', 'lava', 'cannon'] }[bg];
  const BONUS = ['vine', 'bonus', 'vine', null, 'bonus', 'vine', 'bonus'][li];   // mỗi màn chỉ 1 bí mật: dây leo lên mây hoặc ống xuống hầm
  for (let c = 0; c < LVC.chunks; c++) {
    if (c === Math.floor(LVC.chunks / 2)) { gnd(x, x + 6); a.mid = { x: (x + 3) * TS }; x += 6; continue }
    if (exitQ.length && c >= exitQ[0].after) {
      if (exitQ[0].sky) { gnd(x, x + 9); a.skyX = (x + 4) * TS; coinRow(x + 2, 5, 8); exitQ.shift(); x += 9; continue }   // chỗ rơi xuống từ vườn mây
      gnd(x, x + 7); const e = pipe(x + 3, 2, { exit: true }); exitQ[0].bonusExit.to = { area: 0, pipe: e }; exitQ.shift(); x += 7; continue;   // ống trồi lên từ hầm xu
    }
    let k = KINDS[Math.floor(r0() * KINDS.length)];
    if (k === 'lakitu' && (lak++ || c < LVC.chunks / 2)) k = 'flat';   // Lakitu: 1 lần, nửa sau màn
    if (lvSel >= 2 && bg !== 'airship' && bg !== 'ghost' && r0() < .08) k = 'cannon';
    if (c === Math.floor(LVC.chunks * .3) && BONUS) k = BONUS;
    if (k === 'flat' || k === 'deck') {
      const n = RI(8, 11); gnd(x, x + n);
      if (r0() < ED) enemy(x + RI(4, n - 2)); if (r0() < ED * .6) enemy(x + RI(2, n - 3));
      if (r0() < .5) coinRow(x + 2, 4, RI(8, 10)); else if (r0() < .5) box(x + RI(3, n - 3), 9);
      x += n;
    } else if (k === 'pit' || k === 'lava') {
      gnd(x, x + 3); const w = RI(LVC.pit[0], LVC.pit[1]);
      if (k === 'lava') for (let i = x + 3; i < x + 3 + w; i++) { setT(a, i, 14, 'L'); setT(a, i, 13, 'L') }
      if (w >= 4) box(x + 3 + Math.floor(w / 2), 9, 'coin'); else coinRow(x + 3, w, 9);
      x += 3 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'pipes') {
      const n = 14; gnd(x, x + n); let px = x + 2;
      for (let i = 0; i < RI(1, 3) && px < x + n - 2; i++) { const p = pipe(px, RI(2, 3)); p.plant = li >= 1 && r0() < LVC.plant || li === 0 && r0() < LVC.plant * .5; p.fire = p.plant && li >= 1 && r0() < .3 + li * .05; /* hoa phun lửa */ px += RI(4, 6) }
      if (r0() < ED) enemy(x + n - 2); x += n;
    } else if (k === 'blocks') {
      const n = 11; gnd(x, x + n); const pat = ['B?B?B', '?B?', 'B??B', '?'][RI(0, 3)];
      for (let i = 0; i < pat.length; i++) { const cx = x + 3 + i; if (pat[i] === '?') box(cx, 9); else { setT(a, cx, 9, 'B'); if (r0() < .12) a.q[cx + ',9'] = 'coin' } }
      if (r0() < .6 && pat.length >= 3) { box(x + 4, 5); coinRow(x + 3, 3, 4) }   // hộp ? tầng 2 chỉ đặt khi có hàng gạch bên dưới làm bậc
      if (r0() < ED) enemy(x + RI(3, 8)); x += n;
    } else if (k === 'stairs') {
      const gap = lvSel >= 2 && r0() < .6; gnd(x, x + 4); gnd(x + (gap ? 6 : 4), x + 11);
      for (let i = 1; i <= 4; i++)for (let r = 13 - i; r <= 12; r++)setT(a, x + i - 1, r, 'H');
      for (let i = 4; i >= 1; i--)for (let r = 13 - i; r <= 12; r++)setT(a, x + (gap ? 6 : 4) + (4 - i), r, 'H');
      coinRow(x + 3, gap ? 4 : 2, 7); x += 11;
    } else if (k === 'bonus') {   // ống chui xuống hầm bí mật — mỗi hầm một kiểu
      gnd(x, x + 9); const ent = pipe(x + 4, 2, { enter: true });
      const { b, ex } = buildBonus((seed0 + li * 2 + nb++) % 5, r0), bi = lv.areas.length; lv.areas.push(b);
      ent.to = { area: bi }; exitQ.push({ after: c + 2, bonusExit: ex }); x += 9;
    } else if (k === 'lift') {   // bệ máy bay qua khoảng trống giữa 2 phi thuyền
      gnd(x, x + 2); const w = RI(7, 9); a.lifts.push({ x0: (x + 2) * TS, x1: (x + 2 + w - 3) * TS, y: 10 * TS, w: 3 * TS, sp: .012 * LVC.speed, ph: R(0, 6), x: 0, dx: 0 });
      coinRow(x + 3, w - 2, 8); x += 2 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'crusher') {   // khối đá gai rơi từ trần khi em đi qua bên dưới
      const n = RI(10, 12); gnd(x, x + n); crusher(x + 3); if (lvSel >= 2 || r0() < .5) crusher(x + n - 4);
      coinRow(x + 3, 2, 11); if (r0() < ED * .6) enemy(x + RI(5, n - 5)); x += n;
    } else if (k === 'cannon') {     // đại bác bắn đạn bay ngang
      const n = RI(10, 12); gnd(x, x + n); cannon(x + 4, RI(1, 2)); if (lvSel >= 3 || bg === 'airship') cannon(x + n - 2, RI(1, 2));
      if (r0() < .5) box(x + 7, 9); if (r0() < ED * .6) enemy(x + 8); x += n;
    } else if (k === 'firebar') {
      const n = 10; gnd(x, x + n); setT(a, x + 5, 9, 'H');
      a.bars.push({ cx: (x + 5.5) * TS, cy: 9.5 * TS, n: lvSel >= 3 ? 6 : 5, a: R(0, 6), sp: (.03 + .01 * lvSel) * (r0() < .5 ? 1 : -1) });
      if (r0() < ED) enemy(x + 8); x += n;
    } else if (k === 'bobs') {      // 💣 bom biết đi
      const n = 12; gnd(x, x + n); enemy(x + 5, 'bob'); if (lvSel >= 2 || r0() < .5) enemy(x + 9, 'bob'); coinRow(x + 3, 4, 9); x += n;
    } else if (k === 'pyramid') {   // kim tự tháp bậc thang, xu & hộp ? trên đỉnh
      const n = 14; gnd(x, x + n);
      for (let i = 0; i < 5; i++)for (let cx = x + 2 + i; cx <= x + 11 - i; cx++)setT(a, cx, 12 - i, 'H');
      coinRow(x + 6, 2, 7); if (r0() < .6) box(x + 6, 4); x += n;
    } else if (k === 'pokeys') {    // 🌵 xương rồng Pokey: không giẫm được, nhảy qua hoặc bắn lửa
      const n = 12; gnd(x, x + n); enemy(x + 6, 'pokey'); if (lvSel >= 3) enemy(x + 10, 'pokey'); box(x + 3, 9); x += n;
    } else if (k === 'mushplat') {  // nấm khổng lồ mọc trên vực — nhảy từ mũ nấm này sang mũ nấm kia
      gnd(x, x + 2); let i = x + 2, prev = 11; const end = x + 2 + RI(9, 12);
      while (i < end) {
        const w2 = RI(3, 4), row = i === x + 2 ? RI(10, 11) : clamp(prev + RI(-2, 2), 8, 11);
        for (let j = 0; j < w2; j++)setT(a, i + j, row, 'M');
        for (let r = row + 1; r < ROWS; r++)setT(a, i + Math.floor(w2 / 2), r, 'S');
        if (r0() < .6) coinRow(i, w2, row - 2);
        prev = row; i += w2 + RI(1, 2);
      }
      x = i; gnd(x, x + 3); x += 3;
    } else if (k === 'bees') {      // 🐝 ong lượn
      const n = 12; gnd(x, x + n); flyer(x + 6, RI(7, 9), 'bee'); if (lvSel >= 2) flyer(x + 10, RI(6, 8), 'bee'); coinRow(x + 3, 5, 8); x += n;
    } else if (k === 'chomp') {     // ⛓ chó xích Chomp buộc vào cọc: lao tới khi em lại gần
      const n = 13; gnd(x, x + n); const ax = (x + 6.5) * TS;
      a.en.push({ k: 'chomp', ax, ay: 13 * TS - 10, x: ax - 14, y: 13 * TS - 30, w: 28, h: 28, st: 'idle', t: RI(0, 60), tx: 0, ty: 0, dead: 0, act: false, vx: 0, vy: 0 });
      box(x + 2, 9); coinRow(x + 5, 4, 7); x += n;
    } else if (k === 'icicles') {   // 🧊 cột băng treo dưới dải băng — rơi khi em chạy ngang qua
      const n = 12; gnd(x, x + n); for (let i = x + 2; i <= x + 10; i++)setT(a, i, 5, 'H');
      for (let i = x + 3; i <= x + 9; i += lvSel >= 3 ? 2 : 3) a.ic.push({ x: i * TS + 8, y0: 6 * TS, y: 6 * TS, w: 16, h: 30, st: 'hang', t: 0, vy: 0 });
      coinRow(x + 3, 7, 11); x += n;
    } else if (k === 'pengus') {    // 🐧 chim cánh cụt trượt băng
      const n = 13; gnd(x, x + n); enemy(x + 7, 'pengu'); if (lvSel >= 2) enemy(x + 11, 'pengu'); coinRow(x + 3, 4, 9); x += n;
    } else if (k === 'rocky') {     // 🔧 chuột chũi trốn dưới nắp hầm, thò lên ném cờ lê
      const n = 12; gnd(x, x + n);
      for (const hx of lvSel >= 2 ? [x + 4, x + 9] : [x + 6]) a.en.push({ k: 'rocky', x: hx * TS + 4, y: 13 * TS - 26, w: 24, h: 26, t: RI(0, 150), up: 0, dead: 0, act: false, vx: 0, vy: 0 });
      coinRow(x + 3, 6, 9); x += n;
    } else if (k === 'boos') {      // 👻 ma Boo
      const n = 12; gnd(x, x + n); flyer(x + 9, RI(6, 9), 'boo'); if (lvSel >= 2) flyer(x + 11, RI(4, 7), 'boo'); coinRow(x + 2, 4, 10); x += n;
    } else if (k === 'drys') {      // 💀 rùa xương
      const n = 12; gnd(x, x + n); enemy(x + 6, 'dry'); if (lvSel >= 2) enemy(x + 9, 'dry'); box(x + 3, 9); x += n;
    } else if (k === 'vine') {      // 🌱 dây leo mọc sẵn từ mặt đất lên trời — nhảy bám là leo lên vườn mây đầy xu
      const n = 11; gnd(x, x + n); box(x + 2, 9); box(x + 8, 9);
      const sb = buildSky(r0), si = lv.areas.length; lv.areas.push(sb); a.vines.push({ x: (x + 5) * TS + 16, base: 13 * TS, tip: -3 * TS, to: si, sign: 1 }); exitQ.push({ after: c + 3, sky: sb }); x += n;
    } else if (k === 'seesaw') {    // ⚖ bập bênh bắc qua vực: đứng lệch bên nào là nghiêng bên đó
      gnd(x, x + 3); const w = 8; a.ss.push({ cx: (x + 3 + w / 2) * TS, cy: 11 * TS, half: 2.6 * TS, ang: 0 }); coinRow(x + 4, 6, 8); x += 3 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'scale') {     // ⚖ cân ròng rọc: bên này chìm thì bên kia nổi
      gnd(x, x + 3); const w = 10; a.scl.push({ x1: (x + 4) * TS, x2: (x + 3 + w - 4) * TS, w: 3 * TS, y1: 10 * TS, y2: 10 * TS, base: 10 * TS, top: 3 * TS }); coinRow(x + 4, 3, 8); coinRow(x + w - 1, 3, 8); x += 3 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'donut') {     // 🍩 dãy bánh rơi: đứng lâu là rơi xuống vực
      gnd(x, x + 3); const w = RI(6, 8); for (let i = 0; i < w; i++) a.dn.push({ x: (x + 3 + i) * TS, y0: 11 * TS, y: 11 * TS, st: 'idle', t: 0, vy: 0 }); coinRow(x + 3, w, 9); x += 3 + w; gnd(x, x + 3); x += 3;
    } else if (k === 'hammer' || k === 'snowbro') {   // 🔨 anh em ném búa đứng trên bục gạch
      const n = 13; gnd(x, x + n); for (let i = x + 5; i <= x + 9; i++) setT(a, i, 9, 'B');
      a.en.push({ k: 'hammer', snow: k === 'snowbro' ? 1 : 0, x: (x + 7) * TS, y: 9 * TS - 32, w: 24, h: 32, vx: 0, vy: 0, t: RI(0, 60), f: -1, dead: 0, act: false });
      box(x + 2, 9); coinRow(x + 5, 5, 6); x += n;
    } else if (k === 'lakitu') {    // ☁️ Lakitu cưỡi mây thả nhím gai xuống
      const n = 12; gnd(x, x + n); a.en.push({ k: 'lakitu', x: (x + 8) * TS, y: 4 * TS, w: 28, h: 30, t: 0, dead: 0, act: false }); coinRow(x + 3, 6, 9); x += n;
    }
  }
  while (exitQ.length) { if (exitQ[0].sky) { gnd(x, x + 9); a.skyX = (x + 4) * TS; exitQ.shift(); x += 9; continue } gnd(x, x + 7); const e = pipe(x + 3, 2, { exit: true }); exitQ[0].bonusExit.to = { area: 0, pipe: e }; exitQ.shift(); x += 7 }
  if (lv.final) {   // phòng vũ khí → cầu dung nham có Vua Rùa → rìu → công chúa
    gnd(x, x + 10); box(x + 3, 9, 'fire'); box(x + 6, 9, 'mush'); a.armory = { x: (x + 3) * TS }; x += 10;
    const bx = x; for (let i = 0; i < 14; i++) { setT(a, bx + i, 13, 'Y'); setT(a, bx + i, 14, 'L') }
    a.boss = { king: true, x: (bx + 9) * TS, y: 13 * TS - 64, w: 72, h: 64, vx: -.8 * LVC.speed, vy: 0, hp: LVC.boss, max: LVC.boss, minX: (bx + 3) * TS, maxX: (bx + 12) * TS, t: 0, fireT: 90, f: -1, act: false, fall: false, dead: false, hurtT: 0, on: true };
    a.bridge = { x0: bx, col: bx + 13, on: false, t: 0 };
    gnd(bx + 14, bx + 34); a.axe = { x: (bx + 14) * TS + 6, y: 11 * TS, w: 20, h: 64 };
    a.princess = { x: (bx + 22) * TS, y: 13 * TS }; a.w = bx + 34; a.end = (bx + 21) * TS;
  } else {          // bậc thang → cột cờ → lâu đài nhỏ
    gnd(x, x + 26);
    for (let i = 1; i <= 5; i++)for (let r = 13 - i; r <= 12; r++)setT(a, x + 1 + i, r, 'H');
    for (let r = 8; r <= 12; r++)setT(a, x + 7, r, 'H');
    a.flag = { x: (x + 11) * TS + 14, top: 3 * TS, y: 3 * TS, done: false }; a.castle = { x: (x + 14) * TS };
    a.w = x + 26; a.end = (x + 11) * TS;
  }
  a.g.length = a.w;
  a.deco = []; for (let i = 3; i < a.w - 4; i += RI(5, 10)) if ([0, 1, 2].every(k => getT(a, i + k, 13) === 'G' && getT(a, i + k, 12) === '.')) a.deco.push({ x: i, k: RI(0, 2), ph: R(0, 6) });   // cây cỏ trang trí trên mặt đất
  return lv;
}
/* nhạc như bản gốc: mặt đất · dưới hầm/lâu đài · sao bất tử */
const sceneOf = () => pl.star > 0 ? 'star' : A.water ? 'water' : A.sky ? 'over' : AI !== 0 || ['under', 'ghost'].includes(THEMES[A.th].bg) ? 'under' : 'over';
let lastScene = '';
function syncMusic(restart) { const k = sceneOf(); if (k !== lastScene || restart) { lastScene = k; GC.music.scene(k, restart) } }
function loadLevel(li, keepPos) {
  S.level = li; S.boss = false; LVL = buildLevel(li); A = LVL.areas[0]; AI = 0; FB.length = 0;
  cp = { x: 3 * TS, y: 13 * TS - pl.h, mid: false };
  if (!keepPos) { pl.x = cp.x; pl.y = cp.y; pl.vx = pl.vy = 0; pl.auto = null; pl.pipe = null }
  camX = 0; banner = { t: 160, w: 'WORLD 2-' + (li + 1), text: THEMES[li].ic + ' ' + THEMES[li].name };
  if (THEMES[li].slip) setTimeout(() => tell('m2_ice'), 1500);
  if (A.water) setTimeout(() => S.hooks.onPower && S.hooks.onPower('swim'), 1500);   // màn băng: nhắc mặt băng trơn
  GC.music.hush(false); syncMusic(true);
}
const prog = () => S.won ? 1 : clamp((S.level + (AI === 0 ? clamp(pl.x / Math.max(1, A.end || A.w * TS), 0, 1) : .5)) / NL, 0, 1);
const alt = () => Math.round(prog() * 1000);
const topAlt = () => 1000;
const frozen = () => S.now() < S.fz;
const use = e => { S.energy = Math.max(0, S.energy - e) };

/* ═════ va chạm với ô gạch ═════ */
const solid = (x, y) => SOLID.has(getT(A, x, y));
function moveX(o) {
  o.x += o.vx; o.hitX = 0; const y0 = Math.floor(o.y / TS), y1 = Math.floor((o.y + o.h - .01) / TS);
  if (o.vx > 0) { const c = Math.floor((o.x + o.w - .01) / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = c * TS - o.w; o.vx = 0; o.hitX = 1; break } }
  else if (o.vx < 0) { const c = Math.floor(o.x / TS); for (let r = y0; r <= y1; r++)if (solid(c, r)) { o.x = (c + 1) * TS; o.vx = 0; o.hitX = -1; break } }
}
function moveY(o) {
  const pb = o.y + o.h; o.y += o.vy; o.on = false; o.bump = null;
  const x0 = Math.floor((o.x + 1) / TS), x1 = Math.floor((o.x + o.w - 1.01) / TS), mid = Math.floor((o.x + o.w / 2) / TS);
  const cols = [mid]; for (let c = x0; c <= x1; c++)if (c !== mid) cols.push(c);
  if (o.vy > 0) { const r = Math.floor((o.y + o.h - .01) / TS); for (const c of cols) { const t = getT(A, c, r); if (SOLID.has(t) || (SEMI.has(t) && pb <= r * TS + .5)) { o.y = r * TS - o.h; o.vy = 0; o.on = true; break } } }
  else if (o.vy < 0) { const r = Math.floor(o.y / TS); for (const c of cols) if (solid(c, r)) { o.y = (r + 1) * TS; o.vy = 0; o.bump = { c, r }; break } }
  return pb;
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ═════ biến hình: 0 nhỏ · 1 to · 2 to + bắn lửa ═════ */
function setPower(n) {
  const oh = pl.h; pl.pw = n; pl.h = n ? H_BIG : H_SMALL; pl.y -= pl.h - oh;
  document.body.classList.toggle('fire', n === 2);
}
function spawnItem(k, c, r) { A.items.push({ k, x: c * TS + 4, y: r * TS, w: 24, h: k === 'flower' ? 24 : 22, vx: k === 'flower' ? 0 : 1.5, vy: 0, rise: 24, got: false }); GC.sfx('power') }
function bumpBlock(c, r) {
  const t = getT(A, c, r), key = c + ',' + r, q = A.q[key];
  A.bumps.push({ c, r, t: 10 });
  for (const e of A.en) if (!e.dead && !NOB.has(e.k) && Math.abs(e.x + e.w / 2 - (c + .5) * TS) < 26 && Math.abs(e.y + e.h - r * TS) < 4) { e.dead = 40; S.stomps++ }
  for (const it of A.items) if (!it.got && it.rise <= 0 && Math.abs(it.x + 12 - (c + .5) * TS) < 26 && Math.abs(it.y + it.h - r * TS) < 4) { it.vy = -6; it.vx = -it.vx || 1.5 }
  if (t === '?' || (t === 'B' && q)) {
    setT(A, c, r, 'U'); delete A.q[key];
    const k = q || 'coin';
    if (k === 'coin') { coinUp(); pops.push({ x: c * TS + 16, y: r * TS - 8, t: 30 }); GC.sfx('coin') }
    else if (k === 'vine') { A.vines.push({ x: c * TS + 16, base: r * TS, tip: r * TS, to: A.vineTo }); GC.sfx('power') }   // 🌱 dây leo mọc lên trời
    else if (k === 'grow') spawnItem(pl.pw ? 'flower' : 'grow', c, r);
    else if (k === 'fire') spawnItem('flower', c, r);
    else spawnItem(k, c, r);
  } else if (t === 'B') {
    if (pl.pw) {   // to rồi mới đội vỡ gạch
      setT(A, c, r, '.'); GC.sfx('break');
      for (let i = 0; i < 8; i++)parts.push({ x: c * TS + 16, y: r * TS + 16, vx: (Math.random() - .5) * 6, vy: -3 - Math.random() * 4, r: 4, l: 50, L: 50, c: THEMES[A.th].b[0], g: .3 });
    } else GC.sfx('bump');
  } else GC.sfx('bump');
}
function step() {
  S.tick++;
  for (const L of A.lifts) { const nx = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)); L.dx = nx - L.x; L.x = nx }
  for (const b of A.bars) b.a += b.sp;
  for (let i = A.bumps.length - 1; i >= 0; i--)if (--A.bumps[i].t <= 0) A.bumps.splice(i, 1);
  stepItems(); stepEnemies(); stepFire(); stepBoss(); stepHaz(); stepPlat();
  if (pl.star > 0) pl.star--;
  if (S.tick % 10 === 0) syncMusic();
  if (pl.pipe) return stepPipe();
  if (pl.auto) return stepAuto();
  if (pl.climb) return climbStep();
  const can = S.energy > 0 && !frozen(), dir = can && !pl.kb ? (keys.r - keys.l) : 0;
  if (dir && dir === pl.face) pl.run++; else pl.run = 0;
  const WA = A.water, top = WA ? 2.5 : pl.run > 45 ? RUN : SPD;
  if (pl.kb) { pl.kb--; pl.vx *= .96 } else pl.vx += (dir * top - pl.vx) * (pl.on ? (THEMES[A.th].slip ? .045 : .22) : WA ? .08 : .12);   // màn băng: trơn trượt
  if (Math.abs(pl.vx) < .05) pl.vx = 0;
  if (dir) { pl.face = dir; use(COST.walk) }
  if (pl.on && Math.abs(pl.vx) > .4) pl.walk += .3 + Math.abs(pl.vx) * .06;
  if (pl.inv) pl.inv--;
  if (keys.jp) { pl.buf = 7; keys.jp = 0 }
  if (pl.on) pl.coy = 6; else if (pl.coy > 0) pl.coy--;
  if (WA && keys.j && S.tick % 18 === 0) pl.buf = 1;   // dưới nước: giữ ↑ cũng tự quạt bơi
  if (WA && pl.buf > 0) { pl.buf = 0; if (can) { pl.vy = -4.4; pl.on = false; use(COST.jump * .35); GC.sfx('swim') } }
  if (pl.buf > 0) { pl.buf--; if (pl.coy > 0 && can) { pl.vy = JV - (pl.pw ? .4 : 0); pl.coy = 0; pl.buf = 0; pl.on = false; pl.lift = null; use(COST.jump); GC.sfx('mjump') } }
  if (keys.fp) { keys.fp = 0; if (pl.pw === 2 && can && FB.length < 2) { use(COST.shot); FB.push({ x: pl.face > 0 ? pl.x + pl.w - 4 : pl.x - 8, y: pl.y + 14, vx: 6.5 * pl.face, vy: WA ? 0 : 1.5, l: 110, wa: WA }); GC.sfx('fireball') } }
  if (WA) { pl.vy = Math.min(pl.vy + .13, 2.4); if (S.tick % 50 === 0) parts.push({ x: pl.x + (pl.face > 0 ? pl.w : 0), y: pl.y + 8, vx: 0, vy: -.7, r: 2, l: 70, L: 70, c: '#E0F4FF', g: -.004 }) }
  else pl.vy = Math.min(pl.vy + (keys.j && pl.vy < 0 ? GL : GH), 12);   // giữ nút nhảy = bay cao hơn
  if (pl.lift) { pl.x += pl.lift.dx }
  moveX(pl); if (pl.x < camX) { pl.x = camX; if (pl.vx < 0) pl.vx = 0 }
  const pb = moveY(pl);
  if (WA && pl.y < 1.6 * TS) { pl.y = 1.6 * TS; if (pl.vy < 0) pl.vy = 0 }   // mặt nước
  if (pl.bump) bumpBlock(pl.bump.c, pl.bump.r);
  pl.lift = null;
  if (pl.vy >= 0) for (const L of A.lifts) if (pl.x + pl.w > L.x + 2 && pl.x < L.x + L.w - 2 && pb <= L.y + .5 && pl.y + pl.h >= L.y) { pl.y = L.y - pl.h; pl.vy = 0; pl.on = true; pl.lift = L }
  platLand(pb);
  for (const v of A.vines) if (!pl.climb && Math.abs(pl.x + pl.w / 2 - v.x) < 14 && pl.y + pl.h > v.tip + 6 && pl.y + pl.h <= v.base + 2 && (keys.j || !pl.on)) { pl.climb = v; pl.ct = 0; pl.vx = pl.vy = 0; tell('m2_vine'); GC.sfx('jump') }   // bám dây leo
  // chui ống: đứng trên miệng ống có mũi tên + bấm ↓
  for (const p of A.pipes) {
    if (!p.enter || !p.to) continue;
    const onTop = pl.on && pl.x >= p.x * TS - 6 && pl.x + pl.w <= (p.x + 2) * TS + 6 && Math.abs(pl.y + pl.h - p.top * TS) < 1;
    if (p.to.next) p.st = onTop ? (p.st || 0) + 1 : 0;   // ống qua màn: đứng yên trên miệng ống một lúc cũng tự chui
    if (onTop && (keys.d || p.st > 45)) { pl.pipe = { p, ph: 'down', t: 0 }; pl.vx = 0; GC.sfx('mpipe'); return }
  }
  // xu, vật phẩm
  for (const c of A.coins) if (!c.got && pl.x < c.x + 20 && pl.x + pl.w > c.x && pl.y < c.y + 24 && pl.y + pl.h > c.y) { c.got = true; coinUp(); GC.sfx('coin') }
  for (const it of A.items) if (!it.got && it.rise <= 0 && hit(pl, it)) {
    it.got = true;
    if (it.k === 'mush') { S.energy += COST.battery; GC.sfx('bat'); S.hooks.onBat && S.hooks.onBat(COST.battery, 'mush') }
    else if (it.k === 'grow') { if (!pl.pw) setPower(1); GC.sfx('grow'); S.hooks.onPower && S.hooks.onPower('grow') }
    else if (it.k === 'flower') { setPower(2); GC.sfx('grow'); S.hooks.onPower && S.hooks.onPower('flower') }
    else if (it.k === 'star') { pl.star = 600; GC.sfx('star'); S.hooks.onPower && S.hooks.onPower('star') }
  }
  // cờ giữa màn
  if (A.mid && !cp.mid && AI === 0 && pl.x > A.mid.x) { cp = { x: A.mid.x, y: 13 * TS - pl.h, mid: true }; GC.sfx('cp'); S.hooks.onCP && S.hooks.onCP(S.level + 1, 'mid') }
  // quái, lửa, hoa ăn thịt
  for (const e of A.en) {
    if (e.dead || !e.act || e.hid || !hit(pl, e)) continue;
    if (pl.star) { e.dead = 40; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp'); continue }
    const onHead = !WA && pl.vy > 0 && pb <= e.y + 10;   // dưới nước không giẫm được quái
    const stomp = () => { pl.vy = -8.5; S.energy += COST.stomp; S.stomps++; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) };
    if (e.k === 'bob') { if (e.lit) continue; if (onHead) { e.lit = 110; e.vx = 0; stomp(); tell('m2_bob'); continue } hurt(e.x + e.w / 2); continue }   // giẫm bom → châm ngòi, chạy xa ra!
    if (e.k === 'para') { if (onHead) { e.k = 'turtle'; e.vy = 0; stomp(); continue } hurt(e.x + e.w / 2); continue }   // giẫm rùa có cánh → rụng cánh
    if (e.k === 'dry') { if (e.bones) continue; if (onHead) { e.bones = 240; e.vx = 0; stomp(); tell('m2_dry'); continue } hurt(e.x + e.w / 2); continue }   // giẫm rùa xương → rã xương
    if (e.k === 'turtle') {   // rùa: giẫm → chui vào mai · chạm mai đứng yên → đá mai trượt đi
      if (e.sh === 1) { e.sh = 2; e.vx = (pl.x + pl.w / 2 < e.x + e.w / 2 ? 1 : -1) * 6.5 * Math.min(1.2, LVC.speed); e.kick = 14; if (onHead) pl.vy = -6; GC.sfx('kick'); if (!S.kicked) { S.kicked = 1; S.hooks.onPower && S.hooks.onPower('shell') } continue }
      if (onHead) { if (!e.sh) { e.y += e.h - 18; e.h = 18 } e.sh = 1; e.vx = 0; e.st = 480; pl.vy = -8.5; S.energy += COST.stomp; S.stomps++; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp); continue }
      if (e.kick) continue;
      hurt(e.x + e.w / 2); continue;
    }
    if (!HARD.has(e.k) && onHead) { e.dead = 40; pl.vy = -8.5; S.energy += COST.stomp; S.stomps++; GC.sfx('stomp'); S.hooks.onStomp && S.hooks.onStomp(COST.stomp) }
    else hurt(e.x + e.w / 2);
  }
  for (const b of A.bul) {   // đạn đại bác: giẫm được, chạm ngang thì đau
    if (b.dead || !hit(pl, b)) continue;
    if (pl.star || (pl.vy > 0 && pb <= b.y + 10)) { b.dead = 40; if (!pl.star) pl.vy = -8.5; S.energy += COST.stomp; S.stomps++; GC.sfx('stomp'); continue }
    hurt(b.x + b.w / 2);
  }
  for (const q of A.cr) if (hit(pl, { x: q.x + 2, y: q.y, w: q.w - 4, h: q.h })) { if (pl.star) continue; hurt(q.x + q.w / 2) }
  for (const b of A.bars) for (let i = 1; i <= b.n; i++) { const fx = b.cx + Math.cos(b.a) * i * 14, fy = b.cy + Math.sin(b.a) * i * 14; if (fx > pl.x - 4 && fx < pl.x + pl.w + 4 && fy > pl.y - 4 && fy < pl.y + pl.h + 4) hurt(fx) }
  for (const p of A.pipes) { const k = plantK(p); if (k > .2 && hit(pl, { x: p.x * TS + 22, y: p.top * TS - 28 * k, w: 20, h: 28 * k })) { if (pl.star) { p.plant = false; GC.sfx('stomp') } else hurt(p.x * TS + 32) } }
  // cột cờ / rìu / công chúa
  if (A.flag && !A.flag.done && pl.x + pl.w > A.flag.x) { A.flag.done = true; GC.music.hush(true); pl.auto = { ph: 'slide', t: 0 }; pl.x = A.flag.x - pl.w + 2; pl.vx = 0; pl.vy = 0; GC.sfx('mclear'); A.flag.at = S.tick }   // nhạc qua màn
  if (A.axe && !A.bridge.on && hit(pl, A.axe)) { A.bridge.on = true; GC.sfx('crack'); GC.music.hush(true); GC.sfx('mcastle'); GC.music.hush(true); GC.sfx('mcastle'); S.hooks.onBoss && S.hooks.onBoss('kaxe') }
  if (A.princess && !S.won && pl.x + pl.w > A.princess.x - 34) { if (A.boss && !A.boss.fall) bossDown(); S.won = true; GC.sfxStop && GC.sfxStop('mcastle'); GC.music.hush(true); GC.sfx('mprincess'); GC.sfxStop && GC.sfxStop('mcastle'); GC.music.hush(true); GC.sfx('mprincess'); pl.vx = 0; S.hooks.onWin && S.hooks.onWin() }
  // rơi vực / dung nham
  const lava = getT(A, Math.floor((pl.x + pl.w / 2) / TS), Math.floor((pl.y + pl.h + 2) / TS)) === 'L';
  if (A.sky && pl.y > ROWS * TS + 10) { leaveSky(); return }   // nhảy khỏi vườn mây
  if (pl.y > ROWS * TS + 30 || lava) { S.falls++; die(lava ? 'lava' : 'pit'); return }
  if (S.cap && S.energy > S.cap) S.energy = S.cap;
  S.maxAlt = Math.max(S.maxAlt, alt());
  if (S.energy <= 0 && !emptyT) emptyT = setTimeout(() => { emptyT = 0; if (S.energy <= 0 && S.running && !S.over) S.hooks.onEmpty && S.hooks.onEmpty() }, 900);
}
function hurt(fromX) {
  if (pl.inv || pl.star || pl.auto) return;
  if (pl.pw) { setPower(pl.pw - 1); pl.inv = 100; GC.sfx('mpipe'); S.hooks.onPower && S.hooks.onPower('shrink'); return }   // đang to: chỉ thu nhỏ, không mất ⚡
  S.hits++; GC.sfx('hurt'); for (let i = 0; i < 10; i++)parts.push({ x: pl.x + 12, y: pl.y + 16, vx: (Math.random() - .5) * 4, vy: -Math.random() * 4, r: 3, l: 30, L: 30, c: '#ff6b81', g: .12 });
  die('hit');   // đang nhỏ mà bị đụng → mất 1 mạng (như bản gốc)
}
/* ═════ mạng ═════ */
function coinUp() { S.coins++; S.energy += COST.coin; if (S.coins % 50 === 0 && S.lives < 9) { S.lives++; GC.sfx('m1up'); S.hooks.onPower && S.hooks.onPower('life') } }   // gom đủ 50 xu → thêm 1 mạng
function die(why) {
  if (pl.auto && pl.auto.ph === 'die') return;
  S.lives--; setPower(0); pl.climb = pl.ss = null; pl.star = 0; pl.kb = 0; pl.vx = 0; pl.vy = 0; pl.pipe = null; pl.on = false; GC.music.hush(true); GC.sfx('mdeath');
  pl.auto = { ph: 'die', t: 0, why, pit: why !== 'hit' };
}
function afterDeath(why) {
  const msg = { pit: '😱 Rơi xuống vực!', lava: '🔥 Rơi vào dung nham!', hit: '💥 Bị quái đụng!' }[why] || '';
  if (S.lives <= 0) {   // hết mạng: làm lại từ đầu màn này, được 5 mạng mới
    S.lives = LIVES; S.overs++; loadLevel(S.level); banner = { t: 220, w: 'GAME OVER', text: '💪 Chơi lại từ đầu Màn ' + (S.level + 1) }; GC.sfx('bad');
    S.hooks.onFall && S.hooks.onFall(0, '💀 Hết ' + LIVES + ' mạng! Chơi lại từ đầu Màn ' + (S.level + 1) + ' (không phải từ Màn 1 đâu) — có ' + LIVES + ' mạng mới, cố lên!');
  } else { respawn(); GC.music.hush(false); syncMusic(true); S.hooks.onFall && S.hooks.onFall(0, msg + ' 💔 Mất 1 mạng — còn ' + S.lives + ' mạng · quay lại ' + (cp.mid ? 'cờ giữa màn' : 'đầu màn ' + (S.level + 1)) + ' — cố lên!') }
}
function respawn() { if (AI !== 0) { A = LVL.areas[0]; AI = 0 } A.bul.length = 0; A.proj.length = 0; pl.climb = pl.ss = pl.plat = null; pl.x = cp.x; pl.y = 13 * TS - pl.h; pl.vx = pl.vy = 0; pl.kb = 0; pl.inv = 60; pl.pipe = null; FB.length = 0; camX = Math.max(0, cp.x - vw * .35) }
function plantK(p) {
  if (!p.plant) return 0;
  const t = (S.tick + p.ph) % 240;
  if (t < 30 && Math.abs(pl.x + pl.w / 2 - (p.x + 1) * TS) < 52 && AI === 0) { p.ph = (p.ph + 1) % 240; return 0 }   // em đứng sát ống thì hoa không trồi lên
  return t < 30 ? t / 30 : t < 100 ? 1 : t < 130 ? 1 - (t - 100) / 30 : 0;
}
function stepItems() {
  for (const it of A.items) {
    if (it.got) continue;
    if (it.rise > 0) { it.y -= 1; it.rise--; continue }
    if (it.k === 'flower') continue;
    it.vy = Math.min(it.vy + (A.water ? .12 : GH * .8), A.water ? 2 : 9); moveX(it); if (it.hitX) it.vx = -it.hitX * 1.5; moveY(it);
    if (it.k === 'star' && it.on) it.vy = -7;
    if (it.y > ROWS * TS + 40) it.got = true;
  }
}
function stepFire() {   // cầu lửa của em: nảy trên mặt đất, diệt quái, bắn rồng
  for (let i = FB.length - 1; i >= 0; i--) {
    const f = FB[i]; f.l--; if (!f.wa) f.vy = Math.min(f.vy + .45, 7); f.x += f.vx;
    let dead = f.l <= 0 || f.x < camX - 40 || f.x > camX + vw + 40 || solid(Math.floor((f.x + 4) / TS), Math.floor((f.y + 4) / TS));
    f.y += f.vy; if (solid(Math.floor((f.x + 4) / TS), Math.floor((f.y + 8) / TS)) && f.vy > 0) { f.y = Math.floor((f.y + 8) / TS) * TS - 8; f.vy = -4.6 }
    const box = { x: f.x, y: f.y, w: 8, h: 8 };
    for (const e of A.en) if (!dead && !e.dead && e.act && !e.hid && hit(box, e)) { dead = true; if (e.beetle || e.k === 'chomp' || e.bones) { GC.sfx('bump'); continue } if (e.k === 'bob') { boom(e); continue } if (e.hp && --e.hp > 0) { e.hurtT = 14; GC.sfx('bossHit'); continue } e.dead = 40; S.stomps++; S.energy += COST.stomp; GC.sfx('stomp') }   // bọ cánh cứng & chó xích không sợ lửa
    for (const b of A.bul) if (!dead && !b.dead && hit(box, b)) dead = true;   // đạn đại bác không sợ lửa
    for (const p of A.pipes) { const k = plantK(p); if (!dead && k > .2 && hit(box, { x: p.x * TS + 22, y: p.top * TS - 28 * k, w: 20, h: 28 * k })) { p.plant = false; GC.sfx('stomp'); dead = true } }
    const B = A.boss; if (!dead && B && B.act && !B.fall && hit(box, B)) { dead = true; B.hp--; B.hurtT = 16; GC.sfx('bossHit'); if (B.hp <= 0) bossDown() }
    if (dead) { for (let k = 0; k < 5; k++)parts.push({ x: f.x + 4, y: f.y + 4, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2, r: 2, l: 14, L: 14, c: '#FFB627', g: .05 }); FB.splice(i, 1) }
  }
}
function bossDown() { const B = A.boss; if (!B || B.fall) return; B.fall = true; B.vy = -7; S.boss = true; GC.sfx('bossDown'); S.hooks.onBoss && S.hooks.onBoss('kdown') }
function stepBoss() {
  const B = A.boss, Br = A.bridge; if (!B) return;
  if (Br && Br.on && Br.col >= Br.x0 && S.tick % 3 === 0) { setT(A, Br.col, 13, '.'); Br.col--; GC.sfx('crack') }   // cầu sập dần
  if (B.dead) return;
  if (B.fall) { B.vy = Math.min(B.vy + .45, 12); B.y += B.vy; if (B.y > ROWS * TS + 120) B.dead = true; return }
  if (!B.act) { if (AI === 0 && pl.x > B.minX - 7 * TS) { B.act = true; S.hooks.onBoss && S.hooks.onBoss('kappear') } return }
  B.t++; if (B.hurtT) B.hurtT--;
  B.f = pl.x + pl.w / 2 < B.x + B.w / 2 ? -1 : 1;
  B.x += B.vx; if (B.x < B.minX || B.x > B.maxX) { B.vx = -B.vx; B.x = clamp(B.x, B.minX, B.maxX) }
  if (B.on && B.t % (lvSel >= 3 ? 120 : 160) === 80) { B.vy = -9.5; B.on = false }
  B.vy = Math.min(B.vy + GH, 12); B.y += B.vy;
  const under = getT(A, Math.floor((B.x + B.w / 2) / TS), 13);
  if (B.y + B.h >= 13 * TS && under === 'Y') { B.y = 13 * TS - B.h; B.vy = 0; B.on = true }
  if (B.y > 13 * TS - B.h + 4 && under !== 'Y') bossDown();
  if (--B.fireT <= 0) {   // phun lửa về phía em
    B.fireT = LVC.bossFire + Math.floor(Math.random() * 50);
    const vy0 = clamp((pl.y + pl.h / 2 - (B.y + 18)) / 110, -1.1, 1.1);
    A.ef.push({ x: B.f < 0 ? B.x - 18 : B.x + B.w, y: B.y + 14, vx: 3.2 * B.f, vy: vy0, l: 300 });
    if (lvSel >= 2 && B.hp <= B.max / 2) A.ef.push({ x: B.f < 0 ? B.x - 18 : B.x + B.w, y: B.y + 14, vx: 3 * B.f, vy: vy0 - .9, l: 300 });   // còn nửa máu: phun 2 luồng
    GC.sfx('roar');
  }
  if (B.king && B.t % LVC.hammer === 40) { const d = pl.x + pl.w / 2 < B.x + B.w / 2 ? -1 : 1; A.proj.push({ k: 'hammer', x: B.x + B.w / 2, y: B.y + 6, vx: d * (1.4 + Math.random() * 1.8), vy: -7.5 - Math.random() * 1.5, g: .3, r: 0 }) }   // Vua Rùa ném búa
  if (hit(pl, { x: B.x + 6, y: B.y + 6, w: B.w - 12, h: B.h - 6 })) hurt(B.x + B.w / 2);
  for (let i = A.ef.length - 1; i >= 0; i--) { const f = A.ef[i]; f.x += f.vx; f.y += f.vy; if (--f.l <= 0) { A.ef.splice(i, 1); continue } if (hit(pl, { x: f.x, y: f.y, w: 20, h: 10 })) hurt(f.x + 10) }
}
const tell = k => { if (!told[k]) { told[k] = 1; S.hooks.onPower && S.hooks.onPower(k) } };   // lời nhắc lần đầu gặp quái mới
function boom(e) {   // bom nổ: hạ quái xung quanh · em đứng gần thì bị thương
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2; e.dead = 1; A.booms.push({ x: cx, y: cy, t: 26 }); GC.sfx('cannon');
  for (let i = 0; i < 16; i++) parts.push({ x: cx, y: cy, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, r: 2 + Math.random() * 3, l: 30, L: 30, c: GC.pick(['#FFB627', '#FF6A1A', '#FFE08A', '#5A5A6A']), g: .05 });
  for (const o of A.en) if (o !== e && !o.dead && o.act && Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < 70) { o.dead = 40; S.stomps++; S.energy += COST.stomp }
  if (Math.hypot(pl.x + pl.w / 2 - cx, pl.y + pl.h / 2 - cy) < 52) hurt(cx);
}
function stepEnemies() {
  for (const e of A.en) {
    if (e.dead) { if (e.dead > 1) e.dead--; continue }
    if (!e.act) { if (e.x < camX + vw + 64) { e.act = true; if (e.k === 'boo') tell('m2_boo'); if (e.k === 'chomp') tell('m2_chomp') } else continue }
    if (e.k === 'bee') { const a = S.tick * e.sp + e.ph, nx = e.bx + Math.sin(a) * e.amp; e.f = nx > e.x ? 1 : -1; e.x = nx; e.y = e.by + Math.sin(a * 2.3) * 18; continue }
    if (e.k === 'boo') {   // ma Boo: em quay lưng thì lén bám theo · em nhìn thẳng thì che mặt đứng im
      const dx = pl.x + pl.w / 2 - (e.x + e.w / 2), dy = pl.y + pl.h / 2 - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
      e.f = dx > 0 ? 1 : -1; e.shy = pl.face === -e.f;
      if (!e.shy && d < 12 * TS && AI === 0) { const v = .5 * LVC.speed; e.x += dx / d * v; e.y += dy / d * v } else e.y += Math.sin(S.tick * .05 + e.ph) * .25;
      continue;
    }
    if (e.k === 'chomp') {   // chó xích: nhảy tưng quanh cọc · em lại gần thì lao tới hết dây xích rồi rút về
      const L2 = 3.4 * TS, dx = pl.x + pl.w / 2 - e.ax; e.t++;
      if (e.st === 'idle') { e.x = e.ax - 14 + Math.sin(e.t * .05) * 18; e.y = 13 * TS - 28 - Math.abs(Math.sin(e.t * .12)) * 12; if (Math.abs(dx) < 4.6 * TS && e.t > 80 && AI === 0) { e.st = 'lunge'; e.t = 0; e.f = Math.sign(dx) || 1; GC.sfx('roar') } }
      else if (e.st === 'lunge') { const k = Math.min(1, e.t / 16); e.x = e.ax - 14 + e.f * L2 * k; e.y = 13 * TS - 28 - Math.sin(k * Math.PI) * 26; if (e.t > 44) { e.st = 'back'; e.t = 0 } }
      else { const k = Math.max(0, 1 - e.t / 40); e.x = e.ax - 14 + e.f * L2 * k; e.y = 13 * TS - 28; if (e.t >= 40) { e.st = 'idle'; e.t = 0 } }
      continue;
    }
    if (e.k === 'rocky') {   // chuột chũi: trốn dưới nắp · thò lên ném cờ lê về phía em
      e.t = (e.t + 1) % 210; e.up = e.t > 96 && e.t < 170 ? 1 : 0; e.hid = !e.up; e.f = pl.x < e.x ? -1 : 1;
      if (e.t === 130 && Math.abs(pl.x - e.x) < 12 * TS && AI === 0) A.proj.push({ k: 'wrench', x: e.x + 12, y: e.y - 8, vx: e.f * 2 * Math.min(1.3, LVC.speed), vy: -6.5, g: .26, r: 0 });
      continue;
    }
    if (e.k === 'shark') {  // cá mập: tuần tra qua lại · cùng tầm nước + đang hướng về em → lao tới thật nhanh
      if (e.hurtT) e.hurtT--;
      const dx = pl.x + pl.w / 2 - (e.x + e.w / 2), dy = pl.y + pl.h / 2 - (e.y + e.h / 2);
      if (e.rush > 0) { e.rush--; if (!e.rush) e.vx = Math.sign(e.vx) * .9 * LVC.speed }
      else if (--e.cd <= 0 && Math.abs(dy) < 46 && Math.abs(dx) < 8 * TS && Math.sign(dx) === Math.sign(e.vx) && AI === 0) { e.rush = 70; e.cd = 160; e.vx = Math.sign(dx) * 4 * Math.min(1.3, LVC.speed); GC.sfx('roar'); tell('m2_shark') }
      else if (e.x < e.x0 || e.x > e.x1) e.vx = (e.x < e.x0 ? 1 : -1) * .9 * LVC.speed;
      e.y = clamp(e.y + clamp(dy * .006, -.5, .5) + Math.sin(S.tick * .04 + e.x0) * .3, 2 * TS, 12 * TS - e.h);
      e.x += e.vx; if (solid(Math.floor((e.vx < 0 ? e.x : e.x + e.w) / TS), Math.floor((e.y + e.h / 2) / TS))) { e.vx = -e.vx; e.rush = 0 }
      continue;
    }
    if (e.k === 'pengu') {   // chim cánh cụt: lạch bạch đi · dừng lại giơ vây ném CÁ về phía em
      e.t = (e.t || 0) + 1; const c = e.t % LVC.hb;
      if (c > LVC.hb - 30) { if (e.vx) { e.dir = e.vx; e.vx = 0 } e.f = pl.x < e.x ? -1 : 1; e.thr = 1; e.vy = Math.min(e.vy + GH, 10); moveY(e);
        if (c === LVC.hb - 10 && Math.abs(pl.x - e.x) < 10 * TS && AI === 0) { A.proj.push({ k: 'fishp', x: e.x + e.w / 2 + e.f * 10, y: e.y + 2, vx: e.f * (1.8 + Math.random() * 1.2), vy: -6 - Math.random() * 1.5, g: .28, r: 0 }); tell('m2_pengu') }
        continue }
      e.thr = 0; if (!e.vx) e.vx = e.dir || -e.spd * LVC.speed; e.f = e.vx > 0 ? 1 : -1;
    }
    if (e.k === 'fish') {   // cá bơi ngang, nhấp nhô; đụng san hô thì quay đầu
      e.x += e.vx; e.y = e.by + Math.sin(S.tick * .05 + e.ph) * e.amp;
      if (solid(Math.floor((e.vx < 0 ? e.x : e.x + e.w) / TS), Math.floor((e.y + e.h / 2) / TS))) e.vx = -e.vx;
      if (e.x < camX - 300) e.dead = 1; continue;
    }
    if (e.k === 'squid') {  // mực: lâu lâu phóng về phía em rồi chìm từ từ
      e.t++; const dx = pl.x - e.x;
      if (e.t % 64 === 0 && Math.abs(dx) < 9 * TS) { e.vy = pl.y < e.y ? -2.6 * LVC.speed : .6; e.vx = Math.sign(dx) * 1.7 * LVC.speed }
      e.vx *= .975; e.vy = Math.min(e.vy + .05, .7); e.x += e.vx; e.y = clamp(e.y + e.vy, 2 * TS, 12 * TS - e.h); continue;
    }
    if (e.k === 'puffer') {   // cá nóc: lững lờ trôi về phía em · lại gần là phồng to đầy gai
      const dx = pl.x + pl.w / 2 - e.cx, dy = pl.y + pl.h / 2 - e.cy, near = Math.hypot(dx, dy) < 3.4 * TS;
      e.big = near ? Math.min(1, e.big + .07) : Math.max(0, e.big - .02); const r = 12 + e.big * 9;
      e.cx += clamp(dx * .003, -.45, .45) * LVC.speed * (1 - e.big * .7); e.cy = clamp(e.by + 12 + Math.sin(S.tick * .03 + e.ph) * 16, 2 * TS + r, 12 * TS - r);
      e.x = e.cx - r; e.y = e.cy - r; e.w = e.h = r * 2; e.f = dx > 0 ? 1 : -1; continue;
    }
    if (e.k === 'jelly') { e.y = clamp(e.by + Math.sin(S.tick * .022 * LVC.speed + e.ph) * e.amp, 2 * TS, 12 * TS - e.h); continue }   // sứa nhấp nhô
    if (e.k === 'eel') {   // lươn: trốn trong hang · thò ra đớp rồi rút vào
      e.t = (e.t + 1) % 200; const t = e.t; e.ext = t < 110 ? 0 : t < 126 ? (t - 110) / 16 : t < 160 ? 1 : t < 180 ? 1 - (t - 160) / 20 : 0;
      e.hid = e.ext < .15; e.x = e.f > 0 ? e.hx + e.ext * 2.6 * TS - e.w : e.hx - e.ext * 2.6 * TS; continue;
    }
    if (e.k === 'lakitu') {   // Lakitu cưỡi mây bay theo em, thả nhím gai · bay đi sau ~25 giây
      e.t++; const tx = pl.x + pl.vx * 25 + Math.sin(e.t * .015) * 110;
      e.x += clamp(tx - e.x, -2.4, 2.4) * Math.min(1, LVC.speed); e.y = 4 * TS + Math.sin(e.t * .05) * 8 - Math.max(0, e.t - 1500) * .8; e.f = pl.x < e.x ? -1 : 1;
      if (e.t % LVC.lak === 90 && e.t < 1500 && AI === 0 && A.en.filter(o => o.k === 'spiny' && !o.dead).length < 4) { A.en.push({ k: 'spiny', x: e.x + 2, y: e.y + 6, w: 24, h: 22, vx: (pl.x < e.x ? -1 : 1) * .8 * LVC.speed, vy: -5, spd: .8, dead: 0, act: true, sh: 0 }); tell('m2_lakitu') }
      if (e.y < -80) e.dead = 1; continue;
    }
    if (e.k === 'hammer') {   // anh em ném búa: nhún nhảy qua lại, ném búa vòng cung về phía em
      e.t++; e.f = pl.x < e.x ? -1 : 1; e.vy = Math.min(e.vy + GH, 10); e.vx = Math.sin(e.t * .03) * .7; moveX(e); moveY(e);
      if (e.on && e.t % 160 === 80) e.vy = -9.5;
      if (e.t % LVC.hb === 30 && Math.abs(pl.x - e.x) < 11 * TS && AI === 0) { A.proj.push({ k: e.snow ? 'snow' : 'hammer', x: e.x + 12, y: e.y + 2, vx: e.f * (1.4 + Math.random() * 1.6), vy: -7 - Math.random() * 2, g: .3, r: 0 }); tell('m2_hammer') }
      if (e.y > ROWS * TS + 60) e.dead = 1; continue;
    }
    if (e.k === 'bob' && e.lit) { e.vx = 0; e.vy = Math.min(e.vy + GH, 10); moveY(e); if (--e.lit <= 0) boom(e); continue }   // đã châm ngòi: đứng yên chờ nổ
    if (e.k === 'dry' && e.bones) { e.vy = Math.min(e.vy + GH, 10); moveY(e); if (--e.bones <= 0) e.vx = (pl.x < e.x ? -1 : 1) * .8 * LVC.speed; continue }   // rã xương nằm im rồi ráp lại
    if (e.kick) e.kick--;
    if (e.k === 'turtle' && e.sh === 1) { e.vx = 0; e.vy = Math.min(e.vy + GH, 10); moveY(e); if (--e.st <= 0) { e.sh = 0; e.y -= 10; e.h = 28; e.vx = -.8 * LVC.speed } continue }   // nằm im lâu quá thì chui ra
    e.vy = Math.min(e.vy + GH, 10); e.vx = e.vx || -(e.spd || .8) * LVC.speed;
    const shell = e.k === 'turtle' && e.sh === 2, sp = shell ? Math.abs(e.vx) : (e.spd || .8) * LVC.speed;
    moveX(e); if (e.hitX) { e.vx = -e.hitX * sp; if (shell) GC.sfx('bump') }
    moveY(e);
    if (e.k === 'para' && e.on) e.vy = -7.2;   // rùa có cánh nhảy tưng tưng
    if (shell) for (const o of A.en) if (o !== e && !o.dead && o.act && !NOB.has(o.k) && hit(e, o)) { o.dead = 40; S.stomps++; S.energy += COST.stomp; GC.sfx('kick') }   // mai trượt hạ cả đàn quái
    if (e.on && (e.k === 'pokey' || e.k === 'dry' || e.k === 'bob' || e.k === 'spiny' || e.k === 'pengu' || (e.k === 'turtle' && !e.sh))) {   // không tự lao xuống vực: quay đầu ở mép
      const ahead = Math.floor((e.vx > 0 ? e.x + e.w + 2 : e.x - 2) / TS), below = Math.floor((e.y + e.h + 4) / TS);
      if (!solid(ahead, below) && !SEMI.has(getT(A, ahead, below))) e.vx = -e.vx;
    }
    if (e.y > ROWS * TS + 60) e.dead = 1;
  }
}
function stepHaz() {   // đá gai · đại bác · đạn · cột băng · cờ lê & búa · vụ nổ
  for (const q of A.cr) {
    if (q.st === 'wait') { if (AI === 0 && pl.x + pl.w > q.x - 18 && pl.x < q.x + q.w + 18 && pl.y > q.y) { q.st = 'fall'; q.vy = 0 } }
    else if (q.st === 'fall') { q.vy = Math.min(q.vy + .7, 13); q.y += q.vy; if (q.y + q.h >= q.floor) { q.y = q.floor - q.h; q.st = 'land'; q.t = 55; GC.sfx('thud'); for (let i = 0; i < 8; i++)parts.push({ x: q.x + Math.random() * q.w, y: q.floor - 4, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2.5, r: 3, l: 30, L: 30, c: '#B8B8CC', g: .15 }) } }
    else if (q.st === 'land') { if (--q.t <= 0) q.st = 'rise' }
    else if (q.st === 'rise') { q.y -= 1.2; if (q.y <= q.y0) { q.y = q.y0; q.st = 'cool'; q.t = 30 } }
    else if (--q.t <= 0) q.st = 'wait';
  }
  for (const n of A.cans) {
    const cx = n.c * TS, dx = pl.x + pl.w / 2 - (cx + TS / 2);
    if (++n.t >= LVC.canT && cx > camX - 20 && cx < camX + vw + 20 && Math.abs(dx) > 2.5 * TS && AI === 0) {
      n.t = 0; const d = Math.sign(dx) || -1; A.bul.push({ x: d > 0 ? cx + TS : cx - 28, y: n.top * TS + 8, w: 28, h: 16, vx: d * 2.6 * LVC.speed, dead: 0 }); GC.sfx('cannon');
      for (let i = 0; i < 6; i++)parts.push({ x: cx + (d > 0 ? TS : 0), y: n.top * TS + 14, vx: d * Math.random() * 2, vy: -Math.random(), r: 3, l: 24, L: 24, c: '#D0D0E0', g: -.02 });
    }
  }
  for (let i = A.bul.length - 1; i >= 0; i--) { const b = A.bul[i]; if (b.dead) { b.y += 4; if (--b.dead <= 0) A.bul.splice(i, 1); continue } b.x += b.vx; if (b.x < camX - 200 || b.x > camX + vw + 200) A.bul.splice(i, 1) }
  for (const q of A.ic) {   // cột băng: rung rung rồi rơi khi em chạy ngang qua · vỡ tan rồi mọc lại
    if (q.st === 'hang') { if (AI === 0 && Math.abs(pl.x + pl.w / 2 - (q.x + q.w / 2)) < 60 && pl.y > q.y) { q.st = 'shake'; q.t = 28 } }
    else if (q.st === 'shake') { if (--q.t <= 0) { q.st = 'fall'; q.vy = 0 } }
    else if (q.st === 'fall') {
      q.vy = Math.min(q.vy + .5, 10); q.y += q.vy;
      if (q.y + q.h >= 13 * TS) { q.st = 'gone'; q.t = 260; GC.sfx('break'); for (let i = 0; i < 10; i++)parts.push({ x: q.x + q.w / 2, y: 13 * TS - 6, vx: (Math.random() - .5) * 5, vy: -1 - Math.random() * 3, r: 2.4, l: 30, L: 30, c: GC.pick(['#E8F8FF', '#9ED4F8']), g: .2 }) }
      else if (!pl.star && hit(pl, { x: q.x + 3, y: q.y, w: q.w - 6, h: q.h })) hurt(q.x + q.w / 2);
    } else if (--q.t <= 0) { q.st = 'hang'; q.y = q.y0 }
  }
  for (let i = A.proj.length - 1; i >= 0; i--) {   // cờ lê của chuột chũi · búa của Vua Rùa
    const p = A.proj[i]; p.vy = Math.min(p.vy + p.g, 9); p.x += p.vx; p.y += p.vy; p.r += .32 * (p.vx < 0 ? -1 : 1);
    if (p.y > ROWS * TS + 40 || p.y < -200 || p.x < camX - 240 || p.x > camX + vw + 240) { A.proj.splice(i, 1); continue }
    if (!pl.star && !pl.auto && hit(pl, { x: p.x - 6, y: p.y - 6, w: 12, h: 12 })) { hurt(p.x); A.proj.splice(i, 1) }
  }
  for (let i = A.booms.length - 1; i >= 0; i--) if (--A.booms[i].t <= 0) A.booms.splice(i, 1);
  for (const p of A.pipes) if (p.fire && p.plant && AI === 0 && (S.tick + p.ph) % 240 === 70 && plantK(p) > .95 && p.x * TS > camX - 40 && p.x * TS < camX + vw + 40) {   // hoa phun lửa nhắm về phía em
    const sx = p.x * TS + 32, sy = p.top * TS - 24, dx = pl.x + pl.w / 2 - sx, dy = pl.y + pl.h / 2 - sy, d = Math.hypot(dx, dy) || 1;
    A.proj.push({ k: 'fire', x: sx, y: sy, vx: dx / d * 2.2, vy: dy / d * 2.2, g: 0, r: 0 }); GC.sfx('fireball');
  }
}
/* ═════ bập bênh · cân ròng rọc · bánh rơi ═════ */
function stepPlat() {
  for (const s of A.scl) {   // cân: bên nào có em đứng thì chìm xuống, bên kia nổi lên
    const on = pl.plat && pl.plat.s === s ? pl.plat.side : 0;
    if (on) { const ny = clamp(s.y1 + (on === 1 ? 1 : -1), s.base - 2 * TS, s.base + 2 * TS), k = ny - s.y1; s.y1 += k; s.y2 -= k }
  }
  for (const d of A.dn) {   // bánh rơi: rung rung rồi rơi · lát sau mọc lại
    if (d.st === 'shake') { if (--d.t <= 0) { d.st = 'fall'; d.vy = 0 } }
    else if (d.st === 'fall') { d.vy = Math.min(d.vy + .25, 7); d.y += d.vy; if (d.y > ROWS * TS + 60) { d.st = 'gone'; d.t = 280 } }
    else if (d.st === 'gone' && --d.t <= 0) { d.st = 'idle'; d.y = d.y0 }
  }
  for (const s of A.ss) { const on = pl.ss === s, tgt = on ? clamp((pl.x + pl.w / 2 - s.cx) / s.half, -1, 1) * .42 : 0; s.ang += (tgt - s.ang) * (on ? .05 : .02) }   // bập bênh nghiêng theo chỗ em đứng
  for (const v of A.vines) if (v.tip > -3 * TS) v.tip -= 2.6;   // dây leo mọc dần lên trời
}
function platLand(pb) {   // đứng lên bập bênh / cân / bánh rơi
  pl.plat = null;
  if (pl.ss) { const s = pl.ss, dx = pl.x + pl.w / 2 - s.cx; if (Math.abs(dx) > s.half + 6 || pl.vy < 0) pl.ss = null; else { pl.y = s.cy + Math.tan(s.ang) * dx - pl.h; pl.vy = 0; pl.on = true; if (!keys.l && !keys.r) pl.vx += Math.sin(s.ang) * .16; return } }
  if (pl.vy < 0) return;
  for (const s of A.ss) { const dx = pl.x + pl.w / 2 - s.cx; if (Math.abs(dx) <= s.half) { const sy = s.cy + Math.tan(s.ang) * dx; if (pb <= sy + 10 && pl.y + pl.h >= sy - 1) { pl.ss = s; pl.y = sy - pl.h; pl.vy = 0; pl.on = true; tell('m2_seesaw'); return } } }
  const P = []; for (const s of A.scl) P.push({ x: s.x1, y: s.y1, w: s.w, s, side: 1 }, { x: s.x2, y: s.y2, w: s.w, s, side: 2 });
  for (const d of A.dn) if (d.st !== 'gone') P.push({ x: d.x, y: d.y, w: TS, d });
  for (const q of P) if (pl.x + pl.w > q.x + 2 && pl.x < q.x + q.w - 2 && pb <= q.y + 10 && pl.y + pl.h >= q.y - 1) { pl.y = q.y - pl.h; pl.vy = 0; pl.on = true; pl.plat = q; if (q.d && q.d.st === 'idle') { q.d.st = 'shake'; q.d.t = 36 } return }
}
/* ═════ dây leo lên vườn mây ═════ */
function climbStep() {   // bám dây là tự leo lên · bấm ← → để nhảy khỏi dây
  const V = pl.climb; pl.vx = 0; pl.vy = 0; pl.on = false; pl.ct++; pl.x += (V.x - pl.w / 2 - pl.x) * .3; pl.walk += .25;
  if (S.energy > 0 && !frozen()) { pl.y -= 2.3; use(COST.walk) }
  if ((keys.l || keys.r) && pl.ct > 30) { pl.face = keys.r ? 1 : -1; pl.climb = null; pl.vx = pl.face * 2.6; pl.vy = -3 }
  else if (pl.y < -pl.h - 12) {   // lên tới mây
    const si = V.to; pl.climb = null; A = LVL.areas[si]; AI = si; pl.x = A.drop.x; pl.y = A.drop.y; pl.vy = 0; FB.length = 0; camX = 0;
    S.hooks.onBonus && S.hooks.onBonus(A.bonusName);
  }
}
function leaveSky() {   // nhảy khỏi vườn mây: rơi xuống màn chính, xa hơn chỗ leo lên
  A = LVL.areas[0]; AI = 0; pl.x = A.skyX || pl.x; pl.y = -pl.h - 30; pl.vy = 2; pl.vx = 0; FB.length = 0; camX = clamp(pl.x - vw * .38, 0, Math.max(0, A.w * TS - vw)); GC.sfx('mpipe');
}

function stepPipe() {
  const P = pl.pipe; P.t++;
  if (P.ph === 'down') {
    pl.y += 1.3;
    if (P.t > 30) {
      const to = P.p.to; FB.length = 0;
      if (to.next) { pl.pipe = null; S.hooks.onCP && S.hooks.onCP(S.level + 1, 'lv'); loadLevel(Math.min(NL - 1, S.level + 1)); return }   // ống cuối màn Biển sâu
      if (to.pipe) {   // trồi lên ở ống khác
        A = LVL.areas[to.area]; AI = to.area; const q = to.pipe;
        pl.x = (q.x + 1) * TS - pl.w / 2; pl.y = q.top * TS + 4; pl.pipe = { p: q, ph: 'up', t: 0 }; GC.sfx('mpipe');
      } else {         // rơi xuống hầm bí mật
        A = LVL.areas[to.area]; AI = to.area; pl.x = A.drop.x; pl.y = A.drop.y; pl.vy = 0; pl.pipe = null;
        S.hooks.onBonus && S.hooks.onBonus(A.bonusName);
      }
      camX = clamp(pl.x - vw * .4, 0, Math.max(0, A.w * TS - vw));
    }
  } else { pl.y -= 1.3; if (P.t > 30 + (pl.pw ? 12 : 0)) { pl.y = P.p.top * TS - pl.h; pl.pipe = null } }
}
function stepAuto() {
  const T = pl.auto; T.t++;
  if (T.ph === 'die') {   // bị đụng: khựng lại rồi nảy lên rơi khỏi màn hình · rơi vực: chờ một chút
    if (!T.pit && T.t === 24) pl.vy = -9;
    if (!T.pit && T.t > 24) { pl.vy = Math.min(pl.vy + .5, 12); pl.y += pl.vy }
    if (T.t > (T.pit ? 170 : 175)) { pl.auto = null; afterDeath(T.why) }   // chờ hết nhạc chết (~2,9 giây) như bản gốc
    return;
  }
  if (T.ph === 'slide') { A.flag.y = Math.min(12 * TS - 20, A.flag.y + 4); pl.y = Math.min(13 * TS - pl.h, pl.y + 4); if (T.t > 40) { T.ph = 'walk'; T.t = 0 } }
  else if (T.ph === 'walk') {
    pl.face = 1; pl.vx = 2.2; pl.walk += .35; moveX(pl); pl.vy = Math.min(pl.vy + GH, 12); moveY(pl);
    if (pl.x > A.castle.x + 2.2 * TS) { T.ph = 'door'; T.t = 0 }
  } else if (T.ph === 'door' && T.t > 50 && S.tick - (A.flag.at || 0) > 345) {   // chờ hết nhạc qua màn
    pl.auto = null; const done = S.level + 1;
    S.hooks.onCP && S.hooks.onCP(done, 'lv');
    loadLevel(Math.min(NL - 1, S.level + 1));
  }
}

/* ═════ hình ảnh: vẽ nét mượt kiểu 16-bit (đường cong, đổ bóng, viền đậm) — rõ nét ở mọi kích cỡ màn hình ═════ */
const OL = '#1E1430';
function hex(c) { c = parseInt(c.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255] }
function mix(a, b, t) { a = hex(a); b = hex(b); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('') }
function label(t, x, y, size, fill, stroke) { ctx.font = '800 ' + size + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = stroke || '#1a1033'; ctx.strokeText(t, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(t, x, y) }
function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
function fs(f, s, lw) { if (f) { ctx.fillStyle = f; ctx.fill() } if (s) { ctx.strokeStyle = s; ctx.lineWidth = lw || 1.6; ctx.lineJoin = 'round'; ctx.stroke() } }
function ell(x, y, rx, ry, f, s, lw, a) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), a || 0, 0, Math.PI * 2); fs(f, s, lw) }
function poly(pts, f, s, lw) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); fs(f, s, lw) }
function line(pts, s, lw) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = s; ctx.lineWidth = lw || 1.6; ctx.lineCap = 'round'; ctx.stroke() }
function lg(x0, y0, x1, y1, st) { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g }
function rg(x, y, r, st) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g }
function star5(x, y, R, r, f, s, lw) { const p = []; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]) } poly(p, f, s, lw) }
/* ô gạch vẽ sẵn ở độ nét gấp 2 rồi dùng lại */
function mkT(fn, w, h) { const c = document.createElement('canvas'); c.width = (w || 32) * 2; c.height = (h || 32) * 2; const o = ctx; ctx = c.getContext('2d'); ctx.scale(2, 2); fn(); ctx = o; return c }
const TILEC = {};
function tiles(th) {
  if (TILEC[th]) return TILEC[th];
  const T = THEMES[th], [g, gd, gl, gt] = T.g, [b, bd, bl] = T.b, k = T.bg, R = {};
  const body = () => {
    ctx.fillStyle = lg(0, 0, 0, 32, [gl, g, g, gd]); ctx.fillRect(0, 0, 32, 32);
    if (k === 'airship') { ctx.fillStyle = gd; for (const x of [0, 10.5, 21]) ctx.fillRect(x, 0, 1.2, 32); ctx.fillStyle = gl; for (const x of [1.2, 11.7, 22.2]) ctx.fillRect(x, 0, .8, 32); ell(5, 6, 1.4, 1.4, '#3A2410'); ell(27, 22, 1.4, 1.4, '#3A2410') }
    else if (k === 'ice') { line([[4, 6], [12, 14], [10, 22]], '#FFFFFF99', 1.2); line([[22, 4], [26, 12], [20, 20], [24, 28]], '#FFFFFF77', 1); ell(8, 26, 3, 1.5, '#FFFFFF55') }
    else if (k === 'ghost' || k === 'under') { ctx.strokeStyle = gd; ctx.lineWidth = 1.4; ctx.strokeRect(1, 1, 30, 14); ctx.strokeRect(-15, 17, 30, 14); ctx.strokeRect(17, 17, 30, 14); ctx.fillStyle = gl + '88'; ctx.fillRect(2, 2, 28, 1.5) }
    else { for (const [x, y, r] of [[6, 8, 2.4], [22, 6, 1.8], [14, 18, 2.8], [26, 24, 2.2], [5, 26, 1.6]]) { ell(x, y + .8, r, r * .8, gd); ell(x - .4, y, r, r * .8, gl) } }
  };
  R.G = mkT(body);
  R.Gt = mkT(() => {
    body();
    if (k === 'hills' || k === 'shroom') { ctx.fillStyle = gt; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(32, 0); ctx.lineTo(32, 8); for (let x = 32; x >= 0; x -= 8) ctx.quadraticCurveTo(x - 4, 14, x - 8, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = mix(gt, '#000000', .25); ctx.fillRect(0, 7, 32, 1.2); ctx.fillStyle = mix(gt, '#FFFFFF', .45); ctx.fillRect(0, 0, 32, 2.2); for (const x of [4, 13, 22, 29]) poly([[x - 2, 1], [x, -3], [x + 2, 1]], mix(gt, '#FFFFFF', .2)) }
    else if (k === 'desert') { ctx.fillStyle = gt; ctx.fillRect(0, 0, 32, 7); ctx.fillStyle = '#FFF2C8'; ctx.fillRect(0, 0, 32, 2); line([[2, 4.5], [8, 3.5], [14, 4.5]], '#D8A858', 1); line([[18, 5], [24, 4], [30, 5]], '#D8A858', 1) }
    else if (k === 'ice') { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(32, 0); ctx.lineTo(32, 6); ctx.quadraticCurveTo(28, 12, 24, 7); ctx.quadraticCurveTo(18, 9, 14, 7); ctx.quadraticCurveTo(10, 13, 6, 7); ctx.quadraticCurveTo(3, 8, 0, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#D8ECFF'; ctx.fillRect(0, 4.5, 32, 1) }
    else if (k === 'airship') { ctx.fillStyle = lg(0, 0, 0, 7, ['#F0B878', gt]); ctx.fillRect(0, 0, 32, 7); ctx.fillStyle = gd; ctx.fillRect(0, 6.5, 32, 1.4); ell(4, 3.5, 1.2, 1.2, '#5A3418'); ell(28, 3.5, 1.2, 1.2, '#5A3418') }
    else { ctx.fillStyle = gt; ctx.fillRect(0, 0, 32, 5); ctx.fillStyle = gl; ctx.fillRect(0, 0, 32, 1.6) }
  });
  R.B = mkT(() => { ctx.fillStyle = lg(0, 0, 0, 32, [bl, b, mix(b, bd, .3)]); ctx.fillRect(0, 0, 32, 32); ctx.fillStyle = bd; for (const y of [0, 15, 31]) ctx.fillRect(0, y, 32, 1.6); for (const [x, y] of [[0, 0], [15, 0], [7.5, 16], [23.5, 16]]) ctx.fillRect(x, y, 1.6, 15.5); ctx.fillStyle = mix(bl, '#FFFFFF', .3); for (const [x, y, w] of [[2, 1.8, 11], [17, 1.8, 12], [9.5, 17, 12], [0, 17, 6], [25.5, 17, 6]]) ctx.fillRect(x, y, w, 1.2) });
  R.H = mkT(() => { rr(1, 1, 30, 30, 5); fs(lg(0, 0, 32, 32, [bl, b, bd]), OL, 1.6); rr(6, 6, 20, 20, 3); fs(lg(0, 0, 32, 32, [b, mix(b, bl, .4)])); ell(16, 16, 2.4, 2.4, bd) });
  const Q = on => mkT(() => { rr(1, 1, 30, 30, 5); fs(lg(0, 0, 0, 32, on ? ['#FFF0A0', '#FFC83A', '#E8901A'] : ['#FFE07A', '#FFB627', '#D9822B']), '#7A3E00', 1.8); for (const [x, y] of [[5, 5], [27, 5], [5, 27], [27, 27]]) ell(x, y, 1.3, 1.3, '#7A3E00'); ctx.font = '900 22px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#7A3E00'; ctx.fillText('?', 17.4, 25.4); ctx.fillStyle = '#FFFFFF'; ctx.fillText('?', 16, 24) });
  R.Q0 = Q(0); R.Q1 = Q(1);
  R.U = mkT(() => { rr(1, 1, 30, 30, 5); fs(lg(0, 0, 32, 32, ['#C47A3E', '#9C5A2A', '#6A3814']), '#3A1A08', 1.6); for (const [x, y] of [[5, 5], [27, 5], [5, 27], [27, 27]]) ell(x, y, 1.3, 1.3, '#3A1A08') });
  R.N = mkT(() => { rr(1, 0, 30, 32, 4); fs(lg(0, 0, 32, 0, ['#2A2A3E', '#6E6E88', '#2A2A3E']), OL, 1.6); ctx.fillStyle = '#C8A030'; ctx.fillRect(1, 4, 30, 3); ctx.fillRect(1, 25, 30, 3); ell(16, 16, 6, 6, '#1A1A24'); ell(14, 15, 1.6, 1.6, '#E8E8F8'); ell(18, 15, 1.6, 1.6, '#E8E8F8') });
  R.Y = mkT(() => { rr(0, 2, 32, 9, 2); fs(lg(0, 2, 0, 11, ['#E8A060', '#B86A2C', '#7A3A14']), '#3A1A08', 1.4); ctx.fillStyle = '#3A1A08'; ctx.fillRect(10, 3, 1.4, 8); ctx.fillRect(21, 3, 1.4, 8); line([[0, 15], [8, 18], [16, 15], [24, 18], [32, 15]], '#9A9AB8', 1.6) });
  const cap = side => mkT(() => { const L = side === 'l' ? 4 : -2, Rr = side === 'r' ? 28 : 34; rr(L, 2, Rr - L, 20, side === 'm' ? 0 : 10); fs(lg(0, 2, 0, 22, ['#FF6A70', '#E8384A', '#B01E30']), side === 'm' ? null : OL, 1.8); if (side === 'm') { ctx.fillStyle = OL; ctx.fillRect(0, 1.2, 32, 1.6); ctx.fillRect(0, 21.2, 32, 1.6) } ctx.fillStyle = '#F8E8D0'; ctx.fillRect(Math.max(L, 0) + (side === 'l' ? 6 : 0), 19, (side === 'm' ? 32 : 22), 4); for (const [x, y, r] of side === 'l' ? [[12, 9, 4], [22, 14, 2.4]] : side === 'r' ? [[18, 10, 4], [9, 15, 2.2]] : [[8, 8, 3.4], [22, 12, 4.2], [15, 16, 2]]) ell(x, y, r, r * .85, '#FFFFFF') });
  R.Ml = cap('l'); R.Mm = cap('m'); R.Mr = cap('r');
  R.S = mkT(() => { ctx.fillStyle = lg(6, 0, 26, 0, ['#C8B490', '#F8EED8', '#E8D8B8', '#B8A078']); ctx.fillRect(6, 0, 20, 32); ctx.fillStyle = OL; ctx.fillRect(5, 0, 1.6, 32); ctx.fillRect(25.4, 0, 1.6, 32); ell(16, 10, 1.4, 2.4, '#D8C4A0'); ell(13, 24, 1.2, 2, '#D8C4A0') });
  const lava = f => mkT(() => { ctx.fillStyle = lg(0, 0, 0, 32, ['#FFE070', '#FF8A1A', '#D83A0A']); ctx.beginPath(); ctx.moveTo(0, 32); for (let x = 0; x <= 32; x += 4) ctx.lineTo(x, 5 + Math.sin((x + f * 8) * .4) * 2.4); ctx.lineTo(32, 32); ctx.closePath(); ctx.fill(); ell(10 + f * 8, 14, 2.4, 1.4, '#FFF0A0'); ell(24 - f * 6, 22, 1.8, 1, '#FFF0A0') });
  R.L0 = lava(0); R.L1 = lava(1); R.Lb = mkT(() => { ctx.fillStyle = lg(0, 0, 0, 32, ['#FF8A1A', '#D83A0A']); ctx.fillRect(0, 0, 32, 32); ell(8, 10, 3, 1.6, '#FFB040'); ell(22, 22, 3.4, 1.6, '#FFB040') });
  R.lift = mkT(() => { if (k === 'airship') { rr(1, 1, 94, 13, 4); fs(lg(0, 0, 0, 14, ['#E0E0F0', '#8A8AA6', '#4A4A60']), OL, 1.6); for (let x = 8; x < 96; x += 14) ell(x, 7.5, 1.6, 1.6, '#3A3A50') } else { rr(1, 1, 94, 13, 4); fs(lg(0, 0, 0, 14, ['#FCBC8C', '#E0782C', '#8A3A10']), OL, 1.6); for (let x = 6; x < 96; x += 12) ell(x, 7.5, 1.6, 1.6, '#6E2A08') } }, 96, 16);
  R.C = mkT(() => { for (const [x, y, r] of [[7, 13, 8], [16, 9, 10], [26, 13, 8]]) ell(x, y, r, r, '#FFFFFF', '#9CC8F0', 1.6); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(2, 12, 28, 10); ell(16, 21, 15, 5, '#DCEEFF'); ell(12, 8, 4, 2.4, '#ffffffcc') });
  R.K = mkT(() => { rr(1, 1, 30, 30, 9); fs(lg(0, 0, 32, 32, [bl, b, bd]), OL, 1.6); for (const [x, y, r] of [[9, 9, 3.4], [22, 12, 2.6], [12, 22, 2.8], [24, 24, 2]]) { ell(x, y, r, r, bd); ell(x - .6, y - .6, r * .6, r * .6, bl) } });
  return TILEC[th] = R;
}
/* mây bông xốp */
const CLP = [[0, 0, 14], [16, -8, 17], [34, -2, 14], [48, 4, 10], [-12, 6, 10], [20, 8, 14]];
function cloud(x, y, s, col, sh) { ctx.fillStyle = sh; for (const [dx, dy, r] of CLP) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s + 4 * s, r * s, 0, 7); ctx.fill() } ctx.fillStyle = col; for (const [dx, dy, r] of CLP) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill() } }
function drawBg() {
  const T = THEMES[A.th], k = T.bg, t = S.tick, s = sc, gy = oy + 13 * TS * sc;
  ctx.fillStyle = lg(0, 0, 0, ch, [T.sky[0], T.sky[1]]); ctx.fillRect(0, 0, cw, ch);
  const rep = (pk, per, fn) => { let i = Math.floor(camX * s * pk / per); for (let x = -(((camX * s * pk) % per) + per) % per - per; x < cw + per; x += per, i++) fn(x, i) };
  const sun = (x, y, r, c1, c2) => { ctx.fillStyle = rg(x, y, r * 3, [c1 + 'AA', c1 + '00']); ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill(); ell(x, y, r, r, c2) };
  if (k === 'hills') {
    sun(cw * .82, ch * .17, 30 * s, '#FFF6B0', '#FFE680'); ctx.save(); ctx.translate(cw * .82, ch * .17); ctx.rotate(t * .004); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); poly([[38 * s, -4 * s], [56 * s, 0], [38 * s, 4 * s]], '#FFE68088') } ctx.restore();
    rep(.12, 520 * s, x => { ell(x + 160 * s, gy + 40 * s, 260 * s, 190 * s, '#A8DCC8'); ell(x + 420 * s, gy + 40 * s, 200 * s, 150 * s, '#B8E4D0') });
    rep(.3, 360 * s, (x, i) => { const hx = x + 110 * s, hh = (130 + (i % 3) * 30) * s, c = ['#48B850', '#5CC860', '#3CA848'][(i % 3 + 3) % 3]; ell(hx, gy + 10 * s, 90 * s, hh, c, '#1E6A2A', 3 * s); ctx.save(); ctx.beginPath(); ctx.ellipse(hx, gy + 10 * s, 90 * s, hh, 0, 0, 7); ctx.clip(); ctx.fillStyle = '#ffffff22'; for (let k2 = 0; k2 < 3; k2++) ctx.fillRect(hx - 100 * s, gy + 10 * s - hh * (.75 - k2 * .25), 200 * s, 8 * s); ctx.restore(); ell(hx - 14 * s, gy + 10 * s - hh * .72, 4 * s, 9 * s, '#1E3A2A'); ell(hx + 14 * s, gy + 10 * s - hh * .72, 4 * s, 9 * s, '#1E3A2A'); ell(hx - 13 * s, gy + 10 * s - hh * .74, 1.6 * s, 3 * s, '#FFFFFF'); ell(hx + 15 * s, gy + 10 * s - hh * .74, 1.6 * s, 3 * s, '#FFFFFF') });
    rep(.18, 300 * s, (x, i) => cloud(x + 60 * s + Math.sin(t * .005 + i) * 20 * s, oy + (50 + (i * 47 % 90)) * s, s * (i % 2 ? 1.2 : .9), '#FFFFFF', '#D0E8FF'));
  } else if (k === 'desert') {
    sun(cw * .7, gy - 210 * s, 46 * s, '#FFF0A0', '#FFD25A');
    rep(.08, 600 * s, x => { ctx.fillStyle = '#F8C47A'; ctx.beginPath(); ctx.moveTo(x, gy); for (let q = 0; q <= 600 * s; q += 20 * s) ctx.lineTo(x + q, gy - 60 * s - Math.sin(q / (600 * s) * Math.PI * 2) * 30 * s); ctx.lineTo(x + 600 * s, gy + 40 * s); ctx.lineTo(x, gy + 40 * s); ctx.fill() });
    rep(.18, 460 * s, (x, i) => { const px = x + 200 * s, h = (130 + (i % 2) * 50) * s; poly([[px - h, gy], [px, gy - h], [px + h, gy]], '#E8B060'); poly([[px, gy - h], [px + h, gy], [px + h * .25, gy]], '#B87830'); ctx.strokeStyle = '#C8904A'; ctx.lineWidth = 1.5 * s; for (let q = 1; q < 6; q++) { const yy = gy - h + h * q / 6; ctx.beginPath(); ctx.moveTo(px - h * q / 6, yy); ctx.lineTo(px + h * q / 6, yy); ctx.stroke() } });
    rep(.4, 340 * s, (x, i) => { const cx = x + 90 * s + (i % 3) * 40 * s, h = (46 + (i % 2) * 20) * s; ctx.fillStyle = '#3E8A3E'; rr(cx - 7 * s, gy - h, 14 * s, h + 10 * s, 7 * s); ctx.fill(); rr(cx - 22 * s, gy - h * .7, 9 * s, h * .4, 4.5 * s); ctx.fill(); rr(cx - 22 * s, gy - h * .36, 18 * s, 8 * s, 4 * s); ctx.fill(); rr(cx + 13 * s, gy - h * .85, 9 * s, h * .45, 4.5 * s); ctx.fill(); rr(cx + 4 * s, gy - h * .45, 18 * s, 8 * s, 4 * s); ctx.fill() });
  } else if (k === 'shroom') {
    rep(.15, 300 * s, (x, i) => { const cx = x + 120 * s, h = (180 + (i % 3) * 40) * s, r = (60 + (i % 2) * 20) * s, c = ['#B8E8FF', '#FFD0E8', '#E0D0FF'][(i % 3 + 3) % 3]; ctx.fillStyle = '#E8F8F0'; ctx.fillRect(cx - 10 * s, gy - h, 20 * s, h); ctx.beginPath(); ctx.ellipse(cx, gy - h, r, r * .6, 0, Math.PI, 0); ctx.closePath(); fs(c); for (let q = 0; q < 3; q++) ell(cx - r * .5 + q * r * .5, gy - h - r * (.25 + (q % 2) * .15), 7 * s, 5 * s, '#FFFFFF99') });
    rep(.38, 380 * s, (x, i) => { const cx = x + 80 * s, h = (110 + (i % 2) * 50) * s, r = 52 * s, c = ['#FF7A8A', '#FFB040', '#B07AF0'][(i % 3 + 3) % 3]; ctx.fillStyle = '#F4E8D0'; ctx.fillRect(cx - 12 * s, gy - h, 24 * s, h + 10 * s); ctx.strokeStyle = OL; ctx.lineWidth = 2.5 * s; ctx.strokeRect(cx - 12 * s, gy - h, 24 * s, h + 10 * s); ctx.beginPath(); ctx.ellipse(cx, gy - h, r, r * .62, 0, Math.PI, 0); ctx.closePath(); fs(c, OL, 2.5 * s); for (let q = 0; q < 3; q++) ell(cx - r * .45 + q * r * .45, gy - h - r * (.22 + (q % 2) * .16), 8 * s, 6 * s, '#FFFFFF') });
    ctx.fillStyle = '#FFFFFFAA'; for (let i = 0; i < 26; i++) { const x = ((i * 131 - camX * s * .3 + Math.sin(t * .01 + i) * 30) % (cw + 40) + cw + 40) % (cw + 40) - 20, y = ((i * 97 - t * (.3 + i % 3 * .15)) % ch + ch) % ch; ctx.beginPath(); ctx.arc(x, y, (1.5 + i % 3) * s, 0, 7); ctx.fill() }
  } else if (k === 'ice') {
    ctx.globalAlpha = .35; for (let q = 0; q < 2; q++) { ctx.fillStyle = lg(0, 30 * s, 0, 150 * s, [q ? '#B07AF000' : '#5AF0B000', q ? '#B07AF0' : '#5AF0B0', '#5AF0B000']); ctx.beginPath(); for (let x = 0; x <= cw; x += 20) ctx.lineTo(x, oy + (50 + q * 20) * s + Math.sin(x * .006 + t * .01 + q) * 20 * s); for (let x = cw; x >= 0; x -= 20) ctx.lineTo(x, oy + (140 + q * 20) * s + Math.sin(x * .008 + t * .013) * 14 * s); ctx.fill() } ctx.globalAlpha = 1;
    rep(.12, 480 * s, x => { for (const [dx, h, w] of [[0, 200, 160], [180, 260, 190], [340, 170, 140]]) { const px = x + dx * s; poly([[px - w * s, gy], [px, gy - h * s], [px + w * s, gy]], '#B8D0EE'); poly([[px, gy - h * s], [px + w * s, gy], [px + w * .2 * s, gy]], '#98B4DA'); poly([[px, gy - h * s], [px - w * .3 * s, gy - h * .7 * s], [px - w * .1 * s, gy - h * .74 * s], [px + w * .05 * s, gy - h * .66 * s], [px + w * .3 * s, gy - h * .7 * s]], '#FFFFFF') } });
    rep(.35, 150 * s, (x, i) => { const px = x + 40 * s, h = (70 + (i % 3) * 20) * s; ctx.fillStyle = '#5A3A2A'; ctx.fillRect(px - 3 * s, gy - 14 * s, 6 * s, 14 * s); for (let q = 0; q < 3; q++) { const w = (28 - q * 7) * s, y = gy - 12 * s - q * h * .28; poly([[px - w, y], [px, y - h * .42], [px + w, y]], '#2E6A6A', OL, 1.5 * s); poly([[px - w * .6, y - h * .2], [px, y - h * .42], [px + w * .6, y - h * .2]], '#FFFFFF') } });
    ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 60; i++) { const x = ((i * 113 + Math.sin(t * .02 + i) * 20 - camX * s * .5) % cw + cw) % cw, y = ((i * 71 + t * (.8 + (i % 4) * .3)) % ch); ctx.beginPath(); ctx.arc(x, y, (1.2 + (i % 3) * .8) * s, 0, 7); ctx.fill() }
  } else if (k === 'airship') {
    sun(cw * .5, gy - 60 * s, 70 * s, '#FFD890', '#FFC070'); ctx.fillStyle = '#FFE8C0'; for (let q = 0; q < 4; q++) ctx.fillRect(cw * .5 - 80 * s, gy - 80 * s + q * 12 * s, 160 * s, 3 * s);
    rep(.08, 420 * s, (x, i) => cloud(x + 80 * s, gy - (150 + (i % 3) * 40) * s, s * 1.6, '#FFB8A0', '#C86A8A'));
    rep(.25, 520 * s, (x, i) => { const sx = x + 200 * s, sy = oy + (110 + (i % 2) * 60) * s + Math.sin(t * .02 + i) * 6 * s; ctx.fillStyle = '#3A2048'; ctx.beginPath(); ctx.moveTo(sx - 70 * s, sy); ctx.lineTo(sx + 70 * s, sy); ctx.quadraticCurveTo(sx + 60 * s, sy + 26 * s, sx - 50 * s, sy + 24 * s); ctx.closePath(); ctx.fill(); ctx.fillRect(sx - 30 * s, sy - 18 * s, 50 * s, 18 * s); ctx.fillRect(sx + 8 * s, sy - 40 * s, 4 * s, 22 * s); ell(sx + 10 * s, sy - 42 * s, Math.abs(Math.cos(t * .3)) * 22 * s + 2, 3 * s, '#3A2048'); ell(sx - 80 * s, sy + 8 * s, 3 * s, Math.abs(Math.cos(t * .4)) * 14 * s + 2, '#3A2048') });
    rep(.45, 300 * s, (x, i) => cloud(x + 40 * s, gy + 10 * s - (i % 2) * 30 * s, s * 1.3, '#FFD8C8', '#E890A8'));
  } else if (k === 'ghost') {
    sun(cw * .78, oy + 110 * s, 34 * s, '#E8E0FF', '#F4F0FF'); ell(cw * .78 - 10 * s, oy + 104 * s, 6 * s, 5 * s, '#D8D0F0'); ell(cw * .78 + 9 * s, oy + 120 * s, 4 * s, 3 * s, '#D8D0F0');
    rep(.15, 420 * s, (x, i) => { const bx = x + 120 * s; ctx.fillStyle = '#2A1838'; ctx.fillRect(bx, gy - 220 * s, 60 * s, 220 * s); ctx.fillRect(bx + 60 * s, gy - 140 * s, 120 * s, 140 * s); poly([[bx - 6 * s, gy - 220 * s], [bx + 30 * s, gy - 280 * s], [bx + 66 * s, gy - 220 * s]], '#2A1838'); for (let q = 0; q < 5; q++) ctx.fillRect(bx + 60 * s + q * 26 * s, gy - 156 * s, 14 * s, 16 * s); ctx.fillStyle = (t >> 5) % 3 === i % 3 ? '#FFD86A' : '#FFB84A'; for (const [wx, wy] of [[22, 190], [22, 140], [90, 100], [140, 100]]) { rr(bx + wx * s, gy - wy * s, 14 * s, 20 * s, 7 * s); ctx.fill() } });
    for (let i = 0; i < 6; i++) { const bx = ((i * 220 + t * (1 + i % 2 * .5) - camX * s * .2) % (cw + 100) + cw + 100) % (cw + 100) - 50, by = oy + (60 + (i * 53) % 120) * s + Math.sin(t * .05 + i) * 10 * s, w = Math.sin(t * .3 + i) * 8 * s; poly([[bx, by], [bx - 14 * s, by - 4 * s - w], [bx - 6 * s, by + 2 * s], [bx, by - 3 * s], [bx + 6 * s, by + 2 * s], [bx + 14 * s, by - 4 * s - w]], '#120818') }
    ctx.fillStyle = lg(0, gy - 90 * s, 0, gy + 20 * s, ['#B8A8E000', '#B8A8E055']); ctx.fillRect(0, gy - 90 * s, cw, 110 * s);
  } else if (k === 'sea') {   // dưới biển: tia nắng xuyên nước · san hô xa · bong bóng · mặt nước gợn sóng
    const sy = oy + 1.6 * TS * s; ctx.fillStyle = '#9ED8FF'; ctx.fillRect(0, 0, cw, Math.max(0, sy - 4 * s));
    ctx.globalAlpha = .12; for (let i = 0; i < 6; i++) { const per = cw + 300, x = ((i * 240 - camX * s * .15 + Math.sin(t * .01 + i) * 30) % per + per) % per - 150; poly([[x, sy], [x + 60 * s, sy], [x + 180 * s, ch], [x + 70 * s, ch]], '#FFFFFF') } ctx.globalAlpha = 1;
    rep(.2, 360 * s, (x, i) => { const cx = x + 120 * s; ctx.fillStyle = '#1E4A9A'; for (const [dx, h, w] of [[0, 150, 18], [-40, 100, 14], [36, 120, 14], [70, 70, 12]]) { rr(cx + dx * s - w * s / 2, gy - h * s, w * s, h * s + 20, w * s / 2); ctx.fill(); ell(cx + dx * s, gy - h * s, w * s * .9, w * s * .9, '#1E4A9A') } });
    rep(.35, 300 * s, (x, i) => { const cx = x + 60 * s, c = ['#E85A9A', '#F08A3A', '#B05AE0'][(i % 3 + 3) % 3]; for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * .45 + Math.sin(t * .02 + q + i) * .05; line([[cx, gy + 10 * s], [cx + Math.cos(a) * 60 * s, gy + 10 * s + Math.sin(a) * 60 * s]], c, 8 * s) } });
    ctx.globalAlpha = .55; for (let i = 0; i < 26; i++) { const x = ((i * 113 - camX * s * .4) % (cw + 40) + cw + 40) % (cw + 40) - 20, y = ch - ((t * (.5 + (i % 4) * .25) + i * 67) % Math.max(1, ch - sy)); ell(x, y, (2 + i % 3) * s * 1.5, (2 + i % 3) * s * 1.5, '#DFF4FF33', '#DFF4FF', 1.2) } ctx.globalAlpha = 1;
    ctx.fillStyle = '#DFF4FF'; ctx.beginPath(); ctx.moveTo(0, sy - 2 * s); for (let x = 0; x <= cw; x += 10 * s) ctx.lineTo(x, sy - 3 * s + Math.sin((x / s + t * 2) * .04) * 3 * s); ctx.lineTo(cw, sy + 2 * s); ctx.lineTo(0, sy + 2 * s); ctx.fill();
  } else if (k === 'sky') {   // vườn mây: biển mây phía dưới, mặt trời chói
    sun(cw * .8, oy + 80 * s, 36 * s, '#FFF6B0', '#FFE680');
    rep(.1, 260 * s, (x, i) => cloud(x + 40 * s, oy + (60 + (i % 3) * 50) * s, s * (i % 2 ? 1 : .7), '#FFFFFF', '#D8ECFF'));
    for (let row = 0; row < 3; row++) rep(.2 + row * .15, 180 * s, (x, i) => cloud(x + 30 * s, gy + (20 + row * 26) * s, s * (1.4 + row * .3), row === 2 ? '#FFFFFF' : '#F0F8FF', '#C8E0FA'));
  } else {
    for (let i = 0; i < 30; i++) { const x = ((i * 137 - camX * s * .3) % (cw + 60) + cw + 60) % (cw + 60) - 30, y = oy + (70 + (i * 71) % 300) * s; ctx.globalAlpha = .3 + .4 * Math.abs(Math.sin(t * .03 + i)); poly([[x, y - 6 * s], [x + 4 * s, y], [x, y + 6 * s], [x - 4 * s, y]], ['#7AA8FF', '#C9A8FF', '#FFB8E0'][i % 3]) } ctx.globalAlpha = 1;
  }
}
function drawTiles(c0, c1, rowsBelow) {
  const TL = tiles(A.th), fr = (S.tick >> 4) & 1;
  for (let c = c0; c <= c1; c++) {
    if (c < 0 || c >= A.w) continue;
    for (let r = 0; r < ROWS; r++) {
      const t = A.g[c][r]; if (t === '.' || t === 'P') continue;
      const b = A.bumps.find(q => q.c === c && q.r === r), dy = b ? -Math.round(Math.sin(b.t / 10 * Math.PI) * 8) : 0, x = c * TS, y = r * TS + dy;
      if (t === '?') ctx.drawImage(TL[(S.tick >> 3) % 6 < 2 ? 'Q1' : 'Q0'], x, y, TS, TS);
      else if (t === 'L') ctx.drawImage(getT(A, c, r - 1) !== 'L' ? TL[fr ? 'L1' : 'L0'] : TL.Lb, x, y, TS, TS);
      else if (t === 'G') ctx.drawImage(getT(A, c, r - 1) === 'G' ? TL.G : TL.Gt, x, y, TS, TS);
      else if (t === 'M') { if (getT(A, c - 1, r) !== 'M') { let n = 1; while (getT(A, c + n, r) === 'M') n++; capRun(x, y, n * TS) } }   // mũ nấm: vẽ liền một khối
      else if (TL[t]) ctx.drawImage(TL[t], x, y, TS, TS);
    }
    if (A.g[c][14] === 'G') for (let r = ROWS; r < ROWS + rowsBelow; r++)ctx.drawImage(TL.G, c * TS, r * TS, TS, TS);
  }
}
function capRun(x, y, w) {   // mũ nấm đỏ chấm trắng vẽ liền một khối
  ctx.beginPath(); ctx.moveTo(x - 4, y + 20); ctx.quadraticCurveTo(x - 6, y + 2, x + 14, y + 1); ctx.lineTo(x + w - 14, y + 1); ctx.quadraticCurveTo(x + w + 6, y + 2, x + w + 4, y + 20); ctx.closePath(); fs(lg(0, y, 0, y + 20, ['#FF7A80', '#E8384A', '#B01E30']), OL, 2);
  rr(x + 2, y + 18, w - 4, 5, 2.5); fs('#F8E8D0', OL, 1.4); for (let i = 0; i < w / 16; i++) ell(x + 10 + i * 16, y + 8 + (i % 2) * 5, i % 2 ? 2.6 : 4, (i % 2 ? 2.6 : 4) * .85, '#FFFFFF'); ell(x + 12, y + 5, Math.min(18, w * .25), 2, '#ffffff55')
}
function drawPipe(p) {
  const x = p.x * TS, y = p.top * TS, h = p.h * TS;
  rr(x + 4, y + 14, 56, h - 12, 2); fs(lg(x + 4, 0, x + 60, 0, ['#0B4A16', '#2DB84B', '#A8F49A', '#3CCB58', '#18842E', '#0B4A16']), OL, 2);
  rr(x, y, 64, 18, 4); fs(lg(x, 0, x + 64, 0, ['#0B4A16', '#3CCB58', '#C0FAAE', '#46D062', '#1A8A30', '#0B4A16']), OL, 2);
  if (p.enter && p.to) { const ay = y - 22 + Math.sin(S.tick * .12) * 3; poly([[x + 32, ay + 14], [x + 22, ay + 2], [x + 28, ay + 2], [x + 28, ay - 8], [x + 36, ay - 8], [x + 36, ay + 2], [x + 42, ay + 2]], '#FFD23F', '#7A3E00', 2) }
}
function drawPlant(p) {   // hoa ăn thịt: miệng đỏ chấm trắng đớp đớp
  const k = plantK(p); if (k <= 0) return;
  const cx = p.x * TS + 32, by = p.top * TS + 8, hy = by - 34 * k, op = (Math.sin(S.tick * .25) + 1) * .5, lc = p.fire ? '#2EA84A' : '#E8263A';   // hoa phun lửa: màu xanh
  ctx.fillStyle = '#2DB84B'; ctx.fillRect(cx - 3, hy + 10, 6, by - hy); ell(cx - 9, hy + 22, 8, 3.5, '#3CCB58', OL, 1.5, -.4); ell(cx + 9, hy + 26, 8, 3.5, '#3CCB58', OL, 1.5, .4);
  ctx.save(); ctx.translate(cx, hy + 6);
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0, Math.PI * (1 + op * .15), Math.PI * (2 - op * .15)); ctx.closePath(); fs(lc, OL, 2);
  ctx.beginPath(); ctx.ellipse(0, 2, 13, 10, 0, Math.PI * (op * .15), Math.PI * (1 - op * .15)); ctx.closePath(); fs(lc, OL, 2);
  ell(0, 1, 9, 2 + op * 4, '#5A0A14'); for (const [dx, dy] of [[-7, -5], [4, -7], [8, 4], [-4, 6]]) ell(dx, dy, 2, 1.6, '#FFFFFF');
  for (let q = -6; q <= 6; q += 4) poly([[q - 1.6, -1 - op * 2], [q, 2 - op * 2], [q + 1.6, -1 - op * 2]], '#FFFFFF');
  ctx.restore();
}
/* ═ quái ═ */
function wings(x, y, f, flap) { for (const d of [-1, 1]) { ctx.save(); ctx.translate(x + d * 4, y); ctx.scale(d, 1); ctx.rotate(-.3 - flap * .5); ell(8, -4, 9, 5, '#FFFFFF', OL, 1.5); line([[3, -4], [12, -6]], '#C8D4E8', 1); ctx.restore() } }
function turtleShell(cx, by, beetle, dry) { const c = beetle ? ['#5A6AE8', '#2A2A8A', '#9AA8FF'] : dry ? ['#F4F0E0', '#A8A090', '#FFFFFF'] : ['#3CCB58', '#137A2B', '#9CF08A']; ctx.beginPath(); ctx.ellipse(cx, by - 8, 13, 13, 0, Math.PI, 0); ctx.closePath(); fs(lg(0, by - 21, 0, by - 8, [c[2], c[0], c[1]]), OL, 2); ctx.fillStyle = beetle ? '#D8D8F0' : '#FFF4D8'; rr(cx - 13, by - 9, 26, 5, 2.5); fs('#FFF4D8', OL, 1.6); if (!beetle) { ctx.strokeStyle = c[1]; ctx.lineWidth = 1.4; poly([[cx - 4, by - 18], [cx + 4, by - 18], [cx + 7, by - 12], [cx - 7, by - 12]], null, c[1], 1.4) } else { ell(cx - 4, by - 16, 3, 2, '#C8D0FF') } }
function drawEnemy(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h, cx = x + w / 2, by = y + h, t = S.tick, wk = Math.sin(t * .25), dead = e.dead;
  if (dead === 1) return;
  ctx.save();
  if (dead > 1) { ctx.globalAlpha = Math.min(1, dead / 25); if (e.k === 'shroom' || e.k === 'pengu') { ctx.translate(cx, by); ctx.scale(1, .45); ctx.translate(-cx, -by) } else { ctx.translate(0, (40 - dead) * 1.6); ctx.translate(cx, by - h / 2); ctx.scale(1, -1); ctx.translate(-cx, -(by - h / 2)) } }
  const flip = (e.vx || 0) > 0 || e.f > 0; if (flip && e.k !== 'boo') { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0) }
  if (e.k === 'shroom') {   // nấm nâu cau có
    ell(cx - 6 + wk * 2, by - 2, 6, 3, '#3A1E0A', OL, 1.4); ell(cx + 6 - wk * 2, by - 2, 6, 3, '#3A1E0A', OL, 1.4);
    rr(cx - 7, by - 12, 14, 9, 4); fs('#F6D2A0', OL, 1.6);
    ctx.beginPath(); ctx.moveTo(cx - 13, by - 9); ctx.quadraticCurveTo(cx - 14, by - 24, cx, by - 23); ctx.quadraticCurveTo(cx + 14, by - 24, cx + 13, by - 9); ctx.closePath(); fs(lg(0, by - 24, 0, by - 9, ['#C87038', '#A0521E']), OL, 2);
    ell(cx - 4, by - 14, 2.6, 3.4, '#FFFFFF', OL, 1); ell(cx + 4, by - 14, 2.6, 3.4, '#FFFFFF', OL, 1); ell(cx - 4.6, by - 13.4, 1.2, 1.8, OL); ell(cx + 3.4, by - 13.4, 1.2, 1.8, OL);
    line([[cx - 8, by - 19], [cx - 2, by - 16.5]], OL, 2); line([[cx + 8, by - 19], [cx + 2, by - 16.5]], OL, 2);
  } else if (e.k === 'turtle' || e.k === 'para' || e.k === 'dry') {
    if (e.sh) turtleShell(cx, by, e.beetle);
    else if (e.k === 'dry' && e.bones) { for (let i = 0; i < 4; i++) ell(cx - 9 + i * 6, by - 3, 4, 2, '#F4F0E0', OL, 1.2, i); ell(cx + 2, by - 9, 6, 5, '#F4F0E0', OL, 1.4); ell(cx + 0, by - 10, 1.4, 1.6, OL) }
    else {
      const sk = e.k === 'dry' ? '#F4F0E0' : e.beetle ? '#3A3A6A' : '#FFD23F';
      ell(cx - 5 + wk * 2, by - 2.5, 5, 3, e.beetle ? '#2A2A4A' : '#E8862A', OL, 1.4); ell(cx + 6 - wk * 2, by - 2.5, 5, 3, e.beetle ? '#2A2A4A' : '#E8862A', OL, 1.4);
      turtleShell(cx + 3, by - 2, e.beetle, e.k === 'dry');
      if (!e.beetle) { ell(cx - 9, by - 22, 6, 7, sk, OL, 1.8); ell(cx - 11, by - 24, 2, 3, '#FFFFFF', OL, 1); ell(cx - 11.6, by - 23.6, 1, 1.8, OL); if (e.k === 'dry') line([[cx - 14, by - 19], [cx - 8, by - 18]], OL, 1.2) }
      else { ell(cx - 9, by - 8, 2, 2, '#FFFFFF'); ell(cx - 9.4, by - 8, .9, 1.2, OL) }
      if (e.k === 'para') wings(cx + 6, by - 22, 1, Math.abs(Math.sin(t * .3)));
    }
  } else if (e.k === 'bob') {   // bom biết đi: châm ngòi thì nháy đỏ
    const lit = e.lit, fl = lit && (t >> (lit < 40 ? 1 : 3)) & 1;
    ell(cx - 5 + (lit ? 0 : wk * 2), by - 2, 5, 3, '#F8B020', OL, 1.4); ell(cx + 5 - (lit ? 0 : wk * 2), by - 2, 5, 3, '#F8B020', OL, 1.4);
    ell(cx, by - 13, 11, 11, fl ? '#FF3A3A' : lg(0, by - 24, 0, by - 2, ['#5A5A70', '#1A1A2A']), OL, 2); ell(cx - 4, by - 18, 3, 2, '#FFFFFF55');
    ctx.fillStyle = '#C8C8D8'; rr(cx + 8, by - 16, 7, 3, 1.5); ctx.fill(); ell(cx + 16, by - 18 + Math.sin(t * .3) * 2, 2.5, 4, '#C8C8D8', OL, 1);
    line([[cx, by - 24], [cx + 2, by - 29]], '#8A6A3A', 2); if (lit) ell(cx + 2, by - 30, 2.6 + Math.random() * 1.4, 2.6, '#FFE070');
    ell(cx - 5, by - 13, 2, 3, '#FFFFFF'); ell(cx - 1, by - 13, 2, 3, '#FFFFFF'); ell(cx - 5.4, by - 12.6, .9, 1.6, OL); ell(cx - 1.4, by - 12.6, .9, 1.6, OL);
  } else if (e.k === 'pokey') {   // xương rồng chồng 3 khúc, khúc trên có mặt & hoa
    for (let i = 0; i < 3; i++) { const sx = cx + Math.sin(t * .08 + i * 1.2) * (i * 1.6), sy = by - 9 - i * 19; ell(sx, sy, 11, 10, lg(0, sy - 10, 0, sy + 10, ['#D8F078', '#A8D040', '#78A828']), OL, 1.8); for (const [dx, dy] of [[-11, 0], [11, 0], [-7, -8], [7, -8], [0, -10]]) poly([[sx + dx * .9 - 1, sy + dy * .9], [sx + dx * 1.25, sy + dy * 1.25], [sx + dx * .9 + 1, sy + dy * .9]], '#FFF8D0') }
    const hx = cx + Math.sin(t * .08 + 2.4) * 3.2, hy = by - 47; ell(hx - 4, hy, 2.2, 3, '#FFFFFF', OL, 1); ell(hx + 3, hy, 2.2, 3, '#FFFFFF', OL, 1); ell(hx - 4.4, hy + .5, 1, 1.6, OL); ell(hx + 2.6, hy + .5, 1, 1.6, OL); ell(hx - .5, hy + 5, 3, 1.4, '#5A2A0A');
    for (let i = 0; i < 5; i++) ell(hx + Math.cos(i * 1.26) * 3, hy - 11 + Math.sin(i * 1.26) * 3, 2.4, 2.4, '#FF6A9A'); ell(hx, hy - 11, 1.6, 1.6, '#FFE070');
  } else if (e.k === 'pengu') {   // chim cánh cụt đứng thẳng: mũ len, khăn quàng · lạch bạch đi · giơ vây ném cá
    const thr = e.thr && !dead, wob = thr ? 0 : Math.sin(t * .3) * .12, bob = thr ? 0 : Math.abs(Math.sin(t * .3)) * 1.6, nv = '#24407E', nd = '#121E44';
    ctx.save(); ctx.translate(cx, by); ctx.rotate(wob);
    ell(-5, -2, 5.4, 2.6, '#FFA020', OL, 1.2); ell(6, -2, 5.4, 2.6, '#FFA020', OL, 1.2);
    ell(8, -15 - bob, 3.4, 9, nd, OL, 1.4, .35);   // vây sau
    ell(0, -14 - bob, 11.5, 14, lg(0, -28, 0, 0, [nv, nd]), OL, 2); ell(-2.5, -12 - bob, 8, 10.6, lg(0, -22, 0, -2, ['#FFFFFF', '#E4ECF8']));
    ell(-1, -27 - bob, 9, 8.4, nv, OL, 2); ell(-3.4, -26 - bob, 5.6, 5.2, '#FFFFFF');
    ell(-5, -27.6 - bob, 1.5, 2.1, OL); ell(-5.4, -28.4 - bob, .6, .7, '#FFFFFF'); ell(-2.4, -23.4 - bob, 1.7, 1, '#FFB0C8');
    poly([[-8.6, -26 - bob], [-15, -24.4 - bob], [-8.6, -22.6 - bob]], '#FFA020', OL, 1.1);
    ctx.beginPath(); ctx.ellipse(-1, -33 - bob, 8.4, 5.4, 0, Math.PI, 0); ctx.closePath(); fs('#3AA0E8', OL, 1.6); rr(-9.6, -34.4 - bob, 17.2, 3.4, 1.7); fs('#FFFFFF', OL, 1); ell(-1, -39.6 - bob, 2.8, 2.8, '#FFFFFF', OL, 1);   // mũ len
    rr(-9.5, -20 - bob, 18, 4, 2); fs('#E83A4A', OL, 1.2); rr(3, -18 - bob, 4, 8, 2); fs('#E83A4A', OL, 1.2);   // khăn quàng
    if (thr) { ctx.save(); ctx.translate(-7, -19); ctx.rotate(-2.3); ell(0, 6, 3.4, 8, nv, OL, 1.4); ctx.restore(); ctx.save(); ctx.translate(-13, -32); ctx.rotate(.5); ell(0, 0, 7, 3.6, '#7AB8F0', OL, 1.2); poly([[6, 0], [10, -4], [10, 4]], '#5A98D8', OL, 1); ell(-3.4, -.6, .8, .8, OL); ctx.restore() }   // giơ cá lên ném
    else ell(-8, -14 - bob + Math.sin(t * .3) * 1.5, 3.4, 8, nv, OL, 1.4, -.35);
    ctx.restore();
  } else if (e.k === 'shark') {   // cá mập xanh xám (nhìn sang trái) · lao tới thì há miệng
    const fl = e.hurtT && (e.hurtT >> 1) & 1, cy = y + h / 2 + Math.sin(t * .15) * 2, rush = e.rush > 0, tw = Math.sin(t * .25) * 4;
    if (fl) ctx.globalAlpha *= .4;
    poly([[x + w - 10, cy], [x + w + 10, cy - 14 + tw], [x + w + 4, cy], [x + w + 10, cy + 12 + tw]], '#5A7AA0', OL, 1.8);
    poly([[cx - 4, cy - 12], [cx + 8, cy - 28], [cx + 14, cy - 11]], '#5A7AA0', OL, 1.8);
    ctx.beginPath(); ctx.moveTo(x - 2, cy + 2); ctx.quadraticCurveTo(x + 6, cy - 16, cx, cy - 14); ctx.quadraticCurveTo(x + w - 6, cy - 12, x + w - 6, cy); ctx.quadraticCurveTo(x + w - 10, cy + 13, cx, cy + 14); ctx.quadraticCurveTo(x + 8, cy + 14, x - 2, cy + 2); ctx.closePath(); fs(lg(0, cy - 16, 0, cy + 14, ['#9AB4D4', '#6F8CB0', '#4E6A90']), OL, 2);
    ctx.beginPath(); ctx.moveTo(x + 2, cy + 4); ctx.quadraticCurveTo(cx - 6, cy + 16, x + w - 14, cy + 6); ctx.quadraticCurveTo(cx, cy + 8, x + 2, cy + 4); fs('#F2F6FA');
    ell(cx + 4, cy + 10, 6, 2.4, '#4E6A90', OL, 1.2, .5); for (let q = 0; q < 3; q++) line([[cx - 10 + q * 4, cy - 6], [cx - 11 + q * 4, cy + 1]], '#3A5070', 1.2);
    ell(x + 14, cy - 5, 3.4, 3.4, '#FFFFFF', OL, 1); ell(x + 13.4, cy - 4.6, 1.6, 2, OL); line([[x + 9, cy - 10], [x + 18, cy - 8]], OL, 2);
    if (rush) { ctx.beginPath(); ctx.moveTo(x - 1, cy + 1); ctx.lineTo(x + 18, cy + 3); ctx.lineTo(x + 2, cy + 9); ctx.closePath(); fs('#8A1A2A', OL, 1.2); for (let q = 0; q < 4; q++) poly([[x + 2 + q * 4, cy + 2], [x + 4 + q * 4, cy + 5], [x + 6 + q * 4, cy + 2.4]], '#FFFFFF') } else line([[x, cy + 3], [x + 14, cy + 4]], OL, 1.6);
    if (rush && (t >> 2) & 1) { ctx.restore(); ctx.save(); label('!', e.vx < 0 ? x - 8 : x + w + 8, y - 4, 18, '#E52521', '#FFFFFF') }  } else if (e.k === 'bee') {   // ong sọc vàng đen
    const fl = Math.sin(t * .8); ell(cx + 3, by - 16 - fl * 3, 6, 4, '#FFFFFFCC', OL, 1, -.5); ell(cx - 3, by - 16 + fl * 3, 6, 4, '#FFFFFFCC', OL, 1, .5);
    ell(cx, by - 8, 11, 8, '#FFD23F', OL, 1.8); ctx.save(); ctx.beginPath(); ctx.ellipse(cx, by - 8, 11, 8, 0, 0, 7); ctx.clip(); ctx.fillStyle = OL; ctx.fillRect(cx - 1, by - 16, 3.5, 16); ctx.fillRect(cx + 5, by - 16, 3.5, 16); ctx.restore();
    ell(cx - 8, by - 9, 2.4, 3, '#FFFFFF', OL, 1); ell(cx - 8.6, by - 8.6, 1, 1.6, OL); poly([[cx + 10, by - 9], [cx + 15, by - 8], [cx + 10, by - 6.5]], OL);
  } else if (e.k === 'boo') {   // ma Boo: che mặt khi em nhìn thẳng
    ctx.restore(); ctx.save(); if (e.dead > 1) ctx.globalAlpha = Math.min(1, e.dead / 25); else ctx.globalAlpha = e.shy ? .78 : .95;
    const f = e.f, bx = cx, byy = y + h / 2 + Math.sin(t * .07 + e.ph) * 2;
    ell(bx, byy, 14, 13, '#FFFFFF', OL, 2); poly([[bx - f * 12, byy + 6], [bx - f * 19, byy + 11], [bx - f * 10, byy + 11]], '#FFFFFF', OL, 1.6);
    if (e.shy) { ell(bx - 7, byy - 1, 5, 3.5, '#FFFFFF', OL, 1.6, -.6); ell(bx + 7, byy - 1, 5, 3.5, '#FFFFFF', OL, 1.6, .6); ell(bx - 4, byy + 5, 2, 1, '#FFB0C8'); ell(bx + 4, byy + 5, 2, 1, '#FFB0C8') }
    else { ell(bx + f * 2, byy - 4, 2, 3.4, OL); ell(bx + f * 8, byy - 4, 2, 3.4, OL); ell(bx + f * 5, byy + 4, 5, 4, '#5A0A20'); ell(bx + f * 6, byy + 6, 2.6, 2, '#FF5A7A') }
  } else if (e.k === 'chomp') {   // chó xích: quả cầu đen há mồm đầy răng
    ctx.restore(); ctx.save(); if (e.dead > 1) ctx.globalAlpha = Math.min(1, e.dead / 25);
    const ax = e.ax, ay = e.ay, ccx = e.x + 14, ccy = e.y + 14, f = ccx >= ax ? 1 : -1;
    ctx.fillStyle = '#5A4A3A'; rr(ax - 4, ay - 10, 8, 20, 2); fs('#8A6A4A', OL, 1.6);
    for (let i = 1; i <= 5; i++) { const q = i / 6; ell(ax + (ccx - ax) * q, ay - 6 + (ccy - ay + 6) * q - Math.sin(q * Math.PI) * 6, 3.4, 3, '#8A8AA6', OL, 1.2) }
    ell(ccx, ccy, 15, 15, rg(ccx - 5, ccy - 6, 22, ['#5A5A70', '#14141E']), OL, 2); ell(ccx - f * 3, ccy - 6, 4, 4, '#FFFFFF'); ell(ccx - f * 2, ccy - 6, 2, 2, OL);
    const op = e.st === 'lunge' ? 1 : .5 + Math.sin(e.t * .3) * .3; ctx.beginPath(); ctx.moveTo(ccx + f * 15, ccy - 4 * op); ctx.lineTo(ccx + f * 2, ccy + 1); ctx.lineTo(ccx + f * 15, ccy + 7 * op); ctx.closePath(); fs('#C81A2A', OL, 1.4);
    for (let i = 0; i < 3; i++) { poly([[ccx + f * (5 + i * 3.5), ccy - 2.6 * op + i * .4], [ccx + f * (6.7 + i * 3.5), ccy + .4], [ccx + f * (8.4 + i * 3.5), ccy - 2.4 * op + i * .4]], '#FFFFFF'); poly([[ccx + f * (5 + i * 3.5), ccy + 4 * op], [ccx + f * (6.7 + i * 3.5), ccy + 1.6], [ccx + f * (8.4 + i * 3.5), ccy + 4 * op]], '#FFFFFF') }
  } else if (e.k === 'rocky') {   // chuột chũi đội mũ, thò lên khỏi nắp hầm
    ctx.restore(); ctx.save();
    const up = e.t > 90 && e.t < 175 ? Math.min(1, (e.t - 90) / 12, (175 - e.t) / 12) : 0, mx = cx, my = by;
    if (up > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 30, w + 20, h + 26); ctx.clip(); const hy = my - 22 * up;
      ell(mx, hy + 6, 10, 10, '#8A5A3A', OL, 1.8); ell(mx, hy + 9, 6, 4, '#F4C890'); ell(mx - 3.5, hy + 2, 2, 2.4, '#FFFFFF', OL, 1); ell(mx + 3.5, hy + 2, 2, 2.4, '#FFFFFF', OL, 1); ell(mx - 3.5, hy + 2.4, .9, 1.4, OL); ell(mx + 3.5, hy + 2.4, .9, 1.4, OL); ell(mx, hy + 6, 2, 1.4, '#FF8A8A');
      ctx.beginPath(); ctx.ellipse(mx, hy - 2, 11, 7, 0, Math.PI, 0); ctx.closePath(); fs('#5A8A3A', OL, 1.6);
      if (e.t > 105 && e.t < 130) { ctx.save(); ctx.translate(mx + e.f * 12, hy); ctx.rotate(-1 + (e.t - 105) * .04); ctx.fillStyle = '#B8B8CC'; rr(-2, -12, 4, 14, 2); fs('#B8B8CC', OL, 1.2); ctx.restore() }
      ctx.restore() }
    rr(x - 4, by - 4, w + 8, 6, 3); fs('#4A4A60', OL, 1.6); ctx.fillStyle = '#8A8AA6'; ctx.fillRect(x, by - 3, w, 1.6);
  } else if (e.k === 'fish') {   // cá đỏ (nhìn sang trái)
    const cy = y + h / 2, fl = Math.sin(t * .3) * 3;
    poly([[cx + 9, cy], [cx + 18, cy - 7 - fl], [cx + 16, cy], [cx + 18, cy + 7 + fl]], '#FF6A5A', OL, 1.4); poly([[cx - 4, cy - 7], [cx + 2, cy - 13], [cx + 6, cy - 6]], '#FFB0A0', OL, 1.2);
    ell(cx, cy, 12, 8, lg(0, cy - 8, 0, cy + 8, ['#FF9A7A', '#E83A3A']), OL, 1.6); ell(cx - 1, cy + 3.4, 7, 2.6, '#FFE0D0'); ell(cx - 6, cy - 2, 2.8, 2.8, '#FFFFFF', OL, 1); ell(cx - 6.8, cy - 2, 1.2, 1.6, OL); ell(cx + 2, cy, 3, 2, '#FFB0A0', OL, 1, .5);
  } else if (e.k === 'squid') {   // mực trắng
    const sw2 = e.vy < -.6 ? 1 : 0, cy = y + 10;
    for (let i = 0; i < 4; i++) line([[cx - 6 + i * 4, cy + 8], [cx - 6 + i * 4 + Math.sin(t * .2 + i) * (sw2 ? 1 : 3), cy + 18 - sw2 * 3]], '#FFFFFF', 3);
    ctx.beginPath(); ctx.moveTo(cx - 9, cy + 9); ctx.quadraticCurveTo(cx - 11, cy - 10, cx, cy - 13); ctx.quadraticCurveTo(cx + 11, cy - 10, cx + 9, cy + 9); ctx.closePath(); fs(lg(0, cy - 13, 0, cy + 9, ['#FFFFFF', '#E0E8F8']), OL, 1.6);
    ell(cx - 3.4, cy + 1, 2, 3, OL); ell(cx + 3.4, cy + 1, 2, 3, OL); ctx.fillStyle = '#FF7EB6'; ctx.fillRect(cx - 9, cy + 6, 18, 2.4);
  } else if (e.k === 'puffer') {   // cá nóc: phồng to là xù gai
    const r = e.w / 2, cy = y + r, b = e.big;
    if (b > .2) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; poly([[cx + Math.cos(a - .14) * r * .92, cy + Math.sin(a - .14) * r * .92], [cx + Math.cos(a) * (r + 5 * b), cy + Math.sin(a) * (r + 5 * b)], [cx + Math.cos(a + .14) * r * .92, cy + Math.sin(a + .14) * r * .92]], '#FFF2C0', OL, 1) }
    poly([[cx + r * .8, cy], [cx + r + 7, cy - 6], [cx + r + 7, cy + 6]], '#F8B020', OL, 1.4);
    ell(cx, cy, r, r, rg(cx - r * .3, cy - r * .3, r * 1.4, ['#FFF2A0', '#FFC83A', '#E89A1A']), OL, 1.8); ell(cx + 1, cy + r * .4, r * .6, r * .35, '#FFF8E0');
    ell(cx - r * .45, cy - r * .2, 3, 3.4, '#FFFFFF', OL, 1); ell(cx - r * .5, cy - r * .15, 1.4, 1.8, OL); ell(cx - r * .8, cy + r * .2, 2.4, b > .5 ? 2.4 : 1.2, '#C84A2A');
  } else if (e.k === 'jelly') {   // sứa hồng trong suốt
    const cy = y + 10, p = Math.sin(t * .1) * 1.5; ctx.globalAlpha *= .9;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 8 + i * 4, cy + 4); for (let k2 = 1; k2 <= 4; k2++) ctx.lineTo(cx - 8 + i * 4 + Math.sin(t * .15 + i + k2) * 2, cy + 4 + k2 * 4); ctx.strokeStyle = '#FF9AD0'; ctx.lineWidth = 1.6; ctx.stroke() }
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 12 + p, 11 - p, 0, Math.PI, 0); ctx.closePath(); fs(rg(cx - 3, cy - 3, 16, ['#FFE8F6', '#FF9AD0', '#E05AA8']), OL, 1.6);
    ell(cx - 4, cy - 2, 3, 2, '#FFFFFFAA'); ell(cx - 3, cy + 1, 1.2, 1.6, OL); ell(cx + 3, cy + 1, 1.2, 1.6, OL);
  } else if (e.k === 'eel') {   // lươn thò ra từ hang san hô
    ctx.restore(); ctx.save(); if (e.dead > 1) ctx.globalAlpha = Math.min(1, e.dead / 25);
    if (e.ext > .02) { const f = e.f, hx = e.hx, hy = y + h / 2, tx = f > 0 ? x + w - 6 : x + 6;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + tx) / 2, hy + Math.sin(t * .2) * 6, tx, hy); ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = '#4AB868'; ctx.lineWidth = 11; ctx.stroke(); ctx.strokeStyle = '#B8F0A8'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(tx, hy); ctx.scale(f, 1); ell(4, 0, 10, 8, '#4AB868', OL, 1.6); ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(4, 1); ctx.lineTo(14, 5 * e.ext); ctx.closePath(); fs('#8A1A2A', OL, 1.2); ell(5, -3.4, 2.4, 2.4, '#FFF2A0', OL, 1); ell(5.4, -3.4, 1, 1.6, OL); ctx.restore() }
    ell(e.hx, y + h / 2, 7, 9, '#1A0A2A');
  } else if (e.k === 'lakitu') {   // Lakitu đeo kính bơi ngồi trên đám mây có mặt cười
    ctx.restore(); ctx.save(); if (e.dead > 1) { ctx.globalAlpha = Math.min(1, e.dead / 25); ctx.translate(0, (40 - e.dead) * 2) }
    const f = e.f, ly = y + 6; ell(cx - f * 2, ly + 2, 8, 9, '#FFD23F', OL, 1.6); ell(cx - f * 1, ly - 2, 5, 3.4, '#FFFFFF'); ell(cx - f * 3, ly - 4, 2.6, 2.6, '#DDF4FF', OL, 1.2); ell(cx + f * 1.4, ly - 4, 2.6, 2.6, '#DDF4FF', OL, 1.2); line([[cx - f * 6, ly - 4], [cx + f * 4, ly - 4]], OL, 1);
    ell(cx + f * 6, ly + 6, 7, 6, '#3CCB58', OL, 1.4);
    for (const [dx, dy, r] of [[-10, 18, 8], [0, 15, 10], [10, 18, 8], [0, 22, 9]]) ell(cx + dx, y + dy, r, r, '#FFFFFF', '#9CC8F0', 1.4); ell(cx - 4, y + 19, 1.2, 1.6, OL); ell(cx + 4, y + 19, 1.2, 1.6, OL); ctx.beginPath(); ctx.arc(cx, y + 21, 3, .2, Math.PI - .2); fs(null, OL, 1.2);
  } else if (e.k === 'spiny') {   // nhím gai đỏ
    ell(cx - 6 + wk * 2, by - 2, 5, 2.6, '#F8B020', OL, 1.2); ell(cx + 6 - wk * 2, by - 2, 5, 2.6, '#F8B020', OL, 1.2);
    for (let i = 0; i < 5; i++) { const a = Math.PI + (i + .5) * Math.PI / 5; poly([[cx + Math.cos(a - .25) * 11, by - 8 + Math.sin(a - .25) * 11], [cx + Math.cos(a) * 17, by - 8 + Math.sin(a) * 17], [cx + Math.cos(a + .25) * 11, by - 8 + Math.sin(a + .25) * 11]], '#FFFFFF', OL, 1.2) }
    ctx.beginPath(); ctx.ellipse(cx, by - 6, 12, 12, 0, Math.PI, 0); ctx.closePath(); fs(lg(0, by - 18, 0, by - 6, ['#FF6A5A', '#C81A2A']), OL, 1.8); ell(cx - 9, by - 8, 4, 4, '#FFD23F', OL, 1.2); ell(cx - 10, by - 9, 1, 1.6, OL);
  } else if (e.k === 'hammer') {   // anh em ném búa (bản tuyết ném cầu tuyết)
    const sn = e.snow, hc = sn ? '#5AB0FF' : '#3CCB58', up = (e.t % LVC.hb) > LVC.hb - 22;
    ell(cx - 5, by - 2.6, 5, 3, '#F8B020', OL, 1.2); ell(cx + 6, by - 2.6, 5, 3, '#F8B020', OL, 1.2);
    turtleShell(cx + 4, by - 6, 0, sn); rr(cx - 8, by - 24, 14, 16, 6); fs('#FFD23F', OL, 1.6);
    ell(cx - 4, by - 26, 8, 7.4, '#FFD23F', OL, 1.6); ctx.beginPath(); ctx.ellipse(cx - 3, by - 28, 9, 7, 0, Math.PI, 0); ctx.closePath(); fs(hc, OL, 1.6); ell(cx - 8, by - 26, 1.6, 2.4, '#FFFFFF', OL, .8); ell(cx - 8.6, by - 25.6, .8, 1.4, OL);
    ctx.save(); ctx.translate(cx - 6, by - 20); ctx.rotate(up ? -2.2 : -.6); if (sn) ell(0, -12, 5.4, 5.4, '#FFFFFF', '#9CC8F0', 1.4); else { rr(-1.4, -14, 2.8, 14, 1.4); fs('#8A5A2A', OL, 1); rr(-5, -18, 10, 6, 2); fs('#C8C8DC', OL, 1.2) } ctx.restore();
  }
  ctx.restore();
}
function drawCrusher(q) {   // khối đá gai mặt cau có
  const x = q.x, y = q.y, w = q.w, h = q.h, mad = q.st === 'fall' || q.st === 'land';
  for (let i = 0; i < 4; i++) { poly([[x + 6 + i * 13, y + h], [x + 12.5 + i * 13, y + h + 7], [x + 19 + i * 13, y + h]], '#C8C8DC', OL, 1.4); poly([[x + 6 + i * 13, y], [x + 12.5 + i * 13, y - 7], [x + 19 + i * 13, y]], '#C8C8DC', OL, 1.4) }
  for (let i = 0; i < 4; i++) { poly([[x, y + 6 + i * 13], [x - 7, y + 12.5 + i * 13], [x, y + 19 + i * 13]], '#C8C8DC', OL, 1.4); poly([[x + w, y + 6 + i * 13], [x + w + 7, y + 12.5 + i * 13], [x + w, y + 19 + i * 13]], '#C8C8DC', OL, 1.4) }
  rr(x, y, w, h, 7); fs(lg(x, y, x + w, y + h, ['#D8D8EC', '#9A9AB8', '#6A6A88']), OL, 2.4);
  const look = clamp((pl.x - q.x - 20) / 40, -1, 1) * 2.5;
  ell(x + 16, y + 24, 7, 6, '#FFFFFF', OL, 1.4); ell(x + w - 16, y + 24, 7, 6, '#FFFFFF', OL, 1.4); ell(x + 16 + look, y + 25, 3, 3.4, OL); ell(x + w - 16 + look, y + 25, 3, 3.4, OL);
  line([[x + 8, y + (mad ? 12 : 15)], [x + 22, y + 18]], OL, 3); line([[x + w - 8, y + (mad ? 12 : 15)], [x + w - 22, y + 18]], OL, 3);
  rr(x + 14, y + 40, w - 28, mad ? 12 : 7, 3); fs('#2A1A2A', OL, 1.4); ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < w - 32; i += 6) ctx.fillRect(x + 16 + i, y + 41, 3.4, mad ? 4 : 2.6);
}
/* ═ nhân vật: mũ lưỡi trai · áo màu em chọn · quần yếm xanh · giày nâu (lửa: áo trắng) ═ */
function hero(o) {
  const big = o.pw > 0, star = o.star > 0, k = (S.tick >> 2) % 5, cs = ['#FF4D4D', '#FFD23F', '#3FD29A', '#5AB0FF', '#C77DFF'];
  const cap = star ? cs[k] : o.pw === 2 ? '#FFFFFF' : o.c, over = star ? cs[(k + 2) % 5] : o.pw === 2 ? o.c : '#2B4BD8', skin = '#FFCC9A', shoe = '#6B3A1E', hair = '#5A3018';
  const jump = !o.on, ph = o.walk ? Math.sin(o.walk * 2.2) : 0, f = o.f < 0 ? -1 : 1, s = big ? 1.5 : 1;
  ctx.save(); ctx.globalAlpha = o.a || 1; ctx.translate(Math.round(o.x + 12), o.y + o.h); ctx.scale(f * s, s);
  const sl = jump ? -3 : ph * 4, sr = jump ? 4 : -ph * 4;
  ell(-3 + sl, -2.6, 5, 2.8, shoe, OL, 1.3); ell(4 + sr, -2.6, 5.2, 2.8, shoe, OL, 1.3);   // giày
  rr(-7, -12, 14, 9, 3); fs(over, OL, 1.4); ctx.fillStyle = mix(over, '#000000', .3); ctx.fillRect(-.5, -8, 1, 5);   // quần yếm
  rr(-8, -18.5, 16, 8, 4); fs(cap, OL, 1.4);   // áo
  ctx.fillStyle = over; ctx.fillRect(-5, -18, 2.4, 7); ctx.fillRect(2.6, -18, 2.4, 7); ell(-3.8, -14, 1.2, 1.2, '#FFE070'); ell(3.8, -14, 1.2, 1.2, '#FFE070');
  const ay = jump ? -24 : -14 + ph * 1.5; ell(-7 - ph * 1.5, -14 - ph, 3, 4.2, cap, OL, 1.2); ell(-7.4 - ph * 1.5, -11 - ph, 2.6, 2.4, '#FFFFFF', OL, 1);   // tay sau
  ell(7 + ph * 1.5, ay, 3, 4.2, cap, OL, 1.2, jump ? -.6 : 0); ell(7.6 + ph * 1.5 + (jump ? 1.6 : 0), ay + (jump ? -3.2 : 3), 2.6, 2.4, '#FFFFFF', OL, 1);   // tay trước (nhảy: giơ lên)
  ell(-5.6, -22.5, 3, 3.6, hair, OL, 1.2); ell(1, -23, 7, 6.6, skin, OL, 1.4);   // đầu
  ell(6.8, -22, 2.6, 2.2, mix(skin, '#E0805A', .3), OL, 1.1); ell(3.6, -19.6, 4, 1.6, hair); ell(2.6, -25, 1, 2, OL); ell(2.9, -25.6, .4, .6, '#FFFFFF');
  ctx.beginPath(); ctx.arc(.4, -27.2, 7.2, Math.PI, 0); ctx.closePath(); fs(cap, OL, 1.4); ell(6.2, -27.4, 5.4, 1.8, mix(cap, '#000000', .2), OL, 1.2); ell(-.6, -30.6, 2.6, 2.2, '#FFFFFF', OL, .8); ell(-3, -31, 1.6, 1, '#ffffff66');   // mũ
  ctx.restore();
  if (o.fz) { ctx.globalAlpha = .55; rr(o.x - 4, o.y - 4, 32, o.h + 8, 6); fs('#BFE8FF'); ctx.globalAlpha = 1 }
  if (o.sh) { ctx.globalAlpha = .4 + .2 * Math.sin(S.tick * .15); rr(o.x - 6, o.y - 6, 36, o.h + 12, 10); fs(null, '#7FD6FF', 3); ctx.globalAlpha = 1 }
}
function coin(x, y, k) { const w = Math.max(.12, Math.abs(Math.cos(S.tick * .08 + k))); ell(x + 10, y + 12, 7 * w, 10, lg(x, y, x + 20, y + 24, ['#FFF2A0', '#FFC83A', '#D98A1A']), '#8A5200', 1.4); if (w > .4) ell(x + 10, y + 12, 3 * w, 6, null, '#FFF6C0', 1.2) }
function mushroom(x, y, c, spots) { ell(x + 12, y + 17, 7, 6, '#FFF0D8', OL, 1.4); ell(x + 9.6, y + 17, 1, 2, OL); ell(x + 14.4, y + 17, 1, 2, OL); ctx.beginPath(); ctx.ellipse(x + 12, y + 13, 12, 11, 0, Math.PI, 0); ctx.closePath(); fs(lg(0, y + 2, 0, y + 13, [mix(c, '#FFFFFF', .35), c]), OL, 1.6); for (const [dx, dy, r] of [[0, 6, 3.6], [-7, 9, 2.4], [7, 9, 2.4]]) ell(x + 12 + dx, y + dy, r, r * .85, spots) }
function drawItem(it) {
  if (it.got) return; const x = it.x, y = it.y, t = S.tick;
  if (it.k === 'mush') mushroom(x, y, '#2DB84B', '#FFFFFF');
  else if (it.k === 'grow') mushroom(x, y, '#E8263A', '#FFFFFF');
  else if (it.k === 'flower') { ctx.fillStyle = '#2DB84B'; ctx.fillRect(x + 11, y + 12, 3, 12); ell(x + 6, y + 19, 5, 2.4, '#3CCB58', OL, 1, -.4); ell(x + 18, y + 19, 5, 2.4, '#3CCB58', OL, 1, .4); for (let i = 0; i < 6; i++) ell(x + 12 + Math.cos(i * 1.05 + t * .05) * 6.4, y + 8 + Math.sin(i * 1.05 + t * .05) * 6.4, 4, 4, (t >> 3) & 1 ? '#FF5A1A' : '#FFB627', OL, 1); ell(x + 12, y + 8, 4.4, 4.4, '#FFF2B0', OL, 1); ell(x + 10.6, y + 8, .8, 1.6, OL); ell(x + 13.4, y + 8, .8, 1.6, OL) }
  else { star5(x + 12, y + 11, 12, 5.4, (t >> 2) & 1 ? '#FFD23F' : '#FFF3A0', '#B87A00', 1.6); ell(x + 9.6, y + 10, 1, 2.2, OL); ell(x + 14.4, y + 10, 1, 2.2, OL) }
}
function princess(px, gy, hop) {   // công chúa váy hồng, vương miện
  ctx.save(); ctx.translate(px, gy - hop);
  ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-16, -6, -15, 0); ctx.lineTo(15, 0); ctx.quadraticCurveTo(16, -6, 6, -22); ctx.closePath(); fs(lg(0, -22, 0, 0, ['#FFC6E2', '#FF7EB6', '#E04A90']), OL, 1.6); line([[-12, -4], [12, -4]], '#FFFFFF', 1.6);
  rr(-6, -28, 12, 8, 3); fs('#FF9AC8', OL, 1.4); ell(-8, -24, 2.4, 3.4, '#FFE0C8', OL, 1); ell(8, -24, 2.4, 3.4, '#FFE0C8', OL, 1);
  ell(0, -36, 9, 10, '#FFD23F', OL, 1.4); ell(0, -34, 6.4, 6.8, '#FFE0C8', OL, 1.2); ell(-2.4, -35, .9, 1.6, OL); ell(2.4, -35, .9, 1.6, OL); ell(0, -31.4, 1.6, .8, '#E8508A'); ell(-4.2, -32.4, 1.4, .8, '#FFB0C8'); ell(4.2, -32.4, 1.4, .8, '#FFB0C8');
  poly([[-5, -43], [-5, -48], [-2.5, -45], [0, -49], [2.5, -45], [5, -48], [5, -43]], '#FFD23F', '#B87A00', 1.2); ell(0, -45, 1.2, 1.2, '#3AA0FF');
  ctx.restore();
}
function drawKing(B) {   // VUA RÙA: mai gai xanh, bụng vàng, sừng trắng, bờm đỏ (nhìn sang trái)
  const flash = B.hurtT && (B.hurtT >> 1) & 1, open = B.fireT < 22;
  ctx.save(); ctx.translate(B.x + B.w / 2, B.y + B.h); if (B.f > 0) ctx.scale(-1, 1); if (B.fall) { ctx.translate(0, -B.h / 2); ctx.scale(1, -1); ctx.translate(0, B.h / 2) }
  if (flash) ctx.globalAlpha = .45;
  ell(-12, -6, 10, 7, '#3FAE5A', OL, 2.4); ell(16, -6, 10, 7, '#3FAE5A', OL, 2.4); for (const dx of [-18, -12, 10, 16]) poly([[dx - 2, -1], [dx, 3], [dx + 2, -1]], '#FFFFFF', OL, 1);
  ell(14, -34, 25, 26, lg(0, -60, 0, -8, ['#5AD86A', '#2E9A3A', '#137A2B']), OL, 3); ctx.beginPath(); ctx.ellipse(14, -34, 25, 26, 0, 0, 7); fs(null, '#F4E8C0', 2.5);
  for (const [dx, dy] of [[0, -58], [18, -56], [33, -44], [36, -26], [32, -12]]) poly([[14 + dx * .55 - 4, dy * .9 + 2], [14 + dx * .7, dy - 8], [14 + dx * .55 + 4, dy * .9 + 4]], '#FFFFFF', OL, 1.6);
  ell(-4, -28, 17, 21, lg(0, -48, 0, -8, ['#FFF0A0', '#F2C84A']), OL, 2.4); for (let i = 0; i < 3; i++) line([[-16, -36 + i * 9], [8, -36 + i * 9]], '#C8902A', 1.4);
  ell(-20, -32, 7, 6, '#3FAE5A', OL, 2); for (let i = 0; i < 3; i++) poly([[-26 + i * 3, -30], [-27 + i * 3, -25], [-24 + i * 3, -28]], '#FFFFFF', OL, 1);
  poly([[-4, -60], [6, -72], [10, -64], [16, -70], [16, -58], [4, -54]], '#E83A2A', OL, 2);
  ell(-22, -52, 15, 13, '#3FAE5A', OL, 2.6); ell(-34, -47, 10, 8, '#F2C84A', OL, 2.2);
  poly([[-14, -62], [-6, -76], [-10, -60]], '#FFFFFF', OL, 1.6); poly([[-26, -63], [-24, -78], [-20, -62]], '#FFFFFF', OL, 1.6);
  ell(-26, -55, 4.4, 5, '#FFFFFF', OL, 1.4); ell(-27.6, -54.4, 2, 2.6, OL); line([[-32, -62], [-20, -59]], OL, 3);
  if (open) { ell(-38, -43, 8, 6, '#5A0A10', OL, 1.8); for (let i = 0; i < 3; i++) poly([[-44 + i * 4, -49], [-42 + i * 4, -45], [-40 + i * 4, -49]], '#FFFFFF') } else { line([[-44, -44], [-30, -42]], OL, 2); poly([[-40, -44], [-38, -40], [-36, -43.4]], '#FFFFFF') }
  ell(-36, -51, 1.4, 1, OL); ell(-40, -50, 1.4, 1, OL);
  ctx.restore();
}
function flame(x, y, f, s) { ctx.save(); ctx.translate(x, y); ctx.scale(f < 0 ? -1 : 1, 1); ell(0, 0, 16 * s, 7 * s, rg(-4 * s, 0, 18 * s, ['#FFF8C0', '#FFB627', '#FF5A1A00'])); ell(-6 * s, 0, 8 * s, 4 * s, '#FFF0A0'); ctx.restore() }
function drawGoal() {
  const TL = tiles(A.th), t = S.tick;
  if (A.flag) {
    const f = A.flag, gy = 13 * TS;
    rr(f.x - 2.5, f.top, 5, gy - f.top, 2.5); fs(lg(f.x - 3, 0, f.x + 3, 0, ['#137A2B', '#8CEB7A', '#137A2B']), OL, 1.2); ell(f.x, f.top - 5, 7, 7, rg(f.x - 2, f.top - 7, 9, ['#FFFFFF', '#3CCB58', '#137A2B']), OL, 1.6);
    poly([[f.x - 2, f.y], [f.x - 40, f.y + 14], [f.x - 2, f.y + 28]], '#FFFFFF', OL, 1.6); star5(f.x - 15, f.y + 14, 7, 3, '#E52521');
    ctx.drawImage(TL.H, f.x - 16, gy - TS, TS, TS);
    const c = A.castle.x, cw2 = 5 * TS, top = gy - 4 * TS;   // lâu đài nhỏ bằng đá
    rr(c, top, cw2, 4 * TS, 4); fs(lg(c, 0, c + cw2, 0, ['#A8A8C0', '#D8D8E8', '#9898B0']), OL, 2);
    for (let i = 0; i < 5; i++) { rr(c + i * TS + 3, top - 14, TS - 8, 16, 2); fs('#C8C8DC', OL, 1.6) }
    rr(c + TS, top - 2.2 * TS, 3 * TS, 2.2 * TS, 3); fs(lg(c, 0, c + cw2, 0, ['#B8B8D0', '#E4E4F0', '#A8A8C0']), OL, 2);
    for (let i = 0; i < 3; i++) { rr(c + TS + i * TS + 4, top - 2.2 * TS - 12, TS - 10, 14, 2); fs('#D4D4E4', OL, 1.6) }
    ctx.strokeStyle = '#8A8AA6'; ctx.lineWidth = 1; for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.moveTo(c + 4, top + r * TS); ctx.lineTo(c + cw2 - 4, top + r * TS); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(c + 2 * TS + 2, gy); ctx.lineTo(c + 2 * TS + 2, gy - 1.1 * TS); ctx.arc(c + 2.5 * TS, gy - 1.1 * TS, TS / 2 - 2, Math.PI, 0); ctx.lineTo(c + 3 * TS - 2, gy); ctx.closePath(); fs('#2A1A2A', OL, 1.6);
    for (const wx of [1.6, 3.4]) { rr(c + wx * TS - 5, top - 1.6 * TS, 10, 16, 5); fs('#2A1A2A') }
    line([[c + 2.5 * TS, top - 2.2 * TS - 12], [c + 2.5 * TS, top - 3.6 * TS]], '#5A3A1A', 2); poly([[c + 2.5 * TS, top - 3.6 * TS], [c + 2.5 * TS + 22 + Math.sin(t * .1) * 2, top - 3.3 * TS], [c + 2.5 * TS, top - 3 * TS]], '#E52521', OL, 1.2);
  }
  if (A.mid) { const x = A.mid.x, gy = 13 * TS, on = cp && cp.mid; rr(x - 1, gy - 72, 4, 72, 2); fs('#5A3A1A', OL, 1); poly([[x + 3, gy - 70], [x + 30 + Math.sin(t * .12) * 2, gy - 62], [x + 3, gy - 52]], on ? '#2DB84B' : '#E52521', OL, 1.4) }
  if (A.exitPipe) { const e = A.exitPipe; label('⬇ CHUI ỐNG QUA MÀN', (e.x + 1) * TS, e.top * TS - 34, 13, '#FFD23F', '#1A1A1A') }
  if (A.armory && !S.boss) { label('🔥 HỘP VŨ KHÍ', A.armory.x + 16, 9 * TS - 14, 13, '#FFD23F', '#1A1A1A') }
  if (A.axe && A.bridge && !A.bridge.on) { const a = A.axe, ay = a.y + Math.sin(t * .1) * 3; rr(a.x + 8, ay + 10, 5, 52, 2); fs('#8A4B1E', OL, 1.4); ctx.beginPath(); ctx.moveTo(a.x + 10, ay + 4); ctx.quadraticCurveTo(a.x - 12, ay + 14, a.x + 10, ay + 30); ctx.closePath(); fs(lg(a.x - 10, 0, a.x + 10, 0, ['#F0F0FF', '#A8A8C4']), OL, 1.8); ctx.beginPath(); ctx.moveTo(a.x + 11, ay + 4); ctx.quadraticCurveTo(a.x + 30, ay + 14, a.x + 11, ay + 30); ctx.closePath(); fs(lg(a.x + 10, 0, a.x + 28, 0, ['#A8A8C4', '#E0E0F4']), OL, 1.8) }
  const B = A.boss;
  if (B && !B.dead) { drawKing(B); for (const f of A.ef) flame(f.x + 10, f.y + 5, f.vx, 1) }
  if (A.princess) {
    const P = A.princess, gy = P.y, lift = Math.min(150, S.rescue * 2.2), hop = S.won ? Math.abs(Math.sin(t * .14)) * 14 : 0, bx = P.x - 3 * TS;
    rr(bx, gy - 6 * TS, 7 * TS, 6 * TS, 4); fs(lg(bx, 0, bx + 7 * TS, 0, ['#6A6A88', '#9A9AB8', '#5A5A78']), OL, 2);
    for (let i = 0; i < 7; i += 2) { rr(bx + i * TS + 2, gy - 6.6 * TS, TS - 4, .7 * TS, 2); fs('#8A8AA6', OL, 1.6) }
    ctx.beginPath(); ctx.moveTo(P.x - 30, gy); ctx.lineTo(P.x - 30, gy - 64); ctx.arc(P.x, gy - 64, 30, Math.PI, 0); ctx.lineTo(P.x + 30, gy); ctx.closePath(); fs('#1A1022', OL, 2);
    line([[bx + 3.5 * TS, gy - 6.6 * TS], [bx + 3.5 * TS, gy - 9.6 * TS]], '#5A3A1A', 3); poly([[bx + 3.5 * TS, gy - 9.6 * TS], [bx + 3.5 * TS + 34, gy - 9.2 * TS + Math.sin(t * .1) * 3], [bx + 3.5 * TS, gy - 8.6 * TS]], '#FF7EB6', OL, 1.4);
    ctx.fillStyle = rg(P.x, gy - 40, 80, [S.won ? '#FFD6ECCC' : '#FFF6C077', '#ffffff00']); ctx.fillRect(P.x - 80, gy - 120, 160, 120);
    princess(P.x, gy, hop);
    if (lift < 150) { ctx.globalAlpha = 1 - lift / 150; const cy = gy - lift; for (let k = 0; k <= 6; k++) { rr(P.x - 28 + k * 9, cy - 62, 3, 62, 1.5); fs('#C8C8E0', OL, .8) } rr(P.x - 32, cy - 66, 64, 6, 3); fs('#8A8AA6', OL, 1.2); ctx.globalAlpha = 1 }
    const msg = S.won ? 'Cảm ơn cậu! 💖' : B && !B.fall ? (Math.floor(t / 90) % 2 ? 'Cứu tớ với! 🆘' : 'Cẩn thận Vua Rùa! 🐢') : 'Cậu hạ được Vua Rùa rồi! 🎉';
    ctx.font = '800 15px Nunito,sans-serif'; const mw = ctx.measureText(msg).width + 24, my = gy - 128;
    rr(P.x - mw / 2, my, mw, 30, 10); fs('#FFFFFF', OL, 2); poly([[P.x - 6, my + 29], [P.x + 6, my + 29], [P.x, my + 37]], '#FFFFFF');
    ctx.fillStyle = '#E52521'; ctx.textAlign = 'center'; ctx.fillText(msg, P.x, my + 21);
    if (S.won && t % 12 === 0) parts.push({ x: P.x + (Math.random() - .5) * 60, y: gy - 60, vx: (Math.random() - .5) * 1.2, vy: -2 - Math.random() * 1.5, r: 4, l: 70, L: 70, c: GC.pick(['#E52521', '#FF7EB6', '#FFD23F']), heart: 1, g: -.01 });
  }
}
function drawDeco() {   // cây cỏ trang trí trên mặt đất theo từng màn
  if (!A.deco) return; const k = THEMES[A.th].bg, gy = 13 * TS, t = S.tick;
  if (A.water) { for (const d of A.deco) { const x = d.x * TS + 12; if (x < camX - 40 || x > camX + vw + 40) continue; const c = ['#2DB84B', '#2AA89A', '#E86AA8'][d.c || 0]; ctx.beginPath(); ctx.moveTo(x, gy); for (let j = 1; j <= d.k * 3; j++) ctx.lineTo(x + Math.sin(t * .04 + d.ph + j * .5) * j * .9, gy - j * 10); ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.stroke() } return }   // rong biển đung đưa
  for (const d of A.deco) {
    const x = d.x * TS + 16; if (x < camX - 80 || x > camX + vw + 80) continue;
    if (k === 'hills') { if (d.k === 0) { for (const [dx, dy, r] of [[-14, -8, 12], [0, -14, 15], [16, -8, 12]]) ell(x + dx, gy + dy, r, r, '#3CB848', OL, 2); for (const [dx, dy, r] of [[-14, -8, 12], [0, -14, 15], [16, -8, 12]]) ell(x + dx - 2, gy + dy - 3, r * .6, r * .5, '#6CDA6A') } else { line([[x, gy], [x, gy - 30 - d.k * 6]], '#2E8A2E', 3); ell(x - 6, gy - 14, 6, 2.4, '#3CB848', OL, 1, -.5); for (let i = 0; i < 10; i++) ell(x + Math.cos(i * .63 + t * .01) * 8, gy - 36 - d.k * 6 + Math.sin(i * .63 + t * .01) * 8, 3.6, 3.6, '#FFD23F', OL, 1); ell(x, gy - 36 - d.k * 6, 5, 5, '#8A4A1A', OL, 1.2) } }
    else if (k === 'desert') { if (d.k === 2) { ell(x, gy - 6, 12, 7, '#C8A070', OL, 1.6); ell(x - 3, gy - 9, 5, 2, '#E8C898') } else { rr(x - 6, gy - 36, 12, 36, 6); fs('#4AA84A', OL, 2); rr(x - 18, gy - 26, 8, 16, 4); fs('#4AA84A', OL, 1.6); rr(x - 18, gy - 14, 14, 6, 3); fs('#4AA84A'); rr(x + 10, gy - 30, 8, 14, 4); fs('#4AA84A', OL, 1.6); rr(x + 4, gy - 20, 14, 6, 3); fs('#4AA84A'); ell(x, gy - 38, 3, 3, '#FF6A9A') } }
    else if (k === 'shroom') { for (const [dx, h, c] of [[-10, 14, '#FF7A8A'], [6, 22, '#B07AF0'], [18, 10, '#FFB040']]) { ctx.fillStyle = '#F4E8D0'; ctx.fillRect(x + dx - 2.5, gy - h, 5, h); ctx.beginPath(); ctx.ellipse(x + dx, gy - h, 8, 6, 0, Math.PI, 0); ctx.closePath(); fs(c, OL, 1.4); ell(x + dx - 2, gy - h - 3, 1.6, 1.4, '#FFFFFF') } }
    else if (k === 'ice') { if (d.k === 0) { ell(x, gy - 9, 10, 10, '#FFFFFF', OL, 1.6); ell(x, gy - 24, 7.5, 7.5, '#FFFFFF', OL, 1.6); ell(x - 2.6, gy - 26, 1.1, 1.1, OL); ell(x + 2.6, gy - 26, 1.1, 1.1, OL); poly([[x, gy - 24], [x + 8, gy - 23], [x, gy - 22]], '#FF8A2A'); rr(x - 7, gy - 18.5, 14, 3, 1.5); fs('#E83A4A') } else { for (let q = 0; q < 3; q++) { const w = 16 - q * 4, y = gy - 4 - q * 12; poly([[x - w, y], [x, y - 18], [x + w, y]], '#2E7A6A', OL, 1.4); poly([[x - w * .5, y - 9], [x, y - 18], [x + w * .5, y - 9]], '#FFFFFF') } } }
    else if (k === 'airship') { if (d.k === 0) { rr(x - 12, gy - 22, 24, 22, 2); fs('#C88A4A', OL, 1.8); line([[x - 12, gy - 22], [x + 12, gy]], '#8A5420', 1.6); line([[x + 12, gy - 22], [x - 12, gy]], '#8A5420', 1.6) } else { rr(x - 9, gy - 26, 18, 26, 6); fs(lg(x - 9, 0, x + 9, 0, ['#8A5420', '#C88A4A', '#8A5420']), OL, 1.8); ctx.fillStyle = '#4A4A60'; ctx.fillRect(x - 9, gy - 20, 18, 2.4); ctx.fillRect(x - 9, gy - 8, 18, 2.4) } }
    else if (k === 'ghost') { rr(x - 3, gy - 18, 6, 18, 1.5); fs('#F4F0E0', OL, 1.2); ell(x, gy - 22 + Math.sin(t * .3 + d.ph) * .6, 3, 5 + Math.sin(t * .4 + d.ph), '#FFB627'); ctx.fillStyle = rg(x, gy - 22, 22, ['#FFD86A55', '#FFD86A00']); ctx.fillRect(x - 22, gy - 44, 44, 44) }
  }
}
function draw() {
  const wk = S.level + '-' + AI, TL = tiles(A.th), B = A.boss, t = S.tick;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; drawBg();
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -camX * sc * dpr, oy * dpr);
  const c0 = Math.floor(camX / TS) - 1, c1 = Math.ceil((camX + vw) / TS) + 1, below = Math.ceil((ch - oy) / sc / TS) - ROWS + 1;
  drawDeco();
  for (const it of A.items) if (it.rise > 0) drawItem(it);   // vật phẩm đang trồi lên nằm sau khối
  for (const p of A.pipes) if (p.x >= c0 - 2 && p.x <= c1) drawPlant(p);
  drawTiles(c0 - 4, c1, Math.max(0, below));
  for (const p of A.pipes) if (p.x >= c0 - 2 && p.x <= c1) drawPipe(p);
  drawGoal();
  for (const L of A.lifts) { ctx.drawImage(TL.lift, L.x, L.y, L.w, 16); if (THEMES[A.th].bg === 'airship') { const pw = Math.abs(Math.cos(t * .5)) * 20; ell(L.x + L.w / 2, L.y + 20, pw + 2, 2.4, '#C8C8DC', OL, 1); ctx.fillStyle = '#4A4A60'; ctx.fillRect(L.x + L.w / 2 - 1.5, L.y + 14, 3, 6) } }
  drawPlat();
  for (const q of A.ic) { if (q.st === 'gone') continue; const sx = q.st === 'shake' ? Math.sin(t * 1.4) * 1.6 : 0; poly([[q.x + sx, q.y], [q.x + q.w + sx, q.y], [q.x + q.w / 2 + sx, q.y + q.h]], lg(q.x, 0, q.x + q.w, 0, ['#E8F8FF', '#9ED4F8', '#5A9ADA']), '#2E5E9E', 1.4); line([[q.x + 4 + sx, q.y + 3], [q.x + q.w / 2 + sx, q.y + q.h - 6]], '#FFFFFFAA', 1.4) }
  for (const c of A.coins) if (!c.got && c.x > camX - 40 && c.x < camX + vw + 40) coin(c.x, c.y, c.x);
  for (const it of A.items) if (it.rise <= 0) drawItem(it);
  for (const b of A.bars) for (let i = 0; i <= b.n; i++) { const fx = b.cx + Math.cos(b.a) * i * 14, fy = b.cy + Math.sin(b.a) * i * 14, r = i ? 6 : 5; ell(fx, fy, r, r, rg(fx - 1, fy - 1, r + 1, ['#FFF8C0', '#FFB627', '#E8501A'])) }
  for (const f of FB) { ell(f.x + 4, f.y + 4, 6, 6, rg(f.x + 3, f.y + 3, 7, ['#FFFFFF', '#FFD23F', '#FF5A1A'])); ctx.save(); ctx.translate(f.x + 4, f.y + 4); ctx.rotate(t * .4); ctx.fillStyle = '#FFF2B0'; ctx.fillRect(-1, -6, 2, 12); ctx.fillRect(-6, -1, 12, 2); ctx.restore() }
  for (const e of A.en) if (e.act && e.x > camX - 140 && e.x < camX + vw + 140) drawEnemy(e);
  for (const q of A.cr) if (q.x > camX - 80 && q.x < camX + vw + 20) drawCrusher(q);
  for (const b of A.bul) { ctx.save(); ctx.globalAlpha = b.dead ? b.dead / 40 : 1; ctx.translate(b.x + 14, b.y + 8); if (b.vx > 0) ctx.scale(-1, 1); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-14, -8, -4, -8); ctx.lineTo(10, -8); ctx.lineTo(10, 8); ctx.lineTo(-4, 8); ctx.quadraticCurveTo(-14, 8, -14, 0); ctx.closePath(); fs(lg(0, -8, 0, 8, ['#5A5A70', '#1A1A24']), OL, 1.6); rr(10, -9, 5, 18, 2); fs('#2A2A3A', OL, 1.4); ell(-6, -2, 3, 3.4, '#FFFFFF'); ell(-7, -1.6, 1.4, 2, OL); line([[-9, -7], [-3, -5]], '#FFFFFF', 1.4); ctx.restore() }
  for (const p of A.proj) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); if (p.k === 'fishp') { ell(0, 0, 8, 4, '#7AB8F0', OL, 1.2); poly([[7, 0], [12, -5], [12, 5]], '#5A98D8', OL, 1); ell(-4, -1, .9, .9, OL); ell(-1, 1.4, 4, 1.2, '#E8F4FF') } else if (p.k === 'fire') { ell(0, 0, 7, 7, rg(-1, -1, 8, ['#FFFFFF', '#FFD23F', '#FF5A1A'])) } else if (p.k === 'snow') { ell(0, 0, 6, 6, '#FFFFFF', '#9CC8F0', 1.4); ell(-2, -2, 2, 1.4, '#E8F6FF') } else if (p.k === 'hammer') { rr(-1.6, -2, 3.2, 14, 1.6); fs('#8A5A2A', OL, 1.2); rr(-7, -8, 14, 7, 2); fs(lg(-7, 0, 7, 0, ['#5A5A70', '#C8C8DC', '#5A5A70']), OL, 1.4) } else { rr(-1.8, -7, 3.6, 14, 1.8); fs('#B8B8CC', OL, 1.2); ctx.beginPath(); ctx.arc(0, -8, 4, .8, Math.PI * 2.2); fs(null, '#B8B8CC', 2.6) } ctx.restore() }
  for (const b of A.booms) { const k = 1 - b.t / 26; ell(b.x, b.y, 18 + k * 44, 18 + k * 44, rg(b.x, b.y, 18 + k * 44, ['#FFFFFFEE', '#FFD23FCC', '#FF5A1A55', '#FF5A1A00'])) }
  const now = S.now();
  for (const id in S.ghosts) {
    const g = S.ghosts[id]; if (g.wk !== wk) { g.x = null; continue }
    if (g.x == null) { g.x = g.tx; g.y = g.ty } const dx = g.tx - g.x; g.x += dx * .2; g.y += (g.ty - g.y) * .2; if (Math.abs(dx) > .3) g.walk = (g.walk || 0) + .12;
    const gh = g.pw ? H_BIG : H_SMALL;
    hero({ x: g.x, y: g.y, h: gh, f: g.f, c: g.c, pw: g.pw || 0, on: Math.abs(g.ty - g.y) < 2, walk: Math.abs(dx) > .3 ? g.walk : 0, a: .55, fz: g.fz > now, sh: g.sh > now }); label(g.n, g.x + 12, g.y - 8, 12, '#fff', mix(g.c, '#1a1033', .5));
  }
  if (!(pl.inv && (t >> 2) & 1)) hero({ x: pl.x, y: pl.y, h: pl.h, f: pl.face, c: S.color, pw: pl.pw, star: pl.star, on: pl.on || (pl.auto && pl.auto.ph === 'walk'), walk: (pl.on || pl.auto) && Math.abs(pl.vx) > .4 ? pl.walk * .4 : 0, fz: now < S.fz, sh: now < S.sh });
  if (pl.pipe) drawPipe(pl.pipe.p);   // chui vào trong ống
  if (S.name) label(S.name, pl.x + 12, pl.y - 8, 13, '#fff', '#1a1033');
  if (S.energy <= 0 && S.running && !S.over) { const cx = pl.x + 12, y = pl.y - 38 + Math.sin(t * .1) * 3; rr(cx - 28, y - 24, 56, 28, 8); fs('#FFFFFF', OL, 2); ctx.font = '900 14px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#E52521'; ctx.fillText('⚡0!', cx, y - 5) }
  for (const q of parts) { ctx.globalAlpha = Math.max(0, q.l / q.L); if (q.heart) { ctx.save(); ctx.translate(q.x, q.y); ctx.fillStyle = q.c; ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-8, -2, -4, -9, 0, -4); ctx.bezierCurveTo(4, -9, 8, -2, 0, 4); ctx.fill(); ctx.restore() } else ell(q.x, q.y, q.r, q.r, q.c) } ctx.globalAlpha = 1;
  for (const p of pops) { ctx.globalAlpha = Math.min(1, p.t / 12); coin(p.x - 10, p.y - (30 - p.t) * 1.6, p.t); ctx.font = '900 11px Nunito,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; if (p.t < 20) label('+3⚡', p.x, p.y - 34 - (20 - p.t), 11, '#FFF6C0') } ctx.globalAlpha = 1;
  // bảng WORLD góc phải + thanh máu Vua Rùa
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const T = THEMES[A.th], w1 = AI ? 'BONUS' : 'WORLD 2-' + (S.level + 1), sub = AI ? (A.bonusName || '🪙 Hầm bí mật') : T.ic + ' ' + T.name;
  const sub2 = sub + (pl.pw === 2 ? '  · 🔥 F bắn' : pl.pw ? '  · 🍄 to' : '');
  ctx.font = '800 12px Nunito,sans-serif'; const sw = ctx.measureText(sub2).width + 64;
  ctx.font = '11px "Press Start 2P",monospace'; const tw = Math.max(ctx.measureText(w1 + '  ×00').width + 34, 180, sw), bx = cw - tw - 12;
  rr(bx - 3, 8, tw + 6, 50, 10); fs('#ffffffee', OL, 2.5);
  ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(w1, bx + 10, 28);
  ell(bx + tw - 57, 23, 5, 7, '#FFC83A', '#8A5200', 1.2); ctx.fillStyle = '#1A1A1A'; ctx.fillText('×' + String(S.coins).padStart(2, '0'), bx + tw - 48, 28);
  ctx.font = '800 12px Nunito,sans-serif'; ctx.fillStyle = '#5D6B85'; ctx.fillText(sub2, bx + 10, 47);
  ctx.textAlign = 'right'; ctx.fillStyle = S.lives <= 1 ? '#E52521' : '#1A1A1A'; ctx.fillText('❤️×' + S.lives, bx + tw - 8, 47); ctx.textAlign = 'left';
  const bw = tw, by = 62; rr(bx - 1, by - 1, bw + 2, 8, 4); fs('#ffffff99', OL, 1.4); rr(bx, by, Math.max(4, bw * prog()), 6, 3); fs(lg(bx, 0, bx + bw, 0, ['#FF7EB6', '#E52521']));
  for (let i = 1; i < NL; i++) { ctx.fillStyle = OL; ctx.fillRect(bx + bw * i / NL - 1, by - 2, 2, 10) }
  if (B && B.act && !B.fall) {
    const W2 = Math.min(360, cw * .6), x2 = (cw - W2) / 2; rr(x2 - 3, 10, W2 + 6, 38, 10); fs('#ffffffee', OL, 2.5);
    ctx.font = '800 14px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A1A'; ctx.fillText('🐢 Vua Rùa', x2 + 8, 34);
    const hx = x2 + 104, hw = W2 - 114; rr(hx - 2, 22, hw + 4, 14, 6); fs('#1A1A1A'); for (let i = 0; i < B.max; i++) { rr(hx + i * hw / B.max + 1, 24, hw / B.max - 2, 10, 3); fs(i < B.hp ? '#3CCB58' : '#5D6B85') }
  }
  if (banner && banner.t > 0) {
    banner.t--; ctx.globalAlpha = Math.min(1, banner.t / 30); ctx.textAlign = 'center';
    ctx.font = '26px "Press Start 2P",monospace'; ctx.fillStyle = '#1A1A1A'; ctx.fillText(banner.w, cw / 2 + 3, ch * .36 + 3); ctx.fillStyle = '#fff'; ctx.fillText(banner.w, cw / 2, ch * .36);
    label(banner.text, cw / 2, ch * .36 + 40, 22, '#FFD23F', '#1A1A1A'); ctx.globalAlpha = 1;
  }
}
function vine(x, y0, y1) {   // dây leo xanh có lá
  if (y1 <= y0 - 2) return; ctx.beginPath(); ctx.moveTo(x, y1); for (let y = y1; y >= y0; y -= 8) ctx.lineTo(x + Math.sin(y * .08) * 3, y); ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = '#3CCB58'; ctx.lineWidth = 3.6; ctx.stroke();
  for (let y = y1 - 14; y > y0 + 6; y -= 26) { const d = (Math.floor(y / 26) & 1) ? 1 : -1; ell(x + d * 8, y, 7, 3.6, '#5AD86A', OL, 1.2, d * -.5) }
  ctx.save(); ctx.translate(x, y0); ell(0, 0, 4, 4, '#8CEB7A', OL, 1.2); ctx.restore();
}
function drawPlat() {   // dây leo · bập bênh · cân ròng rọc · bánh rơi · vườn mây
  const t = S.tick;
  for (const v of A.vines) { vine(v.x, v.tip, v.base); if (v.sign) { label('🌱 BÁM DÂY LÊN MÂY', v.x, 11 * TS - 6, 13, '#FFFFFF', '#2E8A2E'); poly([[v.x - 7, 11 * TS + 2 + Math.sin(S.tick * .15) * 3], [v.x + 7, 11 * TS + 2 + Math.sin(S.tick * .15) * 3], [v.x, 11 * TS + 12 + Math.sin(S.tick * .15) * 3]], '#FFD23F', OL, 1.4) } }
  if (A.sky) { vine(A.drop.x + 12, 12 * TS + 6, ROWS * TS + 200); const fx = A.fall; label('⬇ NHẢY XUỐNG để về đường chính', fx, 10 * TS, 13, '#FFD23F', '#1A1A1A'); poly([[fx - 8, 11 * TS - 8 + Math.sin(t * .15) * 3], [fx + 8, 11 * TS - 8 + Math.sin(t * .15) * 3], [fx, 11 * TS + 4 + Math.sin(t * .15) * 3]], '#FFD23F', OL, 1.6) }
  for (const s of A.ss) {   // bập bênh: tấm ván gỗ trên trụ đỡ
    poly([[s.cx - 8, s.cy + 4], [s.cx + 8, s.cy + 4], [s.cx + 20, ROWS * TS + 200], [s.cx - 20, ROWS * TS + 200]], lg(s.cx - 20, 0, s.cx + 20, 0, ['#5A5A78', '#A8A8C4', '#5A5A78']), OL, 2);
    ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.ang); rr(-s.half, -2, s.half * 2, 12, 5); fs(lg(0, -2, 0, 10, ['#F0B070', '#C07A3A', '#7A4418']), OL, 2);
    for (let q = -s.half + 10; q < s.half - 6; q += 22) ell(q, 4, 1.6, 1.6, '#5A3418'); ctx.restore(); ell(s.cx, s.cy + 4, 6, 6, '#FFD23F', OL, 1.6);
  }
  for (const s of A.scl) {   // cân ròng rọc: 2 bệ treo dây qua bánh xe
    const a = s.x1 + s.w / 2, b = s.x2 + s.w / 2, ty = s.top; line([[a, ty - 6], [b, ty - 6]], '#5A5A78', 5);
    for (const [px, py] of [[a, s.y1], [b, s.y2]]) { line([[px - s.w / 2 + 6, py], [px, ty], [px + s.w / 2 - 6, py]], '#8A8AA6', 1.6); ell(px, ty - 6, 9, 9, lg(px - 9, 0, px + 9, 0, ['#5A5A78', '#D0D0E4', '#5A5A78']), OL, 1.8); ell(px, ty - 6, 2.4, 2.4, OL) }
    for (const [px, py] of [[s.x1, s.y1], [s.x2, s.y2]]) { rr(px, py, s.w, 12, 5); fs(lg(0, py, 0, py + 12, ['#E0E0F0', '#9A9AB8', '#5A5A78']), OL, 1.8); for (let q = 8; q < s.w; q += 16) ell(px + q, py + 6, 1.6, 1.6, '#3A3A50') }
  }
  for (const d of A.dn) {   // bánh rơi
    if (d.st === 'gone') continue; const sx = d.st === 'shake' ? Math.sin(t * 1.5) * 1.5 : 0;
    rr(d.x + 1 + sx, d.y, TS - 2, TS - 4, 9); fs(lg(0, d.y, 0, d.y + TS, ['#FFD898', '#E8A048', '#B86A20']), OL, 1.8); ell(d.x + TS / 2 + sx, d.y + 13, 6, 5, '#8A4A1A', OL, 1.4); ctx.fillStyle = '#FF7EB6'; rr(d.x + 3 + sx, d.y + 1, TS - 6, 6, 3); ctx.fill(); for (let q = 0; q < 4; q++) { ctx.fillStyle = ['#FFFFFF', '#5AB0FF', '#FFE070', '#7AE07A'][q]; ctx.fillRect(d.x + 6 + q * 6 + sx, d.y + 3, 2.4, 1.6) }
  }
}function camera(k) {
  const max = Math.max(0, A.w * TS - vw), tx = clamp(pl.x - vw * .38, 0, max);
  camX += (tx - camX) * k; if (A.w * TS < vw) camX = (A.w * TS - vw) / 2;
}
function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr; sc = Math.min(ch / (ROWS * TS), cw / (12 * TS)); vw = cw / sc; oy = Math.max(0, (ch - ROWS * TS * sc) * .55) }
let last = 0, acc = 0;
function loop() {
  const ts = performance.now(), dt = Math.min(100, ts - (last || ts)); last = ts;
  if (S.running && !S.over) { acc += dt; while (acc >= 16.67) { step(); acc -= 16.67 } }
  else { acc = 0; S.tick++; for (const L of A.lifts) { L.x = L.x0 + (L.x1 - L.x0) * (.5 + .5 * Math.sin(S.tick * L.sp + L.ph)) } for (const b of A.bars) b.a += b.sp }
  if (S.won) S.rescue++;
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += q.g ?? .12; if (--q.l <= 0) parts.splice(i, 1) }
  for (let i = pops.length - 1; i >= 0; i--)if (--pops[i].t <= 0) pops.splice(i, 1);
  camera(.14); draw();
  S.hooks.onFrame && S.hooks.onFrame(ts);
  requestAnimationFrame(loop);
}

/* ═════ điều khiển: ← → chạy · ↑ nhảy (giữ = cao) · ↓ chui ống · F bắn lửa ═════ */
const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'j', w: 'j', W: 'j', ' ': 'j', ArrowDown: 'd', s: 'd', S: 'd', f: 'f', F: 'f', x: 'f', X: 'f', Shift: 'f' };
function bindInput() {
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.ov.on')) return;
    const k = KM[e.key];
    if (k) { e.preventDefault(); if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1 }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') S.hooks.onAsk && S.hooks.onAsk();
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = 0 });
  addEventListener('blur', () => { keys.l = keys.r = keys.j = keys.d = keys.f = 0 });
  [['bL', 'l'], ['bR', 'r'], ['bJ', 'j'], ['bD', 'd'], ['bF', 'f']].forEach(([id, k]) => {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch (x) { } if (k === 'j' && !keys.j) keys.jp = 1; if (k === 'f' && !keys.f) keys.fp = 1; keys[k] = 1; b.classList.add('dn') });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('dn') }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function init(canvas, stageEl, seed, hooks, level) {
  cv = canvas; ctx = cv.getContext('2d'); stage = stageEl; S.hooks = hooks || {};
  seed0 = seed || 7; lvSel = level || 2; told = {}; LVC = LVS[lvSel] || LVS[2]; COST = LVC.cost;
  GC.music.files({ over: { src: 'snd/mario-overworld.mp3', a: 1, b: 177.6 }, under: { src: 'snd/mario-underground.mp3' }, star: { src: 'snd/mario-star.mp3' }, water: { src: 'snd/mario-water.mp3' } }, 'brick');   // Biển sâu: nhạc dưới nước
  GC.sfxFiles({ mjump: { src: 'snd/mario-jump.mp3', vol: .35 }, mpipe: { src: 'snd/mario-pipe.mp3', vol: .5 }, mdeath: { src: 'snd/mario-death.mp3', a: .7, d: 2.9, vol: .6 }, m1up: { src: 'snd/mario-1up.wav', vol: .5 }, mclear: { src: 'snd/mario-clear.wav', vol: .55 }, mcastle: { src: 'snd/mario-castle.mp3', vol: .55 }, mprincess: { src: 'snd/mario-princess.mp3', vol: .55 } });
  loadLevel(0);
  addEventListener('resize', resize); resize(); bindInput(); requestAnimationFrame(loop);
}
function release() { keys.l = keys.r = keys.j = keys.d = keys.f = 0 }
function place(x, y, old) {
  const lv = old && old.lvl != null ? old.lvl : 0; S.coins = old && old.cn || 0; S.lives = old && old.lf || LIVES; if (lv !== S.level) loadLevel(lv);
  if (old && old.pw) setPower(old.pw);
  pl.x = Math.max(TS, x); pl.y = Math.min(y, 11 * TS); pl.vx = pl.vy = 0; if (old && old.mid && A.mid) cp = { x: A.mid.x, y: 13 * TS - pl.h, mid: true }; camX = Math.max(0, pl.x - vw * .38);
}
function measure() { return 1000 }
const label2 = () => S.won ? '👸 Đã cứu công chúa' : 'Màn ' + (S.level + 1) + '/' + NL + ' · ' + (AI ? '🪙 hầm bí mật' : Math.round(clamp(pl.x / Math.max(1, LVL.areas[0].end || 1), 0, 1) * 100) + '%') + (S.boss ? ' · 🐢 hạ Vua Rùa' : '');
function extra() { return { lvl: S.level, wk: S.level + '-' + AI, cn: S.coins, lb: label2(), mid: cp && cp.mid ? 1 : 0, pw: pl.pw, lf: S.lives } }
function hud() { return (S.won ? '👸 Phá đảo' : '🏁 Màn ' + (S.level + 1) + '/' + NL) + ' · 🪙 ' + S.coins }
return { init, S, pl, keys, alt, topAlt, release, place, measure, extra, hud, label: label2, W: 12 * TS, kind: 'brick', part: 2, NL, _dbg: { step, draw, cam: camera, area: () => A, lvl: () => LVL, loadLevel, TS } };
})();
