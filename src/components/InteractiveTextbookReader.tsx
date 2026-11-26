import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, MousePointerClick, Search, Bookmark, BookOpen, ClipboardCheck, Calculator, X, ChevronLeft, RotateCcw } from 'lucide-react';
import type { InteractiveHotspot } from '../types';
import { bookToc } from '../data/tocData';
import { allBookHotspots, getHotspotsForPage } from '../data/bookHotspots';
import { getPageSpread } from '../utils/physicsMath';
import BookToolbar from './BookToolbar';
import PdfPageCanvas from './PdfPageCanvas';
import HotspotExplanationDrawer from './HotspotExplanationDrawer';
import TocDrawer from './TocDrawer';
import WhiteboardModal from './WhiteboardModal';

const TOTAL_BOOK_PAGES = 88;
const STORAGE_PAGE_KEY = 'physics10_last_page';
const STORAGE_DONE_KEY = 'physics10_completed_items';
const STORAGE_BOOKMARKS_KEY = 'physics10_bookmarks_v1';
const lessonItems = bookToc.flatMap(unit => unit.items.filter(item => item.type === 'lesson'));
const normalize = (value: string) => value.toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ـ/g, '').trim();
function readStoredArray<T>(key: string, valid: (item: unknown) => item is T): T[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? [...new Set(value.filter(valid))] : []; } catch { return []; }
}
function saveStored(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* reading still works without storage */ }
}
const formulaEntries = allBookHotspots.filter(h => h.formula);
const quizEntries = allBookHotspots.flatMap(h => (h.quiz || []).map(q => ({...q, page: h.page, hotspot: h})))
  .filter((q, i, list) => q.options.length > 1 && q.correctIndex >= 0 && q.correctIndex < q.options.length && list.findIndex(other => normalize(other.question) === normalize(q.question)) === i);
type StudyTab = 'search' | 'bookmarks' | 'formulas' | 'quiz';

function getInitialPage(): number {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramPage = parseInt(params.get('page') || '', 10);
    if (!Number.isNaN(paramPage) && paramPage >= 1 && paramPage <= TOTAL_BOOK_PAGES) {
      return paramPage;
    }
    let saved = NaN;
    try { saved = parseInt(localStorage.getItem(STORAGE_PAGE_KEY) || '', 10); } catch { /* storage may be unavailable */ }
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
  const [studyTab, setStudyTab] = useState<StudyTab | null>(null);
  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>(() => readStoredArray(STORAGE_BOOKMARKS_KEY, (item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= TOTAL_BOOK_PAGES));
  const [quizUnit, setQuizUnit] = useState('all');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizPicks, setQuizPicks] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizRound, setQuizRound] = useState(0);

  // Teacher Mode States
  const [teacherMode, setTeacherMode] = useState(false);
  const [teacherHideAnswers, setTeacherHideAnswers] = useState(true);
  const [teacherPauseSim, setTeacherPauseSim] = useState(false);

  // On-Page Pen Annotation States
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#0284c7');
  const [clearInkSignal, setClearInkSignal] = useState(0);

  // Completion Progress
  const [completedIds, setCompletedIds] = useState<string[]>(() => readStoredArray(STORAGE_DONE_KEY, (item): item is string => typeof item === 'string'));

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
    saveStored(STORAGE_PAGE_KEY, String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    saveStored(STORAGE_DONE_KEY, JSON.stringify(completedIds));
  }, [completedIds]);

  useEffect(() => { saveStored(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks)); }, [bookmarks]);
  const completedLessons = lessonItems.filter(item => completedIds.includes(item.id)).length;
  const progress = Math.round(100 * completedLessons / Math.max(1, lessonItems.length));
  const searchTerm = normalize(search);
  const matchingTopics = allBookHotspots.filter(h => !searchTerm || normalize(h.title + ' ' + (h.formula?.title || '') + ' ' + (h.formula?.equation || '')).includes(searchTerm));
  const matchingLessons = bookToc.flatMap(u => u.items).filter(item => !searchTerm || normalize(item.title).includes(searchTerm));
  const quizQuestions = useMemo(() => {
    const available = quizEntries.filter(q => quizUnit === 'all' || (quizUnit === '1' ? q.page <= 32 : q.page >= 33));
    if (!available.length) return [];
    const offset = (quizRound * 10) % available.length;
    return [...available.slice(offset), ...available.slice(0, offset)].slice(0, 10);
  }, [quizUnit, quizRound]);
  const quizScore = quizQuestions.filter((q, i) => quizPicks[i] === q.correctIndex).length;
  const quizQuestion = quizQuestions[quizIndex];
  const resetQuiz = () => { setQuizIndex(0); setQuizPicks({}); setQuizFinished(false); };
  const toggleBookmark = () => setBookmarks(prev => prev.includes(currentPage) ? prev.filter(p => p !== currentPage) : [...prev, currentPage].sort((a,b) => a-b));
  useEffect(() => {
    if (!studyTab) return;
    const closeOnEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setStudyTab(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [studyTab]);

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

  const openTopic = (hotspot: InteractiveHotspot) => {
    handleJumpToPage(hotspot.page);
    setFocusedHotspotId(hotspot.id);
    setSelectedHotspot(hotspot);
    setStudyTab(null);
  };
  const openPage = (page: number) => { handleJumpToPage(page); setStudyTab(null); };
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

      {/* Study dashboard — lightweight, independent of the book and teacher tools */}
      <section dir="rtl" className="bg-gradient-to-l from-slate-900 to-slate-800 text-white px-3 sm:px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-sky-400/15 rounded-xl p-2.5"><BookOpen className="w-5 h-5 text-sky-300" /></div>
            <div><p className="font-extrabold text-sm sm:text-base">فيشيا | مختبر الفيزياء</p><p className="text-xs text-slate-300 mt-0.5">الصف العاشر · الفصل الأول</p></div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {([
              ['search', 'بحث', Search], ['formulas', 'بنك القوانين', Calculator], ['quiz', 'اختبر نفسك', ClipboardCheck], ['bookmarks', 'محفوظاتي', Bookmark]
            ] as const).map(([tab, label, Icon]) => (
              <button key={tab} type="button" onClick={() => {setSearch('');setStudyTab(tab);}} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-sky-300 ${tab === 'quiz' ? 'bg-sky-500 text-slate-950 hover:bg-sky-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}><Icon className="w-4 h-4"/>{label}</button>
            ))}
            <button type="button" aria-pressed={bookmarks.includes(currentPage)} onClick={toggleBookmark} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20"><Bookmark className={`w-4 h-4 ${bookmarks.includes(currentPage) ? 'fill-amber-300 text-amber-300' : ''}`}/>{bookmarks.includes(currentPage) ? 'محفوظة' : 'احفظ الصفحة'}</button>
          </div>
          <div className="w-full sm:w-44" aria-label="تقدم إنجاز الدروس">
            <div className="flex justify-between text-xs text-slate-200 mb-1"><span>إنجاز الدروس</span><span>{completedLessons}/{lessonItems.length}</span></div>
            <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="bg-sky-400 h-full rounded-full" style={{width: progress+'%'}}/></div>
            {currentTocItem?.type === 'lesson' && <button type="button" onClick={() => handleToggleComplete(currentTocItem.id)} className="mt-1.5 text-xs text-sky-200 underline md:hidden">{completedIds.includes(currentTocItem.id) ? 'إلغاء إنجاز الدرس' : 'أنهيت هذا الدرس'}</button>}
          </div>
        </div>
      </section>
      {studyTab && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={() => setStudyTab(null)}>
          <section role="dialog" aria-modal="true" aria-label="مركز الدراسة" dir="rtl" className="w-full sm:max-w-3xl max-h-[90dvh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <header className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div><p className="text-xs text-sky-700 font-bold">مركز الدراسة</p><h2 className="text-lg font-black">{({search:'ابحث في الكتاب',bookmarks:'الصفحات المحفوظة',formulas:'بنك القوانين',quiz:'اختبر نفسك'})[studyTab]}</h2></div>
              <button autoFocus type="button" aria-label="إغلاق مركز الدراسة" onClick={() => setStudyTab(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button>
            </header>
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {(studyTab === 'search' || studyTab === 'formulas') && <label className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-3"><Search className="w-5 h-5 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={studyTab === 'search' ? 'مثلاً: نيوتن، التسارع، المتجهات...' : 'ابحث عن قانون أو رمز...'} className="flex-1 min-w-0 bg-transparent outline-none text-sm" aria-label="البحث"/></label>}
              {studyTab === 'search' && <>
                <h3 className="font-bold text-sm">دروس وفصول الكتاب</h3>
                {matchingLessons.slice(0, 8).map(item => <button key={item.id} type="button" onClick={()=>openPage(item.page)} className="w-full flex items-center justify-between gap-3 text-right p-3 rounded-xl border border-slate-200 hover:border-sky-500"><span className="font-semibold text-sm">{item.title}</span><span className="text-xs text-sky-700 shrink-0">ص {item.page}</span></button>)}
                <h3 className="font-bold text-sm">الشروحات والأمثلة التفاعلية ({matchingTopics.length})</h3>
                {matchingTopics.slice(0, 30).map(h => <button key={h.id} type="button" onClick={()=>openTopic(h)} className="w-full flex items-center justify-between gap-3 text-right p-3 rounded-xl border border-slate-200 hover:border-sky-500"><span className="text-sm">{h.title}</span><span className="text-xs text-sky-700 shrink-0">ص {h.page}</span></button>)}
                {!matchingLessons.length && !matchingTopics.length && <p className="text-sm text-slate-500">لا توجد نتائج، جرّب كلمة أقصر.</p>}
                {matchingTopics.length > 30 && <p className="text-xs text-slate-500">تظهر أول 30 نتيجة. اكتب كلمة أكثر تحديداً.</p>}
              </>}
              {studyTab === 'bookmarks' && <>
                {!bookmarks.length && <p className="text-sm text-slate-600 bg-slate-50 p-5 rounded-xl">احفظ أي صفحة من شريط الدراسة لتعود إليها لاحقاً.</p>}
                {bookmarks.map(p => <div key={p} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3"><button type="button" onClick={()=>openPage(p)} className="flex-1 text-right font-bold text-sm">صفحة {p} — {bookToc.flatMap(u=>u.items).find(i=>p>=i.page && p<=i.endPage)?.title || 'كتاب الفيزياء'}</button><button type="button" aria-label={`حذف الصفحة ${p} من المحفوظات`} onClick={()=>setBookmarks(prev=>prev.filter(n=>n!==p))} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button></div>)}
              </>}
              {studyTab === 'formulas' && <>
                <p className="text-sm text-slate-600">القوانين الموجودة في الشروحات التفاعلية، مع الرموز والوحدات ورابط صفحة الكتاب.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {formulaEntries.filter(h => !searchTerm || normalize(h.title+' '+h.formula!.title+' '+h.formula!.equation).includes(searchTerm)).map(h => <article key={h.id} className="border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="font-bold text-sm">{h.formula!.title}</h3><p dir="ltr" className="text-center bg-slate-900 text-sky-200 font-mono p-3 rounded-lg break-words">{h.formula!.equation}</p>{h.formula!.symbols.map((sym,i)=><div key={i} className="flex justify-between gap-2 text-xs"><span>{sym.name}</span><span dir="ltr" className="font-mono text-slate-600">{sym.symbol} · {sym.unit}</span></div>)}<button type="button" onClick={()=>openTopic(h)} className="text-sm font-bold text-sky-700">شرح القانون في صفحة {h.page} <ChevronLeft className="w-4 h-4 inline"/></button></article>)}
                </div>
                {!formulaEntries.some(h => !searchTerm || normalize(h.title+' '+h.formula!.title+' '+h.formula!.equation).includes(searchTerm)) && <p className="text-sm text-slate-500">لا توجد قوانين مطابقة.</p>}
              </>}
              {studyTab === 'quiz' && <>
                <div className="flex flex-wrap gap-2 items-center"><label className="text-sm font-bold" htmlFor="study-unit">الوحدة</label><select id="study-unit" value={quizUnit} onChange={e=>{setQuizUnit(e.target.value);setQuizRound(0);resetQuiz();}} className="border rounded-lg border-slate-300 p-2 text-sm"><option value="all">كل الوحدات</option><option value="1">المتجهات</option><option value="2">الحركة والقوى</option></select><button type="button" onClick={()=>{setQuizRound(r=>r+1);resetQuiz();}} className="text-xs font-bold text-sky-700 inline-flex gap-1 items-center"><RotateCcw className="w-4 h-4"/> مجموعة أخرى</button></div>
                {quizQuestions.length === 0 ? <p>لا توجد أسئلة متاحة لهذه الوحدة.</p> : quizFinished ? <div className="text-center space-y-4 py-5"><p className="text-sm font-bold text-slate-600">نتيجتك</p><p className="text-4xl font-black text-sky-700">{quizScore} / {quizQuestions.length}</p><div className="space-y-2 text-right">{quizQuestions.filter((q,i)=>quizPicks[i]!==q.correctIndex).map((q,i)=><div key={i} className="rounded-xl border border-slate-200 p-3 space-y-1"><p className="font-bold text-sm">{q.question}</p><p className="text-sm text-slate-600">{q.explanation}</p><button type="button" onClick={()=>openTopic(q.hotspot)} className="text-sm text-sky-700 font-bold">راجع الشرح · ص {q.page}</button></div>)}</div><button type="button" onClick={resetQuiz} className="bg-slate-900 text-white rounded-xl px-5 py-3 font-bold text-sm">إعادة الاختبار</button></div> : quizQuestion && <div className="space-y-4">
                  <div className="flex justify-between text-xs text-slate-600"><span>السؤال {quizIndex+1} من {quizQuestions.length}</span><span>المجاب: {Object.keys(quizPicks).length}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{width: ((quizIndex+1)/quizQuestions.length*100)+'%'}}/></div>
                  <h3 className="font-black text-lg leading-relaxed">{quizQuestion.question}</h3>
                  {quizQuestion.options.map((opt,i)=><button type="button" key={i} onClick={()=>setQuizPicks(prev=>({...prev,[quizIndex]:i}))} className={`w-full text-right p-3 border rounded-xl text-sm font-semibold ${quizPicks[quizIndex]===i ? 'border-sky-600 bg-sky-50 text-sky-900' : 'border-slate-200 hover:border-sky-400'}`}>{opt}</button>)}
                  <div className="flex justify-between gap-2"><button type="button" disabled={quizIndex===0} onClick={()=>setQuizIndex(i=>i-1)} className="rounded-lg border border-slate-200 p-3 text-sm font-bold disabled:opacity-40">السابق</button><button type="button" disabled={quizPicks[quizIndex]===undefined || (quizIndex===quizQuestions.length-1 && Object.keys(quizPicks).length<quizQuestions.length)} onClick={()=>quizIndex===quizQuestions.length-1?setQuizFinished(true):setQuizIndex(i=>i+1)} className="bg-sky-600 text-white rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-40">{quizIndex===quizQuestions.length-1?'اعرض النتيجة':'التالي'}</button></div>
                </div>}
              </>}
            </div>
          </section>
        </div>
      )}

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
