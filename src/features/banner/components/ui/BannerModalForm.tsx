"use client";

import Image from "next/image";
import {
  useCallback,
  type ChangeEventHandler,
  type FormEventHandler,
} from "react";

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25";

const labelClass =
  "text-sm font-medium text-neutral-600 sm:pt-2";

export type BannerModalFormProps = {
  mode: "create" | "update";
  formKey?: string | number;
  heading: string;
  previewUrl: string | null;
  onImageChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  imageInputRequired: boolean;
  defaults?: {
    owner: string;
    startDate: string;
    endDate: string;
    href: string;
  };
  updateFieldHandlers?: {
    onOwnerChange: ChangeEventHandler<HTMLInputElement>;
    onStartDateChange: ChangeEventHandler<HTMLInputElement>;
    onEndDateChange: ChangeEventHandler<HTMLInputElement>;
    onHrefChange: ChangeEventHandler<HTMLInputElement>;
  };
  submitDisabled?: boolean;
};

export function BannerModalForm({
  mode,
  formKey,
  heading,
  previewUrl,
  onImageChange,
  onSubmit,
  imageInputRequired,
  defaults,
  updateFieldHandlers,
  submitDisabled = false,
}: BannerModalFormProps) {
  const fileInputId =
    mode === "create" ? "banner-image-create" : "banner-image-update";

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      if (submitDisabled) {
        e.preventDefault();
        return;
      }
      onSubmit(e);
    },
    [onSubmit, submitDisabled]
  );

  return (
    <form
      key={formKey}
      className="mt-1 flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
        {heading}
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[7.5rem_1fr] sm:items-start sm:gap-x-4 sm:gap-y-4">
        <label htmlFor="banner-owner" className={labelClass}>
          신청자
        </label>
        <input
          id="banner-owner"
          name="owner"
          type="text"
          required
          defaultValue={defaults?.owner}
          onChange={updateFieldHandlers?.onOwnerChange}
          className={inputClass}
          autoComplete="off"
        />

        <label htmlFor="banner-start" className={labelClass}>
          시작 날짜
        </label>
        <input
          id="banner-start"
          name="startDate"
          type="date"
          required
          defaultValue={defaults?.startDate}
          onChange={updateFieldHandlers?.onStartDateChange}
          className={`${inputClass} max-w-xs`}
        />

        <label htmlFor="banner-end" className={labelClass}>
          종료 날짜
        </label>
        <input
          id="banner-end"
          name="endDate"
          type="date"
          required
          defaultValue={defaults?.endDate}
          onChange={updateFieldHandlers?.onEndDateChange}
          className={`${inputClass} max-w-xs`}
        />

        <label htmlFor="banner-href-field" className={labelClass}>
          연결 URL
        </label>
        <input
          id="banner-href-field"
          name="banner-href"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={defaults?.href}
          onChange={updateFieldHandlers?.onHrefChange}
          className={inputClass}
        />

        <span className={labelClass}>배너 이미지</span>
        <div className="flex flex-col gap-3">
          <input
            id={fileInputId}
            name="banner-image"
            type="file"
            accept=".jpeg,.jpg,.png,image/jpeg,image/png"
            required={imageInputRequired}
            onChange={onImageChange}
            className="sr-only"
          />
          <label
            htmlFor={fileInputId}
            className="inline-flex w-fit cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-100"
          >
            {previewUrl ? "이미지 변경" : "이미지 선택"}
          </label>
          <p className="text-xs text-neutral-400">
            JPEG · PNG · 최대 2MB
          </p>
        </div>

        <span className={labelClass}>미리보기</span>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="relative py-2 w-full overflow-hidden flex flex-col gap-2 justify-center">
            <div className="relative aspect-[360/120] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="배너 미리보기"
                  fill
                  className="object-cover object-center"
                  sizes="360px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-sm text-neutral-400">
                  이미지를 선택하면 여기에 표시됩니다
                </div>
              )}
            </div>
            <p className="text-center text-md text-neutral-400 sm:text-left">
              ※ 실제 노출 화면과 해상도에 따라 다소 다를 수 있습니다
            </p>
          </div>

        </div>
      </div>

      <div className="flex justify-end border-t border-neutral-100 pt-4">
        {submitDisabled ? (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500">
            저장
          </span>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500/50"
          >
            저장
          </button>
        )}
      </div>
    </form>
  );
}
