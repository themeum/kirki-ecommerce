import { type KeyboardEvent, type MouseEvent as ReactMouseEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type HorizontalScrollbarProps = {
  containerRef: RefObject<HTMLElement | null>;
};

const MIN_THUMB_WIDTH = 40;

/**
 * A custom horizontal scrollbar pinned to the viewport bottom so it stays
 * reachable without scrolling to the last row of a 1000-row grid. Drives —
 * and is driven by — the scroll container's own `scrollLeft`; the
 * container's native scrollbar is hidden via CSS in bulk-edit-table.tsx.
 */
const HorizontalScrollbar = ({ containerRef }: HorizontalScrollbarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, visible: false });
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);

  /**
   * `track` only exists once `thumb.visible` is already true (it's inside
   * the `if (!thumb.visible) return null` branch below) — so on the very
   * first overflow, there's no track element yet to measure. Becoming
   * visible with a placeholder geometry is enough to mount it; the track's
   * ref callback calls `syncThumb` again once it exists, which then has a
   * real `trackWidth` to compute the actual thumb size/position from.
   */
  const syncThumb = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const { scrollWidth, clientWidth, scrollLeft } = container;
    if (scrollWidth <= clientWidth) {
      setThumb({ left: 0, width: 0, visible: false });
      return;
    }

    const track = trackRef.current;
    if (!track) {
      setThumb((previous) => (previous.visible ? previous : { left: 0, width: 0, visible: true }));
      return;
    }

    const trackWidth = track.clientWidth;
    const width = Math.max(MIN_THUMB_WIDTH, (clientWidth / scrollWidth) * trackWidth);
    const maxLeft = trackWidth - width;
    const left = (scrollLeft / (scrollWidth - clientWidth)) * maxLeft;

    setThumb({ left, width, visible: true });
  }, [containerRef]);

  const trackRefCallback = useCallback(
    (element: HTMLDivElement | null) => {
      trackRef.current = element;
      if (element) {
        syncThumb();
      }
    },
    [syncThumb],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    syncThumb();
    container.addEventListener('scroll', syncThumb);
    const resizeObserver = new ResizeObserver(syncThumb);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', syncThumb);
      resizeObserver.disconnect();
    };
  }, [containerRef, syncThumb]);

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const drag = dragRef.current;
      const container = containerRef.current;
      const track = trackRef.current;
      if (!drag || !container || !track) {
        return;
      }

      const trackWidth = track.clientWidth;
      const { scrollWidth, clientWidth } = container;
      const deltaX = event.clientX - drag.startX;
      const scrollableWidth = scrollWidth - clientWidth;
      const scrollableTrack = trackWidth - Math.max(MIN_THUMB_WIDTH, (clientWidth / scrollWidth) * trackWidth);

      container.scrollLeft = drag.startScrollLeft + deltaX * (scrollableWidth / Math.max(scrollableTrack, 1));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  const handleThumbMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startScrollLeft: containerRef.current?.scrollLeft ?? 0 };
  };

  const handleTrackMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || event.target !== track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const clickRatio = (event.clientX - rect.left) / rect.width;
    container.scrollLeft = clickRatio * (container.scrollWidth - container.clientWidth);
  };

  if (!thumb.visible) {
    return null;
  }

  const handleThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      container.scrollLeft -= 40;
    } else if (event.key === 'ArrowRight') {
      container.scrollLeft += 40;
    }
  };

  return (
    <div css={scoped(styles.wrapper)}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- click-to-jump convenience on the track; the actual keyboard-operable control is the role="scrollbar" thumb below */}
      <div ref={trackRefCallback} css={scoped(styles.track)} onMouseDown={handleTrackMouseDown}>
        <div
          role="scrollbar"
          aria-controls="bulk-edit-scroll-container"
          aria-orientation="horizontal"
          aria-valuenow={Math.round(thumb.left)}
          tabIndex={0}
          css={scoped(styles.thumb)}
          style={{ left: thumb.left, width: thumb.width }}
          onMouseDown={handleThumbMouseDown}
          onKeyDown={handleThumbKeyDown}
        />
      </div>
    </div>
  );
};

HorizontalScrollbar.displayName = 'HorizontalScrollbar';

export default HorizontalScrollbar;

const styles = defineStyles({
  wrapper: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.sticky,
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    backgroundColor: theme.colors.background.surface,
    borderTop: `1px solid ${theme.colors.border.tertiary}`,
  },
  track: {
    position: 'relative',
    height: 8,
    width: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceAlt,
    cursor: 'pointer',
  },
  thumb: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillBrand,
    cursor: 'grab',
  },
});
