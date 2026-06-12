import { useEffect, useRef } from 'react';

// SVG paths encoded as mini drawers
const ICONS = [
  // Book shape
  (ctx, x, y, size, alpha, color) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.translate(x, y);
    const s = size;
    // book body
    ctx.beginPath();
    ctx.roundRect(-s * 0.7, -s, s * 1.4, s * 2, 3);
    ctx.fillStyle = color + '33';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // spine
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s);
    ctx.lineTo(-s * 0.7, s);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    // lines (pages)
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.5 + i * s * 0.4);
      ctx.lineTo(s * 0.5, -s * 0.5 + i * s * 0.4);
      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  },
  // Graduation cap
  (ctx, x, y, size, alpha, color) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.translate(x, y);
    const s = size;
    // board
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 1.1, -s * 0.3);
    ctx.lineTo(0, s * 0.4);
    ctx.lineTo(-s * 1.1, -s * 0.3);
    ctx.closePath();
    ctx.fillStyle = color + '44';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // tassel
    ctx.beginPath();
    ctx.moveTo(s * 1.1, -s * 0.3);
    ctx.lineTo(s * 1.1, s * 0.6);
    ctx.strokeStyle = color + 'aa';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },
  // Star / sparkle
  (ctx, x, y, size, alpha, color) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.translate(x, y);
    const s = size;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? s : s * 0.4;
      i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
              : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fillStyle = color + '55';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },
  // Pencil
  (ctx, x, y, size, alpha, color) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    const s = size;
    ctx.beginPath();
    ctx.rect(-s * 0.25, -s * 1.2, s * 0.5, s * 1.8);
    ctx.fillStyle = color + '44';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    // tip
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, s * 0.6);
    ctx.lineTo(0, s * 1.1);
    ctx.lineTo(s * 0.25, s * 0.6);
    ctx.fillStyle = color + 'aa';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
];

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, down: false });
  const clickRef = useRef(null); // {x, y, t}

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track mouse at window level — doesn't block any page content
    const onMouseMove = (e) => { mouseRef.current = { ...mouseRef.current, x: e.clientX, y: e.clientY }; };
    const onMouseDown = (e) => { mouseRef.current.down = true; clickRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }; };
    const onMouseUp   = () => { mouseRef.current.down = false; };
    const onTouch     = (e) => { const t = e.touches[0]; mouseRef.current = { x: t.clientX, y: t.clientY, down: true }; clickRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }; };
    const onTouchEnd  = () => { mouseRef.current.down = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchend',   onTouchEnd);

    const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

    // Darker, more saturated colors for light theme — visible on white
    const DARK_COLORS  = ['#b44fff', '#00f5ff', '#ff2d78', '#ffe600', '#39ff14'];
    const LIGHT_COLORS = ['#7b1fff', '#0077aa', '#cc0033', '#aa7700', '#006600'];

    const getColors = () => isDark() ? DARK_COLORS : LIGHT_COLORS;
    // Light theme: bigger alpha so particles are visible on white background
    const getAlpha  = () => isDark() ? 0.35 : 0.55;
    const getLineAlpha = (frac) => isDark() ? 0.18 * frac : 0.25 * frac;

    // Regular dot particles
    const dots = Array.from({ length: 70 }, () => {
      const colors = getColors();
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        baseVx: (Math.random() - 0.5) * 0.7,
        baseVy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2.5 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.15,
        // bounce state
        bouncing: 0,   // countdown frames of bounce
        bvx: 0, bvy: 0,
      };
    });

    // Icon particles (book, cap, star, pencil)
    const icons = Array.from({ length: 12 }, (_, i) => {
      const colors = getColors();
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 10 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.3 + 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        iconIdx: i % ICONS.length,
        bouncing: 0,
        bvx: 0, bvy: 0,
        pulseT: Math.random() * Math.PI * 2,
      };
    });

    // Student figure particle (small walking figure)
    const figures = Array.from({ length: 4 }, () => {
      const colors = getColors();
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.4 + 0.2),
        vy: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.25,
        size: Math.random() * 8 + 12,
        walkT: Math.random() * Math.PI * 2,
        bouncing: 0, bvx: 0, bvy: 0,
      };
    });

    const drawStudentFigure = (ctx, x, y, size, alpha, color, walkT) => {
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.translate(x, y);
      const s = size;
      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 1.3, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = color + '88';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Body
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.95);
      ctx.lineTo(0, s * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Arms
      const armAngle = Math.sin(walkT) * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(Math.cos(armAngle) * s * 0.6, -s * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(-Math.cos(armAngle) * s * 0.6, -s * 0.3);
      ctx.stroke();
      // Legs
      const legAngle = Math.sin(walkT) * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.1);
      ctx.lineTo(Math.cos(legAngle) * s * 0.5, s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.1);
      ctx.lineTo(-Math.cos(legAngle) * s * 0.5, s * 0.8);
      ctx.stroke();
      ctx.restore();
    };

    const MOUSE_RADIUS = 120;
    const BOUNCE_RADIUS = 80;
    const CLICK_RADIUS = 140;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const clicked = clickRef.current;
      const alpha0 = getAlpha();
      const colors = getColors();

      // Handle click burst — apply to nearby particles once
      if (clicked && Date.now() - clicked.t < 80) {
        [...dots, ...icons, ...figures].forEach(p => {
          const dx = p.x - clicked.x;
          const dy = p.y - clicked.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CLICK_RADIUS && dist > 0) {
            const force = (CLICK_RADIUS - dist) / CLICK_RADIUS;
            p.bouncing = 45;
            p.bvx = (dx / dist) * force * 8;
            p.bvy = (dy / dist) * force * 8;
          }
        });
        clickRef.current = null;
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const frac = (1 - dist / 110);
            const lineColor = isDark() ? `rgba(180,79,255,${(0.18 * frac).toFixed(3)})` : `rgba(100,40,180,${(0.28 * frac).toFixed(3)})`;
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = isDark() ? 0.5 : 0.7;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & draw dots
      dots.forEach(p => {
        // Mouse repel
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 1.5;
          p.vy += (dy / dist) * force * 1.5;
        }

        // Bounce from click
        if (p.bouncing > 0) {
          p.vx += p.bvx * 0.1;
          p.vy += p.bvy * 0.1;
          p.bvx *= 0.88;
          p.bvy *= 0.88;
          p.bouncing--;
        }

        // Dampen back toward base velocity
        p.vx += (p.baseVx - p.vx) * 0.03;
        p.vy += (p.baseVy - p.vy) * 0.03;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 6) { p.vx = (p.vx / speed) * 6; p.vy = (p.vy / speed) * 6; }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); p.baseVx = Math.abs(p.baseVx); }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx); p.baseVx = -Math.abs(p.baseVx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); p.baseVy = Math.abs(p.baseVy); }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy = -Math.abs(p.vy); p.baseVy = -Math.abs(p.baseVy); }

        // Update color on theme change
        p.color = colors[Math.floor(Math.abs(p.x / 100) % colors.length)];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (p.bouncing > 0 ? 1.5 : 0), 0, Math.PI * 2);
        // Clamp alpha to [0,1] before converting to hex
        const dotAlpha = Math.min(1, p.alpha * alpha0 / 0.35);
        ctx.fillStyle = p.color + Math.floor(dotAlpha * 255).toString(16).padStart(2, '0');
        ctx.shadowBlur = p.bouncing > 0 ? 18 : (isDark() ? 8 : 4);
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update & draw icons
      icons.forEach(ic => {
        const dx = ic.x - mx, dy = ic.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS * 1.3 && dist > 0) {
          const force = (MOUSE_RADIUS * 1.3 - dist) / (MOUSE_RADIUS * 1.3);
          ic.vx += (dx / dist) * force * 1.2;
          ic.vy += (dy / dist) * force * 1.2;
        }

        if (ic.bouncing > 0) {
          ic.vx += ic.bvx * 0.08;
          ic.vy += ic.bvy * 0.08;
          ic.bvx *= 0.9; ic.bvy *= 0.9;
          ic.bouncing--;
        }

        ic.vx *= 0.97; ic.vy *= 0.97;
        ic.x += ic.vx; ic.y += ic.vy;
        if (ic.x < -50) ic.x = canvas.width + 50;
        if (ic.x > canvas.width + 50) ic.x = -50;
        if (ic.y < -50) ic.y = canvas.height + 50;
        if (ic.y > canvas.height + 50) ic.y = -50;
        ic.rotation += ic.rotSpeed;
        ic.pulseT += 0.02;

        const scaledSize = ic.size * (1 + Math.sin(ic.pulseT) * 0.08);
        const drawAlpha = ic.alpha * (isDark() ? 1 : 1.8);  // much more visible in light

        ctx.save();
        ctx.translate(ic.x, ic.y);
        ctx.rotate(ic.rotation);
        ICONS[ic.iconIdx](ctx, 0, 0, scaledSize, drawAlpha, ic.color);
        ctx.restore();
      });

      // Update & draw student figures
      figures.forEach(fig => {
        const dx = fig.x - mx, dy = fig.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          fig.vx += (dx / dist) * force * 2;
          fig.vy += (dy / dist) * force * 2;
        }

        if (fig.bouncing > 0) {
          fig.vx += fig.bvx * 0.1;
          fig.vy += fig.bvy * 0.1;
          fig.bvx *= 0.88; fig.bvy *= 0.88;
          fig.bouncing--;
        }

        fig.vx *= 0.98;
        fig.vy *= 0.98;
        fig.x += fig.vx;
        fig.y += fig.vy;
        fig.walkT += 0.06;

        if (fig.x < -30) fig.x = canvas.width + 30;
        if (fig.x > canvas.width + 30) fig.x = -30;
        if (fig.y < 20) { fig.y = 20; fig.vy *= -1; }
        if (fig.y > canvas.height - 20) { fig.y = canvas.height - 20; fig.vy *= -1; }

        drawStudentFigure(ctx, fig.x, fig.y, fig.size, isDark() ? 0.25 : 0.45, fig.color, fig.walkT);
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
