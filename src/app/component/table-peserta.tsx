'use client';
import { useEffect, useState } from "react";

export default function TablePeserta({ setPesertaData }: { setPesertaData: (data: { id: string; name: string }[]) => void }) {
	const [csvData, setCsvData] = useState("");
	const [tableData, setTableData] = useState<{ id: string; name: string }[]>([]);

	const handleCsvInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCsvData(event.target.value);
	};

	const saveToLocalStorage = () => {
		const rows = csvData.split("\n");
		const jsonData = rows.slice(1).map(row => {
			const [id, name] = row.split(",").map(item => item.replace(/"/g, ""));
			return { id, name };
		});
		localStorage.setItem("doorprize.peserta", JSON.stringify(jsonData));
		setTableData(jsonData);
		setPesertaData(jsonData); // Update the parent component with the new data
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
						{tableData.map((peserta: { id: string, name: string }, index: number) => (
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