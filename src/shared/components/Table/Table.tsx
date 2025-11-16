"use client";

import type { ReactElement, ReactNode } from "react";
import LoadingIndicator from "../LoadingIndicator";
import {
  bodyMessageCellBase,
  defaultEmptyTextClass,
  defaultShellClass,
} from "./constants";
import { Row, Shell, Td, Th } from "./primitives";
import type { InternalTableProps } from "./types";
import { resolveRowKey } from "./utils";

function TableInner<T>({
  dataSource,
  columns,
  rowKey,
  loading,
  loadingContent,
  error,
  emptyText,
  emptyClassName,
  shellClassName,
  tableClassName,
  messageAreaMinHeightClass,
  rowClassName,
  stickyHeader,
  onRowClick,
}: InternalTableProps<T>) {
  const shell = shellClassName ?? defaultShellClass;
  const table = tableClassName ?? "w-full text-sm";
  const colCount = columns.length;
  const msgMinH = messageAreaMinHeightClass ?? "min-h-[400px]";
  const bodyMessageCellClass = `${bodyMessageCellBase} ${msgMinH}`;

  const hasError = Boolean(error);
  const isEmpty = !loading && !hasError && dataSource.length === 0;

  const emptyMergedClass = [
    bodyMessageCellClass,
    emptyClassName ?? defaultEmptyTextClass,
  ].join(" ");

  const loadingCellClass = `${bodyMessageCellClass} text-gray-500`;
  const errorCellClass = `${bodyMessageCellClass} text-red-500 p-8`;

  return (
    <Shell className={shell}>
      {colCount === 0 ? (
        <>
          {loading && (
            <div className="flex flex-1 min-h-[400px] items-center justify-center">
              {loadingContent ?? <LoadingIndicator />}
            </div>
          )}
          {!loading && hasError && (
            <div className="p-8 text-center text-red-500">{error}</div>
          )}
          {!loading && !hasError && isEmpty && emptyText !== undefined && (
            <div
              className={`flex flex-1 min-h-[400px] items-center justify-center text-center font-bold text-2xl text-stone-400 px-4 ${emptyClassName ?? ""}`}
            >
              {emptyText}
            </div>
          )}
        </>
      ) : (
        <table className={table}>
          <thead className="bg-blue-300">
            <Row>
              {columns.map((col, i) => (
                <Th
                  key={col.colKey ?? `col-${i}`}
                  className={
                    [
                      stickyHeader
                        ? "sticky top-0 z-[1] bg-blue-300 shadow-[0_1px_0_0_rgb(147_197_253)]"
                        : "",
                      col.headerClassName ?? "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  align={col.align}
                >
                  {col.title ?? ""}
                </Th>
              ))}
            </Row>
          </thead>
          <tbody>
            {hasError && (
              <Row>
                <Td colSpan={colCount} className={errorCellClass}>
                  {error}
                </Td>
              </Row>
            )}
            {!hasError && loading && (
              <Row>
                <Td colSpan={colCount} className={loadingCellClass}>
                  <div className={`flex ${msgMinH} items-center justify-center`}>
                    {loadingContent ?? <LoadingIndicator />}
                  </div>
                </Td>
              </Row>
            )}
            {!hasError && !loading && isEmpty && emptyText !== undefined && (
              <Row>
                <Td colSpan={colCount} className={emptyMergedClass}>
                  <div className={`flex ${msgMinH} items-center justify-center`}>
                    {emptyText}
                  </div>
                </Td>
              </Row>
            )}
            {!hasError &&
              !loading &&
              !isEmpty &&
              dataSource.map((record, rowIndex) => {
                const rk = resolveRowKey(record, rowKey);
                const rowCls =
                  typeof rowClassName === "function"
                    ? rowClassName(record, rowIndex)
                    : (rowClassName ?? "");
                return (
                  <Row
                    key={rk}
                    className={rowCls}
                    onClick={
                      onRowClick
                        ? () => onRowClick(record, rowIndex)
                        : undefined
                    }
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(record, rowIndex);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                  >
                    {columns.map((col, colIndex) => {
                      const value =
                        col.dataIndex !== undefined
                          ? (record as Record<string, unknown>)[
                              col.dataIndex as string
                            ]
                          : undefined;
                      const cell =
                        col.render?.(value, record, rowIndex) ??
                        (value as ReactNode);
                      return (
                        <Td
                          key={col.colKey ?? `${String(rk)}-${colIndex}`}
                          className={col.className}
                          align={col.align}
                        >
                          {cell}
                        </Td>
                      );
                    })}
                  </Row>
                );
              })}
          </tbody>
        </table>
      )}
    </Shell>
  );
}

type TableWithParts = (<T>(props: InternalTableProps<T>) => ReactElement) & {
  Shell: typeof Shell;
  Row: typeof Row;
  Th: typeof Th;
  Td: typeof Td;
};

function TableRoot<T>(props: InternalTableProps<T>): ReactElement {
  return <TableInner {...props} />;
}

export const Table = Object.assign(TableRoot, {
  Shell,
  Row,
  Th,
  Td,
}) as TableWithParts;

export default Table;
