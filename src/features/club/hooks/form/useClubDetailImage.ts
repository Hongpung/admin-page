"use client";

import { useEffect, useMemo, useRef } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { preprocessClubImageFile } from "../../lib/club-image-preprocess";
import type { ClubDetailFormValues } from "../../types";

export function useClubDetailImage({
  watch,
  setValue,
}: {
  watch: UseFormWatch<ClubDetailFormValues>;
  setValue: UseFormSetValue<ClubDetailFormValues>;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const file = watch("file");
  const profileImageUrl = watch("profileImageUrl");

  const previewUrl = useMemo(
    () => (file instanceof File ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayedProfileImage = previewUrl ?? profileImageUrl;

  const handleImageDelete = () => {
    setValue("profileImageUrl", null, {
      shouldDirty: profileImageUrl !== null,
    });
    setValue("file", null, { shouldDirty: false });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleImageChangeClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const newFile = input.files?.[0] ?? null;
    if (!newFile) return;

    void (async () => {
      try {
        const preprocessed = await preprocessClubImageFile(newFile);
        setValue("file", preprocessed.file, { shouldDirty: true });
      } catch (error) {
        setValue("file", null, { shouldDirty: false });
        input.value = "";
        alert(
          error instanceof Error
            ? error.message
            : "이미지 처리 중 오류가 발생했습니다.",
        );
      }
    })();
  };

  return {
    displayedProfileImage,
    imageInputRef,
    handleImageDelete,
    handleImageChangeClick,
    handleImageFileChange,
  };
}
