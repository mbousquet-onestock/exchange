# OneStock Returns & Exchanges Portal

Portail de retours / échanges connecté à l'API OneStock (v3) :

1. **Articles de la commande** : `GET /v3/orders/{id}` puis `GET /v3/items/{id}` pour chaque ligne.
2. **Articles d'échange** : lus depuis un nouvel attribut de la fiche produit
   (`information.exchange_items` par défaut, configurable via `ONESTOCK_EXCHANGE_ATTRIBUTE`).
   Valeur attendue : un tableau ou une liste séparée par des virgules d'identifiants d'items, ex. `"SKU-M,SKU-L,SKU-ROUGE"`.
   - *Same model* : variantes ayant le même `product_id` (choix taille / couleur).
   - *Different model* : les autres articles listés.
3. **Création de la commande d'échange** : `POST /v3/orders` (id `EXC-<commande>-<suffixe>`, type `exchange`,
   référence à la commande d'origine et aux articles retournés dans `information`).

## Architecture

- `server/onestock.ts` : client OneStock (login + token en cache), mapping des données, routes `/api/*`.
- `server/db.ts` : lecture de la table `settings`, écriture dans `api_logs`.
- `api/*.ts` : fonctions Vercel exposant ces routes en production.
- `vite.config.ts` : middleware qui sert les mêmes routes en `npm run dev`.
- `services/api.ts` : appels depuis le front.

Les identifiants OneStock restent côté serveur (jamais exposés au navigateur).

## Base de données (settings / api_logs)

Connexion via `DATABASE_URL` (ou `POSTGRES_URL`). Paramètres lus dans la table `settings`
pour `environment = APP_ENVIRONMENT` (défaut `qualif`) et `extension_id` = `exchange` ou `*`.
Une ligne avec `site_id` (= `ONESTOCK_SITE_ID`) l'emporte sur la ligne globale, et `exchange` sur `*` :

| key | effet |
| --- | --- |
| `onestock_api_root` | URL de l'API OneStock (prioritaire sur `ONESTOCK_API_URL`) |
| `api_logs_enabled` | `true` / `false` : enregistre chaque appel OneStock dans `api_logs` |

Chaque appel (login, commande, items, création de commande) est tracé dans `api_logs`
(`method`, `url`, `request`, `status`, `duration_ms`, `response`, `error`, `site_id`,
`extension_id = exchange`, `environment`). Le mot de passe et le token sont masqués (`***`).
Les settings sont mis en cache 60 s. Une base indisponible ne bloque jamais l'API.
Script SQL : `sql/api_logs.sql`.

## Lancer en local

1. `npm install`
2. Copier `.env.example` en `.env.local` et renseigner `ONESTOCK_SITE_ID`, `ONESTOCK_USER_ID`, `ONESTOCK_PASSWORD`.
   Sans identifiants, le portail tourne sur des données mock (commande `DEMO-0001`).
3. `npm run dev` puis ouvrir `http://localhost:3000/?order=<id commande>&email=<email client>`
   (ou saisir le numéro de commande dans le formulaire).

Sur Vercel, définir les mêmes variables d'environnement dans les paramètres du projet.
