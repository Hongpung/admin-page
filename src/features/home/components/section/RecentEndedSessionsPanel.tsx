import Link from "next/link";
import type { Session } from "@admin/features/session";
import { PanelCard } from "../ui";

type RecentEndedSessionsPanelProps = {
  sessions: Session[] | null;
};

export function RecentEndedSessionsPanel({
  sessions,
}: RecentEndedSessionsPanelProps) {
  return (
    <PanelCard
      title="최근 종료된 세션 (10건)"
      href="/session"
      hrefLabel="연습실 이용 내역"
      className="col-span-1 min-h-[420px]"
    >
      {sessions === null ? (
        <div className="flex items-center justify-center p-8 text-sm text-gray-400">
          불러오는 중…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-sm text-gray-400">
          최근 종료된 세션이 없습니다.
        </div>
      ) : (
        <ul className="max-h-[max(520px,70vh)] divide-y divide-gray-100 overflow-y-auto p-2 flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.sessionId} className="border rounded-md border-gray-100">
              <Link
                href={`/session?sessionId=${s.sessionId}`}
                className="px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 flex flex-col gap-2"
              >
                <div className="flex flex-row justify-between items-start min-h-5">
                  <div className="font-medium text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-500">
                    {s.creatorName}
                    {s.creatorNickname ? ` (${s.creatorNickname})` : ""}
                  </div>
                </div>

                <div className="mt-0.5 whitespace-pre-line text-xs text-gray-500 flex flex-row justify-between">
                  <span>{s.date}</span>
                  <span>
                    {s.startTime}–{s.endTime}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
