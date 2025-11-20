import {
  ReservationOwnerSection,
  type ReservationCreator,
} from "../ui/ReservationOwnerSection";
import { ReservationDateField } from "../ui/ReservationDateField";
import { ReservationTimeRangeField } from "../ui/ReservationTimeRangeField";
import { ReservationOptionsSection } from "../ui/ReservationOptionsSection";

type Props = {
  reservationId: number;
  onCreatorModalOpen: () => void;
  selectedCreator?: ReservationCreator;
};

export function EditReservationFormSections({
  reservationId,
  onCreatorModalOpen,
  selectedCreator,
}: Props) {
  return (
    <div className="mx-4 mb-12 mt-6 flex flex-col gap-6 text-left">
      <ReservationOwnerSection
        onCreatorModalOpen={onCreatorModalOpen}
        selectedCreator={selectedCreator}
      />
      <ReservationDateField />
      <ReservationTimeRangeField
        excludeReservationId={reservationId}
        resetTimeRangeOnDateLoad="dirty"
      />
      <ReservationOptionsSection />
    </div>
  );
}
