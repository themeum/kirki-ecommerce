import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
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

const Placeholder = forwardRef<HTMLDivElement, PlaceholderProps>(
  (props, ref) => {
    const {
      children,
      style = {},
      className,
      size,
      type,
      label,
      helpText,
      onClick,
      error,
    } = props;

    const help = typeof error === 'string' ? error : helpText;
    const isInteractive = typeof onClick === 'function';

    return (
      <Flex direction="column" gap={8}>
        {label && (
          <Label error={Boolean(error)} helpText={help}>
            {label}
          </Label>
        )}
        <div
          ref={ref}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          className={classNames(
            `${CLASS_PREFIX}-ui-placeholder`,
            type && `${CLASS_PREFIX}-ui-placeholder--${type}`,
            size && `${CLASS_PREFIX}-ui-placeholder--${size}`,
            className,
          )}
          style={style}
          onClick={onClick}
          onKeyDown={(event) => {
            if (!isInteractive || !onClick) {
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick();
            }
          }}
        >
          {size === 'small' ? <ThumbnailPlaceholder /> : children}
        </div>
      </Flex>
    );
  },
);

Placeholder.displayName = 'Placeholder';

export default Placeholder;
