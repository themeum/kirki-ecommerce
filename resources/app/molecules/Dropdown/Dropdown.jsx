import React from "react";

const Dropdown = (props) => {
  const { children, style = {}, className = "" } = props;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default Dropdown;
