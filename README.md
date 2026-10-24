# Ms Nene English – Trò Chơi Học Tập & Ôn Tập Trắc Nghiệm Tương Tác

Hệ thống trò chơi học tập tương tác thời gian thực (Gamified Live Quiz) kết hợp trắc nghiệm ôn tập, luyện phát âm AI và **10 mini-game pixel art & retro 3D**, xây dựng riêng cho **Ms Nene English (Cô Chí Nên)**.

---

## 🌟 Tính Năng Nổi Bật

1. **10 Chế Độ Game Hấp Dẫn (Mở khóa 100% vĩnh viễn)**:
   - 🧗 **Leo núi (Climb)**: Nhảy đảo bay, tránh quái, leo lên đỉnh lâu đài giải cứu công chúa.
   - 🍄 **Nấm Mario (Brick)**: Vượt 5 màn kinh điển, húc khối ?, bơi đáy biển, vượt dung nham đánh rồng.
   - 🛡 **Xe tăng (Tank)**: Điều khiển xe tăng phá gạch, tiêu diệt xe tăng địch & quái vật, bảo vệ căn cứ đại bàng.
   - 💣 **Bomberman (Bomb)**: Đặt bom cổ điển 8 màn, phá đá nhặt vật phẩm tăng sức mạnh.
   - 🟡 **Pac-Man (Pac)**: 5 mê cung kinh điển, né ma hồng tàng hình, nhện giăng tơ, đớp viên năng lượng săn ma (+5⚡).
   - 🏎 **Đua xe (Race)**: Đua xe retro 3D 5 chặng, ôm cua drift tránh vết dầu đen, nhặt bình xăng tăng tốc.
   - 🏃 **Temple Run P1 & P2**: Chạy 3 làn vượt 5 màn kỳ thú (màn xe goòng hầm mỏ, đền băng, hang dung nham, tượng vàng).
   - 🔴 **Bounce Tales P1 & P2**: Lăn bóng đỏ kinh điển 6 màn x 2 phần (bật nấm lò xo, bập bênh lá sen, lặn biển và đánh boss ếch Hypnotoad).
   - 📝 **Phòng thi A2-B1 Cambridge (Test Mode)**: Chế độ khảo thí nghiêm túc, đếm ngược, chuyển câu hỏi linh hoạt, phân tích câu sai.

2. **Chấm & Đánh Giá Phát Âm AI (Speaking AI)**:
   - Hỗ trợ câu hỏi phát âm: Giáo viên chỉ cần nhập từ/câu mẫu theo cú pháp `1. SPK: Good morning teacher`.
   - AI tự động nhận diện phiên âm IPA, tạo mẹo phát âm chi tiết.
   - Học sinh bấm micro đọc câu, AI chấm điểm độ chính xác (0-100), chỉ rõ âm tiết đọc chuẩn/lệch màu sắc trực quan.

3. **Thư viện đề thi chung (Shared Community Quiz Library)**:
   - Giáo viên có quyền quyết định **"Lưu & Chia sẻ lên Thư viện chung"** sau mỗi lần tạo đề.
   - Mọi giáo viên đều có thể tìm kiếm, nạp đề mở phòng hoặc lấy link bài tập.
   - Sinh **Mã đề ngắn (Short ID)** dạng `MN-XXXX` giúp tạo đường link làm bài siêu ngắn: `play.html?quiz=MN-IELTS7` (gửi Zalo/Facebook 100% không bao giờ bị cắt link).
   - Chức năng quản trị an toàn (Admin PIN `0000`) hỗ trợ xóa đề thi hoặc xóa bài nộp lỗi thời khỏi thư viện.

4. **Hai chế độ tổ chức học tập linh hoạt**:
   - 📺 **Trực tiếp tại lớp (Live Mode)**: Chiếu mã QR và mã phòng 6 chữ số lên bảng/máy chiếu, học sinh quét mã vào phòng thi đấu.
   - 📚 **Giao bài về nhà (Homework Mode)**: Tự học cá nhân, lưu tiến trình và nộp điểm trực tiếp về hệ thống.

5. **Xuất báo cáo điểm & Phân tích câu sai (Gradebook & Item Analytics)**:
   - Xem phổ điểm cả lớp, bảng xếp hạng chi tiết.
   - Phân tích tỷ lệ đúng/sai của từng câu hỏi để giáo viên nắm bắt phần kiến thức học sinh còn yếu.

6. **Không tốn chi phí vận hành (Zero Server Cost)**:
   - Chạy hoàn toàn trên máy khách (Pure Client-side HTML5/Canvas/CSS/JS).
   - Đồng bộ thời gian thực qua MQTT WebSocket công cộng hoặc máy chủ Google Firebase miễn phí.

---

## 📂 Cấu Trúc Thư Mục

```
MsNeneEnglish/
├── index.html        # Trang cổng điều hướng (Dành cho Giáo viên & Học sinh)
├── host.html         # Bảng điều khiển của Giáo viên (Soạn đề, Thư viện, Máy chiếu)
├── play.html         # Giao diện thi đấu của Học sinh (Responsive Mobile & Tablet)
├── snd/              # Thư mục âm thanh & nhạc nền dùng chung (16 files MP3)
└── assets/
    ├── config.js     # Cấu hình thương hiệu & máy chủ
    ├── core.js       # Engine mạng MQTT/Máy chủ, Thư viện chung, Xử lý đề thi & Speaking AI
    ├── license.js    # Kích hoạt bản quyền vĩnh viễn
    ├── mau.js        # Ngân hàng đề thi mẫu có sẵn
    ├── climb.js      # Engine game Leo núi
    ├── brick.js      # Engine game Nấm Mario
    ├── tank.js       # Engine game Xe tăng
    ├── bomb.js       # Engine game Đặt bom
    ├── pac.js        # Engine game Pac-Man
    ├── race.js       # Engine game Đua xe
    ├── temple.js     # Engine game Temple Run P1 & P2
    ├── bounce.js     # Engine game Bounce Tales P1 & P2
    ├── scene.js      # Hiệu ứng nền cảnh Hồ Gươm / Thăng Long
    ├── hero.js       # Hoạt họa Pixel Art trang chủ
    ├── game.css      # Giao diện tông màu pastel hiện đại
    ├── fonts.css     # Định nghĩa font chữ Baloo 2, Nunito
    ├── mqtt.min.js   # Thư viện mạng MQTT WebSocket
    └── qrcode.min.js # Thư viện tạo mã QR phòng chơi
```

---

## 👩‍🏫 Thông Tin Giáo Viên & Hỗ Trợ

- **Giáo viên**: Cô Chí Nên (Ms Nene English)
- **Hotline / Zalo**: **0852639652**
- **Zalo Chat**: [https://zalo.me/0852639652](https://zalo.me/0852639652)
