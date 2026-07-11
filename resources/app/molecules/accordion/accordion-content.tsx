import { useRef, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type AccordionContentProps = StyleProps & {
  children?: ReactNode;
};

const AccordionContent = (props: AccordionContentProps) => {
  const { children, style = {}, className = '' } = props;
  const contentRef = useRef<HTMLDivElement>(null);
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
