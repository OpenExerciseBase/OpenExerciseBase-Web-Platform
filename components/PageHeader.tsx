"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/documentation", label: "Documentation" },
  { href: "/explore", label: "Explore exercises" },
  { href: "/insights", label: "Database Statistics & Insights" },
  { href: "/add", label: "Add exercises" },
  { href: "/review", label: "Review exercises" },
  { href: "/study", label: "Study" },
];

export default function PageHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          <div className="relative h-12 w-[144px] shrink-0 lg:h-16 lg:w-[192px]">
            <Image
              src="/oed_logo_noback.png"
              alt="OpenExerciseBase"
              fill
              className="object-contain"
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-gray-600">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "text-primary font-semibold"
                  : "hover:text-primary transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-md px-6 pb-4 pt-2">
          <div className="flex flex-col gap-2 text-sm font-medium text-gray-600">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`py-1.5 ${isActive(item.href) ? "text-primary font-semibold" : "hover:text-primary"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
