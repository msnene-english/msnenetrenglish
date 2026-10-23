/* ⚙️ CẤU HÌNH GAME — Ms Nenet English (Cô Chí Nên)
   • Chơi chung cả lớp: tự dùng máy chủ công cộng MQTT miễn phí.
     Trang của cô (host.html) làm "trọng tài" → cô giữ trang đó mở trong lúc chơi.
   • Firebase Realtime Database: Đã kết nối thành công để đồng bộ Thư viện đề thi chung! */
window.GAME_CONFIG = {
  brand: "Ms Nenet English",
  teacher: "Cô Chí Nên",
  phone: "0852639652",
  zalo: "https://zalo.me/0852639652",
  music: "",
  
  // Cấu hình Firebase Realtime Database chính thức của Cô Chí Nên
  firebase: {
    databaseURL: "https://game-762ed-default-rtdb.firebaseio.com"
  }
};
