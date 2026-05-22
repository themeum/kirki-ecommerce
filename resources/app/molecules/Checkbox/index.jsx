import React, { useState, useEffect } from "react";
import { CheckboxChecked, CheckboxExcluded, CheckboxUnchecked } from "@/Icons";
import Label from "../Label";
import { CLASS_PREFIX } from "@/conf";

const Checkbox = (props) => {
  const {
    onChange,
    isPartialChecked = false,
    leftIcon = "",
    value = false,
    label = "",
    helpText,
    style,
    labelStyle = {},
  } = props;
  const [checkboxChecked, setCheckboxChecked] = useState(value);
  useEffect(() => {
    setCheckboxChecked(value);
  }, [value]);
  const handleOnCheckboxClick = (e) => {
    e.stopPropagation();
    const newValue = !checkboxChecked;
    setCheckboxChecked((prev) => !prev);
    if (onChange) onChange(newValue);
  };

  const handleCompClick = (e) => {
    e.stopPropagation();
  };
  return (
    <label
      style={style}
      className={`${CLASS_PREFIX}-checkbox-wrapper`}
      onClick={handleCompClick}
    >
      <span className={`${CLASS_PREFIX}-checkbox-icon`}>
        <input
          style={{ display: "none" }}
          type="checkbox"
          checked={checkboxChecked}
          onChange={handleOnCheckboxClick}
        />
        {isPartialChecked ? (
          <CheckboxExcluded />
        ) : checkboxChecked ? (
          <CheckboxChecked />
        ) : (
          <CheckboxUnchecked />
        )}
      </span>
      {leftIcon && <span>{leftIcon}</span>}
      {label && <Label style={labelStyle} text={label} helpText={helpText} />}
    </label>
  );
};

export default Checkbox;
