'use client';
import { use, useEffect, useState } from "react";
import { Peserta, Winners } from "./counter";

export default function TableWinner({
	winnersData,
	setPesertaData,
	pesertaData
}: {
	winnersData: Winners[],
	setPesertaData: (data: Peserta[]) => void,
	pesertaData: Peserta[] }) {

	const [winners, setWinners] = useState<Winners[]>(winnersData);

	const resetWinners = () => {
		if (confirm('Are you sure you want to reset the winners?')) {
			localStorage.removeItem('doorprize.winners');
			setWinners([]);
			window.location.reload();
		}
	}

	useEffect(() => {
		const winners = localStorage.getItem('doorprize.winners');
		if (winners) {
			const parsedWinners = JSON.parse(winners) as Winners[];
			setWinners(parsedWinners);
		}
	}, [winnersData]);

	return (
		<div>
			<div className="flex flex-row justify-between items-center">
				<h1 className="font-bold text-xl">Daftar Pemenang</h1>
				<button className="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={resetWinners}>Reset</button>
			</div>
			<div className="mt-4 overflow-y-auto h-200">
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-900">
						<tr>
							<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Lot</th>
							<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">NIK</th>
							<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Nama</th>
							<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Draw Time</th>
						</tr>
					</thead>
					<tbody className="bg-gray-700 divide-y divide-gray-700">
						{winners && winners.map((peserta: Winners, index: number) => (
							<tr key={index}>
								<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">#{index + 1}</td>
								<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.id}</td>
								<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.name}</td>
								<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">
									{new Date(peserta.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}