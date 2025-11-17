"use client";

import { Suspense, lazy } from "react";
import {
  NoticePreviewCardSkeleton,
  RecentEndedSessionsPanelSkeleton,
  StatLinkCardSkeleton,
  WeekReservationsPanelSkeleton,
} from "@admin/features/home/components/ui";
import {
  ActiveBannerStatLinkCard,
  NoticePreviewDashboardItem,
  PendingSignupStatLinkCard,
  RecentEndedSessionsDashboardItem,
  WeekDiscardedStatLinkCard,
} from "@admin/features/home/components/section";

const WeekReservationsPanel = lazy(() =>
  import("@admin/features/home/components/section").then((m) => ({
    default: m.WeekReservationsPanel,
  })),
);

export function HomeDashboardPage() {
  return (
    <div className="box-border w-full px-4 py-4">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">대시보드</h1>

      <div className="grid grid-cols-4 gap-3">
        <Suspense fallback={<StatLinkCardSkeleton footnote="가입 요청 관리" />}>
          <PendingSignupStatLinkCard />
        </Suspense>

        <Suspense
          fallback={
            <StatLinkCardSkeleton footnote="최근 기록 기준(최대 500건)" />
          }
        >
          <WeekDiscardedStatLinkCard />
        </Suspense>

        <Suspense fallback={<NoticePreviewCardSkeleton />}>
          <NoticePreviewDashboardItem />
        </Suspense>

        <Suspense
          fallback={<StatLinkCardSkeleton footnote="현재 게시 중(OnPost)" />}
        >
          <ActiveBannerStatLinkCard />
        </Suspense>

        <Suspense fallback={<RecentEndedSessionsPanelSkeleton />}>
          <RecentEndedSessionsDashboardItem />
        </Suspense>

        <Suspense fallback={<WeekReservationsPanelSkeleton />}>
          <WeekReservationsPanel />
        </Suspense>
      </div>
    </div>
  );
}
