export const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export const bodyMessageCellBase = "text-center align-middle [&>*]:mx-auto";

export const defaultEmptyTextClass = "font-bold text-2xl text-stone-400 py-16 px-4";

export const defaultShellClass =
  "flex flex-col mx-2 mt-4 border rounded-md flex-grow border-blue-100 mb-2 overflow-y-auto min-h-[672px]";

/** TableSection 안 카드 안에 넣을 때 바깥 테두리/마진 제거, 스크롤만 담당 */
export const TABLE_SHELL_IN_SECTION_CLASS =
  "flex flex-col w-full flex-1 min-h-0 overflow-y-auto border-0 rounded-none shadow-none mx-0 mt-0 mb-0 p-0";
