import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

export type AssistantStreamStatusEvent = {
  type: "status";
  message: string;
};

export type AssistantStreamTextEvent = {
  type: "text";
  text: string;
};

export type AssistantStreamDoneEvent = {
  type: "done";
  analysis: AssistantAnalysis;
  roomId: string;
  usage?: AssistantAnalysis["usage"];
};

export type AssistantStreamErrorEvent = {
  type: "error";
  message: string;
  status?: number;
};

export type AssistantStreamEvent =
  | AssistantStreamStatusEvent
  | AssistantStreamTextEvent
  | AssistantStreamDoneEvent
  | AssistantStreamErrorEvent;

export type AssistantAnalyzeProgressEvent =
  | { type: "status"; message: string }
  | { type: "text"; text: string };

export type AssistantAnalyzeProgressHandler = (
  event: AssistantAnalyzeProgressEvent,
) => void;

export function encodeAssistantStreamEvent(event: AssistantStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}
