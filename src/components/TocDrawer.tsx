import React from 'react';
import {
  X,
  BookOpen,
  FlaskConical,
  ClipboardCheck,
  Sparkles,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { bookToc, specialPages, type TocItem } from '../data/tocData';

interface TocDrawerProps {
  isOpen: boolean;
  currentPage: number;
  completedIds: string[];
  onClose: () => void;
  onJumpToPage: (page: number) => void;
  onToggleComplete: (itemId: string) => void;
}

const typeIcon = (type: TocItem['type']) => {
  switch (type) {
    case 'experiment':
      return <FlaskConical className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    case 'review':
      return <ClipboardCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />;
    case 'enrichment':
      return <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    default:
      return <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
  }
};

export default function TocDrawer({
  isOpen,
  currentPage,
  completedIds,
  onClose,
  onJumpToPage,
  onToggleComplete,
}: TocDrawerProps) {
  if (!isOpen) return null;

  const totalItems = bookToc.reduce((acc, unit) => acc + unit.items.length, 0);
  const completedTotal = completedIds.length;
  const overallPercent = totalItems > 0 ? Math.round((completedTotal / totalItems) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel (RTL Right side) */}
      <aside
        aria-label="فهرس وحدات ودروس الكتاب"
        data-testid="toc-drawer"
        className="relative z-10 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">فهرس كتاب الفيزياء (الصف العاشر)</h2>
            <p className="text-xs text-slate-500 mt-0.5">الفصل الدراسي الأول — المنهاج الأردني</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الفهرس"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Completion Status */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>حالة إنجاز الكتاب</span>
            <span className="tabular-nums text-sky-700">
              {completedTotal} / {totalItems} ({overallPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Special Pages */}
          <div className="grid grid-cols-2 gap-2">
            {specialPages.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => {
                  onJumpToPage(sp.page);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  currentPage === sp.page
                    ? 'bg-sky-50 border-sky-400 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{sp.title}</span>
                </span>
                <span className="text-[11px] tabular-nums text-slate-400">ص {sp.page}</span>
              </button>
            ))}
          </div>

          {/* Units */}
          {bookToc.map((unit) => {
            const unitDoneCount = unit.items.filter((it) => completedIds.includes(it.id)).length;
            const unitPct = Math.round((unitDoneCount / unit.items.length) * 100);

            return (
              <section key={unit.id} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{unit.title}</h3>
                    <span className="text-[11px] text-slate-500">
                      الصفحات {unit.startPage} – {unit.endPage}
                    </span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {unitPct}% مكتمل
                  </span>
                </div>

                <div className="space-y-1.5">
                  {unit.items.map((item) => {
                    const isActive = currentPage >= item.page && currentPage <= item.endPage;
                    const isDone = completedIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${
                          isActive
                            ? 'bg-sky-50 border-sky-400'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onJumpToPage(item.page);
                            onClose();
                          }}
                          className="flex-1 flex items-center gap-2 text-right min-w-0"
                        >
                          {typeIcon(item.type)}
                          <span
                            className={`text-xs font-semibold truncate ${
                              isActive ? 'text-sky-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {item.title}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] tabular-nums text-slate-500 font-medium">
                            ص {item.page}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleComplete(item.id)}
                            aria-label={`تحديد "${item.title}" كمكتمل`}
                            aria-pressed={isDone}
                            className={`p-1 rounded transition-colors ${
                              isDone
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
