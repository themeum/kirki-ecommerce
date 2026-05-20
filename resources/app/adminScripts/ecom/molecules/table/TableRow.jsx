import { CLASS_PREFIX } from "conf";
import React from "react";

const TableRow = (props) => {
  const {
    children,
    className = "",
    style = {},
    onClick = () => {},
    active = false,
  } = props;
  return (
    <tr
      className={className + (active ? ` ${CLASS_PREFIX}-active` : "")}
      style={style}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export default TableRow;
