export interface UploadedImage {
    id: number;
    file: string; // absolute URL returned by DRF ImageField
    uploaded_by: number;
    uploaded_at: string;
}

// Normalized coordinate: 0.0 - 1.0 range, independent of screen size
export interface Point {
    x: number;
    y: number;
}

export interface Annotation {
    id: number;
    image: number;
    points: Point[];
    label: string;
    created_at: string;
}