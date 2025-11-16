"use client";

import type { SidebarSection } from "../../../constants/sidebar-config";
import { SidebarSectionHeader } from "./SidebarSectionHeader";
import { SidebarSectionItem } from "./SidebarSectionItem";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarFloatingMenu } from "./SidebarFloatingMenu";
import { useSidebarPanelState } from "./useSidebarPanelState";
import { useRouter } from "next/navigation";
import { isActivePath } from "../../../lib/path-match";

/** 사이드바 본문(네비 + 하단 회색 푸터). 로고는 `DashboardShell` 상단에서 렌더합니다. */
export function SidebarPanel({
  collapsed = false,
  footerVisible = true,
  config,
}: {
  collapsed?: boolean;
  /** `false`면 푸터 숨김(접힘 또는 사이드 너비 애니메이션 중) */
  footerVisible?: boolean;
  config: SidebarSection[];
}) {
  const router = useRouter();
  const {
    path,
    isOpen,
    floating,
    sectionActive,
    handleSectionClick,
    closeFloating,
    pushAndClose,
  } = useSidebarPanelState(collapsed, config);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
      <ul className="min-h-0 min-w-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-2 py-3">
        {config.map((section, index) => {
          const isHasItems = section.items.length > 1;
          return (
            <li key={section.key}>
              {/** 단일 버튼 섹션은 바로 이동, 확장 섹션만 접기/펼치기 처리 */}
              <SidebarSectionHeader
                title={section.title}
                icon={section.icon}
                active={sectionActive[index]}
                collapsed={collapsed}
                expanded={isOpen[index]}
                showChevron={isHasItems}
                onClick={(e) => {
                  if (isHasItems) {
                    handleSectionClick(index, e);
                    return;
                  }

                  const firstItem = section.items[0];
                  if (firstItem) {
                    router.push(firstItem.href);
                  }
                  return;
                }}
              />
              {!collapsed &&
                isHasItems &&
                isOpen[index] &&
                <div className="mt-1">
                  {section.items.map((item) => (
                    <SidebarSectionItem
                      key={item.href}
                      label={item.label}
                      active={isActivePath(path, item.activeWhen)}
                      onClick={() => router.push(item.href)}
                    />
                  ))}
                </div>
              }
            </li>
          );
        })}
      </ul>

      <SidebarFooter collapsed={collapsed} visible={footerVisible} />

      {collapsed && floating && (
        <SidebarFloatingMenu
          top={floating.top}
          left={floating.left}
          titleItems={config[floating.index]?.items ?? []}
          currentPath={path}
          onClose={closeFloating}
          onNavigate={pushAndClose}
        />
      )}
    </div>
  );
}
