-- แก้บั๊ก: DB.listMembers() ใน js/db.js ต้องการ embed "profiles(...)" จาก community_members
-- แต่ community_members.user_id อ้างอิงไปที่ auth.users(id) ไม่ใช่ public.profiles(id)
-- PostgREST เลย resolve ความสัมพันธ์ community_members -> profiles ไม่ได้ (ไม่มี FK ตรงระหว่าง 2 ตารางนี้)
-- เพิ่ม FK ตรงไปที่ profiles(id) ได้อย่างปลอดภัย เพราะ profiles.id = auth.users.id เสมอ
-- (สร้างพร้อมกันผ่าน trigger handle_new_user ตอนสมัครสมาชิก)

alter table public.community_members
  add constraint community_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
