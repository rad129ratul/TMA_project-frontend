export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
    id: number;
    title: string;
    priority: Priority;
    due_date: string; // format: YYYY-MM-DD
    tags: string;
    status: TaskStatus;
    owner: number;
    created_at: string;
    updated_at: string;
}

export interface TaskFormData {
    title: string;
    priority: Priority;
    due_date: string;
    tags: string;
    status: TaskStatus;
}