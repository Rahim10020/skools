import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                Skools
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Tableau de bord
                </Link>
                <Link
                  to="/academic-years"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Années scolaires
                </Link>
                <Link
                  to="/classrooms"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Classes
                </Link>
                <Link
                  to="/cycles"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Cycles
                </Link>
                <Link
                  to="/levels"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Niveaux
                </Link>
                <Link
                  to="/series"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Séries
                </Link>
                <Link
                  to="/subjects"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Matières
                </Link>
                <Link
                  to="/periods"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Périodes
                </Link>
                <Link
                  to="/students"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Élèves
                </Link>
                <Link
                  to="/teachers"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Enseignants
                </Link>
                <Link
                  to="/parents"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Parents
                </Link>
                <Link
                  to="/enrollments"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Inscriptions
                </Link>
                <Link
                  to="/exams"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Examens
                </Link>
                <Link
                  to="/grades"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Notes
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
