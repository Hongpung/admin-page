import { Calendar } from "../calendar/calendar";
import WeekReservesPage from "./WeekReservesPage";

export default function Page() {
    return (
        <div className="flex flex-row gap-2">
            <div className="rounded-md border h-full sticky top-6 flex flex-col w-80 border-gray-200 p-2">
                <Calendar/>
            </div>
            <div className="rounded-md border h-auto flex flex-col flex-grow border-gray-200 p-2">
                <WeekReservesPage/>
            </div>
        </div>
    );
}
