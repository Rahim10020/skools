import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import {
  optionalNumberString,
  toOptionalNumber,
} from "../../components/crud/crud-helpers";

interface Cycle {
  id: string;
  name: string;
  order: number | null;
}

const schema = z.object({
  name: z.string().min(2, "Nom requis (Ex : Primaire, Collège, Lycée)"),
  order: optionalNumberString(),
});

export default function CyclesPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  return (
    <CrudPage<Cycle>
      readOnly={role === ROLES.CENSEUR}
      title="Cycles"
      description="Les grands cycles d'enseignement (Primaire, Collège, Lycée)."
      itemLabel="cycle"
      createLabel="Nouveau cycle"
      queryKey={KEYS.cycles}
      endpoint={API.cycles}
      searchPlaceholder="Rechercher un cycle…"
      pageSize={10}
      csvFilename="cycles"
      csvHeaders={["Cycle", "Ordre"]}
      toCsvRow={(cycle) => [cycle.name, cycle.order != null ? String(cycle.order) : ""]}
      columns={[
        { header: "Cycle", primary: true, render: (cycle) => cycle.name },
        { header: "Ordre", render: (cycle) => cycle.order ?? "—" },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : Primaire",
          required: true,
        },
        {
          name: "order",
          label: "Ordre d'affichage",
          type: "number",
          placeholder: "Ex : 1",
        },
      ]}
      schema={schema}
      toDefaults={(cycle) => ({
        name: cycle?.name ?? "",
        order: cycle?.order != null ? String(cycle.order) : "",
      })}
      toSubmit={(values) => ({
        name: values.name,
        order: toOptionalNumber(values.order),
      })}
      nameOf={(cycle) => cycle.name}
    />
  );
}
