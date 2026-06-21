"use client";

import { type FC, type PropsWithChildren, useEffect, useState } from "react";
import Image from "next/image";
import { FileText, PlusIcon, XIcon } from "lucide-react";
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import { useShallow } from "zustand/shallow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@admin/shared/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@admin/shared/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@admin/shared/components/ui/avatar";
import { TooltipIconButton } from "@admin/features/assistant/components/assistant-ui/tooltip-icon-button";
import { cn } from "@admin/shared/lib/cn";

function useFileSrc(file: File | undefined) {
  const [src, setSrc] = useState<string | undefined>();

  useEffect(() => {
    if (!file) {
      setSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return src;
}

function useAttachmentSrc() {
  const { file, src } = useAuiState(
    useShallow((s): { file?: File; src?: string } => {
      if (s.attachment.type !== "image") return {};
      if (s.attachment.file) return { file: s.attachment.file };
      const imageSrc = s.attachment.content?.find((c) => c.type === "image")?.image;
      if (!imageSrc) return {};
      return { src: imageSrc };
    }),
  );

  return useFileSrc(file) ?? src;
}

const AttachmentPreview: FC<{ src: string }> = ({ src }) => (
  <Image
    src={src}
    alt="첨부 이미지 미리보기"
    width={0}
    height={0}
    sizes="100vw"
    unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
    className="h-auto max-h-[80dvh] w-auto max-w-full object-contain"
    style={{ width: "auto", height: "auto" }}
  />
);

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();
  if (!src) return children;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        overlayClassName="z-[110]"
        className="z-[110] max-w-3xl p-2 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">이미지 미리보기</DialogTitle>
        <div className="mx-auto flex w-full items-center justify-center">
          <AttachmentPreview src={src} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC = () => {
  const src = useAttachmentSrc();
  return (
    <Avatar className="h-full w-full rounded-none">
      <AvatarImage src={src} alt="첨부 이미지" className="object-cover" />
      <AvatarFallback>
        <FileText className="size-8 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
};

const AttachmentUI: FC = () => {
  const aui = useAui();
  const isComposer = aui.attachment.source !== "message";
  const isImage = useAuiState((s) => s.attachment.type === "image");

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <AttachmentPrimitive.Root
          className={cn("relative", isImage && "only:*:first:size-24")}
        >
          <AttachmentPreviewDialog>
            <TooltipTrigger asChild>
              <div
                className="size-14 cursor-pointer overflow-hidden rounded-xl border bg-muted hover:opacity-75"
                role="button"
                tabIndex={0}
                aria-label="첨부 파일"
              >
                <AttachmentThumb />
              </div>
            </TooltipTrigger>
          </AttachmentPreviewDialog>
          {isComposer ? (
            <AttachmentPrimitive.Remove asChild>
              <TooltipIconButton
                tooltip="첨부 제거"
                className="absolute end-1.5 top-1.5 size-3.5 rounded-full bg-white shadow-sm"
                side="top"
              >
                <XIcon className="size-3" />
              </TooltipIconButton>
            </AttachmentPrimitive.Remove>
          ) : null}
        </AttachmentPrimitive.Root>
        <TooltipContent side="top">
          <AttachmentPrimitive.Name />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const UserMessageAttachments: FC = () => (
  <div className="col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2">
    <MessagePrimitive.Attachments>{() => <AttachmentUI />}</MessagePrimitive.Attachments>
  </div>
);

export const ComposerAttachments: FC = () => (
  <div className="flex w-full flex-row items-center gap-2 overflow-x-auto empty:hidden">
    <ComposerPrimitive.Attachments>{() => <AttachmentUI />}</ComposerPrimitive.Attachments>
  </div>
);

export const ComposerAddAttachment: FC<{ label: string }> = ({ label }) => (
  <ComposerPrimitive.AddAttachment asChild>
    <TooltipIconButton
      tooltip={label}
      side="bottom"
      variant="ghost"
      size="icon"
      className="size-8 rounded-full"
      aria-label={label}
    >
      <PlusIcon className="size-5" />
    </TooltipIconButton>
  </ComposerPrimitive.AddAttachment>
);
