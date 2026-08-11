import type { CSSObject, Theme } from '@emotion/react';
import { forwardRef, type ReactNode } from 'react';

import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';

type ChipFieldProps = {
  /** The control row at the top of the box — an input, a trigger, a search. */
  control: ReactNode;
  /** Selected items rendered beneath the control. Omit when nothing is selected. */
  chips?: ReactNode;
  error?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

/**
 * Bordered box holding a control row with selected chips listed beneath it.
 *
 * The frame only — it has no opinion about what the control is, so it backs
 * both the searchable MultiSelect and read-only pickers that open their own
 * dialog.
 *
 * @param props Component props.
 *
 * @returns ChipField element.
 * @since 1.0.0
 */
const ChipField = forwardRef<HTMLDivElement, ChipFieldProps>((props, ref) => {
  const { control, chips, error, disabled, cssOverride } = props;

  return (
    <div
      ref={ref}
      data-error={error ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      css={scopedMerge(styles.root, cssOverride)}
    >
      {control}
      {chips && <div css={scoped(styles.chips)}>{chips}</div>}
    </div>
  );
});

ChipField.displayName = 'ChipField';

export default ChipField;
export type { ChipFieldProps };

/**
 * Styles for the input placed in ChipField's `control` slot, so it reads as
 * part of the box rather than as a nested input.
 */
const chipFieldControlCss: CSSObject = {
  width: '100%',
  minHeight: '36px',
  margin: 0,
  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  border: 'none',
  borderRadius: theme.radius.none,
  backgroundColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
  cursor: 'text',
  ...theme.typography.small(),
  color: theme.colors.text.primary,
  '&::placeholder': {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  '&:disabled': {
    cursor: 'not-allowed',
    color: theme.colors.text.secondary,
  },
  '&:focus, &:focus-visible': {
    outline: 'none',
    boxShadow: 'none',
    borderColor: 'transparent',
  },
};

export { chipFieldControlCss };

const styles = defineStyles({
  root: {
    width: '100%',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    overflow: 'hidden',
    '&:focus-within': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-error="true"]': {
      borderColor: theme.colors.border.critical,
      '&:focus-within': {
        borderColor: theme.colors.border.critical,
        ...uiFocusRing(theme as Theme, theme.colors.border.critical),
      },
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      opacity: 0.8,
    },
  },
  chips: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    padding: theme.spacing[3],
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
});
