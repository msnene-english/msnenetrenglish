/* license.js — Hệ thống Bản quyền Ms Nene English (Cô Chí Nên)
   • 2 Game miễn phí: 🧗 Leo núi (climb) & 🍄 Nấm Mario (brick).
   • Toàn bộ các trò chơi khác & Phòng thi được bảo vệ bằng mã hóa chuẩn mật mã (Cryptographic Hash). */
window.LIC = (function () {
  const FREE_MODES = ['climb', 'brick'];
  const STORAGE_KEY = 'msnene_game_unlock_token';
  // Chuỗi băm bảo mật SHA-256 có Salt (Không lưu mật khẩu dạng bản rõ / plaintext)
  const AUTH_HASH = '6fbaf86f2fe6ebfba509d908c8c439c723f037c6708169fad70f502dfb2ce0f2';
  const SALT = 'MsNeneEnglish_Salt_2026_';

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

  function isUnlocked() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === AUTH_HASH;
    } catch (e) {
      return false;
    }
  }

  function verify(key) {
    const cleanKey = String(key || '').trim();
    if (sha256(SALT + cleanKey) === AUTH_HASH) {
      try {
        localStorage.setItem(STORAGE_KEY, AUTH_HASH);
      } catch (e) {}
      return { ok: true, msg: 'Kích hoạt bản quyền thành công trọn bộ 10 game & phòng thi!' };
    }
    return { ok: false, msg: 'Mã kích hoạt không chính xác! Vui lòng thử lại.' };
  }

  function verifyAdmin(key) {
    const cleanKey = String(key || '').trim();
    return sha256(SALT + cleanKey) === AUTH_HASH;
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
    return {
      ok: unlocked,
      name: 'Cô Chí Nên (Ms Nene)',
      expVN: unlocked ? 'Vĩnh viễn (Trọn bộ 10 game & Phòng thi)' : 'Bản tiêu chuẩn (Leo núi & Nấm Mario)',
      unlocked,
      FREE_MODES
    };
  }

  const paid = () => isUnlocked();

  return {
    FREE: FREE_MODES,
    FREE_MODES,
    isUnlocked,
    verify,
    verifyAdmin,
    lock,
    allowed,
    current,
    paid
  };
})();
