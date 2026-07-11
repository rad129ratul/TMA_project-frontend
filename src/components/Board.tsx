"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useDateStore } from "@/store/useDateStore";
import { apiFetch } from "@/lib/api";
import { Task, TaskStatus } from "@/types/task";
import Column from "./Column";
import TaskModal from "./TaskModal";

export default function Board() {
    const selectedDate = useDateStore((state) => state.selectedDate);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/tasks/?date=${selectedDate}`);
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data: Task[] = await res.json();
            setTasks(data);
        } catch {
            setError("The task could not be loaded. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    function openAddModal() {
        setEditingTask(null);
        setIsModalOpen(true);
    }

    function openEditModal(task: Task) {
        setEditingTask(task);
        setIsModalOpen(true);
    }

    function requestDelete(task: Task) {
        setDeletingTask(task);
    }

    async function confirmDelete() {
        if (!deletingTask) return;
        try {
            const res = await apiFetch(`/api/tasks/${deletingTask.id}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            setDeletingTask(null);
            fetchTasks();
        } catch {
            setError("Delete failed. Try again.");
        }
    }

    // Drag & Drop core logic
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over) return;

        const taskId = active.id as number;
        const newStatus = over.id as TaskStatus;

        const draggedTask = tasks.find((t) => t.id === taskId);
        if (!draggedTask) return;

        if (draggedTask.status === newStatus) return;

        const previousTasks = tasks;

        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        try {
            const res = await apiFetch(`/api/tasks/${taskId}/`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                throw new Error("Status update failed on server");
            }
        } catch {
            setTasks(previousTasks);
            setError("Task could not be moved — Connection to server failed. Please try again.");
        }
    }

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{tasks.length}</span> tasks found for{" "}
                    <span className="font-medium text-slate-600">{selectedDate}</span>
                </p>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft-sm transition-all hover:bg-primary-700 hover:shadow-soft-md active:scale-95"
                >
                    <Plus size={16} /> Add Task
                </button>
            </div>

            {loading && (
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> loading...
                </div>
            )}
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                </div>
            )}

            {!loading && tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
                    <p className="text-sm text-slate-500">
                        There are no tasks for this date. Add a new task!
                    </p>
                </div>
            ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Column
                            title="To Do"
                            status="todo"
                            tasks={todoTasks}
                            onEdit={openEditModal}
                            onDelete={requestDelete}
                        />
                        <Column
                            title="In Progress"
                            status="in_progress"
                            tasks={inProgressTasks}
                            onEdit={openEditModal}
                            onDelete={requestDelete}
                        />
                        <Column
                            title="Done"
                            status="done"
                            tasks={doneTasks}
                            onEdit={openEditModal}
                            onDelete={requestDelete}
                        />
                    </div>
                </DndContext>
            )}

            {isModalOpen && (
                <TaskModal
                    initialTask={editingTask}
                    defaultDate={selectedDate}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchTasks();
                    }}
                />
            )}

            {deletingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-xl">
                        <h3 className="text-base font-semibold text-slate-900">Delete the task?</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            &quot;{deletingTask.title}&quot; will be permanently deleted. This action cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end gap-2.5">
                            <button
                                onClick={() => setDeletingTask(null)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white shadow-soft-sm transition-all hover:bg-danger-700 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}