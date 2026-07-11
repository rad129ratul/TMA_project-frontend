"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Task, TaskFormData, Priority, TaskStatus } from "@/types/task";

interface TaskModalProps {
    initialTask: Task | null;
    defaultDate: string;
    onClose: () => void;
    onSuccess: () => void;
}

const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-soft-xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                        {isEditMode ? "Edit Task" : "Add Task"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                        <AlertCircle size={15} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="e.g. Design the onboarding flow"
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleChange("priority", e.target.value as Priority)}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange("status", e.target.value as TaskStatus)}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Due Date</label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => handleChange("due_date", e.target.value)}
                            className={`${inputClass} cursor-pointer`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleChange("tags", e.target.value)}
                            placeholder="backend, urgent"
                            className={inputClass}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft-sm transition-all hover:bg-primary-700 hover:shadow-soft-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {saving ? "Saving..." : isEditMode ? "Update Task" : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}