import { query } from "@/lib/db";

// GET : แสดงตาม id
export async function GET(_request, { params }) {
  try {
    const { id } = params;

    const rows = await query({
      query: "SELECT * FROM players WHERE id = ?",
      values: [id],
    });

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT : แก้ไขข้อมูล
export async function PUT(request, { params }) {
  try {
    const { id } = params;

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
        goals,
        assists,
        yellow_cards,
        red_cards,
        id,
      ],
    });

    return new Response(
      JSON.stringify({ message: result.affectedRows ? "success" : "error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE : ลบข้อมูล
export async function DELETE(_request, { params }) {
  try {
    const { id } = params;

    const result = await query({
      query: "DELETE FROM players WHERE id = ?",
      values: [id],
    });

    return new Response(
      JSON.stringify({ message: result.affectedRows ? "success" : "error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}