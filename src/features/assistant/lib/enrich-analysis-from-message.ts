import { enrichAnalysisWithCancelIntent } from "@admin/features/assistant/lib/build-cancel-action-from-lookup";
import { enrichAnalysisWithCreatorFromLookup } from "@admin/features/assistant/lib/build-creator-from-lookup";
import { enrichAnalysisWithMultiReservationCreatorsFromLookup } from "@admin/features/assistant/lib/enrich-multi-reservations-creators-from-lookup";
import { enrichBatchCreatorsFromClubLeaders } from "@admin/features/assistant/lib/enrich-batch-creators-from-club-leaders";
import { enrichAnalysisWithBannerFromLookup } from "@admin/features/assistant/lib/enrich-banner-from-lookup";
import { enrichAnalysisWithNoticeFromLookup } from "@admin/features/assistant/lib/enrich-notice-from-lookup";
import { enrichAnalysisWithBannerMessagePrefill } from "@admin/features/assistant/lib/prefill-banner-from-message";
import { enrichAnalysisWithMultiReservationMessagePrefill } from "@admin/features/assistant/lib/prefill-multi-reservations-from-message";
import { enrichAnalysisWithNoticeMessagePrefill } from "@admin/features/assistant/lib/prefill-notice-from-message";
import { enrichAnalysisWithReservationBatchMessagePrefill } from "@admin/features/assistant/lib/prefill-reservation-batch-from-message";
import { enrichAnalysisWithReservationMessagePrefill } from "@admin/features/assistant/lib/prefill-reservation-from-message";
import { enrichAnalysisWithReservationFromLookup } from "@admin/features/assistant/lib/enrich-reservation-from-lookup";
import { enrichAnalysisWithReservationUpdateMessagePrefill } from "@admin/features/assistant/lib/prefill-reservation-update-from-message";
import { expandAssistantActionsInAnalysis } from "@admin/features/assistant/lib/expand-assistant-actions";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import {
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

export function enrichAnalysisFromMessage(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  const withCancel = enrichAnalysisWithCancelIntent(
    analysis,
    message,
    toolResults,
  );
  const withUpdatePrefill = enrichAnalysisWithReservationUpdateMessagePrefill(
    withCancel,
    message,
  );
  const withUpdateLookup = enrichAnalysisWithReservationFromLookup(
    withUpdatePrefill,
    message,
    toolResults,
  );
  const withMulti = enrichAnalysisWithMultiReservationMessagePrefill(
    withUpdateLookup,
    message,
  );
  const withReservation = enrichAnalysisWithReservationMessagePrefill(
    withMulti,
    message,
  );
  const withBatch = enrichAnalysisWithReservationBatchMessagePrefill(
    withReservation,
    message,
  );
  const withNoticeMessage = enrichAnalysisWithNoticeMessagePrefill(
    withBatch,
    message,
  );
  const withNoticeLookup = enrichAnalysisWithNoticeFromLookup(
    withNoticeMessage,
    message,
    toolResults,
  );
  const withBannerMessage = enrichAnalysisWithBannerMessagePrefill(
    withNoticeLookup,
    message,
  );
  const withBannerLookup = enrichAnalysisWithBannerFromLookup(
    withBannerMessage,
    message,
    toolResults,
  );
  const withMultiCreators = enrichAnalysisWithMultiReservationCreatorsFromLookup(
    withBannerLookup,
    toolResults,
  );
  const withExpandedActions = expandAssistantActionsInAnalysis(withMultiCreators);
  const withBatchCreators = enrichBatchCreatorsFromClubLeaders(
    withExpandedActions,
    toolResults,
  );

  return syncPrimaryAssistantAction(
    enrichAnalysisWithCreatorFromLookup(withBatchCreators, message, toolResults),
  );
}
