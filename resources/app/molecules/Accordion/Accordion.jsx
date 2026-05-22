import React from "react";
import { createContext } from "react";
import { CLASS_PREFIX } from "@/conf";

export const AccordionContext = React.createContext({});

const Accordion = (props) => {
  const {
    children,
    style = {},
    className = "",
    hideSeparator = false,
    rightActions = null,
    hasBottomSpace = true,
  } = props;
  return (
    <AccordionContext.Provider
      value={{ hideSeparator, rightActions, hasBottomSpace }}
    >
      <div className={`${CLASS_PREFIX}-accordion ${className}`} style={style}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export default Accordion;
