import React from "react";
import { CLASS_PREFIX } from "@/conf";

const PopoverDescription = (props) => {
  const { children, style = {}, className = "" } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-popover-description ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default PopoverDescription;
