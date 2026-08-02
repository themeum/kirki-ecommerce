import { type ReactNode } from 'react';
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';

type FormProps<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = TFieldValues,
> = UseFormReturn<TFieldValues, TContext, TTransformedValues> & {
  children: ReactNode;
};

const Form = <
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = TFieldValues,
>({
  children,
  ...form
}: FormProps<TFieldValues, TContext, TTransformedValues>) => {
  return <FormProvider {...form}>{children}</FormProvider>;
};

Form.displayName = 'Form';

export { Form };
