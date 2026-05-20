import React from "react";
import { CLASS_PREFIX } from "conf";

const Grid = (props) => {
  const {
    columns = 2,
    gap = "12px",
    children,
    className = "",
    style = {},
  } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Grid;
