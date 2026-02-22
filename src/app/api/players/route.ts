import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2";

/* =========================================================
   ✅ API ROUTE: /api/players
   - GET  : ดึงรายชื่อผู้เล่นทั้งหมด
   - POST : เพิ่มผู้เล่นใหม่
   - ใช้ MySQL ผ่าน lib/db (query)
   ========================================================= */

/* =======================
   🔶 TYPES (โครงสร้างข้อมูล)
   ======================= */

type Position = "GK" | "DF" | "MF" | "FW";

/* โครงสร้างข้อมูลผู้เล่น (สอดคล้องกับตาราง players) */
type PlayerData = {
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
  created_at?: string;
  updated_at?: string;
};

/* Row ที่ได้จาก mysql2 (RowDataPacket) + ฟิลด์ของเรา */
type PlayerRow = RowDataPacket & PlayerData;

/* ค่าที่ใช้ bind เข้า SQL placeholder (?) */
type DbValue = string | number | null;

/* =========================================================
   ✅ WRAPPER: แก้ปัญหา values เป็น never[]
   - ไม่ต้องไปแก้ lib/db
   - ทำให้ TypeScript รู้ว่า values เป็น DbValue[]
   ========================================================= */
const dbQuery = query as unknown as (args: {
  query: string;
  values?: DbValue[];
}) => Promise<unknown>;

/* =======================
   🔶 TYPE GUARDS (เช็คชนิดผลลัพธ์)
   ======================= */

/* เช็คว่า result เป็น array ของ rows (กรณี SELECT) */
function isRowArray(v: unknown): v is RowDataPacket[] {
  return Array.isArray(v);
}

/* เช็คว่า result มี insertId (กรณี INSERT) */
function hasInsertId(v: unknown): v is OkPacket | ResultSetHeader {
  return (
    typeof v === "object" &&
    v !== null &&
    "insertId" in v &&
    typeof (v as { insertId: unknown }).insertId === "number"
  );
}

/* =========================================================
   ✅ GET /api/players
   - ดึงข้อมูลผู้เล่นทั้งหมด
   - เรียงตาม id จากน้อยไปมาก
   ========================================================= */
export async function GET() {
  try {
    const result = await dbQuery({
      query: "SELECT * FROM players ORDER BY id ASC",
      values: [],
    });

    /* กันไว้ เผื่อ DB คืนค่าไม่ใช่ array */
    if (!isRowArray(result)) {
      return NextResponse.json([], { status: 200 });
    }

    const players = result as PlayerRow[];
    return NextResponse.json(players, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "error", error: String(err) },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✅ POST /api/players
   - เพิ่มข้อมูลผู้เล่นใหม่
   - validate ขั้นต่ำ: ต้องมี first_name และ last_name
   - ใส่ created_at, updated_at = NOW()
   - คืน id ที่สร้างใหม่กลับไป (insertId)
   ========================================================= */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PlayerData>;

    /* validation ขั้นต่ำ */
    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { message: "error", error: "first_name and last_name are required" },
        { status: 400 }
      );
    }

    /* เตรียม values ให้ตรงกับลำดับ ? ใน SQL */
    const values: DbValue[] = [
      body.first_name ?? null,
      body.last_name ?? null,
      body.jersey_number ?? null,
      body.position ?? null,
      body.nationality ?? null,
      body.date_of_birth ?? null,
      body.height_cm ?? null,
      body.weight_kg ?? null,
      body.team_name ?? null,
      body.league ?? null,
      body.goals ?? 0,
      body.assists ?? 0,
      body.yellow_cards ?? 0,
      body.red_cards ?? 0,
    ];

    const result = await dbQuery({
      query: `
        INSERT INTO players
        (
          first_name,
          last_name,
          jersey_number,
          position,
          nationality,
          date_of_birth,
          height_cm,
          weight_kg,
          team_name,
          league,
          goals,
          assists,
          yellow_cards,
          red_cards,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      values,
    });

    /* ถ้า insert ไม่ได้ insertId => ถือว่าล้มเหลว */
    if (!hasInsertId(result)) {
      return NextResponse.json(
        { message: "error", error: "Insert failed" },
        { status: 500 }
      );
    }

    /* คืนผลลัพธ์แบบสั้นๆ + id ใหม่ */
    return NextResponse.json(
      {
        message: "success",
        data: {
          id: result.insertId,
          first_name: body.first_name,
          last_name: body.last_name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "error", error: String(err) },
      { status: 500 }
    );
  }
}