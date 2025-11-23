"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Modal from "@admin/shared/components/Modal";
import Table from "@admin/shared/components/Table";
import type { User } from "@admin/features/user";
import { manageUserSearchQueryOptions } from "@admin/features/user/queries";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { grantAdmin } from "../../api/admin-api";
import {
  ADMIN_MANAGE_CLUB_OPTIONS,
  ADMIN_MANAGE_ROLE_OPTIONS,
  ADMIN_MANAGE_TEXT,
  ADMIN_MANAGE_MESSAGE,
} from "../../constants";
import { adminQueryKeys } from "../../queries";
import { canPickAdminTarget } from "../../service";
import type { AdminLevel } from "../../types";

const inputClass =
  "border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]";
const MODAL_PAGE_SIZE = 50;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 이미 관리자인 memberId */
  adminMemberIds: Set<number>;
  sessionMemberId: number | null;
};

export function GrantAdminSelectModal({
  visible,
  onClose,
  adminMemberIds,
  sessionMemberId,
}: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<User | null>(null);
  const [level, setLevel] = useState<AdminLevel>("SUB");

  const [keyword, setKeyword] = useState("");
  const [clubId, setClubId] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const clubRef = useRef<HTMLSelectElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);

  const debouncedSetKeyword = useMemo(
    () => debounce((value: string) => setKeyword(value), 800),
    [],
  );

  useEffect(
    () => () => {
      debouncedSetKeyword.cancel();
    },
    [debouncedSetKeyword],
  );

  const resetFilters = useCallback(() => {
    debouncedSetKeyword.cancel();
    if (inputRef.current) inputRef.current.value = "";
    setKeyword("");
    setClubId(undefined);
    setRole(undefined);
    if (clubRef.current) clubRef.current.value = "none";
    if (roleRef.current) roleRef.current.value = "none";
  }, [debouncedSetKeyword]);

  useEffect(() => {
    if (!visible) {
      resetFilters();
      setSelected(null);
      setLevel("SUB");
    }
  }, [resetFilters, visible]);

  const membersQuery = useQuery({
    ...manageUserSearchQueryOptions({
      username: keyword.trim().length > 0 ? keyword.trim() : undefined,
      clubId,
      role,
      page: 0,
      pageSize: MODAL_PAGE_SIZE,
    }),
    enabled: visible,
  });

  const grantAdminMutation = useMutation({
    mutationFn: ({
      memberId,
      adminLevel,
    }: {
      memberId: number;
      adminLevel: AdminLevel;
    }) => grantAdmin(memberId, adminLevel),
  });

  const handleRegister = async () => {
    if (!selected) return;
    if (adminMemberIds.has(selected.memberId)) {
      window.alert(ADMIN_MANAGE_MESSAGE.alreadyAdmin);
      return;
    }
    if (sessionMemberId !== null && selected.memberId === sessionMemberId) {
      window.alert(ADMIN_MANAGE_MESSAGE.selfGrantBlocked);
      return;
    }
    try {
      await grantAdminMutation.mutateAsync({
        memberId: selected.memberId,
        adminLevel: level,
      });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.list() });
      window.alert(ADMIN_MANAGE_MESSAGE.grantSuccess);
      onClose();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : ADMIN_MANAGE_MESSAGE.grantFailed,
      );
    }
  };

  const canPick = (u: User) =>
    canPickAdminTarget(u.memberId, adminMemberIds, sessionMemberId);

  const columns = useMemo(
    () => [
      {
        colKey: "name",
        title: ADMIN_MANAGE_TEXT.grantColumnTitleName,
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, m: User) => (
          <div>
            <span className="font-medium">
              {m.name}
              {m.nickname ? ` (${m.nickname})` : ""} ({m.enrollmentNumber})
            </span>
            {adminMemberIds.has(m.memberId) && (
              <span className="text-gray-400 text-sm ml-2">
                {ADMIN_MANAGE_TEXT.grantModalAlreadyAdmin}
              </span>
            )}
            {sessionMemberId !== null && m.memberId === sessionMemberId && (
              <span className="text-gray-400 text-sm ml-2">
                {ADMIN_MANAGE_TEXT.rowSelf}
              </span>
            )}
          </div>
        ),
      },
      {
        colKey: "club",
        title: ADMIN_MANAGE_TEXT.grantColumnTitleClub,
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, m: User) =>
          m.club ? m.club : ADMIN_MANAGE_TEXT.rowNoClub,
      },
      {
        colKey: "role",
        title: ADMIN_MANAGE_TEXT.grantColumnTitleRole,
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, m: User) =>
          m.role.length === 0 ? "-" : m.role.join(", "),
      },
    ],
    [adminMemberIds, sessionMemberId],
  );

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      contentClassName="bg-white py-4 px-6 max-w-2xl w-[min(100vw-2rem,42rem)] max-h-[90vh] overflow-y-auto"
    >
      <div className="relative flex flex-col gap-4">
        <button
          type="button"
          className="absolute top-0 right-0 cursor-pointer text-lg font-bold text-gray-400"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="text-lg font-semibold pr-8">
          {ADMIN_MANAGE_TEXT.grantModalTitle}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              {ADMIN_MANAGE_TEXT.grantModalSearchLabel}
            </div>
            <button
              type="button"
              className="text-sm text-blue-600 cursor-pointer"
              onClick={resetFilters}
            >
              {ADMIN_MANAGE_TEXT.grantModalReset}
            </button>
          </div>
          <div className="flex flex-row flex-wrap gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder={ADMIN_MANAGE_TEXT.grantModalSearchPlaceholder}
              className={inputClass}
              onChange={(e) => {
                debouncedSetKeyword(e.currentTarget.value || "");
              }}
            />
            <select
              ref={clubRef}
              name="clubId"
              className={inputClass}
              defaultValue="none"
              onChange={(e) => {
                setClubId(
                  e.currentTarget.value === "none"
                    ? undefined
                    : e.currentTarget.value,
                );
              }}
            >
              {ADMIN_MANAGE_CLUB_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              ref={roleRef}
              name="role"
              className={inputClass}
              defaultValue="none"
              onChange={(e) => {
                setRole(
                  e.currentTarget.value === "none"
                    ? undefined
                    : e.currentTarget.value,
                );
              }}
            >
              {ADMIN_MANAGE_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          dataSource={membersQuery.data?.members ?? []}
          columns={columns}
          rowKey="memberId"
          loading={
            membersQuery.isLoading ||
            membersQuery.isFetching ||
            grantAdminMutation.isPending
          }
          loadingContent={
            <div className="py-8 text-gray-500">
              {ADMIN_MANAGE_TEXT.grantModalLoading}
            </div>
          }
          emptyText={ADMIN_MANAGE_TEXT.grantModalEmptyResult}
          emptyClassName="!min-h-[12rem] !text-base !font-normal py-8"
          shellClassName="w-full max-h-72 overflow-y-auto border border-gray-200 rounded-md"
          tableClassName="w-full text-sm border-separate border-spacing-0"
          stickyHeader
          onRowClick={(m) => {
            if (canPick(m)) setSelected(m);
          }}
          rowClassName={(record) => {
            const pickable = canPick(record);
            return [
              pickable
                ? "cursor-pointer hover:bg-slate-100"
                : "opacity-50 cursor-not-allowed",
              pickable && selected?.memberId === record.memberId
                ? "bg-slate-200"
                : "",
            ]
              .filter(Boolean)
              .join(" ");
          }}
        />

        {selected && (
          <div className="flex flex-col gap-6 border-t border-gray-100 pt-4">
            <div className="flex flex-row justify-between items-center mx-1">
              <div className="text-gray-400">
                {ADMIN_MANAGE_TEXT.grantModalSelectedUser}
              </div>
              <div className="min-w-20 text-right">
                {selected.name}
                {selected.nickname ? ` (${selected.nickname})` : ""}
              </div>
            </div>
            <div className="flex flex-row justify-between items-center mx-1">
              <div className="text-gray-400">{ADMIN_MANAGE_TEXT.grantModalMemberId}</div>
              <div className="text-right">{selected.memberId}</div>
            </div>
            <div className="flex flex-row justify-between items-center mx-1">
              <div className="text-gray-400">
                {ADMIN_MANAGE_TEXT.grantModalClubAndEnrollment}
              </div>
              <div className="text-right">
                {selected.club ? selected.club : ADMIN_MANAGE_TEXT.rowNoClub} (
                {selected.enrollmentNumber})
              </div>
            </div>
            <div className="flex flex-row justify-between items-start mx-1">
              <div className="font-semibold">
                {ADMIN_MANAGE_TEXT.grantModalTargetLevel}
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="grant-admin-level"
                    checked={level === "SUPER"}
                    onChange={() => setLevel("SUPER")}
                    className="mr-1"
                  />
                  {ADMIN_MANAGE_TEXT.levelDisplay.super}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="grant-admin-level"
                    checked={level === "SUB"}
                    onChange={() => setLevel("SUB")}
                    className="mr-1"
                  />
                  {ADMIN_MANAGE_TEXT.levelDisplay.sub}
                </label>
              </div>
            </div>
            <div className="flex flex-row justify-end items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md font-semibold"
                onClick={() => setSelected(null)}
              >
                {ADMIN_MANAGE_TEXT.grantModalCancelSelection}
              </button>
              <button
                type="button"
                className="px-2 py-1 bg-blue-500 text-white rounded-md font-semibold"
                onClick={() => void handleRegister()}
              >
                {ADMIN_MANAGE_TEXT.grantModalRegister}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
