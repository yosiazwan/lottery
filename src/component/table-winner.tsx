'use client';
import { useEffect, useState } from "react";
import { crossTabBus } from "@/libs/crossTabEvent";
import { Peserta, Winners } from "@/libs/type";

export default function TableWinner() {
	const [winners, setWinners] = useState<Winners[]>([]);
	const [dropWinners, setDropWinners] = useState<Winners[]>([]);

	const resetWinners = () => {
		if (confirm('Are you sure you want to reset the winners?')) {
			localStorage.removeItem('doorprize.winners');
			setWinners([]);
			crossTabBus.emit('winners:updated', []);
		}
	}

	const resetDropWinners = () => {
		if (confirm('Are you sure you want to reset peserta gugur?')) {
			localStorage.removeItem('doorprize.drop-winners');
			setDropWinners([]);
			crossTabBus.emit('dropWinners:updated', []);
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

		crossTabBus.emit('winners:updated', updatedWinners);
		crossTabBus.emit('dropWinners:updated', updatedDropWinners);
		}
	}

	const deleteDropWinner = (index: number) => {
		if (confirm('Are you sure you want to delete this drop winner?')) {
			const updatedDropWinners = dropWinners.filter((_, i) => i !== index);
			setDropWinners(updatedDropWinners);
			localStorage.setItem('doorprize.drop-winners', JSON.stringify(updatedDropWinners));
		crossTabBus.emit('dropWinners:updated', updatedDropWinners);
		}
	}

	const downloadWinnersCSV = () => {
		const headers = ['Lot', 'ID', 'Name', 'Prize', 'DrawDate', 'DrawTime'];
		const rows = winners.map((peserta, index) => [
			`#${index + 1}`,
			peserta.id,
			`"${peserta.name}"`,
			peserta.prize,
			new Date(peserta.timestamp).toISOString().slice(0, 10),
			new Date(peserta.timestamp).toISOString().slice(11, 19)
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'doorprize-winners-' + new Date().toISOString().slice(0, 10) + '.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	const downloadDropWinnersCSV = () => {
		const headers = ['Lot', 'NIK', 'Nama', 'Prize', 'Draw Date', 'Draw Time'];
		const rows = dropWinners.map((peserta, index) => [
			`#${index + 1}`,
			peserta.id,
			`"${peserta.name}"`,
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
		link.setAttribute('download', 'peserta-gugur-' + new Date().toISOString().slice(0, 10) + '.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	useEffect(() => {
		const stored = localStorage.getItem('doorprize.winners');
		setWinners(stored ? JSON.parse(stored) : []);
	}, []);

	useEffect(() => {
		const stored = localStorage.getItem('doorprize.drop-winners');
		setDropWinners(stored ? JSON.parse(stored) : []);
	}, []);

	useEffect(() => {
		const onWinnersUpdated = (data: Winners[]) => setWinners(data);
		const onDropUpdated = (data: Winners[]) => setDropWinners(data);

		crossTabBus.on('winners:updated', onWinnersUpdated);
		crossTabBus.on('dropWinners:updated', onDropUpdated);
		return () => {
			crossTabBus.off('winners:updated', onWinnersUpdated);
			crossTabBus.off('dropWinners:updated', onDropUpdated);
		};
	}, []);

	return (
		<div>
			<div>
				<div className="flex flex-row justify-between items-center">
					<h1 className="font-bold text-xl text-white"><span role="img" aria-label="smile">😊</span> Daftar Pemenang</h1>
					<div>
						<button className="px-4 py-1 bg-green-700 hover:cursor-pointer text-white text-xs rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2" onClick={downloadWinnersCSV}>Download (.csv)</button>
						<button className="px-4 py-1 bg-red-700 hover:cursor-pointer text-white text-xs rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={resetWinners}>Reset</button>
					</div>
				</div>
				<div className="mt-2 overflow-y-auto max-h-[600px] border border-gray-700 rounded-lg">
					<table className="min-w-full divide-y divide-gray-700">
						<thead className="bg-gray-900 sticky top-0 z-10">
							<tr>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Lot</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">ID</th>
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
							{winners.length === 0 && (
								<tr>
									<td colSpan={5} className="px-2 py-4 text-center text-md text-gray-400">Belum ada pemenang</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div className="mt-4">
				<div className="flex flex-row justify-between items-center">
					<h1 className="font-bold text-xl text-white"><span role="img" aria-label="sad">😢</span> Peserta Gugur</h1>
					<div>
						<button className="px-4 py-1 bg-green-700 hover:cursor-pointer text-white text-xs rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2" onClick={downloadDropWinnersCSV}>Download (.csv)</button>
						<button className="px-4 py-1 bg-red-700 hover:cursor-pointer text-white text-xs rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={resetDropWinners}>Reset</button>
					</div>
				</div>
				<div className="mt-2 max-h-[200px] overflow-y-auto border border-gray-700 rounded-lg">
					<table className="min-w-full divide-y divide-gray-700">
						<thead className="bg-gray-900 sticky top-0 z-10">
							<tr>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">No.</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">ID</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Nama</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Prize</th>
								<th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-gray-700 divide-y divide-gray-700">
							{dropWinners?.map((peserta: Winners, index: number) => (
								<tr key={index}>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">#{index + 1}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.id}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.name}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{peserta.prize}</td>
									<td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">
										<button
											className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
											onClick={() => deleteDropWinner(index)}
										>
											<span role="img" aria-label="trash">🗑️</span>
										</button>
									</td>
								</tr>
							))}
							{dropWinners.length === 0 && (
								<tr>
									<td colSpan={5} className="px-2 py-4 text-center text-md text-gray-400">Belum ada peserta gugur</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}