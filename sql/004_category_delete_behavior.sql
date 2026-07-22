-- ลบหมวดหมู่ได้แม้มีรายการอ้างอิงอยู่แล้ว:
-- - transactions: รายการเก่ากลายเป็น "ไม่ระบุหมวดหมู่" (category_id = null) แทนการบล็อกการลบ
-- - budgets: งบประมาณของหมวดหมู่นั้นถูกลบไปด้วย (ไม่มีประโยชน์ถ้าไม่มีหมวดหมู่แล้ว)

alter table public.transactions drop constraint transactions_category_id_fkey;
alter table public.transactions
  add constraint transactions_category_id_fkey
  foreign key (category_id) references public.categories (id) on delete set null;

alter table public.budgets drop constraint budgets_category_id_fkey;
alter table public.budgets
  add constraint budgets_category_id_fkey
  foreign key (category_id) references public.categories (id) on delete cascade;
