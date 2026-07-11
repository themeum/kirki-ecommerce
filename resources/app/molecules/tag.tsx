import type { ReactNode, CSSProperties } from 'react';

import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';

type TagProps = {
  text?: ReactNode;
  subText?: ReactNode;
  img?: ReactNode;
  color?: string;
  gap?: number;
  closeIcon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onTagRemove?: () => void;
};

const Tag = ({
  text,
  subText,
  img,
  color,
  gap = 8,
  closeIcon,
  className = '',
  style = {},
  onTagRemove = () => {},
}: TagProps) => {
  return (
    <div className={`${CLASS_PREFIX}-tag ${className}`} style={style}>
      <Flex gap={gap} style={{ alignItems: 'center' }}>
        {img}
        {color && (
          <div
            className={`${CLASS_PREFIX}-color-swatch`}
            style={{ backgroundColor: color }}
          />
        )}
        {text}
        {subText && (
          <span className={`${CLASS_PREFIX}-tag-subtext`}>{subText}</span>
        )}
        {closeIcon && (
          <span className={`${CLASS_PREFIX}-close-icon`} onClick={onTagRemove}>
            {closeIcon}
          </span>
        )}
      </Flex>
    </div>
  );
};

export default Tag;
