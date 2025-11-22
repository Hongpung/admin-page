"use client";

import type { FormEvent } from "react";
import type { BannerDTO } from "../../types";
import { type BannerUpdateDirtyMap, useUpdateBannerModalState } from "../../hooks/form";
import { BannerFormModalFrame, BannerModalForm } from "../ui";

type UpdateBannerModalProps = {
  isOpen: boolean;
  banner: BannerDTO;
  onSubmit: (args: {
    event: FormEvent<HTMLFormElement>;
    updatedPart: BannerUpdateDirtyMap;
    originBanner: BannerDTO;
  }) => void;
  onClose: () => void;
};

export function UpdateBannerModal({
  isOpen,
  banner,
  onSubmit,
  onClose,
}: UpdateBannerModalProps) {
  const {
    previewUrl,
    onFileChange,
    defaults,
    hasChanges,
    handleSubmit,
    updateFieldHandlers,
  } = useUpdateBannerModalState({ isOpen, banner, onSubmit });

  return (
    <BannerFormModalFrame isOpen={isOpen} onDismiss={onClose}>
      <BannerModalForm
        formKey={banner.bannerId}
        mode="update"
        heading="배너 정보 수정"
        previewUrl={previewUrl}
        onImageChange={onFileChange}
        onSubmit={handleSubmit}
        imageInputRequired={false}
        defaults={defaults}
        updateFieldHandlers={updateFieldHandlers}
        submitDisabled={!hasChanges}
      />
    </BannerFormModalFrame>
  );
}
