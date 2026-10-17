import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { unwrapList, type PaginatedList } from "../../hooks/use-crud";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/use-modal";
import { Select } from "../../components/ui/select";
import { toast } from "../../components/ui/toast";
import { XIcon } from "../../components/icons/XIcon";

interface Option {
  label: string;
  value: string;
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
}

interface EnrollmentResult {
  total: number;
  created: number;
  errors: { studentId: string; message: string }[];
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const label = (student: StudentRow) =>
  `${student.lastName} ${student.firstName}${student.matricule ? ` (${student.matricule})` : ""}`;

export function EnrollStudentsDialog({
  open,
  onOpenChange,
  classrooms,
  years,
  defaultClassroomId,
  defaultAcademicYearId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classrooms: Option[];
  years: Option[];
  defaultClassroomId?: string;
  defaultAcademicYearId?: string;
}) {
  const queryClient = useQueryClient();
  const [classroomId, setClassroomId] = useState(defaultClassroomId ?? "");
  const [academicYearId, setAcademicYearId] = useState(
    defaultAcademicYearId ?? "",
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollmentResult | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const studentsQuery = useQuery({
    queryKey: ["enroll-student-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const raw = (
        await api.get<StudentRow[] | PaginatedList<StudentRow>>(
          `${API.students}?${params.toString()}`,
        )
      ).data;
      return unwrapList(raw).items;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<EnrollmentResult>(`${API.enrollments}/bulk`, {
          classroomId,
          academicYearId,
          studentIds: Object.keys(selected),
        })
      ).data,
  });

  const selectedCount = Object.keys(selected).length;
  const selectedEntries = useMemo(() => Object.entries(selected), [selected]);

  const reset = () => {
    setClassroomId(defaultClassroomId ?? "");
    setAcademicYearId(defaultAcademicYearId ?? "");
    setSearch("");
    setSelected({});
    setPending(false);
    setError(null);
    setResult(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const toggle = (student: StudentRow) =>
    setSelected((prev) => {
      if (prev[student.id]) {
        const next = { ...prev };
        delete next[student.id];
        return next;
      }
      return { ...prev, [student.id]: label(student) };
    });

  const handleSubmit = async () => {
    setError(null);
    if (!classroomId || !academicYearId) {
      setError("Sélectionnez une classe et une année scolaire.");
      return;
    }
    if (selectedCount === 0) {
      setError("Sélectionnez au moins un élève.");
      return;
    }
    setPending(true);
    try {
      const response = await mutation.mutateAsync();
      setResult(response);
      queryClient.invalidateQueries({ queryKey: KEYS.enrollments });
      if (response.created > 0) {
        toast.success(`${response.created} élève(s) inscrit(s)`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal.Root
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="lg"
    >
      {open && (
        <Modal.Content
          labelledBy="enroll-title"
          describedBy="enroll-desc"
        >
          <Modal.Header className="flex flex-col gap-p1">
            <Modal.Title id="enroll-title">
              Inscrire des élèves
            </Modal.Title>
            <Modal.Description id="enroll-desc">
              Choisissez une classe et une année, puis sélectionnez les élèves à
              inscrire.
            </Modal.Description>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-p4">
            {result ? (
              <div className="flex flex-col gap-p3">
                <p className="text-r14 text-(--skools-text-primary)">
                  <strong>{result.created}</strong> élève(s) inscrit(s) sur{" "}
                  {result.total}.
                </p>
                {result.errors.length > 0 && (
                  <div className="max-h-60 overflow-y-auto rounded-r2 border border-(--skools-border-subtle)">
                    {result.errors.map((item) => (
                      <div
                        key={`${item.studentId}-${item.message}`}
                        className="px-p3 py-p2 text-r12 text-(--common-red) border-b border-(--skools-border-subtle) last:border-0"
                      >
                        {item.message}
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
                      Classe <span className="text-(--common-red)">*</span>
                    </span>
                    <Select
                      label="Choisir…"
                      value={classroomId}
                      onChange={setClassroomId}
                      options={classrooms}
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

                {selectedEntries.length > 0 && (
                  <div className="flex flex-wrap gap-p2">
                    {selectedEntries.map(([id, text]) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-p2 rounded-r2 bg-(--skools-elevated-bg) px-p3 py-p1 text-r12 text-(--skools-text-primary)"
                      >
                        {text}
                        <button
                          type="button"
                          aria-label={`Retirer ${text}`}
                          onClick={() =>
                            setSelected((prev) => {
                              const next = { ...prev };
                              delete next[id];
                              return next;
                            })
                          }
                          className="text-(--skools-text-muted) hover:text-(--common-red) transition-colors"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un élève (nom, matricule)…"
                  aria-label="Rechercher un élève"
                  className="w-full px-3 py-2 text-r14 border border-(--search-border) rounded-r2 bg-transparent text-(--skools-text-primary) placeholder:text-(--skools-text-muted) focus:outline-none focus:ring-2 focus:ring-(--skools-interactive-active-bg)"
                />

                <div className="max-h-60 overflow-y-auto rounded-r2 border border-(--skools-border-subtle)">
                  {studentsQuery.isPending ? (
                    <p className="px-p3 py-p4 text-r12 text-(--skools-text-muted)">
                      Chargement…
                    </p>
                  ) : (studentsQuery.data ?? []).length === 0 ? (
                    <p className="px-p3 py-p4 text-r12 text-(--skools-text-muted)">
                      Aucun élève trouvé.
                    </p>
                  ) : (
                    (studentsQuery.data ?? []).map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-p3 px-p3 py-p2 text-r14 text-(--skools-text-primary) border-b border-(--skools-border-subtle) last:border-0 cursor-pointer hover:bg-(--skools-interactive-hover-bg)"
                      >
                        <input
                          type="checkbox"
                          checked={!!selected[student.id]}
                          onChange={() => toggle(student)}
                        />
                        {label(student)}
                      </label>
                    ))
                  )}
                </div>

                <p className="text-r12 text-(--skools-text-muted)">
                  {selectedCount} élève(s) sélectionné(s)
                </p>
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
                  disabled={pending || selectedCount === 0}
                  onClick={handleSubmit}
                >
                  Inscrire {selectedCount || ""}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal.Content>
      )}
    </Modal.Root>
  );
}
