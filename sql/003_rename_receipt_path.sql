-- เปลี่ยนชื่อคอลัมน์ให้ตรงกับสิ่งที่เก็บจริง: เก็บ "storage path" ไม่ใช่ public URL
-- (bucket receipts เป็น private ต้องสร้าง signed URL ตอนแสดงผลทุกครั้ง)
alter table public.transactions rename column receipt_url to receipt_path;
