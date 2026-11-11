'use client';

import { useEffect } from 'react';
import {
  MAX_HOURS,
  STATE_WORD,
  agoLabel,
  counts,
  dominant,
  frame,
  hoursFromProgress,
  progressFromHours,
  stageIndex,
} from '@/lib/afterglow';

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

// Moves the hero's clock. It never re-renders React: scroll (or the slider) sets a few CSS custom
// properties on one element, and the muscles, halos and phone all read them. Text nodes are
// touched only when the whole hour changes.
export function AfterglowDriver() {
  useEffect(() => {
    const scope = document.querySelector<HTMLElement>('[data-ag]');
    const track = scope?.querySelector<HTMLElement>('[data-ag-track]');
    const pin = scope?.querySelector<HTMLElement>('[data-ag-pin]');
    const slider = scope?.querySelector<HTMLInputElement>('[data-ag-slider]');
    const hint = scope?.querySelector<HTMLElement>('[data-ag-hint]');
    if (!scope || !track || !pin || !slider) return;

    const stages = Array.from(scope.querySelectorAll<HTMLElement>('[data-stage]'));
    const live = (name: string) => Array.from(scope.querySelectorAll<HTMLElement>(`[data-live="${name}"]`));
    const nodes = {
      hours: live('hours'),
      state: live('state'),
      ago: live('ago'),
      heavy: live('heavy'),
      partly: live('partly'),
      ready: live('ready'),
      announce: live('announce'),
    };
    const write = (list: HTMLElement[], text: string) => {
      for (const node of list) if (node.textContent !== text) node.textContent = text;
    };

    let pinned = false;
    let top = 0;
    let span = 1;
    let cur = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let quietUntil = 0;
    let shownHour = -1;
    let shownStage = -1;
    let announceTimer = 0;

    const render = (hours: number) => {
      for (const [name, value] of Object.entries(frame(hours).vars)) scope.style.setProperty(name, value);
      slider.value = hours.toFixed(1);

      const hour = Math.round(hours);
      if (hour !== shownHour) {
        shownHour = hour;
        const c = counts(hour);
        const word = STATE_WORD[dominant(c)];
        write(nodes.hours, String(hour));
        write(nodes.state, word);
        write(nodes.ago, agoLabel(hour));
        write(nodes.heavy, String(c.heavy));
        write(nodes.partly, String(c.partly));
        write(nodes.ready, String(c.ready));
        slider.setAttribute('aria-valuetext', `${hour} hours after the workout. ${word}.`);
      }
      const stage = stageIndex(hours);
      if (stage !== shownStage) {
        shownStage = stage;
        stages.forEach((el, i) => {
          el.toggleAttribute('data-on', i === stage);
          if (i === stage) el.removeAttribute('aria-hidden');
          else el.setAttribute('aria-hidden', 'true');
        });
      }
    };

    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      cur += (target - cur) * (1 - Math.exp(-dt / 100));
      if (Math.abs(target - cur) < 0.03) {
        cur = target;
        raf = 0;
      } else {
        raf = requestAnimationFrame(step);
      }
      render(cur);
    };

    const onScroll = () => {
      if (!pinned || performance.now() < quietUntil) return;
      const p = clamp((window.scrollY - top) / span, 0, 1);
      target = hoursFromProgress(p);
      if (hint) hint.toggleAttribute('data-gone', p > 0.03);
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    const measure = () => {
      pinned = getComputedStyle(pin).position === 'sticky';
      top = track.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, track.offsetHeight - pin.offsetHeight);
    };

    const settle = () => {
      measure();
      if (pinned) {
        const p = clamp((window.scrollY - top) / span, 0, 1);
        cur = target = hoursFromProgress(p);
        if (hint) hint.toggleAttribute('data-gone', p > 0.03);
      }
      render(cur);
    };

    const announce = (hours: number) => {
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        const c = counts(hours);
        write(
          nodes.announce,
          `${Math.round(hours)} hours after your workout: ${c.heavy} heavy, ${c.partly} partly recovered, ${c.ready} likely ready.`,
        );
      }, 700);
    };

    const onInput = () => {
      const hours = Number(slider.value);
      cur = target = hours;
      render(hours);
      announce(hours);
      if (pinned) {
        quietUntil = performance.now() + 160;
        window.scrollTo({ top: top + progressFromHours(hours) * span, behavior: 'instant' });
      }
    };

    // Native range keys move 0.1 h per press here, so give keyboard users whole hours.
    const onKey = (event: KeyboardEvent) => {
      const jump: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -12, PageUp: 12 };
      let next: number | undefined;
      if (event.key in jump) next = Math.round(Number(slider.value)) + jump[event.key] * (event.shiftKey ? 6 : 1);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = MAX_HOURS;
      if (next === undefined) return;
      event.preventDefault();
      slider.value = String(clamp(next, 0, MAX_HOURS));
      onInput();
    };

    settle();
    const observer = new ResizeObserver(settle);
    observer.observe(track);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', settle);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', settle);
    slider.addEventListener('input', onInput);
    slider.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(announceTimer);
      observer.disconnect();
      motion.removeEventListener('change', settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', settle);
      slider.removeEventListener('input', onInput);
      slider.removeEventListener('keydown', onKey);
    };
  }, []);

  return null;
}
