import { requestJson, requestVoid } from "@admin/shared/lib/http/api-fetch";
import { Notice } from "../types";

function extractNotices(payload: unknown): Notice[] {
  if (Array.isArray(payload)) return payload;

  if (
    payload &&
    typeof payload === "object" &&
    "notices" in payload &&
    Array.isArray((payload as { notices?: unknown }).notices)
  ) {
    return (payload as { notices: Notice[] }).notices;
  }

  return [];
}

export async function loadNotices() {
  const payload = await requestJson<unknown>(`/api/manage/notice/load`);
  return extractNotices(payload);
}

export async function loadSpecificNotice(infoId: number) {
  return requestJson<Notice>(`/api/manage/notice/${infoId}`);
}

export async function registerNotice({
  title,
  content,
  noticeAll,
}: {
  title: string;
  content: string;
  noticeAll?: boolean;
}) {
  await requestVoid(`/api/manage/notice/create`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ title, content, noticeAll }),
  });
}

export async function updateNotice({
  title,
  content,
  infoId,
  noticeAll,
}: {
  title: string;
  content: string;
  infoId: number;
  noticeAll?: boolean;
}) {
  await requestVoid(`/api/manage/notice/${infoId}`, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ title, content, noticeAll }),
  });
}

export async function deleteNotice({ infoId }: { infoId: number }) {
  await requestVoid(`/api/manage/notice/${infoId}`, {
    method: "DELETE",
  });
}
