'use client';
import { useEffect, useState } from "react";
import { getRandomInt } from "@/libs/number";
import { shuffleArray } from "@/libs/array";
import { Peserta } from "@/libs/type";
import { crossTabBus } from "@/libs/crossTabEvent";

export default function TablePeserta() {
  const [csvData, setCsvData] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pesertaData, setPesertaData] = useState<Peserta[]>([]);

  // ====================== HANDLE CSV ======================
  const handleCsvInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(event.target.value);
  };

  const saveToLocalStorage = () => {
    const rows = csvData.trim().split("\n");
    const jsonData = rows
      .map((row) => {
        const [id, name] = row.split(",").map((item) => item.replace(/"/g, "").trim());
        return { id, name };
      })
      .filter((item) => item.id && item.name);

    const existingIds = new Set(pesertaData.map((p) => p.id));
    const filteredData = jsonData.filter((item) => !existingIds.has(item.id));

    if (filteredData.length === 0) {
      alert("Semua data sudah ada atau data kosong");
      return;
    }

    const newData = [...pesertaData, ...filteredData];
    localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
    setPesertaData(newData);
    crossTabBus.emit('peserta:updated', newData);
    setCsvData("");
  };

  // ====================== ACAK DATA ======================
  const acakData = (data: Peserta[]) => {
    let newData = [...data];
    for (let i = 0; i < getRandomInt(5, 15); i++) {
      newData = shuffleArray(newData);
    }

    localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
    setPesertaData(newData);
    crossTabBus.emit('peserta:updated', newData);
  };

  // ====================== CLEAR DATA ======================
  const clearLocalStorage = () => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus semua data peserta?");
    if (confirmed) {
      localStorage.removeItem("doorprize.peserta");
      setCsvData("");
      setPesertaData([]);
      crossTabBus.emit('peserta:updated', []);
    }
  };

  // ====================== SORT BY NAME ======================
  const sortByName = (data: Peserta[]) => {
    const newData = [...data].sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
    setPesertaData(newData);
    crossTabBus.emit('peserta:updated', newData);
  };

  // ====================== FILTER SEARCH ======================
  const filteredData = pesertaData.filter((peserta) =>
    peserta.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peserta.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ====================== LOAD DARI LOCALSTORAGE ======================
  useEffect(() => {
    const localStoragePeserta = localStorage.getItem("doorprize.peserta");
    if (localStoragePeserta) {
      try {
        const parsedData = JSON.parse(localStoragePeserta) as Peserta[];
        setPesertaData(parsedData);
      } catch (error) {
        console.error("Gagal parse localStorage:", error);
        localStorage.removeItem("doorprize.peserta");
      }
    }
  }, []);

  return (
    <div>
      <h1 className="font-bold text-xl text-white">Daftar Peserta</h1>

      {/* CSV Input */}
      <div className="mt-2">
        <textarea
          placeholder="Masukkan data peserta dalam format CSV (id,name) per baris"
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
          value={csvData}
          onChange={handleCsvInput}
        />
      </div>

      {/* Button Group - UKURAN KECIL */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={saveToLocalStorage}
          className="px-3 py-1 hover:cursor-pointer bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Data
        </button>

        <button
          onClick={clearLocalStorage}
          className="px-3 py-1 hover:cursor-pointer bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Clear Data
        </button>

        <button
          onClick={() => acakData(pesertaData)}
          className="px-3 py-1 hover:cursor-pointer bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Acak Data
        </button>

        <button
          onClick={() => sortByName(pesertaData)}
          className="px-3 py-1 hover:cursor-pointer bg-white text-black text-xs rounded-lg hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Sort By Name
        </button>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Cari berdasarkan ID atau Nama..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
        />
      </div>

      {/* Table */}
      <div className="mt-4 max-h-[600px] overflow-y-auto border border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">No.</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Nama</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredData.map((peserta, index) => (
              <tr key={index} className="hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">{index + 1}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">{peserta.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">{peserta.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-10 text-gray-400">Tidak ada data peserta</div>
        )}
      </div>
    </div>
  );
}