import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import { StackedItems } from '@/components/ui/stacked-items';
import {
  buildCarrierFromPreset,
  getMissingCarrierPresets,
} from '@/features/settings/shipping/lib/shipping-carrier-presets';
import { saveShippingZones } from '@/features/settings/shipping/lib/utils';
import ShippingCarrierAddMenu from '@/features/settings/shipping/pages/shipping-carrier/shipping-carrier-add-menu';
import ShippingCarrierRow from '@/features/settings/shipping/pages/shipping-carrier/shipping-carrier-row';
import type {
  ShippingCarrier,
  ShippingCarrierPreset,
} from '@/features/settings/shipping/schemas/catalog/shipping';
import type { ShippingCarrierFormPayload } from '@/features/settings/shipping/schemas/forms/shipping-carrier-form';
import type { ShippingZone } from '@/features/settings/shipping/types';
import { useConfirmDelete } from '@/hooks';
import type { ShippingSettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { uuid } from '@/utils';
import { __ } from '@/wpi18n';

type ShippingCarrierProps = {
  shippingSettingsData: ShippingSettings | null | undefined;
  shippingZonesObj: ShippingZone[];
  setShippingZonesObj: Dispatch<SetStateAction<ShippingZone[]>>;
  zoneId?: string | number | null;
};

const ShippingCarrierCard = ({
  shippingSettingsData,
  shippingZonesObj,
  setShippingZonesObj,
  zoneId = null,
}: ShippingCarrierProps) => {
  const [editedCarrierId, setEditedCarrierId] = useState<string | null>(null);
  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const carriers = useMemo(
    () =>
      shippingZonesObj.find((zone) => String(zone.id) === String(zoneId))?.shipping_carriers ?? [],
    [shippingZonesObj, zoneId],
  );

  const missingPresets = useMemo(
    () => getMissingCarrierPresets(shippingSettingsData?.shipping_carrier_presets ?? [], carriers),
    [shippingSettingsData, carriers],
  );

  const saveCarriers = (nextCarriers: ShippingCarrier[], toastMessage: string) => {
    const updatedZones = shippingZonesObj.map((zone) =>
      String(zone.id) === String(zoneId) ? { ...zone, shipping_carriers: nextCarriers } : zone,
    );
    setShippingZonesObj(updatedZones);

    void saveShippingZones({ zones: updatedZones, shippingSettingsData, toastMessage });
  };

  const handleSelectPreset = (preset: ShippingCarrierPreset) => {
    saveCarriers(
      [...carriers, buildCarrierFromPreset(preset)],
      __('Shipping carrier added', 'kirki-ecommerce'),
    );
  };

  const handleSubmitNew = (payload: ShippingCarrierFormPayload) => {
    saveCarriers(
      [...carriers, { id: uuid(), preset: null, is_enabled: true, ...payload }],
      __('Shipping carrier added', 'kirki-ecommerce'),
    );
  };

  const handleSubmitEdit = (target: ShippingCarrier, payload: ShippingCarrierFormPayload) => {
    saveCarriers(
      carriers.map((carrier) => (carrier.id === target.id ? { ...carrier, ...payload } : carrier)),
      __('Shipping carrier updated', 'kirki-ecommerce'),
    );
  };

  const handleToggle = (target: ShippingCarrier) => {
    saveCarriers(
      carriers.map((carrier) =>
        carrier.id === target.id ? { ...carrier, is_enabled: !carrier.is_enabled } : carrier,
      ),
      __('Shipping carrier updated', 'kirki-ecommerce'),
    );
  };

  const handleDelete = (target: ShippingCarrier) => {
    confirmDelete(
      {
        title: __('Delete shipping carrier?', 'kirki-ecommerce'),
        description: __(
          'This carrier will no longer be offered when adding tracking to orders shipped to this zone. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () =>
        saveCarriers(
          carriers.filter((carrier) => carrier.id !== target.id),
          __('Shipping carrier deleted', 'kirki-ecommerce'),
        ),
    );
  };

  return (
    <div>
      <Card data-search-skip="true" cssOverride={cardStyles.formCard}>
        <CardContent>
          <HeaderActionsCard
            header={__('Shipping Carriers', 'kirki-ecommerce')}
            subHeader={__(
              'Carriers you ship with in this zone. Pick one when adding tracking to an order, so the customer gets a tracking link.',
              'kirki-ecommerce',
            )}
            actions={
              <ShippingCarrierAddMenu
                presets={missingPresets}
                onSelectPreset={handleSelectPreset}
                onSubmitNew={handleSubmitNew}
              />
            }
          />

          {carriers.length > 0 && (
            <StackedItems cssOverride={{ marginTop: theme.spacing[5] }}>
              {carriers.map((carrier) => (
                <ShippingCarrierRow
                  key={carrier.id}
                  carrier={carrier}
                  isEditing={editedCarrierId === carrier.id}
                  onEdit={(target) => setEditedCarrierId(target.id)}
                  onCloseEdit={() => setEditedCarrierId(null)}
                  onSubmit={handleSubmitEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </StackedItems>
          )}
        </CardContent>
      </Card>
      {deleteConfirmation}
    </div>
  );
};

ShippingCarrierCard.displayName = 'ShippingCarrierCard';

export default ShippingCarrierCard;
