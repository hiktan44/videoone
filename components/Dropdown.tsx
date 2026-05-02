"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import clsx from "clsx";

export type DropdownGroup = {
  label: string;
  options: string[];
};

type Props = {
  value: string;
  options?: readonly string[] | string[];
  groups?: DropdownGroup[]; // gruplar verilirse options yerine bunlar gosterilir
  onChange: (v: string) => void;
  className?: string;
  buttonClassName?: string;
  label?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
  searchable?: boolean;
};

export function Dropdown({
  value,
  options,
  groups,
  onChange,
  className,
  buttonClassName,
  label,
  align = "left",
  size = "md",
  searchable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Toplam opsiyon sayisi (search aktive etme esigi)
  const totalCount = groups
    ? groups.reduce((s, g) => s + g.options.length, 0)
    : (options?.length ?? 0);
  const showSearch = searchable || totalCount > 12;

  const filteredGroups = useMemo<DropdownGroup[]>(() => {
    const q = query.trim().toLowerCase();
    if (groups) {
      return groups
        .map((g) => ({ ...g, options: g.options.filter((o) => !q || o.toLowerCase().includes(q)) }))
        .filter((g) => g.options.length > 0);
    }
    return [{ label: "", options: (options ?? []).filter((o) => !q || o.toLowerCase().includes(q)) }];
  }, [groups, options, query]);

  return (
    <div ref={ref} className={clsx("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80 text-zinc-200 transition-colors",
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
          buttonClassName
        )}
      >
        {label ? <span className="text-zinc-500 mr-1">{label}:</span> : null}
        <span className="truncate max-w-[180px]">{value}</span>
        <ChevronDown className={clsx("h-3.5 w-3.5 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          className={clsx(
            "absolute z-[100] mt-2 min-w-[260px] rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/50 max-h-[360px] overflow-hidden flex flex-col",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {showSearch ? (
            <div className="p-2 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          ) : null}

          <div className="overflow-y-auto scrollbar-thin py-1 flex-1">
            {filteredGroups.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-500">Sonuç yok.</div>
            ) : (
              filteredGroups.map((g, gi) => (
                <div key={g.label || `g${gi}`}>
                  {g.label ? (
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                      {g.label}
                    </div>
                  ) : null}
                  {g.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-zinc-900",
                        opt === value ? "text-white" : "text-zinc-300"
                      )}
                    >
                      <span className="truncate">{opt}</span>
                      {opt === value ? <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" /> : null}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
