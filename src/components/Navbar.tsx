"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutGrid } from "lucide-react";
import { clearTokens } from "@/lib/api";

export default function Navbar() {
    const router = useRouter();

    function handleLogout() {
        clearTokens();
        router.push("/login");
    }

    return (
        <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
                {/* Logo — icon + wordmark, links to /tasks (app's home) */}
                <Link
                    href="/tasks"
                    className="group flex items-center gap-2.5"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-soft-sm transition-transform group-hover:scale-105">
                        <LayoutGrid size={16} strokeWidth={2.5} />
                    </span>
                    <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                        TMA_project
                    </span>
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </nav>
    );
}