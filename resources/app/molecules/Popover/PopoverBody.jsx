import React from "react";
import { CLASS_PREFIX } from "@/conf";

const PopoverBody = (props) => {
  const { children, style = {}, className = "" } = props;
  return (
    <div className={`${CLASS_PREFIX}-popover-body ${className}`} style={style}>
      {children}
    </div>
  );
};

export default PopoverBody;
