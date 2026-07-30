import { type CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { scopedMerge, scoped } from '@/theme/mixins';
import type { TooltipPosition } from '@/types';

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
export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };

const styles = {
  trigger: ({
    display: 'inline-flex',
    alignItems: 'center',
  } satisfies CSSObject),
  content: ({
    zIndex: 1000,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    height: 'max-content',
    width: 'max-content',
    ...theme.typography.small(),
    boxShadow: theme.shadow.md,
  } satisfies CSSObject),
  dark: ({
    backgroundColor: theme.colors.background.inverse,
    boxShadow: 'none',
    color: theme.colors.text.light,
  } satisfies CSSObject),
};
