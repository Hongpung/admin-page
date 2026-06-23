import { describe, expect, it } from "vitest";
import { applyExternalCreatorFallbackToReservationPayload } from "./apply-external-creator-fallback";
import { enrichCreateReservationFromDetectedText } from "./enrich-create-reservation-from-detected-text";
import { resolveMemberLookup } from "./resolve-member-id-from-search";

describe("resolveMemberLookup", () => {
  it("matches a single strong partial name", () => {
    const resolution = resolveMemberLookup("담당가", [
      { memberId: 7, name: "테스트담당가", nickname: null },
    ]);

    expect(resolution).toMatchObject({
      status: "matched",
      memberId: 7,
    });
  });

  it("returns ambiguous when multiple members are returned", () => {
    const resolution = resolveMemberLookup("담당가", [
      { memberId: 7, name: "테스트담당가", nickname: null },
      { memberId: 8, name: "예시담당가", nickname: null },
    ]);

    expect(resolution.status).toBe("ambiguous");
    if (resolution.status === "ambiguous") {
      expect(resolution.candidates).toHaveLength(2);
    }
  });

  it("returns not_found only when search result is empty", () => {
    expect(resolveMemberLookup("담당가", [])).toEqual({
      status: "not_found",
      query: "담당가",
    });
  });
});

describe("applyExternalCreatorFallbackToReservationPayload", () => {
  it("converts to EXTERNAL only when lookup is not_found", () => {
    expect(
      applyExternalCreatorFallbackToReservationPayload(
        {
          title: "오금반",
          date: "2026-07-06",
          startTime: "13:00",
          endTime: "15:00",
          reservationType: "REGULAR",
          participationAvailable: false,
          creatorName: "담당가",
        },
        { memberLookup: { status: "not_found", query: "담당가" } },
      ),
    ).toEqual({
      title: "오금반",
      date: "2026-07-06",
      startTime: "13:00",
      endTime: "15:00",
      reservationType: "EXTERNAL",
      participationAvailable: false,
      externalCreatorName: "담당가",
    });
  });

  it("keeps REGULAR when lookup is ambiguous", () => {
    const payload = {
      title: "오금반",
      reservationType: "REGULAR",
      participationAvailable: false,
      creatorName: "담당가",
    };

    expect(
      applyExternalCreatorFallbackToReservationPayload(payload, {
        memberLookup: {
          status: "ambiguous",
          query: "담당가",
          candidates: [{ memberId: 7, name: "테스트담당가", score: 80 }],
        },
      }),
    ).toEqual(payload);
  });
});

describe("enrichCreateReservationFromDetectedText", () => {
  const detected = `2026-07-06, 13:00-15:00, 오금반, 담당가 ; REGULAR`;

  it("fills missing fields from canonical detected_text without forcing EXTERNAL", () => {
    const enriched = enrichCreateReservationFromDetectedText(
      { title: "오금반" },
      "2026년 7월 6일부터 7월 10일까지",
      detected,
    );

    expect(enriched).toMatchObject({
      title: "오금반",
      date: "2026-07-06",
      startTime: "13:00",
      endTime: "15:00",
      reservationType: "REGULAR",
      participationAvailable: false,
      creatorName: "담당가",
    });
    expect(enriched).not.toHaveProperty("externalCreatorName");
  });
});
