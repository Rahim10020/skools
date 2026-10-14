# Skools — Reste à faire (post Phase 6)

> Consolidé le 2026-10-13, après merge de `phase-6-durcissement` dans `dev` (880397a).
> Sources : `docs/access-matrix.md` (parqué Phase 7+), résumés de phases, dette relevée en cours de route.
> Priorités suggérées en fin de document.

## 0. Vérifications post-merge (court terme, avant d'annoncer `dev` stable)

- [x] `pnpm exec turbo build` sur `dev` (api + web verts, lots 1–5).
- [ ] Tour manuel au clic dans le navigateur : login → dashboard → une page référentiel → saisie de notes → déconnexion/reconnexion (jamais testé au clic : tout a été validé en curl + build + smoke HTTP).
- [ ] Décider du sort des données dev : compte `phase4-test@skools.test` + « École Test Phase 4 » (nettoyer ou garder comme fixtures).

## 1. Vues filtrées par rôle (« Mes X ») — FAIT (lots 2–4)

- [x] **TEACHER** : Mes classes (`GET /teacher-assignments/me`), Saisie et Appel restreints à ses classes/matières (scope serveur `teacher-scope.ts`), Mon EDT filtré, dashboard sans listes globales.
- [x] **PARENT** : sélecteur d'enfant (sidebar + persistance `skools-selected-child`), Mes enfants, Notes & bulletins / Absences / Discipline / EDT filtrés par enfant.
- [x] **STUDENT** : Mon EDT, Mes notes (`GET /grades?studentId=`), Mes absences (`GET /attendances/student`), Mon bulletin, Ma discipline.
- [x] Périmètre fin enseignant côté backend : lectures/écritures `grades`, `exams`, `attendances`, `schedules`, `enrollments` filtrées par assignation (403 hors périmètre).

## 2. Pages manquantes de la matrice — FAIT (lots 1–2)

- [x] **Utilisateurs & rôles** (DIRECTOR) : lister, ajouter, changer le rôle, retirer — page `/users`.
- [x] **Onboarding compte → dossier** : `userId` optionnel dans les DTOs élèves/enseignants/parents + garde-fous (`family-scope`/`dossier-user-link`), `GET /teachers/me` + `GET /parents/me`.
- [ ] **Paramètres** : page existante ; il manque les paramètres pédagogiques (périodes, barèmes) et système.

## 3. Espace plateforme SUPER_ADMIN (parqué)

- [ ] Pages : Établissements, Utilisateurs globaux, Statistiques plateforme, Paramètres système, Vue d'ensemble plateforme.
- [ ] Impersonation journalisée (accès technique exceptionnel).
- [ ] À ce jour SUPER_ADMIN est refusé sur tous les controllers d'établissement et ne voit que Tableau de bord + Profil.

## 4. Module bibliothèque (parqué, BIBLIOTECAIRE réduit à Vue d'ensemble + Profil)

- [ ] Catalogue (livres, ouvrages, exemplaires) : modèle Prisma + CRUD + UI.
- [ ] Emprunts & retours : modèle + CRUD + UI.
- [ ] Élèves en consultation limitée pour les emprunts.

## 5. Notifications (cloche)

- [ ] Backend : modèle + endpoints (notifications par événement : note publiée, incident, inscription…).
- [ ] Frontend : cloche dans la sidebar/header avec compteur + panneau.

## 6. Rôles : finitions — FAIT sauf badge (lot 5)

- [x] Modes lecture seule dans les pages mixtes : `CrudPage.readOnly` + pages custom (CENSEUR structure/examens/notes/présences, ADMIN présences, TEACHER affectations, SURVEILLANT EDT, famille discipline/EDT).
- [x] Décision topbar desktop : tranché — idiome EPL sidebar conservé (nom + année + enfant dans la sidebar).
- [ ] Badge numérique sur entrée sidebar (ex. Discipline (3)) — prévu par la matrice, règle 8.

## 7. Fonctionnel mineur — FAIT (lot 5)

- [x] Saisie de l'**appréciation** dans la page Notes (colonne + envoi bulk).
- [x] Filtre **période** dans les bulletins (`periodId` exposé, `GET /periods` ouvert aux rôles établissement).
- [x] Édition du **statut d'inscription** : présent via CrudPage (rappel : doublon élève+année = 409).

## 8. Sécurité & déploiement — FAIT sauf rate limiting (lots 1+5)

- [x] `JWT_SECRET` : fail-fast au démarrage sans la variable (`auth.module`, `jwt.strategy`, `auth.service`).
- [x] CORS : `FRONTEND_URL` par environnement (liste séparée par virgules).
- [x] `GET /establishments` restreint au sien ; `GET/PATCH/DELETE /:id` 403 hors établissement ; `GET /:id` ouvert à CENSEUR (lecture Paramètres).
- [x] `POST /establishments` ouvert à tout authentifié (voulu pour l'onboarding, confirmé).
- [ ] Rate limiting auth (login/register) : absent.

## 9. Dette technique & qualité

- [x] Chunk JS ~648 kB → 298 kB : code-splitting (`React.lazy` par route, lot 5).
- [ ] Accessibilité : nom accessible de la case « Absent » (appel), contraste des liens `common-blue` (~4.0, limite), audit clavier complet des modales/selects.
- [ ] Responsive : cellules `px-p6` lourdes sur 360 px (scroll-x en place, à alléger si besoin).
- [ ] Tests : 1 test api, 0 test web. Ajouter au minimum : permissions matrix (unitaires backend `RolesGuard` + `canAccess`), parcours auth, calcul bulletin.
- [x] Icône material `SettingsIcon` retirée du barrel (déjà absent de `icons/index.ts`).
- [x] `todo.txt` mis à jour (bug notes/présences marqué résolu, lots 1–4).

## Ordre suggéré

1. §0 (vérifications, 1 h).
2. §8 sécurité (avant toute démo externe).
3. §2 Utilisateurs & rôles + onboarding (rend la matrice utilisable au quotidien).
4. §1 vues TEACHER (le rôle le plus actif après la direction).
5. §1 vues PARENT/STUDENT, §6 finitions, §4 bibliothèque, §3 plateforme, §5 notifications.
