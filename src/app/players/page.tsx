"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Position = "GK" | "DF" | "MF" | "FW";

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: Position | null;
  nationality: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  team_name: string | null;
  league: string | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

function formatDateOnly(v: string | null): string {
  if (!v) return "-";
  // รองรับทั้ง "YYYY-MM-DD" และ ISO
  return v.includes("T") ? v.split("T")[0] : v;
}

export default function PlayersPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/players", { cache: "no-store" });
      const data: unknown = await res.json();
      setPlayers(Array.isArray(data) ? (data as Player[]) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  async function onDelete(id: number) {
    if (!confirm("ยืนยันการลบข้อมูลนักฟุตบอลคนนี้?")) return;

    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      alert(text || "Delete failed");
      return;
    }

    await fetchPlayers();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.35),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.20),transparent_55%)]" />
          <div className="relative px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-300 ring-1 ring-green-400/25">
                  <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                  Football Players
                </div>
                <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  ⚽ ระบบจัดการข้อมูลนักฟุตบอล
                </h1>
                <p className="mt-1 text-sm text-zinc-300">
                  แสดงข้อมูล / เพิ่ม / แก้ไข / ลบ ผ่าน API
                </p>
              </div>

              <button
                onClick={() => router.push("/players/create")}
                className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-2.5 text-sm font-extrabold text-black shadow-[0_0_18px_rgba(34,197,94,0.55)] hover:bg-green-400 transition"
              >
                + เพิ่มนักฟุตบอล
              </button>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-400" />
        </div>

        {/* TABLE CARD */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              🏟️ รายชื่อนักฟุตบอล
            </h2>
            <span className="text-xs text-zinc-300">
              {loading ? "Loading..." : `ทั้งหมด ${players.length} คน`}
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-zinc-300 whitespace-nowrap">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">ชื่อ</th>
                    <th className="px-4 py-3 text-left">นามสกุล</th>
                    <th className="px-4 py-3 text-center">เบอร์</th>
                    <th className="px-4 py-3 text-center">ตำแหน่ง</th>

                    <th className="px-4 py-3 text-left">สัญชาติ</th>
                    <th className="px-4 py-3 text-center">วันเกิด</th>
                    <th className="px-4 py-3 text-center">ส่วนสูง</th>
                    <th className="px-4 py-3 text-center">น้ำหนัก</th>

                    <th className="px-4 py-3 text-left">ทีม</th>
                    <th className="px-4 py-3 text-left">ลีก</th>

                    <th className="px-4 py-3 text-center">G</th>
                    <th className="px-4 py-3 text-center">A</th>
                    <th className="px-4 py-3 text-center">YC</th>
                    <th className="px-4 py-3 text-center">RC</th>

                    <th className="px-4 py-3 text-center">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && players.length === 0 && (
                    <tr>
                      <td
                        colSpan={16}
                        className="py-10 text-center text-zinc-300"
                      >
                        ยังไม่มีข้อมูลนักฟุตบอล
                      </td>
                    </tr>
                  )}

                  {players.map((p) => (
                    <tr
                      key={p.id}
                      className="bg-white/5 hover:bg-white/10 transition rounded-xl"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center rounded-lg bg-white/5 px-2 py-1 font-semibold text-zinc-100 ring-1 ring-white/10">
                          #{p.id}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm font-extrabold text-white whitespace-nowrap">
                        {p.first_name}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                        {p.last_name}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.jersey_number ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.position ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                        {p.nationality ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {formatDateOnly(p.date_of_birth)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.height_cm ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.weight_kg ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                        {p.team_name ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                        {p.league ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.goals ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.assists ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.yellow_cards ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200 whitespace-nowrap">
                        {p.red_cards ?? 0}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/players/edit/${p.id}`)}
                            className="inline-flex items-center justify-center rounded-full bg-white/5 px-4 py-2 text-xs font-extrabold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
                          >
                            แก้ไข
                          </button>

                          <button
                            onClick={() => onDelete(p.id)}
                            className="inline-flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-xs font-extrabold text-black shadow-[0_0_14px_rgba(239,68,68,0.45)] hover:bg-red-400 transition"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}