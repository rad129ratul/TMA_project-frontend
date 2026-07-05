"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTokens } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                    setError("ভুল ইমেইল বা পাসওয়ার্ড।");
                } else {
                    setError("লগিন ব্যর্থ হয়েছে, আবার চেষ্টা করো।");
                }
                return;
            }

            const data = await res.json();
            setTokens(data.access, data.refresh);
            router.push("/tasks");
        } catch (err) {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-md"
            >
                <h1 className="text-2xl font-semibold text-gray-800">লগইন করুন</h1>

                {error && (
                    <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
                )}

                <div>
                    <label className="mb-1 block text-sm text-gray-600">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-gray-600">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "লগইন হচ্ছে..." : "লগইন"}
                </button>
            </form>
        </div>
    );
}