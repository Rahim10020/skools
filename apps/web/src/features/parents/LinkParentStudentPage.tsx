import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  RELATION_LABELS,
  RELATION_OPTIONS,
  type ParentRelation,
} from "./relations";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/use-modal";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

interface PersonOption {
  id: string;
  firstName: string;
  lastName: string;
  matricule?: string | null;
  phone?: string | null;
}

interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  relation: ParentRelation;
  isPrimary: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

export default function LinkParentStudentPage() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [parentId, setParentId] = useState("");
  const [relation, setRelation] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<ParentLink | null>(null);

  const studentsQuery = useQuery({
    queryKey: KEYS.students,
    queryFn: async () => (await api.get<PersonOption[]>(API.students)).data,
  });
  const parentsQuery = useQuery({
    queryKey: KEYS.parents,
    queryFn: async () => (await api.get<PersonOption[]>(API.parents)).data,
  });
  const linksQuery = useQuery({
    queryKey: KEYS.parentStudentsOfStudent(selectedStudentId),
    queryFn: async () => {
      if (!selectedStudentId) return [];
      return (
        await api.get<ParentLink[]>(
          apiPath.parentStudentsOfStudent(selectedStudentId),
        )
      ).data;
    },
    enabled: !!selectedStudentId,
  });

  const linkMutation = useMutation({
    mutationFn: async (data: {
      parentId: string;
      studentId: string;
      relation: ParentRelation;
      isPrimary: boolean;
    }) => (await api.post(API.parentStudents, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: KEYS.parentStudentsOfStudent(selectedStudentId),
      });
      toast.success("Parent lié avec succès");
      setParentId("");
      setRelation("");
      setIsPrimary(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(apiPath.withId(API.parentStudents, id))).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: KEYS.parentStudentsOfStudent(selectedStudentId),
      });
      toast.success("Lien supprimé avec succès");
      setUnlinkTarget(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleLink = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudentId || !parentId || !relation) {
      setFormError("Sélectionnez un élève, un parent et un lien de parenté.");
      return;
    }
    setFormError(null);
    linkMutation.mutate({
      parentId,
      studentId: selectedStudentId,
      relation: relation as ParentRelation,
      isPrimary,
    });
  };

  const links = linksQuery.data ?? [];
  const selectedStudent = (studentsQuery.data ?? []).find(
    (s) => s.id === selectedStudentId,
  );

  return (
    <div>
      <PageHeader
        title="Lier parents et élèves"
        description="Associez chaque élève à ses parents ou tuteurs (un lien = un parent + une relation)."
      />

      <div className="flex flex-col gap-p6">
        <Card className="p-p4">
          <label className="text-m12 text-(--skools-text-primary)">Élève</label>
          <div className="mt-p2">
            <Select
              label="Choisir un élève…"
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              options={(studentsQuery.data ?? []).map((student) => ({
                label: `${student.lastName} ${student.firstName}${student.matricule ? ` (${student.matricule})` : ""}`,
                value: student.id,
              }))}
            />
          </div>
        </Card>

        {selectedStudentId && (
          <Card className="p-p4">
            <h2 className="text-sb16 text-(--skools-text-primary)">
              Parents de {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}
            </h2>
            <div className="mt-p4">
              {linksQuery.isError ? (
                <ErrorState
                  message={getErrorMessage(linksQuery.error)}
                  onRetry={() => {
                    void linksQuery.refetch();
                  }}
                />
              ) : linksQuery.isPending ? (
                <Skeleton className="h-[64px] rounded-r2" count={2} />
              ) : links.length === 0 ? (
                <EmptyState
                  title="Aucun parent lié"
                  description="Utilisez le formulaire ci-dessous pour lier un parent à cet élève."
                />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHeaderCell>Parent</TableHeaderCell>
                        <TableHeaderCell>Téléphone</TableHeaderCell>
                        <TableHeaderCell>Lien</TableHeaderCell>
                        <TableHeaderCell>Principal</TableHeaderCell>
                        <TableHeaderCell>
                          <span className="sr-only">Actions</span>
                        </TableHeaderCell>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCellPrimary>
                            {link.parent.lastName} {link.parent.firstName}
                          </TableCellPrimary>
                          <TableCell>{link.parent.phone || "—"}</TableCell>
                          <TableCell>
                            {RELATION_LABELS[link.relation] ?? link.relation}
                          </TableCell>
                          <TableCell>
                            {link.isPrimary ? (
                              <Badge variant="success">Principal</Badge>
                            ) : (
                              <span className="text-(--skools-text-muted)">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                aria-label={`Dissocier ${link.parent.firstName} ${link.parent.lastName}`}
                                onClick={() => setUnlinkTarget(link)}
                                className="text-r12 font-medium text-(--common-red) hover:underline"
                              >
                                Dissocier
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          </Card>
        )}

        {selectedStudentId && (
          <Card className="p-p4">
            <h2 className="text-sb16 text-(--skools-text-primary)">
              Lier un parent
            </h2>
            <form
              onSubmit={handleLink}
              className="mt-p4 flex flex-col gap-p4"
              noValidate
            >
              <div className="flex flex-col gap-p1">
                <span className="text-m12 text-(--skools-text-primary)">
                  Parent
                </span>
                <Select
                  label="Choisir un parent…"
                  value={parentId}
                  onChange={setParentId}
                  options={(parentsQuery.data ?? []).map((parent) => ({
                    label: `${parent.lastName} ${parent.firstName}`,
                    value: parent.id,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-p1">
                <span className="text-m12 text-(--skools-text-primary)">
                  Lien de parenté
                </span>
                <Select
                  label="Choisir…"
                  value={relation}
                  onChange={setRelation}
                  disableSearch
                  options={RELATION_OPTIONS}
                />
              </div>
              <Checkbox
                label="Contact principal"
                checked={isPrimary}
                onChange={setIsPrimary}
              />
              {formError && (
                <p role="alert" className="text-r14 text-(--common-red)">
                  {formError}
                </p>
              )}
              <div>
                <Button
                  type="submit"
                  fullWidth={false}
                  variant={linkMutation.isPending ? "loading" : "primary"}
                  disabled={linkMutation.isPending}
                >
                  Lier le parent
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Modal.Root
        size="sm"
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      >
        {unlinkTarget && (
          <Modal.Content labelledBy="unlink-title">
            <Modal.Header>
              <Modal.Title id="unlink-title">Dissocier ce parent ?</Modal.Title>
              <Modal.Description>
                {unlinkTarget.parent.firstName} {unlinkTarget.parent.lastName}{" "}
                ne sera plus lié à cet élève. Le dossier du parent est conservé.
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
                variant={unlinkMutation.isPending ? "loading" : "primary"}
                disabled={unlinkMutation.isPending}
                onClick={() => unlinkMutation.mutate(unlinkTarget.id)}
                className="bg-(--common-red)!"
              >
                Dissocier
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>
    </div>
  );
}
