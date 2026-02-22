import Link from "next/link";

export default function PlayersPage() {
  return (
    <div className="max-w-6xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Players</h1>

        <Link href="/players/create" className="btn btn-primary">
          Add Player
        </Link>
      </div>

    </div>
  );
}