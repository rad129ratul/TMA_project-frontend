"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import { Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { UploadedImage, Annotation, Point } from "@/types/annotation";

interface AnnotationCanvasProps {
    image: UploadedImage;
}

const CLOSE_THRESHOLD_PX = 10;

function toNormalized(point: Point, width: number, height: number): Point {
    return { x: point.x / width, y: point.y / height };
}

function toPixels(point: Point, width: number, height: number): Point {
    return { x: point.x * width, y: point.y * height };
}

function toFlatPoints(points: Point[]): number[] {
    return points.flatMap((p) => [p.x, p.y]);
}

export default function AnnotationCanvas({ image }: AnnotationCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [htmlImage] = useImage(image.file, "anonymous");

    const [activePoints, setActivePoints] = useState<Point[]>([]);
    const [mousePos, setMousePos] = useState<Point | null>(null);
    const [savedAnnotations, setSavedAnnotations] = useState<Annotation[]>([]);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width) setContainerWidth(width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const fetchAnnotations = useCallback(async () => {
        try {
            const res = await apiFetch(`/api/annotations/annotations/?image=${image.id}`);
            if (!res.ok) throw new Error("Failed to fetch annotations");
            const data: Annotation[] = await res.json();
            setSavedAnnotations(data);
        } catch {
            setError("Could not load existing annotations for this image.");
        }
    }, [image.id]);

    useEffect(() => {
        setActivePoints([]);
        setMousePos(null);
        setSelectedAnnotationId(null);
        setError(null);
        fetchAnnotations();
    }, [fetchAnnotations]);

    const aspectRatio = htmlImage ? htmlImage.height / htmlImage.width : 0.6;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;

    function distance(a: Point, b: Point) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    async function saveAnnotation(normalizedPoints: Point[]) {
        try {
            const res = await apiFetch("/api/annotations/annotations/", {
                method: "POST",
                body: JSON.stringify({ image: image.id, points: normalizedPoints, label: "" }),
            });
            if (!res.ok) throw new Error("Save failed");
            fetchAnnotations();
        } catch {
            setError("Failed to save the polygon. Please try drawing it again.");
        }
    }

    function handleStageClick(e: KonvaEventObject<MouseEvent>) {
        // Clicking on an empty space on the Stage will cancel the previous selection.
        setSelectedAnnotationId(null);

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const newPoint: Point = { x: pointerPos.x, y: pointerPos.y };

        if (
            activePoints.length >= 3 &&
            distance(newPoint, activePoints[0]) < CLOSE_THRESHOLD_PX
        ) {
            closePolygon();
            return;
        }

        setActivePoints((prev) => [...prev, newPoint]);
    }

    function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
        if (activePoints.length === 0) return;
        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;
        setMousePos({ x: pointerPos.x, y: pointerPos.y });
    }

    function closePolygon() {
        if (activePoints.length < 3) return;
        const normalizedPoints = activePoints.map((p) =>
            toNormalized(p, displayWidth, displayHeight)
        );
        setActivePoints([]);
        setMousePos(null);
        saveAnnotation(normalizedPoints);
    }

    // Step 1 — Select (click) → Confirm delete (button)
    function handleSelectAnnotation(e: KonvaEventObject<MouseEvent>, annotationId: number) {
        e.cancelBubble = true; // Prevent Stage's onClick (new point/deselect) from being triggered
        setSelectedAnnotationId((prev) => (prev === annotationId ? null : annotationId));
    }

    async function confirmDeleteSelected() {
        if (selectedAnnotationId === null) return;
        setDeleting(true);
        try {
            const res = await apiFetch(`/api/annotations/annotations/${selectedAnnotationId}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            setSavedAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotationId));
            setSelectedAnnotationId(null);
        } catch {
            setError("Failed to delete the polygon. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            {error && (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {/* Selection toolbar — only visible when a polygon is selected */}
            {selectedAnnotationId !== null && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    <span className="text-sm font-medium text-blue-700">Polygon selected</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedAnnotationId(null)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                            <X size={14} /> Cancel
                        </button>
                        <button
                            onClick={confirmDeleteSelected}
                            disabled={deleting}
                            className="flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Selected Polygon"}
                        </button>
                    </div>
                </div>
            )}

            <p className="mb-2 text-xs text-gray-400">
                Click to add polygon points, click near the first point to close and auto-save. Click a saved polygon to select it for deletion.
            </p>

            <div ref={containerRef} className="w-full">
                {htmlImage && displayWidth > 0 && (
                    <Stage
                        width={displayWidth}
                        height={displayHeight}
                        onClick={handleStageClick}
                        onMouseMove={handleMouseMove}
                    >
                        <Layer>
                            <KonvaImage image={htmlImage} width={displayWidth} height={displayHeight} />

                            {savedAnnotations.map((annotation) => {
                                const isSelected = annotation.id === selectedAnnotationId;
                                return (
                                    <Line
                                        key={annotation.id}
                                        points={toFlatPoints(
                                            annotation.points.map((p) => toPixels(p, displayWidth, displayHeight))
                                        )}
                                        closed
                                        stroke={isSelected ? "#dc2626" : "#2563eb"}
                                        strokeWidth={isSelected ? 3 : 2}
                                        fill={isSelected ? "rgba(220, 38, 38, 0.25)" : "rgba(37, 99, 235, 0.2)"}
                                        onClick={(e) => handleSelectAnnotation(e, annotation.id)}
                                    />
                                );
                            })}

                            {activePoints.length > 0 && (
                                <Line
                                    points={toFlatPoints(activePoints)}
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dash={[6, 4]}
                                />
                            )}
                            {activePoints.length > 0 && mousePos && (
                                <Line
                                    points={[
                                        activePoints[activePoints.length - 1].x,
                                        activePoints[activePoints.length - 1].y,
                                        mousePos.x,
                                        mousePos.y,
                                    ]}
                                    stroke="#f97316"
                                    strokeWidth={1.5}
                                    dash={[3, 3]}
                                    opacity={0.5}
                                />
                            )}
                            {activePoints.map((p, idx) => (
                                <Circle
                                    key={idx}
                                    x={p.x}
                                    y={p.y}
                                    radius={4}
                                    fill={idx === 0 ? "#f97316" : "#ffffff"}
                                    stroke="#f97316"
                                    strokeWidth={1.5}
                                />
                            ))}
                        </Layer>
                    </Stage>
                )}
            </div>
        </div>
    );
}