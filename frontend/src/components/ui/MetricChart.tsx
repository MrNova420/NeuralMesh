import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface MetricChartProps {
  title: string;
  data: number[];
  color?: string;
  height?: number;
}

export function MetricChart({ title, data, color = '#58a6ff', height = 100 }: MetricChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (data.length < 2) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const padding = 10;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const xStep = chartWidth / (data.length - 1);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw dots
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, color, height]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="neural-card"
    >
      <h4 className="text-sm font-medium text-neutral-text-secondary mb-3">{title}</h4>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="w-full"
      />
    </motion.div>
  );
}
