import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Flame,
  HelpCircle,
  Home,
  Layers,
  Moon,
  Play,
  RotateCcw,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  CARDS,
  Card,
  COURSE_META,
  DIAGRAMS,
  LESSON_GALLERIES,
  LESSON_SECTIONS,
  MIND_MAPS,
  TOPICS,
} from './data/content';
import {
  buildExplanation,
  buildMemoryTip,
  checkTypedAnswer,
  pickQs,
  QuizQuestion,
  shuffleArray,
} from './lib/quiz';
import {
  computeStreak,
  playBeep,
  useAppStore,
} from './lib/store';
import {
  Badge,
  Button,
  CatWatermark,
  computeTopicStats,
  ConfirmModal,
  ProgressBar,
  SaveButton,
  VisualGuidesSection,
} from './ui';

type PageId =
  | 'home'
  | 'reviewer'
  | 'flashcards'
  | 'quiz'
  | 'mistakes'
  | 'saved'
  | 'search'
  | 'settings';

interface AnsweredRecord {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizSession {
  modeLabel: string;
  topicId: string;
  mistakesOnly: boolean;
  questions: QuizQuestion[];
  currentIndex: number;
  selectedOption: string;
  typedInput: string;
  showHint: boolean;
  submitted: boolean;
  lastCorrect: boolean;
  startedAt: number;
  finishedAt: number | null;
  answers: AnsweredRecord[];
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

export function App() {
  const {
    state,
    setName,
    setTheme,
    toggleSound,
    toggleAnimations,
    markTopicVisited,
    toggleTopicBookmark,
    toggleCardBookmark,
    setFlashcardStatus,
    recordAnswer,
    addQuizHistory,
    resetProgress,
    resetQuizHistory,
  } = useAppStore();

  const [page, setPage] = useState<PageId>('home');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Flashcards state
  const [deckFilter, setDeckFilter] = useState<string>('all');
  const [deckOrder, setDeckOrder] = useState<string[]>(() =>
    CARDS.map((c) => c.id)
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz setup & active session
  const [quizTopicId, setQuizTopicId] = useState<string>('all');
  const [quizCount, setQuizCount] = useState<number>(10);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Settings modals
  const [confirmModal, setConfirmModal] = useState<
    null | 'progress' | 'history'
  >(null);

  const topicMap = useMemo(
    () => new Map(TOPICS.map((t) => [t.id, t])),
    []
  );
  const cardMap = useMemo(() => new Map(CARDS.map((c) => [c.id, c])), []);

  const streak = useMemo(
    () => computeStreak(state.streakDays),
    [state.streakDays]
  );
  const mistakesList = useMemo(
    () =>
      Object.values(state.mistakes).sort((a, b) => b.timestamp - a.timestamp),
    [state.mistakes]
  );

  // Overall progress metrics
  const overallStats = useMemo(() => {
    const total = CARDS.length;
    let boxSum = 0;
    let attempts = 0;
    let correct = 0;
    let known = 0;
    let mastered = 0;
    for (const c of CARDS) {
      const m = state.mastery[c.id];
      if (m) {
        boxSum += m.box;
        attempts += m.attempts;
        correct += m.correct;
        if (m.box >= 4) mastered++;
      }
      if (state.flashcards[c.id] === 'known') known++;
    }
    const pct =
      total > 0
        ? Math.round(Math.max((boxSum / (total * 4)) * 100, (known / total) * 50))
        : 0;
    return { total, pct, attempts, correct, known, mastered };
  }, [state.mastery, state.flashcards]);

  const topicStatsList = useMemo(
    () =>
      TOPICS.map((t) => ({
        topic: t,
        stats: computeTopicStats(t, CARDS, state),
      })),
    [state]
  );

  const weakestTopic = useMemo(() => {
    const sorted = [...topicStatsList].sort(
      (a, b) => a.stats.progressPct - b.stats.progressPct
    );
    return sorted[0]?.topic ?? TOPICS[0];
  }, [topicStatsList]);

  const continueTopic = useMemo(() => {
    if (state.progress.lastTopicId && topicMap.has(state.progress.lastTopicId)) {
      return topicMap.get(state.progress.lastTopicId)!;
    }
    return TOPICS[0];
  }, [state.progress.lastTopicId, topicMap]);

  // Navigation helpers
  const openReviewerTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicId(topicId);
      markTopicVisited(topicId);
      setPage('reviewer');
    },
    [markTopicVisited]
  );

  const openFlashcards = useCallback(
    (filter: string, focusCardId?: string) => {
      const filtered =
        filter === 'all'
          ? CARDS
          : filter === 'saved'
          ? CARDS.filter((c) => state.bookmarks.cards.includes(c.id))
          : CARDS.filter((c) => c.topic === filter);
      const ids = filtered.map((c) => c.id);
      setDeckFilter(filter);
      setDeckOrder(ids);
      const targetIdx = focusCardId ? Math.max(0, ids.indexOf(focusCardId)) : 0;
      setCardIndex(targetIdx);
      setFlipped(false);
      setPage('flashcards');
    },
    [state.bookmarks.cards]
  );

  const startQuiz = useCallback(
    (opts: {
      topicId: string;
      count: number;
      mistakesOnly?: boolean;
      modeLabel: string;
    }) => {
      const qs = pickQs({
        cards: CARDS,
        topics: TOPICS,
        mastery: state.mastery,
        mistakes: state.mistakes,
        count: opts.count,
        topicId: opts.topicId,
        mistakesOnly: opts.mistakesOnly,
      });
      if (qs.length === 0) return;
      setQuizTopicId(opts.topicId);
      setQuizSession({
        modeLabel: opts.modeLabel,
        topicId: opts.topicId,
        mistakesOnly: Boolean(opts.mistakesOnly),
        questions: qs,
        currentIndex: 0,
        selectedOption: '',
        typedInput: '',
        showHint: false,
        submitted: false,
        lastCorrect: false,
        startedAt: Date.now(),
        finishedAt: null,
        answers: [],
      });
      setPage('quiz');
    },
    [state.mastery, state.mistakes]
  );

  // Sync flashcard deck when filter changes
  const activeDeck = useMemo(() => {
    const allowed = new Set(
      (deckFilter === 'all'
        ? CARDS
        : deckFilter === 'saved'
        ? CARDS.filter((c) => state.bookmarks.cards.includes(c.id))
        : CARDS.filter((c) => c.topic === deckFilter)
      ).map((c) => c.id)
    );
    const ordered = deckOrder
      .filter((id) => allowed.has(id))
      .map((id) => cardMap.get(id))
      .filter((c): c is Card => Boolean(c));
    if (ordered.length > 0) return ordered;
    return CARDS.filter((c) => allowed.has(c.id));
  }, [deckFilter, deckOrder, state.bookmarks.cards, cardMap]);

  const currentFlashcard =
    activeDeck[Math.min(cardIndex, Math.max(0, activeDeck.length - 1))] ?? null;

  const handleDeckFilterChange = (nextFilter: string) => {
    const filtered =
      nextFilter === 'all'
        ? CARDS
        : nextFilter === 'saved'
        ? CARDS.filter((c) => state.bookmarks.cards.includes(c.id))
        : CARDS.filter((c) => c.topic === nextFilter);
    setDeckFilter(nextFilter);
    setDeckOrder(filtered.map((c) => c.id));
    setCardIndex(0);
    setFlipped(false);
  };

  const handleShuffleDeck = () => {
    const shuffled = shuffleArray(activeDeck.map((c) => c.id));
    setDeckOrder(shuffled);
    setCardIndex(0);
    setFlipped(false);
  };

  const goFlashcard = useCallback(
    (delta: number) => {
      if (activeDeck.length === 0) return;
      setCardIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return activeDeck.length - 1;
        if (next >= activeDeck.length) return 0;
        return next;
      });
      setFlipped(false);
    },
    [activeDeck.length]
  );

  // Keyboard shortcuts for Flashcards
  useEffect(() => {
    if (page !== 'flashcards' || activeDeck.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        if (tag === 'BUTTON') return;
        e.preventDefault();
        playBeep(state.settings.sound, 'flip');
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goFlashcard(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goFlashcard(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [page, activeDeck.length, goFlashcard, state.settings.sound]);

  // Quiz answer submission
  const idInputRef = useRef<HTMLInputElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (page !== 'quiz' || !quizSession || quizSession.finishedAt) return;
    if (quizSession.submitted) {
      nextBtnRef.current?.focus();
    } else if (quizSession.questions[quizSession.currentIndex]?.type === 'id') {
      idInputRef.current?.focus();
    }
  }, [page, quizSession?.currentIndex, quizSession?.submitted, quizSession?.finishedAt]);

  const submitQuizAnswer = (forcedOption?: string) => {
    if (!quizSession || quizSession.submitted) return;
    const q = quizSession.questions[quizSession.currentIndex];
    if (!q) return;

    const userAnswer =
      q.type === 'id'
        ? quizSession.typedInput.trim()
        : forcedOption ?? quizSession.selectedOption;

    if (!userAnswer) return;

    const isCorrect =
      q.type === 'id'
        ? checkTypedAnswer(userAnswer, q.card)
        : userAnswer === q.card.back;

    playBeep(state.settings.sound, isCorrect ? 'correct' : 'wrong');

    recordAnswer({
      cardId: q.card.id,
      topic: q.card.topic,
      isCorrect,
      userAnswer,
      correctAnswer: q.card.back,
      explanation: buildExplanation(q.card),
    });

    setQuizSession((prev) =>
      prev
        ? {
            ...prev,
            selectedOption: q.type === 'id' ? '' : userAnswer,
            submitted: true,
            lastCorrect: isCorrect,
            answers: [
              ...prev.answers,
              { question: q, userAnswer, isCorrect },
            ],
          }
        : null
    );
  };

  const advanceQuiz = () => {
    if (!quizSession) return;
    const nextIdx = quizSession.currentIndex + 1;
    if (nextIdx >= quizSession.questions.length) {
      const finishedAt = Date.now();
      const durationSec = Math.max(
        1,
        Math.round((finishedAt - quizSession.startedAt) / 1000)
      );
      const breakdown: Record<string, { correct: number; total: number }> = {};
      let correctCount = 0;
      for (const a of quizSession.answers) {
        const tid = a.question.card.topic;
        if (!breakdown[tid]) breakdown[tid] = { correct: 0, total: 0 };
        breakdown[tid].total++;
        if (a.isCorrect) {
          breakdown[tid].correct++;
          correctCount++;
        }
      }
      addQuizHistory({
        id: `q-${finishedAt}`,
        date: new Date(finishedAt).toISOString(),
        mode: quizSession.modeLabel,
        topicId: quizSession.topicId,
        total: quizSession.questions.length,
        correct: correctCount,
        durationSec,
        topicBreakdown: breakdown,
      });
      setQuizSession((prev) => (prev ? { ...prev, finishedAt } : null));
    } else {
      setQuizSession((prev) =>
        prev
          ? {
              ...prev,
              currentIndex: nextIdx,
              selectedOption: '',
              typedInput: '',
              showHint: false,
              submitted: false,
              lastCorrect: false,
            }
          : null
      );
    }
  };

  const navItems: Array<{
    id: PageId;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Home', mobileLabel: 'Home', icon: Home },
    { id: 'reviewer', label: 'Reviewer', mobileLabel: 'Reviewer', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', mobileLabel: 'Cards', icon: Layers },
    { id: 'quiz', label: 'Quiz', mobileLabel: 'Quiz', icon: Sparkles },
    {
      id: 'mistakes',
      label: 'My Mistakes',
      mobileLabel: 'Mistakes',
      icon: AlertCircle,
      badge: mistakesList.length || undefined,
    },
    {
      id: 'saved',
      label: 'Saved',
      mobileLabel: 'Saved',
      icon: Bookmark,
      badge:
        state.bookmarks.topics.length + state.bookmarks.cards.length ||
        undefined,
    },
    { id: 'search', label: 'Search', mobileLabel: 'Search', icon: SearchIcon },
    {
      id: 'settings',
      label: 'Settings',
      mobileLabel: 'Settings',
      icon: SettingsIcon,
    },
  ];

  const mobileBottomItems = navItems.slice(0, 6);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-rose-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop Sidebar */}
        <aside
          aria-label="Primary navigation"
          className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white/80 px-4 py-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 md:flex"
        >
          <div className="px-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-sm font-bold text-white shadow-sm">
                ♡
              </span>
              <div>
                <p className="text-sm font-bold tracking-tight text-stone-900 dark:text-zinc-100">
                  {COURSE_META.appName}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {COURSE_META.courseTitle}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-800 dark:text-zinc-200">
                Daily Streak
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <Flame className="h-3.5 w-3.5" />
                {streak} {streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-85">
              {overallStats.mastered} / {overallStats.total} cards mastered
            </p>
          </div>
        </aside>

        {/* Main Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
            <button
              type="button"
              onClick={() => setPage('home')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold text-white">
                ♡
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">
                  {COURSE_META.appName}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {COURSE_META.courseTitle}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setPage('search')}
                className={`rounded-xl p-2 cursor-pointer ${
                  page === 'search'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <SearchIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Settings"
                onClick={() => setPage('settings')}
                className={`rounded-xl p-2 cursor-pointer ${
                  page === 'settings'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main
            id="main-content"
            className="relative z-10 flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-12"
          >
            {/* ==================== 1. HOME ==================== */}
            {page === 'home' && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {COURSE_META.subtitle}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      Welcome back, {state.name} ♡
                    </h1>
                    <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                      You got this! Review concepts, flip cards, and test yourself with spaced practice.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 dark:border-rose-900/60 dark:bg-rose-950/40 sm:self-center">
                    <Flame className="h-6 w-6 text-rose-500 dark:text-rose-400" />
                    <div>
                      <p className="text-lg font-bold leading-none text-rose-700 dark:text-rose-300">
                        {streak} {streak === 1 ? 'day' : 'days'}
                      </p>
                      <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-300/80">
                        Study streak
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                      <Badge tone="sky">Continue Reviewing</Badge>
                      <h2 className="mt-3 text-base font-semibold">
                        {continueTopic.title}
                      </h2>
                      <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                        {continueTopic.subject} · {continueTopic.level}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-4 w-full"
                      onClick={() => openReviewerTopic(continueTopic.id)}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Open Reviewer</span>
                    </Button>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                      <Badge tone={mistakesList.length > 0 ? 'amber' : 'rose'}>
                        Recommended
                      </Badge>
                      {mistakesList.length > 0 ? (
                        <>
                          <h2 className="mt-3 text-base font-semibold">
                            Clear {mistakesList.length} missed{' '}
                            {mistakesList.length === 1 ? 'question' : 'questions'}
                          </h2>
                          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                            Questions leave My Mistakes once you answer them correctly.
                          </p>
                        </>
                      ) : (
                        <>
                          <h2 className="mt-3 text-base font-semibold">
                            Strengthen: {weakestTopic.title}
                          </h2>
                          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                            Lowest current mastery ({weakestTopic.level})
                          </p>
                        </>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-4 w-full"
                      onClick={() =>
                        mistakesList.length > 0
                          ? setPage('mistakes')
                          : openReviewerTopic(weakestTopic.id)
                      }
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {mistakesList.length > 0
                          ? 'Review Mistakes'
                          : 'Study Weakest Topic'}
                      </span>
                    </Button>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/30">
                    <div>
                      <Badge tone="rose">Today&apos;s Review</Badge>
                      <h2 className="mt-3 text-base font-semibold">
                        10 questions · about 5 min
                      </h2>
                      <p className="mt-1 text-xs text-stone-600 dark:text-zinc-300">
                        Prioritizes past mistakes and low-mastery cards due for review.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      className="mt-4 w-full"
                      onClick={() =>
                        startQuiz({
                          topicId: 'all',
                          count: 10,
                          modeLabel: "Today's Review",
                        })
                      }
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Today&apos;s Review</span>
                    </Button>
                  </div>
                </div>

                {/* Overall Progress */}
                <section
                  aria-labelledby="overall-progress-heading"
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2
                        id="overall-progress-heading"
                        className="text-base font-semibold"
                      >
                        Overall Progress
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        {overallStats.mastered} of {overallStats.total} cards mastered ·{' '}
                        {overallStats.correct}/{overallStats.attempts} quiz answers correct ·{' '}
                        {overallStats.known} flashcards known
                      </p>
                    </div>
                    <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                      {overallStats.pct}%
                    </span>
                  </div>
                  <ProgressBar
                    value={overallStats.pct}
                    label="Overall study progress"
                    className="mt-3"
                  />
                </section>

                {/* Topics Grid */}
                <section aria-labelledby="topics-heading" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 id="topics-heading" className="text-lg font-semibold">
                      Study Topics ({TOPICS.length})
                    </h2>
                    <span className="text-xs text-stone-500 dark:text-zinc-400">
                      {CARDS.length} total cards
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {topicStatsList.map(({ topic, stats }) => (
                      <article
                        key={topic.id}
                        className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                {topic.subject} · {topic.level}
                              </p>
                              {topic.meta && (
                                <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                                  {topic.meta}
                                </p>
                              )}
                            </div>
                            <Badge
                              tone={
                                stats.progressPct >= 80
                                  ? 'emerald'
                                  : stats.progressPct > 0
                                  ? 'rose'
                                  : 'neutral'
                              }
                            >
                              {stats.progressPct}% · {stats.masteryLabel}
                            </Badge>
                          </div>

                          <h3 className="mt-2 text-base font-semibold text-stone-900 dark:text-zinc-100">
                            {topic.title}
                          </h3>

                          <ProgressBar
                            value={stats.progressPct}
                            label={`${topic.title} mastery progress`}
                            className="mt-3"
                          />

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-zinc-400">
                            <span>
                              Questions: {stats.correct}/{stats.attempts} correct
                            </span>
                            <span>
                              Flashcards known: {stats.knownCards}/{stats.totalCards}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openReviewerTopic(topic.id)}
                          >
                            Review
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openFlashcards(topic.id)}
                          >
                            Cards
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              startQuiz({
                                topicId: topic.id,
                                count: Math.min(10, stats.totalCards),
                                modeLabel: topic.title,
                              })
                            }
                          >
                            Quiz
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ==================== 2. REVIEWER ==================== */}
            {page === 'reviewer' && (
              <div className="space-y-6">
                {selectedTopicId && topicMap.has(selectedTopicId) ? (
                  (() => {
                    const topic = topicMap.get(selectedTopicId)!;
                    const topicCards = CARDS.filter(
                      (c) => c.topic === topic.id
                    );
                    const isSaved = state.bookmarks.topics.includes(topic.id);
                    return (
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTopicId(null)}
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>All Topics</span>
                          </Button>
                          <div className="flex flex-wrap items-center gap-2">
                            <SaveButton
                              saved={isSaved}
                              onToggle={() => toggleTopicBookmark(topic.id)}
                              label={
                                isSaved
                                  ? `Remove ${topic.title} from saved`
                                  : `Save ${topic.title}`
                              }
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openFlashcards(topic.id)}
                            >
                              <Layers className="h-4 w-4" />
                              <span>Flashcards</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                startQuiz({
                                  topicId: topic.id,
                                  count: Math.min(10, topicCards.length),
                                  modeLabel: `Quick Practice · ${topic.level}`,
                                })
                              }
                            >
                              <Play className="h-4 w-4" />
                              <span>Quick Practice</span>
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                            {topic.subject} · {topic.level}
                          </p>
                          {topic.meta && (
                            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                              {topic.meta}
                            </p>
                          )}
                          <h1 className="mt-2 text-2xl font-bold tracking-tight">
                            {topic.title}
                          </h1>
                          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-zinc-300">
                            {topic.intro}
                          </p>

                          {/* Remember This Highlight Box */}
                          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                              Remember This
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-stone-800 dark:text-zinc-200">
                              {topic.remember}
                            </p>
                          </div>

                          {/* Amber Note on your source Box */}
                          {topic.note && (
                            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800/70 dark:bg-amber-950/35">
                              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                Note on your source
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                                {topic.note}
                              </p>
                            </div>
                          )}
                        </div>

                        <VisualGuidesSection
                          diagrams={DIAGRAMS.filter(
                            (d) => d.topic === topic.id
                          )}
                          mindMaps={MIND_MAPS.filter(
                            (m) => m.topic === topic.id
                          )}
                          lessonGalleries={LESSON_GALLERIES.filter(
                            (g) => g.topic === topic.id
                          )}
                          lessonSections={LESSON_SECTIONS.filter(
                            (s) => s.topic === topic.id
                          )}
                        />

                        {/* Important Terms */}
                        <section
                          aria-labelledby="important-terms-heading"
                          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="flex items-center justify-between">
                            <h2
                              id="important-terms-heading"
                              className="text-lg font-semibold"
                            >
                              Important Terms ({topicCards.length})
                            </h2>
                          </div>

                          <ul className="mt-4 divide-y divide-stone-200 dark:divide-zinc-800">
                            {topicCards.map((card, idx) => {
                              const cardSaved = state.bookmarks.cards.includes(
                                card.id
                              );
                              return (
                                <li
                                  key={idx}
                                  className="py-4 first:pt-0 last:pb-0"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1.5">
                                      {card.tf ? (
                                        <>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                              tone={
                                                card.back === 'True'
                                                  ? 'emerald'
                                                  : 'amber'
                                              }
                                            >
                                              {card.back === 'True'
                                                ? '✓ True'
                                                : '✗ False'}
                                            </Badge>
                                            <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                              {card.front}
                                            </span>
                                          </div>
                                          <p className="text-sm text-stone-600 dark:text-zinc-400">
                                            → {card.why ?? card.back}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                              {card.term}
                                            </span>
                                            {card.alt && card.alt.length > 0 && (
                                              <span className="text-xs text-stone-500 dark:text-zinc-400">
                                                (also: {card.alt.join(', ')})
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm leading-relaxed text-stone-700 dark:text-zinc-300">
                                            →{' '}
                                            {card.front.includes('________') ? (
                                              <>
                                                {card.front.split('________')[0]}
                                                <strong className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                                                  {card.back}
                                                </strong>
                                                {card.front.split('________')[1]}
                                              </>
                                            ) : (
                                              <>
                                                {card.front}{' '}
                                                <strong className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                                                  {card.back}
                                                </strong>
                                              </>
                                            )}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleCardBookmark(card.id)}
                                      aria-label={
                                        cardSaved
                                          ? `Unsave ${card.term}`
                                          : `Save ${card.term}`
                                      }
                                      aria-pressed={cardSaved}
                                      className={`shrink-0 rounded-xl p-2 transition-colors cursor-pointer ${
                                        cardSaved
                                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                                          : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                                      }`}
                                    >
                                      <Bookmark
                                        className="h-4 w-4"
                                        fill={cardSaved ? 'currentColor' : 'none'}
                                      />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        Study Reviewer
                      </h1>
                      <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                        Select a topic to read its summary, key takeaways, source notes, and terms.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {TOPICS.map((topic) => {
                        const count = CARDS.filter(
                          (c) => c.topic === topic.id
                        ).length;
                        const diagramCount =
                          DIAGRAMS.filter((d) => d.topic === topic.id).length +
                          LESSON_GALLERIES.filter((g) => g.topic === topic.id)
                            .length +
                          LESSON_SECTIONS.filter((s) => s.topic === topic.id)
                            .length;
                        const saved = state.bookmarks.topics.includes(topic.id);
                        return (
                          <article
                            key={topic.id}
                            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                  {topic.subject} · {topic.level}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {diagramCount > 0 && (
                                    <Badge tone="rose">
                                      {diagramCount}{' '}
                                      {diagramCount === 1
                                        ? 'diagram'
                                        : 'diagrams'}
                                    </Badge>
                                  )}
                                  <Badge>{count} terms</Badge>
                                </div>
                              </div>
                              <h2 className="mt-2 text-lg font-semibold">
                                {topic.title}
                              </h2>
                              {topic.meta && (
                                <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                                  {topic.meta}
                                </p>
                              )}
                              <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-zinc-400">
                                {topic.intro}
                              </p>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openReviewerTopic(topic.id)}
                                >
                                  Open Lesson
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openFlashcards(topic.id)}
                                >
                                  Flashcards
                                </Button>
                              </div>
                              <SaveButton
                                saved={saved}
                                onToggle={() => toggleTopicBookmark(topic.id)}
                                label={
                                  saved
                                    ? `Unsave ${topic.title}`
                                    : `Save ${topic.title}`
                                }
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== 3. FLASHCARDS ==================== */}
            {page === 'flashcards' && (
              <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Flashcards
                    </h1>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                      Click a card or press Space to flip · Arrow keys for Prev/Next
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="deck-select" className="sr-only">
                      Select flashcard deck
                    </label>
                    <select
                      id="deck-select"
                      value={deckFilter}
                      onChange={(e) => handleDeckFilterChange(e.target.value)}
                      className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="all">
                        All Topics ({CARDS.length})
                      </option>
                      {TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.level}: {t.title}
                        </option>
                      ))}
                      <option value="saved">
                        Saved Cards ({state.bookmarks.cards.length})
                      </option>
                    </select>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleShuffleDeck}
                      disabled={activeDeck.length < 2}
                    >
                      <Shuffle className="h-4 w-4" />
                      <span>Shuffle</span>
                    </Button>
                  </div>
                </div>

                {activeDeck.length === 0 || !currentFlashcard ? (
                  <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-base font-medium">
                      No flashcards in this deck yet.
                    </p>
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => handleDeckFilterChange('all')}
                    >
                      View All Cards
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-zinc-400">
                        <span>
                          Card {cardIndex + 1} / {activeDeck.length}
                        </span>
                        <span>
                          {
                            activeDeck.filter(
                              (c) => state.flashcards[c.id] === 'known'
                            ).length
                          }{' '}
                          known in deck
                        </span>
                      </div>
                      <ProgressBar
                        value={cardIndex + 1}
                        max={activeDeck.length}
                        label="Flashcard deck progress"
                      />
                    </div>

                    {/* Flip Card */}
                    <div className="perspective-1000">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={flipped}
                        aria-label={
                          flipped
                            ? `Flashcard back: ${currentFlashcard.back}. Click or press Space to show clue.`
                            : `Flashcard front: ${currentFlashcard.front}. Click or press Space to reveal answer.`
                        }
                        onClick={() => {
                          playBeep(state.settings.sound, 'flip');
                          setFlipped((f) => !f);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.code === 'Space') {
                            e.preventDefault();
                            e.stopPropagation();
                            playBeep(state.settings.sound, 'flip');
                            setFlipped((f) => !f);
                          }
                        }}
                        className={`preserve-3d relative min-h-[290px] w-full cursor-pointer rounded-3xl transition-transform duration-500 ${
                          flipped ? 'rotate-y-180' : ''
                        }`}
                      >
                        {/* Front */}
                        <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge tone="rose">
                              {topicMap.get(currentFlashcard.topic)?.level ??
                                currentFlashcard.topic}
                            </Badge>
                            {state.flashcards[currentFlashcard.id] ===
                            'known' ? (
                              <Badge tone="emerald">✓ Known</Badge>
                            ) : state.flashcards[currentFlashcard.id] ===
                              'review' ? (
                              <Badge tone="amber">Review Again</Badge>
                            ) : (
                              <Badge>Clue</Badge>
                            )}
                          </div>
                          <div className="my-auto py-4 text-center">
                            {currentFlashcard.tf && (
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                                True or False Statement
                              </p>
                            )}
                            <p className="text-lg font-medium leading-relaxed text-stone-900 dark:text-zinc-100 sm:text-xl">
                              {currentFlashcard.front}
                            </p>
                          </div>
                          <p className="text-center text-xs text-stone-400 dark:text-zinc-500">
                            Click or press Space to flip
                          </p>
                        </div>

                        {/* Back */}
                        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm dark:border-rose-900/60 dark:bg-zinc-900 sm:p-8">
                          <div className="flex items-center justify-between">
                            <Badge tone="emerald">Answer</Badge>
                            <span className="text-xs text-stone-500 dark:text-zinc-400">
                              {currentFlashcard.term}
                            </span>
                          </div>
                          <div className="my-auto space-y-3 py-4 text-center">
                            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 sm:text-2xl">
                              {currentFlashcard.back}
                            </p>
                            {currentFlashcard.alt &&
                              currentFlashcard.alt.length > 0 && (
                                <p className="text-xs text-stone-500 dark:text-zinc-400">
                                  Also accepted: {currentFlashcard.alt.join(', ')}
                                </p>
                              )}
                            {currentFlashcard.why && (
                              <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white/80 p-3 text-left text-sm text-stone-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
                                <span className="font-semibold">Why: </span>
                                {currentFlashcard.why}
                              </div>
                            )}
                          </div>
                          <p className="text-center text-xs text-stone-400 dark:text-zinc-500">
                            Click or press Space to flip back
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => goFlashcard(-1)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Prev</span>
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => goFlashcard(1)}
                        >
                          <span>Next</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <SaveButton
                          saved={state.bookmarks.cards.includes(
                            currentFlashcard.id
                          )}
                          onToggle={() =>
                            toggleCardBookmark(currentFlashcard.id)
                          }
                          label="Bookmark flashcard"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setFlashcardStatus(currentFlashcard.id, 'review');
                            goFlashcard(1);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Review Again</span>
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            playBeep(state.settings.sound, 'correct');
                            setFlashcardStatus(currentFlashcard.id, 'known');
                            goFlashcard(1);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>I Know This</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================== 4. QUIZ ==================== */}
            {page === 'quiz' && (
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Setup View */}
                {!quizSession && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        Quiz Practice
                      </h1>
                      <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                        Mix of multiple choice, identification, and true/false questions powered by spaced review.
                      </p>
                    </div>

                    <div className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                      <div>
                        <label
                          htmlFor="quiz-topic-select"
                          className="block text-sm font-medium text-stone-700 dark:text-zinc-300"
                        >
                          Topic
                        </label>
                        <select
                          id="quiz-topic-select"
                          value={quizTopicId}
                          onChange={(e) => setQuizTopicId(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          <option value="all">
                            All Topics ({CARDS.length} cards)
                          </option>
                          {TOPICS.map((t) => {
                            const c = CARDS.filter(
                              (card) => card.topic === t.id
                            ).length;
                            return (
                              <option key={t.id} value={t.id}>
                                {t.level} — {t.title} ({c})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-stone-700 dark:text-zinc-300">
                          Number of Questions
                        </span>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {[5, 10, 15, 20].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setQuizCount(n)}
                              aria-pressed={quizCount === n}
                              className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                                quizCount === n
                                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {n} Qs
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          variant="primary"
                          onClick={() =>
                            startQuiz({
                              topicId: quizTopicId,
                              count: quizCount,
                              modeLabel:
                                quizTopicId === 'all'
                                  ? 'Custom Quiz'
                                  : topicMap.get(quizTopicId)?.title ?? 'Quiz',
                            })
                          }
                        >
                          <Play className="h-4 w-4" />
                          <span>Start Quiz</span>
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() =>
                            startQuiz({
                              topicId: 'all',
                              count: 10,
                              modeLabel: "Today's Review",
                            })
                          }
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Today&apos;s Review (10)</span>
                        </Button>

                        <Button
                          variant="secondary"
                          disabled={mistakesList.length === 0}
                          onClick={() =>
                            startQuiz({
                              topicId: 'all',
                              count: Math.max(10, mistakesList.length),
                              mistakesOnly: true,
                              modeLabel: 'My Mistakes',
                            })
                          }
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>My Mistakes ({mistakesList.length})</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Question View */}
                {quizSession && !quizSession.finishedAt && (
                  (() => {
                    const q = quizSession.questions[quizSession.currentIndex];
                    const topic = topicMap.get(q.card.topic);
                    const total = quizSession.questions.length;
                    const typeLabel =
                      q.type === 'mc'
                        ? 'Multiple Choice'
                        : q.type === 'tf'
                        ? 'True or False'
                        : 'Identification';
                    const cardSaved = state.bookmarks.cards.includes(q.card.id);

                    return (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tone="rose">{typeLabel}</Badge>
                            <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                              {topic?.level} · {quizSession.modeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <SaveButton
                              saved={cardSaved}
                              onToggle={() => toggleCardBookmark(q.card.id)}
                              label="Save question card"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuizSession(null)}
                            >
                              Quit
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-stone-600 dark:text-zinc-400">
                            <span>
                              Question {quizSession.currentIndex + 1} of {total}
                            </span>
                            <span>
                              {
                                quizSession.answers.filter((a) => a.isCorrect)
                                  .length
                              }{' '}
                              correct so far
                            </span>
                          </div>
                          <ProgressBar
                            value={quizSession.currentIndex + 1}
                            max={total}
                            label="Quiz progress"
                          />
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold leading-relaxed text-stone-900 dark:text-zinc-100">
                              {q.card.front}
                            </h2>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setQuizSession((prev) =>
                                  prev
                                    ? { ...prev, showHint: !prev.showHint }
                                    : null
                                )
                              }
                              aria-expanded={quizSession.showHint}
                            >
                              <HelpCircle className="h-4 w-4" />
                              <span>Hint</span>
                            </Button>
                          </div>

                          {quizSession.showHint && (
                            <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-medium text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
                              {q.hint}
                            </p>
                          )}

                          {/* MC or TF Options */}
                          {(q.type === 'mc' || q.type === 'tf') && (
                            <div className="mt-5 space-y-2.5">
                              {q.options.map((opt, i) => {
                                const isChosen =
                                  quizSession.selectedOption === opt;
                                const isCorrectOpt = opt === q.card.back;

                                let optionClasses =
                                  'border-stone-200 bg-white hover:border-rose-300 hover:bg-rose-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-rose-700 dark:hover:bg-rose-950/30';
                                let marker: React.ReactNode = null;

                                if (quizSession.submitted) {
                                  if (isCorrectOpt) {
                                    optionClasses =
                                      'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100';
                                    marker = (
                                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        ✓ (correct)
                                      </span>
                                    );
                                  } else if (isChosen) {
                                    optionClasses =
                                      'border-red-500 bg-red-50 text-red-950 dark:border-red-500 dark:bg-red-950/50 dark:text-red-100';
                                    marker = (
                                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300">
                                        ✗ (your answer)
                                      </span>
                                    );
                                  } else {
                                    optionClasses =
                                      'border-stone-200 bg-stone-50/60 opacity-65 dark:border-zinc-800 dark:bg-zinc-950/50';
                                  }
                                } else if (isChosen) {
                                  optionClasses =
                                    'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-950/40';
                                }

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={quizSession.submitted}
                                    onClick={() => submitQuizAnswer(opt)}
                                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${optionClasses}`}
                                  >
                                    <span className="flex items-center gap-3">
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current/20 text-xs font-semibold">
                                        {String.fromCharCode(65 + i)}
                                      </span>
                                      <span>{opt}</span>
                                    </span>
                                    {marker}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Identification Input */}
                          {q.type === 'id' && (
                            <form
                              className="mt-5 flex flex-col gap-3 sm:flex-row"
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (quizSession.submitted) {
                                  advanceQuiz();
                                } else {
                                  submitQuizAnswer();
                                }
                              }}
                            >
                              <label htmlFor="id-answer-input" className="sr-only">
                                Type your answer
                              </label>
                              <input
                                ref={idInputRef}
                                id="id-answer-input"
                                type="text"
                                disabled={quizSession.submitted}
                                value={quizSession.typedInput}
                                onChange={(e) =>
                                  setQuizSession((prev) =>
                                    prev
                                      ? { ...prev, typedInput: e.target.value }
                                      : null
                                  )
                                }
                                placeholder="Type your answer..."
                                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                              />
                              {!quizSession.submitted && (
                                <Button
                                  type="submit"
                                  variant="primary"
                                  disabled={!quizSession.typedInput.trim()}
                                >
                                  Submit Answer
                                </Button>
                              )}
                            </form>
                          )}

                          {/* Instant Feedback */}
                          {quizSession.submitted && (
                            <div
                              role="status"
                              aria-live="polite"
                              className={`mt-5 rounded-2xl border p-4 ${
                                quizSession.lastCorrect
                                  ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/35'
                                  : 'border-red-300 bg-red-50/80 dark:border-red-800 dark:bg-red-950/35'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-semibold">
                                {quizSession.lastCorrect ? (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-emerald-900 dark:text-emerald-200">
                                      Nice! That&apos;s correct. ♡
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    <span className="text-red-900 dark:text-red-200">
                                      Not quite — let&apos;s review this one.
                                    </span>
                                  </>
                                )}
                              </div>

                              <dl className="mt-3 space-y-1.5 text-sm text-stone-800 dark:text-zinc-200">
                                <div>
                                  <dt className="inline font-semibold">
                                    Your Answer:{' '}
                                  </dt>
                                  <dd className="inline">
                                    {
                                      quizSession.answers[
                                        quizSession.answers.length - 1
                                      ]?.userAnswer
                                    }
                                  </dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold">
                                    Correct Answer:{' '}
                                  </dt>
                                  <dd className="inline font-semibold text-emerald-700 dark:text-emerald-300">
                                    {q.card.back}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold">Why: </dt>
                                  <dd className="inline">
                                    {buildExplanation(q.card)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold">
                                    Memory Tip:{' '}
                                  </dt>
                                  <dd className="inline">
                                    {buildMemoryTip(q.card, topic)}
                                  </dd>
                                </div>
                              </dl>

                              <div className="mt-4 flex justify-end">
                                <Button
                                  ref={nextBtnRef}
                                  variant="primary"
                                  onClick={advanceQuiz}
                                >
                                  <span>
                                    {quizSession.currentIndex + 1 >= total
                                      ? 'Finish Quiz'
                                      : 'Next Question'}
                                  </span>
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Results View */}
                {quizSession && quizSession.finishedAt && (
                  (() => {
                    const total = quizSession.answers.length;
                    const correctCount = quizSession.answers.filter(
                      (a) => a.isCorrect
                    ).length;
                    const wrongList = quizSession.answers.filter(
                      (a) => !a.isCorrect
                    );
                    const accuracy =
                      total > 0 ? Math.round((correctCount / total) * 100) : 0;
                    const elapsedSec =
                      (quizSession.finishedAt - quizSession.startedAt) / 1000;

                    const perTopic = new Map<
                      string,
                      { correct: number; total: number }
                    >();
                    for (const a of quizSession.answers) {
                      const tid = a.question.card.topic;
                      const prev = perTopic.get(tid) ?? {
                        correct: 0,
                        total: 0,
                      };
                      perTopic.set(tid, {
                        correct: prev.correct + (a.isCorrect ? 1 : 0),
                        total: prev.total + 1,
                      });
                    }

                    return (
                      <div className="space-y-6">
                        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                          <Badge tone="rose">Proud of you! ♡</Badge>
                          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                            Quiz Complete! ♡
                          </h1>
                          <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                            {quizSession.modeLabel}
                          </p>

                          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <p className="text-xs text-stone-500 dark:text-zinc-400">
                                Score
                              </p>
                              <p className="mt-1 text-xl font-bold">
                                {correctCount} / {total}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <p className="text-xs text-stone-500 dark:text-zinc-400">
                                Accuracy
                              </p>
                              <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
                                {accuracy}%
                              </p>
                            </div>
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <p className="text-xs text-stone-500 dark:text-zinc-400">
                                Time
                              </p>
                              <p className="mt-1 text-xl font-bold">
                                {formatDuration(elapsedSec)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <p className="text-xs text-stone-500 dark:text-zinc-400">
                                Correct / Wrong
                              </p>
                              <p className="mt-1 text-xl font-bold">
                                {correctCount} / {wrongList.length}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {wrongList.length > 0 && (
                              <Button
                                variant="primary"
                                onClick={() => setPage('mistakes')}
                              >
                                <AlertCircle className="h-4 w-4" />
                                <span>Review Mistakes</span>
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() =>
                                startQuiz({
                                  topicId: quizSession.topicId,
                                  count: quizSession.questions.length,
                                  mistakesOnly: quizSession.mistakesOnly,
                                  modeLabel: quizSession.modeLabel,
                                })
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>Retry Quiz</span>
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setQuizSession(null);
                                setPage('home');
                              }}
                            >
                              <span>Continue Studying</span>
                            </Button>
                          </div>
                        </div>

                        {/* Topic Performance */}
                        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                          <h2 className="text-base font-semibold">
                            Topic Breakdown
                          </h2>
                          <div className="mt-3 space-y-2.5">
                            {Array.from(perTopic.entries()).map(
                              ([tid, stats]) => {
                                const t = topicMap.get(tid);
                                const pct = Math.round(
                                  (stats.correct / stats.total) * 100
                                );
                                const well = pct >= 70;
                                return (
                                  <div
                                    key={tid}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 p-3 dark:border-zinc-800"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {t?.title ?? tid}
                                      </p>
                                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                                        {stats.correct} / {stats.total} correct (
                                        {pct}%)
                                      </p>
                                    </div>
                                    <Badge tone={well ? 'emerald' : 'amber'}>
                                      {well
                                        ? '✓ Performed well'
                                        : '! Needs review'}
                                    </Badge>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* Questions to revisit */}
                        {wrongList.length > 0 && (
                          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <h2 className="text-base font-semibold">
                              Questions to Revisit ({wrongList.length})
                            </h2>
                            <ul className="mt-4 space-y-3">
                              {wrongList.map((item, idx) => (
                                <li
                                  key={`${item.question.card.id}-${idx}`}
                                  className="rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/60 dark:bg-red-950/25"
                                >
                                  <p className="text-sm font-semibold">
                                    {item.question.card.front}
                                  </p>
                                  <p className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                                    ✗ Your answer: {item.userAnswer}
                                  </p>
                                  <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    ✓ Correct answer: {item.question.card.back}
                                  </p>
                                  <p className="mt-1.5 text-xs text-stone-600 dark:text-zinc-400">
                                    {buildExplanation(item.question.card)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* ==================== 5. MY MISTAKES ==================== */}
            {page === 'mistakes' && (
              <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      My Mistakes ({mistakesList.length})
                    </h1>
                    <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                      Each question leaves this list once you answer it correctly.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    disabled={mistakesList.length === 0}
                    onClick={() =>
                      startQuiz({
                        topicId: 'all',
                        count: mistakesList.length,
                        mistakesOnly: true,
                        modeLabel: 'Practice My Mistakes',
                      })
                    }
                  >
                    <Play className="h-4 w-4" />
                    <span>Practice My Mistakes</span>
                  </Button>
                </div>

                {mistakesList.length === 0 ? (
                  <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                    <h2 className="mt-3 text-lg font-semibold">
                      All caught up! ♡
                    </h2>
                    <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                      You have no missed questions waiting for review.
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-4"
                      onClick={() => setPage('quiz')}
                    >
                      Take a Quiz
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {mistakesList.map((m) => {
                      const card = cardMap.get(m.cardId);
                      const topic = topicMap.get(m.topic);
                      return (
                        <li
                          key={m.cardId}
                          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge tone="rose">
                              {topic?.title ?? m.topic}
                            </Badge>
                            {topic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReviewerTopic(topic.id)}
                              >
                                Open Topic
                              </Button>
                            )}
                          </div>
                          {card && (
                            <p className="mt-2.5 text-base font-semibold">
                              {card.front}
                            </p>
                          )}
                          <div className="mt-3 space-y-1 text-sm">
                            <p className="text-red-700 dark:text-red-300">
                              <span className="font-semibold">
                                ✗ Your answer:{' '}
                              </span>
                              {m.userAnswer}
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-300">
                              <span className="font-semibold">
                                ✓ Correct answer:{' '}
                              </span>
                              {m.correctAnswer}
                            </p>
                            <p className="text-stone-600 dark:text-zinc-400">
                              <span className="font-semibold">
                                Explanation:{' '}
                              </span>
                              {m.explanation}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ==================== 6. SAVED ==================== */}
            {page === 'saved' && (
              <div className="mx-auto max-w-4xl space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Saved Items
                  </h1>
                  <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                    Bookmarked lesson sections and flashcards for quick review.
                  </p>
                </div>

                {/* Bookmarked Sections */}
                <section className="space-y-3">
                  <h2 className="text-base font-semibold">
                    Bookmarked Sections ({state.bookmarks.topics.length})
                  </h2>
                  {state.bookmarks.topics.length === 0 ? (
                    <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      No saved sections yet. Click Save inside any Reviewer topic.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {state.bookmarks.topics.map((tid) => {
                        const t = topicMap.get(tid);
                        if (!t) return null;
                        return (
                          <div
                            key={tid}
                            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div>
                              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                {t.subject} · {t.level}
                              </p>
                              <h3 className="mt-1 font-semibold">{t.title}</h3>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openReviewerTopic(t.id)}
                              >
                                Open Reviewer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTopicBookmark(t.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Bookmarked Flashcards */}
                <section className="space-y-3">
                  <h2 className="text-base font-semibold">
                    Bookmarked Flashcards ({state.bookmarks.cards.length})
                  </h2>
                  {state.bookmarks.cards.length === 0 ? (
                    <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      No saved flashcards yet. Click Save on any card or term.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {state.bookmarks.cards.map((cid) => {
                        const c = cardMap.get(cid);
                        if (!c) return null;
                        const t = topicMap.get(c.topic);
                        return (
                          <li
                            key={cid}
                            className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                {t?.title ?? c.topic} · {c.term}
                              </p>
                              <p className="text-sm font-medium">{c.front}</p>
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                Answer: {c.back}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openFlashcards(c.topic, c.id)}
                              >
                                Flashcards
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCardBookmark(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {/* ==================== 7. SEARCH ==================== */}
            {page === 'search' && (
              <div className="mx-auto max-w-4xl space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Search</h1>
                  <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                    Search across topics, terms, definitions, and flashcards.
                  </p>
                </div>

                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <label htmlFor="global-search-input" className="sr-only">
                    Search topics and flashcards
                  </label>
                  <input
                    id="global-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms, insects, weeds, IPM, pesticide categories..."
                    className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const matchedTopics = q
                    ? TOPICS.filter((t) =>
                        `${t.title} ${t.intro} ${t.remember} ${t.level} ${t.meta ?? ''}`
                          .toLowerCase()
                          .includes(q)
                      )
                    : TOPICS;
                  const matchedCards = q
                    ? CARDS.filter((c) =>
                        `${c.term} ${c.front} ${c.back} ${c.why ?? ''} ${(c.alt ?? []).join(' ')}`
                          .toLowerCase()
                          .includes(q)
                      )
                    : CARDS.slice(0, 12);

                  return (
                    <div className="space-y-6">
                      <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                          Topics ({matchedTopics.length})
                        </h2>
                        {matchedTopics.length === 0 ? (
                          <p className="text-sm text-stone-500 dark:text-zinc-400">
                            No matching topics.
                          </p>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2">
                            {matchedTopics.map((t) => (
                              <div
                                key={t.id}
                                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                              >
                                <div>
                                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                    {t.level}
                                  </p>
                                  <h3 className="mt-1 font-semibold">
                                    {t.title}
                                  </h3>
                                  <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-zinc-400">
                                    {t.intro}
                                  </p>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => openReviewerTopic(t.id)}
                                  >
                                    Reviewer
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openFlashcards(t.id)}
                                  >
                                    Flashcards
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                          Terms &amp; Flashcards ({matchedCards.length}
                          {!q ? ` shown of ${CARDS.length}` : ''})
                        </h2>
                        {matchedCards.length === 0 ? (
                          <p className="text-sm text-stone-500 dark:text-zinc-400">
                            No matching terms or flashcards.
                          </p>
                        ) : (
                          <ul className="space-y-2.5">
                            {matchedCards.map((c) => {
                              const t = topicMap.get(c.topic);
                              return (
                                <li
                                  key={c.id}
                                  className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center"
                                >
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                        {c.term}
                                      </span>
                                      <Badge>{t?.level ?? c.topic}</Badge>
                                    </div>
                                    <p className="text-sm text-stone-700 dark:text-zinc-300">
                                      {c.front}
                                    </p>
                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                      Answer: {c.back}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => openReviewerTopic(c.topic)}
                                    >
                                      Reviewer
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        openFlashcards(c.topic, c.id)
                                      }
                                    >
                                      Flashcards
                                    </Button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </section>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ==================== 8. SETTINGS ==================== */}
            {page === 'settings' && (
              <div className="mx-auto max-w-2xl space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Settings
                  </h1>
                  <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
                    Customize your profile, appearance, audio feedback, and saved study data.
                  </p>
                </div>

                <div className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <label
                      htmlFor="display-name-input"
                      className="block text-sm font-medium"
                    >
                      Display Name
                    </label>
                    <input
                      id="display-name-input"
                      type="text"
                      value={state.name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium">Theme</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        Switch between dark mode (default) and light mode
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setTheme(state.theme === 'dark' ? 'light' : 'dark')
                      }
                      aria-pressed={state.theme === 'dark'}
                    >
                      {state.theme === 'dark' ? (
                        <>
                          <Moon className="h-4 w-4" />
                          <span>Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4" />
                          <span>Light Mode</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium">Sound Effects</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        Gentle WebAudio feedback on answers and card flips
                      </p>
                    </div>
                    <Button
                      variant={state.settings.sound ? 'primary' : 'secondary'}
                      onClick={() => {
                        const next = !state.settings.sound;
                        toggleSound();
                        if (next) playBeep(true, 'correct');
                      }}
                      aria-pressed={state.settings.sound}
                    >
                      {state.settings.sound ? (
                        <>
                          <Volume2 className="h-4 w-4" />
                          <span>On</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="h-4 w-4" />
                          <span>Off</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium">Animations</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        Smooth card flips and progress transitions
                      </p>
                    </div>
                    <Button
                      variant={
                        state.settings.animations ? 'primary' : 'secondary'
                      }
                      onClick={toggleAnimations}
                      aria-pressed={state.settings.animations}
                    >
                      <span>{state.settings.animations ? 'On' : 'Off'}</span>
                    </Button>
                  </div>
                </div>

                {/* Reset Controls */}
                <div className="space-y-4 rounded-3xl border border-red-200 bg-red-50/40 p-6 dark:border-red-900/50 dark:bg-red-950/20">
                  <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
                    Data Management
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="danger"
                      onClick={() => setConfirmModal('progress')}
                    >
                      Reset Progress
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setConfirmModal('history')}
                    >
                      Reset Quiz History
                    </Button>
                  </div>
                </div>

                {/* Recent Quiz History */}
                {state.quizHistory.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-base font-semibold">
                      Recent Quiz History ({state.quizHistory.length})
                    </h2>
                    <ul className="mt-3 divide-y divide-stone-200 dark:divide-zinc-800">
                      {state.quizHistory.slice(0, 8).map((h) => (
                        <li
                          key={h.id}
                          className="flex items-center justify-between py-2.5 text-sm"
                        >
                          <div>
                            <p className="font-medium">{h.mode}</p>
                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                              {new Date(h.date).toLocaleString()} ·{' '}
                              {formatDuration(h.durationSec)}
                            </p>
                          </div>
                          <Badge tone="rose">
                            {h.correct}/{h.total}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-stone-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium cursor-pointer ${
                active
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.mobileLabel}</span>
              {item.badge !== undefined && (
                <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <CatWatermark />

      <ConfirmModal
        open={confirmModal === 'progress'}
        title="Reset all study progress?"
        description="This clears your mastery levels, flashcard statuses, mistakes list, and daily streak. Your saved bookmarks, name, and theme stay intact."
        confirmLabel="Reset Progress"
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          resetProgress();
          setConfirmModal(null);
        }}
      />

      <ConfirmModal
        open={confirmModal === 'history'}
        title="Reset quiz history?"
        description="This clears all past quiz scores and timestamps from your history log."
        confirmLabel="Reset History"
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          resetQuizHistory();
          setConfirmModal(null);
        }}
      />
    </div>
  );
}

export default App;
