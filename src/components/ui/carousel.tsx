"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  slides: React.ReactNode[];
  /** Autoplay interval in ms. 0 disables autoplay. */
  autoPlayMs?: number;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  /** Slides visible at once on large screens (1 = full-width hero). */
  perView?: 1 | 2 | 3;
  /** Accessible name for the carousel region (announced by screen readers). */
  ariaLabel?: string;
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Dependency-free, accessible carousel: transform-based track, autoplay that
 * pauses on hover/focus AND via an explicit, always-available pause control
 * (WCAG 2.2.2), respects prefers-reduced-motion, loops infinitely.
 */
export function Carousel({
  slides,
  autoPlayMs = 5000,
  className,
  showArrows = true,
  showDots = true,
  perView = 1,
  ariaLabel = "Carousel",
}: CarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [hoverPaused, setHoverPaused] = React.useState(false);
  const [userPaused, setUserPaused] = React.useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const count = slides.length;
  const pages = Math.max(1, count - (perView - 1));
  const canAutoplay = Boolean(autoPlayMs) && pages > 1;
  const autoplayOn = canAutoplay && !userPaused && !reduceMotion;

  const go = React.useCallback((i: number) => setIndex(((i % pages) + pages) % pages), [pages]);
  const next = React.useCallback(() => go(index + 1), [go, index]);
  const prev = React.useCallback(() => go(index - 1), [go, index]);

  React.useEffect(() => {
    if (!autoplayOn || hoverPaused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % pages), autoPlayMs);
    return () => clearInterval(id);
  }, [autoplayOn, hoverPaused, autoPlayMs, pages]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="min-w-0 shrink-0 grow-0 px-2"
            style={{ flexBasis: `${100 / perView}%` }}
            aria-hidden={i < index || i >= index + perView}
          >
            {slide}
          </div>
        ))}
      </div>

      {showArrows && pages > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {canAutoplay && (
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
          aria-label={userPaused ? "Start automatic slideshow" : "Pause automatic slideshow"}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition hover:bg-white"
        >
          {userPaused || reduceMotion ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      )}

      {showDots && pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-[var(--primary)]" : "w-2 bg-[var(--border)]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
