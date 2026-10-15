import { ROUTES } from "../lib/routes";
import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { setNavigator } from "../lib/navigation";
import { AppShell } from "../layouts/AppShell";
import { GuestLayout } from "../layouts/GuestLayout";
import { RequireAuth, RequireEstablishment, RequireRole } from "./guards";
import { NotFoundPage } from "./NotFoundPage";
import { Skeleton } from "../components/ui/skeleton";

// Code-splitting par route (§9 roadmap) : chaque page est un chunk séparé.
// Les layouts/guards restent dans le chunk principal (toujours nécessaires).
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/RegisterPage"));
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage"));
const CreateEstablishmentPage = lazy(
  () => import("../features/establishments/CreateEstablishmentPage"),
);
const AcademicYearsPage = lazy(
  () => import("../features/academic/AcademicYearsPage"),
);
const ClassroomsPage = lazy(
  () => import("../features/academic/ClassroomsPage"),
);
const CyclesPage = lazy(() => import("../features/academic/CyclesPage"));
const LevelsPage = lazy(() => import("../features/academic/LevelsPage"));
const SeriesPage = lazy(() => import("../features/academic/SeriesPage"));
const SubjectsPage = lazy(() => import("../features/academic/SubjectsPage"));
const PeriodsPage = lazy(() => import("../features/academic/PeriodsPage"));
const StudentsPage = lazy(() => import("../features/students/StudentsPage"));
const TeachersPage = lazy(() => import("../features/teachers/TeachersPage"));
const ParentsPage = lazy(() => import("../features/parents/ParentsPage"));
const EnrollmentsPage = lazy(
  () => import("../features/enrollments/EnrollmentsPage"),
);
const ExamsPage = lazy(() => import("../features/exams/ExamsPage"));
const GradesPage = lazy(() => import("../features/grades/GradesPage"));
const LinkParentStudentPage = lazy(
  () => import("../features/parents/LinkParentStudentPage"),
);
const TeacherAssignmentsPage = lazy(
  () => import("../features/teachers/TeacherAssignmentsPage"),
);
const AttendancesPage = lazy(
  () => import("../features/attendances/AttendancesPage"),
);
const SchedulesPage = lazy(() => import("../features/schedules/SchedulesPage"));
const ReportCardsPage = lazy(
  () => import("../features/report-cards/ReportCardsPage"),
);
const DisciplinePage = lazy(
  () => import("../features/discipline/DisciplinePage"),
);
const ProfilPage = lazy(() => import("../features/profil/ProfilPage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage"));
const UsersPage = lazy(() => import("../features/users/UsersPage"));
const MyChildrenPage = lazy(
  () => import("../features/children/MyChildrenPage"),
);
const MyGradesPage = lazy(() => import("../features/grades/MyGradesPage"));
const MyAbsencesPage = lazy(
  () => import("../features/attendances/MyAbsencesPage"),
);

/** Enregistre la navigation impérative (intercepteur 401 → /login). */
function AuthNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator((to: string) => navigate(to));
  }, [navigate]);
  return null;
}

function RouteFallback() {
  return (
    <Skeleton
      className="h-[280px] rounded-r2"
      aria-label="Chargement de la page"
    />
  );
}

export function AppRoutes() {
  return (
    <>
      <AuthNavigator />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Racine : toujours vers Vue d'ensemble (RequireAuth redirige vers /login si besoin). */}
          <Route
            path={ROUTES.home}
            element={<Navigate to={ROUTES.dashboard} replace />}
          />

          {/* Routes publiques */}
          <Route element={<GuestLayout />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
          </Route>

          {/* Routes protégées */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path={ROUTES.dashboard} element={<DashboardPage />} />
              <Route
                path={ROUTES.createEstablishment}
                element={<CreateEstablishmentPage />}
              />
              <Route element={<RequireEstablishment />}>
                <Route element={<RequireRole />}>
                  <Route
                    path={ROUTES.academicYears}
                    element={<AcademicYearsPage />}
                  />
                  <Route
                    path={ROUTES.classrooms}
                    element={<ClassroomsPage />}
                  />
                  <Route path={ROUTES.cycles} element={<CyclesPage />} />
                  <Route path={ROUTES.levels} element={<LevelsPage />} />
                  <Route path={ROUTES.series} element={<SeriesPage />} />
                  <Route path={ROUTES.subjects} element={<SubjectsPage />} />
                  <Route path={ROUTES.periods} element={<PeriodsPage />} />
                  <Route path={ROUTES.students} element={<StudentsPage />} />
                  <Route path={ROUTES.teachers} element={<TeachersPage />} />
                  <Route path={ROUTES.parents} element={<ParentsPage />} />
                  <Route
                    path={ROUTES.enrollments}
                    element={<EnrollmentsPage />}
                  />
                  <Route path={ROUTES.exams} element={<ExamsPage />} />
                  <Route path={ROUTES.grades} element={<GradesPage />} />
                  <Route
                    path={ROUTES.linkParents}
                    element={<LinkParentStudentPage />}
                  />
                  <Route
                    path={ROUTES.teacherAssignments}
                    element={<TeacherAssignmentsPage />}
                  />
                  <Route
                    path={ROUTES.attendances}
                    element={<AttendancesPage />}
                  />
                  <Route path={ROUTES.schedules} element={<SchedulesPage />} />
                  <Route
                    path={ROUTES.reportCards}
                    element={<ReportCardsPage />}
                  />
                  <Route
                    path={ROUTES.discipline}
                    element={<DisciplinePage />}
                  />
                  <Route
                    path={ROUTES.myChildren}
                    element={<MyChildrenPage />}
                  />
                  <Route path={ROUTES.myGrades} element={<MyGradesPage />} />
                  <Route
                    path={ROUTES.myAbsences}
                    element={<MyAbsencesPage />}
                  />
                  <Route path={ROUTES.users} element={<UsersPage />} />
                  <Route path={ROUTES.settings} element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path={ROUTES.profil} element={<ProfilPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
