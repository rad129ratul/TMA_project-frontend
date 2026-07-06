"use client";

import { useDateStore } from "@/store/useDateStore";

export default function DateSelector() {
    const selectedDate = useDateStore((state) => state.selectedDate);
    const setSelectedDate = useDateStore((state) => state.setSelectedDate);

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="date-selector" className="text-sm font-medium text-gray-700">
                Select Date:
            </label>
            <input
                id="date-selector"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}