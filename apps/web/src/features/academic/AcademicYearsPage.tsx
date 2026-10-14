import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import { Badge } from "../../components/ui/badge";
import {
  formatDateFr,
  omitEmptyStrings,
  toDateInput,
} from "../../components/crud/crud-helpers";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const schema = z.object({
  name: z.string().min(4, "Ex : 2025-2026"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  isCurrent: z.enum(["true", "false"]).optional(),
});

export default function AcademicYearsPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  return (
    <CrudPage<AcademicYear>
      readOnly={role === ROLES.CENSEUR}
      title="Années scolaires"
      description="Définissez les années scolaires et désignez l'année en cours."
      itemLabel="année scolaire"
      createLabel="Nouvelle année"
      queryKey={KEYS.academicYears}
      endpoint={API.academicYears}
      columns={[
        { header: "Année", primary: true, render: (year) => year.name },
        { header: "Début", render: (year) => formatDateFr(year.startDate) },
        { header: "Fin", render: (year) => formatDateFr(year.endDate) },
        {
          header: "Statut",
          render: (year) =>
            year.isCurrent ? (
              <Badge variant="success">En cours</Badge>
            ) : (
              <span className="text-(--skools-text-muted)">—</span>
            ),
        },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : 2025-2026",
          required: true,
        },
        {
          name: "startDate",
          label: "Date de début",
          type: "date",
          required: true,
        },
        { name: "endDate", label: "Date de fin", type: "date", required: true },
        { name: "isCurrent", label: "Année en cours", type: "checkbox" },
      ]}
      schema={schema}
      toDefaults={(year) => ({
        name: year?.name ?? "",
        startDate: toDateInput(year?.startDate),
        endDate: toDateInput(year?.endDate),
        isCurrent: year ? String(year.isCurrent) : "false",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          isCurrent: values.isCurrent === "true",
        })
      }
      nameOf={(year) => year.name}
    />
  );
}
