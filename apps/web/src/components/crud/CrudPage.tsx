import { useState, type FormEvent, type ReactNode } from "react";
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
import { Select, type SelectOption } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Modal } from "../ui/use-modal";
import { Skeleton } from "../ui/skeleton";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { toast } from "../ui/toast";
import PlusIcon from "../icons/PlusIcon";

export type CrudFieldType = "text" | "number" | "date" | "select" | "textarea" | "checkbox";

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
  /** Libellé singulier pour les messages ("année scolaire"). */
  itemLabel: string;
  /** Libellé du bouton de création ("Nouvelle année"). */
  createLabel: string;
  emptyDescription?: string;
  queryKey: string[];
  endpoint: string;
  columns: CrudColumn<T>[];
  fields: CrudFieldDef[];
  schema: CrudSchema;
  toDefaults: (item?: T) => Record<string, string>;
  toSubmit: (values: Record<string, string>) => Record<string, unknown>;
  nameOf: (item: T) => string;
  idOf?: (item: T) => string;
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
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
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
          <FieldShell label={field.label} required={field.required} error={error}>
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
          <FieldShell label={field.label} required={field.required} error={error}>
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
            onChange={(checked) => setValue(field.name, checked ? "true" : "false")}
          />
        );
      case "date":
        return (
          <FieldShell label={field.label} required={field.required} error={error}>
            <Input
              variant="date"
              label={field.placeholder ?? field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              error={!!error}
            />
          </FieldShell>
        );
      case "number":
        return (
          <FieldShell label={field.label} required={field.required} error={error}>
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
          <FieldShell label={field.label} required={field.required} error={error}>
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
        <form id="crud-form" onSubmit={handleSubmit} className="flex flex-col gap-p4" noValidate>
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

const defaultIdOf = <T,>(item: T): string => (item as unknown as { id: string }).id;

export function CrudPage<T>({
  title,
  description,
  itemLabel,
  createLabel,
  emptyDescription,
  queryKey,
  endpoint,
  columns,
  fields,
  schema,
  toDefaults,
  toSubmit,
  nameOf,
  idOf = defaultIdOf,
}: CrudPageProps<T>) {
  // undefined = fermé, null = création, objet = édition.
  const [editing, setEditing] = useState<T | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const { list, createOne, updateOne, removeOne, invalidate } = useCrudResource<T>(endpoint, queryKey);
  const items = list.data ?? [];

  const handleCreate = (values: Record<string, string>) =>
    createOne.mutateAsync(toSubmit(values)).then(() => {
      invalidate();
      toast.success("Enregistré avec succès");
      setEditing(undefined);
    });

  const handleUpdate = (item: T) => (values: Record<string, string>) =>
    updateOne.mutateAsync({ id: idOf(item), data: toSubmit(values) }).then(() => {
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

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button fullWidth={false} icon={<PlusIcon className="size-full" />} onClick={() => setEditing(null)}>
            {createLabel}
          </Button>
        }
      />

      {list.isError ? (
        <ErrorState
          title={`Impossible de charger : ${title.toLowerCase()}`}
          message={getErrorMessage(list.error)}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : list.isPending ? (
        <TableContainer>
          <Table aria-label={`Chargement : ${title.toLowerCase()}`}>
            <TableBody>
              {[0, 1, 2].map((row) => (
                <TableRow key={row}>
                  {columns.map((column) => (
                    <TableCell key={column.header}>
                      <Skeleton className="h-[16px] w-3/4 rounded-r1" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-[16px] w-16 rounded-r1" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : items.length === 0 ? (
        <EmptyState
          title={`Aucun ${itemLabel} pour le moment`}
          description={emptyDescription ?? `Créez le premier élément avec le bouton « ${createLabel} ».`}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                {columns.map((column) => (
                  <TableHeaderCell key={column.header}>{column.header}</TableHeaderCell>
                ))}
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const name = nameOf(item);
                return (
                  <TableRow key={idOf(item)}>
                    {columns.map((column) =>
                      column.primary ? (
                        <TableCellPrimary key={column.header}>{column.render(item)}</TableCellPrimary>
                      ) : (
                        <TableCell key={column.header}>{column.render(item)}</TableCell>
                      ),
                    )}
                    <TableCell>
                      <div className="flex justify-end gap-p3">
                        <button
                          type="button"
                          aria-label={`Modifier ${name}`}
                          onClick={() => setEditing(item)}
                          className="text-r12 font-medium text-(--common-blue) hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer ${name}`}
                          onClick={() => setDeleteTarget(item)}
                          className="text-r12 font-medium text-(--common-red) hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
              title={editing === null ? createLabel : `Modifier ${nameOf(editing)}`}
              submitLabel={editing === null ? "Créer" : "Enregistrer"}
              fields={fields}
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
              <Modal.Title id="crud-delete-title">Confirmer la suppression</Modal.Title>
              <Modal.Description>
                Voulez-vous vraiment supprimer « {nameOf(deleteTarget)} » ? Cette action est
                irréversible.
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
    </div>
  );
}
