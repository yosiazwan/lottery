'use client';

import { useEffect, useState } from "react";

type Peserta = {
	id: string;
	name: string;
};

function getSafeRandomIndex(max: number) {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return array[0] % max;
}

export default function Counter() {
	const intervalTime = 10;
	const [randomPeserta, setRandomPeserta] = useState<Peserta>({ id: '', name: '' });
	const [isRun, setIsRun] = useState(false);
	const [peserta, setPeserta] = useState<Peserta[]>([]);
	const [random, setRandom] = useState<NodeJS.Timeout | null>(null);
	const [time, setTime] = useState<number>(0);

	const fetchData = async () => {
		const localStoragePeserta = localStorage.getItem('doorprize.peserta');
		if (localStoragePeserta) {
			setPeserta(localStoragePeserta ? JSON.parse(localStoragePeserta) : []);
		}
	};

	useEffect(() => {
		if (isRun) {
			setRandom(setInterval(() => {
				const randomIndex = getSafeRandomIndex(peserta.length);
				setRandomPeserta(peserta[randomIndex]);
			}, intervalTime));
		} else {
			setPeserta(prev => prev.filter(peserta => peserta.id !== randomPeserta.id));
			clearInterval(random as NodeJS.Timeout);
			setRandom(null);
		}
	}, [isRun]);

	useEffect(() => {
		fetchData();

		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === 'doorprize.peserta') {
				setPeserta(event.newValue ? JSON.parse(event.newValue) : []);
			}
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	useEffect(() => {
		if (isRun) {
			setTime(0);
			const timer = setInterval(() => {
				setTime(prev => prev + intervalTime);
			}, intervalTime);

			return () => {
				clearInterval(timer);
			};
		}
	}, [isRun]);

	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full">
				<div className="w-full text-center">Jumlah Peserta: <b>{peserta.length}</b> Orang</div>
				<div className="w-full text-center">({randomPeserta.id}) {randomPeserta.name}</div>
				<div className="flex justify-center w-full">
					<button onClick={() => setIsRun(!isRun)} className={`bg-blue-300 px-4 py-2 text-black rounded-md w-fit ${isRun && ((time / 1000) < 5) ? 'hidden' : ''}`}>
						{isRun ? "Stop" : "Start"}
					</button>
				</div>
				<div className="flex justify-center w-full">
					{(time / 1000).toFixed(2)} Detik
				</div>
			</main>
			<footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
				<button onClick={fetchData} className="bg-blue-300 px-4 py-2 text-black rounded-md w-fit">Refresh</button>
			</footer>
		</div>
	);
}