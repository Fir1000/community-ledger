-- หมวดหมู่ "ระบบ" (community_id = null) เดิมใช้ร่วมกันทุกบัญชี จึงแก้/ลบไม่ได้
-- เปลี่ยนเป็น: คัดลอกให้แต่ละบัญชีเป็นของตัวเอง ย้ายรายการ/งบประมาณเดิมไปหมวดที่คัดลอก แล้วลบหมวดกลางทิ้ง
-- บัญชีใหม่จะได้หมวดเริ่มต้นชุดเดียวกันตอนสร้าง (create_community) และลบ/แก้ไขได้เหมือนหมวดอื่น

-- 1. คัดลอกหมวดกลางให้ทุกบัญชี
create temporary table category_copy_map on commit drop as
select sys.id as system_id, c.id as community_id, gen_random_uuid() as new_id
from public.categories sys
cross join public.communities c
where sys.community_id is null;

insert into public.categories (id, community_id, name, type, icon, color)
select m.new_id, m.community_id, sys.name, sys.type, sys.icon, sys.color
from category_copy_map m
join public.categories sys on sys.id = m.system_id;

-- 2. ย้ายรายการและงบประมาณที่ใช้หมวดกลางไปหมวดของบัญชีตัวเอง
update public.transactions t
set category_id = m.new_id
from category_copy_map m
where t.category_id = m.system_id and t.community_id = m.community_id;

update public.budgets b
set category_id = m.new_id
from category_copy_map m
where b.category_id = m.system_id and b.community_id = m.community_id;

-- 3. ลบหมวดกลาง
delete from public.categories where community_id is null;

-- 4. บัญชีใหม่ได้หมวดเริ่มต้นเป็นของตัวเอง
create or replace function public.create_community(p_name text)
returns public.communities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community public.communities;
begin
  insert into public.communities (name, created_by)
  values (p_name, auth.uid())
  returning * into v_community;

  insert into public.community_members (community_id, user_id, role)
  values (v_community.id, auth.uid(), 'admin');

  insert into public.categories (community_id, name, type, icon, color, created_by) values
    (v_community.id, 'ค่าส่วนกลาง', 'income', '🏘️', '#2f7d5f', auth.uid()),
    (v_community.id, 'เงินบริจาค', 'income', '🙏', '#2f7d5f', auth.uid()),
    (v_community.id, 'รายรับอื่นๆ', 'income', '💰', '#2f7d5f', auth.uid()),
    (v_community.id, 'ค่าซ่อมแซม', 'expense', '🔧', '#c0392b', auth.uid()),
    (v_community.id, 'ค่าน้ำ-ไฟ', 'expense', '💡', '#c0392b', auth.uid()),
    (v_community.id, 'ค่าจัดกิจกรรม', 'expense', '🎉', '#c0392b', auth.uid()),
    (v_community.id, 'รายจ่ายอื่นๆ', 'expense', '📦', '#c0392b', auth.uid());

  return v_community;
end;
$$;

-- 5. ข้อความแจ้งเตือนตอนเข้าร่วมซ้ำ ใช้คำว่า "บัญชี"
create or replace function public.join_community_by_code(p_invite_code text)
returns public.communities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community public.communities;
begin
  select * into v_community from public.communities where invite_code = p_invite_code;

  if v_community.id is null then
    raise exception 'ไม่พบรหัสเชิญนี้';
  end if;

  if exists (
    select 1 from public.community_members
    where community_id = v_community.id and user_id = auth.uid()
  ) then
    raise exception 'คุณเป็นสมาชิกบัญชีนี้อยู่แล้ว';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (v_community.id, auth.uid(), 'member');

  return v_community;
end;
$$;
