import type { MouseEventHandler } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { RadioCheckedIcon, RadioTickIcon, RadioUncheckedIcon } from '@/icons';
import type { StyleProps } from '@/types';

type RadioItemType = 'checked' | 'tick';

type RadioItemProps = StyleProps & {
  isSelected?: boolean;
  onChange?: MouseEventHandler<HTMLSpanElement>;
  type?: RadioItemType;
  value?: string | number;
};

const RadioItem = (props: RadioItemProps) => {
  const {
    style = {},
    className = '',
    isSelected,
    onChange = () => {},
    type = 'checked',
  } = props;
  return (
    <span
      className={`${CLASS_PREFIX}-radio-item ${CLASS_PREFIX}-flex-start ${className}`}
      style={style}
      onClick={onChange}
    >
      {!isSelected ? (
        <RadioUncheckedIcon />
      ) : type === 'checked' ? (
        <RadioCheckedIcon />
      ) : (
        <RadioTickIcon />
      )}
    </span>
  );
};

export default RadioItem;
