import type { ImageExtractionResult } from "@admin/features/assistant/lib/google-genai";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import { isCollapsedScheduleSummary } from "@admin/features/assistant/lib/extract-dated-schedule-slots";

export function buildDatedScheduleBuildFailureAnalysis(
  imageExtraction: Pick<ImageExtractionResult, "detected_text" | "confidence">,
): AssistantAnalysis {
  const collapsed = isCollapsedScheduleSummary(imageExtraction.detected_text);

  return {
    summary: collapsed
      ? "격자 시간표 이미지에서 날짜·교시·연습 배치를 구조적으로 읽지 못했습니다. 연습 이름 목록과 교시 정의만 추출되어 예약 슬롯(시작/종료 시간)을 만들 수 없습니다."
      : "격자·날짜별 시간표에서 날짜·시간·연습·담당자가 연결된 슬롯을 찾지 못했습니다.",
    detected_text: imageExtraction.detected_text,
    admin_action_required: false,
    recommended_action: collapsed
      ? "이미지를 다시 업로드하거나, `2026-07-06, 13:00-15:00, 오금반, 담당가 ; REGULAR` 형식의 텍스트를 함께 보내주세요."
      : "시간표 원문을 날짜별 슬롯 형식으로 확인해 주세요.",
    confidence: imageExtraction.confidence,
    fallback_required: true,
    actions: [{ type: "NONE" }],
    action: { type: "NONE" },
  };
}
