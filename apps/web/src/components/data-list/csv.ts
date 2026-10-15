/**
 * Export CSV côté client (séparateur `;` + BOM pour Excel FR).
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: string[][],
) {
  const escape = (cell: string) => {
    const value = cell ?? "";
    return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  };
  const lines = [
    headers.map(escape).join(";"),
    ...rows.map((row) => row.map(escape).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
