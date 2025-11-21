import Table from "@admin/shared/components/Table";
import type { SearchMember } from "../../types";

export function ClubRoleMemberTable({
  searchingMembers,
  isLoading,
  columns,
  selectedMemberId,
  onSelectMember,
}: {
  searchingMembers: SearchMember[] | null;
  isLoading: boolean;
  columns: {
    colKey: string;
    title: string;
    align: "left" | "center" | "right";
    className: string;
    headerClassName: string;
    render: (_: unknown, member: SearchMember) => React.ReactNode;
  }[];
  selectedMemberId?: number;
  onSelectMember: (member: SearchMember) => void;
}) {
  return (
    <Table
      dataSource={searchingMembers ?? []}
      columns={columns}
      rowKey="memberId"
      loading={isLoading || searchingMembers === null}
      loadingContent={<div className="py-8 text-gray-500">로딩 중...</div>}
      emptyText="검색 결과가 없습니다."
      emptyClassName="!text-base !font-normal py-8"
      messageAreaMinHeightClass="min-h-[12.5rem]"
      shellClassName="mt-4 h-[16.5rem] max-h-[16.5rem] w-full shrink-0 overflow-y-auto rounded-md border"
      tableClassName="w-full text-sm border-separate border-spacing-0"
      stickyHeader
      onRowClick={onSelectMember}
      rowClassName={(record) =>
        [
          selectedMemberId === record.memberId
            ? "bg-slate-200"
            : "hover:bg-slate-100",
          "cursor-pointer",
        ].join(" ")
      }
    />
  );
}
