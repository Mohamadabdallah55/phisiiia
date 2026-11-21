import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { compute1DMotion, computeFreeFall } from '../../utils/physicsMath';

interface Motion1DLabProps {
  mode: 'air-track' | 'motion-1d' | 'motion-graphs' | 'free-fall';
  isPaused?: boolean;
}

export default function Motion1DLab({ mode, isPaused = false }: Motion1DLabProps) {
  const isFreeFall = mode === 'free-fall';
  const [vi, setVi] = useState(isFreeFall ? 0 : mode === 'air-track' ? 4 : 2);
  const [accel, setAccel] = useState(mode === 'air-track' ? 0 : 2);
  const [simTime, setSimTime] = useState(0);
  const [running, setRunning] = useState(false);

  const maxTime = isFreeFall ? 4 : 6;

  useEffect(() => {
    setVi(isFreeFall ? 0 : mode === 'air-track' ? 4 : 2);
    setAccel(mode === 'air-track' ? 0 : 2);
    setSimTime(0);
    setRunning(false);
  }, [mode, isFreeFall]);

  useEffect(() => {
    if (!running || isPaused) return;
    let last = performance.now();
    let rafId = 0;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setSimTime((prev) => {
        const next = prev + dt;
        if (next >= maxTime) {
          setRunning(false);
          return maxTime;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, isPaused, maxTime]);

  const current1D = compute1DMotion(vi, accel, simTime);
  const currentFall = computeFreeFall(vi, simTime);

  // Compute chart points for motion-graphs & motion-1d
  const sampleCount = 12;
  const maxDisp = Math.max(20, Math.abs(compute1DMotion(vi, accel, maxTime).dx), 10);
  const maxVel = Math.max(10, Math.abs(vi + accel * maxTime), Math.abs(vi));

  // Position of moving object on track (clamped visually)
  const trackFraction = isFreeFall
    ? Math.min(1, Math.max(0, Math.abs(currentFall.dy) / 80))
    : Math.min(1, Math.max(0, current1D.dx / Math.max(maxDisp, 25)));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {mode === 'air-track' && 'محاكاة المدرج الهوائي (سرعة ثابتة مقابل تسارع)'}
            {mode === 'motion-1d' && 'محاكاة الحركة في بعد واحد ومعادلات الحركة'}
            {mode === 'motion-graphs' && 'مختبر المنحنيات (الموقع-الزمن والسرعة-الزمن)'}
            {mode === 'free-fall' && 'محاكاة التصوير التتابعي للسقوط الحر (g = 9.8 m/s²)'}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPaused}
            onClick={() => {
              if (simTime >= maxTime) setSimTime(0);
              setRunning((r) => !r);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {running && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running && !isPaused ? 'إيقاف مؤقت' : 'تشغيل الحركة'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSimTime(0);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تصفير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Visual Stage */}
        <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3">
          {isFreeFall ? (
            <svg viewBox="0 0 300 220" className="w-full max-w-[300px] mx-auto h-auto" role="img" aria-label="السقوط الحر">
              {/* Height ruler */}
              <line x1="70" y1="20" x2="70" y2="200" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="50" y1="200" x2="250" y2="200" stroke="#475569" strokeWidth="2.5" />
              {/* Strobe ghosts matching Fig 8 (t = 0, 1, 2, 3s) */}
              {[0, 0.8, 1.6, 2.4, 3.2].map((tMark) => {
                if (tMark > simTime + 0.01) return null;
                const yOff = Math.min(172, (Math.abs(computeFreeFall(vi, tMark).dy) / 80) * 172);
                return (
                  <g key={tMark} opacity={0.45}>
                    <circle cx="150" cy={24 + yOff} r="10" fill="#0284c7" />
                    <text x="172" y={28 + yOff} fill="#475569" fontSize="10">
                      t={tMark.toFixed(1)}s
                    </text>
                  </g>
                );
              })}
              {/* Current falling ball */}
              <circle cx="150" cy={24 + trackFraction * 172} r="12" fill="#0369a1" stroke="#ffffff" strokeWidth="2" />
              {/* Gravity arrow */}
              <line x1="115" y1={24 + trackFraction * 172} x2="115" y2={52 + trackFraction * 172} stroke="#dc2626" strokeWidth="2.5" />
              <text x="108" y={42 + trackFraction * 172} fill="#dc2626" fontSize="10" fontWeight="bold" textAnchor="end">
                g
              </text>
            </svg>
          ) : mode === 'motion-graphs' ? (
            <svg viewBox="0 0 320 200" className="w-full h-auto" role="img" aria-label="منحنى السرعة والزمن">
              {/* Axes */}
              <line x1="40" y1="170" x2="300" y2="170" stroke="#64748b" strokeWidth="1.5" />
              <line x1="40" y1="20" x2="40" y2="170" stroke="#64748b" strokeWidth="1.5" />
              <text x="295" y="186" fill="#475569" fontSize="10" textAnchor="end">الزمن t (s)</text>
              <text x="45" y="24" fill="#0284c7" fontSize="10" fontWeight="bold">v (m/s)</text>
              {/* Shaded area under v-t curve up to simTime */}
              {(() => {
                const endX = 40 + (simTime / maxTime) * 240;
                const y0 = 170 - (Math.max(0, vi) / maxVel) * 130;
                const yNow = 170 - (Math.max(0, vi + accel * simTime) / maxVel) * 130;
                return (
                  <>
                    <polygon points={`40,170 40,${y0} ${endX},${yNow} ${endX},170`} fill="rgba(2, 132, 199, 0.16)" />
                    <polyline
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      points={Array.from({ length: sampleCount + 1 })
                        .map((_, idx) => {
                          const t = (idx / sampleCount) * maxTime;
                          const x = 40 + (t / maxTime) * 240;
                          const v = Math.max(0, vi + accel * t);
                          const y = 170 - (v / maxVel) * 130;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    <circle cx={endX} cy={yNow} r="5" fill="#4f46e5" />
                  </>
                );
              })()}
            </svg>
          ) : (
            <svg viewBox="0 0 320 150" className="w-full h-auto" role="img" aria-label="حركة العربة في بعد واحد">
              {/* Air track / road */}
              <rect x="20" y="96" width="280" height="12" rx="4" fill="#cbd5e1" />
              {/* Tick marks */}
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={30 + f * 260} y1="96" x2={30 + f * 260} y2="112" stroke="#64748b" strokeWidth="1.5" />
              ))}
              {/* Cart */}
              {(() => {
                const cartX = 30 + trackFraction * 230;
                return (
                  <g>
                    <rect x={cartX} y="66" width="44" height="26" rx="5" fill="#0284c7" />
                    <circle cx={cartX + 10} cy="94" r="5" fill="#1e293b" />
                    <circle cx={cartX + 34} cy="94" r="5" fill="#1e293b" />
                    <text x={cartX + 22} y="83" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {current1D.vf.toFixed(1)} m/s
                    </text>
                  </g>
                );
              })()}
            </svg>
          )}
        </div>

        {/* Sliders & Live Telemetry */}
        <div className="md:col-span-5 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="m1d-vi">{isFreeFall ? 'السرعة الابتدائية (v1)' : 'السرعة الابتدائية v1'}</label>
              <span className="tabular-nums text-sky-700">{vi} m/s</span>
            </div>
            <input
              id="m1d-vi"
              type="range"
              min={isFreeFall ? -5 : 0}
              max={16}
              step={1}
              disabled={isPaused}
              value={vi}
              onChange={(e) => setVi(Number(e.target.value))}
              className="w-full accent-sky-600 disabled:opacity-50"
            />
          </div>

          {!isFreeFall && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="m1d-accel">التسارع الثابت (a)</label>
                <span className="tabular-nums text-indigo-700">{accel} m/s²</span>
              </div>
              <input
                id="m1d-accel"
                type="range"
                min={-3}
                max={6}
                step={0.5}
                disabled={isPaused}
                value={accel}
                onChange={(e) => setAccel(Number(e.target.value))}
                className="w-full accent-indigo-600 disabled:opacity-50"
              />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="m1d-time">الزمن (t)</label>
              <span className="tabular-nums text-slate-900">{simTime.toFixed(2)} s</span>
            </div>
            <input
              id="m1d-time"
              type="range"
              min={0}
              max={maxTime}
              step={0.1}
              disabled={isPaused}
              value={simTime}
              onChange={(e) => {
                setRunning(false);
                setSimTime(Number(e.target.value));
              }}
              className="w-full accent-slate-700 disabled:opacity-50"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">السرعة اللحظية (v2):</span>
              <span className="font-bold tabular-nums text-sky-700">
                {(isFreeFall ? currentFall.vy : current1D.vf).toFixed(2)} m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{isFreeFall ? 'الإزاحة الرأسية (Δy):' : 'الإزاحة (Δx):'}</span>
              <span className="font-bold tabular-nums text-emerald-700">
                {(isFreeFall ? currentFall.dy : current1D.dx).toFixed(2)} m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
