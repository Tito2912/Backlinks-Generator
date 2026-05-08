-- Enable Row-Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

-- projects
CREATE POLICY "projects: select own" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects: insert own" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects: update own" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects: delete own" ON projects FOR DELETE USING (auth.uid() = user_id);

-- campaigns
CREATE POLICY "campaigns: select own" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "campaigns: insert own" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns: update own" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaigns: delete own" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- opportunities
CREATE POLICY "opportunities: select own" ON opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "opportunities: insert own" ON opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "opportunities: update own" ON opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "opportunities: delete own" ON opportunities FOR DELETE USING (auth.uid() = user_id);

-- articles
CREATE POLICY "articles: select own" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "articles: insert own" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "articles: update own" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "articles: delete own" ON articles FOR DELETE USING (auth.uid() = user_id);

-- backlinks
CREATE POLICY "backlinks: select own" ON backlinks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "backlinks: insert own" ON backlinks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "backlinks: update own" ON backlinks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "backlinks: delete own" ON backlinks FOR DELETE USING (auth.uid() = user_id);

-- reply_templates
CREATE POLICY "reply_templates: select own" ON reply_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reply_templates: insert own" ON reply_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reply_templates: update own" ON reply_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reply_templates: delete own" ON reply_templates FOR DELETE USING (auth.uid() = user_id);
