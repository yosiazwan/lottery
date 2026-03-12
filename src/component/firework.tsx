'use client';

import { useEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { Peserta, Winners } from "@/libs/type";

const gFont = Dancing_Script({ subsets: ["latin"] });

const fireworkAudio = typeof window !== 'undefined' ? new Audio('/sounds/firework.mp3') : null;

// ── Warna ──────────────────────────────────────────────────────────────────
const PALETTES = [
	['#FFD700', '#FFA500', '#FF6347'],   // gold-orange
	['#00BFFF', '#1E90FF', '#87CEFA'],   // biru
	['#FF69B4', '#FF1493', '#FFB6C1'],   // pink
	['#7FFF00', '#32CD32', '#00FA9A'],   // hijau
	['#EE82EE', '#DA70D6', '#FF00FF'],   // ungu
	['#FF4500', '#FF6347', '#FFD700'],   // merah-emas
	// pelangi
	['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
];

function randomPalette() {
	return PALETTES[Math.floor(Math.random() * PALETTES.length)];
}

function lerpColor(a: string, b: string, t: number): string {
	const ah = parseInt(a.slice(1), 16);
	const bh = parseInt(b.slice(1), 16);
	const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
	const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
	const r = Math.round(ar + (br - ar) * t);
	const g = Math.round(ag + (bg - ag) * t);
	const b2 = Math.round(ab + (bb - ab) * t);
	return `rgb(${r},${g},${b2})`;
}

// ── Rocket (melesat ke atas dengan ekor) ──────────────────────────────────
class Rocket {
	x: number; y: number;
	vx: number; vy: number;
	targetY: number;
	exploded: boolean;
	trail: { x: number; y: number; alpha: number }[];
	color: string;
	palette: string[];

	constructor(canvasWidth: number, canvasHeight: number) {
		this.x = canvasWidth * 0.1 + Math.random() * canvasWidth * 0.8;
		this.y = canvasHeight;
		this.targetY = canvasHeight * 0.1 + Math.random() * canvasHeight * 0.4;
		this.vx = (Math.random() - 0.5) * 2;
		this.vy = -(12 + Math.random() * 6);
		this.exploded = false;
		this.trail = [];
		this.palette = randomPalette();
		this.color = this.palette[0];
	}

	update(): boolean {
		this.trail.push({ x: this.x, y: this.y, alpha: 1 });
		if (this.trail.length > 20) this.trail.shift();
		this.trail.forEach(t => { t.alpha -= 0.05; });

		this.x += this.vx;
		this.y += this.vy;
		this.vy += 0.15;

		// Meledak jika sudah mencapai atau melewati target,
		// ATAU jika mulai turun (vy > 0) — jaminan selalu meledak
		return this.y <= this.targetY || this.vy > 0;
	}

	draw(ctx: CanvasRenderingContext2D) {
		// Ekor trailing
		this.trail.forEach((t, i) => {
			const ratio = i / this.trail.length;
			ctx.globalAlpha = Math.max(0, t.alpha * ratio);
			ctx.fillStyle = lerpColor(this.color, '#ffffff', ratio * 0.3);
			const size = ratio * 3;
			ctx.beginPath();
			ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
			ctx.fill();
		});

		// Kepala roket
		ctx.globalAlpha = 1;
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
		ctx.fill();
	}
}

// ── Tipe ledakan ──────────────────────────────────────────────────────────
type BurstType = 'circle' | 'star' | 'ring' | 'willow' | 'chrysanthemum';

// ── Partikel ledakan ──────────────────────────────────────────────────────
class Particle {
	x: number; y: number;
	vx: number; vy: number;
	alpha: number;
	color: string;
	size: number;
	gravity: number;
	drag: number;
	sparkle: boolean;
	sparkleTimer: number;
	trail: { x: number; y: number }[];
	burstType: BurstType;

	constructor(x: number, y: number, palette: string[], burstType: BurstType, angle?: number, speed?: number) {
		this.x = x; this.y = y;
		this.burstType = burstType;
		this.alpha = 1;
		this.gravity = burstType === 'willow' ? 0.08 : 0.05;
		this.drag = burstType === 'willow' ? 0.97 : 0.985;
		this.trail = [];
		this.sparkle = Math.random() < 0.3;
		this.sparkleTimer = 0;

		// Warna gradasi dari palette
		const t = Math.random();
		const idx = Math.floor(t * (palette.length - 1));
		this.color = lerpColor(palette[idx], palette[Math.min(idx + 1, palette.length - 1)], t % 1);

		const a = angle ?? Math.random() * Math.PI * 2;
		const s = speed ?? this.getSpeed(burstType);
		this.vx = Math.cos(a) * s;
		this.vy = Math.sin(a) * s;
		this.size = burstType === 'chrysanthemum' ? 1.5 + Math.random() : 2 + Math.random() * 2;
	}

	getSpeed(type: BurstType): number {
		switch (type) {
			case 'willow': return 2 + Math.random() * 3;
			case 'ring': return 4 + Math.random() * 0.5;
			case 'chrysanthemum': return 1 + Math.random() * 6;
			case 'star': return 3 + Math.random() * 4;
			default: return 2 + Math.random() * 5;
		}
	}

	update() {
		this.trail.push({ x: this.x, y: this.y });
		if (this.trail.length > 6) this.trail.shift();

		this.vx *= this.drag;
		this.vy *= this.drag;
		this.vy += this.gravity;
		this.x += this.vx;
		this.y += this.vy;
		this.alpha -= this.burstType === 'willow' ? 0.008 : 0.012;
		this.sparkleTimer++;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.alpha <= 0) return;

		// Trail ekor partikel
		if (this.burstType === 'willow' || this.burstType === 'chrysanthemum') {
			this.trail.forEach((t, i) => {
				ctx.globalAlpha = (i / this.trail.length) * this.alpha * 0.4;
				ctx.fillStyle = this.color;
				ctx.beginPath();
				ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
				ctx.fill();
			});
		}

		// Sparkle — berkedip
		if (this.sparkle && this.sparkleTimer % 4 < 2) {
			ctx.globalAlpha = this.alpha * 1.5;
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = Math.max(0, this.alpha);
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
	}

	isDead() { return this.alpha <= 0; }
}

// ── Ledakan ───────────────────────────────────────────────────────────────
class Explosion {
	particles: Particle[];
	x: number; y: number;

	constructor(x: number, y: number, palette: string[]) {
		this.x = x; this.y = y;
		this.particles = [];

		const types: BurstType[] = ['circle', 'star', 'ring', 'willow', 'chrysanthemum'];
		const burstType = types[Math.floor(Math.random() * types.length)];
		const count = burstType === 'chrysanthemum' ? 120 : burstType === 'ring' ? 60 : 80;

		if (burstType === 'star') {
			// Bintang 5/6 sudut + fill acak
			const points = 5 + Math.floor(Math.random() * 2);
			for (let i = 0; i < points * 2; i++) {
				const angle = (i / (points * 2)) * Math.PI * 2;
				const speed = i % 2 === 0 ? 6 + Math.random() * 2 : 2 + Math.random();
				this.particles.push(new Particle(x, y, palette, burstType, angle, speed));
			}
			// Tambah partikel fill
			for (let i = 0; i < 40; i++) {
				this.particles.push(new Particle(x, y, palette, 'circle'));
			}
		} else if (burstType === 'ring') {
			for (let i = 0; i < count; i++) {
				const angle = (i / count) * Math.PI * 2;
				this.particles.push(new Particle(x, y, palette, burstType, angle, 4 + Math.random() * 0.5));
			}
		} else {
			for (let i = 0; i < count; i++) {
				this.particles.push(new Particle(x, y, palette, burstType));
			}
		}

		// Semua tipe: tambah sparkle glitter kecil di pusat
		for (let i = 0; i < 15; i++) {
			const p = new Particle(x, y, ['#ffffff', '#ffffaa'], 'circle', Math.random() * Math.PI * 2, 0.5 + Math.random() * 1.5);
			p.size = 1;
			p.sparkle = true;
			this.particles.push(p);
		}
	}

	update() { this.particles.forEach(p => p.update()); }
	draw(ctx: CanvasRenderingContext2D) { this.particles.forEach(p => p.draw(ctx)); }
	isDead() { return this.particles.every(p => p.isDead()); }
}

const REVEAL_SPEED_MS = 300;

export default function Fireworks({
	isOpen, winners, reload, prize, onClose,
}: {
	isOpen: boolean;
	winners: Peserta[];
	reload: (type: "win" | "drop") => void;
	prize: string;
	onClose?: () => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isRunning] = useState<boolean>(isOpen);
	const rocketIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const rocketsRef = useRef<Rocket[]>([]);
	const explosionsRef = useRef<Explosion[]>([]);
	const animFrameRef = useRef<number>(0);

	const [open, setOpen] = useState<boolean>(isOpen);
	const [gugurSet, setGugurSet] = useState<Set<string>>(new Set());

	const [revealedCount, setRevealedCount] = useState(0);
	const [isRevealing, setIsRevealing] = useState(true);
	const revealRef = useRef<NodeJS.Timeout | null>(null);

	const count = winners.length;
	const isMini = count > 16;
	const allRevealed = revealedCount >= count;

	const [screenSize, setScreenSize] = useState({ w: window.innerWidth, h: window.innerHeight });

	useEffect(() => {
			const handleResize = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
	}, []);

	const isSmall = screenSize.w <= 1280 || screenSize.h <= 720;

	// Audio
	useEffect(() => {
		if (!isOpen || !fireworkAudio) return;
		fireworkAudio.loop = true;
		fireworkAudio.volume = 0.6;
		fireworkAudio.currentTime = 0;
		fireworkAudio.play().catch(() => {});
		return () => {
			fireworkAudio.pause();
			fireworkAudio.currentTime = 0;
		};
	}, [isOpen]);

	// Simpan winners
	useEffect(() => {
		if (!isOpen || winners.length === 0) return;
		const storedWinners = localStorage.getItem('doorprize.winners');
		const winnersData: Winners[] = storedWinners ? JSON.parse(storedWinners) : [];
		winners.forEach(w => {
			if (!winnersData.some(x => x.id === w.id))
				winnersData.push({ ...w, timestamp: Date.now(), prize });
		});
		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData));
		const t = setTimeout(() => reload("win"), 100);
		return () => clearTimeout(t);
	}, [isOpen]);

	// Reveal
	useEffect(() => {
		if (!open) return;
		setRevealedCount(0);
		setIsRevealing(true);
	}, [open]);

	useEffect(() => {
		if (!isRevealing) return;
		if (revealedCount >= count) { setIsRevealing(false); return; }
		revealRef.current = setTimeout(() => setRevealedCount(p => p + 1), REVEAL_SPEED_MS);
		return () => { if (revealRef.current) clearTimeout(revealRef.current); };
	}, [revealedCount, isRevealing, count]);

	const revealAll = () => {
		if (revealRef.current) clearTimeout(revealRef.current);
		setRevealedCount(count);
		setIsRevealing(false);
	};

	// Canvas animasi
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		if (!isRunning) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			return;
		}

		function animate() {
			if (!ctx || !canvas) return;

			ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			rocketsRef.current = rocketsRef.current.filter(rocket => {
				const shouldExplode = rocket.update();
				rocket.draw(ctx!);
				if (shouldExplode) {
					explosionsRef.current.push(new Explosion(rocket.x, rocket.y, rocket.palette));
					return false;
				}
				return true;
			});

			explosionsRef.current.forEach(exp => { exp.update(); exp.draw(ctx!); });
			explosionsRef.current = explosionsRef.current.filter(exp => !exp.isDead());

			ctx.globalAlpha = 1;
			animFrameRef.current = requestAnimationFrame(animate);
		}

		const launchSalvo = (count: number) => {
			for (let i = 0; i < count; i++) {
				setTimeout(() => {
					if (!canvasRef.current) return;
					rocketsRef.current.push(new Rocket(canvasRef.current.width, canvasRef.current.height));
				}, i * 80);
			}
		};

		const timeouts: NodeJS.Timeout[] = [];

		// Salvo pembuka
		launchSalvo(12);
		timeouts.push(setTimeout(() => launchSalvo(8), 1500));
		timeouts.push(setTimeout(() => launchSalvo(6), 3000));

		// Interval normal setelah salvo selesai
		timeouts.push(setTimeout(() => {
			rocketIntervalRef.current = setInterval(() => {
				if (!canvasRef.current) return;
				rocketsRef.current.push(new Rocket(canvasRef.current.width, canvasRef.current.height));
			}, 600);
		}, 4000));

		animate();

		return () => {
			if (rocketIntervalRef.current) clearInterval(rocketIntervalRef.current);
			cancelAnimationFrame(animFrameRef.current);
			timeouts.forEach(t => clearTimeout(t));
		};
	}, [isRunning]);

	const handleGugur = (w: Peserta) => {
		if (!confirm(`Gugurkan "${w.name}"?`)) return;
		const storedWinners = localStorage.getItem('doorprize.winners');
		const winnersData: Winners[] = storedWinners ? JSON.parse(storedWinners) : [];
		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData.filter(x => x.id !== w.id)));
		const storedDrops = localStorage.getItem('doorprize.drop-winners');
		const dropsData: Winners[] = storedDrops ? JSON.parse(storedDrops) : [];
		if (!dropsData.some(x => x.id === w.id)) dropsData.push({ ...w, timestamp: Date.now(), prize });
		localStorage.setItem('doorprize.drop-winners', JSON.stringify(dropsData));
		setGugurSet(prev => { const next = new Set(prev); next.add(w.id); return next; });
		reload("drop");
	};

	const handleBatalGugur = (w: Peserta) => {
		const storedDrops = localStorage.getItem('doorprize.drop-winners');
		const dropsData: Winners[] = storedDrops ? JSON.parse(storedDrops) : [];
		localStorage.setItem('doorprize.drop-winners', JSON.stringify(dropsData.filter(x => x.id !== w.id)));
		const storedWinners = localStorage.getItem('doorprize.winners');
		const winnersData: Winners[] = storedWinners ? JSON.parse(storedWinners) : [];
		if (!winnersData.some(x => x.id === w.id)) winnersData.push({ ...w, timestamp: Date.now(), prize });
		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData));
		setGugurSet(prev => { const next = new Set(prev); next.delete(w.id); return next; });
		reload("win");
	};

	const WinnerCard = ({ w, index }: { w: Peserta; index: number }) => {
    const isGugur = gugurSet.has(w.id);
    const isVisible = index < revealedCount;

    const perRow = isMini ? 8 : 5;
		const cardWidth = isMini
				? (isSmall ? '90px' : '100px')
				: `calc(${100 / perRow}vw - 16px)`;

		const nameFontSize = count === 1
				? (isSmall ? 'clamp(1.8rem, 5vw, 3.5rem)' : 'clamp(2rem, 5vw, 4rem)')
				: count <= 2
				? (isSmall ? 'clamp(1.3rem, 3vw, 2.2rem)' : 'clamp(1.5rem, 3.5vw, 2.8rem)')
				: count <= 5
				? (isSmall ? 'clamp(1rem, 2.2vw, 1.6rem)' : 'clamp(1.2rem, 2.5vw, 2rem)')
				: count <= 10
				? (isSmall ? 'clamp(0.85rem, 1.7vw, 1.3rem)' : 'clamp(1rem, 2vw, 1.6rem)')
				: count <= 15
				? (isSmall ? 'clamp(0.75rem, 1.4vw, 1.1rem)' : 'clamp(0.9rem, 1.7vw, 1.3rem)')
				: (isSmall ? 'clamp(0.65rem, 1.2vw, 0.9rem)' : 'clamp(0.75rem, 1.4vw, 1.1rem)');

		const idFontSize = count === 1
				? (isSmall ? 'clamp(1.2rem, 3.5vw, 2.5rem)' : 'clamp(1.5rem, 4vw, 3rem)')
				: count <= 5
				? (isSmall ? 'clamp(0.85rem, 1.7vw, 1.3rem)' : 'clamp(1rem, 2vw, 1.6rem)')
				: count <= 10
				? (isSmall ? 'clamp(0.75rem, 1.4vw, 1.1rem)' : 'clamp(0.9rem, 1.6vw, 1.2rem)')
				: (isSmall ? 'clamp(0.65rem, 1.1vw, 0.9rem)' : 'clamp(0.75rem, 1.2vw, 1rem)');

    return (
        <div
            className={`border border-dashed text-center px-3 py-3 rounded-2xl
								${isGugur ? 'border-red-400 opacity-40' : 'border-yellow-300'}`}
						style={{
								width: cardWidth,
								flexShrink: 0,
								opacity: isVisible ? 1 : 0,
								transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
								transition: 'opacity 0.4s ease, transform 0.4s ease',
								backgroundColor: 'rgba(0, 0, 0, .75)',
						}}
        >
            <div style={{ fontSize: nameFontSize }} className="font-bold text-white leading-tight">
                {w.name}
            </div>
            <div style={{ fontSize: idFontSize }} className="text-gray-200 mt-1">
                {w.id}
            </div>
            <button
                onClick={() => isGugur ? handleBatalGugur(w) : handleGugur(w)}
                className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:cursor-pointer
                    ${isGugur ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-red-700 text-white hover:bg-red-600'}`}
            >
                {isGugur ? '↩ Batal' : 'Gugur'}
            </button>
        </div>
    );
};

	return (
		<>
			<div className={`${!open ? "hidden" : ""} fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center h-screen`}>
				<div className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full px-4 py-3">
					<span className={isSmall ? "text-4xl" : "text-5xl"}>🎉</span>
					<div className={`${gFont.className} font-bold text-yellow-300 ${isSmall ? 'text-3xl mt-2 mb-3' : 'text-4xl mt-2 mb-4'}`}>
							Selamat Kepada
					</div>

					<div
							className="flex flex-wrap justify-center px-4 gap-3 w-screen"
							style={{ maxHeight: isSmall ? 'calc(100dvh - 220px)' : 'calc(100dvh - 260px)', overflowY: 'auto' }}
					>
						{winners.map((w, i) => <WinnerCard key={w.id} w={w} index={i} />)}
					</div>

					<div
						style={{ opacity: allRevealed ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: allRevealed ? 'auto' : 'none' }}
						className="flex flex-col items-center"
					>
						<div className={`${gFont.className} text-yellow-300 ${isSmall ? 'text-xl mt-3' : 'text-2xl mt-4'}`}>
								Mendapatkan Hadiah
						</div>
						<div className={`text-white uppercase ${isSmall ? 'text-2xl mt-1 mb-3' : 'text-3xl mt-1 mb-4'}`}>
								🎊 {prize} 🎊
						</div>
						<button
								onClick={() => {
										fireworkAudio?.pause();
										if (fireworkAudio) fireworkAudio.currentTime = 0;
										setOpen(false);
										onClose?.();
								}}
								className={`bg-gray-700 text-white font-bold rounded-lg shadow-lg hover:cursor-pointer hover:bg-gray-600 transition-all
										${isSmall ? 'p-2 px-10 text-lg' : 'p-3 px-12 text-xl'}`}
						>
								Tutup
						</button>
					</div>
				</div>
				<canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full bg-black" />
			</div>
		</>
	);
}