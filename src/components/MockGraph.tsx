import React, { useEffect, useRef } from 'react';

interface MockGraphProps {
  data: Array<{ x: number; y: number }>;
  color?: string;
}

const MockGraph: React.FC<MockGraphProps> = ({ data, color = '#3b82f6' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '44');
    gradient.addColorStop(1, color + '00');

    // Fill area under curve
    ctx.beginPath();
    ctx.moveTo(0, height);
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.y / 100) * height;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        // Smooth curve using quadratic bezier
        const prevPoint = data[index - 1];
        const prevX = ((index - 1) / (data.length - 1)) * width;
        const prevY = height - (prevPoint.y / 100) * height;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.y / 100) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.y / 100) * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    // X axis
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    // Y axis
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
  }, [data, color]);

  if (!data.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={240}
      className="w-full h-64 rounded-lg border border-slate-800"
    />
  );
};

export default MockGraph;