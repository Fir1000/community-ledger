-- ============================================================
-- บัญชีชุมชน - Database Schema + RLS
-- รันไฟล์นี้ทั้งหมดใน Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities (id) on delete cascade, -- null = ดีฟอลต์ระบบ ใช้ได้ทุกชุมชน
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text default '💰',
  color text default '#2f7d5f',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  category_id uuid references public.categories (id),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  receipt_url text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  year int not null,
  month int not null check (month between 1 and 12),
  amount_limit numeric(12, 2) not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  unique (community_id, category_id, year, month)
);

-- Indexes ที่ใช้บ่อย
create index idx_transactions_community_date on public.transactions (community_id, transaction_date desc);
create index idx_community_members_user on public.community_members (user_id);
create index idx_categories_community on public.categories (community_id);

-- ------------------------------------------------------------
-- 2. AUTO-CREATE PROFILE เมื่อสมัครสมาชิกใหม่
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. updated_at อัตโนมัติสำหรับ transactions
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS (security definer เพื่อกัน RLS recursion)
-- ------------------------------------------------------------

create or replace function public.is_community_member(p_community_id uuid)
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
  );
$$;

create or replace function public.is_community_admin(p_community_id uuid)
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
      and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 5. ENABLE RLS
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- ------------------------------------------------------------
-- 6. POLICIES: profiles
-- ------------------------------------------------------------

create policy "profiles: ดูโปรไฟล์ตัวเองหรือเพื่อนร่วมชุมชน"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.community_members cm1
      join public.community_members cm2 on cm1.community_id = cm2.community_id
      where cm1.user_id = auth.uid() and cm2.user_id = profiles.id
    )
  );

create policy "profiles: แก้ไขโปรไฟล์ตัวเอง"
  on public.profiles for update
  using (id = auth.uid());

-- ------------------------------------------------------------
-- 7. POLICIES: communities
-- ------------------------------------------------------------

create policy "communities: สมาชิกดูชุมชนตัวเองได้"
  on public.communities for select
  using (public.is_community_member(id));

create policy "communities: ผู้ใช้ที่ล็อกอินสร้างชุมชนใหม่ได้"
  on public.communities for insert
  with check (created_by = auth.uid());

create policy "communities: admin แก้ไขข้อมูลชุมชนได้"
  on public.communities for update
  using (public.is_community_admin(id));

-- ------------------------------------------------------------
-- 8. POLICIES: community_members
-- ------------------------------------------------------------

create policy "members: เห็นสมาชิกในชุมชนเดียวกัน"
  on public.community_members for select
  using (public.is_community_member(community_id));

create policy "members: เข้าร่วมชุมชนด้วยตัวเอง (join)"
  on public.community_members for insert
  with check (user_id = auth.uid());

create policy "members: admin เพิ่มสมาชิกคนอื่นได้"
  on public.community_members for insert
  with check (public.is_community_admin(community_id));

create policy "members: admin แก้ไข role สมาชิกได้"
  on public.community_members for update
  using (public.is_community_admin(community_id));

create policy "members: ออกจากชุมชนเอง หรือ admin ลบสมาชิกได้"
  on public.community_members for delete
  using (user_id = auth.uid() or public.is_community_admin(community_id));

-- ------------------------------------------------------------
-- 9. POLICIES: categories
-- ------------------------------------------------------------

create policy "categories: เห็นดีฟอลต์ระบบ + หมวดหมู่ชุมชนตัวเอง"
  on public.categories for select
  using (community_id is null or public.is_community_member(community_id));

create policy "categories: สมาชิกเพิ่มหมวดหมู่ของชุมชนตัวเองได้"
  on public.categories for insert
  with check (community_id is not null and public.is_community_member(community_id));

create policy "categories: สมาชิกแก้ไขหมวดหมู่ของชุมชนตัวเองได้"
  on public.categories for update
  using (community_id is not null and public.is_community_member(community_id));

create policy "categories: สมาชิกลบหมวดหมู่ของชุมชนตัวเองได้"
  on public.categories for delete
  using (community_id is not null and public.is_community_member(community_id));

-- ------------------------------------------------------------
-- 10. POLICIES: transactions
-- ------------------------------------------------------------

create policy "transactions: สมาชิกดูรายการของชุมชนตัวเอง"
  on public.transactions for select
  using (public.is_community_member(community_id));

create policy "transactions: สมาชิกเพิ่มรายการได้"
  on public.transactions for insert
  with check (public.is_community_member(community_id) and user_id = auth.uid());

create policy "transactions: เจ้าของ/admin แก้ไข"
  on public.transactions for update
  using (user_id = auth.uid() or public.is_community_admin(community_id));

create policy "transactions: เจ้าของ/admin ลบ"
  on public.transactions for delete
  using (user_id = auth.uid() or public.is_community_admin(community_id));

-- ------------------------------------------------------------
-- 11. POLICIES: budgets
-- ------------------------------------------------------------

create policy "budgets: สมาชิกดูงบประมาณของชุมชนตัวเอง"
  on public.budgets for select
  using (public.is_community_member(community_id));

create policy "budgets: admin ตั้งงบประมาณได้"
  on public.budgets for insert
  with check (public.is_community_admin(community_id));

create policy "budgets: admin แก้ไขงบประมาณได้"
  on public.budgets for update
  using (public.is_community_admin(community_id));

create policy "budgets: admin ลบงบประมาณได้"
  on public.budgets for delete
  using (public.is_community_admin(community_id));

-- ------------------------------------------------------------
-- 12. STORAGE BUCKET สำหรับรูปใบเสร็จ
-- โครงสร้าง path ที่คาดหวัง: {community_id}/{transaction_id}-{filename}
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts: สมาชิกอัปโหลดรูปในโฟลเดอร์ชุมชนตัวเอง"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and public.is_community_member((storage.foldername(name))[1]::uuid)
  );

create policy "receipts: สมาชิกดูรูปในโฟลเดอร์ชุมชนตัวเอง"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and public.is_community_member((storage.foldername(name))[1]::uuid)
  );

create policy "receipts: สมาชิกลบรูปในโฟลเดอร์ชุมชนตัวเอง"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and public.is_community_member((storage.foldername(name))[1]::uuid)
  );

-- ------------------------------------------------------------
-- 13. หมวดหมู่ดีฟอลต์ของระบบ (community_id = null = ใช้ได้ทุกชุมชน)
-- ------------------------------------------------------------

insert into public.categories (community_id, name, type, icon, color) values
  (null, 'ค่าส่วนกลาง', 'income', '🏘️', '#2f7d5f'),
  (null, 'เงินบริจาค', 'income', '🙏', '#2f7d5f'),
  (null, 'รายรับอื่นๆ', 'income', '💰', '#2f7d5f'),
  (null, 'ค่าซ่อมแซม', 'expense', '🔧', '#c0392b'),
  (null, 'ค่าน้ำ-ไฟ', 'expense', '💡', '#c0392b'),
  (null, 'ค่าจัดกิจกรรม', 'expense', '🎉', '#c0392b'),
  (null, 'รายจ่ายอื่นๆ', 'expense', '📦', '#c0392b');
