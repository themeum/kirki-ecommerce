import { useContext, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import Separator from '@/molecules/separator';
import type { StyleProps } from '@/types';

import { AccordionContext } from '@/molecules/accordion/accordion';

type AccordionItemProps = StyleProps & {
  children?: ReactNode;
};

const AccordionItem = (props: AccordionItemProps) => {
  const { children, style = {}, className = '' } = props;
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
