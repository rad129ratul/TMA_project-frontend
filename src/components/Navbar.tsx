"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearTokens } from "@/lib/api";

export default function Navbar() {
    const router = useRouter();

    function handleLogout() {
        clearTokens();
        router.push("/login");
    }

    return (
        <nav className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                {/* The logo now links to /tasks — this is the home/entry point of the app. */}
                <Link
                    href="/tasks"
                    className="text-sm font-bold tracking-wide text-gray-800 hover:text-blue-600"
                >
                    TMA_project
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </nav>
    );
}