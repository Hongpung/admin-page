import { useCallback, useMemo, type FormEvent } from "react";
import type { BannerDTO } from "../../types";
import { useBannerModalImagePreview } from "./useBannerModalImagePreview";
import {
  useBannerUpdateDirty,
  type BannerUpdateDirtyMap,
} from "./useBannerUpdateDirty";

type Args = {
  isOpen: boolean;
  banner: BannerDTO;
  onSubmit: (args: {
    event: FormEvent<HTMLFormElement>;
    updatedPart: BannerUpdateDirtyMap;
    originBanner: BannerDTO;
  }) => void;
};

export function useUpdateBannerModalState({ isOpen, banner, onSubmit }: Args) {
  const { previewUrl, onFileChange } = useBannerModalImagePreview({
    isOpen,
    remotePreviewUrl: banner.bannerImgUrl,
    remoteKey: banner.bannerId,
  });

  const {
    dirty,
    hasChanges,
    onOwnerChange,
    onStartDateChange,
    onEndDateChange,
    onHrefChange,
  } = useBannerUpdateDirty(banner, previewUrl, isOpen);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      if (!hasChanges) {
        e.preventDefault();
        return;
      }
      onSubmit({ event: e, updatedPart: dirty, originBanner: banner });
    },
    [banner, dirty, hasChanges, onSubmit],
  );

  const defaults = useMemo(
    () => ({
      owner: banner.owner ?? "",
      startDate: banner.startDate.split("T")[0] ?? "",
      endDate: banner.endDate.split("T")[0] ?? "",
      href: banner.href ?? "",
    }),
    [banner.endDate, banner.href, banner.owner, banner.startDate],
  );

  return {
    previewUrl,
    onFileChange,
    defaults,
    hasChanges,
    handleSubmit,
    updateFieldHandlers: {
      onOwnerChange,
      onStartDateChange,
      onEndDateChange,
      onHrefChange,
    },
  };
}
