alter table public.profiles
  add column if not exists target_paper text;

alter table public.profiles drop constraint if exists profiles_target_paper_check;
alter table public.profiles
  add constraint profiles_target_paper_check
  check (target_paper is null or target_paper in ('PAPER_I', 'PAPER_II', 'BOTH'));

alter table public.tests
  add column if not exists paper text not null default 'BOTH';

alter table public.tests drop constraint if exists tests_paper_check;
alter table public.tests
  add constraint tests_paper_check
  check (paper in ('PAPER_I', 'PAPER_II', 'BOTH'));

update public.profiles
set target_paper = 'BOTH'
where target_exam in ('STET', 'BOTH') and target_paper is null;

update public.profiles
set target_paper = null
where target_exam = 'BPSC';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_mobile text;
  v_exam text;
  v_paper text;
begin
  v_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  if v_name = '' then
    v_name := 'Student';
  end if;

  v_mobile := trim(coalesce(new.raw_user_meta_data ->> 'mobile_number', new.phone, ''));

  v_exam := upper(trim(coalesce(new.raw_user_meta_data ->> 'target_exam', 'BOTH')));
  if v_exam not in ('STET', 'BPSC', 'BOTH') then
    v_exam := 'BOTH';
  end if;

  v_paper := upper(trim(coalesce(new.raw_user_meta_data ->> 'target_paper', 'BOTH')));
  if v_exam = 'BPSC' then
    v_paper := null;
  elsif v_paper not in ('PAPER_I', 'PAPER_II', 'BOTH') then
    v_paper := 'BOTH';
  end if;

  insert into public.profiles (id, full_name, mobile_number, target_exam, target_paper, role)
  values (new.id, v_name, v_mobile, v_exam, v_paper, 'STUDENT')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.guard_attempt_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_test public.tests;
  v_exam text;
  v_paper text;
begin
  if new.kind is distinct from 'MOCK' or new.test_id is null then
    return new;
  end if;

  select * into v_test from public.tests where id = new.test_id;
  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;

  select target_exam, target_paper into v_exam, v_paper
  from public.profiles
  where id = new.user_id;

  if v_test.exam <> 'BOTH' and v_exam <> 'BOTH' and v_test.exam is distinct from v_exam then
    raise exception 'FORBIDDEN';
  end if;

  if v_exam = 'BPSC' then
    if v_test.exam = 'STET' then
      raise exception 'FORBIDDEN';
    end if;
    return new;
  end if;

  if coalesce(v_paper, 'BOTH') = 'BOTH' or v_test.exam = 'BPSC' or v_test.paper = 'BOTH' or v_test.paper = v_paper then
    return new;
  end if;

  raise exception 'FORBIDDEN';
end;
$$;

drop trigger if exists test_attempts_target on public.test_attempts;
create trigger test_attempts_target
before insert on public.test_attempts
for each row execute function public.guard_attempt_target();

insert into public.tests (id, title, description, exam, paper, duration_minutes, total_questions, is_free, status, selection_mode)
values
  (
    'b0000000-0000-4000-8000-000000000004',
    'STET Music Paper I Mock Test 01',
    'Sample free paper for STET Music Paper I.',
    'STET',
    'PAPER_I',
    15,
    5,
    true,
    'PUBLISHED',
    'FIXED'
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    'STET Music Paper II Mock Test 01',
    'Sample free paper for STET Music Paper II.',
    'STET',
    'PAPER_II',
    15,
    5,
    true,
    'PUBLISHED',
    'FIXED'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  exam = excluded.exam,
  paper = excluded.paper,
  status = excluded.status;

insert into public.test_questions (test_id, question_id, question_order)
select 'b0000000-0000-4000-8000-000000000004', question_id, question_order
from public.test_questions
where test_id = 'b0000000-0000-4000-8000-000000000001'
on conflict (test_id, question_id) do nothing;

insert into public.test_questions (test_id, question_id, question_order)
select 'b0000000-0000-4000-8000-000000000005', question_id, question_order
from public.test_questions
where test_id = 'b0000000-0000-4000-8000-000000000001'
on conflict (test_id, question_id) do nothing;
