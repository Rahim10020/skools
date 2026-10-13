# Skools — Reste à faire (post Phase 6)

> Consolidé le 2026-10-13, après merge de `phase-6-durcissement` dans `dev` (880397a).
> Sources : `docs/access-matrix.md` (parqué Phase 7+), résumés de phases, dette relevée en cours de route.
> Priorités suggérées en fin de document.

## 0. Vérifications post-merge (court terme, avant d'annoncer `dev` stable)

- [ ] `pnpm exec turbo build` sur `dev` (contenu identique au fast-forward, à confirmer).
- [ ] Tour manuel au clic dans le navigateur : login → dashboard → une page référentiel → saisie de notes → déconnexion/reconnexion (jamais testé au clic : tout a été validé en curl + build + smoke HTTP).
- [ ] Décider du sort des données dev : compte `phase4-test@skools.test` + « École Test Phase 4 » (nettoyer ou garder comme fixtures).

## 1. Vues filtrées par rôle (« Mes X ») — le plus gros morceau restant

Contexte : le backend refuse le hors-périmètre (403), mais les vues dédiées n'existent pas encore. Les rôles concernés voient une nav réduite ou des 403 là où la matrice promet du filtré.

- [ ] **TEACHER** : Mes classes (liste dynamique depuis `GET /teacher-assignments`), Saisie de notes et Appel restreints à ses classes/matières (filtrage par assignation dans les services `grades`, `attendances`, `students` — backend), Mon emploi du temps filtré.
- [ ] **PARENT** : sélecteur d'enfant dans la sidebar (règle header matrice ; `GET /parent-students/my-children` existe déjà), puis Notes & bulletins / Absences / Discipline / Emploi du temps filtrés par enfant.
- [ ] **STUDENT** : Mon emploi du temps, Mes notes, Mes absences, Mon bulletin, Ma discipline (lecture de son dossier via `GET /students/me` qui existe déjà).
- [ ] Périmètre fin enseignant côté backend : filtrer les lectures par assignation (aujourd'hui lecture globale documentée comme écart).

## 2. Pages manquantes de la matrice

- [ ] **Utilisateurs & rôles** (DIRECTOR) : lister, ajouter, changer le rôle, retirer — backend prêt (`GET/POST/PATCH/DELETE /user-establishments`, testé live).
- [ ] **Onboarding compte → dossier** : aucun endpoint ne lie un `userId` à un dossier parent/élève/enseignant à la création (contourné en SQL pendant les tests). Prévoir `userId` optionnel dans les DTOs de création + garde-fous.
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

## 6. Rôles : finitions

- [ ] Modes lecture seule dans les pages mixtes : masquer/désactiver les boutons d'écriture pour CENSEUR (structure), ADMIN (présences), TEACHER (affectations) au lieu de laisser le backend répondre 403.
- [ ] Décision topbar desktop : la matrice décrit un header complet (logo + établissement + année + cloche + avatar) ; l'idiome EPL sidebar est conservé (nom + année dans la sidebar). Trancher avant d'empiler d'autres éléments de header.
- [ ] Badge numérique sur entrée sidebar (ex. Discipline (3)) — prévu par la matrice, règle 8.

## 7. Fonctionnel mineur (contrats supportés, UI incomplète)

- [ ] Saisie de l'**appréciation** dans la page Notes (`CreateGradeDto.appreciation` ignoré).
- [ ] Filtre **période** dans les bulletins (`periodId` optionnel côté API, non exposé).
- [ ] Édition du **statut d'inscription** : présent via CrudPage (rappel : doublon élève+année = 409).

## 8. Sécurité & déploiement (bloquant avant exposition)

- [ ] `JWT_SECRET` : valeur par défaut en dur (`skools-super-secret-change-me` dans `jwt.strategy.ts` et `auth.service.ts`) — passer par variable d'environnement obligatoire, refuser le démarrage sans elle.
- [ ] CORS : limité à `http://localhost:5173` (`main.ts`) — configurer par environnement.
- [ ] Revoir `POST /establishments` ouvert à tout authentifié (voulu pour l'onboarding, à confirmer).
- [ ] Rate limiting auth (login/register) : absent.

## 9. Dette technique & qualité

- [ ] Chunk JS ~648 kB : code-splitting (`React.lazy` par route).
- [ ] Accessibilité : nom accessible de la case « Absent » (appel), contraste des liens `common-blue` (~4.0, limite), audit clavier complet des modales/selects.
- [ ] Responsive : cellules `px-p6` lourdes sur 360 px (scroll-x en place, à alléger si besoin).
- [ ] Tests : 1 test api, 0 test web. Ajouter au minimum : permissions matrix (unitaires backend `RolesGuard` + `canAccess`), parcours auth, calcul bulletin.
- [ ] Icône material `SettingsIcon` retirée du barrel (inutilisée, remplacée par `SettingsNavIcon` ; source EPL intacte).
- [ ] `todo.txt` à la racine mentionne encore le bug notes/présences (corrigé Phases 5c/5d) — à mettre à jour ou archiver.

## Ordre suggéré

1. §0 (vérifications, 1 h).
2. §8 sécurité (avant toute démo externe).
3. §2 Utilisateurs & rôles + onboarding (rend la matrice utilisable au quotidien).
4. §1 vues TEACHER (le rôle le plus actif après la direction).
5. §1 vues PARENT/STUDENT, §6 finitions, §4 bibliothèque, §3 plateforme, §5 notifications.
