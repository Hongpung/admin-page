import { requestJson } from "../lib/http/api-fetch";

type ExtendSessionResponse = {
  message?: string;
  expiresInSeconds?: number;
};

export async function extendAdminSession() {
  return requestJson<ExtendSessionResponse>("/api/session/extend", {
    method: "POST",
  });
}
