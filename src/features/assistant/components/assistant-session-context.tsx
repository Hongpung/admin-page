"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AssistantSessionContextValue = {
  startNewSession: () => Promise<void>;
  isResetting: boolean;
};

const AssistantSessionContext = createContext<AssistantSessionContextValue | null>(
  null,
);

type AssistantSessionProviderProps = {
  children: ReactNode;
  onStartNewSession: () => Promise<void>;
};

export function AssistantSessionProvider({
  children,
  onStartNewSession,
}: AssistantSessionProviderProps) {
  const [isResetting, setIsResetting] = useState(false);

  const startNewSession = useCallback(async () => {
    if (isResetting) return;

    setIsResetting(true);
    try {
      await onStartNewSession();
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, onStartNewSession]);

  const value = useMemo(
    () => ({ startNewSession, isResetting }),
    [isResetting, startNewSession],
  );

  return (
    <AssistantSessionContext.Provider value={value}>
      {children}
    </AssistantSessionContext.Provider>
  );
}

export function useAssistantSession(): AssistantSessionContextValue {
  const context = useContext(AssistantSessionContext);
  if (!context) {
    throw new Error("useAssistantSession must be used within AssistantSessionProvider");
  }
  return context;
}
