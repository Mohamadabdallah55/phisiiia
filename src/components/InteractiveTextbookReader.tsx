import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, MousePointerClick, Search, Bookmark, BookOpen, ClipboardCheck, Calculator, X, ChevronLeft, ChevronRight, RotateCcw, Atom, FlaskConical, ArrowLeft, GraduationCap, Home, Focus, CheckCircle2, Target, MoveUpRight, PlayCircle } from 'lucide-react';
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
type StudyTab = 'search' | 'bookmarks' | 'formulas' | 'quiz' | 'labs';
const labEntries = allBookHotspots.filter((h,i,list) => h.simulation && list.findIndex(other => other.simulation === h.simulation) === i);

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
  const [showHome, setShowHome] = useState(() => !new URLSearchParams(window.location.search).has('page'));
  const [focusMode, setFocusMode] = useState(false);
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
  const openPage = (page: number) => { handleJumpToPage(page); setStudyTab(null); setShowHome(false); };
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

  const launchStudy = (tab: StudyTab) => {setShowHome(false);setSearch('');setStudyTab(tab);};
  const goHome = () => {setSelectedHotspot(null);setFocusedHotspotId(null);setStudyTab(null);setFocusMode(false);setShowHome(true);window.scrollTo({top:0});};

  if (showHome) return (
    <div dir="rtl" className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="bg-[#142c49] text-cyan-300 w-12 h-12 grid place-items-center rounded-2xl shadow-sm"><Atom className="w-8 h-8" strokeWidth={1.6}/></div><div><h1 className="font-black text-xl leading-tight">فيشيا<span className="text-teal-600">.</span></h1><p className="text-[11px] text-slate-500 tracking-wide">PHYSIIIA · PHYSICS LAB</p></div></div>
          <button type="button" onClick={()=>openPage(currentPage)} className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-50"><BookOpen className="w-4 h-4 text-teal-700"/> الكتاب</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-9 space-y-8">
        <section className="relative isolate overflow-hidden rounded-[30px] bg-[#112b49] text-white min-h-[310px] grid md:grid-cols-[1.2fr_0.8fr] shadow-lg shadow-slate-900/10">
          <div className="absolute inset-0 -z-10 opacity-20" style={{backgroundImage:'linear-gradient(#7dd3fc22 1px, transparent 1px),linear-gradient(90deg,#7dd3fc22 1px, transparent 1px)',backgroundSize:'32px 32px'}}/>
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <span className="text-xs font-bold text-teal-200 inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-300"/> الصف العاشر · المنهاج الأردني · الفصل الأول</span>
            <h2 className="text-3xl sm:text-5xl leading-[1.35] font-black mt-4">الفيزياء،<br/><span className="text-[#71e0ce]">بتصير أوضح.</span></h2>
            <p className="text-slate-200 leading-loose text-sm sm:text-base mt-4 max-w-lg">افهم الفكرة، جرّب القانون بإيدك، واختبر فهمك. كتابك المدرسي ومختبرك التفاعلي في مكان واحد.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button type="button" onClick={()=>openPage(currentPage)} className="bg-[#71e0ce] hover:bg-teal-200 text-[#102b42] px-5 py-3 rounded-xl font-black text-sm inline-flex items-center gap-2"><BookOpen className="w-5 h-5"/> أكمل القراءة <ArrowLeft className="w-4 h-4"/></button>
              <button type="button" onClick={()=>launchStudy('labs')} className="border border-white/30 hover:bg-white/10 px-4 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2"><FlaskConical className="w-5 h-5"/> جرّب المختبر</button>
            </div>
            <p className="mt-3 text-xs text-slate-300">آخر صفحة: {currentPage} · {currentSectionTitle}</p>
          </div>
          <div className="hidden md:grid place-items-center relative px-6" aria-hidden="true">
            <svg viewBox="0 0 340 300" className="w-full max-w-[390px]" fill="none">
              <circle cx="170" cy="150" r="120" stroke="#83e0da" strokeOpacity=".13" strokeDasharray="4 8"/><circle cx="170" cy="150" r="100" stroke="#83e0da" strokeOpacity=".2"/>
              <path d="M24 150H316M170 16V284" stroke="#8ab4d4" strokeOpacity=".22" strokeDasharray="3 7"/>
              <g transform="translate(170 150)" stroke="#83e0da" strokeWidth="2.2"><ellipse rx="116" ry="42" transform="rotate(-24)"/><ellipse rx="116" ry="42" transform="rotate(36)" stroke="#7dbcf8"/><ellipse rx="116" ry="42" transform="rotate(96)" stroke="#83e0da" strokeOpacity=".7"/></g>
              <circle cx="170" cy="150" r="25" fill="#6bdbc7" fillOpacity=".14"/><circle cx="170" cy="150" r="10" fill="#91f3df"/><circle cx="264" cy="97" r="7" fill="#90f0d8"/><circle cx="89" cy="101" r="6" fill="#91c9ff"/><circle cx="158" cy="260" r="6" fill="#f7d391"/>
              <g fill="#c5e4ef" fontFamily="monospace" fontSize="14"><text x="244" y="34">F = ma</text><text x="25" y="263">v = u + at</text><text x="13" y="58">ΣF</text></g>
              <path d="M275 233l20 -40 18 40" stroke="#f7d391" strokeWidth="1.6" strokeLinejoin="round"/><path d="M275 233H313" stroke="#f7d391" strokeOpacity=".6"/>
            </svg>
          </div>
        </section>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {([
            ['search','ابحث وافهم','الشروحات والأمثلة',Search,'bg-[#e6f2ff] text-[#1557a3]'],
            ['formulas','بنك القوانين','القوانين والرموز',Calculator,'bg-[#eee9ff] text-[#6747b8]'],
            ['labs','مختبر فيشيا','محاكاة وتجارب',FlaskConical,'bg-[#dcf6ef] text-[#116c59]'],
            ['quiz','اختبر نفسك','تدريب ومراجعة',ClipboardCheck,'bg-[#fff1db] text-[#9b5a12]'],
          ] as const).map(([tab,title,subtitle,Icon,tone])=><button key={tab} type="button" onClick={()=>launchStudy(tab)} className="group text-right bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-teal-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500">
            <div className="flex items-start justify-between"><span className={`rounded-xl p-3 inline-flex ${tone}`}><Icon className="w-6 h-6" strokeWidth={1.8}/></span><ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-700"/></div>
            <h3 className="mt-4 font-black text-sm sm:text-base">{title}</h3><p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </button>)}
        </section>
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-teal-700 font-bold mb-1">مسار التعلّم</p><h2 className="text-xl sm:text-2xl font-black">اختار وحدتك</h2></div><span className="text-xs text-slate-500">وحدتان · {lessonItems.length} دروس</span></div>
          <div className="grid md:grid-cols-2 gap-4">
            {bookToc.map((unit,i)=>{const lessons=unit.items.filter(item=>item.type==='lesson');const done=lessons.filter(item=>completedIds.includes(item.id)).length;return <article key={unit.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className={`relative h-28 sm:h-32 p-5 flex items-center justify-between overflow-hidden ${i===0?'bg-[#dceefc] text-[#1b527d]':'bg-[#e0f3eb] text-[#176c55]'}`}>
                <div><p className="text-xs font-bold">الوحدة {unit.number}</p><h3 className="text-xl sm:text-2xl font-black mt-1">{unit.title.split(': ').at(-1)}</h3><p className="text-xs opacity-80 mt-1">{unit.englishTitle}</p></div>
                <svg viewBox="0 0 120 90" className="w-28 sm:w-36 h-full opacity-85" fill="none" aria-hidden="true">
                {i===0?<><path d="M15 76H109M23 82V8" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5"/><path d="M23 76L85 20M23 76L101 76" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M74 21L85 20L84 31M93 69L101 76L93 83" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M85 20V76" stroke="currentColor" strokeDasharray="4 4"/><path d="M44 76A21 21 0 0 0 38 61" stroke="currentColor" strokeWidth="1.5"/></>:<><path d="M10 77H111M15 80V10" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.5"/><path d="M19 75Q58 -14 105 75" stroke="currentColor" strokeWidth="3" strokeDasharray="5 5"/><circle cx="59" cy="31" r="7" fill="currentColor"/><path d="M59 31V58M54 52L59 59L64 52" stroke="currentColor" strokeWidth="2"/><path d="M22 72L37 50M28 51L37 50L37 59" stroke="currentColor" strokeWidth="2"/></>}
                </svg>
              </div>
              <div className="p-5 space-y-3"><div className="flex justify-between text-xs text-slate-500"><span>{lessons.length} دروس · الصفحات {unit.startPage}–{unit.endPage}</span><span>{done}/{lessons.length} مكتمل</span></div><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="bg-teal-500 h-full" style={{width:(100*done/Math.max(1,lessons.length))+'%'}}/></div>
              {lessons.map(item=><button key={item.id} type="button" onClick={()=>openPage(item.page)} className="w-full flex items-center justify-between gap-2 rounded-lg hover:bg-slate-50 py-2 text-sm text-right"><span className="flex gap-2 items-center"><CheckCircle2 className={`w-4 h-4 shrink-0 ${completedIds.includes(item.id)?'text-teal-600':'text-slate-300'}`}/>{item.title.replace(/^الدرس[^:]+:\s*/,'')}</span><ChevronLeft className="w-4 h-4 text-slate-400 shrink-0"/></button>)}
              <button type="button" onClick={()=>openPage(unit.startPage)} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold hover:border-teal-500">افتح الوحدة <ArrowLeft className="w-4 h-4 inline"/></button></div>
            </article>})}
          </div>
        </section>
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4"><div className="w-16 h-16 rounded-full grid place-items-center shrink-0" style={{background:`conic-gradient(#159b85 ${progress}%,#edf2f5 0)`}}><div className="w-[52px] h-[52px] rounded-full bg-white grid place-items-center font-black text-teal-800">{progress}%</div></div><div><h3 className="font-black">تقدّمك في الكتاب</h3><p className="text-xs text-slate-500 mt-1">أنجزت {completedLessons} من {lessonItems.length} دروس.</p></div></div>
          <button type="button" onClick={()=>launchStudy('bookmarks')} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 text-right hover:border-teal-500"><div className="bg-amber-50 text-amber-700 p-4 rounded-xl"><Bookmark className="w-6 h-6"/></div><div className="flex-1"><h3 className="font-black">محفوظاتي</h3><p className="text-xs text-slate-500 mt-1">{bookmarks.length} صفحات محفوظة للمراجعة</p></div><ChevronLeft className="w-5 h-5 text-slate-400"/></button>
        </section>
        <footer className="text-center text-xs text-slate-500 pb-4">فيشيا · تعلّم، جرّب، افهم.</footer>
      </main>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col bg-[#edf2f7] text-slate-900"
      data-testid="app-root"
      data-current-page={currentPage}
      data-teacher-mode={teacherMode ? 'on' : 'off'}
    >
      <div className="bg-[#112b49] text-white px-3 sm:px-5 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          <button type="button" onClick={goHome} className="inline-flex items-center gap-2 font-black text-sm"><Atom className="w-6 h-6 text-teal-300"/><span>فيشيا<span className="text-teal-300">.</span></span><Home className="w-4 h-4 text-slate-300"/></button>
          <span className="hidden sm:inline text-xs text-slate-300">مساحة القراءة التفاعلية</span>
          <button type="button" aria-pressed={focusMode} onClick={()=>setFocusMode(f=>!f)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 py-1.5 px-3 text-xs font-bold"><Focus className="w-4 h-4"/>{focusMode?'إظهار أدوات الدراسة':'وضع التركيز'}</button>
        </div>
      </div>
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
      <section dir="rtl" className={`bg-gradient-to-l from-[#173852] to-[#112b49] text-white px-3 sm:px-5 py-3 ${focusMode ? "hidden" : ""}`}>
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-sky-400/15 rounded-xl p-2.5"><BookOpen className="w-5 h-5 text-sky-300" /></div>
            <div><p className="font-extrabold text-sm sm:text-base">فيشيا | مختبر الفيزياء</p><p className="text-xs text-slate-300 mt-0.5">الصف العاشر · الفصل الأول</p></div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {([
              ['search', 'بحث', Search], ['formulas', 'بنك القوانين', Calculator], ['labs','المختبر',FlaskConical], ['quiz', 'اختبر نفسك', ClipboardCheck], ['bookmarks', 'محفوظاتي', Bookmark]
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
              <div><p className="text-xs text-sky-700 font-bold">مركز الدراسة</p><h2 className="text-lg font-black">{({search:'ابحث في الكتاب',bookmarks:'الصفحات المحفوظة',formulas:'بنك القوانين',quiz:'اختبر نفسك',labs:'مختبر فيشيا'})[studyTab]}</h2></div>
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
              {studyTab === 'labs' && <>
                <p className="text-sm text-slate-600">اختر تجربة من الكتاب وغيّر المتغيرات لملاحظة أثرها في المحاكاة.</p>
                <div className="grid sm:grid-cols-2 gap-3">{labEntries.map(h=><button key={h.id} type="button" onClick={()=>openTopic(h)} className="text-right border border-slate-200 hover:border-teal-500 rounded-2xl p-4 bg-white"><div className="flex items-center justify-between"><span className="bg-teal-50 rounded-xl p-3 text-teal-700"><FlaskConical className="w-6 h-6"/></span><span className="text-xs text-slate-500">ص {h.page}</span></div><h3 className="font-black text-sm mt-3">{h.title}</h3><span className="text-xs text-teal-700 font-bold inline-flex items-center gap-1 mt-3"><PlayCircle className="w-4 h-4"/> افتح المحاكاة</span></button>)}</div>
                {!labEntries.length && <p className="text-sm text-slate-500">لا توجد محاكاة متاحة.</p>}
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
      <div className={`bg-white/95 border-b border-slate-200 px-3 sm:px-5 py-2 ${focusMode ? "hidden" : ""}`}>
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
        <main className="flex-1 min-w-0 overflow-auto px-3 sm:px-6 py-5 flex flex-col items-center">
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
