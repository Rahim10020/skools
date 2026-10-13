import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
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
  return (
    <CrudPage<Cycle>
      title="Cycles"
      description="Les grands cycles d'enseignement (Primaire, Collège, Lycée)."
      itemLabel="cycle"
      createLabel="Nouveau cycle"
      queryKey={["cycles"]}
      endpoint="/cycles"
      columns={[
        { header: "Cycle", primary: true, render: (cycle) => cycle.name },
        { header: "Ordre", render: (cycle) => cycle.order ?? "—" },
      ]}
      fields={[
        { name: "name", label: "Nom", type: "text", placeholder: "Ex : Primaire", required: true },
        { name: "order", label: "Ordre d'affichage", type: "number", placeholder: "Ex : 1" },
      ]}
      schema={schema}
      toDefaults={(cycle) => ({
        name: cycle?.name ?? "",
        order: cycle?.order != null ? String(cycle.order) : "",
      })}
      toSubmit={(values) => ({ name: values.name, order: toOptionalNumber(values.order) })}
      nameOf={(cycle) => cycle.name}
    />
  );
}
