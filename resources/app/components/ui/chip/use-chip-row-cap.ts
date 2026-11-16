import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

import { countChipsWithinRows } from '@/components/ui/chip/config';

type ChipRowCapOptions = {
  boxRef: RefObject<HTMLDivElement | null>;
  chipsRef: RefObject<HTMLDivElement | null>;
  total: number;
  maxVisibleChips?: number;
  maxVisibleRows?: number;
};

type ChipRowCap = {
  visibleCount: number;
  hiddenCount: number;
  isCapped: boolean;
  isShowingAll: boolean;
  setIsExpanded: (expanded: boolean) => void;
};

/**
 * Caps a wrapping row of chips to a count of chips or a count of rendered
 * rows, and owns the expand and collapse state behind the "+N more" control.
 *
 * A row cap is measured from the `[data-chip]` elements under `chipsRef`, so
 * only fields that ask for one pay for the ResizeObserver and the layout
 * passes. Without either cap every chip is visible.
 *
 * @param options Refs to the box and the chips, the chip total and the caps.
 *
 * @returns How many chips to show and the controls to expand and collapse.
 * @since 1.0.0
 */
const useChipRowCap = ({
  boxRef,
  chipsRef,
  total,
  maxVisibleChips,
  maxVisibleRows,
}: ChipRowCapOptions): ChipRowCap => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const passRef = useRef(0);
  const measuredRef = useRef('');

  // Both caps collapse to one number here, so everything downstream — the
  // slice, the counter, the expand and collapse controls — is shared. A row
  // cap contributes nothing until it has been measured, and that first
  // unmeasured render is what the measurement reads.
  const effectiveCap =
    maxVisibleChips ?? (maxVisibleRows !== undefined ? (rowCount ?? undefined) : undefined);
  const isCapped = effectiveCap !== undefined && total > effectiveCap;
  // Derived rather than reset in an effect: a selection that falls back
  // within the cap has nothing left to expand, so the flag stops counting.
  const isShowingAll = isExpanded && isCapped;
  const visibleCount = isCapped && !isShowingAll ? effectiveCap : total;
  const hiddenCount = total - visibleCount;

  // Only a row-capped field pays for an observer. Width is held in state
  // rather than read during measurement so that a resize re-runs the
  // measurement rather than silently leaving a stale cut in place. The
  // observer's first notification reports the size the mount measurement
  // already used, so it is skipped rather than paid for as a re-measure.
  useLayoutEffect(() => {
    if (maxVisibleRows === undefined) {
      return;
    }

    const node = boxRef.current;

    if (!node) {
      return;
    }

    let isInitialNotification = true;

    const observer = new ResizeObserver(([entry]) => {
      if (isInitialNotification) {
        isInitialNotification = false;
        return;
      }

      setBoxWidth(entry.contentRect.width);
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [maxVisibleRows, boxRef]);

  // Runs after layout but before paint, so chips cut from the row are never
  // shown. Deliberately has no dependency array: the second pass has to read
  // a DOM that only exists once the first pass's result has rendered. The
  // recursion the rule warns about is bounded by `passRef`, and settles
  // sooner because React skips a re-render when both passes agree.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (maxVisibleRows === undefined || isShowingAll) {
      return;
    }

    const key = `${maxVisibleRows}|${total}|${boxWidth}`;

    // A new key needs every chip in the DOM before it can be measured. When
    // a cut is in place that takes one reset render; when nothing is cut yet
    // the DOM is already complete, and waiting for a render that React would
    // skip as a no-op would leave the row unmeasured.
    if (measuredRef.current !== key) {
      measuredRef.current = key;
      passRef.current = 0;

      if (rowCount !== null) {
        setRowCount(null);
        return;
      }
    }

    // Rendering the counter consumes width on the last visible row and can
    // push the chip before it onto the next one, which changes the answer.
    // A second pass reads the row with the counter in place; past that the
    // frames cost more than the precision is worth, so the tighter of the
    // two cuts wins.
    if (passRef.current >= 2) {
      return;
    }

    passRef.current += 1;

    const tops = Array.from(
      chipsRef.current?.querySelectorAll<HTMLElement>('[data-chip]') ?? [],
    ).map((chip) => chip.offsetTop);
    const fitted = countChipsWithinRows(tops, maxVisibleRows);

    setRowCount((previous) => (previous === null ? fitted : Math.min(previous, fitted)));
  });

  return { visibleCount, hiddenCount, isCapped, isShowingAll, setIsExpanded };
};

export default useChipRowCap;
export type { ChipRowCapOptions };
