import React from "react";

const Separator = (props) => {
  const {
    style = {},
    className = "",
    marginTop = "4px",
    marginBottom = "4px",
    color = "#E4E3E9",
    height = "1px",
  } = props;
  return (
    <div
      className={className}
      style={{
        height: height,
        marginTop: marginTop,
        marginBottom: marginBottom,
        backgroundColor: color,
        ...style,
      }}
    ></div>
  );
};

export default Separator;
