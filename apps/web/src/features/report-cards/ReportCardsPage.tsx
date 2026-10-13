import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
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
  const [viewMode, setViewMode] = useState<"student" | "classroom">("student");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get<StudentOption[]>("/students")).data,
  });
  const yearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get<IdName[]>("/academic-years")).data,
  });
  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get<IdName[]>("/classrooms")).data,
  });

  const studentReportQuery = useQuery({
    queryKey: ["report-card", selectedStudentId, selectedYearId],
    queryFn: async () =>
      (
        await api.get<StudentReport>("/report-cards/student", {
          params: { studentId: selectedStudentId, academicYearId: selectedYearId },
        })
      ).data,
    enabled: viewMode === "student" && !!selectedStudentId && !!selectedYearId,
  });

  const classroomQuery = useQuery({
    queryKey: ["classroom-overview", selectedClassroomId, selectedYearId],
    queryFn: async () =>
      (
        await api.get<ClassroomOverviewItem[]>("/report-cards/classroom", {
          params: { classroomId: selectedClassroomId, academicYearId: selectedYearId },
        })
      ).data,
    enabled: viewMode === "classroom" && !!selectedClassroomId && !!selectedYearId,
  });

  const studentReport = studentReportQuery.data ?? null;
  const overview = classroomQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Bulletins et moyennes"
        description="Bulletins calculés à la volée depuis les notes (lecture seule)."
        actions={
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
        }
      />

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
          {viewMode === "student" ? (
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
          ) : (
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
        {viewMode === "student" && selectedStudentId && selectedYearId && (
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

        {viewMode === "classroom" && selectedClassroomId && selectedYearId && (
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
    </div>
  );
}
