import React, { useRef, useState, useEffect } from "react";
import { CLASS_PREFIX } from "@/conf";
import { CheckedIcon, ChevronDownIcon, PlusCircleIcon } from "@/icons";
import SelectDropdown from '@/molecules/select/select-dropdown';
import classNames from "classnames";
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';
import Separator from '@/molecules/separator';
import ActionGroup from '@/molecules/action-group';
import { __ } from "@/wpi18n";

const normalizeValue = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const Select = (props) => {
  const {
    value,
    defaultValue,
    placeholder = __("Select", "kirki-ecommerce"),
    optionsArray,
    onChange = () => {},
    onClose = () => {},
    size,
    type,
    state,
    className,
    style,
    label,
    helpText,
    forceText = "--",
    error,
    multiple,
    invisible,
    dropdownHeader,
    dropdownFooter,
    onNewItemAdd,
    btnText = "Add Item",
    anchorRef,
    hasDropdown = true,
  } = props;

  // TODO: multiple value select, dynamic positioning
  const selectVariants = {
    default: `${CLASS_PREFIX}-select-trigger`,
    size: {
      small: `${CLASS_PREFIX}-select-small`, // need design
      large: `${CLASS_PREFIX}-select-large`, // need design
    },
    type: {
      secondary: `${CLASS_PREFIX}-select-secondary`,
    },
    state: {
      disabled: `${CLASS_PREFIX}-disabled`,
      active: `${CLASS_PREFIX}-select-active`,
    },
    invisible: `${CLASS_PREFIX}-select-invisible`,
    error: `${CLASS_PREFIX}-select-error`,
  };

  const allClassNames = classNames(
    selectVariants.default,
    selectVariants.size[size],
    selectVariants.type[type],
    selectVariants.state[state],
    invisible && selectVariants.invisible,
    error && selectVariants.error,
    className
  );

  const [selectedValues, setSelectedValues] = useState(
    normalizeValue(value) || normalizeValue(defaultValue)
  );
  const [selectedTitle, setSelectedTitle] = useState(placeholder);
  const [leftIcon, setLeftIcon] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (selectedValues.length > 1) {
      const selectedOption = optionsArray?.find(
        (item) => !item?.heading && item?.value == selectedValues[0]
      );
      const extraCount = selectedValues?.length - 1;
      setSelectedTitle(
        `${selectedOption?.title} +${selectedValues?.length - 1} ${
          extraCount > 1 ? __("others", "kirki-ecommerce") : __("other", "kirki-ecommerce")
        }`
      );
    } else {
      if (selectedValues[0] === " " && forceText) setSelectedTitle(forceText);
      else {
        const selectedOption = optionsArray?.find(
          (item) => !item?.heading && item?.value == selectedValues[0]
        );
        setSelectedTitle(selectedOption?.title || placeholder);
        setLeftIcon(selectedOption?.leftIcon || null);
      }
    }
  }, [optionsArray, selectedValues]);

  useEffect(() => {
    setSelectedValues(
      normalizeValue(value) || normalizeValue(defaultValue) || []
    );
  }, [value, defaultValue]);

  const handleSelectionClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (e, option) => {
    if (multiple) {
      handleMultipleSelect(e, option);
    } else {
      setSelectedValues([option.value]);
      onChange(option.value);
      handleSelectionClose();
    }
  };

  const handleMultipleSelect = (e, option) => {
    let newValues = selectedValues;
    if (selectedValues.includes(option.value)) {
      newValues = selectedValues?.filter((item) => item !== option?.value);
      setSelectedValues(newValues);
    } else {
      newValues = [...selectedValues, option.value];
      setSelectedValues(newValues);
    }
    onChange(newValues);
  };

  return (
    <div className={`${CLASS_PREFIX}-select-wrapper`}>
      <Flex direction="column" gap={8}>
        {(label || helpText) && (
          <Label
            text={label}
            type={error ? "error" : ""}
            helpText={error ? error : helpText}
          />
        )}

        <div
          className={allClassNames}
          style={style}
          ref={triggerRef}
          onClick={handleTriggerClick}
          role="button"
          tabIndex="0"
        >
          <div className={`${CLASS_PREFIX}-select-text-wrapper`}>
            {leftIcon && (
              <div className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</div>
            )}
            {selectedTitle || placeholder}
          </div>
          <ChevronDownIcon />
        </div>
      </Flex>
      {hasDropdown && (
        <SelectDropdown
          isOpen={isOpen}
          triggerRef={anchorRef || triggerRef}
          setIsOpen={setIsOpen}
          onClose={handleSelectionClose}
          small={size == "small"}
        >
          {dropdownHeader && (
            <>
              <div className={`${CLASS_PREFIX}-select-dropdown-item-padding`}>
                {dropdownHeader}
              </div>
              <Separator marginTop={4} marginBottom={4} />
            </>
          )}
          {onNewItemAdd && (
            <>
              <div
                className={`${CLASS_PREFIX}-select-item`}
                onClick={onNewItemAdd}
              >
                <span className={`${CLASS_PREFIX}-select-icon`}>
                  <PlusCircleIcon />
                </span>
                <span>{btnText}</span>
              </div>
              {optionsArray?.length > 0 && <Separator />}
            </>
          )}
          {optionsArray &&
            optionsArray.map((option, key) => (
              <div
                className={`${CLASS_PREFIX}-select-item ${
                  option?.heading ? `${CLASS_PREFIX}-disabled` : ""
                }`}
                key={key}
                onClick={(e) => handleOptionClick(e, option)}
              >
                {!option?.heading && (
                  <div className={`${CLASS_PREFIX}-select-icon`}>
                    {selectedValues.includes(option?.value) && <CheckedIcon />}
                  </div>
                )}

                {option.leftIcon && (
                  <div className={`${CLASS_PREFIX}-select-icon`}>
                    {option?.leftIcon}
                  </div>
                )}
                <div className={`${CLASS_PREFIX}-select-text-wrapper`}>
                  {option?.heading || option?.title}
                </div>

                <ActionGroup>
                  {option?.rightIcon && (
                    <div
                      className={`${CLASS_PREFIX}-select-icon ${CLASS_PREFIX}-disabled`}
                    >
                      {option?.rightIcon}
                    </div>
                  )}
                  {option?.subText && (
                    <div className={`${CLASS_PREFIX}-disabled`}>
                      {option?.subText}
                    </div>
                  )}
                </ActionGroup>
              </div>
            ))}
          {dropdownFooter && (
            <div
              className={`${CLASS_PREFIX}-select-dropdown-item-padding`}
              onClick={() => setIsOpen(false)}
            >
              {dropdownFooter}
            </div>
          )}
        </SelectDropdown>
      )}
    </div>
  );
};

export default Select;
