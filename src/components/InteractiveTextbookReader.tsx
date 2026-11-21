import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, MousePointerClick } from 'lucide-react';
import type { InteractiveHotspot } from '../types';
import { bookToc } from '../data/tocData';
import { getHotspotsForPage } from '../data/bookHotspots';
import { getPageSpread } from '../utils/physicsMath';
import BookToolbar from './BookToolbar';
import PdfPageCanvas from './PdfPageCanvas';
import HotspotExplanationDrawer from './HotspotExplanationDrawer';
import TocDrawer from './TocDrawer';
import WhiteboardModal from './WhiteboardModal';

const TOTAL_BOOK_PAGES = 88;
const STORAGE_PAGE_KEY = 'physics10_last_page';
const STORAGE_DONE_KEY = 'physics10_completed_items';

function getInitialPage(): number {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramPage = parseInt(params.get('page') || '', 10);
    if (!Number.isNaN(paramPage) && paramPage >= 1 && paramPage <= TOTAL_BOOK_PAGES) {
      return paramPage;
    }
    const saved = parseInt(localStorage.getItem(STORAGE_PAGE_KEY) || '', 10);
    if (!Number.isNaN(saved) && saved >= 1 && saved <= TOTAL_BOOK_PAGES) {
      return saved;
    }
  }
  return 5;
}

export default function InteractiveTextbookReader() {
  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [isSpread, setIsSpread] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1120 : true
  );
  const [zoom, setZoom] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 0.85 : 0.95
  );

  // Interactive Hotspots & Drawers
  const [selectedHotspot, setSelectedHotspot] = useState<InteractiveHotspot | null>(null);
  const [focusedHotspotId, setFocusedHotspotId] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // Teacher Mode States
  const [teacherMode, setTeacherMode] = useState(false);
  const [teacherHideAnswers, setTeacherHideAnswers] = useState(true);
  const [teacherPauseSim, setTeacherPauseSim] = useState(false);

  // On-Page Pen Annotation States
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#0284c7');
  const [clearInkSignal, setClearInkSignal] = useState(0);

  // Completion Progress
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DONE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setIsSpread(false);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PAGE_KEY, String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify(completedIds));
  }, [completedIds]);

  const visiblePages = useMemo(
    () => getPageSpread(currentPage, isSpread, TOTAL_BOOK_PAGES),
    [currentPage, isSpread]
  );

  const spreadHotspots = useMemo(
    () => visiblePages.flatMap((p) => getHotspotsForPage(p)),
    [visiblePages]
  );

  const currentTocItem = useMemo(() => {
    for (const unit of bookToc) {
      const found = unit.items.find(
        (it) => currentPage >= it.page && currentPage <= it.endPage
      );
      if (found) return found;
    }
    return null;
  }, [currentPage]);

  const currentSectionTitle = currentTocItem
    ? currentTocItem.title
    : currentPage === 1
      ? 'غلاف كتاب الفيزياء — الصف العاشر (ف1)'
      : currentPage <= 4
        ? 'قائمة المحتويات والمقدمة'
        : 'مسرد المصطلحات العلمية';

  const handleJumpToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_BOOK_PAGES, page));
    setCurrentPage(clamped);
    setSelectedHotspot(null);
    setFocusedHotspotId(null);
  };

  const handlePrevPage = () => {
    const step = isSpread && visiblePages.length === 2 ? 2 : 1;
    const firstVisible = visiblePages[0] ?? currentPage;
    handleJumpToPage(Math.max(1, firstVisible - step));
  };

  const handleNextPage = () => {
    const lastVisible = visiblePages[visiblePages.length - 1] ?? currentPage;
    handleJumpToPage(Math.min(TOTAL_BOOK_PAGES, lastVisible + 1));
  };

  const handleToggleComplete = (itemId: string) => {
    setCompletedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleNextGuidedHotspot = () => {
    if (spreadHotspots.length === 0) return;
    const currentIndex = spreadHotspots.findIndex(
      (h) => h.id === (selectedHotspot?.id ?? focusedHotspotId)
    );
    const nextIdx = (currentIndex + 1) % spreadHotspots.length;
    const nextHotspot = spreadHotspots[nextIdx];
    setFocusedHotspotId(nextHotspot.id);
    setSelectedHotspot(nextHotspot);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900"
      data-testid="app-root"
      data-current-page={currentPage}
      data-teacher-mode={teacherMode ? 'on' : 'off'}
    >
      <BookToolbar
        currentPage={currentPage}
        totalPages={TOTAL_BOOK_PAGES}
        isSpread={isSpread}
        zoom={zoom}
        currentSectionTitle={currentSectionTitle}
        isCurrentSectionDone={currentTocItem ? completedIds.includes(currentTocItem.id) : false}
        teacherMode={teacherMode}
        teacherHideAnswers={teacherMode && teacherHideAnswers}
        teacherPauseSim={teacherMode && teacherPauseSim}
        penMode={penMode}
        penColor={penColor}
        hasSpreadHotspots={spreadHotspots.length > 0}
        onOpenToc={() => setTocOpen(true)}
        onPageChange={handleJumpToPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onToggleSpread={() => setIsSpread((s) => !s)}
        onZoomChange={(delta) =>
          setZoom((z) => Math.max(0.65, Math.min(1.5, Number((z + delta).toFixed(2)))))
        }
        onToggleCurrentSectionDone={() => {
          if (currentTocItem) handleToggleComplete(currentTocItem.id);
        }}
        onToggleTeacherMode={() => setTeacherMode((t) => !t)}
        onToggleHideAnswers={() => setTeacherHideAnswers((h) => !h)}
        onTogglePauseSim={() => setTeacherPauseSim((p) => !p)}
        onNextGuidedHotspot={handleNextGuidedHotspot}
        onTogglePenMode={() => {
          setPenMode((p) => !p);
          if (!penMode) setSelectedHotspot(null);
        }}
        onPenColorChange={setPenColor}
        onClearInk={() => setClearInkSignal((s) => s + 1)}
        onOpenWhiteboard={() => setWhiteboardOpen(true)}
      />

      {/* Contextual Quick Strip for Hotspots on Current Visible Pages */}
      <div className="bg-white/95 border-b border-slate-200 px-3 sm:px-5 py-2">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
            <MousePointerClick className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              {spreadHotspots.length > 0
                ? 'اضغط مباشرة على أي رسم أو مثال أو قانون في صفحة الكتاب لعرض الشرح والمحاكاة:'
                : 'تصفح الكتاب باستخدام الأسهم أو الفهرس للوصول إلى الرسومات والتجارب التفاعلية.'}
            </span>
          </div>

          {spreadHotspots.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {spreadHotspots.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setFocusedHotspotId(h.id);
                    setSelectedHotspot(h);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedHotspot?.id === h.id
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="max-w-[200px] truncate">{h.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Split: Book Stage + Non-Obstructing Docked Explanation Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <main className="flex-1 overflow-auto px-3 sm:px-6 py-5 flex flex-col items-center">
          <div
            className="flex flex-wrap xl:flex-nowrap items-start justify-center gap-4 sm:gap-5 w-full max-w-full"
            data-testid="book-spread"
          >
            {visiblePages.map((pageNum) => (
              <PdfPageCanvas
                key={pageNum}
                pageNumber={pageNum}
                zoom={zoom}
                compactTwoUp={Boolean(selectedHotspot) && visiblePages.length === 2}
                hotspots={getHotspotsForPage(pageNum)}
                selectedHotspotId={selectedHotspot?.id ?? null}
                focusedHotspotId={focusedHotspotId}
                teacherHideAnswers={teacherMode && teacherHideAnswers}
                penMode={penMode}
                penColor={penColor}
                clearInkSignal={clearInkSignal}
                onSelectHotspot={(h) => {
                  setFocusedHotspotId(h.id);
                  setSelectedHotspot(h);
                }}
              />
            ))}
          </div>
        </main>

        {/* Explanation + Physics Simulation Drawer */}
        <HotspotExplanationDrawer
          hotspot={selectedHotspot}
          pageHotspots={spreadHotspots}
          teacherHideAnswers={teacherMode && teacherHideAnswers}
          teacherPauseSim={teacherMode && teacherPauseSim}
          onClose={() => setSelectedHotspot(null)}
          onSelectHotspot={(h) => {
            setFocusedHotspotId(h.id);
            setSelectedHotspot(h);
          }}
        />
      </div>

      {/* Interactive Table of Contents Drawer */}
      <TocDrawer
        isOpen={tocOpen}
        currentPage={currentPage}
        completedIds={completedIds}
        onClose={() => setTocOpen(false)}
        onJumpToPage={handleJumpToPage}
        onToggleComplete={handleToggleComplete}
      />

      {/* Standalone Interactive Whiteboard Modal */}
      <WhiteboardModal
        isOpen={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
      />
    </div>
  );
}
