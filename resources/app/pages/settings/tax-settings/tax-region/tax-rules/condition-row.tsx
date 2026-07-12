import { useState, type Dispatch, type SetStateAction } from 'react';

import { PlusIcon, TrashIcon } from '@/icons';
import Button from '@/molecules/button';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

import { taxRuleConditionOptions } from '@/pages/settings/tax-settings/utils';
import type { TaxConditionRow, TaxRegion } from '@/pages/settings/tax-settings/utils';
import { AddStatePopup } from '@/pages/settings/tax-settings/tax-region/tax-rules/add-state-popup';
import { getDestinationDisplayValue } from '@/pages/settings/tax-settings/tax-region/tax-rules/helper';

type ConditionOption = {
  title: string;
  value: string;
  id?: number | string;
};

type ConditionRowProps = {
  row: TaxConditionRow;
  index: number;
  conditions: TaxConditionRow[];
  setConditions: Dispatch<SetStateAction<TaxConditionRow[]>>;
  getConditionValue: (condition: string) => ConditionOption[];
  selectedCountries: Array<string | number>;
  setSelectedCountries: Dispatch<SetStateAction<Array<string | number>>>;
  from?: string;
  region?: TaxRegion;
};

const ConditionRow = (props: ConditionRowProps) => {
  const {
    row,
    index,
    conditions,
    setConditions,
    getConditionValue,
    selectedCountries,
    setSelectedCountries,
    region,
  } = props;

  const [showStatesPopup, setShowStatesPopup] = useState(false);
  const handleAddStates = () => {
    setConditions((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
              value: selectedCountries,
            }
          : item,
      ),
    );
    setShowStatesPopup(false);
  };

  const handleAddConditionRow = () => {
    setConditions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        condition: 'tax_profile',
        value: null,
      },
    ]);
  };
  const updateCondition = (
    id: string,
    key: keyof TaxConditionRow,
    value: unknown,
  ) => {
    setConditions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };
  const handleDeleteConditionRow = (id: string) => {
    setConditions((prev) => prev.filter((row) => row.id !== id));
  };
  const displayedValue = row.value;
  const displayedCondition = row.type;

  return (
    <div key={row.id}>
      {index > 0 ? (
        <Text header={__('AND IF', 'kirki-ecommerce')} />
      ) : (
        <Text header={__(' IF', 'kirki-ecommerce')} />
      )}
      <Grid
        style={{
          marginTop: 'var(--decom-spacing-2)',
          gridTemplateColumns:
            row.condition === 'destination_region' || index > 0
              ? 'minmax(0, 2fr) 0.5fr minmax(0, 2fr) auto'
              : 'minmax(0, 2fr) 0.5fr minmax(0, 2fr)',
        }}
      >
        <Select
          value={displayedCondition || row.condition}
          optionsArray={
            index === 1
              ? [{ title: __('Tax Profile', 'kirki-ecommerce'), value: 'tax_profile' }]
              : taxRuleConditionOptions
          }
          onChange={(value) => updateCondition(row.id, 'condition', value)}
        />

        <Input value={__('is', 'kirki-ecommerce')} readOnly />

        {row.condition === 'destination_region' ? (
          <Input
            readOnly
            value={getDestinationDisplayValue(row?.value)}
            onClick={() => setShowStatesPopup(true)}
          />
        ) : (
          <Select
            value={(displayedValue || row.value) as string | number}
            optionsArray={getConditionValue(
              displayedCondition || row.condition,
            )}
            onChange={(value) => updateCondition(row.id, 'value', value)}
          />
        )}

        {row.condition === 'destination_region' && conditions.length < 2 && (
          <Button
            size="icon"
            type="outlined"
            icon={<PlusIcon />}
            onClick={handleAddConditionRow}
            style={{ padding: '8px' }}
            className={`${CLASS_PREFIX}-condition-actions`}
          />
        )}
        {index > 0 && (
          <Button
            size="icon"
            type="secondary"
            icon={<TrashIcon />}
            onClick={() => handleDeleteConditionRow(row.id)}
            style={{ padding: '8px' }}
            className={`${CLASS_PREFIX}-condition-actions`}
          />
        )}
      </Grid>
      {showStatesPopup && (
        <AddStatePopup
          openPopup={showStatesPopup}
          setOpenPopup={setShowStatesPopup}
          countryName={region?.code}
          countryList={region?.states || []}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          onAdd={handleAddStates}
        />
      )}
    </div>
  );
};

ConditionRow.displayName = 'ConditionRow';

export default ConditionRow;
