'use client';

import { useEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { Peserta, Winners } from "@/libs/type";

const gFont = Dancing_Script({ subsets: ["latin"] });

class Firework {
	x: number; y: number; color: string; particles: Particle[]; delay: number;
	constructor(x: number, y: number) {
		this.x = x; this.y = y; this.color = this.getBrightColor();
		this.particles = []; this.delay = Math.random() * 1000 + 500;
		for (let i = 0; i < 50; i++) this.particles.push(new Particle(this.x, this.y, this.color, this.delay));
	}
	update() { this.particles.forEach((p) => p.update()); }
	draw(ctx: CanvasRenderingContext2D) { this.particles.forEach((p) => p.draw(ctx)); }
	getBrightColor(): string {
		const brightColors = ["#FFD700", "#FF4500", "#FF6347", "#FFFF00", "#FF0000", "#FFA500", "#00BFFF", "#1E90FF", "#8A2BE2", "#32CD32"];
		return brightColors[Math.floor(Math.random() * brightColors.length)];
	}
}

class Particle {
	x: number; y: number; color: string; size: number;
	speedX: number; speedY: number; alpha: number; delay: number; fadeStart: number;
	constructor(x: number, y: number, color: string, delay: number) {
		this.x = x; this.y = y; this.color = color;
		this.size = Math.random() * 3 + 1;
		this.speedX = Math.random() * 4 - 2; this.speedY = Math.random() * 4 - 2;
		this.alpha = 1; this.delay = delay; this.fadeStart = Date.now() + this.delay;
	}
	update() {
		this.x += this.speedX; this.y += this.speedY;
		if (Date.now() > this.fadeStart) this.alpha -= 0.015;
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (!ctx) return;
		ctx.globalAlpha = Math.max(this.alpha, 0);
		ctx.fillStyle = this.color;
		ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
	}
}

export default function Fireworks({
	isOpen, winners, reload, prize,
}: {
	isOpen: boolean;
	winners: Peserta[];
	reload: (type: "win" | "drop") => void;
	prize: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isRunning] = useState<boolean>(isOpen);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const fireworksRef = useRef<Firework[]>([]);
	const [open, setOpen] = useState<boolean>(isOpen);
	const [gugurSet, setGugurSet] = useState<Set<string>>(new Set());

	// Reveal state
	const [revealedCount, setRevealedCount] = useState(0);
	const [isRevealing, setIsRevealing] = useState(true);
	const revealRef = useRef<NodeJS.Timeout | null>(null);

	const REVEAL_SPEED_MS = 300;

	const count = winners.length;
	const isMini = count > 16;
	const allRevealed = revealedCount >= count;

	// Mulai reveal satu per satu
	useEffect(() => {
		if (!open) return;
		setRevealedCount(0);
		setIsRevealing(true);
	}, [open]);

	useEffect(() => {
			if (!isRevealing) return;
			if (revealedCount >= count) {
					setIsRevealing(false);
					return;
			}
			revealRef.current = setTimeout(() => {
					setRevealedCount(prev => prev + 1);
			}, REVEAL_SPEED_MS); // <-- pakai konstanta
			return () => { if (revealRef.current) clearTimeout(revealRef.current); };
	}, [revealedCount, isRevealing, count]);

	// Reveal semua sekaligus
	const revealAll = () => {
		if (revealRef.current) clearTimeout(revealRef.current);
		setRevealedCount(count);
		setIsRevealing(false);
	};

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
			fireworksRef.current.forEach((f) => { f.update(); f.draw(ctx); });
			fireworksRef.current = fireworksRef.current.filter(f => f.particles.some(p => p.alpha > 0));
			if (isRunning) requestAnimationFrame(animate);
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

		return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
	}, [isRunning]);

	const toggleGugur = (id: string) => {
		setGugurSet(prev => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleSimpan = () => {
		if (!confirm(`Simpan ${count - gugurSet.size} pemenang dan gugurkan ${gugurSet.size} peserta?`)) return;

		const storedWinners = localStorage.getItem('doorprize.winners');
		const winnersData: Winners[] = storedWinners ? JSON.parse(storedWinners) : [];
		const storedDrops = localStorage.getItem('doorprize.drop-winners');
		const dropsData: Winners[] = storedDrops ? JSON.parse(storedDrops) : [];

		winners.forEach(w => {
			if (gugurSet.has(w.id)) dropsData.push({ ...w, timestamp: Date.now(), prize });
			else winnersData.push({ ...w, timestamp: Date.now(), prize });
		});

		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData));
		localStorage.setItem('doorprize.drop-winners', JSON.stringify(dropsData));
		setOpen(false);
		reload(gugurSet.size === count ? "drop" : "win");
	};

	const WinnerCard = ({ w, index }: { w: Peserta; index: number }) => {
		const isGugur = gugurSet.has(w.id);
		const isVisible = index < revealedCount;

		return (
			<div
				style={{
					minWidth: isMini ? '120px' : '160px',
					flex: '1 1 auto',
					maxWidth: count === 1 ? '800px' : isMini ? '160px' : '220px',
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
					transition: 'opacity 0.4s ease, transform 0.4s ease',
				}}
				className={`border border-dashed text-center transition-all duration-300 ${
					isMini ? 'px-2 py-2 rounded-xl' : 'px-4 py-4 rounded-2xl'
				} ${isGugur ? 'border-red-400 opacity-40' : 'border-yellow-300'}`}
			>
				<div className={`font-bold text-white leading-tight ${
					count === 1 ? 'text-7xl' : isMini ? 'text-sm' : 'text-2xl'
				}`}>
					{w.name}
				</div>
				<div className={`text-gray-300 mt-1 ${
					count === 1 ? 'text-5xl' : isMini ? 'text-xs' : 'text-base'
				}`}>
					{w.id}
				</div>
				<button
					onClick={() => toggleGugur(w.id)}
					className={`rounded-lg font-semibold transition-all hover:cursor-pointer ${
						isMini ? 'mt-1 px-2 py-0.5 text-xs rounded' : 'mt-3 px-3 py-1 text-xs rounded-lg'
					} ${isGugur ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-red-700 text-white hover:bg-red-600'}`}
				>
					{isGugur ? (isMini ? '↩' : '↩ Batal') : 'Gugur'}
				</button>
			</div>
		);
	};

	return (
		<>
			<div className={`${!open ? "hidden" : ""} fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center h-screen`}>
				<div className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full px-4 py-3">

					<span className="text-7xl">🎉</span>
					<div className={`${gFont.className} font-bold text-yellow-300 text-6xl mt-3 mb-10`}>
						Selamat Kepada
					</div>

					{/* Winner cards */}
					<div
						className={`flex flex-wrap justify-center w-screen px-4 ${isMini ? 'gap-2' : 'gap-3'}`}
						style={isMini ? { maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' } : {}}
					>
						{winners.map((w, i) => (
							<WinnerCard key={w.id} w={w} index={i} />
						))}
					</div>

					{/* Footer — hanya tampil setelah semua reveal */}
					<div
						style={{
							opacity: allRevealed ? 1 : 0,
							transition: 'opacity 0.6s ease',
							pointerEvents: allRevealed ? 'auto' : 'none',
						}}
						className="flex flex-col items-center"
					>
						<div className={`${gFont.className} text-yellow-300 text-3xl mt-10`}>
							Mendapatkan Hadiah
						</div>
						<div className="text-white uppercase text-5xl mt-2 mb-6">
							🎊 {prize} 🎊
						</div>
						<button
							onClick={handleSimpan}
							className={`bg-green-700 text-white font-bold rounded-lg shadow-lg hover:cursor-pointer hover:bg-green-600 transition-all ${
								isMini ? 'p-2 px-10 text-lg' : 'p-4 px-16 text-2xl'
							}`}
						>
							Simpan
						</button>
					</div>
				</div>
				<canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full bg-black" />
			</div>
		</>
	);
}