import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type SelectedTagsProps = StyleProps & {
  children?: ReactNode;
};

const SelectedTags = (props: SelectedTagsProps) => {
  const { children, className = '', style = {} } = props;
  return (
    <div className={`${CLASS_PREFIX}-selected-tags ${className}`} style={style}>
      {children}
    </div>
  );
};

export default SelectedTags;
