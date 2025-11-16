import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SidebarSection } from "../../../constants/sidebar-config";
import { isActivePath } from "../../../lib/path-match";

type FloatingMenu = { index: number; top: number; left: number };

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

export function useSidebarPanelState(
  collapsed: boolean,
  sections: SidebarSection[],
) {
  const pathname = usePathname();
  const path = useMemo(() => normalizePath(pathname), [pathname]);
  const router = useRouter();
  const [isOpen, setOpen] = useState(() => sections.map(() => false));
  const [floating, setFloating] = useState<FloatingMenu | null>(null);

  const sectionActive = useMemo(
    () =>
      sections.map((section) =>
        isActivePath(path, section.activeWhen),
      ),
    [path, sections],
  );

  useEffect(() => {
    setOpen(sectionActive);
  }, [sectionActive]);

  useEffect(() => {
    setFloating(null);
  }, [pathname, collapsed]);

  const handleSectionClick = (
    index: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (collapsed) {
      const r = e.currentTarget.getBoundingClientRect();
      setFloating((prev) =>
        prev?.index === index ? null : { index, top: r.top, left: r.right + 4 }
      );
      return;
    }

    setOpen((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const closeFloating = () => setFloating(null);
  const pushAndClose = (href: string) => {
    router.push(href);
    closeFloating();
  };

  return {
    path,
    isOpen,
    floating,
    sectionActive,
    handleSectionClick,
    closeFloating,
    pushAndClose,
  };
}
