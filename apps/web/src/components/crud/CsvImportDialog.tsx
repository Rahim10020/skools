import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/use-modal";
import { getErrorMessage } from "../../lib/api";
import { exportToCsv, parseCsv } from "../data-list/csv";
import { UploadIcon } from "../icons/UploadIcon";
import { DownloadIcon } from "../icons/DownloadIcon";

export interface ImportColumn {
  key: string;
  label: string;
  aliases?: string[];
  required?: boolean;
}

export interface ImportPreviewRow {
  line: number;
  values: Record<string, string>;
  error?: string;
}

export interface ImportResult {
  total: number;
  created: number;
  enrolled?: number;
  errors: { line: number; message: string }[];
}

export interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  itemLabel: string;
  columns: ImportColumn[];
  /** Exemple aligné sur `columns` (téléchargé comme modèle). */
  exampleRow: string[];
  templateFilename: string;
  /** Colonnes affichées dans l'aperçu (sous-ensemble des `key`). */
  previewKeys: string[];
  normalize: (
    record: Record<string, string>,
  ) => { values: Record<string, string>; error?: string };
  onSubmit: (rows: Record<string, string>[]) => Promise<ImportResult>;
}

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function buildHeaderIndex(columns: ImportColumn[], headers: string[]) {
  const index: Record<string, number> = {};
  headers.forEach((header, position) => {
    const normalized = normalizeHeader(header);
    const column = columns.find(
      (candidate) =>
        normalizeHeader(candidate.label) === normalized ||
        candidate.aliases?.some(
          (alias) => normalizeHeader(alias) === normalized,
        ),
    );
    if (column) index[column.key] = position;
  });
  return index;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  title,
  description,
  itemLabel,
  columns,
  exampleRow,
  templateFilename,
  previewKeys,
  normalize,
  onSubmit,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportPreviewRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const headers = columns.map((column) => column.label);

  const handleFile = async (file: File) => {
    setParseError(null);
    setResult(null);
    setServerError(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setRows(null);
      setParseError("Fichier vide ou sans ligne de données.");
      return;
    }
    const headerIndex = buildHeaderIndex(columns, parsed[0]);
    const missing = columns.filter(
      (column) => column.required && headerIndex[column.key] === undefined,
    );
    if (missing.length > 0) {
      setRows(null);
      setParseError(
        `Colonnes obligatoires manquantes : ${missing
          .map((column) => column.label)
          .join(", ")}.`,
      );
      return;
    }

    const normalizedRows: ImportPreviewRow[] = parsed
      .slice(1)
      .map((cells, index) => {
        const record: Record<string, string> = {};
        for (const column of columns) {
          const position = headerIndex[column.key];
          record[column.key] = position === undefined ? "" : cells[position] ?? "";
        }
        const { values, error } = normalize(record);
        return { line: index + 2, values, error };
      });

    setRows(normalizedRows);
  };

  const validRows = (rows ?? []).filter((row) => !row.error);
  const invalidCount = (rows ?? []).filter((row) => !!row.error).length;

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setPending(true);
    setServerError(null);
    try {
      const response = await onSubmit(validRows.map((row) => row.values));
      setResult(response);
      setRows(null);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  const downloadTemplate = () =>
    exportToCsv(templateFilename, headers, [exampleRow]);

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange} size="lg">
      {open && (
        <Modal.Content
          labelledBy="csv-import-title"
          describedBy={description ? "csv-import-desc" : undefined}
        >
          <Modal.Header className="flex flex-col gap-p1">
            <Modal.Title id="csv-import-title">{title}</Modal.Title>
            {description && (
              <Modal.Description id="csv-import-desc">
                {description}
              </Modal.Description>
            )}
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-p4">
            {result ? (
              <div className="flex flex-col gap-p4">
                <p className="text-r14 text-(--skools-text-primary)">
                  <strong>{result.created}</strong> {itemLabel}(s) importé(s)
                  {result.enrolled ? ` • ${result.enrolled} inscrit(s)` : ""} sur{" "}
                  {result.total}.
                </p>
                {result.errors.length > 0 && (
                  <div className="max-h-60 overflow-y-auto rounded-r2 border border-(--skools-border-subtle)">
                    {result.errors.map((error) => (
                      <div
                        key={`${error.line}-${error.message}`}
                        className="flex gap-p3 px-p3 py-p2 text-r12 border-b border-(--skools-border-subtle) last:border-0"
                      >
                        <span className="text-(--skools-text-muted) min-w-16">
                          Ligne {error.line}
                        </span>
                        <span className="text-(--common-red)">
                          {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : rows ? (
              <div className="flex flex-col gap-p3">
                <div className="flex items-center gap-p4 text-r12 text-(--skools-text-muted)">
                  <span>
                    {validRows.length} {itemLabel}(s) à importer
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-(--common-red)">
                      {invalidCount} ligne(s) en erreur ignorée(s)
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-auto rounded-r2 border border-(--skools-border-subtle)">
                  <table className="w-full text-r12 border-collapse">
                    <thead className="sticky top-0 bg-(--skools-elevated-bg)">
                      <tr>
                        <th className="text-left px-p3 py-p2 font-medium text-(--skools-text-muted)">
                          Ligne
                        </th>
                        {previewKeys.map((key) => (
                          <th
                            key={key}
                            className="text-left px-p3 py-p2 font-medium text-(--skools-text-muted)"
                          >
                            {columns.find((column) => column.key === key)?.label ??
                              key}
                          </th>
                        ))}
                        <th className="text-left px-p3 py-p2 font-medium text-(--skools-text-muted)">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.line}
                          className="border-t border-(--skools-border-subtle)"
                        >
                          <td className="px-p3 py-p2 text-(--skools-text-muted)">
                            {row.line}
                          </td>
                          {previewKeys.map((key) => (
                            <td
                              key={key}
                              className="px-p3 py-p2 text-(--skools-text-primary)"
                            >
                              {row.values[key] || "—"}
                            </td>
                          ))}
                          <td className="px-p3 py-p2">
                            {row.error ? (
                              <span className="text-(--common-red)">
                                {row.error}
                              </span>
                            ) : (
                              <span className="text-(--skools-text-muted)">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-p4">
                <label
                  className="flex flex-col items-center justify-center gap-p3 rounded-r2 border border-dashed border-(--skools-border-subtle) py-p10 cursor-pointer hover:bg-(--skools-interactive-hover-bg) transition-colors"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) void handleFile(file);
                  }}
                >
                  <UploadIcon className="size-6 text-(--skools-text-muted)" />
                  <span className="text-r14 text-(--skools-text-primary)">
                    {fileName ?? "Glissez un fichier CSV ou cliquez pour choisir"}
                  </span>
                  <span className="text-r12 text-(--skools-text-muted)">
                    Colonnes attendues : {headers.join(" · ")}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-p2 self-start text-r12 text-(--skools-text-muted) hover:text-(--skools-text-primary) transition-colors cursor-pointer"
                >
                  <DownloadIcon className="size-3.5" />
                  Télécharger le modèle CSV
                </button>
              </div>
            )}

            {parseError && (
              <p role="alert" className="text-r14 text-(--common-red)">
                {parseError}
              </p>
            )}
            {serverError && (
              <p role="alert" className="text-r14 text-(--common-red)">
                {serverError}
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            {result ? (
              <Button
                fullWidth={false}
                variant="primary"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            ) : (
              <>
                <Modal.Close>
                  <Button variant="secondary" fullWidth={false}>
                    Annuler
                  </Button>
                </Modal.Close>
                {rows && (
                  <Button
                    fullWidth={false}
                    variant={pending ? "loading" : "primary"}
                    disabled={pending || validRows.length === 0}
                    onClick={handleImport}
                  >
                    Importer {validRows.length} {itemLabel}(s)
                  </Button>
                )}
              </>
            )}
          </Modal.Footer>
        </Modal.Content>
      )}
    </Modal.Root>
  );
}
