import { describe, expect, it } from "vitest";
import {
  hasNoticeCreateIntent,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "./assistant-notice-intent";
import { analyzeAssistantToolSchemaGaps } from "./format-assistant-missing-fields";
import {
  enrichAnalysisWithNoticeMessagePrefill,
  extractNoticeFieldsFromMessage,
  extractNoticeMatchTitle,
} from "./prefill-notice-from-message";
import { resolveNoticeIdFromLookup } from "./enrich-notice-from-lookup";

const CREATE_MESSAGE =
  "공지 등록해줘. 제목은 '연습 안내' 내용은 내일 정기연습이 있습니다. 전체 알림 발송해줘";

const UPDATE_MESSAGE =
  "공지 '연습 안내' 제목을 '새 연습 안내'로 바꿔줘";

const DELETE_MESSAGE = "공지 '연습 안내' 삭제해줘";

describe("notice intents", () => {
  it("detects create, update, and delete intents", () => {
    expect(hasNoticeCreateIntent(CREATE_MESSAGE)).toBe(true);
    expect(hasNoticeUpdateIntent(UPDATE_MESSAGE)).toBe(true);
    expect(hasNoticeDeleteIntent(DELETE_MESSAGE)).toBe(true);
    expect(hasNoticeCreateIntent(DELETE_MESSAGE)).toBe(false);
  });
});

describe("extractNoticeFieldsFromMessage", () => {
  it("parses create fields from natural language", () => {
    const fields = extractNoticeFieldsFromMessage(CREATE_MESSAGE);

    expect(fields.title).toBe("연습 안내");
    expect(fields.content).toBe("내일 정기연습이 있습니다");
    expect(fields.noticeAll).toBe(true);
  });

  it("parses update patch fields and match title", () => {
    const fields = extractNoticeFieldsFromMessage(UPDATE_MESSAGE);

    expect(fields.title).toBe("새 연습 안내");
    expect(extractNoticeMatchTitle(UPDATE_MESSAGE)).toBe("연습 안내");
  });

  it("parses noticeId when explicitly mentioned", () => {
    const fields = extractNoticeFieldsFromMessage("공지 ID 42 삭제해줘");

    expect(fields.noticeId).toBe(42);
    expect(extractNoticeMatchTitle("공지 ID 42 삭제해줘")).toBeNull();
  });
});

describe("enrichAnalysisWithNoticeMessagePrefill", () => {
  it("prefills only missing create payload fields and reduces schema gaps", () => {
    const enriched = enrichAnalysisWithNoticeMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "CREATE_NOTICE",
          payload: {},
        },
      },
      CREATE_MESSAGE,
    );

    expect(enriched.action?.type).toBe("CREATE_NOTICE");
    expect(enriched.action?.payload).toMatchObject({
      title: "연습 안내",
      content: "내일 정기연습이 있습니다",
      noticeAll: true,
    });

    const gaps = analyzeAssistantToolSchemaGaps(
      "notice_create",
      enriched.action?.payload ?? {},
    );
    expect(gaps.map((item) => item.path)).toEqual([]);
  });

  it("sets UPDATE_NOTICE action with patch fields", () => {
    const enriched = enrichAnalysisWithNoticeMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: false,
        recommended_action: "",
        confidence: 0.5,
        fallback_required: false,
        action: { type: "UNKNOWN" },
      },
      UPDATE_MESSAGE,
    );

    expect(enriched.action?.type).toBe("UPDATE_NOTICE");
    expect(enriched.action?.payload).toMatchObject({
      title: "새 연습 안내",
    });
  });

  it("sets DELETE_NOTICE action for delete intent", () => {
    const enriched = enrichAnalysisWithNoticeMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: false,
        recommended_action: "",
        confidence: 0.5,
        fallback_required: false,
        action: { type: "NONE" },
      },
      DELETE_MESSAGE,
    );

    expect(enriched.action?.type).toBe("DELETE_NOTICE");
    expect(enriched.action?.payload).toEqual({});
  });
});

describe("resolveNoticeIdFromLookup", () => {
  it("resolves noticeId from title match in lookup results", () => {
    const noticeId = resolveNoticeIdFromLookup(DELETE_MESSAGE, [
      {
        callId: "n1",
        toolId: "notices_list_lookup",
        args: {},
        ok: true,
        message: "ok",
        data: {
          notices: [
            { noticeId: 7, title: "연습 안내" },
            { noticeId: 8, title: "회비 안내" },
          ],
        },
      },
    ]);

    expect(noticeId).toBe(7);
  });

  it("prefers explicit noticeId over title match", () => {
    const noticeId = resolveNoticeIdFromLookup("공지 ID 8 삭제", [
      {
        callId: "n1",
        toolId: "notices_list_lookup",
        args: {},
        ok: true,
        message: "ok",
        data: {
          notices: [{ noticeId: 7, title: "연습 안내" }],
        },
      },
    ]);

    expect(noticeId).toBe(8);
  });
});
