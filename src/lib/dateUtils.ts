/**
 * Formats a timestamp (or Date) into 'YYYY/MM/DD hh:mm' format.
 * Example: 2026/09/22 22:05
 */
export function formatDateTime(timestamp: number | Date): string {
  const d = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

/**
 * Formats a timestamp (or Date) into 'YY/MM/DD' format.
 * Example: 26/09/22
 */
export function formatDateShort(timestamp: number | Date): string {
  const d = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}/${mm}/${dd}`;
}
