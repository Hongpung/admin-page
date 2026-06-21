"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  AssistantRuntimeProvider,
  SimpleImageAttachmentAdapter,
  useAuiEvent,
  useLocalRuntime,
  type Attachment,
  type AttachmentAdapter,
  type PendingAttachment,
} from "@assistant-ui/react";
import { AlertTriangleIcon } from "lucide-react";
import { isDashboardPath } from "@admin/app/dashboard-path";
import { AssistantModal } from "@admin/features/assistant/components/assistant-ui/assistant-modal";
import { AssistantThread } from "@admin/features/assistant/components/assistant-ui/thread";
import { AssistantThreadMessageSync } from "@admin/features/assistant/components/AssistantThreadMessageSync";
import { AssistantSessionProvider } from "@admin/features/assistant/components/assistant-session-context";
import {
  ASSISTANT_ATTACHMENT_LIMITS,
  ASSISTANT_LABELS,
} from "@admin/features/assistant/constants/assistant-labels";
import { createHongpungAssistantAdapter } from "@admin/features/assistant/lib/hongpung-assistant-adapter";
import {
  ensureAssistantBoot,
  getCachedAssistantBoot,
  startNewAssistantSession,
  type AssistantBootState,
} from "@admin/features/assistant/lib/assistant-runtime-cache";
import { setStoredAssistantRoomId } from "@admin/features/assistant/lib/assistant-session-storage";

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
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
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

function AssistantFabPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-auto fixed bottom-6 right-6 z-[101]">
      {children}
    </div>,
    document.body,
  );
}

function AiAssistantRuntimeLayer({ boot }: { boot: AssistantBootState }) {
  const roomIdRef = useRef<string>(boot.roomId);
  const getRoomId = useCallback(() => roomIdRef.current, []);
  const setRoomId = useCallback((roomId: string) => {
    roomIdRef.current = roomId;
    setStoredAssistantRoomId(roomId);
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
    initialMessages: boot.initialMessages,
    adapters: {
      attachments: attachmentAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantThreadMessageSync />
      <AttachmentErrorNotice />
      <AssistantFabPortal>
        <AiAssistantModalSlot />
      </AssistantFabPortal>
    </AssistantRuntimeProvider>
  );
}

/** 대시보드에 한 번 들어온 뒤에는 runtime을 언마운트하지 않는다. */
let assistantEverActivated = false;

function AssistantGlobalHostInner({ visible }: { visible: boolean }) {
  const [boot, setBoot] = useState<AssistantBootState | null>(() =>
    getCachedAssistantBoot(),
  );
  const [sessionKey, setSessionKey] = useState(0);

  const handleStartNewSession = useCallback(async () => {
    const nextBoot = await startNewAssistantSession();
    setBoot(nextBoot);
    setSessionKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (boot) return;

    let cancelled = false;
    void ensureAssistantBoot().then((nextBoot) => {
      if (!cancelled) {
        setBoot(nextBoot);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [boot]);

  if (!boot) {
    return null;
  }

  return (
    <div className={visible ? undefined : "hidden"} aria-hidden={!visible}>
      <AssistantSessionProvider onStartNewSession={handleStartNewSession}>
        <AiAssistantRuntimeLayer key={sessionKey} boot={boot} />
      </AssistantSessionProvider>
    </div>
  );
}

export function AssistantGlobalHost() {
  const pathname = usePathname() ?? "";
  const isDashboard = isDashboardPath(pathname);

  if (isDashboard) {
    assistantEverActivated = true;
  }

  if (!assistantEverActivated) {
    return null;
  }

  return <AssistantGlobalHostInner visible={isDashboard} />;
}
