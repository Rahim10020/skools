import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import CreateEstablishmentPage from "./features/establishments/CreateEstablishmentPage";
import AcademicYearsPage from "./features/academic/AcademicYearsPage";
import ClassroomsPage from "./features/academic/ClassroomsPage";
import CyclesPage from "./features/academic/CyclesPage";
import LevelsPage from "./features/academic/LevelsPage";
import SeriesPage from "./features/academic/SeriesPage";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/create-establishment"
                element={<CreateEstablishmentPage />}
              />
              <Route path="/academic-years" element={<AcademicYearsPage />} />
              <Route path="/classrooms" element={<ClassroomsPage />} />
              <Route path="/cycles" element={<CyclesPage />} />
              <Route path="/levels" element={<LevelsPage />} />
              <Route path="/series" element={<SeriesPage />} />
            </Route>
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
