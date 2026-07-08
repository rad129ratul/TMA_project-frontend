"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { UploadedImage } from "@/types/annotation";

interface ImageSliderProps {
    images: UploadedImage[];
    selectedImage: UploadedImage | null;
    onSelect: (image: UploadedImage) => void;
    loading: boolean;
}

export default function ImageSlider({
    images,
    selectedImage,
    onSelect,
    loading,
}: ImageSliderProps) {
    const currentIndex = selectedImage
        ? images.findIndex((img) => img.id === selectedImage.id)
        : -1;

    function goPrev() {
        if (currentIndex > 0) onSelect(images[currentIndex - 1]);
    }

    function goNext() {
        if (currentIndex < images.length - 1) onSelect(images[currentIndex + 1]);
    }

    if (loading) {
        return <p className="text-sm text-gray-400">Loading images...</p>;
    }

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <ImageOff className="text-gray-300" size={28} />
                <p className="text-sm text-gray-500">
                    No images uploaded yet. Upload one to start annotating.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Prev/Next controller — shows a large counter, which image I am in */}
            <div className="mb-3 flex items-center justify-between">
                <button
                    onClick={goPrev}
                    disabled={currentIndex <= 0}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Previous image"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-medium text-gray-500">
                    {currentIndex + 1} / {images.length}
                </span>
                <button
                    onClick={goNext}
                    disabled={currentIndex >= images.length - 1}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Next image"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Thumbnail strip — Jump to any image by clicking directly */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img) => (
                    <button
                        key={img.id}
                        onClick={() => onSelect(img)}
                        className={`shrink-0 overflow-hidden rounded-md border-2 transition-colors ${selectedImage?.id === img.id
                            ? "border-blue-600"
                            : "border-transparent hover:border-gray-300"
                            }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.file}
                            alt={`Upload ${img.id}`}
                            className="h-16 w-16 object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}