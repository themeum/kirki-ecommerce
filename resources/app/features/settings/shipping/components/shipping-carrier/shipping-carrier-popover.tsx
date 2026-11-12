import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import MediaField from '@/components/form/media-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverContent } from '@/components/ui/popover';
import type { ShippingCarrier } from '@/features/settings/shipping/schemas/catalog/shipping';
import {
  type ShippingCarrierFormInput,
  type ShippingCarrierFormPayload,
  ShippingCarrierFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-carrier-form';
import { useWordpressMedia } from '@/hooks';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ShippingCarrierPopoverProps = {
  isOpen: boolean;
  selectedCarrier?: ShippingCarrier | null;
  onClose: () => void;
  onSubmit: (payload: ShippingCarrierFormPayload) => void;
  children: ReactNode;
};

type ShippingCarrierPopoverFormProps = Pick<
  ShippingCarrierPopoverProps,
  'selectedCarrier' | 'onClose' | 'onSubmit'
>;

const toFormValues = (carrier: ShippingCarrier | null): ShippingCarrierFormInput => {
  if (!carrier) {
    return getDefaults(ShippingCarrierFormSchema);
  }

  return {
    name: carrier.name ?? '',
    tracking_url: carrier.tracking_url ?? '',
    logo: carrier.logo ? { id: carrier.logo, url: carrier.logo_url ?? '' } : null,
  };
};

const ShippingCarrierPopoverForm = ({
  selectedCarrier = null,
  onClose,
  onSubmit,
}: ShippingCarrierPopoverFormProps) => {
  const form = useForm<ShippingCarrierFormInput, unknown, ShippingCarrierFormPayload>({
    resolver: zodResolver(ShippingCarrierFormSchema),
    defaultValues: toFormValues(selectedCarrier),
  });

  const handleSave = (payload: ShippingCarrierFormPayload) => {
    onSubmit(payload);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <Flex direction="column" gap={4}>
          <TextField
            name="name"
            label={__('Carrier name', 'kirki-ecommerce')}
            placeholder={__('e.g. UPS', 'kirki-ecommerce')}
          />
          <TextField
            name="tracking_url"
            label={__('URL', 'kirki-ecommerce')}
            placeholder={__(
              'e.g. https://www.ups.com/track?tracknum={tracking_number}',
              'kirki-ecommerce',
            )}
            description={__(
              'The tracking link sent to the customer. Put {tracking_number} where the tracking number goes.',
              'kirki-ecommerce',
            )}
          />
          <MediaField
            name="logo"
            label={__('Logo', 'kirki-ecommerce')}
            infoText={__('Recommended image size: 48×48', 'kirki-ecommerce')}
            accept={['image']}
          />
          <Flex gap={2} justify="flex-end">
            <Button variant="ghost" onClick={onClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button type="submit" variant="primary">
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Form>
  );
};

ShippingCarrierPopoverForm.displayName = 'ShippingCarrierPopoverForm';

const ShippingCarrierPopover = ({
  isOpen,
  selectedCarrier = null,
  onClose,
  onSubmit,
  children,
}: ShippingCarrierPopoverProps) => {
  const { isWpMediaFrameOpen, isWpMediaNode } = useWordpressMedia();

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();

    const content = event.currentTarget;

    if (content instanceof HTMLElement) {
      content.querySelector('input')?.focus();
    }
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      {children}
      <PopoverContent
        align="end"
        cssOverride={styles.content}
        onOpenAutoFocus={handleOpenAutoFocus}
        onEscapeKeyDown={(event) => {
          if (isWpMediaFrameOpen()) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isWpMediaNode(event.target)) {
            event.preventDefault();
          }
        }}
      >
        <ShippingCarrierPopoverForm
          selectedCarrier={selectedCarrier}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </PopoverContent>
    </Popover>
  );
};

ShippingCarrierPopover.displayName = 'ShippingCarrierPopover';

export default ShippingCarrierPopover;

const styles = defineStyles({
  content: {
    width: '320px',
    maxWidth: '320px',
    padding: theme.spacing[4],
  },
});
