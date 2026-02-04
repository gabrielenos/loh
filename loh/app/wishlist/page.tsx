"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, Trash2, Image as ImageIcon } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const [items, setItems] = useState<Array<{ id: number; title: string; price: number }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wishlist");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      setItems(
        parsed
          .filter((x) => x && typeof x === "object")
          .map((x: any) => ({
            id: Number(x.id),
            title: String(x.title),
            price: Number(x.price),
          }))
          .filter((x) => Number.isFinite(x.id) && x.title && Number.isFinite(x.price))
      );
    } catch {
      return;
    }
  }, []);

  const persist = (next: Array<{ id: number; title: string; price: number }>) => {
    setItems(next);
    try {
      localStorage.setItem("wishlist", JSON.stringify(next));
    } catch {
      return;
    }
  };

  const removeItem = (id: number) => {
    persist(items.filter((x) => x.id !== id));
  };

  const imageMap = useMemo(() => {
    return {
      "Earbuds Bluetooth": "/cas.jpeg",
      "Power Bank 10.000mAh": "/cas.jpeg",
      "Kaos Oversize": "/cas.jpeg",
      "Hoodie Basic": "/cas.jpeg",
      "Lampu Meja Minimalis": "/lampu.jpeg",
      "Set Handuk Rumah": "/handuk.jpeg",
      "Sarung Tangan": "/sarung.jpeg",
      "Sabun": "/sabun.jpeg",
      "Handuk": "/handuk.jpeg",
      "Lampu": "/lampu.jpeg",
    } as Record<string, string>;
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 pt-8 pb-24">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-zinc-700" />
              <h1 className="text-2xl font-semibold text-zinc-900">Wishlist</h1>
            </div>
            <p className="text-sm text-zinc-500">Halaman ini bisa kamu isi untuk fitur wishlist.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white border border-zinc-200 p-5 text-sm text-zinc-600">
            Belum ada produk di wishlist.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => {
              const src = imageMap[p.title] ?? "/cas.jpeg";
              return (
                <Card key={p.id} className="overflow-hidden border-none shadow-sm bg-transparent group">
                  <div className="relative aspect-square w-full rounded-xl bg-zinc-100 overflow-hidden">
                    {src ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={src}
                          alt={p.title}
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

                    <button
                      type="button"
                      onClick={() => removeItem(p.id)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-colors hover:bg-white text-red-500"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="h-3.5 w-3.5 fill-red-500" />
                    </button>
                  </div>

                  <div className="pt-3 pb-2 space-y-2">
                    <div>
                      <h3 className="font-semibold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{formatPrice(p.price)}</div>

                    <div className="flex items-center gap-2">
                      <Button className="flex-1 text-xs h-8 font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-none">
                        ADD
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        onClick={() => removeItem(p.id)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
