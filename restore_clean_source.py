# Script khôi phục mã nguồn gốc sạch (Clean Source) 1 click cho Cô Chí Nên
import os, sys, shutil

base_dir = os.path.dirname(os.path.abspath(__file__))
clean_dir = os.path.join(base_dir, "clean_source")

if not os.path.exists(clean_dir):
    print("❌ Thư mục clean_source không tồn tại!")
    sys.exit(1)

print("🔄 Đang khôi phục toàn bộ mã nguồn về trạng thái gốc nguyên bản...")

for root, dirs, files in os.walk(clean_dir):
    rel = os.path.relpath(root, clean_dir)
    target_dir = os.path.join(base_dir, rel) if rel != "." else base_dir
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        shutil.copy2(os.path.join(root, f), os.path.join(target_dir, f))

print("✅ ĐÃ KHÔI PHỤC THÀNH CÔNG! Toàn bộ mã nguồn đã trở về bản gốc sạch sẽ, dễ đọc và dễ chỉnh sửa.")
