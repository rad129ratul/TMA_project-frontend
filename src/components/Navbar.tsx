"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, ImagePlus, LogOut } from "lucide-react";
import { clearTokens } from "@/lib/api";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    function handleLogout() {
        clearTokens();
        router.push("/login");
    }

    const navLinks = [
        { href: "/tasks", label: "Tasks", icon: ClipboardList },
        { href: "/annotate", label: "Annotate", icon: ImagePlus },
    ];

    return (
        <nav className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <span className="text-sm font-bold tracking-wide text-gray-800">
                    TMA_project
                </span>

                <div className="flex items-center gap-1">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        className="ml-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}