import {
  useCallback,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useCrudResource, type ListParams } from "../../hooks/use-crud";
import { getErrorMessage } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { INPUT_BASE, getBg } from "../ui/input-tokens";
import { Select, type SelectOption } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Modal } from "../ui/use-modal";
import type { ModalSize } from "../ui/modal";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { toast } from "../ui/toast";
import PlusIcon from "../icons/PlusIcon";
import { useRowSelection } from "../data-list/use-row-selection";
import { exportToCsv } from "../data-list/csv";
import { Pagination } from "../data-list/Pagination";
import { HeaderSelect } from "../data-list/HeaderSelect";
import { ListHeader } from "../data-list/ListHeader";
import { DataList } from "../data-list/DataList";
import { ListSkeleton } from "../data-list/ListSkeleton";
import type { StatusPillSpec } from "../data-list/StatusPill";

/** Filtre d'une liste : `param` = query param serveur, `options` statiques ou dynamiques. */
export interface CrudFilterDef {
  key: string;
  label: string;
  /** Nom du query param envoyé au backend. */
  param: string;
  options: Array<{ label: string; value: string }>;
}

export type CrudFieldType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "select"
  | "async-select"
  | "textarea"
  | "checkbox";

export interface CrudFieldDef {
  name: string;
  label: string;
  type: CrudFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disableSelectSearch?: boolean;
  options?: SelectOption[];
  /** Grille 2 colonnes : `full` = le champ occupe toute la largeur. */
  colSpan?: "full";
  /**
   * `async-select` : options chargées côté serveur selon la recherche.
   * `value` = sélection courante (permet de toujours l'inclure).
   * `options` reste utilisé pour injecter des options statiques.
   */
  loadOptions?: (search: string, value: string) => Promise<SelectOption[]>;
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
  /** Libellé pluriel pour le compteur ("années scolaires"). Défaut : itemLabel + "s". */
  pluralLabel?: string;
  /** Libellé du bouton de création ("Nouvelle année"). */
  createLabel: string;
  emptyDescription?: string;
  queryKey: readonly string[];
  endpoint: string;
  /** URL de lecture (défaut : endpoint). Permet les query params de filtre (?classroomId=). */
  listPath?: string;
  /** Contenu additionnel entre l'en-tête et la liste (ex. filtre). */
  toolbarExtra?: ReactNode;
  /** Actions additionnelles dans l'en-tête, avant le bouton de création (ex. Import). */
  headerActions?: ReactNode;
  columns: CrudColumn<T>[];
  fields: CrudFieldDef[];
  /** Colonnes du formulaire (modal) : 1 (défaut) ou 2 pour les formulaires longs. */
  formColumns?: 1 | 2;
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
  /** Clic sur la cellule primaire → page détail (l'édition reste en modal). */
  rowTo?: (item: T) => string;
  /** Taille de page serveur (défaut 10). */
  pageSize?: number;
  /** Filtres (query params serveur). */
  filters?: CrudFilterDef[];
  /** Pastille statut en fin de ligne. */
  statusPill?: (item: T) => StatusPillSpec | null;
  /** Placeholder de la recherche (absent = pas de recherche). */
  searchPlaceholder?: string;
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

function AsyncSelectField({
  field,
  value,
  error,
  onChange,
}: {
  field: CrudFieldDef;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["async-select", field.name, search, value],
    queryFn: () => field.loadOptions!(search, value),
    enabled: !!field.loadOptions,
    staleTime: 30_000,
  });

  const options = useMemo(() => {
    const loaded = query.data ?? [];
    const staticOptions = field.options ?? [];
    const seen = new Set(loaded.map((option) => option.value));
    return [
      ...staticOptions.filter((option) => !seen.has(option.value)),
      ...loaded,
    ];
  }, [query.data, field.options]);

  return (
    <FieldShell label={field.label} required={field.required} error={error}>
      <Select
        label={field.placeholder ?? field.label}
        options={options}
        value={value}
        onChange={onChange}
        onSearch={setSearch}
        disableFilter
        loading={query.isPending}
        error={!!error}
      />
    </FieldShell>
  );
}

function CrudFormBody({
  titleId,
  descriptionId,
  formId,
  title,
  description,
  submitLabel,
  fields,
  schema,
  defaults,
  pending,
  submitDisabled,
  columns = 1,
  onSubmit,
}: {
  titleId: string;
  descriptionId: string;
  formId: string;
  title: string;
  description?: string;
  submitLabel: string;
  fields: CrudFieldDef[];
  schema: CrudSchema;
  defaults: Record<string, string>;
  pending: boolean;
  submitDisabled?: boolean;
  columns?: 1 | 2;
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
      case "async-select":
        return (
          <AsyncSelectField
            field={field}
            value={value}
            error={error}
            onChange={(v) => setValue(field.name, v)}
          />
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
      <Modal.Header className="flex flex-col gap-p1">
        <Modal.Title id={titleId}>{title}</Modal.Title>
        {description && (
          <Modal.Description id={descriptionId}>
            {description}
          </Modal.Description>
        )}
      </Modal.Header>
      <Modal.Body>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className={[
            "grid gap-p4",
            columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
          ].join(" ")}
          noValidate
        >
          {fields.map((field) => (
            <div
              key={field.name}
              className={
                columns === 2 && field.colSpan === "full"
                  ? "sm:col-span-2"
                  : undefined
              }
            >
              {renderField(field)}
            </div>
          ))}
          {serverError && (
            <p
              role="alert"
              className="text-r14 text-(--common-red) sm:col-span-2"
            >
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
          form={formId}
          variant={pending ? "loading" : "primary"}
          disabled={pending || submitDisabled}
        >
          {submitLabel}
        </Button>
      </Modal.Footer>
    </>
  );
}

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  fields: CrudFieldDef[];
  schema: CrudSchema;
  defaults: Record<string, string>;
  pending: boolean;
  submitDisabled?: boolean;
  size?: ModalSize;
  columns?: 1 | 2;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
}

/** Modal de formulaire standard (titre/description + champs + footer Annuler/Valider). */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  fields,
  schema,
  defaults,
  pending,
  submitDisabled,
  size = "md",
  columns = 1,
  onSubmit,
}: FormDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const formId = useId();

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange} size={size}>
      {open && (
        <Modal.Content
          labelledBy={titleId}
          describedBy={description ? descriptionId : undefined}
        >
          <CrudFormBody
            titleId={titleId}
            descriptionId={descriptionId}
            formId={formId}
            title={title}
            description={description}
            submitLabel={submitLabel}
            fields={fields}
            schema={schema}
            defaults={defaults}
            pending={pending}
            submitDisabled={submitDisabled}
            columns={columns}
            onSubmit={onSubmit}
          />
        </Modal.Content>
      )}
    </Modal.Root>
  );
}

const defaultIdOf = <T,>(item: T): string =>
  (item as unknown as { id: string }).id;

/** Défaut stable pour `filters` (un `[]` littéral recréerait `params` à chaque rendu). */
const NO_FILTERS: CrudFilterDef[] = [];

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
  headerActions,
  columns,
  fields,
  formColumns,
  editFields,
  schema,
  toDefaults,
  toSubmit,
  nameOf,
  idOf = defaultIdOf,
  rowTo,
  pluralLabel,
  pageSize = 10,
  filters = NO_FILTERS,
  statusPill,
  searchPlaceholder,
  csvHeaders,
  toCsvRow,
  csvFilename,
}: CrudPageProps<T>) {
  // undefined = fermé, null = création, objet = édition.
  const [editing, setEditing] = useState<T | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const params = useMemo(() => {
    const next: ListParams = { page, limit: pageSize };
    if (search) next.search = search;
    for (const filter of filters) {
      const value = filterValues[filter.key];
      if (value) next[filter.param] = value;
    }
    return next;
  }, [page, pageSize, search, filters, filterValues]);

  const { list, createOne, updateOne, removeOne, invalidate } =
    useCrudResource<T>(endpoint, queryKey, listPath, params);
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const pagination = list.data?.pagination ?? null;
  const total = pagination?.total_count ?? items.length;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);
  const formFields = editing ? (editFields ?? fields) : fields;
  const selection = useRowSelection();

  const listId = `${queryKey.join("/")}::${listPath ?? endpoint}`;
  const [prevListId, setPrevListId] = useState(listId);
  if (prevListId !== listId) {
    setPrevListId(listId);
    setPage(1);
    setSearch("");
    setFilterValues({});
    selection.clear();
  }

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      selection.clear();
    },
    [selection],
  );

  const handleFilterChange = useCallback(
    (key: string) => (value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setPage(1);
      selection.clear();
    },
    [selection],
  );

  const pageIds = useMemo(() => items.map(idOf), [items, idOf]);
  const pageSelectedCount = pageIds.filter((id) => selection.has(id)).length;
  const pageAllChecked =
    pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const pageIndeterminate = pageSelectedCount > 0 && !pageAllChecked;
  const canExport = !!csvHeaders && !!toCsvRow;

  const invertPageSelection = () => {
    const selectedOnPage = new Set(pageIds.filter((id) => selection.has(id)));
    selection.selectMany(
      pageIds.filter((id) => !selectedOnPage.has(id)),
      true,
    );
    selection.selectMany([...selectedOnPage], false);
  };

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

  const selectAll = (
    <HeaderSelect
      checked={pageAllChecked}
      indeterminate={pageIndeterminate}
      onToggleAll={() => selection.selectMany(pageIds, !pageAllChecked)}
      onSelectAll={() => selection.selectMany(pageIds, true)}
      onSelectNone={() => selection.selectMany(pageIds, false)}
      onInvert={invertPageSelection}
    />
  );
  const createButton = readOnly ? undefined : (
    <Button
      variant="tag"
      fullWidth={false}
      icon={<PlusIcon className="size-full" />}
      iconPosition="left"
      title={createLabel}
      onClick={() => setEditing(null)}
    >
      {createLabel}
    </Button>
  );

  return (
    <div>
      <ListHeader
        title={title}
        description={description}
        count={list.isPending ? 0 : total}
        countLabel={pluralLabel ?? `${itemLabel}s`}
        filters={filters.map((filter) => ({
          key: filter.key,
          label: filter.label,
          value: filterValues[filter.key] ?? "",
          options: filter.options,
          onChange: handleFilterChange(filter.key),
        }))}
        searchable={searchPlaceholder !== undefined}
        searchPlaceholder={searchPlaceholder ?? "Rechercher…"}
        onSearch={handleSearch}
        selection={{
          count: selection.selectedCount,
          canDelete: !readOnly,
          canExport,
          pending: bulkPending,
          onDelete: () => setBulkConfirmOpen(true),
          onExport: handleExport,
          onClear: selection.clear,
        }}
        selectAll={selectAll}
        createButton={createButton}
        extra={headerActions}
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
        <ListSkeleton label={`Chargement : ${title.toLowerCase()}`} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`Aucun ${itemLabel} pour le moment`}
          description={
            emptyDescription ??
            `Créez le premier élément avec le bouton « ${createLabel} ».`
          }
        />
      ) : (
        <div className="w-full flex flex-col gap-p4 pb-p10 mt-p10">
          <DataList
            items={items}
            columns={columns}
            idOf={idOf}
            nameOf={nameOf}
            statusPill={statusPill}
            selection={{
              has: selection.has,
              toggle: selection.toggle,
            }}
            readOnly={readOnly}
            onEdit={readOnly ? undefined : (item) => setEditing(item)}
            onDelete={readOnly ? undefined : (item) => setDeleteTarget(item)}
            rowTo={rowTo}
          />
          {totalPages > 1 && (
            <div className="ml-auto">
              <Pagination
                page={pagination?.page ?? page}
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

      <FormDialog
        key={editing === null ? "new" : editing ? idOf(editing) : "closed"}
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        title={editing ? `Modifier ${nameOf(editing)}` : createLabel}
        submitLabel={editing === null ? "Créer" : "Enregistrer"}
        fields={formFields}
        schema={schema}
        defaults={toDefaults(editing ?? undefined)}
        pending={createOne.isPending || updateOne.isPending}
        columns={formColumns}
        onSubmit={editing ? handleUpdate(editing) : handleCreate}
      />

      <Modal.Root
        size="sm"
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        {deleteTarget && (
          <Modal.Content
            labelledBy="crud-delete-title"
            describedBy="crud-delete-desc"
          >
            <Modal.Header className="flex flex-col gap-p1">
              <Modal.Title id="crud-delete-title">
                Confirmer la suppression
              </Modal.Title>
              <Modal.Description id="crud-delete-desc">
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
        <Modal.Content
          labelledBy="crud-bulk-delete-title"
          describedBy="crud-bulk-delete-desc"
        >
          <Modal.Header className="flex flex-col gap-p1">
            <Modal.Title id="crud-bulk-delete-title">
              Supprimer {selection.selectedCount} élément(s) ?
            </Modal.Title>
            <Modal.Description id="crud-bulk-delete-desc">
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
