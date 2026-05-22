import classNames from "classnames";
import { CLASS_PREFIX } from "@/conf";
import React from "react";

const TableHead = (props) => {
  const {
    children,
    className = "",
    style = {},
    onlyCheckbox,
    alignment,
  } = props;

  const tableHeadeStyles = {
    onlyCheckbox: `${CLASS_PREFIX}-only-checkbox`,
    right: `${CLASS_PREFIX}-align-right`,
    center: `${CLASS_PREFIX}-align-center`,
  };

  const allClassNames = classNames(
    tableHeadeStyles[alignment],
    onlyCheckbox && `${CLASS_PREFIX}-only-checkbox`,
    className
  );
  return (
    <th className={allClassNames} style={style}>
      {children}
    </th>
  );
};

export default TableHead;
