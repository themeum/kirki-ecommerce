import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
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
import Image from '@/components/ui/image';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import type { OrderShippingCarrier, OrderTracking } from '@/features/orders/schemas/catalog/order';
import {
  type AddTrackingFormInput,
  type AddTrackingFormPayload,
  AddTrackingFormSchema,
  OTHER_CARRIER_VALUE,
} from '@/features/orders/schemas/forms/add-tracking-form';
import { useOrderShippingCarriersQuery } from '@/features/orders/services/order';
import { isTrackingTemplate, resolveTrackingUrl, toTrackingTemplate } from '@/features/settings';
import { TruckIcon } from '@/icons/common';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type AddTrackingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  tracking: OrderTracking;
  isSaving?: boolean;
  onSubmit: (payload: AddTrackingFormPayload) => void;
};

type AddTrackingFormProps = Pick<
  AddTrackingDialogProps,
  'onOpenChange' | 'tracking' | 'isSaving' | 'onSubmit'
> & {
  carriers: OrderShippingCarrier[];
};

const getInitialValues = (
  carriers: OrderShippingCarrier[],
  tracking: OrderTracking,
): AddTrackingFormInput => {
  const defaults = getDefaults(AddTrackingFormSchema);
  const storedName = tracking.carrier?.trim() ?? '';
  const trackingNumber = tracking.tracking_number ?? '';

  if (!storedName) {
    return { ...defaults, carrier: carriers.length === 0 ? OTHER_CARRIER_VALUE : '' };
  }

  const matchedCarrier = carriers.find((carrier) => carrier.name === storedName);

  if (matchedCarrier) {
    return { ...defaults, carrier: matchedCarrier.id, tracking_number: trackingNumber };
  }

  return {
    ...defaults,
    carrier: OTHER_CARRIER_VALUE,
    tracking_number: trackingNumber,
    other_name: storedName,
    other_url: toTrackingTemplate(tracking.tracking_url ?? '', trackingNumber),
  };
};

const AddTrackingForm = ({
  carriers,
  tracking,
  isSaving,
  onOpenChange,
  onSubmit,
}: AddTrackingFormProps) => {
  const form = useForm<AddTrackingFormInput, unknown, AddTrackingFormPayload>({
    resolver: zodResolver(AddTrackingFormSchema),
    defaultValues: getInitialValues(carriers, tracking),
    mode: 'onChange',
  });

  const [carrier, trackingNumber, otherUrl] = useWatch({
    control: form.control,
    name: ['carrier', 'tracking_number', 'other_url'],
  });

  const isOther = carrier === OTHER_CARRIER_VALUE;
  const template = isOther
    ? (otherUrl ?? '').trim()
    : (carriers.find((option) => option.id === carrier)?.tracking_url ?? '');
  const trimmedTrackingNumber = (trackingNumber ?? '').trim();
  const previewUrl = isTrackingTemplate(template)
    ? trimmedTrackingNumber
      ? resolveTrackingUrl(template, trimmedTrackingNumber)
      : template
    : '';

  const carrierOptions = [
    ...carriers.map((option) => ({
      label: option.name,
      value: option.id,
      icon: option.logo_url ? (
        <Image src={option.logo_url} alt="" width={16} height={16} fit="contain" />
      ) : (
        <TruckIcon />
      ),
    })),
    { label: __('Other', 'kirki-ecommerce'), value: OTHER_CARRIER_VALUE, icon: <TruckIcon /> },
  ];

  return (
    <Form {...form}>
      <DialogBody>
        <Flex direction="column" gap={4}>
          <SelectField
            name="carrier"
            label={__('Carrier', 'kirki-ecommerce')}
            placeholder={__('Select carrier', 'kirki-ecommerce')}
            options={carrierOptions}
          />
          {isOther && (
            <>
              <TextField
                name="other_name"
                label={__('Carrier name', 'kirki-ecommerce')}
                placeholder={__('i.e Local Courier', 'kirki-ecommerce')}
              />
              <TextField
                name="other_url"
                label={__('Tracking URL', 'kirki-ecommerce')}
                placeholder={__('https://example.com/track?n={tracking_number}', 'kirki-ecommerce')}
                description={__(
                  'Use {tracking_number} where the tracking number goes.',
                  'kirki-ecommerce',
                )}
              />
            </>
          )}
          <TextField
            name="tracking_number"
            label={__('Tracking number', 'kirki-ecommerce')}
            placeholder={__('i.e 1Z999AA10123456784', 'kirki-ecommerce')}
          />
          {previewUrl && (
            <Flex direction="column" gap={1}>
              <Text variant="small" weight="medium">
                {__('Tracking link', 'kirki-ecommerce')}
              </Text>
              <span css={scoped(styles.preview)}>{previewUrl}</span>
            </Flex>
          )}
        </Flex>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {__('Cancel', 'kirki-ecommerce')}
        </Button>
        <Button
          variant="primary"
          disabled={!form.formState.isValid}
          loading={isSaving}
          onClick={form.handleSubmit(onSubmit)}
        >
          {__('Save', 'kirki-ecommerce')}
        </Button>
      </DialogFooter>
    </Form>
  );
};

AddTrackingForm.displayName = 'AddTrackingForm';

const AddTrackingDialog = ({
  open,
  onOpenChange,
  orderId,
  tracking,
  isSaving,
  onSubmit,
}: AddTrackingDialogProps) => {
  const { data: carriers, isLoading } = useOrderShippingCarriersQuery(orderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '520px' }}>
        <DialogHeader>
          <DialogTitle>{__('Add tracking', 'kirki-ecommerce')}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        {isLoading ? (
          <DialogBody>
            <Flex justify="center" cssOverride={styles.loading}>
              <Spinner />
            </Flex>
          </DialogBody>
        ) : (
          <AddTrackingForm
            carriers={carriers ?? []}
            tracking={tracking}
            isSaving={isSaving}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

AddTrackingDialog.displayName = 'AddTrackingDialog';

export default AddTrackingDialog;

const styles = defineStyles({
  preview: {
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
    wordBreak: 'break-all',
  },
  loading: {
    padding: `${theme.spacing[6]} 0`,
  },
});
