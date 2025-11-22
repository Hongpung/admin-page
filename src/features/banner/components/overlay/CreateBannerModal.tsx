"use client";

import type { FormEvent } from "react";
import { useBannerModalImagePreview } from "../../hooks/form";
import { BannerFormModalFrame, BannerModalForm } from "../ui";

type CreateBannerModalProps = {
  isOpen: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function CreateBannerModal({
  isOpen,
  onSubmit,
  onClose,
}: CreateBannerModalProps) {
  const { previewUrl, onFileChange } = useBannerModalImagePreview({
    isOpen,
  });

  return (
    <BannerFormModalFrame isOpen={isOpen} onDismiss={onClose}>
      <BannerModalForm
        mode="create"
        heading="신규 배너 생성"
        previewUrl={previewUrl}
        onImageChange={onFileChange}
        onSubmit={onSubmit}
        imageInputRequired
      />
    </BannerFormModalFrame>
  );
}
