import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import FlatRateSettings from '@/features/settings/shipping/components/shipping-method/flat-rate-settings';
import LocalPickupSettings from '@/features/settings/shipping/components/shipping-method/local-pickup-settings';
import RateByWeightSettings from '@/features/settings/shipping/components/shipping-method/rate-by-weight-settings';
import { ShippingRules } from '@/features/settings/shipping/components/shipping-method/shipping-rules/shipping-rules';
import {
  type ShippingMethodFormInput,
  type ShippingMethodFormPayload,
  ShippingMethodFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-method-form';
import type {
  ShippingMethodData,
  ShippingRule,
  ShippingZone,
} from '@/features/settings/shipping/types';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryClient } from '@/libs/query-client';
import { settingsKeys } from '@/libs/query-keys';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { updateSettings } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { uuid } from '@/utils';
import { __ } from '@/wpi18n';

const methodTypeOptions = [
  { label: __('Flat Rate', 'kirki-ecommerce'), value: 'flat_rate' },
  { label: __('Local Pickup', 'kirki-ecommerce'), value: 'local_pickup' },
  { label: __('Rate by Weight', 'kirki-ecommerce'), value: 'weight' },
];

const methodSettingsByType: Record<string, ReactNode> = {
  flat_rate: <FlatRateSettings />,
  local_pickup: <LocalPickupSettings />,
  weight: <RateByWeightSettings />,
};

type ShippingMethodDialogProps = {
  zoneId: string | number;
  method?: ShippingMethodData | null;
  shippingZones: ShippingZone[];
  onClose: () => void;
  onSaved?: (zones: ShippingZone[]) => void;
};

const ShippingMethodDialog = ({
  zoneId,
  method = null,
  shippingZones,
  onClose,
  onSaved,
}: ShippingMethodDialogProps) => {
  const [methodId] = useState(() => method?.id ?? uuid());

  const form = useForm<ShippingMethodFormInput, unknown, ShippingMethodFormPayload>({
    resolver: zodResolver(ShippingMethodFormSchema),
    defaultValues: method
      ? pickFormValues(ShippingMethodFormSchema, method)
      : getDefaults(ShippingMethodFormSchema),
  });

  const { isSubmitting } = form.formState;
  const methodType = useWatch({ control: form.control, name: 'type' }) ?? 'flat_rate';
  const rules = useWatch({ control: form.control, name: 'shipping_rules' }) ?? [];

  const handleRulesChange = (nextRules: ShippingRule[]) => {
    form.setValue('shipping_rules', nextRules, { shouldDirty: true });
  };

  const parentZone = shippingZones.find((zone) => String(zone.id) === String(zoneId));

  const handleSave = async (payload: ShippingMethodFormPayload) => {
    const shippingMethod: ShippingMethodData = {
      ...payload,
      zoneId: parentZone?.id ?? zoneId,
      id: methodId,
      is_enabled: method?.is_enabled ?? false,
    };

    const updatedShippingZones = shippingZones.map((zone) => {
      if (method) {
        return {
          ...zone,
          shipping_methods: (zone.shipping_methods || []).map((item) =>
            item.id === shippingMethod.id ? shippingMethod : item,
          ),
        };
      }

      if (String(zone.id) === String(zoneId)) {
        return {
          ...zone,
          shipping_methods: [...(zone.shipping_methods || []), shippingMethod],
        };
      }

      return zone;
    });

    try {
      await updateSettings({
        key: 'shipping',
        data: { shipping_zones: updatedShippingZones },
      });
      void queryClient.invalidateQueries({
        queryKey: settingsKeys.section('shipping'),
      });
      toast.success(
        method
          ? __('Shipping method updated', 'kirki-ecommerce')
          : __('Shipping method created', 'kirki-ecommerce'),
      );
      onSaved?.(updatedShippingZones);
      onClose();
    } catch (error) {
      const zoneIndex = updatedShippingZones.findIndex(
        (zone) => String(zone.id) === String(zoneId),
      );
      const methodIndex = updatedShippingZones[zoneIndex]?.shipping_methods.findIndex(
        (item) => item.id === shippingMethod.id,
      );

      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix:
          zoneIndex >= 0 && methodIndex !== undefined && methodIndex >= 0
            ? `data.shipping_zones.${zoneIndex}.shipping_methods.${methodIndex}.`
            : undefined,
      });
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent cssOverride={styles.dialogContent}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {method
              ? __('Edit Shipping Method', 'kirki-ecommerce')
              : __('Add Shipping Method', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody cssOverride={styles.dialogBody}>
            <Card
              data-search-skip="true"
              cssOverride={mergeCss(cardStyles.formCard, styles.card)}
              noShadow
            >
              <CardContent cssOverride={{ paddingInline: theme.spacing[0] }}>
                <Flex direction="column" gap={4}>
                  <TextField
                    name="name"
                    label={__('Method Name', 'kirki-ecommerce')}
                    placeholder={__('Standard Delivery', 'kirki-ecommerce')}
                  />
                  <SelectField
                    name="type"
                    label={__('Method Type', 'kirki-ecommerce')}
                    options={methodTypeOptions}
                  />
                  {methodSettingsByType[methodType]}
                </Flex>
              </CardContent>
            </Card>
            <Separator cssOverride={{ backgroundColor: theme.colors.border.secondary }} />
            <ShippingRules
              zoneId={parentZone?.id ?? zoneId}
              rules={rules}
              onChange={handleRulesChange}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSave)}
              loading={isSubmitting}
              disabled={isSubmitting || (Boolean(method) && !form.formState.isDirty)}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ShippingMethodDialog.displayName = 'ShippingMethodDialog';

export default ShippingMethodDialog;

const styles = defineStyles({
  card: {
    // backgroundColor: 'transparent',
    border: 'none',
  },
  dialogContent: {
    width: '632px',
  },
  dialogBody: {
    gap: theme.spacing[3],
  },
});
