import { useState } from 'react';

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
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import type { OrderTracking } from '@/features/orders/schemas/catalog/order';
import { __ } from '@/wpi18n';

type AddTrackingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: OrderTracking;
  isSaving?: boolean;
  onSubmit: (values: { carrier: string; tracking_number: string; tracking_url: string }) => void;
};

const AddTrackingDialog = ({
  open,
  onOpenChange,
  tracking,
  isSaving,
  onSubmit,
}: AddTrackingDialogProps) => {
  const [carrier, setCarrier] = useState(tracking.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(tracking.tracking_number ?? '');
  const [trackingUrl, setTrackingUrl] = useState(tracking.tracking_url ?? '');

  const canSubmit = Boolean(carrier.trim()) && Boolean(trackingNumber.trim());

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      carrier: carrier.trim(),
      tracking_number: trackingNumber.trim(),
      tracking_url: trackingUrl.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '520px' }}>
        <DialogHeader>
          <DialogTitle>{__('Add tracking', 'kirki-ecommerce')}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Flex direction="column" gap={4}>
            <Field>
              <FieldLabel>{__('Carrier', 'kirki-ecommerce')}</FieldLabel>
              <Input
                value={carrier}
                placeholder={__('i.e FedEx, UPS', 'kirki-ecommerce')}
                onChange={(event) => setCarrier(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>{__('Tracking number', 'kirki-ecommerce')}</FieldLabel>
              <Input
                value={trackingNumber}
                placeholder={__('i.e 1Z999AA10123456784', 'kirki-ecommerce')}
                onChange={(event) => setTrackingNumber(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>{__('Tracking URL', 'kirki-ecommerce')}</FieldLabel>
              <Input
                value={trackingUrl}
                placeholder={__('https://', 'kirki-ecommerce')}
                onChange={(event) => setTrackingUrl(event.target.value)}
              />
            </Field>
          </Flex>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            loading={isSaving}
            onClick={handleSubmit}
          >
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddTrackingDialog.displayName = 'AddTrackingDialog';

export default AddTrackingDialog;
