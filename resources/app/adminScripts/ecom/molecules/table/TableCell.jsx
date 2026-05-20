import classNames from "classnames";
import { CLASS_PREFIX } from "conf";
import React from "react";

const TableCell = (props) => {
  const {
    children,
    className = "",
    style = {},
    onlyCheckbox,
    alignment,
    onMouseDown = () => {},
    onMouseEnter = () => {},
    disabled,
  } = props;

  const tableCellStyles = {
    onlyCheckbox: `${CLASS_PREFIX}-only-checkbox`,
    right: `${CLASS_PREFIX}-align-right`,
    center: `${CLASS_PREFIX}-align-center`,
  };

  const allClassNames = classNames(
    tableCellStyles[alignment],
    onlyCheckbox && `${CLASS_PREFIX}-only-checkbox`,
    disabled && `${CLASS_PREFIX}-disabled`,
    className
  );

  return (
    <td
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={allClassNames}
      style={style}
    >
      {children}
    </td>
  );
};

export default TableCell;
