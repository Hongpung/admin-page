import {
  updateClubProfile,
  updateSubClubProfile,
  uploadImage,
} from "../api/club-api";
import {
  clubProfileFormFirstMessage,
  parseClubProfileForm,
} from "./club-profile-form";
import type { ClubInfo, KoRole, UpdateClubProfileRequest } from "../types";

type SaveClubDetailParams = {
  club: ClubInfo;
  initialProfileImageUrl: string | null;
  file: File | null;
  profileImageUrl: string | null;
  roleAssignments: Partial<Record<KoRole, number | null>>;
};

type SaveClubDetailResult = {
  profileImageUrl: string | null;
  roleAssignments: Record<KoRole, number | null>;
};

async function saveClubDetailWithPatch(
  {
    club,
    initialProfileImageUrl,
    file,
    profileImageUrl,
    roleAssignments,
  }: SaveClubDetailParams,
  patchProfile: (
    payload: UpdateClubProfileRequest,
  ) => Promise<{ message: string }>,
): Promise<SaveClubDetailResult> {
  const parsed = parseClubProfileForm({
    profileImageUrl,
    profileImageFile: file,
    roleAssignments,
  });

  if (!parsed.success) {
    throw new Error(clubProfileFormFirstMessage(parsed.error));
  }

  let nextProfileImageUrl = profileImageUrl;
  const hasNewImageFile = file instanceof File;

  if (hasNewImageFile) {
    const imageFormData = new FormData();
    imageFormData.append(
      "image",
      file,
      `${club.clubId}-${Date.now()}-${file.name}`,
    );
    imageFormData.append("path", "clubs");

    const uploadedUrl = await uploadImage(imageFormData);
    if (!uploadedUrl) {
      throw new Error("프로필 이미지 업로드에 실패했습니다.");
    }
    nextProfileImageUrl = uploadedUrl;
  }

  const updatePayload: UpdateClubProfileRequest = {
    roleAssignments: parsed.data.roleAssignments,
  };

  if (hasNewImageFile) {
    updatePayload.profileImageUrl = nextProfileImageUrl;
  } else if (profileImageUrl !== initialProfileImageUrl) {
    updatePayload.profileImageUrl = profileImageUrl;
  }

  await patchProfile(updatePayload);

  return {
    profileImageUrl: nextProfileImageUrl,
    roleAssignments: {
      ...parsed.data.roleAssignments,
    } as Record<KoRole, number | null>,
  };
}

export async function saveClubDetail(
  params: SaveClubDetailParams,
): Promise<SaveClubDetailResult> {
  return saveClubDetailWithPatch(params, (payload) =>
    updateClubProfile(params.club.clubId, payload),
  );
}

export async function saveSubClubDetail(
  params: SaveClubDetailParams,
): Promise<SaveClubDetailResult> {
  return saveClubDetailWithPatch(params, updateSubClubProfile);
}
