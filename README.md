# Backlink OS — Mini SaaS SEO clé en main

Mini SaaS Next.js pour trouver des opportunités de backlinks gratuits, générer des réponses naturelles et suivre les campagnes SEO.

## Fonctionnalités incluses

- Recherche Reddit via Google/SerpAPI `site:reddit.com`
- Recherche Google via SerpAPI
- Scoring automatique des opportunités
- Génération de réponses avec OpenAI
- Structure multi-projets avec sauvegarde Supabase
- Auth Supabase par lien magique
- CRUD projects, articles, campaigns, backlinks et templates
- Pipeline d'opportunités avec statuts, notes et export CSV
- Vérification live de backlinks
- Schéma Supabase avec RLS : projects, articles, campaigns, opportunities, backlinks, templates
- Dashboard connecté aux données
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
OPENAI_MODEL=gpt-4.1-mini
SERPAPI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_TARGET_SITE=https://oryvalo.com
```

## Utilisation

1. Va sur `/settings`
2. Vérifie que les variables d'environnement sont détectées
3. Connecte-toi avec le lien magique Supabase
4. Crée au moins un projet et tes articles cibles
5. Va sur `/opportunities`
6. Lance une recherche Reddit ou Google
7. Génère une réponse, sauvegarde l'opportunité, puis suis le statut
8. Ajoute les backlinks obtenus dans `/backlinks` et lance la vérification

## Supabase RLS

Le fichier `db/schema.sql` contient maintenant les colonnes `user_id`, les indexes, les policies RLS et le trigger `updated_at`.

Si tu avais déjà lancé une ancienne version du schéma, relance entièrement `db/schema.sql` dans le SQL Editor Supabase pour ajouter les colonnes et policies manquantes.

## Ancien flux rapide

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
