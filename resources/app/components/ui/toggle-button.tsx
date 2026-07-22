import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import { SwitchCheckedIcon, SwitchUncheckedIcon } from '@/icons';

type ToggleButtonProps = {
  value?: boolean;
  style?: CSSProperties;
  className?: string;
  onChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (props, ref) => {
    const {
      value,
      style,
      className,
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
        className={classNames(
          `${CLASS_PREFIX}-ui-toggle-button`,
          disabled && `${CLASS_PREFIX}-ui-toggle-button--disabled`,
          className,
        )}
        style={style}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <Flex gap={8}>
          {isSelected ? <SwitchCheckedIcon /> : <SwitchUncheckedIcon />}
          {label && <Label>{label}</Label>}
        </Flex>
      </button>
    );
  },
);

ToggleButton.displayName = 'ToggleButton';

export default ToggleButton;
