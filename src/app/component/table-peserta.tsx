'use client';
import { useEffect, useState } from "react";

export default function TablePeserta() {
	const [csvData, setCsvData] = useState("");
	const [tableData, setTableData] = useState<{ id: string; name: string }[]>([]);

	const handleCsvInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCsvData(event.target.value);
	};

	const saveToLocalStorage = () => {
		const rows = csvData.split("\n");
		const jsonData = rows.slice(1).map(row => {
			const [id, name] = row.split(",");
			return { id, name };
		});
		localStorage.setItem("doorprize.peserta", JSON.stringify(jsonData));
		setTableData(jsonData);
	};

	const clearLocalStorage = () => {
		localStorage.removeItem("doorprize.peserta");
		setCsvData(""); // Clear the textarea
		setTableData([]); // Clear the table data
	};

	useEffect(() => {
		const fetchData = async () => {
			const localStoragePeserta = localStorage.getItem("doorprize.peserta");
			if (localStoragePeserta) {
				setTableData(JSON.parse(localStoragePeserta));
			}
		};

		fetchData();
	}, []);

	return (
		<div>
			<h1>Daftar Peserta</h1>
			<div className="mt-2">
				<textarea
					placeholder="Enter your message..."
					className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					value={csvData}
					onChange={handleCsvInput}
				/>
				<button
					onClick={saveToLocalStorage}
					className="mt-2 mr-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Save Data
				</button>
				<button
					onClick={clearLocalStorage}
					className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Clear Data
				</button>
			</div>
			<div className="mt-4 max-h-screen overflow-y-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
							<th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{tableData.map((peserta: { id: string, name: string }, index: number) => (
							<tr key={index}>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{peserta.id}</td>
								<td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{peserta.name}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}