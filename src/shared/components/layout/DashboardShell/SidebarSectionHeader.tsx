import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Monitor,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { SidebarSection } from "../../../constants/sidebar-config";

type SidebarSectionIcon = SidebarSection["icon"];

type Props = {
  title: string;
  icon: SidebarSectionIcon;
  active: boolean;
  collapsed: boolean;
  expanded: boolean;
  showChevron?: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const iconMap = {
  users: Users,
  calendar: CalendarDays,
  monitor: Monitor,
  shield: Shield,
  user: User,
} as const;

function sectionHeaderClass(
  sectionActive: boolean,
  collapsed: boolean,
): string {
  const base =
    "w-full min-w-0 overflow-hidden text-sm cursor-pointer px-3 py-2 rounded-md flex flex-row items-center gap-2 transition-colors";
  return sectionActive
    ? `${base} ${collapsed ? "justify-center" : "justify-between"} bg-blue-50 text-blue-900`
    : `${base} ${collapsed ? "justify-center" : "justify-between"} bg-gray-100 text-gray-900`;
}

export function SidebarSectionHeader({
  title,
  icon,
  active,
  collapsed,
  expanded,
  showChevron = true,
  onClick,
}: Props) {
  const Icon = iconMap[icon];

  return (
    <div
      className={sectionHeaderClass(active, collapsed)}
      onClick={onClick}
      title={title}
    >
      <div
        className={`flex min-w-0 items-center gap-2 overflow-hidden ${collapsed ? "" : "flex-1"}`}
      >
        <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
        {!collapsed && <span className="min-w-0 truncate">{title}</span>}
      </div>
      {!collapsed &&
        showChevron &&
        (expanded ? (
          <ChevronUp className="size-4 shrink-0 opacity-70" aria-hidden />
        ) : (
          <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
        ))}
    </div>
  );
}
