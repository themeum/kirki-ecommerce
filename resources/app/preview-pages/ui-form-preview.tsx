import { Controller, useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';

type FormValues = {
  username: string;
};

const UiFormPreview = () => {
  const form = useForm<FormValues>({
    defaultValues: {
      username: '',
    },
  });

  const handleSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Flex direction="column" gap={3} cssOverride={{ maxWidth: 320 }}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="username"
              rules={{ required: 'Username is required' }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    placeholder="Enter username"
                    error={Boolean(fieldState.error)}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    This is your public display name.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <Button type="submit" variant="primary">
            Submit
          </Button>
        </Flex>
      </form>
    </Form>
  );
};

UiFormPreview.displayName = 'UiFormPreview';

export default UiFormPreview;
