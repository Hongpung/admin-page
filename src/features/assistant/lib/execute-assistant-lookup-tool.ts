import "server-only";

import {
  getAssistantLookupToolDefinition,
  validateAssistantLookupToolArgs,
} from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import { getWeekRangeKst } from "@admin/features/assistant/lib/assistant-date-range";
import {
  fetchAssistantDailyReservations,
  fetchAssistantTermReservations,
} from "@admin/features/assistant/lib/fetch-assistant-reservations";
import {
  fetchAssistantBannersList,
  fetchAssistantNoticesList,
} from "@admin/features/assistant/lib/fetch-assistant-manage-lists";
import { fetchAssistantMemberSearch } from "@admin/features/assistant/lib/fetch-assistant-members";
import {
  findClubLeader,
  loadClubLeaders,
} from "@admin/features/assistant/lib/load-club-leaders";
import type { ClubLeaderInfo } from "@admin/features/assistant/types/club-leader.types";
import type { AssistantLookupToolId } from "@admin/features/assistant/types/assistant-tool.types";

export type AssistantLookupToolResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

async function executeClubLeadersLookup(
  token: string,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  const leaders = await loadClubLeaders(token);
  const clubName =
    typeof args.clubName === "string" ? args.clubName.trim() : undefined;

  if (clubName) {
    const leader = findClubLeader(leaders, clubName);
    if (!leader) {
      return {
        ok: false,
        message: `"${clubName}" 동아리의 패짱 정보를 찾을 수 없습니다.`,
      };
    }

    return {
      ok: true,
      message: "동아리 패짱 정보를 조회했습니다.",
      data: { leader },
    };
  }

  return {
    ok: true,
    message: "동아리 패짱 목록을 조회했습니다.",
    data: { leaders } satisfies { leaders: ClubLeaderInfo[] },
  };
}

async function executeReservationsByDateLookup(
  token: string,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  const date = typeof args.date === "string" ? args.date : "";
  const reservations = await fetchAssistantDailyReservations(token, date);

  return {
    ok: true,
    message: `${date} 예약 ${reservations.length}건을 조회했습니다.`,
    data: { date, reservations, totalCount: reservations.length },
  };
}

async function executeReservationsByWeekLookup(
  token: string,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  const weekOffset =
    typeof args.weekOffset === "number" && Number.isInteger(args.weekOffset)
      ? args.weekOffset
      : 0;
  const { startDate, endDate } = getWeekRangeKst(weekOffset);
  const reservations = await fetchAssistantTermReservations(
    token,
    startDate,
    endDate,
  );

  const weekLabel =
    weekOffset === 0
      ? "이번 주"
      : weekOffset === 1
        ? "다음 주"
        : weekOffset === -1
          ? "지난 주"
          : `${weekOffset}주`;

  return {
    ok: true,
    message: `${weekLabel}(${startDate}~${endDate}) 예약 ${reservations.length}건을 조회했습니다.`,
    data: {
      weekOffset,
      startDate,
      endDate,
      reservations,
      totalCount: reservations.length,
    },
  };
}

async function executeReservationsByTermLookup(
  token: string,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  const startDate = typeof args.startDate === "string" ? args.startDate : "";
  const endDate = typeof args.endDate === "string" ? args.endDate : "";
  const reservations = await fetchAssistantTermReservations(
    token,
    startDate,
    endDate,
  );

  return {
    ok: true,
    message: `${startDate}~${endDate} 예약 ${reservations.length}건을 조회했습니다.`,
    data: {
      startDate,
      endDate,
      reservations,
      totalCount: reservations.length,
    },
  };
}

async function executeNoticesListLookup(
  token: string,
): Promise<AssistantLookupToolResult> {
  const notices = await fetchAssistantNoticesList(token);
  return {
    ok: true,
    message: `공지 ${notices.length}건을 조회했습니다.`,
    data: { notices, totalCount: notices.length },
  };
}

async function executeBannersListLookup(
  token: string,
): Promise<AssistantLookupToolResult> {
  const banners = await fetchAssistantBannersList(token);
  return {
    ok: true,
    message: `배너 ${banners.length}건을 조회했습니다.`,
    data: { banners, totalCount: banners.length },
  };
}

async function executeMembersSearchLookup(
  token: string,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  const username =
    typeof args.username === "string" ? args.username.trim() : undefined;
  const clubId =
    typeof args.clubId === "number" && Number.isInteger(args.clubId)
      ? args.clubId
      : undefined;
  const role = typeof args.role === "string" ? args.role.trim() : undefined;
  const page =
    typeof args.page === "number" && Number.isInteger(args.page) && args.page >= 0
      ? args.page
      : 0;
  const pageSize =
    args.pageSize === 20 || args.pageSize === 40 || args.pageSize === 80
      ? args.pageSize
      : 20;

  const result = await fetchAssistantMemberSearch(token, {
    username,
    clubId,
    role,
    page,
    pageSize,
  });

  const filterParts = [
    username ? `이름 "${username}"` : null,
    clubId !== undefined ? `clubId ${clubId}` : null,
    role ? `역할 "${role}"` : null,
  ].filter(Boolean);

  const filterLabel =
    filterParts.length > 0 ? filterParts.join(", ") : "전체 조건";

  return {
    ok: true,
    message: `${filterLabel} 회원 ${result.members.length}명을 조회했습니다. (전체 ${result.totalCount}명)`,
    data: {
      username,
      clubId,
      role,
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      members: result.members,
    },
  };
}

async function executeLookupHandler(
  token: string,
  toolId: AssistantLookupToolId,
  args: Record<string, unknown>,
): Promise<AssistantLookupToolResult> {
  switch (toolId) {
    case "club_leaders_lookup":
      return executeClubLeadersLookup(token, args);
    case "reservations_by_date_lookup":
      return executeReservationsByDateLookup(token, args);
    case "reservations_by_term_lookup":
      return executeReservationsByTermLookup(token, args);
    case "reservations_by_week_lookup":
      return executeReservationsByWeekLookup(token, args);
    case "notices_list_lookup":
      return executeNoticesListLookup(token);
    case "banners_list_lookup":
      return executeBannersListLookup(token);
    case "members_search_lookup":
      return executeMembersSearchLookup(token, args);
    default:
      return { ok: false, message: "지원하지 않는 조회 도구입니다." };
  }
}

export async function executeAssistantLookupTool(
  token: string,
  toolId: string,
  args: unknown = {},
): Promise<AssistantLookupToolResult> {
  const definition = getAssistantLookupToolDefinition(toolId);
  if (!definition) {
    return { ok: false, message: "알 수 없는 조회 도구입니다." };
  }

  const validated = validateAssistantLookupToolArgs(definition.id, args);
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  return executeLookupHandler(token, definition.id, validated.data);
}
