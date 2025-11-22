"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export const BANNER_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function formatMaxSizeLabel(maxBytes: number): string {
  const mb = maxBytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(0)}MB`;
  const kb = maxBytes / 1024;
  return `${Math.round(kb)}KB`;
}

type UseBannerModalImagePreviewOptions = {
  isOpen: boolean;
  maxBytes?: number;
  /** 수정 모달: 서버 이미지 URL. 생성 모달은 생략. */
  remotePreviewUrl?: string | null;
  /** `bannerId` 등 — 바뀌면 원격 미리보기로 다시 맞춤 */
  remoteKey?: string;
};

export function useBannerModalImagePreview({
  isOpen,
  maxBytes = BANNER_IMAGE_MAX_BYTES,
  remotePreviewUrl,
  remoteKey,
}: UseBannerModalImagePreviewOptions) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      revokeBlob();
      setPreviewUrl(null);
      return;
    }
    revokeBlob();
    setPreviewUrl(remotePreviewUrl ?? null);
  }, [isOpen, remoteKey, remotePreviewUrl, revokeBlob]);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > maxBytes) {
        alert(
          `파일 크기는 ${formatMaxSizeLabel(maxBytes)} 이하로 업로드해주세요.`
        );
        e.target.value = "";
        return;
      }
      revokeBlob();
      const url = URL.createObjectURL(file);
      blobRef.current = url;
      setPreviewUrl(url);
    },
    [maxBytes, revokeBlob]
  );

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  return { previewUrl, onFileChange };
}
