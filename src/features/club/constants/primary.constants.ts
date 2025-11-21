import type { ColumnId } from "../types/primary-members";

export const MEMBER_DROP_ID_PREFIX = "member-drop:";
export const SLOT_DROP_ID_PREFIX = "slot-drop:";

export const COLUMN_META: Record<
  ColumnId,
  { title: string; emptyMessage: string }
> = {
  inactive: {
    title: "비활성 멤버",
    emptyMessage: "비활성 멤버가 없습니다.",
  },
  active: {
    title: "활성 멤버 (주요 활동 멤버)",
    emptyMessage: "활성 멤버가 없습니다. 왼쪽에서 옮겨 주세요.",
  },
};
