import { ReservationCalendar, WeekReservationGrid } from "@admin/features/reservation";

export default function Page() {
    return (
        <div className="flex flex-row gap-5">
            <div className="rounded-md border h-full sticky top-0 flex flex-col w-80 border-gray-200 p-2">
                <ReservationCalendar />
            </div>
            <div className="rounded-md border h-auto flex flex-col flex-grow min-w-[60vw] border-gray-200 p-2">
                <WeekReservationGrid />
            </div>
        </div>
    );
}
