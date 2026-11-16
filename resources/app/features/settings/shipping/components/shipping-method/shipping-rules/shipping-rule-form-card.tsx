import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { useCategoriesQuery } from '@/features/categories';
import type { DestinationConditionValue } from '@/features/settings/shipping/components/shipping-method/select-destination-dialog';
import { SelectDestinationPopup } from '@/features/settings/shipping/components/shipping-method/select-destination-dialog';
import {
  getDestinationLabel,
  resolveDestinationRegion,
} from '@/features/settings/shipping/lib/shipping-rules/helper';
import {
  buildRuleDefaultValues,
  type ConditionDataMap,
  getConditionValueOptions,
  getOperatorOptions,
  resolveDestinationSelection,
} from '@/features/settings/shipping/lib/shipping-rules/rule-form';
import { actionOptionsArray, conditionOptions } from '@/features/settings/shipping/lib/utils';
import {
  NUMERIC_CONDITIONS,
  type ShippingRuleFormInput,
  type ShippingRuleFormPayload,
  ShippingRuleFormSchema,
  VALUE_ACTIONS,
} from '@/features/settings/shipping/schemas/forms/shipping-rule-form';
import { useShippingProfilesQuery } from '@/features/settings/shipping/services/shipping';
import type {
  ShippingRegion,
  ShippingRule,
  ShippingZone,
} from '@/features/settings/shipping/types';
import { useBaseCurrencySymbol } from '@/hooks';
import { LighteningIcon } from '@/icons/common';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __, sprintf } from '@/wpi18n';

type ShippingRuleFormCardProps = {
  zoneId: string | number;
  mode?: 'add' | 'edit';
  initialRule?: ShippingRule;
  onCancel: () => void;
  onSubmit: (rule: ShippingRuleFormPayload) => void;
  onSaved: () => void;
  storeWeightUnit: string;
};

const ShippingRuleFormCard = ({
  zoneId,
  mode = 'add',
  initialRule,
  onCancel,
  onSubmit,
  onSaved,
  storeWeightUnit,
}: ShippingRuleFormCardProps) => {
  const baseCurrencySymbol = useBaseCurrencySymbol();

  const [openDestinationPopup, setOpenDestinationPopup] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);

  const { data: shippingSettingsData } = useSettingsQuery('shipping');

  const { data: shippingProfile } = useShippingProfilesQuery({ limit: -1 });
  const { data: categoryData } = useCategoriesQuery({
    limit: -1,
  });
  const { data: countries } = useCountriesQuery({ limit: -1 });

  const [conditionData, setConditionData] = useState<ConditionDataMap>({
    product_categories: null,
    shipping_profile: null,
  });

  const form = useForm<ShippingRuleFormInput, unknown, ShippingRuleFormPayload>({
    resolver: zodResolver(ShippingRuleFormSchema),
    defaultValues: buildRuleDefaultValues(initialRule),
  });

  const selectedCondition = useWatch({
    control: form.control,
    name: 'condition',
  });
  const selectedAction = useWatch({ control: form.control, name: 'action' });
  const selectedCountry = useWatch({
    control: form.control,
    name: 'selected_country',
  });
  /**
   * `condition_value` is polymorphic across condition types, so the schema
   * types it as `unknown`. The destination dialog below is only rendered for
   * `destination_region`, where it always holds a `{country, states}` pair.
   */
  const selectedConditionValue = useWatch({
    control: form.control,
    name: 'condition_value',
  }) as DestinationConditionValue | null;

  useEffect(() => {
    if (selectedCondition !== 'destination_region') {
      return;
    }

    const resolved = resolveDestinationSelection(selectedCountry, selectedRegion, mode);
    const currentConditionValue = form.getValues(
      'condition_value',
    ) as DestinationConditionValue | null;

    form.setValue('selected_country', resolved.selectedCountry || null);

    if (
      resolved.conditionValue &&
      currentConditionValue?.country !== resolved.conditionValue.country
    ) {
      form.setValue('condition_value', resolved.conditionValue);
    }
  }, [selectedCountry, selectedRegion, selectedCondition, mode, form]);

  useEffect(() => {
    if (!selectedCondition) {
      return;
    }
    if (conditionData[selectedCondition]) {
      return;
    }

    switch (selectedCondition) {
      case 'product_categories':
        if (!categoryData?.results) {
          break;
        }
        setConditionData((prev) => ({
          ...prev,
          product_categories: categoryData.results,
        }));
        break;

      case 'shipping_profile':
        if (!shippingProfile) {
          break;
        }
        setConditionData((prev) => ({
          ...prev,
          shipping_profile: shippingProfile,
        }));
        break;

      case 'destination_region':
        resolveDestinationRegion({
          shippingSettingsData: shippingSettingsData as {
            shipping_zones?: ShippingZone[];
          },
          methodID: null,
          setSelectedRegion: setSelectedRegion as (regions: unknown) => void,
          activeZoneId: zoneId,
        });
        break;

      default:
        break;
    }
  }, [
    selectedCondition,
    categoryData,
    shippingProfile,
    shippingSettingsData,
    zoneId,
    conditionData,
  ]);

  const handleSave = (payload: ShippingRuleFormPayload) => {
    onSubmit(payload);
    onSaved();
  };

  const conditionSelectOptions = conditionOptions.map((option) => {
    if (option.value === 'cart_weight') {
      return {
        label: sprintf('%1$s (%2$s)', option.title, storeWeightUnit),
        value: option.value,
      };
    }

    if (option.value === 'cart_subtotal') {
      return {
        label: sprintf('%1$s (%2$s)', option.title, baseCurrencySymbol),
        value: option.value,
      };
    }
    return {
      label: option.title,
      value: option.value,
    };
  });

  const actionSelectOptions = actionOptionsArray.map((option) => {
    if (VALUE_ACTIONS.includes(option.value ?? '')) {
      return {
        label: sprintf('%1$s (%2$s)', option.title, baseCurrencySymbol),
        value: option.value,
      };
    }

    return {
      label: option.title,
      value: option.value,
    };
  });

  return (
    <>
      <Card
        data-search-skip="true"
        cssOverride={mergeCss(
          cardStyles.formCard,
          mode === 'edit' ? styles.editRuleCard : styles.addRuleCard,
        )}
        noShadow
      >
        <CardContent>
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <Flex align="center" justify="space-between">
                <Flex gap={2} align="center">
                  <LighteningIcon />
                  <Text weight="medium">
                    {mode === 'edit'
                      ? __('Edit Shipping Rule', 'kirki-ecommerce')
                      : __('New Shipping Rule', 'kirki-ecommerce')}
                  </Text>
                </Flex>
                <ActionGroup>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={__('Discard rule', 'kirki-ecommerce')}
                    onClick={onCancel}
                  >
                    <X />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    aria-label={
                      mode === 'edit'
                        ? __('Update rule', 'kirki-ecommerce')
                        : __('Add rule', 'kirki-ecommerce')
                    }
                    onClick={form.handleSubmit(handleSave)}
                  >
                    <Check />
                  </Button>
                </ActionGroup>
              </Flex>
              <Flex direction="column" gap={2}>
                <Text>{__('IF', 'kirki-ecommerce')}</Text>
                <Grid columns={3}>
                  <SelectField
                    name="condition"
                    options={conditionSelectOptions}
                    placeholder={__('Select condition', 'kirki-ecommerce')}
                    onValueChange={() => {
                      form.setValue('operator', '=');
                      form.setValue('condition_value', null);
                      form.setValue('selected_country', null);
                    }}
                  />
                  {NUMERIC_CONDITIONS.includes(selectedCondition ?? '') ? (
                    <SelectField name="operator" options={getOperatorOptions(selectedCondition)} />
                  ) : (
                    <Input value={__('is', 'kirki-ecommerce')} readOnly />
                  )}

                  {selectedCondition === 'destination_region' ? (
                    <Input
                      value={getDestinationLabel(selectedConditionValue, countries ?? [])}
                      readOnly
                      onClick={() => setOpenDestinationPopup(true)}
                    />
                  ) : NUMERIC_CONDITIONS.includes(selectedCondition ?? '') ? (
                    <TextField
                      name="condition_value"
                      placeholder={__('e.g., 5', 'kirki-ecommerce')}
                    />
                  ) : (
                    <SelectField
                      name="condition_value"
                      options={getConditionValueOptions(selectedCondition, conditionData)}
                      placeholder={__('Select value', 'kirki-ecommerce')}
                    />
                  )}
                </Grid>
              </Flex>
              <Flex direction="column" gap={2}>
                <Text>{__('THEN', 'kirki-ecommerce')}</Text>
                <Grid columns={2}>
                  <SelectField
                    name="action"
                    options={actionSelectOptions}
                    onValueChange={() => form.setValue('action_value', '')}
                    placeholder={__('Select action', 'kirki-ecommerce')}
                  />
                  {VALUE_ACTIONS.includes(selectedAction ?? '') && (
                    <TextField
                      name="action_value"
                      placeholder={__('e.g., 1.5', 'kirki-ecommerce')}
                    />
                  )}
                </Grid>
              </Flex>
            </Flex>
          </Form>
        </CardContent>
      </Card>
      {openDestinationPopup && (
        <SelectDestinationPopup
          openPopup={openDestinationPopup}
          setOpenPopup={setOpenDestinationPopup}
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry ?? null}
          setSelectedCountry={(value) => {
            const next = typeof value === 'function' ? value(selectedCountry ?? null) : value;
            form.setValue('selected_country', next);
          }}
          setSelectedRegion={setSelectedRegion}
          selectedConditionValue={selectedConditionValue}
          setSelectedConditionValue={(value) => {
            const next = typeof value === 'function' ? value(selectedConditionValue) : value;
            form.setValue('condition_value', next);
          }}
          setRulesObj={noop}
          ruleIndex={-1}
          onSave={(values) => {
            form.setValue('selected_country', values.country);
            form.setValue('condition_value', {
              country: values.country,
              states: values.states,
            });
          }}
        />
      )}
    </>
  );
};

ShippingRuleFormCard.displayName = 'ShippingRuleFormCard';

export default ShippingRuleFormCard;

const styles = defineStyles({
  addRuleCard: {
    border: `1px dashed ${theme.colors.border.default}`,
  },
  editRuleCard: {
    backgroundColor: theme.colors.background.solidSurfaceAlt,
    border: 'none',
    borderRadius: theme.radius.none,
  },
});
