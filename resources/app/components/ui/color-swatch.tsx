import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type ColorSwatchProps = {
  color?: string | null;
  size?: number;
  cssOverride?: CSSObject;
};

/**
 * Round colour dot used to preview a colour value beside a label.
 *
 * @param props Component props.
 *
 * @returns ColorSwatch element, or null when no colour is set.
 * @since 1.0.0
 */
const ColorSwatch = ({ color, size = 16, cssOverride }: ColorSwatchProps) => {
  if (!color) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      style={{ ['--swatch-color' as string]: color, ['--swatch-size' as string]: `${size}px` }}
      css={scopedMerge(styles.swatch, cssOverride)}
    />
  );
};

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;
export type { ColorSwatchProps };

const styles = defineStyles({
  swatch: {
    display: 'inline-block',
    flexShrink: 0,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: 'var(--swatch-color)',
    width: 'var(--swatch-size)',
    height: 'var(--swatch-size)',
  },
});
