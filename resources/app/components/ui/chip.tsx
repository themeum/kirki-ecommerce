import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { flexCenter, scopedMerge, scoped } from '@/theme/mixins';
import type { GapValue } from '@/types';
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
    onRemove = () => {},
    ...rest
  } = props;

  const chipStyle = {
    ...(color !== undefined ? { '--chip-swatch-color': color } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} style={chipStyle} css={scopedMerge(styles.root, cssOverride)} {...rest}>
      <Flex gap={gap} align="center">
        {img}
        {color && <div css={scoped(styles.swatch)} aria-hidden="true" />}
        {text}
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

const styles = {
  root: ({
    ...flexCenter(),
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.sm,
    width: 'max-content',
    gap: theme.spacing[2],
    ...theme.typography.small('medium'),
  } satisfies CSSObject),
  subtext: ({
    color: theme.colors.text.subdued,
  } satisfies CSSObject),
  swatch: ({
    borderRadius: theme.radius.full,
    height: '16px',
    width: '16px',
    backgroundColor: 'var(--chip-swatch-color)',
  } satisfies CSSObject),
  close: ({
    ...flexCenter(),
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    appearance: 'none',
  } satisfies CSSObject),
};
