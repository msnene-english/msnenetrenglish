# -*- coding: utf-8 -*-
# Script khôi phục mã nguồn gốc sạch (Clean Source) 1 click cho Cô Chí Nên
import os
import sys
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = os.path.dirname(os.path.abspath(__file__))
clean_dir = os.path.join(base_dir, "clean_source")

if not os.path.exists(clean_dir):
    print("[ERROR] Thu muc clean_source khong ton tai!")
    sys.exit(1)

print("[INFO] Dang khoi phuc toan bo ma nguon ve trang thai goc sach nguyen ban...")

file_count = 0
for root, dirs, files in os.walk(clean_dir):
    rel = os.path.relpath(root, clean_dir)
    target_dir = os.path.join(base_dir, rel) if rel != "." else base_dir
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        src = os.path.join(root, f)
        dst = os.path.join(target_dir, f)
        shutil.copy2(src, dst)
        file_count += 1

print(f"[SUCCESS] DA KHOI PHUC THANH CONG {file_count} tep! Toan bo ma nguon da tro ve ban goc sach se, de doc va de chinh sua.")
