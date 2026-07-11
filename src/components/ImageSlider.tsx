"use client";

import { ImageOff, Loader2 } from "lucide-react";
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
    if (loading) {
        return (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
                <p className="text-xs">Loading images...</p>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <ImageOff className="text-slate-300" size={22} />
                <p className="text-xs text-slate-400">
                    No images uploaded yet.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-2.5 flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Images
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {images.length}
                </span>
            </div>

            {/* Vertical scrollable thumbnail panel — editor-sidebar style */}
            <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1">
                {images.map((img) => {
                    const isActive = selectedImage?.id === img.id;
                    return (
                        <button
                            key={img.id}
                            onClick={() => onSelect(img)}
                            className={`group relative overflow-hidden rounded-lg border-2 transition-all ${isActive
                                    ? "border-primary-500 ring-2 ring-primary-200"
                                    : "border-transparent hover:border-slate-200"
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.file}
                                alt={`Upload ${img.id}`}
                                className="h-20 w-full object-cover"
                            />
                            {isActive && (
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500 shadow-soft-xs" />
                            )}
                            <span
                                className={`absolute inset-x-0 bottom-0 truncate px-2 py-1 text-[10px] font-medium text-white transition-opacity ${isActive
                                        ? "bg-primary-600/90 opacity-100"
                                        : "bg-slate-900/60 opacity-0 group-hover:opacity-100"
                                    }`}
                            >
                                Image #{img.id}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}