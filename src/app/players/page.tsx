"use client";

/* หน้า Client สำหรับจัดการข้อมูลนักฟุตบอล (CRUD)
   เชื่อมต่อ API เพื่อดึงข้อมูล เพิ่ม แก้ไข และลบ */

import React, { useCallback, useEffect, useMemo, useState } from "react";

/* กำหนดค่าตำแหน่งที่เลือกได้ */
type Position = "GK" | "DF" | "MF" | "FW";

/* โครงสร้างข้อมูลนักฟุตบอลที่ได้จากฐานข้อมูล/API */
type Player = {
  id: number;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: Position | null;
  nationality: string | null;
  date_of_birth: string | null; // "YYYY-MM-DD" or ISO
  height_cm: number | null;
  weight_kg: number | null;
  team_name: string | null;
  league: string | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

/* โครงสร้าง state ของฟอร์ม (เก็บเป็น string เพราะ input รับค่าเป็น string) */
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

/* แปลง number/null → string เพื่อเอาไปใส่ใน input */
function toStr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return String(n);
}

/* แปลง string จาก input → number หรือ null (ถ้าว่างให้เป็น null) */
function toNumOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/* แปลง string → number แต่ถ้าว่างให้เป็น 0 (เหมาะกับสถิติ goals/assists/cards) */
function toNumOrZero(s: string): number {
  const n = toNumOrNull(s);
  return n ?? 0;
}

/* บังคับวันเกิดให้เป็น YYYY-MM-DD ก่อนส่งเข้า DB (กันค่าที่มีเวลาแบบ ISO) */
function toDateOnly(value: string): string | null {
  const v = value?.trim();
  if (!v) return null;

  // ISO -> YYYY-MM-DD
  if (v.includes("T")) return v.split("T")[0];

  // Already YYYY-MM-DD
  return v;
}

export default function PlayersPage() {
  /* ค่าเริ่มต้นฟอร์มตอน “เพิ่มข้อมูล” */
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

  /* เก็บข้อมูลนักฟุตบอลทั้งหมดที่แสดงในตาราง */
  const [players, setPlayers] = useState<Player[]>([]);
  /* สถานะกำลังโหลดข้อมูล */
  const [loading, setLoading] = useState<boolean>(true);

  /* เปิด/ปิด modal ฟอร์ม */
  const [open, setOpen] = useState<boolean>(false);
  /* เก็บ id ที่กำลังแก้ไข (ถ้า null = โหมดเพิ่มใหม่) */
  const [editingId, setEditingId] = useState<number | null>(null);
  /* เก็บค่าฟอร์มทั้งหมด */
  const [form, setForm] = useState<PlayerFormState>(emptyForm);
  /* สถานะกำลังบันทึก (กันกด submit ซ้ำ) */
  const [saving, setSaving] = useState<boolean>(false);

  /* ดึงข้อมูลทั้งหมดจาก API: GET /api/players */
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

  /* โหลดข้อมูลครั้งแรกเมื่อเปิดหน้า */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlayers();
  }, [fetchPlayers]);

  /* เปิด modal เพื่อเพิ่มข้อมูลใหม่ */
  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  /* เปิด modal เพื่อแก้ไขข้อมูลเดิม และเติมค่าลงฟอร์ม */
  function openEdit(p: Player) {
    setEditingId(p.id);
    setForm({
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      jersey_number: toStr(p.jersey_number),
      position: p.position ?? "",
      nationality: p.nationality ?? "",
      // input[type=date] ต้องเป็น YYYY-MM-DD
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
    setOpen(true);
  }

  /* จัดการการเปลี่ยนแปลงค่า input/select แล้วอัปเดตลง state form */
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* บันทึกฟอร์ม:
     - ถ้า editingId มีค่า → PUT /api/players/:id (แก้ไข)
     - ถ้า editingId เป็น null → POST /api/players (เพิ่มใหม่)
     แล้วโหลดข้อมูลใหม่มาแสดง */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      /* สร้าง payload โดยแปลงชนิดข้อมูลให้ตรงกับ DB */
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        jersey_number: toNumOrNull(form.jersey_number),
        position: form.position === "" ? null : form.position,
        nationality: form.nationality.trim() === "" ? null : form.nationality,
        // ส่งวันแบบ DATE-only
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

      /* เลือก endpoint/method ตามโหมดเพิ่มหรือแก้ไข */
      const url = editingId ? `/api/players/${editingId}` : "/api/players";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      /* ถ้า API ตอบไม่สำเร็จ ให้แสดง error */
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      /* ปิด modal แล้ว refresh ตาราง */
      setOpen(false);
      await fetchPlayers();
    } finally {
      setSaving(false);
    }
  }

  /* ลบข้อมูล: DELETE /api/players/:id แล้วโหลดข้อมูลใหม่ */
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
                onClick={openCreate}
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
                  <tr className="text-xs uppercase tracking-wider text-zinc-300">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">ชื่อ</th>
                    <th className="px-4 py-3 text-left">นามสกุล</th>
                    <th className="px-4 py-3 text-center">เบอร์</th>
                    <th className="px-4 py-3 text-center">ตำแหน่ง</th>
                    <th className="px-4 py-3 text-left">ทีม</th>
                    <th className="px-4 py-3 text-center">G</th>
                    <th className="px-4 py-3 text-center">A</th>
                    <th className="px-4 py-3 text-center">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && players.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-zinc-300">
                        ยังไม่มีข้อมูลนักฟุตบอล
                      </td>
                    </tr>
                  )}

                  {players.map((p) => (
                    <tr
                      key={p.id}
                      className="bg-white/5 hover:bg-white/10 transition rounded-xl"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-200">
                        <span className="inline-flex items-center justify-center rounded-lg bg-white/5 px-2 py-1 font-semibold text-zinc-100 ring-1 ring-white/10">
                          #{p.id}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm font-extrabold text-white">
                        {p.first_name}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200">
                        {p.last_name}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200">
                        {p.jersey_number ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200">
                        {p.position ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-200">
                        {p.team_name ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200">
                        {p.goals ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-zinc-200">
                        {p.assists ?? 0}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
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

      {/* MODAL FORM */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {editingId ? "✏️ แก้ไขข้อมูลนักฟุตบอล" : "➕ เพิ่มนักฟุตบอล"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
              >
                ปิด
              </button>
            </div>

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

              {/* เพิ่มช่อง DOB / Nationality / Height / Weight */}
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
                <div className="mb-3 text-sm font-extrabold text-white tracking-tight">
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
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-2.5 text-sm font-extrabold text-white ring-1 ring-white/15 hover:bg-white/10 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-2.5 text-sm font-extrabold text-black shadow-[0_0_18px_rgba(34,197,94,0.55)] hover:bg-green-400 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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