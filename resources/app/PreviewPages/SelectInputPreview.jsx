import { SelectInput } from "@/molecules";
import React from "react";
import { useState } from "react";

const SelectInputPreview = () => {
  const optionsArray = [
    { value: "px", title: "px", fallback: true },
    { value: "rem", title: "rem" },
    { value: "em", title: "em" },
    { value: "vw", title: "vw" },
    { value: "vh", title: "vh" },
    { value: "vmin", title: "vmin" },
    { value: "vmax", title: "vmax" },
    { value: "fr", title: "fr" },
    { value: "mm", title: "mm" },
  ];
  const defaultValue = {
    value: "33",
    unit: "px",
  };
  const initialValue = {
    value: "0",
    unit: "px",
  };

  const [currentValue, setCurrentValue] = useState(
    initialValue || defaultValue
  );

  const handleChange = (value) => {
    setCurrentValue(value);
    console.log(value, "value changed");
  };

  return (
    <SelectInput
      step={5}
      max={20}
      min={-11}
      label="Select Input"
      value={currentValue}
      placeholder="Select"
      optionsArray={optionsArray}
      onChange={(value) => handleChange(value)}
      onClose={() => console.log("dropdown closed")}
      error="There is an error"
    />
  );
};

export default SelectInputPreview;
