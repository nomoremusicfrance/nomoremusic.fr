# Nomore Music — site + admin pour Vercel

Site : https://nomoremusic.fr — Admin : https://nomoremusic.fr/admin

## 1. Envoyer le projet sur GitHub (attention : 154 fichiers)
L'envoi par navigateur sur GitHub est limité à **100 fichiers à la fois** : les dossiers `api/` et `lib/`
peuvent alors manquer et Vercel affiche « The pattern 'api/*.js' … doesn't match any Serverless Functions ».
Solutions fiables :
- **GitHub Desktop** (ou `git`) : « Add local repository » sur le dossier, commit, push — aucune limite.
- ou **sans GitHub** : dans le dossier, `npx vercel` (puis `npx vercel --prod`).
- ou par navigateur, en plusieurs envois : (1) tous les fichiers à la racine + `api/` + `lib/`,
  (2) `assets/` en deux fois, (3) `audio/`. Vérifie ensuite sur GitHub que `api/` contient 7 fichiers
  (data-js.js, data.js, db.js, login.js, logout.js, session.js, upload.js) et `lib/` 3 fichiers
  (auth.js, db.js, store.js).

## 2. Déployer sur Vercel
1. vercel.com → *Add New → Project → Import* le dépôt. Framework : **Other**, aucune commande de build.
2. Dans le projet : *Storage → Create Database → Blob*, accès **Public**, *Connect Project*
   (Vercel ajoute `BLOB_READ_WRITE_TOKEN`).
3. *Settings → Environment Variables* : `ADMIN_PASSWORD` = ton mot de passe
   (sans elle, l'ancien mot de passe du dashboard fonctionne). Optionnel : `ADMIN_SECRET` = longue phrase aléatoire.
4. *Deployments → Redeploy*, puis *Settings → Domains* : ajoute `nomoremusic.fr`.

## 3. Utilisation de l'admin
- /admin : agenda, galerie, unreleased, discographie, références. Chaque modification est enregistrée
  tout de suite et visible sur le site au prochain chargement (aucun cache, aucune republication).
- Tant que rien n'est enregistré, le site affiche `data.js` (contenu de départ) ; la base le remplace
  dès la première modification.
- Si l'API est indisponible, le site se rabat automatiquement sur `data.js` : il reste visible.
- Fichiers envoyés : images et audio jusqu'à 40 Mo, stockés dans Vercel Blob.

## 4. Formulaire de contact
formsubmit.co → hi@nomoremusic.fr. Au premier envoi, clique sur le mail d'activation reçu.

## Contenu
index.html · contact.html · admin.html · 404.html · data.js · i18n.js · nomore-db.js (pont site ↔ API) ·
api/ (data-js, data, db, login, logout, session, upload) · lib/ (auth, db, store) · assets/ · audio/ ·
vercel.json · package.json · robots.txt · sitemap.xml · favicons
