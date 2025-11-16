import { SidebarSectionItem } from "./SidebarSectionItem";
import { isActivePath } from "../../../lib/path-match";

type Props = {
  top: number;
  left: number;
  titleItems: Array<{
    label: string;
    href: string;
    activeWhen: string[];
  }>;
  currentPath: string;
  onClose: () => void;
  onNavigate: (href: string) => void;
};

export function SidebarFloatingMenu({
  top,
  left,
  titleItems,
  currentPath,
  onClose,
  onNavigate,
}: Props) {
  return (
    <>
      <button
        type="button"
        className="fixed bottom-0 right-0 top-0 z-[45] cursor-default bg-black/10 left-16"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <div
        className="fixed z-[50] min-w-[13rem] rounded-md border border-gray-200 bg-white p-2 shadow-lg"
        style={{ top, left }}
        role="menu"
      >
        <ul className="space-y-1">
          {titleItems.map((item) => (
            <SidebarSectionItem
              key={item.href}
              label={item.label}
              active={isActivePath(currentPath, item.activeWhen)}
              onClick={() => onNavigate(item.href)}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
