export function isActivePath(pathname: string, activeWhen: string[]): boolean {
  return activeWhen.some((prefix) => {
    if (pathname === prefix) return true;
    return pathname.startsWith(`${prefix}/`);
  });
}
