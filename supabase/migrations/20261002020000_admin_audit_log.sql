create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource text,
  result text not null,
  created_at timestamptz not null default now(),
  constraint admin_audit_result_check check (result in ('ok', 'failed'))
);

alter table public.admin_audit_log enable row level security;

drop policy if exists admin_audit_read on public.admin_audit_log;
create policy admin_audit_read on public.admin_audit_log
for select to authenticated
using (public.is_admin());
