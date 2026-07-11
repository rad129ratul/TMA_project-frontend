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

    const fetchImages = useCallback(async () => {
        setLoadingImages(true);
        try {
            const res = await apiFetch(`/api/annotations/images/?task=${taskId}`);
            if (!res.ok) throw new Error("Failed to fetch images");
            const data: UploadedImage[] = await res.json();
            setImages(data);
            setSelectedImage((prev) => prev ?? (data.length > 0 ? data[0] : null));
        } catch {
            // no-op — slider itself shows the empty state
        } finally {
            setLoadingImages(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTask();
        fetchImages();
    }, [fetchTask, fetchImages]);

    return (
        <div className="mx-auto max-w-7xl p-6">
            {/* ── Header ── */}
            <button
                onClick={() => router.push("/tasks")}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
            >
                <ArrowLeft size={15} /> Back to Tasks
            </button>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        {task?.title ?? "Loading..."}
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Images and annotations here are isolated to this task only.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                    {error}
                </div>
            )}

            {/* ── Editor Layout — Sidebar (left) + Canvas (right) ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
                {/* Sidebar */}
                <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft-xs lg:sticky lg:top-20 lg:self-start">
                    <ImageUploadZone taskId={taskId} onUploaded={fetchImages} />
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <ImageSlider
                            images={images}
                            selectedImage={selectedImage}
                            onSelect={setSelectedImage}
                            loading={loadingImages}
                        />
                    </div>
                </aside>

                {/* Canvas workspace */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft-xs">
                    {selectedImage ? (
                        <AnnotationCanvas image={selectedImage} />
                    ) : (
                        <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center">
                            <p className="text-sm text-slate-400">
                                Upload an image to start annotating.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}