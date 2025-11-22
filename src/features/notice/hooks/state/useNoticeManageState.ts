import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Notice } from "../../types";
import { NOTICE_QUERY_PARAM, NOTICE_MESSAGE } from "../../constants";
import { useDeleteNotice } from "../action/useDeleteNotice";
import {
  noticeDetailQueryOptions,
  noticeListQueryOptions,
  noticeQueryKeys,
} from "../../queries/notice-query-options";
import { parseNoticeIdParam } from "../../lib/notice-url";
import { useNoticeManageUrl } from "./useNoticeManageUrl";

type NoticeManageState = "idle" | "create" | "modify";

function normalizeNoticeList(data: unknown): Notice[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === "object" &&
    "notices" in data &&
    Array.isArray((data as { notices?: unknown }).notices)
  ) {
    return (data as { notices: Notice[] }).notices;
  }

  return [];
}

export function useNoticeManageState(initNotices: Notice[]) {
  const queryClient = useQueryClient();
  const {
    searchParams,
    noticeIdParam,
    parsedNoticeId,
    clearNoticeId,
    selectNoticeId,
  } = useNoticeManageUrl();
  const [noticeManageState, setNoticeManageState] =
    useState<NoticeManageState>("idle");

  const noticesQuery = useQuery({
    ...noticeListQueryOptions(),
    initialData: initNotices,
  });
  const notices = useMemo(
    () => normalizeNoticeList(noticesQuery.data),
    [noticesQuery.data],
  );

  const specificNoticeQuery = useQuery({
    ...noticeDetailQueryOptions(parsedNoticeId ?? 0),
    enabled: parsedNoticeId !== null,
  });

  const specificNotice = useMemo(
    () =>
      specificNoticeQuery.data ??
      (parsedNoticeId != null
        ? notices.find((notice) => notice.noticeId === parsedNoticeId) ?? null
        : null),
    [notices, parsedNoticeId, specificNoticeQuery.data],
  );
  const { deleteNoticeById } = useDeleteNotice({
    parsedNoticeId,
    clearNoticeId,
  });

  useEffect(() => {
    if (noticeIdParam == null || noticeIdParam === "") return;
    if (parseNoticeIdParam(noticeIdParam) !== null) return;
    clearNoticeId();
  }, [clearNoticeId, noticeIdParam]);

  useEffect(() => {
    if (parsedNoticeId == null) return;
    if (!specificNoticeQuery.isError) return;
    alert(NOTICE_MESSAGE.loadFailAlert);
    clearNoticeId();
  }, [clearNoticeId, parsedNoticeId, specificNoticeQuery.isError]);

  useEffect(() => {
    if (parsedNoticeId == null) return;
    const current = searchParams.get(NOTICE_QUERY_PARAM.noticeId);
    const next = specificNotice ? String(specificNotice.noticeId) : null;
    if (current === next) return;
    if (next != null) return;
    clearNoticeId();
  }, [clearNoticeId, parsedNoticeId, searchParams, specificNotice]);

  const refreshNotices = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
    if (parsedNoticeId != null) {
      await queryClient.invalidateQueries({
        queryKey: noticeQueryKeys.detail(parsedNoticeId),
      });
    }
    clearNoticeId();
  }, [clearNoticeId, parsedNoticeId, queryClient]);

  const handleSelectNotice = useCallback(
    (noticeId: number) => {
      if (parsedNoticeId === noticeId) return;
      selectNoticeId(noticeId);
    },
    [parsedNoticeId, selectNoticeId],
  );

  const closeModal = useCallback(
    async (saved: boolean) => {
      setNoticeManageState("idle");
      if (saved) await refreshNotices();
    },
    [refreshNotices],
  );

  return {
    notices,
    parsedNoticeId,
    specificNotice,
    noticeManageState,
    setNoticeManageState,
    handleSelectNotice,
    refreshNotices,
    deleteNoticeById,
    closeModal,
  };
}
