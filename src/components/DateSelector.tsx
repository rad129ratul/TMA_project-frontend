"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useDateStore } from "@/store/useDateStore";

export default function DateSelector() {
    const selectedDate = useDateStore((state) => state.selectedDate);
    const setSelectedDate = useDateStore((state) => state.setSelectedDate);

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDateObj = parseISO(selectedDate);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(date: Date | undefined) {
        if (!date) return;
        setSelectedDate(format(date, "yyyy-MM-dd"));
        setIsOpen(false);
    }

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
                <CalendarDays size={18} className="text-blue-600" />
                {format(selectedDateObj, "dd MMM yyyy")}
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <DayPicker
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={handleSelect}
                        defaultMonth={selectedDateObj}
                    />
                </div>
            )}
        </div>
    );
}