import type { CSSObject } from '@emotion/react';
import {
  Children,
  type ForwardedRef,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';

import Button from '@/components/ui/button';
import useChipRowCap from '@/components/ui/chip/use-chip-row-cap';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ChipInputProps = {
  /** The control sharing the row with the chips — an input, a trigger, a search. */
  control: ReactNode;
  /** Selected items rendered before the control. Omit when nothing is selected. */
  chips?: ReactNode;
  /** Rows of chips to show before the rest collapse behind a "+N more" control. */
  maxVisibleRows?: number;
  error?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const assignRef = <T,>(ref: ForwardedRef<T>, node: T | null) => {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }

  if (ref) {
    ref.current = node;
  }
};

/**
 * Bordered box whose chips and control share one wrapping row, matching the
 * MultiSelect box.
 *
 * The frame only — it has no opinion about what the control is, so it backs
 * a plain text input as well as read-only pickers that open their own
 * dialog or popover.
 *
 * @param props Component props.
 *
 * @returns ChipInput element.
 * @since 1.0.0
 */
const ChipInput = forwardRef<HTMLDivElement, ChipInputProps>((props, ref) => {
  const { control, chips, maxVisibleRows, error, disabled, cssOverride } = props;
  const boxRef = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const setBoxRef = useCallback(
    (node: HTMLDivElement | null) => {
      boxRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const chipNodes = Children.toArray(chips);
  const { visibleCount, hiddenCount, isCapped, isShowingAll, setIsExpanded } = useChipRowCap({
    boxRef,
    chipsRef,
    total: chipNodes.length,
    maxVisibleRows,
  });

  const handleBoxClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || (event.target as HTMLElement).closest('button')) {
      return;
    }

    event.currentTarget.querySelector('input')?.focus();
  };

  return (
    <div
      ref={setBoxRef}
      role="presentation"
      data-error={error ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      css={scopedMerge(styles.box, cssOverride)}
      onClick={handleBoxClick}
    >
      <div ref={chipsRef} role="presentation" css={scoped(styles.chipsGuard)}>
        {chipNodes.slice(0, visibleCount).map((chip, index) => (
          <div key={index} data-chip="" css={scoped(styles.chip)}>
            {chip}
          </div>
        ))}
        {isCapped && !isShowingAll && (
          <Button
            variant="link"
            cssOverride={styles.moreButton}
            onClick={() => setIsExpanded(true)}
          >
            {sprintf(__('+%d more', 'kirki-ecommerce'), hiddenCount)}
          </Button>
        )}
        {isShowingAll && (
          <Button
            variant="link"
            cssOverride={styles.moreButton}
            onClick={() => setIsExpanded(false)}
          >
            {__('Show less', 'kirki-ecommerce')}
          </Button>
        )}
      </div>
      <div css={scoped(styles.control)}>{control}</div>
    </div>
  );
});

ChipInput.displayName = 'ChipInput';

export default ChipInput;
export type { ChipInputProps };

const styles = defineStyles({
  box: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
    width: '100%',
    minHeight: '32px',
    padding: `${theme.spacing[1]} ${theme.spacing[1]}`,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    cursor: 'text',
    '&:focus-within': {
      borderColor: theme.colors.background.fillBrand,
      ...uiFocusRing(theme),
    },
    '&[data-error="true"]': {
      borderColor: theme.colors.background.fillCritical,
      '&:focus-within': {
        borderColor: theme.colors.background.fillCritical,
      },
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      opacity: 0.8,
      cursor: 'not-allowed',
    },
  },
  chipsGuard: {
    display: 'contents',
  },
  chip: {
    maxWidth: '100%',
    minWidth: 0,
  },
  moreButton: {
    height: 'auto',
    padding: 0,
    ...theme.typography.small('medium'),
    color: theme.colors.text.emphasis,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  control: {
    display: 'flex',
    flex: 1,
    minWidth: '80px',
  },
});
