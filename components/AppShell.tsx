"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { GenerationPanel } from "@/components/GenerationPanel";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function AppShell({ children, title, subtitle }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {title && (
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink-50">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-ink-400">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
      <GenerationPanel />
    </div>
  );
}
