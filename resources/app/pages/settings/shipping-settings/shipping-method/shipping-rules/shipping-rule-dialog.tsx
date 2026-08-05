import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Grid from '@/components/ui/grid';
import { LighteningIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryClient } from '@/libs/query-client';
import { queryKeys } from '@/libs/query-keys';
import { getDefaults } from '@/libs/zod';
import { useCategoriesQuery } from '@/services/category';
import { getErrorMessage } from '@/services/helpers';
import { useSettingsQuery, updateSettings } from '@/services/settings';
import { useShippingProfilesQuery } from '@/services/shipping';
import {
  ShippingRuleFormSchema,
  type ShippingRuleFormInput,
  type ShippingRuleFormPayload,
} from '@/schemas/forms/shipping-rule-form';
import { __ } from '@/wpi18n';

import { conditionOptions, actionOptionsArray, type ShippingRegion, type ShippingRule, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { SelectDestinationPopup } from '@/pages/settings/shipping-settings/shipping-method/select-destination-dialog';
import { resolveDestinationRegion } from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/helper';

type ShippingRuleModalProps = {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  rulesObj: ShippingRule | ShippingRule[];
  setRulesObj: Dispatch<SetStateAction<ShippingRule[] | ShippingRule>>;
  methodId: string | number;
  from?: string;
  ruleIndex?: number;
};

type ConditionDataMap = Record<
  string,
  Array<{ id: number | string; name: string }> | null
>;

const ShippingRuleModal = ({
  showModal,
  setShowModal,
  rulesObj,
  setRulesObj,
  methodId,
  from = '',
  ruleIndex = -1,
}: ShippingRuleModalProps) => {
  const [searchParams] = useSearchParams();
  const selectedMethod = searchParams.get('methodId');
  const selectedZone = searchParams.get('zoneId');

  const [openDestinationPopup, setOpenDestinationPopup] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);

  const { data: shippingSettingsData } = useSettingsQuery('shipping');
  const { data: shippingProfile } = useShippingProfilesQuery({ limit: -1 });
  const { data: categoryData, isSuccess: categoryLoaded } = useCategoriesQuery({
    limit: -1,
  });

  const [conditionData, setConditionData] = useState<ConditionDataMap>({
    product_category: null,
    shipping_profile: null,
  });

  const form = useForm<ShippingRuleFormInput, unknown, ShippingRuleFormPayload>({
    resolver: zodResolver(ShippingRuleFormSchema),
    defaultValues: getDefaults(ShippingRuleFormSchema),
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
  const selectedConditionValue = useWatch({
    control: form.control,
    name: 'condition_value',
  });

  const methodID = from === 'edit' ? selectedMethod : methodId;
  const zoneID = selectedZone;

  useEffect(() => {
    if (!showModal) {
      return;
    }

    if (from === 'edit' && rulesObj) {
      const rule = rulesObj as ShippingRule;
      const condition = rule?.conditions?.[0];
      const action = rule?.action;

      form.reset({
        condition: condition?.type || 'product_category',
        operator: condition?.operator || 'is',
        condition_value:
          condition?.type === 'destination_region'
            ? {
                country: (condition.value as { country: string }).country,
                states:
                  (condition.value as { states?: Array<string | number> })
                    .states || [],
              }
            : (condition?.value ?? null),
        action: action?.type || 'set_shipping_cost',
        action_value: (action?.value as string | number) ?? '',
        selected_country:
          condition?.type === 'destination_region'
            ? (condition.value as { country: string }).country
            : null,
      });
      return;
    }

    form.reset(getDefaults(ShippingRuleFormSchema));
  }, [showModal, from, rulesObj, form]);

  useEffect(() => {
    if (selectedCondition !== 'destination_region') {
      return;
    }

    let regionForCountry;
    let selected_country = '';

    if (selectedCountry) {
      selected_country = selectedCountry;
      regionForCountry = selectedRegion.find(
        (r) => r.country === selectedCountry,
      );
    } else {
      selected_country = selectedRegion[0]?.country;
      regionForCountry = selectedRegion.find(
        (r) => r.country === selected_country,
      );
    }

    form.setValue('selected_country', selected_country || null);

    if (selected_country && from !== 'edit') {
      form.setValue('condition_value', {
        country: selected_country,
        states: regionForCountry?.states || [],
      });
    }
  }, [selectedCountry, selectedRegion, selectedCondition, from, form]);

  useEffect(() => {
    if (
      selectedCondition === 'product_category' &&
      categoryLoaded &&
      categoryData?.results
    ) {
      setConditionData((prev) => ({
        ...prev,
        product_category: categoryData.results as Array<{
          id: number | string;
          name: string;
        }>,
      }));
    }
  }, [categoryLoaded, categoryData, selectedCondition]);

  useEffect(() => {
    if (!selectedCondition) {
      return;
    }
    if (conditionData[selectedCondition]) {
      return;
    }

    switch (selectedCondition) {
      case 'product_category':
        break;

      case 'shipping_profile':
        setConditionData((prev) => ({
          ...prev,
          shipping_profile:
            (shippingProfile as Array<{
              id: number | string;
              name: string;
            }> | null) ?? null,
        }));
        break;

      case 'destination_region':
        resolveDestinationRegion({
          shippingSettingsData: shippingSettingsData as {
            shipping_zones?: ShippingZone[];
          },
          methodID,
          setSelectedRegion: setSelectedRegion as (regions: unknown) => void,
          activeZoneId: zoneID,
        });
        break;

      default:
        break;
    }
  }, [
    selectedCondition,
    shippingProfile,
    shippingSettingsData,
    methodID,
    zoneID,
    conditionData,
  ]);

  const getConditionValueOptions = () => {
    const data = conditionData[selectedCondition || ''];

    switch (selectedCondition) {
      case 'product_category':
      case 'shipping_profile':
        return (
          data?.map((item) => ({
            label: item.name,
            value: item.name,
          })) ?? []
        );

      default:
        return [];
    }
  };

  const getOperatorOptions = () => {
    if (selectedCondition === 'cart_weight') {
      return [
        {
          label: __('> (Greater than)', 'kirki-ecommerce'),
          value: '>',
        },
        {
          label: __('= (Equal to)', 'kirki-ecommerce'),
          value: '=',
        },
        {
          label: __('< (Less than)', 'kirki-ecommerce'),
          value: '<',
        },
      ];
    }
    return [{ label: __('is', 'kirki-ecommerce'), value: 'is' }];
  };

  const updateMethodRules = (
    method: { shipping_rules?: ShippingRule[] },
    rule: ShippingRuleFormPayload,
  ) => {
    const rules = method.shipping_rules || [];

    if (ruleIndex !== -1) {
      return rules.map((existingRule, idx) =>
        idx === ruleIndex ? rule : existingRule,
      );
    }
    return [...rules, rule];
  };

  const handleAddOrUpdateShippingRule = async (
    payload: ShippingRuleFormPayload,
  ) => {
    const zones = (shippingSettingsData as { shipping_zones?: ShippingZone[] })
      ?.shipping_zones as ShippingZone[];
    const updatedShippingZones = zones.map((zone) => {
      if (String(zone.id) !== String(zoneID)) {
        return zone;
      }

      return {
        ...zone,
        shipping_methods: zone.shipping_methods.map((method) => {
          if (method.id !== methodID) {
            return method;
          }

          return {
            ...method,
            shipping_rules: updateMethodRules(method, payload),
          };
        }),
      };
    });

    try {
      await updateSettings({
        key: 'shipping',
        data: { shipping_zones: updatedShippingZones },
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Settings('shipping'),
      });
      toast.success(__('Shipping rule updated', 'kirki-ecommerce'));
      setShowModal(false);
    } catch (error) {
      const errObj = error as ErrorResponse & { message?: string };
      if (errObj?.errors) {
        applyServerErrors(form, errObj);
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const conditionSelectOptions = conditionOptions.map((option) => ({
    label: option.title,
    value: option.value,
  }));

  const actionSelectOptions = actionOptionsArray.map((option) => ({
    label: option.title,
    value: option.value,
  }));

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogCloseButton />
          {from !== 'edit' && (
            <DialogHeader>
              <DialogTitle>
                <Flex gap={2} align="center">
                  <LighteningIcon />
                  {__('New Shipping Rules', 'kirki-ecommerce')}
                </Flex>
              </DialogTitle>
            </DialogHeader>
          )}
          <Form {...form}>
            <DialogBody>
              <Flex direction={'column'} gap={4}>
                <Flex direction={'column'} gap={2}>
                  <Text>IF</Text>
                  <Grid columns={3}>
                    <SelectField
                      name="condition"
                      options={conditionSelectOptions}
                      placeholder={__('Product profile', 'kirki-ecommerce')}
                    />
                    {selectedCondition === 'cart_weight' ? (
                      <SelectField
                        name="operator"
                        options={getOperatorOptions()}
                      />
                    ) : (
                      <Input value={__('is', 'kirki-ecommerce')} readOnly />
                    )}

                    {selectedCondition === 'destination_region' ? (
                      <Controller
                        control={form.control}
                        name="selected_country"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <Input
                              id="selected_country"
                              value={field.value ?? ''}
                              onClick={() => setOpenDestinationPopup(true)}
                              readOnly
                              error={Boolean(fieldState.error)}
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    ) : selectedCondition === 'cart_weight' ? (
                      <TextField name="condition_value" />
                    ) : (
                      <SelectField
                        name="condition_value"
                        options={getConditionValueOptions()}
                      />
                    )}
                  </Grid>
                </Flex>
                <Flex direction={'column'} gap={2}>
                  <Text>{__('THEN', 'kirki-ecommerce')}</Text>
                  <Grid columns={2}>
                    <SelectField
                      name="action"
                      options={actionSelectOptions}
                    />
                    {(selectedAction === 'set_shipping_cost' ||
                      selectedAction === 'add_shipping_cost') && (
                      <TextField
                        name="action_value"
                        placeholder="e.g., $100"
                      />
                    )}
                  </Grid>
                </Flex>
              </Flex>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleAddOrUpdateShippingRule)}
              >
                {from === 'edit'
                  ? __('Save', 'kirki-ecommerce')
                  : __('Add Rule', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
      {openDestinationPopup && (
        <SelectDestinationPopup
          openPopup={openDestinationPopup}
          setOpenPopup={setOpenDestinationPopup}
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry ?? null}
          setSelectedCountry={(value) => {
            const next =
              typeof value === 'function'
                ? value(selectedCountry ?? null)
                : value;
            form.setValue('selected_country', next);
          }}
          setSelectedRegion={setSelectedRegion}
          selectedConditionValue={selectedConditionValue}
          setSelectedConditionValue={(value) => {
            const next =
              typeof value === 'function'
                ? value(selectedConditionValue)
                : value;
            form.setValue('condition_value', next);
          }}
          setRulesObj={setRulesObj as Dispatch<SetStateAction<ShippingRule[]>>}
          ruleIndex={ruleIndex}
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

ShippingRuleModal.displayName = 'ShippingRuleModal';

export default ShippingRuleModal;
