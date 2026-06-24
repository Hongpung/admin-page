"use client";

import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import {
  buildPatchFromFormValues,
  getValueAtPath,
} from "@admin/features/assistant/lib/assistant-draft-patch";
import {
  buildAssistantEditFieldConfigs,
  buildAssistantInputFieldConfigs,
} from "@admin/features/assistant/lib/assistant-input-field-config";
import { isEmptyInputFieldValue } from "@admin/features/assistant/lib/prefill-message-utils";
import {
  buildInputCardContextConfig,
  formatActionInputContextLine,
} from "@admin/features/assistant/lib/format-assistant-action-input-context";
import { mapCreatorIdPathToCreatorNamePath } from "@admin/features/assistant/lib/format-assistant-missing-fields";
import { resolveAssistantAction } from "@admin/features/assistant/lib/resolve-assistant-action";
import {
  getCurrentAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import { Button } from "@admin/shared/components/ui/button";
import { cn } from "@admin/shared/lib/cn";
import { ClipboardListIcon, Loader2Icon } from "lucide-react";
import { type FC, useEffect, useMemo, useState } from "react";

import { AssistantInputFieldControl } from "./field-control";
import { formatInitialValue, parseFieldValue } from "./helpers";
import { patchAssistantDraftState } from "./patch-assistant-draft-state";

type AssistantInputCardProps = {
  analysis: AssistantAnalysis;
  roomId: string | null;
  mode?: "missing" | "edit";
  onUpdated: (analysis: AssistantAnalysis) => void;
};

export const AssistantInputCard: FC<AssistantInputCardProps> = ({
  analysis,
  roomId,
  mode = "missing",
  onUpdated,
}) => {
  const actionState = resolveAssistantAction(analysis);
  const action = getCurrentAssistantAction(analysis);
  const items = action?.missing_field_items ?? [];
  const payload = (action?.payload ?? {}) as Record<string, unknown>;
  const actionType = action?.type;
  const queueProgress =
    actionState.kind === "need_input" ? actionState.queueProgress : undefined;

  const targetContextLine = useMemo(
    () => formatActionInputContextLine(actionType, payload, queueProgress),
    [actionType, payload, queueProgress],
  );

  const fieldConfigs = useMemo(() => {
    if (mode === "edit") {
      return buildAssistantEditFieldConfigs(actionType);
    }

    const gapPaths = new Set(
      items.map((item) => mapCreatorIdPathToCreatorNamePath(item.path)),
    );
    const configs = buildAssistantInputFieldConfigs(items, actionType);
    const filtered =
      mode === "missing"
        ? configs.filter(
            (config) =>
              config.widget === "info" || gapPaths.has(config.path),
          )
        : configs.filter((config) => {
            if (config.widget === "info") return true;
            if (gapPaths.has(config.path)) return true;
            const value = getValueAtPath(payload, config.path);
            return isEmptyInputFieldValue(value);
          });

    const contextConfig = buildInputCardContextConfig(
      payload,
      queueProgress,
      items,
      actionType,
    );

    if (!contextConfig) {
      return filtered;
    }

    return [contextConfig, ...filtered];
  }, [items, actionType, payload, mode, queueProgress]);

  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const config of fieldConfigs) {
      if (config.widget === "info") continue;
      values[config.path] = formatInitialValue(
        config,
        getValueAtPath(payload, config.path),
      );
    }
    return values;
  }, [fieldConfigs, payload]);

  const [formValues, setFormValues] =
    useState<Record<string, string>>(initialValues);
  const [status, setStatus] = useState<"pending" | "submitting">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  if (fieldConfigs.length === 0) {
    return null;
  }

  const handleSubmit = async () => {
    if (!roomId) {
      setErrorMessage(ASSISTANT_LABELS.inputRoomMissing);
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const entries = fieldConfigs
        .filter((config) => config.widget !== "info")
        .map((config) => ({
          path: config.path,
          value: parseFieldValue(config, formValues[config.path] ?? ""),
        }))
        .filter((entry) => entry.value !== undefined);

      if (entries.length === 0) {
        setErrorMessage(ASSISTANT_LABELS.inputEmpty);
        setStatus("pending");
        return;
      }

      const patch = buildPatchFromFormValues(entries);
      const nextAnalysis = await patchAssistantDraftState({
        roomId,
        patch,
        analysis,
        actionId: action?.id,
      });

      onUpdated(nextAnalysis);
      const nextState = resolveAssistantAction(nextAnalysis);
      if (nextState.kind === "need_input") {
        setStatus("pending");
      }
    } catch (error) {
      setStatus("pending");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : ASSISTANT_LABELS.inputSubmitFailed,
      );
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-blue-700" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {mode === "edit"
                ? ASSISTANT_LABELS.actionEditPayload
                : ASSISTANT_LABELS.inputCardTitle}
            </p>
            {targetContextLine ? (
              <p className="mt-2 rounded-md border border-blue-100 bg-blue-50/80 px-2.5 py-2 text-sm leading-snug text-gray-900">
                <span className="text-xs font-medium text-blue-800">
                  {ASSISTANT_LABELS.inputCardTargetLabel}
                </span>{" "}
                {targetContextLine}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-gray-600">
              {mode === "edit"
                ? "수정 후 다시 실행할 수 있습니다."
                : ASSISTANT_LABELS.inputCardDescription}
            </p>
          </div>

          <div className="space-y-3">
            {fieldConfigs.map((config) => (
              <label
                key={config.path}
                className={cn(
                  "block",
                  config.widget === "info" ? "space-y-0" : "space-y-1.5",
                )}
              >
                {config.widget !== "info" ? (
                  <span className="text-xs font-medium text-gray-800">
                    {config.label}
                    <span className="ml-1 font-normal text-gray-500">
                      [{config.path}]
                    </span>
                  </span>
                ) : null}
                {config.message && config.widget !== "info" ? (
                  <span className="block text-[11px] text-gray-500">
                    {config.message}
                  </span>
                ) : null}
                <AssistantInputFieldControl
                  config={config}
                  value={formValues[config.path] ?? ""}
                  onChange={(value) =>
                    setFormValues((current) => ({
                      ...current,
                      [config.path]: value,
                    }))
                  }
                />
              </label>
            ))}
          </div>

          {errorMessage ? (
            <p className="text-xs text-red-700">{errorMessage}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={status === "submitting"}
              onClick={() => void handleSubmit()}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              {status === "submitting" ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  {ASSISTANT_LABELS.inputSubmitting}
                </>
              ) : (
                ASSISTANT_LABELS.inputSubmit
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
