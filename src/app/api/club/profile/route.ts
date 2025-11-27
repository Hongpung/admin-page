import { cookies } from "next/headers";

type RoleAssignmentItemDto = {
  role: string;
  userId: number | null;
};

function toRoleAssignmentDtoList(
  value: unknown
): RoleAssignmentItemDto[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizeItem = (item: unknown): RoleAssignmentItemDto => {
    if (!item || typeof item !== "object") {
      throw new Error("roleAssignments 항목이 올바르지 않습니다.");
    }

    const role = (item as { role?: unknown }).role;
    const userId = (item as { userId?: unknown }).userId;

    if (typeof role !== "string" || role.trim() === "") {
      throw new Error("roleAssignments.role 값이 올바르지 않습니다.");
    }
    if (
      userId !== null &&
      !(typeof userId === "number" && Number.isInteger(userId))
    ) {
      throw new Error("roleAssignments.userId 값이 올바르지 않습니다.");
    }

    return {
      role,
      userId,
    };
  };

  if (Array.isArray(value)) {
    return value.map(normalizeItem);
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([role, userId]) => {
        if (
          userId !== null &&
          !(typeof userId === "number" && Number.isInteger(userId))
        ) {
          throw new Error("roleAssignments.userId 값이 올바르지 않습니다.");
        }

        return {
          role,
          userId: userId as number | null,
        };
      }
    );
  }

  throw new Error("roleAssignments 형식이 올바르지 않습니다.");
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response("Error: Invalid Token", { status: 401 });
    }

    const response = await fetch(`${process.env.BASE_URL}/club/club-profiles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const clubData = await response.json();
    return Response.json(clubData);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response("Error: Invalid Token", { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { clubId } = body;

    if (typeof clubId !== "number" || !Number.isInteger(clubId)) {
      return new Response("Error: clubId is required", { status: 400 });
    }

    const hasProfileImageUrl = Object.prototype.hasOwnProperty.call(
      body,
      "profileImageUrl"
    );
    const hasRoleAssignments = Object.prototype.hasOwnProperty.call(
      body,
      "roleAssignments"
    );

    const nextPatchBody: {
      profileImageUrl?: string | null;
      roleAssignments?: RoleAssignmentItemDto[] | null;
    } = {};

    if (hasProfileImageUrl) {
      const profileImageUrl = body.profileImageUrl;
      if (profileImageUrl !== null && typeof profileImageUrl !== "string") {
        return new Response("Error: profileImageUrl is invalid", {
          status: 400,
        });
      }
      nextPatchBody.profileImageUrl = profileImageUrl as string | null;
    }

    if (hasRoleAssignments) {
      nextPatchBody.roleAssignments = toRoleAssignmentDtoList(
        body.roleAssignments
      );
    }

    const response = await fetch(
      `${process.env.BASE_URL}/club/${clubId}/profile`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextPatchBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw Error(
        "Response Error" +
          ` (${response.status}) :` +
          (errorData.message || response.statusText)
      );
    }

    return Response.json(
      { message: "동아리 정보 업데이트 성공" },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return Response.json({ message: `Error: ${e}` }, { status: 400 });
  }
}
