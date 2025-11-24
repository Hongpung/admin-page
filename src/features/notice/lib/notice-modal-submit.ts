import { registerNotice, updateNotice } from "../api/notice-api";
import {
  buildCreateFailMessage,
  buildUpdateFailMessage,
  NOTICE_MESSAGE,
  NOTICE_ETC
} from "../constants";
import type { NoticeFormPayload } from "./notice-form-data";

export type NoticeModalSubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function executeRegisterNotice(
  payload: NoticeFormPayload
): Promise<NoticeModalSubmitResult> {
  try {
    await registerNotice({
      title: payload.title,
      content: payload.content,
      noticeAll: payload.noticeAll,
    });
    return { ok: true, message: NOTICE_MESSAGE.createSuccessMessage };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : NOTICE_MESSAGE.unknownError;
    return {
      ok: false,
      message: buildCreateFailMessage(detail),
    };
  }
}

export async function executeUpdateNotice(
  noticeId: number,
  payload: NoticeFormPayload
): Promise<NoticeModalSubmitResult> {
  try {
    if (!noticeId) {
      throw new Error(NOTICE_ETC.invalidInfoIdError);
    }
    await updateNotice({
      title: payload.title,
      content: payload.content,
      infoId: noticeId,
      noticeAll: payload.noticeAll,
    });
    return { ok: true, message: NOTICE_MESSAGE.updateSuccessMessage };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : NOTICE_MESSAGE.unknownError;
    return {
      ok: false,
      message: buildUpdateFailMessage(detail),
    };
  }
}
