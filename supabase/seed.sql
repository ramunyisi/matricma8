insert into public.subjects (name, grade, curriculum)
select subject_name, grade, 'CAPS'
from unnest(array[
  'Accounting',
  'Agricultural Management Practices',
  'Agricultural Sciences',
  'Agricultural Technology',
  'Business Studies',
  'Civil Technology',
  'Computer Applications Technology',
  'Consumer Studies',
  'Dance Studies',
  'Design',
  'Dramatic Arts',
  'Economics',
  'Electrical Technology',
  'Engineering Graphics and Design',
  'English Home Language',
  'English First Additional Language',
  'English Second Additional Language',
  'Geography',
  'History',
  'Information Technology',
  'isiNdebele Home Language',
  'isiXhosa Home Language',
  'isiZulu Home Language',
  'Sepedi Home Language',
  'Sesotho Home Language',
  'Setswana Home Language',
  'Siswati Home Language',
  'Tshivenda Home Language',
  'Xitsonga Home Language',
  'Mathematics',
  'Mathematical Literacy',
  'Physical Sciences',
  'Life Sciences',
  'Life Orientation',
  'Hospitality Studies',
  'Mechanical Technology',
  'Music',
  'Religion Studies',
  'Technical Mathematics',
  'Technical Sciences',
  'Tourism',
  'Visual Arts'
]) as subject_name
cross join generate_series(10, 12) as grade
on conflict (name, grade, curriculum) do nothing;

insert into public.topics (subject_id, name, caps_term, grade)
select s.id, topic_name, caps_term, s.grade
from public.subjects s
join lateral (
  values
    ('Mathematics', 'Functions and graphs', 1),
    ('Mathematics', 'Calculus basics', 3),
    ('Physical Sciences', 'Newton''s laws and momentum', 1),
    ('Physical Sciences', 'Electric circuits', 3),
    ('Life Sciences', 'Genetics and inheritance', 2),
    ('Accounting', 'Companies financial statements', 2),
    ('Geography', 'Climate and weather', 1),
    ('Business Studies', 'Business environments', 1)
) topic(subject_name, topic_name, caps_term) on topic.subject_name = s.name
on conflict (subject_id, name, grade) do nothing;

insert into public.aps_rules (
  institution_name,
  programme_name,
  rule_json,
  minimum_subject_requirements_json,
  source_url,
  last_verified_at
) values
(
  'Sample University',
  'BSc Engineering Foundation Track',
  '{"method":"nsc_levels","includeLifeOrientation":false,"minimumTotal":34,"sampleData":true}'::jsonb,
  '[{"subject":"Mathematics","minMark":60},{"subject":"Physical Sciences","minMark":60},{"subject":"English Home Language","minMark":50}]'::jsonb,
  'https://example.edu/admissions/sample-engineering',
  '2026-01-15'
),
(
  'Sample Metro University',
  'BCom Accounting',
  '{"method":"nsc_levels","includeLifeOrientation":false,"minimumTotal":30,"sampleData":true}'::jsonb,
  '[{"subject":"Mathematics","minMark":50},{"subject":"English Home Language","minMark":50},{"subject":"Accounting","minMark":60}]'::jsonb,
  'https://example.edu/admissions/sample-commerce',
  '2026-01-15'
)
on conflict (institution_name, programme_name) do nothing;

insert into public.bursaries (
  name,
  provider,
  field_of_study,
  funding_type,
  study_levels,
  eligibility_criteria_json,
  min_average,
  min_subject_requirements_json,
  province_requirements,
  citizenship_requirements,
  deadline,
  official_status,
  application_url,
  required_documents_json,
  source_url,
  last_verified_at,
  last_checked_at,
  application_window,
  summary,
  notes
) values
(
  'Sample STEM Future Bursary',
  'MatricSA Demo Foundation',
  'Engineering',
  'bursary',
  array['undergraduate'],
  '["South African citizen","Financial need"]'::jsonb,
  65,
  '[{"subject":"Mathematics","minMark":60},{"subject":"Physical Sciences","minMark":60}]'::jsonb,
  array['Gauteng','Limpopo','Mpumalanga'],
  'South African citizen or permanent resident',
  '2026-09-30',
  'open',
  'https://example.org/sample-stem-bursary',
  '["ID document","Latest school report","Proof of residence"]'::jsonb,
  'https://example.org/sample-stem-bursary',
  '2026-01-15',
  '2026-06-08',
  'Apply through the official portal before the closing date.',
  'General STEM funding for school leavers.',
  'Use the source page for the live cycle.'
),
(
  'Sample Commerce Access Award',
  'MatricSA Demo Trust',
  'Commerce',
  'scholarship',
  array['undergraduate'],
  '["South African citizen","Strong academic results"]'::jsonb,
  60,
  '[{"subject":"Accounting","minMark":60}]'::jsonb,
  array['All provinces'],
  'South African citizen',
  '2026-08-15',
  'open',
  'https://example.org/sample-commerce-award',
  '["ID document","Grade 11 final report","Motivation letter"]'::jsonb,
  'https://example.org/sample-commerce-award',
  '2026-01-15',
  '2026-06-08',
  'Check the provider site for the current intake.',
  'Commerce support award.',
  'Application timing changes every year.'
);

insert into public.past_papers (
  grade,
  subject_id,
  year,
  exam_session,
  paper_number,
  paper_url,
  memo_url,
  source_name,
  source_url
)
select
  12,
  s.id,
  2024,
  'November',
  case when s.name = 'Life Sciences' then 'Paper 2' else 'Paper 1' end,
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593',
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593',
  'Department of Basic Education NSC Past Examination Papers',
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593'
from public.subjects s
where s.grade = 12 and s.name in ('Mathematics', 'Physical Sciences', 'Life Sciences');

insert into public.paper_questions (
  past_paper_id,
  question_number,
  topic_id,
  difficulty,
  marks,
  question_text_optional,
  page_number,
  memo_page_number
)
select p.id, 'Sample metadata only', t.id, 'medium', 12, null, 5, 4
from public.past_papers p
join public.subjects s on s.id = p.subject_id
join public.topics t on t.subject_id = s.id
where s.name = 'Mathematics' and t.name = 'Functions and graphs'
limit 1;
