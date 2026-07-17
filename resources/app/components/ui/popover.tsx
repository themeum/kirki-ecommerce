import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import { getPortalContainer } from '@/libs/portal-container';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>((props, ref) => {
  const { className, align = 'center', sideOffset = 4, ...rest } = props;

  return (
    <PopoverPrimitive.Portal container={getPortalContainer()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={classNames(`${CLASS_PREFIX}-ui-popover-content`, className)}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});

PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
