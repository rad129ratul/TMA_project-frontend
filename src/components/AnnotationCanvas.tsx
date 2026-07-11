"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import { Trash2, Pencil, MousePointerClick } from "lucide-react";
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
        return { left: pixelPoint.x, top: pixelPoint.y - 14 };
    }

    return (
        <div>
            {error && (
                <div className="mb-3 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                    {error}
                </div>
            )}

            <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
                <MousePointerClick size={13} />
                Click to add points, click near the first point to close &amp; label. Click a saved polygon to select it.
            </div>

            {/* ── Canvas frame — dark editor-style container so the image pops ── */}
            <div className="rounded-xl bg-slate-900 p-3 shadow-soft-md">
                <div
                    ref={containerRef}
                    className="relative w-full overflow-hidden rounded-lg"
                    style={{
                        backgroundImage:
                            "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        backgroundColor: "#0f172a",
                    }}
                >
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
                                            stroke={isSelected ? "#f43f5e" : "#6366f1"}
                                            strokeWidth={isSelected ? 3 : 2}
                                            fill={isSelected ? "rgba(244, 63, 94, 0.22)" : "rgba(99, 102, 241, 0.18)"}
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

                    {/* ── Floating action menu — dark theme, stands out against the light polygon fill ── */}
                    {selectedAnnotation && (
                        <div
                            className="absolute z-40 -translate-x-1/2 -translate-y-full"
                            style={{
                                left: getFloatingMenuPosition(selectedAnnotation).left,
                                top: getFloatingMenuPosition(selectedAnnotation).top,
                            }}
                        >
                            <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 shadow-soft-lg ring-1 ring-white/10">
                                <span className="max-w-[120px] truncate text-xs font-medium text-white">
                                    {selectedAnnotation.label || "(no label)"}
                                </span>
                                <div className="h-4 w-px bg-white/15" />
                                <button
                                    onClick={openEditLabelModal}
                                    className="rounded p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-primary-300"
                                    aria-label="Edit label"
                                >
                                    <Pencil size={13} />
                                </button>
                                <button
                                    onClick={confirmDeleteSelected}
                                    disabled={deleting}
                                    className="rounded p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-danger-400 disabled:opacity-50"
                                    aria-label="Delete polygon"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className="mx-auto h-2 w-2 -mt-1 rotate-45 bg-slate-900" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Label Input Modal — crisp white theme, stands out against dark canvas ── */}
            {isLabelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-soft-xl">
                        <h3 className="mb-1 text-base font-semibold text-slate-900">
                            {editingAnnotation ? "Edit Label" : "Label this Polygon"}
                        </h3>
                        <p className="mb-4 text-xs text-slate-400">
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
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />

                            <div className="mt-5 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={closeLabelModal}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingLabel}
                                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft-sm transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
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