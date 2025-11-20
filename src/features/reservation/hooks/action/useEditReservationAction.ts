import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  deleteReservation,
  editReservation,
} from "../../api/reservation-api";
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
  reservationId: number;
  onSuccess: () => void;
};

export function useEditReservationAction({ reservationId, onSuccess }: Args) {
  const queryClient = useQueryClient();

  const editReservationMutation = useMutation({
    mutationFn: (values: ReservationFormValues) =>
      editReservation(reservationId, values),
  });

  const deleteReservationMutation = useMutation({
    mutationFn: () => deleteReservation(reservationId),
  });

  const tryEditReservation = useCallback(
    async (reservationForm: ReservationFormValues) => {
      const validatedReservation = reservationFormSchema.parse(reservationForm);
      const dailyReservations = await queryClient.fetchQuery(
        dailyReservationsQueryOptions(validatedReservation.date),
      );
      const conflicts = collectSubmitConflicts({
        values: validatedReservation,
        reservations: dailyReservations as ExistReservation[],
        excludeReservationId: reservationId,
      });

      if (!confirmSubmitWithConflictList(conflicts, "edit")) return;

      try {
        const response =
          await editReservationMutation.mutateAsync(validatedReservation);
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
    [editReservationMutation, onSuccess, queryClient, reservationId],
  );

  const tryDeleteReservation = useCallback(async () => {
    if (!confirm(RESERVATION_MESSAGE.deleteConfirm)) return;
    try {
      const response = await deleteReservationMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: reservationQueryKeys.all,
      });
      alert(response.message);
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : RESERVATION_MESSAGE.defaultFail);
    }
  }, [deleteReservationMutation, onSuccess, queryClient]);

  return {
    tryEditReservation,
    tryDeleteReservation,
    isEditPending: editReservationMutation.isPending,
    isDeletePending: deleteReservationMutation.isPending,
  };
}
