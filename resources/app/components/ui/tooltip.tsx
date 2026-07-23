import { type SerializedStyles, type Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';
import type { TooltipPosition } from '@/types';

const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  tip?: ReactNode;
  children?: ReactNode;
  type?: string;
  position?: TooltipPosition;
  offset?: number;
  style?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['style'];
  css?: SerializedStyles;
  delayDuration?: number;
};

const Tooltip = ({
  tip,
  children,
  type,
  position = 'bottom',
  offset = 2,
  style,
  css: cssProp,
  delayDuration = 200,
}: TooltipProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span css={styles.trigger}>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={getPortalContainer()}>
          <TooltipPrimitive.Content
            side={position}
            sideOffset={offset}
            css={[styles.content, type === 'dark' && styles.dark, cssProp]}
            style={style}
          >
            {tip}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
};

Tooltip.displayName = 'Tooltip';

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = Omit<
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  'className' | 'css'
> & {
  dark?: boolean;
  css?: SerializedStyles;
};

const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>((props, ref) => {
  const { css: cssProp, sideOffset = 4, dark, ...rest } = props;

  return (
    <TooltipPrimitive.Portal container={getPortalContainer()}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        css={[styles.content, dark && styles.dark, cssProp]}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
});

TooltipContent.displayName = 'TooltipContent';

export default Tooltip;
export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };

const styles = {
  trigger: scoped({
    display: 'inline-flex',
    alignItems: 'center',
  }),
  content: scoped({
    zIndex: 1000,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    height: 'max-content',
    width: 'max-content',
    ...fontGeneralSettings(theme as Theme),
    boxShadow: '0px 4px 6px -1px #0000001a',
  }),
  dark: scoped({
    backgroundColor: theme.colors.background.inverse,
    boxShadow: 'none',
    color: theme.colors.text.light,
  }),
};
