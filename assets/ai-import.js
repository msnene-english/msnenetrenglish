/* AI nhập đề cho giáo viên Pro. Firebase AI Logic giữ khóa Gemini ngoài mã web. */
const SDK = '13.2.0';
const BASE = 'https://www.gstatic.com/firebasejs/' + SDK + '/';
const MAX_FILE_BYTES = 15 * 1024 * 1024;
let modelPromise;

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
    const [{ initializeApp, getApps }, { initializeAppCheck, ReCaptchaEnterpriseProvider },
      { getAI, getGenerativeModel, GoogleAIBackend }] = await Promise.all([
      import(BASE + 'firebase-app.js'),
      import(BASE + 'firebase-app-check.js'),
      import(BASE + 'firebase-ai.js')
    ]);
    const app = getApps().find(item => item.name === 'msnene-ai') ||
      initializeApp(cfg, 'msnene-ai');
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
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

export async function generateQuiz(prompt, input) {
  const parts = [{ text: prompt }];
  if (input instanceof File) {
    parts.push(await filePart(input));
  } else if (Array.isArray(input)) {
    if (input.length > 12) throw new Error('Tối đa 12 ảnh mỗi lần đọc đề.');
    const totalLength = input.reduce((sum, value) => sum + value.length, 0);
    if (totalLength > MAX_FILE_BYTES * 4 / 3 + input.length * 40) {
      throw new Error('Tổng dung lượng ảnh quá lớn. Hãy chọn tối đa 15 MB ảnh.');
    }
    input.forEach(value => parts.push(dataUrlPart(value)));
  } else if (typeof input === 'string' && input.startsWith('data:')) {
    parts.push(dataUrlPart(input));
  } else if (typeof input === 'string') {
    parts[0].text += '\n\nNội dung đề bài:\n---\n' + input.slice(0, 32000) + '\n---';
  } else {
    throw new Error('Không có nội dung đề bài để AI đọc.');
  }
  const result = await (await model()).generateContent(parts);
  const response = await result.response;
  const raw = response.text();
  if (!raw) throw new Error('AI không trả về câu hỏi.');
  let questions;
  try { questions = JSON.parse(raw); }
  catch { throw new Error('AI trả về dữ liệu chưa đúng định dạng. Hãy thử lại.'); }
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('AI không tìm thấy câu hỏi trong đề.');
  }
  return questions;
}
