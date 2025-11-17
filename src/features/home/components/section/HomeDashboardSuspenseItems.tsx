"use client";

import { useQuery } from "@tanstack/react-query";
import { countDiscardedInCurrentWeek } from "../../lib/week-discarded-count";
import {
  activeBannerCountQueryOptions,
  dashboardNoticesQueryOptions,
  pendingSignupCountQueryOptions,
  recentEndedSessionsQueryOptions,
  weekDiscardedReservationsQueryOptions,
} from "../../queries";
import { NoticePreviewCard } from "./NoticePreviewCard";
import { RecentEndedSessionsPanel } from "./RecentEndedSessionsPanel";
import { StatLinkCard } from "../ui";

const DISCARDED_FETCH_TAKE = 500;

export function PendingSignupStatLinkCard() {
  const pendingSignupQuery = useQuery(pendingSignupCountQueryOptions());
  const pendingSignupCount = pendingSignupQuery.data ?? null;

  return (
    <StatLinkCard
      title="가입 대기"
      value={pendingSignupCount ?? "-"}
      href="/user/accept"
      footnote="가입 요청 관리"
    />
  );
}

export function WeekDiscardedStatLinkCard() {
  const weekDiscardedQuery = useQuery(
    weekDiscardedReservationsQueryOptions(DISCARDED_FETCH_TAKE),
  );
  const weekDiscardedCount = weekDiscardedQuery.data?.items
    ? countDiscardedInCurrentWeek(weekDiscardedQuery.data.items)
    : null;

  return (
    <StatLinkCard
      title="이번 주 취소된 예약"
      value={weekDiscardedCount ?? "-"}
      href="/reservation/discarded"
      footnote="최근 기록 기준(최대 500건)"
    />
  );
}

export function NoticePreviewDashboardItem() {
  const noticesQuery = useQuery(dashboardNoticesQueryOptions());
  const notices = noticesQuery.data ?? null;

  return <NoticePreviewCard notices={notices} />;
}

export function ActiveBannerStatLinkCard() {
  const activeBannerQuery = useQuery(activeBannerCountQueryOptions());
  const activeBannerCount = activeBannerQuery.data ?? null;

  return (
    <StatLinkCard
      title="노출 중인 배너"
      value={activeBannerCount ?? "-"}
      href="/manage/banner"
      footnote="현재 게시 중(OnPost)"
    />
  );
}

export function RecentEndedSessionsDashboardItem() {
  const recentSessionsQuery = useQuery(recentEndedSessionsQueryOptions(10));
  const recentSessions = recentSessionsQuery.data ?? null;

  return <RecentEndedSessionsPanel sessions={recentSessions} />;
}
