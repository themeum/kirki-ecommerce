import { CircleMinus, Plus } from 'lucide-react';
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import CreatableSelectField from '@/components/form/creatable-select-field';
import MoneyField from '@/components/form/money-field';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Label from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import BaseUnitPopover from '@/features/products/components/variant-sections/price/base-unit-popover';
import {
  calculateDiscountPercentage,
  getInitialOpenRows,
  type PriceRow,
} from '@/features/products/components/variant-sections/price/price-rows';
import {
  useVariantField,
  useVariantValues,
} from '@/features/products/components/variant-sections/use-variant-field';
import type { UnitPriceValue } from '@/features/products/types';
import { TaxProfilePopup, useTaxProfilesQuery } from '@/features/settings';
import { useBaseCurrencySymbol } from '@/hooks';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { calculateProfit } from '@/utils/common';
import { __, sprintf } from '@/wpi18n';

const UNIT_FIELDS = ['total_unit_amount', 'total_unit', 'base_unit_amount', 'base_unit'] as const;

const CLEARED_FIELDS: Record<PriceRow, readonly string[]> = {
  sale: ['base_sale_price'],
  unit: UNIT_FIELDS,
  cost: ['base_cost_of_goods'],
};

type PriceRowShellProps = {
  label: string;
  onRemove: () => void;
  badge?: ReactNode;
  children: ReactNode;
};

const PriceRowShell = ({ label, onRemove, badge, children }: PriceRowShellProps) => {
  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" justify="space-between" gap={2}>
        <Flex align="center" gap={2}>
          <Label cssOverride={{ fontWeight: theme.typography.fontWeight.semibold }}>{label}</Label>
          {badge}
        </Flex>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={sprintf(__('Remove %s', 'kirki-ecommerce'), label)}
        >
          <CircleMinus size={20} css={scoped(styles.removeIcon)} />
        </Button>
      </Flex>
      {children}
    </Flex>
  );
};

PriceRowShell.displayName = 'PriceRowShell';

const Price = () => {
  const { setValue } = useFormContext();
  const field = useVariantField();
  const [openTaxProfilePopup, setOpenTaxProfilePopup] = useState(false);
  const { data: taxProfiles } = useTaxProfilesQuery({ limit: -1 });

  const variant = useVariantValues([
    'base_price',
    'base_sale_price',
    'base_cost_of_goods',
    'charge_taxes',
    'total_unit_amount',
    'total_unit',
    'base_unit_amount',
    'base_unit',
  ]);

  const [openRows, setOpenRows] = useState<PriceRow[]>(() => getInitialOpenRows(variant));
  const [rowToFocus, setRowToFocus] = useState<PriceRow | null>(null);
  const hasSeededRows = useRef(false);

  /**
   * On an edit page the form is populated by a reset once the product query
   * resolves, so this card can mount before its values exist. Seed the open
   * rows the first time data actually shows up, then never again — re-seeding
   * on every change would reopen a row the merchant has just removed.
   */
  useEffect(() => {
    if (hasSeededRows.current) {
      return;
    }

    const rows = getInitialOpenRows(variant);

    if (rows.length === 0) {
      return;
    }

    hasSeededRows.current = true;
    setOpenRows(rows);
  }, [variant]);

  const chargeTaxes = Boolean(variant.charge_taxes);
  const currencySymbol = useBaseCurrencySymbol();
  const discountPercentage = calculateDiscountPercentage(
    variant.base_price,
    variant.base_sale_price,
  );

  const isOpen = (row: PriceRow) => openRows.includes(row);

  const handleAddRow = (row: PriceRow) => {
    hasSeededRows.current = true;
    setRowToFocus(row);
    setOpenRows((rows) => [...rows, row]);
  };

  const handleRemoveRow = (row: PriceRow) => {
    hasSeededRows.current = true;

    CLEARED_FIELDS[row].forEach((key) => {
      setValue(field(key as Parameters<typeof field>[0]), null, { shouldDirty: true });
    });

    setRowToFocus(null);
    setOpenRows((rows) => rows.filter((item) => item !== row));
  };

  const taxProfileList = (taxProfiles ?? []).map((item) => ({
    value: item?.id,
    label: item?.name,
  }));

  const handleUnitPriceChange = (value: UnitPriceValue) => {
    setValue(field('total_unit_amount'), value?.total_unit_amount ?? null, {
      shouldDirty: true,
    });
    setValue(field('total_unit'), value?.total_unit ?? null, {
      shouldDirty: true,
    });
    setValue(field('base_unit_amount'), value?.base_unit_amount ?? null, {
      shouldDirty: true,
    });
    setValue(field('base_unit'), value?.base_unit ?? null, {
      shouldDirty: true,
    });
  };

  const addRowButtons: { row: PriceRow; label: string }[] = [
    { row: 'sale', label: __('Sale price', 'kirki-ecommerce') },
    { row: 'unit', label: __('Unit price', 'kirki-ecommerce') },
    { row: 'cost', label: __('Cost & profit', 'kirki-ecommerce') },
  ];

  const hiddenRowButtons = addRowButtons.filter((item) => !isOpen(item.row));

  const TaxProfilePopupView = TaxProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Price', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.cardContent}>
        <MoneyField
          name={field('base_price')}
          ariaLabel={__('Price', 'kirki-ecommerce')}
          placeholder={__('0.00', 'kirki-ecommerce')}
          currencySymbol={currencySymbol}
        />

        {isOpen('sale') && (
          <PriceRowShell
            label={__('Sale price', 'kirki-ecommerce')}
            onRemove={() => handleRemoveRow('sale')}
            badge={
              discountPercentage !== null && (
                <Badge variant="success">
                  {sprintf(__('%d%% off', 'kirki-ecommerce'), discountPercentage)}
                </Badge>
              )
            }
          >
            <MoneyField
              name={field('base_sale_price')}
              placeholder={__('0.00', 'kirki-ecommerce')}
              currencySymbol={currencySymbol}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- only true for the row the merchant just added, never on load
              autoFocus={rowToFocus === 'sale'}
            />
          </PriceRowShell>
        )}

        {isOpen('unit') && (
          <PriceRowShell
            label={__('Unit price', 'kirki-ecommerce')}
            onRemove={() => handleRemoveRow('unit')}
          >
            <BaseUnitPopover
              data={variant as never}
              currencySymbol={currencySymbol}
              onChange={handleUnitPriceChange}
              buttonProps={{
                autoFocus: rowToFocus === 'unit',
                cssOverride: styles.unitPriceTrigger,
              }}
            />
          </PriceRowShell>
        )}

        {isOpen('cost') && (
          <PriceRowShell
            label={__('Cost & profit', 'kirki-ecommerce')}
            onRemove={() => handleRemoveRow('cost')}
          >
            <Grid columns={3} align="center" gap={4}>
              <MoneyField
                name={field('base_cost_of_goods')}
                label={__('Cost per item', 'kirki-ecommerce')}
                placeholder={__('0.00', 'kirki-ecommerce')}
                currencySymbol={currencySymbol}
                showSymbolWhenEmpty={false}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- only true for the row the merchant just added, never on load
                autoFocus={rowToFocus === 'cost'}
                cssOverride={{
                  '& label': {
                    ...theme.typography.small(),
                    color: theme.colors.text.primary,
                  },
                }}
              />
              <Flex direction="column" gap={2}>
                <Text color="primary" variant="small">
                  {__('Profit', 'kirki-ecommerce')}
                </Text>
                <Text variant="heading6" color="secondary" weight="semibold">
                  {calculateProfit('profit', variant)
                    ? `${currencySymbol} ${calculateProfit('profit', variant)}`
                    : '—'}
                </Text>
              </Flex>
              <Flex direction="column" gap={2}>
                <Text color="primary" variant="small">
                  {__('Margin', 'kirki-ecommerce')}
                </Text>
                <Text variant="heading6" color="secondary" weight="semibold">
                  {calculateProfit('margin', variant)
                    ? `${calculateProfit('margin', variant)}%`
                    : '—'}
                </Text>
              </Flex>
            </Grid>
          </PriceRowShell>
        )}

        {hiddenRowButtons.length > 0 && (
          <Flex gap={2} wrap="wrap" cssOverride={{ marginTop: theme.spacing[1] }}>
            {hiddenRowButtons.map((item) => (
              <Button
                key={item.row}
                type="button"
                variant="tertiary"
                onClick={() => handleAddRow(item.row)}
              >
                <Plus size={16} />
                {item.label}
              </Button>
            ))}
          </Flex>
        )}

        <Separator negativeMargin={16} />

        <Flex align="center" justify="space-between" gap={2}>
          <CheckboxField
            name={field('charge_taxes')}
            label={__('Charge tax on this product', 'kirki-ecommerce')}
            infoText={__('Apply tax to this product using a tax profile.', 'kirki-ecommerce')}
          />
          {chargeTaxes && (
            <CreatableSelectField
              name={field('tax_profile_id')}
              options={taxProfileList}
              placeholder={__('Add Tax Profile', 'kirki-ecommerce')}
              addNewLabel={__('Add Tax Profile', 'kirki-ecommerce')}
              onCreateNew={() => setOpenTaxProfilePopup(true)}
              valueAsNumber
              cssOverride={styles.taxProfileField}
            />
          )}
        </Flex>
      </CardContent>
      <TaxProfilePopupView
        isOpen={openTaxProfilePopup}
        onClose={() => setOpenTaxProfilePopup(false)}
        onSave={(value) =>
          setValue(field('tax_profile_id'), value as number, {
            shouldDirty: true,
          })
        }
      />
    </Card>
  );
};

Price.displayName = 'Price';

export default Price;

const styles = defineStyles({
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  removeIcon: {
    color: theme.colors.icon.secondary,
  },
  unitPriceTrigger: {
    width: '100%',
  },
  taxProfileField: {
    width: 'auto',
    minWidth: '160px',
  },
});
