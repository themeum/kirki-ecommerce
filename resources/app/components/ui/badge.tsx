import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { BadgeType } from '@/types';

type BadgeProps = {
  type?: BadgeType;
  state?: 'disabled';
  className?: string;
  text?: ReactNode;
  style?: CSSProperties;
  leftIcon?: ReactNode;
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  const {
    type = 'default',
    state,
    className,
    text,
    style,
    leftIcon,
  } = props;

  return (
    <span
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-badge`,
        `${CLASS_PREFIX}-ui-badge--${type}`,
        state === 'disabled' && `${CLASS_PREFIX}-ui-badge--disabled`,
        className,
      )}
      style={style}
    >
      {leftIcon}
      {text}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
