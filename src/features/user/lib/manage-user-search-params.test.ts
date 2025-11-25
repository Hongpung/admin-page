import { describe, expect, it } from "vitest";
import {
  MANAGE_USER_DEFAULT_PAGE_SIZE,
  MANAGE_USER_PAGE_SIZE_OPTIONS,
} from "../constants/manage-user-page";
import {
  applyManageUserSearchParams,
  parseManageUserPageSize,
} from "./manage-user-search-params";

describe("parseManageUserPageSize", () => {
  it("returns parsed page size when allowed option", () => {
    const params = new URLSearchParams("pageSize=10");
    expect(parseManageUserPageSize(params)).toBe(10);
  });

  it("returns default when page size is missing", () => {
    const params = new URLSearchParams();
    expect(parseManageUserPageSize(params)).toBe(MANAGE_USER_DEFAULT_PAGE_SIZE);
  });

  it("returns default when page size is invalid", () => {
    const params = new URLSearchParams("pageSize=999");
    expect(parseManageUserPageSize(params)).toBe(MANAGE_USER_DEFAULT_PAGE_SIZE);
  });

  it("guards against non-numeric value", () => {
    const params = new URLSearchParams("pageSize=abc");
    expect(parseManageUserPageSize(params)).toBe(MANAGE_USER_DEFAULT_PAGE_SIZE);
    expect(MANAGE_USER_PAGE_SIZE_OPTIONS).toContain(MANAGE_USER_DEFAULT_PAGE_SIZE);
  });
});

describe("applyManageUserSearchParams", () => {
  it("applies values with expected normalization rules", () => {
    const params = new URLSearchParams("keyword=old&clubId=1&role=MEMBER&page=3");

    applyManageUserSearchParams(params, {
      page: -2,
      keyword: "  new  ",
      clubId: "2",
      role: "ADMIN",
      pageSize: 50,
    });

    expect(params.toString()).toBe("keyword=new&clubId=2&role=ADMIN&page=0&pageSize=50");
  });

  it("removes keyword, clubId, role when sentinel or blank value is used", () => {
    const params = new URLSearchParams(
      "keyword=keep&clubId=100&role=MEMBER&page=1&pageSize=20",
    );

    applyManageUserSearchParams(params, {
      keyword: "   ",
      clubId: "none",
      role: "none",
    });

    expect(params.toString()).toBe("page=1&pageSize=20");
  });
});
