"use client";

import DateSelector from "@/components/DateSelector";
import Board from "@/components/Board";

export default function TasksPage() {
    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tasks</h1>
                <DateSelector />
            </div>
            <Board />
        </div>
    );
}