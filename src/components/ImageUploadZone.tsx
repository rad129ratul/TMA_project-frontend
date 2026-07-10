"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ImageUploadZoneProps {
    taskId: string;
    onUploaded: () => void;
}

export default function ImageUploadZone({ taskId, onUploaded }: ImageUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    async function uploadFile(file: File) {
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("task", taskId); // Backend will now know which task this image is associated with

            const res = await apiFetch("/api/annotations/images/", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            onUploaded();
        } catch {
            setError("Image upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) uploadFile(file);
    }

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
                {uploading ? (
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                ) : (
                    <UploadCloud className="text-gray-400" size={24} />
                )}
                <p className="text-sm text-gray-500">
                    {uploading ? "Uploading..." : "Click or drag an image here to upload"}
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}