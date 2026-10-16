import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import { omitEmptyStrings } from "../../components/crud/crud-helpers";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  code: z.string().optional(),
  description: z.string().optional(),
});

export default function SubjectsPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  return (
    <CrudPage<Subject>
      readOnly={role === ROLES.CENSEUR}
      title="Matières"
      description="Les matières enseignées dans l'établissement."
      itemLabel="matière"
      pluralLabel="matières"
      createLabel="Nouvelle matière"
      queryKey={KEYS.subjects}
      endpoint={API.subjects}
      searchPlaceholder="Rechercher une matière…"
      columns={[
        { header: "Matière", primary: true, render: (subject) => subject.name },
        { header: "Code", render: (subject) => subject.code || "—" },
        {
          header: "Description",
          render: (subject) => subject.description || "—",
        },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : Mathématiques",
          required: true,
        },
        { name: "code", label: "Code", type: "text", placeholder: "Ex : MATH" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      schema={schema}
      toDefaults={(subject) => ({
        name: subject?.name ?? "",
        code: subject?.code ?? "",
        description: subject?.description ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          name: values.name,
          code: values.code,
          description: values.description,
        })
      }
      nameOf={(subject) => subject.name}
    />
  );
}
