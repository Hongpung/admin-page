"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { ClubDetailFormValues, ClubInfo } from "../../types";
import { useClubDetailSave } from "../../hooks/action/useClubDetailSave";
import { buildClubDetailFormValues } from "../../lib/club-detail-form-values";
import { saveClubDetail } from "../../lib/club-detail-save";
import { ClubProfileImageSection } from "./ClubProfileImageSection";
import { ClubRoleAssignmentsSection } from "./ClubRoleAssignmentsSection";

type ClubDetailPanelProps = {
  club: ClubInfo;
  onDirtyChange?: (dirty: boolean) => void;
  invalidateKeys?: ReadonlyArray<readonly unknown[]>;
  saveDetail?: typeof saveClubDetail;
};

export function ClubDetailPanel({
  club,
  onDirtyChange,
  invalidateKeys,
  saveDetail,
}: ClubDetailPanelProps) {
  const formMethods = useForm<ClubDetailFormValues>({
    defaultValues: buildClubDetailFormValues(club),
  });
  const { reset, getValues, formState, handleSubmit } = formMethods;

  const { isSaving, handleSave } = useClubDetailSave({
    club,
    getValues,
    reset,
    submitForm: (onValid) => handleSubmit(onValid),
    invalidateKeys,
    saveDetail,
  });

  useEffect(() => {
    reset(buildClubDetailFormValues(club));
  }, [club, reset]);

  useEffect(() => {
    onDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  return (
    <FormProvider {...formMethods}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border m-2 border-gray-200 bg-gray-100 px-4 py-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-gray-900">
            동아리 상치배 관리
          </h1>
          <p className="whitespace-pre-line text-sm text-gray-500">
            {"동아리 정보를 수정할 수 있습니다."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!formState.isDirty || isSaving}
            className="rounded-md border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
          >
            {isSaving ? "저장 중..." : "변경 저장"}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-6 py-6">
          <ClubProfileImageSection clubName={club.clubName} />
          <ClubRoleAssignmentsSection />
        </div>
      </div>
    </FormProvider>
  );
}
