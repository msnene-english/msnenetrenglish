/* ═════ dải tranh pixel động: cảnh nhỏ của 4 game ═════ */
(function () {
  const cv = document.getElementById('heroCv'); if (!cv) return;
  const ctx = cv.getContext('2d'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, P = 3, t = 0;
  const CLOUD = ['_____kkkkk______', '___kkwwwwwk_kkk_', '__kwwwwwwwwkwwwk', '_kwwwwwwwwwwwwwk', 'kwwwwwwwwwwwwwwk', 'kwwbwwwwwwwwbwwk', '_kbbbwwwwwwbbbk_', '__kkkkkkkkkkkk__'];
  const COIN = ['__ddd__', '_dyyyd_', 'dyywyyd', 'dyywyyd', 'dyywyyd', 'dyywyyd', 'dyywyyd', '_dyyyd_', '__ddd__'];
  const HERO = ['___ccccc____', '__ccccccccc_', '__hhhssks___', '_hshssssksss', '_hshhsssssss', '_hhssssssss_', '___ssssss___', '__ccbcccbc__', '_cccbcccbccc', 'ssccbbbbbcss', 'sssbybbbybss', '__bbbbbbbb__', '__bbb__bbb__', '_ooo____ooo_', 'oooo____oooo'];
  const TANK = ['TT___BB___TT', 'TT___BB___TT', 'TTbbbBBbbbTT', 'TTbhhBBhhbTT', 'TTbhcBBcdbTT', 'TTbhcLLcdbTT', 'TTbhccccdbTT', 'TTbhhccddbTT', 'TTbhhhdddbTT', 'TTbddddddbTT', 'TTbbbbbbbbTT', 'TT________TT'];
  const BOMB = ['__________yo____', '_________o__y___', '________kk______', '______kkkkk_____', '____kkkkkkkkk___', '___kkwwkkkkkkk__', '__kkwwkkkkkkkkk_', '__kkwkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '__kkkkkkkkkkkkk_', '___kkkkkkkkkkk__', '____kkkkkkkkk___', '______kkkkk_____'];
  const BLOB = ['___wwww___', '__cccccc__', '_cccccccc_', 'cckkcckkcc', 'ccwkccwkcc', 'cccccccccc', 'cpcccccpcc', 'SSSSSSSSSS', '_cccccccc_', '__bb__bb__'];
  const PAL = {
    cloud: { k: '#7FA8E8', w: '#FFFFFF', b: '#D6EAFF' }, coin: { d: '#A86A00', y: '#FFD23F', w: '#FFF7C2' },
    hero: { c: '#FF7EB6', b: '#2B4BD8', s: '#FFC99A', h: '#6B3A1E', k: '#1A1A1A', y: '#FFD23F', o: '#6B3A1E' },
    tank: { T: '#22405E', t: '#86B3D9', b: '#1D5E99', h: '#CDEBFF', d: '#5DB2F5', c: '#9FD4FF', L: '#FFFFFF', B: '#E8F6FF' },
    bomb: { k: '#22223A', w: '#9AA8D8', o: '#FF7A1A', y: '#FFE08A' },
    blob: { w: '#FFFFFF', c: '#9B7BFF', k: '#2D2350', p: '#FF8CC0', S: '#5AB0FF', b: '#4A3C98' } };
  const cache = {};
  function spr(key, rows, pal) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const x = c.getContext('2d');
    rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1) } } });
    return cache[key] = c;
  }
  const draw = (img, x, y, s, flip) => { s = s || P; if (flip) { ctx.save(); ctx.translate(Math.round(x + img.width * s), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width * s, img.height * s); ctx.restore() } else ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s) };
  const box = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)) };
  function brick(x, y, s, c1, c2, c3) { box(x, y, 16 * s, 16 * s, c2); box(x, y, 16 * s, 7 * s, c1); box(x, y + 8 * s, 16 * s, 7 * s, c1); box(x + 7 * s, y, s, 7 * s, c2); box(x + 3 * s, y + 8 * s, s, 7 * s, c2); box(x + 11 * s, y + 8 * s, s, 7 * s, c2); box(x, y, 7 * s, s, c3); box(x + 8 * s, y, 7 * s, s, c3) }
  function qblock(x, y, s) { box(x, y, 16 * s, 16 * s, '#7A3E00'); box(x + s, y + s, 14 * s, 14 * s, (t >> 4) % 3 ? '#FFB627' : '#FFC94A'); box(x + s, y + s, 14 * s, s, '#FFE08A'); ctx.font = (11 * s) + 'px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7A3E00'; ctx.fillText('?', x + 8.6 * s, y + 9 * s); ctx.fillStyle = '#fff'; ctx.fillText('?', x + 8 * s, y + 8.4 * s) }
  function frame() {
    t++;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ED0FF'); g.addColorStop(.62, '#CFE8FF'); g.addColorStop(1, '#FFD9EC'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { ctx.globalAlpha = .4 + .4 * Math.sin(t * .05 + i); box((i * 137) % W, (i * 53) % (H * .45), P, P, '#FFFFFF') } ctx.globalAlpha = 1;
    const cl = spr('cl', CLOUD, PAL.cloud);
    for (let i = 0; i < 5; i++) { const per = W + 240, x = ((i * 310 + t * (.25 + i * .05)) % per) - 120; draw(cl, x, 10 + (i * 37) % (H * .35), P * (i % 2 ? 1.5 : 2)) }
    const gy = H - 16 * P * .9, seg = W / 4, s2 = P * .9;
    // nền: cỏ + gạch
    box(0, gy - 3 * P, W, 3 * P, '#5CCB4C'); box(0, gy - P, W, P, '#2E9A3A');
    for (let x = 0; x < W; x += 16 * s2) brick(x, gy, s2, '#F7A8C0', '#B05A7B', '#FFDCE8');
    // ① leo núi: đảo bay + nhân vật nhảy
    const a0 = seg * .5;
    [[a0 - 60, gy - 58], [a0 + 30, gy - 92], [a0 - 20, gy - 126]].forEach(([x, y], i) => { box(x - 4, y, 64, 10, '#8FE3B0'); box(x, y + 10, 56, 8, '#C7B6F2'); box(x + 10, y + 18, 36, 6, '#A993E6'); box(x + 22, y + 24, 12, 4, '#A993E6') });
    const hop = (t % 140) / 140, k = Math.floor(hop * 3), f = hop * 3 - k, pts = [[a0 - 52, gy - 58], [a0 + 38, gy - 92], [a0 - 12, gy - 126], [a0 - 52, gy - 58]];
    const p0 = pts[k], p1 = pts[k + 1], bx = p0[0] + (p1[0] - p0[0]) * f, by = p0[1] + (p1[1] - p0[1]) * f - Math.sin(f * Math.PI) * 30;
    draw(spr('blob', BLOB, PAL.blob), bx, by - 10 * P * .8, P * .8, p1[0] < p0[0]);
    // ② Nấm Mario: khối ? + nhân vật nhảy đội, xu bay lên
    const b0 = seg * 1.5, qy = gy - 112, jt = t % 100, jump = jt < 40 ? Math.sin(jt / 40 * Math.PI) : 0;
    brick(b0 - 40 - 16 * P * .9, qy, P * .9, '#D8691E', '#6E2A08', '#FCA060'); qblock(b0 - 40, qy - (jt > 18 && jt < 26 ? 6 : 0), P * .9); brick(b0 - 40 + 16 * P * .9, qy, P * .9, '#D8691E', '#6E2A08', '#FCA060');
    draw(spr('hero', HERO, PAL.hero), b0 - 40 + 2, gy - 15 * P * .9 - jump * 52, P * .9);
    if (jt > 20 && jt < 60) { const ct = (jt - 20) / 40; ctx.globalAlpha = 1 - ct; draw(spr('coin', COIN, PAL.coin), b0 - 40 + 14, qy - 30 - ct * 50, P * .9); ctx.globalAlpha = 1 }
    // ③ xe tăng: chạy qua lại, bắn vỡ gạch hồng
    const c0 = seg * 2.5, tx = c0 - 70 + Math.sin(t * .015) * 30, wall = c0 + 60, sh = t % 90;
    for (let r = 0; r < 3; r++)if (!(sh > 40 && sh < 70 && r === 1)) brick(wall, gy - (r + 1) * 12 * P * .75, P * .75, '#F7A8C0', '#B05A7B', '#FFDCE8');
    ctx.save(); ctx.translate(Math.round(tx + 18), Math.round(gy - 22)); ctx.rotate(Math.PI / 2); ctx.drawImage(spr('tank' + ((t >> 3) & 1), TANK, Object.assign({}, PAL.tank, { T: (t >> 3) & 1 ? '#22405E' : '#86B3D9', t: (t >> 3) & 1 ? '#86B3D9' : '#22405E' })), -18, -18, 36, 36); ctx.restore();
    if (sh < 40) box(tx + 40 + (wall - tx - 40) * (sh / 40), gy - 24, 6, 6, '#FFF8D6');
    else if (sh < 52) { const rr = (sh - 40) * 2; box(wall - rr, gy - 24 - 2, rr * 2, 4, '#FFFFFF'); box(wall - 2, gy - 24 - rr, 4, rr * 2, '#FFB0CF') }
    // ④ đặt bom: ngòi cháy → nổ chữ thập
    const d0 = seg * 3.5, bt = t % 150, bxp = d0 - 24, byp = gy - 14 * P * .9;
    if (bt < 100) { const pul = 1 + Math.sin(t * .4) * .06; draw(spr('bomb', BOMB, PAL.bomb), bxp - (pul - 1) * 24, byp - (pul - 1) * 20, P * .9 * pul) }
    else { const k2 = (bt - 100) / 50, len = 70 * Math.min(1, k2 * 3), w2 = 18 * (1 - k2 * .5), cx = bxp + 22, cy = byp + 14;
      [['#FF7A1A', w2 + 8], ['#FFB627', w2], ['#FFF3B0', w2 - 8]].forEach(([c, w]) => { if (w > 0) { box(cx - len, cy - w / 2, len * 2, w, c); box(cx - w / 2, cy - len, w, len * 2 - (len - 14), c) } }) }
    // nhãn 4 game
    ctx.font = '800 ' + Math.max(11, Math.round(W / 70)) + 'px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
    ['🧗 Leo núi', '🍄 Nấm Mario', '🛡 Xe tăng', '💣 Đặt bom'].forEach((s, i) => { ctx.strokeStyle = '#5b4bb0'; ctx.strokeText(s, seg * (i + .5), H - 4); ctx.fillStyle = '#fff'; ctx.fillText(s, seg * (i + .5), H - 4) });
    if (!RM) requestAnimationFrame(frame);
  }
  function resize() { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.imageSmoothingEnabled = false; P = W < 700 ? 2 : 3; if (RM) frame() }
  addEventListener('resize', resize); resize(); if (!RM) requestAnimationFrame(frame);
})();
