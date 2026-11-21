import React, { useEffect, useState } from 'react';
import {
  X,
  Lightbulb,
  BookOpen,
  Calculator,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ListChecks,
} from 'lucide-react';
import type { InteractiveHotspot } from '../types';
import SimulationLab from './simulations/SimulationLab';

interface HotspotExplanationDrawerProps {
  hotspot: InteractiveHotspot | null;
  pageHotspots: InteractiveHotspot[];
  teacherHideAnswers: boolean;
  teacherPauseSim: boolean;
  onClose: () => void;
  onSelectHotspot: (hotspot: InteractiveHotspot) => void;
}

export default function HotspotExplanationDrawer({
  hotspot,
  pageHotspots,
  teacherHideAnswers,
  teacherPauseSim,
  onClose,
  onSelectHotspot,
}: HotspotExplanationDrawerProps) {
  const [revealedStepsCount, setRevealedStepsCount] = useState(0);
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!hotspot) return;
    // If Teacher Mode hides answers, start with 0 steps revealed so teacher controls pace; otherwise show step 1 or all.
    setRevealedStepsCount(teacherHideAnswers ? 0 : hotspot.steps?.length ?? 0);
    setShowSubstitution(!teacherHideAnswers);
    setQuizAnswers({});
  }, [hotspot, teacherHideAnswers]);

  if (!hotspot) return null;

  const currentIdx = pageHotspots.findIndex((h) => h.id === hotspot.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < pageHotspots.length - 1;
  const totalSteps = hotspot.steps?.length ?? 0;

  return (
    <aside
      aria-label="لوحة الشرح والمحاكاة التفاعلية"
      data-testid="hotspot-drawer"
      className="fixed inset-x-0 bottom-0 top-14 z-40 lg:static lg:z-10 w-full lg:w-[460px] xl:w-[500px] lg:max-h-[calc(100vh-110px)] lg:sticky lg:top-[106px] bg-slate-50 border-t lg:border-t-0 lg:border-r border-slate-200 shadow-2xl lg:shadow-none flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
            <BookOpen className="w-3.5 h-3.5" />
            <span>صفحة {hotspot.page} من الكتاب المدرسي</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 leading-snug">{hotspot.title}</h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق لوحة الشرح"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev / Next Hotspot in Current Page */}
      {pageHotspots.length > 1 && (
        <div className="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => hasPrev && onSelectHotspot(pageHotspots[currentIdx - 1])}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            <ChevronRight className="w-4 h-4" />
            السابق بالصفحة
          </button>
          <span className="text-slate-500 tabular-nums font-medium">
            {currentIdx + 1} من {pageHotspots.length}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => hasNext && onSelectHotspot(pageHotspots[currentIdx + 1])}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            التالي بالصفحة
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 1. Simplified Explanation + Teaching Tip */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-900">الشرح التفاعلي المبسط</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{hotspot.simpleExplanation}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed">
              <span className="font-bold block mb-0.5">كيف تشرحها لأختك:</span>
              {hotspot.teachingTip}
            </div>
          </div>
        </section>

        {/* 2. Formula Breakdown */}
        {hotspot.formula && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">{hotspot.formula.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSubstitution((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                {showSubstitution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSubstitution ? 'إخفاء التعويض' : 'عرض التعويض'}
              </button>
            </div>

            <div
              dir="ltr"
              className="bg-slate-900 text-sky-300 rounded-lg px-4 py-3 text-center font-mono text-sm font-bold tracking-wide"
            >
              {hotspot.formula.equation}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {hotspot.formula.symbols.map((sym) => (
                <div
                  key={sym.symbol}
                  className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      dir="ltr"
                      className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold"
                    >
                      {sym.symbol}
                    </span>
                    <span className="text-slate-700 font-medium">{sym.name}</span>
                  </div>
                  <span className="text-slate-500 font-semibold tabular-nums shrink-0">{sym.unit}</span>
                </div>
              ))}
            </div>

            {showSubstitution && hotspot.formula.sampleSubstitution.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-1 text-xs text-indigo-950">
                <span className="font-bold block">التعويض الخطوة بالخطوة:</span>
                {hotspot.formula.sampleSubstitution.map((line, i) => (
                  <p key={i} className="leading-relaxed tabular-nums">
                    • {line}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Progressive Step-by-Step Solution */}
        {hotspot.steps && totalSteps > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">خطوات الحل التدريجي</h4>
              </div>

              <div className="flex items-center gap-2">
                {revealedStepsCount < totalSteps && (
                  <button
                    type="button"
                    onClick={() => setRevealedStepsCount((c) => Math.min(totalSteps, c + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    اكشف الخطوة التالية ({revealedStepsCount}/{totalSteps})
                  </button>
                )}
                {revealedStepsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setRevealedStepsCount(0)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    إخفاء
                  </button>
                )}
              </div>
            </div>

            {revealedStepsCount === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-600">
                الحل مخفي الآن لتشجيع أختك على التفكير — اضغط "اكشف الخطوة التالية" لعرض الحل تدريجياً.
              </div>
            ) : (
              <div className="space-y-2">
                {hotspot.steps.slice(0, revealedStepsCount).map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 leading-relaxed"
                  >
                    {step}
                  </div>
                ))}

                {revealedStepsCount === totalSteps && hotspot.finalAnswer && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs font-bold text-emerald-900">
                    النتيجة النهائية: {hotspot.finalAnswer}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. Embedded Live Physics Simulation */}
        {hotspot.simulation && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
              <PlayCircle className="w-4 h-4 text-sky-600" />
              <span>جرّب المحاكاة الفيزيائية المباشرة لهذا المفهوم:</span>
            </div>
            <SimulationLab simulationId={hotspot.simulation} isPaused={teacherPauseSim} />
          </section>
        )}

        {/* 5. Quick Quiz */}
        {hotspot.quiz && hotspot.quiz.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">اختبار فهم سريع</h4>
            {hotspot.quiz.map((q, qIdx) => {
              const selected = quizAnswers[qIdx];
              const answered = selected !== undefined;
              const isCorrect = selected === q.correctIndex;

              return (
                <div key={qIdx} className="space-y-2.5 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isThisSelected = selected === oIdx;
                      const isThisCorrect = oIdx === q.correctIndex;
                      let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                      if (answered) {
                        if (isThisCorrect && !teacherHideAnswers) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isThisSelected && !isThisCorrect) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                        } else if (isThisSelected && teacherHideAnswers) {
                          btnStyle = 'bg-sky-50 border-sky-400 text-sky-900 font-bold';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          className={`w-full text-right px-3 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {answered && !teacherHideAnswers && isThisCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {answered && !teacherHideAnswers && isThisSelected && !isThisCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {answered && !teacherHideAnswers && (
                    <div
                      className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                        isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
                      }`}
                    >
                      {q.explanation}
                    </div>
                  )}
                  {answered && teacherHideAnswers && (
                    <div className="p-2 rounded-lg text-xs bg-slate-100 text-slate-700">
                      تم تسجيل اختيار الطالبة — أطفئ "إخفاء الحلول" من وضع المعلم لكشف النتيجة والتعليل.
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </aside>
  );
}
