import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureDisplayProps {
  points: Point[];
  size?: number;
  animate?: boolean;
}

const GestureDisplay = ({ points, size = 120, animate = true }: GestureDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Normalize points
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = size * 0.15;
    const drawSize = size - padding * 2;

    const normalized = points.map(p => ({
      x: ((p.x - minX) / rangeX) * drawSize + padding,
      y: ((p.y - minY) / rangeY) * drawSize + padding,
    }));

    if (animate) {
      let currentIndex = 0;
      const animationSpeed = Math.max(1, Math.floor(normalized.length / 60));

      const drawFrame = () => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
        ctx.fillRect(0, 0, size, size);

        if (currentIndex >= normalized.length) {
          currentIndex = 0;
        }

        const drawPoints = normalized.slice(0, currentIndex);
        if (drawPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
          
          for (let i = 1; i < drawPoints.length; i++) {
            ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
          }

          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 10;
          ctx.stroke();
        }

        currentIndex += animationSpeed;
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    } else {
      // Static draw
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.moveTo(normalized[0].x, normalized[0].y);
      
      for (let i = 1; i < normalized.length; i++) {
        ctx.lineTo(normalized[i].x, normalized[i].y);
      }

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  }, [points, size, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg bg-card/50 border border-glass-border"
      />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default GestureDisplay;
