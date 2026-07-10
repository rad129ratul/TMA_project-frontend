"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { UploadedImage } from "@/types/annotation";
import { Task } from "@/types/task";
import ImageSlider from "@/components/ImageSlider";
import ImageUploadZone from "@/components/ImageUploadZone";
import AnnotationCanvas from "@/components/AnnotationCanvas";

export default function AnnotateTaskPage() {
    const params = useParams<{ taskId: string }>();
    const taskId = params.taskId;
    const router = useRouter();

    const [task, setTask] = useState<Task | null>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
    const [loadingImages, setLoadingImages] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetching the task title to display in the header
    const fetchTask = useCallback(async () => {
        try {
            const res = await apiFetch(`/api/tasks/${taskId}/`);
            if (!res.ok) throw new Error("Failed to fetch task");
            const data: Task = await res.json();
            setTask(data);
        } catch {
            setError("Could not load this task. It may not exist or you may not have access.");
        }
    }, [taskId]);

    // Only images with this taskId will be fetched — with the query param ?task=<taskId>
    const fetchImages = useCallback(async () => {
        setLoadingImages(true);
        try {
            const res = await apiFetch(`/api/annotations/images/?task=${taskId}`);
            if (!res.ok) throw new Error("Failed to fetch images");
            const data: UploadedImage[] = await res.json();
            setImages(data);
            setSelectedImage((prev) => prev ?? (data.length > 0 ? data[0] : null));
        } catch {
            // no-op — the slider will automatically show an empty state
        } finally {
            setLoadingImages(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTask();
        fetchImages();
    }, [fetchTask, fetchImages]);

    return (
        <div className="p-8">
            <button
                onClick={() => router.push("/tasks")}
                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
            >
                <ArrowLeft size={16} /> Back to Tasks
            </button>

            <h1 className="mb-1 text-2xl font-bold">
                Annotate: {task?.title ?? "..."}
            </h1>
            <p className="mb-6 text-sm text-gray-400">
                Images and annotations here are isolated to this task only.
            </p>

            {error && (
                <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="mb-4">
                <ImageUploadZone taskId={taskId} onUploaded={fetchImages} />
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <ImageSlider
                    images={images}
                    selectedImage={selectedImage}
                    onSelect={setSelectedImage}
                    loading={loadingImages}
                />
            </div>

            {selectedImage && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <AnnotationCanvas image={selectedImage} />
                </div>
            )}
        </div>
    );
}