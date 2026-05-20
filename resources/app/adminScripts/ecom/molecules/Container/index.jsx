import React from "react";
import { CLASS_PREFIX } from "conf";
import classNames from "classnames";

const Container = (props) => {
  const { children, className = "", style = {}, size, scrollable } = props;

  const containerVariants = {
    sm: `${CLASS_PREFIX}-sm`,
    md: `${CLASS_PREFIX}-md`,
    lg: `${CLASS_PREFIX}-lg`,
    fullWidth: `${CLASS_PREFIX}-full-width`,
  };

  const allClassNames = classNames(
    `${CLASS_PREFIX}-container`,
    containerVariants[size],
    scrollable && `${CLASS_PREFIX}-scroll-container`,
    className
  );

  return (
    <div className={`${allClassNames}`} style={style}>
      {children}
    </div>
  );
};

export default Container;
