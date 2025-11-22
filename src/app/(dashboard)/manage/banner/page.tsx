"use client";

import FAB from "@admin/shared/components/FAB";
import LoadingIndicator from "@admin/shared/components/LoadingIndicator";
import Modal from "@admin/shared/components/Modal";
import {
  CreateBannerModal,
  UpdateBannerModal,
  BannerStatusSection,
} from "@admin/features/banner/components";
import {
  useCreateBannerAction,
  useDeleteBannerAction,
  useUpdateBannerAction,
} from "@admin/features/banner/hooks/action";
import {
  useBannerBucketsState,
  useBannerManageState,
} from "@admin/features/banner/hooks/state";

export default function BannerManagePage() {
  const { modalState, openCreateModal, openUpdateModal, closeModal } =
    useBannerManageState();
  const {
    activeBanners,
    plannedBanners,
    oldBanners,
    isLoading: isBannersLoading,
  } = useBannerBucketsState();

  const { submitCreateBanner, isPending: isCreatePending } =
    useCreateBannerAction({
      onSuccess: closeModal,
    });
  const { submitUpdateBanner, isPending: isUpdatePending } =
    useUpdateBannerAction({
      onSuccess: closeModal,
    });
  const { deleteBannerById, isPending: isDeletePending } =
    useDeleteBannerAction();

  const isLoading =
    isBannersLoading || isCreatePending || isUpdatePending || isDeletePending;

  return (
    <div className="relative flex min-h-full w-full flex-col px-4 py-2">
      <FAB color="gray" onClick={openCreateModal} />

      <div className="w-full rounded-md border px-4 py-3">
        <h2 className="text-lg font-semibold">배너 관리</h2>
        <div className="w-full flex flex-col gap-4 py-8">
          <BannerStatusSection
            title="게시중인 배너"
            banners={activeBanners}
            onEdit={openUpdateModal}
            onDelete={deleteBannerById}
          />
          <BannerStatusSection
            title="예정 배너"
            banners={plannedBanners}
            onEdit={openUpdateModal}
            onDelete={deleteBannerById}
          />
          <BannerStatusSection
            title="종료된 배너"
            banners={oldBanners}
            onEdit={openUpdateModal}
            onDelete={deleteBannerById}
          />
        </div>
      </div>
      <Modal isOpen={isLoading}>
        <LoadingIndicator style="bg-transparent text-black" />
      </Modal>
      <CreateBannerModal
        isOpen={modalState?.state === "Create"}
        onClose={closeModal}
        onSubmit={submitCreateBanner}
      />
      {modalState?.banner ? (
        <UpdateBannerModal
          isOpen={modalState.state === "Update"}
          onClose={closeModal}
          onSubmit={submitUpdateBanner}
          banner={modalState.banner}
        />
      ) : null}
    </div>
  );
}
