import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
} from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type SeparatorProps = ComponentPropsWithoutRef<
  typeof SeparatorPrimitive.Root
> & {
  marginTop?: string | number;
  marginBottom?: string | number;
  color?: string;
  height?: string | number;
};

const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>((props, ref) => {
  const {
    className,
    orientation = 'horizontal',
    decorative = true,
    marginTop,
    marginBottom,
    color,
    height,
    style,
    ...rest
  } = props;

  const resolvedStyle: CSSProperties = {
    ...(marginTop !== undefined ? { marginTop } : null),
    ...(marginBottom !== undefined ? { marginBottom } : null),
    ...(color !== undefined ? { backgroundColor: color } : null),
    ...(height !== undefined
      ? orientation === 'horizontal'
        ? { height }
        : { width: height }
      : null),
    ...style,
  };

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
      style={resolvedStyle}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator };
