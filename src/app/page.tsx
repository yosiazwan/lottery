'use client';

import { useState } from "react";
import TablePeserta from "./component/table-peserta";
import Counter, { Peserta, Winners } from "./component/counter";
import TableWinner from "./component/table-winner";

export default function Home() {
  const [leftSidebar, setLeftSidebar] = useState<boolean>(true);
  const [rightSidebar, setRightSidebar] = useState<boolean>(true);
  const [pesertaData, setPesertaData] = useState<Peserta[]>([]); // Define state for peserta data
  const [winnersData, setWinnersData] = useState<Winners[]>([]); // Define state for winners data

  return (
    <div className="grid grid-cols-12 gap-0 h-screen p-0">
      <aside className="col-span-3 p-0">
        <div className="w-full h-screen bg-neutral-950 p-4">
          <TablePeserta setPesertaData={setPesertaData} /> {/* Pass the function to update peserta data */}
        </div>
      </aside>

      <main className="col-span-5 shadow-md bg-black">
        <div>
          <Counter pesertaData={pesertaData} setWinnersData={setWinnersData} /> {/* Pass peserta data as props */}
        </div>
      </main>

      <aside className="col-span-4 bg-neutral-950 p-4">
        <TableWinner winnersData={winnersData} setPesertaData={setPesertaData} pesertaData={pesertaData} />
      </aside>
    </div>
  );
}
