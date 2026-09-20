import { useAuthStore } from "../../stores/auth-store";

export default function DashboardPage() {
  const { user, role, establishmentId } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
      <p className="text-gray-600 mb-8">
        Bienvenue, {user?.firstName} {user?.lastName}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Rôle</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {role || "Non défini"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Établissement</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {establishmentId ? "Lié" : "Aucun établissement"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
