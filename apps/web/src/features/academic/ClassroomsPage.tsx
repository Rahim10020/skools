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

interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  academicYearId: string;
  levelId: string;
  seriesId: string | null;
  academicYear: { id: string; name: string };
  level: { id: string; name: string };
  series: { id: string; name: string } | null;
}

const schema = z.object({
  academicYearId: z.string().min(1, "Année scolaire requise"),
  levelId: z.string().min(1, "Niveau requis"),
  seriesId: z.string().optional(),
  name: z.string().min(1, "Nom requis (Ex : 6ème A)"),
  capacity: optionalNumberString(),
});

export default function ClassroomsPage() {
  const role = useAuthStore((state) => state.role);
  // CENSEUR : supervision en lecture seule (matrice), écritures refusées 403.
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () => (await api.get<IdName[]>(API.academicYears)).data,
  });
  const levelsQuery = useQuery({
    queryKey: KEYS.levels,
    queryFn: async () => (await api.get<IdName[]>(API.levels)).data,
  });
  const seriesQuery = useQuery({
    queryKey: KEYS.series,
    queryFn: async () => (await api.get<IdName[]>(API.series)).data,
  });

  const toOptions = (data: IdName[] | undefined) =>
    (data ?? []).map((item) => ({ label: item.name, value: item.id }));

  return (
    <CrudPage<Classroom>
      readOnly={role === ROLES.CENSEUR}
      title="Classes"
      description="Les classes de l'établissement, par année, niveau et série."
      itemLabel="classe"
      pluralLabel="classes"
      createLabel="Nouvelle classe"
      queryKey={KEYS.classrooms}
      endpoint={API.classrooms}
      pageSize={10}
      searchPlaceholder="Rechercher une classe…"
      filters={[
        {
          key: "level",
          label: "Niveau",
          param: "levelId",
          options: toOptions(levelsQuery.data),
        },
        {
          key: "series",
          label: "Série",
          param: "seriesId",
          options: toOptions(seriesQuery.data),
        },
        {
          key: "year",
          label: "Année",
          param: "academicYearId",
          options: toOptions(yearsQuery.data),
        },
      ]}
      csvFilename="classes"
      csvHeaders={["Classe", "Année scolaire", "Niveau", "Série", "Effectif max"]}
      toCsvRow={(classroom) => [
        classroom.name,
        classroom.academicYear.name,
        classroom.level.name,
        classroom.series?.name ?? "",
        classroom.capacity != null ? String(classroom.capacity) : "",
      ]}
      columns={[
        {
          header: "Classe",
          primary: true,
          render: (classroom) => classroom.name,
        },
        {
          header: "Année scolaire",
          render: (classroom) => classroom.academicYear.name,
        },
        { header: "Niveau", render: (classroom) => classroom.level.name },
        {
          header: "Série",
          render: (classroom) => classroom.series?.name ?? "—",
        },
        {
          header: "Effectif max",
          render: (classroom) => classroom.capacity ?? "—",
        },
      ]}
      fields={[
        {
          name: "academicYearId",
          label: "Année scolaire",
          type: "select",
          required: true,
          options: toOptions(yearsQuery.data),
        },
        {
          name: "levelId",
          label: "Niveau",
          type: "select",
          required: true,
          options: toOptions(levelsQuery.data),
        },
        {
          name: "seriesId",
          label: "Série (optionnel)",
          type: "select",
          options: toOptions(seriesQuery.data),
        },
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : 6ème A",
          required: true,
        },
        {
          name: "capacity",
          label: "Effectif maximum",
          type: "number",
          placeholder: "Ex : 40",
        },
      ]}
      schema={schema}
      toDefaults={(classroom) => ({
        academicYearId: classroom?.academicYearId ?? "",
        levelId: classroom?.levelId ?? "",
        seriesId: classroom?.seriesId ?? "",
        name: classroom?.name ?? "",
        capacity: classroom?.capacity != null ? String(classroom.capacity) : "",
      })}
      toSubmit={(values) => ({
        academicYearId: values.academicYearId,
        levelId: values.levelId,
        seriesId: values.seriesId === "" ? undefined : values.seriesId,
        name: values.name,
        capacity: toOptionalNumber(values.capacity),
      })}
      nameOf={(classroom) => classroom.name}
    />
  );
}
