import { CLASS_PREFIX } from "@/conf";
import React from "react";

const SelectedTags = (props) => {
  const { children, className = "", style = {} } = props;
  return (
    <div className={`${CLASS_PREFIX}-selected-tags ${className}`} style={style}>
      {children}
    </div>
  );
};

export default SelectedTags;
