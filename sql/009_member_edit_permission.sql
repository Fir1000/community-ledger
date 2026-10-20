-- สิทธิ์สมาชิกในบัญชี:
-- - ผู้ดูแลเปิด/ปิดได้ว่าสมาชิกแต่ละคนแก้ไขรายรับ-รายจ่ายได้หรือไม่ (ค่าเริ่มต้น: ได้)
-- - สมาชิกที่มีสิทธิ์แก้ไข เพิ่ม/แก้/ลบรายการของบัญชีได้ทุกรายการ ไม่ใช่แค่รายการของตัวเอง
-- - ปิดช่องโหว่: เดิมผู้ใช้ insert ตัวเองเข้า community_members ได้ตรงๆ (ตั้ง role = admin ได้ด้วย)
--   การเข้าร่วมต้องผ่าน join_community_by_code / create_community (security definer) เท่านั้น

alter table public.community_members
  add column can_edit_transactions boolean not null default true;

create or replace function public.can_edit_transactions(p_community_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and (role = 'admin' or can_edit_transactions)
  );
$$;

drop policy "members: เข้าร่วมชุมชนด้วยตัวเอง (join)" on public.community_members;

-- ชื่อ policy ภาษาไทยยาวเกิน 63 ไบต์จะถูกตัด จึงตั้งชื่อใหม่เป็นภาษาอังกฤษสั้นๆ
drop policy "transactions: สมาชิกเพิ่มรายการได้" on public.transactions;
drop policy "transactions: เจ้าของ/admin แก้ไข" on public.transactions;
drop policy "transactions: เจ้าของ/admin ลบ" on public.transactions;

create policy "transactions_insert_can_edit"
  on public.transactions for insert
  with check (public.can_edit_transactions(community_id) and user_id = auth.uid());

create policy "transactions_update_can_edit"
  on public.transactions for update
  using (public.can_edit_transactions(community_id));

create policy "transactions_delete_can_edit"
  on public.transactions for delete
  using (public.can_edit_transactions(community_id));
