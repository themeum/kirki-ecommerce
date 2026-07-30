import { type SerializedStyles, type CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import { theme } from '@/theme';
import { itemCenter, scopedMerge } from '@/theme/mixins';

type SelectedTagsProps = {
  children?: ReactNode;
  hasBorderRadius?: boolean;
  css?: SerializedStyles;
};

const SelectedTags = (props: SelectedTagsProps) => {
  const { children, hasBorderRadius = false, css: cssProp } = props;

  return (
    <div
      css={scopedMerge(styles.root, hasBorderRadius && styles.hasBorderRadius, cssProp)}
    >
      {children}
    </div>
  );
};

SelectedTags.displayName = 'SelectedTags';

export default SelectedTags;

const styles = {
  root: ({
    minHeight: '52.2px',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.default}`,
    padding: theme.spacing[3],
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    overflow: 'hidden',
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
  } satisfies CSSObject),
  hasBorderRadius: ({
    borderRadius: theme.radius.lg,
  } satisfies CSSObject),
};
