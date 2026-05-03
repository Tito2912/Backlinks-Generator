# Backlink OS — Mini SaaS SEO clé en main

Mini SaaS Next.js pour trouver des opportunités de backlinks gratuits, générer des réponses naturelles et suivre les campagnes SEO.

## Fonctionnalités incluses

- Recherche Reddit via endpoint JSON public
- Recherche Google via SerpAPI
- Scoring automatique des opportunités
- Génération de réponses avec OpenAI
- Structure multi-projets
- Schéma Supabase complet : projects, articles, campaigns, opportunities, backlinks, templates
- Dashboard prêt à étendre
- UI Tailwind simple et propre

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Puis ouvre :

```txt
http://localhost:3000
```

## Supabase

1. Crée un projet Supabase
2. Va dans SQL Editor
3. Colle le contenu de `db/schema.sql`
4. Renseigne `.env.local`

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
SERPAPI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Utilisation

1. Va sur `/opportunities`
2. Tape une requête : `best ai tools`, `make money with ai`, `affiliate marketing tools`
3. Cherche sur Reddit ou Google
4. Ajoute l'URL de ton article
5. Génère une réponse
6. Ajuste et poste manuellement

## Important

Ne pas automatiser le posting Reddit/Quora/forums. Le système est volontairement semi-automatisé pour éviter les bans et garder des backlinks propres.

## Roadmap conseillée

- Sauvegarde des opportunités dans Supabase
- Formulaires CRUD pour projects/articles/campaigns
- Cron quotidien par campagne
- Import sitemap automatique des articles
- Export CSV
- Détection backlink live
