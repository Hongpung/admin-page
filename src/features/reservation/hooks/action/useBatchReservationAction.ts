import { useCallback } from "react";
import { addBatchReservation } from "../../api/reservation-api";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import { buildBatchAddPayloadFromForm } from "../../lib/batch-add-flow";
import {
  addBatchReservationFormSchema,
  type AddBatchReservationFormValues,
} from "../../types/schemas";

type Args = {
  onSuccess: () => void;
};

export function useBatchReservationAction({ onSuccess }: Args) {
  const addBatch = useCallback(
    async (values: AddBatchReservationFormValues) => {
      if (!confirm("정기 일정을 추가하시겠습니까?")) return;

      const validatedValues = addBatchReservationFormSchema.parse(values);
      const result = buildBatchAddPayloadFromForm(validatedValues);
      if (!result.ok) {
        alert(result.message);
        return;
      }

      try {
        await addBatchReservation(result.payload);
        alert("success");
        onSuccess();
      } catch (err) {
        alert(
          err instanceof Error ? err.message : RESERVATION_MESSAGE.processFailed,
        );
      }
    },
    [onSuccess],
  );

  return { addBatch };
}
