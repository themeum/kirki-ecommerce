import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
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

    const isInteractive = typeof onClick === 'function';

    return (
      <Field data-invalid={error ? true : undefined}>
        {label && <FieldLabel>{label}</FieldLabel>}
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
        {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
        {typeof error === 'string' && <FieldError>{error}</FieldError>}
      </Field>
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
    border: `1px dashed ${theme.colors.border.gallery}`,
    ...flexCenter(),
    flexDirection: 'column',
    gap: theme.spacing[3],
    ...theme.typography.paragraph('medium'),
    color: theme.colors.text.secondary,
  }),
  types: {
    primary: scoped({
      backgroundColor: theme.colors.background.placeholderSurface,
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
