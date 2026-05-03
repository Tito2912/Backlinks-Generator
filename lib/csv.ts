export type CsvValue = string | number | boolean | null | undefined;

export function escapeCsvField(value: CsvValue) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function rowsToCsv(headers: string[], rows: CsvValue[][]) {
  return [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");
}
