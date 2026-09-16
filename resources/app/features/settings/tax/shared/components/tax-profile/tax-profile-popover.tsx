import type { ReactNode } from 'react';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useTaxProfileForm } from '@/features/settings/tax/shared/hooks/use-tax-profile-form';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type TaxProfilePopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (id: number) => void;
  children: ReactNode;
};

export const TaxProfilePopover = ({
  isOpen,
  onClose,
  onSave,
  children,
}: TaxProfilePopoverProps) => {
  const { form, isSaveDisabled, isSubmitting, handleClose, handleSubmit } = useTaxProfileForm({
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
              placeholder={__('e.g. Books', 'kirki-ecommerce')}
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

TaxProfilePopover.displayName = 'TaxProfilePopover';

const styles = defineStyles({
  content: {
    width: '320px',
    maxWidth: '320px',
    padding: theme.spacing[4],
  },
});
