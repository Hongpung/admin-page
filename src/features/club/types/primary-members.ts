import type { ClubMember } from "../types";

export type ColumnId = "inactive" | "active";

export type BoardState = {
  inactive: number[];
  active: number[];
};

export type BoardMember = ClubMember & {
  updatedAt?: string;
};

export type DropPreview = {
  columnId: ColumnId;
  index: number;
};

export type DraggingState = {
  memberId: number;
  sourceColumn: ColumnId;
  sourceIndex: number;
  overlayWidth: number;
};
