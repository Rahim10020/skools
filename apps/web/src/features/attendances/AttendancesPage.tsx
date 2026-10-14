import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCellPrimary,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/table";
import { Select } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const STATUS_META: Record<AttendanceStatus, { label: string; selectClass: string }> = {
  PRESENT: { label: "Présent", selectClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  ABSENT: { label: "Absent", selectClass: "bg-(--common-red)/10 text-(--common-red)" },
  LATE: { label: "Retard", selectClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  EXCUSED: { label: "Excusé", selectClass: "bg-(--common-blue)/10 text-(--common-blue)" },
};

const STATUSES = Object.keys(STATUS_META) as AttendanceStatus[];

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
}

interface ClassroomOption {
  id: string;
  name: string;
}

interface EnrollmentRow {
  classroomId: string;
  isActive: boolean;
  student: StudentRow | null;
}

interface ExistingAttendance {
  studentId: string;
  status: AttendanceStatus;
}

/** Date locale du jour au format YYYY-MM-DD (pas UTC, contrairement à toISOString). */
function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Appel quotidien (POST /attendances/bulk = upsert côté API).
 *
 * Le symptôme "présences qui disparaissent" venait du même schéma que les notes :
 * état local non resynchronisé après relecture. Ici la resynchro se fait par
 * ajustement pendant le rendu sur (classe, date, données serveur) : sélection
 * inchangée + saisie en cours = jamais écrasée ; relecture après save = réaffichée.
 */
interface MyAssignment {
  classroom: { id: string; name: string };
}

export default function AttendancesPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const isTeacher = role === "TEACHER";
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get<ClassroomOption[]>("/classrooms")).data,
    // Enseignant : classes issues de /teacher-assignments/me (403 sur /classrooms).
    enabled: !isTeacher,
  });
  const myAssignmentsQuery = useQuery({
    queryKey: ["teacher-assignments", "me"],
    queryFn: async () => (await api.get<MyAssignment[]>("/teacher-assignments/me")).data,
    enabled: isTeacher,
  });
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => (await api.get<EnrollmentRow[]>("/enrollments")).data,
  });
  const attendancesQuery = useQuery({
    queryKey: ["attendances", selectedClassroomId, selectedDate],
    queryFn: async () => {
      if (!selectedClassroomId || !selectedDate) return [];
      return (
        await api.get<ExistingAttendance[]>("/attendances", {
          params: { classroomId: selectedClassroomId, date: selectedDate },
        })
      ).data;
    },
    enabled: !!selectedClassroomId && !!selectedDate,
  });

  const studentsInClass = (enrollmentsQuery.data ?? [])
    .filter((e) => e.classroomId === selectedClassroomId && e.isActive && e.student)
    .map((e) => e.student as StudentRow);

  const serverAttendances = attendancesQuery.data;
  const syncKey = `${selectedClassroomId}|${selectedDate}`;
  const [prevSync, setPrevSync] = useState<{ key: string; data: typeof serverAttendances } | null>(null);
  if (prevSync?.key !== syncKey || prevSync?.data !== serverAttendances) {
    setPrevSync({ key: syncKey, data: serverAttendances });
    const next: Record<string, AttendanceStatus> = {};
    for (const student of studentsInClass) next[student.id] = "PRESENT";
    for (const att of serverAttendances ?? []) next[att.studentId] = att.status;
    setStatuses(next);
  }

  const saveMutation = useMutation({
    mutationFn: async () =>
      api.post("/attendances/bulk", {
        classroomId: selectedClassroomId,
        date: selectedDate,
        attendances: studentsInClass.map((student) => ({
          studentId: student.id,
          status: statuses[student.id] ?? "PRESENT",
        })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["attendances", selectedClassroomId, selectedDate],
      });
      await attendancesQuery.refetch();
      setSubmitError(null);
      toast.success("Présences enregistrées");
    },
    onError: (error) => setSubmitError(getErrorMessage(error)),
  });

  const counts = STATUSES.map((status) => ({
    status,
    count: studentsInClass.filter((s) => (statuses[s.id] ?? "PRESENT") === status).length,
  }));
  const recordedCount = (serverAttendances ?? []).length;

  // Options de classe : assignations dédupliquées pour TEACHER, référentiel sinon.
  const classroomOptions = isTeacher
    ? [...new Map((myAssignmentsQuery.data ?? []).map((a) => [a.classroom.id, a.classroom])).values()]
    : (classroomsQuery.data ?? []);
  const classroomPending = isTeacher ? myAssignmentsQuery.isPending : classroomsQuery.isPending;

  return (
    <div>
      <PageHeader
        title={isTeacher ? "Faire l'appel" : "Présences"}
        description={
          selectedClassroomId && recordedCount > 0
            ? `${recordedCount} relevé(s) enregistré(s) pour cette date.`
            : "Sélectionnez une classe et une date pour faire l'appel."
        }
      />

      <Card className="p-p4">
        {isTeacher && !classroomPending && classroomOptions.length === 0 ? (
          <EmptyState
            title="Aucune classe assignée"
            description="Votre direction ne vous a encore assigné aucune classe. Contactez-la."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-p4">
          <div className="flex flex-col gap-p1">
            <span className="text-m12 text-(--skools-text-primary)">Classe</span>
            <Select
              label="Choisir une classe…"
              value={selectedClassroomId}
              onChange={setSelectedClassroomId}
              loading={classroomPending}
              options={classroomOptions.map((classroom) => ({
                label: classroom.name,
                value: classroom.id,
              }))}
            />
          </div>
          <div className="flex flex-col gap-p1">
            <span className="text-m12 text-(--skools-text-primary)">Date</span>
            <Input
              variant="date"
              label="Date de l'appel"
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
          </div>
        )}
      </Card>

      {selectedClassroomId && (
        <div className="mt-p6">
          {attendancesQuery.isError ? (
            <ErrorState
              message={getErrorMessage(attendancesQuery.error)}
              onRetry={() => {
                void attendancesQuery.refetch();
              }}
            />
          ) : attendancesQuery.isPending || enrollmentsQuery.isPending ? (
            <Skeleton className="h-[240px] rounded-r2" />
          ) : studentsInClass.length === 0 ? (
            <EmptyState
              title="Aucun élève inscrit dans cette classe"
              description="Vérifiez les inscriptions pour cette classe."
            />
          ) : (
            <div className="flex flex-col gap-p4">
              <div className="flex flex-wrap gap-p2" aria-live="polite">
                {counts.map(({ status, count }) => (
                  <Badge
                    key={status}
                    variant={count > 0 ? (status === "PRESENT" ? "success" : status === "ABSENT" ? "destructive" : status === "LATE" ? "warning" : "default") : "neutral"}
                  >
                    {STATUS_META[status].label} : {count}
                  </Badge>
                ))}
              </div>

              <TableContainer>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Élève</TableHeaderCell>
                      <TableHeaderCell>Matricule</TableHeaderCell>
                      <TableHeaderCell>Statut</TableHeaderCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {studentsInClass.map((student) => {
                      const status = statuses[student.id] ?? "PRESENT";
                      return (
                        <TableRow key={student.id}>
                          <TableCellPrimary>
                            {student.lastName} {student.firstName}
                          </TableCellPrimary>
                          <TableCell>{student.matricule || "—"}</TableCell>
                          <TableCell>
                            <select
                              aria-label={`Statut de ${student.firstName} ${student.lastName}`}
                              value={status}
                              onChange={(e) =>
                                setStatuses((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value as AttendanceStatus,
                                }))
                              }
                              disabled={saveMutation.isPending}
                              className={[
                                "rounded-(--radius-r1) border border-(--skools-border-subtle) px-2 py-1 text-r14 outline-none disabled:opacity-50",
                                STATUS_META[status].selectClass,
                              ].join(" ")}
                            >
                              {STATUSES.map((option) => (
                                <option key={option} value={option}>
                                  {STATUS_META[option].label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="px-p6 py-4 border-t border-(--skools-border-subtle)">
                  {submitError && (
                    <p role="alert" className="text-r14 text-(--common-red) mb-p3">
                      {submitError}
                    </p>
                  )}
                  <Button
                    fullWidth={false}
                    variant={saveMutation.isPending ? "loading" : "primary"}
                    disabled={saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? "Enregistrement…" : "Enregistrer les présences"}
                  </Button>
                </div>
              </TableContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
