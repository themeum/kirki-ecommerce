import type {
  LastUsedShippingCarrier,
  OrderShippingCarrier,
  OrderTracking,
} from '@/features/orders/schemas/catalog/order';
import type { AddTrackingFormInput } from '@/features/orders/schemas/forms/add-tracking-form';
import { OTHER_CARRIER_VALUE } from '@/features/orders/schemas/forms/add-tracking-form';
import { isDefined } from '@/utils/object';

type InitialTrackingCarrierValues = Pick<AddTrackingFormInput, 'carrier' | 'other_name'>;

const getInitialTrackingValues = (
  carriers: OrderShippingCarrier[],
  lastUsed: LastUsedShippingCarrier | undefined,
): InitialTrackingCarrierValues => {
  const lastUsedId = lastUsed?.carrier_id ?? '';
  const lastUsedName = lastUsed?.carrier?.trim() ?? '';

  if (lastUsedId && carriers.some((carrier) => carrier.id === lastUsedId)) {
    return { carrier: lastUsedId };
  }

  if (lastUsedName) {
    return { carrier: OTHER_CARRIER_VALUE, other_name: lastUsedName };
  }

  if (carriers.length === 0) {
    return { carrier: OTHER_CARRIER_VALUE };
  }

  return { carrier: '' };
};

const getEmptyTrackingValues = (): AddTrackingFormInput => ({
  carrier: '',
  tracking_number: '',
  other_name: '',
  other_url: '',
});

const isTrackingNumberAdded = (tracking: OrderTracking): boolean =>
  isDefined(tracking.tracking_number) && tracking.tracking_number !== '';

export { getEmptyTrackingValues, getInitialTrackingValues, isTrackingNumberAdded };
