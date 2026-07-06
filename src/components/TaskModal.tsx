"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Task, TaskFormData, Priority, TaskStatus } from "@/types/task";

interface TaskModalProps {
    initialTask: Task | null;
    defaultDate: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TaskModal({
    initialTask,
    defaultDate,
    onClose,
    onSuccess,
}: TaskModalProps) {
    const isEditMode = !!initialTask;

    const [formData, setFormData] = useState<TaskFormData>({
        title: initialTask?.title ?? "",
        priority: initialTask?.priority ?? "medium",
        due_date: initialTask?.due_date ?? defaultDate,
        tags: initialTask?.tags ?? "",
        status: initialTask?.status ?? "todo",
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function handleChange<K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!formData.title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!formData.due_date) {
            setError("Due date is required.");
            return;
        }

        setSaving(true);
        try {
            const path = isEditMode ? `/api/tasks/${initialTask!.id}/` : "/api/tasks/";
            const method = isEditMode ? "PATCH" : "POST";

            const res = await apiFetch(path, {
                method,
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(
                    data?.title?.[0] || data?.due_date?.[0] || "Save failed. Please check the fields."
                );
                return;
            }

            onSuccess();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {isEditMode ? "Edit Task" : "Add Task"}
                    </h2>
                    <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleChange("priority", e.target.value as Priority)}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange("status", e.target.value as TaskStatus)}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => handleChange("due_date", e.target.value)}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleChange("tags", e.target.value)}
                            placeholder="backend, urgent"
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEditMode ? "Update Task" : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}