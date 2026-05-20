import React, { useRef } from "react";
import { CLASS_PREFIX } from "conf";

const AccordionContent = (props) => {
  const { children, style = {}, className = "" } = props;
  const contentRef = useRef(null);
  return (
    <div
      ref={contentRef}
      className={`${CLASS_PREFIX}-accordion-content ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default AccordionContent;
