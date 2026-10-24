/* shield.js — Hệ thống Bảo vệ Bản quyền & Chống Đọc trộm Mã nguồn Ms Nene English */
(function() {
  'use strict';

  // Kiểm tra cờ cho phép gỡ lỗi nội bộ nếu có tham số URL msnene_debug=1
  if (window.location.search.includes('msnene_debug=1')) {
    console.info('🛡️ Chế độ gỡ lỗi nhà phát triển được kích hoạt.');
    return;
  }

  // 1. Chặn menu chuột phải (vẫn cho phép trên các ô nhập liệu input / textarea để cô giáo dán đề)
  document.addEventListener('contextmenu', function(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. Chặn các phím tắt F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
  document.addEventListener('keydown', function(e) {
    // Phím F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + Shift + I / J / C (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      const k = e.key ? e.key.toUpperCase() : String.fromCharCode(e.keyCode);
      if (['I', 'J', 'C', 'K'].includes(k) || [73, 74, 67, 75].includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl + U (Xem nguồn trang), Ctrl + S (Lưu trang về máy)
    if (e.ctrlKey || e.metaKey) {
      const k = e.key ? e.key.toUpperCase() : String.fromCharCode(e.keyCode);
      if (['U', 'S'].includes(k) || [85, 83].includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, { capture: true });

  // 3. Vô hiệu hóa kéo thả copy mã nguồn
  document.addEventListener('dragstart', function(e) {
    if (e.target && (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')) {
      e.preventDefault();
    }
  });
})();
