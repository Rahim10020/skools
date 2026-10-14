import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { ChildSelector } from "../../components/ChildSelector";
import {
  useEffectiveChildId,
  useMyChildren,
} from "../../lib/my-children";
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
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";

interface IdName {
  id: string;
  name: string;
  isCurrent?: boolean;
}

interface StudentOption extends IdName {
  firstName: string;
  lastName: string;
  matricule: string | null;
}

interface SubjectAverage {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  average: number | null;
  gradesCount: number;
}

interface StudentReport {
  student: { id: string; firstName: string; lastName: string; matricule: string | null };
  classroom: { id: string; name: string } | null;
  academicYear: { id: string; name: string } | null;
  subjects: SubjectAverage[];
  generalAverage: number | null;
}

interface ClassroomOverviewItem {
  student: { id: string; firstName: string; lastName: string; matricule: string | null };
  generalAverage: number | null;
  subjectsCount: number;
}

function formatAverage(value: number | null): string {
  return value === null ? "—" : `${value}/20`;
}

export default function ReportCardsPage() {
  const role = useAuthStore((state) => state.role);
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";
  const isFamily = isParent || isStudent;
  const childId = useEffectiveChildId(isParent);
  const childrenQuery = useMyChildren(isParent);

  const [viewMode, setViewMode] = useState<"student" | "classroom">("student");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");

  const studentsQuery = useQuery({
    queryKey: KEYS.students,
    queryFn: async () => (await api.get<StudentOption[]>(API.students)).data,
    // Famille : pas d'accès aux listes globales (matrice).
    enabled: !isFamily,
  });
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () => (await api.get<IdName[]>(API.academicYears)).data,
  });
  const periodsQuery = useQuery({
    queryKey: KEYS.periods,
    queryFn: async () => (await api.get<IdName[]>(API.periods)).data,
  });
  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
    enabled: !isFamily,
  });
  const meQuery = useQuery({
    queryKey: KEYS.studentsMe,
    queryFn: async () =>
      (await api.get<{ id: string }>(API.studentsMe)).data,
    enabled: isStudent,
  });

  // Famille : élève imposé (lui-même / enfant sélectionné), vue bulletin uniquement.
  const familyStudentId = isStudent ? (meQuery.data?.id ?? "") : childId;
  const effectiveStudentId = isFamily ? familyStudentId : selectedStudentId;
  const effectiveViewMode = isFamily ? "student" : viewMode;

  const studentReportQuery = useQuery({
    queryKey: KEYS.reportCard(effectiveStudentId, selectedYearId, selectedPeriodId),
    queryFn: async () =>
      (
        await api.get<StudentReport>(API.reportCardsStudent, {
          params: {
            studentId: effectiveStudentId,
            academicYearId: selectedYearId,
            ...(selectedPeriodId ? { periodId: selectedPeriodId } : {}),
          },
        })
      ).data,
    enabled: effectiveViewMode === "student" && !!effectiveStudentId && !!selectedYearId,
  });

  const classroomQuery = useQuery({
    queryKey: KEYS.classroomOverview(selectedClassroomId, selectedYearId),
    queryFn: async () =>
      (
        await api.get<ClassroomOverviewItem[]>(API.reportCardsClassroom, {
          params: { classroomId: selectedClassroomId, academicYearId: selectedYearId },
        })
      ).data,
    enabled: viewMode === "classroom" && !!selectedClassroomId && !!selectedYearId,
  });

  const studentReport = studentReportQuery.data ?? null;
  const overview = classroomQuery.data ?? [];

  // Famille : présélectionne l'année en cours (même pattern que GradesPage).
  const years = yearsQuery.data;
  const [prevYears, setPrevYears] = useState(years);
  if (years !== prevYears) {
    setPrevYears(years);
    if (isFamily && !selectedYearId) {
      const current = years?.find((year) => year.isCurrent) ?? years?.[0];
      if (current) setSelectedYearId(current.id);
    }
  }

  return (
    <div>
      <PageHeader
        title={isStudent ? "Mon bulletin" : isParent ? "Notes & bulletins" : "Bulletins et moyennes"}
        description={
          isFamily
            ? "Moyennes calculées à la volée depuis les notes (lecture seule)."
            : "Bulletins calculés à la volée depuis les notes (lecture seule)."
        }
        actions={
          isFamily ? undefined : (
            <div className="flex gap-p2" role="group" aria-label="Mode de vue">
              <Button
                fullWidth={false}
                variant={viewMode === "student" ? "primary" : "outline"}
                onClick={() => setViewMode("student")}
              >
                Bulletin élève
              </Button>
              <Button
                fullWidth={false}
                variant={viewMode === "classroom" ? "primary" : "outline"}
                onClick={() => setViewMode("classroom")}
              >
                Vue classe
              </Button>
            </div>
          )
        }
      />

      {isParent && <ChildSelector />}

      {isParent && !childrenQuery.isPending && (childrenQuery.data ?? []).length === 0 ? (
        <div className="mt-p6">
          <EmptyState
            title="Aucun enfant lié"
            description="Aucun enfant n'est lié à votre compte. Contactez la direction de l'établissement."
          />
        </div>
      ) : (
        <>
          <Card className="p-p4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-p4">
          <div className="flex flex-col gap-p1">
            <span className="text-m12 text-(--skools-text-primary)">Année scolaire</span>
            <Select
              label="Choisir…"
              value={selectedYearId}
              onChange={setSelectedYearId}
              options={(yearsQuery.data ?? []).map((year) => ({
                label: `${year.name}${year.isCurrent ? " (En cours)" : ""}`,
                value: year.id,
              }))}
            />
          </div>
          <div className="flex flex-col gap-p1">
            <span className="text-m12 text-(--skools-text-primary)">Période (optionnel)</span>
            <Select
              label="Toutes périodes"
              value={selectedPeriodId}
              onChange={setSelectedPeriodId}
              options={(periodsQuery.data ?? []).map((period) => ({
                label: period.name,
                value: period.id,
              }))}
            />
          </div>
          {!isFamily && viewMode === "student" && (
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Élève</span>
              <Select
                label="Choisir un élève…"
                value={selectedStudentId}
                onChange={setSelectedStudentId}
                options={(studentsQuery.data ?? []).map((student) => ({
                  label: `${student.lastName} ${student.firstName}`,
                  value: student.id,
                }))}
              />
            </div>
          )}
          {!isFamily && viewMode === "classroom" && (
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Classe</span>
              <Select
                label="Choisir une classe…"
                value={selectedClassroomId}
                onChange={setSelectedClassroomId}
                options={(classroomsQuery.data ?? []).map((classroom) => ({
                  label: classroom.name,
                  value: classroom.id,
                }))}
              />
            </div>
          )}
        </div>
      </Card>

      <div className="mt-p6">
        {effectiveViewMode === "student" && effectiveStudentId && selectedYearId && (
          <>
            {studentReportQuery.isError ? (
              <ErrorState
                message={getErrorMessage(studentReportQuery.error)}
                onRetry={() => {
                  void studentReportQuery.refetch();
                }}
              />
            ) : studentReportQuery.isPending ? (
              <Skeleton className="h-[280px] rounded-r2" />
            ) : !studentReport ? (
              <EmptyState
                title="Aucune donnée disponible"
                description="Aucune note saisie pour cet élève sur cette année."
              />
            ) : (
              <div className="flex flex-col gap-p6">
                <Card className="p-p6">
                  <h2 className="text-sb20 text-(--skools-text-primary)">
                    {studentReport.student.lastName} {studentReport.student.firstName}
                  </h2>
                  <p className="text-r14 text-(--skools-text-muted) mt-p1">
                    Matricule : {studentReport.student.matricule || "—"} · Classe :{" "}
                    {studentReport.classroom?.name || "—"} · Année :{" "}
                    {studentReport.academicYear?.name || "—"}
                  </p>
                  <p className="mt-p3 text-sb24 text-(--skools-text-primary)">
                    Moyenne générale : {formatAverage(studentReport.generalAverage)}
                  </p>
                </Card>

                {studentReport.subjects.length === 0 ? (
                  <EmptyState
                    title="Aucune matière évaluée"
                    description="Aucune note saisie pour cet élève sur cette année."
                  />
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHeader>
                        <tr>
                          <TableHeaderCell>Matière</TableHeaderCell>
                          <TableHeaderCell>Moyenne</TableHeaderCell>
                          <TableHeaderCell>Nb notes</TableHeaderCell>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {studentReport.subjects.map((subject) => (
                          <TableRow key={subject.subjectId}>
                            <TableCellPrimary>
                              {subject.subjectName}
                              {subject.subjectCode && (
                                <span className="text-(--skools-text-muted) ml-1">
                                  ({subject.subjectCode})
                                </span>
                              )}
                            </TableCellPrimary>
                            <TableCell>{formatAverage(subject.average)}</TableCell>
                            <TableCell>{subject.gradesCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            )}
          </>
        )}

        {effectiveViewMode === "classroom" && selectedClassroomId && selectedYearId && (
          <>
            {classroomQuery.isError ? (
              <ErrorState
                message={getErrorMessage(classroomQuery.error)}
                onRetry={() => {
                  void classroomQuery.refetch();
                }}
              />
            ) : classroomQuery.isPending ? (
              <Skeleton className="h-[280px] rounded-r2" />
            ) : overview.length === 0 ? (
              <EmptyState
                title="Aucun élève dans cette classe"
                description="Vérifiez les inscriptions pour cette classe et cette année."
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Rang</TableHeaderCell>
                      <TableHeaderCell>Élève</TableHeaderCell>
                      <TableHeaderCell>Matricule</TableHeaderCell>
                      <TableHeaderCell>Matières</TableHeaderCell>
                      <TableHeaderCell>Moyenne générale</TableHeaderCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {overview.map((item, index) => (
                      <TableRow key={item.student.id}>
                        <TableCellPrimary>{index + 1}</TableCellPrimary>
                        <TableCell>
                          {item.student.lastName} {item.student.firstName}
                        </TableCell>
                        <TableCell>{item.student.matricule || "—"}</TableCell>
                        <TableCell>{item.subjectsCount}</TableCell>
                        <TableCell>{formatAverage(item.generalAverage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
}
