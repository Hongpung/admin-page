"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import type { ClubInfo, KoRole } from "../../types";

const DISPLAY_CARD_ROLES: KoRole[] = ["패짱", "상쇠"] as const;

export function ClubCard({
  club,
  isSelected,
  onSelect,
}: {
  club: ClubInfo;
  isSelected: boolean;
  onSelect: (club: ClubInfo) => void;
}) {
  const getRoleAssignee = (roleName: string) => {
    const roleItem = club.roleData.find((item) => item.role === roleName);
    return roleItem?.member.name ? (
      <span className="font-medium text-gray-700">
        {roleItem.member.name}
        {roleItem.member.nickname ? ` (${roleItem.member.nickname})` : ""}
      </span>
    ) : (
      <span className="font-medium text-gray-300">-</span>
    );
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(club)}
      className={`w-full cursor-pointer rounded-lg border-2 p-4 text-left transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="flex gap-4">
        <div className="shrink-0">
          {club.profileImage ? (
            <div className="relative size-16 overflow-hidden rounded border border-gray-200 bg-background">
              <Image
                src={club.profileImage}
                alt={club.clubName}
                fill
                sizes="64px"
                className="object-cover object-center"
              />
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded bg-gray-100 text-gray-400">
              <ImageIcon />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <h3 className="truncate font-semibold text-gray-900">
            {club.clubName}
          </h3>

          <div className="flex flex-col gap-2 text-sm">
            {DISPLAY_CARD_ROLES.map((roleName) => (
              <div key={roleName} className="flex items-center gap-1">
                <span className="text-gray-500">{roleName}:</span>
                {getRoleAssignee(roleName)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
