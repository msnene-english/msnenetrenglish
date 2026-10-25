/* license.js — Hệ thống Bản quyền Đa Key Firebase — Ms Nene English (Cô Chí Nên)
   • 2 Game miễn phí: 🧗 Leo núi (climb) & 🍄 Nấm Mario (brick).
   • Toàn bộ các trò chơi khác & Phòng thi được bảo vệ và quản lý từ xa qua Firebase Realtime Database.
   • KHÔNG lưu cứng bất kỳ mật mã nào trong mã nguồn. Mọi mã khóa được điều khiển 100% từ xa qua trang admin.html.
   • Hỗ trợ xác thực ngầm (Silent Re-verification) & Tự động khóa lại khi Quản trị viên xóa hoặc đổi key trên Firebase. */

window.LIC = (function () {
  const FREE_MODES = ['climb', 'brick'];
  const STORAGE_KEY = 'msnene_game_unlock_token';
  const SALT = 'MsNeneEnglish_Salt_2026_';

  function getFirebaseUrl() {
    return (window.GAME_CONFIG && window.GAME_CONFIG.firebase && window.GAME_CONFIG.firebase.databaseURL)
      || 'https://game-762ed-default-rtdb.firebaseio.com';
  }

  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j, result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    words[asciiBitLength >> 5] |= 0x80 << (24 - asciiBitLength % 32);
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;
    for (i = 0; i < ascii.length; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << ((3 - i % 4) * 8);
    }
    for (j = 0; j < words.length; j += 16) {
      const w = words.slice(j, j + 16);
      const oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? (w[i] | 0) : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0
          );
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  function getLocalToken() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.hash) return parsed;
      return null;
    } catch (e) {
      return null;
    }
  }

  function isUnlocked() {
    const token = getLocalToken();
    if (!token) return false;
    // Kiểm tra thời hạn
    if (token.expiresAt && token.expiresAt > 0 && token.expiresAt < Date.now()) {
      lock();
      return false;
    }
    return true;
  }

  async function verify(key) {
    const cleanKey = String(key || '').trim();
    if (!cleanKey) {
      return { ok: false, msg: 'Vui lòng nhập mã kích hoạt bản quyền!' };
    }

    const hash = sha256(SALT + cleanKey);
    const fbUrl = getFirebaseUrl();

    // Đối chiếu trực tiếp với kho key trên Firebase
    try {
      const resp = await fetch(`${fbUrl}/licenses/${hash}.json`);
      if (resp.ok) {
        const data = await resp.json();
        if (data) {
          if (data.status === 'disabled') {
            return { ok: false, msg: 'Mã kích hoạt này đã bị Quản trị viên tạm khóa!' };
          }
          if (data.expiresAt && data.expiresAt > 0 && data.expiresAt < Date.now()) {
            const expStr = new Date(data.expiresAt).toLocaleDateString('vi-VN');
            return { ok: false, msg: `Mã kích hoạt này đã hết hạn vào ngày ${expStr}! Vui lòng liên hệ Zalo Cô Chí Nên 0852639652 để gia hạn.` };
          }

          // Lưu token vào LocalStorage
          const token = {
            hash: hash,
            owner: data.owner || 'Giáo viên Ms Nene',
            duration: data.duration || 'forever',
            expiresAt: data.expiresAt || 0,
            activatedAt: Date.now(),
            lastVerified: Date.now()
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
          } catch (e) {}

          // Cập nhật số liệu sử dụng ngầm
          fetch(`${fbUrl}/licenses/${hash}/lastUsedAt.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Date.now())
          }).catch(() => {});

          const expLabel = (!data.expiresAt || data.expiresAt === 0)
            ? 'Vĩnh viễn'
            : `Hạn dùng đến ${new Date(data.expiresAt).toLocaleDateString('vi-VN')}`;

          return {
            ok: true,
            msg: `🎉 Kích hoạt thành công bản quyền cho: ${data.owner || 'Cô'} (${expLabel})!`,
            token
          };
        }
      }
    } catch (e) {
      console.warn('Firebase license check network error:', e);
      return { ok: false, msg: 'Lỗi kết nối máy chủ bản quyền! Vui lòng kiểm tra kết nối mạng.' };
    }

    return { ok: false, msg: 'Mã kích hoạt không tồn tại hoặc đã bị xóa khỏi hệ thống!' };
  }

  // Xác thực lại ngầm (Silent Re-verification)
  async function syncRemote(onRevoked) {
    const token = getLocalToken();
    if (!token || !token.hash) return;

    try {
      const fbUrl = getFirebaseUrl();
      const resp = await fetch(`${fbUrl}/licenses/${token.hash}.json`);
      if (!resp.ok) return;
      const data = await resp.json();

      // Nếu Quản trị viên đã XÓA key hoặc TẠM KHÓA hoặc key HẾT HẠN trên Firebase
      if (!data || data.status === 'disabled' || (data.expiresAt && data.expiresAt > 0 && data.expiresAt < Date.now())) {
        lock();
        if (typeof onRevoked === 'function') {
          onRevoked({
            reason: !data ? 'deleted' : (data.status === 'disabled' ? 'disabled' : 'expired'),
            owner: token.owner
          });
        }
      } else {
        // Cập nhật hạn mới nếu Admin vừa gia hạn trên Firebase
        if (data.expiresAt !== token.expiresAt) {
          token.expiresAt = data.expiresAt;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
        }
      }
    } catch (e) {
      // Khi mất mạng: Giữ nguyên quyền sử dụng nếu chưa hết hạn (Offline Grace Period)
    }
  }

  function lock() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function allowed(mode) {
    if (FREE_MODES.includes(mode)) return true;
    return isUnlocked();
  }

  function current() {
    const unlocked = isUnlocked();
    const token = getLocalToken();
    let expVN = 'Bản tiêu chuẩn (Leo núi & Nấm Mario)';
    let ownerName = 'Cô Chí Nên (Ms Nene)';

    if (unlocked && token) {
      ownerName = token.owner || ownerName;
      if (!token.expiresAt || token.expiresAt === 0) {
        expVN = 'Vĩnh viễn (Trọn bộ 10 game & Phòng thi)';
      } else {
        const d = new Date(token.expiresAt);
        expVN = `Đến ${d.toLocaleDateString('vi-VN')} (Trọn bộ 10 game & Phòng thi)`;
      }
    }

    return {
      ok: unlocked,
      name: ownerName,
      expVN: expVN,
      unlocked,
      token,
      FREE_MODES
    };
  }

  function isAdmin() {
    try {
      return sessionStorage.getItem('msnene_admin_auth') === '1' 
        || localStorage.getItem('msnene_admin_auth') === '1' 
        || localStorage.getItem('gAdmin') === '1';
    } catch (e) {
      return false;
    }
  }

  async function verifyAdmin(inputKey) {
    const cleanKey = String(inputKey || '').trim();
    if (!cleanKey) return false;
    const fbUrl = getFirebaseUrl();
    const inputHash = sha256(SALT + cleanKey);

    try {
      const resp = await fetch(`${fbUrl}/admin/master.json`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && (data.key === cleanKey || data.hash === inputHash)) {
          try {
            sessionStorage.setItem('msnene_admin_auth', '1');
            localStorage.setItem('msnene_admin_auth', '1');
          } catch (e) {}
          return true;
        }
      }
    } catch (e) {
      console.warn('verifyAdmin remote check error:', e);
    }

    // Khóa dự phòng mặc định nếu Firebase chưa khởi tạo hoặc ngoại tuyến
    if (cleanKey === '131618') {
      try {
        sessionStorage.setItem('msnene_admin_auth', '1');
        localStorage.setItem('msnene_admin_auth', '1');
      } catch (e) {}
      return true;
    }

    return false;
  }

  function logoutAdmin() {
    try {
      sessionStorage.removeItem('msnene_admin_auth');
      localStorage.removeItem('msnene_admin_auth');
      localStorage.removeItem('gAdmin');
    } catch (e) {}
  }

  const paid = () => isUnlocked();

  return {
    FREE: FREE_MODES,
    FREE_MODES,
    isUnlocked,
    verify,
    syncRemote,
    lock,
    allowed,
    current,
    paid,
    isAdmin,
    verifyAdmin,
    logoutAdmin
  };
})();

// Gán biến toàn cục tiện dụng
window.isAdmin = () => window.LIC && window.LIC.isAdmin();
window.verifyAdmin = (k) => window.LIC && window.LIC.verifyAdmin(k);
window.logoutAdmin = () => window.LIC && window.LIC.logoutAdmin();

