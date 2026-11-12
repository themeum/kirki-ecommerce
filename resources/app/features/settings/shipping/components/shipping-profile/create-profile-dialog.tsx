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
import { useShippingProfileForm } from '@/features/settings/shipping/hooks/use-shipping-profile-form';
import type { ShippingProfile } from '@/features/settings/shipping/schemas/catalog/shipping';
import { __ } from '@/wpi18n';

type CreateProfilePopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id: number) => void;
  editIndex?: number | null;
  shippingProfileList?: ShippingProfile[];
};

export const CreateProfilePopup = ({
  isOpen,
  onClose,
  onSave,
  editIndex = null,
  shippingProfileList = [],
}: CreateProfilePopupProps) => {
  const editingProfile = editIndex
    ? shippingProfileList.find((profile) => profile?.id === editIndex)
    : undefined;

  const { form, isSubmitting, isSaveDisabled, handleClose, handleSubmit } = useShippingProfileForm({
    isOpen,
    editingProfile,
    onClose,
    onSave,
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <Form {...form}>
        <DialogContent cssOverride={{ width: 400 }}>
          <DialogCloseButton />
          <DialogHeader>
            <DialogTitle>{__('Create shipping profile', 'kirki-ecommerce')}</DialogTitle>
          </DialogHeader>

          <DialogBody>
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
            </Flex>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaveDisabled}>
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

CreateProfilePopup.displayName = 'CreateProfilePopup';
