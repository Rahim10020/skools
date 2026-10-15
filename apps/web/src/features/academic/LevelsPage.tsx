import type { IdName } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";
import {
  optionalNumberString,
  toOptionalNumber,
} from "../../components/crud/crud-helpers";

interface Level {
  id: string;
  name: string;
  order: number | null;
  cycleId: string;
  cycle: { id: string; name: string };
}

const schema = z.object({
  name: z.string().min(1, "Nom requis (Ex : 6ème, Seconde)"),
  cycleId: z.string().min(1, "Cycle requis"),
  order: optionalNumberString(),
});

export default function LevelsPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  const cyclesQuery = useQuery({
    queryKey: KEYS.cycles,
    queryFn: async () => (await api.get<IdName[]>(API.cycles)).data,
  });

  return (
    <CrudPage<Level>
      readOnly={role === ROLES.CENSEUR}
      title="Niveaux"
      description="Les niveaux rattachés à chaque cycle (6ème, 5ème, Seconde…)."
      itemLabel="niveau"
      createLabel="Nouveau niveau"
      queryKey={KEYS.levels}
      endpoint={API.levels}
      pageSize={10}
      searchPlaceholder="Rechercher un niveau…"
      filters={[
        {
          key: "cycle",
          label: "Cycle",
          param: "cycleId",
          options: (cyclesQuery.data ?? []).map((cycle) => ({
            label: cycle.name,
            value: cycle.id,
          })),
        },
      ]}
      csvFilename="niveaux"
      csvHeaders={["Niveau", "Cycle", "Ordre"]}
      toCsvRow={(level) => [
        level.name,
        level.cycle.name,
        level.order != null ? String(level.order) : "",
      ]}
      columns={[
        { header: "Niveau", primary: true, render: (level) => level.name },
        { header: "Cycle", render: (level) => level.cycle.name },
        { header: "Ordre", render: (level) => level.order ?? "—" },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : 6ème",
          required: true,
        },
        {
          name: "cycleId",
          label: "Cycle",
          type: "select",
          required: true,
          options: (cyclesQuery.data ?? []).map((cycle) => ({
            label: cycle.name,
            value: cycle.id,
          })),
        },
        {
          name: "order",
          label: "Ordre d'affichage",
          type: "number",
          placeholder: "Ex : 1",
        },
      ]}
      schema={schema}
      toDefaults={(level) => ({
        name: level?.name ?? "",
        cycleId: level?.cycleId ?? "",
        order: level?.order != null ? String(level.order) : "",
      })}
      toSubmit={(values) => ({
        name: values.name,
        cycleId: values.cycleId,
        order: toOptionalNumber(values.order),
      })}
      nameOf={(level) => level.name}
    />
  );
}
