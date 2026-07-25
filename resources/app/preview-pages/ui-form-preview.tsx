import { css } from '@emotion/react';
import { useForm } from 'react-hook-form';

import Flex from '@/components/ui/flex';

import Button from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
        <Flex direction="column" gap={3} css={css({ maxWidth: 320 })}>
          <FormField
            control={form.control}
            name="username"
            rules={{ required: 'Username is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
