import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { FlexDirection } from '@/types';

type FlexProps = HTMLAttributes<HTMLDivElement> & {
  direction?: FlexDirection;
  gap?: number;
};

const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const {
    children,
    direction,
    gap,
    style = {},
    className,
    ...rest
  } = props;

  const flexStyle: CSSProperties = {
    ...(gap !== undefined ? { gap } : {}),
    ...style,
  };

  return (
    <div
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-flex`,
        direction && `${CLASS_PREFIX}-ui-flex--${direction}`,
        className,
      )}
      style={flexStyle}
      {...rest}
    >
      {children}
    </div>
  );
});

Flex.displayName = 'Flex';

export default Flex;
