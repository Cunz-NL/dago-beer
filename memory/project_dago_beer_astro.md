---
name: project-dago-beer-astro
description: Architecture et état du projet Astro dago.beer — stack, collections, routes, conventions Astro 5
metadata:
  type: project
---

Projet Astro 5 statique pour dago.beer, média bière sans alcool + annuaire brasseries.

**Why:** Migration depuis Webflow vers Astro statique pour contrôle total SEO, coût d'hébergement et extensibilité.

**How to apply:** Référence pour toute décision d'architecture, ajout de collection, ou nouvelle route.

## Stack
- Astro 5 + TypeScript strict + Tailwind CSS 3
- Output: static, déploiement Netlify
- Zéro JS client (islands uniquement si besoin)

## Collections (src/content/)
- `brasseries/` → type: 'data', JSON, champ `slug` = URL Webflow
- `regions/` → type: 'data', JSON
- `articles/` → type: 'content', Markdown (PAS de champ `slug` dans frontmatter — utiliser `entry.id.replace(/\.mdx?$/, '')`)
- `bieresSansAlcool/` → type: 'data', JSON

## Convention critique Astro 5
Pour les collections `type: 'content'` (articles), Astro 5 gère le `slug` via `entry.id`.
Le `id` inclut l'extension `.md` → toujours faire `.replace(/\.mdx?$/, '')` avant d'utiliser en URL.
Ne PAS mettre de champ `slug` dans le frontmatter des articles (conflit de schema).

## Script de migration
`scripts/migrate-webflow.mjs` — traite les 19 CSV Webflow → 2 259 fichiers JSON/MD.
Commande : `node scripts/migrate-webflow.mjs`
Dépendance dev : `csv-parse`

## Résultat migration (2 259 fichiers → 2 123 pages HTML)
- 20 régions, 94 départements, 1 600 brasseries, 43 articles
- 7 recettes, 242 houblons, 115 arômes, 75+25+8 styles/familles/couleurs
- 26 bières artisanales, 3 cavistes, 1 fournisseur

## Routes générées (18 pages avec 3 exemples)
- `/` — homepage
- `/brasserie-artisanale/[slug]` — fiche brasserie
- `/brasseries-bieres-artisanales-france/[slug]` — liste par région
- `/brasseries-bieres-artisanales-france-region/[slug]` — liste par département
- `/brasserie-biere-artisanale/` — annuaire complet
- `/articles/[slug]` — article
- `/biere-sans-alcool/` — index bières
- `/biere-sans-alcool/[slug]` — fiche bière
- `/brassage-amateur/` — hub brassage
- `/brassage-amateur/[slug]` — article brassage (tag brassage-amateur)
- `/recette-biere/` — index recettes (639 recettes Webflow, 7 publiées)
- `/recette-biere/[slug]` — fiche recette
- `/style-de-bieres/` — index 75 styles
- `/style-de-bieres/[slug]` — fiche style
- `/houblons/` — index 242 houblons
- `/houblons/[slug]` — fiche houblon

## Source données Webflow
CSV disponibles dans `source-cms-weblow/` :
- Brasserie Artisanales → ~1500+ entrées
- Brasserie Regions → liste régions
- Articles → articles existants

## Charte graphique Tailwind
- `bg-bg` = #1a1a1a, `bg-surface` = #242424
- `text-amber-brand` = #D4860B
- `font-heading` = Oswald, `font-body` = Exo
- Badge ABV : vert si 0.0%, orange si > 0%
