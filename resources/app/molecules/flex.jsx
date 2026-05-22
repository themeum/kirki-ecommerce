import { CLASS_PREFIX } from "@/conf";
import React from "react";

const Flex = ({
  children,
  direction,
  gap,
  style = {},
  className = "",
  onClick = () => {},
}) => {
  return (
    <div
      className={`${CLASS_PREFIX}-flex${
        direction ? "-" + direction : ""
      } ${className}`}
      style={{ gap: gap || 0, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Flex;
