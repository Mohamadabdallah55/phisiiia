import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Target } from 'lucide-react';
import {
  computeProjectile,
  computeProjectilePointAt,
  computeCircularMotion,
} from '../../utils/physicsMath';

interface Motion2DLabProps {
  mode: 'projectile-angled' | 'projectile-horizontal' | 'circular-motion';
  isPaused?: boolean;
}

export default function Motion2DLab({ mode, isPaused = false }: Motion2DLabProps) {
  // Angled / horizontal projectile states
  const [v0, setV0] = useState(mode === 'projectile-horizontal' ? 12 : 22.5);
  const [angleDeg, setAngleDeg] = useState(mode === 'projectile-horizontal' ? 0 : 53);
  const [heightH, setHeightH] = useState(mode === 'projectile-horizontal' ? 44.1 : 0);

  // Circular motion states
  const [radius, setRadius] = useState(2.0);
  const [period, setPeriod] = useState(4.0);

  const [simTime, setSimTime] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setV0(mode === 'projectile-horizontal' ? 12 : 22.5);
    setAngleDeg(mode === 'projectile-horizontal' ? 0 : 53);
    setHeightH(mode === 'projectile-horizontal' ? 44.1 : 0);
    setSimTime(0);
    setRunning(false);
  }, [mode]);

  const g = 9.8;
  const angledMetrics = computeProjectile(v0, angleDeg, g);
  const horizFlightTime = Math.sqrt((2 * Math.max(0.5, heightH)) / g);
  const horizRange = v0 * horizFlightTime;
  const maxFlight =
    mode === 'circular-motion'
      ? period * 2
      : mode === 'projectile-horizontal'
        ? horizFlightTime
        : Math.max(0.2, angledMetrics.timeOfFlight);

  useEffect(() => {
    if (!running || isPaused) return;
    let last = performance.now();
    let rafId = 0;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setSimTime((prev) => {
        const next = prev + dt;
        if (next >= maxFlight) {
          if (mode === 'circular-motion') return next % maxFlight;
          setRunning(false);
          return maxFlight;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, isPaused, maxFlight, mode]);

  const circ = computeCircularMotion(radius, period);

  // Angled current point
  const currentPoint =
    mode === 'projectile-horizontal'
      ? {
          x: v0 * simTime,
          y: Math.max(0, heightH - 0.5 * g * simTime * simTime),
          vx: v0,
          vy: -g * simTime,
        }
      : computeProjectilePointAt(v0, angleDeg, simTime, g);

  // SVG bounding for projectiles
  const maxX = Math.max(10, mode === 'projectile-horizontal' ? horizRange * 1.1 : angledMetrics.range * 1.1);
  const maxY = Math.max(10, mode === 'projectile-horizontal' ? heightH * 1.2 : angledMetrics.maxHeight * 1.25);

  const mapX = (x: number) => 28 + (x / maxX) * 264;
  const mapY = (y: number) => 185 - (y / maxY) * 155;

  const trajectoryPoints =
    mode !== 'circular-motion'
      ? Array.from({ length: 25 })
          .map((_, idx) => {
            const t = (idx / 24) * maxFlight;
            const pt =
              mode === 'projectile-horizontal'
                ? { x: v0 * t, y: Math.max(0, heightH - 0.5 * g * t * t) }
                : computeProjectilePointAt(v0, angleDeg, t, g);
            return `${mapX(pt.x).toFixed(1)},${mapY(pt.y).toFixed(1)}`;
          })
          .join(' ')
      : '';

  // Circular motion angle
  const thetaCirc = (simTime / Math.max(0.5, period)) * 2 * Math.PI;
  const cx = 160;
  const cy = 105;
  const rPx = 56;
  const ballX = cx + rPx * Math.cos(thetaCirc);
  const ballY = cy - rPx * Math.sin(thetaCirc);
  // Tangent unit vector (counter-clockwise)
  const tx = -Math.sin(thetaCirc);
  const ty = -Math.cos(thetaCirc);
  // Inward radial vector
  const rx = -Math.cos(thetaCirc);
  const ry = Math.sin(thetaCirc);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {mode === 'projectile-angled' && 'محاكاة المقذوف بزاوية (المدى وأقصى ارتفاع)'}
            {mode === 'projectile-horizontal' && 'محاكاة المقذوف الأفقي (الارتفاع والمدى)'}
            {mode === 'circular-motion' && 'محاكاة الحركة الدائرية المنتظمة (vs و ac)'}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPaused}
            onClick={() => {
              if (mode !== 'circular-motion' && simTime >= maxFlight) setSimTime(0);
              setRunning((r) => !r);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {running && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running && !isPaused ? 'إيقاف مؤقت' : 'إطلاق / تشغيل'}
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
        <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3">
          {mode === 'circular-motion' ? (
            <svg viewBox="0 0 320 210" className="w-full h-auto" role="img" aria-label="الحركة الدائرية المنتظمة">
              <circle cx={cx} cy={cy} r={rPx} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 4" />
              <line x1={cx} y1={cy} x2={ballX} y2={ballY} stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="4" fill="#0f172a" />
              {/* Tangent speed vector vs */}
              <line x1={ballX} y1={ballY} x2={ballX + tx * 42} y2={ballY + ty * 42} stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
              <text x={ballX + tx * 48} y={ballY + ty * 48} fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">
                vs
              </text>
              {/* Centripetal acceleration vector ac */}
              <line x1={ballX} y1={ballY} x2={ballX + rx * 36} y2={ballY + ry * 36} stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
              <text x={ballX + rx * 42} y={ballY + ry * 42} fill="#b91c1c" fontSize="10" fontWeight="bold" textAnchor="middle">
                ac
              </text>
              <circle cx={ballX} cy={ballY} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 320 210" className="w-full h-auto" role="img" aria-label="مسار المقذوف">
              {/* Ground */}
              <line x1="16" y1="185" x2="304" y2="185" stroke="#475569" strokeWidth="2" />
              {mode === 'projectile-horizontal' && (
                <rect x="12" y={mapY(heightH)} width="18" height={185 - mapY(heightH)} fill="#94a3b8" />
              )}
              <polyline fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 4" points={trajectoryPoints} />
              {/* Projectile ball */}
              {(() => {
                const bx = mapX(currentPoint.x);
                const by = mapY(currentPoint.y);
                return (
                  <g>
                    {/* vx component */}
                    <line x1={bx} y1={by} x2={bx + 24} y2={by} stroke="#059669" strokeWidth="2" />
                    {/* vy component */}
                    <line
                      x1={bx}
                      y1={by}
                      x2={bx}
                      y2={by - Math.max(-28, Math.min(28, currentPoint.vy * 1.1))}
                      stroke="#d97706"
                      strokeWidth="2"
                    />
                    <circle cx={bx} cy={by} r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  </g>
                );
              })()}
            </svg>
          )}
        </div>

        {/* Sliders & Readouts */}
        <div className="md:col-span-5 space-y-3">
          {mode === 'circular-motion' ? (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="circ-r">نصف القطر (r)</label>
                  <span className="tabular-nums text-sky-700">{radius.toFixed(1)} m</span>
                </div>
                <input
                  id="circ-r"
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  disabled={isPaused}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-sky-600 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="circ-t">الزمن الدوري (T)</label>
                  <span className="tabular-nums text-indigo-700">{period.toFixed(1)} s</span>
                </div>
                <input
                  id="circ-t"
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  disabled={isPaused}
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full accent-indigo-600 disabled:opacity-50"
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">السرعة المماسية (vs):</span>
                  <span className="font-bold tabular-nums text-sky-700">{circ.speed.toFixed(2)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">التسارع المركزي (ac):</span>
                  <span className="font-bold tabular-nums text-rose-700">{circ.centripetalAcceleration.toFixed(2)} m/s²</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="proj-v0">السرعة الابتدائية (v0)</label>
                  <span className="tabular-nums text-sky-700">{v0} m/s</span>
                </div>
                <input
                  id="proj-v0"
                  type="range"
                  min={2}
                  max={35}
                  step={0.5}
                  disabled={isPaused}
                  value={v0}
                  onChange={(e) => {
                    setSimTime(0);
                    setRunning(false);
                    setV0(Number(e.target.value));
                  }}
                  className="w-full accent-sky-600 disabled:opacity-50"
                />
              </div>

              {mode === 'projectile-angled' ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="proj-ang">زاوية الإطلاق (θ)</label>
                    <span className="tabular-nums text-indigo-700">{angleDeg}°</span>
                  </div>
                  <input
                    id="proj-ang"
                    type="range"
                    min={15}
                    max={80}
                    step={1}
                    disabled={isPaused}
                    value={angleDeg}
                    onChange={(e) => {
                      setSimTime(0);
                      setRunning(false);
                      setAngleDeg(Number(e.target.value));
                    }}
                    className="w-full accent-indigo-600 disabled:opacity-50"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="proj-h">الارتفاع (h)</label>
                    <span className="tabular-nums text-indigo-700">{heightH.toFixed(1)} m</span>
                  </div>
                  <input
                    id="proj-h"
                    type="range"
                    min={1.5}
                    max={60}
                    step={0.5}
                    disabled={isPaused}
                    value={heightH}
                    onChange={(e) => {
                      setSimTime(0);
                      setRunning(false);
                      setHeightH(Number(e.target.value));
                    }}
                    className="w-full accent-indigo-600 disabled:opacity-50"
                  />
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                {mode === 'projectile-angled' && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">أقصى ارتفاع (h):</span>
                    <span className="font-bold tabular-nums text-amber-700">{angledMetrics.maxHeight.toFixed(2)} m</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">زمن التحليق (T):</span>
                  <span className="font-bold tabular-nums text-indigo-700">{maxFlight.toFixed(2)} s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">المدى الأفقي (R):</span>
                  <span className="font-bold tabular-nums text-emerald-700">
                    {(mode === 'projectile-horizontal' ? horizRange : angledMetrics.range).toFixed(2)} m
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
