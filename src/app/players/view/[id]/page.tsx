"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  return v.includes("T") ? v.split("T")[0] : v;
}

function InfoRow(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <div className="text-sm font-semibold text-zinc-300">{props.label}</div>
      <div className="text-sm font-extrabold text-white text-right">
        {props.value}
      </div>
    </div>
  );
}

export default function PlayerViewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!Number.isInteger(id) || id <= 0) {
        setError("Invalid id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/players/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Fetch failed");
        }
        const data = (await res.json()) as Player;

        if (!alive) return;
        setPlayer(data);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Fetch failed");
        setPlayer(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.30),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="relative px-6 py-6 sm:px-10 sm:py-8 flex items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-300 ring-1 ring-blue-400/25">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                Player Detail
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                👤 รายละเอียดนักฟุตบอล
              </h1>
              <p className="mt-1 text-sm text-zinc-300">
                ดูข้อมูลแบบ read-only จาก API
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.back()}
                className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
              >
                กลับ
              </button>

            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-400 via-green-500 to-emerald-400" />
        </div>

        {/* BODY */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              🧾 ข้อมูลนักฟุตบอล
            </h2>
            <span className="text-xs text-zinc-300">
              {loading ? "Loading..." : player ? `ID #${player.id}` : "-"}
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {loading && (
              <div className="text-sm text-zinc-300">Loading...</div>
            )}

            {!loading && error && (
              <div className="rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-400/25 px-4 py-3">
                {error}
              </div>
            )}

            {!loading && !error && player && (
              <div className="space-y-3">
                <InfoRow label="ID" value={`#${player.id}`} />
                <InfoRow label="First name" value={player.first_name} />
                <InfoRow label="Last name" value={player.last_name} />
                <InfoRow label="Jersey number" value={player.jersey_number ?? "-"} />
                <InfoRow label="Position" value={player.position ?? "-"} />
                <InfoRow label="Nationality" value={player.nationality ?? "-"} />
                <InfoRow label="Date of birth" value={formatDateOnly(player.date_of_birth)} />
                <InfoRow label="Height (cm)" value={player.height_cm ?? "-"} />
                <InfoRow label="Weight (kg)" value={player.weight_kg ?? "-"} />
                <InfoRow label="Team name" value={player.team_name ?? "-"} />
                <InfoRow label="League" value={player.league ?? "-"} />

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-sm font-extrabold text-white tracking-tight">
                    📊 Match Stats
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoRow label="Goals" value={player.goals ?? 0} />
                    <InfoRow label="Assists" value={player.assists ?? 0} />
                    <InfoRow label="Yellow cards" value={player.yellow_cards ?? 0} />
                    <InfoRow label="Red cards" value={player.red_cards ?? 0} />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}