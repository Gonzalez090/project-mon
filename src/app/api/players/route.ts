import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2";

type Position = "GK" | "DF" | "MF" | "FW";

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

type PlayerRow = RowDataPacket & PlayerData;

type DbValue = string | number | null;

/** wrapper แก้ values never[] โดยไม่ต้องแก้ lib/db */
const dbQuery = query as unknown as (args: {
  query: string;
  values?: DbValue[];
}) => Promise<unknown>;

function isRowArray(v: unknown): v is RowDataPacket[] {
  return Array.isArray(v);
}

function hasInsertId(v: unknown): v is OkPacket | ResultSetHeader {
  return (
    typeof v === "object" &&
    v !== null &&
    "insertId" in v &&
    typeof (v as { insertId: unknown }).insertId === "number"
  );
}

// GET : แสดงข้อมูลทั้งหมด
export async function GET() {
  try {
    const result = await dbQuery({
      query: "SELECT * FROM players ORDER BY id ASC",
      values: [],
    });

    if (!isRowArray(result)) {
      // กันไว้ เผื่อ db คืนแบบไม่ใช่แถว
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

// POST : เพิ่มข้อมูลใหม่
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PlayerData>;

    // validation ขั้นต่ำ (ปรับได้)
    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { message: "error", error: "first_name and last_name are required" },
        { status: 400 }
      );
    }

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

    if (!hasInsertId(result)) {
      return NextResponse.json(
        { message: "error", error: "Insert failed" },
        { status: 500 }
      );
    }

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