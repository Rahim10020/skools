import type { AcademicYearRef } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import type { StatusPillVariant } from "../../components/epl-list/StatusPill";
import api from "../../lib/api";
import {
  formatDateFr,
  optionalNumberString,
  toDateInput,
  toOptionalNumber,
} from "../../components/crud/crud-helpers";

interface Period {
  id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  order: number | null;
  academicYear: { id: string; name: string; isCurrent?: boolean };
}

const schema = z.object({
  academicYearId: z.string().min(1, "Année scolaire requise"),
  name: z.string().min(2, "Nom requis (Ex : Trimestre 1)"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  order: optionalNumberString(),
});

export default function PeriodsPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () =>
      (await api.get<AcademicYearRef[]>(API.academicYears)).data,
  });

  return (
    <CrudPage<Period>
      readOnly={role === ROLES.CENSEUR}
      title="Périodes"
      description="Les périodes d'évaluation de chaque année (trimestres, semestres)."
      itemLabel="période"
      createLabel="Nouvelle période"
      queryKey={KEYS.periods}
      endpoint={API.periods}
      searchPlaceholder="Rechercher une période…"
      filters={[
        {
          key: "year",
          label: "Année",
          param: "academicYearId",
          options: (yearsQuery.data ?? []).map((year) => ({
            label: year.name,
            value: year.id,
          })),
        },
      ]}
      statusPill={(period) =>
        period.academicYear.isCurrent
          ? { label: "En cours", variant: "success" as StatusPillVariant }
          : null
      }
      columns={[
        { header: "Période", primary: true, render: (period) => period.name },
        {
          header: "Année scolaire",
          render: (period) => period.academicYear.name,
        },
        { header: "Début", render: (period) => formatDateFr(period.startDate) },
        { header: "Fin", render: (period) => formatDateFr(period.endDate) },
        { header: "Ordre", render: (period) => period.order ?? "—" },
      ]}
      fields={[
        {
          name: "academicYearId",
          label: "Année scolaire",
          type: "select",
          required: true,
          options: (yearsQuery.data ?? []).map((year) => ({
            label: year.name,
            value: year.id,
          })),
        },
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : Trimestre 1",
          required: true,
        },
        {
          name: "startDate",
          label: "Date de début",
          type: "date",
          required: true,
        },
        { name: "endDate", label: "Date de fin", type: "date", required: true },
        {
          name: "order",
          label: "Ordre d'affichage",
          type: "number",
          placeholder: "Ex : 1",
        },
      ]}
      schema={schema}
      toDefaults={(period) => ({
        academicYearId: period?.academicYearId ?? "",
        name: period?.name ?? "",
        startDate: toDateInput(period?.startDate),
        endDate: toDateInput(period?.endDate),
        order: period?.order != null ? String(period.order) : "",
      })}
      toSubmit={(values) => ({
        academicYearId: values.academicYearId,
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        order: toOptionalNumber(values.order),
      })}
      nameOf={(period) => period.name}
    />
  );
}
