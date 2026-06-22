import "server-only";

import {
  getAssistantToolDefinition,
  validateAssistantToolArgs,
} from "@admin/features/assistant/lib/assistant-tool-definitions";
import {
  buildReservationPatchBody,
  extractReservationUpdatePatch,
} from "@admin/features/assistant/lib/build-reservation-patch-body";
import { fetchAssistantReservationDetail } from "@admin/features/assistant/lib/fetch-assistant-reservations";
import type {
  AssistantToolExecutionResult,
  AssistantToolId,
} from "@admin/features/assistant/types/assistant-tool.types";

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: unknown };
    if (typeof json?.message === "string" && json.message.trim()) {
      return json.message;
    }
  } catch {
    // noop
  }

  return (await response.text()) || response.statusText || `HTTP ${response.status}`;
}

async function postAdminJson(
  token: string,
  path: string,
  body: Record<string, unknown>,
): Promise<AssistantToolExecutionResult> {
  const response = await fetch(`${requireBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      message: await readErrorMessage(response),
    };
  }

  let data: Record<string, unknown> | undefined;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object") {
      data = payload as Record<string, unknown>;
    }
  } catch {
    // noop
  }

  const message =
    typeof data?.message === "string" && data.message.trim()
      ? data.message
      : "요청이 처리되었습니다.";

  return { ok: true, message, data };
}

async function deleteAdminPath(
  token: string,
  path: string,
  successMessage = "삭제되었습니다.",
): Promise<AssistantToolExecutionResult> {
  const response = await fetch(`${requireBaseUrl()}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      message: await readErrorMessage(response),
    };
  }

  let data: Record<string, unknown> | undefined;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object") {
      data = payload as Record<string, unknown>;
    }
  } catch {
    // noop
  }

  const message =
    typeof data?.message === "string" && data.message.trim()
      ? data.message
      : successMessage;

  return { ok: true, message, data };
}

async function deleteAdminReservation(
  token: string,
  reservationId: number,
): Promise<AssistantToolExecutionResult> {
  return deleteAdminPath(
    token,
    `/admin/reservation/${reservationId}`,
    "예약이 삭제되었습니다.",
  );
}

async function patchAdminJson(
  token: string,
  path: string,
  body: Record<string, unknown>,
  successMessage = "수정되었습니다.",
): Promise<AssistantToolExecutionResult> {
  const response = await fetch(`${requireBaseUrl()}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      message: await readErrorMessage(response),
    };
  }

  let data: Record<string, unknown> | undefined;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object") {
      data = payload as Record<string, unknown>;
    }
  } catch {
    // noop
  }

  const message =
    typeof data?.message === "string" && data.message.trim()
      ? data.message
      : successMessage;

  return { ok: true, message, data };
}

function omitKeys(
  args: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (!keys.includes(key)) {
      next[key] = value;
    }
  }
  return next;
}

async function executeBatchDelete(
  token: string,
  reservationIds: number[],
): Promise<AssistantToolExecutionResult> {
  const failures: string[] = [];
  let successCount = 0;

  for (const reservationId of reservationIds) {
    const result = await deleteAdminReservation(token, reservationId);
    if (result.ok) {
      successCount += 1;
      continue;
    }
    failures.push(`#${reservationId}: ${result.message}`);
  }

  if (successCount === 0) {
    return {
      ok: false,
      message: failures.join(" / ") || "예약 삭제에 실패했습니다.",
    };
  }

  if (failures.length > 0) {
    return {
      ok: true,
      message: `${successCount}건 삭제 완료, ${failures.length}건 실패 (${failures.join("; ")})`,
      data: { deletedCount: successCount, failedCount: failures.length },
    };
  }

  return {
    ok: true,
    message: `${successCount}건의 예약을 삭제했습니다.`,
    data: { deletedCount: successCount },
  };
}

async function executeMultiCreate(
  token: string,
  reservations: Record<string, unknown>[],
): Promise<AssistantToolExecutionResult> {
  const failures: string[] = [];
  let successCount = 0;

  for (let index = 0; index < reservations.length; index += 1) {
    const reservation = reservations[index]!;
    const result = await postAdminJson(token, "/admin/reservation", reservation);
    if (result.ok) {
      successCount += 1;
      continue;
    }
    failures.push(`${index + 1}번째: ${result.message}`);
  }

  if (successCount === 0) {
    return {
      ok: false,
      message: failures.join(" / ") || "예약 생성에 실패했습니다.",
    };
  }

  if (failures.length > 0) {
    return {
      ok: true,
      message: `${successCount}건 생성 완료, ${failures.length}건 실패 (${failures.join("; ")})`,
      data: { createdCount: successCount, failedCount: failures.length },
    };
  }

  return {
    ok: true,
    message: `${successCount}건의 예약을 생성했습니다.`,
    data: { createdCount: successCount },
  };
}

async function executeToolHandler(
  token: string,
  toolId: AssistantToolId,
  args: Record<string, unknown>,
): Promise<AssistantToolExecutionResult> {
  switch (toolId) {
    case "reservation_batch_create":
      return postAdminJson(token, "/admin/reservation/batch", args);
    case "reservation_force_create":
      return postAdminJson(token, "/admin/reservation", args);
    case "reservations_multi_create":
      return executeMultiCreate(
        token,
        (args.reservations as Record<string, unknown>[]) ?? [],
      );
    case "reservation_force_update": {
      const reservationId = Number(args.reservationId);
      const detail = await fetchAssistantReservationDetail(token, reservationId);
      if (!detail) {
        return { ok: false, message: "수정할 예약을 찾을 수 없습니다." };
      }

      const patch = extractReservationUpdatePatch(
        omitKeys(args, ["reservationId"]),
      );
      const body = buildReservationPatchBody(
        detail as typeof detail & { creatorId?: number },
        patch,
      );

      return patchAdminJson(
        token,
        `/admin/reservation/${reservationId}`,
        body,
        "예약이 수정되었습니다.",
      );
    }
    case "reservation_force_delete":
      return deleteAdminReservation(token, Number(args.reservationId));
    case "reservations_batch_delete":
      return executeBatchDelete(
        token,
        (args.reservationIds as number[]) ?? [],
      );
    case "notice_create":
      return postAdminJson(token, "/notice", args);
    case "notice_update":
      return patchAdminJson(
        token,
        `/notice/${Number(args.noticeId)}`,
        omitKeys(args, ["noticeId"]),
        "공지가 수정되었습니다.",
      );
    case "notice_delete":
      return deleteAdminPath(
        token,
        `/notice/${Number(args.noticeId)}`,
        "공지가 삭제되었습니다.",
      );
    case "banner_create":
      return postAdminJson(token, "/banner", buildBannerCreateBody(args));
    case "banner_update":
      return patchAdminJson(
        token,
        `/banner/${Number(args.bannerId)}`,
        buildBannerPatchBody(omitKeys(args, ["bannerId"])),
        "배너가 수정되었습니다.",
      );
    case "banner_delete":
      return deleteAdminPath(
        token,
        `/banner/${Number(args.bannerId)}`,
        "배너가 삭제되었습니다.",
      );
    default:
      return { ok: false, message: "지원하지 않는 도구입니다." };
  }
}

function toStorageImagePath(rawUrl: string): string {
  const value = rawUrl.trim();
  const prefix = "https://s3.ap-northeast-2.amazonaws.com/";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function buildBannerCreateBody(
  args: Record<string, unknown>,
): Record<string, unknown> {
  const startDate = new Date(String(args.startDate));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(String(args.endDate));
  endDate.setHours(0, 0, 0, 0);

  return {
    owner: args.owner,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    bannerImgUrl: toStorageImagePath(String(args.bannerImgUrl ?? "")),
    ...(typeof args.href === "string" && args.href.trim()
      ? { href: args.href.trim() }
      : {}),
  };
}

function buildBannerPatchBody(
  args: Record<string, unknown>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (typeof args.owner === "string") {
    body.owner = args.owner;
  }

  if (args.startDate !== undefined) {
    const startDate = new Date(String(args.startDate));
    startDate.setHours(0, 0, 0, 0);
    body.startDate = startDate.toISOString();
  }

  if (args.endDate !== undefined) {
    const endDate = new Date(String(args.endDate));
    endDate.setHours(0, 0, 0, 0);
    body.endDate = endDate.toISOString();
  }

  if (typeof args.bannerImgUrl === "string") {
    body.bannerImgUrl = toStorageImagePath(args.bannerImgUrl);
  }

  if (typeof args.href === "string" && args.href.trim()) {
    body.href = args.href.trim();
  }

  return body;
}

export async function executeAssistantTool(
  token: string,
  toolId: string,
  args: unknown,
): Promise<AssistantToolExecutionResult> {
  const definition = getAssistantToolDefinition(toolId);
  if (!definition) {
    return { ok: false, message: "알 수 없는 도구입니다." };
  }

  const validated = validateAssistantToolArgs(definition.id, args);
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  return executeToolHandler(token, definition.id, validated.data);
}
