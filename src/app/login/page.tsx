"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { setTokens } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const inputClass =
    "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, password }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    setError("Wrong email or password.");
                } else {
                    setError("Login failed, try again.");
                }
                return;
            }

            const data = await res.json();
            setTokens(data.access, data.refresh);
            router.push("/tasks");
        } catch {
            setError("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                {/* Logo — matches Navbar branding for consistency */}
                <div className="mb-6 flex flex-col items-center gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft-md">
                        <LayoutGrid size={20} strokeWidth={2.5} />
                    </span>
                    <span className="text-sm font-semibold tracking-tight text-slate-900">
                        TMA_project
                    </span>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full space-y-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-soft-lg"
                >
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
                        <p className="mt-1 text-xs text-slate-400">Log in to manage your tasks and annotations.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                            <AlertCircle size={15} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white shadow-soft-sm transition-all hover:bg-primary-700 hover:shadow-soft-md active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}