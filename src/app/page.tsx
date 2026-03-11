'use client';

import TablePeserta from "../component/table-peserta";
import TableWinner from "../component/table-winner";
import Counter from "@/component/counter";

export default function Home() {
  return (
    <div className="grid grid-cols-12 gap-0 h-screen p-0">
      <aside className="col-span-3 p-0">
        <div className="w-full h-screen bg-neutral-950 p-4">
          <TablePeserta />
        </div>
      </aside>

      <main className="col-span-5 shadow-md bg-black">
        <div>
          <Counter />
        </div>
      </main>

      <aside className="col-span-4 bg-neutral-950 p-4">
        <TableWinner />
      </aside>
    </div>
  );
}
