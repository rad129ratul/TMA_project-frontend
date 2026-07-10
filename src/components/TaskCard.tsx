"use client";

import { useRouter } from "next/navigation";
import { Task } from "@/types/task";
import { Pencil, Trash2, Tag, GripVertical, ImagePlus } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const priorityStyles: Record<Task["priority"], string> = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
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
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? "0 8px 16px rgba(0,0,0,0.15)" : undefined,
    };

    // Clicking on any "empty" space on the card will take you to the annotate page.
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
            className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md hover:border-blue-300"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-1">
                    {/* Drag handle also needs stopPropagation, otherwise navigation may be triggered when the drag is started. */}
                    <button
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                        aria-label="Drag task"
                    >
                        <GripVertical size={14} />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-800">{task.title}</h3>
                </div>
                <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}
                >
                    {task.priority}
                </span>
            </div>

            {task.tags && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Tag size={12} />
                    <span>{task.tags}</span>
                </div>
            )}

            <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-blue-500">
                    <ImagePlus size={12} />
                    Annotate
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{task.due_date}</span>
                    <button
                        onClick={handleEditClick}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                        aria-label="Edit task"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        aria-label="Delete task"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}