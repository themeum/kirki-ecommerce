import React from "react";
import { CLASS_PREFIX } from "@/conf";
import { RadioCheckedIcon, RadioTickIcon, RadioUncheckedIcon } from "@/icons";

const RadioItem = (props) => {
  const {
    style = {},
    className = "",
    isSelected,
    onChange = () => {},
    type = "checked",
  } = props;
  return (
    <span
      className={`${CLASS_PREFIX}-radio-item ${CLASS_PREFIX}-flex-start ${className}`}
      style={style}
      onClick={onChange}
    >
      {!isSelected ? (
        <RadioUncheckedIcon />
      ) : type === "checked" ? (
        <RadioCheckedIcon />
      ) : (
        <RadioTickIcon />
      )}
    </span>
  );
};

export default RadioItem;
