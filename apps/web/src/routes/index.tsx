import { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
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
const AcademicYearsPage = lazy(() => import("../features/academic/AcademicYearsPage"));
const ClassroomsPage = lazy(() => import("../features/academic/ClassroomsPage"));
const CyclesPage = lazy(() => import("../features/academic/CyclesPage"));
const LevelsPage = lazy(() => import("../features/academic/LevelsPage"));
const SeriesPage = lazy(() => import("../features/academic/SeriesPage"));
const SubjectsPage = lazy(() => import("../features/academic/SubjectsPage"));
const PeriodsPage = lazy(() => import("../features/academic/PeriodsPage"));
const StudentsPage = lazy(() => import("../features/students/StudentsPage"));
const TeachersPage = lazy(() => import("../features/teachers/TeachersPage"));
const ParentsPage = lazy(() => import("../features/parents/ParentsPage"));
const EnrollmentsPage = lazy(() => import("../features/enrollments/EnrollmentsPage"));
const ExamsPage = lazy(() => import("../features/exams/ExamsPage"));
const GradesPage = lazy(() => import("../features/grades/GradesPage"));
const LinkParentStudentPage = lazy(() => import("../features/parents/LinkParentStudentPage"));
const TeacherAssignmentsPage = lazy(
  () => import("../features/teachers/TeacherAssignmentsPage"),
);
const AttendancesPage = lazy(() => import("../features/attendances/AttendancesPage"));
const SchedulesPage = lazy(() => import("../features/schedules/SchedulesPage"));
const ReportCardsPage = lazy(() => import("../features/report-cards/ReportCardsPage"));
const DisciplinePage = lazy(() => import("../features/discipline/DisciplinePage"));
const ProfilPage = lazy(() => import("../features/profil/ProfilPage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage"));
const UsersPage = lazy(() => import("../features/users/UsersPage"));
const MyChildrenPage = lazy(() => import("../features/children/MyChildrenPage"));
const MyGradesPage = lazy(() => import("../features/grades/MyGradesPage"));
const MyAbsencesPage = lazy(() => import("../features/attendances/MyAbsencesPage"));

/** Enregistre la navigation impérative (intercepteur 401 → /login). */
function AuthNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator((to: string) => navigate(to));
  }, [navigate]);
  return null;
}

function RouteFallback() {
  return <Skeleton className="h-[280px] rounded-r2" aria-label="Chargement de la page" />;
}

export function AppRoutes() {
  return (
    <>
      <AuthNavigator />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Routes publiques */}
          <Route element={<GuestLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Routes protégées */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-establishment" element={<CreateEstablishmentPage />} />
              <Route element={<RequireEstablishment />}>
                <Route element={<RequireRole />}>
                  <Route path="/academic-years" element={<AcademicYearsPage />} />
                  <Route path="/classrooms" element={<ClassroomsPage />} />
                  <Route path="/cycles" element={<CyclesPage />} />
                  <Route path="/levels" element={<LevelsPage />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/periods" element={<PeriodsPage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/parents" element={<ParentsPage />} />
                  <Route path="/enrollments" element={<EnrollmentsPage />} />
                  <Route path="/exams" element={<ExamsPage />} />
                  <Route path="/grades" element={<GradesPage />} />
                  <Route path="/link-parents" element={<LinkParentStudentPage />} />
                  <Route path="/teacher-assignments" element={<TeacherAssignmentsPage />} />
                  <Route path="/attendances" element={<AttendancesPage />} />
                  <Route path="/schedules" element={<SchedulesPage />} />
                  <Route path="/report-cards" element={<ReportCardsPage />} />
                  <Route path="/discipline" element={<DisciplinePage />} />
                  <Route path="/my-children" element={<MyChildrenPage />} />
                  <Route path="/my-grades" element={<MyGradesPage />} />
                  <Route path="/my-absences" element={<MyAbsencesPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="/profil" element={<ProfilPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
