import type { IdName } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";

interface Series {
  id: string;
  name: string;
  levelId: string | null;
  level: { id: string; name: string } | null;
}

const schema = z.object({
  name: z.string().min(1, "Nom requis (Ex : A, C, D, S, L)"),
  levelId: z.string().optional(),
});

export default function SeriesPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  const levelsQuery = useQuery({
    queryKey: KEYS.levels,
    queryFn: async () => (await api.get<IdName[]>(API.levels)).data,
  });

  return (
    <CrudPage<Series>
      readOnly={role === ROLES.CENSEUR}
      title="Séries"
      description="Les séries rattachées aux niveaux (A, C, D, S, L…)."
      itemLabel="série"
      createLabel="Nouvelle série"
      queryKey={KEYS.series}
      endpoint={API.series}
      columns={[
        { header: "Série", primary: true, render: (series) => series.name },
        { header: "Niveau", render: (series) => series.level?.name ?? "—" },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : A",
          required: true,
        },
        {
          name: "levelId",
          label: "Niveau (optionnel)",
          type: "select",
          options: (levelsQuery.data ?? []).map((level) => ({
            label: level.name,
            value: level.id,
          })),
        },
      ]}
      schema={schema}
      toDefaults={(series) => ({
        name: series?.name ?? "",
        levelId: series?.levelId ?? "",
      })}
      toSubmit={(values) => ({
        name: values.name,
        levelId: values.levelId === "" ? undefined : values.levelId,
      })}
      nameOf={(series) => series.name}
    />
  );
}
