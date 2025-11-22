import { NOTICE_MESSAGE } from "./notice-message.constants";

export function buildDeleteConfirmMessage(title: string) {
  return `${title}을 삭제하시겠습니까?`;
}

export function buildCreateFailMessage(detail: string) {
  return `${NOTICE_MESSAGE.createFailPrefix}: ${detail}`;
}

export function buildUpdateFailMessage(detail: string) {
  return `${NOTICE_MESSAGE.updateFailPrefix}: ${detail}`;
}

export function buildDeleteFailMessage(detail: string) {
  return `${NOTICE_MESSAGE.deleteFailAlert}: ${detail}`;
}