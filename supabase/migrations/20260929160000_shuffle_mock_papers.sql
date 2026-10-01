-- Each mock attempt keeps the same questions, but question numbers and
-- answer letters are shuffled so students cannot match by number or option.

alter table public.question_attempts
  add column if not exists option_order text;

alter table public.question_attempts drop constraint if exists question_attempts_option_order_check;
alter table public.question_attempts
  add constraint question_attempts_option_order_check
  check (
    option_order is null
    or (
      char_length(option_order) = 4
      and option_order ~ '^[ABCD]{4}$'
      and substr(option_order, 1, 1) <> substr(option_order, 2, 1)
      and substr(option_order, 1, 1) <> substr(option_order, 3, 1)
      and substr(option_order, 1, 1) <> substr(option_order, 4, 1)
      and substr(option_order, 2, 1) <> substr(option_order, 3, 1)
      and substr(option_order, 2, 1) <> substr(option_order, 4, 1)
      and substr(option_order, 3, 1) <> substr(option_order, 4, 1)
    )
  );

create or replace function public.original_letter(p_order text, p_displayed text)
returns text
language sql
immutable
as $$
  select case p_displayed
    when 'A' then substr(coalesce(nullif(p_order, ''), 'ABCD'), 1, 1)
    when 'B' then substr(coalesce(nullif(p_order, ''), 'ABCD'), 2, 1)
    when 'C' then substr(coalesce(nullif(p_order, ''), 'ABCD'), 3, 1)
    when 'D' then substr(coalesce(nullif(p_order, ''), 'ABCD'), 4, 1)
    else null
  end;
$$;

create or replace function public.displayed_letter(p_order text, p_original text)
returns text
language sql
immutable
as $$
  select case strpos(coalesce(nullif(p_order, ''), 'ABCD'), coalesce(p_original, ''))
    when 1 then 'A'
    when 2 then 'B'
    when 3 then 'C'
    when 4 then 'D'
    else p_original
  end;
$$;

create or replace function public.option_by_letter(p_a text, p_b text, p_c text, p_d text, p_letter text)
returns text
language sql
immutable
as $$
  select case p_letter
    when 'A' then p_a
    when 'B' then p_b
    when 'C' then p_c
    else p_d
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
    attempt_id, question_id, question_order, topic_id, visited, is_marked, option_order
  )
  select
    v_attempt,
    picked.question_id,
    row_number() over (order by random()),
    picked.topic_id,
    false,
    false,
    (
      select string_agg(letter, '' order by md5(letter || picked.question_id::text || random()::text))
      from unnest(array['A', 'B', 'C', 'D']) as letter
    )
  from _picked_test picked;

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
      when public.original_letter(qa.option_order, qa.selected_answer) = q.correct_option then true
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
      'option_a', public.option_by_letter(q.option_a, q.option_b, q.option_c, q.option_d, public.original_letter(qa.option_order, 'A')),
      'option_b', public.option_by_letter(q.option_a, q.option_b, q.option_c, q.option_d, public.original_letter(qa.option_order, 'B')),
      'option_c', public.option_by_letter(q.option_a, q.option_b, q.option_c, q.option_d, public.original_letter(qa.option_order, 'C')),
      'option_d', public.option_by_letter(q.option_a, q.option_b, q.option_c, q.option_d, public.original_letter(qa.option_order, 'D')),
      'selected_answer', qa.selected_answer,
      'is_marked', qa.is_marked,
      'visited', qa.visited,
      'topic_id', qa.topic_id,
      'topic_name', tp.name,
      'image_path', q.image_path,
      'correct_option', case when v_done then public.displayed_letter(qa.option_order, q.correct_option) else null end,
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
