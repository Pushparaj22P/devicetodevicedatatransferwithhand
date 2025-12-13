import { useEffect, useRef } from 'react';
import { GestureTemplate } from '@/lib/gestureTemplates';

interface GestureGuideOverlayProps {
  template: GestureTemplate | null;
  size: { width: number; height: number };
  opacity?: number;
}

const GestureGuideOverlay = ({ template, size, opacity = 0.3 }: GestureGuideOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size.width;
    canvas.height = size.height;

    const padding = 60;
    const drawWidth = size.width - padding * 2;
    const drawHeight = size.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, size.width, size.height);

    // Draw guide path
    if (template.points.length > 1) {
      ctx.beginPath();
      
      const startX = template.points[0].x * drawWidth + padding;
      const startY = template.points[0].y * drawHeight + padding;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < template.points.length; i++) {
        const x = template.points[i].x * drawWidth + padding;
        const y = template.points[i].y * drawHeight + padding;
        ctx.lineTo(x, y);
      }

      // Dashed line style
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw start point
      ctx.beginPath();
      ctx.arc(startX, startY, 12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${opacity + 0.2})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(0, 255, 255, ${opacity + 0.4})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Draw "START" label
      ctx.fillStyle = `rgba(0, 255, 255, ${opacity + 0.3})`;
      ctx.font = '12px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('START', startX, startY - 20);

      // Draw direction arrows
      for (let i = 0; i < template.points.length - 1; i += Math.ceil(template.points.length / 4)) {
        const current = template.points[i];
        const next = template.points[Math.min(i + 1, template.points.length - 1)];
        
        const x1 = current.x * drawWidth + padding;
        const y1 = current.y * drawHeight + padding;
        const x2 = next.x * drawWidth + padding;
        const y2 = next.y * drawHeight + padding;
        
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // Draw arrow head
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - 8 * Math.cos(angle - Math.PI / 6),
          midY - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - 8 * Math.cos(angle + Math.PI / 6),
          midY - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity + 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [template, size, opacity]);

  if (!template) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};

export default GestureGuideOverlay;
