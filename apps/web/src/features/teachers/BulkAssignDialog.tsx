import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/use-modal";
import { Select } from "../../components/ui/select";
import { getErrorMessage } from "../../lib/api";
import { XIcon } from "../../components/icons/XIcon";
import PlusIcon from "../../components/icons/PlusIcon";

interface Option {
  label: string;
  value: string;
}

interface AssignRow {
  key: number;
  subjectId: string;
  classroomId: string;
}

export interface BulkAssignPayload {
  teacherId: string;
  academicYearId: string;
  assignments: { subjectId: string; classroomId: string }[];
}

export interface BulkAssignResult {
  total: number;
  created: number;
  errors: { line: number; message: string }[];
}

let rowSeq = 0;
const newRow = (): AssignRow => ({ key: rowSeq++, subjectId: "", classroomId: "" });

export function BulkAssignDialog({
  open,
  onOpenChange,
  teachers,
  subjects,
  classrooms,
  years,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Option[];
  subjects: Option[];
  classrooms: Option[];
  years: Option[];
  onSubmit: (payload: BulkAssignPayload) => Promise<BulkAssignResult>;
}) {
  const [teacherId, setTeacherId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [rows, setRows] = useState<AssignRow[]>([newRow()]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkAssignResult | null>(null);

  const reset = () => {
    setTeacherId("");
    setAcademicYearId("");
    setRows([newRow()]);
    setPending(false);
    setError(null);
    setResult(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const updateRow = (key: number, patch: Partial<AssignRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const filledRows = rows.filter(
    (row) => row.subjectId && row.classroomId,
  );

  const handleSubmit = async () => {
    setError(null);
    if (!teacherId || !academicYearId) {
      setError("Sélectionnez un enseignant et une année scolaire.");
      return;
    }
    if (filledRows.length === 0) {
      setError("Ajoutez au moins une matière et une classe.");
      return;
    }
    setPending(true);
    try {
      const response = await onSubmit({
        teacherId,
        academicYearId,
        assignments: filledRows.map((row) => ({
          subjectId: row.subjectId,
          classroomId: row.classroomId,
        })),
      });
      setResult(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())} size="lg">
      {open && (
        <Modal.Content
          labelledBy="bulk-assign-title"
          describedBy="bulk-assign-desc"
        >
          <Modal.Header className="flex flex-col gap-p1">
            <Modal.Title id="bulk-assign-title">
              Affecter plusieurs classes
            </Modal.Title>
            <Modal.Description id="bulk-assign-desc">
              Un enseignant, une année scolaire, plusieurs couples matière /
              classe en une fois.
            </Modal.Description>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-p4">
            {result ? (
              <div className="flex flex-col gap-p3">
                <p className="text-r14 text-(--skools-text-primary)">
                  <strong>{result.created}</strong> affectation(s) créée(s) sur{" "}
                  {result.total}.
                </p>
                {result.errors.length > 0 && (
                  <div className="max-h-60 overflow-y-auto rounded-r2 border border-(--skools-border-subtle)">
                    {result.errors.map((item) => (
                      <div
                        key={`${item.line}-${item.message}`}
                        className="flex gap-p3 px-p3 py-p2 text-r12 border-b border-(--skools-border-subtle) last:border-0"
                      >
                        <span className="text-(--skools-text-muted) min-w-16">
                          Ligne {item.line}
                        </span>
                        <span className="text-(--common-red)">{item.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-p4">
                  <div className="flex flex-col gap-p1">
                    <span className="text-m12 text-(--skools-text-primary)">
                      Enseignant <span className="text-(--common-red)">*</span>
                    </span>
                    <Select
                      label="Choisir…"
                      value={teacherId}
                      onChange={setTeacherId}
                      options={teachers}
                    />
                  </div>
                  <div className="flex flex-col gap-p1">
                    <span className="text-m12 text-(--skools-text-primary)">
                      Année scolaire{" "}
                      <span className="text-(--common-red)">*</span>
                    </span>
                    <Select
                      label="Choisir…"
                      value={academicYearId}
                      onChange={setAcademicYearId}
                      options={years}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-p3">
                  {rows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-p3 items-center"
                    >
                      <Select
                        label="Matière"
                        value={row.subjectId}
                        onChange={(value) =>
                          updateRow(row.key, { subjectId: value })
                        }
                        options={subjects}
                      />
                      <Select
                        label="Classe"
                        value={row.classroomId}
                        onChange={(value) =>
                          updateRow(row.key, { classroomId: value })
                        }
                        options={classrooms}
                      />
                      <button
                        type="button"
                        aria-label="Retirer cette ligne"
                        disabled={rows.length === 1}
                        onClick={() =>
                          setRows((prev) =>
                            prev.filter((item) => item.key !== row.key),
                          )
                        }
                        className="justify-self-start sm:justify-self-center text-(--skools-text-muted) hover:text-(--common-red) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRows((prev) => [...prev, newRow()])}
                    className="inline-flex items-center gap-p2 self-start text-r12 text-(--skools-text-muted) hover:text-(--skools-text-primary) transition-colors"
                  >
                    <PlusIcon className="size-3.5" />
                    Ajouter une ligne
                  </button>
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="text-r14 text-(--common-red)">
                {error}
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            {result ? (
              <Button fullWidth={false} variant="primary" onClick={close}>
                Fermer
              </Button>
            ) : (
              <>
                <Modal.Close>
                  <Button variant="secondary" fullWidth={false}>
                    Annuler
                  </Button>
                </Modal.Close>
                <Button
                  fullWidth={false}
                  variant={pending ? "loading" : "primary"}
                  disabled={pending}
                  onClick={handleSubmit}
                >
                  Affecter {filledRows.length || ""}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal.Content>
      )}
    </Modal.Root>
  );
}
