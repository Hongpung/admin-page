"use client";

import type { ReactNode } from "react";
import FAB from "@admin/shared/components/FAB";
import { ReservationWeekUiProvider } from "../../provider/ReservationWeekUiContext";
import { useReservationWeekModalRouting } from "../../hooks/action";
import { BatchAddModal } from "../overlay/BatchAddModal";
import { CreateReservationModal } from "../overlay/CreateReservationModal";
import { EditReservationModal } from "../overlay/EditReservationModal";

function ReservationWeekFabAndModals() {
  const {
    modal,
    editReservationId,
    closeModal,
    openCreateModal,
    openBatchModal,
  } = useReservationWeekModalRouting();

  return (
    <>
      <FAB
        actions={[
          {
            label: "새 예약 생성",
            onClick: openCreateModal,
          },
          {
            label: "정기 예약 일정 생성",
            onClick: openBatchModal,
          },
        ]}
      />
      {modal === "CreateBatch" && (
        <BatchAddModal onClose={closeModal} isOpen={modal === "CreateBatch"} />
      )}
      {modal === "Create" && (
        <CreateReservationModal
          onClose={closeModal}
          visible={modal === "Create"}
        />
      )}
      {modal === "Edit" && editReservationId != null && (
        <EditReservationModal
          onClose={closeModal}
          reservationId={editReservationId}
          visible={modal === "Edit" && editReservationId != null}
        />
      )}
    </>
  );
}

/** 실시간 예약(주간) 라우트 전용: FAB·모달 스토어 바운더리 */
export function ReservationWeekUiBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReservationWeekUiProvider>
      <ReservationWeekFabAndModals />
      {children}
    </ReservationWeekUiProvider>
  );
}
