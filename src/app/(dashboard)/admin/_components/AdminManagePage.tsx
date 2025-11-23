"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FAB from "@admin/shared/components/FAB";
import VisibleLengthSelect from "@admin/shared/components/VisibleLengthSelect";
import { changeAdminLevel, revokeAdmin } from "@admin/features/admin/api/admin-api";
import {
  ADMIN_MANAGE_MESSAGE,
  ADMIN_MANAGE_TEXT,
} from "@admin/features/admin/constants";
import {
  AdminManageTableSection,
  GrantAdminSelectModal,
  ManageAdminModal,
} from "@admin/features/admin/components";
import {
  adminListQueryOptions,
  adminQueryKeys,
  adminSessionQueryOptions,
} from "@admin/features/admin/queries";
import { levelLabel, toAdminErrorMessage } from "@admin/features/admin/service";
import type { AdminLevel, AdminSimple } from "@admin/features/admin/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function AdminManagePage() {
  const queryClient = useQueryClient();
  const adminsQuery = useQuery(adminListQueryOptions());
  const sessionQuery = useQuery(adminSessionQueryOptions());

  const [manageAdmin, setManageAdmin] = useState<AdminSimple | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20);

  const admins = adminsQuery.data ?? null;
  const sessionMemberId = sessionQuery.data?.memberId ?? null;
  const sessionAdminLevel = (sessionQuery.data?.adminLevel ?? null) as
    | AdminLevel
    | null;
  const canMutate = sessionAdminLevel !== "SUB";
  const listError = toAdminErrorMessage(
    adminsQuery.error,
    ADMIN_MANAGE_MESSAGE.listLoadFailed,
  );
  const sessionError = toAdminErrorMessage(
    sessionQuery.error,
    ADMIN_MANAGE_MESSAGE.sessionLoadFailed,
  );

  const adminMemberIds = useMemo(() => {
    if (!admins) return new Set<number>();
    return new Set(admins.map((a) => a.memberId));
  }, [admins]);

  const changeAdminLevelMutation = useMutation({
    mutationFn: ({
      memberId,
      adminLevel,
    }: {
      memberId: number;
      adminLevel: AdminLevel;
    }) => changeAdminLevel(memberId, adminLevel),
  });

  const revokeAdminMutation = useMutation({
    mutationFn: revokeAdmin,
  });

  const sortedAdmins = useMemo(() => {
    if (!admins) return [];
    return [...admins].sort((a, b) => a.enrollmentNumber - b.enrollmentNumber);
  }, [admins]);

  const totalCount = sortedAdmins.length;

  const maxPage = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const effectivePage = useMemo(
    () => Math.min(page, Math.max(0, maxPage - 1)),
    [maxPage, page],
  );

  const pagedAdmins = useMemo(() => {
    const start = effectivePage * pageSize;
    return sortedAdmins.slice(start, start + pageSize);
  }, [effectivePage, sortedAdmins, pageSize]);

  const handleAdminSave = async (adminLevel: AdminLevel) => {
    if (!manageAdmin) return;
    try {
      await changeAdminLevelMutation.mutateAsync({
        memberId: manageAdmin.memberId,
        adminLevel,
      });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.list() });
      window.alert(ADMIN_MANAGE_MESSAGE.changeSuccess);
      setManageAdmin(null);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : ADMIN_MANAGE_MESSAGE.changeFailed,
      );
    }
  };

  const handleAdminRevoke = () => {
    const target = manageAdmin;
    if (!target) return;
    if (!window.confirm(ADMIN_MANAGE_MESSAGE.confirmRevoke(target.name))) {
      return;
    }
    void (async () => {
      try {
        await revokeAdminMutation.mutateAsync(target.memberId);
        await queryClient.invalidateQueries({ queryKey: adminQueryKeys.list() });
        window.alert(ADMIN_MANAGE_MESSAGE.revokeSuccess);
        setManageAdmin(null);
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : ADMIN_MANAGE_MESSAGE.revokeFailed,
        );
      }
    })();
  };

  const adminColumns = useMemo(
    () => [
      {
        colKey: "name",
        title: ADMIN_MANAGE_TEXT.columnTitleName,
        className: "min-w-40",
        render: (_: unknown, row: AdminSimple) => (
          <>
            {row.name}
            {row.nickname ? ` (${row.nickname})` : ""}
          </>
        ),
      },
      {
        colKey: "club",
        title: ADMIN_MANAGE_TEXT.columnTitleClub,
        className: "min-w-28",
        render: (_: unknown, row: AdminSimple) => (
          <>
            {row.club ?? ADMIN_MANAGE_TEXT.rowNoClub} {`(${row.enrollmentNumber})`}
          </>
        ),
      },
      {
        colKey: "adminLevel",
        title: ADMIN_MANAGE_TEXT.columnTitleAdminLevel,
        className: "min-w-24 text-center",
        render: (_: unknown, row: AdminSimple) => levelLabel(row.adminLevel),
      },
      {
        colKey: "actions",
        title: "",
        className: "min-w-32",
        render: (_: unknown, row: AdminSimple) => {
          const isSelf =
            sessionMemberId !== null && row.memberId === sessionMemberId;
          if (!canMutate || isSelf) {
            return isSelf ? (
              <span className="text-xs text-gray-400">{ADMIN_MANAGE_TEXT.rowSelf}</span>
            ) : null;
          }
          return (
            <div
              className="flex flex-col items-center cursor-pointer text-center"
              onClick={() => setManageAdmin(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setManageAdmin(row);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="px-2 py-0.5 rounded-md text-sm bg-green-200">
                {ADMIN_MANAGE_TEXT.rowManageAction}
              </div>
            </div>
          );
        },
      },
    ],
    [canMutate, sessionMemberId],
  );

  return (
    <>
      <div className="text-lg font-medium ml-2 mt-2">
        {ADMIN_MANAGE_TEXT.pageTitle}
        {admins !== null ? ` (${totalCount})` : ""}
      </div>

      <div className="flex flex-row justify-between items-center gap-4 flex-wrap px-2 mt-2">
        {sessionError && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {ADMIN_MANAGE_TEXT.sessionGuidePrefix}: {sessionError}{" "}
            {ADMIN_MANAGE_TEXT.sessionGuideSuffix}
          </div>
        )}

        {sessionAdminLevel === "SUB" && (
          <div className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded px-3 py-2">
            {ADMIN_MANAGE_TEXT.subAdminReadonly}
          </div>
        )}

        {canMutate && (
          <div className="text-sm text-gray-500">
            {ADMIN_MANAGE_TEXT.grantGuidePrefix}{" "}
            <span className="font-medium text-gray-700">
              {ADMIN_MANAGE_TEXT.grantGuidePlus}
            </span>{" "}
            {ADMIN_MANAGE_TEXT.grantGuideSuffix}
          </div>
        )}

        {admins !== null && (
          <VisibleLengthSelect
            value={pageSize}
            options={PAGE_SIZE_OPTIONS}
            onChange={(next) => {
              const n = next as (typeof PAGE_SIZE_OPTIONS)[number];
              setPageSize(PAGE_SIZE_OPTIONS.includes(n) ? n : 20);
              setPage(0);
            }}
            className="flex flex-row gap-3 h-10 items-center shrink-0"
          />
        )}
      </div>

      {listError && <div className="mx-2 mt-2 text-sm text-red-700">{listError}</div>}

      <AdminManageTableSection
        dataSource={pagedAdmins}
        columns={adminColumns}
        page={effectivePage}
        maxPage={maxPage}
        onPageChange={setPage}
        isLoading={admins === null}
      />

      {canMutate && <FAB color="gray" onClick={() => setGrantModalOpen(true)} />}

      <GrantAdminSelectModal
        visible={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        adminMemberIds={adminMemberIds}
        sessionMemberId={sessionMemberId}
      />

      <ManageAdminModal
        admin={manageAdmin}
        onClose={() => setManageAdmin(null)}
        onSave={(lvl) => void handleAdminSave(lvl)}
        onRevoke={handleAdminRevoke}
      />
    </>
  );
}
