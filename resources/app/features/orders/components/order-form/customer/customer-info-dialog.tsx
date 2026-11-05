import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormContext } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import {
  type OrderContactFormInput,
  type OrderContactFormPayload,
  OrderContactFormSchema,
} from '@/features/orders/schemas/forms/order-contact-form';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { pickFormValues } from '@/libs/zod';
import { __ } from '@/wpi18n';

type ContactInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
};

const ContactInfoDialog = ({ open, onOpenChange, onSave, isSaving }: ContactInfoDialogProps) => {
  const orderForm = useFormContext<OrderFormInput>();

  const form = useForm<OrderContactFormInput, unknown, OrderContactFormPayload>({
    resolver: zodResolver(OrderContactFormSchema),
    defaultValues: pickFormValues(OrderContactFormSchema, {
      first_name: orderForm.getValues('customer_first_name'),
      last_name: orderForm.getValues('customer_last_name'),
      email: orderForm.getValues('customer_email'),
      phone: orderForm.getValues('customer_phone'),
    }),
  });

  const { isDirty } = form.formState;

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = (payload: OrderContactFormPayload) => {
    const contactEntries = [
      ['customer_first_name', payload.first_name],
      ['customer_last_name', payload.last_name],
      ['customer_email', payload.email],
      ['customer_phone', payload.phone],
    ] as const;

    orderForm.setValues(Object.fromEntries(contactEntries), {
      shouldDirty: true,
    });
    orderForm.clearErrors(contactEntries.map(([name]) => name));

    onSave?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '480px' }}>
        <DialogHeader>
          <DialogTitle>{__('Edit contact information', 'kirki-ecommerce')}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <Grid>
                <TextField name="first_name" label={__('First Name', 'kirki-ecommerce')} />
                <TextField name="last_name" label={__('Last Name', 'kirki-ecommerce')} />
              </Grid>
              <TextField name="email" label={__('Email', 'kirki-ecommerce')} />
              <TextField name="phone" label={__('Phone Number', 'kirki-ecommerce')} />
            </Flex>
          </Form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            variant="primary"
            onClick={form.handleSubmit(handleSave)}
            loading={isSaving}
            disabled={!isDirty}
          >
            {__('Update', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ContactInfoDialog.displayName = 'ContactInfoDialog';

export default ContactInfoDialog;
