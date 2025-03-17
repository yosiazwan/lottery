'use client';

import { useState } from "react";
import TablePeserta from "./component/table-peserta";
import Counter from "./component/counter";

export default function Home() {
  const [leftSidebar, setLeftSidebar] = useState<boolean>(true);
  const [rightSidebar, setRightSidebar] = useState<boolean>(true);

  return (
    <div className="grid grid-cols-12 gap-0 h-screen p-0">
      <aside className="col-span-4 p-0">
        <div className="w-full h-screen bg-neutral-950 p-4">
          <TablePeserta />
        </div>
      </aside>

      <main className="col-span-4 p-4 shadow-md bg-black">
        <div>
          <Counter />
        </div>
      </main>

      <aside className="col-span-4 h-screen bg-neutral-950 p-4">
        Right Sidebar
      </aside>
    </div>
  );
}
