"use client";

import Modal from "@admin/shared/components/Modal";
import Line from "@admin/shared/components/Line";
import { reservationSecondaryButtonStyle } from "../../constants/constants";
import {
  formatDiscardedRowCreatedAt,
  DISCARD_REASON_LABELS,
} from "../../lib/discarded";
import type {
  DiscardedReservationItem,
  DiscardedReservationMemberSnapshot,
} from "../../types";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

function getReservationTypeLabel(
  reservationType: string,
  participationAvailable: boolean,
) {
  if (reservationType === "COMMON")
    if (participationAvailable) return "열린";
    else return "비공개";
  if (reservationType === "REGULAR") return "정규";
  if (reservationType === "EXTERNAL") return "외부";
  return reservationType;
}

function formatMemberDisplayName(member: DiscardedReservationMemberSnapshot) {
  return (
    (member.nickname ? `${member.name} (${member.nickname})` : member.name) +
    ("/" + member.club?.clubName || "소속 없음")
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <span className="shrink-0 text-left">{label}</span>
      <div className="max-w-xs w-full rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 text-left break-words whitespace-pre">
        {value}
      </div>
    </div>
  );
}

export function DiscardedReservationDetailModal({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: DiscardedReservationItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const reservation = item.reservation;
  const isExternal = reservation.reservationType === "EXTERNAL";
  const creator = reservation.creatorSnapshot;
  const creatorDisplayName = creator
    ? formatMemberDisplayName(creator)
    : (reservation.externalCreatorName?.trim() ?? "—");

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <div className="font-bold text-lg">취소 예약 상세</div>

      <div className="mx-4 mt-6 flex flex-col gap-6 text-left">
        <ReadOnlyRow label="연습 제목" value={reservation.title || "—"} />
        <ReadOnlyRow
          label="예약 종류"
          value={getReservationTypeLabel(
            reservation.reservationType,
            reservation.participationAvailable,
          )}
        />

        <ReadOnlyRow
          label={isExternal ? "외부 예약자" : "예약자"}
          value={creatorDisplayName}
        />

        <ReadOnlyRow
          label="예약 일시"
          value={
            dayjs
              .utc(reservation.date)
              .locale("ko")
              .format("YYYY-MM-DD (ddd)") +
            "\n" +
            `${dayjs.utc(reservation.startTime).locale("ko").format("A h시 mm분")} ~ ${dayjs.utc(reservation.endTime).locale("ko").format("A h시 mm분")}`
          }
        />

        <Line />
        <ReadOnlyRow label="처리 주체" value={item.discardedByType} />

        <ReadOnlyRow
          label="취소 사유"
          value={DISCARD_REASON_LABELS[item.discardReason]}
        />

        <ReadOnlyRow
          label="유예 시간"
          value={`${reservation.policy.graceMinutes}분`}
        />
        <ReadOnlyRow
          label="취소 시각"
          value={formatDiscardedRowCreatedAt(item.createdAt)}
        />
      </div>

      <div className="flex flex-row justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className={reservationSecondaryButtonStyle}
        >
          닫기
        </button>
      </div>
    </Modal>
  );
}
