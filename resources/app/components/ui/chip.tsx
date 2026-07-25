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
  css?: SerializedStyles;
};

const Chip = forwardRef<HTMLDivElement, ChipProps>((props, ref) => {
  const {
    css: cssProp,
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
    <div ref={ref} style={chipStyle} css={[styles.root, cssProp]} {...rest}>
      <Flex gap={gap} align="center">
        {img}
        {color && <div css={styles.swatch} aria-hidden="true" />}
        {text}
        {subText && <span css={styles.subtext}>{subText}</span>}
        {closeIcon && (
          <button
            type="button"
            css={styles.close}
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
  root: scoped({
    ...flexCenter(),
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.sm,
    width: 'max-content',
    gap: theme.spacing[2],
    ...theme.typography.small('medium'),
  }),
  subtext: scoped({
    color: theme.colors.text.subdued,
  }),
  swatch: scoped({
    borderRadius: theme.radius.full,
    height: '16px',
    width: '16px',
    backgroundColor: 'var(--chip-swatch-color)',
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
