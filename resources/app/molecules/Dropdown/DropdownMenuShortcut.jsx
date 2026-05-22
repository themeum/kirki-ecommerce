import React from "react";
import { CLASS_PREFIX } from "@/conf";

const DropdownMenuShortcut = (props) => {
  const { children, className = "", style = {} } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-dropdown-shortcut-text ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default DropdownMenuShortcut;
