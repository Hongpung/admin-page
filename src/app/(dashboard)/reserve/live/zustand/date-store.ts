import { create } from "zustand";

interface DateStroe {
    selectedDate: Date;
    selectDate: (newDate: Date) => void
}


export const useDateStore = create<DateStroe>()((set) => ({

    selectedDate: new Date(),
    selectDate: (newDate: Date) => set(() => ({ selectedDate: newDate }))

}))