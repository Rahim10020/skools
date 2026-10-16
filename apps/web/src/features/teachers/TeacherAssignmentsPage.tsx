import type { IdName, PersonRef } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Select } from "../../components/ui/select";
import { DataList } from "../../components/data-list/DataList";
import { Modal } from "../../components/ui/use-modal";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

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
  const isTeacher = role === ROLES.TEACHER;
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeacherAssignment | null>(
    null,
  );

  const assignmentsQuery = useQuery({
    queryKey: isTeacher
      ? KEYS.teacherAssignmentsMe
      : KEYS.teacherAssignmentsAll,
    queryFn: async () =>
      (
        await api.get<TeacherAssignment[]>(
          isTeacher ? API.teacherAssignmentsMe : API.teacherAssignments,
        )
      ).data,
  });
  const teachersQuery = useQuery({
    queryKey: KEYS.teachers,
    queryFn: async () => (await api.get<PersonRef[]>(API.teachers)).data,
    // Enseignant : vue « Mes classes » en lecture seule (pas d'accès aux référentiels).
    enabled: !isTeacher,
  });
  const subjectsQuery = useQuery({
    queryKey: KEYS.subjects,
    queryFn: async () => (await api.get<IdName[]>(API.subjects)).data,
    enabled: !isTeacher,
  });
  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
    enabled: !isTeacher,
  });
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () => (await api.get<IdName[]>(API.academicYears)).data,
    enabled: !isTeacher,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      teacherId: string;
      subjectId: string;
      classroomId: string;
      academicYearId: string;
    }) => (await api.post(API.teacherAssignments, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.teacherAssignments });
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
    mutationFn: async (id: string) =>
      (await api.delete(apiPath.withId(API.teacherAssignments, id))).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.teacherAssignments });
      toast.success("Affectation retirée");
      setRemoveTarget(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId || !subjectId || !classroomId || !academicYearId) {
      setFormError(
        "Sélectionnez un enseignant, une matière, une classe et une année scolaire.",
      );
      return;
    }
    setFormError(null);
    createMutation.mutate({
      teacherId,
      subjectId,
      classroomId,
      academicYearId,
    });
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
            <h2 className="text-sb16 text-(--skools-text-primary)">
              Nouvelle affectation
            </h2>
            <form
              onSubmit={handleCreate}
              className="mt-p4 grid grid-cols-1 gap-p4 md:grid-cols-2"
              noValidate
            >
              <div className="flex flex-col gap-p1">
                <span className="text-m12 text-(--skools-text-primary)">
                  Enseignant
                </span>
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
                <span className="text-m12 text-(--skools-text-primary)">
                  Matière
                </span>
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
                <span className="text-m12 text-(--skools-text-primary)">
                  Classe
                </span>
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
                <span className="text-m12 text-(--skools-text-primary)">
                  Année scolaire
                </span>
                <Select
                  label="Choisir…"
                  value={academicYearId}
                  onChange={setAcademicYearId}
                  options={(yearsQuery.data ?? []).map((year) => ({
                    label: year.name,
                    value: year.id,
                  }))}
                />
              </div>
              {formError && (
                <p
                  role="alert"
                  className="text-r14 text-(--common-red) md:col-span-2"
                >
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
            title={
              isTeacher
                ? "Aucune classe assignée"
                : "Aucune affectation pour le moment"
            }
            description={
              isTeacher
                ? "Votre direction ne vous a encore assigné aucune classe. Contactez-la."
                : "Créez la première affectation avec le formulaire ci-dessus."
            }
          />
        ) : (
          <DataList
            items={assignments}
            columns={[
              ...(!isTeacher
                ? [
                    {
                      header: "Enseignant",
                      primary: true,
                      render: (assignment: TeacherAssignment) =>
                        `${assignment.teacher.lastName} ${assignment.teacher.firstName}`,
                    },
                  ]
                : []),
              {
                header: "Matière",
                primary: isTeacher,
                render: (assignment: TeacherAssignment) =>
                  assignment.subject.name,
              },
              {
                header: "Classe",
                render: (assignment: TeacherAssignment) =>
                  assignment.classroom.name,
              },
              {
                header: "Année scolaire",
                render: (assignment: TeacherAssignment) =>
                  assignment.academicYear.name,
              },
            ]}
            idOf={(assignment) => assignment.id}
            nameOf={(assignment) =>
              `${assignment.subject.name} en ${assignment.classroom.name}`
            }
            statusPill={(assignment) =>
              assignment.academicYear.isCurrent
                ? { label: "En cours", variant: "success" as const }
                : null
            }
            readOnly={isTeacher}
            onDelete={
              isTeacher ? undefined : (assignment) => setRemoveTarget(assignment)
            }
            actionLabels={{ remove: "Retirer" }}
          />
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
              <Modal.Title id="remove-assignment-title">
                Retirer cette affectation ?
              </Modal.Title>
              <Modal.Description>
                {removeTarget.teacher.firstName} {removeTarget.teacher.lastName}{" "}
                — {removeTarget.subject.name} en {removeTarget.classroom.name}.
                Pour la modifier, retirez-la puis recréez-la.
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
