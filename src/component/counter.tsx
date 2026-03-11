'use client';

import { useEffect, useState } from "react";
import Fireworks from "./firework";
import Link from "next/link";
import { Prize } from "../app/hadiah/page";
import { crossTabBus } from "@/libs/crossTabEvent";
import { getSafeRandomIndex } from "@/libs/number";
import { Peserta, Winners } from "@/libs/type";

export default function Counter() {
	const intervalTime = 10;

	const [randomPeserta, setRandomPeserta] = useState<Peserta>({ id: '', name: '' });
	const [isRun, setIsRun] = useState(false);
	const [peserta, setPeserta] = useState<Peserta[]>([]);
	const [random, setRandom] = useState<NodeJS.Timeout | null>(null);
	const [time, setTime] = useState<number>(0);
	const [showFramework, setShowFramework] = useState<boolean>(false);
	const [minStopTime, setMinStopTime] = useState<number>(2);
	const [prizes, setPrizes] = useState<Prize[]>([]);
	const [currentPrize, setCurrentPrize] = useState<string>('');

	// Load prizes + cross tab listener
	useEffect(() => {
		const loadPrizes = () => {
			const prizeDatas = localStorage.getItem('doorprize.prizes');
			setPrizes(prizeDatas ? JSON.parse(prizeDatas) : []);
		};
		loadPrizes();

		const handlePrizeUpdate = (data: Prize[]) => {
			setPrizes(data);
		};

		crossTabBus.on('prize:updated', handlePrizeUpdate);
		return () => crossTabBus.off('prize:updated', handlePrizeUpdate);
	}, []);

	// Load peserta from localStorage dan filter awal
	useEffect(() => {
		const rebuildPeserta = (pesertaData: Peserta[]) => {
			let filteredPeserta = [...pesertaData];

			const winners = localStorage.getItem('doorprize.winners');
			if (winners) {
				const parsedWinners = JSON.parse(winners) as Winners[];
				const pesertaIds = parsedWinners.map(winner => winner.id);
				filteredPeserta = filteredPeserta.filter(p => !pesertaIds.includes(p.id));
			}

			const dropWinners = localStorage.getItem('doorprize.drop-winners');
			if (dropWinners) {
				const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
				const pesertaIds = parsedDropWinners.map(winner => winner.id);
				filteredPeserta = filteredPeserta.filter(p => !pesertaIds.includes(p.id));
			}

			setPeserta(filteredPeserta);
		};

		// Load dari localStorage saat pertama kali
		const storedPeserta = localStorage.getItem('doorprize.peserta');
		if (storedPeserta) {
			const parsed = JSON.parse(storedPeserta) as Peserta[];
			rebuildPeserta(parsed);
		}

		// Listen ke event dari table-peserta
		const onPesertaUpdated = (data: Peserta[]) => {
			rebuildPeserta(data);
		};

		crossTabBus.on('peserta:updated', onPesertaUpdated);
		return () => crossTabBus.off('peserta:updated', onPesertaUpdated);
	}, []);

	// Listen eventBus untuk sync reaktif dari TableWinner
	useEffect(() => {
		const rebuildPesertaFromWinners = (updatedWinners: Winners[], updatedDrops: Winners[]) => {
			const storedPeserta = localStorage.getItem('doorprize.peserta');
			const allPeserta: Peserta[] = storedPeserta ? JSON.parse(storedPeserta) : [];

			const winnerIds = new Set(updatedWinners.map(w => w.id));
			const dropIds = new Set(updatedDrops.map(w => w.id));
			setPeserta(allPeserta.filter(p => !winnerIds.has(p.id) && !dropIds.has(p.id)));
		};

		const onWinnersUpdated = (updatedWinners: Winners[]) => {
			const stored = localStorage.getItem('doorprize.drop-winners');
			const drops: Winners[] = stored ? JSON.parse(stored) : [];
			rebuildPesertaFromWinners(updatedWinners, drops);
		};

		const onDropUpdated = (updatedDrops: Winners[]) => {
			const stored = localStorage.getItem('doorprize.winners');
			const wins: Winners[] = stored ? JSON.parse(stored) : [];
			rebuildPesertaFromWinners(wins, updatedDrops);
		};

		crossTabBus.on('winners:updated', onWinnersUpdated);
		crossTabBus.on('dropWinners:updated', onDropUpdated);
		return () => {
			crossTabBus.off('winners:updated', onWinnersUpdated);
			crossTabBus.off('dropWinners:updated', onDropUpdated);
		};
	}, []);

	// Main interval effect (pengundian)
	useEffect(() => {
		if (!isRun) {
			if (random) {
				clearInterval(random);
				setRandom(null);
			}
			setShowFramework(true);
			return;
		}

		setTime(0);

		if (peserta.length === 0) {
			setIsRun(false);
			alert('Tidak ada peserta');
			return;
		}

		if (currentPrize === '') {
			setIsRun(false);
			alert('Pilih undian terlebih dahulu');
			return;
		}

		const intervalId = setInterval(() => {
			const randomIndex = getSafeRandomIndex(peserta.length);
			setRandomPeserta(peserta[randomIndex]);
		}, intervalTime);

		const timerId = setInterval(() => {
			setTime(prev => prev + intervalTime);
		}, intervalTime);

		setRandom(intervalId);

		return () => {
			clearInterval(intervalId);
			clearInterval(timerId);
		};
	}, [isRun, currentPrize, peserta]);

	const reloadWinners = (type: "win" | "drop") => {
		const winners = localStorage.getItem('doorprize.winners');
		if (winners) {
			const parsedWinners = JSON.parse(winners) as Winners[];
			crossTabBus.emit('winners:updated', parsedWinners);
		}

		const dropWinners = localStorage.getItem('doorprize.drop-winners');
		if (dropWinners) {
			const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
			crossTabBus.emit('dropWinners:updated', parsedDropWinners);
		}

		if (type === "win") {
			setCurrentPrize("");
		}
	};

	return (
		<div className="grid items-center justify-items-center min-h-screen p-0 m-0">
			<div className="absolute top-0 w-fit mt-10 flex flex-col items-center">
				<h1 className="text-6xl font-bold text-yellow-300 flex items-center">
					<span className="mr-2">🎁</span> DoorPrize
				</h1>
				<div className="w-full text-center mt-10 text-4xl text-white">
					Jumlah Peserta: <b>{peserta.length}</b>
				</div>
				<div className="mt-10 text-2xl font-bold text-yellow-400">Hadiah Yang Diundi</div>
				<div className="mt-2 border border-dashed border-yellow-500 px-10 py-2 rounded-lg text-center">
					<select
						className="text-white text-center p-2 rounded bg-black appearance-none text-3xl font-bold uppercase"
						onChange={(e) => {
							setCurrentPrize(e.target.value);
						}}
						value={currentPrize}
					>
						<option value="">-- Pilih Hadiah --</option>
						{prizes.map((prize, index) => (
							<option key={index} value={prize.name}>
								{prize.name}
							</option>
						))}
					</select>
				</div>
			</div>

			<main className="w-full">
				<div className="w-full text-center text-white">
					{!isRun && <div className="flex flex-col items-center justify-center gap-4">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-300 border-t-transparent"></div>
						<p className="text-xl text-white">Ready...</p>
					</div>}
					{isRun && (
						<div>
							<div className="text-5xl font-bold text-yellow-600 mt-5">{randomPeserta.id}</div>
							<div className="text-5xl font-bold text-yellow-300 mt-2">{randomPeserta.name}</div>
						</div>
					)}
				</div>
			</main>

			<footer className="absolute bottom-0 w-full mb-10">
				<div className="flex justify-center w-full mb-5 text-xl text-white">
					Play Time :{" "}
					<b className="mx-2 text-2xl text-white"> {(time / 1000).toFixed(2)} </b> Detik
				</div>
				<div className="flex justify-center w-full">
					<button
						onClick={() => setIsRun(!isRun)}
						className={`${isRun ? `bg-red-500` : `bg-blue-500`} px-12 hover:cursor-pointer py-4 text-white text-4xl font-bold rounded-full w-fit ${
							isRun && (time / 1000) < minStopTime ? "hidden" : ""
						}`}
					>
						{isRun ? (
							<span>Stop <span className="ml-2">⏹️</span></span>
						) : (
							<span>Play <span className="ml-2">▶️</span></span>
						)}
					</button>
				</div>
				<div className="text-center text-white mt-15 flex flex-row items-center justify-center gap-10">
					<Link href="/hadiah" className="hover:underline" target="_blank">
						⚙️ Pilihan Hadiah
					</Link>
					<div className="flex items-center">
						<label className="text-xl text-white mr-2">Min Play Time:</label>
						<select
							className="text-white p-2 rounded bg-gray-400"
							onChange={(e) => setMinStopTime(Number(e.target.value))}
							value={minStopTime}
						>
							{[1, 2, 3, 4, 5].map((num) => (
								<option key={num} value={num}>
									{num}
								</option>
							))}
						</select>
					</div>
				</div>
			</footer>

			{!isRun && time > 0 && (
				<Fireworks
					isOpen={showFramework}
					winner={randomPeserta}
					reload={reloadWinners}
					prize={currentPrize}
				/>
			)}
		</div>
	);
}