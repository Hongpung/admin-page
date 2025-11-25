import { describe, expect, it } from "vitest";
import {
  createMemberDropId,
  createSlotDropId,
  getClientYFromDragEvent,
  parseMemberDropId,
  parseSlotDropId,
} from "./drop-ids.lib";

describe("drop-ids.lib", () => {
  it("멤버 드롭 식별자 생성과 파싱은 역변환 가능하다", () => {
    const id = createMemberDropId(33);
    expect(id).toBe("member-drop:33");
    expect(parseMemberDropId(id)).toBe(33);
  });

  it("멤버 드롭 식별자 파서는 잘못된 식별자를 거부한다", () => {
    expect(parseMemberDropId("member-drop:abc")).toBeNull();
    expect(parseMemberDropId("slot-drop:inactive:1")).toBeNull();
    expect(parseMemberDropId(10)).toBeNull();
  });

  it("슬롯 드롭 식별자 생성과 파싱은 역변환 가능하다", () => {
    const id = createSlotDropId("active", 2);
    expect(id).toBe("slot-drop:active:2");
    expect(parseSlotDropId(id)).toEqual({ columnId: "active", index: 2 });
  });

  it("슬롯 파서는 형식이 잘못된 값을 거부한다", () => {
    expect(parseSlotDropId("slot-drop:foo:0")).toBeNull();
    expect(parseSlotDropId("slot-drop:active:-1")).toBeNull();
    expect(parseSlotDropId("slot-drop:inactive:a")).toBeNull();
    expect(parseSlotDropId(99)).toBeNull();
  });

  it("드래그 이벤트에서 마우스 세로 좌표를 추출한다", () => {
    const event = new MouseEvent("mousemove", { clientY: 123 });
    expect(getClientYFromDragEvent(event)).toBe(123);
  });
});
