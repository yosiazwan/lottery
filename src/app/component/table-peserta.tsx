'use client';
import { useEffect, useState } from "react";
import { Peserta } from "./counter";

const shuffleArray = <T,>(array: T[]): T[] => {
	let shuffled = [...array]; // Copy array agar tidak merubah aslinya
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function TablePeserta({
	setPesertaData,
	pesertaData
}: {
	setPesertaData: (data: Peserta[]) => void,
	pesertaData: Peserta[]
}) {
	const [csvData, setCsvData] = useState("");
	const [tableData, setTableData] = useState<Peserta[]>([]);

	const handleCsvInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCsvData(event.target.value);
	};

	const saveToLocalStorage = () => {
		const rows = csvData.split("\n");
		const jsonData = rows.slice(1).map(row => {
			const [id, name] = row.split(",").map(item => item.replace(/"/g, ""));
			return { id, name };
		});
		acakData(jsonData);
	};

	const acakData = (data: any) => {
		let newData = data;

		for(let i=0; i < getRandomInt(5, 15); i++) {
			newData = shuffleArray(newData);
		}
		// setTableData(shuffleArray(tableData));
		localStorage.setItem("doorprize.peserta", JSON.stringify(newData));
		setPesertaData(newData);
	};

	const clearLocalStorage = () => {
		localStorage.removeItem("doorprize.peserta");
		setCsvData(""); // Clear the textarea
		setTableData([]); // Clear the table data
		setPesertaData([]); // Update the parent component with empty data
	};

	useEffect(() => {
		const fetchData = async () => {
			const localStoragePeserta = localStorage.getItem("doorprize.peserta");
			if (localStoragePeserta) {
				const parsedData = JSON.parse(localStoragePeserta);
				setTableData(parsedData);
				setPesertaData(parsedData); // Update the parent component with the fetched data
			}
		};

		fetchData();
	}, [setPesertaData]);

	return (
		<div>
			<h1 className="font-bold text-xl">Daftar Peserta</h1>
			<div className="mt-2">
				<textarea
					placeholder="Enter your csv data with header..."
					className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					value={csvData}
					onChange={handleCsvInput}
				/>
				<button
					onClick={saveToLocalStorage}
					className="px-4 py-2 hover:cursor-pointer bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Save Data
				</button>
				<button
					onClick={clearLocalStorage}
					className="ml-2 px-4 py-2 hover: cursor-pointer bg-red-500 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Clear Data
				</button>
				<button
					onClick={() => { acakData(pesertaData); }}
					className="ml-2 px-4 py-2 hover: cursor-pointer bg-purple-500 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					Acak Data
				</button>
			</div>
			<div className="mt-4 h-150 overflow-y-auto">
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-900 sticky top-0">
						<tr>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">No.</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">NIK</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Nama</th>
						</tr>
					</thead>
					<tbody className="bg-gray-500 divide-y divide-gray-700">
						{pesertaData.map((peserta: { id: string, name: string }, index: number) => (
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