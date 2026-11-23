# Nomore Music — site + admin pour Vercel

Site : https://nomoremusic.fr — Admin : https://nomoremusic.fr/admin

## 1. Envoyer le projet sur GitHub (attention : 154 fichiers)
L'envoi par navigateur sur GitHub est limité à **100 fichiers à la fois** : les dossiers `api/` et `lib/`
peuvent alors manquer et Vercel affiche « The pattern 'api/*.js' … doesn't match any Serverless Functions ».
Solutions fiables :
- **GitHub Desktop** (ou `git`) : « Add local repository » sur le dossier, commit, push — aucune limite.
- ou **sans GitHub** : dans le dossier, `npx vercel` (puis `npx vercel --prod`).
- ou par navigateur, en plusieurs envois : (1) tous les fichiers à la racine + `api/` + `lib/`,
  (2) `assets/` en deux fois, (3) `audio/`. Vérifie ensuite sur GitHub que `api/` contient 9 fichiers
  (contact.js, data-js.js, data.js, db.js, login.js, logout.js, messages.js, session.js, upload.js) et `lib/` 3 fichiers
  (auth.js, db.js, store.js).

## 2. Déployer sur Vercel
1. vercel.com → *Add New → Project → Import* le dépôt. Framework : **Other**, aucune commande de build.
2. Dans le projet : *Storage → Create Database → Blob*, accès **Public**, *Connect Project*
   (Vercel crée soit `BLOB_READ_WRITE_TOKEN`, soit — connexion OIDC — `BLOB_STORE_ID` ou `<PRÉFIXE>_STORE_ID`, par exemple `NOMORE_STORE_ID` :
   le site gère les deux. Le stockage doit être connecté à l'environnement *Production*. Aucun stockage de secours : sans Blob, l'admin affiche une erreur.)
3. *Settings → Environment Variables* : `ADMIN_PASSWORD` = ton mot de passe
   (sans elle, l'ancien mot de passe du dashboard fonctionne). `ADMIN_SECRET` = longue phrase aléatoire : signe la connexion et chiffre les messages
   du formulaire (au moins l'une des deux variables est obligatoire ; ne changez pas `ADMIN_SECRET` après coup, les anciens messages deviendraient illisibles).
4. *Deployments → Redeploy*, puis *Settings → Domains* : ajoute `nomoremusic.fr`.

## 3. Utilisation de l'admin
- /admin : agenda, galerie, unreleased, discographie, références. Chaque modification est enregistrée
  tout de suite et visible sur le site au prochain chargement (aucun cache, aucune republication).
- Tant que rien n'est enregistré, le site affiche `data.js` (contenu de départ) ; la base le remplace
  dès la première modification.
- Si l'API est indisponible, le site se rabat automatiquement sur `data.js` : il reste visible.
- Fichiers envoyés : images et audio jusqu'à 40 Mo, stockés dans Vercel Blob.

## 4. Formulaire de contact
Chaque demande est **d'abord enregistrée** (onglet **Messages** de /admin : rien n'est jamais perdu), puis envoyée
par e-mail à hi@nomoremusic.fr :
- par défaut via FormSubmit : au tout premier envoi, FormSubmit envoie un mail d'activation à hi@nomoremusic.fr
  → clique sur le lien (vérifie les spams), ensuite les notifications arrivent ;
- option plus fiable : crée un compte gratuit sur resend.com, copie la clé API et ajoute dans Vercel
  `RESEND_API_KEY` (et `CONTACT_TO` si l'adresse de réception change). Redéploie.
Dans l'admin, un message marqué « E-mail de notification non envoyé » est bien enregistré mais l'e-mail n'est pas parti.

## Contenu
index.html · contact.html · admin.html · 404.html · data.js · i18n.js · nomore-db.js (pont site ↔ API) ·
api/ (contact, data-js, data, db, login, logout, messages, session, upload) · lib/ (auth, db, store) · assets/ · audio/ ·
vercel.json · package.json · robots.txt · sitemap.xml · favicons
