# Contrats frontend ↔ API — état de référence (Phase 0, amendé Phase 6)

> Gelé le 2026-10-13. Source : `apps/api/src/**/*.controller.ts`, `dto/*.ts`, `main.ts`, `prisma/schema.prisma`.
> Règle : le frontend s'adapte aux contrats ci-dessous. Modifications `apps/api` autorisées depuis la Phase 6 (matrice `docs/access-matrix.md`).
> Base URL dev : `http://localhost:3000/api/v1` (CORS autorise `FRONTEND_URL`, défaut `http://localhost:5173`).
> Auth : `Authorization: Bearer <accessToken>`. Global : `ValidationPipe { whitelist, forbidNonWhitelisted, transform }`
> → **tout champ non déclaré dans le DTO = 400**. `:id` = UUID (`ParseUUIDPipe` → 400 si non-UUID).
> **Rôles (Phase 6) : `JwtAuthGuard + RolesGuard` sur tous les controllers sauf `auth`.**
> Rôle absent ou non listé → **403** (plus jamais de 403 "impossible" : mapper vers "Action non autorisée pour votre rôle").
> `SUPER_ADMIN` exclu de tous les controllers d'établissement. Voir `docs/access-matrix.md` pour la matrice complète,
> `GET /user-establishments` (DIRECTOR), `GET /parent-students/my-children` (PARENT), `GET /students/me` (STUDENT).

## Auth — `auth`

| Route | Body | Réponse | Erreurs |
|---|---|---|---|
| `POST /auth/register` | `email, firstName (≥2), lastName (≥2), password (≥8)` | `{ user{id,email,firstName,lastName}, accessToken, refreshToken }` — **sans** establishmentId/role | 409 email pris, 400 validation |
| `POST /auth/login` | `email, password (≥8)` | `{ user, establishmentId: string\|null, role: string\|null (= 1er UserEstablishment), accessToken, refreshToken }` | 401 identifiants invalides, 400 |
| `POST /auth/refresh` | `{ refreshToken }` (pas de DTO) | `{ accessToken, refreshToken }` **uniquement** — ne pas écraser `user` avec ça | 401 token invalide/expiré/révoqué |
| `GET /auth/me` | — | `{ id,email,firstName,lastName,phone,avatarUrl,createdAt, establishments:[{role, establishment{id,name,slug}}] }` | 401 (access = 15 min) |
| `POST /auth/logout` | `{ refreshToken? }` optionnel | `{ message }` (révoque ce token, sinon tous) | 401 |

## Establishments — `establishments` (JWT)

| Route | Body | Notes | Erreurs |
|---|---|---|---|
| `POST /establishments` | `name (≥2), slug (≥2), type?: PRIMARY\|COLLEGE\|LYCEE\|MIXED, logoUrl?` | Retourne `{ ...establishment, accessToken, refreshToken }` (rôle forcé DIRECTOR) → **remplacer les tokens du store** | 409 slug pris, 400, 401 |
| `GET /establishments` | — | **Restreint au sien** (isolement matrice) | 401 |
| `GET /:id` | — | DIRECTOR/ADMIN/CENSEUR (lecture, CENSEUR = page Paramètres) ; **403 si autre établissement** | 400/404/403/401 |
| `PATCH /:id` (Partial) | — | DIRECTOR/ADMIN ; **403 si autre établissement** | 400/404/403/401 |
| `DELETE /:id` | — | DIRECTOR, son établissement | 400/404/403/401 |

## Référentiels académiques (JWT, scopés `establishmentId`, CRUD `POST / GET / GET :id / PATCH :id(Partial) / DELETE :id`)

| Préfixe | Create DTO (requis) |
|---|---|
| `academic-years` | `name (≥4, ex "2025-2026"), startDate ISO, endDate ISO, isCurrent?` |
| `cycles` | `name (≥2), order?: int ≥0` |
| `levels` | `cycleId UUID, name (≥1), order?` (400 si cycle hors établissement) |
| `series` | `name (≥1), levelId?: UUID` |
| `subjects` | `name (≥2), code?, description?` |
| `classrooms` | `academicYearId UUID, levelId UUID, seriesId?: UUID, name (≥1), capacity?: int ≥1`. `GET /?search=&levelId=&seriesId=&academicYearId=&page=&limit=` → `{ data, pagination }` paginée ; **sans param → tableau brut** (compat) |
| `periods` | `academicYearId UUID, name (≥2), startDate ISO, endDate ISO, order?` |

> `academic-years` et `periods` : `GET /` et `GET /:id` ouverts à tous les rôles d'établissement (matrice règle 6 : sélecteur d'année visible sauf SUPER_ADMIN ; filtre période des bulletins). Écritures DIRECTOR/ADMIN (CENSEUR lit les années).

## Personnes (JWT)

- `students` CRUD : `firstName (≥2), lastName (≥2), matricule?, gender? ∈ {Masculin, Féminin}, dateOfBirth? ISO, placeOfBirth?, phone?, address?, userId? UUID` (+ `GET /students/me` rôle STUDENT). **Genre en libellés complets** (migration one-off M→Masculin, F→Féminin) ; filtre `gender` tolérant M/F côté service. `userId` = liaison compte → dossier : compte existant, membre actif de l'établissement, rôle STUDENT, non déjà lié (404/400/409 sinon). `GET /students?search=&gender=&classroomId=&academicYearId=&page=&limit=` → `{ data, pagination }` paginée (`total_count, page, page_size, total_pages, has_next, has_previous, skip, limit`) ; **sans param → tableau brut** (compat).
  - `POST /students/bulk` (DIRECTOR/ADMIN) : `{ students: [{ ...CreateStudentDto, classroomName? }], academicYearId? }` → `{ total, created, enrolled, errors: [{ line, message }] }`. Traitement ligne à ligne (une ligne invalide n'annule pas le reste) ; `classroomName` résolu par nom (insensible casse), inscription auto à l'année courante (ou `academicYearId`) ; validation DTO au niveau lot (`gender` doit être un libellé complet).
- `teachers` CRUD : `firstName (≥2), lastName (≥2), matricule?, gender? ∈ {Masculin, Féminin}, phone?, email? (IsEmail), address?, specialty?, userId? UUID` (+ `GET /teachers/me` rôle TEACHER, mêmes garde-fous, rôle attendu TEACHER).
- `parents` CRUD : `firstName (≥2), lastName (≥2), phone?, email?, address?, profession?, userId? UUID` (+ `GET /parents/me` rôle PARENT, mêmes garde-fous, rôle attendu PARENT).
- `user-establishments` (DIRECTOR) : `GET /` (membres actifs), `POST /` (`email, role` sauf SUPER_ADMIN ; 404 compte inconnu, 409 déjà dans un établissement), `PATCH /:id` (`role`, sauf soi-même), `DELETE /:id` (sauf soi-même). `GET /?search=&role=&page=&limit=` (search = prénom/nom/email) → `{ data, pagination }` paginée ; **sans param → tableau brut** (compat).
  - `GET /user-establishments/lookup` (**DIRECTOR/ADMIN**) : `?role=&search=&includeUserId=&excludeLinked=` (pas de param `page`/`limit`) → compte lié + dossier. `excludeLinked` (défaut true) exclut les comptes déjà rattachés à un dossier du rôle demandé (sélecteur `userId`). Renvoie `{ id (membre), role, isActive, user{...} }`.
- `POST /parent-students` : `parentId UUID, studentId UUID, relation?: FATHER\|MOTHER\|GUARDIAN\|OTHER, isPrimary?`. `GET /parent-students/student/:studentId`, `GET /parent-students/parent/:parentId`, `DELETE /:id` (id de la **liaison**). 409 si déjà liés. Pas de PATCH (unlink + re-link).
- `GET /parent-students/my-children` (PARENT) → `[{ id (liaison), student{id,firstName,lastName,matricule}, classroom{id,name}|null (année en cours) }]` (404 si pas de dossier parent lié).
- `GET /grades?studentId=<uuid>` : STUDENT/PARENT (élève imposé : lui-même / ses enfants, 403 sinon ; `studentId` requis, 403 si absent), TEACHER (restreint à ses examens), staff (filtre libre). Inclut `exam{subject{name}}` pour l'affichage.
- `POST /teacher-assignments` : `teacherId, subjectId, classroomId, academicYearId` (tous UUID requis). `GET /` (TEACHER → ses affectations uniquement), `GET /teacher-assignments/me` (TEACHER, « Mes classes », 404 si pas de dossier lié), `DELETE /:id`. 409 si doublon, 400 si FK hors établissement. Pas de PATCH/GET :id.
  - `POST /teacher-assignments/bulk` (**DIRECTOR/CENSEUR**) : `{ teacherId, academicYearId, assignments: [{ subjectId, classroomId }] }` → `{ total, created, errors: [{ index, message }] }`. Validation enseignant/année, erreurs par ligne, unicité composite.
- `POST /enrollments` : `studentId, classroomId, academicYearId (UUID), status?: PENDING\|APPROVED\|REJECTED\|WITHDRAWN, notes?`. CRUD complet. `GET /` et `GET /:id` ouverts à TEACHER filtrés à ses classes assignées (registre d'appel/notes). 409 doublon (student+year). Pas de filtre query — filtrer côté client.
  - `POST /enrollments/bulk` (**DIRECTOR/ADMIN**) : `{ classroomId, academicYearId, studentIds: UUID[] }` → `{ total, created, errors: [{ studentId, message }] }`. Valide classe+année actives, ignore les élèves hors établissement/inactifs et les doublons existants (`student+year`) ; notifie chaque nouvel inscrit + parents liés (lots bornés).

## Évaluations (JWT)

- `exams` CRUD : `academicYearId UUID, subjectId UUID, name (≥2), periodId?, classroomId? (null = multi), type?: INTERROGATION\|DEVOIR\|COMPOSITION\|EXAMEN\|AUTRE (défaut DEVOIR), examDate? ISO, maxScore? (défaut 20), coefficient? (défaut 1), isPublished? (défaut false)`. `GET /` et `GET /:id` filtrés serveur pour TEACHER (tuple matière+classe+année assigné ; examen multi-classes si matière+année assignées, 403 sinon). Pas de filtre query.
- `grades` :
  - `POST /grades` : `examId, studentId, score? (≥0), appreciation?, isAbsent?` (`isAbsent=true` force `score=null`). 409 si note existante. TEACHER : 403 si examen hors assignation.
  - `POST /grades/bulk` : `{ examId, grades: [{ examId (!), studentId, score?, appreciation?, isAbsent? }] }` — **`examId` par item OBLIGATOIRE** (hérité de CreateGradeDto, `forbidNonWhitelisted` → 400 si absent) même si le service ne lit que le top-level. Upsert (update si existe). TEACHER : 403 si examen hors assignation.
  - `GET /grades` / `GET /grades?examId=<uuid>` (tri nom/prénom ; inconnu → `[]`). TEACHER : restreint aux examens de son périmètre (hors périmètre → 403). **Pas de `GET /:id`.**
  - `PATCH /grades/:id` : ne lit que `score/appreciation/isAbsent` (ignore `examId/studentId`). 404 si introuvable. TEACHER : 403 si examen hors assignation.
  - `DELETE /grades/:id` (même périmètre TEACHER).
- `report-cards` (lecture seule) : `GET /report-cards/student?studentId=&academicYearId=&periodId?` → `{ student, classroom\|null, academicYear\|null, subjects:[{subjectId,subjectName,subjectCode,average\|null (/20, 2 déc),gradesCount,details}], generalAverage\|null }` (404 élève hors établissement). `GET /report-cards/classroom?classroomId=&academicYearId=` → `[{student, generalAverage, subjectsCount}]` trié desc (classe inconnue → `[]`, pas 404).

## Vie scolaire (JWT)

- `attendances` :
  - `POST /attendances` : `studentId, classroomId, date ISO, status? (défaut PRESENT), notes?` — upsert sur `(studentId, date)`.
  - `POST /attendances/bulk` : `{ classroomId, date ISO, attendances: [{ studentId, status (requis), notes? }] }` — upsert en boucle, élèves non vérifiés, `[]` → 200 `[]`.
  - `GET /attendances?classroomId=&date=` — **les deux requis, sans validation : sans `date` → 500**. Toujours envoyer les deux. TEACHER : 403 si classe non assignée. **Pas de `?studentId=`, pas de PATCH/DELETE.**
  - `GET /attendances/student?studentId=` (« Mes absences ») : STUDENT/PARENT (lui-même / ses enfants, 403 sinon), TEACHER (élève inscrit dans ses classes), staff. Inclut `classroom{name}`, tri date desc.
- `schedules` CRUD : `classroomId, subjectId, academicYearId, dayOfWeek: MONDAY..SUNDAY, startTime/endTime `HH:mm` (regex stricte), teacherId?, room?`. `GET /schedules?classroomId=` optionnel. TEACHER : `GET /` et `GET /:id` restreints aux classes assignées (« Mon emploi du temps »). STUDENT/PARENT : restreints aux classes d'inscription (lui-même / ses enfants, 403 si `classroomId` hors périmètre).
- `enrollments` : `GET /` et `GET /:id` ouverts à TEACHER (ses classes), STUDENT (siennes), PARENT (ses enfants). Écritures DIRECTOR/ADMIN.
- `discipline` CRUD : `studentId, type: WARNING\|REPRIMAND\|DETENTION\|SUSPENSION\|EXPULSION\|OBSERVATION\|OTHER, title (≥3), incidentDate ISO, description?, status?: PENDING\|ACTIVE\|RESOLVED\|CANCELLED`. PATCH accepte en plus `resolution?, resolvedAt?`. `reportedById` injecté serveur. `GET /discipline?search=&studentId=&status=&type=&page=&limit=` (search = titre/description/prénom/nom) → `{ data, pagination }` paginée ; **sans param → tableau brut** (compat). STUDENT/PARENT : `studentId` obligatoire et visible (403 sinon).

## Notifications (JWT, tous les rôles d'établissement sauf SUPER_ADMIN)

- `GET /notifications` → 50 dernières du compte (ordre desc) : `{ id, type: NOTE\|ABSENCE\|DISCIPLINE\|INSCRIPTION\|MEMBRE\|INFO, title, message\|null, link\|null, readAt\|null, createdAt }`.
- `GET /notifications/unread-count` → `{ count }` (scrutation cloche, 60 s côté UI).
- `PATCH /notifications/:id/read` → marque lue (404 si autre compte/établissement).
- `POST /notifications/read-all` → marque tout lu.
- Émission serveur : discipline → élève + parents liés ; inscription → élève + parents ; notes bulk (examen publié) → élèves notés + parents ; ajout membre → bienvenue. Comptes sans `userId` lié = pas de notification (silencieux).

## Incohérences connues (ne pas contourner silencieusement)

1. `BulkGradesDto` exige `examId` redondant par item (§ Évaluations).
2. `GET /attendances` sans `date` → 500, pas 400.
3. `PATCH /grades/:id` ignore `examId/studentId`.
4. Inexistants → 404 Nest (pas métier) : `GET /grades/:id`, `PATCH /teacher-assignments/:id`, `PATCH /parent-students`, `PATCH|DELETE /attendances`, tout `POST|PATCH|DELETE /report-cards`, `GET /attendances?studentId=` (l'historique est `GET /attendances/student?studentId=`).
5. `GET /report-cards/student` : `periodId` invalide → 200 `[]`, pas 400 (incohérent avec `studentId/academicYearId` stricts).
6. CORS : origines via `FRONTEND_URL` (liste séparée par virgules) — mettre à jour au déploiement.
7. `JWT_SECRET` obligatoire : le boot API refuse sans lui (fail-fast §8).
8. `POST /establishments` accède à `authService['generateTokens']` (privé) — fragile, ne pas en dépendre au-delà du contrat de réponse.

## Diagnostic bug notes/présences (todo.txt) — verdict Phase 0 : bug UI, pas backend

- Backend `bulkCreate` notes (`grades.service.ts:64-109`) = upsert réel (findUnique `examId_studentId` → update sinon create). Persistance OK a priori.
- `GradesPage.tsx:32-45` utilise `useState(() => …)` au lieu de `useEffect` pour pré-remplir `scores/absents` depuis `existingGrades` → ne s'exécute qu'une fois, jamais après refetch → après save + `invalidateQueries`, les inputs restent vides. **C'est le "disparition" rapporté.** + bug 0/20 : `Number(s) || undefined` transforme `0` en `undefined`.
- `AttendancesPage.tsx` utilise un vrai `useEffect` (correct) ; suspects restants : filtre `enrollments` client (`isActive`, `classroomId`) et garde d'égalité `statuses` — à prouver en live Phase 5c/d via Network (`POST bulk` → `GET` → comparaison).
- Correction prévue Phase 5c (sans toucher l'API) : `useEffect` de synchro, `invalidateQueries` + refetch attendu, suppression des `alert()`, préservation du `0`.

## Baseline builds (2026-10-13, avant modification)

- `turbo build --filter=api` : **OK**.
- `turbo build --filter=web` : **ÉCHEC** — 14 erreurs TS : incompatibilités `zodResolver`/`coerce.number` (`Classrooms, Cycles, Levels, Periods, Exams` pages) + `statusLabel`/`dayLabel` inutilisés (`noUnusedLocals`). À corriger Phase 2/5 (typage formulaires).
- `eslint apps/web` : **67 erreurs** (majoritairement `no-explicit-any` dans les pages + 2 `no-unused-vars`). À résorber au fil des phases (typage par DTOs).
- Correctif hors périmètre : aucun (pas de régression introduite — état initial).
