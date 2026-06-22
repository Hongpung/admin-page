import { getAssistantToolDefinition } from "@admin/features/assistant/lib/assistant-tool-definitions";
import type { AssistantMissingFieldItem } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantToolId } from "@admin/features/assistant/types/assistant-tool.types";
import {
  createEditReservationBaseSchema,
} from "@admin/features/reservation/types/schemas/common.schema";
import type { z } from "zod";
import { z as zod } from "zod";

export type { AssistantMissingFieldItem };

const GLOBAL_FIELD_LABELS: Record<string, string> = {
  title: "연습 제목",
  date: "예약 날짜",
  startTime: "시작 시간",
  endTime: "종료 시간",
  reservationType: "예약 유형",
  creatorId: "예약자 ID",
  creatorName: "예약자 이름",
  externalCreatorName: "외부 예약자 이름",
  participationAvailable: "오픈 연습 여부",
  reservationId: "예약 ID",
  reservationIds: "삭제할 예약 ID 목록",
  dayTimes: "요일·시간 목록",
  duration: "예약 기간",
  "duration.startDate": "기간 시작일",
  "duration.endDate": "기간 종료일",
  batchReservationOption: "일괄 예약 옵션",
  "batchReservationOption.title": "연습 제목",
  "batchReservationOption.reservationType": "예약 유형",
  "batchReservationOption.creatorId": "예약자 ID",
  "batchReservationOption.creatorName": "예약자 이름",
  noticeId: "공지 ID",
  content: "공지 본문",
  noticeAll: "전체 알림 발송 여부",
  channel: "채널 ID",
  bannerId: "배너 ID",
  owner: "배너 소유자/표시명",
  bannerImgUrl: "배너 이미지 URL",
  startDate: "게시 시작일",
  endDate: "게시 종료일",
  href: "배너 클릭 링크",
  patch: "수정할 내용",
};

const TOOL_FIELD_LABELS: Partial<Record<AssistantToolId, Record<string, string>>> =
  {
    notice_create: { title: "공지 제목" },
    notice_update: { title: "공지 제목", patch: "수정할 내용" },
    reservation_force_update: { patch: "수정할 내용" },
    banner_update: { patch: "수정할 내용" },
  };

const TOOL_FIELD_HINTS: Partial<Record<AssistantToolId, Record<string, string>>> = {
  reservation_force_create: {
    date: "예약 날짜 (YYYY-MM-DD, 최소 내일)",
    startTime: "시작 시간 (HH:mm, 30분 단위)",
    endTime: "종료 시간 (HH:mm, 30분 단위)",
    creatorName: "예약자 이름",
    reservationType: "예약 유형 (COMMON | REGULAR | EXTERNAL)",
  },
  reservations_multi_create: {
    "reservations.0.creatorName": "예약자 이름",
  },
  reservation_batch_create: {
    dayTimes: "요일·시간 배열 [{ day, startTime, endTime }]",
    "duration.startDate": "기간 시작일 (YYYY-MM-DD)",
    "duration.endDate": "기간 종료일 (YYYY-MM-DD)",
    "batchReservationOption.creatorName": "예약자 이름",
    "batchReservationOption.reservationType":
      "예약 유형 (COMMON | REGULAR | EXTERNAL)",
  },
  reservation_force_delete: {
    reservationId: "삭제할 예약 ID (lookup 결과의 reservationId)",
  },
  reservation_force_update: {
    reservationId: "수정할 예약 ID (lookup 결과의 reservationId)",
    patch: "날짜·시간·제목·예약 유형 중 변경할 항목",
  },
  reservations_batch_delete: {
    reservationIds: "삭제할 예약 ID 목록 (lookup 결과에서 수집)",
  },
  notice_create: {
    title: "공지 제목",
    noticeAll: "전체 알림 발송 여부 (true/false, 선택)",
  },
  notice_update: {
    noticeId: "수정할 공지 ID",
    patch: "제목·본문·알림 설정 중 변경할 항목",
  },
  notice_delete: {
    noticeId: "삭제할 공지 ID",
  },
  banner_create: {
    href: "배너 클릭 링크 (선택)",
  },
  banner_update: {
    bannerId: "수정할 배너 ID",
    patch: "소유자·이미지·게시 기간·링크 중 변경할 항목",
  },
  banner_delete: {
    bannerId: "삭제할 배너 ID",
  },
};

const FIELD_FORMAT_HINTS: Record<string, string> = {
  date: "YYYY-MM-DD",
  startDate: "YYYY-MM-DD",
  endDate: "YYYY-MM-DD",
  "duration.startDate": "YYYY-MM-DD",
  "duration.endDate": "YYYY-MM-DD",
  startTime: "HH:mm",
  endTime: "HH:mm",
  creatorName: "string",
  reservationId: "number",
  noticeId: "number",
  bannerId: "number",
  participationAvailable: "true | false",
  reservationType: "COMMON | REGULAR | EXTERNAL",
  "batchReservationOption.reservationType": "COMMON | REGULAR | EXTERNAL",
};

export function mapCreatorIdPathToCreatorNamePath(path: string): string {
  if (path === "creatorId") return "creatorName";
  if (path === "batchReservationOption.creatorId") {
    return "batchReservationOption.creatorName";
  }

  const multiMatch = path.match(/^(reservations\.\d+)\.creatorId$/);
  if (multiMatch) {
    return `${multiMatch[1]}.creatorName`;
  }

  return path;
}

export function isCreatorUserInputPath(path: string): boolean {
  return (
    path === "creatorId" ||
    path === "creatorName" ||
    path === "batchReservationOption.creatorId" ||
    path === "batchReservationOption.creatorName" ||
    /^reservations\.\d+\.creator(?:Id|Name)$/.test(path)
  );
}

function humanizeCreatorGapMessage(message: string): string {
  const trimmed = message.trim();
  if (
    trimmed === "예약자를 선택해주세요" ||
    trimmed === "값을 입력해주세요" ||
    trimmed === "숫자 값이 필요합니다" ||
    trimmed.includes("expected number")
  ) {
    return "예약자 이름을 입력해주세요";
  }
  return trimmed;
}

function remapCreatorIdGapsForUserInput(
  toolId: AssistantToolId,
  gapItems: AssistantMissingFieldItem[],
): AssistantMissingFieldItem[] {
  return gapItems.map((item) => {
    const creatorNamePath = mapCreatorIdPathToCreatorNamePath(item.path);
    if (creatorNamePath === item.path) {
      return item;
    }

    const message = humanizeCreatorGapMessage(item.message);
    const label = formatFieldLabel(toolId, creatorNamePath);

    return {
      path: creatorNamePath,
      label,
      message,
      display: formatDisplayLine(toolId, creatorNamePath, message),
    };
  });
}

function formatFieldLabel(toolId: AssistantToolId, fieldPath: string): string {
  const multiCreatorMatch = fieldPath.match(/^reservations\.(\d+)\.creatorName$/);
  if (multiCreatorMatch) {
    return `예약 ${Number(multiCreatorMatch[1]) + 1} 예약자 이름`;
  }

  const multiCreatorIdMatch = fieldPath.match(/^reservations\.(\d+)\.creatorId$/);
  if (multiCreatorIdMatch) {
    return `예약 ${Number(multiCreatorIdMatch[1]) + 1} 예약자 이름`;
  }

  const multiExternalMatch = fieldPath.match(
    /^reservations\.(\d+)\.externalCreatorName$/,
  );
  if (multiExternalMatch) {
    return `예약 ${Number(multiExternalMatch[1]) + 1} 외부 예약자 이름`;
  }

  const multiTitleMatch = fieldPath.match(/^reservations\.(\d+)\.title$/);
  if (multiTitleMatch) {
    return `예약 ${Number(multiTitleMatch[1]) + 1} 연습 제목`;
  }

  const toolHint = TOOL_FIELD_HINTS[toolId]?.[fieldPath];
  if (toolHint) return toolHint;

  const label =
    TOOL_FIELD_LABELS[toolId]?.[fieldPath] ??
    GLOBAL_FIELD_LABELS[fieldPath] ??
    fieldPath;
  const format = FIELD_FORMAT_HINTS[fieldPath];
  return format ? `${label} (${format})` : label;
}

function humanizeZodMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "Invalid input") {
    return "값을 입력해주세요";
  }
  if (trimmed.includes("expected string")) return "값을 입력해주세요";
  if (trimmed.includes("expected number")) return "숫자 값이 필요합니다";
  if (trimmed.includes("expected boolean")) return "true 또는 false를 지정해주세요";
  if (trimmed.includes("expected array")) return "목록이 필요합니다";
  if (trimmed.includes("expected object")) return "값을 입력해주세요";
  if (trimmed.startsWith("Invalid option")) return "허용된 값 중 하나를 선택해주세요";
  return trimmed;
}

function formatDisplayLine(
  toolId: AssistantToolId,
  fieldPath: string,
  message: string,
): string {
  const label = formatFieldLabel(toolId, fieldPath);
  const trimmedMessage = message.trim();
  if (!trimmedMessage || trimmedMessage === "Invalid input") {
    return `${label} [${fieldPath}]`;
  }
  return `${label} [${fieldPath}]: ${trimmedMessage}`;
}

function walkZodIssues(issues: z.core.$ZodIssue[]): Array<{
  path: string;
  message: string;
}> {
  const collected = new Map<string, string>();

  const visit = (issue: z.core.$ZodIssue) => {
    if (issue.code === "invalid_union" && "errors" in issue) {
      const branches = (issue as { errors?: z.core.$ZodIssue[][] }).errors;
      if (Array.isArray(branches)) {
        for (const branchIssues of branches) {
          for (const branchIssue of branchIssues) {
            visit(branchIssue);
          }
        }
      }
      return;
    }

    const path = issue.path.map(String).join(".");
    if (!path || path === "payload") {
      return;
    }

    const message = humanizeZodMessage(
      typeof issue.message === "string" ? issue.message : "값을 확인해주세요",
    );
    const existing = collected.get(path);
    if (!existing || message.length > existing.length) {
      collected.set(path, message);
    }
  };

  for (const issue of issues) {
    visit(issue);
  }

  return Array.from(collected.entries()).map(([path, message]) => ({
    path,
    message,
  }));
}

function prioritizeMissingPaths(
  toolId: AssistantToolId,
  paths: string[],
): string[] {
  const orderByTool: Partial<Record<AssistantToolId, string[]>> = {
    reservation_force_create: [
      "title",
      "date",
      "startTime",
      "endTime",
      "reservationType",
      "participationAvailable",
      "creatorId",
      "externalCreatorName",
    ],
    reservations_multi_create: ["reservations"],
    reservation_batch_create: [
      "dayTimes",
      "duration.startDate",
      "duration.endDate",
      "batchReservationOption.title",
      "batchReservationOption.reservationType",
      "batchReservationOption.creatorId",
      "batchReservationOption.creatorName",
    ],
    notice_create: ["title", "content", "noticeAll", "channel"],
    notice_update: ["noticeId", "patch", "title", "content", "noticeAll", "channel"],
    notice_delete: ["noticeId"],
    banner_create: ["owner", "bannerImgUrl", "startDate", "endDate", "href"],
    banner_update: [
      "bannerId",
      "patch",
      "owner",
      "bannerImgUrl",
      "startDate",
      "endDate",
      "href",
    ],
    banner_delete: ["bannerId"],
    reservation_force_delete: ["reservationId"],
    reservations_batch_delete: ["reservationIds"],
    reservation_force_update: [
      "reservationId",
      "patch",
      "title",
      "date",
      "startTime",
      "endTime",
      "reservationType",
      "participationAvailable",
      "creatorId",
      "externalCreatorName",
    ],
  };

  const order = orderByTool[toolId] ?? [];
  const rank = new Map(order.map((path, index) => [path, index]));

  return [...paths].sort((a, b) => {
    const rankA = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
}

function resolveValidationSchema(
  toolId: AssistantToolId,
  payload: Record<string, unknown>,
  defaultSchema: z.ZodType,
): z.ZodType {
  if (toolId === "reservation_force_create") {
    const reservationType = payload.reservationType;
    if (reservationType === "EXTERNAL") {
      return createEditReservationBaseSchema.extend({
        reservationType: zod.literal("EXTERNAL"),
        externalCreatorName: zod
          .string()
          .min(1, "외부 예약자 이름을 입력해주세요"),
      });
    }
    if (reservationType === "COMMON" || reservationType === "REGULAR") {
      return createEditReservationBaseSchema.extend({
        reservationType: zod.enum(["COMMON", "REGULAR"]),
        creatorId: zod.number().int().positive("예약자를 선택해주세요"),
      });
    }
  }

  if (toolId === "reservation_batch_create") {
    return defaultSchema;
  }

  return defaultSchema;
}

function filterDiscriminatedPaths(
  toolId: AssistantToolId,
  payload: Record<string, unknown>,
  issueItems: Array<{ path: string; message: string }>,
): Array<{ path: string; message: string }> {
  if (toolId === "reservation_force_create") {
    const reservationType = payload.reservationType;
    if (!reservationType) {
      return issueItems.filter(
        (item) =>
          item.path !== "creatorId" && item.path !== "externalCreatorName",
      );
    }
    if (reservationType === "COMMON" || reservationType === "REGULAR") {
      return issueItems.filter(
        (item) =>
          item.path !== "externalCreatorName" && item.path !== "reservationType",
      );
    }
    if (reservationType === "EXTERNAL") {
      return issueItems.filter(
        (item) => item.path !== "creatorId" && item.path !== "reservationType",
      );
    }
  }

  if (toolId === "reservation_batch_create") {
    const option = payload.batchReservationOption;
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      return issueItems.filter(
        (item) =>
          !item.path.startsWith("batchReservationOption.creator") &&
          item.path !== "batchReservationOption.creatorName" &&
          item.path !== "batchReservationOption.reservationType",
      );
    }
    const reservationType = (option as Record<string, unknown>).reservationType;
    if (!reservationType) {
      return issueItems.filter(
        (item) =>
          item.path !== "batchReservationOption.creatorId" &&
          item.path !== "batchReservationOption.creatorName",
      );
    }
    if (reservationType === "COMMON" || reservationType === "REGULAR") {
      return issueItems.filter(
        (item) =>
          item.path !== "batchReservationOption.creatorName" &&
          item.path !== "batchReservationOption.reservationType",
      );
    }
    if (reservationType === "EXTERNAL") {
      return issueItems.filter(
        (item) =>
          item.path !== "batchReservationOption.creatorId" &&
          item.path !== "batchReservationOption.reservationType",
      );
    }
  }

  return issueItems;
}

function normalizeIssuePaths(
  toolId: AssistantToolId,
  issueItems: Array<{ path: string; message: string }>,
): Array<{ path: string; message: string }> {
  if (toolId !== "reservation_batch_create") {
    return issueItems;
  }

  return issueItems.map((item) => {
    if (
      item.path === "creatorId" ||
      item.path === "creatorName" ||
      item.path === "reservationType" ||
      item.path === "title"
    ) {
      return {
        ...item,
        path: `batchReservationOption.${item.path}`,
      };
    }
    return item;
  });
}

const PATCH_REQUIRED_MESSAGE = "수정할 필드를 한 개 이상 지정해주세요";

function normalizeUpdatePatchGaps(
  toolId: AssistantToolId,
  issueItems: Array<{ path: string; message: string }>,
): Array<{ path: string; message: string }> {
  if (toolId !== "notice_update" && toolId !== "banner_update" && toolId !== "reservation_force_update") {
    return issueItems;
  }

  const patchIssue = issueItems.find(
    (item) => item.message === PATCH_REQUIRED_MESSAGE,
  );
  if (!patchIssue) {
    return issueItems;
  }

  const withoutPatchTrigger = issueItems.filter(
    (item) => item.message !== PATCH_REQUIRED_MESSAGE,
  );

  return [
    ...withoutPatchTrigger,
    {
      path: "patch",
      message:
        toolId === "notice_update"
          ? "제목·본문·알림 설정 중 변경할 항목을 알려주세요"
          : toolId === "banner_update"
            ? "소유자·이미지·게시 기간·링크 중 변경할 항목을 알려주세요"
            : "날짜·시간·제목·예약 유형 중 변경할 항목을 알려주세요",
    },
  ];
}

export function analyzeAssistantToolSchemaGaps(
  toolId: AssistantToolId,
  payload: Record<string, unknown>,
): AssistantMissingFieldItem[] {
  const definition = getAssistantToolDefinition(toolId);
  if (!definition) return [];

  const schema = resolveValidationSchema(
    toolId,
    payload,
    definition.argsSchema,
  );
  const parsed = schema.safeParse(payload);
  if (parsed.success) {
    return [];
  }

  const issueItems = normalizeUpdatePatchGaps(
    toolId,
    filterDiscriminatedPaths(
      toolId,
      payload,
      normalizeIssuePaths(toolId, walkZodIssues(parsed.error.issues)),
    ),
  );
  const paths = prioritizeMissingPaths(
    toolId,
    issueItems.map((item) => item.path),
  );

  const messageByPath = new Map(
    issueItems.map((item) => [item.path, item.message]),
  );

  return remapCreatorIdGapsForUserInput(
    toolId,
    paths.map((path) => {
      const message = messageByPath.get(path) ?? "값을 확인해주세요";
      const label = formatFieldLabel(toolId, path);
      return {
        path,
        label,
        message,
        display: formatDisplayLine(toolId, path, message),
      };
    }),
  );
}

export function analyzeAssistantToolMissingFieldPaths(
  toolId: AssistantToolId,
  payload: Record<string, unknown>,
): string[] {
  return analyzeAssistantToolSchemaGaps(toolId, payload).map((item) => item.path);
}

export function formatAssistantMissingFieldLabel(
  toolId: AssistantToolId,
  fieldPath: string,
): string {
  return formatFieldLabel(toolId, fieldPath);
}

export function formatAssistantMissingFieldLabels(
  toolId: AssistantToolId,
  fieldPaths: string[],
): string[] {
  return fieldPaths.map((fieldPath) =>
    formatAssistantMissingFieldLabel(toolId, fieldPath),
  );
}

export function computeAssistantMissingFields(
  toolId: AssistantToolId,
  payload: Record<string, unknown>,
): string[] {
  return analyzeAssistantToolMissingFieldPaths(toolId, payload);
}

export function buildMissingFieldsRecommendedAction(
  toolId: AssistantToolId | null,
  items: AssistantMissingFieldItem[] | string[],
): string {
  const gapItems: AssistantMissingFieldItem[] =
    items.length > 0 && typeof items[0] === "string" && toolId
      ? (items as string[]).map((path) => ({
          path,
          label: formatFieldLabel(toolId, path),
          message: "값을 확인해주세요",
          display: formatDisplayLine(toolId, path, "값을 확인해주세요"),
        }))
      : (items as AssistantMissingFieldItem[]);

  if (gapItems.length === 0) {
    return "아직 필요한 정보가 남아 있습니다. 부족한 필드를 추가로 입력해주세요.";
  }

  return [
    "아직 실행할 수 없습니다. 아래 필드가 더 필요합니다.",
    ...gapItems.map((item) => `- ${item.display}`),
  ].join("\n");
}

export function buildMissingFieldsSummaryNote(
  items: AssistantMissingFieldItem[],
): string {
  if (items.length === 0) return "";

  return [
    "아직 승인·실행 전에 아래 정보가 더 필요합니다.",
    ...items.map((item) => `- ${item.display}`),
  ].join("\n");
}

export function appendMissingFieldsToSummary(
  summary: string,
  items: AssistantMissingFieldItem[],
): string {
  const base = summary.trim();
  const note = buildMissingFieldsSummaryNote(items);
  if (!note) return base;
  if (
    base.includes("더 필요") ||
    base.includes("아직 실행") ||
    base.includes("아직 승인")
  ) {
    return base;
  }
  return base ? `${base}\n\n${note}` : note;
}
