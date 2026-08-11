import type { CSSObject } from '@emotion/react';
import { type ComponentProps, type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { theme } from '@/theme';
import type { ButtonSize, ButtonState, ButtonType, DropdownSize, SelectOption } from '@/types';

type DropdownOption = SelectOption & {
  isDefault?: boolean;
  style?: CSSProperties;
  type?: 'separator';
};

type DropdownTriggerButtonProps = {
  text?: ReactNode;
  type?: ButtonType;
  size?: ButtonSize;
  state?: ButtonState;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  cssOverride?: CSSObject;
  style?: CSSProperties;
  onClick?: () => void;
};

type ButtonVariant = NonNullable<ComponentProps<typeof Button>['variant']>;
type NewButtonSize = NonNullable<ComponentProps<typeof Button>['size']>;

const LEGACY_VARIANT_MAP: Record<ButtonType, ButtonVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  destructive: 'destructive',
  outlined: 'outline',
  ghost: 'ghost',
  primarySoft: 'secondary',
  destructiveSoft: 'secondary',
  link: 'link',
  inverse: 'ghost',
  blank: 'ghost',
  tartiary: 'ghost',
  invisible: 'ghost',
};

const LEGACY_SIZE_MAP: Record<ButtonSize, NewButtonSize> = {
  small: 'sm',
  xsm: 'sm',
  large: 'lg',
  icon: 'icon',
  fullWidth: 'default',
};

const mapButtonVariant = (type?: ButtonType): ButtonVariant =>
  type ? LEGACY_VARIANT_MAP[type] : 'ghost';

const mapButtonSize = (size?: ButtonSize): NewButtonSize =>
  size ? LEGACY_SIZE_MAP[size] : 'default';

type DropdownButtonProps = {
  buttonProps?: DropdownTriggerButtonProps;
  dropdownStyle?: CSSProperties;
  value?: (string | number)[];
  options?: DropdownOption[];
  onOptionToggle?: (open: boolean) => void;
  onOptionSelect?: (value: string | number | (string | number)[]) => void;
  children?: ReactNode;
  size?: DropdownSize;
  hasLeftIcon?: boolean;
  checkboxField?: boolean;
  multiple?: boolean;
};

const DropdownButton = ({
  buttonProps,
  dropdownStyle,
  value,
  options = [],
  onOptionToggle = () => {},
  onOptionSelect = () => {},
  children,
  size: _size,
  hasLeftIcon: _hasLeftIcon,
  checkboxField,
  multiple,
}: DropdownButtonProps) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(
    value ?? [],
  );

  useEffect(() => {
    setSelectedValues(value ?? []);
  }, [value]);

  const labelFontStyle = {
    ...theme.typography.small(),
  };

  const openCloseDropdown = (v: boolean) => {
    setOpenDropdown(v);
    onOptionToggle?.(v);
  };

  const handleOnOptionClick = (option: DropdownOption) => {
    if (multiple) {
      handleMultipleSelect(option);
    } else {
      onOptionSelect(option.value);
      openCloseDropdown(false);
    }
  };

  const handleMultipleSelect = (option: DropdownOption) => {
    let newValues = selectedValues;
    if (selectedValues.includes(option.value)) {
      newValues = selectedValues.filter((item) => item !== option.value);
      setSelectedValues(newValues);
    } else {
      newValues = [...selectedValues, option.value];
      setSelectedValues(newValues);
    }
    onOptionSelect(newValues);
  };

  const {
    text,
    type,
    size: buttonSize,
    state,
    icon,
    leftIcon,
    rightIcon,
    cssOverride: buttonCss,
    style: buttonStyle = {},
  } = buttonProps ?? {};

  return (
    <DropdownMenu open={openDropdown} onOpenChange={openCloseDropdown}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={mapButtonVariant(type)}
          size={mapButtonSize(buttonSize)}
          loading={state === 'loading'}
          disabled={state === 'disabled'}
          cssOverride={buttonCss}
          style={
            buttonSize === 'fullWidth'
              ? { width: '100%', ...buttonStyle }
              : buttonStyle
          }
        >
          {icon ?? (
            <>
              {leftIcon}
              {text}
              {rightIcon}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={dropdownStyle}>
        {options.map((option) =>
          option.type === 'separator' ? (
            <DropdownMenuSeparator key={option.value} />
          ) : (
            <DropdownMenuItem
              onSelect={() => handleOnOptionClick(option)}
              key={option.value}
              style={option?.style}
            >
              {checkboxField ? (
                <Checkbox
                  value={
                    option?.isDefault || selectedValues.includes(option.value)
                  }
                  label={option?.title}
                  labelStyle={labelFontStyle}
                  onChange={() => handleOnOptionClick(option)}
                />
              ) : (
                <>
                  {option.icon}
                  {option.title}
                </>
              )}
            </DropdownMenuItem>
          ),
        )}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownButton;
