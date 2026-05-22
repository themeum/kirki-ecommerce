import React from "react";

const TableBody = (props) => {
  const { children, className = "", style = {} } = props;

  return (
    <tbody className={className} style={style}>
      {children}
    </tbody>
  );
};

export default TableBody;
