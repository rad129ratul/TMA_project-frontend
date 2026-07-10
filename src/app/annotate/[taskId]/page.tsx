"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { UploadedImage } from "@/types/annotation";
import ImageSlider from "@/components/ImageSlider";
import ImageUploadZone from "@/components/ImageUploadZone";
import AnnotationCanvas from "@/components/AnnotationCanvas";

export default function AnnotatePage() {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
    const [loadingImages, setLoadingImages] = useState(true);

    const fetchImages = useCallback(async () => {
        setLoadingImages(true);
        try {
            const res = await apiFetch("/api/annotations/images/");
            if (!res.ok) throw new Error("Failed to fetch images");
            const data: UploadedImage[] = await res.json();
            setImages(data);
            setSelectedImage((prev) => prev ?? (data.length > 0 ? data[0] : null));
        } catch {
            // no-op — the slider will automatically show an empty state
        } finally {
            setLoadingImages(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold">Annotate</h1>

            <div className="mb-4">
                <ImageUploadZone onUploaded={fetchImages} />
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