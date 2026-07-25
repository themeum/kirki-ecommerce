import type { SerializedStyles } from '@emotion/react';
import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { SwitchCheckedIcon, SwitchUncheckedIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type ToggleButtonProps = {
  value?: boolean;
  style?: CSSProperties;
  css?: SerializedStyles;
  onChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (props, ref) => {
    const {
      css: cssProp,
      value,
      style,
      onChange,
      label,
      disabled = false,
    } = props;

    const [isSelected, setIsSelected] = useState(Boolean(value));

    useEffect(() => {
      setIsSelected(Boolean(value));
    }, [value]);

    const handleToggle = () => {
      if (disabled) {
        return;
      }
      const newValue = !isSelected;
      setIsSelected(newValue);
      onChange?.(newValue);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isSelected}
        aria-label={label}
        disabled={disabled}
        style={style}
        css={[styles.root, disabled && styles.disabled, cssProp]}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <Flex gap={2}>
          {isSelected ? <SwitchCheckedIcon /> : <SwitchUncheckedIcon />}
          {label && <Label>{label}</Label>}
        </Flex>
      </button>
    );
  },
);

ToggleButton.displayName = 'ToggleButton';

export default ToggleButton;

const styles = {
  root: scoped({
    all: 'unset',
    cursor: 'pointer',
    display: 'inline-flex',
    boxSizing: 'border-box',
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
  }),
  disabled: scoped({
    cursor: 'not-allowed !important',
    opacity: 0.3,
    pointerEvents: 'none',
  }),
};
