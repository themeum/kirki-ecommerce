import type { CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge } from '@/theme/mixins';
import type { GapValue } from '@/types/components/common';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type ChipProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  text?: ReactNode;
  subText?: ReactNode;
  img?: ReactNode;
  color?: string;
  gap?: GapValue;
  closeIcon?: ReactNode;
  onRemove?: () => void;
  cssOverride?: CSSObject;
};

const Chip = forwardRef<HTMLDivElement, ChipProps>((props, ref) => {
  const {
    cssOverride,
    text,
    subText,
    img,
    color,
    gap = 2,
    closeIcon,
    style,
    onRemove = noop,
    ...rest
  } = props;

  const chipStyle = defineStyles({
    ...(color !== undefined ? { '--chip-swatch-color': color } : {}),
    ...style,
  });

  return (
    <div ref={ref} style={chipStyle} css={scopedMerge(styles.root, cssOverride)} {...rest}>
      <Flex gap={gap} align="center" cssOverride={styles.content}>
        {img}
        {color && <div css={scoped(styles.swatch)} aria-hidden="true" />}
        {text !== undefined && <span css={scoped(styles.text)}>{text}</span>}
        {subText && <span css={scoped(styles.subtext)}>{subText}</span>}
        {closeIcon && (
          <button
            type="button"
            css={scoped(styles.close)}
            onClick={onRemove}
            aria-label={__('Remove', 'kirki-ecommerce')}
          >
            {closeIcon}
          </button>
        )}
      </Flex>
    </div>
  );
});

Chip.displayName = 'Chip';

export default Chip;
export type { ChipProps };

const styles = defineStyles({
  root: {
    ...flexCenter(),
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.sm,
    width: 'max-content',
    minWidth: 0,
    overflow: 'hidden',
    gap: theme.spacing[2],
    ...theme.typography.small('medium'),
  },
  // Every flex item between the root and a truncating chip label has to
  // shrink below its content size for that label's own ellipsis to engage —
  // this is what lets it.
  content: {
    minWidth: 0,
  },
  text: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subtext: {
    color: theme.colors.text.subdued,
  },
  swatch: {
    borderRadius: theme.radius.full,
    height: '1rem',
    width: '1rem',
    backgroundColor: 'var(--chip-swatch-color)',
  },
  close: {
    ...flexCenter(),
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    appearance: 'none',
  },
});
