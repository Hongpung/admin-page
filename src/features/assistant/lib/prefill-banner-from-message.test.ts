import { describe, expect, it } from "vitest";
import { analyzeAssistantToolSchemaGaps } from "./format-assistant-missing-fields";
import {
  enrichAnalysisWithBannerFromLookup,
  resolveBannerIdFromLookup,
} from "./enrich-banner-from-lookup";
import {
  enrichAnalysisWithBannerMessagePrefill,
  extractBannerFieldsFromMessage,
  extractBannerOwnerFromMessage,
} from "./prefill-banner-from-message";
import { inferPrefetchReadToolCalls } from "./infer-prefetch-read-tool-calls";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

const CREATE_MESSAGE =
  '홍풍 배너를 2026-08-01부터 2026-08-31까지 등록해줘. 이미지 https://cdn.example.com/banner.jpg 링크 https://hongpung.com/event';

const UPDATE_MESSAGE = '"홍풍" 배너 owner를 홍풍어드민으로 수정해줘';

describe("extractBannerFieldsFromMessage", () => {
  it("parses owner, date range, image url, and href from natural language", () => {
    const fields = extractBannerFieldsFromMessage(CREATE_MESSAGE);

    expect(fields.owner).toBe("홍풍");
    expect(fields.startDate).toBe("2026-08-01");
    expect(fields.endDate).toBe("2026-08-31");
    expect(fields.bannerImgUrl).toBe("https://cdn.example.com/banner.jpg");
    expect(fields.href).toBe("https://hongpung.com/event");
  });

  it("parses relative date ranges", () => {
    const fields = extractBannerFieldsFromMessage("내일부터 모레까지 배너 등록");

    expect(fields.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fields.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("extractBannerOwnerFromMessage", () => {
  it("extracts quoted owner for update requests", () => {
    expect(extractBannerOwnerFromMessage(UPDATE_MESSAGE)).toBe("홍풍");
  });
});

describe("enrichAnalysisWithBannerMessagePrefill", () => {
  it("prefills create payload and reduces schema gaps", () => {
    const enriched = enrichAnalysisWithBannerMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "CREATE_BANNER",
          payload: {},
        },
      },
      CREATE_MESSAGE,
    );

    expect(enriched.action?.type).toBe("CREATE_BANNER");
    expect(enriched.action?.payload).toMatchObject({
      owner: "홍풍",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      bannerImgUrl: "https://cdn.example.com/banner.jpg",
      href: "https://hongpung.com/event",
    });

    const gaps = analyzeAssistantToolSchemaGaps(
      "banner_create",
      enriched.action?.payload ?? {},
    );
    expect(gaps).toEqual([]);
  });

  it("prefills update payload without overwriting existing bannerId", () => {
    const enriched = enrichAnalysisWithBannerMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.8,
        fallback_required: false,
        action: {
          type: "UPDATE_BANNER",
          payload: { bannerId: 3, owner: "기존값" },
        },
      },
      UPDATE_MESSAGE,
    );

    expect(enriched.action?.payload).toMatchObject({
      bannerId: 3,
      owner: "기존값",
    });
  });
});

describe("resolveBannerIdFromLookup", () => {
  const toolResults: AssistantToolResultEntry[] = [
    {
      callId: "1",
      toolId: "banners_list_lookup",
      args: {},
      ok: true,
      message: "ok",
      data: {
        banners: [
          { bannerId: 7, owner: "홍풍" },
          { bannerId: 8, owner: "다른배너" },
        ],
        totalCount: 2,
      },
    },
  ];

  it("resolves bannerId by owner match", () => {
    expect(resolveBannerIdFromLookup('"홍풍" 배너 삭제해줘', toolResults)).toBe(7);
  });

  it("enriches delete action payload with bannerId", () => {
    const enriched = enrichAnalysisWithBannerFromLookup(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.7,
        fallback_required: false,
        action: {
          type: "DELETE_BANNER",
          payload: {},
        },
      },
      '"홍풍" 배너 삭제해줘',
      toolResults,
    );

    expect(enriched.action?.payload?.bannerId).toBe(7);
  });
});

describe("inferPrefetchReadToolCalls for banner mutations", () => {
  it("prefetches banner list for update requests", () => {
    expect(inferPrefetchReadToolCalls('"홍풍" 배너 owner 수정해줘')).toEqual([
      { toolId: "banners_list_lookup", args: {} },
    ]);
  });

  it("prefetches banner list for delete requests", () => {
    expect(inferPrefetchReadToolCalls("홍풍 배너 삭제해줘")).toEqual([
      { toolId: "banners_list_lookup", args: {} },
    ]);
  });
});
