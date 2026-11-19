import { useFormContext, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import type { OrderShippingCarrier } from '@/features/orders/schemas/catalog/order';
import {
  type AddTrackingFormInput,
  OTHER_CARRIER_VALUE,
} from '@/features/orders/schemas/forms/add-tracking-form';
import { isTrackingTemplate, resolveTrackingUrl } from '@/features/settings';
import { TruckIcon } from '@/icons/common';
import { __ } from '@/wpi18n';

type TrackingFieldsProps = {
  carriers: OrderShippingCarrier[];
};

const TrackingFields = ({ carriers }: TrackingFieldsProps) => {
  const { control } = useFormContext<AddTrackingFormInput>();

  const [carrier, trackingNumber, otherUrl] = useWatch({
    control,
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
    <Flex direction="column" gap={1}>
      <Flex direction="column" gap={2}>
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
      </Flex>
      {previewUrl && (
        <Flex gap={1} align="start">
          <Text variant="small" color="secondary" cssOverride={{ flexShrink: 0 }}>
            {__('Tracking link:', 'kirki-ecommerce')}
          </Text>
          <Text variant="small" color="emphasis">
            {previewUrl}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

TrackingFields.displayName = 'TrackingFields';

export default TrackingFields;
