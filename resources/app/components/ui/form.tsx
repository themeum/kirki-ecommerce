import { type ReactNode } from 'react';
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';

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

export { Form };
