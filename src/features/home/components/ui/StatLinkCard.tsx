import Link from "next/link";

type StatLinkCardProps = {
  title: string;
  value: string | number;
  href: string;
  footnote?: string;
};

export function StatLinkCard({ title, value, href, footnote }: StatLinkCardProps) {
  return (
    <Link
      href={href}
      className="block h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/90"
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
        {value}
      </div>
      {footnote ? (
        <div className="mt-2 text-xs text-gray-400">{footnote}</div>
      ) : null}
    </Link>
  );
}
