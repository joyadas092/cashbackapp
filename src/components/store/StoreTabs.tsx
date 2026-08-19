"use client";

import { useState, type ReactNode } from "react";

export interface StoreTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Tab strip on the store page. Content is rendered on the server and handed in
 * as ReactNode, so switching tabs is a pure client toggle with no refetch.
 * Panels are all mounted and hidden with `hidden` rather than unmounted, so
 * the text stays in the DOM for search engines and in-page find.
 */
export function StoreTabs({ tabs }: { tabs: StoreTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;

  return (
    <div className="rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div
        role="tablist"
        aria-label="Store information"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 sm:px-4"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="p-5 sm:p-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
