"use client";

import { useEffect } from "react";
import DateSelector from "@/components/DateSelector";
import { useDateStore } from "@/store/useDateStore";

export default function TasksPage() {
    const selectedDate = useDateStore((state) => state.selectedDate);

    useEffect(() => {
        console.log("Selected date changed:", selectedDate);
    }, [selectedDate]);

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold">Tasks</h1>
            <DateSelector />
            <p className="mt-4 text-sm text-gray-500">
                Selected Date: <span className="font-semibold">{selectedDate}</span>
            </p>
        </div>
    );
}