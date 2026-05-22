import React, { useContext } from "react";
import { CLASS_PREFIX } from "@/conf";
import Separator from '@/molecules/separator';
import { AccordionContext } from '@/molecules/accordion/accordion';

const AccordionItem = (props) => {
  const { children, style = {}, className = "" } = props;
  const { hideSeparator } = useContext(AccordionContext);
  return (
    <div
      className={`${CLASS_PREFIX}-accordion-item ${className}`}
      style={style}
    >
      {children}
      {!hideSeparator && <Separator />}
    </div>
  );
};

export default AccordionItem;
