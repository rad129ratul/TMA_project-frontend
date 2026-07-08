"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import { UploadedImage, Point } from "@/types/annotation";

interface AnnotationCanvasProps {
    image: UploadedImage;
}

function toNormalized(point: Point, width: number, height: number): Point {
    return { x: point.x / width, y: point.y / height };
}

function toPixels(point: Point, width: number, height: number): Point {
    return { x: point.x * width, y: point.y * height };
}

const CLOSE_THRESHOLD_PX = 10; // Clicking within this distance of the first point will close the polygon.

export default function AnnotationCanvas({ image }: AnnotationCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [htmlImage] = useImage(image.file, "anonymous");

    // in-progress polygon — being placed in display pixel coordinates (convenient during drawing),
    const [activePoints, setActivePoints] = useState<Point[]>([]);
    // All polygons completed in this session (in pixel coordinates, for rendering)
    const [completedPolygons, setCompletedPolygons] = useState<Point[][]>([]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width) setContainerWidth(width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Reset in-progress drawing when changing images — so that half-drawn polygons from the previous image do not remain on top of other images
    useEffect(() => {
        setActivePoints([]);
    }, [image.id]);

    const aspectRatio = htmlImage ? htmlImage.height / htmlImage.width : 0.6;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;

    function distance(a: Point, b: Point) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    function handleStageClick(e: KonvaEventObject<MouseEvent>) {
        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const newPoint: Point = { x: pointerPos.x, y: pointerPos.y };

        // Click near the first point and if there are at least 3 points — close the polygon
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

        setCompletedPolygons((prev) => [...prev, activePoints]);
        console.log("normalized points ready to save:", normalizedPoints);
        setActivePoints([]);
    }

    // react-konva's <Line> points prop expects a flat [x1, y1, x2, y2, ...] array
    function toFlatPoints(points: Point[]): number[] {
        return points.flatMap((p) => [p.x, p.y]);
    }

    return (
        <div ref={containerRef} className="w-full">
            {htmlImage && displayWidth > 0 && (
                <Stage
                    width={displayWidth}
                    height={displayHeight}
                    onClick={handleStageClick}
                >
                    <Layer>
                        <KonvaImage image={htmlImage} width={displayWidth} height={displayHeight} />

                        {/* Pre-completed polygons */}
                        {completedPolygons.map((poly, idx) => (
                            <Line
                                key={idx}
                                points={toFlatPoints(poly)}
                                closed
                                stroke="#2563eb"
                                strokeWidth={2}
                                fill="rgba(37, 99, 235, 0.2)"
                            />
                        ))}

                        {/* Polygon still being drawn — dashed line + small circle at each point */}
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
    );
}