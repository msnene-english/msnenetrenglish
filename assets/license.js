/* license.js — Hệ thống Bản quyền Ms Nene English (Cô Chí Nên)
   Tất cả 10 game (🧗 Leo núi, 🍄 Nấm Mario, 🛡 Xe tăng, 💣 Bomberman, 🟡 Pac-Man, 🏎 Đua xe, 🏃 Temple Run P1 & P2, 🔴 Bounce Tales P1 & P2) mở khóa 100% vĩnh viễn. */
window.LIC = (function () {
  const FREE = ['climb', 'brick', 'tank', 'bomb'];
  const info = {
    ok: true,
    name: 'Cô Chí Nên (Ms Nene)',
    exp: '2099-12-31',
    expVN: 'Vĩnh viễn (Trọn bộ 10 game & Phòng thi)',
    issued: '2026-01-01',
    expired: false,
    code: 'CN.FULL.PRO'
  };

  function current() {
    return info;
  }

  function verify(code) {
    return info;
  }

  function make(name, months) {
    return { code: 'CN.FULL.PRO', name: name || 'Cô Chí Nên', expVN: 'Vĩnh viễn' };
  }

  function save(code) {
    return info;
  }

  function clear() {}

  const paid = () => true;
  const allowed = () => true;

  return { make, verify, current, save, clear, paid, allowed, FREE };
})();
