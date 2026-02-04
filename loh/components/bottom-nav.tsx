"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, ShoppingCart, User } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/cart", label: "Cart", Icon: ShoppingCart },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 px-6 py-2 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 p-1 ${
                active ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
