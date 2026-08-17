import { type CSSObject } from '@emotion/react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef, type ReactNode } from 'react';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import type { TooltipPosition } from '@/types/components/common';

const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  tip?: ReactNode;
  children?: ReactNode;
  type?: string;
  position?: TooltipPosition;
  offset?: number;
  style?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['style'];
  cssOverride?: CSSObject;
  delayDuration?: number;
};

const Tooltip = ({
  tip,
  children,
  type,
  position = 'bottom',
  offset = 2,
  style,
  cssOverride,
  delayDuration = 200,
}: TooltipProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span css={scoped(styles.trigger)}>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={getPortalContainer()}>
          <TooltipPrimitive.Content
            side={position}
            sideOffset={offset}
            css={scopedMerge(styles.content, type === 'dark' && styles.dark, cssOverride)}
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
  cssOverride?: CSSObject;
};

const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>((props, ref) => {
  const { cssOverride, sideOffset = 4, dark, ...rest } = props;

  return (
    <TooltipPrimitive.Portal container={getPortalContainer()}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        css={scopedMerge(styles.content, dark && styles.dark, cssOverride)}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
});

TooltipContent.displayName = 'TooltipContent';

export default Tooltip;
export { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger };

const styles = defineStyles({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  content: {
    zIndex: theme.zIndex.tooltip,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.inverse,
    color: theme.colors.text.light,
    height: 'max-content',
    width: 'max-content',
    ...theme.typography.small(),
    boxShadow: 'none',
    maxWidth: '320px',
  },
  dark: {
    backgroundColor: theme.colors.background.inverse,
    boxShadow: 'none',
    color: theme.colors.text.light,
  },
});
