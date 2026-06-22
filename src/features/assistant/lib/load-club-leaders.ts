import "server-only";

import type { ClubLeaderInfo } from "@admin/features/assistant/types/club-leader.types";
import { z } from "zod";

const nullableString = z.union([z.string(), z.null()]);

/** openapi: ClubMemberItemResDto */
const clubMemberItemSchema = z
  .object({
    memberId: z.number().optional(),
    name: z.string().optional(),
    nickname: nullableString.optional(),
    email: z.string().optional(),
    enrollmentNumber: z.string().optional(),
    club: nullableString.optional(),
    role: z.array(z.string()).optional(),
    roleAssignment: z.array(z.string()).optional(),
    profileImageUrl: nullableString.optional(),
    instagramUrl: nullableString.optional(),
    blogUrl: nullableString.optional(),
  })
  .passthrough();

/** openapi: ClubInfoRoleItemResDto */
const clubInfoRoleItemSchema = z
  .object({
    role: z.string(),
    member: z.union([clubMemberItemSchema, z.null()]).optional(),
  })
  .passthrough();

/** openapi: ClubInfoListResDto */
const clubInfoListItemSchema = z
  .object({
    clubId: z.coerce.number(),
    clubName: z.string(),
    profileImage: nullableString.optional(),
    roleData: z.array(clubInfoRoleItemSchema).default([]),
  })
  .passthrough();

const clubProfilesSchema = z.array(clubInfoListItemSchema);

type ClubProfileListItem = z.infer<typeof clubInfoListItemSchema>;

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

function normalizeClubProfilesPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["data", "clubs", "items", "clubProfiles"] as const) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return payload;
}

function extractClubLeaders(clubs: ClubProfileListItem[]): ClubLeaderInfo[] {
  const leaders: ClubLeaderInfo[] = [];

  for (const club of clubs) {
    const leaderItem = club.roleData.find((item) => item.role === "패짱");
    const member = leaderItem?.member;
    if (!member || typeof member !== "object") continue;

    const leaderMemberId = member.memberId;
    const leaderName = member.name?.trim();
    if (
      typeof leaderMemberId !== "number" ||
      !Number.isInteger(leaderMemberId) ||
      leaderMemberId <= 0 ||
      !leaderName
    ) {
      continue;
    }

    const nickname =
      typeof member.nickname === "string" && member.nickname.trim()
        ? member.nickname.trim()
        : undefined;

    leaders.push({
      clubId: club.clubId,
      clubName: club.clubName,
      leaderMemberId,
      leaderName,
      leaderNickname: nickname,
    });
  }

  return leaders.sort((a, b) => a.clubName.localeCompare(b.clubName, "ko"));
}

export async function loadClubLeaders(token: string): Promise<ClubLeaderInfo[]> {
  const response = await fetch(`${requireBaseUrl()}/club/club-profiles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("동아리 패짱 목록을 불러오지 못했습니다.");
  }

  const payload: unknown = await response.json();
  const parsed = clubProfilesSchema.safeParse(
    normalizeClubProfilesPayload(payload),
  );
  if (!parsed.success) {
    console.error("club-profiles parse failed:", parsed.error.flatten());
    throw new Error("동아리 패짱 응답 형식이 올바르지 않습니다.");
  }

  return extractClubLeaders(parsed.data);
}

export function findClubLeader(
  leaders: ClubLeaderInfo[],
  clubName: string,
): ClubLeaderInfo | null {
  const normalized = clubName.trim().toLowerCase();
  if (!normalized) return null;

  return (
    leaders.find(
      (leader) => leader.clubName.trim().toLowerCase() === normalized,
    ) ?? null
  );
}
