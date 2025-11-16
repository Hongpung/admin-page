import type {
  AriaRole,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
} from "react";
import { alignClass } from "./constants";
import type { Align } from "./types";

export function Shell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function Row({
  children,
  className,
  onClick,
  onKeyDown,
  tabIndex,
  role,
}: {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
  onKeyDown?: KeyboardEventHandler<HTMLTableRowElement>;
  tabIndex?: number;
  role?: AriaRole;
}) {
  return (
    <tr
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: Align;
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 ${alignClass[align]} ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "center",
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  className?: string;
  align?: Align;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`px-3 py-2 ${alignClass[align]} ${className ?? ""}`}
    >
      {children}
    </td>
  );
}
