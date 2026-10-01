-- Anand Sangeet Music Test Series
-- Standalone platform schema. Passwords stay in auth.users.
-- Apply with the Supabase CLI or the SQL editor. Do not run against the college website database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- The table must exist before is_admin / is_super_admin. Those are SQL
-- functions, and Postgres checks their table references at creation time.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  mobile_number text not null unique,
  target_exam text not null,
  role text not null default 'STUDENT',
  is_active boolean not null default true,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_target_exam_check check (target_exam in ('STET', 'BPSC', 'BOTH')),
  constraint profiles_role_check check (role in ('STUDENT', 'ADMIN', 'SUPER_ADMIN'))
);

comment on table public.profiles is
  'Student and staff profiles. Passwords are never stored here; Supabase Auth owns credentials.';

create index profiles_role_idx on public.profiles (role);
create index profiles_target_exam_idx on public.profiles (target_exam);
create index profiles_created_at_idx on public.profiles (created_at);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('ADMIN', 'SUPER_ADMIN')
      and is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'SUPER_ADMIN'
      and is_active = true
  );
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if tg_op = 'INSERT' then
    if not service then
      new.role := 'STUDENT';
      new.is_active := true;
    end if;
  else
    if new.id is distinct from old.id then
      raise exception 'FORBIDDEN';
    end if;
    if new.role is distinct from old.role and not service and not public.is_super_admin() then
      raise exception 'FORBIDDEN';
    end if;
    if new.is_active is distinct from old.is_active and not service and not public.is_admin() then
      raise exception 'FORBIDDEN';
    end if;
    if new.mobile_number is distinct from old.mobile_number and not service then
      raise exception 'FORBIDDEN';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect
before insert or update on public.profiles
for each row execute function public.protect_profile_fields();

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

  insert into public.profiles (id, full_name, mobile_number, target_exam, role)
  values (new.id, v_name, v_mobile, v_exam, 'STUDENT')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  exam text not null default 'BOTH',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_exam_check check (exam in ('STET', 'BPSC', 'BOTH')),
  constraint topics_name_exam_unique unique (name, exam)
);

create index topics_exam_idx on public.topics (exam);
create index topics_active_idx on public.topics (is_active);

create trigger topics_touch
before update on public.topics
for each row execute function public.touch_updated_at();

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subtopics_name_unique unique (topic_id, name)
);

create index subtopics_topic_idx on public.subtopics (topic_id);

create trigger subtopics_touch
before update on public.subtopics
for each row execute function public.touch_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null,
  explanation text,
  exam text not null,
  subject text not null default 'MUSIC',
  topic_id uuid not null references public.topics (id),
  subtopic text,
  subtopic_id uuid references public.subtopics (id) on delete set null,
  difficulty text not null,
  source text,
  year integer,
  status text not null default 'DRAFT',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_exam_check check (exam in ('STET', 'BPSC', 'BOTH')),
  constraint questions_subject_check check (subject = 'MUSIC'),
  constraint questions_difficulty_check check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  constraint questions_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  constraint questions_correct_check check (correct_option in ('A', 'B', 'C', 'D')),
  constraint questions_year_check check (year is null or (year >= 1900 and year <= 2100))
);

create index questions_exam_idx on public.questions (exam);
create index questions_topic_idx on public.questions (topic_id);
create index questions_difficulty_idx on public.questions (difficulty);
create index questions_status_idx on public.questions (status);
create index questions_created_at_idx on public.questions (created_at);
create index questions_published_pool_idx on public.questions (status, exam);

create trigger questions_touch
before update on public.questions
for each row execute function public.touch_updated_at();

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  exam text not null,
  duration_minutes integer not null,
  total_questions integer not null,
  is_free boolean not null default false,
  is_published boolean not null default false,
  status text not null default 'DRAFT',
  selection_mode text not null default 'FIXED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tests_exam_check check (exam in ('STET', 'BPSC', 'BOTH')),
  constraint tests_duration_check check (duration_minutes > 0 and duration_minutes <= 300),
  constraint tests_count_check check (total_questions > 0 and total_questions <= 200),
  constraint tests_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  constraint tests_mode_check check (selection_mode in ('FIXED', 'RANDOM'))
);

create index tests_exam_idx on public.tests (exam);
create index tests_status_idx on public.tests (status);
create index tests_created_at_idx on public.tests (created_at);

create or replace function public.sync_test_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'PUBLISHED' then
    new.is_published := true;
  else
    new.is_published := false;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tests_sync
before insert or update on public.tests
for each row execute function public.sync_test_publish();

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  question_order integer not null,
  created_at timestamptz not null default now(),
  constraint test_questions_unique_question unique (test_id, question_id),
  constraint test_questions_unique_order unique (test_id, question_order),
  constraint test_questions_order_check check (question_order > 0)
);

create index test_questions_test_idx on public.test_questions (test_id);
create index test_questions_question_idx on public.test_questions (question_id);

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  test_id uuid references public.tests (id),
  kind text not null default 'MOCK',
  practice_title text,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'IN_PROGRESS',
  duration_seconds integer not null,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  unanswered integer not null default 0,
  score integer not null default 0,
  percentage numeric(5, 1) not null default 0,
  accuracy numeric(5, 1) not null default 0,
  time_taken integer,
  created_at timestamptz not null default now(),
  constraint test_attempts_status_check check (status in ('IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED', 'ABANDONED')),
  constraint test_attempts_kind_check check (kind in ('MOCK', 'PRACTICE')),
  constraint test_attempts_duration_check check (duration_seconds > 0)
);

create index test_attempts_user_idx on public.test_attempts (user_id);
create index test_attempts_test_idx on public.test_attempts (test_id);
create index test_attempts_status_idx on public.test_attempts (status);
create index test_attempts_created_idx on public.test_attempts (created_at);
create unique index test_attempts_one_open
  on public.test_attempts (user_id, test_id)
  where status = 'IN_PROGRESS' and test_id is not null;

create or replace function public.guard_test_attempt()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and current_setting('app.scoring', true) is distinct from 'on' then
    if new.user_id is distinct from old.user_id
      or new.test_id is distinct from old.test_id
      or new.score is distinct from old.score
      or new.correct_answers is distinct from old.correct_answers
      or new.wrong_answers is distinct from old.wrong_answers
      or new.unanswered is distinct from old.unanswered
      or new.percentage is distinct from old.percentage
      or new.accuracy is distinct from old.accuracy
      or new.status is distinct from old.status
      or new.time_taken is distinct from old.time_taken
      or new.submitted_at is distinct from old.submitted_at
      or new.duration_seconds is distinct from old.duration_seconds
      or new.total_questions is distinct from old.total_questions
    then
      raise exception 'FORBIDDEN';
    end if;
  end if;
  return new;
end;
$$;

create trigger test_attempts_guard
before update on public.test_attempts
for each row execute function public.guard_test_attempt();

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  question_order integer not null,
  selected_answer text,
  correct_answer text,
  is_correct boolean,
  is_marked boolean not null default false,
  visited boolean not null default false,
  time_taken integer not null default 0,
  topic_id uuid references public.topics (id),
  created_at timestamptz not null default now(),
  constraint question_attempts_unique unique (attempt_id, question_id),
  constraint question_attempts_order_unique unique (attempt_id, question_order),
  constraint question_attempts_selected_check check (selected_answer is null or selected_answer in ('A', 'B', 'C', 'D')),
  constraint question_attempts_correct_check check (correct_answer is null or correct_answer in ('A', 'B', 'C', 'D'))
);

create index question_attempts_attempt_idx on public.question_attempts (attempt_id);
create index question_attempts_question_idx on public.question_attempts (question_id);
create index question_attempts_topic_idx on public.question_attempts (topic_id);
create index question_attempts_created_idx on public.question_attempts (created_at);

create or replace function public.guard_question_attempt()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and current_setting('app.scoring', true) is distinct from 'on' then
    if new.attempt_id is distinct from old.attempt_id
      or new.question_id is distinct from old.question_id
      or new.question_order is distinct from old.question_order
      or new.topic_id is distinct from old.topic_id
      or new.correct_answer is distinct from old.correct_answer
      or new.is_correct is distinct from old.is_correct
    then
      raise exception 'FORBIDDEN';
    end if;
  end if;
  return new;
end;
$$;

create trigger question_attempts_guard
before update on public.question_attempts
for each row execute function public.guard_question_attempt();

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  currency text not null default 'INR',
  duration_days integer not null,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_price_check check (price >= 0),
  constraint plans_duration_check check (duration_days > 0),
  constraint plans_currency_check check (currency = 'INR')
);

create trigger plans_touch
before update on public.subscription_plans
for each row execute function public.touch_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status text not null default 'PENDING',
  start_date timestamptz,
  expiry_date timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_check check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'))
);

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_created_idx on public.subscriptions (created_at);

create trigger subscriptions_touch
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'CREATED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_check check (status in ('CREATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
  constraint payments_amount_check check (amount >= 0)
);

create index payments_user_idx on public.payments (user_id);
create index payments_status_idx on public.payments (status);
create index payments_created_idx on public.payments (created_at);

create trigger payments_touch
before update on public.payments
for each row execute function public.touch_updated_at();

alter table public.subscriptions
  add constraint subscriptions_payment_fk
  foreign key (payment_id) references public.payments (id);

-- ---------------------------------------------------------------------------
-- Support, reports, notifications
-- ---------------------------------------------------------------------------

create sequence public.support_ticket_seq start 1001;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('ASM-' || nextval('public.support_ticket_seq')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  subject text not null,
  description text not null,
  priority text not null default 'MEDIUM',
  status text not null default 'OPEN',
  assigned_to uuid references public.profiles (id),
  test_id uuid references public.tests (id),
  question_id uuid references public.questions (id),
  payment_id uuid references public.payments (id),
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_category_check check (category in (
    'LOGIN', 'PAYMENT', 'TEST', 'QUESTION', 'RESULT', 'TECHNICAL', 'PREMIUM', 'OTHER'
  )),
  constraint tickets_priority_check check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  constraint tickets_status_check check (status in (
    'OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED'
  ))
);

create index support_tickets_user_idx on public.support_tickets (user_id);
create index support_tickets_status_idx on public.support_tickets (status);
create index support_tickets_created_idx on public.support_tickets (created_at);

create trigger support_tickets_touch
before update on public.support_tickets
for each row execute function public.touch_updated_at();

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  message text not null,
  is_internal boolean not null default false,
  attachment_path text,
  created_at timestamptz not null default now()
);

create index support_messages_ticket_idx on public.support_messages (ticket_id);
create index support_messages_created_idx on public.support_messages (created_at);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  attempt_id uuid references public.test_attempts (id),
  reason text not null,
  description text,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_reason_check check (reason in (
    'WRONG_ANSWER', 'INCORRECT_QUESTION', 'TYPO', 'DUPLICATE', 'OTHER'
  )),
  constraint reports_status_check check (status in ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'))
);

create index question_reports_user_idx on public.question_reports (user_id);
create index question_reports_question_idx on public.question_reports (question_id);
create index question_reports_status_idx on public.question_reports (status);
create index question_reports_created_idx on public.question_reports (created_at);

create trigger question_reports_touch
before update on public.question_reports
for each row execute function public.touch_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in (
    'PAYMENT_SUCCESS', 'PREMIUM_ACTIVATED', 'SUPPORT_REPLY', 'SUPPORT_RESOLVED', 'ANNOUNCEMENT'
  ))
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create or replace function public.guard_notification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.title is distinct from old.title
      or new.message is distinct from old.message
      or new.type is distinct from old.type
    then
      raise exception 'FORBIDDEN';
    end if;
  end if;
  return new;
end;
$$;

create trigger notifications_guard
before update on public.notifications
for each row execute function public.guard_notification();

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('free_mock_limit', '2'::jsonb),
  ('weak_thresholds', '{"strong_max":1,"needs_practice_max":2,"weak_max":4}'::jsonb);

-- ---------------------------------------------------------------------------
-- Domain functions
-- ---------------------------------------------------------------------------

create or replace function public.setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(value #>> '{}', '')::integer from public.platform_settings where key = p_key),
    p_default
  );
$$;

create or replace function public.weakness_band(p_wrong integer)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cfg jsonb;
  strong_max integer := 1;
  practice_max integer := 2;
  weak_max integer := 4;
begin
  select value into cfg from public.platform_settings where key = 'weak_thresholds';
  if cfg is not null then
    strong_max := coalesce((cfg ->> 'strong_max')::integer, 1);
    practice_max := coalesce((cfg ->> 'needs_practice_max')::integer, 2);
    weak_max := coalesce((cfg ->> 'weak_max')::integer, 4);
  end if;
  if p_wrong <= strong_max then
    return 'STRONG';
  elsif p_wrong <= practice_max then
    return 'NEEDS_PRACTICE';
  elsif p_wrong <= weak_max then
    return 'WEAK';
  end if;
  return 'CRITICAL';
end;
$$;

create or replace function public.has_active_premium(p_user uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return false;
  end if;
  if p_user is distinct from auth.uid()
    and not public.is_admin()
    and coalesce(auth.role(), '') <> 'service_role'
  then
    return false;
  end if;
  return exists (
    select 1
    from public.subscriptions
    where user_id = p_user
      and status = 'ACTIVE'
      and expiry_date > now()
  );
end;
$$;

create or replace function public.free_mock_status(p_user uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
  v_premium boolean;
begin
  if p_user is null or (
    p_user is distinct from auth.uid()
    and not public.is_admin()
    and coalesce(auth.role(), '') <> 'service_role'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  v_limit := public.setting_int('free_mock_limit', 2);
  v_premium := public.has_active_premium(p_user);
  select count(*)::integer into v_used
  from public.test_attempts ta
  join public.tests t on t.id = ta.test_id
  where ta.user_id = p_user
    and ta.kind = 'MOCK'
    and t.is_free = true
    and ta.status in ('IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED');

  return jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'remaining', greatest(v_limit - v_used, 0),
    'premium', v_premium
  );
end;
$$;

create or replace function public.create_practice_attempt(
  p_title text,
  p_question_ids uuid[],
  p_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_count integer;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;
  if not public.has_active_premium(v_user) then
    raise exception 'PREMIUM_REQUIRED';
  end if;
  if p_question_ids is null or cardinality(p_question_ids) = 0 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;

  v_count := cardinality(p_question_ids);

  insert into public.test_attempts (
    user_id, test_id, kind, practice_title, started_at, status,
    duration_seconds, total_questions, unanswered
  ) values (
    v_user, null, 'PRACTICE', p_title, now(), 'IN_PROGRESS',
    greatest(p_minutes, 1) * 60, v_count, v_count
  ) returning id into v_attempt;

  insert into public.question_attempts (
    attempt_id, question_id, question_order, topic_id, visited, is_marked
  )
  select v_attempt, q.id, ord, q.topic_id, false, false
  from unnest(p_question_ids) with ordinality as picked(id, ord)
  join public.questions q on q.id = picked.id
  where q.status = 'PUBLISHED';

  return v_attempt;
end;
$$;

create or replace function public.start_test(p_test_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_test public.tests;
  v_existing uuid;
  v_premium boolean;
  v_limit integer;
  v_used integer;
  v_attempt uuid;
  v_count integer;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (select 1 from public.profiles where id = v_user and is_active = true) then
    raise exception 'FORBIDDEN';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select * into v_test from public.tests where id = p_test_id;
  if not found or v_test.status <> 'PUBLISHED' then
    raise exception 'TEST_NOT_FOUND';
  end if;

  select id into v_existing
  from public.test_attempts
  where user_id = v_user and test_id = p_test_id and status = 'IN_PROGRESS'
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  v_premium := public.has_active_premium(v_user);
  if not v_test.is_free and not v_premium then
    raise exception 'PREMIUM_REQUIRED';
  end if;

  if v_test.is_free and not v_premium then
    v_limit := public.setting_int('free_mock_limit', 2);
    select count(*)::integer into v_used
    from public.test_attempts ta
    join public.tests t on t.id = ta.test_id
    where ta.user_id = v_user
      and ta.kind = 'MOCK'
      and t.is_free = true
      and ta.status in ('IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED');
    if v_used >= v_limit then
      raise exception 'FREE_LIMIT_REACHED';
    end if;
  end if;

  create temporary table if not exists _picked_test (
    question_id uuid,
    question_order integer,
    topic_id uuid
  ) on commit drop;
  truncate _picked_test;

  if v_test.selection_mode = 'FIXED' then
    insert into _picked_test (question_id, question_order, topic_id)
    select tq.question_id, tq.question_order, q.topic_id
    from public.test_questions tq
    join public.questions q on q.id = tq.question_id
    where tq.test_id = p_test_id and q.status = 'PUBLISHED'
    order by tq.question_order;
  else
    insert into _picked_test (question_id, question_order, topic_id)
    select picked.id, row_number() over ()::integer, picked.topic_id
    from (
      select q.id, q.topic_id
      from public.questions q
      where q.status = 'PUBLISHED'
        and (q.exam = v_test.exam or q.exam = 'BOTH' or v_test.exam = 'BOTH')
      order by random()
      limit v_test.total_questions
    ) picked;
  end if;

  select count(*) into v_count from _picked_test;
  if v_count = 0 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;
  if v_test.selection_mode = 'RANDOM' and v_count < v_test.total_questions then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;

  insert into public.test_attempts (
    user_id, test_id, kind, started_at, status, duration_seconds, total_questions, unanswered
  ) values (
    v_user, p_test_id, 'MOCK', now(), 'IN_PROGRESS', v_test.duration_minutes * 60, v_count, v_count
  ) returning id into v_attempt;

  perform set_config('app.scoring', 'on', true);
  insert into public.question_attempts (
    attempt_id, question_id, question_order, topic_id, visited, is_marked
  )
  select v_attempt, question_id, question_order, topic_id, false, false
  from _picked_test;

  return v_attempt;
end;
$$;

create or replace function public.submit_attempt(p_attempt_id uuid, p_auto boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts;
  v_correct integer;
  v_wrong integer;
  v_unanswered integer;
  v_total integer;
  v_time integer;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_attempt
  from public.test_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if v_attempt.user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if v_attempt.status <> 'IN_PROGRESS' then
    return v_attempt.id;
  end if;

  perform set_config('app.scoring', 'on', true);

  update public.question_attempts qa
  set
    correct_answer = q.correct_option,
    is_correct = case
      when qa.selected_answer is null then null
      when qa.selected_answer = q.correct_option then true
      else false
    end
  from public.questions q
  where qa.attempt_id = p_attempt_id
    and q.id = qa.question_id;

  select
    count(*) filter (where is_correct is true)::integer,
    count(*) filter (where selected_answer is not null and is_correct is false)::integer,
    count(*) filter (where selected_answer is null)::integer,
    count(*)::integer
  into v_correct, v_wrong, v_unanswered, v_total
  from public.question_attempts
  where attempt_id = p_attempt_id;

  v_time := least(
    greatest(extract(epoch from (now() - v_attempt.started_at))::integer, 0),
    v_attempt.duration_seconds
  );

  update public.test_attempts
  set
    status = case when p_auto then 'AUTO_SUBMITTED' else 'COMPLETED' end,
    submitted_at = now(),
    correct_answers = v_correct,
    wrong_answers = v_wrong,
    unanswered = v_unanswered,
    score = v_correct,
    total_questions = v_total,
    percentage = case when v_total = 0 then 0 else round(v_correct::numeric / v_total * 100, 1) end,
    accuracy = case
      when (v_correct + v_wrong) = 0 then 0
      else round(v_correct::numeric / (v_correct + v_wrong) * 100, 1)
    end,
    time_taken = v_time
  where id = p_attempt_id;

  return p_attempt_id;
end;
$$;

create or replace function public.save_response(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected text,
  p_marked boolean,
  p_time_taken integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts;
  v_selected text;
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_attempt
  from public.test_attempts
  where id = p_attempt_id and user_id = auth.uid();

  if not found then
    raise exception 'FORBIDDEN';
  end if;
  if v_attempt.status <> 'IN_PROGRESS' then
    raise exception 'ATTEMPT_CLOSED';
  end if;

  if now() > v_attempt.started_at + make_interval(secs => v_attempt.duration_seconds) then
    perform public.submit_attempt(p_attempt_id, true);
    return jsonb_build_object('status', 'AUTO_SUBMITTED');
  end if;

  v_selected := nullif(upper(trim(coalesce(p_selected, ''))), '');
  if v_selected is not null and v_selected not in ('A', 'B', 'C', 'D') then
    raise exception 'INVALID_INPUT';
  end if;

  perform set_config('app.scoring', 'on', true);
  update public.question_attempts
  set
    selected_answer = v_selected,
    is_marked = coalesce(p_marked, false),
    visited = true,
    time_taken = time_taken + least(greatest(coalesce(p_time_taken, 0), 0), 120)
  where attempt_id = p_attempt_id
    and question_id = p_question_id;

  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;

  return jsonb_build_object('status', 'IN_PROGRESS');
end;
$$;

create or replace function public.get_attempt_paper(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts;
  v_title text;
  v_exam text;
  v_done boolean;
  v_questions jsonb;
begin
  select * into v_attempt from public.test_attempts where id = p_attempt_id;
  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if v_attempt.user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_attempt.status = 'IN_PROGRESS'
    and now() > v_attempt.started_at + make_interval(secs => v_attempt.duration_seconds)
  then
    perform public.submit_attempt(p_attempt_id, true);
    select * into v_attempt from public.test_attempts where id = p_attempt_id;
  end if;

  v_done := v_attempt.status in ('COMPLETED', 'AUTO_SUBMITTED');

  select coalesce(t.title, v_attempt.practice_title, 'Practice'), coalesce(t.exam, 'BOTH')
  into v_title, v_exam
  from (select 1) dummy
  left join public.tests t on t.id = v_attempt.test_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'order', qa.question_order,
      'question_text', q.question_text,
      'option_a', q.option_a,
      'option_b', q.option_b,
      'option_c', q.option_c,
      'option_d', q.option_d,
      'selected_answer', qa.selected_answer,
      'is_marked', qa.is_marked,
      'visited', qa.visited,
      'topic_id', qa.topic_id,
      'topic_name', tp.name,
      'image_path', q.image_path,
      'correct_option', case when v_done then q.correct_option else null end,
      'explanation', case when v_done then q.explanation else null end,
      'is_correct', case when v_done then qa.is_correct else null end
    )
    order by qa.question_order
  ), '[]'::jsonb)
  into v_questions
  from public.question_attempts qa
  join public.questions q on q.id = qa.question_id
  left join public.topics tp on tp.id = qa.topic_id
  where qa.attempt_id = p_attempt_id;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'title', v_title,
      'exam', v_exam,
      'kind', v_attempt.kind,
      'started_at', v_attempt.started_at,
      'submitted_at', v_attempt.submitted_at,
      'duration_seconds', v_attempt.duration_seconds,
      'ends_at', v_attempt.started_at + make_interval(secs => v_attempt.duration_seconds),
      'total_questions', v_attempt.total_questions,
      'correct_answers', case when v_done then v_attempt.correct_answers else null end,
      'wrong_answers', case when v_done then v_attempt.wrong_answers else null end,
      'unanswered', case when v_done then v_attempt.unanswered else null end,
      'score', case when v_done then v_attempt.score else null end,
      'percentage', case when v_done then v_attempt.percentage else null end,
      'accuracy', case when v_done then v_attempt.accuracy else null end,
      'time_taken', case when v_done then v_attempt.time_taken else null end
    ),
    'questions', v_questions
  );
end;
$$;

create or replace function public.attempt_topic_analytics(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.test_attempts where id = p_attempt_id;
  if v_owner is null then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if v_owner is distinct from auth.uid() and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(s)::jsonb order by s.topic_name)
    from (
      select
        tp.id as topic_id,
        tp.name as topic_name,
        count(*) filter (where qa.selected_answer is not null)::integer as attempted,
        count(*) filter (where qa.is_correct is true)::integer as correct,
        count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer as wrong,
        case
          when count(*) filter (where qa.selected_answer is not null) = 0 then 0
          else round(
            count(*) filter (where qa.is_correct is true)::numeric
            / count(*) filter (where qa.selected_answer is not null) * 100,
            1
          )
        end as accuracy
      from public.question_attempts qa
      join public.topics tp on tp.id = qa.topic_id
      where qa.attempt_id = p_attempt_id
      group by tp.id, tp.name
    ) s
  ), '[]'::jsonb);
end;
$$;

create or replace function public.weak_topic_report(p_user uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user is null or (
    p_user is distinct from auth.uid() and not public.is_admin()
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(s)::jsonb order by s.wrong desc, s.topic_name)
    from (
      select
        tp.id as topic_id,
        tp.name as topic_name,
        count(*) filter (where qa.selected_answer is not null)::integer as attempted,
        count(*) filter (where qa.is_correct is true)::integer as correct,
        count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer as wrong,
        case
          when count(*) filter (where qa.selected_answer is not null) = 0 then 0
          else round(
            count(*) filter (where qa.is_correct is true)::numeric
            / count(*) filter (where qa.selected_answer is not null) * 100,
            1
          )
        end as accuracy,
        public.weakness_band(
          count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer
        ) as band
      from public.question_attempts qa
      join public.test_attempts ta on ta.id = qa.attempt_id
      join public.topics tp on tp.id = qa.topic_id
      where ta.user_id = p_user
        and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
      group by tp.id, tp.name
    ) s
  ), '[]'::jsonb);
end;
$$;

create or replace function public.pick_practice_questions(
  p_topic_ids uuid[],
  p_limit integer
)
returns uuid[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_need integer;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;

  select coalesce(array_agg(id), '{}') into v_ids
  from (
    select q.id
    from public.questions q
    where q.status = 'PUBLISHED'
      and q.topic_id = any (p_topic_ids)
      and not exists (
        select 1
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        where qa.question_id = q.id
          and ta.user_id = v_user
          and ta.created_at > now() - interval '30 days'
      )
    order by random()
    limit greatest(p_limit, 1)
  ) fresh;

  v_need := greatest(p_limit, 1) - cardinality(v_ids);
  if v_need > 0 then
    select v_ids || coalesce(array_agg(id), '{}') into v_ids
    from (
      select q.id
      from public.questions q
      where q.status = 'PUBLISHED'
        and q.topic_id = any (p_topic_ids)
        and not (q.id = any (v_ids))
      order by random()
      limit v_need
    ) filler;
  end if;

  return v_ids;
end;
$$;

create or replace function public.start_topic_practice(p_topic_id uuid, p_limit integer default 10)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_ids uuid[];
begin
  select name into v_name from public.topics where id = p_topic_id and is_active = true;
  if v_name is null then
    raise exception 'TEST_NOT_FOUND';
  end if;
  v_ids := public.pick_practice_questions(array[p_topic_id], least(greatest(p_limit, 1), 50));
  if cardinality(v_ids) = 0 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;
  return public.create_practice_attempt('Practice: ' || v_name, v_ids, 20);
end;
$$;

create or replace function public.start_weak_practice(p_limit integer default 20)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topics uuid[];
  v_ids uuid[];
begin
  select coalesce(array_agg(topic_id), '{}') into v_topics
  from (
    select (item ->> 'topic_id')::uuid as topic_id
    from jsonb_array_elements(public.weak_topic_report(auth.uid())) item
    where item ->> 'band' in ('WEAK', 'CRITICAL')
  ) weak;

  if cardinality(v_topics) = 0 then
    select coalesce(array_agg(topic_id), '{}') into v_topics
    from (
      select (item ->> 'topic_id')::uuid as topic_id
      from jsonb_array_elements(public.weak_topic_report(auth.uid())) item
      where item ->> 'band' = 'NEEDS_PRACTICE'
    ) practice;
  end if;

  if cardinality(v_topics) = 0 then
    raise exception 'NO_WEAK_TOPICS';
  end if;

  v_ids := public.pick_practice_questions(v_topics, least(greatest(coalesce(p_limit, 20), 1), 50));
  if cardinality(v_ids) = 0 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;
  return public.create_practice_attempt('Practice my weak topics', v_ids, 30);
end;
$$;

create or replace function public.student_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_stats jsonb;
  v_sub jsonb;
  v_recent jsonb;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'tests_attempted', count(*) filter (where status in ('COMPLETED', 'AUTO_SUBMITTED')),
    'average_score', coalesce(round(avg(percentage) filter (where status in ('COMPLETED', 'AUTO_SUBMITTED')), 1), 0),
    'average_accuracy', coalesce(round(avg(accuracy) filter (where status in ('COMPLETED', 'AUTO_SUBMITTED')), 1), 0),
    'questions_attempted', coalesce((
      select count(*)
      from public.question_attempts qa
      join public.test_attempts ta2 on ta2.id = qa.attempt_id
      where ta2.user_id = v_user
        and ta2.status in ('COMPLETED', 'AUTO_SUBMITTED')
        and qa.selected_answer is not null
    ), 0)
  ) into v_stats
  from public.test_attempts
  where user_id = v_user;

  select jsonb_build_object(
    'status', s.status,
    'expiry_date', s.expiry_date,
    'plan_name', p.name
  ) into v_sub
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.user_id = v_user
  order by case when s.status = 'ACTIVE' and s.expiry_date > now() then 0 else 1 end, s.created_at desc
  limit 1;

  select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb) into v_recent
  from (
    select
      ta.id,
      coalesce(t.title, ta.practice_title, 'Practice') as title,
      coalesce(t.exam, 'BOTH') as exam,
      ta.status,
      ta.score,
      ta.percentage,
      ta.correct_answers,
      ta.wrong_answers,
      ta.time_taken,
      ta.submitted_at,
      ta.created_at
    from public.test_attempts ta
    left join public.tests t on t.id = ta.test_id
    where ta.user_id = v_user
    order by ta.created_at desc
    limit 5
  ) r;

  return jsonb_build_object(
    'stats', v_stats,
    'free', public.free_mock_status(v_user),
    'subscription', v_sub,
    'weak_topics', public.weak_topic_report(v_user),
    'recent_attempts', v_recent
  );
end;
$$;

create or replace function public.import_questions(
  p_rows jsonb,
  p_commit boolean default false,
  p_publish boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_valid integer := 0;
  v_invalid integer := 0;
  v_duplicate integer := 0;
  v_inserted integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_status text := case when p_publish then 'PUBLISHED' else 'DRAFT' end;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'INVALID_INPUT';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'TOO_MANY_ROWS';
  end if;

  create temporary table if not exists _import_rows (
    idx integer primary key,
    question_text text,
    option_a text,
    option_b text,
    option_c text,
    option_d text,
    correct_option text,
    exam text,
    subject text,
    topic_name text,
    subtopic_name text,
    difficulty text,
    explanation text,
    source text,
    year integer,
    topic_id uuid,
    norm text,
    row_error text
  ) on commit drop;
  truncate _import_rows;

  insert into _import_rows (
    idx, question_text, option_a, option_b, option_c, option_d, correct_option,
    exam, subject, topic_name, subtopic_name, difficulty, explanation, source, year, norm
  )
  select
    ordinality::integer,
    nullif(trim(item ->> 'question'), ''),
    nullif(trim(item ->> 'option_a'), ''),
    nullif(trim(item ->> 'option_b'), ''),
    nullif(trim(item ->> 'option_c'), ''),
    nullif(trim(item ->> 'option_d'), ''),
    upper(trim(coalesce(item ->> 'correct_answer', ''))),
    upper(trim(coalesce(item ->> 'exam', ''))),
    upper(trim(coalesce(nullif(item ->> 'subject', ''), 'MUSIC'))),
    nullif(trim(item ->> 'topic'), ''),
    nullif(trim(item ->> 'subtopic'), ''),
    upper(trim(coalesce(item ->> 'difficulty', ''))),
    nullif(trim(item ->> 'explanation'), ''),
    nullif(trim(item ->> 'source'), ''),
    case
      when nullif(trim(coalesce(item ->> 'year', '')), '') is null then null
      when trim(item ->> 'year') ~ '^[0-9]{4}$' then trim(item ->> 'year')::integer
      else -1
    end,
    lower(regexp_replace(trim(coalesce(item ->> 'question', '')), '\s+', ' ', 'g'))
  from jsonb_array_elements(p_rows) with ordinality as src(item, ordinality);

  update _import_rows
  set correct_option = case
    when correct_option in ('A', 'B', 'C', 'D') then correct_option
    when lower(correct_option) = lower(option_a) then 'A'
    when lower(correct_option) = lower(option_b) then 'B'
    when lower(correct_option) = lower(option_c) then 'C'
    when lower(correct_option) = lower(option_d) then 'D'
    else correct_option
  end;

  update _import_rows i
  set topic_id = t.id
  from public.topics t
  where i.topic_name is not null
    and lower(t.name) = lower(i.topic_name)
    and (t.exam = i.exam or t.exam = 'BOTH' or i.exam = 'BOTH');

  update _import_rows
  set row_error = case
    when question_text is null then 'Question text is required'
    when option_a is null or option_b is null or option_c is null or option_d is null then 'All four options are required'
    when correct_option not in ('A', 'B', 'C', 'D') then 'Correct answer must be A, B, C, or D'
    when exam not in ('STET', 'BPSC', 'BOTH') then 'Exam must be STET, BPSC, or BOTH'
    when subject <> 'MUSIC' then 'Subject must be MUSIC'
    when difficulty not in ('EASY', 'MEDIUM', 'HARD') then 'Difficulty must be EASY, MEDIUM, or HARD'
    when topic_name is null then 'Topic is required'
    when topic_id is null then 'Unknown topic'
    when year is not null and (year < 1900 or year > 2100) then 'Year is invalid'
    else null
  end;

  update _import_rows i
  set row_error = 'Duplicate question'
  where i.row_error is null
    and (
      exists (
        select 1 from public.questions q
        where lower(regexp_replace(trim(q.question_text), '\s+', ' ', 'g')) = i.norm
          and q.exam = i.exam
      )
      or exists (
        select 1 from _import_rows earlier
        where earlier.norm = i.norm
          and earlier.exam = i.exam
          and earlier.idx < i.idx
          and earlier.row_error is null
      )
    );

  select count(*) into v_total from _import_rows;
  select count(*) into v_invalid from _import_rows where row_error is not null and row_error <> 'Duplicate question';
  select count(*) into v_duplicate from _import_rows where row_error = 'Duplicate question';
  select count(*) into v_valid from _import_rows where row_error is null or row_error = 'Duplicate question';

  select coalesce(jsonb_agg(jsonb_build_object('row', idx, 'message', row_error) order by idx), '[]'::jsonb)
  into v_errors
  from (
    select idx, row_error
    from _import_rows
    where row_error is not null
    order by idx
    limit 50
  ) e;

  if p_commit then
    insert into public.subtopics (topic_id, name)
    select distinct i.topic_id, i.subtopic_name
    from _import_rows i
    where i.row_error is null
      and i.subtopic_name is not null
      and not exists (
        select 1 from public.subtopics s
        where s.topic_id = i.topic_id and lower(s.name) = lower(i.subtopic_name)
      );

    insert into public.questions (
      question_text, option_a, option_b, option_c, option_d, correct_option,
      explanation, exam, subject, topic_id, subtopic, subtopic_id, difficulty,
      source, year, status
    )
    select
      i.question_text, i.option_a, i.option_b, i.option_c, i.option_d, i.correct_option,
      i.explanation, i.exam, 'MUSIC', i.topic_id, i.subtopic_name, s.id, i.difficulty,
      i.source, i.year, v_status
    from _import_rows i
    left join public.subtopics s
      on s.topic_id = i.topic_id and lower(s.name) = lower(i.subtopic_name)
    where i.row_error is null;

    get diagnostics v_inserted = row_count;
  end if;

  return jsonb_build_object(
    'total', v_total,
    'valid', v_valid,
    'invalid', v_invalid,
    'duplicate', v_duplicate,
    'new_rows', case when p_commit then v_inserted else v_total - v_invalid - v_duplicate end,
    'errors', v_errors
  );
end;
$$;

create or replace function public.set_test_questions(p_test_id uuid, p_question_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (select 1 from public.tests where id = p_test_id) then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_question_ids, '{}'::uuid[])) as picked(id)
    where not exists (select 1 from public.questions q where q.id = picked.id)
  ) then
    raise exception 'INVALID_INPUT';
  end if;
  if (select count(*) from unnest(coalesce(p_question_ids, '{}'::uuid[])) as picked(id))
    <> (select count(distinct id) from unnest(coalesce(p_question_ids, '{}'::uuid[])) as picked(id))
  then
    raise exception 'INVALID_INPUT';
  end if;

  delete from public.test_questions where test_id = p_test_id;
  insert into public.test_questions (test_id, question_id, question_order)
  select p_test_id, picked.id, picked.ord::integer
  from unnest(coalesce(p_question_ids, '{}'::uuid[])) with ordinality as picked(id, ord);
end;
$$;

create or replace function public.attach_support_file(p_ticket_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN';
  end if;
  if p_path is null or p_path not like (auth.uid()::text || '/%') then
    raise exception 'FORBIDDEN';
  end if;
  update public.support_tickets
  set attachment_path = p_path
  where id = p_ticket_id and user_id = auth.uid();
  if not found then
    raise exception 'FORBIDDEN';
  end if;
end;
$$;

create or replace function public.set_user_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_role not in ('STUDENT', 'ADMIN', 'SUPER_ADMIN') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_user = auth.uid() then
    raise exception 'FORBIDDEN';
  end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.set_user_active(p_user uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_user = auth.uid() then
    raise exception 'FORBIDDEN';
  end if;
  update public.profiles set is_active = p_active where id = p_user;
end;
$$;

create or replace function public.update_platform_setting(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_key not in ('free_mock_limit', 'weak_thresholds') then
    raise exception 'INVALID_INPUT';
  end if;
  insert into public.platform_settings (key, value)
  values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

create or replace function public.broadcast_announcement(p_title text, p_message text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if length(trim(p_title)) < 3 or length(trim(p_message)) < 3 then
    raise exception 'INVALID_INPUT';
  end if;
  insert into public.notifications (user_id, title, message, type)
  select id, trim(p_title), trim(p_message), 'ANNOUNCEMENT'
  from public.profiles
  where role = 'STUDENT' and is_active = true;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cards jsonb;
  v_registrations jsonb;
  v_attempts jsonb;
  v_revenue jsonb;
  v_popular jsonb;
  v_weak jsonb;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'STUDENT'),
    'premium_students', (
      select count(distinct user_id) from public.subscriptions
      where status = 'ACTIVE' and expiry_date > now()
    ),
    'questions', (select count(*) from public.questions),
    'published_questions', (select count(*) from public.questions where status = 'PUBLISHED'),
    'tests', (select count(*) from public.tests),
    'attempts', (select count(*) from public.test_attempts),
    'revenue', coalesce((select sum(amount) from public.payments where status = 'SUCCESS'), 0),
    'open_tickets', (select count(*) from public.support_tickets where status in ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT')),
    'open_reports', (select count(*) from public.question_reports where status in ('OPEN', 'REVIEWING'))
  ) into v_cards;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', count) order by day), '[]'::jsonb)
  into v_registrations
  from (
    select to_char(d::date, 'DD Mon') as day, count(p.id)::integer as count
    from generate_series(current_date - 13, current_date, interval '1 day') d
    left join public.profiles p on p.created_at::date = d::date and p.role = 'STUDENT'
    group by d
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', count) order by day), '[]'::jsonb)
  into v_attempts
  from (
    select to_char(d::date, 'DD Mon') as day, count(a.id)::integer as count
    from generate_series(current_date - 13, current_date, interval '1 day') d
    left join public.test_attempts a on a.created_at::date = d::date
    group by d
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'amount', amount) order by day), '[]'::jsonb)
  into v_revenue
  from (
    select to_char(d::date, 'DD Mon') as day, coalesce(sum(p.amount), 0)::numeric as amount
    from generate_series(current_date - 13, current_date, interval '1 day') d
    left join public.payments p on p.created_at::date = d::date and p.status = 'SUCCESS'
    group by d
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'attempts', attempts) order by attempts desc), '[]'::jsonb)
  into v_popular
  from (
    select t.title, count(a.id)::integer as attempts
    from public.tests t
    left join public.test_attempts a on a.test_id = t.id
    group by t.id, t.title
    order by attempts desc
    limit 5
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'wrong', wrong) order by wrong desc), '[]'::jsonb)
  into v_weak
  from (
    select tp.name as topic,
      count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer as wrong
    from public.question_attempts qa
    join public.test_attempts ta on ta.id = qa.attempt_id
    join public.topics tp on tp.id = qa.topic_id
    where ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
    group by tp.id, tp.name
    order by wrong desc
    limit 5
  ) s;

  return jsonb_build_object(
    'cards', v_cards,
    'registrations', v_registrations,
    'attempts', v_attempts,
    'revenue', v_revenue,
    'popular_tests', v_popular,
    'weak_topics', v_weak
  );
end;
$$;

create or replace function public.activate_premium_payment(
  p_order_id text,
  p_payment_id text,
  p_signature text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_plan public.subscription_plans;
  v_start timestamptz := now();
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_payment
  from public.payments
  where razorpay_order_id = p_order_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;
  if v_payment.status = 'SUCCESS' then
    return jsonb_build_object('status', 'SUCCESS', 'already', true);
  end if;
  if v_payment.status <> 'CREATED' then
    raise exception 'PAYMENT_NOT_PENDING';
  end if;

  select p.* into v_plan
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.id = v_payment.subscription_id;

  update public.payments
  set
    status = 'SUCCESS',
    razorpay_payment_id = p_payment_id,
    razorpay_signature = p_signature
  where id = v_payment.id;

  update public.subscriptions
  set
    status = 'ACTIVE',
    start_date = v_start,
    expiry_date = v_start + make_interval(days => v_plan.duration_days),
    payment_id = v_payment.id
  where id = v_payment.subscription_id;

  insert into public.notifications (user_id, title, message, type)
  values
    (
      v_payment.user_id,
      'Payment successful',
      'Your payment for the Music Test Series was verified.',
      'PAYMENT_SUCCESS'
    ),
    (
      v_payment.user_id,
      'Premium activated',
      'Premium access is active until ' || to_char(v_start + make_interval(days => v_plan.duration_days), 'DD Mon YYYY') || '.',
      'PREMIUM_ACTIVATED'
    );

  return jsonb_build_object('status', 'SUCCESS', 'already', false);
end;
$$;

revoke all on function public.activate_premium_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.activate_premium_payment(text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.questions enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.question_attempts enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.question_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.platform_settings enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy topics_read on public.topics
for select to authenticated
using (is_active = true or public.is_admin());

create policy topics_write on public.topics
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy subtopics_read on public.subtopics
for select to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.topics t where t.id = topic_id and t.is_active = true)
);

create policy subtopics_write on public.subtopics
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy questions_admin on public.questions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tests_read on public.tests
for select to authenticated
using (status = 'PUBLISHED' or public.is_admin());

create policy tests_write on public.tests
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy test_questions_read on public.test_questions
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.tests t
    where t.id = test_id and t.status = 'PUBLISHED'
  )
);

create policy test_questions_write on public.test_questions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy attempts_select on public.test_attempts
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy question_attempts_select on public.question_attempts
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.test_attempts ta
    where ta.id = attempt_id and ta.user_id = auth.uid()
  )
);

create policy plans_read on public.subscription_plans
for select to anon, authenticated
using (is_active = true or public.is_admin());

create policy plans_write on public.subscription_plans
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy subscriptions_select on public.subscriptions
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy payments_select on public.payments
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy tickets_select on public.support_tickets
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy tickets_insert on public.support_tickets
for insert to authenticated
with check (user_id = auth.uid() and assigned_to is null and status = 'OPEN');

create policy tickets_update on public.support_tickets
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy messages_select on public.support_messages
for select to authenticated
using (
  public.is_admin()
  or (
    is_internal = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  )
);

create policy messages_insert on public.support_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    (public.is_admin())
    or (
      is_internal = false
      and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id and t.user_id = auth.uid()
      )
    )
  )
);

create policy reports_select on public.question_reports
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy reports_insert on public.question_reports
for insert to authenticated
with check (user_id = auth.uid() and status = 'OPEN');

create policy reports_update on public.question_reports
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_update on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_insert on public.notifications
for insert to authenticated
with check (public.is_admin());

create policy settings_read on public.platform_settings
for select to authenticated
using (public.is_super_admin());

create policy settings_write on public.platform_settings
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Students cannot insert attempts, scores, payments, or subscriptions directly.
-- Those writes go through security definer functions or the service role.

revoke all on function public.create_practice_attempt(text, uuid[], integer) from public, anon, authenticated;
revoke all on function public.pick_practice_questions(uuid[], integer) from public, anon, authenticated;
revoke all on function public.setting_int(text, integer) from public, anon, authenticated;
revoke all on function public.weakness_band(integer) from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.has_active_premium(uuid) to authenticated;
grant execute on function public.free_mock_status(uuid) to authenticated;
grant execute on function public.start_test(uuid) to authenticated;
grant execute on function public.submit_attempt(uuid, boolean) to authenticated;
grant execute on function public.save_response(uuid, uuid, text, boolean, integer) to authenticated;
grant execute on function public.get_attempt_paper(uuid) to authenticated;
grant execute on function public.attempt_topic_analytics(uuid) to authenticated;
grant execute on function public.weak_topic_report(uuid) to authenticated;
grant execute on function public.start_topic_practice(uuid, integer) to authenticated;
grant execute on function public.start_weak_practice(integer) to authenticated;
grant execute on function public.student_dashboard() to authenticated;
grant execute on function public.import_questions(jsonb, boolean, boolean) to authenticated;
grant execute on function public.set_test_questions(uuid, uuid[]) to authenticated;
grant execute on function public.attach_support_file(uuid, text) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;
grant execute on function public.update_platform_setting(text, jsonb) to authenticated;
grant execute on function public.broadcast_announcement(text, text) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('support-attachments', 'support-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('question-media', 'question-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-images', 'profile-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy support_attachments_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy support_attachments_select on storage.objects
for select to authenticated
using (
  bucket_id = 'support-attachments'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy question_media_write on storage.objects
for all to authenticated
using (bucket_id = 'question-media' and public.is_admin())
with check (bucket_id = 'question-media' and public.is_admin());

create policy question_media_read on storage.objects
for select to authenticated
using (bucket_id = 'question-media');

create policy profile_images_write on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy profile_images_update on storage.objects
for update to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy profile_images_read on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.support_messages;
  end if;
exception
  when duplicate_object then null;
end $$;
