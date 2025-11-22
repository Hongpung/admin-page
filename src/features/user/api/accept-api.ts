import { requestJson, requestVoid } from "@admin/shared/lib/http/api-fetch";

export async function acceptUsers(signupIds: number[]): Promise<void> {
  await requestVoid("/api/user/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ acceptedSignUpIds: signupIds }),
  });
}

export async function fetchSignupData() {
  return requestJson<unknown[]>("/api/user/accept", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function fetchSignupDataSub() {
  return requestJson<unknown[]>("/api/user/sub/accept", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
