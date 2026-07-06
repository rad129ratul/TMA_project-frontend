import { create } from "zustand";

function getTodayLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

interface DateStore {
    selectedDate: string; // format: YYYY-MM-DD
    setSelectedDate: (date: string) => void;
}

export const useDateStore = create<DateStore>((set) => ({
    selectedDate: getTodayLocalDate(),
    setSelectedDate: (date: string) => set({ selectedDate: date }),
}));