'use client';

import { useEffect, useRef, useState } from "react";
import { Peserta, Winners } from "./counter";
import { Dancing_Script } from "next/font/google";

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

export default function Fireworks({ isOpen, winner, reload }: { isOpen: boolean, winner: Peserta, reload: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(isOpen);
  let intervalRef = useRef<NodeJS.Timeout | null>(null);
  let fireworks = useRef<Firework[]>([]);
	const [open, setOpen] = useState<boolean>(isOpen);

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
      fireworks.current.forEach((f) => {
        f.update();
		f.draw(ctx);
      });
      fireworks.current = fireworks.current.filter(f => f.particles.some(p => p.alpha > 0));
      if (isRunning) {
        requestAnimationFrame(animate);
      }
    }

    function createRandomFirework() {
      if (!canvas) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      fireworks.current.push(new Firework(x, y));
    }

    if (isRunning) {
      intervalRef.current = setInterval(createRandomFirework, 300);
      animate();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      fireworks.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

	const saveWinner = () => {
		const winners = localStorage.getItem('doorprize.winners');
		const winnersData = winners ? JSON.parse(winners) as Winners[] : [];
		winnersData.push({ ...winner, timestamp: Date.now() });
		localStorage.setItem('doorprize.winners', JSON.stringify(winnersData));
		setOpen(false);
		reload();
	}

	const dumpWinner = () => {
		const dropWinners = localStorage.getItem('doorprize.drop-winners');
		const dropWinnersData = dropWinners ? JSON.parse(dropWinners) as Winners[] : [];
		dropWinnersData.push({ ...winner, timestamp: Date.now() });
		localStorage.setItem('doorprize.drop-winners', JSON.stringify(dropWinnersData));
		setOpen(false);
		reload();
	}

  return (
		<>
			<div className={`${!open ? "hidden" : ""} overflow-hidden flex items-center justify-center h-screen`}>
				<div className="absolute top-0 flex flex-col items-center justify-center z-10 w-full h-full">
					<span className="text-9xl">🎉</span>
					<div className={`${gFont.className} text-8xl mt-5 mb-5 font-bold text-yellow-300`}>Selamat Kepada</div>
					<div className="shadow-lg mt-5 text-center border-2 border-dashed px-25 py-15 rounded-4xl border-yellow-300 mb-15">
						<div className="text-6xl font-bold mb-1 text-white">{winner.name}</div>
						<div className="text-4xl text-white">{winner.id}</div>
					</div>
					<div className="flex flex-row gap-25">
						<button
							onClick={() => {
								if (confirm("Apakah Anda yakin ingin menggugurkan pemenang ini?")) {
									dumpWinner();
								}
							}}
							className="p-4 px-10 bg-red-700 text-white rounded-lg shadow-lg"
						>
							Gugur
						</button>
						<button
							onClick={saveWinner}
							className="p-4 px-10 bg-green-700 text-white rounded-lg shadow-lg"
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