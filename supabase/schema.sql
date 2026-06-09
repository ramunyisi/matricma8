create extension if not exists pgcrypto;

create type public.user_role as enum ('learner', 'parent', 'teacher_admin');
create type public.internet_access_level as enum ('low', 'medium', 'high');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'learner',
  created_at timestamptz not null default now()
);

create table public.learner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  grade int not null check (grade in (10, 11, 12)),
  province text not null,
  school_name text,
  home_language text not null,
  internet_access_level public.internet_access_level not null default 'medium',
  career_interests text[] not null default '{}',
  preferred_study_times text[] not null default '{}',
  exam_date date,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade int not null check (grade in (10, 11, 12)),
  curriculum text not null default 'CAPS',
  created_at timestamptz not null default now(),
  unique (name, grade, curriculum)
);

create table public.learner_subjects (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  current_mark numeric(5,2) not null check (current_mark between 0 and 100),
  target_mark numeric(5,2) not null check (target_mark between 0 and 100),
  unique (learner_id, subject_id)
);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  week_start date not null,
  plan_json jsonb not null,
  created_at timestamptz not null default now()
);

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic text not null,
  task_type text not null,
  due_date date,
  completed boolean not null default false
);

create table public.marks (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  assessment_type text not null,
  mark numeric(5,2) not null check (mark between 0 and 100),
  assessment_date date not null
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  caps_term int check (caps_term between 1 and 4),
  grade int not null check (grade in (10, 11, 12)),
  unique (subject_id, name, grade)
);

create table public.past_papers (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade in (10, 11, 12)),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  year int not null check (year >= 2008),
  exam_session text not null,
  paper_number text not null,
  paper_url text not null,
  memo_url text,
  language text,
  collection_title text,
  external_id text,
  source_name text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

create table public.dbe_exam_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int,
  exam_session text,
  grade_scope text not null default 'Grade 12',
  source_url text not null unique,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.paper_questions (
  id uuid primary key default gen_random_uuid(),
  past_paper_id uuid not null references public.past_papers(id) on delete cascade,
  question_number text not null,
  topic_id uuid references public.topics(id) on delete set null,
  difficulty public.question_difficulty not null default 'medium',
  marks int check (marks >= 0),
  question_text_optional text,
  page_number int,
  memo_page_number int
);

create table public.paper_pages (
  id uuid primary key default gen_random_uuid(),
  past_paper_id uuid not null references public.past_papers(id) on delete cascade,
  page_number int not null,
  ocr_text text not null default '',
  created_at timestamptz not null default now(),
  unique (past_paper_id, page_number)
);

create table public.aps_rules (
  id uuid primary key default gen_random_uuid(),
  institution_name text not null,
  programme_name text not null,
  rule_json jsonb not null,
  minimum_subject_requirements_json jsonb not null default '[]'::jsonb,
  source_url text not null,
  last_verified_at date,
  prospectus_url text,
  prospectus_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (institution_name, programme_name)
);

create table public.aps_predictions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  institution_name text not null,
  programme_name text not null,
  calculated_score numeric(6,2) not null,
  eligibility_status text not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

create table public.bursaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  field_of_study text not null,
  funding_type text,
  study_levels text[] not null default '{}',
  eligibility_criteria_json jsonb not null default '[]'::jsonb,
  min_average numeric(5,2),
  min_subject_requirements_json jsonb not null default '[]'::jsonb,
  province_requirements text[] not null default '{}',
  citizenship_requirements text,
  deadline date,
  official_status text not null default 'unknown',
  application_url text not null,
  required_documents_json jsonb not null default '[]'::jsonb,
  source_url text not null,
  last_verified_at date,
  last_checked_at date,
  application_window text,
  summary text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.bursary_matches (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  bursary_id uuid not null references public.bursaries(id) on delete cascade,
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  match_reasons_json jsonb not null default '[]'::jsonb,
  missing_requirements_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (learner_id, bursary_id)
);

create index learner_profiles_user_id_idx on public.learner_profiles(user_id);
create index learner_subjects_learner_id_idx on public.learner_subjects(learner_id);
create index marks_learner_subject_idx on public.marks(learner_id, subject_id);
create index past_papers_lookup_idx on public.past_papers(grade, subject_id, year, exam_session);
create unique index past_papers_external_id_idx on public.past_papers(external_id) where external_id is not null;
create index past_papers_search_idx on public.past_papers(year, exam_session, paper_number, language);
create index paper_questions_topic_idx on public.paper_questions(topic_id, difficulty);
create index bursaries_deadline_idx on public.bursaries(deadline);

alter table public.users enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.learner_subjects enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.marks enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.past_papers enable row level security;
alter table public.dbe_exam_collections enable row level security;
alter table public.paper_questions enable row level security;
alter table public.paper_pages enable row level security;
alter table public.aps_rules enable row level security;
alter table public.aps_predictions enable row level security;
alter table public.bursaries enable row level security;
alter table public.bursary_matches enable row level security;

create policy "users can read own user row" on public.users for select using (auth.uid() = id);
create policy "users can update own user row" on public.users for update using (auth.uid() = id);

create policy "learners can read own profile" on public.learner_profiles for select using (auth.uid() = user_id);
create policy "learners can insert own profile" on public.learner_profiles for insert with check (auth.uid() = user_id);
create policy "learners can update own profile" on public.learner_profiles for update using (auth.uid() = user_id);

create policy "public read subjects" on public.subjects for select to authenticated using (true);
create policy "public read topics" on public.topics for select to authenticated using (true);
create policy "public read past papers" on public.past_papers for select to authenticated using (true);
create policy "public read dbe exam collections" on public.dbe_exam_collections for select to authenticated using (true);
create policy "public read questions" on public.paper_questions for select to authenticated using (true);
create policy "public read paper pages" on public.paper_pages for select to authenticated using (true);
create policy "public read aps rules" on public.aps_rules for select to authenticated using (true);
create policy "public read bursaries" on public.bursaries for select to authenticated using (true);

create policy "own learner subjects" on public.learner_subjects for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = learner_subjects.learner_id and lp.user_id = auth.uid()
  )
);

create policy "own marks" on public.marks for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = marks.learner_id and lp.user_id = auth.uid()
  )
);

create policy "own study plans" on public.study_plans for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = study_plans.learner_id and lp.user_id = auth.uid()
  )
);

create policy "own study tasks" on public.study_tasks for all using (
  exists (
    select 1
    from public.study_plans sp
    join public.learner_profiles lp on lp.id = sp.learner_id
    where sp.id = study_tasks.study_plan_id and lp.user_id = auth.uid()
  )
);

create policy "own aps predictions" on public.aps_predictions for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = aps_predictions.learner_id and lp.user_id = auth.uid()
  )
);

create policy "own bursary matches" on public.bursary_matches for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = bursary_matches.learner_id and lp.user_id = auth.uid()
  )
);

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'learner'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
