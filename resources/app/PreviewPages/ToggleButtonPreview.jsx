import React from "react";
import { CLASS_PREFIX } from "@/conf";
import { ToggleButton } from "@/molecules";

const ToggleButtonPreview = () => {
  const handleOnClick = (value) => {
    console.log(value);
  };
  return (
    <ToggleButton
      value="false"
      onChange={(value) => handleOnClick(value)}
      label="Toggle me"
    />
  );
};

export default ToggleButtonPreview;
