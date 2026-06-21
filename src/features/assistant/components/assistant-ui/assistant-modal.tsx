"use client";

import { AssistantModalPrimitive, useAuiState } from "@assistant-ui/react";
import { BotIcon, ChevronDownIcon } from "lucide-react";
import {
  type FC,
  forwardRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { TooltipIconButton } from "@admin/features/assistant/components/assistant-ui/tooltip-icon-button";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";

type AssistantModalProps = {
  triggerLabel: string;
  closeLabel: string;
  children: ReactNode;
};

export const AssistantModal: FC<AssistantModalProps> = ({
  triggerLabel,
  closeLabel,
  children,
}) => {
  return (
    <AssistantModalPrimitive.Root>
      <AssistantModalPrimitive.Anchor className="size-12 shrink-0">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton
            triggerLabel={triggerLabel}
            closeLabel={closeLabel}
          />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        side="top"
        align="end"
        sideOffset={12}
        collisionPadding={16}
        className="z-[101] flex h-[min(520px,58dvh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-0 shadow-xl outline-none duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        {children}
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type AssistantModalButtonProps = {
  "data-state"?: "open" | "closed";
  triggerLabel: string;
  closeLabel: string;
};

const AssistantModalButton = forwardRef<
  HTMLButtonElement,
  AssistantModalButtonProps
>(({ "data-state": state, triggerLabel, closeLabel, ...rest }, ref) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const wasRunningRef = useRef(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (wasRunningRef.current && !isRunning && state === "closed") {
      setHasUnread(true);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, state]);

  useEffect(() => {
    if (state === "open") {
      setHasUnread(false);
    }
  }, [state]);

  const showUnreadBadge = hasUnread && state === "closed";
  const tooltip =
    state === "open"
      ? closeLabel
      : showUnreadBadge
        ? `${triggerLabel} · ${ASSISTANT_LABELS.modalUnread}`
        : triggerLabel;

  return (
    <TooltipIconButton
      variant="default"
      tooltip={tooltip}
      side="left"
      {...rest}
      className="relative size-full rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800"
      ref={ref}
    >
      {state === "open" ? (
        <ChevronDownIcon className="size-6" />
      ) : (
        <BotIcon className="size-6" />
      )}
      {showUnreadBadge ? (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-gray-900"
        />
      ) : null}
    </TooltipIconButton>
  );
});

AssistantModalButton.displayName = "AssistantModalButton";
