-- ============================================================
-- ฟังก์ชันสร้าง/เข้าร่วมชุมชน (รันต่อจาก schema.sql)
-- ============================================================

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

  return v_community;
end;
$$;

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
    raise exception 'คุณเป็นสมาชิกชุมชนนี้อยู่แล้ว';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (v_community.id, auth.uid(), 'member');

  return v_community;
end;
$$;

grant execute on function public.create_community(text) to authenticated;
grant execute on function public.join_community_by_code(text) to authenticated;
