import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET : แสดงข้อมูลทั้งหมด
export async function GET() {
  try {
    const players = await query({
      query: "SELECT * FROM players ORDER BY id ASC",
      values: [],
    });

    return NextResponse.json(players, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "error", error: String(err) },
      { status: 500 }
    );
  }
}

// POST : เพิ่มข้อมูลใหม่
export async function POST(request) {
  try {
    const {
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
    } = await request.json();

    const result = await query({
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
      values: [
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
        goals ?? 0,
        assists ?? 0,
        yellow_cards ?? 0,
        red_cards ?? 0,
      ],
    });

    return NextResponse.json(
      {
        message: "success",
        data: {
          id: result.insertId,
          first_name,
          last_name,
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