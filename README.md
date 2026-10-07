# OneStock Returns & Exchanges Portal

Portail de retours / échanges connecté à l'API OneStock v3 (spec : API interne OneStock, OpenAPI 3.1).
Les routes GET OneStock prennent leurs paramètres dans un body JSON : elles sont appelées en
`POST` avec l'en-tête `X-HTTP-Method-Override: GET`.

1. **Articles de la commande** : `GET /orders/{id}` (`order_items`, état via `line_item_groups`),
   puis `GET /items` (`item_ids`, `features` dans la langue `default_lang`).
2. **Articles d'échange** : lus depuis un nouvel attribut (feature) de la fiche produit,
   `exchange_items` par défaut (configurable via `ONESTOCK_EXCHANGE_ATTRIBUTE`).
   Valeurs attendues : identifiants d'items, en plusieurs valeurs ou séparés par des virgules, ex. `"SKU-M,SKU-L"`.
   - *Same model* : articles ayant le même `product_id` (choix taille / couleur).
   - *Different model* : les autres articles listés.
3. **Création de la commande d'échange** : `POST /orders` (id `EXC-<commande>-<suffixe>`, type `ffs` par défaut,
   `information.order_kind = exchange`, commande d'origine et articles retournés dans `information`).

Features lues sur les items : `name`, `color`, `size`, `price`, `image_url` et l'attribut d'échange.

## Architecture

- `server/onestock.ts` : client OneStock (login + token en cache), mapping des données, routes `/api/*`.
- `server/db.ts` : lecture de la table `settings`, écriture dans `api_logs`.
- `api/*.ts` : fonctions Vercel exposant ces routes en production.
- `vite.config.ts` : middleware qui sert les mêmes routes en `npm run dev`.
- `server/session.ts` : vérification de la signature d'extension, sessions.
- `services/extension.ts` : contexte d'ouverture OneStock (URL, postMessage, resize).
- `services/api.ts` : appels depuis le front.

Les identifiants OneStock restent côté serveur (jamais exposés au navigateur).

## Ouverture en tant qu'extension OneStock (UI Extensibility)

À l'ouverture, OneStock charge l'app dans une iframe avec les paramètres d'URL `extension_id`, `user_id`,
`site_id`, `lang`, `timezone`, `locale`, `parent_url`, `injection_point_path`, `host_app`.

1. L'app envoie `extension_ready` à `parent_url` (`services/extension.ts`).
2. OneStock répond `onestock_data` (`order_id` / `order_ids`, `extension_signature`…) : seuls les messages
   dont l'origine est `parent_url` sont acceptés.
3. Le contexte est envoyé à `POST /api/session`, qui vérifie la signature HMAC-SHA256
   (`t=<ts>,h0=…,h1=…,h2=…` sur `"<ts>.<extension_id>##<user_id>"`, 6 h max, rotation des clés)
   avec `ONESTOCK_EXTENSION_SECRETS`, puis renvoie un jeton de session (1 h) envoyé en `Authorization: Bearer`.
4. Le `site_id` de la session remplace `ONESTOCK_SITE_ID` (settings, logs, appels OneStock) et la commande
   `order_id` est chargée directement.
5. La hauteur de l'iframe est ajustée via `extension_resize`.

Diagnostic : `GET /api/health` (mode mock ou OneStock, site, URL d'API, identifiants présents, base, logs —
aucune valeur secrète). La console du navigateur affiche le contexte et `onestock_data` reçus (`[extension]`).

Sans `ONESTOCK_EXTENSION_SECRETS`, l'app reste utilisable en autonome (formulaire de recherche de commande).

## Base de données (settings / api_logs)

Connexion via `DATABASE_URL` (ou `POSTGRES_URL`). Paramètres lus dans la table `settings`
pour `environment = APP_ENVIRONMENT` (défaut `qualif`) et `extension_id` = `exchange` ou `*`.
Une ligne avec `site_id` (= `ONESTOCK_SITE_ID`) l'emporte sur la ligne globale, et `exchange` sur `*` :

| key | effet |
| --- | --- |
| `onestock_api_root` | URL de l'API OneStock (prioritaire sur `ONESTOCK_API_URL`, `/v3` ajouté si absent) |
| `default_lang` | langue des features items (défaut `fr`) |
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
