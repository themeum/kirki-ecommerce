import type { ReactNode, CSSProperties } from 'react';

import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';
import type { AlertType } from '@/types';

type AlertProps = {
  type?: AlertType;
  icon?: ReactNode;
  text?: ReactNode;
  className?: string;
  style?: CSSProperties;
  hasHighlight?: boolean;
};

const Alert = ({
  type,
  icon,
  text,
  className = '',
  style = {},
  hasHighlight = false,
}: AlertProps) => {
  const alertVariants = {
    type: {
      success: `${CLASS_PREFIX}-alert-success`,
      fail: `${CLASS_PREFIX}-alert-fail`,
      pending: `${CLASS_PREFIX}-alert-pending`,
    },
  };
  return (
    <div
      className={`${CLASS_PREFIX}-alert ${type ? alertVariants.type[type] : ''} ${className}`}
      style={style}
    >
      {hasHighlight && (
        <div className={`${CLASS_PREFIX}-highlighted-line`}></div>
      )}
      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        <span className={`${CLASS_PREFIX}-alert-icon`}>{icon}</span>
        <span className={`${CLASS_PREFIX}-alert-text`}>{text}</span>
      </Flex>
    </div>
  );
};

export default Alert;
