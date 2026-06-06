create table if not exists public.paper_pages (
  id uuid primary key default gen_random_uuid(),
  past_paper_id uuid not null references public.past_papers(id) on delete cascade,
  page_number int not null,
  ocr_text text not null default '',
  created_at timestamptz not null default now(),
  unique (past_paper_id, page_number)
);

alter table public.paper_pages enable row level security;

drop policy if exists "public read paper pages" on public.paper_pages;
create policy "public read paper pages" on public.paper_pages for select to authenticated using (true);
