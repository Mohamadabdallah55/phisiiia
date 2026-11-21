import React, { useState } from 'react';
import { Globe2, RotateCcw } from 'lucide-react';
import {
  computeNewtonSecond,
  computeUniversalGravity,
  computeSurfaceGravity,
} from '../../utils/physicsMath';

interface NewtonGravityLabProps {
  mode: 'newton-first' | 'newton-second' | 'newton-third' | 'universal-gravity';
  isPaused?: boolean;
}

const celestialBodies = [
  { id: 'earth', name: 'الأرض', mass: 5.97e24, radius: 6.37e6 },
  { id: 'moon', name: 'القمر', mass: 7.35e22, radius: 1.738e6 },
  { id: 'mars', name: 'المريخ', mass: 6.42e23, radius: 3.39e6 },
  { id: 'jupiter', name: 'المشتري', mass: 1.90e27, radius: 7.15e7 },
];

export default function NewtonGravityLab({ mode, isPaused = false }: NewtonGravityLabProps) {
  // Newton 1 & 2 states
  const [appliedForce, setAppliedForce] = useState(mode === 'newton-first' ? 80 : 2000);
  const [frictionForce, setFrictionForce] = useState(mode === 'newton-first' ? 80 : 1400);
  const [mass, setMass] = useState(mode === 'newton-first' ? 20 : 800);

  // Gravity states
  const [m1, setM1] = useState(50);
  const [m2, setM2] = useState(60);
  const [distanceR, setDistanceR] = useState(0.5);
  const [selectedPlanetId, setSelectedPlanetId] = useState('moon');

  const newton2 = computeNewtonSecond(appliedForce, frictionForce, mass);
  const isBalanced = appliedForce === frictionForce;
  const gravForce = computeUniversalGravity(m1, m2, distanceR);
  const planet = celestialBodies.find((b) => b.id === selectedPlanetId) ?? celestialBodies[1];
  const surfaceG = computeSurfaceGravity(planet.mass, planet.radius);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {mode === 'newton-first' && 'مختبر القانون الأول لنيوتن والاتزان (ΣF = 0)'}
            {mode === 'newton-second' && 'مختبر القانون الثاني لنيوتن (ΣF = ma)'}
            {mode === 'newton-third' && 'مختبر أزواج الفعل ورد الفعل (FA→B = -FB→A)'}
            {mode === 'universal-gravity' && 'مختبر الجذب العام وتسارع الجاذبية على الكواكب'}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setAppliedForce(mode === 'newton-first' ? 80 : 2000);
            setFrictionForce(mode === 'newton-first' ? 80 : 1400);
            setMass(mode === 'newton-first' ? 20 : 800);
            setM1(50);
            setM2(60);
            setDistanceR(0.5);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      {mode === 'universal-gravity' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">اختر الجرم السماوي لحساب تسارع السقوط الحر (g):</div>
            <div className="grid grid-cols-2 gap-2">
              {celestialBodies.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={isPaused}
                  onClick={() => setSelectedPlanetId(b.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                    selectedPlanetId === b.id
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">تسارع الجاذبية على {planet.name}:</span>
                <span className="font-bold tabular-nums text-sky-700">{surfaceG} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">وزن جسم كتلته {m1} kg هناك:</span>
                <span className="font-bold tabular-nums text-emerald-700">{(m1 * surfaceG).toFixed(1)} N</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="grav-m1">الكتلة الأولى (m1)</label>
                <span className="tabular-nums text-sky-700">{m1} kg</span>
              </div>
              <input
                id="grav-m1"
                type="range"
                min={10}
                max={200}
                step={5}
                disabled={isPaused}
                value={m1}
                onChange={(e) => setM1(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="grav-m2">الكتلة الثانية (m2)</label>
                <span className="tabular-nums text-indigo-700">{m2} kg</span>
              </div>
              <input
                id="grav-m2"
                type="range"
                min={10}
                max={200}
                step={5}
                disabled={isPaused}
                value={m2}
                onChange={(e) => setM2(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="grav-r">المسافة بين المركزين (r)</label>
                <span className="tabular-nums text-emerald-700">{distanceR.toFixed(2)} m</span>
              </div>
              <input
                id="grav-r"
                type="range"
                min={0.5}
                max={5}
                step={0.25}
                disabled={isPaused}
                value={distanceR}
                onChange={(e) => setDistanceR(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex justify-between items-center">
              <span className="text-slate-600">قوة التجاذب المتبادلة (F):</span>
              <span className="font-bold tabular-nums text-sky-700" dir="ltr">
                {gravForce.toExponential(2)} N
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Free-body SVG Diagram */}
          <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <svg viewBox="0 0 320 170" className="w-full h-auto" role="img" aria-label="مخطط الجسم الحر والقوى">
              <line x1="20" y1="125" x2="300" y2="125" stroke="#64748b" strokeWidth="2" />
              {mode === 'newton-third' ? (
                <>
                  {/* Two interacting bodies */}
                  <rect x="65" y="70" width="52" height="52" rx="8" fill="#0284c7" />
                  <text x="91" y="100" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
                  <rect x="203" y="70" width="52" height="52" rx="8" fill="#4f46e5" />
                  <text x="229" y="100" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
                  {/* Reaction on A */}
                  <line x1="65" y1="96" x2="22" y2="96" stroke="#dc2626" strokeWidth="3" />
                  <text x="42" y="86" fill="#b91c1c" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {appliedForce} N ←
                  </text>
                  {/* Action on B */}
                  <line x1="255" y1="96" x2="298" y2="96" stroke="#059669" strokeWidth="3" />
                  <text x="278" y="86" fill="#047857" fontSize="10" fontWeight="bold" textAnchor="middle">
                    → {appliedForce} N
                  </text>
                </>
              ) : (
                <>
                  {/* Single box with horizontal forces */}
                  <rect x="130" y="65" width="60" height="58" rx="8" fill="#0284c7" />
                  <text x="160" y="98" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                    {mass} kg
                  </text>
                  {/* Applied Right Force */}
                  <line x1="190" y1="94" x2={190 + Math.min(85, Math.max(15, appliedForce / 28))} y2="94" stroke="#059669" strokeWidth="4" />
                  <text x="240" y="82" fill="#047857" fontSize="10" fontWeight="bold" textAnchor="middle">
                    دفع = {appliedForce} N
                  </text>
                  {/* Left / Friction Force */}
                  <line x1="130" y1="94" x2={130 - Math.min(85, Math.max(15, frictionForce / 28))} y2="94" stroke="#d97706" strokeWidth="4" />
                  <text x="80" y="82" fill="#b45309" fontSize="10" fontWeight="bold" textAnchor="middle">
                    مقاومة = {frictionForce} N
                  </text>
                </>
              )}
            </svg>
            <p className="text-xs text-center text-slate-600 mt-1">
              {mode === 'newton-third'
                ? 'مهما زادت القوة، فإن القوتين متساويتان في المقدار ومتعاكستان في الاتجاه على جسمين مختلفين.'
                : isBalanced
                  ? 'حالة اتزان (ΣF = 0): التسارع يساوي صفراً.'
                  : `غير متزن: تتحرك الكتلة بتسارع ${newton2.acceleration.toFixed(2)} m/s².`}
            </p>
          </div>

          {/* Sliders */}
          <div className="md:col-span-5 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="n-force">{mode === 'newton-third' ? 'قوة الدفع المتبادلة' : 'قوة الدفع / السحب (يمين)'}</label>
                <span className="tabular-nums text-emerald-700">{appliedForce} N</span>
              </div>
              <input
                id="n-force"
                type="range"
                min={20}
                max={3000}
                step={20}
                disabled={isPaused}
                value={appliedForce}
                onChange={(e) => setAppliedForce(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {mode !== 'newton-third' && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="n-fric">الاحتكاك / القوة المعاكسة (يسار)</label>
                    <span className="tabular-nums text-amber-700">{frictionForce} N</span>
                  </div>
                  <input
                    id="n-fric"
                    type="range"
                    min={0}
                    max={3000}
                    step={20}
                    disabled={isPaused}
                    value={frictionForce}
                    onChange={(e) => setFrictionForce(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="n-mass">كتلة الجسم (m)</label>
                    <span className="tabular-nums text-sky-700">{mass} kg</span>
                  </div>
                  <input
                    id="n-mass"
                    type="range"
                    min={10}
                    max={1500}
                    step={10}
                    disabled={isPaused}
                    value={mass}
                    onChange={(e) => setMass(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">القوة المحصلة (ΣF):</span>
                    <span className="font-bold tabular-nums text-slate-900">{newton2.netForce.toFixed(1)} N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">التسارع الناتج (a):</span>
                    <span className="font-bold tabular-nums text-sky-700">{newton2.acceleration.toFixed(2)} m/s²</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
