import React, { useState, useEffect } from "react";
import Flex from "../Flex";
import Select from "../Select";
import Input from "../Input";
import Label from "../Label";
import { CLASS_PREFIX } from "@/conf";
import classNames from "classnames";

const SelectInput = (props) => {
  const {
    className = "",
    style = {},
    optionsArray = [],
    value,
    defaultValue,
    label,
    helpText,
    step = 1,
    max,
    min,
    error,
    onChange = () => {},
    invisible,
    anchorRef,
    selectWidth,
  } = props;

  const allClassNames = classNames(
    `${CLASS_PREFIX}-select-input-wrapper`,
    invisible && `${CLASS_PREFIX}-select-input-invisible`,
    error && `${CLASS_PREFIX}-error`,
    className,
  );

  const [inputValue, setInputValue] = useState(
    value?.value || defaultValue?.value || "",
  );
  const [selectValue, setSelectValue] = useState(
    value?.unit || defaultValue?.unit || "",
  );

  const fallbackOption = optionsArray.find((item) => item?.fallback);

  useEffect(() => {
    setInputValue(value?.value);
    setSelectValue(value?.unit);
  }, [value]);

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  const handleInputBlur = (value) => {
    const formattedValue = separateUnitAndvalue(value);
    onChange(formattedValue);
  };
  const separateUnitAndvalue = (value) => {
    const match = /^(-?\d*\.?\d+)\s*([a-zA-Z%]+)$/.exec(value.trim());
    if (match) {
      let numericValue = parseFloat(match[1]);
      if (numericValue > max) {
        numericValue = max;
      } else if (numericValue < min) {
        numericValue = min;
      }
      setInputValue(numericValue);

      const unitValue = optionsArray.find(
        (item) => item.value === match[2].toLowerCase(),
      );
      setSelectValue(unitValue?.value || fallbackOption.value);
      return {
        value: parseFloat(match[1]),
        unit: unitValue?.value || fallbackOption.value,
      };
    } else if (/^-?\d*\.?\d+$/.test(value)) {
      setInputValue(parseFloat(value));
      return {
        value: parseFloat(value),
        unit: selectValue,
      };
    }

    setInputValue(0);
    return {
      value: 0,
      unit: selectValue,
    };
  };
  const handleSelectChange = (value) => {
    setSelectValue(value);
    onChange({
      value: inputValue,
      unit: value,
    });
  };
  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? "error" : ""}
          helpText={error ? error : helpText}
        />
      )}
      <Flex className={allClassNames} style={style}>
        <div style={{ flex: "1" }}>
          <Input
            onBlur={(value) => handleInputBlur(value)}
            onChange={(value) => handleInputChange(value)}
            value={inputValue}
            step={step}
            max={max}
            min={min}
          />
        </div>
        <div style={{ width: selectWidth ? selectWidth : "auto" }}>
          <Select
            value={selectValue}
            optionsArray={optionsArray}
            onChange={(value) => handleSelectChange(value)}
            // size="small"
            anchorRef={anchorRef}
          />
        </div>
      </Flex>
    </Flex>
  );
};

export default SelectInput;
