"use client";

import type { ReactNode } from "react";
import Modal from "@admin/shared/components/Modal";
import { X } from "lucide-react";

type BannerFormModalFrameProps = {
  isOpen: boolean;
  onDismiss: () => void;
  children: ReactNode;
};

export function BannerFormModalFrame({
  isOpen,
  onDismiss,
  children,
}: BannerFormModalFrameProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      contentClassName="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg bg-white px-8 py-6 shadow-lg"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-400/40"
        aria-label="닫기"
      >
        <X className="size-5" aria-hidden />
      </button>
      {children}
    </Modal>
  );
}
