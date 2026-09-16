import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { useTaxProfileForm } from '@/features/settings/tax/shared/hooks/use-tax-profile-form';
import type { TaxProfile } from '@/features/settings/tax/shared/schemas/catalog/tax';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type TaxProfilePopupProps = {
  isOpen: boolean | TaxProfile;
  onClose?: () => void;
  onSave?: (id: number) => void;
  from?: string;
  taxProfile?: TaxProfile | null;
};

export const TaxProfilePopup = ({
  isOpen,
  onClose = noop,
  onSave = noop,
  from = '',
  taxProfile = null,
}: TaxProfilePopupProps) => {
  const { form, isSubmitting, isSaveDisabled, handleClose, handleSubmit } = useTaxProfileForm({
    isOpen: !!isOpen,
    editingProfile: from === 'edit' ? taxProfile : null,
    onClose,
    onSave,
  });

  return (
    <Dialog
      open={!!isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent style={{ width: '400px' }}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Create tax profile', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
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
            </Flex>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSaveDisabled}
            >
              {from === 'edit' ? __('Update', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

TaxProfilePopup.displayName = 'TaxProfilePopup';
