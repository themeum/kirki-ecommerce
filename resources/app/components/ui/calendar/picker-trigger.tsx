import type { CSSObject } from '@emotion/react';
import { CalendarDays, X } from 'lucide-react';
import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { PopoverAnchor, PopoverTrigger } from '@/components/ui/popover';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped, uiFocusRing } from '@/theme/mixins';

type PickerTriggerProps = {
  id?: string;
  controlsId: string;
  ariaHasPopup: 'grid' | 'dialog';
  open: boolean;
  label: ReactNode;
  placeholder: string;
  clearLabel: string;
  onClear?: () => void;
  disabled?: boolean;
  error?: boolean;
  cssOverride?: CSSObject;
};

/**
 * Shared popover trigger for the date, range, and date-time pickers.
 *
 * @param props Component props.
 *
 * @returns PickerTrigger element.
 */
const PickerTrigger = ({
  id,
  controlsId,
  ariaHasPopup,
  open,
  label,
  placeholder,
  clearLabel,
  onClear,
  disabled = false,
  error = false,
  cssOverride,
}: PickerTriggerProps) => {
  return (
    <PopoverAnchor asChild>
      <Flex
        align="center"
        gap={2}
        data-error={error ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        cssOverride={mergeCss(styles.trigger, error ? styles.triggerError : {}, cssOverride ?? {})}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            id={id}
            role="combobox"
            aria-haspopup={ariaHasPopup}
            aria-controls={controlsId}
            aria-expanded={open}
            aria-invalid={error || undefined}
            disabled={disabled}
            cssOverride={styles.triggerControl}
          >
            <span css={scoped(styles.value)}>
              {label ?? <span css={scoped(styles.placeholder)}>{placeholder}</span>}
            </span>
            {!onClear && <CalendarDays css={scoped(styles.icon)} />}
          </Button>
        </PopoverTrigger>
        {onClear && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            cssOverride={styles.clear}
            onClick={onClear}
          >
            <X />
          </Button>
        )}
      </Flex>
    </PopoverAnchor>
  );
};

PickerTrigger.displayName = 'PickerTrigger';

export default PickerTrigger;
export type { PickerTriggerProps };

const styles = defineStyles({
  trigger: {
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `0 ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    '&:focus-within, &:has([data-state="open"])': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme),
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  },
  triggerError: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-within, &:has([data-state="open"])': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme, theme.colors.border.critical),
    },
  },
  triggerControl: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
    height: 'auto',
    padding: `${theme.spacing[2]} 0`,
    justifyContent: 'space-between',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    textAlign: 'left',
    opacity: 1,
    transition: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: 'none',
    },
  },
  value: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
  },
  placeholder: {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  clear: {
    flexShrink: 0,
    width: theme.spacing[5],
    height: theme.spacing[5],
    backgroundColor: 'transparent',
    color: theme.colors.text.secondary,
    transition: 'none',
    '& svg': {
      width: '14px',
      height: '14px',
    },
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
    },
    '&:active': {
      transform: 'none',
    },
  },
  icon: {
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  },
});
