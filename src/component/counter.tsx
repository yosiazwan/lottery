'use client';

import { useEffect, useState, useRef } from "react";
import Fireworks from "./firework";
import Link from "next/link";
import { Prize } from "../app/hadiah/page";
import { crossTabBus } from "@/libs/crossTabEvent";
import { getSafeRandomIndex } from "@/libs/number";
import { Peserta, Winners } from "@/libs/type";

function shuffleArray<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

type DrawMethod = 'random' | 'cycle';

export default function Counter() {
	const intervalTime = 10;

	const [randomPeserta, setRandomPeserta] = useState<Peserta>({ id: '', name: '' });
	const [isRun, setIsRun] = useState(false);
	const [peserta, setPeserta] = useState<Peserta[]>([]);
	const [random, setRandom] = useState<NodeJS.Timeout | null>(null);
	const [time, setTime] = useState<number>(0);
	const [showFramework, setShowFramework] = useState<boolean>(false);
	const [prizes, setPrizes] = useState<Prize[]>([]);
	const [currentPrize, setCurrentPrize] = useState<string>('');
	const [winners, setWinners] = useState<Peserta[]>([]);
	const [winnerCount, setWinnerCount] = useState<number>(1);
	const [winnerCountPerPrize, setWinnerCountPerPrize] = useState<Record<string, number>>({});

	const [drawMethod, setDrawMethod] = useState<DrawMethod>('random');
	const [hasCompletedCycle, setHasCompletedCycle] = useState<boolean>(false);
	const [minCycles, setMinCycles] = useState<number>(2);
	const [minStopTime, setMinStopTime] = useState<number>(2);

	const cycleIndexRef = useRef<number>(0);
	const shuffledRef = useRef<Peserta[]>([]);
	const completedCyclesRef = useRef<number>(0);
	const pesertaRef = useRef<Peserta[]>([]);
	const currentPrizeRef = useRef<string>('');

	const effectiveMethod: DrawMethod = winnerCount > 1 ? 'random' : drawMethod;

	// Computed: prize yang dipilih saat ini
	const selectedPrize = prizes.find(p => p.name === currentPrize);
	const usedCount = winnerCountPerPrize[currentPrize] ?? 0;
	const remainingQuota = selectedPrize?.maxWinners
		? selectedPrize.maxWinners - usedCount
		: peserta.length;
	const maxWinnerInput = Math.min(peserta.length, remainingQuota);

	// Filter prizes yang belum penuh
	const availablePrizes = prizes.filter(p => {
		const used = winnerCountPerPrize[p.name] ?? 0;
		const max = p.maxWinners ?? Infinity;
		return used < max;
	});

	useEffect(() => {
		pesertaRef.current = peserta;
	}, [peserta]);

	useEffect(() => {
		if (currentPrize !== '') currentPrizeRef.current = currentPrize;
	}, [currentPrize]);

	// Auto-sesuaikan winnerCount saat prize atau kuota berubah
	useEffect(() => {
		if (!currentPrize) return;
		const prize = prizes.find(p => p.name === currentPrize);
		if (!prize?.maxWinners) return;
		const used = winnerCountPerPrize[currentPrize] ?? 0;
		const remaining = prize.maxWinners - used;
		if (winnerCount > remaining) setWinnerCount(Math.max(1, remaining));
	}, [currentPrize, prizes, winnerCountPerPrize]);

	useEffect(() => {
		const loadPrizes = () => {
			const prizeDatas = localStorage.getItem('doorprize.prizes');
			setPrizes(prizeDatas ? JSON.parse(prizeDatas) : []);
		};
		loadPrizes();
		const handlePrizeUpdate = (data: Prize[]) => setPrizes(data);
		crossTabBus.on('prize:updated', handlePrizeUpdate);
		return () => crossTabBus.off('prize:updated', handlePrizeUpdate);
	}, []);

	// Hitung pemenang per prize
	useEffect(() => {
		const rebuild = () => {
			const stored = localStorage.getItem('doorprize.winners');
			const data: Winners[] = stored ? JSON.parse(stored) : [];
			const counts: Record<string, number> = {};
			data.forEach(w => { counts[w.prize] = (counts[w.prize] ?? 0) + 1; });
			setWinnerCountPerPrize(counts);
		};
		rebuild();
		const onWinnersUpdated = () => rebuild();
		crossTabBus.on('winners:updated', onWinnersUpdated);
		return () => crossTabBus.off('winners:updated', onWinnersUpdated);
	}, []);

	useEffect(() => {
		const rebuildPeserta = (pesertaData: Peserta[]) => {
			let filteredPeserta = [...pesertaData];
			const storedWinners = localStorage.getItem('doorprize.winners');
			if (storedWinners) {
				const parsedWinners = JSON.parse(storedWinners) as Winners[];
				filteredPeserta = filteredPeserta.filter(p => !parsedWinners.map(w => w.id).includes(p.id));
			}
			const dropWinners = localStorage.getItem('doorprize.drop-winners');
			if (dropWinners) {
				const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
				filteredPeserta = filteredPeserta.filter(p => !parsedDropWinners.map(w => w.id).includes(p.id));
			}
			setPeserta(filteredPeserta);
		};
		const storedPeserta = localStorage.getItem('doorprize.peserta');
		if (storedPeserta) rebuildPeserta(JSON.parse(storedPeserta) as Peserta[]);
		const onPesertaUpdated = (data: Peserta[]) => rebuildPeserta(data);
		crossTabBus.on('peserta:updated', onPesertaUpdated);
		return () => crossTabBus.off('peserta:updated', onPesertaUpdated);
	}, []);

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
			rebuildPesertaFromWinners(updatedWinners, stored ? JSON.parse(stored) : []);
		};
		const onDropUpdated = (updatedDrops: Winners[]) => {
			const stored = localStorage.getItem('doorprize.winners');
			rebuildPesertaFromWinners(stored ? JSON.parse(stored) : [], updatedDrops);
		};
		crossTabBus.on('winners:updated', onWinnersUpdated);
		crossTabBus.on('dropWinners:updated', onDropUpdated);
		return () => {
			crossTabBus.off('winners:updated', onWinnersUpdated);
			crossTabBus.off('dropWinners:updated', onDropUpdated);
		};
	}, []);

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
		setHasCompletedCycle(false);
		completedCyclesRef.current = 0;
		setWinners([]);

		if (peserta.length === 0) {
			setIsRun(false);
			alert('Tidak ada peserta');
			return;
		}
		if (peserta.length < winnerCount) {
			setIsRun(false);
			alert(`Peserta tidak cukup. Butuh ${winnerCount}, tersedia ${peserta.length}`);
			return;
		}
		if (currentPrize === '') {
			setIsRun(false);
			alert('Pilih undian terlebih dahulu');
			return;
		}

		let intervalId: NodeJS.Timeout;

		if (effectiveMethod === 'cycle') {
			shuffledRef.current = shuffleArray([...peserta]);
			cycleIndexRef.current = 0;

			intervalId = setInterval(() => {
				const idx = cycleIndexRef.current;
				setRandomPeserta(shuffledRef.current[idx]);
				const nextIndex = (idx + 1) % shuffledRef.current.length;
				cycleIndexRef.current = nextIndex;
				if (nextIndex === 0) {
					completedCyclesRef.current += 1;
					if (completedCyclesRef.current >= minCycles) {
						setHasCompletedCycle(true);
					}
				}
			}, intervalTime);
		} else {
			intervalId = setInterval(() => {
				const randomIndex = getSafeRandomIndex(pesertaRef.current.length);
				setRandomPeserta(pesertaRef.current[randomIndex]);
			}, intervalTime);
		}

		const timerId = setInterval(() => {
			setTime(prev => prev + intervalTime);
		}, intervalTime);

		setRandom(intervalId);

		return () => {
			clearInterval(intervalId);
			clearInterval(timerId);
		};
	}, [isRun, currentPrize, peserta, effectiveMethod, minCycles, winnerCount]);

	const handleStop = () => {
		if (!canStop) return;

		let selected: Peserta[] = [];

		if (effectiveMethod === 'cycle') {
			const arr = shuffledRef.current;
			const startIdx = cycleIndexRef.current;
			for (let i = 0; i < winnerCount; i++) {
				selected.push(arr[(startIdx + i) % arr.length]);
			}
		} else {
			const shuffled = shuffleArray([...pesertaRef.current]);
			selected = shuffled.slice(0, winnerCount);
		}

		setWinners(selected);
		setIsRun(false);
	};

	const reloadWinners = (type: "win" | "drop") => {
		const storedWinners = localStorage.getItem('doorprize.winners');
		if (storedWinners) crossTabBus.emit('winners:updated', JSON.parse(storedWinners) as Winners[]);
		const dropWinners = localStorage.getItem('doorprize.drop-winners');
		if (dropWinners) crossTabBus.emit('dropWinners:updated', JSON.parse(dropWinners) as Winners[]);
	};

	const handleFireworksClose = () => {
		setCurrentPrize('');
		currentPrizeRef.current = '';
	};

	const canStop = isRun && (
		effectiveMethod === 'random'
			? (time / 1000) >= minStopTime
			: hasCompletedCycle
	);

	return (
		<div className="flex flex-col items-center min-h-screen py-6 px-4">
			{/* Header */}
			<div className="flex flex-col items-center w-full">
				<h1 className="text-4xl lg:text-6xl font-bold text-yellow-300 flex items-center">
					<img src="/favicon.ico" alt="DoorPrize" className="w-10 h-10 lg:w-14 lg:h-14 mr-3" />
					DoorPrize
				</h1>
				<div className="w-full text-center mt-4 text-2xl lg:text-4xl text-white">
					Jumlah Peserta: <b>{peserta.length}</b>
				</div>
				<div className="mt-4 text-lg lg:text-2xl font-bold text-yellow-400">Hadiah Yang Diundi</div>
				<div className="mt-2 border border-dashed border-yellow-500 px-6 py-2 rounded-lg text-center">
					<select
						className="text-white text-center p-2 rounded bg-black appearance-none text-xl lg:text-3xl font-bold uppercase"
						onChange={(e) => setCurrentPrize(e.target.value)}
						value={currentPrize}
					>
						<option value="">-- Pilih Hadiah --</option>
						{availablePrizes.map((prize, index) => {
							const used = winnerCountPerPrize[prize.name] ?? 0;
							const max = prize.maxWinners ?? '∞';
							return (
								<option key={index} value={prize.name}>
									{prize.name} ({used}/{max})
								</option>
							);
						})}
					</select>
				</div>

				<div className="mt-4 flex items-center gap-3 flex-wrap justify-center">
					<label className="text-lg lg:text-xl text-yellow-400 font-bold">Jumlah Pemenang:</label>
					<input
						type="number"
						min={1}
						max={maxWinnerInput || 1}
						value={winnerCount}
						disabled={isRun}
						onChange={(e) => {
							const val = Math.min(
								maxWinnerInput || 1,
								Math.max(1, parseInt(e.target.value) || 1)
							);
							setWinnerCount(val);
						}}
						className="w-16 lg:w-20 text-center text-xl lg:text-2xl font-bold text-white bg-black border border-yellow-500 rounded-lg p-2 disabled:opacity-50"
					/>
					<span className="text-gray-400 text-base lg:text-lg">orang</span>
				</div>

				{winnerCount > 1 && (
					<div className="mt-2 text-xs lg:text-sm text-gray-400 italic">
						🎲 Multi-pemenang otomatis menggunakan metode Random
					</div>
				)}
			</div>

			{/* Main — nama peserta */}
			<div className="flex-1 flex items-center justify-center w-full my-4">
				<div className="w-full text-center text-white">
					{!isRun && (
						<p className="text-lg lg:text-xl text-white">Ready...</p>
					)}
					{isRun && (
						<div>
							<div className="text-3xl lg:text-5xl font-bold text-yellow-600">{randomPeserta.id}</div>
							<div className="text-3xl lg:text-5xl font-bold text-yellow-300 mt-2">{randomPeserta.name}</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="w-full flex flex-col items-center gap-4">
				<div className="text-lg lg:text-xl text-white">
					Play Time: <b className="mx-2 text-xl lg:text-2xl text-white">{(time / 1000).toFixed(2)}</b> Detik
				</div>
				<div className="flex justify-center w-full">
					{!isRun && (
						<button
							onClick={() => setIsRun(true)}
							className="bg-blue-500 px-8 lg:px-12 hover:cursor-pointer py-3 lg:py-4 text-white text-2xl lg:text-4xl font-bold rounded-full w-fit"
						>
							Play <span className="ml-2">▶️</span>
						</button>
					)}
					{isRun && (
						<button
							onClick={handleStop}
							className={`px-8 lg:px-12 py-3 lg:py-4 text-white text-2xl lg:text-4xl font-bold rounded-full w-fit transition-all duration-300 ${
								canStop ? 'bg-red-500 hover:cursor-pointer' : 'bg-gray-500 cursor-not-allowed opacity-50'
							}`}
							disabled={!canStop}
						>
							Stop <span className="ml-2">⏹️</span>
						</button>
					)}
				</div>

				<div className="text-center text-white flex flex-row items-center justify-center gap-4 lg:gap-8 flex-wrap text-sm lg:text-base">
					<Link href="/hadiah" className="hover:underline" target="_blank">
						⚙️ Pilihan Hadiah
					</Link>

					{winnerCount === 1 && (
						<div className="flex items-center gap-2">
							<div className="flex rounded-lg overflow-hidden border border-gray-500">
								<button
									onClick={() => !isRun && setDrawMethod('random')}
									disabled={isRun}
									className={`px-3 lg:px-4 py-2 text-sm lg:text-lg font-semibold transition-all ${
										drawMethod === 'random' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
									} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									🎲 Random
								</button>
								<button
									onClick={() => !isRun && setDrawMethod('cycle')}
									disabled={isRun}
									className={`px-3 lg:px-4 py-2 text-sm lg:text-lg font-semibold transition-all ${
										drawMethod === 'cycle' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
									} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									🎡 Cycle
								</button>
							</div>
						</div>
					)}

					{effectiveMethod === 'random' && (
						<div className="flex items-center gap-2">
							<label className="text-white text-sm">Min Play:</label>
							<select
								className="text-white p-1 lg:p-2 rounded bg-gray-400 disabled:opacity-50 text-sm"
								onChange={(e) => setMinStopTime(Number(e.target.value))}
								value={minStopTime}
								disabled={isRun}
							>
								{[1, 2, 3, 4, 5, 8, 10].map((num) => (
									<option key={num} value={num}>{num}s</option>
								))}
							</select>
						</div>
					)}

					{effectiveMethod === 'cycle' && (
						<div className="flex items-center gap-2">
							<label className="text-white text-sm">Min Cycle:</label>
							<select
								className="text-white p-1 lg:p-2 rounded bg-gray-400 disabled:opacity-50 text-sm"
								onChange={(e) => setMinCycles(Number(e.target.value))}
								value={minCycles}
								disabled={isRun}
							>
								{[1, 2, 3, 4, 5].map((num) => (
									<option key={num} value={num}>{num}x</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			{!isRun && time > 0 && winners.length > 0 && (
				<Fireworks
					isOpen={showFramework}
					winners={winners}
					reload={reloadWinners}
					onClose={handleFireworksClose}
					prize={currentPrizeRef.current}
				/>
			)}
		</div>
	);
}