import React, { useState } from "react";
import { CLASS_PREFIX } from "@/conf";
import RadioItem from './radio-item';
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';
import { useEffect } from "react";

const RadioGroup = (props) => {
  const {
    style = {},
    className = "",
    defaultValue = "",
    optionsArray = [],
    onChange = () => {},
    type,
    value,
    label,
    helpText,
  } = props;

  const [selectedItem, setSelectedItem] = useState(value || defaultValue);

  useEffect(() => {
    setSelectedItem(value);
  }, [value]);

  const handleRadioItemClick = (e, value) => {
    setSelectedItem(value);
    onChange(value);
  };
  return (
    <Flex
      direction="column"
      gap={8}
      className={`${CLASS_PREFIX}-radio-group ${className}`}
      style={style}
    >
      {label && <Label text={label} helpText={helpText} />}
      {optionsArray.map((item, index) => (
        <Flex key={index} gap={8}>
          <RadioItem
            value={item.value}
            onChange={(e) => handleRadioItemClick(e, item.value)}
            isSelected={item.value === selectedItem}
            type={type}
          />
          <div
            onClick={(e) => handleRadioItemClick(e, item.value)}
            className={`${CLASS_PREFIX}-radio-item`}
          >
            <Label text={item.title} />
          </div>
        </Flex>
      ))}
    </Flex>
  );
};

export default RadioGroup;
