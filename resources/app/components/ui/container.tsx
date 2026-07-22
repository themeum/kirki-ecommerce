import { forwardRef, type HTMLAttributes } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { ContainerSize } from '@/types';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize;
  scrollable?: boolean;
};

const Container = forwardRef<HTMLDivElement, ContainerProps>((props, ref) => {
  const { children, className, size, scrollable, ...rest } = props;

  return (
    <div
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-container`,
        size && `${CLASS_PREFIX}-ui-container--${size}`,
        scrollable && `${CLASS_PREFIX}-ui-container--scrollable`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Container.displayName = 'Container';

export default Container;
