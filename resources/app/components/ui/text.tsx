import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import { CLASS_PREFIX } from '@/conf';
import type { TextType } from '@/types';

type TextProps = {
  type?: TextType;
  header?: ReactNode;
  subHeader?: ReactNode;
  style?: CSSProperties;
  className?: string;
  padding?: 'large' | 'small';
  emphasis?: boolean;
  leftIcon?: ReactNode;
  gap?: number;
  badge?: ReactNode;
};

const Text = forwardRef<HTMLDivElement, TextProps>((props, ref) => {
  const {
    type,
    header,
    subHeader,
    style = {},
    className,
    padding,
    emphasis,
    leftIcon,
    gap = 8,
    badge,
  } = props;

  return (
    <Flex ref={ref} gap={gap} style={{ alignItems: 'center' }}>
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-ui-text-icon`} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <div
        className={classNames(
          `${CLASS_PREFIX}-ui-text`,
          type && `${CLASS_PREFIX}-ui-text--${type}`,
          padding && `${CLASS_PREFIX}-ui-text--padding-${padding}`,
          emphasis && `${CLASS_PREFIX}-ui-text--emphasis`,
          className,
        )}
        style={style}
      >
        {header && (
          <Flex gap={8}>
            <span className={`${CLASS_PREFIX}-ui-text-heading`}>{header}</span>
            {badge && <span>{badge}</span>}
          </Flex>
        )}
        {subHeader && (
          <span className={`${CLASS_PREFIX}-ui-text-subheading`}>
            {subHeader}
          </span>
        )}
      </div>
    </Flex>
  );
});

Text.displayName = 'Text';

export default Text;
