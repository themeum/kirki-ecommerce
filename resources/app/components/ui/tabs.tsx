import { type CSSObject } from '@emotion/react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';

const Tabs = TabsPrimitive.Root;

type TabsListProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>((props, ref) => {
  const { cssOverride, children, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const measureIndicator = useCallback(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;

    if (!container || !indicator) {
      return;
    }

    const active = container.querySelector<HTMLElement>('[role="tab"][data-state="active"]');

    if (!active) {
      indicator.style.opacity = '0';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    indicator.style.opacity = '1';
    indicator.style.width = `${activeRect.width}px`;
    indicator.style.transform = `translateX(${activeRect.left - containerRect.left}px)`;
  }, []);

  useLayoutEffect(() => {
    measureIndicator();
  });

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(measureIndicator);
    observer.observe(container);

    return () => observer.disconnect();
  }, [measureIndicator]);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  return (
    <TabsPrimitive.List ref={setRefs} css={scopedMerge(styles.list, cssOverride)} {...rest}>
      <span ref={indicatorRef} aria-hidden="true" css={scoped(styles.indicator)} />
      {children}
    </TabsPrimitive.List>
  );
});

TabsList.displayName = 'TabsList';

type TabsTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <TabsPrimitive.Trigger ref={ref} css={scopedMerge(styles.trigger, cssOverride)} {...rest} />
    );
  },
);

TabsTrigger.displayName = 'TabsTrigger';

type TabsContentProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, TabsContentProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <TabsPrimitive.Content ref={ref} css={scopedMerge(styles.content, cssOverride)} {...rest} />
    );
  },
);

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };

const styles = defineStyles({
  list: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceAlt,
    borderRadius: theme.radius.lg,
    minHeight: '28px',
    maxHeight: '28px',
    color: theme.colors.text.secondary,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    opacity: 0,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fillSecondary,
    transition: 'transform 0.15s ease, width 0.15s ease, opacity 0.15s ease',
    willChange: 'transform',
    pointerEvents: 'none',
  },
  trigger: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    height: '100%',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    border: 'none',
    borderRadius: theme.radius.lg,
    backgroundColor: 'transparent',
    ...theme.typography.small('medium'),
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    ...flexCenter(),
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.colors.text.primary,
    },
    '&[data-state="active"]': {
      color: theme.colors.text.emphasis,
    },
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
  content: {
    marginTop: theme.spacing[4],
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  },
});
