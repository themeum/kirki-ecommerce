import type { SerializedStyles } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';

type TagProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  text?: ReactNode;
  subText?: ReactNode;
  img?: ReactNode;
  color?: string;
  gap?: number;
  closeIcon?: ReactNode;
  onTagRemove?: () => void;
  css?: SerializedStyles;
};

const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  const {
    css: cssProp,
    text,
    subText,
    img,
    color,
    gap = 8,
    closeIcon,
    style,
    onTagRemove = () => {},
    ...rest
  } = props;

  const tagStyle = {
    ...(color !== undefined ? { '--tag-swatch-color': color } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} style={tagStyle} css={[styles.root, cssProp]} {...rest}>
      <Flex gap={gap} style={{ alignItems: 'center' }}>
        {img}
        {color && <div css={styles.swatch} aria-hidden="true" />}
        {text}
        {subText && <span css={styles.subtext}>{subText}</span>}
        {closeIcon && (
          <button
            type="button"
            css={styles.close}
            onClick={onTagRemove}
            aria-label="Remove tag"
          >
            {closeIcon}
          </button>
        )}
      </Flex>
    </div>
  );
});

Tag.displayName = 'Tag';

export default Tag;

const styles = {
  root: scoped({
    ...flexCenter(),
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.sm,
    width: 'max-content',
    gap: theme.spacing.md,
    fontSize: '12px',
    lineHeight: '18px',
  }),
  subtext: scoped({
    color: theme.colors.text.subdued,
  }),
  swatch: scoped({
    borderRadius: theme.radius.full,
    height: '16px',
    width: '16px',
    backgroundColor: 'var(--tag-swatch-color)',
  }),
  close: scoped({
    ...flexCenter(),
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    appearance: 'none',
  }),
};
