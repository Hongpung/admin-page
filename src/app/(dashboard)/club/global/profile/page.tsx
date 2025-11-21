"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@admin/shared/components/ErrorNotice";
import { clubProfilesQueryOptions } from "@admin/features/club/queries/club-query-options";
import type { ClubInfo } from "@admin/features/club/types";
import { useSelectedClubFromUrl } from "@admin/features/club/hooks/state/useSelectedClubFromUrl";
import { ClubDetailPanel } from "@admin/features/club/components/section/ClubDetailPanel";
import { ClubListPanel } from "@admin/features/club/components/ui/ClubListPanel";
import { ClubPrimaryMembersBoard } from "@admin/features/club/components/section/ClubPrimaryMembersBoard";

type ClubControlType = "info" | "primary-member";

const CLUB_CONTROL_TABS: { id: ClubControlType; label: string }[] = [
  { id: "info", label: "동아리 상치배 관리" },
  { id: "primary-member", label: "주요 활동 멤버 관리" },
];

function readClubListError(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error
    ? error.message
    : "동아리 목록을 불러오지 못했습니다.";
}

export default function ClubManageClient() {
  const [controllType, setControllType] = useState<ClubControlType>("info");
  const clubsQuery = useQuery(clubProfilesQueryOptions());
  const clubs = useMemo(
    () => (clubsQuery.data as ClubInfo[] | undefined) ?? [],
    [clubsQuery.data]
  );
  const error = readClubListError(clubsQuery.error);
  const { selectedClub, isDetailDirty, setIsDetailDirty, selectClub } =
    useSelectedClubFromUrl(clubs);

  const handleControlTypeChange = (nextType: ClubControlType) => {
    if (nextType === controllType) return;

    if (isDetailDirty && controllType === "info") {
      const ok = window.confirm(
        "저장되지 않은 변경 사항이 있습니다. 이동하면 변경 내용이 사라집니다. 계속하시겠습니까?",
      );
      if (!ok) return;
      setIsDetailDirty(false);
    }

    setControllType(nextType);
  };

  const renderContent = useMemo(() => {
    if (!selectedClub) return null;

    switch (controllType) {
      case "info":
        return (
          <ClubDetailPanel
            key={selectedClub?.clubId}
            club={selectedClub}
            onDirtyChange={setIsDetailDirty}
          />
        );
      case "primary-member":
        return <ClubPrimaryMembersBoard clubId={selectedClub?.clubId} />;
      default:
        return null;
    }
  }, [controllType, selectedClub, setIsDetailDirty]);

  if (clubsQuery.isLoading || clubsQuery.isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return <ErrorNotice detail={error} />;
  }

  if (clubs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-gray-500">동아리 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-4 gap-6">
      <ClubListPanel
        clubs={clubs}
        selectedClubId={selectedClub?.clubId}
        onSelect={selectClub}
      />
      <div className="col-span-3">
        {selectedClub ? (
          <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-3">
              <div
                className="inline-flex rounded-lg bg-gray-100 p-1"
                role="tablist"
                aria-label="동아리 관리 모드"
              >
                {CLUB_CONTROL_TABS.map((tab) => {
                  const isActive = controllType === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleControlTypeChange(tab.id)}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {renderContent ?? null}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-gray-500">동아리를 선택해 주세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}
