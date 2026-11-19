import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type SheetFloatMode = 'docked' | 'floating';

type SheetFloatState = {
  mode: SheetFloatMode;
  x: number;
  y: number;
};

const FLOAT_MARGIN = 16;
const FLOAT_MIN_WIDTH = 640;
const DRAG_THRESHOLD = 4;
const DOCKED: SheetFloatState = { mode: 'docked', x: 0, y: 0 };
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"]';

const readStoredState = (storageKey: string | undefined): SheetFloatState => {
  if (!storageKey) {
    return DOCKED;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;

    if (
      parsed &&
      typeof parsed === 'object' &&
      'mode' in parsed &&
      parsed.mode === 'floating' &&
      'x' in parsed &&
      'y' in parsed &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number'
    ) {
      return { mode: 'floating', x: parsed.x, y: parsed.y };
    }
  } catch {
    return DOCKED;
  }

  return DOCKED;
};

const isWideScreen = () => window.innerWidth >= FLOAT_MIN_WIDTH;

const clampPosition = (x: number, y: number, element: HTMLElement | null) => {
  const rect = element?.getBoundingClientRect();
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  const maxX = Math.max(FLOAT_MARGIN, window.innerWidth - width - FLOAT_MARGIN);
  const maxY = Math.max(FLOAT_MARGIN, window.innerHeight - height - FLOAT_MARGIN);

  return {
    x: Math.round(Math.min(Math.max(x, FLOAT_MARGIN), maxX)),
    y: Math.round(Math.min(Math.max(y, FLOAT_MARGIN), maxY)),
  };
};

const useSheetFloat = (storageKey: string | undefined) => {
  const [state, setState] = useState<SheetFloatState>(() => readStoredState(storageKey));
  const [isWide, setIsWide] = useState(isWideScreen);
  const contentRef = useRef<HTMLElement | null>(null);
  const enabled = !!storageKey && isWide;

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      return;
    }
  }, [state, storageKey]);

  const clamp = useCallback(() => {
    setState((current) => {
      if (current.mode !== 'floating') {
        return current;
      }

      const position = clampPosition(current.x, current.y, contentRef.current);

      return position.x === current.x && position.y === current.y
        ? current
        : { ...current, ...position };
    });
  }, []);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const handleResize = () => {
      setIsWide(isWideScreen());
      clamp();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [clamp, storageKey]);

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) {
        return;
      }

      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      const startX = event.clientX;
      const startY = event.clientY;
      const startRect = contentRef.current?.getBoundingClientRect();
      const originX = startRect?.left ?? 0;
      const originY = startRect?.top ?? 0;
      let dragging = false;

      const handleMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (!dragging && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
          return;
        }

        dragging = true;
        moveEvent.preventDefault();
        setState({
          mode: 'floating',
          ...clampPosition(originX + deltaX, originY + deltaY, contentRef.current),
        });
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [enabled],
  );

  const dock = useCallback(() => {
    setState(DOCKED);
  }, []);

  return useMemo(
    () => ({
      enabled,
      floating: enabled && state.mode === 'floating',
      position: { x: state.x, y: state.y },
      contentRef,
      startDrag,
      dock,
      clamp,
    }),
    [clamp, dock, enabled, startDrag, state],
  );
};

type SheetFloat = ReturnType<typeof useSheetFloat>;

export { FLOAT_MARGIN, useSheetFloat };
export type { SheetFloat };
