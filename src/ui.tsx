import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, Eye, EyeOff, GitBranch, Image as ImageIcon, RotateCcw, X } from 'lucide-react';
import {
  Card,
  DiagramGuide,
  LessonGalleryGuide,
  LessonVisualSection,
  MindMapGuide,
  Topic,
} from './data/content';
import { normalizeText } from './lib/quiz';
import { AppState, BOX_LABELS } from './lib/store';

export function ProgressBar({
  value,
  max = 100,
  label,
  className = '',
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800 ${className}`}
    >
      <div
        className="h-full rounded-full bg-rose-500 transition-all duration-300 dark:bg-rose-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'rose' | 'emerald' | 'amber' | 'sky';
  className?: string;
}) {
  const tones = {
    neutral:
      'bg-stone-100 text-stone-700 border-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    rose:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
    emerald:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    amber:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    sky:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: React.ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  const variants = {
    primary:
      'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 shadow-sm dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-white disabled:opacity-50',
    secondary:
      'bg-white text-stone-800 border border-stone-200 hover:bg-stone-100 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 disabled:opacity-50',
    ghost:
      'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white disabled:opacity-50',
    danger:
      'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 disabled:opacity-50',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-8',
    md: 'px-4 py-2 text-sm min-h-10',
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SaveButton({
  saved,
  onToggle,
  label,
}: {
  saved: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Button
      variant={saved ? 'primary' : 'secondary'}
      size="sm"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={label}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
      <span>{saved ? 'Saved' : 'Save'}</span>
    </Button>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="confirm-modal-title"
            className="text-lg font-semibold text-stone-900 dark:text-zinc-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p
          id="confirm-modal-desc"
          className="mt-2 text-sm text-stone-600 dark:text-zinc-400"
        >
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelBtnRef} variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Check className="h-4 w-4" />
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface TopicStats {
  totalCards: number;
  progressPct: number;
  masteryLabel: string;
  avgBox: number;
  attempts: number;
  correct: number;
  knownCards: number;
}

export function computeTopicStats(
  topic: Topic,
  cards: readonly Card[],
  state: AppState
): TopicStats {
  const topicCards = cards.filter((c) => c.topic === topic.id);
  const totalCards = topicCards.length;
  if (totalCards === 0) {
    return {
      totalCards: 0,
      progressPct: 0,
      masteryLabel: 'New',
      avgBox: 0,
      attempts: 0,
      correct: 0,
      knownCards: 0,
    };
  }

  let boxSum = 0;
  let attempts = 0;
  let correct = 0;
  let knownCards = 0;

  for (const c of topicCards) {
    const m = state.mastery[c.id];
    if (m) {
      boxSum += m.box;
      attempts += m.attempts;
      correct += m.correct;
    }
    if (state.flashcards[c.id] === 'known') {
      knownCards++;
    }
  }

  const avgBox = boxSum / totalCards;
  // Combine mastery box progress and known flashcards smoothly, weighted mostly by spaced-review boxes
  const boxPct = (boxSum / (totalCards * 4)) * 100;
  const knownPct = (knownCards / totalCards) * 100;
  const progressPct = Math.round(Math.max(boxPct, knownPct * 0.5));
  const roundedBox = Math.min(4, Math.max(0, Math.round(avgBox)));

  return {
    totalCards,
    progressPct,
    masteryLabel: BOX_LABELS[roundedBox],
    avgBox,
    attempts,
    correct,
    knownCards,
  };
}

export function CatWatermark() {
  if (!__HAS_CAT_IMG__) return null;
  return (
    <img
      src="/cat.jpg"
      alt=""
      aria-hidden="true"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
      className="pointer-events-none fixed right-4 bottom-20 z-0 h-28 w-28 select-none object-contain opacity-[0.15] mix-blend-multiply dark:opacity-[0.12] dark:invert dark:mix-blend-screen md:bottom-4"
    />
  );
}

function DiagramCard({ diagram }: { diagram: DiagramGuide }) {
  const [mode, setMode] = useState<'study' | 'drill'>('study');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const [hideImage, setHideImage] = useState(false);

  const groups = Array.from(new Set(diagram.labels.map((l) => l.group)));
  const visibleLabels = diagram.labels.filter((l) =>
    groupFilter === 'all' ? true : l.group === groupFilter
  );

  const isLabelMatch = (idx: number, expected: string, alt?: string[]) => {
    const val = normalizeText(inputs[idx] ?? '');
    if (!val) return false;
    const candidates = [expected, ...(alt ?? [])].map(normalizeText);
    return candidates.some((c) => c === val);
  };

  const correctCount = diagram.labels.filter((l, i) =>
    isLabelMatch(i, l.label, l.alt)
  ).length;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-rose-500" />
            <h3 className="text-lg font-semibold">{diagram.title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
            {diagram.sourceRef} · {diagram.labels.length} labeled items
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === 'study' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setMode('study');
              setHideImage(false);
            }}
          >
            Study &amp; Match
          </Button>
          <Button
            variant={mode === 'drill' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('drill')}
          >
            Blank Labeling Drill
          </Button>
        </div>
      </div>

      {/* Visual Diagram Frame */}
      {!hideImage && (
        <figure className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 dark:border-zinc-700">
          <img
            src={diagram.image}
            alt={diagram.title}
            className="mx-auto max-h-[440px] w-auto rounded-xl object-contain"
          />
          <figcaption className="mt-2 text-center text-xs text-stone-500">
            {diagram.caption}
          </figcaption>
        </figure>
      )}

      {mode === 'study' ? (
        <div className="mt-5 space-y-4">
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGroupFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  groupFilter === 'all'
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                All ({diagram.labels.length})
              </button>
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupFilter(g)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    groupFilter === g
                      ? 'bg-rose-500 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleLabels.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                    {item.label}
                  </span>
                  <Badge>{item.group}</Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-700 dark:text-zinc-300">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
            <p className="text-xs text-stone-600 dark:text-zinc-400">
              Type the matching diagram label for each definition.
              {checked && (
                <span className="ml-2 font-semibold text-rose-600 dark:text-rose-400">
                  Score: {correctCount} / {diagram.labels.length}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideImage((v) => !v)}
              >
                {hideImage ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Show Image</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Image</span>
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRevealKey((v) => !v)}
              >
                {revealKey ? 'Hide Answer Key' : 'Reveal Answer Key'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInputs({});
                  setChecked(false);
                  setRevealKey(false);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setChecked(true)}
              >
                <Check className="h-3.5 w-3.5" />
                <span>Check Answers</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {diagram.labels.map((item, idx) => {
              const matched = checked && isLabelMatch(idx, item.label, item.alt);
              const missed = checked && !matched;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-3.5 ${
                    matched
                      ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30'
                      : missed
                      ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/25'
                      : 'border-stone-200 bg-stone-50/60 dark:border-zinc-800 dark:bg-zinc-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                      #{idx + 1} · {item.group}
                    </span>
                    {matched && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        ✓ Correct
                      </span>
                    )}
                    {missed && (
                      <span className="text-xs font-bold text-red-700 dark:text-red-300">
                        ✗ Check key
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-700 dark:text-zinc-300">
                    {item.definition}
                  </p>
                  <input
                    type="text"
                    aria-label={`Diagram label #${idx + 1}`}
                    value={inputs[idx] ?? ''}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    placeholder="Type matching label..."
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  {(revealKey || missed) && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Answer: {item.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

function LessonGalleryCard({ gallery }: { gallery: LessonGalleryGuide }) {
  const firstRow = gallery.species.slice(0, 3);
  const secondRow = gallery.species.slice(3);

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-xs dark:border-zinc-700">
      {/* 1. Lesson Text Section — Top */}
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold tracking-tight text-stone-900">
          {gallery.sectionHeading}
        </h3>
        <h4 className="mt-3 pl-4 text-base font-semibold text-stone-800">
          {gallery.subsectionHeading}
        </h4>
        <p className="mt-2 pl-8 text-sm leading-relaxed text-stone-700">
          {gallery.paragraph}
        </p>

        <p className="mt-5 text-sm font-medium text-stone-800">
          {gallery.listLeadIn}
        </p>
        <ol className="mt-2.5 space-y-1.5 pl-1 text-sm leading-relaxed text-stone-800">
          {gallery.species.map((sp) => (
            <li key={sp.marker} className="flex items-baseline gap-2">
              <span className="w-5 shrink-0 font-semibold text-stone-900">
                {sp.marker}.
              </span>
              <span>
                <em className="italic">{sp.scientificName}</em>
                {sp.authority ? ` ${sp.authority}` : ''} {sp.separator}{' '}
                <span>{sp.commonName}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 2. Visual Reference Section — Bottom */}
      <div className="border-t border-stone-200 bg-stone-50/90 p-6 sm:p-8">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Visual Reference
        </h4>

        {/* First Row: 3 images */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {firstRow.map((sp) => (
            <figure
              key={sp.marker}
              className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs"
            >
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 p-1.5">
                <img
                  src={sp.image}
                  alt={sp.altText}
                  className="h-full w-full object-contain"
                />
              </div>
              <figcaption className="flex items-center justify-between border-t border-stone-200 bg-white px-3 py-2 text-xs">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-stone-900 text-[11px] font-bold text-white">
                  {sp.marker}
                </span>
                <span className="truncate pl-2 font-medium text-stone-700">
                  {sp.commonName}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Second Row: 2 centered images */}
        {secondRow.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {secondRow.map((sp) => (
              <figure
                key={sp.marker}
                className="flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs sm:w-[calc((100%-2rem)/3)]"
              >
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 p-1.5">
                  <img
                    src={sp.image}
                    alt={sp.altText}
                    className="h-full w-full object-contain"
                  />
                </div>
                <figcaption className="flex items-center justify-between border-t border-stone-200 bg-white px-3 py-2 text-xs">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-stone-900 text-[11px] font-bold text-white">
                    {sp.marker}
                  </span>
                  <span className="truncate pl-2 font-medium text-stone-700">
                    {sp.commonName}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* 3. Centered Caption */}
        <p className="mt-5 text-center text-xs font-medium text-stone-600">
          {gallery.caption}
        </p>
      </div>
    </article>
  );
}

function LessonVisualSectionCard({
  section,
}: {
  section: LessonVisualSection;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-xs dark:border-zinc-700">
      <div className="border-b border-stone-200 bg-stone-50/70 px-6 py-5 sm:px-8">
        <h3 className="text-lg font-bold tracking-tight text-stone-900">
          {section.heading}
        </h3>
        {section.subtitle && (
          <p className="mt-1 text-xs font-medium text-stone-500">
            {section.subtitle}
          </p>
        )}
      </div>

      <div className="divide-y divide-stone-200">
        {section.blocks.map((block, idx) => (
          <div key={idx} className="p-6 sm:p-8">
            {block.image ? (
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
                <div className="space-y-2 md:col-span-7">
                  <h4 className="text-base font-semibold text-stone-900">
                    {block.subheading}
                  </h4>
                  <p className="text-sm leading-relaxed text-stone-700">
                    {block.body}
                  </p>
                </div>
                <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 md:col-span-5">
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 p-1.5">
                    <img
                      src={block.image}
                      alt={block.imageAlt ?? block.subheading}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {block.imageCaption && (
                    <figcaption className="border-t border-stone-200 bg-white px-3 py-2 text-center text-xs text-stone-600">
                      {block.imageCaption}
                    </figcaption>
                  )}
                </figure>
              </div>
            ) : block.gallery ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-stone-900">
                    {block.subheading}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
                    {block.body}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50/90 p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {block.gallery.map((item) => (
                      <figure
                        key={item.marker}
                        className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs"
                      >
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 p-1.5">
                          <img
                            src={item.image}
                            alt={item.altText}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <figcaption className="flex items-center justify-between gap-2 border-t border-stone-200 bg-white px-3.5 py-2.5 text-xs">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-900 text-[11px] font-bold text-white">
                            {item.marker}
                          </span>
                          <span className="text-right font-medium text-stone-800">
                            {item.title}
                            {item.scientificName && (
                              <>
                                {' '}
                                (<em className="italic">{item.scientificName}</em>)
                              </>
                            )}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  {block.galleryCaption && (
                    <p className="mt-4 text-center text-xs font-medium text-stone-600">
                      {block.galleryCaption}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-stone-900">
                  {block.subheading}
                </h4>
                <p className="text-sm leading-relaxed text-stone-700">
                  {block.body}
                </p>
                {block.bullets && (
                  <ul className="grid gap-2 pt-1 sm:grid-cols-2">
                    {block.bullets.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-xs leading-relaxed text-stone-800"
                      >
                        <span
                          className="mt-0.5 font-bold text-rose-600"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

export function VisualGuidesSection({
  diagrams,
  mindMaps,
  lessonGalleries = [],
  lessonSections = [],
}: {
  diagrams: DiagramGuide[];
  mindMaps: MindMapGuide[];
  lessonGalleries?: LessonGalleryGuide[];
  lessonSections?: LessonVisualSection[];
}) {
  if (
    diagrams.length === 0 &&
    mindMaps.length === 0 &&
    lessonGalleries.length === 0 &&
    lessonSections.length === 0
  ) {
    return null;
  }

  const branchColors = {
    emerald:
      'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/70 dark:bg-emerald-950/30',
    amber:
      'border-amber-300 bg-amber-50/70 dark:border-amber-800/70 dark:bg-amber-950/30',
    sky: 'border-sky-300 bg-sky-50/70 dark:border-sky-800/70 dark:bg-sky-950/30',
    rose: 'border-rose-300 bg-rose-50/70 dark:border-rose-800/70 dark:bg-rose-950/30',
  };

  return (
    <section aria-labelledby="visual-guides-heading" className="space-y-6">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-rose-500" />
        <h2 id="visual-guides-heading" className="text-lg font-semibold">
          Visual Lesson References, Mind Maps &amp; Diagrams
        </h2>
      </div>

      {lessonGalleries.map((gallery) => (
        <LessonGalleryCard key={gallery.id} gallery={gallery} />
      ))}

      {mindMaps.map((mm) => (
        <article
          key={mm.id}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-base font-semibold">{mm.title}</h3>
          <div className="mt-4 flex flex-col items-center">
            <div className="w-full max-w-xl rounded-2xl border border-indigo-300 bg-indigo-50/80 p-4 text-center dark:border-indigo-800/80 dark:bg-indigo-950/40">
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                {mm.rootLabel}
              </p>
              <p className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300">
                {mm.rootNote}
              </p>
            </div>
            <div className="h-5 w-0.5 bg-stone-300 dark:bg-zinc-700" aria-hidden="true" />
            <div className="grid w-full gap-4 md:grid-cols-2">
              {mm.branches.map((b, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 ${branchColors[b.tone]}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold">{b.name}</h4>
                    <Badge tone={b.tone}>{b.badge}</Badge>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-stone-800 dark:text-zinc-200">
                    {b.points.map((pt, j) => (
                      <li key={j} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}

      {diagrams.map((diagram) => (
        <DiagramCard key={diagram.id} diagram={diagram} />
      ))}

      {lessonSections.map((sec) => (
        <LessonVisualSectionCard key={sec.id} section={sec} />
      ))}
    </section>
  );
}
