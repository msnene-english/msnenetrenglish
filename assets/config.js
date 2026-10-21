/* ⚙️ CẤU HÌNH GAME — Ms Nenet English (Cô Chí Nên)
   • Chơi chung cả lớp: tự dùng máy chủ công cộng MQTT miễn phí, không cần tài khoản.
     Trang của cô (host.html) làm "trọng tài" → cô giữ trang đó mở trong lúc chơi.
   • Firebase: (tuỳ chọn) dán firebaseConfig nếu muốn đồng bộ kho đề lên mây hoặc lưu kết quả bài tập về nhà. */
window.GAME_CONFIG = {
  brand: "Ms Nenet English",
  teacher: "Cô Chí Nên",
  phone: "0852639652",
  zalo: "https://zalo.me/0852639652",
  music: "",       // (tuỳ chọn) link file nhạc mp3 riêng; để trống = nhạc 8-bit tự soạn
  
  // Dán cấu hình Firebase của cô vào đây (nếu muốn lưu đề trên đám mây / Realtime DB)
  // Lấy miễn phí tại: https://console.firebase.google.com/
  firebase: null
  /*
  firebase: {
    apiKey: "AIzaSy...",
    authDomain: "ms-nenet-game.firebaseapp.com",
    databaseURL: "https://ms-nenet-game-default-rtdb.firebaseio.com",
    projectId: "ms-nenet-game",
    storageBucket: "ms-nenet-game.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  }
  */
};
