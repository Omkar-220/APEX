import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const BLOBS: Omit<Blob, 'x' | 'y' | 'vx' | 'vy'>[] = [
  { size: 600, color: '27,154,170',  opacity: 0.35 }, // teal
  { size: 500, color: '232,185,96',  opacity: 0.35 }, // gold
  { size: 450, color: '15,76,117',   opacity: 0.25 }, // navy
  { size: 400, color: '224,122,95',  opacity: 0.2  }, // coral
];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef  = useRef<Blob[]>([]);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialise blobs at random positions with random velocities
    blobsRef.current = BLOBS.map((b) => ({
      ...b,
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Base background
      ctx.fillStyle = '#F4F7F6';
      ctx.fillRect(0, 0, w, h);

      // Draw each blob
      for (const blob of blobsRef.current) {
        const grad = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.size / 2
        );
        grad.addColorStop(0,   `rgba(${blob.color},${blob.opacity})`);
        grad.addColorStop(0.5, `rgba(${blob.color},${blob.opacity * 0.5})`);
        grad.addColorStop(1,   `rgba(${blob.color},0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Move
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges with a soft margin
        const margin = blob.size / 4;
        if (blob.x < -margin)    { blob.x = -margin;    blob.vx *= -1; }
        if (blob.x > w + margin) { blob.x = w + margin; blob.vx *= -1; }
        if (blob.y < -margin)    { blob.y = -margin;    blob.vy *= -1; }
        if (blob.y > h + margin) { blob.y = h + margin; blob.vy *= -1; }
      }

      // Dot grid overlay
      ctx.fillStyle = 'rgba(15,76,117,0.055)';
      const spacing = 24;
      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
