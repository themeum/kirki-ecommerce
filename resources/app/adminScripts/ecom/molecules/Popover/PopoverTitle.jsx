import React from "react";
import { CLASS_PREFIX } from "conf";

const PopoverTitle = (props) => {
  const { children, style = {}, className = "" } = props;
  return (
    <div className={`${CLASS_PREFIX}-popover-title ${className}`} style={style}>
      {children}
    </div>
  );
};

export default PopoverTitle;
