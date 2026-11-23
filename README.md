# Nomore Music — site + admin pour Vercel

Admin : https://nomoremusic.fr/admin  (mot de passe = variable ADMIN_PASSWORD)

## Mise en ligne (une seule fois)
1. Mets ce dossier sur GitHub (nouveau dépôt privé), puis sur vercel.com : *Add New → Project → Import*.
   (ou, avec le terminal : `npx vercel` dans le dossier). Framework : *Other*, aucune commande de build.
2. Dans le projet : *Storage → Create Database → Blob*, accès **Public**, puis *Connect Project*.
   Vercel ajoute tout seul la variable `BLOB_READ_WRITE_TOKEN`.
3. *Settings → Environment Variables* : ajoute `ADMIN_PASSWORD` = le mot de passe de ton choix
   (si tu ne la définis pas, l'ancien mot de passe du dashboard fonctionne).
   Optionnel : `ADMIN_SECRET` = une longue phrase aléatoire (signature de la session).
4. *Deployments → Redeploy* pour que les variables soient prises en compte.
5. *Settings → Domains* : ajoute `nomoremusic.fr` et configure le DNS comme indiqué.

## Utilisation
- /admin : agenda, galerie, unreleased, discographie, références. Chaque modification est enregistrée
  immédiatement et visible sur le site dès le prochain chargement de la page (aucun cache, aucune republication).
- Au tout premier lancement, le contenu affiché est celui de `data-static.js` (contenu de secours) ; il est
  enregistré dans la base dès ta première modification. `/data.js` est généré à chaque visite depuis la base.
- Fichiers envoyés : images et audio jusqu'à 40 Mo, stockés dans Vercel Blob.

## Formulaire de contact
formsubmit.co → hi@nomoremusic.fr. Au premier envoi, clique sur le mail d'activation reçu.

## Contenu du dossier
index.html · contact.html · admin.html · 404.html · data-static.js · i18n.js · nomore-db.js (pont site ↔ API) ·
api/ (login, session, data, db, upload) · lib/ · assets/ · audio/ · vercel.json · package.json
