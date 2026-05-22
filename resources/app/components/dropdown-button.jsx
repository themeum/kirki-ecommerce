import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Dropdown from '@/molecules/dropdown/dropdown';
import DropdownMenuContent from '@/molecules/dropdown/dropdown-menu-content';
import DropdownMenuItem from '@/molecules/dropdown/dropdown-menu-item';
import DropdownTrigger from '@/molecules/dropdown/dropdown-trigger';
import React, { useRef, useState, useEffect } from "react";

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
}) => {
  const triggerRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedValues, setSelectedValues] = useState(value);

  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const labelFontStyle = {
    fontSize: "12px",
    fontWeight: "400",
    lineHeight: "18px",
  };

  const toggleDropdownOpen = () => {
    const v = !openDropdown;
    openCloseDropdown(v);
  };

  const openCloseDropdown = (v) => {
    setOpenDropdown(v);
    onOptionToggle?.(v);
  };

  const handleOnOptionClick = (option, value) => {
    if (multiple) {
      handleMultipleSelect(option, value);
    } else {
      onOptionSelect(option.value);
      openCloseDropdown(false);
    }
  };

  const handleMultipleSelect = (option, value) => {
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
            onItemClick={(value) => handleOnOptionClick(option, value)}
            leftIcon={option.icon}
            key={option.value}
            checkboxField={checkboxField}
            state={option?.isDefault ? "defaultSelected" : ""}
            style={option?.style}
          >
            {checkboxField ? (
              <Checkbox
                value={
                  option?.isDefault || selectedValues.includes(option.value)
                }
                label={option?.title}
                labelStyle={labelFontStyle}
                onChange={(value) => handleOnOptionClick(option, value)}
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
