"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
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
    const [savedAnnotations, setSavedAnnotations] = useState<Annotation[]>([]);
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

    // If the image changes: reset draft polygon + re-fetch annotations for that image
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
        setError(null);
        fetchAnnotations();
    }, [fetchAnnotations]);

    const aspectRatio = htmlImage ? htmlImage.height / htmlImage.width : 0.6;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;

    function distance(a: Point, b: Point) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    // Auto-save: POST as soon as polygon is closed
    async function saveAnnotation(normalizedPoints: Point[]) {
        try {
            const res = await apiFetch("/api/annotations/annotations/", {
                method: "POST",
                body: JSON.stringify({
                    image: image.id,
                    points: normalizedPoints,
                    label: "",
                }),
            });
            if (!res.ok) throw new Error("Save failed");
            // If successful, the fresh list is fetched again from the backend (to get an authoritative copy with id, created_at)
            fetchAnnotations();
        } catch {
            setError("Failed to save the polygon. Please try drawing it again.");
        }
    }

    function handleStageClick(e: KonvaEventObject<MouseEvent>) {
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

    function closePolygon() {
        if (activePoints.length < 3) return;
        const normalizedPoints = activePoints.map((p) =>
            toNormalized(p, displayWidth, displayHeight)
        );
        setActivePoints([]);
        saveAnnotation(normalizedPoints);
    }

    // Delete: Simple interaction to delete an annotation by clicking on it
    async function handleDeleteAnnotation(annotationId: number) {
        try {
            const res = await apiFetch(`/api/annotations/annotations/${annotationId}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            setSavedAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
        } catch {
            setError("Failed to delete the polygon.");
        }
    }

    return (
        <div>
            {error && (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mb-2 text-xs text-gray-400">
                Click to add polygon points, click near the first point to close and auto-save. Click a saved polygon to delete it.
            </p>

            <div ref={containerRef} className="w-full">
                {htmlImage && displayWidth > 0 && (
                    <Stage width={displayWidth} height={displayHeight} onClick={handleStageClick}>
                        <Layer>
                            <KonvaImage image={htmlImage} width={displayWidth} height={displayHeight} />

                            {/* Annotation loaded from backend — normalized → converted to pixel and rendered */}
                            {savedAnnotations.map((annotation) => (
                                <Line
                                    key={annotation.id}
                                    points={toFlatPoints(
                                        annotation.points.map((p) => toPixels(p, displayWidth, displayHeight))
                                    )}
                                    closed
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    fill="rgba(37, 99, 235, 0.2)"
                                    onClick={(e) => {
                                        e.cancelBubble = true; // Prevent Stage's onClick (adding new points) from being triggered
                                        handleDeleteAnnotation(annotation.id);
                                    }}
                                />
                            ))}

                            {/* Polygon still being drawn */}
                            {activePoints.length > 0 && (
                                <Line
                                    points={toFlatPoints(activePoints)}
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dash={[6, 4]}
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