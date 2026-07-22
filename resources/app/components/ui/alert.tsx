import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import { CLASS_PREFIX } from '@/conf';
import type { AlertType } from '@/types';

type AlertProps = {
  type?: AlertType;
  icon?: ReactNode;
  text?: ReactNode;
  className?: string;
  style?: CSSProperties;
  hasHighlight?: boolean;
};

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const {
    type,
    icon,
    text,
    className,
    style = {},
    hasHighlight = false,
  } = props;

  return (
    <div
      ref={ref}
      role="alert"
      className={classNames(
        `${CLASS_PREFIX}-ui-alert`,
        type && `${CLASS_PREFIX}-ui-alert--${type}`,
        className,
      )}
      style={style}
    >
      {hasHighlight && (
        <div
          className={`${CLASS_PREFIX}-ui-alert-highlight`}
          aria-hidden="true"
        />
      )}
      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        {icon && (
          <span className={`${CLASS_PREFIX}-ui-alert-icon`} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={`${CLASS_PREFIX}-ui-alert-text`}>{text}</span>
      </Flex>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;
