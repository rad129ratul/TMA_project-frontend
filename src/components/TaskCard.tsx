"use client";

import { useRouter } from "next/navigation";
import { Task } from "@/types/task";
import { Pencil, Trash2, Tag, GripVertical, ImagePlus, Calendar } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const priorityStyles: Record<Task["priority"], string> = {
    low: "bg-success-50 text-success-700 border-success-100",
    medium: "bg-warning-50 text-warning-700 border-warning-100",
    high: "bg-danger-50 text-danger-700 border-danger-100",
};

const priorityDot: Record<Task["priority"], string> = {
    low: "bg-success-500",
    medium: "bg-warning-600",
    high: "bg-danger-500",
};

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    const router = useRouter();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? "var(--shadow-soft-lg)" : undefined,
    };

    function handleCardClick() {
        router.push(`/annotate/${task.id}`);
    }

    function handleEditClick(e: React.MouseEvent) {
        e.stopPropagation();
        onEdit(task);
    }

    function handleDeleteClick(e: React.MouseEvent) {
        e.stopPropagation();
        onDelete(task);
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleCardClick}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-soft-xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft-md"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-1.5">
                    {/* Drag handle — only visible/interactive here, isolated with stopPropagation */}
                    <button
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 shrink-0 cursor-grab touch-none rounded text-slate-300 opacity-0 transition-opacity hover:text-slate-500 active:cursor-grabbing group-hover:opacity-100"
                        aria-label="Drag task"
                    >
                        <GripVertical size={15} />
                    </button>
                    <h3 className="truncate text-[13.5px] font-semibold leading-snug text-slate-800">
                        {task.title}
                    </h3>
                </div>

                <span
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityStyles[task.priority]}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[task.priority]}`} />
                    {task.priority}
                </span>
            </div>

            {task.tags && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <Tag size={11} />
                    <span className="truncate">{task.tags}</span>
                </div>
            )}

            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-primary-600">
                    <ImagePlus size={12} />
                    Annotate
                </span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar size={11} />
                        {task.due_date}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={handleEditClick}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                            aria-label="Edit task"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                            aria-label="Delete task"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}