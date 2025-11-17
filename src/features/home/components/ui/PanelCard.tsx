import Link from "next/link";
import type { ReactNode } from "react";

type PanelCardProps = {
  title: string;
  href: string;
  hrefLabel: string;
  children: ReactNode;
  className?: string;
};

export function PanelCard({
  title,
  href,
  hrefLabel,
  children,
  className = "",
}: PanelCardProps) {
  return (
    <div
      className={`flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <Link
          href={href}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {hrefLabel}
        </Link>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
