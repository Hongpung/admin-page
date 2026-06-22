import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";
import {
  getCurrentAssistantAction,
  normalizeAssistantActions,
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isGenericBatchTitle(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return ["정기예약", "정기연습", "예약", "연습"].includes(normalizeText(value));
}

function isInvalidBatchTitle(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  return !trimmed || /\bundefined\b/i.test(trimmed);
}

function extractClubNameFromPracticeTitle(title: string): string | null {
  const match = title.match(/^(.+?)의\s*정기\s*연습$/);
  return match?.[1]?.trim() ?? null;
}

export function normalizeReservationBatchClubKey(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/의정기연습$/g, "")
    .replace(/정기예약생성$/g, "")
    .toLowerCase();
}

export function reservationBatchClubsLikelyMatch(
  left: string,
  right: string,
): boolean {
  const normalizedLeft = normalizeReservationBatchClubKey(left);
  const normalizedRight = normalizeReservationBatchClubKey(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function formatClubRegularPracticeTitle(clubName: string): string {
  return `${clubName}의 정기 연습`;
}

function asBatchDayTime(
  value: unknown,
): { day: string; startTime: string; endTime: string } | null {
  if (!isPlainRecord(value)) return null;
  const { day, startTime, endTime } = value;
  if (
    typeof day !== "string" ||
    typeof startTime !== "string" ||
    typeof endTime !== "string"
  ) {
    return null;
  }
  return { day, startTime, endTime };
}

function extractScheduleClubNameFromText(
  sourceText: string | undefined,
  dayTime: { day: string; startTime: string; endTime: string },
): string | null {
  if (!sourceText?.trim()) return null;

  const day = escapeRegExp(dayTime.day);
  const start = escapeRegExp(dayTime.startTime);
  const end = escapeRegExp(dayTime.endTime);
  const flatText = sourceText.replace(/\r?\n/g, " ");
  const patterns = [
    new RegExp(
      `${day}(?:\\s*요\\s*일)?\\s*[:：]\\s*(.+?)\\s*\\(\\s*${start}\\s*[~～-]\\s*${end}\\s*\\)`,
    ),
    new RegExp(
      `${day}(?:\\s*요\\s*일)?\\s*[:：]\\s*(.+?)\\s*,?\\s*${start}\\s*[~～-]\\s*${end}`,
    ),
    new RegExp(
      `(?:^|[\\s,])${day}(?:\\s*요\\s*일)?\\s+(.{1,80}?)\\s+${start}\\s*[~～-]\\s*${end}(?:\\s|,|$)`,
    ),
    new RegExp(
      `${day}(?:\\s*요\\s*일)\\s+(.{1,80}?)\\s+${start}\\s*[~～-]\\s*${end}`,
    ),
  ];

  for (const pattern of patterns) {
    const match = flatText.match(pattern);
    const clubName = match?.[1]?.replace(/,\s*$/, "").trim();
    if (
      clubName &&
      !/홍풍\s*어플|예약\s*후\s*사용/.test(clubName)
    ) {
      return clubName;
    }
  }

  return null;
}

function getBatchDayTimes(
  payload: Record<string, unknown>,
): Array<{ day: string; startTime: string; endTime: string }> {
  if (!Array.isArray(payload.dayTimes)) return [];
  return payload.dayTimes
    .map(asBatchDayTime)
    .filter((item): item is { day: string; startTime: string; endTime: string } =>
      item !== null,
    );
}

export function resolveReservationBatchClubKey(
  payload: Record<string, unknown>,
  sourceText?: string,
): string | null {
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};

  if (typeof option.clubName === "string" && option.clubName.trim()) {
    return normalizeReservationBatchClubKey(option.clubName);
  }

  if (typeof option.title === "string" && !isInvalidBatchTitle(option.title)) {
    const fromTitle = extractClubNameFromPracticeTitle(option.title.trim());
    if (fromTitle) {
      return normalizeReservationBatchClubKey(fromTitle);
    }
    if (!isGenericBatchTitle(option.title)) {
      return normalizeReservationBatchClubKey(option.title);
    }
  }

  const dayTimes = getBatchDayTimes(payload);
  if (dayTimes.length > 0 && sourceText) {
    const clubNames = dayTimes
      .map((dayTime) => extractScheduleClubNameFromText(sourceText, dayTime))
      .filter((clubName): clubName is string => Boolean(clubName));
    const uniqueClubKeys = Array.from(
      new Set(clubNames.map((clubName) => normalizeReservationBatchClubKey(clubName))),
    );
    if (uniqueClubKeys.length === 1) {
      return uniqueClubKeys[0]!;
    }
    if (dayTimes.length === 1 && clubNames[0]) {
      return normalizeReservationBatchClubKey(clubNames[0]);
    }
  }

  return null;
}

function mergeActionPayload(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (
      key === "dayTimes" &&
      Array.isArray(value) &&
      Array.isArray(next[key])
    ) {
      const merged = [...(next[key] as unknown[])];
      for (const item of value) {
        const dayTime = asBatchDayTime(item);
        if (!dayTime) continue;
        const exists = merged.some((existing) => {
          const currentDayTime = asBatchDayTime(existing);
          return (
            currentDayTime?.day === dayTime.day &&
            currentDayTime.startTime === dayTime.startTime &&
            currentDayTime.endTime === dayTime.endTime
          );
        });
        if (!exists) merged.push(item);
      }
      next[key] = merged;
      continue;
    }

    if (isPlainRecord(value) && isPlainRecord(next[key])) {
      next[key] = mergeActionPayload(
        next[key] as Record<string, unknown>,
        value,
      );
      continue;
    }

    if (value !== undefined) {
      next[key] = value;
    }
  }

  return next;
}

function consolidateReservationBatchActions(
  actions: AssistantAction[],
  sourceText?: string,
): AssistantAction[] {
  const others: AssistantAction[] = [];
  const batchActions: AssistantAction[] = [];

  for (const action of actions) {
    if (action.type === "RESERVATION_BATCH_CREATE") {
      batchActions.push(action);
    } else {
      others.push(action);
    }
  }

  if (batchActions.length <= 1) {
    return actions;
  }

  const groups: Array<{ key: string; actions: AssistantAction[] }> = [];

  for (const action of batchActions) {
    const payload = isPlainRecord(action.payload) ? action.payload : {};
    const clubKey = resolveReservationBatchClubKey(payload, sourceText);
    const dayTimes = getBatchDayTimes(payload);

    let target = clubKey
      ? groups.find((group) =>
          reservationBatchClubsLikelyMatch(group.key, clubKey),
        )
      : undefined;

    if (!target) {
      target = {
        key: clubKey ?? `__day_${dayTimes[0]?.day ?? groups.length}`,
        actions: [],
      };
      groups.push(target);
    }

    target.actions.push(action);
  }

  const consolidated = groups.map((group) => {
    if (group.actions.length === 1) {
      return group.actions[0]!;
    }

    let merged = group.actions[0]!;
    for (let index = 1; index < group.actions.length; index += 1) {
      const patchSource = group.actions[index]!;
      const currentPayload = isPlainRecord(merged.payload) ? merged.payload : {};
      const patchPayload = isPlainRecord(patchSource.payload)
        ? patchSource.payload
        : {};
      merged = {
        ...merged,
        id: merged.id ?? patchSource.id,
        payload: mergeActionPayload(currentPayload, patchPayload),
      };
    }

    return merged;
  });

  return [...others, ...consolidated];
}

function splitReservationBatchAction(
  action: AssistantAction,
  sourceText?: string,
): AssistantAction[] | null {
  if (action.type !== "RESERVATION_BATCH_CREATE") return null;
  const payload = isPlainRecord(action.payload) ? action.payload : {};
  const dayTimes = Array.isArray(payload.dayTimes)
    ? payload.dayTimes.map(asBatchDayTime).filter((item) => item !== null)
    : [];

  if (dayTimes.length <= 1) return null;

  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};
  const rowClubNames = dayTimes.map((dayTime) =>
    extractScheduleClubNameFromText(sourceText, dayTime),
  );
  if (rowClubNames.some((clubName) => !clubName)) return null;

  const uniqueClubNames = Array.from(
    new Set(rowClubNames.map((clubName) => normalizeText(clubName ?? ""))),
  );

  if (uniqueClubNames.length <= 1) {
    const clubName = rowClubNames[0];
    if (!clubName) return null;

    const nextOption = { ...option };

    if (isGenericBatchTitle(nextOption.title)) {
      nextOption.title = formatClubRegularPracticeTitle(clubName);
    }
    if (typeof nextOption.clubName !== "string" || !nextOption.clubName.trim()) {
      nextOption.clubName = clubName;
    }

    return [
      {
        ...action,
        payload: {
          ...payload,
          batchReservationOption: nextOption,
        },
      },
    ];
  }

  return dayTimes.map((dayTime, index) => {
    const clubName = rowClubNames[index] ?? "";

    return {
      ...action,
      payload: {
        ...payload,
        dayTimes: [dayTime],
        batchReservationOption: {
          ...option,
          title: formatClubRegularPracticeTitle(clubName),
          clubName,
        },
      },
    };
  });
}

export function expandAssistantActions(
  actions: AssistantAction[],
  sourceText?: string,
): AssistantAction[] {
  const expanded: AssistantAction[] = [];

  for (const action of actions) {
    const splitBatchActions = splitReservationBatchAction(action, sourceText);
    if (splitBatchActions) {
      expanded.push(...splitBatchActions);
      continue;
    }

    if (action.type === "CREATE_RESERVATIONS_MULTI") {
      const payload = action.payload;
      const reservations = isPlainRecord(payload)
        ? payload.reservations
        : undefined;

      if (Array.isArray(reservations) && reservations.length > 0) {
        for (const item of reservations) {
          if (!isPlainRecord(item)) continue;
          expanded.push({
            type: "CREATE_RESERVATION",
            payload: item,
          });
        }
        continue;
      }
    }

    expanded.push(action);
  }

  return consolidateReservationBatchActions(expanded, sourceText);
}

export function expandAssistantActionsInAnalysis(
  analysis: AssistantAnalysis,
): AssistantAnalysis {
  const actions = expandAssistantActions(
    normalizeAssistantActions(analysis),
    analysis.detected_text,
  );
  if (actions.length === 0) {
    return analysis;
  }

  return syncPrimaryAssistantAction({
    ...analysis,
    actions,
    action: getCurrentAssistantAction({ actions }) ?? actions[0],
  });
}
