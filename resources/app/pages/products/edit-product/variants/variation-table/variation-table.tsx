import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronUpDownIcon, EditIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProductForm } from '@/contexts/product-form-context';
import { cardStyles } from '@/theme/card-styles';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import SingleGroup from '@/pages/products/edit-product/variants/variation-table/single-group';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

const VariationTable = () => {
  const { product: productData, updateVariants } = useProductForm();
  const attributes = productData?.attributes || [];
  const variants = productData?.variants || [];
  const [showBy, setShowBy] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number[]>([]);
  const [expandVariation, setExpandVariation] = useState(true);
  const navigate = useNavigate();

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
      navigate(`/variants/bulk?ids=${selectedIds.join(',')}`);
    } else {
      const selectedIds = Object.values(variants)
        .filter((_item, index) => selectedIndex.includes(index))
        .map((item) => item.id);
      navigate(`/variants/bulk?ids=${selectedIds.join(',')}`);
    }
  };

  const handleSelectedValueChangeFromHeader = (
    value: unknown,
    fieldName: string,
  ) => {
    updateVariants({
      key: fieldName,
      value: value,
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
      <Separator style={{ margin: `auto -${theme.spacing[4]}` }} />
      <Flex>
        <Flex gap={3}>
          <Select
            value={String(showBy)}
            onValueChange={(value) => setShowBy(Number(value))}
          >
            <SelectTrigger style={{ width: '180px' }}>
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
          <Button
            variant="outline"
            onClick={() => setExpandVariation((prev) => !prev)}
          >
            <ChevronUpDownIcon />
          </Button>
        </Flex>
        <ActionGroup>
          <Button
            variant="secondary"
            onClick={handleBulkEditVariants}
          >
            <EditIcon />
            {selectedIndex.length > 0
              ? __('Bulk Edit', 'kirki-ecommerce')
              : __('Edit Variations', 'kirki-ecommerce')}
          </Button>
        </ActionGroup>
      </Flex>

      <Card css={[cardStyles.innerCard, cardStyles.tableCard]}>
        <CardContent css={cardStyles.tableContent}>
        <Table type="variation">
          <TableHeader>
            <TableRow style={{ height: '53px' }}>
              <TableHead onlyCheckbox>
                <Checkbox
                  checked={
                    selectedIndex.length > 0 &&
                    selectedIndex.length < variants.length
                      ? 'indeterminate'
                      : selectedIndex.length === variants.length
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                />
              </TableHead>
              {selectedIndex.length ? (
                <>
                  <TableHead>
                    <Flex
                      gap={5}
                      align="center">
                      {selectedIndex.length}{' '}
                      {selectedIndex.length !== variants.length
                        ? `${selectedIndex.length === 1 ? 'item' : 'items'} selected`
                        : `of ${variants.length} ${selectedIndex.length === 1 ? 'item' : 'items'} selected`}
                      <Button
                        variant="ghost"
                        css={styles.normalWeight}
                        onClick={() =>
                          handleSelectAll(
                            selectedIndex.length !== 0 &&
                              selectedIndex.length < variants.length,
                          )
                        }
                      >
                        {selectedIndex.length === variants.length
                          ? __('Deselect All', 'kirki-ecommerce')
                          : __('Select All', 'kirki-ecommerce')}
                      </Button>
                    </Flex>
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder={__('$0.00', 'kirki-ecommerce')}
                      type="number"
                      style={{ textAlign: 'center' }}
                      onChange={(event) =>
                        handleSelectedValueChangeFromHeader(
                          parseFloat(event.target.value),
                          'price',
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>
                    {!productData?.variants[0]?.track_inventory ? (
                      <Select
                        onValueChange={(value) =>
                          handleSelectedValueChangeFromHeader(
                            value,
                            'in_stock',
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            {__('In Stock', 'kirki-ecommerce')}
                          </SelectItem>
                          <SelectItem value="false">
                            {__('Out of Stock', 'kirki-ecommerce')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={__('0', 'kirki-ecommerce')}
                        type="number"
                        style={{ textAlign: 'center' }}
                        onChange={(event) =>
                          handleSelectedValueChangeFromHeader(
                            parseFloat(event.target.value),
                            'available_quantity',
                          )
                        }
                      />
                    )}
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead>{__('Variants', 'kirki-ecommerce')}</TableHead>
                  <TableHead>{__('Price', 'kirki-ecommerce')}</TableHead>
                  <TableHead>{__('Inventory', 'kirki-ecommerce')}</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(selectedAttribute?.values || []).map((item) => (
              <SingleGroup
                parentId={item.id}
                key={item.id}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                expandVariation={expandVariation}
              />
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </>
  );
};

VariationTable.displayName = 'VariationTable';

export default VariationTable;

const styles = {
  normalWeight: scoped({
    ...theme.typography.paragraph(),
  }),
};

