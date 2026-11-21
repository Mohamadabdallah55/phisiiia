import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Trash2, Eraser, PenTool, Grid, Sun, Moon } from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhiteboardModal({ isOpen, onClose }: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [darkBoard, setDarkBoard] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [color, setColor] = useState('#0284c7');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  const drawBackground = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const bg = darkBoard ? '#0f172a' : '#ffffff';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (showAxes) {
        // Subtle graph grid
        ctx.strokeStyle = darkBoard ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        const step = 32;
        for (let x = 0; x <= canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Cartesian X/Y axes for vectors & graphs
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.strokeStyle = darkBoard ? 'rgba(148, 163, 184, 0.55)' : 'rgba(71, 85, 105, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, cy);
        ctx.lineTo(canvas.width - 20, cy);
        ctx.moveTo(cx, 20);
        ctx.lineTo(cx, canvas.height - 20);
        ctx.stroke();
      }
    },
    [darkBoard, showAxes]
  );

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 860;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawBackground(canvas, ctx);
      }
    }
  }, [isOpen, drawBackground]);

  if (!isOpen) return null;

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getCoords(e);

    ctx.strokeStyle = isEraser ? (darkBoard ? '#0f172a' : '#ffffff') : color;
    ctx.lineWidth = isEraser ? lineWidth * 5 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawBackground(canvas, ctx);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-label="السبورة التفاعلية لشرح الفيزياء"
      data-testid="whiteboard-modal"
    >
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <PenTool className="text-sky-600 w-4 h-4" />
            <span>السبورة التفاعلية لشرح الفيزياء ورسم المتجهات</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السبورة"
            className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            {['#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed', darkBoard ? '#ffffff' : '#0f172a'].map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`لون ${c}`}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c && !isEraser ? 'scale-125 border-slate-900' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              )
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAxes((s) => !s)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap ${
                showAxes
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              شبكة ومحاور (x-y)
            </button>

            <button
              type="button"
              onClick={() => setDarkBoard((d) => !d)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors whitespace-nowrap"
            >
              {darkBoard ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              {darkBoard ? 'سبورة بيضاء' : 'سبورة داكنة'}
            </button>

            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                !isEraser ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" /> قلم
            </button>

            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                isEraser ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" /> ممحاة
            </button>

            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors border border-rose-200 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" /> مسح الكل
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4 bg-slate-100 flex-1 flex justify-center">
          <canvas
            ref={canvasRef}
            data-testid="whiteboard-canvas"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className="w-full rounded-xl cursor-crosshair border border-slate-300 shadow-inner touch-none"
          />
        </div>
      </div>
    </div>
  );
}
