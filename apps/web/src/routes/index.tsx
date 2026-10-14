import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { setNavigator } from "../lib/navigation";
import { AppShell } from "../layouts/AppShell";
import { GuestLayout } from "../layouts/GuestLayout";
import { RequireAuth, RequireEstablishment, RequireRole } from "./guards";
import { NotFoundPage } from "./NotFoundPage";

import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import CreateEstablishmentPage from "../features/establishments/CreateEstablishmentPage";
import AcademicYearsPage from "../features/academic/AcademicYearsPage";
import ClassroomsPage from "../features/academic/ClassroomsPage";
import CyclesPage from "../features/academic/CyclesPage";
import LevelsPage from "../features/academic/LevelsPage";
import SeriesPage from "../features/academic/SeriesPage";
import SubjectsPage from "../features/academic/SubjectsPage";
import PeriodsPage from "../features/academic/PeriodsPage";
import StudentsPage from "../features/students/StudentsPage";
import TeachersPage from "../features/teachers/TeachersPage";
import ParentsPage from "../features/parents/ParentsPage";
import EnrollmentsPage from "../features/enrollments/EnrollmentsPage";
import ExamsPage from "../features/exams/ExamsPage";
import GradesPage from "../features/grades/GradesPage";
import LinkParentStudentPage from "../features/parents/LinkParentStudentPage";
import TeacherAssignmentsPage from "../features/teachers/TeacherAssignmentsPage";
import AttendancesPage from "../features/attendances/AttendancesPage";
import SchedulesPage from "../features/schedules/SchedulesPage";
import ReportCardsPage from "../features/report-cards/ReportCardsPage";
import DisciplinePage from "../features/discipline/DisciplinePage";
import ProfilPage from "../features/profil/ProfilPage";
import SettingsPage from "../features/settings/SettingsPage";
import UsersPage from "../features/users/UsersPage";
import MyChildrenPage from "../features/children/MyChildrenPage";
import MyGradesPage from "../features/grades/MyGradesPage";
import MyAbsencesPage from "../features/attendances/MyAbsencesPage";

/** Enregistre la navigation impérative (intercepteur 401 → /login). */
function AuthNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator((to: string) => navigate(to));
  }, [navigate]);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <AuthNavigator />
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
    </>
  );
}
