import React, { useState, useEffect } from "react";
import { CLASS_PREFIX } from "@/conf";
import { SwitchCheckedIcon, SwitchUncheckedIcon } from "@/icons";
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';

const ToggleButton = (props) => {
  const {
    value,
    style,
    className = "",
    onChange,
    label,
    disabled = false,
  } = props;
  const [isSelected, setIsSelected] = useState(value);

  useEffect(() => {
    setIsSelected(value);
  }, [value]);

  const handleSwitchClick = () => {
    if (disabled) return;
    const newValue = !isSelected;
    setIsSelected((prev) => !prev);
    if (onChange) onChange(newValue);
  };
  return (
    <span
      className={`${CLASS_PREFIX}-toggle-btn ${className}  ${
        disabled ? `${CLASS_PREFIX}-toggle-disabled` : ""
      }`}
      style={style}
      onClick={handleSwitchClick}
    >
      <Flex gap={8}>
        {isSelected ? <SwitchCheckedIcon /> : <SwitchUncheckedIcon />}
        {label && <Label text={label} />}
      </Flex>
    </span>
  );
};

export default ToggleButton;
