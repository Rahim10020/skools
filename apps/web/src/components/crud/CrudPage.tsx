import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useCrudResource } from "../../hooks/use-crud";
import { getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableCellPrimary,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { INPUT_BASE, getBg } from "../ui/input-tokens";
import { Select, type SelectOption } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Modal } from "../ui/use-modal";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { toast } from "../ui/toast";
import PlusIcon from "../icons/PlusIcon";
import { useRowSelection } from "../data-list/use-row-selection";
import { exportToCsv } from "../data-list/csv";
import { Pagination } from "../data-list/Pagination";
import { HeaderSelect } from "../data-list/HeaderSelect";
import { DataListToolbar } from "../data-list/DataListToolbar";
import { DataListSkeleton } from "../data-list/DataListSkeleton";

export type CrudFieldType =
  "text" | "number" | "date" | "time" | "select" | "textarea" | "checkbox";

export interface CrudFieldDef {
  name: string;
  label: string;
  type: CrudFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disableSelectSearch?: boolean;
  options?: SelectOption[];
}

export interface CrudColumn<T> {
  header: string;
  primary?: boolean;
  render: (item: T) => ReactNode;
}

/** Schéma de validation structurel (compatible z.object, sans dépendance aux internes de zod). */
export interface CrudSchema {
  safeParse(data: unknown): {
    success: boolean;
    error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
  };
}

export interface CrudPageProps<T> {
  title: string;
  description?: string;
  /** Lecture seule : masque le bouton de création et les actions (matrice : rôles en consultation). */
  readOnly?: boolean;
  /** Libellé singulier pour les messages ("année scolaire"). */
  itemLabel: string;
  /** Libellé du bouton de création ("Nouvelle année"). */
  createLabel: string;
  emptyDescription?: string;
  queryKey: readonly string[];
  endpoint: string;
  /** URL de lecture (défaut : endpoint). Permet les query params de filtre (?classroomId=). */
  listPath?: string;
  /** Contenu additionnel entre l'en-tête et la liste (ex. filtre). */
  toolbarExtra?: ReactNode;
  columns: CrudColumn<T>[];
  fields: CrudFieldDef[];
  /** Champs du formulaire d'édition (défaut : fields). Ex. résolution disciplinaire (PATCH uniquement). */
  editFields?: CrudFieldDef[];
  schema: CrudSchema;
  toDefaults: (item?: T) => Record<string, string>;
  toSubmit: (
    values: Record<string, string>,
    mode: "create" | "edit",
  ) => Record<string, unknown>;
  nameOf: (item: T) => string;
  idOf?: (item: T) => string;
  /** Taille de page cliente façon epl (défaut 10). */
  pageSize?: number;
  /** Export CSV de la sélection (masqué si absent). */
  csvHeaders?: string[];
  toCsvRow?: (item: T) => string[];
  csvFilename?: string;
}

function FieldShell({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-p1">
      <span className="text-m12 text-(--skools-text-primary)">
        {label}
        {required && <span className="text-(--common-red)"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="text-[12px] text-(--common-red) px-p1">
          {error}
        </span>
      )}
    </div>
  );
}

function CrudFormModal({
  title,
  submitLabel,
  fields,
  schema,
  defaults,
  pending,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  fields: CrudFieldDef[];
  schema: CrudSchema;
  defaults: Record<string, string>;
  pending: boolean;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
}) {
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error?.issues ?? []) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key])
          errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  const renderField = (field: CrudFieldDef) => {
    const value = values[field.name] ?? "";
    const error = fieldErrors[field.name];

    switch (field.type) {
      case "select":
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <Select
              label={field.placeholder ?? field.label}
              options={field.options ?? []}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              disableSearch={field.disableSelectSearch}
              error={!!error}
            />
          </FieldShell>
        );
      case "textarea":
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <Textarea
              label={field.placeholder ?? field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              helperText={field.helperText}
              error={!!error}
            />
          </FieldShell>
        );
      case "checkbox":
        return (
          <Checkbox
            label={field.label}
            checked={value === "true"}
            onChange={(checked) =>
              setValue(field.name, checked ? "true" : "false")
            }
          />
        );
      case "date":
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <Input
              variant="date"
              label={field.placeholder ?? field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              error={!!error}
            />
          </FieldShell>
        );
      case "time":
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <input
              type="time"
              aria-label={field.label}
              value={value}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={[INPUT_BASE, "px-(--spacing-p4)", getBg(!!error)].join(
                " ",
              )}
            />
          </FieldShell>
        );
      case "number":
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <Input
              label={field.placeholder ?? field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              helperText={field.helperText}
              error={!!error}
              inputMode="numeric"
            />
          </FieldShell>
        );
      case "text":
      default:
        return (
          <FieldShell
            label={field.label}
            required={field.required}
            error={error}
          >
            <Input
              label={field.placeholder ?? field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              helperText={field.helperText}
              error={!!error}
            />
          </FieldShell>
        );
    }
  };

  return (
    <>
      <Modal.Header>
        <Modal.Title id="crud-form-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form
          id="crud-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-p4"
          noValidate
        >
          {fields.map((field) => (
            <div key={field.name}>{renderField(field)}</div>
          ))}
          {serverError && (
            <p role="alert" className="text-r14 text-(--common-red)">
              {serverError}
            </p>
          )}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close>
          <Button variant="secondary" fullWidth={false}>
            Annuler
          </Button>
        </Modal.Close>
        <Button
          fullWidth={false}
          type="submit"
          form="crud-form"
          variant={pending ? "loading" : "primary"}
          disabled={pending}
        >
          {submitLabel}
        </Button>
      </Modal.Footer>
    </>
  );
}

const defaultIdOf = <T,>(item: T): string =>
  (item as unknown as { id: string }).id;

export function CrudPage<T>({
  title,
  description,
  readOnly = false,
  itemLabel,
  createLabel,
  emptyDescription,
  queryKey,
  endpoint,
  listPath,
  toolbarExtra,
  columns,
  fields,
  editFields,
  schema,
  toDefaults,
  toSubmit,
  nameOf,
  idOf = defaultIdOf,
  pageSize = 10,
  csvHeaders,
  toCsvRow,
  csvFilename,
}: CrudPageProps<T>) {
  // undefined = fermé, null = création, objet = édition.
  const [editing, setEditing] = useState<T | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { list, createOne, updateOne, removeOne, invalidate } =
    useCrudResource<T>(endpoint, queryKey, listPath);
  const items = useMemo(() => list.data ?? [], [list.data]);
  const formFields = editing ? (editFields ?? fields) : fields;
  const selection = useRowSelection();

  const listId = `${queryKey.join("/")}::${listPath ?? endpoint}`;
  const [prevListId, setPrevListId] = useState(listId);
  if (prevListId !== listId) {
    setPrevListId(listId);
    setPage(1);
    selection.clear();
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );
  const pageIds = useMemo(() => pageItems.map(idOf), [pageItems, idOf]);
  const pageSelectedCount = pageIds.filter((id) => selection.has(id)).length;
  const pageAllChecked =
    pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const pageIndeterminate = pageSelectedCount > 0 && !pageAllChecked;
  const canExport = !!csvHeaders && !!toCsvRow;

  const handleCreate = (values: Record<string, string>) =>
    createOne.mutateAsync(toSubmit(values, "create")).then(() => {
      invalidate();
      toast.success("Enregistré avec succès");
      setEditing(undefined);
    });

  const handleUpdate = (item: T) => (values: Record<string, string>) =>
    updateOne
      .mutateAsync({ id: idOf(item), data: toSubmit(values, "edit") })
      .then(() => {
        invalidate();
        toast.success("Modifications enregistrées");
        setEditing(undefined);
      });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeOne.mutateAsync(idOf(deleteTarget));
      invalidate();
      toast.success("Supprimé avec succès");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBulkDelete = async () => {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    setBulkPending(true);
    const results = await Promise.allSettled(
      ids.map((id) => removeOne.mutateAsync(id)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const ko = results.length - ok;
    invalidate();
    selection.clear();
    setBulkConfirmOpen(false);
    setBulkPending(false);
    if (ko === 0) toast.success(`${ok} élément(s) supprimé(s)`);
    else if (ok === 0) toast.error("Suppression groupée impossible");
    else toast.error(`${ok} supprimé(s), ${ko} échec(s)`);
  };

  const handleExport = () => {
    if (!csvHeaders || !toCsvRow) return;
    const byId = new Map(items.map((item) => [idOf(item), item]));
    const rows = selection.selectedIds
      .map((id) => byId.get(id))
      .filter((item): item is T => !!item)
      .map(toCsvRow);
    exportToCsv(csvFilename ?? title.toLowerCase(), csvHeaders, rows);
  };

  const invertPageSelection = () => {
    const selectedOnPage = new Set(
      pageIds.filter((id) => selection.has(id)),
    );
    selection.selectMany(
      pageIds.filter((id) => !selectedOnPage.has(id)),
      true,
    );
    selection.selectMany([...selectedOnPage], false);
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          readOnly ? undefined : (
            <Button
              fullWidth={false}
              icon={<PlusIcon className="size-full" />}
              onClick={() => setEditing(null)}
            >
              {createLabel}
            </Button>
          )
        }
      />

      {toolbarExtra && <div className="mb-p6">{toolbarExtra}</div>}

      {list.isError ? (
        <ErrorState
          title={`Impossible de charger : ${title.toLowerCase()}`}
          message={getErrorMessage(list.error)}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : list.isPending ? (
        <DataListSkeleton columns={columns.length} label={`Chargement : ${title.toLowerCase()}`} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`Aucun ${itemLabel} pour le moment`}
          description={
            emptyDescription ??
            `Créez le premier élément avec le bouton « ${createLabel} ».`
          }
        />
      ) : (
        <div className="flex flex-col gap-p3">
          <DataListToolbar
            total={items.length}
            itemLabel={itemLabel}
            selectedCount={selection.selectedCount}
            canDelete={!readOnly}
            canExport={canExport}
            bulkPending={bulkPending}
            onBulkDelete={() => setBulkConfirmOpen(true)}
            onExport={handleExport}
            onClear={selection.clear}
          />
          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell className="w-10">
                    <HeaderSelect
                      checked={pageAllChecked}
                      indeterminate={pageIndeterminate}
                      onToggleAll={() =>
                        selection.selectMany(pageIds, !pageAllChecked)
                      }
                      onSelectAll={() => selection.selectMany(pageIds, true)}
                      onSelectNone={() => selection.selectMany(pageIds, false)}
                      onInvert={invertPageSelection}
                    />
                  </TableHeaderCell>
                  {columns.map((column) => (
                    <TableHeaderCell key={column.header}>
                      {column.header}
                    </TableHeaderCell>
                  ))}
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => {
                  const id = idOf(item);
                  const name = nameOf(item);
                  const checked = selection.has(id);
                  return (
                    <TableRow
                      key={id}
                      className={`group ${checked ? "bg-(--skools-interactive-active-bg)/40" : ""}`}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={checked}
                          onChange={() => selection.toggle(id)}
                          aria-label={`Sélectionner ${name}`}
                        />
                      </TableCell>
                      {columns.map((column) =>
                        column.primary ? (
                          <TableCellPrimary key={column.header}>
                            {column.render(item)}
                          </TableCellPrimary>
                        ) : (
                          <TableCell key={column.header}>
                            {column.render(item)}
                          </TableCell>
                        ),
                      )}
                      <TableCell>
                        {/* Desktop : actions au hover/focus façon Gmail */}
                        <div className="hidden lg:flex justify-end gap-p3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                aria-label={`Modifier ${name}`}
                                onClick={() => setEditing(item)}
                                className="text-r12 font-medium text-(--common-blue) hover:underline cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                aria-label={`Supprimer ${name}`}
                                onClick={() => setDeleteTarget(item)}
                                className="text-r12 font-medium text-(--common-red) hover:underline cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>
                        {/* Mobile : menu 3 points */}
                        <div className="relative flex justify-end lg:hidden">
                          <button
                            type="button"
                            aria-label={`Options pour ${name}`}
                            aria-haspopup="menu"
                            aria-expanded={menuOpenId === id}
                            onClick={() =>
                              setMenuOpenId((v) => (v === id ? null : id))
                            }
                            className="inline-flex size-8 items-center justify-center rounded-r1 text-r14 text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                          >
                            •••
                          </button>
                          {menuOpenId === id && !readOnly && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full z-30 mt-1 min-w-36 flex flex-col gap-1 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-1 shadow-lg"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setEditing(item);
                                }}
                                className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-blue) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setDeleteTarget(item);
                                }}
                                className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-red) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <div className="ml-auto">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={(next) => {
                  setPage(next);
                  selection.clear();
                }}
              />
            </div>
          )}
        </div>
      )}

      <Modal.Root
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
      >
        {editing !== undefined && (
          <Modal.Content labelledBy="crud-form-title">
            <CrudFormModal
              key={editing === null ? "new" : idOf(editing)}
              title={
                editing === null ? createLabel : `Modifier ${nameOf(editing)}`
              }
              submitLabel={editing === null ? "Créer" : "Enregistrer"}
              fields={formFields}
              schema={schema}
              defaults={toDefaults(editing ?? undefined)}
              pending={createOne.isPending || updateOne.isPending}
              onSubmit={editing === null ? handleCreate : handleUpdate(editing)}
            />
          </Modal.Content>
        )}
      </Modal.Root>

      <Modal.Root
        size="sm"
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        {deleteTarget && (
          <Modal.Content labelledBy="crud-delete-title">
            <Modal.Header>
              <Modal.Title id="crud-delete-title">
                Confirmer la suppression
              </Modal.Title>
              <Modal.Description>
                Voulez-vous vraiment supprimer « {nameOf(deleteTarget)} » ?
                Cette action est irréversible.
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
                variant={removeOne.isPending ? "loading" : "primary"}
                disabled={removeOne.isPending}
                onClick={handleDelete}
                className="bg-(--common-red)!"
              >
                Supprimer
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>

      <Modal.Root
        size="sm"
        open={bulkConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setBulkConfirmOpen(false);
        }}
      >
        <Modal.Content labelledBy="crud-bulk-delete-title">
          <Modal.Header>
            <Modal.Title id="crud-bulk-delete-title">
              Supprimer {selection.selectedCount} élément(s) ?
            </Modal.Title>
            <Modal.Description>
              Cette action est irréversible. Les éléments non supprimés
              (erreurs) seront signalés après l'opération.
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
              variant={bulkPending ? "loading" : "primary"}
              disabled={bulkPending}
              onClick={handleBulkDelete}
              className="bg-(--common-red)!"
            >
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}
