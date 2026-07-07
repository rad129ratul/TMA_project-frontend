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

const columnAccent: Record<TaskStatus, string> = {
    todo: "border-t-gray-400",
    in_progress: "border-t-blue-500",
    done: "border-t-green-500",
};

export default function Column({ title, status, tasks, onEdit, onDelete }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex w-full min-h-[200px] flex-col rounded-lg border-t-4 bg-gray-50 p-3 transition-colors ${columnAccent[status]} ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : ""
                }`}
        >
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">{title}</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {tasks.length === 0 ? (
                    <p className="rounded border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                        No tasks here
                    </p>
                ) : (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    );
}