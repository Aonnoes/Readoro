// RFC 4180 CSV serializer. No dependencies.

function normalizeColumns(columns) {
  return columns.map((c) =>
    typeof c === "string" ? { key: c, header: c } : c,
  );
}

function escapeField(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows, columns) {
  const cols = normalizeColumns(columns);
  const header = cols.map((c) => escapeField(c.header)).join(",");
  const lines = rows.map((row) =>
    cols.map((c) => escapeField(row[c.key])).join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

export function downloadCSV(filename, csv) {
  if (typeof document === "undefined") {
    throw new Error("downloadCSV is only available in a browser context.");
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
