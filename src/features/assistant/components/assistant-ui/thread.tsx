"use client";

import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@admin/features/assistant/components/assistant-ui/attachment";
import { AssistantAnalysisDetails } from "@admin/features/assistant/components/assistant-ui/assistant-analysis-details";
import { MarkdownText } from "@admin/features/assistant/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@admin/features/assistant/components/assistant-ui/tooltip-icon-button";
import { Button } from "@admin/shared/components/ui/button";
import {
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BotIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";

type ThreadWelcomeContent = {
  badge: string;
  title: string;
  subtitle: string;
};

const WELCOME: ThreadWelcomeContent = {
  badge: "이미지 1장 · 일 20회",
  title: ASSISTANT_LABELS.welcomeTitle,
  subtitle: ASSISTANT_LABELS.welcomeSubtitle,
};

export const AssistantThread: FC = () => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-gray-900 text-white">
          <BotIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {ASSISTANT_LABELS.title}
          </p>
          <p className="text-xs text-gray-500">{ASSISTANT_LABELS.subtitle}</p>
        </div>
      </div>

      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth">
        <div className="mx-auto flex w-full max-w-[42rem] flex-1 flex-col px-4 pt-4">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <ThreadWelcome welcome={WELCOME} />
          </AuiIf>

          <div className="mb-10 flex flex-col gap-y-6 empty:hidden">
            <ThreadPrimitive.Messages>
              {() => <ThreadMessage />}
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-white pb-4 pt-2">
            <ThreadScrollToBottom />
            <Composer />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadWelcome: FC<{ welcome: ThreadWelcomeContent }> = ({ welcome }) => (
  <div className="my-auto flex grow flex-col justify-center py-8">
    <div className="mb-3 inline-flex w-fit items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
      {welcome.badge}
    </div>
    <h2 className="text-xl font-semibold text-gray-950">{welcome.title}</h2>
    <p className="mt-2 text-sm leading-6 text-gray-600">{welcome.subtitle}</p>
  </div>
);

const Composer: FC = () => (
  <ComposerPrimitive.Root className="relative flex w-full flex-col">
    <ComposerPrimitive.AttachmentDropzone asChild>
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200 data-[dragging=true]:border-dashed data-[dragging=true]:bg-gray-50">
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder={ASSISTANT_LABELS.composerPlaceholder}
          className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-gray-400"
          rows={1}
          aria-label={ASSISTANT_LABELS.composerInput}
        />
        <ComposerAction />
      </div>
    </ComposerPrimitive.AttachmentDropzone>
  </ComposerPrimitive.Root>
);

const ComposerAction: FC = () => (
  <div className="flex items-center justify-between">
    <ComposerAddAttachment label={ASSISTANT_LABELS.uploadButton} />
    <AuiIf condition={(s) => !s.thread.isRunning}>
      <ComposerPrimitive.Send asChild>
        <TooltipIconButton
          tooltip={ASSISTANT_LABELS.send}
          side="bottom"
          type="button"
          variant="default"
          size="icon"
          className="size-8 rounded-full bg-gray-900 text-white hover:bg-gray-800"
          aria-label={ASSISTANT_LABELS.send}
        >
          <ArrowUpIcon className="size-4" />
        </TooltipIconButton>
      </ComposerPrimitive.Send>
    </AuiIf>
    <AuiIf condition={(s) => s.thread.isRunning}>
      <ComposerPrimitive.Cancel asChild>
        <Button
          type="button"
          variant="default"
          size="icon"
          className="size-8 rounded-full"
          aria-label={ASSISTANT_LABELS.cancel}
        >
          <SquareIcon className="size-3 fill-current" />
        </Button>
      </ComposerPrimitive.Cancel>
    </AuiIf>
  </div>
);

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip={ASSISTANT_LABELS.scrollToBottom}
      variant="outline"
      className="absolute -top-12 z-10 self-center rounded-full disabled:invisible"
    >
      <ArrowDownIcon className="size-4" />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

const MessageError: FC = () => (
  <MessagePrimitive.Error>
    <ErrorPrimitive.Root className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <ErrorPrimitive.Message className="line-clamp-4" />
    </ErrorPrimitive.Root>
  </MessagePrimitive.Error>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root className="relative px-1" data-role="assistant">
    <div className="px-2 leading-relaxed text-gray-900">
      <MessagePrimitive.Parts
        components={{
          Text: MarkdownText,
        }}
      />
      <AssistantAnalysisDetails />
      <MessageError />
    </div>
  </MessagePrimitive.Root>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-1 [&:where(>*)]:col-start-2"
    data-role="user"
  >
    <UserMessageAttachments />
    <div className="col-start-2 min-w-0">
      <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-gray-900">
        <MessagePrimitive.Parts />
      </div>
    </div>
  </MessagePrimitive.Root>
);
