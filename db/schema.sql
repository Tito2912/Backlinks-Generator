create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  domain text not null,
  niche text,
  created_at timestamptz default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  url text not null,
  keyword text,
  created_at timestamptz default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  keywords text[] default '{}',
  sources text[] default '{reddit,google}',
  created_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references projects(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  source text not null,
  title text not null,
  url text not null,
  snippet text,
  opportunity_score int default 0,
  status text default 'new',
  reply text,
  target_article_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists backlinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  opportunity_id uuid references opportunities(id) on delete set null,
  project_id uuid references projects(id) on delete cascade,
  source_url text not null,
  target_url text not null,
  anchor_text text,
  status text default 'submitted',
  last_checked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists reply_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  platform text not null,
  prompt text not null,
  created_at timestamptz default now()
);

alter table projects add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table articles add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table campaigns add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table opportunities add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table backlinks add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table backlinks add column if not exists last_checked_at timestamptz;
alter table reply_templates add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table projects alter column user_id set default auth.uid();
alter table articles alter column user_id set default auth.uid();
alter table campaigns alter column user_id set default auth.uid();
alter table opportunities alter column user_id set default auth.uid();
alter table backlinks alter column user_id set default auth.uid();
alter table reply_templates alter column user_id set default auth.uid();

alter table opportunities drop constraint if exists opportunities_url_key;
create unique index if not exists opportunities_user_url_idx on opportunities(user_id, url);
create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists articles_user_id_idx on articles(user_id);
create index if not exists campaigns_user_id_idx on campaigns(user_id);
create index if not exists opportunities_user_id_idx on opportunities(user_id);
create index if not exists backlinks_user_id_idx on backlinks(user_id);
create index if not exists reply_templates_user_id_idx on reply_templates(user_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists opportunities_set_updated_at on opportunities;
create trigger opportunities_set_updated_at
before update on opportunities
for each row execute function set_updated_at();

alter table projects enable row level security;
alter table articles enable row level security;
alter table campaigns enable row level security;
alter table opportunities enable row level security;
alter table backlinks enable row level security;
alter table reply_templates enable row level security;

drop policy if exists projects_select_own on projects;
drop policy if exists projects_insert_own on projects;
drop policy if exists projects_update_own on projects;
drop policy if exists projects_delete_own on projects;
create policy projects_select_own on projects for select using (user_id = auth.uid());
create policy projects_insert_own on projects for insert with check (user_id = auth.uid());
create policy projects_update_own on projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_delete_own on projects for delete using (user_id = auth.uid());

drop policy if exists articles_select_own on articles;
drop policy if exists articles_insert_own on articles;
drop policy if exists articles_update_own on articles;
drop policy if exists articles_delete_own on articles;
create policy articles_select_own on articles for select using (user_id = auth.uid());
create policy articles_insert_own on articles for insert with check (user_id = auth.uid());
create policy articles_update_own on articles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy articles_delete_own on articles for delete using (user_id = auth.uid());

drop policy if exists campaigns_select_own on campaigns;
drop policy if exists campaigns_insert_own on campaigns;
drop policy if exists campaigns_update_own on campaigns;
drop policy if exists campaigns_delete_own on campaigns;
create policy campaigns_select_own on campaigns for select using (user_id = auth.uid());
create policy campaigns_insert_own on campaigns for insert with check (user_id = auth.uid());
create policy campaigns_update_own on campaigns for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy campaigns_delete_own on campaigns for delete using (user_id = auth.uid());

drop policy if exists opportunities_select_own on opportunities;
drop policy if exists opportunities_insert_own on opportunities;
drop policy if exists opportunities_update_own on opportunities;
drop policy if exists opportunities_delete_own on opportunities;
create policy opportunities_select_own on opportunities for select using (user_id = auth.uid());
create policy opportunities_insert_own on opportunities for insert with check (user_id = auth.uid());
create policy opportunities_update_own on opportunities for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy opportunities_delete_own on opportunities for delete using (user_id = auth.uid());

drop policy if exists backlinks_select_own on backlinks;
drop policy if exists backlinks_insert_own on backlinks;
drop policy if exists backlinks_update_own on backlinks;
drop policy if exists backlinks_delete_own on backlinks;
create policy backlinks_select_own on backlinks for select using (user_id = auth.uid());
create policy backlinks_insert_own on backlinks for insert with check (user_id = auth.uid());
create policy backlinks_update_own on backlinks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy backlinks_delete_own on backlinks for delete using (user_id = auth.uid());

drop policy if exists reply_templates_select_own on reply_templates;
drop policy if exists reply_templates_insert_own on reply_templates;
drop policy if exists reply_templates_update_own on reply_templates;
drop policy if exists reply_templates_delete_own on reply_templates;
create policy reply_templates_select_own on reply_templates for select using (user_id = auth.uid());
create policy reply_templates_insert_own on reply_templates for insert with check (user_id = auth.uid());
create policy reply_templates_update_own on reply_templates for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reply_templates_delete_own on reply_templates for delete using (user_id = auth.uid());
