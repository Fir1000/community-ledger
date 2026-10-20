-- หมวดหมู่ใช้สิทธิ์เดียวกับรายรับ-รายจ่าย: สมาชิกที่ผู้ดูแลไม่อนุญาต เพิ่ม/แก้/ลบหมวดหมู่ไม่ได้ (ดูได้อย่างเดียว)
-- (ชื่อ policy ภาษาไทยยาวเกิน 63 ไบต์จะถูกตัด จึงตั้งชื่อใหม่เป็นภาษาอังกฤษสั้นๆ)

drop policy "categories: สมาชิกเพิ่มหมวดหมู่ของชุมชนตัวเองได้" on public.categories;
drop policy "categories: สมาชิกแก้ไขหมวดหมู่ของชุมชนตัวเองได้" on public.categories;
drop policy "categories: สมาชิกลบหมวดหมู่ของชุมชนตัวเองได้" on public.categories;

create policy "categories_insert_can_edit"
  on public.categories for insert
  with check (community_id is not null and public.can_edit_transactions(community_id));

create policy "categories_update_can_edit"
  on public.categories for update
  using (community_id is not null and public.can_edit_transactions(community_id));

create policy "categories_delete_can_edit"
  on public.categories for delete
  using (community_id is not null and public.can_edit_transactions(community_id));
