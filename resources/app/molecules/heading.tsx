import type { CSSProperties } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';
import type { HeadingType } from '@/types';

type HeadingProps = {
  type?: HeadingType;
  text?: string;
  className?: string;
  style?: CSSProperties;
};

const Heading = ({
  type = '',
  text = __('Heading', 'kirki-ecommerce'),
  className = '',
  style = {},
}: HeadingProps) => {
  const headingVariants = {
    type: {
      primary: `${CLASS_PREFIX}-heading-primary`,
      secondary: `${CLASS_PREFIX}-heading-secondary`,
      tertiary: `${CLASS_PREFIX}-heading-tertiary`,
    },
    default: `${CLASS_PREFIX}-heading`,
  };

  const allClassNames = classNames(
    headingVariants.default,
    type ? headingVariants.type[type] : undefined,
    className,
  );
  return (
    <span className={allClassNames} style={style}>
      {text}
    </span>
  );
};

export default Heading;
