import Link from "next/link";
import type { Notice } from "@admin/features/notice/types";

type NoticePreviewCardProps = {
  notices: Notice[] | null;
};

export function NoticePreviewCard({ notices }: NoticePreviewCardProps) {
  const noticePreview = (notices ?? []).slice(0, 4);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-gray-500">공지사항</div>
        <Link href="/manage/notice" className="text-xs font-medium text-blue-600 hover:underline">
          관리
        </Link>
      </div>
      {notices === null ? (
        <div className="mt-3 text-sm text-gray-400">불러오는 중…</div>
      ) : noticePreview.length === 0 ? (
        <div className="mt-3 text-sm text-gray-400">등록된 공지가 없습니다.</div>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 text-sm text-gray-800">
          {noticePreview.map((n) => (
            <li key={n.noticeId}>
              <Link
                href={`/manage/notice?noticeId=${n.noticeId}`}
                className="block truncate rounded px-1 py-1.5 transition-colors hover:bg-slate-50"
                title={n.title}
              >
                · {n.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
