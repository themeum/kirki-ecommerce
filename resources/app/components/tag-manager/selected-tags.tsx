import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type SelectedTagsProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const SelectedTags = (props: SelectedTagsProps) => {
  const { children, className, style = {} } = props;

  return (
    <div
      className={classNames(`${CLASS_PREFIX}-selected-tags`, className)}
      style={style}
    >
      {children}
    </div>
  );
};

SelectedTags.displayName = 'SelectedTags';

export default SelectedTags;
