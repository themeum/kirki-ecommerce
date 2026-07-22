import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import { getPortalContainer } from '@/libs/portal-container';
import type { TooltipPosition } from '@/types';

const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  tip?: ReactNode;
  children?: ReactNode;
  type?: string;
  position?: TooltipPosition;
  offset?: number;
  style?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['style'];
  className?: string;
  delayDuration?: number;
};

const Tooltip = ({
  tip,
  children,
  type,
  position = 'bottom',
  offset = 2,
  style,
  className,
  delayDuration = 200,
}: TooltipProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className={`${CLASS_PREFIX}-ui-tooltip-trigger`}>
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={getPortalContainer()}>
          <TooltipPrimitive.Content
            side={position}
            sideOffset={offset}
            className={classNames(
              `${CLASS_PREFIX}-ui-tooltip`,
              type === 'dark' && `${CLASS_PREFIX}-ui-tooltip--dark`,
              className,
            )}
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

const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    dark?: boolean;
  }
>((props, ref) => {
  const { className, sideOffset = 4, dark, ...rest } = props;

  return (
    <TooltipPrimitive.Portal container={getPortalContainer()}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={classNames(
          `${CLASS_PREFIX}-ui-tooltip`,
          dark && `${CLASS_PREFIX}-ui-tooltip--dark`,
          className,
        )}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
});

TooltipContent.displayName = 'TooltipContent';

export default Tooltip;
export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
