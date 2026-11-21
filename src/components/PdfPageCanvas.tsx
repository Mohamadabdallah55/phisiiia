import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  FlaskConical,
  Calculator,
  BookOpenCheck,
  HelpCircle,
  ClipboardCheck,
  EyeOff,
} from 'lucide-react';
import type { HotspotCategory, InteractiveHotspot } from '../types';

interface PdfPageCanvasProps {
  pageNumber: number;
  zoom: number;
  compactTwoUp?: boolean;
  hotspots: InteractiveHotspot[];
  selectedHotspotId: string | null;
  focusedHotspotId: string | null;
  teacherHideAnswers: boolean;
  penMode: boolean;
  penColor: string;
  clearInkSignal: number;
  onSelectHotspot: (hotspot: InteractiveHotspot) => void;
}

const categoryMeta: Record<
  HotspotCategory,
  { label: string; border: string; badge: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  figure: {
    label: 'رسم تفاعلي',
    border: 'border-sky-500/80 bg-sky-500/5 hover:bg-sky-500/15',
    badge: 'bg-sky-600 text-white',
    Icon: Sparkles,
  },
  experiment: {
    label: 'تجربة عملية',
    border: 'border-emerald-500/80 bg-emerald-500/5 hover:bg-emerald-500/15',
    badge: 'bg-emerald-600 text-white',
    Icon: FlaskConical,
  },
  example: {
    label: 'مثال محلول',
    border: 'border-indigo-500/80 bg-indigo-500/5 hover:bg-indigo-500/15',
    badge: 'bg-indigo-600 text-white',
    Icon: Calculator,
  },
  formula: {
    label: 'قانون فيزيائي',
    border: 'border-amber-500/80 bg-amber-500/5 hover:bg-amber-500/15',
    badge: 'bg-amber-600 text-white',
    Icon: BookOpenCheck,
  },
  question: {
    label: 'سؤال وتمرين',
    border: 'border-rose-500/80 bg-rose-500/5 hover:bg-rose-500/15',
    badge: 'bg-rose-600 text-white',
    Icon: HelpCircle,
  },
  review: {
    label: 'مراجعة واختبار',
    border: 'border-violet-500/80 bg-violet-500/5 hover:bg-violet-500/15',
    badge: 'bg-violet-600 text-white',
    Icon: ClipboardCheck,
  },
};

export default function PdfPageCanvas({
  pageNumber,
  zoom,
  compactTwoUp = false,
  hotspots,
  selectedHotspotId,
  focusedHotspotId,
  teacherHideAnswers,
  penMode,
  penColor,
  clearInkSignal,
  onSelectHotspot,
}: PdfPageCanvasProps) {
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 1152,
    height: 1584,
  });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const pageSrc = `/book-pages/page-${String(pageNumber).padStart(2, '0')}.png`;
  const displayWidth = Math.round(560 * zoom);

  useEffect(() => {
    setLoaded(false);
    setLoadError(false);
  }, [pageNumber]);

  // Size annotation canvas once when page changes
  useEffect(() => {
    const inkCanvas = inkCanvasRef.current;
    if (!inkCanvas) return;
    inkCanvas.width = naturalSize.width;
    inkCanvas.height = naturalSize.height;
  }, [pageNumber, naturalSize.width, naturalSize.height]);

  // Clear on-page ink strokes when clearInkSignal increments
  useEffect(() => {
    const inkCanvas = inkCanvasRef.current;
    if (!inkCanvas) return;
    const ctx = inkCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    }
  }, [clearInkSignal]);

  const getPointerCoords = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penMode) return;
    const canvas = inkCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPointerCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penMode || !isDrawing) return;
    const ctx = inkCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <div
      className="relative bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden select-none shrink"
      style={{
        width: '100%',
        maxWidth: compactTwoUp ? `min(48%, ${displayWidth}px)` : `${displayWidth}px`,
        aspectRatio: `${naturalSize.width} / ${naturalSize.height}`,
      }}
      data-testid={`book-page-${pageNumber}`}
    >
      {/* Pre-rendered Ghostscript Crisp Textbook Page */}
      <img
        src={pageSrc}
        alt={`صفحة ${pageNumber} من كتاب الفيزياء للصف العاشر`}
        data-testid={`pdf-page-img-${pageNumber}`}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          }
          setLoaded(true);
          setLoadError(false);
        }}
        onError={() => {
          setLoaded(true);
          setLoadError(true);
        }}
        className="block w-full h-full object-contain bg-white"
      />

      {/* Loading / Error State */}
      {!loaded && !loadError && (
        <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2 text-slate-600 text-xs font-medium pointer-events-none">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span>جاري عرض الصفحة {pageNumber}...</span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-rose-50 flex items-center justify-center p-4 text-rose-700 text-sm font-semibold">
          تعذر تحميل صفحة الكتاب {pageNumber}.
        </div>
      )}

      {/* Interactive Hotspot Overlays (disabled pointer events while pen drawing) */}
      <div
        className={`absolute inset-0 ${penMode ? 'pointer-events-none opacity-45' : 'pointer-events-auto'}`}
      >
        {hotspots.map((hotspot) => {
          const meta = categoryMeta[hotspot.category];
          const Icon = meta.Icon;
          const isSelected = selectedHotspotId === hotspot.id;
          const isFocused = focusedHotspotId === hotspot.id;
          const maskAnswer =
            teacherHideAnswers &&
            (hotspot.category === 'example' ||
              hotspot.category === 'question' ||
              hotspot.category === 'review');

          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => onSelectHotspot(hotspot)}
              aria-label={hotspot.title}
              data-testid={`hotspot-${hotspot.id}`}
              style={{
                left: `${hotspot.box.x}%`,
                top: `${hotspot.box.y}%`,
                width: `${hotspot.box.w}%`,
                height: `${hotspot.box.h}%`,
              }}
              className={`group absolute rounded-lg border-2 transition-all text-right focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                isSelected || isFocused
                  ? 'border-sky-600 bg-sky-500/15 ring-2 ring-sky-500/40 z-20'
                  : `${meta.border} hotspot-ring z-10`
              }`}
            >
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md shadow-sm transition-transform group-hover:scale-105 ${meta.badge} -translate-y-2.5 translate-x-1`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{meta.label}</span>
              </span>

              {maskAnswer && (
                <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-slate-900/85 text-white text-[11px] font-semibold backdrop-blur-xs">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>الحل مخفي (وضع المعلم) — اضغط للشرح</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* On-page Annotation Canvas */}
      <canvas
        ref={inkCanvasRef}
        data-testid={`annotation-canvas-${pageNumber}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 w-full h-full touch-none ${
          penMode ? 'pointer-events-auto cursor-crosshair z-30' : 'pointer-events-none z-20'
        }`}
      />

      {/* Page Number Footer Tag */}
      <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[11px] font-bold tabular-nums pointer-events-none z-30">
        ص {pageNumber}
      </div>
    </div>
  );
}
