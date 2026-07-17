import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>((props, ref) => {
  const {
    className,
    orientation = 'horizontal',
    decorative = true,
    ...rest
  } = props;

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={classNames(
        `${CLASS_PREFIX}-ui-separator`,
        `${CLASS_PREFIX}-ui-separator--${orientation}`,
        className,
      )}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator };
