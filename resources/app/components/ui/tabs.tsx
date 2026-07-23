import { type SerializedStyles, type Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { theme } from '@/theme';
import { flexCenter, fontGeneralSettings, scoped, uiFocusRing } from '@/theme/mixins';

const Tabs = TabsPrimitive.Root;

type TabsListProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <TabsPrimitive.List ref={ref} css={[styles.list, cssProp]} {...rest} />;
  },
);

TabsList.displayName = 'TabsList';

type TabsTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <TabsPrimitive.Trigger ref={ref} css={[styles.trigger, cssProp]} {...rest} />;
});

TabsTrigger.displayName = 'TabsTrigger';

type TabsContentProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <TabsPrimitive.Content ref={ref} css={[styles.content, cssProp]} {...rest} />;
});

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };

const styles = {
  list: scoped({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
    minHeight: '36px',
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
    fontWeight: 500,
    color: theme.colors.text.secondary,
  }),
  trigger: scoped({
    flex: 1,
    height: '100%',
    minHeight: '28px',
    padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
    border: 'none',
    borderRadius: theme.radius.sm,
    backgroundColor: 'transparent',
    color: theme.colors.text.secondary,
    fontFamily: 'inherit',
    fontWeight: 500,
    fontSize: '14px',
    lineHeight: '20px',
    cursor: 'pointer',
    ...flexCenter(),
    whiteSpace: 'nowrap',
    '&[data-state="active"]': {
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.text.primary,
      boxShadow: '0px 1px 2px 0px #0000000d',
    },
    '&:focus-visible': {
      ...uiFocusRing(theme as Theme),
    },
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  content: scoped({
    marginTop: theme.spacing['2xl'],
    ...fontGeneralSettings(theme as Theme),
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  }),
};
