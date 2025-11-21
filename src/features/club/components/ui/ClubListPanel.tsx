import type { ClubInfo } from "../../types";
import { ClubCard } from "./ClubCard";

export function ClubListPanel({
  clubs,
  selectedClubId,
  onSelect,
}: {
  clubs: ClubInfo[];
  selectedClubId?: number;
  onSelect: (club: ClubInfo) => void;
}) {
  return (
    <aside className="sticky top-6 col-span-1 max-h-[calc(100vh-9rem)] self-start overflow-y-auto pr-1">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">동아리 목록</h2>
        <div className="space-y-3 pb-4">
          {clubs.map((club) => (
            <ClubCard
              key={club.clubId}
              club={club}
              isSelected={selectedClubId === club.clubId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
