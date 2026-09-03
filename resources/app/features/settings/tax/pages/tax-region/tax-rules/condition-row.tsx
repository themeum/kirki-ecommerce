import { css } from '@emotion/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import Button from '@/components/ui/button';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Text from '@/components/ui/text';
import { getDestinationDisplayValue } from '@/features/settings/tax/lib/tax-rules/helper';
import type {
  SelectOption,
  TaxConditionRow,
  TaxRegionState,
} from '@/features/settings/tax/lib/utils';
import { taxProfileConditionOptions } from '@/features/settings/tax/lib/utils';
import { AddStatePopup } from '@/features/settings/tax/pages/tax-region/tax-rules/add-state-dialog';
import { PlusIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { uuid } from '@/utils';
import { toDisplayString } from '@/utils/string';
import { __ } from '@/wpi18n';

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
  conditionOptions: SelectOption[];
  selectedCountries: (string | number)[];
  setSelectedCountries: Dispatch<SetStateAction<(string | number)[]>>;
  from?: string;
  states: TaxRegionState[];
  destinationLabel?: string;
};

const ConditionRow = (props: ConditionRowProps) => {
  const {
    row,
    index,
    conditions,
    setConditions,
    getConditionValue,
    conditionOptions,
    selectedCountries,
    setSelectedCountries,
    states,
    destinationLabel,
  } = props;

  const [showStatesPopup, setShowStatesPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
        id: uuid(),
        condition: 'tax_profile',
        value: null,
      },
    ]);
  };
  const updateCondition = (id: string, key: keyof TaxConditionRow, value: unknown) => {
    setConditions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };
  const handleDeleteConditionRow = (id: string) => {
    setConditions((prev) => prev.filter((row) => row.id !== id));
  };
  const rowConditionOptions = index === 1 ? taxProfileConditionOptions : conditionOptions;
  const isConditionLocked = rowConditionOptions.length === 1;
  const lockedConditionValue = rowConditionOptions[0]?.value;

  useEffect(() => {
    if (isConditionLocked && lockedConditionValue && row.condition !== lockedConditionValue) {
      setConditions((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, condition: lockedConditionValue } : item,
        ),
      );
    }
  }, [isConditionLocked, lockedConditionValue, row.condition, row.id, setConditions]);

  return (
    <div
      key={row.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {index > 0 ? (
        <Text>{__('AND IF', 'kirki-ecommerce')}</Text>
      ) : (
        <Text>{__(' IF', 'kirki-ecommerce')}</Text>
      )}
      <Grid
        cssOverride={styles.conditionGrid}
        template={
          row.condition === 'destination_region' || index > 0
            ? 'minmax(0, 2fr) 0.5fr minmax(0, 2fr) auto'
            : 'minmax(0, 2fr) 0.5fr minmax(0, 2fr)'
        }
      >
        <Select
          value={isConditionLocked ? lockedConditionValue : row.condition}
          onValueChange={(value) => updateCondition(row.id, 'condition', value)}
          disabled={isConditionLocked}
        >
          <SelectTrigger cssOverride={mergeCss(isConditionLocked && styles.lockedConditionTrigger)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rowConditionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input value={__('is', 'kirki-ecommerce')} readOnly />

        {row.condition === 'destination_region' ? (
          <Input
            readOnly
            value={getDestinationDisplayValue(row?.value)}
            onClick={() => setShowStatesPopup(true)}
          />
        ) : (
          <Select
            value={toDisplayString(row.value)}
            onValueChange={(value) => updateCondition(row.id, 'value', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getConditionValue(row.condition).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {row.condition === 'destination_region' && conditions.length < 2 && (
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddConditionRow}
            cssOverride={mergeCss(
              styles.conditionActions,
              isHovered && styles.conditionActionsActive,
            )}
          >
            <PlusIcon />
          </Button>
        )}
        {index > 0 && (
          <Button
            size="icon"
            variant="secondary"
            onClick={() => handleDeleteConditionRow(row.id)}
            cssOverride={mergeCss(
              styles.conditionActions,
              isHovered && styles.conditionActionsActive,
            )}
          >
            <TrashIcon />
          </Button>
        )}
      </Grid>
      {showStatesPopup && (
        <AddStatePopup
          openPopup={showStatesPopup}
          setOpenPopup={setShowStatesPopup}
          countryName={destinationLabel}
          countryList={states}
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

const styles = defineStyles({
  conditionGrid: {
    marginTop: theme.spacing[2],
  },
  lockedConditionTrigger: {
    '&[data-disabled]': {
      backgroundColor: theme.colors.background.fill,
      color: 'inherit',
      opacity: 1,
      borderColor: theme.colors.border.default,
    },
    '&[data-disabled] svg': {
      display: 'none',
    },
  },
  conditionActions: css({
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s ease',
    display: 'none',
    gap: theme.spacing[2],
    padding: theme.spacing[2],
  }),
  conditionActionsActive: css({
    opacity: 1,
    visibility: 'visible',
    display: 'flex',
  }),
});
