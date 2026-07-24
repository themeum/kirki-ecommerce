import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { ThumbnailPlaceholder } from '@/icons';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';

type PlaceholderProps = {
  children?: ReactNode;
  style?: CSSProperties;
  css?: SerializedStyles;
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
      css: cssProp,
      children,
      style,
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
          style={style}
          css={[
            styles.root,
            type && styles.types[type],
            size && styles.sizes[size],
            cssProp,
          ]}
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

const styles = {
  root: scoped({
    height: '137px',
    width: '100%',
    borderRadius: theme.radius.md,
    border: '1px dashed #e4e4e7',
    ...flexCenter(),
    flexDirection: 'column',
    gap: theme.spacing[3],
    fontWeight: 500,
    color: theme.colors.text.secondary,
  }),
  types: {
    primary: scoped({
      backgroundColor: '#f7f7f7',
    }),
    secondary: scoped({
      backgroundColor: theme.colors.background.fillSpecial2Secondary,
      border: 'none',
    }),
  },
  sizes: {
    large: scoped({
      height: '295px',
    }),
    small: scoped({
      height: '32px',
      width: '32px',
      borderColor: theme.colors.border.default,
    }),
  },
};
