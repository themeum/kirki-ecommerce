import { css, type SerializedStyles } from '@emotion/react';
import {
  ComponentRef,
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode
} from 'react';

import Label from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type FieldOrientation = 'vertical' | 'horizontal' | 'responsive';

type FieldSetProps = Omit<
  ComponentPropsWithoutRef<'fieldset'>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FieldSet = forwardRef<HTMLFieldSetElement, FieldSetProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <fieldset
      ref={ref}
      data-slot="field-set"
      css={[styles.fieldSet, cssProp]}
      {...rest}
    />
  );
});

FieldSet.displayName = 'FieldSet';

type FieldLegendProps = Omit<
  ComponentPropsWithoutRef<'legend'>,
  'className' | 'css'
> & {
  variant?: 'legend' | 'label';
  css?: SerializedStyles;
};

const FieldLegend = forwardRef<HTMLLegendElement, FieldLegendProps>(
  (props, ref) => {
    const { css: cssProp, variant = 'legend', ...rest } = props;

    return (
      <legend
        ref={ref}
        data-slot="field-legend"
        data-variant={variant}
        css={[
          styles.fieldLegend,
          variant === 'legend' && styles.fieldLegendVariant,
          variant === 'label' && styles.fieldLegendLabel,
          cssProp,
        ]}
        {...rest}
      />
    );
  },
);

FieldLegend.displayName = 'FieldLegend';

type FieldGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FieldGroup = forwardRef<HTMLDivElement, FieldGroupProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="field-group"
      css={[styles.fieldGroup, cssProp]}
      {...rest}
    />
  );
});

FieldGroup.displayName = 'FieldGroup';

type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'css'> & {
  orientation?: FieldOrientation;
  css?: SerializedStyles;
};

const Field = forwardRef<HTMLDivElement, FieldProps>((props, ref) => {
  const { css: cssProp, orientation = 'vertical', ...rest } = props;

  return (
    <div
      ref={ref}
      role="group"
      data-slot="field"
      data-orientation={orientation}
      css={css(styles.field,
        styles.orientations[orientation],
        cssProp,)}
      {...rest}
    />
  );
});

Field.displayName = 'Field';

type FieldContentProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FieldContent = forwardRef<HTMLDivElement, FieldContentProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="field-content"
        css={[styles.fieldContent, cssProp]}
        {...rest}
      />
    );
  },
);

FieldContent.displayName = 'FieldContent';

type FieldLabelProps = Omit<
  ComponentPropsWithoutRef<typeof Label>,
  'className'
>;

const FieldLabel = forwardRef<ComponentRef<typeof Label>, FieldLabelProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <Label
        ref={ref}
        data-slot="field-label"
        css={css([styles.fieldLabel, cssProp])}
        {...rest}
      />
    );
  },
);

FieldLabel.displayName = 'FieldLabel';

type FieldTitleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FieldTitle = forwardRef<HTMLDivElement, FieldTitleProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="field-label"
      css={[styles.fieldTitle, cssProp]}
      {...rest}
    />
  );
});

FieldTitle.displayName = 'FieldTitle';

type FieldDescriptionProps = Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FieldDescription = forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <p
        ref={ref}
        data-slot="field-description"
        css={[styles.fieldDescription, cssProp]}
        {...rest}
      />
    );
  },
);

FieldDescription.displayName = 'FieldDescription';

type FieldSeparatorProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css' | 'children'
> & {
  children?: ReactNode;
  css?: SerializedStyles;
};

const FieldSeparator = forwardRef<HTMLDivElement, FieldSeparatorProps>(
  (props, ref) => {
    const { css: cssProp, children, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="field-separator"
        data-content={children ? 'true' : undefined}
        css={[styles.fieldSeparator, cssProp]}
        {...rest}
      >
        <Separator css={styles.fieldSeparatorLine} />
        {children && (
          <span
            data-slot="field-separator-content"
            css={styles.fieldSeparatorContent}
          >
            {children}
          </span>
        )}
      </div>
    );
  },
);

FieldSeparator.displayName = 'FieldSeparator';

type FieldErrorProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css' | 'children'
> & {
  children?: ReactNode;
  errors?: Array<{ message?: string } | undefined>;
  css?: SerializedStyles;
};

const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>((props, ref) => {
  const { css: cssProp, children, errors, ...rest } = props;

  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul css={styles.fieldErrorList}>
        {uniqueErrors.map((error, index) => {
          if (!error?.message) {
            return null;
          }

          return <li key={index}>{error.message}</li>;
        })}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="alert"
      data-slot="field-error"
      css={[styles.fieldError, cssProp]}
      {...rest}
    >
      {content}
    </div>
  );
});

FieldError.displayName = 'FieldError';

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle
};

const styles = {
  fieldSet: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[6],
    margin: 0,
    padding: 0,
    border: 'none',
    minWidth: 0,
    '&:has(> [data-slot="checkbox-group"]), &:has(> [data-slot="radio-group"])':
    {
      gap: theme.spacing[3],
    },
  }),
  fieldLegend: scoped({
    marginBottom: theme.spacing[3],
    padding: 0,
    fontWeight: theme.typography.fontWeight.medium,
  }),
  fieldLegendVariant: scoped({
    ...theme.typography.paragraph('medium'),
  }),
  fieldLegendLabel: scoped({
    ...theme.typography.small('medium'),
  }),
  fieldGroup: scoped({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: theme.spacing[7],
    '&[data-slot="checkbox-group"]': {
      gap: theme.spacing[3],
    },
    '& > [data-slot="field-group"]': {
      gap: theme.spacing[4],
    },
  }),
  field: scoped({
    display: 'flex',
    width: '100%',
    gap: theme.spacing[2],
    '&[data-invalid="true"]': {
      color: theme.colors.text.critical,
    },
    '&[data-invalid="true"] [data-slot="field-label"]': {
      color: theme.colors.text.critical,
    },
  }),
  orientations: {
    vertical: scoped({
      flexDirection: 'column',
      '& > *': {
        width: '100%',
      },
    }),
    horizontal: scoped({
      flexDirection: 'row',
      alignItems: 'center',
      width: 'max-content',
      '& > [data-slot="field-label"]': {
        flex: '1 1 auto',
        width: 'auto',
      },
      '&:has(> [data-slot="field-content"])': {
        alignItems: 'flex-start',
      },
      '&:has(> [data-slot="field-content"]) > [role="checkbox"], &:has(> [data-slot="field-content"]) > [role="radio"]':
      {
        marginTop: '1px',
      },
    }),
    responsive: scoped({
      flexDirection: 'column',
      '& > *': {
        width: '100%',
      },
      '@media (min-width: 768px)': {
        flexDirection: 'row',
        alignItems: 'center',
        '& > *': {
          width: 'auto',
        },
        '& > [data-slot="field-label"]': {
          flex: '1 1 auto',
        },
        '&:has(> [data-slot="field-content"])': {
          alignItems: 'flex-start',
        },
        '&:has(> [data-slot="field-content"]) > [role="checkbox"], &:has(> [data-slot="field-content"]) > [role="radio"]':
        {
          marginTop: '1px',
        },
      },
    }),
  } as const,
  fieldContent: scoped({
    display: 'flex',
    flex: '1 1 0%',
    flexDirection: 'column',
    gap: theme.spacing[2],
    lineHeight: 1.375,
  }),
  fieldLabel: scoped({
    display: 'flex',
    width: 'fit-content',
    gap: theme.spacing[1],
    '.group[data-disabled="true"] &': {
      opacity: 0.5,
    },
    '&:has(> [data-slot="field"])': {
      width: '100%',
      flexDirection: 'column',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border.default}`,
    },
    '&:has(> [data-slot="field"]) > [data-slot="field"]': {
      padding: theme.spacing[4],
    },
    '&:has([data-state="checked"])': {
      borderColor: theme.colors.background.fillBrand,
      backgroundColor: theme.colors.background.fillSecondary,
    },
  }),
  fieldTitle: scoped({
    display: 'flex',
    width: 'fit-content',
    alignItems: 'center',
    gap: theme.spacing[2],
    ...theme.typography.small('medium'),
    lineHeight: 1.375,
    '.group[data-disabled="true"] &': {
      opacity: 0.5,
    },
  }),
  fieldDescription: scoped({
    ...theme.typography.small(),
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.secondary,
    lineHeight: 1.5,
    '&:last-child': {
      marginTop: 0,
    },
    '& > a': {
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    },
    '& > a:hover': {
      color: theme.colors.text.brand,
    },
  }),
  fieldSeparator: scoped({
    position: 'relative',
    height: '20px',
    marginTop: `calc(${theme.spacing[2]} * -1)`,
    marginBottom: `calc(${theme.spacing[2]} * -1)`,
    ...theme.typography.small(),
  }),
  fieldSeparatorLine: scoped({
    position: 'absolute',
    inset: '0',
    margin: 'auto',
  }),
  fieldSeparatorContent: scoped({
    position: 'relative',
    display: 'block',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: theme.spacing[2],
    paddingRight: theme.spacing[2],
    backgroundColor: theme.colors.background.fill,
    color: theme.colors.text.secondary,
  }),
  fieldError: scoped({
    ...theme.typography.small(),
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.critical,
  }),
  fieldErrorList: scoped({
    margin: 0,
    marginLeft: theme.spacing[4],
    padding: 0,
    display: 'flex',
    listStyleType: 'disc',
    flexDirection: 'column',
    gap: theme.spacing[1],
  }),
};

export const fieldErrorStyle = styles.fieldError;
