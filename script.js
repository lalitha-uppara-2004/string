// Background animations with neon sparks
document.addEventListener('DOMContentLoaded', function() {
	initTheme();
	initBackgroundCanvas();
	initTypewriter();
	updateCurrentYear();
});

function initTheme() {
	const toggles = document.querySelectorAll('#theme-toggle, #theme-toggle-footer');
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
	const saved = localStorage.getItem('theme');
	const theme = saved || (prefersDark.matches ? 'dark' : 'light');
	document.documentElement.setAttribute('data-theme', theme);
	toggles.forEach(btn => {
		btn.addEventListener('click', () => {
			const current = document.documentElement.getAttribute('data-theme');
			const next = current === 'dark' ? 'light' : 'dark';
			document.documentElement.setAttribute('data-theme', next);
			localStorage.setItem('theme', next);
		});
	});
	prefersDark.addEventListener('change', e => {
		if (!localStorage.getItem('theme')) {
			document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
		}
	});
}

function updateCurrentYear() {
	const el = document.getElementById('current-year');
	if (el) el.textContent = new Date().getFullYear();
}

function initBackgroundCanvas() {
	const canvas = document.getElementById('background-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');

	let time = 0;
	let mouseX = 0, mouseY = 0, isMouseMoving = false, mouseTimer;
	let particles = [];
	let sparks = [];

	function dprScale() {
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = Math.floor(rect.width * dpr);
		canvas.height = Math.floor(rect.height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function colors() {
		const dark = document.documentElement.getAttribute('data-theme') === 'dark';
		return dark ? {
			g1: 'rgba(59,130,246,0.35)',
			g2: 'rgba(34,211,238,0.35)',
			g3: 'rgba(139,92,246,0.35)',
			g4: 'rgba(20,184,166,0.35)',
			neon: ['#22d3ee','#60a5fa','#a78bfa','#34d399','#f472b6','#f59e0b']
		} : {
			g1: 'rgba(59,130,246,0.30)',
			g2: 'rgba(34,211,238,0.30)',
			g3: 'rgba(139,92,246,0.30)',
			g4: 'rgba(20,184,166,0.30)',
			neon: ['#0ea5e9','#2563eb','#8b5cf6','#10b981','#ec4899','#f59e0b']
		};
	}

	class Particle {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.vx = (Math.random() - 0.5) * 0.6;
			this.vy = (Math.random() - 0.5) * 0.6;
			this.size = 2 + Math.random() * 3;
			this.life = 1;
			this.decay = 0.002 + Math.random() * 0.004;
			this.color = Math.floor(Math.random() * 3);
		}
		update() {
			this.x += this.vx;
			this.y += this.vy;
			this.life -= this.decay;
		}
		draw(ctx, c) {
			if (this.life <= 0) return;
			ctx.save();
			ctx.globalAlpha = 0.45 * this.life;
			ctx.fillStyle = [c.g1,c.g2,c.g3][this.color] || c.g4;
			ctx.shadowColor = ctx.fillStyle;
			ctx.shadowBlur = 12;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}

	class Spark {
		constructor(x, y, angle, speed, color) {
			this.x = x;
			this.y = y;
			this.vx = Math.cos(angle) * speed;
			this.vy = Math.sin(angle) * speed;
			this.life = 1;
			this.decay = 0.02 + Math.random() * 0.03;
			this.length = 8 + Math.random() * 18;
			this.width = 1 + Math.random() * 2;
			this.color = color;
			this.glow = 18 + Math.random() * 22;
		}
		update() {
			this.x += this.vx;
			this.y += this.vy;
			this.vx *= 0.99;
			this.vy = this.vy * 0.99 + 0.03;
			this.life -= this.decay;
		}
		draw(ctx) {
			if (this.life <= 0) return;
			const alpha = Math.max(this.life, 0);
			const nx = this.x - this.vx * this.length;
			const ny = this.y - this.vy * this.length;
			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.strokeStyle = this.color;
			ctx.lineWidth = this.width;
			ctx.lineCap = 'round';
			ctx.shadowColor = this.color;
			ctx.shadowBlur = this.glow * alpha;
			ctx.beginPath();
			ctx.moveTo(nx, ny);
			ctx.lineTo(this.x, this.y);
			ctx.stroke();
			ctx.restore();
		}
	}

	function spawnSparks(x, y, count) {
		const pal = colors().neon;
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 2 + Math.random() * 4;
			const color = pal[Math.floor(Math.random() * pal.length)];
			sparks.push(new Spark(x, y, angle, speed, color));
		}
		if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
	}

	function animate(t) {
		time = (t || 0) * 0.001;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const c = colors();

		// Animated soft radial gradient background
		const g = ctx.createRadialGradient(
			canvas.width / 2 + Math.sin(time * 0.3) * 100,
			canvas.height / 2 + Math.cos(time * 0.2) * 100,
			0,
			canvas.width / 2,
			canvas.height / 2,
			Math.max(canvas.width, canvas.height) / 1.5
		);
		g.addColorStop(0, c.g1);
		g.addColorStop(0.25, c.g2);
		g.addColorStop(0.5, c.g3);
		g.addColorStop(0.75, c.g4);
		g.addColorStop(1, 'transparent');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			// Ambient particles
			if (particles.length < 90 && Math.random() < 0.6) {
				const w = canvas.width / (window.devicePixelRatio || 1);
				const h = canvas.height / (window.devicePixelRatio || 1);
				particles.push(new Particle(Math.random() * w, Math.random() * h));
			}
			particles = particles.filter(p => p.life > 0);
			particles.forEach(p => { p.update(); p.draw(ctx, c); });

			// Ambient random spark bursts
			if (Math.random() < 0.02) {
				const w = canvas.width / (window.devicePixelRatio || 1);
				const h = canvas.height / (window.devicePixelRatio || 1);
				spawnSparks(Math.random() * w, Math.random() * h, 8 + Math.floor(Math.random() * 12));
			}
			sparks = sparks.filter(s => s.life > 0);
			sparks.forEach(s => { s.update(); s.draw(ctx); });
		}

		requestAnimationFrame(animate);
	}

	function onMouseMove(e) {
		const rect = canvas.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
		isMouseMoving = true;
		clearTimeout(mouseTimer);
		mouseTimer = setTimeout(() => { isMouseMoving = false; }, 150);
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && Math.random() < 0.2) {
			spawnSparks(mouseX, mouseY, 4);
		}
	}

	function onClick(e) {
		const rect = canvas.getBoundingClientRect();
		spawnSparks(e.clientX - rect.left, e.clientY - rect.top, 22);
	}

	window.addEventListener('resize', () => { dprScale(); });
	canvas.addEventListener('mousemove', onMouseMove);
	canvas.addEventListener('click', onClick);

	dprScale();
	requestAnimationFrame(animate);
}

function initTypewriter() {
	const el = document.getElementById('typewriter');
	if (!el) return;
	const words = ['VLSI', 'Antenna', 'Web'];
	let wi = 0;
	let ci = 0;
	let deleting = false;
	let delay = 120;

	function tick() {
		const word = words[wi];
		if (deleting) {
			ci--;
			el.textContent = word.substring(0, ci);
			delay = 60;
			if (ci === 0) {
				deleting = false;
				wi = (wi + 1) % words.length;
				delay = 400;
			}
		} else {
			ci++;
			el.textContent = word.substring(0, ci);
			delay = 120;
			if (ci === word.length) {
				delay = 1400;
				deleting = true;
			}
		}
		setTimeout(tick, delay);
	}

	setTimeout(tick, 500);
}

 
