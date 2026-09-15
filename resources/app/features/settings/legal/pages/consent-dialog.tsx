import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import ConsentMessageField from '@/features/settings/legal/components/fields/consent-message-field';
import { consentMethodOptions } from '@/features/settings/legal/lib/utils';
import type { Consent } from '@/features/settings/legal/schemas/catalog/legal';
import {
  type ConsentFormInput,
  type ConsentFormPayload,
  ConsentFormSchema,
} from '@/features/settings/legal/schemas/forms/consent-form';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type ConsentDialogProps = {
  isOpen: boolean;
  selectedItem?: Consent | null;
  isSaving?: boolean;
  onClose?: () => void;
  onSave: (payload: ConsentFormPayload) => void;
};

const ConsentDialog = ({
  isOpen,
  selectedItem = null,
  isSaving = false,
  onClose = noop,
  onSave,
}: ConsentDialogProps) => {
  const form = useForm<ConsentFormInput, unknown, ConsentFormPayload>({
    resolver: zodResolver(ConsentFormSchema),
    defaultValues: getDefaults(ConsentFormSchema),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!selectedItem) {
      form.reset(getDefaults(ConsentFormSchema));
      return;
    }

    const locations = selectedItem.locations ?? [];

    form.reset({
      title: selectedItem.title ?? '',
      message: selectedItem.message ?? '',
      method: selectedItem.method ?? 'mandatory_checkbox',
      show_on_signup: locations.includes('signup'),
      show_on_login: locations.includes('login'),
      show_on_checkout: locations.includes('checkout'),
    });
  }, [isOpen, selectedItem, form]);

  const handleClose = () => {
    form.reset(getDefaults(ConsentFormSchema));
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent cssOverride={styles.dialogContent}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {selectedItem
              ? __('Edit Consent', 'kirki-ecommerce')
              : __('New Consents', 'kirki-ecommerce')}
          </DialogTitle>
          <DialogDescription>
            {__(
              'Set where this consent appears and what customers must agree to.',
              'kirki-ecommerce',
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <DialogBody cssOverride={styles.dialogBody}>
            <TextField
              name="title"
              label={__('Consent Title', 'kirki-ecommerce')}
              infoText={__(
                'Only used to identify this consent in the admin. Customers never see it.',
                'kirki-ecommerce',
              )}
              placeholder={__('e.g. Basic consents', 'kirki-ecommerce')}
            />

            <Flex direction="column" gap={2}>
              <Text variant="small" weight="medium">
                {__('Display on', 'kirki-ecommerce')}
              </Text>
              <Flex gap={2}>
                <CheckboxField name="show_on_signup" label={__('Signup page', 'kirki-ecommerce')} />
                <CheckboxField name="show_on_login" label={__('Login page', 'kirki-ecommerce')} />
                <CheckboxField name="show_on_checkout" label={__('Checkout', 'kirki-ecommerce')} />
              </Flex>
            </Flex>

            <ConsentMessageField
              name="message"
              label={__('Consent Message', 'kirki-ecommerce')}
              infoText={__(
                'Shown to the customer. Use the + button to link one of your pages.',
                'kirki-ecommerce',
              )}
              placeholder={__(
                'e.g. By continuing, you agree to our {privacy_policy}.',
                'kirki-ecommerce',
              )}
              rows={5}
            />

            <SelectField
              name="method"
              label={__('Consent Method', 'kirki-ecommerce')}
              options={consentMethodOptions()}
              placeholder={__('Select a method', 'kirki-ecommerce')}
            />
          </DialogBody>

          <Separator cssOverride={styles.footerSeparator} />

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={form.handleSubmit(onSave)} loading={isSaving}>
              {__('Save changes', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ConsentDialog.displayName = 'ConsentDialog';

export default ConsentDialog;

const styles = defineStyles({
  dialogContent: {
    width: '600px',
  },
  dialogBody: {
    gap: theme.spacing[4],
  },
  locationRow: {
    flexWrap: 'wrap',
  },
  footerSeparator: {
    margin: theme.spacing[0],
  },
});
