import React, { useState } from 'react';
import { Scale, RotateCcw } from 'lucide-react';

interface SpringScalesLabProps {
  isPaused?: boolean;
}

export default function SpringScalesLab({ isPaused = false }: SpringScalesLabProps) {
  const [massGrams, setMassGrams] = useState(500);
  const [halfAngleDeg, setHalfAngleDeg] = useState(35);

  const weightN = (massGrams / 1000) * 9.8;
  const rad = (halfAngleDeg * Math.PI) / 180;
  // Two symmetric spring scales supporting weight W: 2 * T * cos(halfAngle) = W => T = W / (2 cos(halfAngle))
  const cosVal = Math.max(0.18, Math.cos(rad));
  const tensionEach = weightN / (2 * cosVal);
  const algebraicSum = tensionEach * 2;
  const isAt60 = Math.abs(halfAngleDeg - 60) <= 1;

  // Geometry for SVG diagram
  const centerX = 160;
  const anchorY = 120;
  const ropeLen = 84;
  const dx = Math.sin(rad) * ropeLen;
  const dy = Math.cos(rad) * ropeLen;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">محاكاة ميزانين نابضيين واتزان القوى</h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setMassGrams(500);
            setHalfAngleDeg(35);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Visual Stage */}
        <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center">
          <svg
            viewBox="0 0 320 220"
            className="w-full max-w-[320px] h-auto"
            role="img"
            aria-label="رسم تفاعلي لميزانين نابضيين يحملان ثقلاً متزناً"
          >
            {/* Grid lines */}
            <line x1="20" y1={anchorY} x2="300" y2={anchorY} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" />
            <line x1={centerX} y1="15" x2={centerX} y2="205" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" />

            {/* Left Scale Force Line */}
            <line
              x1={centerX}
              y1={anchorY}
              x2={centerX - dx}
              y2={anchorY - dy}
              stroke="#0284c7"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx={centerX - dx} cy={anchorY - dy} r="6" fill="#0284c7" />
            <text
              x={centerX - dx - 8}
              y={anchorY - dy - 10}
              fill="#0369a1"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              F1 = {tensionEach.toFixed(2)} N
            </text>

            {/* Right Scale Force Line */}
            <line
              x1={centerX}
              y1={anchorY}
              x2={centerX + dx}
              y2={anchorY - dy}
              stroke="#4f46e5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx={centerX + dx} cy={anchorY - dy} r="6" fill="#4f46e5" />
            <text
              x={centerX + dx + 8}
              y={anchorY - dy - 10}
              fill="#4338ca"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              F2 = {tensionEach.toFixed(2)} N
            </text>

            {/* Resultant Upward Arrow */}
            <line
              x1={centerX}
              y1={anchorY}
              x2={centerX}
              y2={anchorY - 58}
              stroke="#059669"
              strokeWidth="3"
              strokeDasharray="5 3"
            />
            <polygon points={`${centerX},${anchorY - 64} ${centerX - 5},${anchorY - 54} ${centerX + 5},${anchorY - 54}`} fill="#059669" />
            <text x={centerX} y={anchorY - 70} fill="#047857" fontSize="10" fontWeight="bold" textAnchor="middle">
              المحصلة للأعلى = {weightN.toFixed(2)} N
            </text>

            {/* Hanging Mass */}
            <line x1={centerX} y1={anchorY} x2={centerX} y2={anchorY + 38} stroke="#334155" strokeWidth="2.5" />
            <rect x={centerX - 22} y={anchorY + 38} width="44" height="32" rx="6" fill="#1e293b" />
            <text x={centerX} y={anchorY + 58} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {massGrams} g
            </text>
            <circle cx={centerX} cy={anchorY} r="5" fill="#0f172a" />
          </svg>

          <p className="text-xs text-slate-600 text-center mt-1">
            {isAt60
              ? 'عند زاوية 120° بين الميزانين (60° لكل طرف)، تصبح قراءة كل ميزان مساوية لوزن الثقل نفسه!'
              : halfAngleDeg === 0
                ? 'في الوضع العمودي (زاوية 0°): يتقاسم الميزانان الوزن بالتساوي تماماً.'
                : 'كلما زادت زاوية الفتح، احتاج الميزانان إلى قوة شد أكبر لمعادلة الوزن نفسه.'}
          </p>
        </div>

        {/* Controls & Live Readouts */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="spring-mass">كتلة الثقل المعلق</label>
              <span className="tabular-nums text-sky-700">{massGrams} g ({weightN.toFixed(2)} N)</span>
            </div>
            <input
              id="spring-mass"
              type="range"
              min={100}
              max={1000}
              step={50}
              disabled={isPaused}
              value={massGrams}
              onChange={(e) => setMassGrams(Number(e.target.value))}
              className="w-full accent-sky-600 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="spring-angle">الزاوية بين الميزانين (2θ)</label>
              <span className="tabular-nums text-indigo-700">{halfAngleDeg * 2}°</span>
            </div>
            <input
              id="spring-angle"
              type="range"
              min={0}
              max={75}
              step={1}
              disabled={isPaused}
              value={halfAngleDeg}
              onChange={(e) => setHalfAngleDeg(Number(e.target.value))}
              className="w-full accent-indigo-600 disabled:opacity-50"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">قراءة كل ميزان (F1 = F2):</span>
              <span className="font-bold tabular-nums text-sky-700">{tensionEach.toFixed(2)} N</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">الجمع الجبري (F1 + F2):</span>
              <span className="font-bold tabular-nums text-amber-700">{algebraicSum.toFixed(2)} N</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-800 font-semibold">المحصلة المتجهة الفعلية:</span>
              <span className="font-bold tabular-nums text-emerald-700">{weightN.toFixed(2)} N للأعلى</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
