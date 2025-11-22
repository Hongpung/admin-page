export function buildManageUserQueryString({
  username,
  clubId,
  role,
  page,
  pageSize,
}: {
  username?: string;
  clubId?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (username && username.trim() !== "") {
    params.set("username", username.trim());
  }
  if (clubId) {
    params.set("clubId", clubId);
  }
  if (role) {
    params.set("role", role);
  }
  if (typeof page === "number") {
    params.set("page", String(page));
  }
  if (typeof pageSize === "number" && pageSize > 0) {
    params.set("pageSize", String(pageSize));
  }
  return params.toString();
}
