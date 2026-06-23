import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import { evaluateDraftQueue } from "@admin/features/assistant/lib/assistant-action-queue";
import { extractBatchClubName } from "@admin/features/assistant/lib/extract-assistant-club-name";
import {
  getCurrentAssistantAction,
  normalizeAssistantActions,
  type AssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantDraft } from "@admin/features/assistant/types/assistant-draft.types";
import type { ClubLeaderInfo } from "@admin/features/assistant/types/club-leader.types";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeClubName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function collectClubLeaders(
  toolResults: AssistantToolResultEntry[],
): ClubLeaderInfo[] {
  const leaders: ClubLeaderInfo[] = [];

  for (const result of toolResults) {
    if (!result.ok || result.toolId !== "club_leaders_lookup") continue;

    const singleLeader = result.data?.leader;
    if (isPlainRecord(singleLeader)) {
      leaders.push(singleLeader as ClubLeaderInfo);
    }

    const leaderList = result.data?.leaders;
    if (Array.isArray(leaderList)) {
      leaders.push(...(leaderList as ClubLeaderInfo[]));
    }
  }

  return leaders;
}

function findClubLeader(
  leaders: ClubLeaderInfo[],
  clubName: string,
): ClubLeaderInfo | null {
  const normalized = normalizeClubName(clubName);
  if (!normalized) return null;

  return (
    leaders.find((leader) => normalizeClubName(leader.clubName) === normalized) ??
    leaders.find((leader) => normalizeClubName(leader.clubName).includes(normalized)) ??
    leaders.find((leader) => normalized.includes(normalizeClubName(leader.clubName))) ??
    null
  );
}


function enrichAction(
  action: AssistantAction,
  leaders: ClubLeaderInfo[],
): AssistantAction {
  if (action.type !== "RESERVATION_BATCH_CREATE") return action;
  const payload = isPlainRecord(action.payload) ? action.payload : {};
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};

  if (typeof option.creatorId === "number") return action;

  const clubName = extractBatchClubName(payload);
  if (!clubName) return action;

  const leader = findClubLeader(leaders, clubName);
  if (!leader) return action;

  const resolvedClubName = leader.clubName;

  return {
    ...action,
    payload: {
      ...payload,
      batchReservationOption: {
        ...option,
        clubName: resolvedClubName,
        title: `${resolvedClubName}의 정기 연습`,
        creatorId: leader.leaderMemberId,
        reservationType:
          option.reservationType === "EXTERNAL" ? option.reservationType : "REGULAR",
      },
    },
  };
}

export function enrichBatchCreatorsFromClubLeaders(
  analysis: AssistantAnalysis,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  const leaders = collectClubLeaders(toolResults);
  if (leaders.length === 0) return analysis;

  const actions = normalizeAssistantActions(analysis).map((action) =>
    enrichAction(action, leaders),
  );
  if (actions.length === 0) return analysis;

  return {
    ...analysis,
    action: getCurrentAssistantAction({ actions }) ?? actions[0],
    actions,
  };
}

export function enrichDraftWithClubLeaders(
  draft: AssistantDraft | null,
  toolResults: AssistantToolResultEntry[],
): AssistantDraft | null {
  if (!draft?.queue.length) return draft;

  const leaders = collectClubLeaders(toolResults);
  if (leaders.length === 0) return draft;

  const queue = draft.queue.map((item) => {
    if (item.type !== "RESERVATION_BATCH_CREATE") return item;

    const enriched = enrichAction(
      { type: item.type, payload: item.payload },
      leaders,
    );

    return {
      ...item,
      payload: isPlainRecord(enriched.payload)
        ? enriched.payload
        : item.payload,
    };
  });

  return evaluateDraftQueue({ ...draft, queue });
}
