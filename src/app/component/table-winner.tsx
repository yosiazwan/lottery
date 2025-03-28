'use client';
import { useEffect, useState } from "react";
import { Peserta, Winners } from "./counter";

export default function TableWinner({
	winnersData,
	dropWinnersData,
	setPesertaData,
	pesertaData
}: {
	winnersData: Winners[],
	dropWinnersData: Winners[],
	setPesertaData: (data: Peserta[]) => void,
	pesertaData: Peserta[] }) {

	const [winners, setWinners] = useState<Winners[]>(winnersData);
	const [dropWinners, setDropWinners] = useState<Winners[]>(dropWinnersData);

	const resetWinners = () => {
		if (confirm('Are you sure you want to reset the winners?')) {
			localStorage.removeItem('doorprize.winners');
			setWinners([]);
			window.location.reload();
		}
	}

	const resetDropWinners = () => {
		if (confirm('Are you sure you want to reset peserta gugur?')) {
			localStorage.removeItem('doorprize.drop-winners');
			setDropWinners([]);
			window.location.reload();
		}
	}

	const deleteWinner = (index: number) => {
		if (confirm('Are you sure you want to delete this winner?')) {
			const winnerToDrop = winners[index];
			const updatedWinners = winners.filter((_, i) => i !== index);
			setWinners(updatedWinners);
			localStorage.setItem('doorprize.winners', JSON.stringify(updatedWinners));

			const updatedDropWinners = [...dropWinners, winnerToDrop];
			setDropWinners(updatedDropWinners);
			localStorage.setItem('doorprize.drop-winners', JSON.stringify(updatedDropWinners));

			window.location.reload();
		}
	}

	const deleteDropWinner = (index: number) => {
		if (confirm('Are you sure you want to delete this drop winner?')) {
			const updatedDropWinners = dropWinners.filter((_, i) => i !== index);
			setDropWinners(updatedDropWinners);
			localStorage.setItem('doorprize.drop-winners', JSON.stringify(updatedDropWinners));
			window.location.reload();
		}
	}

	const downloadCSV = () => {
		const headers = ['Lot', 'NIK', 'Nama', 'Prize', 'Draw Date', 'Draw Time'];
		const rows = winners.map((peserta, index) => [
			`#${index + 1}`,
			peserta.id,
			peserta.name,
			peserta.prize,
			new Date(peserta.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'doorprize-winners.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	const downloadCSV2 = () => {
		const headers = ['Lot', 'NIK', 'Nama', 'Prize', 'Draw Date', 'Draw Time'];
		const rows = dropWinners.map((peserta, index) => [
			`#${index + 1}`,
			peserta.id,
			peserta.name,
			peserta.prize,
			new Date(peserta.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'peserta-gugur.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	useEffect(() => {
		const winners = localStorage.getItem('doorprize.winners');
		if (winners) {
			const parsedWinners = JSON.parse(winners) as Winners[];
			setWinners(parsedWinners);
		}
	}, [winnersData]);

	useEffect(() => {
		const dropWinners = localStorage.getItem('doorprize.drop-winners');
		if (dropWinners) {
			const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
			setDropWinners(parsedDropWinners);
		}
	}, [dropWinnersData]);

	return (
		<div>
			<div>
				<div className="flex flex-row justify-between items-center">
					<h1 className="font-bold text-xl text-white"><span role="img" aria-label="smile">😊</span> Daftar Pemenang</h1>
					<div>
						<button className="px-4 py-1 bg-green-700 hover:cursor-pointer text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2" onClick={downloadCSV}>Download (.csv)</button>
						<button className="px-4 py-1 bg-red-700 hover:cursor-pointer text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={resetWinners}>Reset</button>
					</div>
				</div>
				<div className="mt-4 overflow-y-auto h-150">
					<table className="min-w-full divide-y divide-gray-700">
						<thead className="bg-gray-900">
							<tr>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Lot</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">NIK</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Nama</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Prize</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-gray-700 divide-y divide-gray-700">
							{winners && winners.map((peserta: Winners, index: number) => (
								<tr key={index}>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">#{index + 1}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.id}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.name}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.prize}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">
										<button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteWinner(index)}>
											<span role="img" aria-label="trash">🗑️</span>
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div className="mt-10">
				<div className="flex flex-row justify-between items-center">
					<h1 className="font-bold text-xl text-white"><span role="img" aria-label="sad">😢</span> Peserta Gugur</h1>
					<div>
						<button className="px-4 py-1 bg-green-700 hover:cursor-pointer text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2" onClick={downloadCSV2}>Download (.csv)</button>
						<button className="px-4 py-1 bg-red-700 hover:cursor-pointer text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={resetDropWinners}>Reset</button>
					</div>
				</div>
				<div className="mt-4 overflow-y-auto h-80">
					<table className="min-w-full divide-y divide-gray-700">
						<thead className="bg-gray-900">
							<tr>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">No.</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">NIK</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Nama</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Prize</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-gray-700 divide-y divide-gray-700">
							{dropWinners && dropWinners.map((peserta: Winners, index: number) => (
								<tr key={index}>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">#{index + 1}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.id}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.name}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.prize}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">
										<button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteDropWinner(index)}>
											<span role="img" aria-label="trash">🗑️</span>
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}