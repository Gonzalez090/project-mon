"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================================
   ✅ CLIENT PAGE: Edit Player (หน้าแก้ไขนักฟุตบอล)
   FLOW หลัก:
   1) อ่าน id จาก URL (/players/[id]/edit)
   2) โหลดข้อมูลเดิมด้วย GET /api/players/:id
   3) เติมค่าเข้า form (string ทั้งหมดเพื่อให้ input ใช้งานง่าย)
   4) กด Update -> แปลงชนิดข้อมูล -> PUT /api/players/:id
   5) สำเร็จแล้วกลับ /players
   ========================================================= */

/* =======================
   🔶 TYPES
   ======================= */
type Position = "GK" | "DF" | "MF" | "FW";

/* ข้อมูล Player ที่ได้จาก API/DB */
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

/* State ของฟอร์ม: เก็บเป็น string เพราะ input/select ส่งกลับเป็น string */
type PlayerFormState = {
  first_name: string;
  last_name: string;
  jersey_number: string;
  position: "" | Position;
  nationality: string;
  date_of_birth: string;
  height_cm: string;
  weight_kg: string;
  team_name: string;
  league: string;
  goals: string;
  assists: string;
  yellow_cards: string;
  red_cards: string;
};

/* =======================
   🔶 HELPERS (แปลงข้อมูล)
   ======================= */

/* แปลง number/null -> string สำหรับโชว์ใน input */
function toStr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return String(n);
}

/* แปลง string -> number หรือ null (ถ้าเว้นว่าง) */
function toNumOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/* แปลง string -> number โดย default = 0 (สำหรับ stats) */
function toNumOrZero(s: string): number {
  return toNumOrNull(s) ?? 0;
}

/* ทำวันที่ให้เป็น YYYY-MM-DD (ตัดเวลาออก ถ้ามี T) */
function toDateOnly(value: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.includes("T")) return v.split("T")[0];
  return v;
}

/* =========================================================
   ✅ PAGE COMPONENT
   ========================================================= */
export default function EditPlayerPage() {
  const router = useRouter();

  /* ✅ อ่าน id จาก route param */
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  /* ✅ ค่าเริ่มต้นฟอร์ม */
  const emptyForm: PlayerFormState = useMemo(
    () => ({
      first_name: "",
      last_name: "",
      jersey_number: "",
      position: "",
      nationality: "",
      date_of_birth: "",
      height_cm: "",
      weight_kg: "",
      team_name: "",
      league: "",
      goals: "0",
      assists: "0",
      yellow_cards: "0",
      red_cards: "0",
    }),
    []
  );

  const [form, setForm] = useState<PlayerFormState>(emptyForm);
  const [loading, setLoading] = useState(true); // ✅ สถานะโหลดข้อมูลเดิม
  const [saving, setSaving] = useState(false);  // ✅ สถานะกำลังอัปเดต

  /* =========================================================
     ✅ LOAD: GET /api/players/:id (โหลดข้อมูลเดิมมาเติมฟอร์ม)
     ========================================================= */
  useEffect(() => {
    let alive = true; // ✅ กัน state update หลัง unmount

    async function load() {
      /* validate id ขั้นต้น */
      if (!Number.isInteger(id) || id <= 0) {
        setLoading(false);
        alert("Invalid id");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/players/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());

        const p = (await res.json()) as Player;
        if (!alive) return;

        /* ✅ map ข้อมูล API -> form (string ทั้งหมด) */
        setForm({
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          jersey_number: toStr(p.jersey_number),
          position: p.position ?? "",
          nationality: p.nationality ?? "",
          date_of_birth: p.date_of_birth ? p.date_of_birth.split("T")[0] : "",
          height_cm: toStr(p.height_cm),
          weight_kg: toStr(p.weight_kg),
          team_name: p.team_name ?? "",
          league: p.league ?? "",
          goals: toStr(p.goals ?? 0),
          assists: toStr(p.assists ?? 0),
          yellow_cards: toStr(p.yellow_cards ?? 0),
          red_cards: toStr(p.red_cards ?? 0),
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, emptyForm]);

  /* ✅ handler เปลี่ยนค่า input/select */
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* =========================================================
     ✅ SUBMIT: PUT /api/players/:id (อัปเดตข้อมูล)
     ========================================================= */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      /* ✅ payload ส่งไป API: แปลงชนิดข้อมูลให้ DB ใช้ได้ */
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        jersey_number: toNumOrNull(form.jersey_number),
        position: form.position === "" ? null : form.position,
        nationality: form.nationality.trim() === "" ? null : form.nationality,
        date_of_birth: toDateOnly(form.date_of_birth),
        height_cm: toNumOrNull(form.height_cm),
        weight_kg: toNumOrNull(form.weight_kg),
        team_name: form.team_name.trim() === "" ? null : form.team_name,
        league: form.league.trim() === "" ? null : form.league,
        goals: toNumOrZero(form.goals),
        assists: toNumOrZero(form.assists),
        yellow_cards: toNumOrZero(form.yellow_cards),
        red_cards: toNumOrZero(form.red_cards),
      };

      const res = await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }

      /* ✅ สำเร็จ: กลับหน้าตาราง */
      router.push("/players");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ✅ UI
     ========================================================= */
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-extrabold">
              ✏️ แก้ไขนักฟุตบอล #{Number.isFinite(id) ? id : "-"}
            </h1>

            <button
              onClick={() => router.back()}
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
            >
              กลับ
            </button>
          </div>

          {/* ✅ Loading state */}
          {loading ? (
            <div className="mt-6 text-sm text-zinc-300">Loading...</div>
          ) : (
            /* ✅ Form state */
            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First name"
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                />
                <Field
                  label="Last name"
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Jersey number"
                  name="jersey_number"
                  type="number"
                  value={form.jersey_number}
                  onChange={onChange}
                />
                <SelectPosition value={form.position} onChange={onChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={onChange}
                />
                <Field
                  label="Date of birth"
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={onChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Height (cm)"
                  name="height_cm"
                  type="number"
                  value={form.height_cm}
                  onChange={onChange}
                />
                <Field
                  label="Weight (kg)"
                  name="weight_kg"
                  type="number"
                  value={form.weight_kg}
                  onChange={onChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Team name"
                  name="team_name"
                  value={form.team_name}
                  onChange={onChange}
                />
                <Field
                  label="League"
                  name="league"
                  value={form.league}
                  onChange={onChange}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-extrabold tracking-tight">
                  📊 Match Stats
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field
                    label="Goals"
                    name="goals"
                    type="number"
                    value={form.goals}
                    onChange={onChange}
                  />
                  <Field
                    label="Assists"
                    name="assists"
                    type="number"
                    value={form.assists}
                    onChange={onChange}
                  />
                  <Field
                    label="Yellow cards"
                    name="yellow_cards"
                    type="number"
                    value={form.yellow_cards}
                    onChange={onChange}
                  />
                  <Field
                    label="Red cards"
                    name="red_cards"
                    type="number"
                    value={form.red_cards}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-2.5 text-sm font-extrabold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-2.5 text-sm font-extrabold text-black shadow-[0_0_18px_rgba(34,197,94,0.55)] hover:bg-green-400 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ✅ REUSABLE FIELD COMPONENT
   ========================================================= */
function Field(props: {
  label: string;
  name: keyof PlayerFormState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "number" | "date";
}) {
  const { label, name, value, onChange, type = "text" } = props;
  return (
    <div>
      <label className="text-sm font-semibold text-zinc-200">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-zinc-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
      />
    </div>
  );
}

/* =========================================================
   ✅ POSITION SELECT COMPONENT
   ========================================================= */
function SelectPosition(props: {
  value: PlayerFormState["position"];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const { value, onChange } = props;
  const options: Array<PlayerFormState["position"]> = ["", "GK", "DF", "MF", "FW"];

  return (
    <div>
      <label className="text-sm font-semibold text-zinc-200">Position</label>
      <select
        name="position"
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
      >
        {options.map((o) => (
          <option key={o || "empty"} value={o} className="bg-zinc-900">
            {o === "" ? "-- Select position --" : o}
          </option>
        ))}
      </select>
    </div>
  );
}