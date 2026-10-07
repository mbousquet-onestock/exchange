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
- `api/*.ts` : fonctions Vercel exposant ces routes en production.
- `vite.config.ts` : middleware qui sert les mêmes routes en `npm run dev`.
- `services/api.ts` : appels depuis le front.

Les identifiants OneStock restent côté serveur (jamais exposés au navigateur).

## Lancer en local

1. `npm install`
2. Copier `.env.example` en `.env.local` et renseigner `ONESTOCK_SITE_ID`, `ONESTOCK_USER_ID`, `ONESTOCK_PASSWORD`.
   Sans identifiants, le portail tourne sur des données mock (commande `DEMO-0001`).
3. `npm run dev` puis ouvrir `http://localhost:3000/?order=<id commande>&email=<email client>`
   (ou saisir le numéro de commande dans le formulaire).

Sur Vercel, définir les mêmes variables d'environnement dans les paramètres du projet.
