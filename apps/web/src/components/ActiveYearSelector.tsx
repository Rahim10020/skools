import { API } from "../lib/api-endpoints";
import { KEYS } from "../lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import { useAcademicYearStore } from "../stores/academic-year-store";
import { Select } from "./ui/select";

interface AcademicYearOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

/**
 * Sélecteur d'année scolaire active (matrice, règles header 2/6).
 * Masqué : replié, sans établissement, SUPER_ADMIN.
 */
export function ActiveYearSelector({ collapsed }: { collapsed: boolean }) {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const role = useAuthStore((s) => s.role);
  const storedEstablishmentId = useAcademicYearStore((s) => s.establishmentId);
  const activeYearId = useAcademicYearStore((s) => s.activeYearId);
  const setActiveYear = useAcademicYearStore((s) => s.setActiveYear);

  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () =>
      (await api.get<AcademicYearOption[]>(API.academicYears)).data,
    enabled: !!establishmentId && role !== "SUPER_ADMIN",
  });

  if (!establishmentId || role === "SUPER_ADMIN" || collapsed) return null;

  const years = yearsQuery.data ?? [];
  const effectiveYearId =
    storedEstablishmentId === establishmentId && activeYearId
      ? activeYearId
      : (years.find((year) => year.isCurrent)?.id ?? years[0]?.id ?? "");

  return (
    <div className="px-p4 pb-p3">
      <span className="text-m12 text-(--skools-text-primary)">
        Année scolaire
      </span>
      <div className="mt-p1">
        <Select
          label="Choisir…"
          value={effectiveYearId}
          onChange={(value) => setActiveYear(establishmentId, value)}
          disableSearch={years.length <= 5}
          options={years.map((year) => ({
            label: `${year.name}${year.isCurrent ? " (En cours)" : ""}`,
            value: year.id,
          }))}
        />
      </div>
    </div>
  );
}
