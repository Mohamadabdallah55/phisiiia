import React, { useState } from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import {
  resolveVector,
  addVectors,
  computeDotProduct,
  computeCrossProductMagnitude,
} from '../../utils/physicsMath';

interface VectorLabProps {
  mode: 'vectors-basics' | 'vector-products' | 'vector-addition' | 'vector-resolution';
  isPaused?: boolean;
}

export default function VectorLab({ mode, isPaused = false }: VectorLabProps) {
  const [magA, setMagA] = useState(mode === 'vector-resolution' ? 100 : 50);
  const [angA, setAngA] = useState(mode === 'vector-resolution' ? 30 : 37);
  const [magB, setMagB] = useState(40);
  const [angB, setAngB] = useState(mode === 'vector-products' ? 90 : 143);
  const [isSubtract, setIsSubtract] = useState(false);

  const compA = resolveVector(magA, angA);
  const effectiveAngB = isSubtract ? (angB + 180) % 360 : angB;
  const compB = resolveVector(magB, effectiveAngB);
  const sum = addVectors([
    { magnitude: magA, angleDeg: angA },
    { magnitude: magB, angleDeg: effectiveAngB },
  ]);

  let diffAngle = Math.abs(angA - angB) % 360;
  if (diffAngle > 180) diffAngle = 360 - diffAngle;
  const dotVal = computeDotProduct(magA, magB, diffAngle);
  const crossVal = computeCrossProductMagnitude(magA, magB, diffAngle);

  // SVG Coordinate Helper (center 160, 120; y-up positive)
  const cx = 160;
  const cy = 120;
  const maxVal = mode === 'vectors-basics' || mode === 'vector-resolution'
    ? Math.max(magA, 100)
    : Math.max(magA + magB, sum.magnitude, 100);
  const pxScale = 88 / maxVal;

  const axPx = cx + compA.ax * pxScale;
  const ayPx = cy - compA.ay * pxScale;
  const bxPx = cx + compB.ax * pxScale;
  const byPx = cy - compB.ay * pxScale;
  const tipToTailBxPx = axPx + compB.ax * pxScale;
  const tipToTailByPx = ayPx - compB.ay * pxScale;

  const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 3) return null;
    const ux = dx / len;
    const uy = dy / len;
    const headLen = 8;
    const p1x = x2 - headLen * ux + 4 * uy;
    const p1y = y2 - headLen * uy - 4 * ux;
    const p2x = x2 - headLen * ux - 4 * uy;
    const p2y = y2 - headLen * uy + 4 * ux;
    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={dashed ? 2 : 3}
          strokeDasharray={dashed ? '5 4' : undefined}
          strokeLinecap="round"
        />
        <polygon points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`} fill={color} />
      </g>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {mode === 'vectors-basics' && 'مختبر تمثيل المتجه بيانياً'}
            {mode === 'vector-resolution' && 'مختبر تحليل المتجه إلى مركبتيه (Ax, Ay)'}
            {mode === 'vector-products' && 'مختبر الضرب القياسي والمتجهي'}
            {mode === 'vector-addition' && 'مختبر جمع وطرح المتجهات'}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setMagA(mode === 'vector-resolution' ? 100 : 50);
            setAngA(mode === 'vector-resolution' ? 30 : 37);
            setMagB(40);
            setAngB(mode === 'vector-products' ? 90 : 143);
            setIsSubtract(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Coordinate Plane SVG */}
        <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center">
          <svg viewBox="0 0 320 240" className="w-full max-w-[320px] h-auto" role="img" aria-label="المستوى الإحداثي للمتجهات">
            {/* Axis lines */}
            <line x1="16" y1={cy} x2="304" y2={cy} stroke="#94a3b8" strokeWidth="1.2" />
            <line x1={cx} y1="16" x2={cx} y2="224" stroke="#94a3b8" strokeWidth="1.2" />
            <text x="296" y={cy - 6} fill="#64748b" fontSize="10" fontWeight="bold">+x</text>
            <text x="18" y={cy - 6} fill="#64748b" fontSize="10" fontWeight="bold">-x</text>
            <text x={cx + 6} y="24" fill="#64748b" fontSize="10" fontWeight="bold">+y</text>
            <text x={cx + 6} y="220" fill="#64748b" fontSize="10" fontWeight="bold">-y</text>

            {/* Mode-specific projections */}
            {mode === 'vector-resolution' && (
              <>
                <line x1={axPx} y1={cy} x2={axPx} y2={ayPx} stroke="#94a3b8" strokeDasharray="3 3" />
                <line x1={cx} y1={ayPx} x2={axPx} y2={ayPx} stroke="#94a3b8" strokeDasharray="3 3" />
                {drawArrow(cx, cy, axPx, cy, '#059669')}
                {drawArrow(cx, cy, cx, ayPx, '#d97706')}
              </>
            )}

            {/* Vector A */}
            {drawArrow(cx, cy, axPx, ayPx, '#0284c7')}

            {/* Vector B & Resultant for addition / products */}
            {mode === 'vector-products' && drawArrow(cx, cy, bxPx, byPx, '#4f46e5')}

            {mode === 'vector-addition' && (
              <>
                {drawArrow(axPx, ayPx, tipToTailBxPx, tipToTailByPx, '#4f46e5', true)}
                {drawArrow(cx, cy, tipToTailBxPx, tipToTailByPx, '#059669')}
              </>
            )}

            <circle cx={cx} cy={cy} r="3" fill="#0f172a" />
          </svg>

          <div className="flex flex-wrap justify-center gap-3 text-[11px] font-medium mt-1">
            <span className="text-sky-700">● المتجه A</span>
            {mode === 'vector-resolution' && (
              <>
                <span className="text-emerald-700">● Ax</span>
                <span className="text-amber-700">● Ay</span>
              </>
            )}
            {(mode === 'vector-products' || mode === 'vector-addition') && (
              <span className="text-indigo-700">● {isSubtract ? '-B' : 'المتجه B'}</span>
            )}
            {mode === 'vector-addition' && <span className="text-emerald-700">● المحصلة R</span>}
          </div>
        </div>

        {/* Sliders & Calculated Readouts */}
        <div className="md:col-span-5 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="vec-mag-a">مقدار A</label>
              <span className="tabular-nums text-sky-700">{magA}</span>
            </div>
            <input
              id="vec-mag-a"
              type="range"
              min={10}
              max={120}
              disabled={isPaused}
              value={magA}
              onChange={(e) => setMagA(Number(e.target.value))}
              className="w-full accent-sky-600 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="vec-ang-a">زاوية A (مع +x)</label>
              <span className="tabular-nums text-sky-700">{angA}°</span>
            </div>
            <input
              id="vec-ang-a"
              type="range"
              min={0}
              max={360}
              disabled={isPaused}
              value={angA}
              onChange={(e) => setAngA(Number(e.target.value))}
              className="w-full accent-sky-600 disabled:opacity-50"
            />
          </div>

          {(mode === 'vector-products' || mode === 'vector-addition') && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="vec-mag-b">مقدار B</label>
                  <span className="tabular-nums text-indigo-700">{magB}</span>
                </div>
                <input
                  id="vec-mag-b"
                  type="range"
                  min={10}
                  max={120}
                  disabled={isPaused}
                  value={magB}
                  onChange={(e) => setMagB(Number(e.target.value))}
                  className="w-full accent-indigo-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="vec-ang-b">زاوية B (مع +x)</label>
                  <span className="tabular-nums text-indigo-700">{angB}°</span>
                </div>
                <input
                  id="vec-ang-b"
                  type="range"
                  min={0}
                  max={360}
                  disabled={isPaused}
                  value={angB}
                  onChange={(e) => setAngB(Number(e.target.value))}
                  className="w-full accent-indigo-600 disabled:opacity-50"
                />
              </div>
            </>
          )}

          {mode === 'vector-addition' && (
            <button
              type="button"
              disabled={isPaused}
              onClick={() => setIsSubtract((prev) => !prev)}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
                isSubtract
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isSubtract ? 'العملية الحالية: طرح (A - B)' : 'العملية الحالية: جمع (A + B) — اضغط للعكس'}
            </button>
          )}

          {/* Readout panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            {(mode === 'vectors-basics' || mode === 'vector-resolution') && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">المركبة الأفقية Ax:</span>
                  <span className="font-bold tabular-nums text-emerald-700">{compA.ax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">المركبة الرأسية Ay:</span>
                  <span className="font-bold tabular-nums text-amber-700">{compA.ay.toFixed(2)}</span>
                </div>
              </>
            )}

            {mode === 'vector-products' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">الزاوية الصغرى θ:</span>
                  <span className="font-bold tabular-nums text-slate-900">{diffAngle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">الضرب القياسي (A · B):</span>
                  <span className="font-bold tabular-nums text-sky-700">{dotVal.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">مقدار المتجهي |A × B|:</span>
                  <span className="font-bold tabular-nums text-indigo-700">{crossVal.toFixed(1)}</span>
                </div>
              </>
            )}

            {mode === 'vector-addition' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">مقدار المحصلة R:</span>
                  <span className="font-bold tabular-nums text-emerald-700">{sum.magnitude.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">اتجاه المحصلة θ:</span>
                  <span className="font-bold tabular-nums text-emerald-700">{sum.angleDeg.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-1">
                  <span>Rx = {sum.rx.toFixed(1)}</span>
                  <span>Ry = {sum.ry.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
