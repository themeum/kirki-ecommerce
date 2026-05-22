import React from "react";

const TableHeader = (props) => {
  const { children, className = "", style = {} } = props;
  return (
    <thead className={className} style={style}>
      {children}
    </thead>
  );
};

export default TableHeader;
