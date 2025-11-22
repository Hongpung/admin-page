"use client";

import { Suspense } from "react";
import FAB from "@admin/shared/components/FAB";
import LoadingIndicator from "@admin/shared/components/LoadingIndicator";
import type { Notice } from "@admin/features/notice";
import { useNoticeManageState } from "@admin/features/notice/hooks/state/useNoticeManageState";
import { CreateNoticeModal } from "@admin/features/notice/components/overlay/CreateNoticeModal";
import { ModifyNoticeModal } from "@admin/features/notice/components/overlay/ModifyNoticeModal";
import { NoticeDetailPanel } from "@admin/features/notice/components/section/NoticeDetailPanel";
import { NoticeListPanel } from "@admin/features/notice/components/ui/NoticeListPanel";

type NoticeManageClientProps = {
  initNotices: Notice[];
};

function NoticeManageClientInner({ initNotices }: NoticeManageClientProps) {
  const {
    notices,
    parsedNoticeId,
    specificNotice,
    noticeManageState,
    setNoticeManageState,
    handleSelectNotice,
    refreshNotices,
    deleteNoticeById,
    closeModal,
  } = useNoticeManageState(initNotices);

  return (
    <>
      <FAB color="gray" onClick={() => setNoticeManageState("create")} />
      <div className="relative flex w-full flex-row items-start gap-4 h-full">
        <NoticeListPanel
          notices={notices}
          selectedNoticeId={parsedNoticeId}
          onSelectNotice={handleSelectNotice}
          onRefresh={refreshNotices}
        />
        <div className="flex min-w-0 flex-1 flex-col min-h-full rounded-md border px-4 py-3 relative">
          <NoticeDetailPanel
            notice={specificNotice}
            onEdit={() => setNoticeManageState("modify")}
            onDelete={deleteNoticeById}
          />
        </div>
      </div>
      {specificNotice ? (
        <ModifyNoticeModal
          isOpen={noticeManageState === "modify"}
          notice={specificNotice}
          onClose={closeModal}
        />
      ) : null}
      <CreateNoticeModal
        isOpen={noticeManageState === "create"}
        onClose={closeModal}
      />
    </>
  );
}

export function NoticeManageClient(props: NoticeManageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[min(24rem,50vh)] w-full items-center justify-center rounded-md border border-dashed border-neutral-200 bg-slate-50/80">
          <LoadingIndicator />
        </div>
      }
    >
      <NoticeManageClientInner {...props} />
    </Suspense>
  );
}
