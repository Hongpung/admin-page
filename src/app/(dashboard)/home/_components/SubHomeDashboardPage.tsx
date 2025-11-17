"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ClubInfoRoleItem } from "@admin/features/club";
import { DISPLAY_ROLES } from "@admin/features/club/constants/club-detail.constants";
import {
  subClubPrimaryMembersQueryOptions,
  subClubProfileQueryOptions,
} from "@admin/features/club/queries/club-query-options";
import { acceptUserListQueryOptions } from "@admin/features/user/queries";

type DashboardCardProps = {
  title: string;
  href: string;
  hrefLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "데이터를 불러오지 못했습니다.";
}

function DashboardCard({
  title,
  href,
  hrefLabel,
  children,
  footer,
}: DashboardCardProps) {
  return (
    <div className="flex h-full min-h-[340px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm col-span-1">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <Link
          href={href}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {hrefLabel}
        </Link>
      </div>
      <div className="min-h-0 flex-1 p-4">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}
function RoleAssignmentList({ roleData }: { roleData: ClubInfoRoleItem[] }) {
  if (roleData.length === 0) {
    return (
      <p className="text-sm text-gray-500">등록된 역할 정보가 없습니다.</p>
    );
  }

  const assigneeMap = new Map(
    roleData.map((item) => [item.role, item.member] as const),
  );

  return (
    <ul className="space-y-2 text-sm">
      {DISPLAY_ROLES.map((roleName) => {
        const assignee = assigneeMap.get(roleName);

        return (
          <li
            key={roleName}
            className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <span className="text-gray-600">{roleName}</span>
            <span className="truncate font-medium text-gray-900">
              {assignee
                ? `${assignee.name}${assignee.nickname ? ` (${assignee.nickname})` : ""}`
                : "-"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function SubHomeDashboardPage() {
  const clubProfileQuery = useQuery(subClubProfileQueryOptions());
  const primaryMembersQuery = useQuery(subClubPrimaryMembersQueryOptions());
  const signupUsersQuery = useQuery(acceptUserListQueryOptions(true));

  const primaryMemberCount = primaryMembersQuery.data?.length ?? null;
  const signupUserCount = signupUsersQuery.data?.length ?? null;

  return (
    <div className="box-border w-full px-4 py-4 space-y-8">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">
        {clubProfileQuery.data?.clubName
          ? `${clubProfileQuery.data.clubName} 대시보드`
          : "대시보드"}
      </h1>

      <div className="grid grid-cols-1 gap-3 lg:auto-rows-fr lg:grid-cols-3">
        <DashboardCard
          title="가입 신청 유저"
          href="/user/sub/accept"
          hrefLabel="바로가기"
        >
          {signupUsersQuery.isLoading ? (
            <p className="text-sm text-gray-400">
              가입 신청 목록을 불러오는 중입니다.
            </p>
          ) : signupUsersQuery.error ? (
            <p className="text-sm text-red-600">
              {readErrorMessage(signupUsersQuery.error)}
            </p>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <p className="text-sm text-gray-500">현재 가입 신청 유저</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-gray-900">
                {signupUserCount ?? "-"}명
              </p>
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="동아리 정보"
          href="/club/sub/profile"
          hrefLabel="상세 보기"
        >
          {clubProfileQuery.isLoading ? (
            <p className="text-sm text-gray-400">
              동아리 정보를 불러오는 중입니다.
            </p>
          ) : clubProfileQuery.error ? (
            <p className="text-sm text-red-600">
              {readErrorMessage(clubProfileQuery.error)}
            </p>
          ) : !clubProfileQuery.data ? (
            <p className="text-sm text-gray-500">동아리 정보가 없습니다.</p>
          ) : (
            <div className="flex h-full flex-col gap-3">
              <RoleAssignmentList roleData={clubProfileQuery.data.roleData} />
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title={`주 활동 멤버 ${primaryMemberCount ?? "-"}명`}
          href="/club/sub/primary-member"
          hrefLabel="관리하기"
        >
          {primaryMembersQuery.isLoading ? (
            <p className="text-sm text-gray-400">
              주 활동 멤버 정보를 불러오는 중입니다.
            </p>
          ) : primaryMembersQuery.error ? (
            <p className="text-sm text-red-600">
              {readErrorMessage(primaryMembersQuery.error)}
            </p>
          ) : !primaryMembersQuery.data ||
            primaryMembersQuery.data.length === 0 ? (
            <p className="text-sm text-gray-500">
              등록된 주 활동 멤버가 없습니다.
            </p>
          ) : (
            <ul className="max-h-full space-y-2 overflow-y-auto pr-1 text-sm">
              {primaryMembersQuery.data.map((member) => (
                <li
                  key={member.memberId}
                  className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <p className="font-medium text-gray-900">
                    {member.name}
                    {member.nickname ? ` (${member.nickname})` : ""}
                  </p>
                  <p className="text-xs text-gray-500">{member.email || "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
