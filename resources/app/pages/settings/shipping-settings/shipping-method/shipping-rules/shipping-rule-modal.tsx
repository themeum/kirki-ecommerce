import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router';

import Flex from '@/molecules/flex';
import Placeholder from '@/molecules/placeholder';
import Text from '@/molecules/text';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Button from '@/molecules/button';
import { Select } from '@/molecules/select';
import { LighteningIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import { getCategoriesAPI } from '@/store/categoriesSlice';
import {
  updateSettingsAPI,
  updateSettings,
  getShippingProfileList,
} from '@/store/settingsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetListAPI } from '@/hooks';
import { dispatchToastMessage, normalizeErrors } from '@/pages/utils';
import type { FormErrors, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

import {
  conditionOptions,
  actionOptionsArray,
  type ShippingRegion,
  type ShippingRule,
  type ShippingZone,
} from '../../utils';
import { SelectDestinationPopup } from '../select-destination-popup';
import { resolveDestinationRegion } from './helper';

type ShippingRuleModalProps = {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  rulesObj: ShippingRule | ShippingRule[];
  setRulesObj: Dispatch<SetStateAction<ShippingRule[] | ShippingRule>>;
  methodId: string | number;
  from?: string;
  ruleIndex?: number;
};

type ConditionDataMap = Record<string, Array<{ id: number | string; name: string }> | null>;

const ShippingRuleModal = ({
  showModal,
  setShowModal,
  rulesObj,
  setRulesObj,
  methodId,
  from = '',
  ruleIndex = -1,
}: ShippingRuleModalProps) => {
  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams();
  const selectedMethod = searchParams.get('methodId');
  const selectedZone = searchParams.get('zoneId');

  const [openDestinationPopup, setOpenDestinationPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
  const [selectedCondition, setSelectedCondition] =
    useState('product_category');
  const [selectedConditionValue, setSelectedConditionValue] =
    useState<unknown>(null);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedAction, setSelectedAction] = useState('set_shipping_cost');
  const [selectedActionValue, setSelectedActionValue] = useState<
    string | number
  >('');
  const [errors, setErrors] = useState<FormErrors>({});

  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getShippingProfileList,
    nestedToggler: ['shipping', 'shippingProfile'],
  });

  const {
    data: shippingSettingsData,
    activeZoneId,
    shippingProfile,
  } = useAppSelector((state) => state.settings?.shipping);
  const { loaded: categoryLoaded, data: categoryList } = useAppSelector(
    (state) => state.categories,
  );

  const [conditionData, setConditionData] = useState<ConditionDataMap>({
    product_category: null,
    shipping_profile: null,
  });
  const methodID = from === 'edit' ? selectedMethod : methodId;
  const zoneID = from === 'edit' ? selectedZone : activeZoneId;

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
    setSelectedCountry(selected_country);

    if (selected_country && from !== 'edit') {
      setSelectedConditionValue({
        country: selected_country,
        states: regionForCountry?.states || [],
      });
    }
  }, [selectedCountry, selectedRegion, selectedCondition]);

  useEffect(() => {
    if (from !== 'edit' || !rulesObj) {
      return;
    }

    const rule = rulesObj as ShippingRule;
    const condition = rule?.conditions?.[0];
    const action = rule?.action;

    if (condition) {
      setSelectedCondition(condition.type);
      setSelectedOperator(condition.operator);
      if (condition.type === 'destination_region') {
        const value = condition.value as {
          country: string;
          states?: Array<string | number>;
        };
        setSelectedConditionValue({
          country: value.country,
          states: value.states || [],
        });
        setSelectedCountry(value.country);
      } else {
        setSelectedConditionValue(condition.value);
      }
    }

    if (action) {
      setSelectedAction(action.type);
      setSelectedActionValue(action.value as string | number);
    }
  }, [from, rulesObj]);

  useEffect(() => {
    if (
      selectedCondition === 'product_category' &&
      categoryLoaded &&
      categoryList?.results
    ) {
      setConditionData((prev) => ({
        ...prev,
        product_category: categoryList.results as Array<{
          id: number | string;
          name: string;
        }>,
      }));
    }
  }, [categoryLoaded, categoryList, selectedCondition]);

  useEffect(() => {
    if (!selectedCondition) {
      return;
    }
    if (conditionData[selectedCondition]) {
      return;
    }

    switch (selectedCondition) {
      case 'product_category':
        if (!categoryLoaded) {
          dispatch(getCategoriesAPI());
        }
        break;

      case 'shipping_profile':
        setConditionData((prev) => ({
          ...prev,
          shipping_profile: shippingProfile?.data as Array<{
            id: number | string;
            name: string;
          }> | null,
        }));
        break;

      case 'destination_region':
        resolveDestinationRegion({
          shippingSettingsData: shippingSettingsData as {
            shipping_zones?: ShippingZone[];
          },
          methodID,
          setSelectedRegion: setSelectedRegion as (regions: unknown) => void,
          activeZoneId,
        });
        break;

      default:
        break;
    }
  }, [selectedCondition]);

  const getConditionValue = () => {
    const data = conditionData[selectedCondition];

    switch (selectedCondition) {
      case 'product_category':
      case 'shipping_profile':
        return data?.map((item) => ({
          title: item.name,
          value: item.name,
          id: item.id,
        }));

      case 'cart_weight':
        return [];

      default:
        return [];
    }
  };

  function getOperatorOptions() {
    if (selectedCondition === 'cart_weight') {
      return [
        { title: __('> (Greater than)', 'kirki-ecommerce'), value: '>' },
        { title: __('= (Equal to)', 'kirki-ecommerce'), value: '=' },
        { title: __('< (Less than)', 'kirki-ecommerce'), value: '<' },
      ];
    } else {
      return [{ title: __('is', 'kirki-ecommerce'), value: 'is' }];
    }
  }

  const buildRule = (): ShippingRule => ({
    relation: 'AND',
    conditions: [
      {
        type: selectedCondition,
        operator: selectedOperator || '=',
        value: selectedConditionValue,
      },
    ],
    action: {
      type: selectedAction,
      value: ['set_shipping_cost', 'add_shipping_cost'].includes(selectedAction)
        ? selectedActionValue
        : null,
    },
  });

  const updateMethodRules = (method: { shipping_rules?: ShippingRule[] }) => {
    const rules = method.shipping_rules || [];

    if (ruleIndex !== -1) {
      return rules.map((rule, idx) => (idx === ruleIndex ? buildRule() : rule));
    }
    return [...rules, buildRule()];
  };

  const handleAddOrUpdateShippingRule = async () => {
    if (!selectedCondition || !selectedAction) {
      return;
    }

    const zones = (shippingSettingsData as SettingsSectionData)
      ?.shipping_zones as ShippingZone[];
    const updatedShippingZones = zones.map((zone) => {
      if (zone.id !== zoneID) {
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
            shipping_rules: updateMethodRules(method),
          };
        }),
      };
    });

    const updatedData = {
      ...(shippingSettingsData as SettingsSectionData),
      shipping_zones: updatedShippingZones,
    };

    await updateData(updatedData);
  };

  const updateData = async (updatedData: SettingsSectionData) => {
    const result = await updateSettingsAPI('shipping', updatedData);

    if (isApiSuccess(result)) {
      dispatch(updateSettings({ key: 'shipping', value: updatedData }));
      dispatchToastMessage('success', {
        title: __('Shipping rule updated', 'kirki-ecommerce'),
      });

      setShowModal(false);
    } else {
      const errorResult = result as {
        errors?: Record<string, unknown>;
        message?: string;
      };
      if (errorResult?.errors) {
        setErrors(normalizeErrors(errorResult?.errors) as FormErrors);
      } else {
        dispatchToastMessage('error', { title: errorResult?.message });
      }
    }
  };

  return (
    <>
      <Placeholder
        style={{ minHeight: 'fit-content', alignItems: 'stretch' }}
        className={`${CLASS_PREFIX}-add-rule-modal ${
          showModal ? 'is-open' : ''
        }`}
      >
        <Flex
          direction={'column'}
          gap={16}
          style={{ padding: 'var(--decom-spacing-3)' }}
        >
          {from !== 'edit' && (
            <Text
              header={__('New Shipping Rules', 'kirki-ecommerce')}
              leftIcon={<LighteningIcon />}
            />
          )}
          <Flex direction={'column'} gap={8}>
            <Text header="IF" />
            <Grid columns={3}>
              <Select
                value={selectedCondition}
                optionsArray={conditionOptions}
                placeholder={__('Product profile', 'kirki-ecommerce')}
                onChange={(value: string) => setSelectedCondition(value)}
              />
              {selectedCondition === 'cart_weight' ? (
                <Select
                  value={selectedOperator}
                  optionsArray={getOperatorOptions()}
                  onChange={(value: string) => setSelectedOperator(value)}
                />
              ) : (
                <Input value={__('is', 'kirki-ecommerce')} readOnly />
              )}

              {selectedCondition === 'destination_region' ? (
                <Input
                  value={selectedCountry ?? ''}
                  onClick={() => setOpenDestinationPopup(true)}
                  readOnly
                  error={errors['value'] as string | undefined}
                />
              ) : selectedCondition === 'cart_weight' ? (
                <Input
                  value={selectedConditionValue as string | number}
                  onChange={(value: unknown) =>
                    setSelectedConditionValue(value)
                  }
                  error={errors['value'] as string | undefined}
                />
              ) : (
                <Select
                  value={selectedConditionValue as string}
                  optionsArray={getConditionValue()}
                  onChange={(value: unknown) =>
                    setSelectedConditionValue(value)
                  }
                  error={errors['value'] as string | undefined}
                />
              )}
            </Grid>
          </Flex>
          <Flex direction={'column'} gap={8}>
            <Text header={__('THEN', 'kirki-ecommerce')} />
            <Grid columns={2}>
              <Select
                optionsArray={actionOptionsArray}
                value={selectedAction}
                onChange={(value: string) => setSelectedAction(value)}
              />
              {(selectedAction === 'set_shipping_cost' ||
                selectedAction === 'add_shipping_cost') && (
                <Input
                  value={selectedActionValue}
                  placeholder="e.g., $100"
                  onChange={(value: string | number) =>
                    setSelectedActionValue(value)
                  }
                  error={errors['value'] as string | undefined}
                />
              )}
            </Grid>
          </Flex>
          <Flex gap={8} style={{ justifyContent: 'flex-end' }}>
            <Button
              type="secondary"
              text={__('Cancel', 'kirki-ecommerce')}
              onClick={() => setShowModal(false)}
            />
            <Button
              type="primary"
              text={
                from === 'edit'
                  ? __('Save', 'kirki-ecommerce')
                  : __('Add Rule', 'kirki-ecommerce')
              }
              onClick={handleAddOrUpdateShippingRule}
            />
          </Flex>
        </Flex>
      </Placeholder>
      {openDestinationPopup && (
        <SelectDestinationPopup
          openPopup={openDestinationPopup}
          setOpenPopup={setOpenDestinationPopup}
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          setSelectedRegion={setSelectedRegion}
          selectedConditionValue={selectedConditionValue}
          setSelectedConditionValue={setSelectedConditionValue}
          setRulesObj={setRulesObj as Dispatch<SetStateAction<ShippingRule[]>>}
          ruleIndex={ruleIndex}
        />
      )}
    </>
  );
};

ShippingRuleModal.displayName = 'ShippingRuleModal';

export default ShippingRuleModal;
