import type { AssistantMissingFieldItem } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantActionType } from "@admin/features/assistant/types/assistant-tool.types";
import { mapCreatorIdPathToCreatorNamePath } from "@admin/features/assistant/lib/format-assistant-missing-fields";

export type AssistantInputWidget =
  | "text"
  | "textarea"
  | "date"
  | "time"
  | "number"
  | "boolean"
  | "select"
  | "info"
  | "member_name";

export type AssistantInputFieldConfig = {
  path: string;
  label: string;
  message: string;
  widget: AssistantInputWidget;
  options?: Array<{ value: string; label: string }>;
};

const RESERVATION_TYPE_OPTIONS = [
  { value: "COMMON", label: "일반 (COMMON)" },
  { value: "REGULAR", label: "정기 (REGULAR)" },
  { value: "EXTERNAL", label: "외부 (EXTERNAL)" },
];

function isCreatorNamePath(path: string): boolean {
  return (
    path === "creatorName" ||
    path === "batchReservationOption.creatorName" ||
    /^reservations\.\d+\.creatorName$/.test(path)
  );
}

function isCreatorIdPath(path: string): boolean {
  return (
    path === "creatorId" ||
    path === "batchReservationOption.creatorId" ||
    /^reservations\.\d+\.creatorId$/.test(path)
  );
}

function isExternalCreatorPath(path: string): boolean {
  return (
    path === "externalCreatorName" ||
    path === "batchReservationOption.creatorName" ||
    /^reservations\.\d+\.externalCreatorName$/.test(path)
  );
}

function resolveWidget(path: string): AssistantInputWidget {
  if (path === "patch") return "info";
  if (isCreatorNamePath(path) || isCreatorIdPath(path) || isExternalCreatorPath(path)) {
    return "member_name";
  }
  if (
    path === "date" ||
    path === "startDate" ||
    path === "endDate" ||
    path === "duration.startDate" ||
    path === "duration.endDate" ||
    /^reservations\.\d+\.date$/.test(path)
  ) {
    return "date";
  }
  if (
    path === "startTime" ||
    path === "endTime" ||
    /^reservations\.\d+\.(startTime|endTime)$/.test(path)
  ) {
    return "time";
  }
  if (path === "participationAvailable" || path === "noticeAll") return "boolean";
  if (
    path === "reservationType" ||
    path === "batchReservationOption.reservationType" ||
    /^reservations\.\d+\.reservationType$/.test(path)
  ) {
    return "select";
  }
  if (
    path === "noticeId" ||
    path === "bannerId" ||
    path === "reservationId" ||
    path === "channel"
  ) {
    return "number";
  }
  if (path === "content") return "textarea";
  if (path === "reservationIds" || path === "dayTimes") return "textarea";
  return "text";
}

function resolveSelectOptions(path: string) {
  if (
    path === "reservationType" ||
    path === "batchReservationOption.reservationType" ||
    /^reservations\.\d+\.reservationType$/.test(path)
  ) {
    return RESERVATION_TYPE_OPTIONS;
  }
  return undefined;
}

function expandPatchFields(
  actionType: AssistantActionType | undefined,
): AssistantInputFieldConfig[] {
  if (actionType === "UPDATE_NOTICE") {
    return [
      {
        path: "title",
        label: "공지 제목",
        message: "변경할 제목",
        widget: "text",
      },
      {
        path: "content",
        label: "공지 본문",
        message: "변경할 본문",
        widget: "textarea",
      },
      {
        path: "noticeAll",
        label: "전체 알림 발송",
        message: "",
        widget: "boolean",
      },
    ];
  }

  if (actionType === "UPDATE_BANNER") {
    return [
      { path: "owner", label: "배너 소유자", message: "", widget: "text" },
      {
        path: "bannerImgUrl",
        label: "배너 이미지 URL",
        message: "",
        widget: "text",
      },
      { path: "startDate", label: "게시 시작일", message: "", widget: "date" },
      { path: "endDate", label: "게시 종료일", message: "", widget: "date" },
      { path: "href", label: "클릭 링크", message: "", widget: "text" },
    ];
  }

  if (actionType === "UPDATE_RESERVATION") {
    return [
      { path: "title", label: "연습 제목", message: "변경할 제목", widget: "text" },
      { path: "date", label: "날짜", message: "변경할 날짜", widget: "date" },
      { path: "startTime", label: "시작 시간", message: "변경할 시작 시간", widget: "time" },
      { path: "endTime", label: "종료 시간", message: "변경할 종료 시간", widget: "time" },
      {
        path: "reservationType",
        label: "예약 유형",
        message: "",
        widget: "select",
        options: RESERVATION_TYPE_OPTIONS,
      },
      {
        path: "participationAvailable",
        label: "오픈 연습",
        message: "",
        widget: "boolean",
      },
    ];
  }

  return [];
}

const EDIT_FIELDS_BY_ACTION: Partial<
  Record<AssistantActionType, AssistantInputFieldConfig[]>
> = {
  CREATE_RESERVATION: [
    { path: "date", label: "날짜", message: "", widget: "date" },
    { path: "startTime", label: "시작 시간", message: "", widget: "time" },
    { path: "endTime", label: "종료 시간", message: "", widget: "time" },
    { path: "title", label: "연습 제목", message: "", widget: "text" },
    {
      path: "reservationType",
      label: "예약 유형",
      message: "",
      widget: "select",
      options: RESERVATION_TYPE_OPTIONS,
    },
    { path: "creatorName", label: "예약자 이름", message: "", widget: "member_name" },
    {
      path: "externalCreatorName",
      label: "외부 예약자",
      message: "",
      widget: "text",
    },
  ],
  CREATE_NOTICE: [
    { path: "title", label: "공지 제목", message: "", widget: "text" },
    { path: "content", label: "공지 본문", message: "", widget: "textarea" },
    { path: "noticeAll", label: "전체 알림", message: "", widget: "boolean" },
  ],
  CREATE_BANNER: [
    { path: "owner", label: "배너 소유자", message: "", widget: "text" },
    { path: "bannerImgUrl", label: "이미지 URL", message: "", widget: "text" },
    { path: "startDate", label: "게시 시작일", message: "", widget: "date" },
    { path: "endDate", label: "게시 종료일", message: "", widget: "date" },
    { path: "href", label: "클릭 링크", message: "", widget: "text" },
  ],
};

export function buildAssistantEditFieldConfigs(
  actionType?: AssistantActionType,
): AssistantInputFieldConfig[] {
  if (!actionType) return [];
  return EDIT_FIELDS_BY_ACTION[actionType] ?? [];
}

export function buildAssistantInputFieldConfigs(
  items: AssistantMissingFieldItem[],
  actionType?: AssistantActionType,
): AssistantInputFieldConfig[] {
  const configs: AssistantInputFieldConfig[] = [];

  for (const item of items) {
    if (item.path === "patch") {
      configs.push(...expandPatchFields(actionType));
      continue;
    }

    configs.push({
      path: mapCreatorIdPathToCreatorNamePath(item.path),
      label: item.label,
      message: item.message,
      widget: resolveWidget(mapCreatorIdPathToCreatorNamePath(item.path)),
      options: resolveSelectOptions(mapCreatorIdPathToCreatorNamePath(item.path)),
    });
  }

  const seen = new Set<string>();
  return configs.filter((config) => {
    if (seen.has(config.path)) return false;
    seen.add(config.path);
    return true;
  });
}
