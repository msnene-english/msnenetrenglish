/* license.js — Hệ thống Bản quyền Ms Nenet English (Cô Chí Nên)
   Tất cả 4 game (🧗 Leo núi, 🍄 Nấm Mario, 🛡 Xe tăng, 💣 Đặt bom) mở khóa 100% vĩnh viễn. */
window.LIC = (function () {
  const FREE = ['climb', 'brick', 'tank', 'bomb'];
  const info = {
    ok: true,
    name: 'Cô Chí Nên (Ms Nenet)',
    exp: '2099-12-31',
    expVN: 'Vĩnh viễn (Bản đầy đủ 4 game)',
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
