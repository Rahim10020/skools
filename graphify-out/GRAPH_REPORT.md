# Graph Report - skools  (2026-10-17)

## Corpus Check
- 346 files · ~87,252 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2215 nodes · 5709 edges · 93 communities (81 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 165 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `386ba690`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StudentsPage.tsx
- StudentDetailPage.tsx
- index.tsx
- @nestjs/common
- ui/index.ts
- getErrorMessage
- @prisma/client
- RequestActor
- CreateAcademicYearDto
- series.controller.ts
- CreateExamDto
- CreatePeriodDto
- StudentsService
- LookupAccountsQuery
- CreateClassroomDto
- CreateLevelDto
- parents.controller.ts
- CreateTeacherDto
- useAuthStore
- sidebar-nav.ts
- CreateCycleDto
- icons/index.ts
- ListSubjectsQuery
- CreateGradeDto
- lib/api.ts
- paginate
- api/package.json
- ParentStudentsController
- CreateAttendanceDto
- CreateScheduleDto
- web/package.json
- SidebarNavEntry.tsx
- PrismaService
- TeacherAssignmentsController
- devDependencies
- compilerOptions
- compilerOptions
- CrudPage.tsx
- Skools — Matrice d'accès par rôle (source de vérité)
- students.service.ts
- EstablishmentsService
- react
- compilerOptions
- dependencies
- scripts
- auth.service.ts
- ListEnrollmentsQuery
- devDependencies
- main.tsx
- AttendancesPage.tsx
- ListDisciplineQuery
- Roles
- ReportCardsService
- package.json
- ListHeader.tsx
- DataList.tsx
- Skools — Reste à faire (post Phase 6)
- tasks
- Contrats frontend ↔ API — état de référence (Phase 0, amendé Phase 6)
- shared/package.json
- seed.ts
- api/README.md
- AppService
- CsvImportDialog.tsx
- BulkAttendanceDto
- Pagination.tsx
- compilerOptions
- EnrollStudentsDialog.tsx
- ListMembersQuery
- dependencies
- ExamsService
- main.ts
- oxlint.json
- levels.controller.ts
- periods.controller.ts
- vite.config.ts
- tsconfig.build.json
- nest-cli.json
- ClassroomsModule
- cycles.controller.ts
- subjects.controller.ts
- SubjectsModule
- Sidebar
- scripts
- React + TypeScript + Vite
- prisma.module.ts
- StudentsModule
- TeacherAssignmentsModule
- web/tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `react` - 95 edges
2. `@nestjs/common` - 84 edges
3. `Roles()` - 83 edges
4. `useAuthStore` - 75 edges
5. `PrismaService` - 54 edges
6. `@prisma/client` - 48 edges
7. `getErrorMessage()` - 47 edges
8. `class-validator` - 45 edges
9. `API` - 41 edges
10. `@tanstack/react-query` - 38 edges

## Surprising Connections (you probably didn't know these)
- `SeriesPage()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/web/src/features/academic/SeriesPage.tsx → apps/web/src/stores/auth-store.ts
- `GradesTableProps` --references--> `StudentRow`  [EXTRACTED]
  apps/web/src/features/grades/GradesTable.tsx → apps/web/src/types/api.ts
- `ParentsPage()` --indirect_call--> `loadParentAccountOptions()`  [INFERRED]
  apps/web/src/features/parents/ParentsPage.tsx → apps/web/src/lib/member-options.ts
- `TeachersPage()` --indirect_call--> `loadTeacherAccountOptions()`  [INFERRED]
  apps/web/src/features/teachers/TeachersPage.tsx → apps/web/src/lib/member-options.ts
- `AcademicYearsController` --references--> `Roles()`  [EXTRACTED]
  apps/api/src/modules/academic/academic-years/academic-years.controller.ts → apps/api/src/common/decorators/roles.decorator.ts

## Import Cycles
- None detected.

## Communities (93 total, 8 thin omitted)

### Community 0 - "StudentsPage.tsx"
Cohesion: 0.06
Nodes (70): formatDateFr(), omitEmptyStrings(), optionalNumberString(), optionalUuidString(), toDateInput(), toOptionalNumber(), CrudPage(), AcademicYear (+62 more)

### Community 1 - "StudentDetailPage.tsx"
Cohesion: 0.09
Nodes (43): ListSkeleton(), StatusPill(), DetailContainer(), DetailFields(), DetailRow(), DetailSection(), DetailStat(), HairlineList() (+35 more)

### Community 2 - "index.tsx"
Cohesion: 0.07
Nodes (41): BOTTOM_NAV, MeEstablishments, SidebarFooter(), IconButton(), IconButtonProps, Wordmark(), AuthLayout(), AppNotification (+33 more)

### Community 3 - "@nestjs/common"
Cohesion: 0.08
Nodes (39): AcademicYearsModule, Module, CyclesModule, Module, LevelsModule, Module, PeriodsModule, Module (+31 more)

### Community 4 - "ui/index.ts"
Cohesion: 0.05
Nodes (64): CrudFormBody(), CrudSchema, FormDialogProps, Avatar(), ButtonProps, ButtonVariant, LoadingDots(), CardHeader() (+56 more)

### Community 5 - "getErrorMessage"
Cohesion: 0.07
Nodes (55): DataList(), ArrowForwardIcon(), IconProps, Button(), variantClasses, Card(), CardTitle(), EmptyState() (+47 more)

### Community 6 - "@prisma/client"
Cohesion: 0.15
Nodes (5): UpdateEnrollmentDto, UpdateExamDto, class-transformer, class-validator, @prisma/client

### Community 7 - "RequestActor"
Cohesion: 0.16
Nodes (15): assertStudentVisible(), resolveEnrolledClassroomIds(), resolveVisibleStudentIds(), assertClassroomAssigned(), assignedClassroomIds(), ASSIGNMENT_INCLUDE, listTeacherAssignments(), resolveTeacherId() (+7 more)

### Community 8 - "CreateAcademicYearDto"
Cohesion: 0.07
Nodes (29): AcademicYearsController, Body, Controller, Delete, Get, Param, Patch, Post (+21 more)

### Community 9 - "series.controller.ts"
Cohesion: 0.08
Nodes (29): CreateSeriesDto, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ListSeriesQuery, IsInt (+21 more)

### Community 10 - "CreateExamDto"
Cohesion: 0.07
Nodes (31): CreateExamDto, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString (+23 more)

### Community 11 - "CreatePeriodDto"
Cohesion: 0.07
Nodes (31): CreatePeriodDto, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min (+23 more)

### Community 12 - "StudentsService"
Cohesion: 0.13
Nodes (13): StudentsController, Body, Controller, Delete, Get, Param, Patch, Post (+5 more)

### Community 13 - "LookupAccountsQuery"
Cohesion: 0.08
Nodes (26): AddMemberDto, IsEmail, IsEnum, LookupAccountsQuery, IsBoolean, IsEnum, IsOptional, IsString (+18 more)

### Community 14 - "CreateClassroomDto"
Cohesion: 0.07
Nodes (30): ClassroomsController, Body, Controller, Delete, Get, Param, Patch, Post (+22 more)

### Community 15 - "CreateLevelDto"
Cohesion: 0.07
Nodes (30): CreateLevelDto, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, MinLength (+22 more)

### Community 16 - "parents.controller.ts"
Cohesion: 0.07
Nodes (33): DOSSIER_LABEL, DossierModel, EXPECTED_ROLE, validateDossierUserLink(), CreateParentDto, IsEmail, IsNotEmpty, IsOptional (+25 more)

### Community 17 - "CreateTeacherDto"
Cohesion: 0.07
Nodes (29): CreateTeacherDto, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength (+21 more)

### Community 18 - "useAuthStore"
Cohesion: 0.08
Nodes (40): ChildSelector(), Badge(), BadgeProps, badgeStyles, BadgeVariant, MyAbsencesPage(), MyChildrenPage(), DashboardPage() (+32 more)

### Community 19 - "sidebar-nav.ts"
Cohesion: 0.08
Nodes (23): CalendarIcon(), CheckCircleIcon(), ClockIcon(), ContactsIcon(), IconProps, DashboardIcon(), DateIcon(), IconProps (+15 more)

### Community 20 - "CreateCycleDto"
Cohesion: 0.07
Nodes (28): CyclesController, Body, Controller, Delete, Get, Param, Patch, Post (+20 more)

### Community 21 - "icons/index.ts"
Cohesion: 0.07
Nodes (24): AddIcon(), IconProps, ArrowBackIcon(), IconProps, BellIcon(), IconProps, CheckSmallIcon(), IconProps (+16 more)

### Community 22 - "ListSubjectsQuery"
Cohesion: 0.08
Nodes (26): CreateSubjectDto, IsNotEmpty, IsOptional, IsString, MinLength, ListSubjectsQuery, IsInt, IsOptional (+18 more)

### Community 23 - "CreateGradeDto"
Cohesion: 0.09
Nodes (26): BulkGradesDto, IsArray, IsUUID, Type, ValidateNested, CreateGradeDto, IsBoolean, IsNumber (+18 more)

### Community 24 - "lib/api.ts"
Cohesion: 0.07
Nodes (38): ActiveYearSelector(), yearLabel(), schema, Series, SeriesPage(), AuthField(), AuthRootError(), LoginForm (+30 more)

### Community 25 - "paginate"
Cohesion: 0.17
Nodes (10): buildPagination(), containsInsensitive(), LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT, paginate(), PaginatedResult, PaginationEnvelope, ParsedListQuery (+2 more)

### Community 26 - "api/package.json"
Cohesion: 0.05
Nodes (33): author, description, prettier, @types/node, typescript, license, name, private (+25 more)

### Community 27 - "ParentStudentsController"
Cohesion: 0.11
Nodes (16): LinkParentStudentDto, IsBoolean, IsEnum, IsOptional, IsUUID, ParentStudentsController, Body, Controller (+8 more)

### Community 28 - "CreateAttendanceDto"
Cohesion: 0.15
Nodes (14): AttendancesController, Body, Controller, Get, Post, Query, Request, UseGuards (+6 more)

### Community 29 - "CreateScheduleDto"
Cohesion: 0.11
Nodes (18): CreateScheduleDto, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, SchedulesController, Body (+10 more)

### Community 30 - "web/package.json"
Cohesion: 0.12
Nodes (18): @types/node, typescript, name, private, type, version, axios, eslint (+10 more)

### Community 31 - "SidebarNavEntry.tsx"
Cohesion: 0.15
Nodes (18): FlyoutPanel(), Icon(), IconProps, SkoolsIconProps, SidebarNavChild, SidebarNavEntry, isRouteActive(), LeafLink() (+10 more)

### Community 32 - "PrismaService"
Cohesion: 0.09
Nodes (13): NotificationsController, Controller, Get, Param, Patch, Post, Request, UseGuards (+5 more)

### Community 33 - "TeacherAssignmentsController"
Cohesion: 0.10
Nodes (17): BulkCreateTeacherAssignmentsDto, BulkTeacherAssignmentItemDto, IsArray, IsUUID, Type, ValidateNested, TeacherAssignmentsController, Body (+9 more)

### Community 34 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, @nestjs/cli, @nestjs/mau, @nestjs/schematics, @nestjs/testing, oxlint, prettier, prisma (+12 more)

### Community 35 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+11 more)

### Community 36 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 37 - "CrudPage.tsx"
Cohesion: 0.09
Nodes (30): CrudColumn, CrudFieldDef, CrudFieldType, CrudFilterDef, CrudPageProps, FormDialog(), NO_FILTERS, exportToCsv() (+22 more)

### Community 38 - "Skools — Matrice d'accès par rôle (source de vérité)"
Cohesion: 0.11
Nodes (17): Contexte général, Règles de génération de la sidebar, Règles de génération du header, Règles de protection des routes, Règles transverses (valables pour tous les rôles), Récapitulatif des accès par module, Rôle ADMIN (secrétariat / administration), Rôle BIBLIOTECAIRE (+9 more)

### Community 39 - "students.service.ts"
Cohesion: 0.09
Nodes (29): Gender, GENDERS, BulkCreateStudentsDto, BulkStudentRowDto, IsArray, IsOptional, IsString, IsUUID (+21 more)

### Community 40 - "EstablishmentsService"
Cohesion: 0.10
Nodes (19): CreateEstablishmentDto, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, UpdateEstablishmentDto, EstablishmentsController (+11 more)

### Community 41 - "react"
Cohesion: 0.15
Nodes (9): DoubleCaretIcon(), IconProps, IconProps, LinkIcon(), ProfilIcon(), SearchIcon(), SettingsNavIcon(), NavSearch() (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 43 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+8 more)

### Community 44 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, deploy, dev, format, lint, postinstall, seed (+8 more)

### Community 45 - "auth.service.ts"
Cohesion: 0.10
Nodes (20): AuthController, Body, Controller, Get, Post, Request, UseGuards, AuthService (+12 more)

### Community 46 - "ListEnrollmentsQuery"
Cohesion: 0.06
Nodes (33): BulkCreateEnrollmentsDto, IsArray, IsUUID, CreateEnrollmentDto, IsEnum, IsOptional, IsString, IsUUID (+25 more)

### Community 47 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, tailwindcss, @tailwindcss/vite (+8 more)

### Community 48 - "main.tsx"
Cohesion: 0.21
Nodes (8): ThemeToggle(), queryClient, AppRoutes(), applyThemeClass(), initTheme(), SkoolsTheme, ThemeState, useThemeStore

### Community 49 - "AttendancesPage.tsx"
Cohesion: 0.16
Nodes (17): StatusPillVariant, VARIANT_CLASSES, AttendancesPage(), ExistingAttendance, MyAssignment, todayLocal(), AttendanceHistoryItem, ATTENDANCE_PILL (+9 more)

### Community 50 - "ListDisciplineQuery"
Cohesion: 0.06
Nodes (35): DisciplineController, Body, Controller, Delete, Get, Param, Patch, Post (+27 more)

### Community 51 - "Roles"
Cohesion: 0.25
Nodes (9): Roles(), ROLES_KEY, RolesGuard, Injectable, JwtAuthGuard, Injectable, ESTABLISHMENT_ROLES, CreateTeacherAssignmentDto (+1 more)

### Community 52 - "ReportCardsService"
Cohesion: 0.21
Nodes (8): ReportCardsController, Controller, Get, Query, Request, UseGuards, ReportCardsService, Injectable

### Community 53 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, prettier, turbo, prettier, name, packageManager, private, scripts (+5 more)

### Community 54 - "ListHeader.tsx"
Cohesion: 0.23
Nodes (9): FilterOption, BulkSelection, ListFilterDef, ListHeader(), useDebouncedValue(), DownloadIcon(), IconProps, IconProps (+1 more)

### Community 55 - "DataList.tsx"
Cohesion: 0.16
Nodes (14): DataColumn, DataSelection, FilterDropdown(), HeaderSelect(), CheckIcon(), IconProps, ChevronDownwardIcon(), IconProps (+6 more)

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

### Community 63 - "CsvImportDialog.tsx"
Cohesion: 0.16
Nodes (15): buildHeaderIndex(), CsvImportDialog(), CsvImportDialogProps, ImportColumn, ImportPreviewRow, ImportResult, normalizeHeader(), detectDelimiter() (+7 more)

### Community 64 - "BulkAttendanceDto"
Cohesion: 0.20
Nodes (10): AttendanceItemDto, BulkAttendanceDto, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID (+2 more)

### Community 65 - "Pagination.tsx"
Cohesion: 0.27
Nodes (7): Pagination(), ChevronBackIcon(), IconProps, ChevronForwardIcon(), IconProps, Pagination(), PaginationProps

### Community 66 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 67 - "EnrollStudentsDialog.tsx"
Cohesion: 0.27
Nodes (8): IconProps, XIcon(), EnrollmentResult, EnrollStudentsDialog(), label(), Option, StudentRow, useDebouncedValue()

### Community 68 - "ListMembersQuery"
Cohesion: 0.22
Nodes (9): ListMembersQuery, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min (+1 more)

### Community 69 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, axios, @hookform/resolvers, react, react-dom, react-hook-form, react-router-dom, @tanstack/react-query (+2 more)

### Community 70 - "ExamsService"
Cohesion: 0.39
Nodes (3): examInScope(), ExamsService, Injectable

### Community 71 - "main.ts"
Cohesion: 0.25
Nodes (5): AppModule, Module, @nestjs/core, @nestjs/testing, supertest

### Community 72 - "oxlint.json"
Cohesion: 0.29
Nodes (6): env, node, rules, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, $schema

### Community 75 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 76 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 77 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 79 - "cycles.controller.ts"
Cohesion: 0.15
Nodes (5): UpdateClassroomDto, UpdateCycleDto, UpdateScheduleDto, UpdateTeacherDto, @nestjs/mapped-types

### Community 82 - "Sidebar"
Cohesion: 0.21
Nodes (10): isNavParent(), pruneEntries(), Sidebar(), renderEntry(), SidebarNavEntry(), flagParse(), flagSerialize(), useLocalStorage() (+2 more)

### Community 83 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 84 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 85 - "prisma.module.ts"
Cohesion: 0.50
Nodes (3): PrismaModule, Module, Global

## Knowledge Gaps
- **450 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `$schema` (+445 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 922 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Roles()` connect `Roles` to `@prisma/client`, `CreateAcademicYearDto`, `series.controller.ts`, `CreateExamDto`, `CreatePeriodDto`, `StudentsService`, `LookupAccountsQuery`, `CreateClassroomDto`, `CreateLevelDto`, `parents.controller.ts`, `CreateTeacherDto`, `CreateCycleDto`, `ListSubjectsQuery`, `CreateGradeDto`, `ParentStudentsController`, `CreateAttendanceDto`, `CreateScheduleDto`, `PrismaService`, `TeacherAssignmentsController`, `students.service.ts`, `EstablishmentsService`, `ListEnrollmentsQuery`, `ListDisciplineQuery`, `ReportCardsService`, `levels.controller.ts`, `periods.controller.ts`, `cycles.controller.ts`, `subjects.controller.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `@nestjs/common` to `PrismaService`, `@prisma/client`, `RequestActor`, `main.ts`, `levels.controller.ts`, `periods.controller.ts`, `series.controller.ts`, `EstablishmentsService`, `auth.service.ts`, `students.service.ts`, `cycles.controller.ts`, `parents.controller.ts`, `subjects.controller.ts`, `Roles`, `prisma.module.ts`, `paginate`, `api/package.json`, `AppService`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `@prisma/client` to `PrismaService`, `RequestActor`, `EstablishmentsService`, `levels.controller.ts`, `periods.controller.ts`, `series.controller.ts`, `students.service.ts`, `cycles.controller.ts`, `parents.controller.ts`, `subjects.controller.ts`, `Roles`, `paginate`, `api/package.json`, `seed.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _450 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `StudentsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06292749658002736 - nodes in this community are weakly interconnected._
- **Should `StudentDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09125188536953242 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06704260651629072 - nodes in this community are weakly interconnected._