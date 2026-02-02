"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Heart, Home, Compass, User, Sparkles, Filter, Star, Image as ImageIcon, X, Send, Bot } from "lucide-react";
import { useMemo, useState } from "react";

export default function Dashboard() {
    const [aiOpen, setAiOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number; title: string } | null>(null);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "assistant" | "user"; text: string }>>([
        {
            id: "m1",
            role: "assistant",
            text: "Pilih produk dulu, lalu tulis kebutuhan kamu. Aku bantu jelasin dan rekomendasi berdasarkan detail produk di database.",
        },
    ]);
    const products = useMemo(
        () => [
            { id: 1, title: "Sarung Tangan", price: 35.0, rating: 4.8, reviews: 124, ai_recommended: false },
            { id: 2, title: "Sabun", price: 35.0, rating: 4.9, reviews: 82, ai_recommended: false },
            { id: 3, title: "Handuk", price: 35.0, rating: 4.6, reviews: 56, ai_recommended: false },
            { id: 4, title: "Lampu", price: 35.0, rating: 5.0, reviews: 214, ai_recommended: false },
        ],
        []
    );

    const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000", []);

    const sendToAi = async () => {
        const intent = chatInput.trim();
        if (!intent) return;

        if (!selectedProduct) {
            setChatMessages((prev) => [
                ...prev,
                { id: `u_${Date.now()}`, role: "user", text: intent },
                {
                    id: `a_${Date.now()}`,
                    role: "assistant",
                    text: "Pilih produk dulu dengan klik tombol AI di kartu produk (mis. Lampu/Sabun). Setelah itu aku bisa jawab berdasarkan detail produk di database.",
                },
            ]);
            setChatInput("");
            return;
        }

        const userId = `u_${Date.now()}`;
        setChatMessages((prev) => [...prev, { id: userId, role: "user", text: intent }]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await fetch(`${backendUrl}/ai/product/${selectedProduct.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intent }),
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
                return;
            }
            const data = await res.json();
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `a_${Date.now()}`,
                    role: "assistant",
                    text: String(data?.answer ?? "(no answer)"),
                },
            ]);
        } catch (e) {
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `e_${Date.now()}`,
                    role: "assistant",
                    text: "Tidak bisa connect ke backend AI. Pastikan backend jalan dan NEXT_PUBLIC_BACKEND_URL benar.",
                },
            ]);
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
                    {["All", "Electronics", "Apparel", "Home", "Beauty", "Sports"].map((cat, i) => (
                        <Button
                            key={cat}
                            variant={i === 0 ? "default" : "secondary"}
                            className={`rounded-full px-6 whitespace-nowrap ${i === 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
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

                    <div className="grid grid-cols-4 gap-3">
                        {products.map((p) => (
                            <ProductCard
                                key={p.id}
                                title={p.title}
                                price={p.price}
                                rating={p.rating}
                                reviews={p.reviews}
                                aiRecommended={p.ai_recommended}
                                onOpenAi={() => {
                                    setSelectedProduct({ id: p.id, title: p.title });
                                    setAiOpen(true);
                                    setChatMessages([
                                        {
                                            id: `m_${Date.now()}`,
                                            role: "assistant",
                                            text: `Oke, kita bahas produk: ${p.title}. Tulis kebutuhan kamu (contoh: mau buat kamar tidur, hemat listrik, dll).`,
                                        },
                                    ]);
                                }}
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
                        if (!selectedProduct) {
                            setChatMessages([
                                {
                                    id: `m_${Date.now()}`,
                                    role: "assistant",
                                    text: "Pilih produk dulu dengan klik kartu produk. Setelah itu kamu bisa tanya di sini.",
                                },
                            ]);
                        }
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

                    <div className="absolute bottom-24 left-1/2 w-[min(460px,calc(100vw-2rem))] -translate-x-1/2">
                        <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="leading-tight">
                                        <div className="font-semibold text-zinc-900">AI Shopping Assistant</div>
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

                            <div className="max-h-[55vh] overflow-auto px-4 py-4 space-y-4 bg-white">
                                <div className="flex items-center justify-center">
                                    <div className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 rounded-full px-3 py-1">
                                        TODAY
                                    </div>
                                </div>

                                {chatMessages.map((m) => (
                                    <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                                        <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-tr-md bg-blue-600 text-white px-4 py-3 text-sm shadow-sm" : "max-w-[85%] rounded-2xl rounded-tl-md bg-zinc-100 text-zinc-800 px-4 py-3 text-sm"}>
                                            {m.role === "assistant" && (
                                                <div className="text-[10px] font-bold text-zinc-400 mb-1 tracking-wide">
                                                    ASSISTANT
                                                </div>
                                            )}
                                            {m.role === "user" && (
                                                <div className="text-[10px] font-bold text-white/70 mb-1 tracking-wide text-right">
                                                    YOU
                                                </div>
                                            )}
                                            <div className="leading-relaxed">{m.text}</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button variant="secondary" className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
                                        Compare specs
                                    </Button>
                                    <Button variant="secondary" className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
                                        Check reviews
                                    </Button>
                                    <Button variant="secondary" className="h-8 rounded-full text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
                                        Delivery time
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
                                            placeholder={selectedProduct ? `Tanya tentang ${selectedProduct.title}...` : "Pilih produk dulu..."}
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
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 px-6 py-2 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                    <NavIcon icon={Home} label="Home" active />
                    <NavIcon icon={Compass} label="Explore" />
                    <NavIcon icon={Heart} label="Wishlist" />
                    <NavIcon icon={ShoppingCart} label="Cart" />
                    <NavIcon icon={User} label="Profile" />
                </div>
            </nav>
        </div>
    );
}

function ProductCard({ title, price, rating, reviews, aiRecommended, onOpenAi }: { title: string, price: number, rating: number, reviews: number, aiRecommended: boolean, onOpenAi: () => void }) {
    const imageMap: Record<string, string> = {
        "Sarung Tangan": "/sarung.jpeg",
        "Sabun": "/sabun.jpeg",
        "Handuk": "/handuk.jpeg",
        "Lampu": "/lampu.jpeg",
    };
    const resolvedImageSrc = imageMap[title];
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

                {/* AI Badge */}
                {aiRecommended && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI PICK
                    </div>
                )}

                {/* Favorite Button */}
                <button className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-colors hover:bg-white text-zinc-500 hover:text-red-500">
                    <Heart className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="pt-3 pb-2 space-y-2">
                <div>
                    <h3 className="font-semibold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-zinc-600">{rating}</span>
                        <span className="text-xs text-zinc-400">({reviews})</span>
                    </div>
                </div>

                <div className="text-lg font-bold text-blue-600">
                    ${price.toFixed(2)}
                </div>

                <Button className="w-full text-xs h-8 font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-none">
                    ADD
                </Button>

                <Button
                    variant="secondary"
                    className="w-full text-xs h-8 font-medium rounded-md shadow-none bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    onClick={onOpenAi}
                >
                    AI
                </Button>
            </div>
        </Card>
    )
}

function NavIcon({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={`flex flex-col items-center gap-1 p-1 ${active ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <Icon className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    )
}
