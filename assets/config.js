/* ⚙️ CẤU HÌNH GAME — Ms Nene English (Cô Chí Nên)
   • Chơi chung cả lớp: tự dùng máy chủ công cộng MQTT miễn phí.
     Trang của cô (host.html) làm "trọng tài" → cô giữ trang đó mở trong lúc chơi.
   • Firebase Realtime Database: Đã kết nối thành công để đồng bộ Thư viện đề thi chung! */
window.GAME_CONFIG = {
  brand: "Ms Nene English",
  teacher: "Cô Chí Nên",
  phone: "0852639652",
  zalo: "https://zalo.me/0852639652",
  music: "",
  
  // Cấu hình Firebase Realtime Database chính thức của Cô Chí Nên
  firebase: {
    databaseURL: "https://game-762ed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyAhxgKCK8yQ10O9y2kddRR1bHaMGanPFno",
    authDomain: "game-762ed.firebaseapp.com",
    projectId: "game-762ed",
    appId: "1:201737691060:web:6b9ffca2635d31c2595ce1",
    adminUid: "9eA5BZII0STtQwqox2XcBNEUfnE2",
    // Firebase App Check → Web app → reCAPTCHA Enterprise (public site key).
    appCheckSiteKey: ""
  }
};
