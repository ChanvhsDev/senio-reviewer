import { useCallback, useEffect, useState } from 'react';
import { COURSE_META } from '../data/content';

export const STORAGE_KEY = 'senior-reviewer-state-v1';

export type ThemeMode = 'dark' | 'light';
export type FlashcardStatus = 'known' | 'review';

export interface MasteryEntry {
  box: number; // 0..4
  due: number; // epoch ms
  attempts: number;
  correct: number;
}

export interface MistakeEntry {
  cardId: string;
  topic: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: number;
}

export interface QuizHistoryEntry {
  id: string;
  date: string;
  mode: string;
  topicId: string;
  total: number;
  correct: number;
  durationSec: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
}

export interface AppSettings {
  sound: boolean;
  animations: boolean;
}

export interface AppState {
  name: string;
  theme: ThemeMode;
  settings: AppSettings;
  progress: {
    lastTopicId: string | null;
    visitedTopics: Record<string, number>;
  };
  mastery: Record<string, MasteryEntry>;
  flashcards: Record<string, FlashcardStatus>;
  bookmarks: {
    topics: string[];
    cards: string[];
  };
  mistakes: Record<string, MistakeEntry>;
  quizHistory: QuizHistoryEntry[];
  streakDays: string[];
}

export const BOX_LABELS = [
  'New',
  'Learning',
  'Practicing',
  'Almost Mastered',
  'Mastered',
] as const;

export const BOX_DUE_DAYS = [0, 0, 1, 3, 7] as const;

export function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeStreak(streakDays: string[]): number {
  if (!streakDays.length) return 0;
  const set = new Set(streakDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = formatLocalDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  let cursor: Date | null = null;
  if (set.has(todayStr)) {
    cursor = new Date(today);
  } else if (set.has(yesterdayStr)) {
    cursor = new Date(yesterday);
  } else {
    return 0;
  }

  let count = 0;
  while (cursor && set.has(formatLocalDate(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createDefaultState(): AppState {
  return {
    name: COURSE_META.defaultStudentName,
    theme: 'dark',
    settings: {
      sound: true,
      animations: true,
    },
    progress: {
      lastTopicId: null,
      visitedTopics: {},
    },
    mastery: {},
    flashcards: {},
    bookmarks: {
      topics: [],
      cards: [],
    },
    mistakes: {},
    quizHistory: [],
    streakDays: [],
  };
}

export function loadState(): AppState {
  const fallback = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...fallback,
      ...parsed,
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
      progress: {
        ...fallback.progress,
        ...(parsed.progress ?? {}),
        visitedTopics: {
          ...(parsed.progress?.visitedTopics ?? {}),
        },
      },
      mastery: { ...(parsed.mastery ?? {}) },
      flashcards: { ...(parsed.flashcards ?? {}) },
      bookmarks: {
        topics: Array.isArray(parsed.bookmarks?.topics)
          ? parsed.bookmarks.topics
          : [],
        cards: Array.isArray(parsed.bookmarks?.cards)
          ? parsed.bookmarks.cards
          : [],
      },
      mistakes: { ...(parsed.mistakes ?? {}) },
      quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
      streakDays: Array.isArray(parsed.streakDays) ? parsed.streakDays : [],
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors gracefully
  }
}

function touchStreak(days: string[]): string[] {
  const today = getTodayIso();
  if (days.includes(today)) return days;
  return [...days, today];
}

let audioCtx: AudioContext | null = null;

export function playBeep(
  enabled: boolean,
  kind: 'correct' | 'wrong' | 'flip'
): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (kind === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.09);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (kind === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(185, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // ignore WebAudio failures
  }
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (state.settings.animations) {
      root.classList.remove('no-motion');
    } else {
      root.classList.add('no-motion');
    }
  }, [state.theme, state.settings.animations]);

  const setName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      name,
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, sound: !prev.settings.sound },
    }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, animations: !prev.settings.animations },
    }));
  }, []);

  const markTopicVisited = useCallback((topicId: string) => {
    setState((prev) => ({
      ...prev,
      progress: {
        lastTopicId: topicId,
        visitedTopics: {
          ...prev.progress.visitedTopics,
          [topicId]: Date.now(),
        },
      },
      streakDays: touchStreak(prev.streakDays),
    }));
  }, []);

  const toggleTopicBookmark = useCallback((topicId: string) => {
    setState((prev) => {
      const exists = prev.bookmarks.topics.includes(topicId);
      const topics = exists
        ? prev.bookmarks.topics.filter((id) => id !== topicId)
        : [...prev.bookmarks.topics, topicId];
      return { ...prev, bookmarks: { ...prev.bookmarks, topics } };
    });
  }, []);

  const toggleCardBookmark = useCallback((cardId: string) => {
    setState((prev) => {
      const exists = prev.bookmarks.cards.includes(cardId);
      const cards = exists
        ? prev.bookmarks.cards.filter((id) => id !== cardId)
        : [...prev.bookmarks.cards, cardId];
      return { ...prev, bookmarks: { ...prev.bookmarks, cards } };
    });
  }, []);

  const setFlashcardStatus = useCallback(
    (cardId: string, status: FlashcardStatus) => {
      setState((prev) => ({
        ...prev,
        flashcards: {
          ...prev.flashcards,
          [cardId]: status,
        },
        streakDays: touchStreak(prev.streakDays),
      }));
    },
    []
  );

  const recordAnswer = useCallback(
    (params: {
      cardId: string;
      topic: string;
      isCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      explanation: string;
    }) => {
      setState((prev) => {
        const current = prev.mastery[params.cardId] ?? {
          box: 0,
          due: 0,
          attempts: 0,
          correct: 0,
        };
        const nextBox = params.isCorrect
          ? Math.min(4, current.box + 1)
          : 1;
        const days = BOX_DUE_DAYS[nextBox];
        const due = Date.now() + days * 24 * 60 * 60 * 1000;

        const nextMistakes = { ...prev.mistakes };
        if (params.isCorrect) {
          delete nextMistakes[params.cardId];
        } else {
          nextMistakes[params.cardId] = {
            cardId: params.cardId,
            topic: params.topic,
            userAnswer: params.userAnswer,
            correctAnswer: params.correctAnswer,
            explanation: params.explanation,
            timestamp: Date.now(),
          };
        }

        return {
          ...prev,
          mastery: {
            ...prev.mastery,
            [params.cardId]: {
              box: nextBox,
              due,
              attempts: current.attempts + 1,
              correct: current.correct + (params.isCorrect ? 1 : 0),
            },
          },
          mistakes: nextMistakes,
          streakDays: touchStreak(prev.streakDays),
        };
      });
    },
    []
  );

  const addQuizHistory = useCallback((entry: QuizHistoryEntry) => {
    setState((prev) => ({
      ...prev,
      quizHistory: [entry, ...prev.quizHistory].slice(0, 50),
      streakDays: touchStreak(prev.streakDays),
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      progress: { lastTopicId: null, visitedTopics: {} },
      mastery: {},
      flashcards: {},
      mistakes: {},
      streakDays: [],
    }));
  }, []);

  const resetQuizHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      quizHistory: [],
    }));
  }, []);

  return {
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
  };
}
