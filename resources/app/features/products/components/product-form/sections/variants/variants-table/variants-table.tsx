import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import NumberInput from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RouteConfig } from '@/config/route-config';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { EditIcon } from '@/icons';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { __, sprintf } from '@/wpi18n';

import VariantGroup from './variant-group';

const VariantsTable = () => {
  const { control, getValues, setValue } = useFormContext<ProductFormInput>();
  const watchedAttributes = useWatch({ control, name: 'attributes' });
  const attributes = useMemo<NonNullable<typeof watchedAttributes>>(
    () => watchedAttributes ?? [],
    [watchedAttributes],
  );
  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const currency = useWatch({ control, name: 'currency' });
  const currencySymbol = currency?.symbol || '$';
  const { data: productSettings } = useSettingsQuery('product');
  const storeDefaultThreshold = Number(productSettings?.low_stock_threshold ?? 0);
  const [showBy, setShowBy] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number[]>([]);
  const [expandVariation, setExpandVariation] = useState(false);
  const navigate = useNavigate();

  const updateVariants = ({
    key,
    value,
    variant_index = [],
  }: {
    key: string;
    value: unknown;
    variant_index?: number[];
  }) => {
    const nextVariants = [...(getValues('variants') ?? [])];
    variant_index.forEach((index) => {
      if (!nextVariants[index]) {
        return;
      }
      nextVariants[index] = {
        ...nextVariants[index],
        [key]: value,
      };
    });
    setValue('variants', nextVariants, { shouldDirty: true });
  };

  useEffect(() => {
    if (attributes.length > 0) {
      setShowBy(attributes[0].id);
    }
  }, [attributes]);

  useEffect(() => {
    setSelectedIndex([]);
  }, [showBy]);

  const handleSelectAll = (value: boolean) => {
    if (value) {
      setSelectedIndex([...Array(variants.length).keys()]);
    } else {
      setSelectedIndex([]);
    }
  };

  const handleBulkEditVariants = () => {
    if (selectedIndex.length === 0) {
      const selectedIds = Object.values(variants).map((item) => item.id);
      void navigate(`${RouteConfig.BulkVariants.buildLink()}?ids=${selectedIds.join(',')}`);
    } else {
      const selectedIds = Object.values(variants)
        .filter((_item, index) => selectedIndex.includes(index))
        .map((item) => item.id);
      void navigate(`${RouteConfig.BulkVariants.buildLink()}?ids=${selectedIds.join(',')}`);
    }
  };

  const handleSelectedValueChangeFromHeader = (value: unknown, fieldName: string) => {
    updateVariants({
      key: fieldName,
      value,
      variant_index: selectedIndex,
    });
  };

  const showByOptions: SelectOption[] = attributes.map((attr) => ({
    value: attr.id,
    title: __(`Show by: `, 'kirki-ecommerce') + attr.name,
  }));

  const selectedAttribute = attributes.find((attr) => attr.id === showBy);

  if (attributes.length === 0 || variants.length === 0 || !showBy) {
    return null;
  }
  return (
    <>
      <Separator cssOverride={styles.fullBleed} />
      <Flex>
        <Flex gap={3}>
          <Select value={String(showBy)} onValueChange={(value) => setShowBy(Number(value))}>
            <SelectTrigger cssOverride={{ width: '180px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {showByOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* <Button variant="outline" onClick={() => setExpandVariation((prev) => !prev)}>
            <ChevronUpDownIcon />
          </Button> */}
        </Flex>
        <ActionGroup>
          <Button variant="secondary" onClick={handleBulkEditVariants}>
            <EditIcon />
            {selectedIndex.length > 0
              ? __('Bulk Edit', 'kirki-ecommerce')
              : __('Edit Variants', 'kirki-ecommerce')}
          </Button>
        </ActionGroup>
      </Flex>

      <Card cssOverride={mergeCss(cardStyles.innerCard, cardStyles.tableCard)}>
        <CardContent cssOverride={cardStyles.tableContent}>
          <Table density="compact" fixed>
            <TableHeader>
              <TableRow cssOverride={{ height: '53px' }}>
                <TableHead onlyCheckbox>
                  <Checkbox
                    checked={
                      selectedIndex.length > 0 && selectedIndex.length < variants.length
                        ? 'indeterminate'
                        : selectedIndex.length === variants.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  />
                </TableHead>
                {selectedIndex.length ? (
                  <>
                    <TableHead cssOverride={{ width: '242px' }}>
                      <Flex gap={5} align="center">
                        {selectedIndex.length}{' '}
                        {selectedIndex.length !== variants.length
                          ? selectedIndex.length === 1
                            ? __('item selected', 'kirki-ecommerce')
                            : __('items selected', 'kirki-ecommerce')
                          : sprintf(
                              __('of %d %s selected', 'kirki-ecommerce'),
                              variants.length,
                              selectedIndex.length === 1
                                ? __('item', 'kirki-ecommerce')
                                : __('items', 'kirki-ecommerce'),
                            )}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            handleSelectAll(
                              selectedIndex.length !== 0 && selectedIndex.length < variants.length,
                            )
                          }
                        >
                          {selectedIndex.length === variants.length
                            ? __('Deselect All', 'kirki-ecommerce')
                            : __('Select All', 'kirki-ecommerce')}
                        </Button>
                      </Flex>
                    </TableHead>
                    <TableHead cssOverride={{ width: '170px' }}>
                      <NumberInput
                        placeholder={__('$0.00', 'kirki-ecommerce')}
                        cssOverride={{ textAlign: 'center' }}
                        onChange={(event) => {
                          const parsed = parseFloat(event.target.value);

                          if (!Number.isFinite(parsed)) {
                            return;
                          }

                          handleSelectedValueChangeFromHeader(parsed, 'base_price');
                        }}
                      />
                    </TableHead>
                    <TableHead />
                    <TableHead cssOverride={{ width: '48px' }} />
                  </>
                ) : (
                  <>
                    <TableHead cssOverride={{ width: '242px' }}>
                      {__('Variants', 'kirki-ecommerce')}
                    </TableHead>
                    <TableHead cssOverride={{ width: '170px' }}>
                      {__('Price', 'kirki-ecommerce')}
                    </TableHead>
                    <TableHead>{__('Availability', 'kirki-ecommerce')}</TableHead>
                    <TableHead cssOverride={{ width: '64px' }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandVariation((prev) => !prev)}
                      >
                        {expandVariation ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(selectedAttribute?.values ?? []).map((item) => (
                <VariantGroup
                  parentId={item.id}
                  key={item.id}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={setSelectedIndex}
                  expandVariation={expandVariation}
                  currencySymbol={currencySymbol}
                  storeDefaultThreshold={storeDefaultThreshold}
                  updateVariants={updateVariants}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

VariantsTable.displayName = 'VariantsTable';

export default VariantsTable;

const styles = defineStyles({
  normalWeight: {
    ...theme.typography.paragraph(),
  },
  fullBleed: {
    marginInline: `calc(-1 * ${theme.spacing[4]})`,
    width: `calc(100% + ${theme.spacing[8]})`,
  },
});
