"use client";

import { palette } from "../../constants/session-ui.constants";

export function BookmarkRegularIcon() {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill={palette.blue500}
      aria-hidden
    >
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
