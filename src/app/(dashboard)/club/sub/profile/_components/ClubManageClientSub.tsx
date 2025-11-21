"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@admin/shared/components/ErrorNotice";
import { saveSubClubDetail } from "@admin/features/club/lib/club-detail-save";
import {
  clubQueryKeys,
  subClubProfileQueryOptions,
} from "@admin/features/club/queries/club-query-options";
import type { ClubInfo } from "@admin/features/club/types";
import { ClubDetailPanel } from "@admin/features/club/components/section/ClubDetailPanel";

function readClubDetailError(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error
    ? error.message
    : "동아리 정보를 불러오지 못했습니다.";
}

export function ClubManageClientSub() {
  const [, setIsDetailDirty] = useState(false);
  const subClubQuery = useQuery(subClubProfileQueryOptions());
  const selectedClub = (subClubQuery.data as ClubInfo | undefined) ?? null;
  const error = readClubDetailError(subClubQuery.error);

  if (subClubQuery.isLoading || subClubQuery.isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return <ErrorNotice detail={error} />;
  }

  if (!selectedClub) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-gray-500">동아리 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="col-span-2">
      <ClubDetailPanel
        key={selectedClub.clubId}
        club={selectedClub}
        onDirtyChange={setIsDetailDirty}
        invalidateKeys={[clubQueryKeys.subProfile()]}
        saveDetail={saveSubClubDetail}
      />
    </div>
  );
}
