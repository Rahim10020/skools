# Contrats frontend ↔ API — état de référence (Phase 0)

> Gelé le 2026-10-13. Source : `apps/api/src/**/*.controller.ts`, `dto/*.ts`, `main.ts`, `prisma/schema.prisma`.
> Règle : le frontend s'adapte aux contrats ci-dessous. Aucune modification de `apps/api` sans demande séparée.
> Base URL dev : `http://localhost:3000/api/v1` (CORS autorise uniquement `http://localhost:5173`).
> Auth : `Authorization: Bearer <accessToken>`. Global : `ValidationPipe { whitelist, forbidNonWhitelisted, transform }`
> → **tout champ non déclaré dans le DTO = 400**. `:id` = UUID (`ParseUUIDPipe` → 400 si non-UUID).
> **Aucun guard de rôle** : seul `JwtAuthGuard` existe. Le frontend ne recevra jamais de 403 — ne pas s'appuyer dessus.

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
| `GET /establishments` / `GET /:id` / `PATCH /:id` (Partial) / `DELETE /:id` | — | `findAll` non filtré | 400/404/401 |

## Référentiels académiques (JWT, scopés `establishmentId`, CRUD `POST / GET / GET :id / PATCH :id(Partial) / DELETE :id`)

| Préfixe | Create DTO (requis) |
|---|---|
| `academic-years` | `name (≥4, ex "2025-2026"), startDate ISO, endDate ISO, isCurrent?` |
| `cycles` | `name (≥2), order?: int ≥0` |
| `levels` | `cycleId UUID, name (≥1), order?` (400 si cycle hors établissement) |
| `series` | `name (≥1), levelId?: UUID` |
| `subjects` | `name (≥2), code?, description?` |
| `classrooms` | `academicYearId UUID, levelId UUID, seriesId?: UUID, name (≥1), capacity?: int ≥1` |
| `periods` | `academicYearId UUID, name (≥2), startDate ISO, endDate ISO, order?` |

## Personnes (JWT)

- `students` CRUD : `firstName (≥2), lastName (≥2), matricule?, gender?, dateOfBirth? ISO, placeOfBirth?, phone?, address?`. Pas de `?classroomId=` ni `?search=`.
- `teachers` CRUD : `firstName (≥2), lastName (≥2), matricule?, gender?, phone?, email? (IsEmail), address?, specialty?`.
- `parents` CRUD : `firstName (≥2), lastName (≥2), phone?, email?, address?, profession?`.
- `POST /parent-students` : `parentId UUID, studentId UUID, relation?: FATHER\|MOTHER\|GUARDIAN\|OTHER, isPrimary?`. `GET /parent-students/student/:studentId`, `GET /parent-students/parent/:parentId`, `DELETE /:id` (id de la **liaison**). 409 si déjà liés. Pas de PATCH (unlink + re-link).
- `POST /teacher-assignments` : `teacherId, subjectId, classroomId, academicYearId` (tous UUID requis). `GET /`, `DELETE /:id`. 409 si doublon, 400 si FK hors établissement. Pas de PATCH/GET :id.
- `POST /enrollments` : `studentId, classroomId, academicYearId (UUID), status?: PENDING\|APPROVED\|REJECTED\|WITHDRAWN, notes?`. CRUD complet. 409 doublon (student+year). Pas de filtre query — filtrer côté client.

## Évaluations (JWT)

- `exams` CRUD : `academicYearId UUID, subjectId UUID, name (≥2), periodId?, classroomId? (null = multi), type?: INTERROGATION\|DEVOIR\|COMPOSITION\|EXAMEN\|AUTRE (défaut DEVOIR), examDate? ISO, maxScore? (défaut 20), coefficient? (défaut 1), isPublished? (défaut false)`. Pas de filtre query.
- `grades` :
  - `POST /grades` : `examId, studentId, score? (≥0), appreciation?, isAbsent?` (`isAbsent=true` force `score=null`). 409 si note existante.
  - `POST /grades/bulk` : `{ examId, grades: [{ examId (!), studentId, score?, appreciation?, isAbsent? }] }` — **`examId` par item OBLIGATOIRE** (hérité de CreateGradeDto, `forbidNonWhitelisted` → 400 si absent) même si le service ne lit que le top-level. Upsert (update si existe).
  - `GET /grades` / `GET /grades?examId=<uuid>` (tri nom/prénom ; inconnu → `[]`). **Pas de `GET /:id`.**
  - `PATCH /grades/:id` : ne lit que `score/appreciation/isAbsent` (ignore `examId/studentId`). 404 si introuvable.
  - `DELETE /grades/:id`.
- `report-cards` (lecture seule) : `GET /report-cards/student?studentId=&academicYearId=&periodId?` → `{ student, classroom\|null, academicYear\|null, subjects:[{subjectId,subjectName,subjectCode,average\|null (/20, 2 déc),gradesCount,details}], generalAverage\|null }` (404 élève hors établissement). `GET /report-cards/classroom?classroomId=&academicYearId=` → `[{student, generalAverage, subjectsCount}]` trié desc (classe inconnue → `[]`, pas 404).

## Vie scolaire (JWT)

- `attendances` :
  - `POST /attendances` : `studentId, classroomId, date ISO, status? (défaut PRESENT), notes?` — upsert sur `(studentId, date)`.
  - `POST /attendances/bulk` : `{ classroomId, date ISO, attendances: [{ studentId, status (requis), notes? }] }` — upsert en boucle, élèves non vérifiés, `[]` → 200 `[]`.
  - `GET /attendances?classroomId=&date=` — **les deux requis, sans validation : sans `date` → 500**. Toujours envoyer les deux. **Pas de `?studentId=`, pas de PATCH/DELETE.**
- `schedules` CRUD : `classroomId, subjectId, academicYearId, dayOfWeek: MONDAY..SUNDAY, startTime/endTime `HH:mm` (regex stricte), teacherId?, room?`. `GET /schedules?classroomId=` optionnel.
- `discipline` CRUD + `GET /discipline?studentId=` optionnel : `studentId, type: WARNING\|REPRIMAND\|DETENTION\|SUSPENSION\|EXPULSION\|OBSERVATION\|OTHER, title (≥3), incidentDate ISO, description?, status?: PENDING\|ACTIVE\|RESOLVED\|CANCELLED`. PATCH accepte en plus `resolution?, resolvedAt?`. `reportedById` injecté serveur.

## Incohérences connues (ne pas contourner silencieusement)

1. `BulkGradesDto` exige `examId` redondant par item (§ Évaluations).
2. `GET /attendances` sans `date` → 500, pas 400.
3. `PATCH /grades/:id` ignore `examId/studentId`.
4. Inexistants → 404 Nest (pas métier) : `GET /grades/:id`, `PATCH /teacher-assignments/:id`, `PATCH /parent-students`, `PATCH|DELETE /attendances`, tout `POST|PATCH|DELETE /report-cards`, `GET /attendances?studentId=`.
5. `GET /report-cards/student` : `periodId` invalide → 200 `[]`, pas 400 (incohérent avec `studentId/academicYearId` stricts).
6. CORS : seul `http://localhost:5173` autorisé — prévoir mise à jour `main.ts` au déploiement (hors périmètre frontend, à signaler).
7. `POST /establishments` accède à `authService['generateTokens']` (privé) — fragile, ne pas en dépendre au-delà du contrat de réponse.

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
