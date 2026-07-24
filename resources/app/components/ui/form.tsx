import { type SerializedStyles } from '@emotion/react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type FormProps<TFieldValues extends FieldValues> = UseFormReturn<TFieldValues> & {
  children: ReactNode;
};

const Form = <TFieldValues extends FieldValues>({
  children,
  ...form
}: FormProps<TFieldValues>) => {
  return <FormProvider {...form}>{children}</FormProvider>;
};

Form.displayName = 'Form';

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>,
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

FormField.displayName = 'FormField';

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext?.name) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FormItem = forwardRef<HTMLDivElement, FormItemProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} css={[styles.item, cssProp]} {...rest} />
    </FormItemContext.Provider>
  );
});

FormItem.displayName = 'FormItem';

const FormLabel = forwardRef<
  ElementRef<typeof Label>,
  ComponentPropsWithoutRef<typeof Label>
>((props, ref) => {
  const { error, formItemId } = useFormField();

  return <Label ref={ref} htmlFor={formItemId} error={Boolean(error)} {...props} />;
});

FormLabel.displayName = 'FormLabel';

const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>((props, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        error
          ? `${formDescriptionId} ${formMessageId}`
          : `${formDescriptionId}`
      }
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
});

FormControl.displayName = 'FormControl';

type FormDescriptionProps = Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;
    const { formDescriptionId } = useFormField();

    return (
      <p
        ref={ref}
        id={formDescriptionId}
        css={[styles.description, cssProp]}
        {...rest}
      />
    );
  },
);

FormDescription.displayName = 'FormDescription';

type FormMessageProps = Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  (props, ref) => {
    const { css: cssProp, children, ...rest } = props;
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message ?? '') : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} css={[styles.message, cssProp]} {...rest}>
        {body}
      </p>
    );
  },
);

FormMessage.displayName = 'FormMessage';

type FormFieldRowProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const FormFieldRow = forwardRef<HTMLDivElement, FormFieldRowProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.fieldRow, cssProp]} {...rest} />;
  },
);

FormFieldRow.displayName = 'FormFieldRow';

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldRow,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};

const styles = {
  item: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    width: '100%',
  }),
  description: scoped({
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  }),
  message: scoped({
    ...theme.typography.small(),
    color: theme.colors.text.critical,
  }),
  fieldRow: scoped({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: theme.spacing[2],
    width: 'max-content',
  }),
};

export const formMessageStyle = styles.message;
