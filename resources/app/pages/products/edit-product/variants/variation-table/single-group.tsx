import React, { useEffect, useState } from 'react';

import MediaStack from '@/components/media-stack';
import ThumbnailSelector from '@/components/thumbnail-selector';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
import { ChevronDownIcon } from '@/icons';
import Flex from '@/molecules/flex';
import { TableCell, TableRow } from '@/molecules/table';
import { useProductForm } from '@/contexts/product-form-context';
import type {
  AttributeValue,
  MediaChangePayload,
  MediaRef,
  ProductVariant,
} from '@/types';
import { __ } from '@/wpi18n';

import {
  generateVariantIndexById,
  generateVariantIndexes,
  getAttributeByValueId,
} from '@/pages/products/utils';

type CombinedData = {
  price?: number | string | null;
  in_stock?: boolean | string;
  available_quantity?: number;
  media?: ({ url?: string; [key: string]: unknown } | null | undefined)[];
};

type SingleGroupProps = {
  parentId: number;
  selectedIndex: number[];
  setSelectedIndex: React.Dispatch<React.SetStateAction<number[]>>;
  expandVariation: boolean;
};

const SingleGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
}: SingleGroupProps) => {
  const { product: productData, updateVariants } = useProductForm();
  const attributes = productData?.attributes || [];
  const variants = productData?.variants || [];
  const [selectedCheckedIndex, setSelectedCheckedIndex] = useState<number[]>(
    [],
  );
  const [combinedData, setCombinedData] = useState<CombinedData>({});

  const thisVariants = variants.filter((v) => {
    return v.attribute_values?.includes(parentId);
  });

  const [show, setShow] = useState(expandVariation);

  if (!thisVariants.length) {
    return null;
  }

  useEffect(() => {
    let minPrice = thisVariants[0]?.price;
    let maxPrice = thisVariants[0]?.price;
    let in_stock: boolean | string | undefined = thisVariants[0]?.in_stock;
    let available_quantity = 0;
    let mediaArray: CombinedData['media'] = [
      thisVariants[0]?.media as MediaRef | null | undefined,
    ];

    thisVariants.forEach((item) => {
      minPrice = Number(Math.min(Number(minPrice), Number(item?.price)));
      maxPrice = Number(Math.max(Number(maxPrice), Number(item?.price)));
      in_stock = item?.in_stock !== in_stock ? ' ' : in_stock;
      available_quantity += Number(item?.available_quantity);
      mediaArray =
        item?.media && (mediaArray?.length ?? 0) < 2
          ? [...(mediaArray || []), item.media as MediaRef]
          : mediaArray;
    });
    setCombinedData((prev) => ({
      ...prev,
      price: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
      in_stock: in_stock,
      available_quantity: available_quantity,
      media: mediaArray,
    }));
  }, [variants]);

  const thisAttribute = getAttributeByValueId(
    attributes,
    parentId,
  ) as AttributeValue | null;

  useEffect(() => {
    setShow(expandVariation);
  }, [expandVariation]);

  useEffect(() => {
    if (selectedIndex.length === 0) {
      setSelectedCheckedIndex([]);
    } else if (selectedIndex.length === variants.length) {
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    }
  }, [selectedIndex]);

  const handleOnChildValueChange = (
    value: unknown,
    fieldName: string,
    variant: ProductVariant,
  ) => {
    const indexList = getIndexArray(variant).filter(
      (index: number) => !selectedIndex.includes(index),
    );
    if (fieldName === 'media') {
      const mediaValue = value as MediaChangePayload & {
        date?: unknown;
        modified?: unknown;
      };
      delete mediaValue?.date;
      delete mediaValue?.modified;
    }

    updateVariants({
      key: fieldName,
      value: value,
      variant_index: [...selectedIndex, ...indexList],
    });
  };

  const handleOnParentValueChange = (value: unknown, fieldName: string) => {
    const indexList = generateVariantIndexes(variants, [
      parentId,
    ]) as number[];
    if (fieldName === 'media') {
      const mediaValue = value as MediaChangePayload & {
        date?: unknown;
        modified?: unknown;
      };
      delete mediaValue?.date;
      delete mediaValue?.modified;
    }
    updateVariants({
      key: fieldName,
      value: value,
      variant_index: [
        ...selectedIndex,
        ...indexList.filter((item: number) => !selectedIndex.includes(item)),
      ],
    });
    setSelectedCheckedIndex([]);
    setSelectedIndex([]);
  };

  const handleParentCheckboxClick = (
    value: boolean,
    attributeArray: number[],
  ) => {
    setShow(true);
    const indexList = generateVariantIndexes(
      variants,
      attributeArray,
    ) as number[];
    if (value) {
      setSelectedIndex((prev) => [
        ...prev,
        ...indexList.filter((item: number) => !selectedIndex.includes(item)),
      ]);
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    } else {
      const newList = selectedIndex.filter(
        (item) => !indexList.includes(item),
      );
      setSelectedIndex(newList);
      setSelectedCheckedIndex([]);
    }
  };

  const handleChildCheckboxClick = (
    value: boolean,
    variant: ProductVariant,
    index: number,
  ) => {
    const indexList = getIndexArray(variant);
    if (value) {
      setSelectedIndex((prev) => [...prev, ...indexList]);
      setSelectedCheckedIndex((prev) => [...prev, index]);
    } else {
      const newList = selectedIndex.filter(
        (item) => !indexList.includes(item),
      );
      setSelectedIndex(newList);
      setSelectedCheckedIndex((prev) => prev.filter((item) => item !== index));
    }
  };

  const getIndexArray = (variant: ProductVariant): number[] => {
    let indexList: number[] = [];
    if (variant.id) {
      indexList = generateVariantIndexById(variants, variant?.id) as number[];
    } else {
      indexList = generateVariantIndexes(
        variants,
        variant?.attribute_values,
      ) as number[];
    }
    return indexList;
  };

  const hasVariation = thisVariants[0].attribute_values.filter(
    (item) => item !== parentId,
  ).length;

  return (
    <>
      <TableRow className={`${CLASS_PREFIX}-hover-parent`}>
        <TableCell onlyCheckbox>
          <Checkbox
            checked={
              selectedCheckedIndex.length > 0 &&
              selectedCheckedIndex.length < thisVariants.length
                ? 'indeterminate'
                : selectedCheckedIndex.length === thisVariants.length
            }
            onCheckedChange={(checked) =>
              handleParentCheckboxClick(checked === true, [parentId])
            }
          />
        </TableCell>
        <TableCell style={{ width: '242px' }}>
          <Flex gap={12} style={{ alignItems: 'center' }}>
            {hasVariation ? (
              <MediaStack
                size="small"
                mediaArray={combinedData?.media as { url?: string }[]}
              />
            ) : (
              <ThumbnailSelector
                src={combinedData?.media?.[0]?.url}
                onChange={(img) => handleOnParentValueChange(img, 'media')}
                size="small"
              />
            )}
            <Flex direction={'column'} gap={4}>
              <div>{thisAttribute?.value ?? ''}</div>
              {thisVariants[0]?.attribute_values.length > 1 && (
                <div>
                  {thisVariants.length}{' '}
                  {thisVariants.length > 1
                    ? __('Variations', 'kirki-ecommerce')
                    : __('Variation', 'kirki-ecommerce')}
                </div>
              )}
            </Flex>
            <Button
              variant="ghost"
              size="sm"
              className={`${thisVariants[0]?.attribute_values.length > 1 ? `${CLASS_PREFIX}-hover-visible` : `${CLASS_PREFIX}-visibility-hidden`}`}
              onClick={() => setShow(!show)}
              style={{
                transform: show ? 'rotate(180deg)' : '',
              }}
            >
              <ChevronDownIcon />
            </Button>
          </Flex>
        </TableCell>
        <TableCell style={{ width: '170px' }}>
          <Input
            placeholder={__('19.99', 'kirki-ecommerce')}
            style={{ textAlign: 'center' }}
            value={combinedData?.price || ''}
            onChange={(event) =>
              handleOnParentValueChange(
                !hasVariation
                  ? parseFloat(event.target.value)
                  : event.target.value,
                'price',
              )
            }
            disabled={!!hasVariation}
            type={!hasVariation ? 'number' : 'text'}
          />
        </TableCell>
        <TableCell style={{ width: '170px' }}>
          {!productData?.variants[0]?.track_inventory ? (
            <Select
              value={combinedData?.in_stock?.toString()}
              onValueChange={(value) =>
                handleOnParentValueChange(value, 'in_stock')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="--" />
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
              value={combinedData?.available_quantity}
              disabled={!!hasVariation}
              type="number"
              style={{ textAlign: 'center' }}
              onChange={(event) =>
                handleOnParentValueChange(
                  parseFloat(event.target.value),
                  'available_quantity',
                )
              }
            />
          )}
        </TableCell>
      </TableRow>
      {show && hasVariation ? (
        <>
          {thisVariants.map((item, index) => (
            <TableRow key={index}>
              <TableCell></TableCell>
              <TableCell>
                <Flex gap={12} style={{ alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedCheckedIndex.includes(index)}
                    onCheckedChange={(checked) =>
                      handleChildCheckboxClick(checked === true, item, index)
                    }
                  />
                  <ThumbnailSelector
                    src={(item?.media as MediaRef | null)?.url}
                    onChange={(img) =>
                      handleOnChildValueChange(img, 'media', item)
                    }
                    size="small"
                  />
                  <div>
                    {item.attribute_values
                      .filter((v) => v !== parentId)
                      .map(
                        (v) =>
                          (
                            getAttributeByValueId(
                              attributes,
                              v,
                            ) as AttributeValue | null
                          )?.value ?? String(v),
                      )
                      .join(' | ')}
                  </div>
                </Flex>
              </TableCell>
              <TableCell>
                <Input
                  placeholder={__('19.99', 'kirki-ecommerce')}
                  style={{ textAlign: 'center' }}
                  value={item?.price || ''}
                  type="number"
                  onChange={(event) =>
                    handleOnChildValueChange(
                      parseFloat(event.target.value),
                      'price',
                      item,
                    )
                  }
                />
              </TableCell>
              <TableCell>
                {!productData?.variants[0]?.track_inventory ? (
                  <Select
                    value={item?.in_stock.toString()}
                    onValueChange={(value) =>
                      handleOnChildValueChange(value, 'in_stock', item)
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
                    value={item?.available_quantity}
                    style={{ textAlign: 'center' }}
                    type="number"
                    onChange={(event) =>
                      handleOnChildValueChange(
                        parseFloat(event.target.value),
                        'available_quantity',
                        item,
                      )
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </>
      ) : null}
    </>
  );
};

SingleGroup.displayName = 'SingleGroup';

export default SingleGroup;
