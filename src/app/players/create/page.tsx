"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   ✅ CLIENT PAGE: Create Player (หน้าเพิ่มนักฟุตบอล)
   - เก็บค่าฟอร์มด้วย useState
   - แปลงค่าจาก string -> number/null ก่อนส่ง
   - ส่งข้อมูลไป API: POST /api/players
   - สำเร็จแล้วกลับไปหน้า /players
   ========================================================= */

/* =======================
   🔶 TYPES
   ======================= */
type Position = "GK" | "DF" | "MF" | "FW";

/** State ของฟอร์ม: เก็บเป็น string เพราะ input/select คืนค่าเป็น string */
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
   🔶 HELPERS (แปลงข้อมูลก่อนส่ง)
   ======================= */

/** แปลง string เป็น number หรือ null (ถ้าเว้นว่าง) */
function toNumOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** แปลง string เป็น number โดย default = 0 */
function toNumOrZero(s: string): number {
  return toNumOrNull(s) ?? 0;
}

/** ตัดเวลาออกให้เหลือ YYYY-MM-DD (รองรับค่าที่มี T เช่น ISO) */
function toDateOnly(value: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.includes("T")) return v.split("T")[0];
  return v;
}

/* =========================================================
   ✅ PAGE COMPONENT
   ========================================================= */
export default function CreatePlayerPage() {
  const router = useRouter();

  /* ✅ ค่าเริ่มต้นของฟอร์ม (useMemo กัน re-create ทุก render) */
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

  /* ✅ state หลัก: form + สถานะกำลังบันทึก */
  const [form, setForm] = useState<PlayerFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  /* ✅ handler: เปลี่ยนค่าฟอร์มแบบ generic ด้วย name ของ input */
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* =========================================================
     ✅ SUBMIT: แปลงค่า + POST ไป API
     ========================================================= */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      /* ✅ payload ที่ส่งจริง: แปลงเป็นชนิดที่ API/DB ต้องการ */
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

      /* ✅ call API: POST /api/players */
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      /* ถ้า API ไม่ ok ให้โยน error (เอาข้อความจาก server มาโชว์) */
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }

      /* ✅ สำเร็จ: กลับไปหน้าตาราง + refresh ข้อมูล */
      router.push("/players");
      router.refresh();
    } catch (err) {
      /* ✅ แจ้ง error แบบง่าย */
      alert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ✅ UI FORM (Tailwind)
     ========================================================= */
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-extrabold">
              ➕ เพิ่มนักฟุตบอล
            </h1>

            {/* ปุ่มกลับหน้าเดิม */}
            <button
              onClick={() => router.back()}
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
            >
              กลับ
            </button>
          </div>

          {/* ✅ FORM */}
          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            {/* ชื่อ-นามสกุล */}
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

            {/* เบอร์เสื้อ + ตำแหน่ง */}
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

            {/* สัญชาติ + วันเกิด */}
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

            {/* ส่วนสูง + น้ำหนัก */}
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

            {/* ทีม + ลีก */}
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

            {/* สถิติการแข่งขัน */}
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

            {/* ปุ่มคำสั่ง */}
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
                {saving ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ✅ REUSABLE INPUT FIELD
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
   ✅ POSITION SELECT (GK/DF/MF/FW)
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