'use client';
import { useEffect, useState } from "react";
import { getRandomInt } from "@/libs/number";
import { shuffleArray } from "@/libs/array";
import { Peserta } from "@/libs/type";

export default function TablePeserta({
	setPesertaData,
	pesertaData
}: {
	setPesertaData: (data: Peserta[]) => void,
	pesertaData: Peserta[]
}) {
	const [csvData, setCsvData] = useState("");
	const [tableData, setTableData] = useState<Peserta[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const handleCsvInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCsvData(event.target.value);
	};

	const saveToLocalStorage = () => {
		const rows = csvData.split("\n");
		const jsonData = rows.slice(0).map(row => {
			const [id, name] = row.split(",").map(item => item.replace(/"/g, ""));
			return { id, name };
		}).filter(item => item.id && item.name);

		const existingIds = new Set(pesertaData.map(p => p.id));
		const filteredData = jsonData.filter(item => !existingIds.has(item.id));

		if (filteredData.length === 0) {
			alert("Semua data sudah ada atau data kosong");
			return;
		}

		const newData = [...pesertaData, ...filteredData];
		setTableData(newData);
		localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
		setPesertaData(newData);
	};

	const acakData = (data: any) => {
		let newData = data;

		for(let i=0; i < getRandomInt(5, 15); i++) {
			newData = shuffleArray(newData);
		}
		localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
		setPesertaData(newData);
	};

	const clearLocalStorage = () => {
		const confirmed = window.confirm("Apakah Anda yakin ingin menghapus semua data peserta?");
		if (confirmed) {
			localStorage.removeItem("doorprize.peserta");
			setCsvData("");
			setTableData([]);
			setPesertaData([]);
		}
	};

	const sortByName = (data: any) => {
		const newData = [...data].sort((a, b) => a.name.localeCompare(b.name));
		localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
		setPesertaData(newData);
	};

	const filteredData = pesertaData.filter(peserta =>
		peserta.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
		peserta.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	useEffect(() => {
		const fetchData = async () => {
			const localStoragePeserta = localStorage.getItem("doorprize.peserta");
			if (localStoragePeserta) {
				const parsedData = JSON.parse(localStoragePeserta);
				setTableData(parsedData);
				setPesertaData(parsedData);
			}
		};

		fetchData();
	}, [setPesertaData]);

	return (
		<div>
			<h1 className="font-bold text-xl text-white">Daftar Peserta</h1>
			<div className="mt-2">
				<textarea
					placeholder="Masukkan data peserta dalam format CSV (id,name) per baris"
					className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
					value={csvData}
					onChange={handleCsvInput}
				/>
				<button
					onClick={saveToLocalStorage}
					className="px-2 py-1 hover:cursor-pointer bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Save Data
				</button>
				<button
					onClick={clearLocalStorage}
					className="ml-2 px-2 py-1 hover: cursor-pointer bg-red-500 text-white text-xs rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Clear Data
				</button>
				<button
					onClick={() => { acakData(pesertaData); }}
					className="ml-2 px-2 py-1 hover: cursor-pointer bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					Acak Data
				</button>
				<button
					onClick={() => { sortByName(pesertaData); }}
					className="ml-2 px-2 py-1 hover: cursor-pointer bg-white text-black text-xs rounded-lg hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					Sort By Name
				</button>
			</div>
			<div className="mt-4">
				<input
					type="text"
					placeholder="Cari berdasarkan ID atau Nama..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
				/>
			</div>
			<div className="mt-4 h-150 overflow-y-auto">
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-900 sticky top-0">
						<tr>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">No.</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">ID</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Nama</th>
						</tr>
					</thead>
					<tbody className="bg-gray-500 divide-y divide-gray-700">
						{filteredData.map((peserta: { id: string, name: string }, index: number) => (
							<tr key={index}>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-100">{index + 1}</td>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-100">{peserta.id}</td>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-100">{peserta.name}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}