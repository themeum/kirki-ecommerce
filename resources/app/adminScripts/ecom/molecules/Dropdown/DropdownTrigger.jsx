import React, { forwardRef } from "react";
import { CLASS_PREFIX } from "conf";

const DropdownTrigger = forwardRef((props, ref) => {
  const { children, style = {}, className = "" } = props;

  return (
    <div
      ref={ref}
      className={`${CLASS_PREFIX}-dropdown-trigger ${className}`}
      style={style}
    >
      {children}
    </div>
  );
});

export default DropdownTrigger;
