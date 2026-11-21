/* climb2b.js — Leo núi P2 (tiếp): cảnh xa từng vùng · trang trí trên đảo · hiệu ứng bay · hoa văn thân đảo · BOSS Quỷ Vương Bóng Đêm. Nạp sau climb2.js. */
(function () {
const X = window.Climb2, H = X._(), { T, PI, el, ol, poly, line, rr, glow, D } = H;
const wrap = o => { for (const k in o) { const f = o[k]; o[k] = (...a) => { sync(); return f(...a) } } return o };
let K, c, cw, ch, sc, base;
function sync() { K = X._().K; c = H.ctx(); cw = K.cw; ch = K.ch; sc = K.sc; base = ch * .8 }
const off = k => -(((K.cam.x * sc * k) % cw) + cw) % cw;
const tiles = (k, fn) => { const o = off(k); fn(o); fn(o + cw) };
const hsh = n => { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s) };

/* ═════ cảnh xa: mỗi vùng một khung cảnh riêng (hiện dần khi leo tới) ═════ */
const FAR = {
  sunflower: () => {
    tiles(.08, ox => { for (let i = 0; i < 3; i++) {   // cối xay gió
      const px = ox + (i + .35) * cw / 3, h = 110 + i * 26, ty = base + 30 - h;
      poly([px - 16, base + 40, px - 9, ty, px + 9, ty, px + 16, base + 40], '#F4E8D8'); ol('#8A6A5A', 2); poly([px - 12, ty, px, ty - 16, px + 12, ty], '#D8563E'); ol('#8A3A2A', 2); rr(px - 4, base + 6, 8, 16, 3, '#8A5A3A');
      c.save(); c.translate(px, ty + 6); c.rotate(T() * .012 + i * 1.3); for (let k = 0; k < 4; k++) { c.rotate(PI / 2); c.fillStyle = '#FFFFFFdd'; c.beginPath(); c.moveTo(0, 0); c.lineTo(8, -h * .42); c.lineTo(-5, -h * .42); c.closePath(); c.fill(); ol('#8A6A5A', 1.5) } c.restore(); el(px, ty + 6, 4, 4, '#8A5A3A');
    } });
    tiles(.16, ox => { for (let i = 0; i < 10; i++) { const px = ox + i * cw / 10 + 20, h = 44 + (i * 37) % 34, sw = Math.sin(T() * .03 + i) * 3; line([px, base + 44, px + sw * .4, base + 44 - h], '#3E8E3A', 4); el(px - 9, base + 26 - h * .3, 9, 4, '#4EA84A', .5); for (let k = 0; k < 10; k++) el(px + sw * .4 + Math.cos(k * .63) * 12, base + 44 - h + Math.sin(k * .63) * 12, 6, 4, '#FFD23F', k * .63); el(px + sw * .4, base + 44 - h, 8, 8, '#8A5A2A') } });
  },
  bamboo: () => {
    tiles(.07, ox => { for (let i = 0; i < 7; i++) { const px = ox + i * cw / 7 + 30, w = 9 + (i * 5) % 6; c.fillStyle = i % 2 ? '#4E9A66' : '#5EAE74'; c.fillRect(px, ch * .1, w, ch); c.fillStyle = '#3A7E52'; for (let y = ch * .14; y < ch; y += 46 + (i * 7) % 20) c.fillRect(px - 1, y, w + 2, 3) } });
    for (let k = 0; k < 3; k++) { const g = c.createLinearGradient(0, ch * (.42 + k * .14), 0, ch * (.56 + k * .14)); g.addColorStop(0, '#ffffff00'); g.addColorStop(.5, '#ffffff55'); g.addColorStop(1, '#ffffff00'); c.fillStyle = g; c.fillRect(0, ch * (.42 + k * .14), cw, ch * .14) }
    tiles(.15, ox => { for (let i = 0; i < 5; i++) { const px = ox + (i + .3) * cw / 5, w = 15; c.fillStyle = '#3E9E4A'; c.fillRect(px, 0, w, ch); c.fillStyle = '#6ED07A'; c.fillRect(px + 2, 0, 4, ch); c.fillStyle = '#2A7A3A'; for (let y = 30 + (i * 31) % 40; y < ch; y += 70) { c.fillRect(px - 2, y, w + 4, 4); if ((y / 70 | 0) % 2) { el(px + w + 12, y - 8, 14, 4, '#4EB85A', -.5); el(px + w + 9, y + 4, 12, 3.5, '#3E9E4A', .3) } } } });
  },
  lotus: () => {
    c.fillStyle = '#7AD0C855'; c.fillRect(0, base + 20, cw, ch);
    tiles(.12, ox => { for (let i = 0; i < 6; i++) {
      const px = ox + (i + .4) * cw / 6, by = base + 44 + (i % 2) * 14;
      el(px, by, 46, 11, '#3EA87A'); el(px - 8, by - 2, 30, 6, '#5EC894'); poly([px, by, px + 46, by - 4, px + 46, by + 4], '#7AD0C8');
      if (i % 2 === 0) { const fy = by - 30 - (i * 13) % 20, sw = Math.sin(T() * .03 + i) * 2; line([px - 14, by, px - 14 + sw, fy + 10], '#3E8E5A', 3); for (const [a, col] of [[-.9, '#F78AB0'], [.9, '#F78AB0'], [-.45, '#FFB0CC'], [.45, '#FFB0CC'], [0, '#FFD0E0']]) el(px - 14 + sw + Math.sin(a) * 9, fy + 2 - Math.cos(a) * 5, 6.5, 14, col, a); el(px - 14 + sw, fy + 6, 4, 3, '#FFE24A') }
      else for (let k = 0; k < 3; k++) { line([px + 20 + k * 7, by, px + 22 + k * 7 + Math.sin(T() * .04 + k) * 3, by - 50 - k * 9], '#5E8E4A', 2.5); el(px + 22 + k * 7 + Math.sin(T() * .04 + k) * 3, by - 54 - k * 9, 3, 9, '#7A5A3A') }
    } });
  },
  canyon: () => {
    tiles(.06, ox => { for (let i = 0; i < 3; i++) {   // núi bàn đá đỏ nhiều tầng
      const px = ox + (i + .3) * cw / 3, w = 120 + i * 30, h = 130 + (i * 47) % 70, y0 = base + 40 - h;
      poly([px - w * .62, base + 44, px - w * .5, y0 + 26, px - w * .42, y0, px + w * .4, y0, px + w * .5, y0 + 30, px + w * .64, base + 44], '#C8683E'); c.save(); c.clip(); for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#E08A56' : '#B0522E'; c.fillRect(px - w, y0 + 12 + k * h / 6, w * 2, h / 14) } c.fillStyle = '#00000022'; c.fillRect(px + w * .1, y0, w, h + 50); c.restore();
    } });
    for (let i = 0; i < 3; i++) {   // khinh khí cầu
      const px = (((i * .37 + .1) * cw + off(.03) * 1.4 + T() * .12) % (cw + 160) + cw + 160) % (cw + 160) - 80, py = ch * (.2 + i * .13) + Math.sin(T() * .02 + i * 2) * 8, r = 30 - i * 5, cs = [['#FF5A6A', '#FFE24A'], ['#5AB0FF', '#FFFFFF'], ['#9B7BFF', '#FFB0D8']][i];
      line([px - r * .5, py + r * .8, px - 6, py + r * 1.6], '#6A4A3A', 1.2); line([px + r * .5, py + r * .8, px + 6, py + r * 1.6], '#6A4A3A', 1.2);
      for (let k = 0; k < 5; k++) { c.fillStyle = cs[k % 2]; c.beginPath(); c.ellipse(px, py, r * (1 - k * .2), r * 1.1, 0, 0, 7); c.fill() } c.beginPath(); c.ellipse(px, py, r, r * 1.1, 0, 0, 7); ol('#6A3A3A', 2);
      rr(px - 7, py + r * 1.6, 14, 10, 2, '#B8803E'); ol('#6A4A3A', 1.5);
    }
  },
  jungle: () => {
    tiles(.07, ox => {   // kim tự tháp bậc thang phủ dây leo
      const px = ox + cw * .55, w = Math.min(190, cw * .22);
      for (let k = 0; k < 6; k++) { const ww = w * (1 - k * .15), y = base + 40 - (k + 1) * 26; rr(px - ww, y, ww * 2, 28, 3, k % 2 ? '#8A9A7A' : '#7A8A6C'); ol('#4A5A44', 2); c.fillStyle = '#5A6A52'; for (let q = 0; q < 5; q++) c.fillRect(px - ww + q * ww * .4 + 6, y + 8, 8, 6) }
      rr(px - 16, base + 40 - 6 * 26 - 30, 32, 30, 3, '#8A9A7A'); ol('#4A5A44', 2); rr(px - 6, base + 40 - 6 * 26 - 18, 12, 18, 5, '#2A3A2A'); glow(px, base + 40 - 6 * 26 - 8, 16, '#FFE08A88');
      rr(px - 12, base + 40 - 26, 24, 26, 2, '#6A7A5E'); for (let k = 0; k < 5; k++) { c.strokeStyle = '#3E9E4A'; c.lineWidth = 3; c.beginPath(); c.moveTo(px - w * .8 + k * w * .4, base + 40 - (6 - Math.abs(k - 2) * 1.6) * 26); c.quadraticCurveTo(px - w * .8 + k * w * .4 + 8, base - 40, px - w * .8 + k * w * .4 - 4, base + 6); c.stroke() }
    });
    tiles(.14, ox => { for (let i = 0; i < 5; i++) { const px = ox + (i + .2) * cw / 5, h = 110 + (i * 43) % 60; c.strokeStyle = '#5A3E28'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, base + 50); c.quadraticCurveTo(px + 14, base + 50 - h * .5, px + 6, base + 50 - h); c.stroke(); for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * .55 + Math.sin(T() * .02 + i) * .04; c.strokeStyle = k % 2 ? '#2E9E52' : '#1E8444'; c.lineWidth = 8; c.beginPath(); c.moveTo(px + 6, base + 50 - h); c.quadraticCurveTo(px + 6 + Math.cos(a) * 34, base + 34 - h + Math.sin(a) * 30, px + 6 + Math.cos(a) * 56, base + 62 - h + Math.sin(a) * 18); c.stroke() } } });
  },
  coral: () => {
    c.fillStyle = '#0A5AA033'; c.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 5; i++) { const x = cw * (.1 + i * .2) + Math.sin(T() * .008 + i) * 30, g = c.createLinearGradient(0, 0, 0, ch * .9); g.addColorStop(0, '#CFF6FF44'); g.addColorStop(1, '#CFF6FF00'); c.fillStyle = g; poly([x - 16, 0, x + 26, 0, x + 110 + i * 14, ch * .9, x - 60, ch * .9], g) }
    tiles(.05, ox => { for (let i = 0; i < 14; i++) { const fx = ox + ((i * 97 + T() * (.35 + (i % 3) * .1)) % cw), fy = ch * (.25 + hsh(i) * .4) + Math.sin(T() * .03 + i) * 6, col = ['#FFD84A', '#FF8A6A', '#8AE0FF'][i % 3]; el(fx, fy, 8, 4.4, col); poly([fx - 7, fy, fx - 14, fy - 5, fx - 14, fy + 5], col); el(fx + 4, fy - 1, 1.2, 1.2, '#1A2A4A') } });
    tiles(.13, ox => { for (let i = 0; i < 8; i++) { const px = ox + (i + .3) * cw / 8, col = ['#FF7A9A', '#FFA85A', '#C87AF0', '#5AE0C0'][i % 4], h = 46 + (i * 29) % 44;
      if (i % 3 === 2) { for (let k = 0; k < 3; k++) { c.strokeStyle = '#2EA87A'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(px + k * 12, base + 50); c.bezierCurveTo(px + k * 12 + Math.sin(T() * .04 + k) * 16, base + 10, px + k * 12 - Math.sin(T() * .04 + k) * 16, base - 30, px + k * 12 + Math.sin(T() * .03 + k) * 10, base - 60 - k * 14); c.stroke() } }
      else { c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round'; const br = (x, y, a, l, d) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = 3 + d * 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d > 0) { br(x2, y2, a - .5, l * .7, d - 1); br(x2, y2, a + .5, l * .7, d - 1) } else el(x2, y2, 3.4, 3.4, '#ffffffaa') }; br(px, base + 50, -PI / 2, h * .5, 3) }
    } });
  },
  storm: () => {
    const t = T(), fl = t % 260 < 9 || (t + 97) % 410 < 7;
    if (fl) { c.fillStyle = '#FFFFFF33'; c.fillRect(0, 0, cw, ch); const bx = cw * (.2 + hsh(Math.floor(t / 130)) * .6); c.strokeStyle = '#FFF6A0'; c.lineWidth = 4; c.lineJoin = 'miter'; c.shadowColor = '#FFF6A0'; c.shadowBlur = 20; c.beginPath(); let x = bx, y = ch * .12; c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (hsh(k + Math.floor(t / 130) * 7) - .5) * 70; y += ch * .08; c.lineTo(x, y) } c.stroke(); c.shadowBlur = 0 }
    tiles(.05, ox => { for (let i = 0; i < 7; i++) { const px = ox + i * cw / 6, py = ch * (.07 + (i % 3) * .035); c.fillStyle = i % 2 ? '#3A4058' : '#2E3348'; c.beginPath(); for (const [dx, dy, r] of [[-50, 6, 34], [-14, -10, 46], [34, 0, 40], [70, 10, 28]]) c.arc(px + dx, py + dy, r, 0, 7); c.fill() } });
    tiles(.1, ox => { for (let i = 0; i < 4; i++) { const px = ox + (i + .4) * cw / 4, h = 120 + (i * 41) % 80; poly([px - 40, base + 50, px - 22, base + 50 - h * .7, px - 6, base + 50 - h, px + 10, base + 50 - h * .8, px + 34, base + 50], '#3E445C'); poly([px - 6, base + 50 - h, px + 10, base + 50 - h * .8, px + 34, base + 50, px + 6, base + 50], '#2E3348'); line([px - 6, base + 50 - h, px - 6, base + 26 - h], '#8A90A8', 2); if (fl) glow(px - 6, base + 26 - h, 14, '#FFF6A0aa') } });
  },
  glacier: () => {
    c.fillStyle = '#4EA0D855'; c.fillRect(0, base + 34, cw, ch);
    tiles(.07, ox => { for (let i = 0; i < 4; i++) { const px = ox + (i + .3) * cw / 4, h = 90 + (i * 53) % 80, w = 70 + (i * 17) % 40; poly([px - w, base + 40, px - w * .5, base + 40 - h * .7, px - w * .1, base + 40 - h, px + w * .4, base + 40 - h * .6, px + w, base + 40], '#DFF2FF'); poly([px - w * .1, base + 40 - h, px + w * .4, base + 40 - h * .6, px + w, base + 40, px + w * .1, base + 40], '#A8D4F2'); poly([px - w * .5, base + 40 - h * .7, px - w * .1, base + 40 - h, px - w * .2, base + 40 - h * .4], '#FFFFFF') } });
    const u = (T() % 900) / 900, wx = cw * (.15 + .7 * hsh(Math.floor(T() / 900))), wy = base + 40;   // cá voi vẫy đuôi + phun nước
    if (u < .5) { const k = Math.sin(u * 2 * PI), ty = wy - k * 74; c.save(); c.beginPath(); c.rect(0, 0, cw, wy); c.clip(); c.strokeStyle = '#3A5A8A'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(wx, wy + 30); c.quadraticCurveTo(wx + 6, ty + 30, wx, ty); c.stroke(); c.fillStyle = '#3A5A8A'; c.beginPath(); c.moveTo(wx, ty + 6); c.quadraticCurveTo(wx - 22, ty - 4, wx - 40, ty - 22); c.quadraticCurveTo(wx - 14, ty - 18, wx, ty - 6); c.quadraticCurveTo(wx + 14, ty - 18, wx + 40, ty - 22); c.quadraticCurveTo(wx + 22, ty - 4, wx, ty + 6); c.fill(); c.restore(); for (let q = 0; q < 6; q++) el(wx - 30 + q * 12, wy - 2 - Math.abs(Math.sin(T() * .2 + q)) * 8 * k, 5, 5, '#FFFFFFcc') }
    else if (u < .62) { const k = (u - .5) / .12; for (let q = 0; q < 7; q++) el(wx + 90 + (q - 3) * 4 * k * 2, wy - 10 - k * 50 + Math.abs(q - 3) * 10 * k, 4, 6, '#FFFFFFcc') ; el(wx + 90, wy, 34, 8, '#3A5A8A') }
    tiles(.13, ox => { for (let i = 0; i < 3; i++) { const px = ox + (i + .6) * cw / 3; c.fillStyle = '#F4FBFF'; c.beginPath(); c.arc(px, base + 44, 30, PI, 0); c.closePath(); c.fill(); ol('#8AB8DA', 2); c.strokeStyle = '#B8D8EE'; c.lineWidth = 1.5; for (const r of [20, 10]) { c.beginPath(); c.arc(px, base + 44, r, PI, 0); c.stroke() } rr(px - 8, base + 28, 16, 16, 8, '#3A5A8A'); glow(px, base + 38, 16, '#FFE08A99') } });
  },
  gear: () => {
    tiles(.06, ox => { for (let i = 0; i < 4; i++) {   // bánh răng khổng lồ quay
      const px = ox + (i + .3) * cw / 4, py = base - 20 - (i * 61) % 90, r = 44 + (i * 23) % 34, n = 10 + i * 2, a0 = T() * .01 * (i % 2 ? -1 : 1) * (60 / r);
      c.fillStyle = ['#C8924A', '#B07A3A', '#D8A860', '#9A6A32'][i]; c.beginPath(); for (let k = 0; k < n * 2; k++) { const a = a0 + k * PI / n, q = k % 2 ? r : r + 10; c.lineTo(px + Math.cos(a - .08) * q, py + Math.sin(a - .08) * q); c.lineTo(px + Math.cos(a + .08) * q, py + Math.sin(a + .08) * q) } c.closePath(); c.fill(); ol('#6A4420', 2.5);
      el(px, py, r * .62, r * .62, '#F4D8A0'); ol('#6A4420', 2); for (let k = 0; k < 5; k++) { const a = a0 + k * PI * .4; el(px + Math.cos(a) * r * .36, py + Math.sin(a) * r * .36, r * .12, r * .12, '#B07A3A') } el(px, py, r * .14, r * .14, '#6A4420');
    } });
    tiles(.1, ox => {   // tháp đồng hồ
      const px = ox + cw * .7, y0 = base + 44, h = 210; rr(px - 30, y0 - h, 60, h, 4, '#9A6A42'); ol('#5A3A22', 2.5); poly([px - 38, y0 - h, px, y0 - h - 54, px + 38, y0 - h], '#6A8AA0'); ol('#3A4A5A', 2.5); line([px, y0 - h - 54, px, y0 - h - 72], '#5A3A22', 3); el(px, y0 - h - 74, 4, 4, '#FFD23F');
      el(px, y0 - h + 36, 23, 23, '#FFF6E0'); ol('#5A3A22', 3); for (let k = 0; k < 12; k++) el(px + Math.cos(k * PI / 6) * 18, y0 - h + 36 + Math.sin(k * PI / 6) * 18, 1.5, 1.5, '#5A3A22');
      const a = T() * .02; line([px, y0 - h + 36, px + Math.cos(a) * 16, y0 - h + 36 + Math.sin(a) * 16], '#5A3A22', 2.5); line([px, y0 - h + 36, px + Math.cos(a / 12) * 10, y0 - h + 36 + Math.sin(a / 12) * 10], '#5A3A22', 3.5);
      for (let k = 0; k < 4; k++) rr(px - 8, y0 - h + 78 + k * 32, 16, 18, 8, '#FFD880');
      for (let k = 0; k < 4; k++) { const s = (T() * .5 + k * 40) % 160; el(px - 80 + Math.sin(k + T() * .01) * 10, y0 - 100 - s, 12 + s * .12, 12 + s * .12, 'rgba(255,255,255,' + (.5 - s / 320).toFixed(2) + ')') } rr(px - 90, y0 - 100, 20, 100, 3, '#7A5234'); ol('#5A3A22', 2);
    });
  },
  neon: () => {
    for (let i = 0; i < 2; i++) { const a = -PI / 2 + Math.sin(T() * .012 + i * 2.4) * .6, px = cw * (.3 + i * .45); c.fillStyle = i ? '#FF5AC81c' : '#5AF0FF1c'; c.beginPath(); c.moveTo(px, ch); c.lineTo(px + Math.cos(a - .09) * ch * 1.3, ch + Math.sin(a - .09) * ch * 1.3); c.lineTo(px + Math.cos(a + .09) * ch * 1.3, ch + Math.sin(a + .09) * ch * 1.3); c.closePath(); c.fill() }
    for (const [k, col, hk] of [[.05, '#1A1244', .9], [.11, '#0E0A2E', .62]]) tiles(k, ox => { const n = 9; for (let i = 0; i < n; i++) {
      const bw = cw / n, px = ox + i * bw, h = (90 + hsh(i + k * 100) * 190) * hk, y0 = ch * .97 - h; c.fillStyle = col; c.fillRect(px + 2, y0, bw - 5, h + ch);
      for (let wy = y0 + 10; wy < ch; wy += 15) for (let wx = px + 8; wx < px + bw - 12; wx += 12) { const hv = hsh(i * 31 + wy * .37 + wx * .11 + k * 9); if (hv > .5) { c.fillStyle = hv > .93 && (T() >> 5) % 2 ? '#FFFFFF' : ['#FFE08A', '#5AF0FF', '#FF7AC8'][Math.floor(hv * 30) % 3] + (k < .1 ? '88' : 'cc'); c.fillRect(wx, wy, 6, 8) } }
      if (i % 3 === 1) { const nc = ['#FF4AB0', '#3EE0E0', '#FFE24A'][i % 9 / 3 | 0]; c.shadowColor = nc; c.shadowBlur = 14; c.strokeStyle = nc; c.lineWidth = 3; c.strokeRect(px + bw * .25, y0 - 20, bw * .5, 14); c.beginPath(); c.moveTo(px + bw * .5, y0 - 6); c.lineTo(px + bw * .5, y0); c.stroke(); c.shadowBlur = 0 }
      if (i % 4 === 2) { line([px + bw * .5, y0, px + bw * .5, y0 - 34], col, 3); el(px + bw * .5, y0 - 36, 3, 3, (T() >> 4) % 2 ? '#FF4A4A' : '#6A1A1A') }
    } });
  },
  space: () => {
    for (const [x, y, r, col] of [[.2, .3, 150, '#B03AD82a'], [.7, .22, 190, '#3A6AE82a'], [.5, .5, 160, '#E83A8A1c']]) glow(cw * x + off(.02) * .2, ch * y, r, col.slice(0, 7) + col.slice(7));
    const px = cw * .26 + off(.03) * .25, py = ch * .3;   // hành tinh có vành đai
    c.strokeStyle = '#FFE0A0aa'; c.lineWidth = 7; c.beginPath(); c.ellipse(px, py, 96, 22, -.3, PI * .98, PI * 2.02); c.stroke();
    const pg = c.createRadialGradient(px - 18, py - 18, 6, px, py, 56); pg.addColorStop(0, '#FFC888'); pg.addColorStop(1, '#C8583A'); c.fillStyle = pg; c.beginPath(); c.arc(px, py, 54, 0, 7); c.fill(); c.save(); c.clip(); c.fillStyle = '#FFE8C055'; for (let k = 0; k < 4; k++) c.fillRect(px - 60, py - 40 + k * 22, 120, 7); c.restore();
    c.strokeStyle = '#FFE0A0'; c.lineWidth = 7; c.beginPath(); c.ellipse(px, py, 96, 22, -.3, .02, PI * .98); c.stroke(); c.strokeStyle = '#B88A5A'; c.lineWidth = 2; c.beginPath(); c.ellipse(px, py, 96, 22, -.3, .02, PI * .98); c.stroke();
    const mx = cw * .78 + off(.02) * .2, my = ch * .58; el(mx, my, 30, 30, '#8AD0F0'); el(mx - 8, my - 6, 9, 7, '#5AB86A'); el(mx + 10, my + 8, 11, 6, '#5AB86A'); el(mx - 9, my - 11, 12, 7, '#ffffff66');
    const u = (T() % 300) / 300; if (u < .25) { const sx = cw * (.9 - u * 2.4), sy = ch * (.05 + u * 1.3); line([sx, sy, sx + 80, sy - 44], '#FFFFFF88', 2); el(sx, sy, 3, 3, '#fff') }
    tiles(.09, ox => { const sx = ox + cw * .55, sy = ch * .42 + Math.sin(T() * .01) * 6; rr(sx - 46, sy - 6, 92, 12, 6, '#A8B0C8'); ol('#40446A', 2); for (const d of [-1, 1]) { rr(sx + d * 66 - 24, sy - 20, 48, 40, 3, '#3A5AB8'); ol('#40446A', 2); c.strokeStyle = '#8AB0FF'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(sx + d * 66 - 24 + k * 12, sy - 20); c.lineTo(sx + d * 66 - 24 + k * 12, sy + 20); c.stroke() } } el(sx, sy, 17, 17, '#C8CCE0'); ol('#40446A', 2); el(sx, sy, 8, 8, '#8AE0FF'); el(sx, sy - 24, 2.5, 2.5, (T() >> 4) % 2 ? '#FF4A4A' : '#6A1A1A') });
  },
  rainbow: () => {
    const cols = ['#FF6A7A', '#FFA85A', '#FFE66A', '#7AE08A', '#6AB8FF', '#A88AFF'];
    for (const [x, r, a] of [[.3, .62, .6], [.82, .44, .45]]) { const a0 = c.globalAlpha; c.globalAlpha = a0 * a; c.lineWidth = 11; cols.forEach((col, k) => { c.strokeStyle = col; c.beginPath(); c.arc(cw * x + off(.04) * .3, base + 70, ch * r - k * 11, PI, PI * 2); c.stroke() }); c.globalAlpha = a0 }
    tiles(.1, ox => { for (let i = 0; i < 3; i++) {   // lâu đài mây
      const px = ox + (i + .4) * cw / 3, py = base - 10 - (i * 47) % 80 + Math.sin(T() * .015 + i) * 6;
      c.fillStyle = '#FFFFFF'; c.beginPath(); for (const [dx, dy, r] of [[-46, 16, 24], [-16, 8, 32], [20, 10, 30], [50, 18, 22]]) c.arc(px + dx, py + dy, r, 0, 7); c.fill();
      for (const [dx, h, col] of [[-22, 34, '#FFB8D8'], [0, 50, '#C8B0FF'], [22, 30, '#A8D8FF']]) { rr(px + dx - 9, py - h, 18, h + 6, 3, '#FFF6FC'); poly([px + dx - 12, py - h, px + dx, py - h - 20, px + dx + 12, py - h], col); rr(px + dx - 3, py - h + 10, 6, 9, 3, col) }
      c.fillStyle = '#FFE8F4'; c.beginPath(); for (const [dx, dy, r] of [[-40, 24, 18], [-8, 22, 22], [30, 24, 20]]) c.arc(px + dx, py + dy, r, 0, 7); c.fill();
    } });
    for (let i = 0; i < 9; i++) { const sx = (hsh(i) * cw + off(.05) * .5 + cw) % cw, sy = ch * (.12 + hsh(i + 9) * .5) + Math.sin(T() * .03 + i) * 5; c.globalAlpha *= .6 + .4 * Math.sin(T() * .06 + i); c.fillStyle = ['#FFE66A', '#FFB8D8', '#FFFFFF'][i % 3]; K.star(sx, sy, 5 + (i % 3) * 2); c.globalAlpha = Math.min(1, c.globalAlpha / (.6 + .4 * Math.sin(T() * .06 + i))) }
  },
  shadow: () => {
    tiles(.08, ox => { for (let i = 0; i < 6; i++) {   // cây khô có mắt sáng
      const px = ox + (i + .3) * cw / 6, h = 130 + (i * 47) % 90, y0 = base + 50; c.strokeStyle = '#120C2A'; c.lineCap = 'round';
      const br = (x, y, a, l, w) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * .5 + 6, y + Math.sin(a) * l * .5, x2, y2); c.stroke(); if (w > 2.4) { br(x2, y2, a - .55 - hsh(i + w) * .3, l * .62, w * .58); br(x2, y2, a + .5 + hsh(i * 3 + w) * .3, l * .6, w * .58) } };
      br(px, y0, -PI / 2, h * .46, 13);
      if (i % 2 === 0 && (T() + i * 53) % 220 > 26) { c.shadowColor = '#FFE24A'; c.shadowBlur = 8; el(px - 5, y0 - h * .3, 2.6, 3.4, '#FFE24A'); el(px + 5, y0 - h * .3, 2.6, 3.4, '#FFE24A'); c.shadowBlur = 0 }
    } });
    for (let k = 0; k < 3; k++) { const g = c.createLinearGradient(0, ch * (.6 + k * .1), 0, ch * (.74 + k * .1)); g.addColorStop(0, '#8A6AE000'); g.addColorStop(.5, '#8A6AE033'); g.addColorStop(1, '#8A6AE000'); c.fillStyle = g; c.fillRect(0, ch * (.6 + k * .1), cw, ch * .14) }
    tiles(.14, ox => { for (let i = 0; i < 7; i++) { const px = ox + (i + .5) * cw / 7, hh = 26 + (i * 13) % 20, cc = ['#B57BFF', '#5AE0D0', '#FF7AC8'][i % 3]; rr(px - 3, base + 50 - hh, 6, hh, 3, '#D8D0F0'); c.shadowColor = cc; c.shadowBlur = 18; c.fillStyle = cc; c.beginPath(); c.ellipse(px, base + 50 - hh, 16, 10, 0, PI, 0); c.closePath(); c.fill(); c.shadowBlur = 0 } });
  },
  castle: () => {
    const g = c.createLinearGradient(0, ch * .7, 0, ch); g.addColorStop(0, '#FF5A1A00'); g.addColorStop(1, '#FF5A1A55'); c.fillStyle = g; c.fillRect(0, ch * .7, cw, ch * .3);
    tiles(.07, ox => {   // thành quỷ: tháp nhọn, cửa sổ đỏ, cờ
      const px = ox + cw * .5, y0 = base + 50;
      c.fillStyle = '#1A0A1E'; rr(px - 150, y0 - 90, 300, 100, 4, '#1A0A1E'); for (let k = 0; k < 11; k++) c.fillRect(px - 150 + k * 28, y0 - 102, 16, 14);
      for (const [dx, h, w] of [[-150, 170, 34], [-70, 230, 40], [0, 300, 52], [80, 220, 40], [150, 160, 34]]) { rr(px + dx - w / 2, y0 - h, w, h, 3, '#1A0A1E'); poly([px + dx - w / 2 - 6, y0 - h, px + dx, y0 - h - w * 1.5, px + dx + w / 2 + 6, y0 - h], '#2A1030'); line([px + dx, y0 - h - w * 1.5, px + dx, y0 - h - w * 1.5 - 18], '#2A1030', 2); const fw = Math.sin(T() * .1 + dx) * 3; poly([px + dx, y0 - h - w * 1.5 - 18, px + dx + 16, y0 - h - w * 1.5 - 13 + fw, px + dx, y0 - h - w * 1.5 - 8], '#B83A5A');
        c.shadowColor = '#FF4A2A'; c.shadowBlur = 12; for (let q = 0; q < Math.floor(h / 60); q++) rr(px + dx - 4, y0 - h + 22 + q * 52, 8, 16, 4, (T() + dx + q * 40) % 300 < 280 ? '#FF7A3A' : '#5A1A1A'); c.shadowBlur = 0 }
      rr(px - 20, y0 - 50, 40, 60, 20, '#3A0A1A'); glow(px, y0 - 20, 30, '#FF4A2A66');
    });
    tiles(.13, ox => { for (let i = 0; i < 5; i++) { const px = ox + (i + .2) * cw / 5, h = 60 + (i * 37) % 50; poly([px - 26, base + 56, px - 6, base + 56 - h, px + 4, base + 56 - h * .7, px + 24, base + 56], '#12060F'); c.strokeStyle = '#FF7A1A'; c.lineWidth = 2; c.shadowColor = '#FFB040'; c.shadowBlur = 8; c.beginPath(); c.moveTo(px - 6, base + 56 - h); c.lineTo(px - 10, base + 56 - h * .5); c.lineTo(px - 2, base + 56 - h * .2); c.stroke(); c.shadowBlur = 0 } });
  }
};
function far(zf) {
  sync(); const Z = X.ZONES;
  for (let i = 0; i < Z.length; i++) { const a = K.clamp(1 - Math.abs(zf - i - .5) * 1.1, 0, 1); if (a > .02 && FAR[Z[i].id]) { c.globalAlpha = a; c.save(); FAR[Z[i].id](); c.restore(); c.globalAlpha = 1; c.shadowBlur = 0 } }
}

/* ═════ trang trí trên mặt đảo (px, py = chân vật trang trí · i = 0..2 · w = bề rộng đảo) ═════ */
const deco = wrap({
  sunflower: (px, py, i) => { const h = i === 1 ? 26 : 15, sw = Math.sin(T() * .04 + px) * 1.5; line([px, py + 2, px + sw, py - h], '#3E8E3A', 2.6); el(px - 4, py - h * .45, 5, 2.4, '#4EA84A', .5); for (let k = 0; k < 9; k++) el(px + sw + Math.cos(k * .7) * 6.5, py - h + Math.sin(k * .7) * 6.5, 3.6, 2.4, '#FFD23F', k * .7); el(px + sw, py - h, 4.4, 4.4, '#8A5A2A'); c.beginPath(); c.arc(px + sw, py - h, 4.4, 0, 7); ol(D, 1.2) },
  bamboo: (px, py, i, w) => { if (i === 1 && w > 120) { for (const [dx, h] of [[-6, 40], [2, 52], [9, 34]]) { rr(px + dx - 2.5, py - h, 5, h + 2, 2, '#5EC06A'); ol('#2A6A3A', 1.4); c.fillStyle = '#2A7A3A'; for (let y = py - h + 10; y < py; y += 12) c.fillRect(px + dx - 3, y, 6, 1.6); el(px + dx + 7, py - h + 4, 7, 2.4, '#4EB85A', -.5) } } else { poly([px - 5, py + 2, px, py - 14, px + 5, py + 2], '#8ED86A'); ol('#2A6A3A', 1.4); line([px, py - 2, px, py - 9], '#5AA84A', 1.4) } },
  lotus: (px, py, i) => { if (i === 1) { for (const [a, col] of [[-1, '#F78AB0'], [1, '#F78AB0'], [-.5, '#FFB0CC'], [.5, '#FFB0CC'], [0, '#FFD8E6']]) { el(px + Math.sin(a) * 6, py - 7 - Math.cos(a) * 3, 4.4, 9.5, col, a); ol('#B84A7A', 1) } el(px, py - 5, 2.6, 2, '#FFE24A') } else { el(px, py, 9, 3.4, '#3EA87A'); ol('#1E6A4A', 1.3); poly([px, py, px + 9, py - 2, px + 9, py + 2], '#6ED0A8') } },
  cactus: (px, py, i) => { if (i === 1) { rr(px - 4.5, py - 26, 9, 28, 4.5, '#4EB86A'); ol(D, 1.8); c.strokeStyle = D; c.lineWidth = 6.5; c.lineCap = 'round'; for (const d of [-1, 1]) { c.strokeStyle = D; c.lineWidth = 7.5; c.beginPath(); c.moveTo(px + d * 4, py - 12 - d * 2); c.lineTo(px + d * 10, py - 12 - d * 2); c.lineTo(px + d * 10, py - 20 - d * 2); c.stroke(); c.strokeStyle = '#4EB86A'; c.lineWidth = 4.5; c.stroke() } el(px, py - 27, 3, 2.6, '#FF7AA8') } else { el(px, py - 1, 8, 5, '#E0905A'); ol('#8A4A2A', 1.4); el(px - 2, py - 3, 3, 1.5, '#F8B888') } },
  fern2: (px, py, i) => { if (i === 1) { for (const a of [-1.2, -.6, 0, .6, 1.2]) { c.strokeStyle = D; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py + 2); c.quadraticCurveTo(px + Math.sin(a) * 12, py - 22, px + Math.sin(a) * 24, py - 16 + Math.abs(a) * 8); c.stroke(); c.strokeStyle = a ? '#2EAE5A' : '#4ECE6A'; c.lineWidth = 3.6; c.stroke() } } else { line([px, py + 2, px, py - 10], '#2E8E4A', 2); for (let k = 0; k < 5; k++) el(px + Math.cos(k * 1.26) * 5, py - 12 + Math.sin(k * 1.26) * 5, 4.4, 3, i ? '#FF5A6A' : '#FFA83A', k * 1.26); el(px, py - 12, 2.4, 2.4, '#FFE24A') } },
  coral: (px, py, i) => { const col = ['#FF7A9A', '#FFA85A', '#C87AF0'][i]; if (i === 1) { c.lineCap = 'round'; for (const [a, l] of [[-.6, 16], [0, 24], [.6, 15]]) { line([px, py + 2, px + Math.sin(a) * l, py - Math.cos(a) * l], D, 7.5); line([px, py + 2, px + Math.sin(a) * l, py - Math.cos(a) * l], col, 4.6); el(px + Math.sin(a) * l, py - Math.cos(a) * l, 2, 2, '#ffffffcc') } } else { c.fillStyle = col; c.beginPath(); c.arc(px, py + 1, 8, PI, 0); c.closePath(); c.fill(); ol(D, 1.5); c.strokeStyle = '#ffffff99'; c.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(px, py); c.lineTo(px + k * 5, py - 6); c.stroke() } } },
  rod: (px, py, i) => { if (i === 1) { line([px, py + 2, px, py - 34], '#8A90A8', 3); el(px, py - 36, 3.4, 3.4, '#C8CCD8'); c.beginPath(); c.arc(px, py - 36, 3.4, 0, 7); ol(D, 1.4); if ((T() + Math.floor(px)) % 150 < 10) { glow(px, py - 36, 16, '#FFF6A0cc'); line([px, py - 40, px - 5, py - 50, px + 3, py - 54, px - 3, py - 66], '#FFF6A0', 2) } } else { el(px, py + 1, 10, 3, '#5A7A9Aaa'); el(px - 3, py, 3, 1, '#ffffff66') } },
  igloo: (px, py, i, w) => { if (i === 1 && w > 120) { c.fillStyle = '#F4FBFF'; c.beginPath(); c.arc(px, py + 2, 17, PI, 0); c.closePath(); c.fill(); ol('#3E4A78', 2); c.strokeStyle = '#B0D0E8'; c.lineWidth = 1.2; c.beginPath(); c.arc(px, py + 2, 10, PI, 0); c.moveTo(px - 16, py - 5); c.lineTo(px + 16, py - 5); c.stroke(); rr(px - 5, py - 9, 10, 11, 5, '#3A5A8A'); glow(px, py - 3, 9, '#FFE08Aaa') } else { poly([px - 5, py + 2, px - 1, py - 15, px + 4, py + 2], '#BEEAFF'); ol('#3E4A78', 1.4); poly([px + 3, py + 2, px + 7, py - 8, px + 10, py + 2], '#E0F6FF'); ol('#3E4A78', 1.2) } },
  cog: (px, py, i) => { if (i === 1) { rr(px - 4, py - 22, 8, 24, 2, '#8A6A4A'); ol(D, 1.6); rr(px - 6.5, py - 26, 13, 5, 2, '#B08A62'); ol(D, 1.4); for (let k = 0; k < 3; k++) { const s = (T() * .6 + k * 22) % 66; el(px + Math.sin(k + T() * .03) * 3, py - 30 - s * .5, 4 + s * .08, 4 + s * .08, 'rgba(255,255,255,' + (.7 - s / 95).toFixed(2) + ')') } } else { c.save(); c.translate(px, py - 6); c.rotate(T() * .03 * (i ? 1 : -1)); c.fillStyle = '#E8B04A'; c.beginPath(); for (let k = 0; k < 16; k++) { const a = k * PI / 8, q = k % 2 ? 6 : 9; c.lineTo(Math.cos(a - .12) * q, Math.sin(a - .12) * q); c.lineTo(Math.cos(a + .12) * q, Math.sin(a + .12) * q) } c.closePath(); c.fill(); ol(D, 1.5); el(0, 0, 2.6, 2.6, '#6A4420'); c.restore() } },
  lamp: (px, py, i) => { const col = ['#FF4AB0', '#3EE0E0', '#FFE24A'][i]; if (i === 1) { line([px, py + 2, px, py - 32], '#4A4680', 3.4); line([px, py - 32, px + 9, py - 32], '#4A4680', 3); c.shadowColor = col; c.shadowBlur = 16; rr(px + 5, py - 31, 9, 6, 3, col); c.shadowBlur = 0; glow(px + 9, py - 22, 18, col + '44') } else { c.shadowColor = col; c.shadowBlur = 12; c.strokeStyle = col; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.arc(px, py - 1, 7, PI, 0); c.stroke(); c.shadowBlur = 0 } },
  dish: (px, py, i) => { if (i === 1) { line([px, py + 2, px, py - 14], '#8A90B0', 3); c.fillStyle = '#E0E4F4'; c.beginPath(); c.ellipse(px + 2, py - 18, 12, 6, -.5, 0, PI); c.closePath(); c.fill(); ol(D, 1.6); line([px + 2, py - 18, px + 8, py - 28], '#8A90B0', 1.6); el(px + 8, py - 29, 2, 2, (T() >> 4) % 2 ? '#FF4A6A' : '#6A1A2A') } else { el(px, py, 8, 2.6, '#8A90B0'); el(px, py - .6, 5.4, 1.5, '#5A6080') } },
  rbow: (px, py, i) => { if (i === 1) { c.lineWidth = 2.6; ['#FF6A7A', '#FFE66A', '#7AE08A', '#6AB8FF'].forEach((col, k) => { c.strokeStyle = col; c.beginPath(); c.arc(px, py + 2, 15 - k * 2.6, PI, 0); c.stroke() }); el(px - 15, py + 1, 5, 3.4, '#fff'); el(px + 15, py + 1, 5, 3.4, '#fff') } else { c.fillStyle = i ? '#FFB8D8' : '#FFE66A'; K.star(px, py - 8 + Math.sin(T() * .05 + px) * 2, 5.5); ol('#C88A4A', 1) } },
  gloom: (px, py, i) => { const cc = ['#B57BFF', '#5AE0D0', '#FF7AC8'][i]; if (i === 1) { line([px, py + 2, px - 2, py - 16], '#120C2A', 3); line([px - 1, py - 9, px + 7, py - 17], '#120C2A', 2); line([px - 2, py - 14, px - 8, py - 21], '#120C2A', 2); if ((T() + Math.floor(px * 3)) % 200 > 24) { c.shadowColor = '#FFE24A'; c.shadowBlur = 6; el(px - 4, py - 4, 1.6, 2, '#FFE24A'); el(px + 2, py - 4, 1.6, 2, '#FFE24A'); c.shadowBlur = 0 } } else { rr(px - 2, py - 9, 4, 10, 2, '#D8D0F0'); c.shadowColor = cc; c.shadowBlur = 12; c.fillStyle = cc; c.beginPath(); c.ellipse(px, py - 9, 7.5, 5, 0, PI, 0); c.closePath(); c.fill(); c.shadowBlur = 0; ol(D, 1.2) } },
  torch: (px, py, i) => { if (i === 1) { rr(px - 2.5, py - 22, 5, 24, 2, '#3A2A40'); ol('#12060F', 1.4); rr(px - 6, py - 26, 12, 5, 2, '#5A4A5E'); ol('#12060F', 1.4); K.flame(px, py - 34 + Math.sin(T() * .3 + px) * 1.5, 6); glow(px, py - 32, 22, '#FF8A3A44') } else { poly([px - 6, py + 2, px - 3, py - 10, px, py + 2], '#3A2A40'); poly([px, py + 2, px + 3, py - 13, px + 6, py + 2], '#4A3A50'); ol('#12060F', 1.2) } }
});

/* ═════ hiệu ứng bay khắp màn hình ═════ */
const fx = wrap({
  pollen: q => { c.strokeStyle = '#FFFFFFcc'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x + Math.cos(k * 1.05 + q.a * .3) * 5 * q.s, q.y - 3 + Math.sin(k * 1.05 + q.a * .3) * 5 * q.s); c.stroke() } el(q.x, q.y + 3, 1, 2, '#C8A86A') },
  dust: q => { el(q.x, q.y, 9 * q.s, 2.2, 'rgba(240,190,140,.5)') },
  rain: q => { c.strokeStyle = '#BFE0FFaa'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - 5, q.y + 15 * q.s); c.stroke() },
  steam: q => { el(q.x, q.y, 9 * q.s + 3, 9 * q.s + 3, 'rgba(255,255,255,.22)') },
  starfall: q => { c.fillStyle = ['#FFE66A', '#FFB8D8', '#A8D8FF', '#C8B0FF'][(q.s * 100 | 0) % 4]; c.save(); c.translate(q.x, q.y); c.rotate(q.a); K.star(0, 0, 5 * q.s); c.restore() },
  soul: q => { const b = .4 + .6 * Math.abs(Math.sin(q.a * 1.6)); glow(q.x, q.y, 12 * q.s, '#B57BFF' + Math.round(b * 150).toString(16).padStart(2, '0')); el(q.x, q.y, 2, 2, '#E8D8FF') }
});
const fxUp = { steam: 1, soul: 1 };
const fxMove = { rain: q => { q.y += 13 * q.s + 6; q.x -= 4.5 }, dust: q => { q.x -= 2.6 * q.s + 1; q.y += Math.sin(q.a += .05) * .5 }, pollen: q => { q.y += .45 * q.s; q.x += -.5 + Math.sin(q.a += .03) * .9 } };

/* ═════ hoa văn thân đảo: tấm kim loại đinh tán · dải neon · hố mặt trăng ═════ */
function tex(Z, x, y, w, depth, d) {
  sync();
  if (Z.tex === 'metal') { c.strokeStyle = Z.dirtD; c.lineWidth = 2; for (let px = x + 26; px < x + w - 6; px += 34) { c.beginPath(); c.moveTo(px, y + 6); c.lineTo(px, y + depth + 14); c.stroke() } c.beginPath(); c.moveTo(x, y + depth * .5 + 8); c.lineTo(x + w, y + depth * .5 + 8); c.stroke(); for (let px = x + 9; px < x + w - 4; px += 17) { el(px, y + 14, 1.8, 1.8, Z.dirtL); el(px, y + depth * .5 + 14, 1.8, 1.8, Z.dirtL) } }
  else if (Z.tex === 'neon') { for (let k = 0; k < 2; k++) { const col = k ? '#FF4AB0' : '#3EE0E0'; c.shadowColor = col; c.shadowBlur = 10; c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 6, y + 15 + k * depth * .42); c.lineTo(x + w * (.3 + d[k] * .3), y + 15 + k * depth * .42); c.lineTo(x + w * (.3 + d[k] * .3) + 8, y + 23 + k * depth * .42); c.lineTo(x + w - 6, y + 23 + k * depth * .42); c.stroke() } c.shadowBlur = 0; c.fillStyle = '#FFE08A'; for (let k = 0; k < 4; k++) if (d[k + 2] > .35) c.fillRect(x + 10 + d[k] * (w - 26), y + depth * .3 + d[k + 1] * depth * .5, 5, 6) }
  else if (Z.tex === 'moon') { for (let k = 0; k < 4; k++) { const px = x + 14 + d[k] * (w - 28), py = y + 14 + d[k + 2] * depth * .7, r = 4 + d[k + 1] * 5; el(px, py, r, r * .7, Z.dirtD); el(px + 1, py + 1, r * .7, r * .45, Z.dirt) } }
}

/* ═════ 👹 QUỶ VƯƠNG BÓNG ĐÊM ═════ */
function bossAtk(B, top, BF, pl) {
  const rage = B.hp <= 8, R = Math.random;
  if (R() < (rage ? .42 : .26)) { const n = rage ? 5 : 3, mid = pl.x + 17; for (let k = 0; k < n; k++) BF.push({ k: 'met', x: K.clamp(mid + (k - (n - 1) / 2) * 74 + (R() - .5) * 30, top.x + 30, B.x - 16), y: top.y - 560, vx: 0, vy: rage ? 9 : 8, d: 50 + k * 15, l: 500 }) }   // mưa thiên thạch: có dấu báo trên mặt đất
  else { const n = rage ? 4 : 3, hi = R() < .45, v = rage ? 5.6 : 4.8; for (let k = 0; k < n; k++) BF.push({ k: 'orb', x: B.x + 4, y: top.y - ((rage ? (k % 2 ? !hi : hi) : hi) ? 74 : 20), vx: -v, d: k * 26, l: 280 }) }   // cầu bóng tối: nổi giận thì xen kẽ thấp – cao
  B.mouth = 40; B.t = (rage ? 95 : 130) + Math.floor(R() * 40);
}
function boss(B, top, BF) {
  sync(); if (!B) return;
  const t = T();
  if (!(B.dead && B.dy > 880)) {
    const x = B.x, gy = top.y + B.hop + B.dy, rage = B.hp <= 8 && !B.dead, br = Math.sin(t * .06) * 2.5, cast = B.mouth > 0, OL = '#0E0618';
    c.save(); if (B.dead) { c.globalAlpha = Math.max(0, 1 - B.dy / 900); c.translate(x + 70, gy - 60); c.rotate(B.dy * .004); c.translate(-(x + 70), -(gy - 60)) }
    if (B.inv && (t >> 2) & 1) c.globalAlpha *= .5;
    el(x + 72, top.y, 78, 10, '#00000040');
    if (rage) glow(x + 70, gy - 70, 130 + Math.sin(t * .2) * 8, '#FF2A4A44');
    // áo choàng
    c.fillStyle = '#3A0E4A'; c.beginPath(); c.moveTo(x + 52, gy - 96); c.quadraticCurveTo(x + 150, gy - 100 + br, x + 168 + Math.sin(t * .07) * 6, gy - 6); for (let k = 0; k < 5; k++) c.quadraticCurveTo(x + 156 - k * 20, gy - 22 + Math.sin(t * .1 + k) * 4, x + 146 - k * 20, gy - 2); c.closePath(); c.fill(); ol(OL, 3);
    c.fillStyle = '#7A1E5A'; c.beginPath(); c.moveTo(x + 70, gy - 90); c.quadraticCurveTo(x + 130, gy - 80, x + 146, gy - 20); c.lineTo(x + 100, gy - 14); c.closePath(); c.fill();
    // chân
    for (const lx of [x + 44, x + 88]) { rr(lx, gy - 34, 24, 34, 8, '#2A2440'); ol(OL, 2.5); rr(lx - 6, gy - 10, 30, 10, 5, '#4A4470'); ol(OL, 2.2) }
    // thân giáp
    c.fillStyle = '#3A3458'; c.beginPath(); c.moveTo(x + 30, gy - 96 + br * .4); c.quadraticCurveTo(x + 74, gy - 114 + br * .4, x + 118, gy - 96 + br * .4); c.lineTo(x + 108, gy - 30); c.lineTo(x + 40, gy - 30); c.closePath(); c.fill(); ol(OL, 3);
    poly([x + 52, gy - 92 + br * .4, x + 96, gy - 92 + br * .4, x + 88, gy - 44, x + 74, gy - 34, x + 60, gy - 44], '#5A5488'); ol(OL, 2);
    c.shadowColor = rage ? '#FF3A5A' : '#B57BFF'; c.shadowBlur = 18; el(x + 74, gy - 64 + br * .4, 9, 11, rage ? '#FF4A6A' : '#C89AFF'); c.shadowBlur = 0; el(x + 71, gy - 68 + br * .4, 3, 4, '#ffffffaa');
    for (const sx of [x + 30, x + 118]) { el(sx, gy - 94 + br * .4, 17, 12, '#4A4470'); ol(OL, 2.5); poly([sx - 6, gy - 102 + br * .4, sx, gy - 122 + br * .4, sx + 6, gy - 102 + br * .4], '#B8B0D8'); ol(OL, 1.8) }
    // tay phải (sau) · tay trái cầm trượng
    rr(x + 114, gy - 86 + br * .4, 16, 40, 8, '#2A2440'); ol(OL, 2.5);
    const ax = x + 16 - (cast ? 8 : 0), ay = gy - 60 + br - (cast ? 14 : 0);
    line([ax, gy - 4, ax - (cast ? 10 : 2), gy - 150 - (cast ? 6 : 0)], OL, 9); line([ax, gy - 4, ax - (cast ? 10 : 2), gy - 150 - (cast ? 6 : 0)], '#6A4A8A', 5);
    const ox = ax - (cast ? 10 : 2), oy = gy - 158 - (cast ? 6 : 0); poly([ox - 12, oy + 8, ox - 16, oy - 12, ox - 6, oy - 4, ox, oy - 18, ox + 6, oy - 4, ox + 16, oy - 12, ox + 12, oy + 8], '#FFD23F'); ol(OL, 2);
    glow(ox, oy - 4, cast ? 34 : 22, rage ? '#FF4A6Aaa' : '#B57BFFaa'); el(ox, oy - 4, 8, 8, cast ? '#FFFFFF' : rage ? '#FF7A9A' : '#D8B8FF'); c.beginPath(); c.arc(ox, oy - 4, 8, 0, 7); ol(OL, 2);
    rr(x + 18, gy - 88 + br * .4, 16, 34, 8, '#2A2440'); ol(OL, 2.5); el(ax + 4, ay, 9, 9, '#4A4470'); ol(OL, 2.2);
    // đầu: mũ giáp có sừng + vương miện, mắt rực
    const hx = x + 44, hy = gy - 122 + br;
    for (const d of [-1, 1]) { c.fillStyle = '#E8E0F0'; c.beginPath(); c.moveTo(hx + d * 18, hy - 8); c.quadraticCurveTo(hx + d * 46, hy - 14, hx + d * 40, hy - 46); c.quadraticCurveTo(hx + d * 30, hy - 22, hx + d * 12, hy - 20); c.closePath(); c.fill(); ol(OL, 2.5) }
    c.fillStyle = '#4A4470'; c.beginPath(); c.moveTo(hx - 26, hy + 20); c.quadraticCurveTo(hx - 32, hy - 24, hx, hy - 26); c.quadraticCurveTo(hx + 32, hy - 24, hx + 26, hy + 20); c.lineTo(hx + 10, hy + 28); c.lineTo(hx, hy + 20); c.lineTo(hx - 10, hy + 28); c.closePath(); c.fill(); ol(OL, 3);
    poly([hx - 20, hy - 20, hx - 22, hy - 38, hx - 11, hy - 28, hx, hy - 44, hx + 11, hy - 28, hx + 22, hy - 38, hx + 20, hy - 20], '#FFD23F'); ol(OL, 2.2); el(hx, hy - 30, 3.4, 3.4, '#FF4A6A');
    poly([hx - 22, hy - 4, hx + 14, hy - 4, hx + 10, hy + 12, hx - 20, hy + 12], '#0E0618');
    c.shadowColor = rage ? '#FF2A2A' : '#FFB040'; c.shadowBlur = 14; for (const d of [-13, 2]) poly([hx + d - 6, hy + 1, hx + d + 6, hy - 2, hx + d + 5, hy + 6, hx + d - 5, hy + 7], rage ? '#FF3A3A' : '#FFC23A'); c.shadowBlur = 0;
    if (cast) { poly([hx - 18, hy + 14, hx + 6, hy + 14, hx + 2, hy + 24, hx - 14, hy + 24], '#FF4A6A'); for (let k = 0; k < 4; k++) poly([hx - 16 + k * 6, hy + 14, hx - 13 + k * 6, hy + 19, hx - 10 + k * 6, hy + 14], '#fff') }
    c.restore();
  }
  // đòn đánh: cầu bóng tối · thiên thạch (dấu báo trước) · sóng xung kích
  for (const f of BF) {
    if (f.k === 'met') {
      const far = f.d > 0, pu = .5 + .5 * Math.sin(t * .5); el(f.x, top.y - 2, 26, 6, 'rgba(255,60,80,' + (.25 + pu * .4).toFixed(2) + ')'); c.strokeStyle = '#FF3A5A'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.ellipse(f.x, top.y - 2, 26, 6, 0, 0, 7); c.stroke(); c.setLineDash([]);
      poly([f.x - 9, top.y - 14, f.x, top.y - 32, f.x + 9, top.y - 14], '#FFE24A'); ol('#8A3A00', 1.6); rr(f.x - 1.3, top.y - 27, 2.6, 7, 1, '#8A3A00'); el(f.x, top.y - 17.5, 1.5, 1.5, '#8A3A00');
      if (!far) { for (let k = 1; k <= 4; k++) el(f.x + Math.sin(t + k) * 3, f.y - k * 16, 13 - k * 2.4, 15 - k * 2.4, ['#FFE08A', '#FF9A3A', '#FF5A2A', '#B83A5A'][k - 1] + 'bb'); el(f.x, f.y, 14, 14, '#4A3040'); c.beginPath(); c.arc(f.x, f.y, 14, 0, 7); ol('#0E0618', 2.2); el(f.x - 4, f.y - 4, 3.4, 2.6, '#7A5A6A'); el(f.x + 5, f.y + 3, 2.6, 2, '#2A1420'); glow(f.x, f.y, 30, '#FF7A3A66') }
      continue;
    }
    if (f.d > 0) continue;
    if (f.k === 'wave') { const hgt = 30 + Math.sin(t * .6) * 4; c.fillStyle = '#B57BFFcc'; c.beginPath(); c.moveTo(f.x + 20, top.y); c.quadraticCurveTo(f.x + 14, top.y - hgt, f.x - 14, top.y - hgt - 6); c.quadraticCurveTo(f.x - 2, top.y - hgt * .5, f.x - 16, top.y); c.closePath(); c.fill(); ol('#5A2AC8', 2.2); glow(f.x, top.y - 14, 28, '#B57BFF66'); for (let k = 0; k < 3; k++) el(f.x + 24 + k * 12, top.y - 4 - k * 2, 5 - k, 5 - k, '#D8C8E8' + ['cc', '88', '44'][k]); continue }
    glow(f.x, f.y, 30, '#B57BFF88'); for (let k = 1; k <= 3; k++) el(f.x + k * 13, f.y + Math.sin(t * .4 + k) * 3, 11 - k * 2.6, 11 - k * 2.6, '#7A3AE0' + ['aa', '77', '44'][k - 1]);
    el(f.x, f.y, 13, 13, '#2A1050'); c.beginPath(); c.arc(f.x, f.y, 13, 0, 7); ol('#C89AFF', 2.4); el(f.x - 4, f.y - 4, 4, 3, '#C89AFFaa'); el(f.x - 3, f.y, 2, 2.6, '#FF4A6A'); el(f.x + 4, f.y, 2, 2.6, '#FF4A6A');
  }
}
Object.assign(X, { far, deco, fx, fxUp, fxMove, tex, boss, bossAtk: (...a) => { sync(); return bossAtk(...a) } });
})();
