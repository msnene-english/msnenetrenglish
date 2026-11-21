(function (root) {
  'use strict';

  function decodeEntities(s) {
    return String(s == null ? '' : s)
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }

  function clean(v, n = 3000) {
    return decodeEntities(
      String(v == null ? '' : v)
        .replace(/<\s*br\s*\/?\s*>/gi, ' ')
        .replace(/<\s*\/\s*u\s*>/gi, '\uE001')
        .replace(/<\s*u(?:\s[^>]*)?>/gi, '\uE000')
        .replace(/<[^>]*>/g, ' ')
    )
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, n)
      .replace(/\uE000/g, '<u>')
      .replace(/\uE001/g, '</u>');
  }

  function cleanPlain(v, n = 500) {
    return clean(String(v == null ? '' : v).replace(/<\/?u>/gi, ''), n)
      .replace(/<\/?u>/gi, '')
      .trim()
      .slice(0, n);
  }

  function answers(v) {
    const a = Array.isArray(v) ? v.flat(Infinity) : [v];
    return [...new Set(a.map(x => cleanPlain(x, 250)).filter(Boolean))].join(' | ');
  }

  function skipWsAndComments(src, i) {
    while (i < src.length) {
      const c = src[i], n = src[i + 1];
      if (c <= ' ' || /\s/.test(c)) { i++; continue; }
      if (c === '/' && n === '/') {
        i += 2;
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && n === '*') {
        i += 2;
        while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
      break;
    }
    return i;
  }

  function readQuoted(src, pos) {
    const quote = src[pos];
    if (quote !== '"' && quote !== "'" && quote.charCodeAt(0) !== 96) return null;
    let value = '', escaped = false;
    for (let i = pos + 1; i < src.length; i++) {
      const c = src[i];
      if (escaped) {
        value += c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '' : c;
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === quote) {
        return { value, end: i + 1 };
      } else {
        value += c;
      }
    }
    return null;
  }

  function quoted(src, pos) {
    const r = readQuoted(src, pos);
    return r ? r.value : null;
  }

  function extractBalanced(src, openPos, openChar, closeChar) {
    let depth = 0, quote = '', esc = false, line = false, block = false;
    for (let i = openPos; i < src.length; i++) {
      const c = src[i], n = src[i + 1];
      if (line) { if (c === '\n') line = false; continue; }
      if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
      if (quote) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === '/' && n === '/') { line = true; i++; continue; }
      if (c === '/' && n === '*') { block = true; i++; continue; }
      if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; continue; }
      if (c === openChar) depth++;
      else if (c === closeChar && --depth === 0) return { text: src.slice(openPos, i + 1), end: i + 1 };
    }
    return null;
  }

  function jsArray(src, name) {
    const re = new RegExp('\\b(?:const|let|var)\\s+' + name + '\\s*=\\s*\\[', 'g');
    let m;
    while ((m = re.exec(src))) {
      const res = extractBalanced(src, m.index + m[0].length - 1, '[', ']');
      if (res && res.text.length > 2) return res.text;
      if (res) re.lastIndex = res.end;
      else break;
    }
    return '';
  }

  function extractStringVars(script) {
    const vars = Object.create(null);
    const re = /(?:^|[;\n,])\s*(?:const|let|var)?\s*([A-Za-z_$][\w$]{0,30})\s*=\s*(["'`])/g;
    let m;
    while ((m = re.exec(script))) {
      const valStart = m.index + m[0].length - 1;
      const q = readQuoted(script, valStart);
      if (q) {
        if (!(m[1] in vars)) vars[m[1]] = q.value;
        re.lastIndex = q.end;
      }
    }
    return vars;
  }

  function allJsArrays(src) {
    const out = [];
    const SKIP_NAMES = /^(?:colors?|particles?|stars?|icons?|OOPS|PRAISE|HLT|zones?|TINT|PMSG|SECINFO|SEC_INFO|RMB_MSGS|RMB_ICONS|E|BF|BC|bfPaths|beePaths|vc|sc|cp|lv|pts|WBANK|shuffledOpts|ms\w+)$/i;
    const re = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[/g;
    let m;
    while ((m = re.exec(src))) {
      const name = m[1];
      const openPos = m.index + m[0].length - 1;
      const res = extractBalanced(src, openPos, '[', ']');
      if (!res) continue;
      re.lastIndex = res.end;
      if (SKIP_NAMES.test(name)) continue;
      if (res.text.length < 40) continue;
      out.push({ name, raw: res.text });
    }
    return out;
  }

  function objectParts(arrayText) {
    const out = [];
    let start = -1, depth = 0, quote = '', esc = false, line = false, block = false;
    for (let i = 1; i < arrayText.length - 1; i++) {
      const c = arrayText[i], n = arrayText[i + 1];
      if (line) { if (c === '\n') line = false; continue; }
      if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
      if (quote) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === quote) quote = ''; continue; }
      if (c === '/' && n === '/') { line = true; i++; continue; }
      if (c === '/' && n === '*') { block = true; i++; continue; }
      if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; continue; }
      if (c === '{') { if (depth++ === 0) start = i; }
      else if (c === '}' && --depth === 0 && start >= 0) { out.push(arrayText.slice(start, i + 1)); start = -1; }
    }
    return out;
  }

  function parseObjectProps(objText) {
    const map = Object.create(null);
    if (typeof objText !== 'string' || objText[0] !== '{') return map;
    let i = 1;
    const end = objText.length - 1;
    while (i < end) {
      i = skipWsAndComments(objText, i);
      if (i >= end) break;
      if (objText[i] === ',') { i++; continue; }
      let key = '';
      if (objText[i] === '"' || objText[i] === "'") {
        const q = readQuoted(objText, i);
        if (!q) break;
        key = q.value;
        i = q.end;
      } else {
        const km = /^[A-Za-z_$][\w$]*/.exec(objText.slice(i));
        if (!km) { i++; continue; }
        key = km[0];
        i += key.length;
      }
      i = skipWsAndComments(objText, i);
      if (objText[i] !== ':') {
        while (i < end && objText[i] !== ',') i++;
        continue;
      }
      i = skipWsAndComments(objText, i + 1);
      const valStart = i;
      let pDepth = 0, sDepth = 0, cDepth = 0, quote = '', esc = false, line = false, block = false;
      for (; i < end; i++) {
        const c = objText[i], n = objText[i + 1];
        if (line) { if (c === '\n') line = false; continue; }
        if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
        if (quote) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === quote) quote = '';
          continue;
        }
        if (c === '/' && n === '/') { line = true; i++; continue; }
        if (c === '/' && n === '*') { block = true; i++; continue; }
        if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; continue; }
        if (c === '(') pDepth++;
        else if (c === ')') pDepth = Math.max(0, pDepth - 1);
        else if (c === '[') sDepth++;
        else if (c === ']') sDepth = Math.max(0, sDepth - 1);
        else if (c === '{') cDepth++;
        else if (c === '}') {
          if (cDepth === 0 && pDepth === 0 && sDepth === 0) break;
          cDepth = Math.max(0, cDepth - 1);
        } else if (c === ',' && pDepth === 0 && sDepth === 0 && cDepth === 0) {
          break;
        }
      }
      if (key && !(key in map)) map[key] = objText.slice(valStart, i).trim();
      if (objText[i] === ',') i++;
    }
    return map;
  }

  function decodeExpr(expr, vars) {
    if (expr == null) return undefined;
    const t = String(expr).trim();
    if (!t) return undefined;
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null') return null;
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
    if (t[0] === '"' || t[0] === "'" || t.charCodeAt(0) === 96) {
      const q = readQuoted(t, 0);
      if (q && skipWsAndComments(t, q.end) >= t.length) return q.value;
    }
    if (vars && /^[A-Za-z_$][\w$]*$/.test(t) && t in vars) return vars[t];
    return t;
  }

  function prop(map, vars, ...keys) {
    for (const k of keys) {
      if (k in map) {
        const val = decodeExpr(map[k], vars);
        if (val !== undefined) return val;
      }
    }
    return undefined;
  }

  function stringList(src, vars) {
    if (Array.isArray(src)) return src.filter(x => x != null).map(x => String(x));
    if (typeof src !== 'string') return [];
    const s = src.trim();
    if (s[0] !== '[') return [];
    const out = [];
    let i = 1;
    while (i < s.length - 1) {
      i = skipWsAndComments(s, i);
      if (i >= s.length - 1) break;
      if (s[i] === ',') { i++; continue; }
      if (s[i] === '"' || s[i] === "'" || s.charCodeAt(i) === 96) {
        const q = readQuoted(s, i);
        if (!q) return [];
        out.push(q.value);
        i = q.end;
      } else if (vars && /^[A-Za-z_$][\w$]*/.test(s.slice(i))) {
        const idm = /^[A-Za-z_$][\w$]*/.exec(s.slice(i))[0];
        if (idm in vars) { out.push(vars[idm]); i += idm.length; }
        else return [];
      } else if (s[i] === ']') {
        break;
      } else {
        return [];
      }
    }
    return out;
  }

  function extractWbank(scripts) {
    for (const sc of scripts) {
      const raw = jsArray(sc, 'WBANK');
      if (!raw) continue;
      const list = stringList(raw);
      if (list.length >= 4) return list;
      const parts = objectParts(raw);
      if (parts.length >= 4) {
        const words = parts.map(p => prop(parseObjectProps(p), null, 'w', 'word', 'text', 't'))
          .filter(x => typeof x === 'string' && x.trim());
        if (words.length >= 4) return words;
      }
    }
    return [];
  }

  function wbankDistractors(wbank, target) {
    const cleanT = cleanPlain(target, 120);
    if (!cleanT || !wbank.length) return null;
    const pool = [...new Set(wbank.map(w => cleanPlain(w, 120)).filter(Boolean))]
      .filter(w => w.toLowerCase() !== cleanT.toLowerCase());
    if (pool.length < 3) return null;
    let h = 0;
    for (let i = 0; i < cleanT.length; i++) h = ((h * 31) + cleanT.charCodeAt(i)) >>> 0;
    const picks = [];
    const step = Math.max(1, Math.floor(pool.length / 4));
    let idx = h % pool.length;
    for (let tries = 0; tries < pool.length * 2 && picks.length < 3; tries++) {
      const candidate = pool[idx % pool.length];
      if (!picks.includes(candidate)) picks.push(candidate);
      idx += step + (tries > pool.length ? 1 : 0);
    }
    if (picks.length < 3) return null;
    return { options: [cleanT, ...picks], correct: 0 };
  }

  function optList(src, vars) {
    if (typeof src !== 'string') return null;
    const s = src.trim();
    if (s[0] !== '[') return null;
    const options = [];
    let correct = -1;
    const re = /\bOPT\s*\(/g;
    let m;
    while ((m = re.exec(s))) {
      let i = re.lastIndex, depth = 1, quote = '', esc = false;
      for (; i < s.length; i++) {
        const c = s[i];
        if (quote) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === quote) quote = ''; continue; }
        if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; continue; }
        if (c === '(') depth++;
        else if (c === ')' && --depth === 0) break;
      }
      if (depth) return null;
      const args = s.slice(re.lastIndex, i);
      const pos = args.search(/\S/);
      if (pos < 0) return null;
      let value = quoted(args, pos);
      if (value === null && vars) {
        const idm = /^[A-Za-z_$][\w$]*/.exec(args.slice(pos));
        if (idm && idm[0] in vars) value = vars[idm[0]];
      }
      if (value === null) return null;
      options.push(value);
      if (/,\s*1\s*$/.test(args)) { if (correct >= 0) return null; correct = options.length - 1; }
      re.lastIndex = i + 1;
    }
    return options.length >= 2 ? { options, correct } : null;
  }

  function passagesIn(html) {
    const out = [];
    const byId = Object.create(null);
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.pblk,.reading-text,.reading-passage,.passage,.passage-box,.read-box,.story-box,.text-box,[id^="qp"]').forEach(el => {
        const txt = clean((el.querySelector('.paragraph,.reading-content,.passage-text') || el).textContent, 7000);
        if (txt.length > 30) {
          out.push(txt);
          if (el.id) byId[el.id] = txt;
        }
      });
      return { list: out, byId };
    }
    const re = /<(div|section|article)\b([^>]*\b(?:class|id)=["'][^"']*(?:pblk|reading-text|reading-passage|passage|passage-box|read-box|story-box|qp[A-Z0-9]+)[^"']*["'][^>]*)>/gi;
    let m;
    while ((m = re.exec(html))) {
      const startTagEnd = m.index + m[0].length;
      const tag = m[1].toLowerCase();
      let depth = 1, pos = startTagEnd;
      const tagRe = new RegExp('<(\\/?)' + tag + '\\b[^>]*>', 'gi');
      tagRe.lastIndex = startTagEnd;
      let tm;
      while ((tm = tagRe.exec(html))) {
        if (tm[1] === '/') { if (--depth === 0) { pos = tm.index; break; } }
        else depth++;
      }
      if (depth === 0 && pos > startTagEnd) {
        const txt = clean(html.slice(startTagEnd, pos), 7000);
        if (txt.length > 40 && !out.includes(txt)) {
          out.push(txt);
          const idm = /\bid=["']([^"']+)["']/i.exec(m[2]);
          if (idm) byId[idm[1]] = txt;
        }
      }
    }
    return { list: out, byId };
  }

  function extractExplanation(rawExp, vars) {
    if (!rawExp) return '';
    if (typeof rawExp === 'string') {
      if (rawExp[0] === '{' || rawExp[0] === '[') {
        const map = parseObjectProps(rawExp);
        const vals = Object.values(map).map(v => {
          const dv = decodeExpr(v, vars);
          if (typeof dv === 'string' && !dv.startsWith('[')) return clean(dv, 350);
          if (typeof dv === 'string' && dv.startsWith('[')) return stringList(dv, vars).slice(0, 4).map(x => clean(x, 120)).join(' · ');
          return '';
        }).filter(Boolean);
        return vals.join(' ').slice(0, 900);
      }
      return clean(rawExp.replace(/\$\{[A-Z_][A-Z0-9_]*\}/gi, ''), 1200);
    }
    if (typeof rawExp === 'object') {
      const vals = Object.values(rawExp).flat().map(x => clean(x, 300)).filter(Boolean);
      return vals.join(' ').slice(0, 900);
    }
    return '';
  }

  function findMatchingOptionIndex(options, key) {
    if (!options.length || key == null) return -1;
    if (typeof key === 'number' && Number.isInteger(key) && key >= 0 && key < options.length) return key;
    if (typeof key === 'string') {
      const kTrim = key.trim();
      if (/^\d+$/.test(kTrim)) {
        const n = Number(kTrim);
        if (n >= 0 && n < options.length) return n;
      }
      const ck = cleanPlain(kTrim, 400).toLowerCase();
      const idx = options.findIndex(x => cleanPlain(x, 400).toLowerCase() === ck);
      if (idx >= 0) return idx;
      if (/^[A-F]$/i.test(kTrim)) return kTrim.toUpperCase().charCodeAt(0) - 65;
      const hwMatches = [];
      options.forEach((opt, i) => {
        const cleanOpt = cleanPlain(opt, 400).replace(/^[A-F][.)]\s*/i, '');
        const head = cleanOpt.split(/\s*(?:\(|:|\u2014|- )/)[0].trim().toLowerCase();
        if (head === ck || cleanOpt.toLowerCase() === ck) hwMatches.push(i);
      });
      if (hwMatches.length === 1) return hwMatches[0];
    }
    return -1;
  }

  function parseNormalizedItem(obj, passages, wbank, vars, i, fallbackSection) {
    if (!obj || typeof obj !== 'object') return { skip: 'Câu ' + (i + 1) + ' sai định dạng' };

    const isMap = !(obj instanceof Array) && Object.getPrototypeOf(obj) === null;
    const get = (...keys) => isMap ? prop(obj, vars, ...keys) : (() => {
      for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
      return undefined;
    })();

    if (get('sectionTitle') && !get('question', 'q', 'text', 'txt', 'qText', 'stem', 'qt')) return null;

    let rawQ = get('qText', 'question', 'text', 'txt', 'qHTML', 'qt', 'stem', 'q', 'prompt', 'cue');
    const passageHtmlField = get('passageHTML');
    if (typeof rawQ === 'string' && typeof passageHtmlField === 'string' && passageHtmlField.trim()) {
      rawQ = rawQ + ' ' + clean(passageHtmlField, 900);
    }
    const scramble = get('scramble');
    const pre = get('pre');
    const post = get('post');
    if (typeof rawQ !== 'string' && typeof pre === 'string' && typeof post === 'string') {
      rawQ = pre + ' ______ ' + post;
    }

    if (typeof rawQ === 'string' && /không có trong ảnh|vui lòng cung cấp.*ảnh/i.test(rawQ)) {
      const id = String(get('id') || 'câu ' + (i + 1));
      const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(id);
      if (range && +range[2] >= +range[1] && +range[2] - +range[1] < 50) {
        const skips = [];
        for (let n = +range[1]; n <= +range[2]; n++) skips.push('Nguồn thiếu câu ' + n);
        return { skips };
      }
      return { skip: 'Nguồn thiếu ' + cleanPlain(id, 60) };
    }

    const hasExplicitCorrect = obj.correctIndex !== undefined || obj.correctText !== undefined || obj.correct !== undefined || obj.answer !== undefined || obj.a !== undefined || obj.key !== undefined;
    const rawOptsField = obj.options || obj.opts || obj.opt || obj.o || obj.choices || obj.analysis || (hasExplicitCorrect && obj.answers ? obj.answers : undefined);
    let o = [];
    let markedCorrect = -1;

    if (Array.isArray(rawOptsField)) {
      if (rawOptsField.length && typeof rawOptsField[0] === 'object' && rawOptsField[0] !== null) {
        o = rawOptsField.map(x => String(x.text || x.t || x.h || x.w || x.label || ''));
        const marked = rawOptsField.map((x, j) => (x.isCorrect === true || x.correct === true || x.ok === 1 || x.c === 1 || x.c === true) ? j : -1).filter(j => j >= 0);
        if (marked.length === 1) markedCorrect = marked[0];
      } else {
        o = rawOptsField.map(x => String(x == null ? '' : x));
      }
    } else if (typeof rawOptsField === 'string') {
      const optCall = optList(rawOptsField, vars);
      if (optCall) {
        o = optCall.options;
        markedCorrect = optCall.correct;
      } else {
        const trimmedOpts = rawOptsField.trim();
        const wbCall = /^wbankOpts\s*\(\s*(["'`])([\s\S]+?)\1/.exec(trimmedOpts);
        const cCall = !wbCall ? /^C\s*\(\s*(\[[\s\S]+\])\s*,\s*(["'`])([\s\S]+?)\2/.exec(trimmedOpts) : null;
        const tfCall = (!wbCall && !cCall) ? /^(?:tfOpts|TF2)\s*\(\s*(?:true|false|(["'])(true|false)\1)\s*\)/i.exec(trimmedOpts) : null;
        if (wbCall) {
          const wb = wbankDistractors(wbank, wbCall[2]);
          if (wb) { o = wb.options; markedCorrect = wb.correct; }
        } else if (cCall) {
          o = stringList(cCall[1], vars);
          markedCorrect = findMatchingOptionIndex(o, cCall[3]);
        } else if (tfCall) {
          o = ['Đúng (True)', 'Sai (False)'];
          const tfBool = (tfCall[2] || trimmedOpts).toLowerCase().includes('true');
          markedCorrect = tfBool ? 0 : 1;
        } else {
          const optParts = objectParts(rawOptsField);
          if (optParts.length) {
            const pMaps = optParts.map(parseObjectProps);
            o = pMaps.map(m => String(prop(m, vars, 'text', 't', 'h', 'w', 'label') || ''));
            const marked = pMaps.map((m, j) => {
              const ic = prop(m, vars, 'isCorrect', 'correct', 'ok', 'c');
              return (ic === true || ic === 1) ? j : -1;
            }).filter(j => j >= 0);
            if (marked.length === 1) markedCorrect = marked[0];
          } else {
            o = stringList(rawOptsField, vars);
          }
        }
      }
    }

    if (!rawQ && o.length >= 2) {
      const hasUnderline = o.some(x => /<u>/i.test(x));
      if (hasUnderline || get('sounds') !== undefined) {
        rawQ = 'Choose the word whose underlined part differs from the other three in pronunciation:';
      } else if (get('stress') !== undefined) {
        rawQ = 'Choose the word that differs from the other three in the position of primary stress:';
      }
    }

    const instruction = get('instruction') || '';
    const rawCorrect = get('correctIndex', 'correctText', 'correct', 'answer', 'ans', 'ansExact', 'acceptedAnswers', 'answers', 'acc', 'show', 'a', 'key');
    const ansArray = Array.isArray(rawCorrect)
      ? rawCorrect
      : (typeof rawCorrect === 'string' && rawCorrect.startsWith('[') ? stringList(rawCorrect, vars) : null);

    const rawType = String(get('type', 't') || '').toLowerCase();
    const firstKey = ansArray && ansArray.length === 1 ? ansArray[0] : (ansArray && ansArray.length > 1 ? ansArray.join(' / ') : (typeof rawCorrect === 'string' || typeof rawCorrect === 'number' ? rawCorrect : undefined));

    let a = markedCorrect;
    if (a < 0) a = findMatchingOptionIndex(o, firstKey);
    if (a < 0 && ansArray && ansArray.length > 1) {
      a = findMatchingOptionIndex(o, ansArray.join('/'));
    }

    if (rawQ && (rawType === 'fill' || rawType === 'write' || rawType === 'rewrite' || rawType === 'text' || scramble || o.length < 2 || a < 0)) {
      const acceptRaw = get('accept', 'accepted', 'acceptable', 'valid', 'acc', 'show');
      const acceptList = Array.isArray(acceptRaw) ? acceptRaw : (typeof acceptRaw === 'string' && acceptRaw.startsWith('[') ? stringList(acceptRaw, vars) : []);
      const combinedAns = ansArray && ansArray.length ? [...ansArray, ...acceptList] : (typeof firstKey === 'string' && !/^[A-F]$/i.test(firstKey) ? [firstKey, ...acceptList] : []);
      const ansText = answers(combinedAns);
      if (ansText && (scramble || !o.length || rawType === 'fill' || rawType === 'write' || rawType === 'rewrite' || rawType === 'text' || o.every(x => /\([a-z]+\)\s*:/i.test(x)))) {
        let question = clean(rawQ, 1400);
        if (/\$\{/.test(question)) return { skip: 'Câu ' + (i + 1) + ' dùng dữ liệu động' };
        if (scramble) question += ' [' + cleanPlain(scramble, 300) + ']';
        const secLabel = cleanPlain(get('sec', 'part', 's', 'badge', 'section') || fallbackSection || '', 140);
        const exp = extractExplanation(get('hint', 'exp', 'expl', 'explanation', 'note', 'whyC', 'ok', 'an', 'vi'), vars);
        return {
          question: { type: 'text', q: question, o: [], a: 0, ansText, e: exp, s: secLabel, passage: '' }
        };
      }
    }

    if (!rawQ || o.length < 2 || a < 0 || a >= o.length) {
      return { skip: 'Câu ' + (i + 1) + ' chưa có đáp án rõ ràng' };
    }

    const partVal = get('part');
    let passage = '';
    if (typeof partVal === 'string' && passages.byId[partVal]) passage = passages.byId[partVal];
    else if (passages.list.length === 1) passage = passages.list[0];
    else if (Number.isInteger(partVal) && partVal >= 1) passage = passages.list[partVal - 1] || '';

    let question = clean(rawQ, 1400);
    if (/^(?:question|câu)\s*\d+[:.]?$/i.test(question) && instruction) {
      question = cleanPlain(instruction, 500) + ' · ' + question;
    }
    if (/\$\{/.test(question)) return { skip: 'Câu ' + (i + 1) + ' dùng dữ liệu động' };
    if (/passage\s*\d/i.test(question) && !passage) return { skip: 'Câu ' + (i + 1) + ' thiếu đoạn đọc' };

    const cleanedOpts = o.map(x => clean(x, 500));
    if (cleanedOpts.some(x => !x)) return { skip: 'Câu ' + (i + 1) + ' có phương án rỗng' };

    const secLabel = cleanPlain(get('sec', 's', 'badge', 'section') || (typeof partVal === 'string' && !passages.byId[partVal] ? partVal : '') || fallbackSection || '', 140);
    const exp = extractExplanation(get('hint', 'exp', 'expl', 'explanation', 'note', 'whyC', 'ok', 'an'), vars);

    return {
      question: { type: 'mc', q: question, o: cleanedOpts, a, e: exp, s: secLabel, passage }
    };
  }

  function parseArrayText(raw, html, wbank, vars, sectionHint) {
    const passages = passagesIn(html);
    const questions = [];
    const skipped = [];
    let items = null;

    if (raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) items = parsed;
      } catch (_) {}
    }

    if (!items) {
      const parts = objectParts(raw);
      if (!parts.length) return null;
      items = parts.map(parseObjectProps);
    }

    let seenObjects = 0;
    items.forEach((item, i) => {
      // Unwrap nested section objects (`SECTIONS = [{ group, sub, items: [...] }]` / `lessonData`)
      if (item && typeof item === 'object') {
        const isMap = !(item instanceof Array) && Object.getPrototypeOf(item) === null;
        const rawChildren = item.items || item.questions;
        if (rawChildren && (Array.isArray(rawChildren) || (typeof rawChildren === 'string' && rawChildren.trim().startsWith('[')))) {
          const secTitle = cleanPlain((isMap ? prop(item, vars, 'sub', 'title', 'group', 't', 's') : (item.sub || item.title || item.group || '')) || sectionHint, 140);
          let subHtml = html;
          const rawContent = item.content;
          if (typeof rawContent === 'string' && rawContent.trim().startsWith('[')) {
            const cParts = objectParts(rawContent).map(parseObjectProps).map(m => cleanPlain(prop(m, vars, 'en', 'text') || '', 800)).filter(Boolean);
            if (cParts.length) subHtml = '<div class="reading-passage">' + cParts.join(' ') + '</div>';
          }
          const subText = Array.isArray(rawChildren) ? JSON.stringify(rawChildren) : rawChildren;
          const subRes = parseArrayText(subText, subHtml, wbank, vars, secTitle);
          if (subRes) {
            seenObjects++;
            questions.push(...subRes.questions);
            skipped.push(...subRes.skipped);
            return;
          }
        }
      }

      const res = parseNormalizedItem(item, passages, wbank, vars, i, sectionHint);
      if (!res) return;
      seenObjects++;
      if (res.skips) skipped.push(...res.skips);
      else if (res.skip) skipped.push(res.skip);
      else if (res.question) questions.push(res.question);
    });

    if (!questions.length && !seenObjects) return null;
    const hardSkipped = skipped.filter(x => !x.startsWith('Nguồn thiếu'));
    return { questions, skipped, complete: !!questions.length && !hardSkipped.length };
  }

  function sectionsToQuiz(secs) {
    const questions = [], skipped = [];
    secs.forEach((sec, si) => {
      const label = cleanPlain(sec.title || sec.short || 'Phần ' + (si + 1), 160);
      (Array.isArray(sec.items) ? sec.items : []).forEach((item, ii) => {
        const prefix = label + ' · Câu ' + (item.num || ii + 1) + ': ';
        const e = clean(item.explain || item.exp || '', 2200);
        if (sec.type === 'mcq') {
          const o = Array.isArray(item.opts) ? item.opts.map(x => clean(x, 500)) : [];
          if (o.length < 2 || o.some(x => !x) || !Number.isInteger(item.correct) || item.correct < 0 || item.correct >= o.length) {
            skipped.push(prefix + 'thiếu đáp án'); return;
          }
          questions.push({ type: 'mc', q: prefix + clean(item.text, 1400), o, a: item.correct, e, s: label, passage: '' });
        } else if (sec.type === 'fill') {
          const parts = Array.isArray(item.parts) ? item.parts.map(x => clean(x, 900)) : [];
          const a = Array.isArray(item.ans) ? item.ans : [];
          if (!a.length || (parts.length !== a.length + 1 && parts.length !== a.length)) {
            skipped.push(prefix + 'số ô trống không khớp đáp án'); return;
          }
          const sentence = parts.map((p, i) => p + (i < a.length ? ' [' + (i + 1) + '] ______ ' : '')).join('');
          a.forEach((v, j) => {
            const ansText = answers(v);
            if (!ansText) { skipped.push(prefix + 'ô ' + (j + 1) + ' thiếu đáp án'); return; }
            questions.push({
              type: 'text',
              q: prefix + sentence + (a.length > 1 ? ' (Điền ô ' + (j + 1) + '/' + a.length + ')' : ''),
              o: [], a: 0, ansText, e, s: label, passage: ''
            });
          });
        } else if (sec.type === 'write') {
          const ansText = answers(item.acc || item.show || item.ans);
          if (!ansText) { skipped.push(prefix + 'thiếu đáp án viết'); return; }
          questions.push({
            type: 'text',
            q: prefix + clean(item.cue, 1400) + (item.pre ? ' Bắt đầu: ' + cleanPlain(item.pre, 160) : ''),
            o: [], a: 0, ansText, e, s: label, passage: ''
          });
        } else if (sec.type === 'errfix') {
          if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) {
            skipped.push(prefix + 'thiếu vị trí lỗi'); return;
          }
          questions.push({
            type: 'mc',
            q: prefix + clean(item.text, 1500).replace(/\s*Bấm chữ cái[^:]*:\s*/i, ' ').trim() + ' Chọn phần sai; xem cách sửa trong lời giải.',
            o: ['A', 'B', 'C', 'D'], a: item.correct,
            e: (item.fix ? 'Sửa thành: ' + answers(item.fix) + '. ' : '') + e, s: label, passage: ''
          });
        } else {
          skipped.push(prefix + 'dạng ' + sec.type + ' cần AI đọc');
        }
      });
    });
    return { questions, skipped, complete: !skipped.length };
  }

  function compactSections(secs) {
    return 'Dữ liệu đề gốc (giữ đáp án):\n' + JSON.stringify(secs.map(s => ({
      type: s.type, title: cleanPlain(s.title, 160), desc: cleanPlain(s.desc, 400),
      items: (s.items || []).map(i => ({
        text: clean(i.text, 1000), opts: i.opts, correct: i.correct,
        parts: i.parts, ans: i.ans, cue: clean(i.cue, 1000), acc: i.acc, fix: i.fix
      }))
    }))).slice(0, 30000);
  }

  function compactHtml(html, scripts) {
    const visible = clean(
      html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<(?:nav|header|footer)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer)>/gi, ''),
      7000
    );
    const candidates = scripts.map((script, index) => {
      const trimmed = script
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/function\s+(?:play\w+|tone|beep|ding|buzz|rs|loop|draw|initAudio|gAC)\b[\s\S]{0,600}?\}/gi, '');
      const terms = trimmed.match(/\b(?:correct|answer|answers|opts|options|question|questions|quizData|SECS|QS|AII_DATA|mcq|fil|fill|w20|w21|frData|EX\d+|ex\d+Data)\b/gi) || [];
      const calls = trimmed.match(/\b(?:mcq|fil|fill|w20|w21|b1|b2|b3)\s*\(/g) || [];
      const anchor = trimmed.search(/\b(?:SECS|QS|QUESTIONS|quizData|AII_DATA|frData|EX\d+|ex\d+Data)\s*=\s*\[|\b(?:mcq|fil|fill|w20|w21|b1|b2|b3)\s*\(/);
      return { script: trimmed, index, score: terms.length + calls.length * 3, anchor: Math.max(0, anchor) };
    }).filter(x => x.score >= 3).sort((a, b) => b.score - a.score);

    let data = '';
    for (const item of candidates.slice(0, 3)) {
      const budget = 22000 - data.length;
      if (budget < 1000) break;
      const start = Math.max(0, item.anchor - 200);
      data += '\n[Script ' + (item.index + 1) + ']\n' + item.script.slice(start, start + budget);
    }
    return 'Nội dung bài tập:\n' + visible + (data ? '\n\nDữ liệu câu hỏi trong trang:\n' + data : '');
  }

  function callArgs(src, start) {
    let quote = '', esc = false, line = false, block = false, paren = 1, square = 0, curly = 0, part = '', args = [];
    for (let i = start; i < src.length; i++) {
      const c = src[i], n = src[i + 1];
      if (line) { part += c; if (c === '\n') line = false; continue; }
      if (block) { part += c; if (c === '*' && n === '/') { part += n; block = false; i++; } continue; }
      if (quote) { part += c; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === quote) quote = ''; continue; }
      if (c === '/' && n === '/') { line = true; part += c + n; i++; continue; }
      if (c === '/' && n === '*') { block = true; part += c + n; i++; continue; }
      if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; part += c; continue; }
      if (c === '(') { paren++; part += c; continue; }
      if (c === ')') { if (--paren === 0) { args.push(part.trim()); return { args, end: i }; } part += c; continue; }
      if (c === '[') { square++; part += c; continue; }
      if (c === ']') { square--; part += c; continue; }
      if (c === '{') { curly++; part += c; continue; }
      if (c === '}') { curly--; part += c; continue; }
      if (c === ',' && paren === 1 && square === 0 && curly === 0) { args.push(part.trim()); part = ''; continue; }
      part += c;
    }
    return null;
  }

  function literalString(value, vars) {
    const text = String(value || '').trim();
    if (!text) return null;
    const c = text[0];
    if (c === '"' || c === "'" || c.charCodeAt(0) === 96) {
      const r = readQuoted(text, 0);
      return r ? r.value : null;
    }
    if (vars && /^[A-Za-z_$][\w$]*$/.test(text) && text in vars) return vars[text];
    return null;
  }

  function parseCalls(script, vars) {
    const questions = [], skipped = [];
    const re = /\b(mcq|fil|fill)\s*\(/g;
    let m, calls = 0;
    while ((m = re.exec(script))) {
      const before = script.slice(Math.max(0, m.index - 20), m.index);
      if (/\bfunction\s+$/.test(before)) continue;
      const call = callArgs(script, re.lastIndex);
      if (!call) continue;
      re.lastIndex = call.end + 1;
      const fn = m[1];
      const a = call.args;
      if (a.length < 4) continue;
      calls++;

      if (fn === 'fill' || fn === 'fil') {
        const sec = literalString(a[0], vars);
        const q = literalString(a[2], vars);
        if (!sec || !q) { skipped.push('Câu ' + calls + ' có dữ liệu động'); continue; }
        let ansList = [];
        const rawC = String(a[3] || '').trim();
        if (rawC.startsWith('[')) {
          const direct = stringList(rawC, vars);
          ansList = direct.length ? direct : (rawC.match(/(["'`])(?:\\.|(?!\1).)*\1/g) || []).map(x => quoted(x, 0));
        } else {
          const single = literalString(rawC, vars);
          if (single) ansList = [single];
        }
        let accList = [];
        const rawAcc = String(a[4] || '').trim();
        if (rawAcc.startsWith('[')) {
          accList = (rawAcc.match(/(["'`])(?:\\.|(?!\1).)*\1/g) || []).map(x => quoted(x, 0)).filter(Boolean);
        }
        const combined = [...new Set([...ansList, ...accList])].filter(Boolean);
        if (!combined.length) { skipped.push('Câu ' + calls + ' thiếu đáp án'); continue; }
        const cleanQ = clean(q.replace(/\[input\]/gi, '______'), 1400);
        questions.push({
          type: 'text', q: cleanQ, o: [], a: 0, ansText: combined.join(' | '),
          e: literalString(a[5], vars) ? clean(literalString(a[5], vars), 600) : '',
          s: cleanPlain(sec, 120), passage: ''
        });
        continue;
      }

      // Pattern A: mcq(sec, tag, q, key, opts)
      // Pattern B: mcq(num_int, q, opts, correctIdx, exp)
      const arg0Num = /^\d+$/.test(String(a[0] || '').trim());
      if (arg0Num && String(a[2] || '').trim().startsWith('[')) {
        const q = literalString(a[1], vars);
        const options = stringList(a[2], vars);
        const idxNum = /^\d+$/.test(String(a[3] || '').trim()) ? Number(a[3].trim()) : -1;
        if (!q || options.length < 2 || idxNum < 0 || idxNum >= options.length) {
          skipped.push('Câu ' + calls + ' thiếu phương án/đáp án'); continue;
        }
        questions.push({
          type: 'mc', q: clean(q, 1400), o: options.map(x => clean(x, 500)), a: idxNum,
          e: literalString(a[4], vars) ? clean(literalString(a[4], vars), 800) : '', s: '', passage: ''
        });
        continue;
      }

      const sec = literalString(a[0], vars);
      const q = literalString(a[2], vars);
      const key = literalString(a[3], vars);
      const keyNum = /^\d+$/.test(String(a[3] || '').trim()) ? Number(a[3].trim()) : null;
      if (!sec || !q || (!key && keyNum === null)) { skipped.push('Câu ' + calls + ' có dữ liệu động'); continue; }
      const options = stringList(a[4], vars);
      const correct = keyNum !== null ? keyNum : options.findIndex(x => cleanPlain(x).toLowerCase() === cleanPlain(key).toLowerCase());
      if (options.length < 2 || correct < 0 || correct >= options.length) {
        skipped.push('Câu ' + calls + ' thiếu phương án/đáp án'); continue;
      }
      questions.push({ type: 'mc', q: clean(q, 1400), o: options.map(x => clean(x, 500)), a: correct, e: '', s: cleanPlain(sec, 120), passage: '' });
    }
    return { questions, skipped, complete: calls > 0 && !skipped.length };
  }

  function parseSectionFills(script, vars) {
    const raw = jsArray(script, 'SECTIONS');
    if (!raw) return null;
    const sections = objectParts(raw), questions = [], skipped = [];
    let seen = 0;
    sections.forEach((section, si) => {
      const secMap = parseObjectProps(section);
      const title = cleanPlain(prop(secMap, vars, 'title') || 'Phần ' + (si + 1), 140);
      const qraw = secMap.questions;
      if (!qraw) return;
      objectParts(qraw).forEach(item => {
        seen++;
        const m = parseObjectProps(item);
        const pre = prop(m, vars, 'pre'), post = prop(m, vars, 'post');
        const answer = prop(m, vars, 'key');
        const accepted = stringList(m.answers, vars);
        if (typeof pre !== 'string' || typeof post !== 'string' || (!answer && !accepted.length)) {
          skipped.push('Câu ' + seen + ' thiếu dữ liệu'); return;
        }
        const ans = [answer, ...accepted].filter(Boolean);
        questions.push({
          type: 'text', q: clean(pre + ' ______ ' + post, 1400),
          o: [], a: 0, ansText: [...new Set(ans)].join(' | '), e: '', s: title, passage: ''
        });
      });
    });
    return seen ? { questions, skipped, complete: !skipped.length } : null;
  }

  function parseParts(script, vars) {
    const raw = jsArray(script, 'PARTS');
    if (!raw) return null;
    const sections = objectParts(raw), questions = [], skipped = [];
    let seen = 0;
    sections.forEach((section, si) => {
      const secMap = parseObjectProps(section);
      const title = cleanPlain(prop(secMap, vars, 't', 's', 'title') || 'Phần ' + (si + 1), 150);
      const qraw = secMap.q;
      if (!qraw) return;
      objectParts(qraw).forEach(item => {
        seen++;
        const m = parseObjectProps(item);
        const q = prop(m, vars, 'q', 'text', 'question');
        const o = stringList(m.o || m.options || m.opts, vars);
        const key = prop(m, vars, 'a', 'correct', 'ans');
        const a = findMatchingOptionIndex(o, key);
        if (!q || o.length < 2 || a < 0 || a >= o.length) { skipped.push('Câu ' + seen + ' thiếu đáp án'); return; }
        questions.push({ type: 'mc', q: clean(q, 1400), o: o.map(x => clean(x, 500)), a, e: '', s: title, passage: '' });
      });
    });
    return seen ? { questions, skipped, complete: !skipped.length } : null;
  }

  function parseUsedToCalls(script, vars) {
    if (!/\bconst\s+b1\s*=/.test(script) || !/\bconst\s+b2\s*=/.test(script)) return null;
    const questions = [], skipped = [];
    const re = /\b(b1|b2|b3)\s*\(/g;
    let m, calls = 0;
    while ((m = re.exec(script))) {
      const call = callArgs(script, re.lastIndex);
      if (!call) continue;
      re.lastIndex = call.end + 1;
      calls++;
      const args = call.args, name = m[1];
      if (name === 'b2') {
        const q = literalString(args[1], vars), key = literalString(args[2], vars), o = stringList(args[3], vars);
        const a = findMatchingOptionIndex(o, key);
        if (!q || !key || o.length < 2 || a < 0) { skipped.push('Câu ' + calls + ' thiếu dữ liệu'); continue; }
        questions.push({
          type: 'mc',
          q: clean(q.replace(/<span\s+class=["']bl["']>\?<\/span>/gi, '______'), 1400),
          o: o.map(x => clean(x, 500)), a, e: '', s: 'Used to', passage: ''
        });
      } else {
        const given = literalString(args[1], vars), root = name === 'b3' ? literalString(args[2], vars) : '';
        const key = literalString(args[name === 'b3' ? 3 : 4], vars);
        const accepted = stringList(args[name === 'b3' ? 4 : 5], vars);
        if (!given || !key) { skipped.push('Câu ' + calls + ' thiếu đáp án'); continue; }
        const mode = name === 'b1' ? literalString(args[3], vars) : '';
        const prefix = name === 'b1' ? 'Viết lại câu ' + (mode === '-' ? 'phủ định' : mode === '?' ? 'nghi vấn' : 'khẳng định') + ': ' : '';
        const q = prefix + given.replace(/<span\s+class=["']bl["']>\?<\/span>/gi, '______') + (root ? ' (' + root + ')' : '');
        questions.push({
          type: 'text', q: clean(q, 1400), o: [], a: 0,
          ansText: [...new Set([key, ...accepted])].join(' | '), e: '', s: 'Used to', passage: ''
        });
      }
    }
    return calls ? { questions, skipped, complete: !skipped.length } : null;
  }

  function parsePushQs(script, html, wbank, vars) {
    if (!/\bQS\.push\s*\(/.test(script)) return null;
    const passages = Object.create(null);
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      let group = '';
      for (const block of doc.querySelectorAll('.lp .pc')) {
        const label = block.querySelector('.plbl')?.textContent || '';
        const found = /\bEx\d+\b/i.exec(label);
        if (found) group = found[0].toLowerCase();
        const line = block.querySelector('.pt')?.textContent?.trim();
        if (group && line) passages[group] = (passages[group] ? passages[group] + '\n' : '') + line;
      }
    } else {
      // Lightweight fallback for .lp .pc blocks in Node
      const parts = html.split(/class=["'][^"']*\bpc\b[^"']*["']/i).slice(1);
      let group = '';
      for (const blk of parts) {
        const lm = /class=["'][^"']*plbl[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(blk);
        const found = lm ? /\bEx\d+\b/i.exec(lm[1]) : null;
        if (found) group = found[0].toLowerCase();
        const pm = /class=["'][^"']*\bpt\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(blk);
        const line = pm ? cleanPlain(pm[1], 1000) : '';
        if (group && line) passages[group] = (passages[group] ? passages[group] + '\n' : '') + line;
      }
    }
    const questions = [], skipped = [];
    const re = /\bQS\.push\s*\(/g;
    let m, calls = 0;
    while ((m = re.exec(script))) {
      const call = callArgs(script, re.lastIndex);
      if (!call) continue;
      re.lastIndex = call.end + 1;
      calls++;
      const partText = call.args[0];
      if (!partText || !partText.trim().startsWith('{')) continue;
      const pm = parseObjectProps(partText);
      const q = prop(pm, vars, 'qt', 'q', 'text', 'question');
      const sec = prop(pm, vars, 'sec', 's') || '';
      const rawOpts = pm.opts || pm.options || pm.o || '';
      let o = [], correctIdx = -1;

      const trimmedOpts = String(rawOpts).trim();
      const wbCall = /^wbankOpts\s*\(\s*(["'`])([\s\S]+?)\1/.exec(trimmedOpts);
      const tfCall = !wbCall ? /^(?:tfOpts|TF2)\s*\(\s*(?:true|false|(["'])(true|false)\1)\s*\)/i.exec(trimmedOpts) : null;
      const cCall = (!wbCall && !tfCall) ? /^C\s*\(\s*(\[[\s\S]+\])\s*,\s*(["'`])([\s\S]+?)\2/.exec(trimmedOpts) : null;
      if (wbCall) {
        const wb = wbankDistractors(wbank, wbCall[2]);
        if (wb) { o = wb.options; correctIdx = wb.correct; }
      } else if (tfCall) {
        o = ['Đúng (True)', 'Sai (False)'];
        const tfBool = (tfCall[2] || trimmedOpts).toLowerCase().includes('true');
        correctIdx = tfBool ? 0 : 1;
      } else if (cCall) {
        o = stringList(cCall[1], vars);
        correctIdx = findMatchingOptionIndex(o, cCall[3]);
      } else {
        const optParts = objectParts(rawOpts || '[]');
        if (optParts.length) {
          const maps = optParts.map(parseObjectProps);
          o = maps.map(x => String(prop(x, vars, 't', 'text', 'w') || ''));
          const marked = maps.map((x, j) => {
            const ic = prop(x, vars, 'c', 'ok', 'correct', 'isCorrect');
            return (ic === 1 || ic === true) ? j : -1;
          }).filter(j => j >= 0);
          if (marked.length === 1) correctIdx = marked[0];
        } else {
          o = stringList(rawOpts, vars);
          correctIdx = findMatchingOptionIndex(o, prop(pm, vars, 'a', 'correct', 'ans'));
        }
      }

      const group = /\bEx\d+\b/i.exec(sec);
      if (!q || o.length < 2 || correctIdx < 0 || correctIdx >= o.length) {
        skipped.push('Câu ' + calls + ' thiếu dữ liệu/đáp án'); continue;
      }
      questions.push({
        type: 'mc', q: clean(q, 1400), o: o.map(x => clean(x, 500)), a: correctIdx,
        e: clean(prop(pm, vars, 'ok', 'tr', 'exp') || '', 500),
        s: cleanPlain(sec, 140),
        passage: group ? passages[group[0].toLowerCase()] || '' : ''
      });
    }
    return calls ? { questions, skipped, complete: !!questions.length && !skipped.length } : null;
  }

  function parseDomQuestions(html) {
    const passages = passagesIn(html);
    const questions = [], skipped = [];

    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cards = doc.querySelectorAll('.question-box, .q-card, .question-card, .question-item, .quiz-item, [data-question]');
      cards.forEach((card, idx) => {
        const qEl = card.querySelector('.q-text, .question-text, .q-title, .prompt') || card.querySelector('p');
        const q = qEl ? clean(qEl.innerHTML, 1400) : '';
        if (!q || /\$\{/.test(q)) return;
        const optEls = [...card.querySelectorAll('.opt-btn, .option-btn, .option, .choice, button[data-val], button[data-correct]')];
        if (optEls.length < 2) return;
        const o = optEls.map(el => clean(el.innerHTML, 500));
        const marked = optEls.map((el, j) => {
          const dv = el.getAttribute('data-val');
          const dc = el.getAttribute('data-correct');
          const da = el.getAttribute('data-ans');
          return (dv === '1' || dv === 'true' || dc === '1' || dc === 'true' || da === '1' || da === 'true') ? j : -1;
        }).filter(j => j >= 0);
        if (marked.length !== 1 || o.some(x => !x)) {
          skipped.push('Câu ' + (idx + 1) + ' chưa rõ đáp án DOM');
          return;
        }
        const expEl = card.querySelector('.exp-box, .expl-box, .explanation');
        const e = expEl ? clean(expEl.innerHTML, 900) : '';
        const pEl = card.closest('.reading-section')?.querySelector('.reading-text, .reading-passage, .passage');
        const passage = pEl ? clean(pEl.textContent, 7000) : (passages.list.length === 1 ? passages.list[0] : '');
        questions.push({ type: 'mc', q, o, a: marked[0], e, s: '', passage });
      });
      return questions.length ? { questions, skipped, complete: !skipped.length } : null;
    }

    const blocks = html.split(/<div\b[^>]*class=["'][^"']*(?:question-box|q-card|question-card|question-item|quiz-item)[^"']*["'][^>]*>/i).slice(1);
    if (!blocks.length) return null;
    blocks.forEach((blk, idx) => {
      const qm = /<div\b[^>]*class=["'][^"']*(?:q-text|question-text|q-title)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(blk);
      if (!qm) return;
      const q = clean(qm[1], 1400);
      if (!q || /\$\{/.test(q)) return;
      const optMatches = [...blk.matchAll(/<(?:button|div|li|label)\b([^>]*\b(?:opt-btn|option-btn|data-val|data-correct)[^>]*)>([\s\S]*?)<\/(?:button|div|li|label)>/gi)];
      if (optMatches.length < 2) return;
      const o = [], marked = [];
      optMatches.forEach((om, j) => {
        o.push(clean(om[2], 500));
        if (/\bdata-(?:val|correct|ans)=["'](?:1|true)["']/i.test(om[1])) marked.push(j);
      });
      if (marked.length !== 1 || o.some(x => !x)) {
        skipped.push('Câu ' + (idx + 1) + ' chưa rõ đáp án DOM');
        return;
      }
      const em = /<div\b[^>]*class=["'][^"']*(?:exp-box|expl-box|explanation)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(blk);
      questions.push({ type: 'mc', q, o, a: marked[0], e: em ? clean(em[1], 900) : '', s: '', passage: passages.list.length === 1 ? passages.list[0] : '' });
    });
    return questions.length ? { questions, skipped, complete: !skipped.length } : null;
  }

  function dedupeQuestions(list) {
    const out = [], seen = new Set();
    for (const q of list) {
      const sig = (q.q + '|' + (q.o || []).join('|') + '|' + (q.ansText || '') + '|' + (q.passage || '')).toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(sig)) { seen.add(sig); out.push(q); }
    }
    return out;
  }

  function parse(html) {
    const tm = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    const title = cleanPlain(tm ? tm[1] : 'Bài tập tiếng Anh', 180);
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => m[1]);

    if (html.length < 4000 && /Nội dung bài tập đang được hoàn thiện|Liên hệ hỗ trợ:/i.test(html) && scripts.every(s => s.length < 200)) {
      return { title, questions: [], skipped: [], complete: false, placeholder: true, aiInput: '', format: 'placeholder' };
    }

    for (const script of scripts) {
      const raw = jsArray(script, 'SECS');
      if (!raw) continue;
      try {
        const secs = JSON.parse(raw);
        if (Array.isArray(secs) && secs.length) {
          return { title, ...sectionsToQuiz(secs), aiInput: compactSections(secs), format: 'SECS' };
        }
      } catch (_) {}
    }

    const wbank = extractWbank(scripts);
    const aiInput = compactHtml(html, scripts);
    const mergedQs = [], mergedSkips = [], formats = [];

    for (const script of scripts) {
      const vars = extractStringVars(script);

      for (const arr of allJsArrays(script)) {
        const res = parseArrayText(arr.raw, html, wbank, vars, '');
        if (res && res.questions.length) {
          mergedQs.push(...res.questions);
          mergedSkips.push(...res.skipped);
          formats.push(arr.name);
        }
      }

      const pPush = parsePushQs(script, html, wbank, vars);
      if (pPush?.questions.length) {
        mergedQs.push(...pPush.questions);
        mergedSkips.push(...pPush.skipped);
        formats.push('QS.push');
      }

      const pUsed = parseUsedToCalls(script, vars);
      if (pUsed?.questions.length) {
        mergedQs.push(...pUsed.questions);
        mergedSkips.push(...pUsed.skipped);
        formats.push('used-to-calls');
      }

      const pParts = parseParts(script, vars);
      if (pParts?.questions.length) {
        mergedQs.push(...pParts.questions);
        mergedSkips.push(...pParts.skipped);
        formats.push('PARTS');
      }

      const pSec = parseSectionFills(script, vars);
      if (pSec?.questions.length) {
        mergedQs.push(...pSec.questions);
        mergedSkips.push(...pSec.skipped);
        formats.push('SECTIONS-fill');
      }

      const pCalls = parseCalls(script, vars);
      if (pCalls?.questions.length) {
        mergedQs.push(...pCalls.questions);
        mergedSkips.push(...pCalls.skipped);
        formats.push('calls');
      }
    }

    if (mergedQs.length) {
      const questions = dedupeQuestions(mergedQs);
      const hardSkips = mergedSkips.filter(x => !x.startsWith('Nguồn thiếu'));
      return {
        title, questions, skipped: mergedSkips,
        complete: !hardSkips.length,
        aiInput,
        aiSkippedInput: hardSkips.length ? 'Chỉ đọc các câu còn thiếu (' + hardSkips.slice(0, 8).join('; ') + '):\n' + aiInput : '',
        format: [...new Set(formats)].join('+')
      };
    }

    const domRes = parseDomQuestions(html);
    if (domRes?.questions.length) {
      return { title, ...domRes, aiInput, format: 'DOM' };
    }

    return { title, questions: [], skipped: [], complete: false, aiInput, format: 'other' };
  }

  root.GCLink = { parse };
})(typeof window === 'undefined' ? globalThis : window);
