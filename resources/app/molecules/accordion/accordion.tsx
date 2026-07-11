import { createContext, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type AccordionContextValue = {
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
};

export const AccordionContext = createContext<AccordionContextValue>({});

type AccordionProps = StyleProps & {
  children?: ReactNode;
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
};

const Accordion = (props: AccordionProps) => {
  const {
    children,
    style = {},
    className = '',
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
