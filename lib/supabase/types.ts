export type Project = {
  id: string;
  user_id: string | null;
  name: string;
  domain: string;
  niche: string | null;
  created_at: string;
};

export type Article = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  title: string;
  url: string;
  keyword: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  name: string;
  keywords: string[] | null;
  sources: string[] | null;
  created_at: string;
};

export type Opportunity = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  campaign_id: string | null;
  source: string;
  title: string;
  url: string;
  snippet: string | null;
  opportunity_score: number | null;
  status: string | null;
  reply: string | null;
  target_article_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Backlink = {
  id: string;
  user_id: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  status: string | null;
  last_checked_at: string | null;
  created_at: string;
};

export type ReplyTemplate = {
  id: string;
  user_id: string | null;
  name: string;
  platform: string;
  prompt: string;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      articles: Table<Article>;
      backlinks: Table<Backlink>;
      campaigns: Table<Campaign>;
      opportunities: Table<Opportunity>;
      projects: Table<Project>;
      reply_templates: Table<ReplyTemplate>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
