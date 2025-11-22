export function splitNoticeUpdatedAt(iso: string) {
  const [datePart, rest] = iso.split("T");
  const timePart = rest?.split(".")[0] ?? "";
  return { datePart, timePart };
}
