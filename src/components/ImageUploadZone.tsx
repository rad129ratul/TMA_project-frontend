"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ImageUploadZoneProps {
    taskId: string;
    onUploaded: () => void;
}

interface UploadItem {
    id: string; // For tracking on the client-side (made with filename + timestamp, not DB id)
    file: File;
    status: "pending" | "uploading" | "success" | "error";
    errorMessage?: string;
}

export default function ImageUploadZone({ taskId, onUploaded }: ImageUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [items, setItems] = useState<UploadItem[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isBatchUploading, setIsBatchUploading] = useState(false);

    async function uploadSingleFile(item: UploadItem) {
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i))
        );

        try {
            const formData = new FormData();
            formData.append("file", item.file);
            formData.append("task", taskId);

            const res = await apiFetch("/api/annotations/images/", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: "success" } : i))
            );
        } catch {
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? { ...i, status: "error", errorMessage: "Upload failed" }
                        : i
                )
            );
        }
    }

    // Upload multiple files sequentially — parent will be notified when all are complete
    async function uploadBatch(files: File[]) {
        // Only the actual image files are kept, the rest are silently dropped.
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return;

        const newItems: UploadItem[] = imageFiles.map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
            status: "pending",
        }));

        setItems((prev) => [...prev, ...newItems]);
        setIsBatchUploading(true);

        for (const item of newItems) {
            await uploadSingleFile(item);
        }

        setIsBatchUploading(false);
        onUploaded(); // The parent is being asked to refresh only once after all files have been processed.
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0) uploadBatch(files);
        e.target.value = ""; // onChange will be triggered even if the same file(s) are selected again.
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length > 0) uploadBatch(files);
    }

    function clearCompleted() {
        setItems((prev) => prev.filter((i) => i.status === "uploading" || i.status === "pending"));
    }

    const successCount = items.filter((i) => i.status === "success").length;
    const errorCount = items.filter((i) => i.status === "error").length;
    const hasFinishedItems = items.some((i) => i.status === "success" || i.status === "error");

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                    }`}
            >
                {isBatchUploading ? (
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                ) : (
                    <UploadCloud className="text-gray-400" size={24} />
                )}
                <p className="text-sm text-gray-500">
                    {isBatchUploading
                        ? "Uploading images..."
                        : "Click or drag one or more images here to upload"}
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {items.length > 0 && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <span className="text-xs font-medium text-gray-500">
                            {successCount}/{items.length} uploaded
                            {errorCount > 0 && (
                                <span className="ml-1 text-red-500">({errorCount} failed)</span>
                            )}
                        </span>
                        {hasFinishedItems && !isBatchUploading && (
                            <button
                                onClick={clearCompleted}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <ul className="max-h-40 overflow-y-auto">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
                            >
                                <span className="truncate text-gray-600">{item.file.name}</span>
                                {item.status === "pending" && (
                                    <span className="shrink-0 text-gray-400">Waiting...</span>
                                )}
                                {item.status === "uploading" && (
                                    <Loader2 className="shrink-0 animate-spin text-blue-500" size={14} />
                                )}
                                {item.status === "success" && (
                                    <CheckCircle2 className="shrink-0 text-green-500" size={14} />
                                )}
                                {item.status === "error" && (
                                    <span className="flex shrink-0 items-center gap-1 text-red-500">
                                        <XCircle size={14} /> Failed
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}