'use client';

import { useEffect, useState } from "react";
import Fireworks from "./firework";

export type Peserta = {
	id: string;
	name: string;
};

function getSafeRandomIndex(max: number) {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return array[0] % max;
}

export type Winners = {
	id: string;
	name: string;
	timestamp: number;
}

export default function Counter({ pesertaData, setWinnersData }: { pesertaData: Peserta[], setWinnersData: (data: Winners[]) => void }) {
	const intervalTime = 10;
	const [randomPeserta, setRandomPeserta] = useState<Peserta>({ id: '', name: '' });
	const [isRun, setIsRun] = useState(false);
	const [peserta, setPeserta] = useState<Peserta[]>(pesertaData);
	const [random, setRandom] = useState<NodeJS.Timeout | null>(null);
	const [time, setTime] = useState<number>(0);
	const [showFramework, setShowFramework] = useState<boolean>(false);

	useEffect(() => {
		setPeserta(pesertaData);
		const winners = localStorage.getItem('doorprize.winners');
		if (winners) {
			const parsedWinners = JSON.parse(winners) as Winners[];
			const pesertaIds = parsedWinners.map(winner => winner.id);
			setPeserta(prev => prev.filter(peserta => !pesertaIds.includes(peserta.id)));
		}
	}, [pesertaData]);

	useEffect(() => {
		if (isRun) {
			setRandom(null);
			if (peserta.length === 0) {
				setIsRun(false);
				alert('Tidak ada peserta');
				return;
			}

			setRandom(setInterval(() => {
				const randomIndex = getSafeRandomIndex(peserta.length);
				setRandomPeserta(peserta[randomIndex]);
			}, intervalTime));

			setTime(0);
			const timer = setInterval(() => {
				setTime(prev => prev + intervalTime);
			}, intervalTime);

			return () => {
				clearInterval(timer);
			};
		} else {
			setPeserta(prev => prev.filter(peserta => peserta.id !== randomPeserta.id));
			clearInterval(random as NodeJS.Timeout);
			setShowFramework(true);

			const winners = localStorage.getItem('doorprize.winners');
			if (time > 0) {
				if (winners) {
					const parsedWinners = JSON.parse(winners) as Winners[];
					const newWinners = [...parsedWinners, { id: randomPeserta.id, name: randomPeserta.name, timestamp: Date.now() }];
					localStorage.setItem('doorprize.winners', JSON.stringify(newWinners));
					setWinnersData(newWinners);
				} else {
					const newWinners = [{ id: randomPeserta.id, name: randomPeserta.name, timestamp: Date.now() }];
					localStorage.setItem('doorprize.winners', JSON.stringify(newWinners));
					setWinnersData(newWinners);
				}
			}
		}
	}, [isRun]);

	return (
		<div className="grid items-center justify-items-center min-h-screen p-0 m-0">
			<div>
				<h1 className="text-6xl font-bold text-yellow-300 flex items-center">
					<span className="mr-2">🎁</span> DoorPrize
				</h1>
				<div className="w-full text-center mt-10 text-4xl">Sisa Peserta: <b>{peserta.length}</b></div>
			</div>
			<main className="w-full">
				<div className="w-full text-center">
					<div className="text-xl">ID:</div>
					<div className="text-5xl font-bold">{randomPeserta.id}</div>
					<div className="mt-5 text-xl">Nama:</div>
					<div className="text-5xl font-bold">{randomPeserta.name}</div>
				</div>
			</main>
			<footer>
				<div className="flex justify-center w-full mb-5 text-xl">
					Play Time : <b className="mx-2 text-2xl"> {(time / 1000).toFixed(2)} </b> Detik
				</div>
				<div className="flex justify-center w-full">
					<button
						onClick={() => setIsRun(!isRun)}
						className={`${isRun ? `bg-red-500` : `bg-blue-500`} px-18 hover: cursor-pointer py-4 text-white text-4xl font-bold rounded-full w-fit ${isRun && ((time / 1000) < 5) ? 'hidden' : ''}`}>
						{isRun ? "Stop" : "Start"}
					</button>
				</div>
			</footer>
			{!isRun && time > 0 && <Fireworks isOpen={showFramework} /> }
		</div>
	);
}