import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import { CLASS_PREFIX } from '@/conf';

type ActionGroupProps = {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  gap?: number;
};

const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  (props, ref) => {
    const { children, style = {}, className, gap = 8 } = props;

    return (
      <Flex
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-action-group`, className)}
        gap={gap}
        style={style}
      >
        {children}
      </Flex>
    );
  },
);

ActionGroup.displayName = 'ActionGroup';

export default ActionGroup;
