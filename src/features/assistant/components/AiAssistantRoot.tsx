"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  SimpleImageAttachmentAdapter,
  useAuiEvent,
  useLocalRuntime,
  type Attachment,
  type AttachmentAdapter,
  type PendingAttachment,
} from "@assistant-ui/react";
import { AlertCircleIcon } from "lucide-react";
import { AssistantModal } from "@admin/features/assistant/components/assistant-ui/assistant-modal";
import { AssistantThread } from "@admin/features/assistant/components/assistant-ui/thread";
import {
  ASSISTANT_ATTACHMENT_LIMITS,
  ASSISTANT_LABELS,
} from "@admin/features/assistant/constants/assistant-labels";
import { createHongpungAssistantAdapter } from "@admin/features/assistant/lib/hongpung-assistant-adapter";
import { ensureAssistantRoom } from "@admin/features/assistant/lib/assistant-room";
import {
  FabDockPortal,
  FabDockProvider,
} from "@admin/shared/components/FabDock";

class SizeLimitedAttachmentAdapter implements AttachmentAdapter {
  accept: string;

  constructor(
    private readonly adapter: AttachmentAdapter,
    private readonly maxSizeBytes: number,
  ) {
    this.accept = adapter.accept;
  }

  add(state: { file: File }) {
    if (state.file.size > this.maxSizeBytes) {
      throw new Error(
        `이미지는 ${ASSISTANT_ATTACHMENT_LIMITS.maxSizeMb}MB 이하여야 합니다.`,
      );
    }
    return this.adapter.add(state);
  }

  send(attachment: PendingAttachment) {
    return this.adapter.send(attachment);
  }

  remove(attachment: Attachment) {
    return this.adapter.remove(attachment);
  }
}

function AttachmentErrorNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useAuiEvent("composer.attachmentAddError", ({ reason, message: detail }) => {
    if (reason === "not-accepted") {
      setMessage("PNG, JPG, WebP 이미지만 첨부할 수 있습니다.");
    } else {
      setMessage(detail || "첨부 파일을 추가하지 못했습니다.");
    }
    window.setTimeout(() => setMessage(null), 4500);
  });

  if (!message) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[102] flex max-w-sm items-start gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800 shadow-lg">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function AiAssistantModalSlot() {
  return (
    <AssistantModal
      triggerLabel={ASSISTANT_LABELS.modalTrigger}
      closeLabel={ASSISTANT_LABELS.modalClose}
    >
      <AssistantThread />
    </AssistantModal>
  );
}

function AiAssistantRuntime({ children }: { children: ReactNode }) {
  const roomIdRef = useRef<string | null>(null);
  const getRoomId = useCallback(() => roomIdRef.current, []);
  const setRoomId = useCallback((roomId: string) => {
    roomIdRef.current = roomId;
  }, []);

  const attachmentAdapter = useMemo(() => {
    const imageAdapter = new SimpleImageAttachmentAdapter();
    return new SizeLimitedAttachmentAdapter(
      imageAdapter,
      ASSISTANT_ATTACHMENT_LIMITS.maxSizeMb * 1024 * 1024,
    );
  }, []);

  const adapter = useMemo(
    () => createHongpungAssistantAdapter({ getRoomId, setRoomId }),
    [getRoomId, setRoomId],
  );

  const runtime = useLocalRuntime(adapter, {
    adapters: {
      attachments: attachmentAdapter,
    },
  });

  useEffect(() => {
    void ensureAssistantRoom({ getRoomId, setRoomId });
  }, [getRoomId, setRoomId]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AttachmentErrorNotice />
      {children}
    </AssistantRuntimeProvider>
  );
}

export function AiAssistantRoot({ children }: { children: ReactNode }) {
  return (
    <AiAssistantRuntime>
      <FabDockProvider>
        {children}
        <FabDockPortal assistantSlot={<AiAssistantModalSlot />} />
      </FabDockProvider>
    </AiAssistantRuntime>
  );
}
