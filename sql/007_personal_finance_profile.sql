-- "เกี่ยวกับตัวเอง" — ข้อมูลการเงินเริ่มต้นส่วนตัวของผู้ใช้แต่ละคน
-- (ไม่ผูกกับชุมชน เพราะเป็นข้อมูลส่วนตัวของผู้ใช้ ใช้ได้ทุกชุมชนที่เข้าร่วม)

create table public.personal_finance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nickname text,
  cash_amount numeric(12, 2) not null default 0,
  bank_amount numeric(12, 2) not null default 0,
  ewallet_amount numeric(12, 2) not null default 0,
  other_items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.personal_finance_profiles enable row level security;

create trigger trg_personal_finance_profiles_updated_at
  before update on public.personal_finance_profiles
  for each row execute function public.set_updated_at();

create policy "personal_finance_profiles: ดูข้อมูลของตัวเอง"
  on public.personal_finance_profiles for select
  using (user_id = auth.uid());

create policy "personal_finance_profiles: เพิ่มข้อมูลของตัวเอง"
  on public.personal_finance_profiles for insert
  with check (user_id = auth.uid());

create policy "personal_finance_profiles: แก้ไขข้อมูลของตัวเอง"
  on public.personal_finance_profiles for update
  using (user_id = auth.uid());

create policy "personal_finance_profiles: ลบข้อมูลของตัวเอง"
  on public.personal_finance_profiles for delete
  using (user_id = auth.uid());
