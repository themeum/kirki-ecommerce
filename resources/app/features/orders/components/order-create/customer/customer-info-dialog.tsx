import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';

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
import Grid from '@/components/ui/grid';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { __ } from '@/wpi18n';

type ContactInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
};

const ContactInfoDialog = ({ open, onOpenChange, onSave, isSaving }: ContactInfoDialogProps) => {
  const form = useFormContext<OrderFormInput>();
  const snapshot = useRef(form.getValues());

  const handleCancel = () => {
    form.reset(snapshot.current);
    onOpenChange(false);
  };

  const handleSave = () => {
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
          <Flex direction="column" gap={4}>
            <Grid>
              <TextField<OrderFormInput>
                name="customer_first_name"
                label={__('First Name', 'kirki-ecommerce')}
              />
              <TextField<OrderFormInput>
                name="customer_last_name"
                label={__('Last Name', 'kirki-ecommerce')}
              />
            </Grid>
            <TextField<OrderFormInput>
              name="customer_email"
              label={__('Email', 'kirki-ecommerce')}
            />
            <TextField<OrderFormInput>
              name="customer_phone"
              label={__('Phone Number', 'kirki-ecommerce')}
            />
          </Flex>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ContactInfoDialog.displayName = 'ContactInfoDialog';

export default ContactInfoDialog;
