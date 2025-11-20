import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { createReservation } from "../../api/reservation-api";
import { confirmSubmitWithConflictList } from "../../lib/reservation-time-conflict-messages";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import {
  dailyReservationsQueryOptions,
  reservationQueryKeys,
} from "../../queries";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "../../types/schemas";
import { collectSubmitConflicts } from "../../service";
import type { ExistReservation } from "../../types";

type Args = {
  onSuccess: () => void;
};

export function useCreateReservationAction({ onSuccess }: Args) {
  const queryClient = useQueryClient();
  const createReservationMutation = useMutation({
    mutationFn: createReservation,
  });

  const tryCreateReservation = useCallback(
    async (reservationForm: ReservationFormValues) => {
      const validatedReservation = reservationFormSchema.parse(reservationForm);
      const dailyReservations = await queryClient.fetchQuery(
        dailyReservationsQueryOptions(validatedReservation.date),
      );
      const conflicts = collectSubmitConflicts({
        values: validatedReservation,
        reservations: dailyReservations as ExistReservation[],
      });

      if (!confirmSubmitWithConflictList(conflicts, "create")) return;

      try {
        const response =
          await createReservationMutation.mutateAsync(validatedReservation);
        await queryClient.invalidateQueries({
          queryKey: reservationQueryKeys.all,
        });
        alert(response.message);
        onSuccess();
      } catch (err) {
        alert(
          err instanceof Error ? err.message : RESERVATION_MESSAGE.defaultFail,
        );
      }
    },
    [createReservationMutation, onSuccess, queryClient],
  );

  return {
    tryCreateReservation,
    isPending: createReservationMutation.isPending,
  };
}
