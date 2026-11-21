import React, { useEffect, useState } from 'react';
import {
  Menu,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileText,
  ZoomIn,
  ZoomOut,
  GraduationCap,
  EyeOff,
  PauseCircle,
  SkipForward,
  PenTool,
  Trash2,
  Presentation,
  CheckCircle2,
} from 'lucide-react';

interface BookToolbarProps {
  currentPage: number;
  totalPages: number;
  isSpread: boolean;
  zoom: number;
  currentSectionTitle: string;
  isCurrentSectionDone: boolean;
  teacherMode: boolean;
  teacherHideAnswers: boolean;
  teacherPauseSim: boolean;
  penMode: boolean;
  penColor: string;
  hasSpreadHotspots: boolean;
  onOpenToc: () => void;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSpread: () => void;
  onZoomChange: (delta: number) => void;
  onToggleCurrentSectionDone: () => void;
  onToggleTeacherMode: () => void;
  onToggleHideAnswers: () => void;
  onTogglePauseSim: () => void;
  onNextGuidedHotspot: () => void;
  onTogglePenMode: () => void;
  onPenColorChange: (color: string) => void;
  onClearInk: () => void;
  onOpenWhiteboard: () => void;
}

export default function BookToolbar({
  currentPage,
  totalPages,
  isSpread,
  zoom,
  currentSectionTitle,
  isCurrentSectionDone,
  teacherMode,
  teacherHideAnswers,
  teacherPauseSim,
  penMode,
  penColor,
  hasSpreadHotspots,
  onOpenToc,
  onPageChange,
  onPrev,
  onNext,
  onToggleSpread,
  onZoomChange,
  onToggleCurrentSectionDone,
  onToggleTeacherMode,
  onToggleHideAnswers,
  onTogglePauseSim,
  onNextGuidedHotspot,
  onTogglePenMode,
  onPenColorChange,
  onClearInk,
  onOpenWhiteboard,
}: BookToolbarProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const commitPageInput = () => {
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      onPageChange(Math.max(1, Math.min(totalPages, parsed)));
    } else {
      setPageInput(String(currentPage));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Toolbar Row */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Right side: TOC + Current Section */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenToc}
            aria-label="فهرس الكتاب التفاعلي"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Menu className="w-4 h-4" />
            <span>فهرس الكتاب</span>
          </button>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-extrabold text-slate-900 truncate max-w-[260px] lg:max-w-[360px]">
              {currentSectionTitle}
            </h1>
            <button
              type="button"
              onClick={onToggleCurrentSectionDone}
              aria-label={isCurrentSectionDone ? 'إلغاء علامة إنجاز الدرس' : 'تحديد الدرس كمكتمل'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isCurrentSectionDone
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCurrentSectionDone ? 'مكتمل' : 'تحديد كمكتمل'}</span>
            </button>
          </div>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentPage <= 1}
            aria-label="الصفحة السابقة"
            className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitPageInput();
            }}
            className="flex items-center gap-1 px-1 text-xs font-bold text-slate-700"
          >
            <label htmlFor="page-jump-input" className="sr-only">
              رقم الصفحة
            </label>
            <input
              id="page-jump-input"
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              className="w-10 text-center bg-white border border-slate-300 rounded px-1 py-0.5 tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
            <span className="text-slate-500 tabular-nums">/ {totalPages}</span>
          </form>

          <button
            type="button"
            onClick={onNext}
            disabled={currentPage >= totalPages}
            aria-label="الصفحة التالية"
            className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={onToggleSpread}
            aria-label={isSpread ? 'التبديل إلى عرض صفحة واحدة' : 'التبديل إلى عرض صفحتين'}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-white transition-colors whitespace-nowrap shrink-0"
          >
            {isSpread ? <BookOpen className="w-3.5 h-3.5 text-sky-600" /> : <FileText className="w-3.5 h-3.5 text-sky-600" />}
            <span>{isSpread ? 'صفحتان' : 'صفحة'}</span>
          </button>

          <div className="w-px h-4 bg-slate-300 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={() => onZoomChange(-0.15)}
            disabled={zoom <= 0.75}
            aria-label="تصغير الصفحة"
            className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 transition-colors hidden sm:inline-flex"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold tabular-nums text-slate-600 px-1 hidden sm:inline">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(0.15)}
            disabled={zoom >= 1.5}
            aria-label="تكبير الصفحة"
            className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 transition-colors hidden sm:inline-flex"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Left side: Teacher Mode, Pen on Page, Whiteboard */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTeacherMode}
            aria-pressed={teacherMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              teacherMode
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>وضع المعلم</span>
          </button>

          <button
            type="button"
            onClick={onTogglePenMode}
            aria-pressed={penMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              penMode
                ? 'bg-sky-600 border-sky-600 text-white'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">قلم على الصفحة</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhiteboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Presentation className="w-4 h-4 text-sky-600" />
            <span>السبورة</span>
          </button>
        </div>
      </div>

      {/* Contextual Secondary Strip: Teacher Mode Controls or On-Page Pen Options */}
      {(teacherMode || penMode) && (
        <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-5 py-2">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
            {teacherMode && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-900 ml-1">تحكم المعلم:</span>
                <button
                  type="button"
                  onClick={onToggleHideAnswers}
                  aria-pressed={teacherHideAnswers}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap ${
                    teacherHideAnswers
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{teacherHideAnswers ? 'إظهار الحلول' : 'إخفاء الحلول'}</span>
                </button>

                <button
                  type="button"
                  onClick={onTogglePauseSim}
                  aria-pressed={teacherPauseSim}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap ${
                    teacherPauseSim
                      ? 'bg-rose-100 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>{teacherPauseSim ? 'استئناف المحاكاة' : 'إيقاف المحاكاة'}</span>
                </button>

                <button
                  type="button"
                  disabled={!hasSpreadHotspots}
                  onClick={onNextGuidedHotspot}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>تسلسل الشرح التالي</span>
                </button>
              </div>
            )}

            {penMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-900">أدوات الرسم على الكتاب:</span>
                {['#0284c7', '#dc2626', '#059669', '#d97706', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`اختيار لون القلم ${c}`}
                    onClick={() => onPenColorChange(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      penColor === c ? 'border-slate-900 scale-125' : 'border-white shadow-xs'
                    }`}
                  />
                ))}
                <button
                  type="button"
                  onClick={onClearInk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الرسم</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
