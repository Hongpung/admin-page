import type { TableColumn } from "@admin/shared/components/Table";
import type { SignUpRequestUser } from "../types";

type Args = {
  allChecked: boolean;
  someChecked: boolean;
  selectedIds: number[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: number, checked: boolean) => void;
  onAcceptOne: (user: SignUpRequestUser) => Promise<void>;
};

export function createAcceptUserColumns({
  allChecked,
  someChecked,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onAcceptOne,
}: Args): TableColumn<SignUpRequestUser>[] {
  return [
    {
      colKey: "checkbox",
      title: (
        <input
          type="checkbox"
          checked={allChecked}
          ref={(el) => {
            if (el) el.indeterminate = !allChecked && someChecked;
          }}
          onChange={(e) => onSelectAll(e.target.checked)}
        />
      ),
      className: "min-w-8",
      render: (_: unknown, user: SignUpRequestUser) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(user.signupId)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onSelectOne(user.signupId, e.target.checked)}
        />
      ),
    },
    {
      colKey: "name",
      title: "이름 (패명)",
      className: "min-w-48",
      render: (_: unknown, user: SignUpRequestUser) => (
        <>
          {user.name}
          {user.nickname ? ` (${user.nickname})` : ""}
        </>
      ),
    },
    {
      colKey: "club",
      title: "동아리",
      dataIndex: "club",
      className: "min-w-64",
    },
    {
      colKey: "email",
      title: "이메일",
      dataIndex: "email",
      className: "min-w-96",
    },
    {
      colKey: "action",
      title: "확인",
      className: "min-w-48",
      render: (_: unknown, user: SignUpRequestUser) => (
        <button
          type="button"
          className="min-w-48 text-center"
          onClick={(e) => {
            e.stopPropagation();
            void onAcceptOne(user);
          }}
        >
          수락
        </button>
      ),
    },
  ];
}
