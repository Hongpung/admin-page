import { describe, expect, it } from "vitest";
import { buildManageUserQueryString } from "./manage-user-query";

describe("buildManageUserQueryString", () => {
  it("builds query string with trimmed username and numeric params", () => {
    const result = buildManageUserQueryString({
      username: "  alice  ",
      clubId: "10",
      role: "ADMIN",
      page: 2,
      pageSize: 20,
    });

    expect(result).toBe("username=alice&clubId=10&role=ADMIN&page=2&pageSize=20");
  });

  it("omits empty username and invalid pageSize", () => {
    const result = buildManageUserQueryString({
      username: "   ",
      pageSize: 0,
    });

    expect(result).toBe("");
  });

  it("keeps page when it is zero", () => {
    const result = buildManageUserQueryString({ page: 0 });
    expect(result).toBe("page=0");
  });
});
