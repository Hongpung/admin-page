"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { BannerDTO } from "../../types";

export type BannerUpdateDirtyMap = {
  owner: boolean;
  startDate: boolean;
  endDate: boolean;
  "banner-href": boolean;
  "banner-image": boolean;
};

export function useBannerUpdateDirty(
  banner: BannerDTO,
  previewUrl: string | null,
  isOpen: boolean
) {
  const [textDirty, setTextDirty] = useState<Omit<BannerUpdateDirtyMap, "banner-image">>({
    owner: false,
    startDate: false,
    endDate: false,
    "banner-href": false,
  });

  useEffect(() => {
    if (!isOpen) return;
    setTextDirty({
      owner: false,
      startDate: false,
      endDate: false,
      "banner-href": false,
    });
  }, [isOpen, banner.bannerId]);

  const startDateStr = banner.startDate.split("T")[0] ?? "";
  const endDateStr = banner.endDate.split("T")[0] ?? "";
  const hrefOrig = banner.href ?? "";

  const onOwnerChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setTextDirty((d) => ({ ...d, owner: e.target.value !== banner.owner }));
    },
    [banner.owner]
  );

  const onStartDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setTextDirty((d) => ({
        ...d,
        startDate: e.target.value !== startDateStr,
      }));
    },
    [startDateStr]
  );

  const onEndDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setTextDirty((d) => ({
        ...d,
        endDate: e.target.value !== endDateStr,
      }));
    },
    [endDateStr]
  );

  const onHrefChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setTextDirty((d) => ({
        ...d,
        "banner-href": e.target.value !== hrefOrig,
      }));
    },
    [hrefOrig]
  );

  const dirty = useMemo<BannerUpdateDirtyMap>(() => {
    const imageDirty = isOpen && previewUrl !== banner.bannerImgUrl;
    return {
      ...textDirty,
      "banner-image": imageDirty,
    };
  }, [banner.bannerImgUrl, isOpen, previewUrl, textDirty]);
  const hasChanges = Object.values(dirty).some(Boolean);

  return {
    dirty,
    onOwnerChange,
    onStartDateChange,
    onEndDateChange,
    onHrefChange,
    hasChanges,
  };
}
