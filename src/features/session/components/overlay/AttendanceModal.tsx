"use client";

import Modal from "@admin/shared/components/Modal";
import { WatchIcon } from "lucide-react";
import { attendanceChipClass } from "../../constants/attendance-chip-styles";
import { palette } from "../../constants/session-ui.constants";
import { useAttendanceModalStatusState } from "../../hooks/state";
import { useAttendanceModalViewModel } from "../../hooks/view-model";
import type { SessionAttendanceEntry } from "../../types";
import { MemberRow } from "../ui/MemberRow";

export function AttendanceModal({
  sessionType,
  byStatus,
  open,
  onClose,
}: {
  sessionType: string;
  byStatus: Record<string, SessionAttendanceEntry[]>;
  open: boolean;
  onClose: () => void;
}) {
  const { availableChips, sectionContentByStatus } = useAttendanceModalViewModel(
    {
      byStatus,
      sessionType,
    },
  );
  const { selectedStatus, setSelectedStatus } = useAttendanceModalStatusState({
    open,
    availableChips,
    byStatus,
  });

  const currentContent = selectedStatus
    ? sectionContentByStatus[selectedStatus]
    : null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      contentClassName="mx-4 flex max-h-[min(70vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-xl"
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-5 py-4"
        style={{ borderColor: palette.grey100 }}
      >
        <h2 className="text-lg font-bold" style={{ color: palette.grey700 }}>
          출석 현황
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-2xl leading-none text-gray-400 hover:bg-gray-100"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      {availableChips.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-2 pt-4">
          {availableChips.map((status) => (
            <button
              key={status}
              type="button"
              className={attendanceChipClass(status, selectedStatus === status)}
              onClick={() => setSelectedStatus(status)}
            >
              {status} {byStatus[status]!.length}
            </button>
          ))}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1">
        {availableChips.length === 0 ? (
          <p
            className="py-8 text-center text-sm"
            style={{ color: palette.grey400 }}
          >
            출석 정보가 없어요
          </p>
        ) : !selectedStatus || !currentContent ? null : currentContent.type ===
          "byTime" ? (
          <div className="flex flex-col gap-3">
            {currentContent.groups.map(({ timeKey, group, timeLabel }) => (
              <div
                key={timeKey}
                className="flex flex-col gap-2 rounded-xl p-3"
                style={{ backgroundColor: palette.grey100 }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span style={{ color: palette.grey500 }} aria-hidden>
                    <WatchIcon />
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: palette.grey600 }}
                  >
                    {timeLabel}
                  </span>
                </div>
                {group.map((item) => (
                  <MemberRow
                    key={`${item.member.memberId}-${timeKey}`}
                    member={item.member}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col gap-2 rounded-xl p-3"
            style={{ backgroundColor: palette.grey100 }}
          >
            {currentContent.items.map((item) => (
              <MemberRow
                key={String(item.member.memberId)}
                member={item.member}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
