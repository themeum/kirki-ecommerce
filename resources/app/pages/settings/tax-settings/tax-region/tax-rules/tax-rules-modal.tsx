import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

import { useGetListAPI } from '@/hooks';
import { LighteningIcon } from '@/icons';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Placeholder from '@/molecules/placeholder';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { CLASS_PREFIX } from '@/conf';
import { getTaxProfileListAPI } from '@/store/settingsSlice';
import { useAppSelector } from '@/store/hooks';
import { __ } from '@/wpi18n';

import { taxRuleActionOptionsArray } from '../../utils';
import type { TaxConditionRow, TaxRegion, TaxRule } from '../../utils';
import ConditionRow from './condition-row';

type TaxRulesModalProps = {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  rulesObj: TaxRule[];
  setRulesObj: Dispatch<SetStateAction<TaxRule[]>>;
  updateTaxRules: (
    rulesList: TaxRule[],
    from?: string,
  ) => void | Promise<void>;
  from?: string;
  ruleIndex?: number;
  region?: TaxRegion;
};

type ConditionOption = {
  title: string;
  value: string;
  id?: number | string;
};

const TaxRulesModal = (props: TaxRulesModalProps) => {
  const {
    showModal,
    setShowModal,
    rulesObj,
    setRulesObj,
    updateTaxRules,
    from = '',
    ruleIndex,
    region,
  } = props;

  const [selectedAction, setSelectedAction] = useState('set_tax_rate');
  const [selectedActionValue, setSelectedActionValue] = useState<
    string | number
  >('');
  const [selectedCountries, setSelectedCountries] = useState<
    Array<string | number>
  >([]);

  const { taxProfile } = useAppSelector((state) => state.settings?.tax);

  const [conditions, setConditions] = useState<TaxConditionRow[]>([
    {
      id: crypto.randomUUID(),
      condition: 'tax_profile',
      value: null,
    },
  ]);

  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ['tax', 'taxProfile'],
  });

  useEffect(() => {
    if (from === 'edit' && ruleIndex !== undefined && rulesObj?.[ruleIndex]) {
      const existingRule = rulesObj[ruleIndex];

      setConditions(
        existingRule.conditions.map((c) => ({
          id: crypto.randomUUID(),
          condition: c.type,
          value: c.value ?? null,
        })),
      );
      setSelectedAction(existingRule.action?.type);
      setSelectedActionValue(
        (existingRule.action?.value as string | number) ?? '',
      );
      const destinationCondition = existingRule.conditions.find(
        (c) => c.type === 'destination_region',
      );

      setSelectedCountries(
        Array.isArray(destinationCondition?.value)
          ? (destinationCondition.value as Array<string | number>)
          : [],
      );
    } else {
      setConditions([
        { id: crypto.randomUUID(), condition: 'tax_profile', value: null },
      ]);
      setSelectedCountries([]);
    }
  }, [from, ruleIndex, rulesObj]);

  const buildRule = (): TaxRule => ({
    relation: 'AND',
    conditions: conditions.map((c) => ({
      type: c.condition,
      operator: '=',
      value: c.value ?? '',
    })),
    action: {
      type: selectedAction,
      value: selectedActionValue ?? 0,
    },
  });

  const handleAddOrUpdateTaxRule = () => {
    const newRulesObj = Array.isArray(rulesObj) ? rulesObj : [];
    const updatedRules =
      from === 'edit' && typeof ruleIndex === 'number'
        ? newRulesObj.map((rule, index) =>
            index === ruleIndex ? buildRule() : rule,
          )
        : [...newRulesObj, buildRule()];

    setRulesObj(updatedRules);
    updateTaxRules(updatedRules);
    setShowModal(false);
  };

  const getConditionValue = (condition: string): ConditionOption[] => {
    if (condition === 'tax_profile') {
      return (
        taxProfile?.data?.map((item) => ({
          title: item.name,
          value: item.name,
          id: item.id,
        })) ?? []
      );
    }
    return [];
  };

  return (
    <div>
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
              header={__('New Tax Rules', 'kirki-ecommerce')}
              leftIcon={<LighteningIcon />}
            />
          )}
          <Flex direction={'column'} gap={8}>
            <div className={`${CLASS_PREFIX}-condition-row`}>
              {conditions?.map((row, index) => (
                <ConditionRow
                  key={index}
                  row={row}
                  index={index}
                  conditions={conditions}
                  setConditions={setConditions}
                  getConditionValue={getConditionValue}
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  from={from}
                  region={region}
                />
              ))}
            </div>
          </Flex>
          <Flex direction={'column'} gap={8}>
            <Text header={__('THEN', 'kirki-ecommerce')} />
            <Grid columns={2}>
              <Select
                optionsArray={taxRuleActionOptionsArray}
                value={selectedAction}
                onChange={(value) => setSelectedAction(String(value))}
              />
              {selectedAction === 'set_tax_rate' && (
                <Input
                  value={selectedActionValue}
                  placeholder={__('e.g., $100', 'kirki-ecommerce')}
                  onChange={(value: string | number) =>
                    setSelectedActionValue(value)
                  }
                />
              )}
            </Grid>
          </Flex>
          <Flex gap={8} style={{ justifyContent: 'flex-end' }}>
            <Button
              type="secondary"
              text={__('Cancel', 'kirki-ecommerce')}
              size="small"
              onClick={() => setShowModal(false)}
            />
            <Button
              type="primary"
              text={
                from === 'edit'
                  ? __('Update', 'kirki-ecommerce')
                  : __('Add Rule', 'kirki-ecommerce')
              }
              size="small"
              onClick={handleAddOrUpdateTaxRule}
            />
          </Flex>
        </Flex>
      </Placeholder>
    </div>
  );
};

TaxRulesModal.displayName = 'TaxRulesModal';

export default TaxRulesModal;
