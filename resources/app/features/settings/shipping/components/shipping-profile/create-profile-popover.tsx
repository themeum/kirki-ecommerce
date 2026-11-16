import type { ReactNode } from 'react';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useShippingProfileForm } from '@/features/settings/shipping/hooks/use-shipping-profile-form';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CreateProfilePopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (id: number) => void;
  children: ReactNode;
};

export const CreateProfilePopover = ({
  isOpen,
  onClose,
  onSave,
  children,
}: CreateProfilePopoverProps) => {
  const { form, isSaveDisabled, isSubmitting, handleClose, handleSubmit } = useShippingProfileForm({
    isOpen,
    onClose,
    onSave,
  });

  return (
    <Popover
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent align="end" cssOverride={styles.content}>
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('e.g. Fragile', 'kirki-ecommerce')}
            />
            <CheckboxField
              name="is_default"
              label={__('Set as default profile', 'kirki-ecommerce')}
            />
            <Flex gap={2} justify="flex-end">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSaveDisabled}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

CreateProfilePopover.displayName = 'CreateProfilePopover';

const styles = defineStyles({
  content: {
    width: '320px',
    maxWidth: '320px',
    padding: theme.spacing[4],
  },
});
