import type { MemberListItemResDto } from "../types";

function compareEnrollmentNumbers(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
    return aNum - bNum;
  }
  return a.localeCompare(b, undefined, { numeric: true });
}

export function sortUsersByEnrollmentNumber(
  users: MemberListItemResDto[],
): MemberListItemResDto[] {
  return [...users].sort((a, b) =>
    compareEnrollmentNumbers(a.enrollmentNumber, b.enrollmentNumber),
  );
}
