-- STET practice syllabus. Topics are study categories, not official weightage.
-- Existing sample topics are left in place.

alter table public.topics
  add column if not exists slug text,
  add column if not exists paper text not null default 'BOTH',
  add column if not exists display_order integer not null default 0;

alter table public.topics drop constraint if exists topics_paper_check;
alter table public.topics
  add constraint topics_paper_check check (paper in ('PAPER_I', 'PAPER_II', 'BOTH'));

create unique index if not exists topics_exam_slug_idx
  on public.topics (exam, slug)
  where slug is not null;

alter table public.subtopics
  add column if not exists slug text,
  add column if not exists display_order integer not null default 0;

create unique index if not exists subtopics_topic_slug_idx
  on public.subtopics (topic_id, slug)
  where slug is not null;

alter table public.questions
  add column if not exists paper text not null default 'BOTH',
  add column if not exists question_type text not null default 'PRACTICE';

alter table public.questions drop constraint if exists questions_paper_check;
alter table public.questions
  add constraint questions_paper_check check (paper in ('PAPER_I', 'PAPER_II', 'BOTH'));

alter table public.questions drop constraint if exists questions_type_check;
alter table public.questions
  add constraint questions_type_check check (question_type in ('PREVIOUS_YEAR', 'PYQ_BASED', 'PRACTICE'));

create index if not exists questions_practice_idx
  on public.questions (exam, paper, question_type, status, topic_id, subtopic_id);

create index if not exists questions_pyq_year_idx
  on public.questions (year)
  where question_type = 'PREVIOUS_YEAR' and year is not null;

create table if not exists public.saved_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_questions_user_question unique (user_id, question_id)
);

create index if not exists saved_questions_user_idx on public.saved_questions (user_id, created_at desc);

alter table public.saved_questions enable row level security;

drop policy if exists saved_questions_own on public.saved_questions;
create policy saved_questions_own on public.saved_questions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into public.topics (id, name, description, exam, paper, slug, display_order, is_active) values
  ('a2000000-0000-4000-8000-000000000001', 'नाद, श्रुति, स्वर एवं सप्तक', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'naad-shruti-swar-saptak', 1, true),
  ('a2000000-0000-4000-8000-000000000002', 'श्रुति-स्वर व्यवस्था एवं थाट', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'shruti-swar-vyavastha-thaat', 2, true),
  ('a2000000-0000-4000-8000-000000000003', 'राग वर्गीकरण', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'raag-vargikaran', 3, true),
  ('a2000000-0000-4000-8000-000000000004', 'गान एवं प्रबंध', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'gaan-evam-prabandh', 4, true),
  ('a2000000-0000-4000-8000-000000000005', 'घराना एवं विभिन्न गायन शैलियाँ', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'gharana-gayan-shailiyan', 5, true),
  ('a2000000-0000-4000-8000-000000000006', 'वैदिक संगीत', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'vaidik-sangeet', 6, true),
  ('a2000000-0000-4000-8000-000000000007', 'उत्तर भारतीय एवं कर्नाटक संगीत', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'uttar-bharatiya-karnatak-sangeet', 7, true),
  ('a2000000-0000-4000-8000-000000000008', 'सांगीतिक शब्दावली', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'sangitik-shabdavali', 8, true),
  ('a2000000-0000-4000-8000-000000000009', 'वाद्य वर्गीकरण एवं वृन्द वादन', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'vadya-vargikaran-vrind-vadan', 9, true),
  ('a2000000-0000-4000-8000-000000000010', 'पाश्चात्य संगीत', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'pashchatya-sangeet', 10, true),
  ('a2000000-0000-4000-8000-000000000011', 'प्रमुख संगीतज्ञ', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'pramukh-sangeetagya', 11, true),
  ('a2000000-0000-4000-8000-000000000012', 'सांगीतिक ग्रंथ', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'sangitik-granth', 12, true),
  ('a2000000-0000-4000-8000-000000000013', 'निर्धारित राग', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'nirdharit-raag', 13, true),
  ('a2000000-0000-4000-8000-000000000014', 'ताल एवं लय', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'taal-evam-lay', 14, true),
  ('a2000000-0000-4000-8000-000000000015', 'स्वरलिपि, राग तुलना एवं लोकसंगीत', 'STET Music अध्ययन श्रेणी। यह आधिकारिक भारांक नहीं है।', 'STET', 'PAPER_I', 'swaralipi-raag-tulana-loksangeet', 15, true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, display_order = excluded.display_order, paper = excluded.paper, exam = excluded.exam;

insert into public.subtopics (id, topic_id, name, slug, display_order, is_active) values
  ('a2000000-0000-4000-8000-000000001001', 'a2000000-0000-4000-8000-000000000001', 'नाद', 'naad-shruti-swar-saptak-01', 1, true),
  ('a2000000-0000-4000-8000-000000001002', 'a2000000-0000-4000-8000-000000000001', 'नाद के प्रकार', 'naad-shruti-swar-saptak-02', 2, true),
  ('a2000000-0000-4000-8000-000000001003', 'a2000000-0000-4000-8000-000000000001', 'नाद की विशेषताएँ', 'naad-shruti-swar-saptak-03', 3, true),
  ('a2000000-0000-4000-8000-000000001004', 'a2000000-0000-4000-8000-000000000001', 'श्रुति', 'naad-shruti-swar-saptak-04', 4, true),
  ('a2000000-0000-4000-8000-000000001005', 'a2000000-0000-4000-8000-000000000001', 'श्रुति की विशेषताएँ', 'naad-shruti-swar-saptak-05', 5, true),
  ('a2000000-0000-4000-8000-000000001006', 'a2000000-0000-4000-8000-000000000001', 'स्वर', 'naad-shruti-swar-saptak-06', 6, true),
  ('a2000000-0000-4000-8000-000000001007', 'a2000000-0000-4000-8000-000000000001', 'स्वर के प्रकार', 'naad-shruti-swar-saptak-07', 7, true),
  ('a2000000-0000-4000-8000-000000001008', 'a2000000-0000-4000-8000-000000000001', 'शुद्ध स्वर', 'naad-shruti-swar-saptak-08', 8, true),
  ('a2000000-0000-4000-8000-000000001009', 'a2000000-0000-4000-8000-000000000001', 'विकृत स्वर', 'naad-shruti-swar-saptak-09', 9, true),
  ('a2000000-0000-4000-8000-000000001010', 'a2000000-0000-4000-8000-000000000001', 'कोमल स्वर', 'naad-shruti-swar-saptak-10', 10, true),
  ('a2000000-0000-4000-8000-000000001011', 'a2000000-0000-4000-8000-000000000001', 'तीव्र स्वर', 'naad-shruti-swar-saptak-11', 11, true),
  ('a2000000-0000-4000-8000-000000001012', 'a2000000-0000-4000-8000-000000000001', 'स्वर-सप्तक', 'naad-shruti-swar-saptak-12', 12, true),
  ('a2000000-0000-4000-8000-000000001013', 'a2000000-0000-4000-8000-000000000001', 'मंद्र सप्तक', 'naad-shruti-swar-saptak-13', 13, true),
  ('a2000000-0000-4000-8000-000000001014', 'a2000000-0000-4000-8000-000000000001', 'मध्य सप्तक', 'naad-shruti-swar-saptak-14', 14, true),
  ('a2000000-0000-4000-8000-000000001015', 'a2000000-0000-4000-8000-000000000001', 'तार सप्तक', 'naad-shruti-swar-saptak-15', 15, true),
  ('a2000000-0000-4000-8000-000000001016', 'a2000000-0000-4000-8000-000000000001', 'ग्राम', 'naad-shruti-swar-saptak-16', 16, true),
  ('a2000000-0000-4000-8000-000000001017', 'a2000000-0000-4000-8000-000000000001', 'मूर्च्छना', 'naad-shruti-swar-saptak-17', 17, true),
  ('a2000000-0000-4000-8000-000000001018', 'a2000000-0000-4000-8000-000000000001', 'सारणा चतुष्टयी', 'naad-shruti-swar-saptak-18', 18, true),
  ('a2000000-0000-4000-8000-000000001019', 'a2000000-0000-4000-8000-000000000002', 'श्रुति-स्वर व्यवस्था', 'shruti-swar-vyavastha-thaat-01', 1, true),
  ('a2000000-0000-4000-8000-000000001020', 'a2000000-0000-4000-8000-000000000002', 'स्वर-संवाद', 'shruti-swar-vyavastha-thaat-02', 2, true),
  ('a2000000-0000-4000-8000-000000001021', 'a2000000-0000-4000-8000-000000000002', 'स्वरान्तर', 'shruti-swar-vyavastha-thaat-03', 3, true),
  ('a2000000-0000-4000-8000-000000001022', 'a2000000-0000-4000-8000-000000000002', 'गुणान्तर', 'shruti-swar-vyavastha-thaat-04', 4, true),
  ('a2000000-0000-4000-8000-000000001023', 'a2000000-0000-4000-8000-000000000002', 'थाट', 'shruti-swar-vyavastha-thaat-05', 5, true),
  ('a2000000-0000-4000-8000-000000001024', 'a2000000-0000-4000-8000-000000000002', 'थाट की विशेषताएँ', 'shruti-swar-vyavastha-thaat-06', 6, true),
  ('a2000000-0000-4000-8000-000000001025', 'a2000000-0000-4000-8000-000000000002', 'राग-रागिनी वर्गीकरण', 'shruti-swar-vyavastha-thaat-07', 7, true),
  ('a2000000-0000-4000-8000-000000001026', 'a2000000-0000-4000-8000-000000000003', 'ग्राम राग वर्गीकरण', 'raag-vargikaran-01', 1, true),
  ('a2000000-0000-4000-8000-000000001027', 'a2000000-0000-4000-8000-000000000003', 'राग-रागिनी वर्गीकरण', 'raag-vargikaran-02', 2, true),
  ('a2000000-0000-4000-8000-000000001028', 'a2000000-0000-4000-8000-000000000003', 'मेल राग वर्गीकरण', 'raag-vargikaran-03', 3, true),
  ('a2000000-0000-4000-8000-000000001029', 'a2000000-0000-4000-8000-000000000003', 'रागांग वर्गीकरण', 'raag-vargikaran-04', 4, true),
  ('a2000000-0000-4000-8000-000000001030', 'a2000000-0000-4000-8000-000000000004', 'निबद्ध गान', 'gaan-evam-prabandh-01', 1, true),
  ('a2000000-0000-4000-8000-000000001031', 'a2000000-0000-4000-8000-000000000004', 'अनिबद्ध गान', 'gaan-evam-prabandh-02', 2, true),
  ('a2000000-0000-4000-8000-000000001032', 'a2000000-0000-4000-8000-000000000004', 'प्रबंध गान', 'gaan-evam-prabandh-03', 3, true),
  ('a2000000-0000-4000-8000-000000001033', 'a2000000-0000-4000-8000-000000000004', 'रागालाप', 'gaan-evam-prabandh-04', 4, true),
  ('a2000000-0000-4000-8000-000000001034', 'a2000000-0000-4000-8000-000000000004', 'रूपकालाप', 'gaan-evam-prabandh-05', 5, true),
  ('a2000000-0000-4000-8000-000000001035', 'a2000000-0000-4000-8000-000000000004', 'कलावन्त', 'gaan-evam-prabandh-06', 6, true),
  ('a2000000-0000-4000-8000-000000001036', 'a2000000-0000-4000-8000-000000000004', 'वाग्गेयकार', 'gaan-evam-prabandh-07', 7, true),
  ('a2000000-0000-4000-8000-000000001037', 'a2000000-0000-4000-8000-000000000004', 'गायक के गुण', 'gaan-evam-prabandh-08', 8, true),
  ('a2000000-0000-4000-8000-000000001038', 'a2000000-0000-4000-8000-000000000004', 'गायक के दोष', 'gaan-evam-prabandh-09', 9, true),
  ('a2000000-0000-4000-8000-000000001039', 'a2000000-0000-4000-8000-000000000004', 'नायक', 'gaan-evam-prabandh-10', 10, true),
  ('a2000000-0000-4000-8000-000000001040', 'a2000000-0000-4000-8000-000000000004', 'नायिका', 'gaan-evam-prabandh-11', 11, true),
  ('a2000000-0000-4000-8000-000000001041', 'a2000000-0000-4000-8000-000000000005', 'घराना', 'gharana-gayan-shailiyan-01', 1, true),
  ('a2000000-0000-4000-8000-000000001042', 'a2000000-0000-4000-8000-000000000005', 'घराने की विशेषताएँ', 'gharana-gayan-shailiyan-02', 2, true),
  ('a2000000-0000-4000-8000-000000001043', 'a2000000-0000-4000-8000-000000000005', 'ख्याल', 'gharana-gayan-shailiyan-03', 3, true),
  ('a2000000-0000-4000-8000-000000001044', 'a2000000-0000-4000-8000-000000000005', 'ध्रुवपद', 'gharana-gayan-shailiyan-04', 4, true),
  ('a2000000-0000-4000-8000-000000001045', 'a2000000-0000-4000-8000-000000000005', 'ध्रुपद', 'gharana-gayan-shailiyan-05', 5, true),
  ('a2000000-0000-4000-8000-000000001046', 'a2000000-0000-4000-8000-000000000005', 'धमार', 'gharana-gayan-shailiyan-06', 6, true),
  ('a2000000-0000-4000-8000-000000001047', 'a2000000-0000-4000-8000-000000000005', 'ठुमरी', 'gharana-gayan-shailiyan-07', 7, true),
  ('a2000000-0000-4000-8000-000000001048', 'a2000000-0000-4000-8000-000000000005', 'टप्पा', 'gharana-gayan-shailiyan-08', 8, true),
  ('a2000000-0000-4000-8000-000000001049', 'a2000000-0000-4000-8000-000000000005', 'तराना', 'gharana-gayan-shailiyan-09', 9, true),
  ('a2000000-0000-4000-8000-000000001050', 'a2000000-0000-4000-8000-000000000005', 'अन्य प्रमुख गायन शैलियाँ', 'gharana-gayan-shailiyan-10', 10, true),
  ('a2000000-0000-4000-8000-000000001051', 'a2000000-0000-4000-8000-000000000006', 'वैदिक कालीन संगीत', 'vaidik-sangeet-01', 1, true),
  ('a2000000-0000-4000-8000-000000001052', 'a2000000-0000-4000-8000-000000000006', 'वैदिक कालीन स्वर', 'vaidik-sangeet-02', 2, true),
  ('a2000000-0000-4000-8000-000000001053', 'a2000000-0000-4000-8000-000000000006', 'सामगान', 'vaidik-sangeet-03', 3, true),
  ('a2000000-0000-4000-8000-000000001054', 'a2000000-0000-4000-8000-000000000006', 'सामगान की विशेषताएँ', 'vaidik-sangeet-04', 4, true),
  ('a2000000-0000-4000-8000-000000001055', 'a2000000-0000-4000-8000-000000000007', 'उत्तर भारतीय संगीत के स्वर', 'uttar-bharatiya-karnatak-sangeet-01', 1, true),
  ('a2000000-0000-4000-8000-000000001056', 'a2000000-0000-4000-8000-000000000007', 'कर्नाटक संगीत के स्वर', 'uttar-bharatiya-karnatak-sangeet-02', 2, true),
  ('a2000000-0000-4000-8000-000000001057', 'a2000000-0000-4000-8000-000000000007', 'उत्तर भारतीय स्वर व्यवस्था', 'uttar-bharatiya-karnatak-sangeet-03', 3, true),
  ('a2000000-0000-4000-8000-000000001058', 'a2000000-0000-4000-8000-000000000007', 'कर्नाटक स्वर व्यवस्था', 'uttar-bharatiya-karnatak-sangeet-04', 4, true),
  ('a2000000-0000-4000-8000-000000001059', 'a2000000-0000-4000-8000-000000000007', 'उत्तर भारतीय ताल', 'uttar-bharatiya-karnatak-sangeet-05', 5, true),
  ('a2000000-0000-4000-8000-000000001060', 'a2000000-0000-4000-8000-000000000007', 'कर्नाटक ताल', 'uttar-bharatiya-karnatak-sangeet-06', 6, true),
  ('a2000000-0000-4000-8000-000000001061', 'a2000000-0000-4000-8000-000000000007', 'उत्तर भारतीय एवं कर्नाटक संगीत का तुलनात्मक अध्ययन', 'uttar-bharatiya-karnatak-sangeet-07', 7, true),
  ('a2000000-0000-4000-8000-000000001062', 'a2000000-0000-4000-8000-000000000008', 'वादी', 'sangitik-shabdavali-01', 1, true),
  ('a2000000-0000-4000-8000-000000001063', 'a2000000-0000-4000-8000-000000000008', 'संवादी', 'sangitik-shabdavali-02', 2, true),
  ('a2000000-0000-4000-8000-000000001064', 'a2000000-0000-4000-8000-000000000008', 'जनक राग', 'sangitik-shabdavali-03', 3, true),
  ('a2000000-0000-4000-8000-000000001065', 'a2000000-0000-4000-8000-000000000008', 'आश्रय राग', 'sangitik-shabdavali-04', 4, true),
  ('a2000000-0000-4000-8000-000000001066', 'a2000000-0000-4000-8000-000000000008', 'परमेल प्रवेशक राग', 'sangitik-shabdavali-05', 5, true),
  ('a2000000-0000-4000-8000-000000001067', 'a2000000-0000-4000-8000-000000000008', 'संधि प्रकाश राग', 'sangitik-shabdavali-06', 6, true),
  ('a2000000-0000-4000-8000-000000001068', 'a2000000-0000-4000-8000-000000000008', 'मींड', 'sangitik-shabdavali-07', 7, true),
  ('a2000000-0000-4000-8000-000000001069', 'a2000000-0000-4000-8000-000000000008', 'कण स्वर', 'sangitik-shabdavali-08', 8, true),
  ('a2000000-0000-4000-8000-000000001070', 'a2000000-0000-4000-8000-000000000008', 'गमक', 'sangitik-shabdavali-09', 9, true),
  ('a2000000-0000-4000-8000-000000001071', 'a2000000-0000-4000-8000-000000000009', 'वाद्य वर्गीकरण', 'vadya-vargikaran-vrind-vadan-01', 1, true),
  ('a2000000-0000-4000-8000-000000001072', 'a2000000-0000-4000-8000-000000000009', 'तत् वाद्य', 'vadya-vargikaran-vrind-vadan-02', 2, true),
  ('a2000000-0000-4000-8000-000000001073', 'a2000000-0000-4000-8000-000000000009', 'सुषिर वाद्य', 'vadya-vargikaran-vrind-vadan-03', 3, true),
  ('a2000000-0000-4000-8000-000000001074', 'a2000000-0000-4000-8000-000000000009', 'अवनद्ध वाद्य', 'vadya-vargikaran-vrind-vadan-04', 4, true),
  ('a2000000-0000-4000-8000-000000001075', 'a2000000-0000-4000-8000-000000000009', 'घन वाद्य', 'vadya-vargikaran-vrind-vadan-05', 5, true),
  ('a2000000-0000-4000-8000-000000001076', 'a2000000-0000-4000-8000-000000000009', 'वाद्यों की विशेषताएँ', 'vadya-vargikaran-vrind-vadan-06', 6, true),
  ('a2000000-0000-4000-8000-000000001077', 'a2000000-0000-4000-8000-000000000009', 'प्रमुख भारतीय वाद्य', 'vadya-vargikaran-vrind-vadan-07', 7, true),
  ('a2000000-0000-4000-8000-000000001078', 'a2000000-0000-4000-8000-000000000009', 'वृन्द वादन', 'vadya-vargikaran-vrind-vadan-08', 8, true),
  ('a2000000-0000-4000-8000-000000001079', 'a2000000-0000-4000-8000-000000000009', 'प्रिय वाद्य का परिचय', 'vadya-vargikaran-vrind-vadan-09', 9, true),
  ('a2000000-0000-4000-8000-000000001080', 'a2000000-0000-4000-8000-000000000009', 'वाद्य का सचित्र परिचय', 'vadya-vargikaran-vrind-vadan-10', 10, true),
  ('a2000000-0000-4000-8000-000000001081', 'a2000000-0000-4000-8000-000000000010', 'पाश्चात्य स्वर', 'pashchatya-sangeet-01', 1, true),
  ('a2000000-0000-4000-8000-000000001082', 'a2000000-0000-4000-8000-000000000010', 'पाश्चात्य स्वर व्यवस्था', 'pashchatya-sangeet-02', 2, true),
  ('a2000000-0000-4000-8000-000000001083', 'a2000000-0000-4000-8000-000000000010', 'पाश्चात्य स्वरलिपि पद्धति', 'pashchatya-sangeet-03', 3, true),
  ('a2000000-0000-4000-8000-000000001084', 'a2000000-0000-4000-8000-000000000010', 'Staff Notation', 'pashchatya-sangeet-04', 4, true),
  ('a2000000-0000-4000-8000-000000001085', 'a2000000-0000-4000-8000-000000000010', 'Harmony', 'pashchatya-sangeet-05', 5, true),
  ('a2000000-0000-4000-8000-000000001086', 'a2000000-0000-4000-8000-000000000010', 'Melody', 'pashchatya-sangeet-06', 6, true),
  ('a2000000-0000-4000-8000-000000001087', 'a2000000-0000-4000-8000-000000000010', 'भारतीय एवं पाश्चात्य स्वर व्यवस्था की तुलना', 'pashchatya-sangeet-07', 7, true),
  ('a2000000-0000-4000-8000-000000001088', 'a2000000-0000-4000-8000-000000000011', 'पं. विष्णु नारायण भातखण्डे', 'pramukh-sangeetagya-01', 1, true),
  ('a2000000-0000-4000-8000-000000001089', 'a2000000-0000-4000-8000-000000000011', 'पं. विष्णु दिगम्बर पलुस्कर', 'pramukh-sangeetagya-02', 2, true),
  ('a2000000-0000-4000-8000-000000001090', 'a2000000-0000-4000-8000-000000000011', 'पं. ओंकार नाथ ठाकुर', 'pramukh-sangeetagya-03', 3, true),
  ('a2000000-0000-4000-8000-000000001091', 'a2000000-0000-4000-8000-000000000011', 'उस्ताद अलाउद्दीन खाँ', 'pramukh-sangeetagya-04', 4, true),
  ('a2000000-0000-4000-8000-000000001092', 'a2000000-0000-4000-8000-000000000011', 'पं. राम चतुर मल्लिक', 'pramukh-sangeetagya-05', 5, true),
  ('a2000000-0000-4000-8000-000000001093', 'a2000000-0000-4000-8000-000000000012', 'नाट्यशास्त्र', 'sangitik-granth-01', 1, true),
  ('a2000000-0000-4000-8000-000000001094', 'a2000000-0000-4000-8000-000000000012', 'संगीत रत्नाकर', 'sangitik-granth-02', 2, true),
  ('a2000000-0000-4000-8000-000000001095', 'a2000000-0000-4000-8000-000000000012', 'बृहद्देशी', 'sangitik-granth-03', 3, true),
  ('a2000000-0000-4000-8000-000000001096', 'a2000000-0000-4000-8000-000000000012', 'राग तरंगिणी', 'sangitik-granth-04', 4, true),
  ('a2000000-0000-4000-8000-000000001097', 'a2000000-0000-4000-8000-000000000013', 'दरबारी कान्हड़ा', 'nirdharit-raag-01', 1, true),
  ('a2000000-0000-4000-8000-000000001098', 'a2000000-0000-4000-8000-000000000013', 'मालकौंस', 'nirdharit-raag-02', 2, true),
  ('a2000000-0000-4000-8000-000000001099', 'a2000000-0000-4000-8000-000000000013', 'जौनपुरी', 'nirdharit-raag-03', 3, true),
  ('a2000000-0000-4000-8000-000000001100', 'a2000000-0000-4000-8000-000000000013', 'बहार', 'nirdharit-raag-04', 4, true),
  ('a2000000-0000-4000-8000-000000001101', 'a2000000-0000-4000-8000-000000000013', 'शुद्ध कल्याण', 'nirdharit-raag-05', 5, true),
  ('a2000000-0000-4000-8000-000000001102', 'a2000000-0000-4000-8000-000000000013', 'गौड़ सारंग', 'nirdharit-raag-06', 6, true),
  ('a2000000-0000-4000-8000-000000001103', 'a2000000-0000-4000-8000-000000000013', 'देसी', 'nirdharit-raag-07', 7, true),
  ('a2000000-0000-4000-8000-000000001104', 'a2000000-0000-4000-8000-000000000013', 'हमीर', 'nirdharit-raag-08', 8, true),
  ('a2000000-0000-4000-8000-000000001105', 'a2000000-0000-4000-8000-000000000013', 'पूरिया धनाश्री', 'nirdharit-raag-09', 9, true),
  ('a2000000-0000-4000-8000-000000001106', 'a2000000-0000-4000-8000-000000000013', 'मियाँ मल्हार', 'nirdharit-raag-10', 10, true),
  ('a2000000-0000-4000-8000-000000001107', 'a2000000-0000-4000-8000-000000000013', 'शंकरा', 'nirdharit-raag-11', 11, true),
  ('a2000000-0000-4000-8000-000000001108', 'a2000000-0000-4000-8000-000000000013', 'कामोद', 'nirdharit-raag-12', 12, true),
  ('a2000000-0000-4000-8000-000000001109', 'a2000000-0000-4000-8000-000000000013', 'छायानट', 'nirdharit-raag-13', 13, true),
  ('a2000000-0000-4000-8000-000000001110', 'a2000000-0000-4000-8000-000000000013', 'श्री', 'nirdharit-raag-14', 14, true),
  ('a2000000-0000-4000-8000-000000001111', 'a2000000-0000-4000-8000-000000000014', 'एकताल', 'taal-evam-lay-01', 1, true),
  ('a2000000-0000-4000-8000-000000001112', 'a2000000-0000-4000-8000-000000000014', 'तीनताल', 'taal-evam-lay-02', 2, true),
  ('a2000000-0000-4000-8000-000000001113', 'a2000000-0000-4000-8000-000000000014', 'झपताल', 'taal-evam-lay-03', 3, true),
  ('a2000000-0000-4000-8000-000000001114', 'a2000000-0000-4000-8000-000000000014', 'चारताल', 'taal-evam-lay-04', 4, true),
  ('a2000000-0000-4000-8000-000000001115', 'a2000000-0000-4000-8000-000000000014', 'रूपक', 'taal-evam-lay-05', 5, true),
  ('a2000000-0000-4000-8000-000000001116', 'a2000000-0000-4000-8000-000000000014', 'कहरवा', 'taal-evam-lay-06', 6, true),
  ('a2000000-0000-4000-8000-000000001117', 'a2000000-0000-4000-8000-000000000014', 'ताल की मात्रा', 'taal-evam-lay-07', 7, true),
  ('a2000000-0000-4000-8000-000000001118', 'a2000000-0000-4000-8000-000000000014', 'विभाग', 'taal-evam-lay-08', 8, true),
  ('a2000000-0000-4000-8000-000000001119', 'a2000000-0000-4000-8000-000000000014', 'ताली', 'taal-evam-lay-09', 9, true),
  ('a2000000-0000-4000-8000-000000001120', 'a2000000-0000-4000-8000-000000000014', 'खाली', 'taal-evam-lay-10', 10, true),
  ('a2000000-0000-4000-8000-000000001121', 'a2000000-0000-4000-8000-000000000014', 'सम', 'taal-evam-lay-11', 11, true),
  ('a2000000-0000-4000-8000-000000001122', 'a2000000-0000-4000-8000-000000000014', 'ठेका', 'taal-evam-lay-12', 12, true),
  ('a2000000-0000-4000-8000-000000001123', 'a2000000-0000-4000-8000-000000000014', 'बोल', 'taal-evam-lay-13', 13, true),
  ('a2000000-0000-4000-8000-000000001124', 'a2000000-0000-4000-8000-000000000014', 'आवर्तन', 'taal-evam-lay-14', 14, true),
  ('a2000000-0000-4000-8000-000000001125', 'a2000000-0000-4000-8000-000000000014', 'विलंबित लय', 'taal-evam-lay-15', 15, true),
  ('a2000000-0000-4000-8000-000000001126', 'a2000000-0000-4000-8000-000000000014', 'मध्य लय', 'taal-evam-lay-16', 16, true),
  ('a2000000-0000-4000-8000-000000001127', 'a2000000-0000-4000-8000-000000000014', 'द्रुत लय', 'taal-evam-lay-17', 17, true),
  ('a2000000-0000-4000-8000-000000001128', 'a2000000-0000-4000-8000-000000000014', 'लयकारी', 'taal-evam-lay-18', 18, true),
  ('a2000000-0000-4000-8000-000000001129', 'a2000000-0000-4000-8000-000000000014', 'दुगुन', 'taal-evam-lay-19', 19, true),
  ('a2000000-0000-4000-8000-000000001130', 'a2000000-0000-4000-8000-000000000014', 'तिगुन', 'taal-evam-lay-20', 20, true),
  ('a2000000-0000-4000-8000-000000001131', 'a2000000-0000-4000-8000-000000000014', 'चौगुन', 'taal-evam-lay-21', 21, true),
  ('a2000000-0000-4000-8000-000000001132', 'a2000000-0000-4000-8000-000000000015', 'विलंबित ख्याल की स्वरलिपि', 'swaralipi-raag-tulana-loksangeet-01', 1, true),
  ('a2000000-0000-4000-8000-000000001133', 'a2000000-0000-4000-8000-000000000015', 'छोटा ख्याल की स्वरलिपि', 'swaralipi-raag-tulana-loksangeet-02', 2, true),
  ('a2000000-0000-4000-8000-000000001134', 'a2000000-0000-4000-8000-000000000015', 'ख्याल की स्वरलिपि पढ़ना', 'swaralipi-raag-tulana-loksangeet-03', 3, true),
  ('a2000000-0000-4000-8000-000000001135', 'a2000000-0000-4000-8000-000000000015', 'ख्याल की स्वरलिपि लिखना', 'swaralipi-raag-tulana-loksangeet-04', 4, true),
  ('a2000000-0000-4000-8000-000000001136', 'a2000000-0000-4000-8000-000000000015', 'पाश्चात्य स्वरलिपि लेखन', 'swaralipi-raag-tulana-loksangeet-05', 5, true),
  ('a2000000-0000-4000-8000-000000001137', 'a2000000-0000-4000-8000-000000000015', 'समप्रकृति राग', 'swaralipi-raag-tulana-loksangeet-06', 6, true),
  ('a2000000-0000-4000-8000-000000001138', 'a2000000-0000-4000-8000-000000000015', 'समप्रकृति रागों की तुलना', 'swaralipi-raag-tulana-loksangeet-07', 7, true),
  ('a2000000-0000-4000-8000-000000001139', 'a2000000-0000-4000-8000-000000000015', 'क्षेत्रीय लोकसंगीत', 'swaralipi-raag-tulana-loksangeet-08', 8, true),
  ('a2000000-0000-4000-8000-000000001140', 'a2000000-0000-4000-8000-000000000015', 'लोकगीत', 'swaralipi-raag-tulana-loksangeet-09', 9, true),
  ('a2000000-0000-4000-8000-000000001141', 'a2000000-0000-4000-8000-000000000015', 'लोकगायन', 'swaralipi-raag-tulana-loksangeet-10', 10, true),
  ('a2000000-0000-4000-8000-000000001142', 'a2000000-0000-4000-8000-000000000015', 'लोकवाद्य', 'swaralipi-raag-tulana-loksangeet-11', 11, true),
  ('a2000000-0000-4000-8000-000000001143', 'a2000000-0000-4000-8000-000000000015', 'क्षेत्रीय लोकसंगीत का वर्गीकरण', 'swaralipi-raag-tulana-loksangeet-12', 12, true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, display_order = excluded.display_order;

update public.subtopics
set description = 'पाठ में मींड दिया गया है। कुछ स्रोतों में मोंड़ लिखा मिलता है। नया शब्द न जोड़ें; जरूरत हो तो यही नाम सुधारें।'
where slug = 'sangitik-shabdavali-07';

-- Answer-letter helpers are safe to create again if the shuffle migration already ran.
alter table public.question_attempts
  add column if not exists option_order text;

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

-- Practice selection stays inside the database. Students never read the questions table.

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
    attempt_id, question_id, question_order, topic_id, visited, is_marked, option_order
  )
  select
    v_attempt,
    q.id,
    row_number() over (order by random()),
    q.topic_id,
    false,
    false,
    (
      select string_agg(letter, '' order by md5(letter || q.id::text || random()::text))
      from unnest(array['A','B','C','D']) as letter
    )
  from unnest(p_question_ids) as picked(id)
  join public.questions q on q.id = picked.id
  where q.status = 'PUBLISHED';

  return v_attempt;
end;
$$;

create or replace function public.practice_pick(
  p_exam text,
  p_paper text,
  p_topic uuid,
  p_subtopic uuid,
  p_type text,
  p_difficulty text,
  p_year integer,
  p_mode text,
  p_limit integer
)
returns uuid[]
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 100);
  v_ids uuid[] := '{}';
  v_need integer;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;

  drop table if exists _practice_pool;
  create temporary table _practice_pool (
    id uuid primary key,
    band_rank integer not null,
    prefer integer not null,
    recent_correct boolean not null
  ) on commit drop;

  insert into _practice_pool (id, band_rank, prefer, recent_correct)
  select
    q.id,
    case
      when p_mode = 'WEAK' then case coalesce(w.band, 'STRONG')
        when 'CRITICAL' then 1
        when 'WEAK' then 2
        when 'NEEDS_PRACTICE' then 3
        else 9
      end
      else 0
    end,
    case
      when exists (
        select 1
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        where qa.question_id = q.id
          and ta.user_id = v_user
          and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
          and qa.selected_answer is not null
          and qa.is_correct is false
      ) then 0
      when not exists (
        select 1
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        where qa.question_id = q.id
          and ta.user_id = v_user
          and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
          and qa.selected_answer is not null
      ) then 1
      else 2
    end,
    exists (
      select 1
      from public.question_attempts qa
      join public.test_attempts ta on ta.id = qa.attempt_id
      where qa.question_id = q.id
        and ta.user_id = v_user
        and qa.is_correct is true
        and ta.created_at > now() - interval '30 days'
    )
  from public.questions q
  left join (
    select
      wq.subtopic_id,
      public.weakness_band(
        count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer
      ) as band
    from public.question_attempts qa
    join public.test_attempts ta on ta.id = qa.attempt_id
    join public.questions wq on wq.id = qa.question_id
    where ta.user_id = v_user
      and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
      and wq.subtopic_id is not null
    group by wq.subtopic_id
  ) w on w.subtopic_id = q.subtopic_id
  where q.status = 'PUBLISHED'
    and (q.exam = p_exam or q.exam = 'BOTH' or p_exam = 'BOTH')
    and (q.paper = p_paper or q.paper = 'BOTH' or p_paper = 'BOTH')
    and (p_topic is null or q.topic_id = p_topic)
    and (p_subtopic is null or q.subtopic_id = p_subtopic)
    and (p_type is null or p_type = 'ALL' or q.question_type = p_type)
    and (p_difficulty is null or p_difficulty = 'ALL' or q.difficulty = p_difficulty)
    and (p_year is null or q.year = p_year)
    and (p_mode <> 'PYQ' or (q.question_type = 'PREVIOUS_YEAR' and q.year is not null))
    and (p_mode <> 'PYQ_BASED' or q.question_type = 'PYQ_BASED')
    and (
      p_mode <> 'INCORRECT'
      or exists (
        select 1
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        where qa.question_id = q.id
          and ta.user_id = v_user
          and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
          and qa.selected_answer is not null
          and qa.is_correct is false
      )
    )
    and (
      p_mode <> 'SAVED'
      or exists (
        select 1 from public.saved_questions s
        where s.question_id = q.id and s.user_id = v_user
      )
    )
    and (
      p_mode <> 'WEAK'
      or coalesce(w.band, 'STRONG') in ('CRITICAL', 'WEAK', 'NEEDS_PRACTICE')
    );

  select coalesce(array_agg(id), '{}') into v_ids
  from (
    select id
    from _practice_pool
    where recent_correct = false
    order by band_rank, prefer, random()
    limit v_limit
  ) fresh;

  v_need := v_limit - cardinality(v_ids);
  if v_need > 0 then
    select v_ids || coalesce(array_agg(id), '{}') into v_ids
    from (
      select id
      from _practice_pool
      where not (id = any (v_ids))
      order by band_rank, prefer, random()
      limit v_need
    ) filler;
  end if;

  return v_ids;
end;
$$;

create or replace function public.practice_home(p_exam text, p_paper text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam text := case when p_exam in ('STET', 'BPSC', 'BOTH') then p_exam else 'STET' end;
  v_paper text := case when p_paper in ('PAPER_I', 'PAPER_II', 'BOTH') then p_paper else 'BOTH' end;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;

  return jsonb_build_object(
    'topics', coalesce((
      select jsonb_agg(row_to_json(t)::jsonb order by t.display_order, t.name)
      from (
        select
          tp.id,
          tp.name,
          tp.slug,
          tp.display_order,
          coalesce((
            select jsonb_agg(s.name order by s.display_order)
            from (
              select name, display_order
              from public.subtopics
              where topic_id = tp.id and is_active = true
              order by display_order
              limit 6
            ) s
          ), '[]'::jsonb) as preview
        from public.topics tp
        where tp.is_active = true
          and tp.slug is not null
          and (tp.exam = v_exam or tp.exam = 'BOTH' or v_exam = 'BOTH')
          and (tp.paper = v_paper or tp.paper = 'BOTH' or v_paper = 'BOTH')
      ) t
    ), '[]'::jsonb),
    'weak', coalesce((
      select jsonb_agg(row_to_json(w)::jsonb order by w.band_rank, w.wrong desc)
      from (
        select
          s.id as subtopic_id,
          s.name as subtopic_name,
          s.slug as subtopic_slug,
          tp.id as topic_id,
          tp.name as topic_name,
          tp.slug as topic_slug,
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
          ) as band,
          case public.weakness_band(
            count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer
          )
            when 'CRITICAL' then 1
            when 'WEAK' then 2
            when 'NEEDS_PRACTICE' then 3
            else 9
          end as band_rank
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        join public.questions q on q.id = qa.question_id
        join public.subtopics s on s.id = q.subtopic_id
        join public.topics tp on tp.id = s.topic_id
        where ta.user_id = v_user
          and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
          and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
          and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
        group by s.id, s.name, s.slug, tp.id, tp.name, tp.slug
      ) w
      where w.band in ('CRITICAL', 'WEAK', 'NEEDS_PRACTICE')
    ), '[]'::jsonb),
    'pyq_count', (
      select count(*)::integer from public.questions q
      where q.status = 'PUBLISHED'
        and q.question_type = 'PREVIOUS_YEAR'
        and q.year is not null
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    ),
    'pyq_based_count', (
      select count(*)::integer from public.questions q
      where q.status = 'PUBLISHED'
        and q.question_type = 'PYQ_BASED'
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    ),
    'pyq_years', coalesce((
      select jsonb_agg(y order by y desc)
      from (
        select distinct q.year as y
        from public.questions q
        where q.status = 'PUBLISHED'
          and q.question_type = 'PREVIOUS_YEAR'
          and q.year is not null
          and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
          and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
      ) years
    ), '[]'::jsonb),
    'incorrect_count', (
      select count(distinct q.id)::integer
      from public.questions q
      join public.question_attempts qa on qa.question_id = q.id
      join public.test_attempts ta on ta.id = qa.attempt_id
      where q.status = 'PUBLISHED'
        and ta.user_id = v_user
        and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
        and qa.selected_answer is not null
        and qa.is_correct is false
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    ),
    'saved_count', (
      select count(*)::integer
      from public.saved_questions s
      join public.questions q on q.id = s.question_id
      where s.user_id = v_user
        and q.status = 'PUBLISHED'
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    ),
    'mixed_count', (
      select count(*)::integer from public.questions q
      where q.status = 'PUBLISHED'
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    )
  );
end;
$$;

create or replace function public.practice_topic(p_slug text, p_exam text, p_paper text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam text := case when p_exam in ('STET', 'BPSC', 'BOTH') then p_exam else 'STET' end;
  v_paper text := case when p_paper in ('PAPER_I', 'PAPER_II', 'BOTH') then p_paper else 'BOTH' end;
  v_topic public.topics;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_topic
  from public.topics
  where slug = p_slug
    and is_active = true
    and (exam = v_exam or exam = 'BOTH' or v_exam = 'BOTH')
    and (paper = v_paper or paper = 'BOTH' or v_paper = 'BOTH')
  order by case when exam = v_exam then 0 else 1 end
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_topic.id,
    'name', v_topic.name,
    'slug', v_topic.slug,
    'description', v_topic.description,
    'subtopics', coalesce((
      select jsonb_agg(row_to_json(s)::jsonb order by s.display_order, s.name)
      from (
        select
          sub.id,
          sub.name,
          sub.slug,
          sub.display_order,
          count(q.id) filter (where q.question_type = 'PREVIOUS_YEAR' and q.year is not null)::integer as pyq_count,
          count(q.id) filter (where q.question_type = 'PYQ_BASED')::integer as pyq_based_count,
          count(q.id) filter (where q.question_type = 'PRACTICE')::integer as practice_count,
          count(q.id)::integer as total_count
        from public.subtopics sub
        left join public.questions q
          on q.subtopic_id = sub.id
          and q.status = 'PUBLISHED'
          and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
          and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
        where sub.topic_id = v_topic.id
          and sub.is_active = true
        group by sub.id, sub.name, sub.slug, sub.display_order
      ) s
    ), '[]'::jsonb),
    'total_count', (
      select count(*)::integer from public.questions q
      where q.topic_id = v_topic.id
        and q.status = 'PUBLISHED'
        and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
        and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    )
  );
end;
$$;

create or replace function public.start_syllabus_practice(
  p_mode text,
  p_exam text,
  p_paper text,
  p_topic uuid,
  p_subtopic uuid,
  p_type text,
  p_difficulty text,
  p_year integer,
  p_limit integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam text := case when p_exam in ('STET', 'BPSC', 'BOTH') then p_exam else 'STET' end;
  v_paper text := case when p_paper in ('PAPER_I', 'PAPER_II', 'BOTH') then p_paper else 'BOTH' end;
  v_mode text := upper(coalesce(p_mode, 'MIXED'));
  v_type text := nullif(upper(coalesce(p_type, 'ALL')), 'ALL');
  v_difficulty text := nullif(upper(coalesce(p_difficulty, 'ALL')), 'ALL');
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 100);
  v_ids uuid[];
  v_title text;
  v_name text;
begin
  if v_mode not in ('TOPIC', 'SUBTOPIC', 'WEAK', 'INCORRECT', 'SAVED', 'MIXED', 'PYQ', 'PYQ_BASED') then
    raise exception 'INVALID_INPUT';
  end if;
  if v_difficulty is not null and v_difficulty not in ('EASY', 'MEDIUM', 'HARD') then
    raise exception 'INVALID_INPUT';
  end if;
  if v_type is not null and v_type not in ('PREVIOUS_YEAR', 'PYQ_BASED', 'PRACTICE') then
    raise exception 'INVALID_INPUT';
  end if;

  if v_mode = 'PYQ' then
    v_type := 'PREVIOUS_YEAR';
  elsif v_mode = 'PYQ_BASED' then
    v_type := 'PYQ_BASED';
  end if;

  v_ids := public.practice_pick(
    v_exam, v_paper,
    case when v_mode in ('TOPIC', 'SUBTOPIC') then p_topic else null end,
    case when v_mode = 'SUBTOPIC' then p_subtopic else null end,
    v_type, v_difficulty, p_year, v_mode, v_limit
  );

  if cardinality(v_ids) = 0 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;

  v_title := case v_mode
    when 'WEAK' then 'Weak topic practice'
    when 'INCORRECT' then 'Incorrect questions'
    when 'SAVED' then 'Saved questions'
    when 'MIXED' then 'Mixed practice'
    when 'PYQ' then 'Previous year questions'
    when 'PYQ_BASED' then 'PYQ-based practice'
    else 'Practice'
  end;

  if p_subtopic is not null then
    select name into v_name from public.subtopics where id = p_subtopic;
  elsif p_topic is not null then
    select name into v_name from public.topics where id = p_topic;
  end if;
  if v_name is not null then
    v_title := v_title || ': ' || v_name;
  end if;

  return public.create_practice_attempt(v_title, v_ids, least(greatest(cardinality(v_ids), 10), 100));
end;
$$;

create or replace function public.toggle_saved_question(p_question_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (
    select 1 from public.questions q
    where q.id = p_question_id and q.status = 'PUBLISHED'
  ) and not exists (
    select 1
    from public.question_attempts qa
    join public.test_attempts ta on ta.id = qa.attempt_id
    where qa.question_id = p_question_id and ta.user_id = v_user
  ) then
    raise exception 'FORBIDDEN';
  end if;

  delete from public.saved_questions
  where user_id = v_user and question_id = p_question_id;
  if found then
    return false;
  end if;

  insert into public.saved_questions (user_id, question_id)
  values (v_user, p_question_id);
  return true;
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
      'subtopic_name', sub.name,
      'question_type', q.question_type,
      'year', case when q.question_type = 'PREVIOUS_YEAR' then q.year else null end,
      'saved', exists (
        select 1 from public.saved_questions sv
        where sv.question_id = q.id and sv.user_id = v_attempt.user_id
      ),
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
  left join public.subtopics sub on sub.id = q.subtopic_id
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

revoke all on function public.practice_pick(text, text, uuid, uuid, text, text, integer, text, integer) from public, anon, authenticated;
revoke all on function public.create_practice_attempt(text, uuid[], integer) from public, anon, authenticated;

grant execute on function public.practice_home(text, text) to authenticated;
grant execute on function public.practice_topic(text, text, text) to authenticated;
grant execute on function public.start_syllabus_practice(text, text, text, uuid, uuid, text, text, integer, integer) to authenticated;
grant execute on function public.toggle_saved_question(uuid) to authenticated;


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

  drop table if exists _import_rows;
  create temporary table _import_rows (
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
    paper text,
    question_type text,
    row_status text,
    topic_id uuid,
    subtopic_id uuid,
    norm text,
    row_error text
  ) on commit drop;

  insert into _import_rows (
    idx, question_text, option_a, option_b, option_c, option_d, correct_option,
    exam, subject, topic_name, subtopic_name, difficulty, explanation, source, year,
    paper, question_type, row_status, norm
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
    case replace(replace(upper(trim(coalesce(item ->> 'paper', ''))), '-', '_'), ' ', '_')
      when 'PAPER_I' then 'PAPER_I'
      when 'I' then 'PAPER_I'
      when '1' then 'PAPER_I'
      when 'PAPER_II' then 'PAPER_II'
      when 'II' then 'PAPER_II'
      when '2' then 'PAPER_II'
      when '' then 'BOTH'
      when 'BOTH' then 'BOTH'
      else replace(replace(upper(trim(coalesce(item ->> 'paper', ''))), '-', '_'), ' ', '_')
    end,
    case replace(replace(upper(trim(coalesce(item ->> 'question_type', ''))), '-', '_'), ' ', '_')
      when 'PYQ' then 'PREVIOUS_YEAR'
      when 'PREVIOUS_YEAR' then 'PREVIOUS_YEAR'
      when 'PREVIOUSYEAR' then 'PREVIOUS_YEAR'
      when 'PYQ_BASED' then 'PYQ_BASED'
      when 'PYQBASED' then 'PYQ_BASED'
      when '' then 'PRACTICE'
      when 'PRACTICE' then 'PRACTICE'
      else replace(replace(upper(trim(coalesce(item ->> 'question_type', ''))), '-', '_'), ' ', '_')
    end,
    case upper(trim(coalesce(item ->> 'status', '')))
      when 'DRAFT' then 'DRAFT'
      when 'PUBLISHED' then 'PUBLISHED'
      when 'ARCHIVED' then 'ARCHIVED'
      else null
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
  end
  where idx is not null;

  update _import_rows i
  set topic_id = t.id
  from public.topics t
  where i.topic_name is not null
    and lower(t.name) = lower(i.topic_name)
    and (t.exam = i.exam or t.exam = 'BOTH' or i.exam = 'BOTH')
    and t.id = (
      select t2.id
      from public.topics t2
      where lower(t2.name) = lower(i.topic_name)
        and (t2.exam = i.exam or t2.exam = 'BOTH' or i.exam = 'BOTH')
      order by case when t2.slug is not null then 0 else 1 end, t2.display_order
      limit 1
    );

  update _import_rows i
  set subtopic_id = s.id
  from public.subtopics s
  where i.topic_id is not null
    and i.subtopic_name is not null
    and s.topic_id = i.topic_id
    and lower(s.name) = lower(i.subtopic_name);

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
    when paper not in ('PAPER_I', 'PAPER_II', 'BOTH') then 'Paper must be PAPER_I, PAPER_II, or BOTH'
    when question_type not in ('PREVIOUS_YEAR', 'PYQ_BASED', 'PRACTICE') then 'Question type must be PREVIOUS_YEAR, PYQ_BASED, or PRACTICE'
    when question_type = 'PREVIOUS_YEAR' and year is null then 'Previous-year questions need a real year'
    when year is not null and (year < 1900 or year > 2100) then 'Year is invalid'
    else null
  end
  where idx is not null;

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
    insert into public.subtopics (topic_id, name, display_order)
    select topic_id, subtopic_name, 1000 + row_number() over (partition by topic_id order by subtopic_name)
    from (
      select distinct i.topic_id, i.subtopic_name
      from _import_rows i
      where i.row_error is null
        and i.subtopic_name is not null
        and i.subtopic_id is null
        and not exists (
          select 1 from public.subtopics s
          where s.topic_id = i.topic_id and lower(s.name) = lower(i.subtopic_name)
        )
    ) fresh;

    update _import_rows i
    set subtopic_id = s.id
    from public.subtopics s
    where i.row_error is null
      and i.subtopic_id is null
      and i.subtopic_name is not null
      and s.topic_id = i.topic_id
      and lower(s.name) = lower(i.subtopic_name);

    insert into public.questions (
      question_text, option_a, option_b, option_c, option_d, correct_option,
      explanation, exam, subject, topic_id, subtopic, subtopic_id, difficulty,
      source, year, paper, question_type, status
    )
    select
      i.question_text, i.option_a, i.option_b, i.option_c, i.option_d, i.correct_option,
      i.explanation, i.exam, 'MUSIC', i.topic_id, i.subtopic_name, i.subtopic_id, i.difficulty,
      i.source, i.year, i.paper, i.question_type, case when p_publish then 'PUBLISHED' else coalesce(i.row_status, v_status) end
    from _import_rows i
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


create or replace function public.practice_available(
  p_mode text,
  p_exam text,
  p_paper text,
  p_topic uuid,
  p_subtopic uuid,
  p_type text,
  p_difficulty text,
  p_year integer
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam text := case when p_exam in ('STET', 'BPSC', 'BOTH') then p_exam else 'STET' end;
  v_paper text := case when p_paper in ('PAPER_I', 'PAPER_II', 'BOTH') then p_paper else 'BOTH' end;
  v_mode text := upper(coalesce(p_mode, 'MIXED'));
  v_type text := nullif(upper(coalesce(p_type, 'ALL')), 'ALL');
  v_difficulty text := nullif(upper(coalesce(p_difficulty, 'ALL')), 'ALL');
  v_count integer;
begin
  if v_user is null then
    raise exception 'FORBIDDEN';
  end if;
  if v_mode = 'PYQ' then v_type := 'PREVIOUS_YEAR'; end if;
  if v_mode = 'PYQ_BASED' then v_type := 'PYQ_BASED'; end if;

  select count(*)::integer into v_count
  from public.questions q
  left join (
    select
      wq.subtopic_id,
      public.weakness_band(
        count(*) filter (where qa.selected_answer is not null and qa.is_correct is false)::integer
      ) as band
    from public.question_attempts qa
    join public.test_attempts ta on ta.id = qa.attempt_id
    join public.questions wq on wq.id = qa.question_id
    where ta.user_id = v_user
      and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
      and wq.subtopic_id is not null
    group by wq.subtopic_id
  ) w on w.subtopic_id = q.subtopic_id
  where q.status = 'PUBLISHED'
    and (q.exam = v_exam or q.exam = 'BOTH' or v_exam = 'BOTH')
    and (q.paper = v_paper or q.paper = 'BOTH' or v_paper = 'BOTH')
    and (p_topic is null or v_mode not in ('TOPIC', 'SUBTOPIC') or q.topic_id = p_topic)
    and (p_subtopic is null or v_mode <> 'SUBTOPIC' or q.subtopic_id = p_subtopic)
    and (v_type is null or q.question_type = v_type)
    and (v_difficulty is null or q.difficulty = v_difficulty)
    and (p_year is null or q.year = p_year)
    and (v_mode <> 'PYQ' or (q.question_type = 'PREVIOUS_YEAR' and q.year is not null))
    and (v_mode <> 'PYQ_BASED' or q.question_type = 'PYQ_BASED')
    and (
      v_mode <> 'INCORRECT'
      or exists (
        select 1
        from public.question_attempts qa
        join public.test_attempts ta on ta.id = qa.attempt_id
        where qa.question_id = q.id
          and ta.user_id = v_user
          and ta.status in ('COMPLETED', 'AUTO_SUBMITTED')
          and qa.selected_answer is not null
          and qa.is_correct is false
      )
    )
    and (
      v_mode <> 'SAVED'
      or exists (
        select 1 from public.saved_questions s
        where s.question_id = q.id and s.user_id = v_user
      )
    )
    and (
      v_mode <> 'WEAK'
      or coalesce(w.band, 'STRONG') in ('CRITICAL', 'WEAK', 'NEEDS_PRACTICE')
    );

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.practice_available(text, text, text, uuid, uuid, text, text, integer) to authenticated;
