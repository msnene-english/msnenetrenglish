/* core.js — tiện ích dùng chung cho host.html (cô) và play.html (học sinh) */
window.GC = (function () {
const $ = id => document.getElementById(id);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') };
const pad2 = x => String(x).padStart(2, '0');
const stamp = t => { const d = new Date(t); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ' · ' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() };
/* lọc ký tự ẩn, dấu cách lạ, chữ toàn khổ (gõ từ iPad/điện thoại) */
function clean(s) {
  return String(s || '').normalize('NFC').replace(/[­͏​-‏‪-‮⁠-⁯﻿]/g, '')
    .replace(/[  -  　]/g, ' ').replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
}
function rng(seed) { let s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646 } }
const COLORS = ['#ff8cc0', '#5ab0ff', '#3fd29a', '#a98bff', '#ffb38a', '#4fd1d9', '#ff7a9c', '#d59bff'];
const BADGE = ['#ff7eb6', '#5ab0ff', '#3fbf86', '#9b7bff'];

/* ── làm sạch HTML trong câu hỏi: chỉ giữ thẻ định dạng, bỏ mọi thuộc tính trừ class ── */
const OKTAG = /^(B|STRONG|I|EM|U|BR|SUB|SUP|SPAN|SMALL|P|DIV|UL|OL|LI|MARK)$/;
function safe(html) {
  const t = document.createElement('template'); t.innerHTML = String(html == null ? '' : html);
  (function walk(n) {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return }
      walk(c);
      if (!OKTAG.test(c.tagName)) { c.replaceWith(...c.childNodes); return }
      [...c.attributes].forEach(a => { if (!(a.name === 'class' && /^[\w\s-]*$/.test(a.value))) c.removeAttribute(a.name) });
    })
  })(t.content);
  return t.innerHTML;
}

/* ── câu hỏi chuẩn: {q, o:[...], a: chỉ số đáp án đúng, e: giải thích, s: dạng bài} ── */
const NOSHUF = /Pronunciation|Stress|Ordering|underlined|âm tiết|trọng âm|phát âm|sắp xếp/i;
/* ── chuẩn hoá & chấm câu tự luận ngắn / điền từ / viết lại câu ── */
function normAns(s) {
  return clean(String(s || '').replace(/<[^>]+>/g, ''))
    .toLowerCase()
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/\b(do|does|did|is|are|was|were|have|has|had|would|could|should|must|need)n't\b/g, '$1 not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(i|you|he|she|it|we|they)'ll\b/g, '$1 will')
    .replace(/^[.,!?;:"'()\s]+|[.,!?;:"'()\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function checkTextAns(userVal, ansText) {
  const u = normAns(userVal);
  if (!u) return false;
  const targets = String(ansText || '').split(/\s*[\/|;]\s*/).map(normAns).filter(Boolean);
  return targets.includes(u);
}
function fromOld(x) {
  let o = [], a = -1;
  if (x.opts) {
    x.opts.forEach((p, i) => { if (typeof p === 'string') o.push(p); else { o.push(p.h ?? p.w ?? ''); if (p.c || p.ok) a = i } });
  } else if (x.options) {
    o = x.options.slice();
    if (typeof x.answer === 'number') a = x.answer;
    else if (x.correct != null) a = o.indexOf(x.correct);
  }
  const qText = x.question ? (x.question + (x.text ? '<br><br>' + x.text : '')) : (x.q || x.text || '');
  const isText = x.type === 'text' || (!!x.ansText && (!o || o.length < 2));
  return {
    type: isText ? 'text' : 'mc',
    q: qText,
    o: isText ? [] : o,
    a: isText ? 0 : a,
    ansText: x.ansText || '',
    e: x.explanation || x.exp || x.vnt || '',
    s: (x.type && x.type !== 'text' && x.type !== 'mc' ? x.type : '') || x.sec || x.s || ''
  };
}
function prep(list, noShuffle) {   // trước khi chơi: bỏ câu hỏng, làm sạch, xáo đáp án 1 lần
  return (list || []).filter(x => {
    if (!x || !x.q) return false;
    if (x.type === 'text' || (x.ansText && (!x.o || x.o.length < 2))) return !!clean(x.ansText || (x.o && x.o[0]) || '');
    return x.o && x.o.length >= 2 && x.a >= 0 && x.a < x.o.length;
  }).map((x, i) => {
    const isText = x.type === 'text' || (!!x.ansText && (!x.o || x.o.length < 2));
    if (isText) {
      return {
        n: i + 1,
        type: 'text',
        q: safe(x.q),
        ansText: clean(x.ansText || (x.o && x.o[0]) || ''),
        s: esc(x.s || 'Tự luận / Điền từ'),
        passage: x.passage ? safe(x.passage) : '',
        audio: x.audio ? esc(x.audio) : '',
        img: x.img ? esc(x.img) : '',
        o: [],
        a: 0,
        e: safe(x.e || '')
      };
    }
    let idx = x.o.map((_, k) => k);
    if (!noShuffle && !NOSHUF.test((x.s || '') + ' ' + x.q)) idx = shuffle(idx);
    return {
      n: i + 1,
      type: 'mc',
      ansText: '',
      q: safe(x.q),
      s: esc(x.s || ''),
      passage: x.passage ? safe(x.passage) : '',
      audio: x.audio ? esc(x.audio) : '',
      img: x.img ? esc(x.img) : '',
      o: idx.map(k => safe(x.o[k])),
      a: idx.indexOf(x.a),
      e: safe(x.e || '')
    };
  });
}

/* ── đọc bảng (CSV từ Google Sheet, hoặc dán từ Excel/Sheet = TSV) ── */
function parseCSV(t, sep) {
  sep = sep || ','; const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"' && f === '') q = true;
    else if (c === sep) { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = '' }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}
const nl = s => esc(s).replace(/&lt;(\/?)(u|b|i|strong|em|br)&gt;/gi, '<$1$2>').replace(/\n/g, '<br>');
function ansIndex(ans, o) {
  ans = clean(ans); let m = ans.match(/^\(?([A-Da-d])[.)]?$/);
  if (m) return 'ABCD'.indexOf(m[1].toUpperCase());
  if (/^[1-4]$/.test(ans)) return +ans - 1;
  return o.findIndex(x => x && clean(x).toLowerCase() === ans.toLowerCase());
}
/* cột: Câu hỏi | A | B | C | D | Đáp án | Giải thích | Dạng bài (tuỳ chọn) */
function rowToQ(r, line, out, errs) {
  const q = (r[0] || '').trim(), o = r.slice(1, 5).map(s => (s || '').trim()), ans = (r[5] || '').trim();
  if (!q && !o.some(Boolean)) return;
  const keep = o.map((x, i) => x ? i : -1).filter(i => i >= 0), oo = keep.map(i => o[i]);
  if (q && oo.length === 0 && ans) {
    out.push({ type: 'text', q: nl(q), ansText: clean(ans), o: [], a: 0, e: nl((r[6] || '').trim()), s: (r[7] || 'Tự luận / Điền từ').trim() });
    return;
  }
  const ai = ansIndex(ans, o), aa = keep.indexOf(ai);
  if (!q || oo.length < 2 || aa < 0) { errs.push('Dòng ' + line + ': ' + (!q ? 'thiếu câu hỏi' : oo.length < 2 ? 'cần ít nhất 2 phương án (hoặc để trống cả 4 cột A-D và điền cột Đáp án cho câu tự luận)' : 'đáp án "' + ans + '" không khớp A/B/C/D')); return }
  out.push({ type: 'mc', q: nl(q), o: oo.map(nl), a: aa, e: nl((r[6] || '').trim()), s: (r[7] || '').trim() });
}
function rowsToQs(rows) {
  const out = [], errs = [];
  rows.forEach((r, ri) => { if (ri === 0 && r.some(c => /^\s*(đáp án|dap an|answer|key)\s*$/i.test(c))) return; rowToQ(r, ri + 1, out, errs) });
  return { qs: out, errs };
}
/* dán từ Word:  1. Câu hỏi … / A. … / *B. … (dấu * = đáp án đúng) / Đáp án: B / Giải thích: … (Nếu không có A,B,C,D mà có Đáp án: ... -> câu tự luận/điền từ) */
function parseText(t) {
  const out = [], errs = []; let cur = null;
  const flush = () => {
    if (!cur) return;
    if (cur.q && cur.o.length === 0 && cur.key) {
      out.push({ type: 'text', q: nl(cur.q), ansText: clean(cur.key), o: [], a: 0, e: nl(cur.e), s: 'Tự luận / Điền từ' });
      cur = null;
      return;
    }
    if (cur.a < 0 && cur.key) cur.a = ansIndex(cur.key, cur.o);
    if (!cur.q || cur.o.length < 2 || cur.a < 0) errs.push('Câu ' + (out.length + errs.length + 1) + ' (“' + cur.q.slice(0, 40) + '…”): ' + (cur.o.length < 2 ? 'chưa đủ phương án (hoặc thêm dòng "Đáp án: ..." cho câu điền từ/tự luận)' : 'chưa đánh dấu đáp án đúng (* hoặc dòng "Đáp án: B")'));
    else out.push({ type: 'mc', q: nl(cur.q), o: cur.o.map(nl), a: cur.a, e: nl(cur.e), s: '' });
    cur = null;
  };
  const OPT = /^\s*(\*?)\s*\(?([A-Da-d])[.)]\s*(.*?)\s*(\*?)\s*$/;
  clean(t.replace(/\r/g, '').replace(/\n/g, '\u0001')).split('\u0001').forEach(raw => {
    let line = raw.trim(); if (!line) return;
    let parts = [line];
    if (/^\*?\s*\(?A[.)]/i.test(line) && /\s\*?\(?[B-D][.)]\s/i.test(line)) parts = line.split(/\s+(?=\*?\(?[B-Db-d][.)]\s)/);
    parts.forEach(p => {
      let m;
      if ((m = p.match(/^(đáp án|dap an|answer|key)\s*[:：]\s*(.+)$/i))) { if (cur) cur.key = m[2]; return }
      if ((m = p.match(/^(giải thích|lời giải|explain|explanation)\s*[:：]\s*(.*)$/i))) { if (cur) cur.e = m[2]; cur && (cur.inE = true); return }
      if (cur && !cur.inE && (m = p.match(OPT)) && 'ABCD'.indexOf(m[2].toUpperCase()) === cur.o.length) {
        cur.o.push(m[3].replace(/\s*\((đúng|correct)\)\s*$/i, '')); if (m[1] || m[4] || /\((đúng|correct)\)\s*$/i.test(m[3])) cur.a = cur.o.length - 1; return;
      }
      if (cur && cur.inE && /^(câu|question)?\s*\d+\s*[.:)]\s*\S/i.test(p)) flush();   // câu đánh số mới → hết phần giải thích câu trước
      if (cur && cur.inE) { cur.e += '\n' + p; return }
      if (cur && cur.o.length) flush();
      if (!cur) cur = { q: p.replace(/^(câu|question)?\s*\d+\s*[.:)]\s*/i, ''), o: [], a: -1, e: '', key: '' };
      else cur.q += '\n' + p;
    });
  });
  flush();
  return { qs: out, errs };
}
function parsePaste(t) { return /\t/.test(t) ? rowsToQs(parseCSV(t, '\t')) : parseText(t) }

/* ── bài tập về nhà: gói cả đề + cài đặt vào link (nén gọn) ── */
async function packHw(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj)); let data = bytes, tag = 'p';
  if (window.CompressionStream) { try { data = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); tag = 'z' } catch (e) { data = bytes; tag = 'p' } }
  let bin = ''; for (let i = 0; i < data.length; i++)bin += String.fromCharCode(data[i]);
  return tag + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function unpackHw(s) {
  s = String(s || '').trim(); const tag = s[0], bin = atob(s.slice(1).replace(/-/g, '+').replace(/_/g, '/')); let out = Uint8Array.from(bin, c => c.charCodeAt(0));
  if (tag === 'z') { if (!window.DecompressionStream) throw new Error('trình duyệt hơi cũ — em mở bằng Chrome hoặc cập nhật máy nhé'); out = new Uint8Array(await new Response(new Blob([out]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer()) }
  return JSON.parse(new TextDecoder().decode(out));
}

/* ── Google Sheet: 1 tab, cột Bộ đề | Câu hỏi | A | B | C | D | Đáp án | Giải thích | Dạng bài ── */
const CFG = () => window.GAME_CONFIG || {};
async function sheetRows() {
  const id = CFG().sheetId; if (!id) throw new Error('Chưa điền sheetId trong Game/config.js');
  const r = await fetch('https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&headers=1&gid=' + (CFG().sheetGid || 0) + '&t=' + Date.now());
  if (!r.ok) throw new Error('Không đọc được Google Sheet (lỗi ' + r.status + ')');
  const t = await r.text(); if (/^\s*</.test(t)) throw new Error('Google Sheet chưa mở quyền "Bất kỳ ai có đường liên kết → Người xem"');
  return parseCSV(t);
}
async function sheetSets() {
  const rows = await sheetRows(); if (!rows.length) throw new Error('Google Sheet đang trống — cô nhập câu hỏi vào nhé');
  const head = rows[0].map(h => clean(h).toLowerCase()), find = re => head.findIndex(h => re.test(h));
  let cQ = find(/^(câu hỏi|cau hoi|question|đề bài|de bai)/), cSet = find(/^(bộ đề|bo de|bộ câu hỏi|lớp|lop|bài|set)/), start = 1;
  if (cQ < 0) { cQ = 1; cSet = 0; start = 0 }   // không có dòng tiêu đề → coi như đúng mẫu
  const col = (re, d) => { const k = find(re); return k >= 0 ? k : d };
  const cA = col(/^a$/, cQ + 1), cB = col(/^b$/, cQ + 2), cC = col(/^c$/, cQ + 3), cD = col(/^d$/, cQ + 4),
    cK = col(/^(đáp án|dap an|answer|key)/, cQ + 5), cE = col(/^(giải thích|giai thich|lời giải|explain)/, cQ + 6), cS = col(/^(dạng|dang|type)/, -1);
  const sets = [], by = {};
  rows.slice(start).forEach((r, k) => {
    const name = (cSet >= 0 ? clean(r[cSet]) : '') || 'Bộ câu hỏi';
    if (!by[name]) { by[name] = { name, qs: [], errs: [] }; sets.push(by[name]) }
    rowToQ([r[cQ], r[cA], r[cB], r[cC], r[cD], r[cK], r[cE], cS >= 0 ? r[cS] : ''], k + start + 1, by[name].qs, by[name].errs);
  });
  return sets.filter(x => x.qs.length || x.errs.length);
}
async function sheetSet(name) { return (await sheetSets()).find(x => x.name === name) || { name, qs: [], errs: [] } }
function sampleSet(i) { const s = (window.SAMPLE_SETS || [])[i]; return s ? { title: s.title, qs: s.raw.map(fromOld) } : null }

/* ── âm thanh ── */
let AC = null;
function tone(f, d, type, vol, f2, delay) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(vol || .12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
  } catch (e) { }
}
const DUCK = 'assets/duck.mp3';
let duck = null;
function sfx(k) {
  if (k === 'jump') tone(420, .14, 'square', .05, 760);
  else if (k === 'spring') tone(300, .3, 'sine', .12, 1100);
  else if (k === 'ok') [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .12, 0, i * .08));
  else if (k === 'cp' || k === 'win') [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .12, 0, i * .09));
  else if (k === 'bat') tone(880, .12, 'sine', .1, 1320);
  else if (k === 'fall') tone(600, .6, 'sawtooth', .06, 90);
  else if (k === 'ice') [1400, 1100, 900].forEach((f, i) => tone(f, .15, 'sine', .08, 0, i * .07));
  else if (k === 'zap') tone(200, .35, 'sawtooth', .07, 900);
  else if (k === 'pop') tone(660, .08, 'sine', .08, 990);
  else if (k === 'stomp') { tone(180, .12, 'square', .09, 60); tone(700, .12, 'triangle', .1, 1200, .06) }
  else if (k === 'hurt') tone(320, .25, 'sawtooth', .08, 120);
  else if (k === 'crack') tone(140, .2, 'square', .05, 70);
  else if (k === 'coin') { tone(988, .07, 'square', .06); tone(1319, .25, 'square', .06, 0, .07) }
  else if (k === 'power') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .1, 'triangle', .09, 0, i * .05));
  else if (k === 'bump') tone(160, .08, 'square', .08, 90);
  else if (k === 'break') { tone(220, .12, 'square', .07, 80); tone(120, .15, 'sawtooth', .05, 60, .03) }
  else if (k === 'pipe') [392, 330, 262, 196, 147].forEach((f, i) => tone(f, .09, 'square', .05, 0, i * .07));
  else if (k === 'flag') [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, .14, 'triangle', .1, 0, i * .08));
  else if (k === 'fireball') tone(900, .08, 'square', .05, 300);
  else if (k === 'grow') [392, 494, 587, 784, 988, 1175].forEach((f, i) => tone(f, .07, 'square', .06, 0, i * .05));
  else if (k === 'shrink') [784, 587, 440, 330].forEach((f, i) => tone(f, .09, 'square', .06, 0, i * .07));
  else if (k === 'star') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .08, 'square', .06, 0, i * .07));
  else if (k === 'roar') { tone(110, .45, 'sawtooth', .09, 60); tone(70, .5, 'square', .05, 40, .05) }
  else if (k === 'bossHit') { tone(220, .1, 'square', .08, 110); tone(160, .15, 'sawtooth', .05, 80, .05) }
  else if (k === 'bossDown') [330, 262, 196, 147, 110, 82].forEach((f, i) => tone(f, .18, 'sawtooth', .07, 0, i * .12));
  else if (k === 'fanfare') {   // kèn chiến thắng: ta-ta-ta-TAAA… ta-TAAAA
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    [[67, 0, .12], [72, .13, .12], [76, .26, .12], [79, .39, .42], [76, .84, .14], [79, .99, .3], [84, 1.32, 1.1]].forEach(([m, t, d]) => { tone(hz(m), d, 'square', .06, 0, t); tone(hz(m - 12), d, 'triangle', .1, 0, t) });
    [60, 64, 67, 72, 76].forEach(m => tone(hz(m), 1.3, 'triangle', .05, 0, 1.32));
    [0, .39, .99, 1.32].forEach(t => tone(90, .25, 'sine', .25, 45, t));
  }
  else if (k === 'bad') { try { duck = duck || new Audio(DUCK); duck.currentTime = 0; duck.play().catch(() => { }) } catch (e) { } }
}
function confetti(n) {
  for (let i = 0; i < n; i++) {
    const e = document.createElement('i'); e.className = 'cf'; e.style.background = pick(['#ff7eb6', '#5ab0ff', '#3fbf86', '#9b7bff', '#ffe08a']);
    e.style.setProperty('--x', (Math.random() - .5) * 700 + 'px'); e.style.setProperty('--y', (Math.random() * -.6 + .4) * 500 + 'px'); e.style.setProperty('--r', Math.random() * 720 + 'deg');
    document.body.appendChild(e); setTimeout(() => e.remove(), 1400);
  }
}
let toastT = 0;
function toast(s, ms) { const t = $('toast'); if (!t) return; t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2200) }

/* ── nhạc nền 8-bit tự soạn: mỗi game một bản (16 ô nhịp, đoạn A + đoạn B) · hoặc file mp3 trong config.music ──
   climb: phiêu lưu Rê trưởng · brick: tưng tưng nhún nhảy Đô trưởng · tank: hành khúc La thứ */
const music = (function () {
  const PREF = 'gMusic', H = -1;   // H = ngân tiếp nốt trước
  const CH = {
    D: { b: 50, t: [62, 66, 69, 74] }, A: { b: 45, t: [61, 64, 69, 73] }, Bm: { b: 47, t: [59, 62, 66, 71] }, G: { b: 43, t: [59, 62, 67, 71] }, Em: { b: 40, t: [59, 64, 67, 71] },
    C: { b: 48, t: [60, 64, 67, 72] }, F: { b: 41, t: [60, 65, 69, 72] }, Am: { b: 45, t: [57, 60, 64, 69] }, E: { b: 40, t: [56, 59, 64, 68] }
  };
  const TRACKS = {
    climb: { bpm: 140, duty: .5, drum: 'pop', bass: 'walk', arp: true, stab: false, st: .9,
      ch: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'A'],
      mel: [[74, 0, 74, 76, 78, H, 76, 74], [73, H, 69, H, 71, 73, 74, 76], [78, H, 78, 79, 81, H, 78, 76], [74, H, 71, H, 74, 76, 78, H],
        [81, H, 78, H, 76, 74, 76, 78], [76, H, 73, H, 69, 71, 73, H], [71, 74, 79, H, 78, H, 76, 74], [73, H, H, H, 76, H, 73, H],
        [71, H, 74, 78, 83, H, 81, 78], [79, H, 78, 76, 74, H, 71, H], [74, 78, 81, H, 86, H, 81, 78], [76, H, 73, 76, 81, H, H, 0],
        [83, 81, 78, H, 81, 78, 74, H], [79, 78, 76, H, 74, 71, 67, H], [71, 74, 76, 79, 83, H, 79, 76], [81, H, H, H, 73, H, 76, H]] },
    brick: { bpm: 152, duty: .25, drum: 'bounce', bass: 'bounce', arp: false, stab: true, st: .55,
      ch: ['C', 'C', 'F', 'C', 'G', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C'],
      mel: [[72, 76, 79, 76, 84, H, 79, 76], [77, 76, 74, 72, 74, H, 0, 0], [77, 81, 84, 81, 77, H, 74, 77], [76, H, 72, H, 79, H, 0, 0],
        [74, 79, 83, 79, 86, H, 83, 79], [81, 79, 77, 76, 74, 72, 74, 76], [79, H, 76, 72, 74, 76, 77, 79], [79, H, H, 0, 71, H, 74, H],
        [81, H, 76, 81, 84, H, 81, 76], [77, H, 81, 77, 72, H, 77, H], [76, 79, 84, 79, 76, 72, 76, 79], [74, H, 79, H, 83, H, 79, H],
        [84, 83, 81, H, 76, H, 81, H], [81, 79, 77, H, 72, H, 77, H], [79, 81, 83, 86, 83, 79, 74, 79], [84, H, H, H, 72, H, 0, 0]] },
    bomb: { bpm: 144, duty: .25, drum: 'disco', bass: 'walk', arp: false, stab: true, st: .7,
      ch: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D', 'C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G'],
      mel: [[79, 0, 74, 0, 71, 74, 79, H], [76, H, 74, 71, 67, H, 71, 74], [76, 0, 72, 0, 67, 72, 76, H], [78, H, 76, 74, 72, H, 69, H],
        [79, 81, 83, H, 79, H, 74, H], [76, 79, 83, H, 79, H, 76, H], [72, 76, 81, H, 79, 77, 76, 74], [74, H, H, 0, 78, H, 81, H],
        [84, H, 83, 81, 79, H, 76, H], [81, H, 79, 78, 74, H, 78, H], [83, H, 81, 78, 74, H, 78, 81], [79, H, 76, H, 71, H, H, 0],
        [76, 79, 84, H, 83, 81, 79, 76], [78, 81, 86, H, 84, 83, 81, 78], [79, H, 83, H, 86, H, 83, 79], [79, H, H, H, 0, 0, 74, 78]] },
    tank: { bpm: 126, duty: .125, drum: 'march', bass: 'drive', arp: false, stab: false, st: .85,
      ch: ['Am', 'Am', 'F', 'G', 'Am', 'F', 'G', 'E', 'Am', 'C', 'G', 'Am', 'F', 'G', 'E', 'E'],
      mel: [[69, H, H, 72, 76, H, 72, H], [74, 72, 71, H, 69, H, H, 0], [72, H, H, 77, 81, H, 77, H], [79, 77, 76, H, 74, H, H, 0],
        [76, H, 81, H, 79, 77, 76, H], [77, H, 76, 74, 72, H, 74, 76], [74, H, 71, H, 67, H, 71, 74], [76, H, H, H, 68, H, 71, H],
        [81, H, H, 81, 83, H, 84, H], [84, H, 83, 81, 79, H, 76, H], [79, H, H, 79, 81, H, 83, H], [84, H, 81, H, 76, H, H, 0],
        [77, H, 81, H, 84, H, 81, 77], [79, H, 83, H, 86, H, 83, 79], [80, H, 76, H, 71, H, 76, 80], [83, H, H, H, 80, H, H, 0]] }
  };
  let ac = null, master = null, noise = null, waves = {}, timer = 0, step = 0, next = 0, playing = false, el = null, lv = 1, cur = 'climb', T = TRACKS.climb, S16 = .1;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function pref() { try { return localStorage.getItem(PREF) !== '0' } catch (e) { return true } }
  function setPref(v) { try { localStorage.setItem(PREF, v ? '1' : '0') } catch (e) { } }
  function pulse(duty) {   // sóng xung kiểu NES (12.5% · 25% · 50%)
    if (waves[duty]) return waves[duty];
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++)im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
    return waves[duty] = ac.createPeriodicWave(re, im);
  }
  function note(f, t, d, type, vol) { const o = ac.createOscillator(), g = ac.createGain(); if (typeof type === 'number') o.setPeriodicWave(pulse(type)); else o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + d * .7); g.gain.exponentialRampToValueAtTime(.0005, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02) }
  function hit(t, d, vol, hp) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + d); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .02) }
  function kick(t, v) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(v || .5, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16) }
  function play(i, t) {
    const nb = T.ch.length, bar = Math.floor(i / 16) % nb, s = i % 16, C = CH[T.ch[bar]], mel = T.mel[bar];
    // trống
    if (T.drum === 'pop') { if (s % 8 === 0 || s === 10) kick(t); if (s === 4 || s === 12) hit(t, .12, .22, 1800); if (s % 2 === 1) hit(t, .03, .06, 7000) }
    else if (T.drum === 'bounce') { if (s === 0 || s === 8) kick(t, .45); if (s === 4 || s === 12) hit(t, .07, .16, 2400); if (s % 4 === 2) hit(t, .03, .08, 8000) }
    else if (T.drum === 'disco') { if (s % 4 === 0) kick(t, .45); if (s === 4 || s === 12) hit(t, .1, .2, 2000); if (s % 4 === 2) hit(t, .08, .07, 6000); else if (s % 2 === 1) hit(t, .02, .04, 9000) }
    else { if (s % 8 === 0) kick(t, .55); if (s === 4 || s === 12) hit(t, .14, .26, 1500); else if ((bar % 2 === 1 && s >= 13) || s % 4 === 2) hit(t, .05, .1, 1800); if (s % 2 === 1) hit(t, .02, .05, 9000) }
    // bè trầm
    if (T.bass === 'walk') { if (s % 2 === 0) note(hz(C.b + (s % 4 === 2 ? 12 : 0) + (s === 14 ? 7 : 0)), t, S16 * 1.8, 'triangle', .17) }
    else if (T.bass === 'bounce') { if (s % 4 === 0) note(hz(C.b + (s % 8 === 4 ? 7 : 0)), t, S16 * 1.4, 'triangle', .19) }
    else { if (s % 2 === 0) { note(hz(C.b + (s === 6 || s === 14 ? 12 : 0)), t, S16 * 1.5, 'triangle', .17); note(hz(C.b + (s === 6 || s === 14 ? 12 : 0)), t, S16 * 1.1, .5, .02) } }
    // rải hợp âm / hợp âm nảy
    if (T.arp) note(hz(C.t[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]]), t, S16 * .9, .25, .018);
    if (T.stab && s % 4 === 2) C.t.slice(0, 3).forEach(m => note(hz(m), t, S16 * .8, .5, .012));
    // giai điệu chính (nốt móc đơn, H = ngân)
    if (s % 2 === 0) { const e = s / 2, m = mel[e]; if (m > 0) { let k = 1; while (e + k < 8 && mel[e + k] === H) k++; note(hz(m), t, S16 * 2 * k * T.st, T.duty, .05) } }
  }
  function tick() { while (next < ac.currentTime + .15) { play(step, next); next += S16; step = (step + 1) % (16 * T.ch.length) } }
  function start(force, track) {
    if (track && TRACKS[track] && track !== cur) { stop(); cur = track }
    if (playing || (!force && !pref())) return; playing = true;
    const url = CFG().music;
    if (url) { el = el || new Audio(url); el.loop = true; el.volume = .45 * lv; el.play().catch(() => { }); return }
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      if (!master) { master = ac.createGain(); master.connect(ac.destination); noise = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1 }
      T = TRACKS[cur]; S16 = 60 / T.bpm / 4;
      master.gain.setValueAtTime(.34 * lv, ac.currentTime); next = ac.currentTime + .05; step = 0; timer = setInterval(tick, 25);
    } catch (e) { playing = false }
  }
  function stop() { playing = false; clearInterval(timer); if (el) el.pause() }
  function duck(on) { lv = on ? .35 : 1; if (el) el.volume = .45 * lv; if (master && ac) master.gain.setTargetAtTime(.34 * lv, ac.currentTime, .2) }
  function toggle() { const v = !pref(); setPref(v); if (v) start(); else stop(); return v }
  return { start, stop, duck, toggle, pref, get playing() { return playing }, get track() { return cur } };
})();

/* ── xếp hạng: về đích trước → cao hơn → đúng nhiều hơn ── */
function rank(players) {
  return Object.entries(players || {}).sort((A, B) => {
    const a = A[1], b = B[1];
    if (a.score !== undefined || b.score !== undefined || a.st === 'submitted' || b.st === 'submitted' || a.st === 'playing' || b.st === 'playing') {
      const sA = a.score ?? 0, sB = b.score ?? 0;
      if (sB !== sA) return sB - sA;
      if ((b.ok || 0) !== (a.ok || 0)) return (b.ok || 0) - (a.ok || 0);
      if ((b.ans || 0) !== (a.ans || 0)) return (b.ans || 0) - (a.ans || 0);
      return (a.submittedAt || Infinity) - (b.submittedAt || Infinity);
    }
    if (!!a.tt !== !!b.tt) return a.tt ? -1 : 1;
    if (a.tt && b.tt) return a.tt - b.tt;
    return (b.alt || 0) - (a.alt || 0) || (b.ok || 0) - (a.ok || 0);
  });
}

/* ── kết nối nhiều máy ──
   Mặc định: máy chủ MQTT công cộng miễn phí (không cần tài khoản). Trang của cô = "trọng tài":
   học sinh gửi lên kênh /u, trang cô gom lại phát xuống kênh /d, ảnh chụp phòng giữ sẵn ở /s, câu hỏi ở /q.
   ?local=1 = thử trên 1 máy (BroadcastChannel). Có firebase trong config.js thì dùng Firebase. */
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được ' + src)); document.head.appendChild(s) }) }
async function makeNet() {
  const cfg = CFG().firebase;
  if (cfg && cfg.databaseURL) return fireNet(cfg);
  if (/[?&]local=1/.test(location.search) || CFG().mode === 'local') return localNet();
  return mqttNet();
}
/* cây dữ liệu dùng chung cho chế độ local + MQTT */
function makeTree() {
  const L = [], split = p => p.split('/').filter(Boolean), clone = v => v == null ? null : JSON.parse(JSON.stringify(v));
  const T = { root: {}, L, clone };
  T.get = p => { let n = T.root; for (const k of split(p)) { if (n == null || typeof n !== 'object') return null; n = n[k] } return n === undefined ? null : n };
  T.put = (p, v) => {
    const ks = split(p); if (!ks.length) { T.root = v || {}; return }
    let n = T.root; for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== 'object' || n[ks[i]] === null) n[ks[i]] = {}; n = n[ks[i]] }
    if (v == null) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = clone(v);
  };
  const related = (a, b) => { a = split(a); b = split(b); for (let i = 0; i < Math.min(a.length, b.length); i++)if (a[i] !== b[i]) return false; return true };
  T.notify = keys => L.slice().forEach(l => {
    if (l.t === 'v') { if (keys.some(k => related(l.p, k))) l.cb(clone(T.get(l.p))) }
    else { const kids = T.get(l.p) || {}; Object.keys(kids).forEach(k => { if (!l.seen.has(k)) { l.seen.add(k); l.cb(k, clone(kids[k])) } }) }
  });
  T.keys = op => op.k === 'set' ? [op.p] : Object.keys(op.v).map(s => op.p + '/' + s);
  T.apply = op => { if (op.k === 'set') T.put(op.p, op.v); else Object.keys(op.v).forEach(s => T.put(op.p + '/' + s, op.v[s])); T.notify(T.keys(op)) };
  T.on = (p, cb) => { const l = { t: 'v', p, cb }; L.push(l); cb(clone(T.get(p))); return () => L.splice(L.indexOf(l), 1) };
  T.onAdded = (p, cb) => { const l = { t: 'a', p, cb, seen: new Set() }; L.push(l); T.notify([p]); return () => L.splice(L.indexOf(l), 1) };
  return T;
}
const pushKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const randCode = d => String(d) + String(Math.floor(Math.random() * 1e5)).padStart(5, '0');

function localNet() {
  const ch = new BroadcastChannel('gc-local-db'), T = makeTree(), KEY = 'gc-local-db';
  try { T.root = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { }
  let saveT = 0, synced = false, gotFull = false;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(T.root)) } catch (e) { } }, 150) };
  const merge = (a, b) => { for (const k in b) a[k] = a[k] && b[k] && typeof a[k] === 'object' && typeof b[k] === 'object' ? merge(a[k], b[k]) : b[k]; return a };
  const send = op => { T.apply(op); save(); ch.postMessage({ op }); return Promise.resolve() };
  ch.onmessage = e => {
    const d = e.data;
    if (d.op) { T.apply(d.op); save() }
    else if (d.req && synced) ch.postMessage({ full: T.root });
    else if (d.full && !gotFull) { gotFull = true; T.root = merge(d.full, T.root); T.notify(['']) }
  };
  ch.postMessage({ req: 1 });
  const net = {
    mode: 'local', now: () => Date.now(), newCode: async () => randCode(1 + Math.floor(Math.random() * 9)), host: async () => { },
    set: (p, v) => send({ k: 'set', p, v }), update: (p, v) => send({ k: 'upd', p, v }),
    push: (p, v) => { const key = pushKey(); send({ k: 'set', p: p + '/' + key, v }); return { key } },
    remove: p => send({ k: 'set', p, v: null }), once: p => Promise.resolve(T.clone(T.get(p))),
    on: T.on, onAdded: T.onAdded, onDisconnect: () => { }, onConn: cb => cb(true)
  };
  return new Promise(ok => setTimeout(() => { synced = true; ok(net) }, 350));
}

async function mqttNet() {
  const LIBS = ['https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js'];
  for (const u of LIBS) { if (window.mqtt) break; try { await loadScript(u) } catch (e) { } }
  if (!window.mqtt) throw new Error('Không tải được bộ kết nối — kiểm tra mạng wifi rồi tải lại trang');
  const BROKERS = CFG().brokers || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const TP = 'hoctienganh-dnx/v1/', T = makeTree(), enc = s => JSON.stringify(s);
  // mã phòng bắt đầu 1–4 → máy chủ 0, 5–9 → máy chủ 1 (học sinh tự biết dùng máy chủ nào)
  const brokerOf = c => +c[0] >= 5 ? 1 : 0;
  let cl = null, code = '', hub = false, off = 0, gotS = false, gotQ = false, waiters = [], batch = [], dirty = false, connCb = null, timers = [], lastMsg = Date.now();
  const mine = {}, seen = {}, kicked = new Set();
  const roomOf = p => (p.match(/^rooms\/(\d{6})/) || [])[1];
  function connect(i) {
    return new Promise((ok, no) => {
      const c = mqtt.connect(BROKERS[i], { clientId: 'dnx_' + Math.random().toString(16).slice(2, 12), keepalive: 30, reconnectPeriod: 2000, connectTimeout: 8000, clean: true });
      const t = setTimeout(() => { c.end(true); no(new Error('timeout')) }, 9000);
      c.once('connect', () => { clearTimeout(t); ok(c) });
    });
  }
  const wake = () => { const w = waiters; waiters = []; w.forEach(f => f()) };
  function onMsg(topic, buf) {
    lastMsg = Date.now();
    const kind = topic.slice(-1), txt = new TextDecoder().decode(buf);
    if (!txt) { if (kind === 's') { T.put('rooms/' + code, null); gotS = gotQ = true; T.notify(['rooms/' + code]); wake() } return }
    let m; try { m = JSON.parse(txt) } catch (e) { return }
    if (m.t && !hub) off = m.t - Date.now();
    if (kind === 'q') { T.put('rooms/' + code + '/qs', m.qs); gotQ = true; T.notify(['rooms/' + code + '/qs']); wake() }
    else if (kind === 's' && hub) {   // trang cô lỡ tải lại: lấy lại phòng đang chơi (chỉ khi chưa có gì)
      if (!T.get('rooms/' + code + '/info') && m.tree) { const qs = T.get('rooms/' + code + '/qs'); T.put('rooms/' + code, m.tree); if (qs) T.put('rooms/' + code + '/qs', qs); T.notify(['rooms/' + code]); dirty = true }
      gotS = true; wake();
    }
    else if (kind === 's' && !hub) {   // ảnh chụp phòng: thay toàn bộ, rồi giữ lại các ghi chép của chính mình
      const qs = T.get('rooms/' + code + '/qs'); T.put('rooms/' + code, m.tree); if (qs) T.put('rooms/' + code + '/qs', qs);
      for (const p in mine) T.put(p, mine[p]);
      gotS = true; T.notify(['rooms/' + code]); wake();
    }
    else if (kind === 'd' && !hub) (m.ops || []).forEach(op => T.apply(op));
    else if (kind === 'u' && hub) (m.ops || []).forEach(op => {
      if (!op || typeof op.p !== 'string' || op.p.indexOf('rooms/' + code + '/') !== 0) return;
      const pm = op.p.match(/^rooms\/\d{6}\/players\/([^/]+)/); if (pm) { if (kicked.has(pm[1])) return; seen[pm[1]] = Date.now() }
      T.apply(op); batch.push(op); dirty = true;
    });
  }
  async function ensure(c, asHub) {
    if (!c) return;
    if (code === c && cl) { if (asHub && !hub) startHub(); return }
    if (cl) { timers.forEach(clearInterval); timers = []; cl.end(true); cl = null }
    code = c; hub = false; gotS = gotQ = false;
    try { cl = await connect(brokerOf(c)) } catch (e) { throw new Error('Không kết nối được máy chủ trò chơi — kiểm tra mạng wifi') }
    cl.on('message', onMsg);
    cl.on('connect', () => connCb && connCb(true)); cl.on('offline', () => connCb && connCb(false));
    cl.subscribe([TP + c + '/s', TP + c + '/q', TP + c + '/d']);
    lastMsg = Date.now();
    // người canh (máy học sinh): 8 giây không nghe tin gì từ phòng → nối lại ngay để đọc trạng thái mới nhất (VD: cô đã kết thúc)
    timers.push(setInterval(() => { if (!hub && cl && Date.now() - lastMsg > 8000) { lastMsg = Date.now(); try { cl.reconnect() } catch (e) { } } }, 3000));
    if (asHub) startHub();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cl && !hub) { lastMsg = Date.now(); try { cl.reconnect() } catch (e) { } } });   // mở lại màn hình / quay lại tab
  function snapshot() {
    const room = T.clone(T.get('rooms/' + code)); if (!room) return;
    delete room.qs;
    if (room.ev) { const ks = Object.keys(room.ev).sort(); ks.slice(0, Math.max(0, ks.length - 30)).forEach(k => { delete room.ev[k]; T.put('rooms/' + code + '/ev/' + k, null) }) }
    cl.publish(TP + code + '/s', enc({ t: Date.now(), tree: room }), { retain: true });
  }
  function flush() { if (batch.length) { cl.publish(TP + code + '/d', enc({ t: Date.now(), ops: batch })); batch = [] } }
  function startHub() {
    hub = true; gotQ = true; cl.unsubscribe(TP + code + '/d'); cl.subscribe(TP + code + '/u');
    setTimeout(() => { if (!gotS) { gotS = true; wake() } }, 1500);   // phòng mới: không có ảnh chụp cũ
    timers.push(setInterval(flush, 200));
    timers.push(setInterval(() => { if (dirty) { dirty = false; snapshot() } }, 3000));
    timers.push(setInterval(() => {   // em nào im lặng quá 15 giây → coi như đã thoát
      const P = T.get('rooms/' + code + '/players') || {}, now = Date.now();
      for (const id in P) { if (!seen[id]) seen[id] = now; if (P[id].on && now - seen[id] > 45000) hubWrite({ k: 'upd', p: 'rooms/' + code + '/players/' + id, v: { on: 0 } }) }
    }, 5000));
  }
  function hubWrite(op) {
    const r = 'rooms/' + code;
    T.apply(op); batch.push(op); dirty = true;
    const pm = op.p.match(/^rooms\/\d{6}\/players\/([^/]+)$/); if (pm && op.k === 'set' && op.v == null) kicked.add(pm[1]);
    if (op.p === r && op.v == null) {   // xoá phòng: xoá cả bản lưu sẵn trên máy chủ
      cl.publish(TP + code + '/s', '', { retain: true }); cl.publish(TP + code + '/q', '', { retain: true }); return;
    }
    if (op.p === r || op.p === r + '/qs') { const qs = T.get(r + '/qs'); if (qs) cl.publish(TP + code + '/q', enc({ qs }), { retain: true }); snapshot(); dirty = false }
    else if (op.p === r + '/info' || op.p.indexOf(r + '/ev/') === 0) { flush(); snapshot(); dirty = false }   // bắt đầu / kết thúc / sự kiện: gửi & lưu ngay, không chờ
  }
  async function write(op) {
    await ensure(roomOf(op.p));
    if (hub) return hubWrite(op);
    T.apply(op);
    if (op.k === 'set') mine[op.p] = op.v; else for (const s in op.v) mine[op.p + '/' + s] = op.v[s];
    cl.publish(TP + code + '/u', enc({ ops: [op] }));
  }
  return {
    mode: 'mqtt', now: () => Date.now() + off,
    newCode: async () => { for (let i = 0; i < BROKERS.length; i++) { try { (await connect(i)).end(true); return randCode(i ? 5 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 4)) } catch (e) { } } throw new Error('Không kết nối được máy chủ trò chơi — kiểm tra mạng wifi') },
    host: c => ensure(c, true),
    set: (p, v) => write({ k: 'set', p, v }), update: (p, v) => write({ k: 'upd', p, v }), remove: p => write({ k: 'set', p, v: null }),
    push: (p, v) => { const key = pushKey(); write({ k: 'set', p: p + '/' + key, v }); return { key } },
    once: async p => {
      await ensure(roomOf(p));
      const need = () => gotS && (!/\/qs/.test(p) || gotQ);
      if (!need()) await new Promise(ok => { const t = setTimeout(ok, 5000), f = () => { if (need()) { clearTimeout(t); ok() } else waiters.push(f) }; waiters.push(f) });
      return T.clone(T.get(p));
    },
    on: (p, cb) => { ensure(roomOf(p)).catch(() => { }); return T.on(p, cb) },
    onAdded: (p, cb) => { ensure(roomOf(p)).catch(() => { }); return T.onAdded(p, cb) },
    onDisconnect: () => { }, onConn: cb => { connCb = cb; cb(true) }
  };
}

async function fireNet(cfg) {
  const V = '10.12.2';
  await loadScript('https://www.gstatic.com/firebasejs/' + V + '/firebase-app-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/' + V + '/firebase-database-compat.js');
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg), db = firebase.database(app);
  let off = 0; db.ref('.info/serverTimeOffset').on('value', s => off = s.val() || 0);
  return {
    mode: 'firebase', now: () => Date.now() + off, host: async () => { },
    newCode: async () => { for (; ;) { const c = randCode(1 + Math.floor(Math.random() * 9)); if (!(await db.ref('rooms/' + c + '/info').once('value')).val()) return c } },
    set: (p, v) => db.ref(p).set(v), update: (p, v) => db.ref(p).update(v), push: (p, v) => db.ref(p).push(v), remove: p => db.ref(p).remove(),
    once: p => db.ref(p).once('value').then(s => s.val()),
    on: (p, cb) => { const r = db.ref(p), h = s => cb(s.val()); r.on('value', h); return () => r.off('value', h) },
    onAdded: (p, cb) => { const r = db.ref(p), h = s => cb(s.key, s.val()); r.on('child_added', h); return () => r.off('child_added', h) },
    onDisconnect: (p, v) => db.ref(p).onDisconnect().update(v),
    onConn: cb => db.ref('.info/connected').on('value', s => cb(!!s.val()))
  };
}


/* ═════ THƯ VIỆN ĐỀ THI CHUNG & LINK RÚT GỌN (COMMUNITY LIBRARY) ═════ */
const COMM_STORE_KEY = 'msnenet_community_library';

function getLocalCommunity() {
  try { return JSON.parse(localStorage.getItem(COMM_STORE_KEY) || '[]'); } catch (e) { return []; }
}

function saveLocalCommunity(list) {
  try { localStorage.setItem(COMM_STORE_KEY, JSON.stringify(list)); } catch (e) {}
}

async function saveCommunityQuiz(quiz) {
  if (!quiz.id) {
    quiz.id = 'MN-' + (Math.floor(1000 + Math.random() * 9000));
  }
  quiz.title = (quiz.title || '').trim() || (quiz.type === 'test' || quiz.m === 'test' ? 'Bài kiểm tra tiếng Anh' : 'Bài ôn tập tiếng Anh');
  quiz.type = quiz.type || (quiz.m === 'test' ? 'test' : 'game');
  quiz.m = quiz.m || (quiz.type === 'test' ? 'test' : 'climb');
  quiz.date = quiz.date || new Date().toLocaleDateString('vi-VN');
  quiz.author = (quiz.author || '').trim() || (window.GAME_CONFIG && window.GAME_CONFIG.teacher) || 'Cô Chí Nên';

  // 1. Lưu local cache
  const list = getLocalCommunity();
  const existingIdx = list.findIndex(q => q.id === quiz.id);
  if (existingIdx >= 0) list[existingIdx] = quiz;
  else list.unshift(quiz);
  saveLocalCommunity(list);

  // 2. Đồng bộ Firebase nếu có cấu hình
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    try {
      const url = cfg.firebase.databaseURL.replace(/\/$/, '') + '/community_quizzes/' + quiz.id + '.json';
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quiz) });
    } catch (e) { console.warn('Firebase sync warning:', e); }
  }
  return quiz;
}

async function getCommunityLibrary() {
  // Bắt đầu với các bộ đề mẫu có sẵn
  const bundled = [];
  if (window.SAMPLE_SETS) {
    window.SAMPLE_SETS.forEach((s, idx) => {
      bundled.push({
        id: idx === 0 ? 'MN-ENG7' : 'MN-IELTS7',
        title: s.title,
        author: 'Ms Nenet English',
        date: 'Có sẵn',
        qs: s.raw ? s.raw.map(fromOld) : [],
        isBundled: true
      });
    });
  }

  let cloudList = [];
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    try {
      const url = cfg.firebase.databaseURL.replace(/\/$/, '') + '/community_quizzes.json';
      const res = await fetch(url);
      const data = await res.json();
      if (data && typeof data === 'object') {
        cloudList = Object.values(data);
      }
    } catch (e) { console.warn('Firebase fetch warning:', e); }
  }

  const localList = getLocalCommunity();

  // Gộp danh sách: cloudList + localList + bundled (tránh trùng id)
  const map = new Map();
  bundled.forEach(q => map.set(q.id, q));
  cloudList.forEach(q => map.set(q.id, q));
  localList.forEach(q => map.set(q.id, q));

  return Array.from(map.values());
}

async function getQuizById(id) {
  if (!id) return null;
  id = String(id).trim().toUpperCase();

  // Kiểm tra bundled
  if (id === 'MN-ENG7' && window.SAMPLE_SETS && window.SAMPLE_SETS[0]) {
    const s = window.SAMPLE_SETS[0];
    return { id, title: s.title, author: 'Ms Nenet English', qs: s.raw.map(fromOld) };
  }
  if (id === 'MN-IELTS7' && window.SAMPLE_SETS && window.SAMPLE_SETS[1]) {
    const s = window.SAMPLE_SETS[1];
    return { id, title: s.title, author: 'Ms Nenet English', qs: s.raw.map(fromOld) };
  }

  // Kiểm tra local
  const localList = getLocalCommunity();
  const foundLocal = localList.find(q => q.id.toUpperCase() === id);
  if (foundLocal) return foundLocal;

  // Kiểm tra Firebase
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    try {
      const url = cfg.firebase.databaseURL.replace(/\/$/, '') + '/community_quizzes/' + id + '.json';
      const res = await fetch(url);
      const data = await res.json();
      if (data) return data;
    } catch (e) {}
  }
  return null;
}

/* ═════ SỔ ĐIỂM BÀI TẬP VỀ NHÀ (HOMEWORK GRADEBOOK) ═════ */
const HW_META_KEY = 'msnenet_hw_meta';
const HW_SUBS_KEY = 'msnenet_hw_subs';

function getLocalHwMetas() {
  try { return JSON.parse(localStorage.getItem(HW_META_KEY) || '{}'); } catch (e) { return {}; }
}
function saveLocalHwMetas(obj) {
  try { localStorage.setItem(HW_META_KEY, JSON.stringify(obj)); } catch (e) {}
}
function getLocalHwSubs() {
  try { return JSON.parse(localStorage.getItem(HW_SUBS_KEY) || '{}'); } catch (e) { return {}; }
}
function saveLocalHwSubs(obj) {
  try { localStorage.setItem(HW_SUBS_KEY, JSON.stringify(obj)); } catch (e) {}
}

async function saveHwMeta(meta) {
  if (!meta || !meta.id) return;
  const item = {
    id: String(meta.id).trim(),
    title: meta.title || 'Bài tập về nhà',
    m: meta.m || 'climb',
    dur: meta.dur || 0,
    dl: meta.dl || 0,
    createdAt: meta.createdAt || Date.now(),
    date: stamp(meta.createdAt || Date.now())
  };
  const metas = getLocalHwMetas();
  metas[item.id] = Object.assign(metas[item.id] || {}, item);
  saveLocalHwMetas(metas);

  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    try {
      const url = cfg.firebase.databaseURL.replace(/\/$/, '') + '/hw_meta/' + encodeURIComponent(item.id) + '.json';
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    } catch (e) { console.warn('saveHwMeta sync warn:', e); }
  }
  return item;
}

async function submitHwResult(hwId, entry) {
  if (!hwId || !entry || !entry.n) return;
  hwId = String(hwId).trim();
  const subId = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const rec = {
    id: subId,
    hwId,
    title: entry.title || 'Bài tập tiếng Anh',
    n: entry.n,
    score: entry.score ?? 0,
    ok: entry.ok ?? 0,
    ans: entry.ans ?? 0,
    tot: entry.tot ?? 0,
    m: entry.m || 'climb',
    durText: entry.durText || '00:00',
    at: Date.now(),
    date: stamp(Date.now())
  };

  // 1. Lưu local
  const allSubs = getLocalHwSubs();
  if (!allSubs[hwId]) allSubs[hwId] = {};
  allSubs[hwId][subId] = rec;
  saveLocalHwSubs(allSubs);

  const metas = getLocalHwMetas();
  if (!metas[hwId]) {
    metas[hwId] = { id: hwId, title: rec.title, m: rec.m, createdAt: rec.at, date: rec.date };
    saveLocalHwMetas(metas);
  }

  // 2. Đồng bộ Firebase
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    const base = cfg.firebase.databaseURL.replace(/\/$/, '');
    try {
      await fetch(base + '/hw_subs/' + encodeURIComponent(hwId) + '/' + subId + '.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec)
      });
      await fetch(base + '/hw_meta/' + encodeURIComponent(hwId) + '.json', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hwId, title: rec.title, m: rec.m, updatedAt: rec.at, date: rec.date })
      });
    } catch (e) { console.warn('submitHwResult firebase warn:', e); }
  }
  return rec;
}

async function getHwGradebook() {
  const metas = Object.assign({}, getLocalHwMetas());
  const subsByHw = {};
  const localSubs = getLocalHwSubs();
  for (const [hid, map] of Object.entries(localSubs)) {
    subsByHw[hid] = Object.assign({}, map || {});
  }

  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    const base = cfg.firebase.databaseURL.replace(/\/$/, '');
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(base + '/hw_meta.json').then(r => r.json()).catch(() => null),
        fetch(base + '/hw_subs.json').then(r => r.json()).catch(() => null)
      ]);
      if (mRes && typeof mRes === 'object') {
        for (const [k, v] of Object.entries(mRes)) {
          if (v && typeof v === 'object') metas[k] = Object.assign(metas[k] || {}, v);
        }
      }
      if (sRes && typeof sRes === 'object') {
        for (const [hid, map] of Object.entries(sRes)) {
          if (map && typeof map === 'object') {
            if (!subsByHw[hid]) subsByHw[hid] = {};
            Object.assign(subsByHw[hid], map);
          }
        }
      }
    } catch (e) { console.warn('getHwGradebook warn:', e); }
  }

  // Đảm bảo mọi hwId có bài nộp đều nằm trong danh sách metas
  for (const [hid, map] of Object.entries(subsByHw)) {
    const arr = Object.values(map || {});
    if (arr.length && !metas[hid]) {
      metas[hid] = { id: hid, title: arr[0].title || ('Bài tập ' + hid), m: arr[0].m || 'test', createdAt: arr[0].at || Date.now() };
    }
  }

  const list = Object.values(metas).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const sortedSubs = {};
  for (const [hid, map] of Object.entries(subsByHw)) {
    sortedSubs[hid] = Object.values(map || {}).sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.ok ?? 0) - (a.ok ?? 0) || (a.at || 0) - (b.at || 0));
  }
  return { list, subsByHw: sortedSubs };
}

/* ═════ XUẤT PHIẾU ĐIỂM GỬI PHỤ HUYNH (PARENT REPORT CARD) ═════ */
function showReportCard(data) {
  data = data || {};
  const name = data.name || 'Học sinh';
  const title = data.title || 'Bài kiểm tra tiếng Anh';
  const score = Math.round(data.score ?? 0);
  const ok = data.ok ?? 0;
  const tot = data.tot ?? 1;
  const modeName = data.modeName || (data.m === 'test' ? '📝 Bài kiểm tra khảo thí' : '🎮 Game ôn tập');
  const timeText = data.timeText || 'Hoàn thành';
  const dateText = data.dateText || stamp(Date.now());
  const teacher = data.teacher || 'Cô Chí Nên (Ms Nenet English)';

  const cv = document.createElement('canvas');
  cv.width = 1080;
  cv.height = 760;
  const ctx = cv.getContext('2d');

  // 1. Nền Gradient sang trọng
  const bg = ctx.createLinearGradient(0, 0, 1080, 760);
  bg.addColorStop(0, '#f5f0ff');
  bg.addColorStop(0.5, '#fff5f9');
  bg.addColorStop(1, '#eef8ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 760);

  // Hoạ tiết trang trí góc
  ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
  ctx.beginPath(); ctx.arc(980, 90, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(236, 72, 153, 0.07)';
  ctx.beginPath(); ctx.arc(100, 680, 190, 0, Math.PI * 2); ctx.fill();

  // Khung viền đôi
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, 1024, 704);
  ctx.strokeStyle = '#ddd6fe';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1000, 680);

  // Header Banner
  const hGrad = ctx.createLinearGradient(60, 60, 1020, 150);
  hGrad.addColorStop(0, '#6d28d9');
  hGrad.addColorStop(1, '#db2777');
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.roundRect(65, 65, 950, 92, 22);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 28px "Nunito", "Segoe UI", sans-serif';
  ctx.fillText('🌟 PHIẾU BÁO KẾT QUẢ HỌC TẬP · MS NENET ENGLISH 🌟', 540, 112);
  ctx.font = '700 17px "Nunito", "Segoe UI", sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(modeName + '  ·  Ngày: ' + dateText, 540, 142);

  // Thông tin học sinh & bài học
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e1b4b';
  ctx.font = '900 34px "Nunito", "Segoe UI", sans-serif';
  ctx.fillText('👤 Học sinh: ' + name, 80, 220);

  ctx.fillStyle = '#4c1d95';
  ctx.font = '800 24px "Nunito", "Segoe UI", sans-serif';
  const shortTitle = title.length > 52 ? title.slice(0, 50) + '…' : title;
  ctx.fillText('📘 Bài: ' + shortTitle, 80, 268);

  // 3 Ô thống kê lớn
  const boxes = [
    { label: 'ĐIỂM SỐ (THANG 100)', val: score + ' / 100', bg: '#f5f3ff', bd: '#c4b5fd', col: '#6d28d9' },
    { label: 'SỐ CÂU ĐÚNG', val: ok + ' / ' + tot + ' câu', bg: '#ecfdf5', bd: '#6ee7b7', col: '#047857' },
    { label: 'THỜI GIAN HOÀN THÀNH', val: timeText, bg: '#eff6ff', bd: '#93c5fd', col: '#1d4ed8' }
  ];
  boxes.forEach((b, idx) => {
    const bx = 80 + idx * 315;
    const by = 305;
    ctx.fillStyle = b.bg;
    ctx.strokeStyle = b.bd;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx, by, 290, 145, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '800 15px "Nunito", "Segoe UI", sans-serif';
    ctx.fillText(b.label, bx + 145, by + 42);

    ctx.fillStyle = b.col;
    ctx.font = '900 38px "Nunito", "Segoe UI", sans-serif';
    ctx.fillText(b.val, bx + 145, by + 105);
  });

  // Hộp Nhận xét của Giáo viên
  ctx.fillStyle = '#fffbeb';
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(80, 480, 920, 140, 20);
  ctx.fill();
  ctx.stroke();

  const stars = score >= 90 ? '⭐⭐⭐⭐⭐ XUẤT SẮC' : score >= 75 ? '⭐⭐⭐⭐⭐ TỐT' : score >= 50 ? '⭐⭐⭐⭐ ĐẠT YÊU CẦU' : '⭐⭐⭐ CẦN CỐ GẮNG';
  const remark = score >= 90
    ? 'Con nắm vững kiến thức và hoàn thành bài xuất sắc! Cô rất tự hào về con!'
    : score >= 75
    ? 'Con làm bài rất cẩn thận và đạt kết quả tốt. Hãy phát huy ở các bài tiếp theo nhé!'
    : score >= 50
    ? 'Con đã hoàn thành bài tập. Hãy xem kỹ lại lời giải các câu sai để bứt phá điểm 9, 10 nhé!'
    : 'Con cần ôn tập lại từ vựng & ngữ pháp của bài này và làm lại để nắm chắc kiến thức hơn nhé!';

  ctx.textAlign = 'left';
  ctx.fillStyle = '#b45309';
  ctx.font = '900 22px "Nunito", "Segoe UI", sans-serif';
  ctx.fillText('💬 Nhận xét của Giáo viên:   ' + stars, 108, 525);

  ctx.fillStyle = '#1e293b';
  ctx.font = '700 21px "Nunito", "Segoe UI", sans-serif';
  ctx.fillText('“' + remark + '”', 108, 575);

  // Footer chữ ký
  ctx.textAlign = 'between';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 18px "Nunito", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🌐 Hệ thống học & khảo thí trực tuyến Ms Nenet English', 80, 675);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#5b21b6';
  ctx.font = '900 20px "Nunito", "Segoe UI", sans-serif';
  ctx.fillText('👩‍🏫 Giáo viên: ' + teacher, 1000, 675);

  const dataUrl = cv.toDataURL('image/png');

  // Hiển thị Modal xem trước & tải/copy ảnh
  let modal = document.getElementById('ovReportCard');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ovReportCard';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(20,14,40,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px;max-width:720px;width:100%;padding:20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35);border:3px solid #ddd6fe">
      <div style="font-weight:900;font-size:22px;color:#2d2350;margin-bottom:4px">🏅 Phiếu Báo Điểm Gửi Phụ Huynh</div>
      <div style="font-size:13px;color:#64748b;font-weight:700;margin-bottom:12px">Bấm <b>Copy ảnh</b> rồi nhấn <b>Ctrl + V</b> trực tiếp vào khung chat Zalo để gửi ngay!</div>
      <img src="${dataUrl}" style="width:100%;max-height:58vh;object-fit:contain;border-radius:14px;border:2px solid #e2e8f0;box-shadow:0 4px 14px rgba(0,0,0,.08)">
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        <button id="bRcCopyImg" style="background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:14px;padding:11px 20px;font-weight:900;font-size:15px;cursor:pointer">📋 Copy ảnh dán Zalo</button>
        <button id="bRcDownloadImg" style="background:linear-gradient(180deg,#10b981,#059669);color:#fff;border:none;border-radius:14px;padding:11px 20px;font-weight:900;font-size:15px;cursor:pointer">📥 Tải ảnh phiếu điểm (.png)</button>
        <button id="bRcClose" style="background:#f1f5f9;color:#334155;border:2px solid #cbd5e1;border-radius:14px;padding:11px 20px;font-weight:800;font-size:15px;cursor:pointer">Đóng</button>
      </div>
    </div>
  `;

  document.getElementById('bRcClose').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('bRcDownloadImg').onclick = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'Phieu-diem-' + clean(name).replace(/\s+/g, '-') + '.png';
    a.click();
    toast('📥 Đã tải ảnh phiếu điểm về máy!', 2500);
  };
  document.getElementById('bRcCopyImg').onclick = async () => {
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('✅ Đã copy ảnh phiếu điểm! Hãy mở Zalo và nhấn Ctrl + V để gửi!', 3500);
    } catch (e) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'Phieu-diem-' + clean(name).replace(/\s+/g, '-') + '.png';
      a.click();
      toast('📥 Trình duyệt tự động tải ảnh phiếu điểm để gửi Zalo!', 3000);
    }
  };
}

  return { $, shuffle, pick, clamp, esc, fmt, stamp, clean, rng, COLORS, BADGE, safe, normAns, checkTextAns, fromOld, prep, parseCSV, rowsToQs, parseText, parsePaste, sheetSets, sheetSet, sampleSet, packHw, unpackHw, tone, sfx, confetti, toast, rank, makeNet, music, saveCommunityQuiz, getCommunityLibrary, getQuizById, saveHwMeta, submitHwResult, getHwGradebook, showReportCard };
})();
