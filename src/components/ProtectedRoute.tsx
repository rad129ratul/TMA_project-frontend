"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            router.replace("/login");
        } else {
            setChecked(true);
        }
    }, [router]);

    if (!checked) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">লোড হচ্ছে...</p>
            </div>
        );
    }

    return <>{children}</>;
}