import React from "react";
import { CLASS_PREFIX } from "conf";

const PopoverFooter = (props) => {
  const { children, style = {}, className = "" } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-popover-footer ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default PopoverFooter;
