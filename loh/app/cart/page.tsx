"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

export default function CartPage() {
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
              <ShoppingCart className="h-5 w-5 text-zinc-700" />
              <h1 className="text-2xl font-semibold text-zinc-900">Cart</h1>
            </div>
            <p className="text-sm text-zinc-500">Halaman ini bisa kamu isi untuk fitur cart.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-zinc-200 p-5 text-sm text-zinc-600">
          Coming soon.
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
