'use client';

import { useEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { Peserta, Winners } from "@/libs/type";

const gFont = Dancing_Script({ subsets: ["latin"] });

class Firework {
	x: number;
	y: number;
	color: string;
	particles: Particle[];
	delay: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.color = this.getBrightColor();
		this.particles = [];
		this.delay = Math.random() * 1000 + 500;
		for (let i = 0; i < 50; i++) {
			this.particles.push(new Particle(this.x, this.y, this.color, this.delay));
		}
	}
	update() {
		this.particles.forEach((p) => p.update());
	}
	draw(ctx: CanvasRenderingContext2D) {
		this.particles.forEach((p) => p.draw(ctx));
	}
	getBrightColor(): string {
		const brightColors = ["#FFD700", "#FF4500", "#FF6347", "#FFFF00", "#FF0000", "#FFA500", "#00BFFF", "#1E90FF", "#8A2BE2", "#32CD32"];
		return brightColors[Math.floor(Math.random() * brightColors.length)];
	}
}

class Particle {
	x: number;
	y: number;
	color: string;
	size: number;
	speedX: number;
	speedY: number;
	alpha: number;
	delay: number;
	fadeStart: number;

	constructor(x: number, y: number, color: string, delay: number) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.size = Math.random() * 3 + 1;
		this.speedX = Math.random() * 4 - 2;
		this.speedY = Math.random() * 4 - 2;
		this.alpha = 1;
		this.delay = delay;
		this.fadeStart = Date.now() + this.delay;
	}
	update() {
		this.x += this.speedX;
		this.y += this.speedY;
		if (Date.now() > this.fadeStart) {
			this.alpha -= 0.015;
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (!ctx) return;
		ctx.globalAlpha = Math.max(this.alpha, 0);
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
	}
}

export default function Fireworks({
	isOpen,
	winners,
	reload,
	prize,
}: {
	isOpen: boolean,
	winners: Peserta[],
	reload: (type: "win" | "drop") => void,
	prize: string
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isRunning, setIsRunning] = useState<boolean>(isOpen);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const fireworksRef = useRef<Firework[]>([]);
	const [open, setOpen] = useState<boolean>(isOpen);

	// Track which winners are gugur
	const [gugurSet, setGugurSet] = useState<Set<string>>(new Set());

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		function animate() {
			if (!ctx || !canvas) return;
			ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			fireworksRef.current.forEach((f) => {
				f.update();
				f.draw(ctx);
			});
			fireworksRef.current = fireworksRef.current.filter(f => f.particles.some(p => p.alpha > 0));
			if (isRunning) {
				requestAnimationFrame(animate);
			}
		}

		function createRandomFirework() {
			if (!canvas) return;
			const x = Math.random() * canvas.width;
			const y = Math.random() * canvas.height * 0.5;
			fireworksRef.current.push(new Firework(x, y));
		}

		if (isRunning) {
			intervalRef.current = setInterval(createRandomFirework, 300);
			animate();
		} else {
			if (intervalRef.current) clearInterval(intervalRef.current);
			fireworksRef.current = [];
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning]);

	const toggleGugur = (id: string) => {
		setGugurSet(prev => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleSimpan = () => {
		if (!confirm(`Simpan ${winners.length - gugurSet.size} pemenang dan gugurkan ${gugurSet.size} peserta?`)) return;

		const storedWinners = localStorage.getItem('doorprize.winners');
		const winnersData: Winners[] = storedWinners ? JSON.parse(storedWinners) : [];

		const storedDrops = localStorage.getItem('doorprize.drop-winners');
		const dropsData: Winners[] = storedDrops ? JSON.parse(storedDrops) : [];

		winners.forEach(w => {
			if (gugurSet.has(w.id)) {
				dropsData.push({ ...w, timestamp: Date.now(), prize });
			} else {
				winnersData.push({ ...w, timestamp: Date.now(), prize });
			}
		});

		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData));
		localStorage.setItem('doorprize.drop-winners', JSON.stringify(dropsData));

		setOpen(false);

		// Jika semua gugur → reload drop, selainnya reload win
		const allGugur = gugurSet.size === winners.length;
		reload(allGugur ? "drop" : "win");
	};

	return (
		<>
			<div className={`${!open ? "hidden" : ""} fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center h-screen`}>
				<div className="absolute top-0 flex flex-col items-center justify-center z-10 w-full h-full px-10">
					<span className="text-7xl">🎉</span>
					<div className={`${gFont.className} text-6xl mt-3 mb-3 font-bold text-yellow-300`}>Selamat Kepada</div>

					{/* Winner cards — max 5 per baris, minimalis */}
					<div className="flex flex-wrap justify-center gap-3 mt-2 mb-6 w-full max-w-6xl">
						{winners.map((w) => {
							const isGugur = gugurSet.has(w.id);
							return (
								<div
									key={w.id}
									style={{ flexBasis: winners.length === 1 ? '500px' : 'calc(20% - 12px)', minWidth: '160px' }}
									className={`border border-dashed px-4 py-4 rounded-2xl text-center transition-all duration-300 ${
											isGugur ? 'border-red-400 opacity-40' : 'border-yellow-300'
									}`}
								>
									<div className={`font-bold text-white leading-tight ${winners.length === 1 ? 'text-5xl' : 'text-2xl'}`}>
										{w.name}
									</div>
									<div className={`text-gray-300 mt-1 ${winners.length === 1 ? 'text-3xl' : 'text-base'}`}>
										{w.id}
									</div>
									<button
										onClick={() => toggleGugur(w.id)}
										className={`mt-3 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:cursor-pointer ${
												isGugur
														? 'bg-gray-600 text-white hover:bg-gray-500'
														: 'bg-red-700 text-white hover:bg-red-600'
										}`}
									>
										{isGugur ? '↩ Batal' : 'Gugur'}
									</button>
								</div>
							);
						})}
					</div>

					<div className={`${gFont.className} text-3xl text-yellow-300`}>Mendapatkan Hadiah</div>
					<div className="text-5xl text-white uppercase mt-2 mb-6">🎊 {prize} 🎊</div>

					<button
						onClick={handleSimpan}
						className="p-4 px-16 bg-green-700 text-white text-2xl font-bold rounded-lg shadow-lg hover:cursor-pointer hover:bg-green-600 transition-all"
					>
						Simpan
					</button>
				</div>
				<canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full bg-black" />
			</div>
		</>
	);
}