"use client";

import "@assistant-ui/react-markdown/styles/dot.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { type FC, memo, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { TooltipIconButton } from "@admin/features/assistant/components/assistant-ui/tooltip-icon-button";
import { cn } from "@admin/shared/lib/cn";

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      className="aui-md text-sm"
      components={defaultComponents}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="mt-2 flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted px-3 py-1.5 text-xs">
      <span className="font-medium lowercase text-muted-foreground">
        {language}
      </span>
      <TooltipIconButton tooltip="복사" onClick={onCopy}>
        {!isCopied && <CopyIcon className="size-3.5" />}
        {isCopied && <CheckIcon className="size-3.5" />}
      </TooltipIconButton>
    </div>
  );
};

function useCopyToClipboard(copiedDuration = 3000) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (value: string) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    navigator.clipboard.writeText(value).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), copiedDuration);
      },
      () => {},
    );
  };

  return { isCopied, copyToClipboard };
}

const defaultComponents = memoizeMarkdownComponents({
  p: ({ className, ...props }) => (
    <p
      className={cn("my-2 leading-relaxed first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-2 ms-4 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-2 ms-4 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock &&
            "rounded border bg-muted px-1 py-0.5 font-mono text-[0.85em]",
          className,
        )}
        {...props}
      />
    );
  },
  CodeHeader,
});
