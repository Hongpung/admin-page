import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseClubIdQuery } from "../../lib/club-url";
import type { ClubInfo } from "../../types";

export function useSelectedClubFromUrl(clubs: ClubInfo[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDetailDirty, setIsDetailDirty] = useState(false);

  const parsedClubIdQuery = parseClubIdQuery(searchParams.get("clubId"));

  const selectedClub = useMemo(() => {
    if (parsedClubIdQuery.kind !== "valid") return null;
    return clubs.find((club) => club.clubId === parsedClubIdQuery.clubId) ?? null;
  }, [clubs, parsedClubIdQuery]);

  useEffect(() => {
    if (parsedClubIdQuery.kind !== "invalid") return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("clubId");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [parsedClubIdQuery, pathname, router, searchParams]);

  const selectClub = (nextClub: ClubInfo) => {
    if (selectedClub?.clubId === nextClub.clubId) return;

    if (isDetailDirty) {
      const ok = window.confirm(
        "저장되지 않은 변경 사항이 있습니다. 이동하면 변경 내용이 사라집니다. 계속하시겠습니까?",
      );
      if (!ok) return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("clubId", String(nextClub.clubId));
    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    setIsDetailDirty(false);
  };

  return {
    selectedClub,
    isDetailDirty,
    setIsDetailDirty,
    selectClub,
  };
}
