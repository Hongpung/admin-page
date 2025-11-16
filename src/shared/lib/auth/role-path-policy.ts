import type { AdminRole } from "./admin-auth";

function matchPath(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  return pathname.startsWith(`${prefix}/`);
}

const SUB_ONLY_PREFIXES = ["/user/sub", "/club/sub"] as const;
const SUPER_ONLY_PREFIXES = [
  "/user",
  "/club/global",
  "/reservation",
  "/session",
  "/manage",
  "/admin",
] as const;

export function isRoleAllowedPath(
  role: AdminRole | null,
  pathname: string,
): boolean {
  if (!role) return true;

  const isSubOnly = SUB_ONLY_PREFIXES.some((prefix) =>
    matchPath(pathname, prefix),
  );
  if (isSubOnly) return role === "SUB";

  const isSuperOnly = SUPER_ONLY_PREFIXES.some((prefix) =>
    matchPath(pathname, prefix),
  );
  if (isSuperOnly) return role === "SUPER";

  return true;
}
