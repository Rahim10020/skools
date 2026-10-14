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
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/use-modal";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

interface IdName {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface TeacherAssignment {
  id: string;
  teacher: { id: string; firstName: string; lastName: string };
  subject: { id: string; name: string };
  classroom: { id: string; name: string };
  academicYear: { id: string; name: string; isCurrent?: boolean };
}

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const isTeacher = role === "TEACHER";
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeacherAssignment | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-assignments", isTeacher ? "me" : "all"],
    queryFn: async () =>
      (await api.get<TeacherAssignment[]>(isTeacher ? "/teacher-assignments/me" : "/teacher-assignments")).data,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await api.get<TeacherOption[]>("/teachers")).data,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<IdName[]>("/subjects")).data,
  });
  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get<IdName[]>("/classrooms")).data,
  });
  const yearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get<IdName[]>("/academic-years")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { teacherId: string; subjectId: string; classroomId: string; academicYearId: string }) =>
      (await api.post("/teacher-assignments", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Affectation enregistrée");
      setTeacherId("");
      setSubjectId("");
      setClassroomId("");
      setAcademicYearId("");
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/teacher-assignments/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Affectation retirée");
      setRemoveTarget(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId || !subjectId || !classroomId || !academicYearId) {
      setFormError("Sélectionnez un enseignant, une matière, une classe et une année scolaire.");
      return;
    }
    setFormError(null);
    createMutation.mutate({ teacherId, subjectId, classroomId, academicYearId });
  };

  const assignments = assignmentsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title={isTeacher ? "Mes classes" : "Affectations"}
        description={
          isTeacher
            ? "Vos classes et matières assignées pour l'année en cours."
            : "Qui enseigne quelle matière, dans quelle classe, pour quelle année. Sans modification : retirer puis recréer."
        }
      />

      <div className="flex flex-col gap-p6">
        {!isTeacher && (
          <Card className="p-p4">
          <h2 className="text-sb16 text-(--skools-text-primary)">Nouvelle affectation</h2>
          <form onSubmit={handleCreate} className="mt-p4 grid grid-cols-1 gap-p4 md:grid-cols-2" noValidate>
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Enseignant</span>
              <Select
                label="Choisir…"
                value={teacherId}
                onChange={setTeacherId}
                options={(teachersQuery.data ?? []).map((teacher) => ({
                  label: `${teacher.lastName} ${teacher.firstName}`,
                  value: teacher.id,
                }))}
              />
            </div>
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Matière</span>
              <Select
                label="Choisir…"
                value={subjectId}
                onChange={setSubjectId}
                options={(subjectsQuery.data ?? []).map((subject) => ({
                  label: subject.name,
                  value: subject.id,
                }))}
              />
            </div>
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Classe</span>
              <Select
                label="Choisir…"
                value={classroomId}
                onChange={setClassroomId}
                options={(classroomsQuery.data ?? []).map((classroom) => ({
                  label: classroom.name,
                  value: classroom.id,
                }))}
              />
            </div>
            <div className="flex flex-col gap-p1">
              <span className="text-m12 text-(--skools-text-primary)">Année scolaire</span>
              <Select
                label="Choisir…"
                value={academicYearId}
                onChange={setAcademicYearId}
                options={(yearsQuery.data ?? []).map((year) => ({ label: year.name, value: year.id }))}
              />
            </div>
            {formError && (
              <p role="alert" className="text-r14 text-(--common-red) md:col-span-2">
                {formError}
              </p>
            )}
            <div className="md:col-span-2">
              <Button
                type="submit"
                fullWidth={false}
                variant={createMutation.isPending ? "loading" : "primary"}
                disabled={createMutation.isPending}
              >
                Affecter
              </Button>
            </div>
          </form>
        </Card>
        )}

        {assignmentsQuery.isError ? (
          <ErrorState
            message={getErrorMessage(assignmentsQuery.error)}
            onRetry={() => {
              void assignmentsQuery.refetch();
            }}
          />
        ) : assignmentsQuery.isPending ? (
          <Skeleton className="h-[200px] rounded-r2" />
        ) : assignments.length === 0 ? (
          <EmptyState
            title={isTeacher ? "Aucune classe assignée" : "Aucune affectation pour le moment"}
            description={
              isTeacher
                ? "Votre direction ne vous a encore assigné aucune classe. Contactez-la."
                : "Créez la première affectation avec le formulaire ci-dessus."
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  {!isTeacher && <TableHeaderCell>Enseignant</TableHeaderCell>}
                  <TableHeaderCell>Matière</TableHeaderCell>
                  <TableHeaderCell>Classe</TableHeaderCell>
                  <TableHeaderCell>Année scolaire</TableHeaderCell>
                  {!isTeacher && (
                    <TableHeaderCell>
                      <span className="sr-only">Actions</span>
                    </TableHeaderCell>
                  )}
                </tr>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    {!isTeacher && (
                      <TableCellPrimary>
                        {assignment.teacher.lastName} {assignment.teacher.firstName}
                      </TableCellPrimary>
                    )}
                    <TableCellPrimary>{assignment.subject.name}</TableCellPrimary>
                    <TableCell>{assignment.classroom.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-p2">
                        {assignment.academicYear.name}
                        {assignment.academicYear.isCurrent && (
                          <Badge variant="success">En cours</Badge>
                        )}
                      </span>
                    </TableCell>
                    {!isTeacher && (
                      <TableCell>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label={`Retirer l'affectation de ${assignment.teacher.firstName} ${assignment.teacher.lastName}`}
                            onClick={() => setRemoveTarget(assignment)}
                            className="text-r12 font-medium text-(--common-red) hover:underline"
                          >
                            Retirer
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <Modal.Root
        size="sm"
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        {removeTarget && (
          <Modal.Content labelledBy="remove-assignment-title">
            <Modal.Header>
              <Modal.Title id="remove-assignment-title">Retirer cette affectation ?</Modal.Title>
              <Modal.Description>
                {removeTarget.teacher.firstName} {removeTarget.teacher.lastName} —{" "}
                {removeTarget.subject.name} en {removeTarget.classroom.name}. Pour la modifier,
                retirez-la puis recréez-la.
              </Modal.Description>
            </Modal.Header>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="secondary" fullWidth={false}>
                  Annuler
                </Button>
              </Modal.Close>
              <Button
                fullWidth={false}
                variant={removeMutation.isPending ? "loading" : "primary"}
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(removeTarget.id)}
                className="bg-(--common-red)!"
              >
                Retirer
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>
    </div>
  );
}
