/* climb2.js — "🧗 Leo núi P2: Đỉnh Trời 1200 m" (phần vẽ & luật riêng của phần 2 · chạy trên bộ máy climb.js qua Climb.setPart(2)).
   14 vùng MỚI, đỉnh 1200 m: 🌻 Đồi hướng dương (cối xay gió) · 🎋 Rừng trúc · 🪷 Đầm sen · 🎈 Hẻm núi đá đỏ (khinh khí cầu) · 🛕 Rừng rậm đền cổ · 🪸 Động san hô (dưới nước)
   · ⛈ Vách bão tố (sấm chớp, mưa) · 🐋 Sông băng cá voi · ⚙️ Thành phố bánh răng · 🌃 Phố đèn neon · 🪐 Trạm thiên hà · 🌈 Thiên đường cầu vồng · 🌑 Rừng bóng đêm · 🏰 Thành Quỷ Vương.
   Quái MỚI (không trùng phần 1): ốc sên · bọ sừng · ếch nhảy · bọ cạp · lợn rừng húc · bạch tuộc · mây giông · người tuyết Yeti húc · chuột dây cót (lao từng đợt) · rô-bốt (đi – dừng)
   · người ngoài hành tinh nảy · sao nhảy · bóng ma (lúc mờ thì đi xuyên qua được) · hiệp sĩ bóng đêm húc · nhím biển gai (không giẫm được)
   · bay: bướm · chuồn chuồn · chim ưng · vẹt · sứa (trôi lên xuống) · chim sấm · cú tuyết · chim dây cót · drone · đĩa bay (bổ nhào) · ma trơi · quỷ đá.
   BOSS: 👹 QUỶ VƯƠNG BÓNG ĐÊM 16 máu — bắn cầu bóng tối thấp/cao, gọi MƯA THIÊN THẠCH (có dấu báo trên mặt đất), dậm đất tạo SÓNG XUNG KÍCH (phải nhảy qua); còn nửa máu thì nổi giận: nhanh hơn, nhiều hơn.
   Nhân vật mới: nhà thám hiểm đội mũ trùm tai mèo, khăn quàng bay, kính phi công. Âm thanh / nhạc: y hệt phần 1. */
window.Climb2 = (function () {
let K, c;
const T = () => K.S.tick, PI = Math.PI;
const el = (x, y, rx, ry, col, rot) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill() };
const ol = (col, w) => K.ol(col, w);
const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill() };
const line = (pts, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke() };
const rr = (x, y, w, h, r, col) => { K.rr(x, y, w, h, r); if (col) { c.fillStyle = col; c.fill() } };
const glow = (x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, col.slice(0, 7) + '00'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() };
const D = '#2A2140';   // viền đậm
const wrap = o => { for (const k in o) { const f = o[k]; o[k] = (...a) => { c = K.ctx; return f(...a) } } return o };

const ZONES = [
  { id: 'sunflower', name: 'Đồi hướng dương', top: '#9BE05A', topD: '#5DB03A', dirt: '#C89458', dirtD: '#946234', dirtL: '#E2B47A', kind: 'grass', deco: 'sunflower', walker: 'snail', fly: 'butterfly', fx: 'pollen', fxN: 16, sky: ['#4DB8F5', '#9EDCFF', '#FFF6D0'], mt: '#86BCE8' },
  { id: 'bamboo', name: 'Rừng trúc', top: '#8AD86A', topD: '#3E9E4A', dirt: '#8E7A52', dirtD: '#5E4E30', dirtL: '#B09A6E', kind: 'grass', deco: 'bamboo', walker: 'beetle', fly: 'dragonfly', fx: 'leaf', fxN: 20, sky: ['#7ED0B8', '#C2EED8', '#F0FAE0'], mt: '#6EB09A' },
  { id: 'lotus', name: 'Đầm sen', top: '#6ED0A8', topD: '#2E9A7A', dirt: '#7A8A6A', dirtD: '#4E5E44', dirtL: '#9AAA88', kind: 'grass', deco: 'lotus', walker: 'frog', fly: 'dragonfly', fx: 'petal', fxN: 26, sky: ['#F2A0B8', '#FFD0D8', '#FFF0E0'], mt: '#B89AC8' },
  { id: 'canyon', name: 'Hẻm núi đá đỏ', top: '#F6C890', topD: '#D89858', dirt: '#D8784A', dirtD: '#A84E2A', dirtL: '#F0A070', kind: 'sand', deco: 'cactus', walker: 'scorp', fly: 'hawk', fx: 'dust', fxN: 18, sky: ['#3EA8F0', '#9AD4FF', '#FFE2B8'], mt: '#D8906A' },
  { id: 'jungle', name: 'Rừng rậm đền cổ', top: '#4EC86A', topD: '#1E8A46', dirt: '#6E5A44', dirtD: '#463624', dirtL: '#8E7A60', kind: 'grass', deco: 'fern2', walker: 'boar', fly: 'parrot', fx: 'leaf', fxN: 30, sky: ['#3EB0A0', '#8EDCC0', '#DCF6D0'], mt: '#3E8E7A' },
  { id: 'coral', name: 'Động san hô', top: '#FF9EB0', topD: '#E8607E', dirt: '#3E7AA8', dirtD: '#22507E', dirtL: '#5E9ACA', kind: 'crystal', deco: 'coral', walker: 'octo', fly: 'jelly', fx: 'bubble', fxN: 34, sky: ['#0A4A8A', '#1E7AB8', '#4EC0D8'], mt: '#1A5E96', nt: .2 },
  { id: 'storm', name: 'Vách bão tố', top: '#7A9AA8', topD: '#4A6A7A', dirt: '#5A5E72', dirtD: '#363A50', dirtL: '#7A7E94', kind: 'grass', deco: 'rod', walker: 'cloudy', fly: 'tbird', fx: 'rain', fxN: 90, sky: ['#2A3048', '#4A5670', '#7A8A9E'], mt: '#3A4460', nt: .52 },
  { id: 'glacier', name: 'Sông băng cá voi', top: '#FFFFFF', topD: '#BEE0F4', dirt: '#7EB8DE', dirtD: '#4E88B8', dirtL: '#AEDAF2', kind: 'snow', deco: 'igloo', walker: 'yeti', fly: 'owl', fx: 'snow', fxN: 55, sky: ['#5AA8E8', '#A8DCFA', '#E8F8FF'], mt: '#8EC4EC' },
  { id: 'gear', name: 'Thành phố bánh răng', top: '#E8B04A', topD: '#B87A22', dirt: '#8A6A4A', dirtD: '#5A4028', dirtL: '#B08A62', kind: 'metal', tex: 'metal', deco: 'cog', walker: 'windup', fly: 'copter', fx: 'steam', fxN: 16, sky: ['#E89A4A', '#F8C888', '#FFEAC8'], mt: '#B8804E' },
  { id: 'neon', name: 'Phố đèn neon', top: '#3EE0E0', topD: '#1AA0B8', dirt: '#2E2A5A', dirtD: '#18143A', dirtL: '#4A4680', kind: 'metal', tex: 'neon', deco: 'lamp', walker: 'robot', fly: 'drone', fx: 'spark', fxN: 26, sky: ['#120A3A', '#3A1A6A', '#8A2A8A'], mt: '#1E1650', nt: .85 },
  { id: 'space', name: 'Trạm thiên hà', top: '#C8CCE0', topD: '#8A90B0', dirt: '#6A6E90', dirtD: '#40446A', dirtL: '#9094B4', kind: 'metal', tex: 'moon', deco: 'dish', walker: 'alien', fly: 'ufo', fx: 'spark', fxN: 34, sky: ['#04041A', '#0E0A36', '#2A1A5A'], mt: '#1A1444', nt: 1 },
  { id: 'rainbow', name: 'Thiên đường cầu vồng', top: '#FFF4FA', topD: '#F8C0E0', dirt: '#C8E4FF', dirtD: '#9AB8F0', dirtL: '#E6F4FF', kind: 'cloud', deco: 'rbow', walker: 'starry', fly: 'butterfly', fx: 'starfall', fxN: 30, sky: ['#8AC8FF', '#D8C8FF', '#FFE0F0'], mt: '#B8B0F0' },
  { id: 'shadow', name: 'Rừng bóng đêm', top: '#6A5AA8', topD: '#3E3078', dirt: '#3A3058', dirtD: '#1E1838', dirtL: '#5A4E80', kind: 'grass', deco: 'gloom', walker: 'shade', fly: 'wisp', fx: 'soul', fxN: 26, sky: ['#0A0620', '#1E1244', '#3E2A6A'], mt: '#181038', nt: 1 },
  { id: 'castle', name: 'Thành Quỷ Vương', top: '#5A4A5E', topD: '#3A2A40', dirt: '#48303E', dirtD: '#26141E', dirtL: '#6A4E5E', kind: 'lava', deco: 'torch', walker: 'knight', fly: 'garg', fx: 'ember', fxN: 36, sky: ['#1A0624', '#5A1438', '#B83A3A'], mt: '#3A1230', nt: .85 }];
const SZ = { snail: [36, 26], beetle: [36, 26], frog: [34, 28], scorp: [40, 26], boar: [42, 32], octo: [36, 30], cloudy: [40, 28], yeti: [38, 38], windup: [36, 24], robot: [34, 38], alien: [34, 30], starry: [32, 30], shade: [34, 36], knight: [36, 40], urchin: [34, 28] };
const SPD = { snail: .55, octo: .8, cloudy: .9, scorp: 1.15, robot: .9 };

/* ═════ cách di chuyển riêng của quái đi bộ: trả về hệ số tốc độ · e.oy = nhấc khỏi mặt đất · e.gh = đang mờ (không va chạm) ═════ */
const charge = k => (e, pl) => { const near = pl.on === e.p && Math.abs(pl.x - e.x) < 230; e.ch = near; e.vx = Math.sign(near ? (pl.x - e.x) || 1 : e.vx || 1) * (near ? e.v0 * k : e.v0); return 1 };
const ai = {
  frog: (e, pl, t) => { const u = ((t + Math.floor(e.ph * 20)) % 100 - 55) / 45; if (u < 0) { e.oy = 0; return 0 } e.oy = -Math.sin(u * PI) * 44; return 2.4 },
  boar: charge(2.2), yeti: charge(2.5), knight: charge(2.9),
  octo: (e, pl, t) => { e.oy = -Math.abs(Math.sin(t * .06 + e.ph)) * 8; return 1 },
  cloudy: (e, pl, t) => { e.oy = -14 + Math.sin(t * .08 + e.ph) * 5; return 1 },
  windup: (e, pl, t) => Math.sin(t * .05 + e.ph) > .3 ? 2.6 : 0,
  robot: (e, pl, t) => { e.zap = (t + Math.floor(e.ph * 30)) % 160 >= 110; return e.zap ? 0 : 1 },
  alien: (e, pl, t) => { e.oy = -Math.abs(Math.sin(t * .09 + e.ph)) * 26; return 1 },
  starry: (e, pl, t) => { e.oy = -Math.abs(Math.sin(t * .12 + e.ph)) * 38; return 1.2 },
  shade: (e, pl, t) => { e.gh = (t + Math.floor(e.ph * 40)) % 240 > 150; return e.gh ? .4 : 1 }
};
const fly = {
  jelly: (e, a) => { e.x = e.bx + Math.sin(a * .6) * e.amp * .35; e.y = e.by - 10 + Math.sin(a * 2.2) * 42 },
  ufo: (e, a) => { const s = Math.sin(a * 2); e.x = e.bx + Math.sin(a) * e.amp; e.y = e.by + (s > .5 ? (s - .5) * 90 : 0) },
  wisp: (e, a) => { e.x = e.bx + Math.sin(a) * e.amp; e.y = e.by + Math.sin(a * 2) * 26 }
};

/* ═════ nhân vật: nhà thám hiểm mũ trùm tai mèo (màu áo = màu của em), khăn quàng bay, kính phi công ═════ */
function hero(o, cx, by) {
  const s = o.sq || 0, f = o.f || 1, col = o.c, dk = K.mix(col, '#14102A', .55), lt = K.mix(col, '#ffffff', .45), t = T(), st = o.walk ? Math.sin(o.walk) * 4.5 : 0;
  c.save(); c.globalAlpha = o.a || 1; c.translate(cx, by); c.scale(1 + s * .25, 1 - s * .25);
  el(0, 0, 17, 4, '#00000026');
  // khăn quàng bay phía sau
  const wv = Math.sin(t * .22) * 3, wv2 = Math.cos(t * .18) * 3;
  c.fillStyle = '#FFD84A'; c.beginPath(); c.moveTo(-f * 6, -22); c.quadraticCurveTo(-f * 20, -26 + wv, -f * 32, -19 + wv2); c.lineTo(-f * 30, -12 + wv2); c.quadraticCurveTo(-f * 19, -17 + wv, -f * 7, -15); c.closePath(); c.fill(); ol(D, 2);
  // ba lô nhỏ + chăn cuộn
  rr(-f * 15 - 6.5, -26, 13, 16, 4, '#B8703A'); ol(D, 2.2); rr(-f * 15 - 7.5, -30, 15, 6, 3, '#7AD0E8'); ol(D, 2);
  // giày
  for (const [dx, k] of [[-7, st], [7, -st]]) { el(dx + f * 1.5, -3 + Math.min(0, k), 7, 4.6, '#6A4028'); ol(D, 2); el(dx + f * 3.5, -4.4 + Math.min(0, k), 3, 1.6, '#9A6A48') }
  // thân áo choàng
  c.fillStyle = col; c.beginPath(); c.moveTo(-12, -24); c.quadraticCurveTo(-15, -8, -11, -5); c.lineTo(11, -5); c.quadraticCurveTo(15, -8, 12, -24); c.closePath(); c.fill(); ol(dk, 2.6);
  rr(-11, -11.5, 22, 4, 2, '#5A3420'); el(0, -9.5, 2.8, 2.8, '#FFD84A'); ol(D, 1.4);
  // tay
  el(f * 12.5, -15 + st * .35, 4.6, 5.6, K.mix(col, '#14102A', .12)); ol(dk, 2); el(f * 13, -11.5 + st * .35, 3.2, 3, '#FFE0C4'); ol(D, 1.4);
  // mũ trùm tai mèo
  for (const d of [-1, 1]) { poly([d * 5, -44, d * 13.5, -55, d * 15, -39], col); ol(dk, 2.4); poly([d * 8.5, -44.5, d * 12.5, -50.5, d * 13, -42.5], '#FFB8D0') }
  el(0, -34, 16, 14.5, col); ol(dk, 2.8);
  // khuôn mặt
  el(f * 2, -32, 11.5, 10.5, '#FFE6CE'); ol(D, 1.8);
  c.fillStyle = '#6A3E24'; c.beginPath(); c.moveTo(f * 2 - 11, -35); c.quadraticCurveTo(f * 2 - 4, -45, f * 2 + 4, -40); c.quadraticCurveTo(f * 2 + 9, -44, f * 2 + 11, -35); c.quadraticCurveTo(f * 2 + 5, -39, f * 2, -36.5); c.quadraticCurveTo(f * 2 - 5, -39, f * 2 - 11, -35); c.fill();   // tóc mái
  const ex = f * 4, eh = o.tired ? 1.6 : 5;
  for (const dx of [-4.2, 5.2]) { el(dx + ex, -31, 3.3, eh, '#2A1E3A'); if (!o.tired) { el(dx + ex + f * .9 - .6, -32.8, 1.3, 1.6, '#fff'); el(dx + ex + .9, -29.2, .7, .8, '#ffffffaa') } }
  el(-7.5 + ex, -26.5, 2.6, 1.5, '#FF9AB0aa'); el(8.5 + ex, -26.5, 2.6, 1.5, '#FF9AB0aa');
  c.strokeStyle = '#8A3A3A'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); if (o.tired) { c.moveTo(ex - 2, -25); c.lineTo(ex + 3, -25) } else c.arc(ex + .5, -27, 2.6, .25, PI - .25); c.stroke();
  // kính phi công trên mũ
  rr(-11, -46.5, 22, 7, 3.5, '#5A3420'); ol(D, 1.8); for (const d of [-1, 1]) { el(d * 5.2, -43, 4.4, 3.4, '#8AE0FF'); ol(D, 1.6); el(d * 5.2 - 1.2, -44, 1.5, 1, '#ffffffcc') }
  el(-f * 6, -39, 3.2, 1.8, lt + 'aa', -.4 * f);
  c.restore();
}

/* ═════ quái (e, f = hướng, cx = giữa, by = chân, bob, legs) ═════ */
const birdy = (e, f, p) => {   // chim dùng chung: p = [thân, bụng, cánh, mỏ, mào]
  const cx = e.x + 19, cy = e.y + 13, fl = Math.sin(T() * .45 + e.ph) * 9;
  poly([cx - f * 12, cy, cx - f * 26, cy - 5, cx - f * 24, cy + 5], p[2]); ol(D, 2);
  el(cx, cy, 14, 10.5, p[0]); ol(D, 2.5); el(cx + f * 2, cy + 4, 8, 5, p[1]);
  c.fillStyle = p[2]; c.beginPath(); c.moveTo(cx - f * 6, cy - 2); c.quadraticCurveTo(cx - f * 4, cy - 16 - fl, cx + f * 8, cy - 8 - fl * .6); c.quadraticCurveTo(cx + f * 4, cy, cx - f * 6, cy - 2); c.fill(); ol(D, 2);
  poly([cx + f * 12, cy - 2, cx + f * 22, cy + 1, cx + f * 12, cy + 4], p[3]); ol(D, 1.8);
  if (p[4]) { poly([cx + f * 2, cy - 9, cx - f * 2, cy - 19, cx + f * 6, cy - 12, cx + f * 6, cy - 20, cx + f * 10, cy - 9], p[4]); ol(D, 1.6) }
  el(cx + f * 8, cy - 3, 3.4, 3.8, '#fff'); el(cx + f * 9, cy - 3, 1.7, 2, '#1A1030');
};
const enemy = {
  snail: (e, f, cx, by, bob) => {
    const st = Math.sin(T() * .12 + e.ph) * 1.5;
    c.fillStyle = '#FFE08A'; c.beginPath(); c.moveTo(cx - f * 16, by); c.quadraticCurveTo(cx - f * 18, by - 9, cx - f * 6, by - 9); c.lineTo(cx + f * 10, by - 10); c.quadraticCurveTo(cx + f * 19 + st, by - 22, cx + f * 17 + st, by - 6); c.quadraticCurveTo(cx + f * 16, by, cx + f * 8, by); c.closePath(); c.fill(); ol(D, 2.4);
    el(cx - f * 3, by - 15, 13, 12.5, '#B88AF0'); ol(D, 2.5); c.strokeStyle = '#7A4AC8'; c.lineWidth = 2.4; c.beginPath(); c.arc(cx - f * 3, by - 15, 8, 0, 4.6); c.stroke(); c.beginPath(); c.arc(cx - f * 3, by - 15, 3.6, 1, 6); c.stroke(); el(cx - f * 7, by - 21, 3, 2, '#ffffff88');
    for (const d of [0, 6]) { line([cx + f * (12 + d * .6), by - 16, cx + f * (13 + d), by - 26 + st], D, 2); el(cx + f * (13 + d), by - 27 + st, 2.8, 2.8, '#fff'); ol(D, 1.4); el(cx + f * (13.6 + d), by - 27 + st, 1.3, 1.3, '#1A1030') }
  },
  beetle: (e, f, cx, by, bob, legs) => {
    for (let k = -1; k <= 1; k++) line([cx + k * 9, by - 7, cx + k * 11 + legs * 2 * (k ? k : 1), by], D, 2.6);
    el(cx - f * 2, by - 13, 16, 12, '#2E6AD8'); ol(D, 2.6); line([cx - f * 2, by - 25, cx - f * 2, by - 2], '#1A3E9A', 2); el(cx - f * 8, by - 18, 5, 3, '#8AB8FFaa', -.5);
    el(cx + f * 13, by - 10, 7, 7, '#1E3A8A'); ol(D, 2.4);
    c.strokeStyle = D; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + f * 16, by - 14); c.quadraticCurveTo(cx + f * 26, by - 18, cx + f * 22, by - 28); c.stroke(); c.strokeStyle = '#3A5AC8'; c.lineWidth = 3; c.stroke();
    el(cx + f * 15, by - 11, 2.4, 2.8, '#fff'); el(cx + f * 15.6, by - 11, 1.2, 1.4, '#1A1030');
  },
  frog: (e, f, cx, by) => {
    const up = e.oy < -2, sq = up ? 0 : Math.sin(T() * .15 + e.ph) * 1.2;
    for (const d of [-1, 1]) { el(cx + d * 12, by - (up ? 6 : 3), up ? 4 : 8, up ? 9 : 4.4, '#3EA84A', up ? d * .5 : 0); ol(D, 2) }
    el(cx, by - 12 + sq, 15, 11.5 - sq, '#5ED86A'); ol(D, 2.6); el(cx, by - 8, 10, 6, '#D8F8B0');
    for (const d of [-1, 1]) { el(cx + d * 8, by - 23 + sq, 6, 6, '#5ED86A'); ol(D, 2.2); el(cx + d * 8, by - 23 + sq, 4, 4.2, '#fff'); el(cx + d * 8 + f * 1.4, by - 23 + sq, 2, 2.4, '#1A1030') }
    c.strokeStyle = D; c.lineWidth = 1.8; c.beginPath(); c.arc(cx, by - 14, 7, .3, PI - .3); c.stroke(); el(cx - 9, by - 13, 2.4, 1.5, '#FF9AB0aa'); el(cx + 9, by - 13, 2.4, 1.5, '#FF9AB0aa');
  },
  scorp: (e, f, cx, by, bob, legs) => {
    for (let k = -1; k <= 1; k++) for (const d of [-1, 1]) line([cx + k * 8, by - 8, cx + k * 8 + d * 8, by - 3 + legs * (k + d)], D, 2.2);
    c.strokeStyle = D; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - f * 12, by - 10); c.quadraticCurveTo(cx - f * 28, by - 14, cx - f * 22, by - 30 + bob); c.stroke(); c.strokeStyle = '#F08A3A'; c.lineWidth = 6; c.stroke();
    poly([cx - f * 22, by - 36 + bob, cx - f * 12, by - 31 + bob, cx - f * 23, by - 27 + bob], '#D83A2A'); ol(D, 1.8);
    el(cx, by - 10, 15, 9, '#F8A04A'); ol(D, 2.5); el(cx - f * 3, by - 13, 6, 3, '#FFD08Aaa');
    for (const d of [-6, 5]) { line([cx + f * 12, by - 10 + d * .4, cx + f * 20, by - 12 + d], D, 5); line([cx + f * 12, by - 10 + d * .4, cx + f * 20, by - 12 + d], '#F08A3A', 2.4); el(cx + f * 22, by - 12 + d, 4.6, 3.6, '#F8A04A'); ol(D, 1.8) }
    K.eyes(cx + f * 8, by - 14, f, true, .62);
  },
  boar: (e, f, cx, by, bob, legs) => {
    for (const d of [-11, -3, 5, 12]) { rr(cx + d - 2.5, by - 9 + (d % 2 ? legs : -legs) * 1.2, 5.5, 9, 2, '#5A3A2A'); ol(D, 1.8) }
    el(cx, by - 17, 19, 13, e.ch ? '#B86A4A' : '#9A6A4A'); ol(D, 2.6);
    poly([cx - f * 8, by - 29, cx - f * 2, by - 37, cx + f * 3, by - 30, cx + f * 8, by - 36, cx + f * 11, by - 28], '#4A2E20'); ol(D, 1.6);
    el(cx + f * 16, by - 13, 8.5, 7.5, '#C89070'); ol(D, 2.2); el(cx + f * 21, by - 12, 3.6, 4.4, '#F0B8A0'); ol(D, 1.6); el(cx + f * 20.4, by - 13, .9, 1.2, D); el(cx + f * 22.2, by - 13, .9, 1.2, D);
    poly([cx + f * 14, by - 8, cx + f * 19, by - 17, cx + f * 18, by - 7], '#FFF6E0'); ol(D, 1.4);
    K.eyes(cx + f * 10, by - 20, f, true, .6); line([cx - f * 18, by - 20, cx - f * 23, by - 26, cx - f * 21, by - 22], D, 2);
  },
  octo: (e, f, cx, by) => {
    const t = T();
    for (let k = 0; k < 5; k++) { const x0 = cx - 14 + k * 7, w = Math.sin(t * .14 + k * 1.3 + e.ph) * 4; c.strokeStyle = D; c.lineWidth = 7.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, by - 11); c.quadraticCurveTo(x0 + w, by - 5, x0 + (k - 2) * 2.4, by - 1 - e.oy * .6); c.stroke(); c.strokeStyle = '#F06A9A'; c.lineWidth = 4.5; c.stroke() }
    el(cx, by - 17, 16, 14, '#FF8AB4'); ol(D, 2.6); el(cx - 6, by - 24, 5, 3, '#FFD0E0aa', -.5);
    for (const d of [-9, 9]) el(cx + d, by - 12, 2.6, 1.6, '#FFB0D0');
    K.eyes(cx + f * 2, by - 17, f, false, .8); el(cx + f * 2, by - 9, 2.6, 2, '#C83A6A');
  },
  cloudy: (e, f, cx, by) => {
    const t = T(), zap = (t + Math.floor(e.ph * 40)) % 70 < 10;
    for (const d of [-7, 7]) line([cx + d, by - 8, cx + d + Math.sin(t * .3 + d) * 2, by - 1], D, 3);
    c.fillStyle = '#5A6488'; c.beginPath(); for (const [dx, dy, r] of [[-11, -12, 9], [0, -18, 12], [11, -13, 9], [0, -10, 12]]) c.arc(cx + dx, by + dy, r, 0, 7); c.fill();
    c.strokeStyle = D; c.lineWidth = 2.5; for (const [dx, dy, r, a0, a1] of [[-11, -12, 9, 2.2, 4.9], [0, -18, 12, 3.5, 5.9], [11, -13, 9, 4.5, 7.2], [0, -10, 12, .5, 2.6]]) { c.beginPath(); c.arc(cx + dx, by + dy, r, a0, a1); c.stroke() }
    el(cx - 5, by - 23, 5, 2.4, '#8A94B8aa');
    K.eyes(cx + f * 2, by - 14, f, true, .75);
    if (zap) { poly([cx - 2, by - 4, cx + 5, by - 4, cx + 1, by + 3, cx + 6, by + 3, cx - 4, by + 13, cx - 1, by + 5, cx - 5, by + 5], '#FFE84A'); ol('#C88A00', 1.2); glow(cx, by + 4, 16, '#FFF6A066') }
  },
  yeti: (e, f, cx, by, bob, legs) => {
    for (const d of [-8, 8]) { rr(cx + d - 5, by - 9 + (d > 0 ? legs : -legs), 10, 9, 4, '#E8F0FA'); ol('#3E4A78', 2) }
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(cx - 15, by - 8); for (let k = 0; k <= 8; k++) { const a = PI + k * PI / 8; c.lineTo(cx + Math.cos(a) * (16 + (k % 2) * 3), by - 16 + Math.sin(a) * (19 + (k % 2) * 3)) } c.lineTo(cx + 15, by - 8); c.closePath(); c.fill(); ol('#3E4A78', 2.6);
    el(cx + f * 3, by - 20, 10, 8.5, '#A8D8F8'); ol('#3E4A78', 1.8);
    for (const d of [-1, 1]) poly([cx + d * 9, by - 33, cx + d * 14, by - 43, cx + d * 14, by - 30], '#8AC0F0');
    K.eyes(cx + f * 3, by - 22, f, e.ch, .7); poly([cx + f * 3 - 5, by - 16, cx + f * 3 + 5, by - 16, cx + f * 3 + 3, by - 12, cx + f * 3 - 3, by - 12], '#fff'); ol('#3E4A78', 1.2);
    for (const d of [-1, 1]) { el(cx + d * 17, by - 15 + (e.ch ? -6 : 0), 5, 6.5, '#FFFFFF'); ol('#3E4A78', 2) }
  },
  windup: (e, f, cx, by) => {
    const run = Math.sin(T() * .05 + e.ph) > .3, a = T() * (run ? .5 : .06);
    for (const d of [-9, 9]) { el(cx + d, by - 4, 5, 5, '#5A4028'); ol(D, 1.8); line([cx + d, by - 4, cx + d + Math.cos(a * 2) * 4, by - 4 + Math.sin(a * 2) * 4], '#FFD880', 1.6) }
    c.save(); c.translate(cx - f * 12, by - 22); c.rotate(a); rr(-2, -9, 4, 12, 2, '#C8CCD8'); ol(D, 1.4); el(-4, -9, 4.4, 3.4, '#E8B04A'); ol(D, 1.4); el(4, -9, 4.4, 3.4, '#E8B04A'); ol(D, 1.4); c.restore();
    c.fillStyle = '#C8CCD8'; c.beginPath(); c.moveTo(cx - f * 16, by - 6); c.quadraticCurveTo(cx - f * 16, by - 22, cx, by - 21); c.quadraticCurveTo(cx + f * 14, by - 20, cx + f * 20, by - 9); c.lineTo(cx + f * 16, by - 6); c.closePath(); c.fill(); ol(D, 2.5);
    line([cx - f * 6, by - 20, cx - f * 6, by - 7], '#8A90A4', 1.6); el(cx - f * 16, by - 9, 1.6, 1.6, '#E8B04A');
    el(cx + f * 4, by - 23, 5.5, 5.5, '#E8B04A'); ol(D, 2); el(cx + f * 4, by - 23, 2.6, 2.6, '#FFB8C8');
    el(cx + f * 20, by - 9, 2.6, 2.6, '#FF7A9A'); ol(D, 1.2); el(cx + f * 11, by - 14, 2.6, 3, run ? '#FF4A4A' : '#fff'); el(cx + f * 11.6, by - 14, 1.2, 1.4, '#1A1030');
    c.strokeStyle = D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - f * 16, by - 10); c.quadraticCurveTo(cx - f * 26, by - 8, cx - f * 24, by - 16); c.stroke();
  },
  robot: (e, f, cx, by, bob, legs) => {
    const t = T();
    for (const d of [-7, 7]) { rr(cx + d - 4, by - 10, 8, 10, 2.5, '#4A4680'); ol(D, 1.8); rr(cx + d - 5.5, by - 4 + (e.zap ? 0 : (d > 0 ? legs : -legs)), 11, 4.5, 2, '#8AE0FF'); ol(D, 1.6) }
    rr(cx - 13, by - 27, 26, 19, 5, '#6A66B0'); ol(D, 2.5); rr(cx - 6, by - 22, 12, 7, 2, '#1A1838'); for (let k = 0; k < 3; k++) el(cx - 3.5 + k * 3.5, by - 18.5, 1.2, 1.2, ['#FF5A8A', '#FFE24A', '#5AE08A'][(k + (t >> 4)) % 3]);
    for (const d of [-1, 1]) { rr(cx + d * 15 - 3, by - 25, 6, 12, 3, '#4A4680'); ol(D, 1.8) }
    rr(cx - 12, by - 40, 24, 15, 5, '#8A86D0'); ol(D, 2.5); rr(cx - 9 + f * 1.5, by - 37, 18, 9, 3, '#12102A');
    const ec = e.zap ? '#FF4A6A' : '#5AF0FF'; c.shadowColor = ec; c.shadowBlur = 8; for (const d of [-4, 4]) rr(cx + d - 2 + f * 1.5, by - 35 + (e.zap ? 1.5 : 0), 4, e.zap ? 2.5 : 5, 1.2, ec); c.shadowBlur = 0;
    line([cx, by - 40, cx, by - 46], D, 2); el(cx, by - 47, 2.8, 2.8, e.zap && (t >> 2) & 1 ? '#FFF' : '#FF5A8A'); ol(D, 1.2);
    if (e.zap) for (const d of [-1, 1]) line([cx + d * 17, by - 30, cx + d * 22, by - 34, cx + d * 20, by - 28, cx + d * 26, by - 31], '#FFE84A', 1.8);
  },
  alien: (e, f, cx, by) => {
    const sq = e.oy > -4 ? 2 : 0;
    for (let k = -1; k <= 1; k++) line([cx + k * 8, by - 6, cx + k * 11, by - 1 + sq * .5], D, 3);
    el(cx, by - 8, 17, 6 + sq * .4, '#B8BED8'); ol(D, 2.4); for (let k = -2; k <= 2; k++) el(cx + k * 6, by - 8, 1.5, 1.5, ['#FF5A8A', '#FFE24A', '#5AE08A'][(k + 2 + (T() >> 3)) % 3]);
    c.fillStyle = '#8AE0FF66'; c.beginPath(); c.arc(cx, by - 11, 12, PI, 0); c.closePath(); c.fill(); ol(D, 2);
    el(cx, by - 15, 7.5, 7, '#7AE86A'); ol(D, 2); el(cx + f * 1.5, by - 16, 4, 4.4, '#fff'); ol(D, 1.2); el(cx + f * 2.6, by - 16, 2, 2.4, '#1A1030');
    for (const d of [-1, 1]) { line([cx + d * 4, by - 21, cx + d * 7, by - 27], D, 1.6); el(cx + d * 7, by - 28, 1.8, 1.8, '#FFE24A') }
  },
  starry: (e, f, cx, by) => {
    const t = T(), cy = by - 15, r = 15, rot = Math.sin(t * .12 + e.ph) * .25;
    glow(cx, cy, 24, '#FFF6A066');
    c.save(); c.translate(cx, cy); c.rotate(rot); c.fillStyle = '#FFE24A'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * PI / 5 - PI / 2, q = i % 2 ? r * .55 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q) } c.closePath(); c.lineJoin = 'round'; c.fill(); ol('#C87A00', 2.6);
    el(-3, -6, 4, 2, '#FFFFFFaa', -.5); c.restore();
    K.eyes(cx + f * 1.5, cy - 1, f, false, .62); el(cx - 7, cy + 4, 2.2, 1.3, '#FF9AB0'); el(cx + 7, cy + 4, 2.2, 1.3, '#FF9AB0');
    c.strokeStyle = '#8A4A00'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx + f * 1.5, cy + 3, 2.4, .2, PI - .2); c.stroke();
  },
  shade: (e, f, cx, by) => {
    const t = T(), a0 = c.globalAlpha; c.globalAlpha = a0 * (e.gh ? .22 : 1);
    c.fillStyle = '#2A1E50'; c.beginPath(); c.moveTo(cx - 15, by); c.quadraticCurveTo(cx - 19, by - 38, cx, by - 38); c.quadraticCurveTo(cx + 19, by - 38, cx + 15, by);
    for (let k = 0; k < 4; k++) c.quadraticCurveTo(cx + 11 - k * 7.5, by - 8 + Math.sin(t * .2 + k) * 2.5, cx + 7.5 - k * 7.5, by); c.closePath(); c.fill(); ol('#8A6AE0', 2.2);
    c.shadowColor = '#C8A8FF'; c.shadowBlur = 10; for (const d of [-5.5, 5.5]) el(cx + d + f * 2, by - 24, 3.4, 4.6, e.gh ? '#C8A8FF' : '#FFF', d * .06); c.shadowBlur = 0;
    if (!e.gh) { for (const d of [-5.5, 5.5]) el(cx + d + f * 3, by - 23.5, 1.5, 2, '#5A2AC8'); poly([cx - 5 + f * 2, by - 15, cx + f * 2, by - 11, cx + 5 + f * 2, by - 15, cx + f * 2, by - 13], '#C8A8FF') }
    for (const d of [-1, 1]) { el(cx + d * 17, by - 20 + Math.sin(t * .15 + d) * 2, 4.5, 6, '#2A1E50'); ol('#8A6AE0', 1.8) }
    c.globalAlpha = a0;
  },
  knight: (e, f, cx, by, bob, legs) => {
    line([cx + f * 12, by - 4, cx + f * 22, by - 44], '#8A8AA0', 3); poly([cx + f * 19, by - 44, cx + f * 23, by - 56, cx + f * 26, by - 43], '#E8E8F8'); ol(D, 1.6);
    for (const d of [-6, 6]) { rr(cx + d - 4.5, by - 11 + (d > 0 ? legs : -legs) * 1.2, 9, 11, 3, '#3A3458'); ol(D, 2) }
    c.fillStyle = '#7A1E3A'; c.beginPath(); c.moveTo(cx - f * 8, by - 26); c.quadraticCurveTo(cx - f * 22, by - 18 + bob, cx - f * 19, by - 5); c.lineTo(cx - f * 6, by - 9); c.closePath(); c.fill(); ol(D, 2);
    rr(cx - 12, by - 28, 24, 19, 6, '#4A4470'); ol(D, 2.5); el(cx, by - 19, 4, 4.5, '#B57BFF'); ol(D, 1.4);
    rr(cx - 11, by - 43, 22, 18, 7, '#5A5488'); ol(D, 2.5); rr(cx - 8 + f * 2, by - 37, 16, 5, 2, '#12102A');
    c.shadowColor = '#FF4A6A'; c.shadowBlur = 8; for (const d of [-3.5, 3.5]) el(cx + d + f * 3, by - 34.5, 1.8, 1.8, e.ch ? '#FF4A6A' : '#FFB040'); c.shadowBlur = 0;
    poly([cx - 3, by - 43, cx, by - 54, cx + 3, by - 43], '#B83A5A'); ol(D, 1.6);
    el(cx + f * 12, by - 18, 5, 6, '#4A4470'); ol(D, 2);
  },
  urchin: (e, f, cx, by) => {   // nhím biển gai: không giẫm được
    const cy = by - 13, t = T();
    c.fillStyle = '#5A3A9A'; c.beginPath(); for (let i = 0; i < 22; i++) { const a = i * PI / 11 + Math.sin(t * .05) * .06, q = i % 2 ? 11 : 19; c.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * .82) } c.closePath(); c.lineJoin = 'round'; c.fill(); ol(D, 2.2);
    el(cx, cy, 11.5, 10, '#8A5AE0'); ol(D, 2); K.eyes(cx + f * 1.5, cy - 1, f, true, .62);
    for (let i = 0; i < 11; i++) { const a = i * PI / 5.5; el(cx + Math.cos(a) * 18.5, cy + Math.sin(a) * 15, 1.5, 1.5, '#FFB8E8') }
  },
  /* ── bay ── */
  butterfly: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, fl = Math.abs(Math.sin(T() * .3 + e.ph)), w = 4 + fl * 13, pal = e.ph > 3.1 ? ['#FF8AC0', '#FFD84A', '#8AE0FF'] : ['#8AB0FF', '#C8A0FF', '#FFE08A'];
    for (const d of [-1, 1]) { el(cx + d * w * .7, cy - 5, w * .8, 10, pal[0], d * .35); ol(D, 2); el(cx + d * w * .6, cy + 7, w * .6, 6.5, pal[1], -d * .4); ol(D, 1.8); el(cx + d * w * .7, cy - 5, w * .35, 4, pal[2]) }
    el(cx, cy, 2.8, 9, '#4A3A5A'); ol(D, 1.4); for (const d of [-1, 1]) { line([cx, cy - 8, cx + d * 5, cy - 15], D, 1.4); el(cx + d * 5, cy - 15.5, 1.4, 1.4, D) }
  },
  dragonfly: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, fl = Math.sin(T() * .9 + e.ph) * .35;
    for (const s of [-1, 1]) for (const k of [0, 1]) el(cx - f * (2 + k * 8), cy - 3 + s * 9, 5, 12, '#C8F0FFaa', s * (.5 + fl) + k * .25 * s);
    for (let k = 0; k < 5; k++) { el(cx - f * (4 + k * 5.5), cy, 3.6 - k * .35, 3.2 - k * .3, k % 2 ? '#2EC0B0' : '#1E9AD8'); ol(D, 1.4) }
    el(cx + f * 4, cy, 6, 5.4, '#2EC0B0'); ol(D, 2); el(cx + f * 11, cy - .5, 5.4, 5.2, '#1E9AD8'); ol(D, 2);
    el(cx + f * 13, cy - 2, 2.6, 3, '#fff'); el(cx + f * 13.8, cy - 2, 1.3, 1.6, '#1A1030');
  },
  hawk: (e, f) => birdy(e, f, ['#A8683A', '#F8E0B8', '#7A4424', '#FFC23A', 0]),
  parrot: (e, f) => birdy(e, f, ['#F0483E', '#FFD84A', '#2E8AE8', '#3A3A44', '#3EC86A']),
  tbird: (e, f) => { const cx = e.x + 19, cy = e.y + 13; if ((T() + Math.floor(e.ph * 30)) % 80 < 8) glow(cx, cy, 26, '#FFF6A088'); birdy(e, f, ['#3A4A8A', '#8AA8E8', '#22306A', '#FFE24A', '#FFE24A']) },
  copter: (e, f) => { const cx = e.x + 19, cy = e.y + 13; c.save(); c.translate(cx - f * 3, cy - 13); c.rotate(T() * .3); rr(-1.5, -8, 3, 10, 1.5, '#C8CCD8'); ol(D, 1.2); el(-3.5, -8, 3.6, 2.8, '#E8B04A'); el(3.5, -8, 3.6, 2.8, '#E8B04A'); c.restore(); birdy(e, f, ['#E8B04A', '#FFE8B0', '#B87A22', '#C8CCD8', 0]); el(cx - f * 2, cy + 1, 3, 3, '#8A5A1A'); el(cx - f * 2, cy + 1, 1.2, 1.2, '#FFE8B0') },
  owl: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, fl = Math.sin(T() * .3 + e.ph) * 8;
    for (const d of [-1, 1]) { c.fillStyle = '#E8F0FA'; c.beginPath(); c.moveTo(cx + d * 8, cy - 2); c.quadraticCurveTo(cx + d * 22, cy - 14 - fl, cx + d * 27, cy - 2 - fl * .5); c.quadraticCurveTo(cx + d * 18, cy + 5, cx + d * 8, cy + 5); c.fill(); ol('#3E4A78', 2) }
    el(cx, cy, 12.5, 12.5, '#FFFFFF'); ol('#3E4A78', 2.5); for (const d of [-1, 1]) poly([cx + d * 6, cy - 10, cx + d * 11, cy - 18, cx + d * 11, cy - 7], '#FFFFFF');
    for (let k = 0; k < 3; k++) for (let j = -1; j <= 1; j++) el(cx + j * 5 + (k % 2) * 2.5, cy + 4 + k * 2.6, 1.6, .9, '#A8B8D0');
    for (const d of [-1, 1]) { el(cx + d * 5 + f, cy - 3, 4.6, 4.8, '#FFE24A'); ol('#3E4A78', 1.4); el(cx + d * 5 + f * 1.8, cy - 3, 2.2, 2.4, '#1A1030') } poly([cx - 2 + f, cy + 1, cx + 2 + f, cy + 1, cx + f, cy + 5], '#F8A03A');
  },
  jelly: (e, f) => {
    const cx = e.x + 19, cy = e.y + 9, t = T(), p = Math.sin(t * .12 + e.ph);
    glow(cx, cy + 4, 26, '#C8A0FF55');
    for (let k = 0; k < 5; k++) { const x0 = cx - 11 + k * 5.5; c.strokeStyle = k % 2 ? '#FFB0E8cc' : '#B0C8FFcc'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, cy + 4); c.bezierCurveTo(x0 + Math.sin(t * .1 + k) * 5, cy + 12, x0 - Math.sin(t * .1 + k) * 5, cy + 18, x0 + Math.sin(t * .08 + k * 2) * 3, cy + 25 + p * 2); c.stroke() }
    c.fillStyle = '#E0B8FFdd'; c.beginPath(); c.ellipse(cx, cy + 4, 15 + p * 1.5, 14 - p * 1.5, 0, PI, 0); c.quadraticCurveTo(cx + 9, cy + 9, cx + 5, cy + 5); c.quadraticCurveTo(cx, cy + 9, cx - 5, cy + 5); c.quadraticCurveTo(cx - 9, cy + 9, cx - 15 - p * 1.5, cy + 4); c.fill(); ol('#6A4AB8', 2.2);
    el(cx - 6, cy - 5, 4, 2.4, '#ffffffaa', -.5); el(cx - 4.5 + f, cy - 1, 2, 2.6, '#3A2A6A'); el(cx + 4.5 + f, cy - 1, 2, 2.6, '#3A2A6A'); el(cx - 9, cy + 1.5, 2, 1.2, '#FF9AC8aa'); el(cx + 9, cy + 1.5, 2, 1.2, '#FF9AC8aa');
  },
  drone: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, t = T();
    for (const d of [-1, 1]) { line([cx + d * 8, cy - 2, cx + d * 16, cy - 8], D, 3); el(cx + d * 16, cy - 10, 9 * Math.abs(Math.cos(t * .8 + d)) + 2, 2, '#FFFFFF99'); el(cx + d * 16, cy - 8, 2.2, 2.2, '#3EE0E0') }
    rr(cx - 11, cy - 6, 22, 13, 5, '#3A3470'); ol(D, 2.4); c.shadowColor = '#FF4A9A'; c.shadowBlur = 10; el(cx + f * 3, cy, 4.6, 4.6, '#FF4A9A'); c.shadowBlur = 0; el(cx + f * 4, cy - 1, 1.6, 1.6, '#fff');
    rr(cx - 9, cy + 6, 18, 2.5, 1.2, '#3EE0E0'); if ((t >> 3) & 1) glow(cx, cy + 12, 10, '#3EE0E066');
  },
  ufo: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, t = T(), tilt = Math.sin(t * .08 + e.ph) * .12;
    c.save(); c.translate(cx, cy); c.rotate(tilt);
    c.fillStyle = '#7AF0C833'; poly([-7, 5, 7, 5, 15, 30, -15, 30], '#7AF0C82a');
    c.fillStyle = '#8AE0FF99'; c.beginPath(); c.arc(0, -3, 10, PI, 0); c.closePath(); c.fill(); ol(D, 2); el(0, -6, 4, 3.6, '#7AE86A'); el(1, -6.5, 1.4, 1.6, '#1A1030');
    el(0, 1, 20, 7, '#B8BED8'); ol(D, 2.4); el(0, -1, 14, 3, '#E0E4F4');
    for (let k = -2; k <= 2; k++) el(k * 7, 3, 1.8, 1.8, ['#FF5A8A', '#FFE24A', '#5AE08A', '#5AB0FF'][(k + 2 + (t >> 3)) % 4]);
    c.restore();
  },
  wisp: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, t = T(), fl = Math.sin(t * .3 + e.ph);
    glow(cx, cy, 30, '#7AD0FF66');
    c.fillStyle = '#5AB8FF'; c.beginPath(); c.moveTo(cx - 11, cy + 6); c.quadraticCurveTo(cx - 13, cy - 8, cx - 4 + fl * 2, cy - 12); c.quadraticCurveTo(cx - 2, cy - 20 - fl * 3, cx + 3 + fl * 3, cy - 25); c.quadraticCurveTo(cx + 2, cy - 14, cx + 9, cy - 10); c.quadraticCurveTo(cx + 14, cy, cx + 10, cy + 7); c.quadraticCurveTo(cx, cy + 14, cx - 11, cy + 6); c.fill(); ol('#2A5AC8', 2);
    el(cx, cy + 1, 7, 7.5, '#D8F4FF'); el(cx - 3 + f, cy, 1.8, 2.6, '#1A2A6A'); el(cx + 3 + f, cy, 1.8, 2.6, '#1A2A6A'); el(cx + f, cy + 5, 1.6, 1.2, '#1A2A6A');
  },
  garg: (e, f) => {
    const cx = e.x + 19, cy = e.y + 13, fl = Math.sin(T() * .35 + e.ph) * 9;
    for (const d of [-1, 1]) { c.fillStyle = '#5A4E70'; c.beginPath(); c.moveTo(cx + d * 6, cy - 4); c.lineTo(cx + d * 24, cy - 16 - fl); c.lineTo(cx + d * 28, cy - 2 - fl * .4); c.lineTo(cx + d * 21, cy - 4 - fl * .3); c.lineTo(cx + d * 19, cy + 4); c.lineTo(cx + d * 13, cy); c.lineTo(cx + d * 8, cy + 6); c.closePath(); c.fill(); ol(D, 2) }
    el(cx, cy + 1, 11, 11, '#7A6E94'); ol(D, 2.5); el(cx - 3, cy - 4, 4, 2.4, '#A89EC0aa');
    for (const d of [-1, 1]) poly([cx + d * 5, cy - 8, cx + d * 11, cy - 19, cx + d * 10, cy - 6], '#E8E0F0');
    c.shadowColor = '#FF4A4A'; c.shadowBlur = 8; el(cx - 4 + f, cy - 1, 2.4, 2.8, '#FF5A4A'); el(cx + 4 + f, cy - 1, 2.4, 2.8, '#FF5A4A'); c.shadowBlur = 0;
    poly([cx - 5 + f, cy + 5, cx - 3 + f, cy + 9, cx - 1 + f, cy + 5, cx + 1 + f, cy + 9, cx + 3 + f, cy + 5, cx + 5 + f, cy + 5], '#fff');
  }
};
return { ZONES, SZ, SPD, ai, fly, hero: (...a) => { c = K.ctx; return hero(...a) }, enemy: wrap(enemy), use: k => { K = k }, _: () => ({ K, T, PI, el, ol, poly, line, rr, glow, D, wrap, ctx: () => (c = K.ctx) }) };
})();
