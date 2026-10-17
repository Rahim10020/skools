# Graph Report - skools  (2026-10-17)

## Corpus Check
- 334 files · ~81,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2118 nodes · 5441 edges · 95 communities (79 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af7fbcb4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api-endpoints.ts
- CrudPage.tsx
- index.tsx
- @nestjs/common
- ui/index.ts
- AttendancesPage.tsx
- Roles
- PrismaService
- academic-years.controller.ts
- series.controller.ts
- CreateExamDto
- CreatePeriodDto
- ListStudentsQuery
- user-establishments.service.ts
- CreateClassroomDto
- CreateLevelDto
- CreateParentDto
- CreateTeacherDto
- useAuthStore
- sidebar-nav.ts
- CreateCycleDto
- icons/index.ts
- ListSubjectsQuery
- CreateGradeDto
- SettingsPage.tsx
- paginate
- api/package.json
- ParentStudentsController
- BulkAttendanceDto
- CreateScheduleDto
- web/package.json
- SidebarNavEntry.tsx
- NotificationsService
- TeacherAssignmentsController
- devDependencies
- compilerOptions
- compilerOptions
- lib/api.ts
- Skools — Matrice d'accès par rôle (source de vérité)
- students.controller.ts
- EstablishmentsController
- react
- compilerOptions
- dependencies
- scripts
- AuthController
- EnrollmentsController
- devDependencies
- main.tsx
- auth.service.ts
- DisciplineController
- establishments.controller.ts
- ReportCardsService
- package.json
- ListHeader.tsx
- HeaderSelect.tsx
- Skools — Reste à faire (post Phase 6)
- tasks
- Contrats frontend ↔ API — état de référence (Phase 0, amendé Phase 6)
- shared/package.json
- seed.ts
- api/README.md
- AppService
- DisciplineService
- CreateDisciplineDto
- Pagination.tsx
- compilerOptions
- ListDisciplineQuery
- ListEnrollmentsQuery
- dependencies
- EstablishmentsService
- main.ts
- oxlint.json
- AuthService
- CreateEnrollmentDto
- EnrollmentsService
- tsconfig.build.json
- nest-cli.json
- classrooms.controller.ts
- cycles.controller.ts
- subjects.controller.ts
- parents.controller.ts
- use-local-storage.ts
- scripts
- React + TypeScript + Vite
- PrismaModule
- vite-tsconfig-paths
- ArrowForwardIcon.tsx
- DateIcon.tsx
- InfoCircleIcon.tsx
- web/tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `react` - 91 edges
2. `@nestjs/common` - 84 edges
3. `Roles()` - 82 edges
4. `useAuthStore` - 75 edges
5. `PrismaService` - 54 edges
6. `@prisma/client` - 47 edges
7. `getErrorMessage()` - 43 edges
8. `class-validator` - 41 edges
9. `API` - 39 edges
10. `@tanstack/react-query` - 36 edges

## Surprising Connections (you probably didn't know these)
- `GradesTableProps` --references--> `StudentRow`  [EXTRACTED]
  apps/web/src/features/grades/GradesTable.tsx → apps/web/src/types/api.ts
- `LinkParentStudentPage()` --calls--> `getErrorMessage()`  [EXTRACTED]
  apps/web/src/features/parents/LinkParentStudentPage.tsx → apps/web/src/lib/api.ts
- `AcademicYearsController` --references--> `Roles()`  [EXTRACTED]
  apps/api/src/modules/academic/academic-years/academic-years.controller.ts → apps/api/src/common/decorators/roles.decorator.ts
- `ClassroomsController` --references--> `Roles()`  [EXTRACTED]
  apps/api/src/modules/academic/classrooms/classrooms.controller.ts → apps/api/src/common/decorators/roles.decorator.ts
- `CyclesController` --references--> `Roles()`  [EXTRACTED]
  apps/api/src/modules/academic/cycles/cycles.controller.ts → apps/api/src/common/decorators/roles.decorator.ts

## Import Cycles
- None detected.

## Communities (95 total, 12 thin omitted)

### Community 0 - "api-endpoints.ts"
Cohesion: 0.07
Nodes (71): formatDateFr(), omitEmptyStrings(), optionalNumberString(), optionalUuidString(), toDateInput(), toOptionalNumber(), CrudPage(), AcademicYear (+63 more)

### Community 1 - "CrudPage.tsx"
Cohesion: 0.06
Nodes (65): CrudColumn, CrudFieldDef, CrudFieldType, CrudFilterDef, CrudFormModal(), CrudSchema, NO_FILTERS, exportToCsv() (+57 more)

### Community 2 - "index.tsx"
Cohesion: 0.05
Nodes (55): BOTTOM_NAV, MeEstablishments, pruneEntries(), Sidebar(), SidebarFooter(), Avatar(), IconButton(), IconButtonProps (+47 more)

### Community 3 - "@nestjs/common"
Cohesion: 0.06
Nodes (47): ClassroomsModule, Module, CyclesModule, Module, LevelsModule, Module, PeriodsModule, Module (+39 more)

### Community 4 - "ui/index.ts"
Cohesion: 0.06
Nodes (60): BadgeProps, badgeStyles, BadgeVariant, ButtonProps, ButtonVariant, LoadingDots(), CardHeader(), BaseInputProps (+52 more)

### Community 5 - "AttendancesPage.tsx"
Cohesion: 0.07
Nodes (52): DataList(), EmptyState(), EmptyStateProps, ErrorStateProps, Skeleton(), SkeletonProps, toast, AttendancesPage() (+44 more)

### Community 6 - "Roles"
Cohesion: 0.11
Nodes (20): Roles(), ROLES_KEY, RolesGuard, Injectable, UpdateLevelDto, AttendanceItemDto, IsEnum, IsOptional (+12 more)

### Community 7 - "PrismaService"
Cohesion: 0.13
Nodes (19): assertStudentVisible(), resolveEnrolledClassroomIds(), resolveVisibleStudentIds(), assertClassroomAssigned(), assignedClassroomIds(), ASSIGNMENT_INCLUDE, examInScope(), listTeacherAssignments() (+11 more)

### Community 8 - "academic-years.controller.ts"
Cohesion: 0.07
Nodes (31): AcademicYearsController, Body, Controller, Delete, Get, Param, Patch, Post (+23 more)

### Community 9 - "series.controller.ts"
Cohesion: 0.08
Nodes (29): CreateSeriesDto, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ListSeriesQuery, IsInt (+21 more)

### Community 10 - "CreateExamDto"
Cohesion: 0.06
Nodes (33): CreateExamDto, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString (+25 more)

### Community 11 - "CreatePeriodDto"
Cohesion: 0.07
Nodes (31): CreatePeriodDto, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min (+23 more)

### Community 12 - "ListStudentsQuery"
Cohesion: 0.07
Nodes (29): CreateStudentDto, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ListStudentsQuery (+21 more)

### Community 13 - "user-establishments.service.ts"
Cohesion: 0.08
Nodes (28): AddMemberDto, IsEmail, IsEnum, ListMembersQuery, IsEnum, IsInt, IsOptional, IsString (+20 more)

### Community 14 - "CreateClassroomDto"
Cohesion: 0.07
Nodes (30): ClassroomsController, Body, Controller, Delete, Get, Param, Patch, Post (+22 more)

### Community 15 - "CreateLevelDto"
Cohesion: 0.07
Nodes (30): CreateLevelDto, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, MinLength (+22 more)

### Community 16 - "CreateParentDto"
Cohesion: 0.07
Nodes (28): CreateParentDto, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ListParentsQuery (+20 more)

### Community 17 - "CreateTeacherDto"
Cohesion: 0.07
Nodes (28): CreateTeacherDto, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ListTeachersQuery (+20 more)

### Community 18 - "useAuthStore"
Cohesion: 0.11
Nodes (33): ChildSelector(), Badge(), Card(), CardTitle(), SeriesPage(), MyAbsencesPage(), MyChildrenPage(), Shortcut (+25 more)

### Community 19 - "sidebar-nav.ts"
Cohesion: 0.07
Nodes (26): CalendarIcon(), CheckCircleIcon(), ClockIcon(), ContactsIcon(), IconProps, DashboardIcon(), DoorIcon(), ExamIcon() (+18 more)

### Community 20 - "CreateCycleDto"
Cohesion: 0.07
Nodes (28): CyclesController, Body, Controller, Delete, Get, Param, Patch, Post (+20 more)

### Community 21 - "icons/index.ts"
Cohesion: 0.07
Nodes (25): AddIcon(), IconProps, ArrowBackIcon(), IconProps, BellIcon(), IconProps, CheckSmallIcon(), IconProps (+17 more)

### Community 22 - "ListSubjectsQuery"
Cohesion: 0.08
Nodes (26): CreateSubjectDto, IsNotEmpty, IsOptional, IsString, MinLength, ListSubjectsQuery, IsInt, IsOptional (+18 more)

### Community 23 - "CreateGradeDto"
Cohesion: 0.09
Nodes (25): BulkGradesDto, IsArray, IsUUID, Type, ValidateNested, CreateGradeDto, IsBoolean, IsNumber (+17 more)

### Community 24 - "SettingsPage.tsx"
Cohesion: 0.09
Nodes (30): Button(), variantClasses, Input(), Select(), AuthField(), AuthRootError(), LoginForm, LoginPage() (+22 more)

### Community 25 - "paginate"
Cohesion: 0.16
Nodes (11): buildPagination(), containsInsensitive(), LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT, paginate(), PaginatedResult, PaginationEnvelope, ParsedListQuery (+3 more)

### Community 26 - "api/package.json"
Cohesion: 0.07
Nodes (27): author, description, prettier, @types/node, typescript, license, name, private (+19 more)

### Community 27 - "ParentStudentsController"
Cohesion: 0.11
Nodes (16): LinkParentStudentDto, IsBoolean, IsEnum, IsOptional, IsUUID, ParentStudentsController, Body, Controller (+8 more)

### Community 28 - "BulkAttendanceDto"
Cohesion: 0.10
Nodes (20): AttendancesController, Body, Controller, Get, Post, Query, Request, UseGuards (+12 more)

### Community 29 - "CreateScheduleDto"
Cohesion: 0.11
Nodes (18): CreateScheduleDto, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, SchedulesController, Body (+10 more)

### Community 30 - "web/package.json"
Cohesion: 0.11
Nodes (21): @types/node, typescript, name, private, type, version, axios, eslint (+13 more)

### Community 31 - "SidebarNavEntry.tsx"
Cohesion: 0.15
Nodes (19): CrudPageProps, DataColumn, DataSelection, HeaderSelect(), StatusPill(), StatusPillSpec, StatusPillVariant, VARIANT_CLASSES (+11 more)

### Community 32 - "NotificationsService"
Cohesion: 0.13
Nodes (10): NotificationsController, Controller, Get, Param, Patch, Post, Request, UseGuards (+2 more)

### Community 33 - "TeacherAssignmentsController"
Cohesion: 0.12
Nodes (13): CreateTeacherAssignmentDto, IsUUID, TeacherAssignmentsController, Body, Controller, Delete, Get, Param (+5 more)

### Community 34 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, @nestjs/cli, @nestjs/mau, @nestjs/schematics, @nestjs/testing, oxlint, prettier, prisma (+12 more)

### Community 35 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+11 more)

### Community 36 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 37 - "lib/api.ts"
Cohesion: 0.17
Nodes (13): ActiveYearSelector(), yearLabel(), API_BASE_URL, RetryableRequest, navigateTo(), AcademicYearState, useAcademicYearStore, AuthState (+5 more)

### Community 38 - "Skools — Matrice d'accès par rôle (source de vérité)"
Cohesion: 0.11
Nodes (17): Contexte général, Règles de génération de la sidebar, Règles de génération du header, Règles de protection des routes, Règles transverses (valables pour tous les rôles), Récapitulatif des accès par module, Rôle ADMIN (secrétariat / administration), Rôle BIBLIOTECAIRE (+9 more)

### Community 39 - "students.controller.ts"
Cohesion: 0.22
Nodes (6): DOSSIER_LABEL, DossierModel, EXPECTED_ROLE, validateDossierUserLink(), UpdateStudentDto, UpdateTeacherDto

### Community 40 - "EstablishmentsController"
Cohesion: 0.18
Nodes (10): EstablishmentsController, Body, Controller, Delete, Get, Param, Patch, Post (+2 more)

### Community 41 - "react"
Cohesion: 0.15
Nodes (9): FlyoutPanel(), DoubleCaretIcon(), IconProps, ProfilIcon(), SearchIcon(), SettingsNavIcon(), NavSearch(), Separator() (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 43 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+8 more)

### Community 44 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, deploy, dev, format, lint, postinstall, seed (+8 more)

### Community 45 - "AuthController"
Cohesion: 0.21
Nodes (8): AuthController, Body, Controller, Get, Post, Request, UseGuards, HttpCode

### Community 46 - "EnrollmentsController"
Cohesion: 0.19
Nodes (11): EnrollmentsController, Body, Controller, Delete, Get, Param, Patch, Post (+3 more)

### Community 47 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, tailwindcss, @tailwindcss/vite (+8 more)

### Community 48 - "main.tsx"
Cohesion: 0.19
Nodes (9): ThemeToggle(), queryClient, AppRoutes(), applyThemeClass(), initTheme(), SkoolsTheme, ThemeState, useThemeStore (+1 more)

### Community 49 - "auth.service.ts"
Cohesion: 0.21
Nodes (10): LoginDto, IsEmail, IsString, MinLength, RegisterDto, IsEmail, IsNotEmpty, IsString (+2 more)

### Community 50 - "DisciplineController"
Cohesion: 0.21
Nodes (10): DisciplineController, Body, Controller, Delete, Get, Param, Patch, Query (+2 more)

### Community 51 - "establishments.controller.ts"
Cohesion: 0.24
Nodes (9): CreateEstablishmentDto, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, UpdateEstablishmentDto, EstablishmentsModule (+1 more)

### Community 52 - "ReportCardsService"
Cohesion: 0.21
Nodes (8): ReportCardsController, Controller, Get, Query, Request, UseGuards, ReportCardsService, Injectable

### Community 53 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, prettier, turbo, prettier, name, packageManager, private, scripts (+5 more)

### Community 54 - "ListHeader.tsx"
Cohesion: 0.22
Nodes (9): FilterDropdown(), FilterOption, BulkSelection, ListFilterDef, useDebouncedValue(), DownloadIcon(), IconProps, IconProps (+1 more)

### Community 55 - "HeaderSelect.tsx"
Cohesion: 0.21
Nodes (8): CheckIcon(), IconProps, ChevronDownwardIcon(), IconProps, Checkbox(), CheckboxProps, GradesTable(), GradesTableProps

### Community 56 - "Skools — Reste à faire (post Phase 6)"
Cohesion: 0.15
Nodes (12): 0. Vérifications post-merge (court terme, avant d'annoncer `dev` stable), 1. Vues filtrées par rôle (« Mes X ») — FAIT (lots 2–4), 2. Pages manquantes de la matrice — FAIT (lots 1–2), 3. Espace plateforme SUPER_ADMIN (parqué), 4. Module bibliothèque (parqué, BIBLIOTECAIRE réduit à Vue d'ensemble + Profil), 5. Notifications (cloche) — FAIT (lot 6, testé live), 6. Rôles : finitions — FAIT sauf badge (lot 5), 7. Fonctionnel mineur — FAIT (lot 5) (+4 more)

### Community 57 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, dependsOn, $schema, tasks, build (+4 more)

### Community 58 - "Contrats frontend ↔ API — état de référence (Phase 0, amendé Phase 6)"
Cohesion: 0.17
Nodes (11): Auth — `auth`, Baseline builds (2026-10-13, avant modification), Contrats frontend ↔ API — état de référence (Phase 0, amendé Phase 6), Diagnostic bug notes/présences (todo.txt) — verdict Phase 0 : bug UI, pas backend, Establishments — `establishments` (JWT), Incohérences connues (ne pas contourner silencieusement), Notifications (JWT, tous les rôles d'établissement sauf SUPER_ADMIN), Personnes (JWT) (+3 more)

### Community 59 - "shared/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, build (+3 more)

### Community 60 - "seed.ts"
Cohesion: 0.20
Nodes (6): ACCOUNTS, assertLocalDatabase(), main(), prisma, SeedAccount, bcrypt

### Community 61 - "api/README.md"
Cohesion: 0.18
Nodes (10): Compile and run the project, Deployment, Description, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 62 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 63 - "DisciplineService"
Cohesion: 0.24
Nodes (6): DisciplineService, Injectable, IsDateString, IsOptional, IsString, UpdateDisciplineDto

### Community 64 - "CreateDisciplineDto"
Cohesion: 0.20
Nodes (9): Post, CreateDisciplineDto, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID (+1 more)

### Community 65 - "Pagination.tsx"
Cohesion: 0.27
Nodes (7): Pagination(), ChevronBackIcon(), IconProps, ChevronForwardIcon(), IconProps, Pagination(), PaginationProps

### Community 66 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 67 - "ListDisciplineQuery"
Cohesion: 0.20
Nodes (10): ListDisciplineQuery, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength (+2 more)

### Community 68 - "ListEnrollmentsQuery"
Cohesion: 0.20
Nodes (10): ListEnrollmentsQuery, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength (+2 more)

### Community 69 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, axios, @hookform/resolvers, react, react-dom, react-hook-form, react-router-dom, @tanstack/react-query (+2 more)

### Community 71 - "main.ts"
Cohesion: 0.25
Nodes (5): AppModule, Module, @nestjs/core, @nestjs/testing, supertest

### Community 72 - "oxlint.json"
Cohesion: 0.29
Nodes (6): env, node, rules, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, $schema

### Community 74 - "CreateEnrollmentDto"
Cohesion: 0.29
Nodes (5): CreateEnrollmentDto, IsEnum, IsOptional, IsString, IsUUID

### Community 76 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 77 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 82 - "use-local-storage.ts"
Cohesion: 0.53
Nodes (4): flagParse(), flagSerialize(), useLocalStorage(), useLocalStorageFlag()

### Community 83 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 84 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 85 - "PrismaModule"
Cohesion: 0.67
Nodes (3): PrismaModule, Module, Global

## Knowledge Gaps
- **436 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `$schema` (+431 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 891 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Roles()` connect `Roles` to `academic-years.controller.ts`, `series.controller.ts`, `CreateExamDto`, `CreatePeriodDto`, `ListStudentsQuery`, `user-establishments.service.ts`, `CreateClassroomDto`, `CreateLevelDto`, `CreateParentDto`, `CreateTeacherDto`, `CreateCycleDto`, `ListSubjectsQuery`, `CreateGradeDto`, `paginate`, `ParentStudentsController`, `BulkAttendanceDto`, `CreateScheduleDto`, `NotificationsService`, `TeacherAssignmentsController`, `students.controller.ts`, `EstablishmentsController`, `EnrollmentsController`, `DisciplineController`, `establishments.controller.ts`, `ReportCardsService`, `classrooms.controller.ts`, `cycles.controller.ts`, `subjects.controller.ts`, `parents.controller.ts`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `@nestjs/common` to `Roles`, `PrismaService`, `students.controller.ts`, `main.ts`, `academic-years.controller.ts`, `series.controller.ts`, `user-establishments.service.ts`, `classrooms.controller.ts`, `cycles.controller.ts`, `subjects.controller.ts`, `auth.service.ts`, `parents.controller.ts`, `establishments.controller.ts`, `paginate`, `api/package.json`, `AppService`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `api-endpoints.ts`, `CrudPage.tsx`, `index.tsx`, `ui/index.ts`, `AttendancesPage.tsx`, `useAuthStore`, `sidebar-nav.ts`, `icons/index.ts`, `SettingsPage.tsx`, `web/package.json`, `SidebarNavEntry.tsx`, `lib/api.ts`, `main.tsx`, `ListHeader.tsx`, `HeaderSelect.tsx`, `Pagination.tsx`, `use-local-storage.ts`, `ArrowForwardIcon.tsx`, `DateIcon.tsx`, `InfoCircleIcon.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _436 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `api-endpoints.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06664964249233912 - nodes in this community are weakly interconnected._
- **Should `CrudPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06327160493827161 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0518326545723806 - nodes in this community are weakly interconnected._