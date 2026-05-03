create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  niche text,
  created_at timestamptz default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  url text not null,
  keyword text,
  created_at timestamptz default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  keywords text[] default '{}',
  sources text[] default '{reddit,google}',
  created_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  source text not null,
  title text not null,
  url text not null unique,
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
  opportunity_id uuid references opportunities(id) on delete set null,
  project_id uuid references projects(id) on delete cascade,
  source_url text not null,
  target_url text not null,
  anchor_text text,
  status text default 'submitted',
  created_at timestamptz default now()
);

create table if not exists reply_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null,
  prompt text not null,
  created_at timestamptz default now()
);
