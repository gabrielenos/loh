"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { ShoppingCart, Search, Heart, Sparkles, Filter, Image as ImageIcon, X, Send, Bot, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Dashboard() {
    const [aiOpen, setAiOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<"All" | "Electronics" | "Apparel" | "Home">("All");
    const [wishlist, setWishlist] = useState<Array<{ id: number; title: string; price: number }>>([]);
    const [chatMessages, setChatMessages] = useState<
        Array<{ id: string; role: "assistant" | "user"; text: string; typing?: boolean }>
    >([]);
    const products = useMemo(
        () => [
            {
                id: 1,
                title: "Earbuds Bluetooth",
                price: 199000,
                ai_recommended: true,
                category: "Electronics" as const,
                description: "Earbuds wireless untuk musik dan panggilan sehari-hari. Ringan, praktis, dan mudah dibawa.",
                details_json: JSON.stringify({
                    koneksi: "Bluetooth",
                    penggunaan: ["musik", "panggilan"],
                    fitur: ["charging case", "kontrol sentuh"],
                }),
            },
            {
                id: 2,
                title: "Power Bank 10.000mAh",
                price: 149000,
                ai_recommended: false,
                category: "Electronics" as const,
                description: "Power bank kapasitas 10.000mAh untuk isi ulang HP saat di luar rumah.",
                details_json: JSON.stringify({
                    kapasitas: "10.000mAh",
                    cocok_untuk: ["travel", "aktivitas luar"],
                    catatan: ["cek kompatibilitas kabel"],
                }),
            },
            {
                id: 3,
                title: "Kaos Oversize",
                price: 99000,
                ai_recommended: false,
                category: "Apparel" as const,
                description: "Kaos oversize nyaman untuk harian, style santai dan mudah dipadukan.",
                details_json: JSON.stringify({
                    model: "oversize",
                    gaya: ["casual"],
                    tips: ["cek size chart"],
                }),
            },
            {
                id: 4,
                title: "Hoodie Basic",
                price: 179000,
                ai_recommended: true,
                category: "Apparel" as const,
                description: "Hoodie basic untuk cuaca sejuk, cocok buat indoor/outdoor dengan look minimalis.",
                details_json: JSON.stringify({
                    item: "hoodie",
                    cocok_untuk: ["cuaca sejuk", "hangout"],
                    perawatan: ["cuci terbalik", "hindari panas tinggi"],
                }),
            },
            {
                id: 5,
                title: "Lampu Meja Minimalis",
                price: 89000,
                ai_recommended: false,
                category: "Home" as const,
                description: "Lampu meja minimalis untuk belajar/kerja agar pencahayaan lebih fokus dan nyaman.",
                details_json: JSON.stringify({
                    area: ["meja belajar", "meja kerja"],
                    gaya: "minimalis",
                    catatan: ["pastikan colokan dekat"],
                }),
            },
            {
                id: 6,
                title: "Set Handuk Rumah",
                price: 45000,
                ai_recommended: false,
                category: "Home" as const,
                description: "Set handuk untuk kebutuhan rumah. Cocok untuk mandi atau tamu.",
                details_json: JSON.stringify({
                    kategori: "handuk",
                    penggunaan: ["mandi", "tamu"],
                    tips: ["jemur sampai kering agar tidak bau"],
                }),
            },
            {
                id: 7,
                title: "Sarung Tangan",
                price: 35000,
                ai_recommended: false,
                category: "Apparel" as const,
                description: "Sarung tangan untuk aktivitas harian seperti riding ringan atau kerja ringan.",
                details_json: JSON.stringify({
                    penggunaan: ["riding ringan", "kerja ringan"],
                    catatan: ["pilih ukuran pas"],
                }),
            },
            {
                id: 8,
                title: "Sabun",
                price: 12000,
                ai_recommended: false,
                category: "Home" as const,
                description: "Sabun untuk kebutuhan mandi harian. Praktis dan ekonomis.",
                details_json: JSON.stringify({
                    kategori: "kebersihan",
                    penggunaan: ["mandi"],
                    catatan: ["cek kecocokan untuk kulit sensitif"],
                }),
            },
            {
                id: 9,
                title: "Handuk",
                price: 45000,
                ai_recommended: false,
                category: "Home" as const,
                description: "Handuk untuk mandi dan olahraga ringan. Nyaman dan mudah dipakai.",
                details_json: JSON.stringify({
                    kategori: "handuk",
                    penggunaan: ["mandi", "olahraga ringan"],
                    tips: ["cuci sebelum dipakai pertama kali"],
                }),
            },
            {
                id: 10,
                title: "Lampu",
                price: 89000,
                ai_recommended: false,
                category: "Home" as const,
                description: "Lampu rumah untuk pencahayaan ruangan. Cocok untuk kamar atau ruang tamu.",
                details_json: JSON.stringify({
                    kategori: "pencahayaan",
                    area: ["kamar", "ruang tamu"],
                    tips: ["sesuaikan watt dengan ukuran ruangan"],
                }),
            },
        ],
        []
    );

    const filteredProducts = useMemo(() => {
        if (selectedCategory === "All") return products;
        return products.filter((p) => p.category === selectedCategory);
    }, [products, selectedCategory]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("wishlist");
            if (!raw) return;
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                setWishlist(
                    parsed
                        .filter((x) => x && typeof x === "object")
                        .map((x: any) => ({
                            id: Number(x.id),
                            title: String(x.title),
                            price: Number(x.price),
                        }))
                        .filter((x) => Number.isFinite(x.id) && x.title && Number.isFinite(x.price))
                );
            }
        } catch {
            return;
        }
    }, []);

    const persistWishlist = (next: Array<{ id: number; title: string; price: number }>) => {
        setWishlist(next);
        try {
            localStorage.setItem("wishlist", JSON.stringify(next));
        } catch {
            return;
        }
    };

    const toggleWishlist = (item: { id: number; title: string; price: number }) => {
        const exists = wishlist.some((w) => w.id === item.id);
        const next = exists ? wishlist.filter((w) => w.id !== item.id) : [...wishlist, item];
        persistWishlist(next);
    };

    const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000", []);

    const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [aiOpen, chatMessages.length]);

    const animateAssistantMessage = (messageId: string, fullText: string) => {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);

        let i = 0;
        typingTimerRef.current = setInterval(() => {
            i += 2;
            const next = fullText.slice(0, i);
            setChatMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, text: next, typing: i < fullText.length } : m))
            );
            if (i >= fullText.length) {
                if (typingTimerRef.current) clearInterval(typingTimerRef.current);
                typingTimerRef.current = null;
            }
        }, 20);
    };

    const sendToAi = async () => {
        const intent = chatInput.trim();
        if (!intent) return;

        const userId = `u_${Date.now()}`;
        const assistantId = `a_${Date.now()}`;
        setChatMessages((prev) => [...prev, { id: userId, role: "user", text: intent }]);
        setChatMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: "", typing: true }]);
        setChatInput("");
        setChatLoading(true);

        try {
            const url = `${backendUrl}/ai/support`;
            const body = { message: intent };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: `e_${Date.now()}`,
                        role: "assistant",
                        text: `Gagal panggil AI (${res.status}). ${errText}`,
                    },
                ]);
                setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
                return;
            }
            const data = await res.json();
            const answer = String(data?.answer ?? "(no answer)");
            animateAssistantMessage(assistantId, answer);
        } catch (e) {
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `e_${Date.now()}`,
                    role: "assistant",
                    text: "Tidak bisa connect ke backend AI. Pastikan backend jalan dan NEXT_PUBLIC_BACKEND_URL benar.",
                },
            ]);
            setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
        } finally {
            setChatLoading(false);
        }
    };

    const sendQuickMessage = async (message: string) => {
        const intent = message.trim();
        if (!intent) return;

        const userId = `u_${Date.now()}`;
        const assistantId = `a_${Date.now()}`;
        setChatMessages((prev) => [...prev, { id: userId, role: "user", text: intent }]);
        setChatMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: "", typing: true }]);
        setChatLoading(true);

        try {
            const url = `${backendUrl}/ai/support`;
            const body = { message: intent };
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: `e_${Date.now()}`,
                        role: "assistant",
                        text: `Gagal panggil AI (${res.status}). ${errText}`,
                    },
                ]);
                setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
                return;
            }
            const data = await res.json();
            const answer = String(data?.answer ?? "(no answer)");
            animateAssistantMessage(assistantId, answer);
        } catch (e) {
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `e_${Date.now()}`,
                    role: "assistant",
                    text: "Tidak bisa connect ke backend AI. Pastikan backend jalan dan NEXT_PUBLIC_BACKEND_URL benar.",
                },
            ]);
            setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-zinc-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                        <User className="h-6 w-6 text-zinc-500" />
                    </div>
                </div>
                <h1 className="text-lg font-bold text-zinc-900">Marketplace</h1>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <ShoppingCart className="h-6 w-6 text-zinc-700" />
                </Button>
            </header>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white sticky top-[64px] z-20 shadow-sm border-t border-zinc-100">
                <div className="relative flex items-center gap-2">
                    <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
                    <Input
                        className="pl-9 pr-10 rounded-full bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                        placeholder="Search products, brands..."
                    />
                    <Button variant="ghost" size="icon" className="absolute right-0 text-zinc-400 hover:text-zinc-600">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <main className="flex-1 px-4 py-4 space-y-6">

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {(["All", "Electronics", "Apparel", "Home"] as const).map((cat) => (
                        <Button
                            key={cat}
                            variant={cat === selectedCategory ? "default" : "secondary"}
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-full px-6 whitespace-nowrap ${cat === selectedCategory ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* Featured Products */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Featured Products</h2>
                        <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {filteredProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                title={p.title}
                                price={p.price}
                                liked={wishlist.some((w) => w.id === p.id)}
                                onToggleLike={() => toggleWishlist({ id: p.id, title: p.title, price: p.price })}
                            />
                        ))}
                    </div>
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-20 right-4 z-40">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition-all"
                    onClick={() => {
                        setAiOpen(true);
                        setChatMessages([]);
                    }}
                >
                    <Sparkles className="h-7 w-7" />
                </Button>
            </div>

            {aiOpen && (
                <div className="fixed inset-0 z-[60]">
                    <button
                        aria-label="Close AI overlay"
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => setAiOpen(false)}
                    />

                    <div className="absolute bottom-24 left-1/2 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2">
                        <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden h-[70vh] max-h-[70vh] flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="leading-tight">
                                        <div className="font-semibold text-zinc-900">AI Support</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                Online & Ready to help
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-zinc-500 hover:text-zinc-700"
                                    onClick={() => setAiOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-auto px-4 py-4 space-y-4 bg-white">
                                <div className="flex items-center justify-center">
                                    <div className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 rounded-full px-3 py-1">TODAY</div>
                                </div>

                                {chatMessages.map((m) => (
                                    <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                                        <div
                                            className={
                                                m.role === "user"
                                                    ? "max-w-[85%] rounded-2xl rounded-tr-md bg-blue-600 text-white px-4 py-3 text-sm shadow-sm"
                                                    : "max-w-[85%] rounded-2xl rounded-tl-md bg-zinc-100 text-zinc-800 px-4 py-3 text-sm"
                                            }
                                        >
                                            {m.role === "assistant" && (
                                                <div className="text-[10px] font-bold text-zinc-400 mb-1 tracking-wide">ASSISTANT</div>
                                            )}
                                            {m.role === "user" && (
                                                <div className="text-[10px] font-bold text-white/70 mb-1 tracking-wide text-right">YOU</div>
                                            )}
                                            <div className="leading-relaxed">
                                                {m.role === "assistant" && m.typing && !m.text ? (
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
                                                            style={{ animationDelay: "0ms" }}
                                                        />
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
                                                            style={{ animationDelay: "150ms" }}
                                                        />
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
                                                            style={{ animationDelay: "300ms" }}
                                                        />
                                                    </div>
                                                ) : (
                                                    m.text
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div ref={chatEndRef} />

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button
                                        variant="secondary"
                                        className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                        onClick={() => void sendQuickMessage("Cara pesan produk")}
                                        disabled={chatLoading}
                                    >
                                        Cara pesan produk
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                        onClick={() => void sendQuickMessage("Cara bayar")}
                                        disabled={chatLoading}
                                    >
                                        Cara bayar
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                        onClick={() => void sendQuickMessage("Cek status pesanan")}
                                        disabled={chatLoading}
                                    >
                                        Cek status pesanan
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 p-3 bg-white">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="rounded-full text-zinc-500 hover:text-zinc-700">
                                        <span className="sr-only">Add</span>
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                                            +
                                        </span>
                                    </Button>

                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Tanya tentang fitur aplikasi..."
                                            className="rounded-full bg-zinc-50 border-zinc-200 pr-12 focus-visible:ring-1 focus-visible:ring-blue-500"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            disabled={chatLoading}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") void sendToAi();
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => void sendToAi()}
                                            disabled={chatLoading}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

function ProductCard({
    title,
    price,
    liked,
    onToggleLike,
}: {
    title: string;
    price: number;
    liked: boolean;
    onToggleLike: () => void;
}) {
    const imageMap: Record<string, string> = {
        "Earbuds Bluetooth": "/earbuds.jpeg",
        "Power Bank 10.000mAh": "/powerbank.jpeg",
        "Kaos Oversize": "/kaos.jpeg",
        "Hoodie Basic": "/hoodie.jpeg",
        "Lampu Meja Minimalis": "/lampu_meja.jpeg",
        "Set Handuk Rumah": "/handuk.jpeg",
        "Sarung Tangan": "/sarung.jpeg",
        "Sabun": "/sabun.jpeg",
        "Handuk": "/handuk.jpeg",
        "Lampu": "/lampu.jpeg",
    };
    const resolvedImageSrc = imageMap[title] ?? "/cas.jpeg";
    const priceText = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(price);
    return (
        <Card className="overflow-hidden border-none shadow-sm bg-transparent group">
            <div className="relative aspect-square w-full rounded-xl bg-zinc-100 overflow-hidden">
                {/* Image or Placeholder */}
                {resolvedImageSrc ? (
                    <div className="relative h-full w-full">
                        <Image
                            src={resolvedImageSrc}
                            alt={title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 gap-1">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-[10px] font-medium uppercase tracking-wide">Image Slot</span>
                    </div>
                )}

                {/* Favorite Button */}
                <button
                    type="button"
                    onClick={onToggleLike}
                    className={
                        "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-colors hover:bg-white " +
                        (liked ? "text-red-500" : "text-zinc-500 hover:text-red-500")
                    }
                    aria-pressed={liked}
                    aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart className={"h-3.5 w-3.5 " + (liked ? "fill-red-500" : "")}
                    />
                </button>
            </div>

            <div className="pt-3 pb-2 space-y-2">
                <div>
                    <h3 className="font-semibold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h3>
                </div>

                <div className="text-lg font-bold text-blue-600">{priceText}</div>

                <Button className="w-full text-xs h-8 font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-none">
                    ADD
                </Button>

            </div>
        </Card>
    )
}

