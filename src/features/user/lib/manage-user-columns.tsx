import type { TableColumn } from "@admin/shared/components/Table";
import type { User } from "../types";

type Args = {
  onSelectUser: (user: User) => void;
};

export function createManageUserColumns({
  onSelectUser,
}: Args): TableColumn<User>[] {
  return [
    {
      colKey: "name",
      title: "이름 (패명)",
      className: "min-w-48",
      render: (_: unknown, user: User) => (
        <>
          {user.name}
          {user.nickname ? ` (${user.nickname})` : ""}
        </>
      ),
    },
    {
      colKey: "club",
      title: "동아리 (학번)",
      className: "min-w-24",
      render: (_: unknown, user: User) => (
        <>
          {user.club ? user.club : "무소속"} ({user.enrollmentNumber})
        </>
      ),
    },
    {
      colKey: "email",
      title: "이메일",
      dataIndex: "email",
      className: "min-w-96",
    },
    {
      colKey: "role",
      title: "역할",
      className: "min-w-32",
      render: (_: unknown, user: User) => (
        <span className={user.role.length === 0 ? "text-gray-300" : undefined}>
          {user.role.length === 0 ? "-" : user.role.join(", ")}
        </span>
      ),
    },
    {
      colKey: "actions",
      title: "",
      className: "min-w-32",
      render: (_: unknown, user: User) => (
        <div
          className="flex flex-col items-center cursor-pointer text-center"
          onClick={() => onSelectUser(user)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            onSelectUser(user);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="px-2 py-0.5 rounded-md text-sm bg-gray-200">관리</div>
        </div>
      ),
    },
  ];
}
