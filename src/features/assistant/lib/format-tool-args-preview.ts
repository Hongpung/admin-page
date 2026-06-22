import type { AssistantToolId } from "@admin/features/assistant/types/assistant-tool.types";

const WEEKDAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatDayTimes(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const lines = value
    .filter(isRecord)
    .map((item) => {
      const day = typeof item.day === "string" ? item.day : "?";
      const startTime =
        typeof item.startTime === "string" ? item.startTime : "??:??";
      const endTime = typeof item.endTime === "string" ? item.endTime : "??:??";
      return `${day} ${startTime}~${endTime}`;
    })
    .sort((a, b) => {
      const dayA = a.split(" ")[0] ?? "";
      const dayB = b.split(" ")[0] ?? "";
      return WEEKDAY_ORDER.indexOf(dayA as (typeof WEEKDAY_ORDER)[number]) -
        WEEKDAY_ORDER.indexOf(dayB as (typeof WEEKDAY_ORDER)[number]);
    });

  return lines.length > 0 ? lines.join("\n") : null;
}

function formatDuration(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const startDate =
    typeof value.startDate === "string" ? value.startDate : null;
  const endDate = typeof value.endDate === "string" ? value.endDate : null;
  if (!startDate || !endDate) return null;
  return `${startDate} ~ ${endDate}`;
}

function formatBatchOption(value: unknown): string | null {
  if (!isRecord(value)) return null;

  const title = typeof value.title === "string" ? value.title : null;
  const reservationType =
    typeof value.reservationType === "string" ? value.reservationType : null;

  const lines: string[] = [];
  if (title) lines.push(`연습: ${title}`);
  if (reservationType) lines.push(`유형: ${reservationType}`);

  if (reservationType === "EXTERNAL") {
    const creatorName =
      typeof value.creatorName === "string" ? value.creatorName : null;
    if (creatorName) lines.push(`외부 예약자: ${creatorName}`);
  } else if (typeof value.creatorId === "number") {
    lines.push(`예약자 ID: ${value.creatorId}`);
  }

  return lines.length > 0 ? lines.join("\n") : null;
}

function formatForceCreateArgs(args: Record<string, unknown>): string {
  const lines: string[] = [];
  if (typeof args.title === "string") lines.push(`연습: ${args.title}`);
  if (typeof args.date === "string") lines.push(`날짜: ${args.date}`);
  if (typeof args.startTime === "string" && typeof args.endTime === "string") {
    lines.push(`시간: ${args.startTime}~${args.endTime}`);
  }
  if (typeof args.reservationType === "string") {
    lines.push(`유형: ${args.reservationType}`);
  }
  if (typeof args.externalCreatorName === "string") {
    lines.push(`외부 예약자: ${args.externalCreatorName}`);
  }
  if (typeof args.creatorId === "number") {
    lines.push(`예약자 ID: ${args.creatorId}`);
  }
  if (typeof args.participationAvailable === "boolean") {
    lines.push(`오픈 연습: ${args.participationAvailable ? "예" : "아니오"}`);
  }

  return lines.join("\n");
}

export function formatAssistantToolArgsPreview(
  toolId: AssistantToolId,
  args: Record<string, unknown>,
): string {
  if (toolId === "reservation_batch_create") {
    const sections: string[] = [];
    const dayTimes = formatDayTimes(args.dayTimes);
    const duration = formatDuration(args.duration);
    const option = formatBatchOption(args.batchReservationOption);

    if (dayTimes) sections.push(`[요일·시간]\n${dayTimes}`);
    if (duration) sections.push(`[기간]\n${duration}`);
    if (option) sections.push(`[옵션]\n${option}`);

    return sections.join("\n\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "reservation_force_create") {
    return formatForceCreateArgs(args);
  }

  if (toolId === "reservation_force_update") {
    const lines: string[] = [];
    if (typeof args.reservationId === "number") {
      lines.push(`예약 ID: ${args.reservationId}`);
    }
    if (typeof args.title === "string") lines.push(`연습: ${args.title}`);
    if (typeof args.date === "string") lines.push(`날짜: ${args.date}`);
    if (typeof args.startTime === "string" && typeof args.endTime === "string") {
      lines.push(`시간: ${args.startTime}~${args.endTime}`);
    } else {
      if (typeof args.startTime === "string") {
        lines.push(`시작: ${args.startTime}`);
      }
      if (typeof args.endTime === "string") {
        lines.push(`종료: ${args.endTime}`);
      }
    }
    if (typeof args.reservationType === "string") {
      lines.push(`유형: ${args.reservationType}`);
    }
    return lines.join("\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "reservation_force_delete") {
    return `예약 ID: ${args.reservationId}`;
  }

  if (toolId === "reservations_batch_delete") {
    const ids = Array.isArray(args.reservationIds)
      ? args.reservationIds.filter((id) => typeof id === "number")
      : [];
    return ids.length > 0
      ? `삭제 대상 ${ids.length}건\n${ids.map((id) => `- #${id}`).join("\n")}`
      : JSON.stringify(args, null, 2);
  }

  if (toolId === "notice_create") {
    const lines: string[] = [];
    if (typeof args.title === "string") lines.push(`제목: ${args.title}`);
    if (typeof args.content === "string") lines.push(`내용:\n${args.content}`);
    if (typeof args.noticeAll === "boolean") {
      lines.push(
        `전체 알림 발송: ${args.noticeAll ? "예 (등록 시 전체 회원 notification)" : "아니오"}`,
      );
    }
    return lines.join("\n\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "notice_update") {
    const lines: string[] = [];
    if (typeof args.noticeId === "number") lines.push(`공지 ID: ${args.noticeId}`);
    if (typeof args.title === "string") lines.push(`제목: ${args.title}`);
    if (typeof args.content === "string") lines.push(`내용:\n${args.content}`);
    if (typeof args.noticeAll === "boolean") {
      lines.push(
        `전체 알림 발송: ${args.noticeAll ? "예" : "아니오"}`,
      );
    }
    return lines.join("\n\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "notice_delete") {
    return `공지 ID: ${args.noticeId}`;
  }

  if (toolId === "banner_create") {
    const lines: string[] = [];
    if (typeof args.owner === "string") lines.push(`소유자: ${args.owner}`);
    if (typeof args.startDate === "string" && typeof args.endDate === "string") {
      lines.push(`게시 기간: ${args.startDate} ~ ${args.endDate}`);
    }
    if (typeof args.bannerImgUrl === "string") {
      lines.push(`이미지: ${args.bannerImgUrl}`);
    }
    if (typeof args.href === "string" && args.href.trim()) {
      lines.push(`클릭 링크: ${args.href}`);
    }
    return lines.join("\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "banner_update") {
    const lines: string[] = [];
    if (typeof args.bannerId === "number") lines.push(`배너 ID: ${args.bannerId}`);
    if (typeof args.owner === "string") lines.push(`소유자: ${args.owner}`);
    if (typeof args.startDate === "string") lines.push(`시작일: ${args.startDate}`);
    if (typeof args.endDate === "string") lines.push(`종료일: ${args.endDate}`);
    if (typeof args.bannerImgUrl === "string") {
      lines.push(`이미지: ${args.bannerImgUrl}`);
    }
    if (typeof args.href === "string" && args.href.trim()) {
      lines.push(`클릭 링크: ${args.href}`);
    }
    return lines.join("\n") || JSON.stringify(args, null, 2);
  }

  if (toolId === "banner_delete") {
    return `배너 ID: ${args.bannerId}`;
  }

  return JSON.stringify(args, null, 2);
}
