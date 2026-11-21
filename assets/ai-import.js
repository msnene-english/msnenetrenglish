/* AI nhập đề cho giáo viên Pro. Firebase AI Logic giữ khóa Gemini ngoài mã web. */
const SDK = '13.2.0';
const BASE = 'https://www.gstatic.com/firebasejs/' + SDK + '/';
const PDFJS_VER = '4.10.38';
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.worker.min.mjs';
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const CACHE_KEY = 'msnene_ai_quiz_cache_v2';
const MAX_CACHE_ITEMS = 8;

let modelPromise;
let appCheckInstance;
let aiInstance;
let makeModel;
let SchemaRef;
let ThinkingLevelRef;
let smartModel;
let fastQuizModel;
let fastModel;
let quizFallbackModel;
let pdfjsPromise;
const memCache = new Map();

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })
  ]).finally(() => clearTimeout(timer));
}

function buildQuizSchema(Schema) {
  if (!Schema) return undefined;
  return Schema.object({
    properties: {
      passages: Schema.array({
        items: Schema.object({
          properties: {
            id: Schema.string(),
            text: Schema.string()
          }
        })
      }),
      questions: Schema.array({
        items: Schema.object({
          properties: {
            type: Schema.enumString({ enum: ['mc', 'text', 'speaking'] }),
            q: Schema.string(),
            passageId: Schema.string(),
            o: Schema.array({ items: Schema.string() }),
            a: Schema.integer({ nullable: true }),
            answerLetter: Schema.string(),
            answerSource: Schema.enumString({ enum: ['provided', 'inferred', 'unknown'] }),
            ansText: Schema.string(),
            targetText: Schema.string(),
            ipa: Schema.string(),
            e: Schema.string(),
            s: Schema.string()
          },
          optionalProperties: ['passageId', 'o', 'a', 'answerLetter', 'ansText', 'targetText', 'ipa', 'e', 's']
        })
      })
    },
    optionalProperties: ['passages']
  });
}

async function initModels() {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    const cfg = window.GAME_CONFIG && window.GAME_CONFIG.firebase;
    if (!cfg || !cfg.apiKey || !cfg.appId) {
      throw new Error('Thiếu cấu hình ứng dụng Web Firebase.');
    }
    if (!cfg.appCheckSiteKey || cfg.appCheckSiteKey === 'PASTE_RECAPTCHA_ENTERPRISE_SITE_KEY') {
      throw new Error('Chưa cấu hình Firebase App Check cho tính năng AI.');
    }
    const [{ initializeApp, getApps }, { initializeAppCheck, ReCaptchaEnterpriseProvider, getLimitedUseToken },
      { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel, Schema }] = await withTimeout(Promise.all([
      import(BASE + 'firebase-app.js'),
      import(BASE + 'firebase-app-check.js'),
      import(BASE + 'firebase-ai.js')
    ]), 30000, 'Không tải được thư viện AI trong 30 giây. Hãy kiểm tra kết nối mạng.');

    const app = getApps().find(item => item.name === 'msnene-ai') ||
      initializeApp(cfg, 'msnene-ai');
    const appCheck = appCheckInstance || (appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    }));
    await withTimeout(getLimitedUseToken(appCheck), 20000,
      'Không xác minh được App Check sau 20 giây. Hãy kiểm tra khóa reCAPTCHA và tên miền web.');
    const ai = getAI(app, {
      backend: new GoogleAIBackend(),
      useLimitedUseAppCheckTokens: true
    });
    aiInstance = ai;
    makeModel = getGenerativeModel;
    SchemaRef = Schema;
    ThinkingLevelRef = ThinkingLevel;

    const responseSchema = buildQuizSchema(SchemaRef);
    const baseCfg = {
      responseMimeType: 'application/json',
      ...(responseSchema ? { responseSchema } : {}),
      maxOutputTokens: 16384
    };

    smartModel = getGenerativeModel(ai, {
      model: 'gemini-3.8-flash',
      generationConfig: {
        ...baseCfg,
        ...(ThinkingLevelRef ? { thinkingConfig: { thinkingLevel: ThinkingLevelRef.LOW } } : {})
      }
    }, { timeout: 240000 });

    return smartModel;
  })();
  try { return await modelPromise; }
  catch (error) { modelPromise = null; throw error; }
}

function getFastQuizModel() {
  if (!aiInstance || !makeModel) return smartModel;
  if (!fastQuizModel) {
    const responseSchema = buildQuizSchema(SchemaRef);
    fastQuizModel = makeModel(aiInstance, {
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        ...(responseSchema ? { responseSchema } : {}),
        maxOutputTokens: 16384
      }
    }, { timeout: 180000 });
  }
  return fastQuizModel;
}

function getFallbackLiteModel() {
  if (!aiInstance || !makeModel) return smartModel;
  if (!quizFallbackModel) {
    quizFallbackModel = makeModel(aiInstance, {
      model: 'gemini-3.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16384 }
    }, { timeout: 240000 });
  }
  return quizFallbackModel;
}

export function prewarm() {
  try { initModels().catch(() => {}); } catch (_) {}
}

function dataUrlPart(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Chỉ hỗ trợ ảnh PNG, JPG, WebP, GIF hoặc tệp PDF.');
  if (match[2].length > MAX_FILE_BYTES * 4 / 3 + 8) {
    throw new Error('Tệp quá lớn. Hãy chọn tệp dưới 15 MB.');
  }
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

async function filePart(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('PDF quá lớn. Hãy chọn tệp dưới 15 MB.');
  }
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    throw new Error('Hãy chọn tệp PDF hợp lệ.');
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được tệp PDF.'));
    reader.readAsDataURL(file);
  });
  return dataUrlPart(dataUrl.replace(/^data:[^;]*/, 'data:application/pdf'));
}

export async function compressImageDataUrl(dataUrl, maxSide = 1600, quality = 0.82) {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || !/^data:image\//i.test(dataUrl)) {
    return dataUrl;
  }
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (!w || !h) return dataUrl;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    if (scale === 1 && dataUrl.length < 220000) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, 0, 0, tw, th);
    const out = canvas.toDataURL('image/jpeg', quality);
    return out && out.length < dataUrl.length ? out : dataUrl;
  } catch (_) {
    return dataUrl;
  }
}

export function splitTextIntoChunks(text, maxChunkChars = 9200) {
  const cleanStr = String(text || '').trim();
  if (!cleanStr || cleanStr.length <= maxChunkChars) return cleanStr ? [cleanStr] : [];

  const chunks = [];
  let cursor = 0;
  while (cursor < cleanStr.length) {
    let end = Math.min(cleanStr.length, cursor + maxChunkChars);
    if (end < cleanStr.length) {
      // Prefer splitting before a blank line or numbered question heading in upper 35% of window
      const searchFrom = cursor + Math.floor(maxChunkChars * 0.65);
      const windowStr = cleanStr.slice(searchFrom, end);
      const qMatch = windowStr.search(/\n(?=(?:Question|Câu|Bài|Part|Section|EXERCISE)\s*\d|\d+[.)]\s)/i);
      if (qMatch >= 0) {
        end = searchFrom + qMatch;
      } else {
        const para = cleanStr.lastIndexOf('\n\n', end);
        if (para > searchFrom) end = para;
        else {
          const nl = cleanStr.lastIndexOf('\n', end);
          if (nl > searchFrom) end = nl;
        }
      }
    }
    const piece = cleanStr.slice(cursor, end).trim();
    if (piece) chunks.push(piece);
    cursor = end;
  }
  return chunks;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolvePassagesMap(payload) {
  const map = new Map();
  if (!payload || Array.isArray(payload)) return map;
  const rawPassages = payload.passages;
  if (Array.isArray(rawPassages)) {
    rawPassages.forEach(entry => {
      if (entry && typeof entry === 'object') {
        const id = normalizeText(entry.id);
        const text = normalizeText(entry.text || entry.content);
        if (id && text) map.set(id, text);
      }
    });
  } else if (rawPassages && typeof rawPassages === 'object') {
    Object.entries(rawPassages).forEach(([id, text]) => {
      const k = normalizeText(id);
      const v = normalizeText(text);
      if (k && v) map.set(k, v);
    });
  }
  return map;
}

export function normalizeQuiz(payload) {
  const source = Array.isArray(payload) ? payload : payload && payload.questions;
  if (!Array.isArray(source)) throw new Error('AI trả về dữ liệu câu hỏi sai định dạng.');
  const passagesMap = resolvePassagesMap(payload);
  const questions = [];
  const skipped = [];
  const seen = new Set();
  let inferredCount = 0;

  source.forEach((item, index) => {
    const label = 'Câu ' + (index + 1);
    if (!item || typeof item !== 'object') {
      skipped.push(label + ': không có dữ liệu.');
      return;
    }
    const q = normalizeText(item.q);
    if (!q || /^(?:question|câu)\s*\d+[.\s:]*$/i.test(q)) {
      skipped.push(label + ': thiếu nội dung câu hỏi.');
      return;
    }
    const type = item.type === 'speaking' ? 'speaking' : item.type === 'text' ? 'text' : 'mc';
    const result = { ...item, q, type };
    result.e = normalizeText(item.e);
    result.s = normalizeText(item.s);
    const pid = normalizeText(item.passageId);
    result.passage = normalizeText(item.passage) || (pid && passagesMap.get(pid)) || '';
    result.ipa = normalizeText(item.ipa);
    result.audio = '';
    result.img = '';
    let needsReview = false;
    if (type === 'speaking') {
      result.targetText = normalizeText(item.targetText || item.ansText);
      if (!result.targetText) {
        skipped.push(label + ': thiếu nội dung cần đọc.');
        return;
      }
      result.o = [];
      result.a = 0;
    } else {
      const sourceTag = normalizeText(item.answerSource).toLowerCase();
      if (sourceTag === 'unknown' || sourceTag === 'uncertain') {
        skipped.push(label + ': AI chưa xác định được đáp án.');
        return;
      }
      if (type === 'text') {
        result.ansText = normalizeText(item.ansText);
        if (!result.ansText) {
          skipped.push(label + ': thiếu đáp án tự luận.');
          return;
        }
        result.o = [];
        result.a = 0;
      } else {
        const options = Array.isArray(item.o) ? item.o.map(normalizeText) : [];
        const numericAnswer = typeof item.a === 'string' && /^\d+$/.test(item.a.trim())
          ? Number(item.a.trim()) : item.a;
        const answerLetter = normalizeText(item.answerLetter).toUpperCase();
        const letterAnswer = /^[A-F]$/.test(answerLetter)
          ? answerLetter.charCodeAt(0) - 65 : null;
        if (options.length < 2 || options.length > 6 || options.some(value => !value) ||
            new Set(options.map(value => value.toLocaleLowerCase())).size !== options.length) {
          skipped.push(label + ': phương án thiếu, trùng hoặc sai định dạng.');
          return;
        }
        if (letterAnswer !== null && Number.isInteger(numericAnswer) &&
            letterAnswer !== numericAnswer) {
          skipped.push(label + ': chữ cái và vị trí đáp án AI đưa ra không khớp.');
          return;
        }
        const answer = letterAnswer !== null ? letterAnswer : numericAnswer;
        if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
          skipped.push(label + ': thiếu hoặc sai vị trí đáp án đúng.');
          return;
        }
        result.o = options;
        result.a = answer;
      }
      needsReview = sourceTag !== 'provided';
    }
    const signature = (q + '|' + (result.o || []).join('|') + '|' +
      normalizeText(result.passage)).toLocaleLowerCase().replace(/\s+/g, ' ');
    if (seen.has(signature)) {
      skipped.push(label + ': trùng với câu trước.');
      return;
    }
    seen.add(signature);
    if (needsReview) {
      inferredCount++;
      if (!result.e.startsWith('⚠️ Đáp án do AI suy luận')) {
        result.e = '⚠️ Đáp án do AI suy luận, cô cần kiểm tra. ' + result.e;
      }
    }
    questions.push(result);
  });
  return { questions, skipped, inferredCount };
}

async function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = (async () => {
    const lib = await withTimeout(import(PDFJS_CDN), 12000, 'Không tải được trình đọc PDF nhanh.');
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    }
    return lib;
  })();
  try { return await pdfjsPromise; }
  catch (e) { pdfjsPromise = null; throw e; }
}

function extractPageTextLines(textContent) {
  if (!textContent || !Array.isArray(textContent.items)) return '';
  let out = '';
  let lastY = null;
  for (const item of textContent.items) {
    const s = item && typeof item.str === 'string' ? item.str : '';
    if (!s) continue;
    const y = Array.isArray(item.transform) ? item.transform[5] : null;
    if (lastY !== null && y !== null && Math.abs(lastY - y) > 4) out += '\n';
    else if (out && !out.endsWith(' ') && !out.endsWith('\n')) out += ' ';
    out += s;
    if (y !== null) lastY = y;
  }
  return out.replace(/[^\S\r\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export async function preparePdfBatches(file, onProgress) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('PDF quá lớn. Hãy chọn tệp dưới 15 MB.');
  }
  try {
    const pdfjs = await loadPdfJs();
    onProgress?.({ phase: 'pdf-init', message: '📄 Đang tách trang PDF…' });
    const data = await file.arrayBuffer();
    const doc = await withTimeout(pdfjs.getDocument({ data }).promise, 15000, 'Không đọc được cấu trúc PDF.');
    const numPages = Math.min(doc.numPages || 0, 24);
    if (!numPages) throw new Error('Tệp PDF trống.');

    const textPages = [];
    const visualImages = [];

    for (let p = 1; p <= numPages; p++) {
      onProgress?.({ phase: 'pdf-scan', done: p, total: numPages, message: `📄 Đang đọc trang ${p}/${numPages}…` });
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      const pageText = extractPageTextLines(tc);
      const nonSpace = pageText.replace(/\s+/g, '').length;
      const needsUnderlineVision = /\b(?:underlined|pronunciation|gạch chân|phần gạch dưới)\b/i.test(pageText);

      if (nonSpace >= 80 && !needsUnderlineVision) {
        textPages.push(`[Trang ${p}]\n${pageText}`);
      } else {
        const vp0 = page.getViewport({ scale: 1 });
        const maxSide = 1400;
        const scale = Math.min(2, Math.max(1, maxSide / Math.max(vp0.width || 800, vp0.height || 1000)));
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        visualImages.push(canvas.toDataURL('image/jpeg', 0.80));
      }
    }

    const batches = [];
    if (textPages.length) {
      const textChunks = splitTextIntoChunks(textPages.join('\n\n'), 9000);
      textChunks.forEach(chunk => batches.push({ kind: 'text', data: chunk }));
    }
    for (let i = 0; i < visualImages.length; i += 2) {
      batches.push({ kind: 'images', data: visualImages.slice(i, i + 2), imageStart: i + 1 });
    }
    if (batches.length) return { batches, numPages, textPages: textPages.length, visualPages: visualImages.length };
  } catch (err) {
    console.warn('PDF.js fallback to direct PDF upload:', err?.message || err);
  }
  return { batches: [{ kind: 'file', data: file }], numPages: 1, textPages: 0, visualPages: 1 };
}

async function streamOrGenerate(aiModel, parts, onChunkCount) {
  if (typeof aiModel.generateContentStream === 'function') {
    const streamRes = await withTimeout(aiModel.generateContentStream(parts), 180000,
      'AI chưa phản hồi sau 3 phút. Hãy thử lại với ít trang hơn.');
    let raw = '';
    for await (const chunk of streamRes.stream) {
      const piece = typeof chunk.text === 'function' ? chunk.text() : '';
      if (piece) {
        raw += piece;
        if (onChunkCount) {
          const matches = raw.match(/"q"\s*:/g);
          if (matches) onChunkCount(matches.length);
        }
      }
    }
    if (!raw && streamRes.response) {
      const resp = await streamRes.response;
      raw = resp.text();
    }
    return raw;
  }
  const result = await withTimeout(aiModel.generateContent(parts), 240000,
    'AI chưa phản hồi sau 4 phút. Hãy thử lại với ít trang hơn.');
  const response = await withTimeout(result.response, 10000, 'AI chưa trả kết quả. Hãy thử lại.');
  return response.text();
}

async function generatePart(primaryModel, prompt, batchInput, imageStart, onChunkCount) {
  const parts = [{ text: prompt }];
  if (typeof File !== 'undefined' && batchInput instanceof File) {
    parts.push(await filePart(batchInput));
  } else if (Array.isArray(batchInput)) {
    parts[0].text += '\n\nChỉ đọc câu hỏi trong ảnh số ' + imageStart +
      ' đến ' + (imageStart + batchInput.length - 1) +
      '. Giữ đúng thứ tự, không thêm câu từ ảnh khác.';
    batchInput.forEach(value => parts.push(dataUrlPart(value)));
  } else if (typeof batchInput === 'string' && batchInput.startsWith('data:')) {
    parts.push(dataUrlPart(batchInput));
  } else if (typeof batchInput === 'string') {
    parts[0].text += '\n\nNội dung đề bài:\n---\n' + batchInput.slice(0, 32000) + '\n---';
  } else {
    throw new Error('Không có nội dung đề bài để AI đọc.');
  }

  let raw;
  try {
    raw = await streamOrGenerate(primaryModel, parts, onChunkCount);
    if (!raw) throw new Error('empty_raw');
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (_) { throw new Error('bad_json'); }
    return normalizeQuiz(parsed);
  } catch (error) {
    const msg = String(error?.message || error);
    // Fallback to smartModel if fastModel produced empty/incomplete JSON, or to Lite on 500/503 overload
    if ((msg === 'empty_raw' || msg === 'bad_json') && primaryModel !== smartModel) {
      raw = await streamOrGenerate(smartModel, parts, onChunkCount);
    } else if (/\[50[023]\b|high demand|temporar/i.test(msg)) {
      raw = await streamOrGenerate(getFallbackLiteModel(), parts, onChunkCount);
    } else if (msg === 'empty_raw') {
      throw new Error('AI không trả về câu hỏi.');
    } else if (msg === 'bad_json') {
      throw new Error('AI trả về JSON chưa đầy đủ. Hãy thử ít trang hơn hoặc chia PDF.');
    } else {
      throw error;
    }
  }

  if (!raw) throw new Error('AI không trả về câu hỏi.');
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('AI trả về JSON chưa đầy đủ. Hãy thử ít trang hơn hoặc chia PDF.'); }
  return normalizeQuiz(parsed);
}

export async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function computeCacheKey(input, options) {
  let sig = '';
  if (typeof File !== 'undefined' && input instanceof File) {
    sig = 'file:' + input.name + ':' + input.size + ':' + input.lastModified;
  } else if (Array.isArray(input)) {
    sig = 'imgs:' + input.length + ':' + input.map(s => s.length + '_' + s.slice(0, 64) + s.slice(-32)).join('|');
  } else {
    const str = String(input || '');
    sig = 'txt:' + str.length + ':' + str.slice(0, 2000) + '|' + str.slice(-1000);
  }
  const full = `${options.isTestMode ? 'T' : 'G'}|${options.fastExplain ? 'FE' : 'FULL'}|${sig}`;
  try {
    if (globalThis.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(full));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  let h = 2166136261;
  for (let i = 0; i < full.length; i++) {
    h ^= full.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fnv_' + (h >>> 0).toString(16) + '_' + full.length;
}

function readCache(key) {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj[key]) {
      memCache.set(key, obj[key]);
      return obj[key];
    }
  } catch (_) {}
  return null;
}

function writeCache(key, value) {
  memCache.set(key, value);
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[key] = value;
    const keys = Object.keys(obj);
    if (keys.length > MAX_CACHE_ITEMS) {
      keys.slice(0, keys.length - MAX_CACHE_ITEMS).forEach(k => delete obj[k]);
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (_) {}
}

export async function generateJson(prompt, timeoutMs = 20000) {
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Thiếu nội dung cần AI xử lý.');
  await initModels();
  if (!fastModel) {
    fastModel = makeModel(aiInstance, {
      model: 'gemini-3.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
    });
  }
  const result = await withTimeout(fastModel.generateContent([{ text: prompt.slice(0, 12000) }]), timeoutMs,
    'AI chưa phản hồi. Hãy thử lại sau.');
  const response = await withTimeout(result.response, 10000, 'AI chưa trả kết quả.');
  const raw = response.text();
  if (!raw) throw new Error('AI trả về nội dung rỗng.');
  try { return JSON.parse(raw); }
  catch { throw new Error('AI trả về dữ liệu sai định dạng.'); }
}

export async function generateQuiz(prompt, input, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  if (Array.isArray(input)) {
    if (!input.length) throw new Error('Chưa chọn ảnh để AI đọc.');
    if (input.length > 12) throw new Error('Tối đa 12 ảnh mỗi lần đọc đề.');
    const totalLength = input.reduce((sum, value) => sum + value.length, 0);
    if (totalLength > MAX_FILE_BYTES * 4 / 3 + input.length * 40) {
      throw new Error('Tổng dung lượng ảnh quá lớn. Hãy chọn tối đa 15 MB ảnh.');
    }
  }

  const cacheKey = await computeCacheKey(input, options);
  const cached = readCache(cacheKey);
  if (cached) {
    onProgress?.({ phase: 'cache', done: 1, total: 1, streamedQs: cached.questions.length, message: '⚡ Nạp tức thì từ bộ nhớ phiên!' });
    return {
      questions: cached.questions.map(q => ({ ...q })),
      skipped: [...cached.skipped],
      inferredCount: cached.inferredCount,
      fromCache: true
    };
  }

  await initModels();

  let batches = [];
  let isAllText = false;
  if (typeof File !== 'undefined' && input instanceof File) {
    const pdfInfo = await preparePdfBatches(input, onProgress);
    batches = pdfInfo.batches;
    isAllText = batches.every(b => b.kind === 'text');
  } else if (Array.isArray(input)) {
    const batchSize = input.length >= 4 ? 2 : 3;
    for (let i = 0; i < input.length; i += batchSize) {
      batches.push({ kind: 'images', data: input.slice(i, i + batchSize), imageStart: i + 1 });
    }
  } else if (typeof input === 'string' && !input.startsWith('data:')) {
    const chunks = splitTextIntoChunks(input, 9200);
    batches = (chunks.length ? chunks : [input]).map(c => ({ kind: 'text', data: c }));
    isAllText = true;
  } else {
    batches = [{ kind: 'raw', data: input, imageStart: 1 }];
  }

  const useFastModel = !!options.fast && isAllText;
  const chosenModel = useFastModel ? getFastQuizModel() : smartModel;

  const totalBatches = batches.length;
  let completedBatches = 0;
  const perBatchCount = new Array(totalBatches).fill(0);

  const emitProgress = () => {
    const streamedQs = perBatchCount.reduce((s, n) => s + n, 0);
    onProgress?.({
      phase: 'ai',
      done: completedBatches,
      total: totalBatches,
      streamedQs,
      message: `🧠 AI đang xử lý ${completedBatches}/${totalBatches} phần` + (streamedQs ? ` (đã thấy ~${streamedQs} câu)…` : '…')
    });
  };
  emitProgress();

  const batchResults = await runWithConcurrency(batches, 3, async (batch, idx) => {
    const batchModel = batch.kind === 'text' && options.fast ? getFastQuizModel() : chosenModel;
    const res = await generatePart(batchModel, prompt, batch.data, batch.imageStart || 1, count => {
      perBatchCount[idx] = Math.max(perBatchCount[idx], count);
      emitProgress();
    });
    completedBatches++;
    perBatchCount[idx] = res.questions.length;
    emitProgress();
    return res;
  });

  const all = [];
  const skipped = [];
  let inferredCount = 0;
  batchResults.forEach((result, i) => {
    all.push(...result.questions);
    if (result.skipped.length) {
      skipped.push(...result.skipped.map(message => (totalBatches > 1 ? 'Nhóm ' + (i + 1) + ' – ' : '') + message));
    }
    inferredCount += result.inferredCount;
  });

  const unique = normalizeQuiz(all);
  skipped.push(...unique.skipped);
  let questions = unique.questions;
  if (!options.isTestMode && questions.length > 25) {
    const count = questions.length;
    questions = Array.from({ length: 25 }, (_, index) => questions[Math.floor(index * count / 25)]);
    skipped.push('Game chọn 25 câu trải đều từ đề; dùng chế độ Test nếu cần toàn bộ ' + count + ' câu.');
  }
  if (!questions.length) {
    throw new Error('AI chưa tạo được câu hỏi có đáp án hợp lệ. ' + (skipped[0] || ''));
  }

  const finalOut = { questions, skipped, inferredCount };
  writeCache(cacheKey, finalOut);
  return finalOut;
}
