"use client";

import type { ReactNode } from "react";
import Pagination from "@admin/shared/components/Pagination";
import Table, {
  TABLE_SHELL_IN_SECTION_CLASS,
} from "@admin/shared/components/Table";
import TableSection from "@admin/shared/components/TableSection";
import { ADMIN_MANAGE_TEXT } from "../../constants";
import type { AdminSimple } from "../../types";

type Props = {
  dataSource: AdminSimple[];
  columns: {
    colKey: string;
    title: string;
    className?: string;
    render: (value: unknown, row: AdminSimple) => ReactNode;
  }[];
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
};

export function AdminManageTableSection({
  dataSource,
  columns,
  page,
  maxPage,
  onPageChange,
  isLoading,
}: Props) {
  return (
    <TableSection
      footer={
        <Pagination
          className="!mt-0"
          page={page}
          maxPage={maxPage}
          onPageChange={onPageChange}
          showWhenSinglePage
        />
      }
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="memberId"
        loading={isLoading}
        emptyText={ADMIN_MANAGE_TEXT.tableEmptyText}
        shellClassName={TABLE_SHELL_IN_SECTION_CLASS}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-blue-100" : "")}
      />
    </TableSection>
  );
}
