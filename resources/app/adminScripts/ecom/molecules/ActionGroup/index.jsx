import React from "react";
import Flex from "../Flex";
import { CLASS_PREFIX } from "conf";

const ActionGroup = (props) => {
  const { children, style = {}, className = "", gap = 8 } = props;
  return (
    <Flex
      className={`${CLASS_PREFIX}-action-group ${className}`}
      gap={gap}
      style={style}
    >
      {children}
    </Flex>
  );
};

export default ActionGroup;
