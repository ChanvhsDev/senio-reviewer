import { Card, Topic } from '../data/content';
import { MasteryEntry, MistakeEntry } from './store';

export type QuestionType = 'mc' | 'id' | 'tf';

export interface QuizQuestion {
  card: Card;
  type: QuestionType;
  options: string[]; // 4 options for 'mc', 2 for 'tf', [] for 'id'
  hint: string;
}

const STOP_WORDS = new Set(['art', 'and', 'the', 'of', 'van']);

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meaningfulWords(norm: string): string[] {
  if (!norm) return [];
  return norm.split(' ').filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

export function checkTypedAnswer(input: string, card: Card): boolean {
  const normInput = normalizeText(input);
  if (!normInput) return false;

  const candidates = [card.back, ...(card.alt ?? [])];
  const inputWords = meaningfulWords(normInput);

  for (const target of candidates) {
    const normTarget = normalizeText(target);
    if (!normTarget) continue;
    if (normInput === normTarget) return true;

    if (inputWords.length > 0) {
      const targetWords = new Set(meaningfulWords(normTarget));
      if (
        targetWords.size > 0 &&
        inputWords.every((w) => targetWords.has(w))
      ) {
        return true;
      }
    }
  }
  return false;
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildMcOptions(card: Card, allCards: readonly Card[]): string[] {
  const seen = new Set<string>();
  const targetAccepted = new Set<string>(
    [card.back, ...(card.alt ?? [])].map(normalizeText)
  );
  // Never use another card's alt answer as a distractor
  const otherAltAnswers = new Set<string>();
  for (const other of allCards) {
    if (other.id === card.id || !other.alt) continue;
    for (const a of other.alt) {
      otherAltAnswers.add(normalizeText(a));
    }
  }

  seen.add(normalizeText(card.back));
  const distractors: string[] = [];

  const tryAdd = (raw: string, allowAltPool: boolean): boolean => {
    const trimmed = raw.trim();
    const norm = normalizeText(trimmed);
    if (!norm) return false;
    if (seen.has(norm)) return false;
    if (targetAccepted.has(norm)) return false;
    if (!allowAltPool && otherAltAnswers.has(norm)) return false;
    if (norm === 'true' || norm === 'false') return false;
    seen.add(norm);
    distractors.push(trimmed);
    return true;
  };

  // 1. Fixed options on the card first
  if (card.opts && card.opts.length > 0) {
    for (const opt of card.opts) {
      if (distractors.length >= 3) break;
      tryAdd(opt, true);
    }
  }

  // 2. Same topic cards first
  if (distractors.length < 3) {
    const sameTopic = shuffleArray(
      allCards.filter(
        (c) => c.id !== card.id && c.topic === card.topic && !c.tf
      )
    );
    for (const candidate of sameTopic) {
      if (distractors.length >= 3) break;
      tryAdd(candidate.back, false);
    }
  }

  // 3. Other topics as fallback
  if (distractors.length < 3) {
    const otherTopics = shuffleArray(
      allCards.filter(
        (c) => c.id !== card.id && c.topic !== card.topic && !c.tf
      )
    );
    for (const candidate of otherTopics) {
      if (distractors.length >= 3) break;
      tryAdd(candidate.back, false);
    }
  }

  return shuffleArray([card.back, ...distractors.slice(0, 3)]);
}

export function buildHint(card: Card, topic?: Topic): string {
  const topicLabel = topic ? topic.title : card.topic;
  if (card.tf || card.only === 'tf') {
    return `Topic: ${topicLabel} · Check every detail in the statement carefully against your module.`;
  }
  const cleanAnswer = card.back.trim();
  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const firstAlpha =
    cleanAnswer.match(/[A-Za-z0-9]/)?.[0]?.toUpperCase() ?? cleanAnswer[0] ?? '';
  const wordLabel = words.length === 1 ? '1 word' : `${words.length} words`;
  return `Topic: ${topicLabel} · ${wordLabel} · Starts with "${firstAlpha}"`;
}

export function resolveQuestionType(
  card: Card,
  index: number,
  allCards: readonly Card[]
): QuestionType {
  if (card.tf || card.only === 'tf') return 'tf';
  if (card.only === 'mc' || card.only === 'id') return card.only;
  // Mix MC and Identification cleanly; ensure MC always has 4 options
  const preferId = index % 3 === 1;
  if (preferId) return 'id';
  const opts = buildMcOptions(card, allCards);
  return opts.length === 4 ? 'mc' : 'id';
}

export function pickQs(params: {
  cards: readonly Card[];
  topics: readonly Topic[];
  mastery: Record<string, MasteryEntry>;
  mistakes: Record<string, MistakeEntry>;
  count: number;
  topicId?: string;
  mistakesOnly?: boolean;
}): QuizQuestion[] {
  const {
    cards,
    topics,
    mastery,
    mistakes,
    count,
    topicId = 'all',
    mistakesOnly = false,
  } = params;

  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const now = Date.now();

  let pool = cards.filter((c) =>
    topicId === 'all' ? true : c.topic === topicId
  );

  if (mistakesOnly) {
    pool = pool.filter((c) => Boolean(mistakes[c.id]));
  }

  // Group into priority tiers:
  // 0: past mistakes
  // 1..5: box 0..4 (due first, then not-yet-due)
  const pastMistakeCards = shuffleArray(pool.filter((c) => Boolean(mistakes[c.id])));
  const nonMistakes = pool.filter((c) => !mistakes[c.id]);

  const ordered: Card[] = [...pastMistakeCards];

  for (let box = 0; box <= 4; box++) {
    const inBox = nonMistakes.filter(
      (c) => (mastery[c.id]?.box ?? 0) === box
    );
    const due = shuffleArray(
      inBox.filter((c) => (mastery[c.id]?.due ?? 0) <= now)
    );
    const notDue = shuffleArray(
      inBox.filter((c) => (mastery[c.id]?.due ?? 0) > now)
    );
    ordered.push(...due, ...notDue);
  }

  const chosen = ordered.slice(0, Math.min(count, ordered.length));
  const shuffledPresentation = shuffleArray(chosen);

  return shuffledPresentation.map((card, idx) => {
    const type = resolveQuestionType(card, idx, cards);
    const options =
      type === 'tf'
        ? ['True', 'False']
        : type === 'mc'
        ? buildMcOptions(card, cards)
        : [];
    return {
      card,
      type,
      options,
      hint: buildHint(card, topicMap.get(card.topic)),
    };
  });
}

export function renderFilledStatement(card: Card): string {
  if (card.tf) return card.front;
  if (card.front.includes('________')) {
    return card.front.replace('________', card.back);
  }
  return `${card.front} — ${card.back}`;
}

export function buildExplanation(card: Card): string {
  if (card.why) return card.why;
  return renderFilledStatement(card);
}

export function buildMemoryTip(card: Card, topic?: Topic): string {
  if (card.tf && topic) {
    return `Key takeaway (${topic.level}): ${topic.remember}`;
  }
  if (card.alt && card.alt.length > 0) {
    return `Also accepted: ${card.alt.join(', ')}. Anchor this under "${card.term}".`;
  }
  if (topic) {
    return `Connect "${card.term}" to ${topic.title} — ${topic.remember}`;
  }
  return `Recall keyword: "${card.term}".`;
}
