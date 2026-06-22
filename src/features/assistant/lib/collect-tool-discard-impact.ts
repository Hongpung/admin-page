import type { AssistantToolId } from "@admin/features/assistant/types/assistant-tool.types";
import {
  batchReservationDtoSchema,
  createReservationPayloadSchema,
} from "@admin/features/reservation/types/schemas";
import { collectSubmitConflicts } from "@admin/features/reservation/service/reservation-submit-conflict-service";
import {
  collectBatchSubmitConflicts,
  enumerateDateRange,
} from "@admin/features/reservation/service/collect-batch-submit-conflicts";
import type { ExistReservation } from "@admin/features/reservation/types";
import type { ReservationFormValues } from "@admin/features/reservation/types/schemas";

export type AssistantToolDiscardImpactItem = {
  reservationId: number;
  title: string;
  creatorName: string;
  date: string;
  startTime: string;
  endTime: string;
};

function mapSingleCreateArgs(args: Record<string, unknown>): ReservationFormValues {
  return {
    title: String(args.title ?? ""),
    date: String(args.date ?? ""),
    startTime: args.startTime as ReservationFormValues["startTime"],
    endTime: args.endTime as ReservationFormValues["endTime"],
    reservationType: args.reservationType as ReservationFormValues["reservationType"],
    participationAvailable: Boolean(args.participationAvailable),
    creatorId: typeof args.creatorId === "number" ? args.creatorId : undefined,
    externalCreatorName:
      typeof args.externalCreatorName === "string"
        ? args.externalCreatorName
        : undefined,
  };
}

function toImpactItem(
  conflict: {
    reservationId: number;
    title: string;
    creatorName: string;
    startTime: string;
    endTime: string;
  },
  date: string,
): AssistantToolDiscardImpactItem {
  return {
    reservationId: conflict.reservationId,
    title: conflict.title,
    creatorName: conflict.creatorName,
    date,
    startTime: conflict.startTime,
    endTime: conflict.endTime,
  };
}

export function listImpactDates(
  toolId: AssistantToolId,
  args: Record<string, unknown>,
): string[] {
  if (toolId === "reservation_force_create") {
    const date = typeof args.date === "string" ? args.date : null;
    return date ? [date] : [];
  }

  if (toolId === "reservation_batch_create") {
    const parsed = batchReservationDtoSchema.safeParse(args);
    if (!parsed.success) return [];
    return enumerateDateRange(
      parsed.data.duration.startDate,
      parsed.data.duration.endDate,
    );
  }

  return [];
}

export function collectToolDiscardImpact(
  toolId: AssistantToolId,
  args: Record<string, unknown>,
  reservationsByDate: Record<string, ExistReservation[]>,
): AssistantToolDiscardImpactItem[] {
  if (toolId === "reservation_force_create") {
    const parsed = createReservationPayloadSchema.safeParse(args);
    if (!parsed.success) return [];

    const values = mapSingleCreateArgs(parsed.data as Record<string, unknown>);
    const reservations = reservationsByDate[values.date] ?? [];
    const conflicts = collectSubmitConflicts({ values, reservations });

    return conflicts.map((conflict) => toImpactItem(conflict, values.date));
  }

  if (toolId === "reservation_batch_create") {
    const parsed = batchReservationDtoSchema.safeParse(args);
    if (!parsed.success) return [];

    return collectBatchSubmitConflicts(parsed.data, reservationsByDate);
  }

  return [];
}
