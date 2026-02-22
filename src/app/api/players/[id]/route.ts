import { query } from "@/lib/db";
import type { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2";

type DbDate = string | Date | null;
type DbValue = string | number | null;

type PlayerData = {
  id: number;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: string | null;
  nationality: string | null;
  date_of_birth: DbDate;
  height_cm: number | null;
  weight_kg: number | null;
  team_name: string | null;
  league: string | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  created_at: DbDate;
  updated_at: DbDate;
};

type PlayerRow = RowDataPacket & PlayerData;

/** ✅ Next.js บางโหมด params เป็น Promise */
type RouteContext = { params: Promise<{ id: string }> };

const dbQuery = query as unknown as (args: {
  query: string;
  values?: DbValue[];
}) => Promise<unknown>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseId(rawId: string) {
  const raw = String(rawId ?? "").trim();
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) return null;
  return id;
}

function isRowArray(v: unknown): v is RowDataPacket[] {
  return Array.isArray(v);
}

function hasAffectedRows(v: unknown): v is OkPacket | ResultSetHeader {
  return (
    typeof v === "object" &&
    v !== null &&
    "affectedRows" in v &&
    typeof (v as { affectedRows: unknown }).affectedRows === "number"
  );
}

// GET /api/players/[id]
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return json({ message: "error", error: "Invalid id" }, 400);

    const result = await dbQuery({
      query: "SELECT * FROM players WHERE id = ? LIMIT 1",
      values: [id],
    });

    if (!isRowArray(result) || result.length === 0) {
      return json({ message: "not_found" }, 404);
    }

    return json(result[0] as PlayerRow, 200);
  } catch (err) {
    return json({ message: "error", error: String(err) }, 500);
  }
}

// PUT /api/players/[id]
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return json({ message: "error", error: "Invalid id" }, 400);

    const body = (await request.json()) as Partial<
      Omit<PlayerData, "id" | "created_at" | "updated_at">
    >;

    if (!body.first_name || !body.last_name) {
      return json(
        { message: "error", error: "first_name and last_name are required" },
        400
      );
    }

    const values: DbValue[] = [
      body.first_name ?? null,
      body.last_name ?? null,
      body.jersey_number ?? null,
      body.position ?? null,
      body.nationality ?? null,
      (body.date_of_birth as unknown as string | null) ?? null,
      body.height_cm ?? null,
      body.weight_kg ?? null,
      body.team_name ?? null,
      body.league ?? null,
      body.goals ?? 0,
      body.assists ?? 0,
      body.yellow_cards ?? 0,
      body.red_cards ?? 0,
      id,
    ];

    const result = await dbQuery({
      query: `
        UPDATE players
        SET
          first_name = ?,
          last_name = ?,
          jersey_number = ?,
          position = ?,
          nationality = ?,
          date_of_birth = ?,
          height_cm = ?,
          weight_kg = ?,
          team_name = ?,
          league = ?,
          goals = ?,
          assists = ?,
          yellow_cards = ?,
          red_cards = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      values,
    });

    if (!hasAffectedRows(result) || result.affectedRows === 0) {
      return json({ message: "not_found" }, 404);
    }

    return json({ message: "success" }, 200);
  } catch (err) {
    return json({ message: "error", error: String(err) }, 500);
  }
}

// DELETE /api/players/[id]
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return json({ message: "error", error: "Invalid id" }, 400);

    const result = await dbQuery({
      query: "DELETE FROM players WHERE id = ?",
      values: [id],
    });

    if (!hasAffectedRows(result) || result.affectedRows === 0) {
      return json({ message: "not_found" }, 404);
    }

    return json({ message: "success" }, 200);
  } catch (err) {
    return json({ message: "error", error: String(err) }, 500);
  }
}