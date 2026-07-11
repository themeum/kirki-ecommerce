import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { ChevronUpDownIcon, EditIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Separator from '@/molecules/separator';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateVariants } from '@/store/productSlice';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import SingleGroup from './single-group';

const VariationTable = () => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
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
    dispatch(
      updateVariants({
        key: fieldName,
        value: value,
        variant_index: selectedIndex,
      }),
    );
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
      <Separator style={{ margin: 'auto -16px' }} />
      <Flex>
        <Flex gap={12}>
          <Select
            style={{ width: '180px' }}
            value={showBy}
            optionsArray={showByOptions}
            onChange={(value) => {
              setShowBy(value as number);
            }}
          />
          <Button
            type="outlined"
            size="small"
            icon={<ChevronUpDownIcon />}
            onClick={() => setExpandVariation((prev) => !prev)}
          />
        </Flex>
        <ActionGroup>
          <Button
            type="secondary"
            size="small"
            text={
              selectedIndex.length > 0
                ? __('Bulk Edit', 'kirki-ecommerce')
                : __('Edit Variations', 'kirki-ecommerce')
            }
            leftIcon={<EditIcon />}
            onClick={handleBulkEditVariants}
          />
        </ActionGroup>
      </Flex>

      <Card type="inner" style={{ padding: 0 }}>
        <Table type="variation">
          <TableHeader>
            <TableRow style={{ height: '53px' }}>
              <TableHead onlyCheckbox>
                <Checkbox
                  value={selectedIndex.length === variants.length}
                  onChange={handleSelectAll}
                  isPartialChecked={
                    !!(
                      selectedIndex.length &&
                      selectedIndex.length < variants.length
                    )
                  }
                />
              </TableHead>
              {selectedIndex.length ? (
                <>
                  <TableHead>
                    <Flex
                      gap={18}
                      style={{
                        alignItems: 'center',
                      }}
                    >
                      {selectedIndex.length}{' '}
                      {selectedIndex.length !== variants.length
                        ? `${selectedIndex.length === 1 ? 'item' : 'items'} selected`
                        : `of ${variants.length} ${selectedIndex.length === 1 ? 'item' : 'items'} selected`}
                      <Button
                        type="blank"
                        text={
                          selectedIndex.length === variants.length
                            ? __('Deselect All', 'kirki-ecommerce')
                            : __('Select All', 'kirki-ecommerce')
                        }
                        style={{ fontWeight: '400' }}
                        onClick={() =>
                          handleSelectAll(
                            selectedIndex.length !== 0 &&
                              selectedIndex.length < variants.length,
                          )
                        }
                      />
                    </Flex>
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder={__('$0.00', 'kirki-ecommerce')}
                      type="number"
                      style={{ textAlign: 'center' }}
                      onChange={(value) =>
                        handleSelectedValueChangeFromHeader(value, 'price')
                      }
                    />
                  </TableHead>
                  <TableHead>
                    {!productData?.variants[0]?.track_inventory ? (
                      <Select
                        optionsArray={[
                          {
                            value: 'true',
                            title: __('In Stock', 'kirki-ecommerce'),
                          },
                          {
                            value: 'false',
                            title: __('Out of Stock', 'kirki-ecommerce'),
                          },
                        ]}
                        onChange={(value) =>
                          handleSelectedValueChangeFromHeader(value, 'in_stock')
                        }
                      />
                    ) : (
                      <Input
                        placeholder={__('0', 'kirki-ecommerce')}
                        type="number"
                        style={{ textAlign: 'center' }}
                        onChange={(value) =>
                          handleSelectedValueChangeFromHeader(
                            value,
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
      </Card>
    </>
  );
};

export default VariationTable;
