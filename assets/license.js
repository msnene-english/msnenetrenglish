/* license.js — Hệ thống Bản quyền Ms Nene English (Cô Chí Nên)
   • 2 Game miễn phí (Free): 🧗 Leo núi (climb) & 🍄 Nấm Mario (brick).
   • Toàn bộ các trò chơi khác & Phòng thi được khóa mặc định; mở khóa bằng Mã khóa bí mật: 0000. */
window.LIC = (function () {
  const FREE_MODES = ['climb', 'brick'];
  const UNLOCK_KEY = '0000';
  const STORAGE_KEY = 'msnene_game_unlock_key';

  function isUnlocked() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === UNLOCK_KEY;
    } catch (e) {
      return false;
    }
  }

  function verify(key) {
    const cleanKey = String(key || '').trim();
    if (cleanKey === UNLOCK_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, UNLOCK_KEY);
      } catch (e) {}
      return { ok: true, msg: 'Kích hoạt bản quyền thành công trọn bộ 10 game & phòng thi!' };
    }
    return { ok: false, msg: 'Mã kích hoạt không chính xác! Vui lòng thử lại.' };
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
      expVN: unlocked ? 'Vĩnh viễn (Trọn bộ 10 game & Phòng thi)' : 'Bản miễn phí (Leo núi & Nấm Mario)',
      unlocked,
      FREE_MODES
    };
  }

  const paid = () => isUnlocked();

  return {
    FREE: FREE_MODES,
    FREE_MODES,
    UNLOCK_KEY,
    isUnlocked,
    verify,
    lock,
    allowed,
    current,
    paid
  };
})();
