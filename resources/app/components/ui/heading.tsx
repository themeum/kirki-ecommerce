import { forwardRef, type CSSProperties } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { HeadingType } from '@/types';
import { __ } from '@/wpi18n';

type HeadingProps = {
  type?: HeadingType;
  text?: string;
  className?: string;
  style?: CSSProperties;
};

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>((props, ref) => {
  const {
    type = '',
    text = __('Heading', 'kirki-ecommerce'),
    className,
    style = {},
  } = props;

  return (
    <h2
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-heading`,
        type && `${CLASS_PREFIX}-ui-heading--${type}`,
        className,
      )}
      style={style}
    >
      {text}
    </h2>
  );
});

Heading.displayName = 'Heading';

export default Heading;
