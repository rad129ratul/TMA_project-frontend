"use client";

import { Task, TaskStatus } from "@/types/task";
import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";

interface ColumnProps {
    title: string;
    status: TaskStatus;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

// Each status gets a distinct accent color for the counter badge and top border
const columnAccent: Record<TaskStatus, { border: string; badge: string }> = {
    todo: { border: "border-t-slate-400", badge: "bg-slate-100 text-slate-600" },
    in_progress: { border: "border-t-primary-500", badge: "bg-primary-50 text-primary-700" },
    done: { border: "border-t-success-500", badge: "bg-success-50 text-success-700" },
};

export default function Column({ title, status, tasks, onEdit, onDelete }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const accent = columnAccent[status];

    return (
        <div
            ref={setNodeRef}
            className={`flex w-full min-h-[240px] flex-col rounded-2xl border-t-[3px] bg-slate-100/60 p-3.5 transition-colors ${accent.border} ${isOver ? "bg-primary-50/70 ring-2 ring-primary-300 ring-inset" : ""
                }`}
        >
            <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">
                    {title}
                </h2>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.badge}`}>
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-col gap-2.5">
                {tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/40 p-6 text-center">
                        <p className="text-xs text-slate-400">No tasks here</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    );
}