import type { CSSObject } from '@emotion/react';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { theme } from '@/theme';
import type { ButtonState, DropdownSize, SelectOption } from '@/types/components/common';
import { noop } from '@/utils/function';
import { EllipseIcon, EllipsisVertical } from 'lucide-react';

type DropdownOption = SelectOption & {
  isDefault?: boolean;
  style?: CSSProperties;
  type?: 'separator';
};

type DropdownTriggerButtonProps = {
  text?: ReactNode;
  state?: ButtonState;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  cssOverride?: CSSObject;
  style?: CSSProperties;
  onClick?: () => void;
  direction?: 'vertical' | 'horizontal';
};

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
  onOptionToggle = noop,
  onOptionSelect = noop,
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
    state,
    icon,
    leftIcon,
    rightIcon,
    cssOverride: buttonCss,
    direction = 'vertical'
  } = buttonProps ?? {};

  return (
    <DropdownMenu open={openDropdown} onOpenChange={openCloseDropdown}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          loading={state === 'loading'}
          disabled={state === 'disabled'}
          cssOverride={buttonCss}
        >
          {direction === 'vertical' ? <EllipsisVertical /> : <EllipseIcon />}
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
