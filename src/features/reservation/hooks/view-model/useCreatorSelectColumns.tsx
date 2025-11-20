"use client";

import { useMemo } from "react";
import type { Member } from "../../types";

type Args = {
  creatorId?: number;
};

export function useCreatorSelectColumns({ creatorId }: Args) {
  return useMemo(
    () => [
      {
        colKey: "name",
        title: "이름 (패명 · 학번)",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: Member) => (
          <div>
            {member.name}
            {member.nickname ? ` (${member.nickname})` : ""}
            {member.enrollmentNumber != null &&
            member.enrollmentNumber !== "" ? (
              <> ({member.enrollmentNumber})</>
            ) : null}
            {creatorId === member.memberId && (
              <span className="text-gray-400 text-sm ml-1">이전 선택</span>
            )}
          </div>
        ),
      },
      {
        colKey: "club",
        title: "동아리",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: Member) => member.club ?? "—",
      },
      {
        colKey: "role",
        title: "역할",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: Member) =>
          member.role?.length ? member.role.join(", ") : "—",
      },
    ],
    [creatorId],
  );
}
