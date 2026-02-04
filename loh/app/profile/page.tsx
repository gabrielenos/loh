
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MeResponse = {
    id: number;
    email: string;
    full_name?: string | null;
    phone?: string | null;
    address?: string | null;
};

export default function ProfilePage() {
    const router = useRouter();
    const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000", []);
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [phoneDraft, setPhoneDraft] = useState("");
    const [addressDraft, setAddressDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        const run = async () => {
            try {
                const res = await fetch(`${backendUrl}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 401) {
                    localStorage.removeItem("access_token");
                    router.push("/login");
                    return;
                }

                if (!res.ok) {
                    const t = await res.text();
                    throw new Error(t || `Failed to load profile (${res.status})`);
                }

                const data = (await res.json()) as MeResponse;
                setMe(data);
                setPhoneDraft(data.phone ?? "");
                setAddressDraft(data.address ?? "");
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [backendUrl, router]);

    const displayName = me?.full_name?.trim() || me?.email || "User";

    const handleSaveProfile = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setSaveError(null);
        setSaving(true);
        try {
            const res = await fetch(`${backendUrl}/users/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ phone: phoneDraft, address: addressDraft }),
            });

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.push("/login");
                return;
            }

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || `Failed to save profile (${res.status})`);
            }

            const updated = (await res.json()) as MeResponse;
            setMe(updated);
            setPhoneDraft(updated.phone ?? "");
            setAddressDraft(updated.address ?? "");
            setEditing(false);
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="mx-auto max-w-5xl px-6 pt-8 pb-24">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
                            <p className="text-sm text-zinc-500">Kelola informasi akun kamu.</p>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        <User className="h-4 w-4" />
                        Pengguna
                    </span>
                </div>

                {loading ? (
                    <div className="mt-6 rounded-2xl bg-white border border-zinc-200 p-5 text-sm text-zinc-600">
                        Loading profile...
                    </div>
                ) : error ? (
                    <div className="mt-6 rounded-2xl bg-white border border-zinc-200 p-5">
                        <div className="text-sm text-red-600">{error}</div>
                        <button
                            className="mt-3 h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                            onClick={() => window.location.reload()}
                            type="button"
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-1 rounded-2xl bg-white border border-zinc-200 p-5">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                                <User className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-semibold text-zinc-900 truncate">{displayName}</div>
                                <div className="text-sm text-zinc-500 truncate">{me?.email ?? ""}</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-200 p-5">
                        <h2 className="text-base font-semibold text-zinc-900">Informasi Kontak</h2>
                        <p className="text-sm text-zinc-500 mt-1">Pastikan datanya benar supaya pengiriman lancar.</p>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                                <Mail className="h-5 w-5 text-zinc-600 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-zinc-900">Email</div>
                                    <div className="text-sm text-zinc-600 break-all">{me?.email ?? ""}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                                <Phone className="h-5 w-5 text-zinc-600 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-zinc-900">Nomor HP</div>
                                    <div className="text-sm text-zinc-600">{me?.phone ?? ""}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                                <MapPin className="h-5 w-5 text-zinc-600 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-zinc-900">Alamat</div>
                                    <div className="text-sm text-zinc-600">{me?.address ?? ""}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {saveError ? <div className="w-full text-sm text-red-600">{saveError}</div> : null}

                            {editing ? (
                                <div className="flex flex-wrap items-center gap-2 w-full">
                                    <input
                                        value={phoneDraft}
                                        onChange={(e) => setPhoneDraft(e.target.value)}
                                        className="h-10 w-full sm:w-auto flex-1 rounded-full bg-zinc-50 border border-zinc-200 px-4 text-sm text-zinc-900 outline-none focus:border-blue-400"
                                        placeholder="Nomor HP"
                                    />
                                    <input
                                        value={addressDraft}
                                        onChange={(e) => setAddressDraft(e.target.value)}
                                        className="h-10 w-full rounded-full bg-zinc-50 border border-zinc-200 px-4 text-sm text-zinc-900 outline-none focus:border-blue-400"
                                        placeholder="Alamat"
                                    />
                                    <button
                                        className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                                        type="button"
                                        onClick={() => void handleSaveProfile()}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        className="h-10 rounded-full bg-white border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                                        type="button"
                                        onClick={() => {
                                            setEditing(false);
                                            setSaveError(null);
                                            setPhoneDraft(me?.phone ?? "");
                                            setAddressDraft(me?.address ?? "");
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                                    type="button"
                                    onClick={() => {
                                        setSaveError(null);
                                        setEditing(true);
                                    }}
                                >
                                    Edit Profile
                                </button>
                            )}
                            <button
                                className="h-10 rounded-full bg-white border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                                type="button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
