"use client";

import { useState, useEffect, useCallback } from "react";

export interface TocItem {
  id: string;
  label: string;
}

interface Props {
  items: TocItem[];
}

function useTocObserver(items: TocItem[]) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

export function MobileTableOfContents({ items }: Props) {
  const activeId = useTocObserver(items);
  const [open, setOpen] = useState(false);

  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setOpen(false);
      }
    },
    []
  );

  return (
    <div className="lg:hidden sticky top-[57px] z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-2.5 text-[13px] font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Contents
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <nav className="border-t border-gray-100 bg-white px-6 py-3 space-y-0.5 max-h-[60vh] overflow-y-auto">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => scrollTo(t.id)}
              className={`block w-full text-left px-2 py-1.5 rounded text-[13px] transition-colors ${
                activeId === t.id
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function DesktopTableOfContents({ items }: Props) {
  const activeId = useTocObserver(items);

  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <nav className="sticky top-20">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Contents
        </p>
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => scrollTo(t.id)}
            className={`block w-full text-left px-2.5 py-1.5 rounded text-[13px] transition-colors ${
              activeId === t.id
                ? "text-primary font-semibold bg-primary/5"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default function DocumentationTableOfContents({ items }: Props) {
  return (
    <>
      <MobileTableOfContents items={items} />
      <DesktopTableOfContents items={items} />
    </>
  );
}
