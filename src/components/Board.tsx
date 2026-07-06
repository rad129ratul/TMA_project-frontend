"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useDateStore } from "@/store/useDateStore";
import { apiFetch } from "@/lib/api";
import { Task } from "@/types/task";
import Column from "./Column";
import TaskModal from "./TaskModal"

export default function Board() {
    const selectedDate = useDateStore((state) => state.selectedDate);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);

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

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {tasks.length} tasks found for {selectedDate}
                </p>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus size={16} /> Add Task
                </button>
            </div>

            {loading && <p className="text-sm text-gray-400">loading...</p>}
            {error && (
                <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {!loading && tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-sm text-gray-500">
                        There are no tasks for this date. Add a new task!
                    </p>
                </div>
            ) : (
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800">Delete the task?</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            &quot;{deletingTask.title}&quot; This action will be permanently deleted. It cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingTask(null)}
                                className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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