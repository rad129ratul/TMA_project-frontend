"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import { Trash2, Pencil } from "lucide-react";
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

    // ── Label modal state ──
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [pendingPolygonPoints, setPendingPolygonPoints] = useState<Point[] | null>(null);
    const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
    const [labelInput, setLabelInput] = useState("");
    const [savingLabel, setSavingLabel] = useState(false);

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

    useEffect(() => {
        if (isLabelModalOpen) {
            setLabelInput(editingAnnotation?.label ?? "");
        }
    }, [isLabelModalOpen, editingAnnotation]);

    const aspectRatio = htmlImage ? htmlImage.height / htmlImage.width : 0.6;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;

    function distance(a: Point, b: Point) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    function handleStageClick(e: KonvaEventObject<MouseEvent>) {
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

    // When polygon is closed, the modal is opened without saving directly — leaving it in a pending state.
    function closePolygon() {
        if (activePoints.length < 3) return;
        const normalizedPoints = activePoints.map((p) =>
            toNormalized(p, displayWidth, displayHeight)
        );
        setActivePoints([]);
        setMousePos(null);
        setPendingPolygonPoints(normalizedPoints);
        setEditingAnnotation(null);
        setIsLabelModalOpen(true);
    }

    async function saveAnnotationWithLabel() {
        if (!pendingPolygonPoints) return;
        setSavingLabel(true);
        try {
            const res = await apiFetch("/api/annotations/annotations/", {
                method: "POST",
                body: JSON.stringify({
                    image: image.id,
                    points: pendingPolygonPoints,
                    label: labelInput.trim(),
                }),
            });
            if (!res.ok) throw new Error("Save failed");
            await fetchAnnotations();
            closeLabelModal();
        } catch {
            setError("Failed to save the polygon. Please try again.");
        } finally {
            setSavingLabel(false);
        }
    }

    async function updateAnnotationLabel() {
        if (!editingAnnotation) return;
        setSavingLabel(true);
        try {
            const res = await apiFetch(`/api/annotations/annotations/${editingAnnotation.id}/`, {
                method: "PATCH",
                body: JSON.stringify({ label: labelInput.trim() }),
            });
            if (!res.ok) throw new Error("Update failed");
            await fetchAnnotations();
            closeLabelModal();
        } catch {
            setError("Failed to update the label. Please try again.");
        } finally {
            setSavingLabel(false);
        }
    }

    function closeLabelModal() {
        setIsLabelModalOpen(false);
        setPendingPolygonPoints(null);
        setEditingAnnotation(null);
        setLabelInput("");
    }

    function handleLabelSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingAnnotation) {
            updateAnnotationLabel();
        } else {
            saveAnnotationWithLabel();
        }
    }

    function handleSelectAnnotation(e: KonvaEventObject<MouseEvent>, annotationId: number) {
        e.cancelBubble = true;
        setSelectedAnnotationId((prev) => (prev === annotationId ? null : annotationId));
    }

    function openEditLabelModal() {
        if (!selectedAnnotation) return;
        setEditingAnnotation(selectedAnnotation);
        setPendingPolygonPoints(null);
        setIsLabelModalOpen(true);
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

    const selectedAnnotation = savedAnnotations.find((a) => a.id === selectedAnnotationId) ?? null;

    function getFloatingMenuPosition(annotation: Annotation): { top: number; left: number } {
        const firstPoint = annotation.points[0];
        const pixelPoint = toPixels(firstPoint, displayWidth, displayHeight);
        return { left: pixelPoint.x, top: pixelPoint.y - 12 };
    }

    return (
        <div>
            {error && (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <p className="mb-2 text-xs text-gray-400">
                Click to add polygon points, click near the first point to close and label it. Click a saved polygon to select it.
            </p>

            {/* relative — anchor for absolute positioning of floating menu */}
            <div ref={containerRef} className="relative w-full">
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
                                <Line points={toFlatPoints(activePoints)} stroke="#f97316" strokeWidth={2} dash={[6, 4]} />
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

                {selectedAnnotation && (
                    <div
                        className="absolute z-40 -translate-x-1/2 -translate-y-full"
                        style={{
                            left: getFloatingMenuPosition(selectedAnnotation).left,
                            top: getFloatingMenuPosition(selectedAnnotation).top,
                        }}
                    >
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                            <span className="max-w-[120px] truncate text-xs font-medium text-gray-700">
                                {selectedAnnotation.label || "(no label)"}
                            </span>
                            <div className="h-4 w-px bg-gray-200" />
                            <button
                                onClick={openEditLabelModal}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                                aria-label="Edit label"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={confirmDeleteSelected}
                                disabled={deleting}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                                aria-label="Delete polygon"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="mx-auto h-2 w-2 rotate-45 bg-white border-b border-r border-gray-200 -mt-1" />
                    </div>
                )}
            </div>

            {/* ── Label Input Modal ── */}
            {isLabelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="mb-1 text-lg font-semibold text-gray-800">
                            {editingAnnotation ? "Edit Label" : "Label this Polygon"}
                        </h3>
                        <p className="mb-4 text-xs text-gray-500">
                            {editingAnnotation
                                ? "Update the label for this saved polygon."
                                : "Give this shape a name before saving (e.g. tumor, lesion, region-A)."}
                        </p>

                        <form onSubmit={handleLabelSubmit}>
                            <input
                                type="text"
                                autoFocus
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                placeholder="e.g. tumor-region-A"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeLabelModal}
                                    className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingLabel}
                                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savingLabel ? "Saving..." : editingAnnotation ? "Update Label" : "Save Polygon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}