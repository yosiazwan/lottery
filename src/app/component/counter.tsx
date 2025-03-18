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

export default function Counter({
    pesertaData,
    setWinnersData,
    setDropWinnersData
}: {
    pesertaData: Peserta[],
    setWinnersData: (data: Winners[]) => void,
    setDropWinnersData: (data: Winners[]) => void
}) {
    const intervalTime = 10;
    const [randomPeserta, setRandomPeserta] = useState<Peserta>({ id: '', name: '' });
    const [isRun, setIsRun] = useState(false);
    const [peserta, setPeserta] = useState<Peserta[]>(pesertaData);
    const [random, setRandom] = useState<NodeJS.Timeout | null>(null);
    const [time, setTime] = useState<number>(0);
    const [showFramework, setShowFramework] = useState<boolean>(false);
		const [minStopTime, setMinStopTime] = useState<number>(5);

    useEffect(() => {
			setPeserta(pesertaData);
			const winners = localStorage.getItem('doorprize.winners');
			if (winners) {
					const parsedWinners = JSON.parse(winners) as Winners[];
					const pesertaIds = parsedWinners.map(winner => winner.id);
					setPeserta(prev => prev.filter(peserta => !pesertaIds.includes(peserta.id)));
			}

			const dropWinners = localStorage.getItem('doorprize.drop-winners');
			if (dropWinners) {
					const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
					const pesertaIds = parsedDropWinners.map(winner => winner.id);
					setPeserta(prev => prev.filter(peserta => !pesertaIds.includes(peserta.id)));
			}
    }, [pesertaData]);

    useEffect(() => {
			if (isRun) {
				setTime(0);
				if (peserta.length === 0) {
						setIsRun(false);
						alert('Tidak ada peserta');
						return;
				}

				const intervalId = setInterval(() => {
						const randomIndex = getSafeRandomIndex(peserta.length);
						setRandomPeserta(peserta[randomIndex]);
				}, intervalTime);
				setRandom(intervalId);

				const timerId = setInterval(() => {
						setTime(prev => prev + intervalTime);
				}, intervalTime);

				return () => {
						clearInterval(intervalId);
						clearInterval(timerId);
				};
			} else {
				clearInterval(random as NodeJS.Timeout);
				setShowFramework(true);
			}
    }, [isRun, peserta]);

    const reloadWinners = () => {
			const winners = localStorage.getItem('doorprize.winners');
			if (winners) {
					const parsedWinners = JSON.parse(winners) as Winners[];
					setWinnersData(parsedWinners);
					const pesertaIds = parsedWinners.map(winner => winner.id);
					setPeserta(prev => prev.filter(peserta => !pesertaIds.includes(peserta.id)));
			}

			const dropWinners = localStorage.getItem('doorprize.drop-winners');
			if (dropWinners) {
					const parsedDropWinners = JSON.parse(dropWinners) as Winners[];
					setDropWinnersData(parsedDropWinners);
					const pesertaIds = parsedDropWinners.map(winner => winner.id);
					setPeserta(prev => prev.filter(peserta => !pesertaIds.includes(peserta.id)));
			}
    }

    return (
        <div className="grid items-center justify-items-center min-h-screen p-0 m-0">
            <div>
                <h1 className="text-6xl font-bold text-yellow-300 flex items-center">
                    <span className="mr-2">🎁</span> DoorPrize
                </h1>
                <div className="w-full text-center mt-10 text-4xl text-white">Sisa Peserta: <b>{peserta.length}</b></div>
            </div>
            <main className="w-full">
                <div className="w-full text-center text-white">
                    {!isRun && <div>Waiting...</div>}
                    {isRun && (
                        <div>
                            <div className="text-5xl font-bold text-yellow-600 mt-5">{randomPeserta.id}</div>
                            <div className="text-5xl font-bold text-yellow-300 mt-2">{randomPeserta.name}</div>
                        </div>
                    )}
                </div>
            </main>
            <footer>
                <div className="flex justify-center w-full mb-5 text-xl text-white">
                    Play Time : <b className="mx-2 text-2xl text-white"> {(time / 1000).toFixed(2)} </b> Detik
                </div>
                <div className="flex justify-center w-full">
                    <button
                        onClick={() => setIsRun(!isRun)}
                        className={`${isRun ? `bg-red-500` : `bg-blue-500`} px-18 hover: cursor-pointer py-4 text-white text-4xl font-bold rounded-full w-fit ${isRun && ((time / 1000) < minStopTime) ? 'hidden' : ''}`}>
                        {isRun ? "Stop" : "Start"}
                    </button>
                </div>
            </footer>
            {!isRun && time > 0 && <Fireworks isOpen={showFramework} winner={randomPeserta} reload={reloadWinners} />}
        </div>
    );
}