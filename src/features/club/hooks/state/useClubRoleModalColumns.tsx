import { useMemo } from "react";
import type { SearchMember } from "../../types";

export function useClubRoleModalColumns(currentAssigneeId?: number) {
  return useMemo(
    () => [
      {
        colKey: "name",
        title: "이름 (닉네임 · 학번)",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: SearchMember) => (
          <div>
            {member.name}
            {member.nickname ? ` (${member.nickname})` : ""}
            {currentAssigneeId === member.memberId ? (
              <span className="ml-1 text-sm text-gray-400">현재 지정</span>
            ) : null}
          </div>
        ),
      },
      {
        colKey: "club",
        title: "동아리",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: SearchMember) => member.club ?? "-",
      },
      {
        colKey: "role",
        title: "역할",
        align: "left" as const,
        className: "text-left align-top",
        headerClassName: "text-left",
        render: (_: unknown, member: SearchMember) =>
          member.role?.length ? member.role.join(", ") : "-",
      },
    ],
    [currentAssigneeId],
  );
}
