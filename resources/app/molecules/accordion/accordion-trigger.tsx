import { useContext, useRef, useState, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { CollapseIcon, ExpandIcon } from '@/icons';
import Flex from '@/molecules/flex';
import type { StyleProps } from '@/types';

import { AccordionContext } from './accordion';

type AccordionTriggerProps = StyleProps & {
  children?: ReactNode;
  gap?: number;
};

const AccordionTrigger = (props: AccordionTriggerProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const { children, style = {}, className = '', gap = 8 } = props;
  const [openContent, setOpenContent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { hasBottomSpace, rightActions } = useContext(AccordionContext);
  const shouldShowIcon = openContent || isHovered;
  const openClass = openContent
    ? `${CLASS_PREFIX}-accordion-trigger--open`
    : '';

  const handleOnClick = () => {
    const sibling = triggerRef.current!
      .nextElementSibling as HTMLElement;
    const contentHeight = sibling.scrollHeight;
    setOpenContent((prev) => {
      const prevState = prev;
      if (!prevState) {
        sibling.style.height = hasBottomSpace
          ? `${contentHeight + 16}px`
          : `${contentHeight}px`;

        setTimeout(() => {
          sibling.style.height = 'auto';
        }, 300);
      } else {
        sibling.style.height = '0';
      }
      return !prevState;
    });
  };

  return (
    <>
      <div
        className={`${CLASS_PREFIX}-accordion-trigger ${openClass} ${className}`}
        style={style}
        onClick={handleOnClick}
        ref={triggerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`${CLASS_PREFIX}-accordion-title`}>{children}</div>
        <Flex gap={gap} style={{ alignItems: 'center' }}>
          <span style={{ visibility: shouldShowIcon ? 'visible' : 'hidden' }}>
            {openContent ? <CollapseIcon /> : <ExpandIcon />}
          </span>
          {rightActions && rightActions}
        </Flex>
      </div>
    </>
  );
};

export default AccordionTrigger;
