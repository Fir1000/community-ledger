-- เพิ่มช่องทางการจ่าย/รับเงิน: เงินสด (cash) หรือ เงินโอน (transfer)
alter table public.transactions
  add column payment_method text not null default 'cash'
  check (payment_method in ('cash', 'transfer'));
