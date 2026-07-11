import type { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import { ThumbnailPlaceholder } from '@/icons';

type PlaceholderProps = {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  size?: 'small' | 'large';
  type?: 'primary' | 'secondary';
  label?: string;
  helpText?: string;
  onClick?: () => void;
  error?: string | boolean;
};

const Placeholder = ({
  children,
  style = {},
  className = '',
  size,
  type,
  label,
  helpText,
  onClick = () => {},
  error,
}: PlaceholderProps) => {
  const placehodlerVariants = {
    size: {
      small: `${CLASS_PREFIX}-placeholder-small`,
      large: `${CLASS_PREFIX}-placeholder-large`,
    },
    type: {
      primary: `${CLASS_PREFIX}-placeholder-primary`,
      secondary: `${CLASS_PREFIX}-placeholder-secondary`,
    },
    default: `${CLASS_PREFIX}-placeholder`,
  };
  const allClassNames = classNames(
    placehodlerVariants.default,
    type && placehodlerVariants.type[type],
    size && placehodlerVariants.size[size],
    className,
  );
  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? 'error' : ''}
          helpText={error ? error : helpText}
        />
      )}
      <div className={allClassNames} style={style} onClick={onClick}>
        {size === 'small' ? <ThumbnailPlaceholder /> : children}
      </div>
    </Flex>
  );
};

export default Placeholder;
