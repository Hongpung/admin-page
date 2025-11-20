"use client";

import { useState } from "react";
import type { Member } from "../../types";

export function useCreatorSelectState() {
  const [selectedMember, selectMember] = useState<Member | undefined>(
    undefined,
  );

  return { selectedMember, selectMember };
}
