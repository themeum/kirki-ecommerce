import { useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';

import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import {
  Dropdown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownTrigger,
} from '@/molecules/dropdown';
import type { DropdownSize, SelectOption } from '@/types';

type DropdownOption = SelectOption & {
  isDefault?: boolean;
  style?: CSSProperties;
};

type DropdownButtonProps = {
  buttonProps?: Record<string, unknown>;
  dropdownStyle?: CSSProperties;
  value?: Array<string | number>;
  options?: DropdownOption[];
  onOptionToggle?: (open: boolean) => void;
  onOptionSelect?: (value: string | number | Array<string | number>) => void;
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
  size,
  hasLeftIcon,
  checkboxField,
  multiple,
}: DropdownButtonProps) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Array<string | number>>(
    value ?? [],
  );

  useEffect(() => {
    setSelectedValues(value ?? []);
  }, [value]);

  const labelFontStyle = {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '18px',
  };

  const toggleDropdownOpen = () => {
    const v = !openDropdown;
    openCloseDropdown(v);
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

  return (
    <Dropdown>
      <DropdownTrigger ref={triggerRef}>
        <Button {...buttonProps} onClick={toggleDropdownOpen} />
      </DropdownTrigger>
      <DropdownMenuContent
        style={dropdownStyle}
        hasLeftIcon={hasLeftIcon}
        triggerRef={triggerRef}
        isOpen={openDropdown}
        size={size}
        onClose={() => {
          openCloseDropdown(false);
        }}
      >
        {options.map((option) => (
          <DropdownMenuItem
            onItemClick={() => handleOnOptionClick(option)}
            leftIcon={option.icon}
            key={option.value}
            checkboxField={checkboxField}
            state={option?.isDefault ? 'defaultSelected' : ''}
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
              option.title
            )}
          </DropdownMenuItem>
        ))}
        {children}
      </DropdownMenuContent>
    </Dropdown>
  );
};

export default DropdownButton;
