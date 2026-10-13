# Skools — Matrice d'accès par rôle (source de vérité)

> Transmise le 2026-10-13. Référence pour la navigation, les guards frontend ET backend.
> Statut d'implémentation (Phase 6) en fin de document. Le reste est parqué (Phase 7+).

## Contexte général

- Application SaaS de gestion scolaire multi-établissements.
- Un utilisateur appartient à UN SEUL établissement (pas de sélecteur d'établissement).
- Le parcours : Landing → Register → Création établissement → Dashboard.
- Le créateur d'un établissement devient automatiquement DIRECTOR.
- Interface en français.
- 9 rôles : SUPER_ADMIN, DIRECTOR, ADMIN, CENSEUR, BIBLIOTECAIRE, SURVEILLANT, TEACHER, STUDENT, PARENT.

## Règles transverses (valables pour tous les rôles)

1. La sidebar affiche uniquement les entrées autorisées pour le rôle. On masque, on ne grise pas.
2. "Vue d'ensemble" est toujours la première entrée, pour tous les rôles sauf SUPER_ADMIN (qui a "Vue d'ensemble plateforme").
3. "Profil" est toujours présent en bas de la sidebar, pour tous les rôles.
4. "Paramètres" n'est présent que pour DIRECTOR, ADMIN, SUPER_ADMIN, CENSEUR.
5. Le header contient : Logo + Nom de l'établissement (sauf SUPER_ADMIN qui n'a pas d'établissement), sélecteur d'année scolaire active (sauf SUPER_ADMIN), cloche de notifications, avatar avec nom et rôle.
6. Le sélecteur d'année scolaire est toujours visible pour tous les rôles sauf SUPER_ADMIN.
7. Pour PARENT et STUDENT, la navigation est filtrée par enfant / par élève.
8. Pour TEACHER, la navigation est filtrée par ses classes et ses matières assignées.
9. Aucun rôle ne voit d'entrée de menu vers un module non implémenté.
10. Les permissions sont un set explicite par rôle (aucun / lecture / écriture), pas une hiérarchie.

## Rôle SUPER_ADMIN

Portée : plateforme entière (pas un établissement).
Header : Logo Skools + cloche notifications + avatar (rôle affiché = Super Admin). PAS de nom d'établissement. PAS de sélecteur d'année scolaire.

Sidebar : Vue d'ensemble plateforme, Établissements, Utilisateurs globaux, Statistiques, Paramètres système, Profil.

Accès : créer/lire/modifier/désactiver des établissements et utilisateurs globaux, statistiques plateforme, paramètres système, impersonation (journalisée).

Ne voit JAMAIS : les données pédagogiques d'un établissement hors impersonation ; les entrées "Année scolaire", "Personnes", "Pédagogie", "Vie scolaire".

## Rôle DIRECTOR

Portée : son établissement, tous les modules.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Directeur).

Sidebar : Vue d'ensemble, Année scolaire (Structure : cycles, niveaux, séries, classes ; Matières & périodes ; Emplois du temps), Personnes (Élèves, Enseignants, Parents), Inscriptions, Pédagogie (Examens & notes, Bulletins, Affectations enseignants), Vie scolaire (Présences, Discipline), Administration (Utilisateurs & rôles, Paramètres établissement), Profil.

Accès : CRUD complet académique, personnes, inscriptions, examens/notes (unitaire + bulk, absent), bulletins, EDT, présences, discipline, affectations, liaisons parents ↔ élèves, utilisateurs & rôles de son établissement, paramétrage.

Ne voit JAMAIS : données d'un autre établissement ; modules plateforme.

## Rôle ADMIN (secrétariat / administration)

Portée : son établissement, modules administratifs et structure. PAS la pédagogie sensible.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Admin).

Sidebar : Vue d'ensemble, Année scolaire (Structure, Matières & périodes, Emplois du temps), Personnes (Élèves, Enseignants, Parents), Inscriptions, Vie scolaire (Présences en consultation), Paramètres établissement, Profil.

Accès : CRUD élèves/enseignants/parents, inscriptions, structure académique, EDT, lecture des présences, liaisons parents ↔ élèves, paramétrage administratif.

Ne voit JAMAIS : Examens & notes (sauf consultation si autorisé), Bulletins, Affectations enseignants, Discipline (sauf consultation si autorisé), Administration des utilisateurs & rôles.

## Rôle CENSEUR

Portée : son établissement, supervision pédagogique et vie scolaire.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Censeur).

Sidebar : Vue d'ensemble (suivi des classes), Pédagogie (Examens & notes supervision, Bulletins, Affectations enseignants), Emplois du temps (édition), Vie scolaire (Présences supervision, Discipline), Élèves (consultation), Paramètres, Profil.

Accès : supervision examens/notes/bulletins, CRUD affectations, CRUD EDT, supervision présences, CRUD discipline, lecture élèves, paramétrage pédagogique si autorisé.

Ne voit JAMAIS : Inscriptions (création/modification), CRUD élèves/enseignants/parents, structure académique en écriture, administration utilisateurs & rôles, modules plateforme.

## Rôle BIBLIOTECAIRE

Portée : son établissement, module bibliothèque uniquement (à venir).
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Bibliothécaire).

Sidebar : Vue d'ensemble, Catalogue, Emprunts & retours, Élèves (consultation limitée), Profil.

Accès : CRUD catalogue et emprunts/retours, lecture limitée des élèves.

Ne voit JAMAIS : pédagogie, présences, discipline, inscriptions, structure, personnes (enseignants/parents), administration, paramètres.

## Rôle SURVEILLANT

Portée : son établissement, vie scolaire terrain uniquement.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Surveillant).

Sidebar : Vue d'ensemble (appel du jour, incidents récents), Vie scolaire (Présences appel, Discipline), Emplois du temps (consultation), Élèves (consultation), Profil.

Accès : CRUD présences (appel + bulk), CRUD discipline, lecture EDT, lecture élèves.

Ne voit JAMAIS : notes/examens/bulletins, inscriptions, structure, personnes (enseignants/parents), affectations, administration, paramètres.

## Rôle TEACHER

Portée : son établissement, ses classes et ses matières uniquement.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Enseignant).

Sidebar : Vue d'ensemble (mes classes du jour, notes à saisir, appel à faire), Mes classes (dynamique), Saisie de notes (raccourci), Faire l'appel (raccourci), Mon emploi du temps, Profil.

Accès : lecture classes/matières/élèves assignés, CRUD notes de ses matières/classes (unitaire + bulk, absent), CRUD présences de ses classes, lecture EDT et affectations.

Ne voit JAMAIS : classes/matières non assignées, notes/présences des autres, bulletins (sauf si autorisé), inscriptions, structure, personnes (listes globales), discipline (sauf observation si autorisé), administration, paramètres.

## Rôle STUDENT — à venir

Portée : son propre parcours uniquement.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Élève).

Sidebar : Vue d'ensemble, Mon emploi du temps, Mes notes, Mes absences, Mon bulletin, Ma discipline, Profil.

Accès : lecture EDT, notes, absences/retards, bulletin, fiches disciplinaires — les siens uniquement.

Ne voit JAMAIS : données des autres élèves, toute écriture, toute entrée administrative ou de gestion.

## Rôle PARENT

Portée : ses enfants uniquement. Navigation filtrée par enfant.
Header : Logo + Nom établissement + sélecteur d'année scolaire + cloche + avatar (Parent) + SÉLECTEUR D'ENFANT (si plusieurs enfants).

Sidebar : Vue d'ensemble (résumé par enfant), Mes enfants (dynamique), Notes & bulletins, Absences, Discipline, Emploi du temps, Profil.

Accès : lecture notes/bulletins/absences/discipline/EDT de ses enfants, liste de ses enfants.

Ne voit JAMAIS : données d'autres enfants, toute écriture, toute entrée administrative ou de gestion, listes globales.

## Récapitulatif des accès par module

| Module | SUPER_ADMIN | DIRECTOR | ADMIN | CENSEUR | BIBLIO | SURVEILLANT | TEACHER | STUDENT | PARENT |
|---|---|---|---|---|---|---|---|---|---|
| Établissements (plateforme) | Écriture | — | — | — | — | — | — | — | — |
| Utilisateurs globaux | Écriture | — | — | — | — | — | — | — | — |
| Statistiques plateforme | Lecture | — | — | — | — | — | — | — | — |
| Paramètres système | Écriture | — | — | — | — | — | — | — | — |
| Structure académique | — | Écriture | Écriture | Lecture | — | — | — | — | — |
| Matières & périodes | — | Écriture | Écriture | Lecture | — | — | — | — | — |
| Emplois du temps | — | Écriture | Écriture | Écriture | — | Lecture | Lecture | Lecture | Lecture |
| Élèves (CRUD) | — | Écriture | Écriture | Lecture | Lecture limitée | Lecture | — | — | — |
| Enseignants (CRUD) | — | Écriture | Écriture | — | — | — | — | — | — |
| Parents (CRUD) | — | Écriture | Écriture | — | — | — | — | — | — |
| Inscriptions | — | Écriture | Écriture | — | — | — | — | — | — |
| Examens & notes | — | Écriture | — | Lecture/supervision | — | — | Écriture (ses classes) | Lecture | Lecture |
| Bulletins | — | Écriture | — | Écriture | — | — | — | Lecture | Lecture |
| Affectations enseignants | — | Écriture | — | Écriture | — | — | Lecture | — | — |
| Présences | — | Écriture | Lecture | Lecture/supervision | — | Écriture | Écriture (ses classes) | Lecture | Lecture |
| Discipline | — | Écriture | — | Écriture | — | Écriture | — | Lecture | Lecture |
| Liaisons parent ↔ élève | — | Écriture | Écriture | — | — | — | — | — | Lecture |
| Utilisateurs & rôles (étab.) | — | Écriture | — | — | — | — | — | — | — |
| Paramètres établissement | — | Écriture | Écriture | — | — | — | — | — | — |
| Catalogue bibliothèque | — | — | — | — | Écriture | — | — | — | — |
| Emprunts & retours | — | — | — | — | Écriture | — | — | — | — |

## Règles de génération de la sidebar

1. Générée depuis cette matrice. Aucune entrée codée en dur par page.
2. Chaque rôle a sa propre configuration.
3. Entrées ordonnées par fréquence d'usage réel.
4. Groupes visuellement séparés.
5. Maximum 6–7 entrées de premier niveau par rôle.
6. Maximum un niveau de sous-menu.
7. Chaque entrée a une icône et un libellé.
8. Badge numérique possible (ex : Discipline (3)).
9. Module non autorisé = entrée absente, jamais grisée.
10. "Vue d'ensemble" toujours première.
11. "Profil" toujours dernier.
12. "Paramètres" uniquement SUPER_ADMIN, DIRECTOR, ADMIN, CENSEUR.

## Règles de génération du header

1. De gauche à droite : Logo + Nom établissement (sauf SUPER_ADMIN), sélecteur d'année scolaire (sauf SUPER_ADMIN), cloche, avatar + nom + rôle, sélecteur d'enfant pour PARENT.
2. Le sélecteur d'année ne disparaît jamais.
3. Rôle explicite dans le menu utilisateur.
4. Pas plus de 4 zones fonctionnelles, pas de fil d'Ariane.

## Règles de protection des routes

1. Chaque route est protégée par des permissions explicites.
2. Route non autorisée → "Vue d'ensemble" du rôle.
3. Route inexistante → 404 dédiée.
4. Permissions vérifiées côté frontend ET backend.
5. Le JWT contient : userId, email, establishmentId, role.
6. Les permissions ne sont pas dans le JWT.

---

## Statut d'implémentation — Phase 6 (2026-10-13)

**Fait :**
- `Roles` + `RolesGuard` backend ; matrice appliquée par controller (lecture/écriture distinguées par méthode).
- Module `user-establishments` (DIRECTOR) : membres, ajout (règle un-seul-établissement), rôle (pas d'auto-rétrogradation), retrait (sauf soi-même).
- `GET /parent-students/my-children` (PARENT), `GET /students/me` (STUDENT).
- Contrôles de périmètre : `GET /report-cards/student` (parent → ses enfants, élève → lui-même), `GET /discipline?studentId=` et `GET /attendances` (enfant/élève inscrit), `PARENT`/`STUDENT` exclus des écritures et listes globales sensibles.
- Frontend : `lib/permissions.ts` (labels FR + `NAV_BY_ROLE` sur routes existantes), sidebar filtrée + Profil systématique, `RequireRole` (→ `/dashboard`), sélecteur d'année active + nom d'établissement dans la sidebar (idiome EPL, pas de topbar desktop), pages Profil et Paramètres établissement.
- Adaptations assumées : vues "Mes X" filtrées (TEACHER/PARENT/STUDENT) non implémentées — la nav pointe vers les vues existantes compatibles (ex. bulletin élève) et le backend refuse le hors-périmètre ; TEACHER en lecture globale (périmètre par assignation = Phase 7) ; CENSEUR/ADMIN en lecture sur pages mixtes (écritures refusées 403) ; cloche de notifications sans backend.

**Parqué (Phase 7+) :**
- Espace plateforme SUPER_ADMIN (Établissements, Utilisateurs globaux, Statistiques, Paramètres système, impersonation).
- Module bibliothèque (Catalogue, Emprunts) ; BIBLIOTECAIRE réduit à Vue d'ensemble + Profil (règle 9).
- Périmètre fin par assignation/enfant (TEACHER : ses classes ; vues "Mes notes/absences/discipline/EDT" ; sélecteur d'enfant).
- Page "Utilisateurs & rôles" (backend prêt).
- Notifications (cloche).
- Topbar desktop complète (l'idiome EPL sidebar est conservé ; nom d'établissement + année active vivent dans la sidebar).
