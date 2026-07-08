"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { UploadedImage } from "@/types/annotation";

interface AnnotationCanvasProps {
    image: UploadedImage;
}

export default function AnnotationCanvas({ image }: AnnotationCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [htmlImage] = useImage(image.file, "anonymous");

    // Responsively track container width — will stay the same even if window resizes or layout shifts
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width) setContainerWidth(width);
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // The display height is being calculated while maintaining the natural aspect ratio of the image, This will never make the image look stretched/distorted.
    const aspectRatio = htmlImage ? htmlImage.height / htmlImage.width : 0.6;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;

    return (
        <div ref={containerRef} className="w-full">
            {htmlImage && displayWidth > 0 && (
                <Stage width={displayWidth} height={displayHeight}>
                    <Layer>
                        <KonvaImage
                            image={htmlImage}
                            width={displayWidth}
                            height={displayHeight}
                        />
                    </Layer>
                </Stage>
            )}
        </div>
    );
}