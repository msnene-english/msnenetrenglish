/* AI nhập đề cho giáo viên Pro. Firebase AI Logic giữ khóa Gemini ngoài mã web. */
const SDK = '13.2.0';
const BASE = 'https://www.gstatic.com/firebasejs/' + SDK + '/';
const MAX_FILE_BYTES = 15 * 1024 * 1024;
let modelPromise;
let appCheckInstance;

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })
  ]).finally(() => clearTimeout(timer));
}

async function model() {
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
      { getAI, getGenerativeModel, GoogleAIBackend }] = await withTimeout(Promise.all([
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
    return getGenerativeModel(ai, {
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 16384
      }
    });
  })();
  try { return await modelPromise; }
  catch (error) { modelPromise = null; throw error; }
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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeQuiz(payload) {
  const source = Array.isArray(payload) ? payload : payload && payload.questions;
  if (!Array.isArray(source)) throw new Error('AI trả về dữ liệu câu hỏi sai định dạng.');
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
    result.passage = normalizeText(item.passage);
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

async function generatePart(aiModel, prompt, input, imageStart) {
  const parts = [{ text: prompt }];
  if (typeof File !== 'undefined' && input instanceof File) {
    parts.push(await filePart(input));
  } else if (Array.isArray(input)) {
    parts[0].text += '\n\nChỉ đọc câu hỏi trong ảnh số ' + imageStart +
      ' đến ' + (imageStart + input.length - 1) +
      '. Giữ đúng thứ tự, không thêm câu từ ảnh khác.';
    input.forEach(value => parts.push(dataUrlPart(value)));
  } else if (typeof input === 'string' && input.startsWith('data:')) {
    parts.push(dataUrlPart(input));
  } else if (typeof input === 'string') {
    parts[0].text += '\n\nNội dung đề bài:\n---\n' + input.slice(0, 32000) + '\n---';
  } else {
    throw new Error('Không có nội dung đề bài để AI đọc.');
  }
  const result = await withTimeout(aiModel.generateContent(parts), 120000,
    'AI chưa phản hồi sau 2 phút. Hãy kiểm tra Firebase App Check và thử lại.');
  const response = await withTimeout(result.response, 10000,
    'AI chưa trả kết quả. Hãy thử lại.');
  const raw = response.text();
  if (!raw) throw new Error('AI không trả về câu hỏi.');
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('AI trả về JSON chưa đầy đủ. Hãy thử ít trang hơn hoặc chia PDF.'); }
  return normalizeQuiz(parsed);
}

export async function generateJson(prompt, timeoutMs = 20000) {
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Thiếu nội dung cần AI xử lý.');
  const aiModel = await model();
  const result = await withTimeout(aiModel.generateContent([{ text: prompt.slice(0, 12000) }]), timeoutMs,
    'AI chưa phản hồi. Hãy thử lại sau.');
  const response = await withTimeout(result.response, 10000, 'AI chưa trả kết quả.');
  const raw = response.text();
  if (!raw) throw new Error('AI trả về nội dung rỗng.');
  try { return JSON.parse(raw); }
  catch { throw new Error('AI trả về dữ liệu sai định dạng.'); }
}

export async function generateQuiz(prompt, input, options = {}) {
  if (Array.isArray(input)) {
    if (!input.length) throw new Error('Chưa chọn ảnh để AI đọc.');
    if (input.length > 12) throw new Error('Tối đa 12 ảnh mỗi lần đọc đề.');
    const totalLength = input.reduce((sum, value) => sum + value.length, 0);
    if (totalLength > MAX_FILE_BYTES * 4 / 3 + input.length * 40) {
      throw new Error('Tổng dung lượng ảnh quá lớn. Hãy chọn tối đa 15 MB ảnh.');
    }
  }
  const aiModel = await model();
  const batches = Array.isArray(input)
    ? Array.from({ length: Math.ceil(input.length / 3) }, (_, i) => input.slice(i * 3, i * 3 + 3))
    : [input];
  const all = [];
  const skipped = [];
  let inferredCount = 0;
  for (let i = 0; i < batches.length; i++) {
    const result = await generatePart(aiModel, prompt, batches[i], i * 3 + 1);
    all.push(...result.questions);
    skipped.push(...result.skipped.map(message => 'Nhóm ' + (i + 1) + ' – ' + message));
    inferredCount += result.inferredCount;
  }
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
  return { questions, skipped, inferredCount };
}
