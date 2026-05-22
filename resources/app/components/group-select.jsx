import React, { useEffect, useState, useRef } from "react";
import { CLASS_PREFIX } from "@/conf";
import ActionGroup from '@/molecules/action-group';
import Badge from '@/molecules/badge';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import DropdownMenuContent from '@/molecules/dropdown/dropdown-menu-content';
import DropdownMenuItem from '@/molecules/dropdown/dropdown-menu-item';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import Searchbox from '@/molecules/searchbox';
import { __ } from "@/wpi18n";

const GroupSelect = (props) => {
  const {
    valueArray = {},
    optionsArray = [],
    placeholder = __("Type to add schemas..", "kirki-ecommerce"),
    onChange = () => {},
    onClose = () => {},
    state,
    className = "",
    style = {},
    label,
    helpText,
    error,
    leftIcon,
    checkboxField,
    dropdownHeader,
    dropdownFooter,
  } = props;

  const labelFontStyle = {
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "21px",
  };

  const [selectedValues, setSelectedValues] = useState(valueArray);
  // const [title, setTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  // useEffect(() => {
  //   const selectedItemCount = (Object.values(selectedValues) || []).flat()
  //     .length;
  //   if (selectedItemCount > 0) {
  //     setTitle(`(${selectedItemCount} selected)`);
  //   }
  // }, [optionsArray, selectedValues]);

  useEffect(() => {
    setSelectedValues(valueArray);
  }, [valueArray]);

  const handleSelectionClose = () => {
    onChange(selectedValues);
    if (onClose) onClose();
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (option, groupName) => {
    let newValues = selectedValues[groupName];
    if (
      selectedValues[groupName] &&
      selectedValues[groupName].includes(option)
    ) {
      newValues = selectedValues[groupName].filter((item) => item !== option);
      if (newValues.length === 0) {
        const fullData = { ...selectedValues };
        delete fullData[groupName];
        setSelectedValues(fullData);
        onChange(fullData);
        return;
      }
    } else {
      newValues = [...(selectedValues[groupName] || []), option];
    }
    onChange({ ...selectedValues, [groupName]: newValues });
    setSelectedValues((prev) => ({ ...prev, [groupName]: newValues }));
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        <Searchbox
          leftIcon={leftIcon}
          hasDropdown={false}
          placeholder={placeholder}
          label={label}
          error={error}
          helpText={helpText}
        />
      </div>
      <DropdownMenuContent
        isOpen={isOpen}
        triggerRef={triggerRef}
        onClose={() => setIsOpen(false)}
        isFullWidth={true}
        position={{
          bottom: true,
          left: true,
        }}
        style={{ paddingBottom: dropdownFooter ? "0" : "4px" }}
      >
        {dropdownHeader && (
          <DropdownMenuItem>
            <div className={`${CLASS_PREFIX}-select-dropdown-item-padding`}>
              {dropdownHeader}
            </div>
            <Separator marginTop={4} marginBottom={4} />
          </DropdownMenuItem>
        )}
        {optionsArray.map((option, index) => (
          <DropdownMenuItem
            key={index}
            leftIcon={option.icon}
            state={
              option?.heading || option.isRequired ? "defaultSelected" : ""
            }
            onItemClick={() => handleOptionClick(option.value, option.group)}
            checkboxField={checkboxField}
          >
            {option?.heading ? (
              <Label
                text={option.heading}
                infoText={option?.infoText}
                style={{ ...labelFontStyle, color: "#878593" }}
              />
            ) : (
              <Flex style={{ alignItems: "center" }} gap={8}>
                {checkboxField ? (
                  <Checkbox
                    value={
                      option?.isDefault ||
                      option?.isRequired ||
                      (selectedValues[option.group]?.includes(option.value) ??
                        false)
                    }
                    label={option?.title}
                    labelStyle={labelFontStyle}
                    onChange={() =>
                      handleOptionClick(option.value, option?.group)
                    }
                  />
                ) : (
                  option.title
                )}
                {option?.isRequired && (
                  <Badge text={__("Required", "kirki-ecommerce")} type="trashed" />
                )}
              </Flex>
            )}
          </DropdownMenuItem>
        ))}
        {dropdownFooter && (
          <Flex
            style={{
              padding: "12px 16px 8px 12px",
              borderTop: "1px solid #E4E3E9",
              bottom: "0",
              position: "sticky",
              backgroundColor: "white",
            }}
          >
            <ActionGroup>
              <Button
                type="secondary"
                text={__("Cancel", "kirki-ecommerce")}
                size="small"
                onClick={handleSelectionClose}
              />
              <Button
                type="primary"
                text={__("Add", "kirki-ecommerce")}
                size="small"
                onClick={handleSelectionClose}
              />
            </ActionGroup>
          </Flex>
        )}
      </DropdownMenuContent>
    </>
  );
};

export default GroupSelect;
