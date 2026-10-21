# Ms Nenet English – Trò Chơi Học Tập & Ôn Tập Trắc Nghiệm Tương Tác

Hệ thống trò chơi học tập tương tác thời gian thực (Gamified Live Quiz) kết hợp trắc nghiệm ôn tập và 4 mini-game pixel art, xây dựng riêng cho **Ms Nenet English (Cô Chí Nên)**.

---

## 🌟 Tính Năng Nổi Bật

1. **4 Chế độ Game hấp dẫn (Mở khóa 100% vĩnh viễn)**:
   - 🧗 **Leo núi (Climb)**: Nhảy đảo bay, tránh quái, leo lên đỉnh lâu đài giải cứu công chúa.
   - 🍄 **Nấm Mario (Brick)**: Vượt 4 màn cổ điển, húc khối ?, diệt nấm, vượt dung nham đánh rồng.
   - 🛡 **Xe tăng (Tank)**: Điều khiển xe tăng phá gạch, tiêu diệt địch, bảo vệ căn cứ.
   - 💣 **Đặt bom (Bomb)**: Bomberman cổ điển 8 màn, phá đá nhặt vật phẩm tăng sức mạnh.

2. **Thư viện đề thi chung (Shared Community Quiz Library)**:
   - Giáo viên có quyền quyết định **"Lưu & Chia sẻ lên Thư viện chung"** sau mỗi lần tạo đề.
   - Khi một giáo viên chia sẻ đề, tất cả giáo viên khác đều có thể tìm kiếm, nạp đề mở phòng hoặc lấy link bài tập.
   - Sinh **Mã đề ngắn (Short ID)** dạng `MN-XXXX` giúp tạo đường link làm bài siêu ngắn:
     `play.html?quiz=MN-IELTS7` (gửi Zalo/Facebook 100% không bao giờ bị cắt link).

3. **Hai chế độ tổ chức học tập linh hoạt**:
   - 📺 **Trực tiếp tại lớp (Live Mode)**: Chiếu mã PIN 6 số và mã QR lên máy chiếu, học sinh vào thi đấu trực tiếp, cập nhật bảng xếp hạng thời gian thực (Live Leaderboard) và bục vinh danh Podium.
   - 📚 **Giao bài về nhà (Homework Mode)**: Học sinh tự luyện tập độc lập mọi lúc mọi nơi trên điện thoại hoặc máy tính.

4. **Phân tích câu hỏi sau trận đấu (Post-game Mistake Review)**:
   - Tự động thống kê **Top câu hỏi học sinh làm sai nhiều nhất** trong buổi học.
   - Nút **"🔍 Xem lời giải"** để chiếu to câu hỏi và lời giải chi tiết lên máy chiếu giảng lại cho cả lớp.

5. **Bộ đề mẫu khôi phục đầy đủ**:
   - `MN-ENG7`: Đề thi tiếng Anh 7 (20 câu kèm giải thích ngữ pháp).
   - `MN-IELTS7`: **IELTS 8.0 Unit 7 Environmental Protection** (42 câu đầy đủ ngữ âm, từ vựng, bài đọc).

6. **Không tốn chi phí vận hành (Zero Server Cost)**:
   - Chạy hoàn toàn trên máy khách (Pure Client-side HTML5/Canvas/CSS/JS).
   - Đồng bộ thời gian thực qua MQTT WebSocket công cộng hoặc Google Firebase miễn phí.

---

## 🚀 Cấu Trúc Thư Mục

```
MsNenetEnglish/
├── index.html        # Trang cổng điều hướng (Dành cho Giáo viên & Học sinh)
├── host.html         # Bảng điều khiển của Giáo viên (Soạn đề, Thư viện chung, Máy chiếu)
├── play.html         # Giao diện thi đấu của Học sinh (Responsive Mobile & Tablet)
└── assets/
    ├── config.js     # Cấu hình thương hiệu & Firebase
    ├── core.js       # Engine mạng MQTT, Thư viện chung, Xử lý đề thi
    ├── license.js    # Kích hoạt bản quyền 4 game vĩnh viễn
    ├── mau.js        # Ngân hàng đề thi mẫu có sẵn
    ├── duck.mp3      # Âm thanh meme cục bộ (độc lập 100%)
    ├── climb.js      # Engine game Leo núi
    ├── brick.js      # Engine game Nấm Mario
    ├── tank.js       # Engine game Xe tăng
    ├── bomb.js       # Engine game Đặt bom
    ├── hero.js       # Hoạt họa Pixel Art trang chủ
    ├── game.css      # Giao diện tông màu pastel hiện đại
    ├── fonts.css     # Định nghĩa font chữ Baloo 2, Nunito
    ├── mqtt.min.js   # Thư viện mạng MQTT WebSocket
    └── qrcode.min.js # Thư viện tạo mã QR phòng chơi
```

---

## 👩‍🏫 Thông Tin Giáo Viên & Hỗ Trợ

- **Giáo viên**: Cô Chí Nên (Ms Nenet English)
- **Hotline / Zalo**: **0852639652**
- **Zalo Chat**: [https://zalo.me/0852639652](https://zalo.me/0852639652)
