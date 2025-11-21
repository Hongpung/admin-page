"use client";

import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { useClubDetailImage } from "../../hooks/form/useClubDetailImage";
import type { ClubDetailFormValues } from "../../types";

export function ClubProfileImageSection({ clubName }: { clubName: string }) {
  const { watch, setValue } = useFormContext<ClubDetailFormValues>();

  const {
    displayedProfileImage,
    imageInputRef,
    handleImageChangeClick,
    handleImageDelete,
    handleImageFileChange,
  } = useClubDetailImage({ watch, setValue });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-64 w-64 overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
        {displayedProfileImage ? (
          <Image
            src={displayedProfileImage}
            alt={clubName}
            fill
            sizes="256px"
            unoptimized={
              displayedProfileImage.startsWith("blob:") ||
              displayedProfileImage.startsWith("data:")
            }
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
            <div>프로필 이미지 없음</div>
            <div className="text-sm">최대 2MB</div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={handleImageChangeClick}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            이미지 변경
          </button>
          <button
            type="button"
            onClick={handleImageDelete}
            className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          >
            삭제
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
      </div>
    </div>
  );
}
