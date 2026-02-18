"use client";

import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex items-center justify-between px-6 py-2">
        {/* Logo & brand */}
        <a href="/" className="flex items-center gap-4">
          <div className="relative h-[80px] w-[80px] shrink-0">
            <Image
              src="/logo.png"
              alt="Open Exercise Database logo"
              fill
              className="rounded-lg object-contain"
            />
          </div>
          <span className="self-center text-xl font-semibold text-gray-900 tracking-tight leading-tight">
            Open Exercise Database
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="/documentation" className="hover:text-primary transition-colors">
              What is the OEDB
            </a>
            <a href="/explore" className="hover:text-primary transition-colors">
              Explore exercises
            </a>
            <a
              href="/contribution-guidelines"
              className="hover:text-primary transition-colors"
            >
              How to contribute
            </a>
            <a href="/review" className="hover:text-primary transition-colors">
              Professional exercise review
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/explore"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-deep transition-colors"
            >
              Browse exercises
            </a>
            <a
              href="/add"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              Add an exercise
            </a>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-md px-6 pb-4 pt-2">
          <div className="flex flex-col gap-3 text-sm font-medium text-gray-600">
            <a href="/documentation" className="py-1 hover:text-primary">
              What is the OEDB
            </a>
            <a href="/explore" className="py-1 hover:text-primary">
              Explore exercises
            </a>
            <a href="/contribution-guidelines" className="py-1 hover:text-primary">
              How to contribute
            </a>
            <a href="/review" className="py-1 hover:text-primary">
              Professional exercise review
            </a>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="/explore"
              className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white"
            >
              Browse exercises
            </a>
            <a
              href="/add"
              className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700"
            >
              Add an exercise
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
