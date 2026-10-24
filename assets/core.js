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
  const isSpeaking = x.type === 'speaking' || !!x.targetText;
  const isText = !isSpeaking && (x.type === 'text' || (!!x.ansText && (!o || o.length < 2)));
  return {
    type: isSpeaking ? 'speaking' : isText ? 'text' : 'mc',
    q: qText,
    targetText: x.targetText || (isSpeaking ? (x.ansText || (o && o[0]) || qText) : ''),
    ipa: x.ipa || '',
    o: isSpeaking || isText ? [] : o,
    a: isSpeaking || isText ? 0 : a,
    ansText: isSpeaking ? (x.targetText || x.ansText || '') : (x.ansText || ''),
    e: x.explanation || x.exp || x.vnt || x.e || '',
    s: (x.type && x.type !== 'text' && x.type !== 'mc' && x.type !== 'speaking' ? x.type : '') || x.sec || x.s || (isSpeaking ? 'Speaking / Pronunciation' : '')
  };
}
function prep(list, noShuffle) {   // trước khi chơi: bỏ câu hỏng, làm sạch, xáo đáp án 1 lần
  return (list || []).filter(x => {
    if (!x || !x.q) return false;
    if (x.type === 'speaking' || x.targetText) return !!clean(x.targetText || x.ansText || x.q || '');
    if (x.type === 'text' || (x.ansText && (!x.o || x.o.length < 2))) return !!clean(x.ansText || (x.o && x.o[0]) || '');
    return x.o && x.o.length >= 2 && x.a >= 0 && x.a < x.o.length;
  }).map((x, i) => {
    if (x.type === 'speaking' || x.targetText) {
      const target = clean((x.targetText || x.ansText || x.q || '').replace(/<[^>]+>/g, ''));
      return {
        n: i + 1,
        type: 'speaking',
        q: safe(x.q),
        targetText: target,
        ipa: x.ipa ? esc(x.ipa) : '',
        s: esc(x.s || 'Speaking / Pronunciation'),
        passage: x.passage ? safe(x.passage) : '',
        audio: x.audio ? esc(x.audio) : '',
        img: x.img ? esc(x.img) : '',
        o: [],
        a: 0,
        ansText: target,
        e: safe(x.e || '')
      };
    }
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
  let activePassage = '';
  let inPassage = false;

  const flush = () => {
    if (!cur) return;
    const passageVal = cur.passage || activePassage || '';
    if (cur.type === 'speaking' || cur.isSpeaking) {
      out.push({
        type: 'speaking',
        q: nl(cur.q || 'Listen to the sample audio and read aloud clearly:'),
        targetText: clean(cur.targetText || cur.key || cur.q || ''),
        ipa: clean(cur.ipa || ''),
        o: [],
        a: 0,
        ansText: clean(cur.targetText || cur.key || cur.q || ''),
        e: nl(cur.e),
        s: 'Speaking / Pronunciation',
        passage: passageVal,
        audio: cur.audio || '',
        img: cur.img || ''
      });
      cur = null;
      return;
    }
    if (cur.q && cur.o.length === 0 && cur.key) {
      out.push({ type: 'text', q: nl(cur.q), ansText: clean(cur.key), o: [], a: 0, e: nl(cur.e), s: 'Tự luận / Điền từ', passage: passageVal });
      cur = null;
      return;
    }
    if (cur.a < 0 && cur.key) cur.a = ansIndex(cur.key, cur.o);
    if (!cur.q || cur.o.length < 2 || cur.a < 0) errs.push('Câu ' + (out.length + errs.length + 1) + ' (“' + cur.q.slice(0, 40) + '…”): ' + (cur.o.length < 2 ? 'chưa đủ phương án (hoặc thêm dòng "Đáp án: ..." cho câu điền từ/tự luận)' : 'chưa đánh dấu đáp án đúng (* hoặc dòng "Đáp án: B")'));
    else out.push({ type: 'mc', q: nl(cur.q), o: cur.o.map(nl), a: cur.a, e: nl(cur.e), s: '', passage: passageVal });
    cur = null;
  };
  const OPT = /^\s*(\*?)\s*\(?([A-Da-d])[.)]\s*(.*?)\s*(\*?)\s*$/;
  clean(t.replace(/\r/g, '').replace(/\n/g, '\u0001')).split('\u0001').forEach(raw => {
    let line = raw.trim(); if (!line) return;
    let parts = [line];
    if (/^\*?\s*\(?A[.)]/i.test(line) && /\s\*?\(?[B-D][.)]\s/i.test(line)) parts = line.split(/\s+(?=\*?\(?[B-Db-d][.)]\s)/);
    parts.forEach(p => {
      let m;
      // Nhận diện đoạn văn đọc hiểu: [Đoạn văn] / [Passage] / Đoạn văn: / Passage: / [Bài đọc]
      if ((m = p.match(/^\[?(?:đoạn\s*văn|doan\s*van|reading\s*passage|passage|bài\s*đọc|bai\s*doc)\]?\s*[:：]?\s*(.*)$/i))) {
        flush();
        inPassage = true;
        activePassage = m[1].trim();
        return;
      }

      // Nhận diện bắt đầu câu hỏi mới (kết thúc vùng thu thập đoạn văn nếu có)
      const isQuestionStart = /^(?:(?:câu|question)?\s*(?:\d+\s*[.:)]\s*)+)|^(?:spk|speaking|phát âm|phat am|nói|speak)\s*[:：]/i.test(p);
      if (inPassage && isQuestionStart) {
        inPassage = false;
      }
      if (inPassage) {
        activePassage = (activePassage ? activePassage + '\n' : '') + p;
        return;
      }

      // Nhận diện mẫu dán: 1. SPK: từ / SPK: từ / 1. Speaking: từ / 1. Phát âm: từ
      if ((m = p.match(/^(?:(?:câu|question)?\s*(?:\d+\s*[.:)]\s*)+)?(?:spk|speaking|phát âm|phat am|nói|speak)\s*[:：]\s*(.+)$/i))) {
        flush();
        const target = m[1].trim();
        cur = {
          type: 'speaking',
          q: 'Listen to the sample audio and read aloud clearly:',
          targetText: target,
          ipa: '',
          e: '',
          key: target,
          o: [],
          a: 0,
          passage: activePassage
        };
        return;
      }
      if (cur && cur.type === 'speaking') {
        if ((m = p.match(/^(ipa|phiên âm|phien am)\s*[:：]\s*(.+)$/i))) {
          cur.ipa = m[2].trim();
          return;
        }
        if ((m = p.match(/^(mẹo|meo|tips|tip|giải thích|lời giải|explain|explanation)\s*[:：]\s*(.*)$/i))) {
          cur.e = m[2].trim();
          cur.inE = true;
          return;
        }
        if ((m = p.match(/^(yêu cầu|chỉ dẫn|prompt|instruction)\s*[:：]\s*(.+)$/i))) {
          cur.q = m[2].trim();
          return;
        }
      }
      if ((m = p.match(/^(đáp án|dap an|answer|key)\s*[:：]\s*(.+)$/i))) { if (cur) cur.key = m[2]; return }
      if ((m = p.match(/^(giải thích|lời giải|explain|explanation)\s*[:：]\s*(.*)$/i))) { if (cur) cur.e = m[2]; cur && (cur.inE = true); return }
      if (cur && !cur.inE && (m = p.match(OPT)) && 'ABCD'.indexOf(m[2].toUpperCase()) === cur.o.length) {
        cur.o.push(m[3].replace(/\s*\((đúng|correct)\)\s*$/i, '')); if (m[1] || m[4] || /\((đúng|correct)\)\s*$/i.test(m[3])) cur.a = cur.o.length - 1; return;
      }
      if (cur && cur.inE && /^(câu|question)?\s*\d+\s*[.:)]\s*\S/i.test(p)) flush();
      if (cur && cur.inE) { cur.e += '\n' + p; return }
      if (cur && cur.o.length) flush();
      if (!cur) cur = { q: p.replace(/^(câu|question)?\s*(?:\d+\s*[.:)]\s*)+/i, ''), o: [], a: -1, e: '', key: '', passage: activePassage };
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
/* hiệu ứng âm thanh từ file (giải mã sẵn bằng Web Audio → phát tức thì, chồng nhau được) */
const SB = {};
function sfxFiles(map) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)() } catch (e) { return }
  for (const k in map) if (!(k in SB)) { SB[k] = null; const m = map[k]; fetch(m.src).then(r => r.arrayBuffer()).then(b => AC.decodeAudioData(b)).then(buf => { SB[k] = { buf, a: m.a || 0, d: m.d, vol: m.vol || .5 } }).catch(() => { delete SB[k] }) }
}
function playBuf(k) {
  const s = SB[k]; if (!s) return false;
  try { if (AC.state === 'suspended') AC.resume(); const src = AC.createBufferSource(), g = AC.createGain(); src.buffer = s.buf; g.gain.value = s.vol; src.connect(g); g.connect(AC.destination); src.start(0, s.a, s.d); return true } catch (e) { return false }
}
function sfx(k) {
  if (k in SB) { if (playBuf(k)) return; k = { mjump: 'jump', mpipe: 'pipe', mdeath: 'fall', tshot: 'fireball', bplace: 'bump', bboom: 'boom', bdie: 'hurt', bitem: 'grow', pdie: 'fall', pfruit: 'coin', tjump: 'jump', troar: 'roar', tscore: 'flag', tscream: 'fall', tsplat: 'hurt', tswish: 'pop', twoosh: 'pop', bdeath: 'fall' }[k] || k }   // file chưa tải xong → dùng tiếng 8-bit
  if (k === 'jump') tone(420, .14, 'square', .05, 760);
  else if (k === 'swim') tone(520, .09, 'square', .04, 760);
  else if (k === 'kick') tone(240, .09, 'square', .09, 560);
  else if (k === 'cannon') tone(120, .28, 'sawtooth', .12, 45);
  else if (k === 'thud') { tone(90, .22, 'square', .14, 35); tone(60, .3, 'triangle', .12, 30) }
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
/* copy chạy được cả trên trang http:// (navigator.clipboard chỉ có ở https) */
function copyText(t) {
  const old = () => { const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(a); a.focus(); a.select(); a.setSelectionRange(0, t.length); let ok = false; try { ok = document.execCommand('copy') } catch (e) { } a.remove(); return ok };
  if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(() => { if (!old()) throw 0 });
  return old() ? Promise.resolve() : Promise.reject();
}
function copy(t, ok, ask) { return copyText(t).then(() => toast(ok, 2600)).catch(() => prompt(ask || 'Copy:', t)) }
function toast(s, ms) { const t = $('toast'); if (!t) return; t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2200) }

/* ── nhạc nền 8-bit tự soạn: mỗi game một bản (16 ô nhịp, đoạn A + đoạn B) · hoặc file mp3 trong config.music ──
   climb: phiêu lưu Rê trưởng · brick: tưng tưng nhún nhảy Đô trưởng · tank: hành khúc La thứ */
const music = (function () {
  const PREF = 'gMusic', H = -1;   // H = ngân tiếp nốt trước
  const CH = {
    D: { b: 50, t: [62, 66, 69, 74] }, A: { b: 45, t: [61, 64, 69, 73] }, Bm: { b: 47, t: [59, 62, 66, 71] }, G: { b: 43, t: [59, 62, 67, 71] }, Em: { b: 40, t: [59, 64, 67, 71] },
    C: { b: 48, t: [60, 64, 67, 72] }, F: { b: 41, t: [60, 65, 69, 72] }, Am: { b: 45, t: [57, 60, 64, 69] }, E: { b: 40, t: [56, 59, 64, 68] }, Dm: { b: 50, t: [62, 65, 69, 74] },
    Bb: { b: 46, t: [58, 62, 65, 70] }, Gm: { b: 43, t: [58, 62, 67, 70] }
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
    breeze: { bpm: 112, duty: .5, drum: 'soft', bass: 'walk', arp: true, stab: false, st: .88,   // êm dịu, đi dạo — 32 ô nhịp mới lặp lại (≈ 70 giây)
      ch: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'C', 'G', 'Am', 'F', 'Dm', 'G', 'C', 'C', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'G'],
      mel: [[72, H, 76, H, 79, H, 76, H], [74, H, 71, H, 74, 76, 74, H], [72, H, 69, H, 72, 76, 79, H], [77, H, H, 76, 74, H, 72, H],
        [76, H, 79, H, 84, H, 79, H], [81, H, 79, 77, 76, H, 74, H], [72, H, 74, 76, 77, H, 81, H], [79, H, H, H, 0, 0, 0, 0],
        [72, H, 76, H, 79, H, 76, H], [74, H, 71, H, 74, 76, 74, H], [72, H, 69, H, 72, 76, 81, H], [81, H, 79, H, 77, H, 76, H],
        [74, H, 77, H, 81, H, 77, H], [79, H, 77, 76, 74, H, 71, H], [72, H, 76, 79, 84, H, 79, H], [72, H, H, H, 0, 0, 0, 0],
        [81, H, 84, H, 81, H, 77, H], [79, H, 83, H, 86, H, 83, H], [79, H, 76, H, 71, H, 76, H], [81, H, H, 79, 76, H, 72, H],
        [77, 79, 81, H, 84, H, 81, H], [83, H, 81, 79, 77, H, 74, H], [76, H, 79, H, 72, H, 76, H], [79, H, H, H, 0, 0, 76, 79],
        [81, H, 79, H, 76, H, 72, H], [77, H, 76, H, 74, H, 72, H], [76, H, 79, H, 84, H, 83, 81], [79, H, H, H, 74, H, 76, 77],
        [76, H, 72, H, 69, H, 72, H], [74, H, 77, H, 81, H, 77, H], [79, H, 77, H, 76, H, 74, H], [71, H, 74, H, 77, H, 79, H]] },
    pac: { bpm: 148, duty: .25, drum: 'bounce', bass: 'bounce', arp: false, stab: true, st: .6,   // Pac-Man: vui nhộn tự soạn
      ch: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
      mel: [[72, 76, 79, 84, 79, 76, 72, 0], [69, 72, 76, 81, 76, 72, 69, 0], [77, H, 76, 74, 72, H, 74, 76], [79, H, 0, 74, 79, H, 83, H],
        [84, 83, 81, 79, 76, H, 79, H], [81, H, 76, H, 72, 74, 76, H], [77, 76, 74, H, 77, 81, 86, H], [83, H, 79, H, 74, H, 71, H],
        [81, 84, 81, 77, 72, H, 77, H], [83, 86, 83, 79, 74, H, 79, H], [79, 83, 79, 76, 71, H, 76, H], [76, 81, 84, H, 81, H, 76, H],
        [77, 81, 84, 81, 89, H, 84, H], [86, H, 83, H, 79, 81, 83, H], [84, H, 79, H, 76, H, 79, H], [84, H, H, H, 0, 0, 79, 83]] },
    pacpow: { bpm: 176, duty: .125, drum: 'disco', bass: 'drive', arp: true, stab: false, st: .5,   // ăn viên năng lượng: dồn dập
      ch: ['Am', 'F', 'G', 'E'],
      mel: [[81, 84, 81, 84, 81, 84, 88, H], [77, 81, 77, 81, 77, 81, 84, H], [79, 83, 79, 83, 79, 83, 86, H], [80, 83, 80, 83, 88, H, 86, 83]] },
    race: { bpm: 160, duty: .25, drum: 'disco', bass: 'drive', arp: false, stab: true, st: .7,   // Đua xe: sôi động tự soạn
      ch: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'F', 'G', 'Em', 'Am', 'F', 'G', 'E', 'E'],
      mel: [[81, H, 76, 81, 84, H, 83, 81], [77, H, 72, 77, 81, H, 79, 77], [76, 79, 84, H, 79, H, 76, H], [74, H, 79, H, 83, H, 86, H],
        [88, H, 84, 81, 76, H, 81, H], [84, H, 81, 77, 72, H, 77, H], [79, 83, 86, H, 83, 79, 74, H], [76, H, 80, H, 83, H, 88, H],
        [81, 84, 89, H, 84, 81, 77, H], [83, 86, 91, H, 86, 83, 79, H], [79, 83, 88, H, 83, 79, 76, H], [81, 84, 88, H, 93, H, 88, H],
        [89, H, 88, 86, 84, H, 81, H], [86, H, 84, 83, 79, H, 83, H], [80, 83, 88, H, 92, H, 88, 83], [88, H, H, H, 0, 0, 76, 80]] },
    temple: { bpm: 132, duty: .25, drum: 'march', bass: 'drive', arp: true, stab: false, st: .75,   // Temple Run: phiêu lưu, dồn dập tự soạn
      ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'A', 'A', 'Gm', 'Dm', 'Bb', 'A', 'Gm', 'C', 'A', 'A'],
      mel: [[74, H, 77, H, 81, H, 79, 77], [76, H, 74, H, 69, H, H, 0], [70, H, 74, H, 77, H, 79, H], [76, H, 72, H, 79, H, H, 0],
        [81, H, 79, 77, 74, H, 77, H], [79, H, 77, 74, 70, H, 74, H], [73, H, 76, H, 81, H, 79, 76], [73, H, H, H, 69, H, 73, 76],
        [79, H, 82, H, 86, H, 82, 79], [77, H, 81, H, 86, H, 81, 77], [82, H, 81, 79, 77, H, 74, H], [76, H, 73, H, 69, H, 73, H],
        [79, 82, 86, H, 84, 82, 79, H], [76, 79, 84, H, 82, 79, 76, H], [73, 76, 81, H, 85, H, 81, H], [85, H, H, H, 0, 0, 81, 85]] },
    bounce: { bpm: 132, duty: .25, drum: 'bounce', bass: 'bounce', arp: false, stab: true, st: .65,   // Bounce Tales: vui tươi tự soạn
      ch: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'C'],
      mel: [[72, H, 76, 79, 76, H, 72, H], [71, H, 74, 79, 74, H, 71, H], [72, 76, 81, H, 79, 76, 72, H], [77, H, 76, 74, 72, H, 69, H],
        [76, 79, 84, H, 83, 81, 79, H], [74, H, 79, H, 83, H, 86, H], [81, H, 77, H, 72, 74, 77, H], [79, H, H, H, 74, 76, 77, 79],
        [81, H, 84, 81, 76, H, 72, H], [79, H, 76, 79, 83, H, 79, H], [77, 81, 84, H, 81, 77, 72, H], [76, H, 79, H, 84, H, H, 0],
        [74, 77, 81, H, 77, 74, 69, H], [79, H, 83, H, 86, H, 83, 79], [84, H, 79, H, 76, H, 79, H], [84, H, H, H, 0, 0, 79, 83]] },
    tank: { bpm: 126, duty: .125, drum: 'march', bass: 'drive', arp: false, stab: false, st: .85,
      ch: ['Am', 'Am', 'F', 'G', 'Am', 'F', 'G', 'E', 'Am', 'C', 'G', 'Am', 'F', 'G', 'E', 'E'],
      mel: [[69, H, H, 72, 76, H, 72, H], [74, 72, 71, H, 69, H, H, 0], [72, H, H, 77, 81, H, 77, H], [79, 77, 76, H, 74, H, H, 0],
        [76, H, 81, H, 79, 77, 76, H], [77, H, 76, 74, 72, H, 74, 76], [74, H, 71, H, 67, H, 71, 74], [76, H, H, H, 68, H, 71, H],
        [81, H, H, 81, 83, H, 84, H], [84, H, 83, 81, 79, H, 76, H], [79, H, H, 79, 81, H, 83, H], [84, H, 81, H, 76, H, H, 0],
        [77, H, 81, H, 84, H, 81, 77], [79, H, 83, H, 86, H, 83, 79], [80, H, 76, H, 71, H, 76, 80], [83, H, H, H, 80, H, H, 0]] }
  };
  let ac = null, master = null, noise = null, waves = {}, timer = 0, step = 0, next = 0, playing = false, el = null, lv = 1, cur = 'climb', T = TRACKS.climb, S16 = .1;
  /* nhạc từ file theo cảnh (Nấm Mario: đồng cỏ · hầm · sao bất tử) — files({ over: {src, a, b} … }, 'brick') */
  let FM = null, FMT = '', fel = {}, scn = '', fcur = null, hushed = false;
  function files(map, track) {
    FM = map; FMT = track;
    for (const k in map) if (!fel[k] && map[k].src) {
      const m = map[k], a = new Audio(m.src); if (m.then) a.addEventListener('ended', () => { if (scn === k && playing && fileMode()) scene(m.then) }); a.preload = 'auto'; a.loop = !m.once && !m.then; fel[k] = a;   // nhạc nền luôn tự lặp (kể cả khi trình duyệt lỡ mốc b) → không bao giờ tắt giữa chừng
      if (m.b) a.addEventListener('timeupdate', () => { if (a.currentTime >= m.b) a.currentTime = m.a || 0 });   // bỏ đoạn im lặng đầu/cuối file khi lặp
    }
    if (!scn) scn = Object.keys(map)[0];
    const unlock = () => { for (const k in fel) { const a = fel[k]; if (a !== fcur && a.paused) { a.muted = true; a.play().then(() => { if (a !== fcur) a.pause(); a.muted = false }).catch(() => { a.muted = false }) } } removeEventListener('pointerdown', unlock, true) };
    addEventListener('pointerdown', unlock, true);   // iPhone/iPad: phải chạm 1 lần mới cho phát nhạc
  }
  const fileMode = () => FM && cur === FMT;
  function playScene(restart) {
    if (hushed) return;
    const m = FM[scn]; if (m && m.synth) { if (fcur) fcur.pause(); fcur = null; synthOn(m.synth); return }   // cảnh dùng nhạc 8-bit tự soạn
    synthOff(); const a = fel[scn]; if (!a) return;
    if (fcur && fcur !== a) fcur.pause();
    if (restart || fcur !== a) { try { a.currentTime = (FM[scn] && FM[scn].a) || 0 } catch (e) { } }
    fcur = a; a.muted = false; a.volume = .45 * lv; a.playbackRate = (FM[scn] && FM[scn].rate) || 1; a.play().catch(() => { });
  }
  function scene(k, restart) { if (!FM || !FM[k]) return; const ch = k !== scn; scn = k; if (playing && fileMode() && (ch || restart)) playScene(restart) }
  /* tiếng động cơ xe tăng ù ù như Battle City: 0 tắt · 1 đứng yên · 2 đang chạy */
  let eng = null, engSt = 0;
  function engine(st) {
    if (!playing || !fileMode() || hushed) st = 0; if (st === engSt && (eng || !st)) return; engSt = st;
    try {
      if (!eng) {
        if (!st) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
        const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.type = 'square'; o2.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0; lfo.frequency.value = 14; lg.gain.value = 6;
        lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency); o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o2.start(); lfo.start();
        eng = { o, o2, g };
      }
      const t = ac.currentTime, fr = st === 2 ? 92 : 58;
      eng.o.frequency.setTargetAtTime(fr, t, .05); eng.o2.frequency.setTargetAtTime(fr * 1.01, t, .05); eng.g.gain.setTargetAtTime(st ? (st === 2 ? .022 : .012) * lv : 0, t, .06);
    } catch (e) { }
  }
  /* tiếng động cơ ô tô: k = 0 tắt … 1 hết tốc lực (cao độ tăng theo tốc độ) */
  let mot = null, motK = -1;
  function motor(k) {
    if (!playing || !fileMode() || hushed) k = 0; if (Math.abs(k - motK) < .02 && (mot || !k)) return; motK = k;
    try {
      if (!mot) {
        if (!k) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
        const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0;
        o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o2.start(); mot = { o, o2, g };
      }
      const t = ac.currentTime, fr = 48 + 150 * k;
      mot.o.frequency.setTargetAtTime(fr, t, .06); mot.o2.frequency.setTargetAtTime(fr * 1.5, t, .06); mot.g.gain.setTargetAtTime(k ? (.01 + .022 * k) * lv : 0, t, .08);
    } catch (e) { }
  }
  function hush(on) { hushed = !!on; if (on) { if (fcur) fcur.pause(); synthOff() } else if (playing && fileMode()) playScene(true) }   // tạm im lúc chết / chạm cờ
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
    else if (T.drum === 'soft') { if (s === 0 || s === 8) kick(t, .28); if (s === 12) hit(t, .06, .07, 3000); if (s % 4 === 2) hit(t, .02, .035, 9000) }
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
    if (fileMode()) { playScene(false); return }
    const url = CFG().music;
    if (url) { el = el || new Audio(url); el.loop = true; el.volume = .45 * lv; el.play().catch(() => { }); return }
    synthOn(cur);
  }
  let synthing = false;
  function synthOff() { if (synthing) { synthing = false; clearInterval(timer) } }
  function synthOn(name) {
    if (synthing && T === TRACKS[name]) return; synthOff();
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      if (!master) { master = ac.createGain(); master.connect(ac.destination); noise = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1 }
      T = TRACKS[name] || TRACKS.climb; S16 = 60 / T.bpm / 4; synthing = true;
      master.gain.setValueAtTime(.34 * lv, ac.currentTime); next = ac.currentTime + .05; step = 0; timer = setInterval(tick, 25);
    } catch (e) { synthing = false }
  }
  function stop() { engine(0); motor(0); playing = false; synthOff(); clearInterval(timer); if (el) el.pause(); if (fcur) fcur.pause() }
  function duck(on) { lv = on ? .35 : 1; if (el) el.volume = .45 * lv; if (fcur) fcur.volume = .45 * lv; if (eng && engSt && ac) eng.g.gain.setTargetAtTime((engSt === 2 ? .022 : .012) * lv, ac.currentTime, .1); if (master && ac) master.gain.setTargetAtTime(.34 * lv, ac.currentTime, .2) }
  function toggle() { const v = !pref(); setPref(v); if (v) start(); else stop(); return v }
  return { start, stop, duck, toggle, pref, files, scene, hush, engine, motor, get now() { return (fcur && !fcur.paused ? scn + ':' + fcur.src.split('/').pop() + '@' + fcur.currentTime.toFixed(1) : '(im)') + (synthing ? ' synth' : '') + ' eng=' + engSt }, get playing() { return playing }, get track() { return cur } };
})();

/* ── xếp hạng: về đích trước → cao hơn → đúng nhiều hơn ── */
function rank(players) {
  return Object.entries(players || {}).sort((A, B) => {
    const a = A[1], b = B[1];
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

/* lưu / đọc 1 tin giữ lại (retained) trên cả 2 máy chủ MQTT — dùng cho link bài tập ngắn (play.html?h=mã) */
const KV_LIBS = ['https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js'];
const KV_BROKERS = () => CFG().brokers || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
async function kvLib() { for (const u of KV_LIBS) { if (window.mqtt) break; try { await loadScript(u) } catch (e) { } } if (!window.mqtt) throw new Error('Không tải được bộ kết nối — kiểm tra mạng rồi tải lại trang') }
function kvOne(url, topic, val) {   // val === undefined → đọc; có val → ghi
  return new Promise(done => {
    let c, fin = false; const end = v => { if (fin) return; fin = true; clearTimeout(to); try { c && c.end(true) } catch (e) { } done(v) };
    const to = setTimeout(() => end(val === undefined ? null : false), 9000);
    try { c = mqtt.connect(url, { clientId: 'kv_' + Math.random().toString(16).slice(2, 12), connectTimeout: 7000, reconnectPeriod: 0, clean: true }) } catch (e) { return end(val === undefined ? null : false) }
    c.on('error', () => end(val === undefined ? null : false));
    c.on('connect', () => {
      if (val !== undefined) return c.publish(topic, val, { qos: 1, retain: true }, err => end(!err));
      c.on('message', (t, buf) => end(new TextDecoder().decode(buf) || null));
      c.subscribe(topic, { qos: 1 }, () => setTimeout(() => end(null), 3000));
    });
  });
}
async function kvPut(topic, val) { await kvLib(); const r = await Promise.all(KV_BROKERS().map(u => kvOne(u, topic, val))); return r.some(Boolean) }
/* "đang online": mỗi trang khoảng 20 giây báo 1 lần (vai trò · game · phòng · tên thầy cô — KHÔNG có tên học sinh) */
const LIVE = 'hoctienganh-dnx/v1/live/';
function live(state) {
  if (live.on) return; live.on = 1;
  const sid = Math.random().toString(36).slice(2, 10); let c = null;
  const send = () => { try { const d = state(); if (!d || !c || !c.connected) return; d.t = Date.now(); c.publish(LIVE + sid, JSON.stringify(d), { qos: 0 }) } catch (e) { } };
  kvLib().then(() => {
    c = mqtt.connect(KV_BROKERS()[0], { clientId: 'lv_' + sid, keepalive: 45, reconnectPeriod: 6000, clean: true });
    c.on('connect', send); setInterval(send, 20000);
    addEventListener('visibilitychange', () => { if (!document.hidden) send() });
    addEventListener('pagehide', () => { try { c.publish(LIVE + sid, '', { qos: 0 }) } catch (e) { } });
  }).catch(() => { });
  return { send };
}
function liveWatch(cb) {   // trang tạo mã của cô: nghe tất cả
  kvLib().then(() => {
    const c = mqtt.connect(KV_BROKERS()[0], { clientId: 'lw_' + Math.random().toString(16).slice(2, 10), keepalive: 45, reconnectPeriod: 4000, clean: true });
    c.on('connect', () => { c.subscribe(LIVE + '+'); cb('_conn', true) }); c.on('close', () => cb('_conn', false));
    c.on('message', (t, b) => { const sid = t.slice(LIVE.length), s = new TextDecoder().decode(b); let d = null; try { d = s ? JSON.parse(s) : null } catch (e) { } cb(sid, d) });
  }).catch(() => cb('_conn', false));
}
async function kvScan(filter, ms) {   // đọc TẤT CẢ tin giữ lại khớp mẫu (vd .../kbak/+) trên cả 2 máy chủ
  await kvLib(); const out = {};
  await Promise.all(KV_BROKERS().map(u => new Promise(done => {
    let c; const end = () => { try { c && c.end(true) } catch (e) { } done() }; setTimeout(end, ms || 5000);
    try { c = mqtt.connect(u, { clientId: 'ks_' + Math.random().toString(16).slice(2, 10), connectTimeout: 6000, reconnectPeriod: 0, clean: true }) } catch (e) { return end() }
    c.on('error', end); c.on('connect', () => c.subscribe(filter, { qos: 1 }));
    c.on('message', (t, b) => { const s = new TextDecoder().decode(b); if (s && !out[t]) out[t] = s });
  })));
  return out;
}
async function kvGet(topic) { await kvLib(); return new Promise(ok => { let n = 0; const L = KV_BROKERS(); L.forEach(u => kvOne(u, topic).then(v => { if (v) ok(v); else if (++n === L.length) ok(null) })) }) }
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


async function deleteCommunityQuiz(id) {
  if (!id) return false;
  id = String(id).trim();
  // 1. Local deletion
  const list = getLocalCommunity().filter(q => q.id !== id);
  saveLocalCommunity(list);
  if (typeof window !== 'undefined' && window.communityQuizzesCache) {
    window.communityQuizzesCache = window.communityQuizzesCache.filter(q => q.id !== id);
  }
  // 2. Cloud server deletion
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    try {
      const url = cfg.firebase.databaseURL.replace(/\/$/, '') + '/community_quizzes/' + encodeURIComponent(id) + '.json';
      await fetch(url, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete quiz from server warn:', e);
    }
  }
  return true;
}

async function deleteHwSubmission(hwId, subId) {
  if (!hwId) return false;
  hwId = String(hwId).trim();
  // 1. Local deletion
  const allSubs = getLocalHwSubs();
  if (allSubs[hwId]) {
    if (subId) {
      delete allSubs[hwId][subId];
    } else {
      delete allSubs[hwId];
    }
    saveLocalHwSubs(allSubs);
  }
  if (!subId) {
    const metas = getLocalHwMetas();
    delete metas[hwId];
    saveLocalHwMetas(metas);
  }
  // 2. Cloud server deletion
  const cfg = window.GAME_CONFIG || {};
  if (cfg.firebase && cfg.firebase.databaseURL) {
    const base = cfg.firebase.databaseURL.replace(/\/$/, '');
    try {
      if (subId) {
        await fetch(base + '/hw_subs/' + encodeURIComponent(hwId) + '/' + encodeURIComponent(subId) + '.json', { method: 'DELETE' });
      } else {
        await fetch(base + '/hw_subs/' + encodeURIComponent(hwId) + '.json', { method: 'DELETE' });
        await fetch(base + '/hw_meta/' + encodeURIComponent(hwId) + '.json', { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Delete submission from server warn:', e);
    }
  }
  return true;
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

  
/* ══════════════════════════════════════════════════════════════
   HỆ THỐNG ĐÁNH GIÁ PHÁT ÂM TIẾNG ANH AI (AI PRONUNCIATION EVALUATION)
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_AI_KEY = atob('QVEuQWI4Uk42SXY0Mm9BVTFySEFWNEItTVlMb0U2eThEaHFvd2pybFZ3QXVkbUEyQkxYOWc=');
let systemAiKey = DEFAULT_AI_KEY;
if (typeof window !== 'undefined' && window.firebaseConfig && window.firebaseConfig.databaseURL) {
  try {
    fetch(window.firebaseConfig.databaseURL + '/system_config/gemini_key.json')
      .then(r => r.json())
      .then(k => { if (k && typeof k === 'string') systemAiKey = k; })
      .catch(() => {});
  } catch(e) {}
}
function getAiKey() { return systemAiKey || DEFAULT_AI_KEY; }

function levenshteinDist(s1, s2) {
  const m = s1.length, n = s2.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

function diffPronunciation(spoken, target) {
  const cleanStr = str => String(str || '').toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();
  const sWords = cleanStr(spoken).split(' ').filter(Boolean);
  const tWords = cleanStr(target).split(' ').filter(Boolean);

  if (!tWords.length) return { score: 0, passed: false, words: [] };

  const results = [];
  let matchedWeight = 0;
  let sIdx = 0;

  for (let i = 0; i < tWords.length; i++) {
    const tw = tWords[i];
    let found = -1;
    for (let j = sIdx; j < Math.min(sIdx + 4, sWords.length); j++) {
      if (sWords[j] === tw) {
        found = j;
        break;
      }
    }

    if (found !== -1) {
      results.push({ word: tw, status: 'ok', spoken: sWords[found] });
      matchedWeight += 1.0;
      sIdx = found + 1;
    } else {
      let closeFound = -1;
      let minDiff = 999;
      for (let j = sIdx; j < Math.min(sIdx + 3, sWords.length); j++) {
        const sw = sWords[j];
        const dist = levenshteinDist(tw, sw);
        const maxLen = Math.max(tw.length, sw.length);
        if (maxLen > 2 && dist <= Math.max(1, Math.floor(maxLen * 0.35))) {
          if (dist < minDiff) {
            minDiff = dist;
            closeFound = j;
          }
        }
      }

      if (closeFound !== -1) {
        results.push({ word: tw, status: 'close', spoken: sWords[closeFound] });
        matchedWeight += 0.75;
        sIdx = closeFound + 1;
      } else {
        results.push({ word: tw, status: 'bad', spoken: null });
      }
    }
  }

  const score = Math.min(100, Math.max(0, Math.round((matchedWeight / tWords.length) * 100)));
  return {
    score,
    passed: score >= 70,
    words: results,
    matchedCount: Math.round(matchedWeight),
    totalWords: tWords.length
  };
}

function speakText(text, lang = 'en-US', rate = 0.88) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google')) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (enVoice) u.voice = enVoice;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn('SpeechSynthesis error:', e);
  }
}

async function evaluatePronunciationAI(spoken, target, ipa) {
  const localRes = diffPronunciation(spoken, target);
  let feedback = '';
  let tips = '';

  const badWords = localRes.words.filter(w => w.status === 'bad').map(w => w.word);
  const closeWords = localRes.words.filter(w => w.status === 'close').map(w => w.word);

  if (localRes.score >= 90) {
    feedback = '🌟 Xuất sắc! Em phát âm rất chuẩn xác, trôi chảy và rõ ràng!';
  } else if (localRes.score >= 70) {
    feedback = `👍 Khá tốt! Em đã phát âm đúng ${localRes.matchedCount}/${localRes.totalWords} từ.` +
      (badWords.length ? ` Hãy chú ý luyện thêm từ: "${badWords.slice(0, 2).join('", "')}".` : '');
  } else {
    feedback = `💪 Cần cố gắng hơn! Em phát âm được ${localRes.matchedCount}/${localRes.totalWords} từ.` +
      (badWords.length ? ` Các từ chưa đạt: "${badWords.slice(0, 3).join('", "')}".` : '') + ' Hãy bấm "Nghe mẫu" để nghe lại nhé!';
  }

  const key = getAiKey();
  if (key && typeof fetch !== 'undefined' && spoken && spoken.trim()) {
    const prompt = `Bạn là giáo viên chuyên ngữ âm Tiếng Anh (English Phonetics Teacher).
Nhiệm vụ: Nhận xét phát âm của học sinh dựa trên bản ghi âm chuyển chữ.
Câu mẫu chuẩn: "${target}"
${ipa ? `Phiên âm IPA: "${ipa}"` : ''}
Lời học sinh phát âm thực tế: "${spoken}"

Hãy phân tích ngắn gọn:
1. Độ chuẩn xác (score: 0-100).
2. Lời khuyên bằng tiếng Việt thật khích lệ, thân thiện (tối đa 2 câu), chỉ rõ từ nào bị đọc sót, đọc nhầm âm đuôi (/s/, /ed/, /t/) hoặc sai trọng âm.
3. Mẹo phát âm ngắn gọn (tips) cho âm khó nhất trong câu này.

Trả về strictly JSON:
{
  "score": <0-100>,
  "passed": <true nếu score >= 70>,
  "feedback": "<lời nhận xét tiếng Việt khích lệ>",
  "tips": "<mẹo phát âm âm khó>"
}`;

    const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
    for (const m of models) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 4000);
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const aiJson = JSON.parse(txt);
            return {
              score: typeof aiJson.score === 'number' ? aiJson.score : localRes.score,
              passed: aiJson.score != null ? aiJson.score >= 70 : localRes.passed,
              feedback: aiJson.feedback || feedback,
              tips: aiJson.tips || tips,
              words: localRes.words,
              spoken,
              target
            };
          }
        }
      } catch (err) {}
    }
  }

  return {
    score: localRes.score,
    passed: localRes.passed,
    feedback,
    tips,
    words: localRes.words,
    spoken,
    target
  };
}


/* ══════════════════════════════════════════════════════════════════
   CHUẨN HÓA CHÍNH TẢ & NGỮ PHÁP TIẾNG ANH CHO CÂU HỎI PHÁT ÂM (SPEAKING)
   ══════════════════════════════════════════════════════════════════ */
const COMMON_TYPOS = {
  'hitory': 'history',
  'histroy': 'history',
  'hisotry': 'history',
  'techer': 'teacher',
  'teachr': 'teacher',
  'stuent': 'student',
  'studnet': 'student',
  'gramar': 'grammar',
  'grammer': 'grammar',
  'libary': 'library',
  'librery': 'library',
  'unversity': 'university',
  'univercity': 'university',
  'untill': 'until',
  'moring': 'morning',
  'moning': 'morning',
  'beautifull': 'beautiful',
  'beutiful': 'beautiful',
  'beatiful': 'beautiful',
  'alot': 'a lot',
  'enviroment': 'environment',
  'environmet': 'environment',
  'goverment': 'government',
  'govertment': 'government',
  'comunication': 'communication',
  'communiction': 'communication',
  'succefull': 'successful',
  'succesful': 'successful',
  'successfull': 'successful',
  'tomorow': 'tomorrow',
  'tommorrow': 'tomorrow',
  'tomrw': 'tomorrow',
  'yesterdy': 'yesterday',
  'yestaday': 'yesterday',
  'truely': 'truly',
  'experiance': 'experience',
  'expereince': 'experience',
  'diferent': 'different',
  'diffrent': 'different',
  'freind': 'friend',
  'freinds': 'friends',
  'peaple': 'people',
  'peple': 'people',
  'becuase': 'because',
  'becuse': 'because',
  'bcs': 'because',
  'langauge': 'language',
  'famouse': 'famous',
  'dangerouse': 'dangerous',
  'intresting': 'interesting',
  'interseting': 'interesting',
  'imediately': 'immediately',
  'necesary': 'necessary',
  'neccessary': 'necessary',
  'accomodation': 'accommodation',
  'shedule': 'schedule',
  'comforatble': 'comfortable',
  'occured': 'occurred',
  'recieve': 'receive',
  'recieved': 'received',
  'seperate': 'separate',
  'definitly': 'definitely',
  'definately': 'definitely',
  'pronounciation': 'pronunciation',
  'pronouce': 'pronounce',
  'embarass': 'embarrass',
  'beleive': 'believe',
  'acheive': 'achieve',
  'calender': 'calendar',
  'collegue': 'colleague',
  'disapear': 'disappear',
  'disapoint': 'disappoint',
  'dissappoint': 'disappoint',
  'foriegn': 'foreign',
  'guarentee': 'guarantee',
  'happend': 'happened',
  'heigth': 'height',
  'independant': 'independent',
  'knowlege': 'knowledge',
  'noticable': 'noticeable',
  'ocassion': 'occasion',
  'occassion': 'occasion',
  'paralell': 'parallel',
  'prefered': 'preferred',
  'priviledge': 'privilege',
  'publically': 'publicly',
  'realy': 'really',
  'religous': 'religious',
  'rember': 'remember',
  'remeber': 'remember',
  'sentance': 'sentence',
  'suprise': 'surprise',
  'thier': 'their',
  'twelth': 'twelfth',
  'unfortunatly': 'unfortunately',
  'usefull': 'useful',
  'vehical': 'vehicle',
  'wierd': 'weird',
  'writting': 'writing',
  'writen': 'written',
  'wether': 'whether',
  'wich': 'which',
  'appologize': 'apologize',
  'bussiness': 'business',
  'carreer': 'career',
  'choclate': 'chocolate',
  'colourfull': 'colourful',
  'decission': 'decision',
  'developement': 'development',
  'diffcult': 'difficult',
  'dificult': 'difficult',
  'dosent': 'doesn\'t',
  'dosen\'t': 'doesn\'t',
  'elaphant': 'elephant',
  'engish': 'English',
  'englsih': 'English',
  'excelent': 'excellent',
  'exellent': 'excellent',
  'excercise': 'exercise',
  'famly': 'family',
  'febrary': 'February',
  'finaly': 'finally',
  'fourty': 'forty',
  'freindly': 'friendly',
  'gardern': 'garden',
  'girafe': 'giraffe',
  'happyness': 'happiness',
  'helfull': 'helpful',
  'holliday': 'holiday',
  'hoptial': 'hospital',
  'invatation': 'invitation',
  'judgement': 'judgment',
  'knive': 'knife',
  'learnning': 'learning',
  'leson': 'lesson',
  'listning': 'listening',
  'litature': 'literature',
  'machne': 'machine',
  'marraige': 'marriage',
  'medecine': 'medicine',
  'monky': 'monkey',
  'musuem': 'museum',
  'natrual': 'natural',
  'nieghbor': 'neighbor',
  'oposite': 'opposite',
  'passanger': 'passenger',
  'peice': 'piece',
  'plaese': 'please',
  'pleas': 'please',
  'populer': 'popular',
  'possibe': 'possible',
  'practce': 'practice',
  'practise': 'practice',
  'prepair': 'prepare',
  'resturant': 'restaurant',
  'sandwhich': 'sandwich',
  'scence': 'scene',
  'scinece': 'science',
  'sholder': 'shoulder',
  'similiar': 'similar',
  'speach': 'speech',
  'strenght': 'strength',
  'strugle': 'struggle',
  'succes': 'success',
  'swiming': 'swimming',
  'technolgy': 'technology',
  'telivision': 'television',
  'temprature': 'temperature',
  'thursdy': 'Thursday',
  'togather': 'together',
  'trafic': 'traffic',
  'tuesday': 'Tuesday',
  'vaction': 'vacation',
  'vegtables': 'vegetables',
  'vegetabel': 'vegetable',
  'villiage': 'village',
  'vollyball': 'volleyball',
  'wedensday': 'Wednesday',
  'wensday': 'Wednesday',
  'womam': 'woman',
  'wonderfull': 'wonderful',
  'yestaday': 'yesterday'
};

const COMMON_VOCAB = [
  "history", "teacher", "student", "classroom", "school", "education", "beautiful", "environment",
  "protection", "successful", "practice", "perfect", "speaking", "pronunciation", "vocabulary",
  "grammar", "listening", "reading", "writing", "communication", "technology", "computer", "internet",
  "science", "knowledge", "university", "library", "tomorrow", "yesterday", "morning", "afternoon",
  "evening", "welcome", "question", "answer", "elephant", "giraffe", "monkey", "animal", "hospital",
  "doctor", "medicine", "restaurant", "sandwich", "chocolate", "holiday", "vacation", "weather",
  "different", "difficult", "important", "necessary", "experience", "wonderful", "dangerous",
  "favorite", "family", "friend", "friendly", "children", "people", "language", "english", "exercise",
  "homework", "remember", "understand", "believe", "achieve", "decision", "development", "situation",
  "traditional", "culture", "celebration", "festival", "interesting", "amazing", "special", "simple",
  "complex", "century", "future", "present", "country", "international", "delicious", "information",
  "activity", "community", "pollution", "traffic", "government", "challenge", "opportunity", "president"
];

function levenshtein(s1, s2) {
  if (s1.length < s2.length) return levenshtein(s2, s1);
  if (s2.length === 0) return s1.length;
  let prev = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    let curr = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      let ins = prev[j + 1] + 1;
      let del = curr[j] + 1;
      let sub = prev[j] + (s1[i] !== s2[j] ? 1 : 0);
      curr.push(Math.min(ins, del, sub));
    }
    prev = curr;
  }
  return prev[s2.length];
}

/* Kiểm tra chính tả & chuẩn hóa tiếng Anh cục bộ (offline / tức thì) */
function checkEnglishStandardizationLocal(text) {
  const original = String(text || '').trim();
  if (!original) return { original: '', suggested: '', isMisspelled: false, reason: '' };

  const tokens = original.split(/\s+/);
  const correctedTokens = [];
  let isMisspelled = false;
  const reasons = [];

  tokens.forEach(tok => {
    const m = tok.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9]*)$/);
    if (!m) {
      correctedTokens.push(tok);
      return;
    }
    const lead = m[1] || '';
    const word = m[2];
    const trail = m[3] || '';
    const lower = word.toLowerCase();

    // 1. Tra cứu trực tiếp từ bảng lỗi phổ biến
    if (COMMON_TYPOS[lower]) {
      let repl = COMMON_TYPOS[lower];
      if (word[0] === word[0].toUpperCase() && word.length > 1) {
        repl = repl.charAt(0).toUpperCase() + repl.slice(1);
      }
      correctedTokens.push(lead + repl + trail);
      isMisspelled = true;
      reasons.push(`'${word}' ➔ '${repl}'`);
      return;
    }

    // 2. Tra cứu khoảng cách Levenshtein = 1 đối với từ dài >= 4 ký tự
    if (lower.length >= 4 && !COMMON_VOCAB.includes(lower)) {
      const match = COMMON_VOCAB.find(v => levenshtein(lower, v) === 1);
      if (match) {
        let repl = match;
        if (word[0] === word[0].toUpperCase() && word.length > 1) {
          repl = repl.charAt(0).toUpperCase() + repl.slice(1);
        }
        correctedTokens.push(lead + repl + trail);
        isMisspelled = true;
        reasons.push(`'${word}' ➔ '${repl}'`);
        return;
      }
    }

    correctedTokens.push(tok);
  });

  const suggested = correctedTokens.join(' ');
  const reason = isMisspelled ? `Phát hiện từ có thể viết sai chính tả: ${reasons.join(', ')}` : '';

  return {
    original,
    suggested,
    isMisspelled,
    reason
  };
}

/* Thẩm định & chuẩn hóa danh sách từ/câu phát âm bằng AI (kết hợp offline + Gemini) */
async function checkEnglishStandardizationAI(items) {
  if (!Array.isArray(items) || !items.length) return [];

  const list = items.map((it, idx) => {
    const raw = typeof it === 'string' ? it : (it.targetText || it.ansText || it.q || '');
    return { id: idx, original: String(raw || '').trim(), rawObj: it };
  });

  // 1. Quét cục bộ nhanh trước
  const localResults = list.map(item => {
    const local = checkEnglishStandardizationLocal(item.original);
    return {
      id: item.id,
      original: item.original,
      suggested: local.suggested,
      isMisspelled: local.isMisspelled,
      reason: local.reason,
      rawObj: item.rawObj
    };
  });

  // 2. Nếu có key AI, gửi Gemini để kiểm tra ngữ pháp sâu & ngữ cảnh
  const key = getAiKey();
  if (!key || typeof fetch === 'undefined') {
    return localResults;
  }

  const promptItems = list.map(l => ({ id: l.id, text: l.original }));
  const prompt = `Bạn là chuyên gia thẩm định và chuẩn hóa chính tả, ngữ pháp Tiếng Anh (English Proofreader & Standardizer).
Giáo viên đang soạn danh sách từ/câu để học sinh luyện đọc và phát âm:
${JSON.stringify(promptItems)}

Nhiệm vụ:
Kiểm tra xem từng từ/câu có bị gõ nhầm chính tả (typo), viết sai từ tiếng Anh hoặc ngữ pháp không chuẩn không (ví dụ: 'hitory' -> 'history', 'Good moring' -> 'Good morning', 'beautifull' -> 'beautiful', 'Practice make perfect' -> 'Practice makes perfect').

Yêu cầu:
1. Nếu có lỗi chính tả/ngữ pháp tiếng Anh:
   - "isMisspelled": true
   - "suggested": "<từ hoặc câu đã được sửa chuẩn xác nhất>"
   - "reason": "<giải thích ngắn gọn 1 câu bằng tiếng Việt về lỗi sai và cách sửa>"
2. Nếu từ/câu đã hoàn toàn chuẩn xác tiếng Anh:
   - "isMisspelled": false
   - "suggested": "<giữ nguyên bản gốc>"
   - "reason": ""

QUAN TRỌNG:
- Trả về STRICT JSON mảng:
[
  { "id": 0, "original": "...", "suggested": "...", "isMisspelled": true, "reason": "..." }
]`;

  const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  for (const m of models) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 6000);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (resp.ok) {
        const data = await resp.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const parsed = JSON.parse(txt);
          if (Array.isArray(parsed)) {
            parsed.forEach(pItem => {
              const res = localResults[pItem.id];
              if (res) {
                if (pItem.isMisspelled && pItem.suggested && pItem.suggested.toLowerCase() !== res.original.toLowerCase()) {
                  res.isMisspelled = true;
                  res.suggested = pItem.suggested;
                  res.reason = pItem.reason || res.reason || `Chuẩn hóa thành "${pItem.suggested}"`;
                }
              }
            });
            return localResults;
          }
        }
      }
    } catch (e) {
      console.warn(`Model ${m} standardization check failed:`, e);
    }
  }

  return localResults;
}

/* Tự động làm giàu danh sách câu phát âm bằng AI: điền phiên âm IPA, chỉ dẫn và mẹo phát âm */
async function enrichSpeakingQuestionsAI(qList) {
  if (!Array.isArray(qList) || !qList.length) return qList;

  const needsEnrich = [];
  qList.forEach((q, idx) => {
    if (q.type === 'speaking' || q.targetText) {
      const target = (q.targetText || q.ansText || q.q || '').trim();
      if (target && (!q.ipa || !q.e)) {
        needsEnrich.push({ idx, target });
      }
    }
  });

  if (!needsEnrich.length) return qList;

  const key = getAiKey();
  if (!key || typeof fetch === 'undefined') {
    needsEnrich.forEach(({ idx }) => {
      if (!qList[idx].q || qList[idx].q.startsWith('Câu hỏi') || qList[idx].q.includes('clearly:')) qList[idx].q = 'Listen to the audio or read aloud clearly:';
      if (!qList[idx].e) qList[idx].e = 'Luyện đọc to, rõ ràng từng âm tiết và chú ý trọng âm của từ.';
    });
    return qList;
  }

  const promptItems = needsEnrich.map((item, i) => ({ id: i, text: item.target }));
  const prompt = `Bạn là chuyên gia ngữ âm Tiếng Anh (English Phonetics Expert).
Nhiệm vụ: Cung cấp phiên âm quốc tế IPA và mẹo phát âm thực tế cho danh sách từ/câu sau:
${JSON.stringify(promptItems)}

Với MỖI mục:
1. "ipa": Phiên âm quốc tế IPA chuẩn xác (kèm dấu trọng âm chính ˈ và phụ ˌ, ví dụ: /ˈfəʊ.tə.ɡrɑːf/, /ɪnˌvaɪ.rənˈmen.tl/).
2. "tips": Lời khuyên phát âm thực tế bằng tiếng Việt (1-2 câu ngắn gọn), chỉ rõ trọng âm rơi vào âm tiết mấy, các âm gió đuôi (/s/, /ed/, /l/, /t/) hoặc phụ âm nối cần chú ý.
3. "prompt": Chỉ dẫn bài làm ngắn bằng tiếng Anh (ví dụ: "Read aloud the word clearly:" hoặc "Read aloud the sentence with natural intonation:").

Trả về STRICT JSON mảng:
[
  { "id": 0, "ipa": "...", "tips": "...", "prompt": "..." }
]`;

  const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  for (const m of models) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 12000);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (resp.ok) {
        const data = await resp.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const parsed = JSON.parse(txt);
          if (Array.isArray(parsed)) {
            parsed.forEach(resItem => {
              const matched = needsEnrich[resItem.id];
              if (matched && qList[matched.idx]) {
                const targetQ = qList[matched.idx];
                if (!targetQ.ipa && resItem.ipa) targetQ.ipa = resItem.ipa;
                if (!targetQ.e && resItem.tips) targetQ.e = resItem.tips;
                if ((!targetQ.q || targetQ.q.includes('clearly:')) && resItem.prompt) targetQ.q = resItem.prompt;
              }
            });
            return qList;
          }
        }
      }
    } catch (err) {
      console.warn(`Model ${m} enrich failed:`, err);
    }
  }

  needsEnrich.forEach(({ idx }) => {
    if (!qList[idx].q) qList[idx].q = 'Listen to the audio or read aloud clearly:';
    if (!qList[idx].e) qList[idx].e = 'Luyện đọc to, rõ ràng từng âm tiết và chú ý trọng âm của từ.';
  });
  return qList;
}

/* Sinh IPA và mẹo phát âm cho 1 từ/câu riêng biệt trong trình sửa */
async function generateSingleSpeakingAI(targetText) {
  const cleanTarget = String(targetText || '').trim();
  if (!cleanTarget) return { ipa: '', tips: '', prompt: 'Read aloud clearly:' };

  const key = getAiKey();
  if (!key || typeof fetch === 'undefined') {
    return {
      ipa: '',
      tips: 'Luyện đọc to, rõ ràng từng âm tiết và chú ý trọng âm của từ.',
      prompt: 'Read aloud clearly:'
    };
  }

  const prompt = `Bạn là chuyên gia ngữ âm Tiếng Anh.
Nhiệm vụ: Cung cấp phiên âm quốc tế IPA và mẹo phát âm tiếng Việt cho từ/câu: "${cleanTarget}"

Trả về STRICT JSON:
{
  "ipa": "<phiên âm IPA chuẩn kèm trọng âm>",
  "tips": "<lời khuyên phát âm 1-2 câu tiếng Việt (trọng âm, âm đuôi)>",
  "prompt": "<chỉ dẫn bài làm tiếng Anh ngắn>"
}`;

  const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  for (const m of models) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (resp.ok) {
        const data = await resp.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const parsed = JSON.parse(txt);
          return {
            ipa: parsed.ipa || '',
            tips: parsed.tips || 'Luyện đọc to, rõ ràng từng âm tiết và chú ý trọng âm của từ.',
            prompt: parsed.prompt || 'Read aloud clearly:'
          };
        }
      }
    } catch (err) {}
  }

  return {
    ipa: '',
    tips: 'Luyện đọc to, rõ ràng từng âm tiết và chú ý trọng âm của từ.',
    prompt: 'Read aloud clearly:'
  };
}

return { $, shuffle, pick, clamp, esc, fmt, stamp, clean, rng, COLORS, BADGE, safe, normAns, checkTextAns, fromOld, prep, parseCSV, rowsToQs, parseText, parsePaste, sheetSets, sheetSet, sampleSet, packHw, unpackHw, tone, sfx, confetti, toast, rank, makeNet, music, saveCommunityQuiz, getCommunityLibrary, getQuizById, saveHwMeta, submitHwResult, getHwGradebook, showReportCard, getAiKey, diffPronunciation, speakText, evaluatePronunciationAI, enrichSpeakingQuestionsAI, generateSingleSpeakingAI, checkEnglishStandardizationLocal, checkEnglishStandardizationAI, COMMON_TYPOS, deleteCommunityQuiz, deleteHwSubmission , copy, copyText, sfxFiles, kvPut, kvGet, kvScan, live, liveWatch};
})();