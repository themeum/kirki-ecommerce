import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import { CLASS_PREFIX } from '@/conf';

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

const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  const {
    text,
    subText,
    img,
    color,
    gap = 8,
    closeIcon,
    className,
    style = {},
    onTagRemove = () => {},
  } = props;

  return (
    <div
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-tag`, className)}
      style={style}
    >
      <Flex gap={gap} style={{ alignItems: 'center' }}>
        {img}
        {color && (
          <div
            className={`${CLASS_PREFIX}-ui-tag-swatch`}
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        {text}
        {subText && (
          <span className={`${CLASS_PREFIX}-ui-tag-subtext`}>{subText}</span>
        )}
        {closeIcon && (
          <button
            type="button"
            className={`${CLASS_PREFIX}-ui-tag-close`}
            onClick={onTagRemove}
            aria-label="Remove tag"
          >
            {closeIcon}
          </button>
        )}
      </Flex>
    </div>
  );
});

Tag.displayName = 'Tag';

export default Tag;
