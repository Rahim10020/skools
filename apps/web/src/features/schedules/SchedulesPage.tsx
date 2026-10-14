import { useState } from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { Select } from "../../components/ui/select";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { omitEmptyStrings } from "../../components/crud/crud-helpers";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface Schedule {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string | null;
  academicYearId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  classroom: { id: string; name: string };
  subject: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string } | null;
  academicYear: { id: string; name: string };
}

interface IdName {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAY_OPTIONS = (
  Object.entries(DAY_LABELS) as Array<[DayOfWeek, string]>
).map(([value, label]) => ({ label, value: value as string }));

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schema = z.object({
  classroomId: z.string().min(1, "Classe requise"),
  subjectId: z.string().min(1, "Matière requise"),
  teacherId: z.string().optional(),
  academicYearId: z.string().min(1, "Année scolaire requise"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(TIME_PATTERN, "Heure invalide (HH:mm)"),
  endTime: z.string().regex(TIME_PATTERN, "Heure invalide (HH:mm)"),
  room: z.string().optional(),
});

export default function SchedulesPage() {
  const [filterClassroomId, setFilterClassroomId] = useState("");
  const role = useAuthStore((state) => state.role);
  const isTeacher = role === "TEACHER";
  // Consultation seule : enseignant (ses classes), élève et parent (inscriptions).
  const isReadOnly = isTeacher || role === "STUDENT" || role === "PARENT";

  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get<IdName[]>("/classrooms")).data,
    // Lecture seule : créneaux déjà filtrés serveur ; noms inclus dans la réponse.
    enabled: !isReadOnly,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<IdName[]>("/subjects")).data,
    enabled: !isReadOnly,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await api.get<TeacherOption[]>("/teachers")).data,
    enabled: !isReadOnly,
  });
  const yearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get<IdName[]>("/academic-years")).data,
    enabled: !isReadOnly,
  });

  const toOptions = (data: IdName[] | undefined) =>
    (data ?? []).map((item) => ({ label: item.name, value: item.id }));

  return (
    <CrudPage<Schedule>
      title={
        role === "STUDENT" || isTeacher
          ? "Mon emploi du temps"
          : role === "PARENT"
            ? "Emploi du temps"
            : "Emplois du temps"
      }
      description={
        isReadOnly
          ? "Les créneaux de cours : jour, horaires, matière, classe, salle."
          : "Les créneaux de cours par classe : jour, horaires, matière, enseignant, salle."
      }
      readOnly={isReadOnly}
      itemLabel="créneau"
      createLabel="Nouveau créneau"
      queryKey={["schedules", filterClassroomId]}
      endpoint="/schedules"
      listPath={filterClassroomId ? `/schedules?classroomId=${filterClassroomId}` : "/schedules"}
      toolbarExtra={
        isReadOnly ? undefined : (
          <div className="max-w-md">
            <Select
              label="Filtrer par classe : Toutes"
              value={filterClassroomId}
              onChange={setFilterClassroomId}
              options={toOptions(classroomsQuery.data)}
            />
          </div>
        )
      }
      columns={[
        { header: "Jour", primary: true, render: (slot) => DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek },
        { header: "Horaires", render: (slot) => `${slot.startTime} – ${slot.endTime}` },
        { header: "Matière", render: (slot) => slot.subject.name },
        { header: "Classe", render: (slot) => slot.classroom.name },
        {
          header: "Enseignant",
          render: (slot) =>
            slot.teacher ? `${slot.teacher.lastName} ${slot.teacher.firstName}` : "—",
        },
        { header: "Salle", render: (slot) => slot.room || "—" },
      ]}
      fields={[
        {
          name: "classroomId",
          label: "Classe",
          type: "select",
          required: true,
          options: toOptions(classroomsQuery.data),
        },
        {
          name: "subjectId",
          label: "Matière",
          type: "select",
          required: true,
          options: toOptions(subjectsQuery.data),
        },
        {
          name: "teacherId",
          label: "Enseignant (optionnel)",
          type: "select",
          options: (teachersQuery.data ?? []).map((teacher) => ({
            label: `${teacher.lastName} ${teacher.firstName}`,
            value: teacher.id,
          })),
        },
        {
          name: "academicYearId",
          label: "Année scolaire",
          type: "select",
          required: true,
          options: toOptions(yearsQuery.data),
        },
        {
          name: "dayOfWeek",
          label: "Jour",
          type: "select",
          required: true,
          disableSelectSearch: true,
          options: DAY_OPTIONS,
        },
        { name: "startTime", label: "Début", type: "time", required: true },
        { name: "endTime", label: "Fin", type: "time", required: true },
        { name: "room", label: "Salle (optionnel)", type: "text", placeholder: "Ex : Salle 12" },
      ]}
      schema={schema}
      toDefaults={(slot) => ({
        classroomId: slot?.classroomId ?? "",
        subjectId: slot?.subjectId ?? "",
        teacherId: slot?.teacherId ?? "",
        academicYearId: slot?.academicYearId ?? "",
        dayOfWeek: slot?.dayOfWeek ?? "MONDAY",
        startTime: slot?.startTime ?? "",
        endTime: slot?.endTime ?? "",
        room: slot?.room ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          classroomId: values.classroomId,
          subjectId: values.subjectId,
          teacherId: values.teacherId === "" ? undefined : values.teacherId,
          academicYearId: values.academicYearId,
          dayOfWeek: values.dayOfWeek,
          startTime: values.startTime,
          endTime: values.endTime,
          room: values.room,
        })
      }
      nameOf={(slot) =>
        `${DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek} ${slot.startTime}–${slot.endTime} — ${slot.subject.name}`
      }
    />
  );
}
