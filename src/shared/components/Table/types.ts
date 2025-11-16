import type { Key, ReactNode } from "react";

export type Align = "left" | "center" | "right";

export type TableColumn<T> = {
  /** null이어도 헤더 셀(th)은 렌더됩니다. */
  title?: ReactNode | null;
  /** 컬럼 식별자 (없으면 인덱스) */
  colKey?: string;
  dataIndex?: keyof T;
  className?: string;
  headerClassName?: string;
  align?: Align;
  render?: (value: unknown, record: T, index: number) => ReactNode;
};

export type InternalTableProps<T> = {
  dataSource: T[];
  columns: TableColumn<T>[];
  rowKey: keyof T | ((record: T) => Key);
  loading?: boolean;
  loadingContent?: ReactNode;
  error?: ReactNode;
  emptyText?: ReactNode;
  /** 빈 목록 시 본문 셀(td)에만 추가 (가로/세로 가운데 기본 포함) */
  emptyClassName?: string;
  /** 바깥 스크롤 컨테이너 */
  shellClassName?: string;
  tableClassName?: string;
  /** 로딩/빈/에러 상태에서 본문 셀 최소 높이 (기본 min-h-[400px]) */
  messageAreaMinHeightClass?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  /** 세로 스크롤에서 헤더 셀 고정 (shell에 overflow-y-auto 필요) */
  stickyHeader?: boolean;
  onRowClick?: (record: T, index: number) => void;
};
