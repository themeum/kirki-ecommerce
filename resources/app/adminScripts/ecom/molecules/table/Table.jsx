import React from "react";
import { CLASS_PREFIX } from "conf";
import classNames from "classnames";

const Table = (props) => {
  const {
    children,
    type = "default",
    className = "",
    style = {},
    scrollable,
    editMode,
    fixed, // table layout is fixed & all cell width same
  } = props;
  const tableVariants = {
    type: {
      default: `${CLASS_PREFIX}-table-default`,
      variation: `${CLASS_PREFIX}-table-variation`,
      wide: `${CLASS_PREFIX}-table-wide`,
    },
    editMode: {
      multiCell: `${CLASS_PREFIX}-multi-cell-edit`,
      singleCell: `${CLASS_PREFIX}-single-cell-edit`,
    },
    fixed: `${CLASS_PREFIX}-table-fixed`,
    scrollable: `${CLASS_PREFIX}-table-scrollable`,
  };
  const allClassNames = classNames(
    tableVariants.type[type],
    fixed && tableVariants.fixed,
    scrollable && tableVariants.scrollable,
    tableVariants.editMode[editMode],
    className,
  );
  return (
    <table className={allClassNames} style={style}>
      {children}
    </table>
  );
};

export default Table;
