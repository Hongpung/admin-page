import type { ThreadMessageLike } from "@assistant-ui/react";
import { loadAssistantInitialThread } from "@admin/features/assistant/lib/load-assistant-initial-thread";
import { ensureAssistantRoom } from "@admin/features/assistant/lib/assistant-room";
import {
  clearStoredAssistantAnalysis,
  clearStoredAssistantRoomId,
  clearStoredAssistantThreadMessages,
  getStoredAssistantRoomId,
  getStoredAssistantThreadMessages,
  setStoredAssistantRoomId,
  setStoredAssistantThreadMessages,
} from "@admin/features/assistant/lib/assistant-session-storage";

export type AssistantBootState = {
  roomId: string;
  initialMessages: ThreadMessageLike[];
};

let cachedBoot: AssistantBootState | null = null;
let bootPromise: Promise<AssistantBootState> | null = null;
let liveThreadMessages: ThreadMessageLike[] | null = null;

export function getCachedAssistantBoot(): AssistantBootState | null {
  return cachedBoot;
}

export function getLiveAssistantThreadMessages(): ThreadMessageLike[] | null {
  return liveThreadMessages;
}

export function setLiveAssistantThreadMessages(
  messages: readonly ThreadMessageLike[],
): void {
  liveThreadMessages = [...messages];
  if (cachedBoot) {
    cachedBoot = {
      ...cachedBoot,
      initialMessages: liveThreadMessages,
    };
    setStoredAssistantThreadMessages(cachedBoot.roomId, liveThreadMessages);
  }
}

function pickInitialMessages(
  roomId: string,
  serverMessages: ThreadMessageLike[],
): ThreadMessageLike[] {
  const candidates = [
    liveThreadMessages,
    getStoredAssistantThreadMessages(roomId),
    serverMessages,
  ].filter((messages): messages is ThreadMessageLike[] =>
    Boolean(messages?.length),
  );

  if (candidates.length === 0) {
    return [];
  }

  return candidates.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );
}

export function clearAssistantRuntimeCache(): void {
  cachedBoot = null;
  liveThreadMessages = null;
  bootPromise = null;
}

export async function startNewAssistantSession(): Promise<AssistantBootState> {
  const previousRoomId =
    cachedBoot?.roomId ?? getStoredAssistantRoomId();

  clearAssistantRuntimeCache();

  if (previousRoomId) {
    clearStoredAssistantAnalysis(previousRoomId);
    clearStoredAssistantThreadMessages(previousRoomId);
  }
  clearStoredAssistantRoomId();

  const roomIdRef = { current: null as string | null };
  const roomId = await ensureAssistantRoom({
    getRoomId: () => roomIdRef.current,
    setRoomId: (nextRoomId) => {
      roomIdRef.current = nextRoomId;
      setStoredAssistantRoomId(nextRoomId);
    },
  });

  const boot: AssistantBootState = { roomId, initialMessages: [] };
  cachedBoot = boot;
  liveThreadMessages = [];
  setStoredAssistantThreadMessages(roomId, []);
  return boot;
}

async function hydrateAssistantBoot(): Promise<AssistantBootState> {
  const storedRoomId = getStoredAssistantRoomId();
  const roomIdRef = { current: storedRoomId };

  const roomId = await ensureAssistantRoom({
    getRoomId: () => roomIdRef.current,
    setRoomId: (nextRoomId) => {
      roomIdRef.current = nextRoomId;
      setStoredAssistantRoomId(nextRoomId);
    },
  });

  const serverMessages = await loadAssistantInitialThread(roomId);
  const initialMessages = pickInitialMessages(roomId, serverMessages);

  const boot = { roomId, initialMessages };
  cachedBoot = boot;
  liveThreadMessages = initialMessages;
  setStoredAssistantThreadMessages(roomId, initialMessages);
  return boot;
}

export function ensureAssistantBoot(): Promise<AssistantBootState> {
  if (cachedBoot) {
    return Promise.resolve(cachedBoot);
  }

  if (!bootPromise) {
    bootPromise = hydrateAssistantBoot().finally(() => {
      bootPromise = null;
    });
  }

  return bootPromise;
}
