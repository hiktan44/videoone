"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Minus, Shield, Loader2 } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  creditBalance: number;
  role: string;
  createdAt: string;
  _count: { projects: number; jobs: number };
};

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Yetkisiz erişim");
        setUsers([]);
      } else {
        setUsers(data.users || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) load("");
  }, [isLoaded, isSignedIn, load]);

  const adjustCredits = async (userId: string, amount: number) => {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: amount > 0 ? "addCredits" : "chargeCredits",
          amount: Math.abs(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Hata");
      } else {
        await load(search);
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "setRole",
          role: currentRole === "admin" ? "user" : "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Hata");
      else await load(search);
    } finally {
      setBusy(null);
    }
  };

  if (!isLoaded) return <div className="h-screen bg-ink-950" />;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-300">
        Giriş yapmalısın
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xs text-ink-300 hover:text-ink-50 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Ana Sayfa
          </Link>
          <div className="flex items-center gap-2 text-base font-bold">
            <Shield className="h-4 w-4 text-amber-400" />
            Admin Paneli
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(search)}
              placeholder="Email veya isim ara..."
              className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => load(search)}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-2 text-sm font-semibold"
          >
            Ara
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-300 mb-4">
            {error}
            {error.includes("Forbidden") && (
              <div className="mt-2 text-xs text-coral-400/80">
                Bu sayfayı görmek için admin rolün olmalı. Postgres'te User.role = "admin" olarak güncelle.
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-ink-700 bg-ink-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="text-left px-4 py-3">Kullanıcı</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-right px-4 py-3">Krediler</th>
                  <th className="text-right px-4 py-3">Projeler</th>
                  <th className="text-right px-4 py-3">İşler</th>
                  <th className="text-center px-4 py-3">Rol</th>
                  <th className="text-right px-4 py-3">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-ink-800 hover:bg-ink-900/60">
                    <td className="px-4 py-3">
                      <div className="text-ink-100 font-medium">{u.name || "—"}</div>
                      <div className="text-[11px] text-ink-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.plan === "max"
                            ? "text-[11px] rounded bg-cyan-500/15 text-cyan-300 px-2 py-0.5"
                            : u.plan === "pro"
                              ? "text-[11px] rounded bg-amber-500/15 text-amber-300 px-2 py-0.5"
                              : "text-[11px] rounded bg-ink-800 text-ink-300 px-2 py-0.5"
                        }
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-300 font-medium">
                      {u.creditBalance.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-200">{u._count.projects}</td>
                    <td className="px-4 py-3 text-right text-ink-200">{u._count.jobs}</td>
                    <td className="px-4 py-3 text-center">
                      {u.role === "admin" ? (
                        <span className="text-[11px] rounded bg-coral-500/15 text-coral-300 px-2 py-0.5 inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          admin
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-400">user</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={busy === u.id}
                          onClick={() => adjustCredits(u.id, 100)}
                          title="+100 kredi"
                          className="h-7 w-7 rounded-md hover:bg-emerald-500/15 text-emerald-400 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={busy === u.id}
                          onClick={() => adjustCredits(u.id, -100)}
                          title="-100 kredi"
                          className="h-7 w-7 rounded-md hover:bg-coral-500/15 text-coral-400 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={busy === u.id}
                          onClick={() => toggleAdmin(u.id, u.role)}
                          title="Admin rolünü değiştir"
                          className="h-7 w-7 rounded-md hover:bg-amber-500/15 text-amber-400 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-ink-500 text-sm">
                      Kullanıcı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-ink-500">
          Toplam: <span className="text-ink-300">{users.length}</span> kullanıcı
        </div>
      </main>
    </div>
  );
}
