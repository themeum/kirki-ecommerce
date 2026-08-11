import type React from 'react';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import MediaStack from '@/components/media-stack';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { ChevronDownIcon } from '@/icons';
import { generateVariantIndexById, generateVariantIndexes, getAttributeByValueId } from '@/pages/products/utils';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { defineStyles } from '@/theme/mixins';
import type {
  MediaChangePayload,
  MediaRef,
  ProductVariant,
} from '@/types';
import { __ } from '@/wpi18n';

import VariantThumbnailSelector from './variant-thumbnail-selector';

type CombinedData = {
  base_price?: number | string | null;
  in_stock?: boolean | string;
  available_quantity?: number;
  media?: ({ url?: string; [key: string]: unknown } | null | undefined)[];
};

const styles = defineStyles({
  hoverParent: {
    '&:hover [data-hover-reveal]': {
      visibility: 'visible',
    },
  },
  hoverReveal: {
    visibility: 'hidden',
  },
});

type UpdateVariantsPayload = {
  key: string;
  value: unknown;
  variant_index?: number[];
};

type SingleGroupProps = {
  parentId: number;
  selectedIndex: number[];
  setSelectedIndex: React.Dispatch<React.SetStateAction<number[]>>;
  expandVariation: boolean;
  updateVariants: (payload: UpdateVariantsPayload) => void;
};

const SingleGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
  updateVariants,
}: SingleGroupProps) => {
  const { control, setValue } = useFormContext<ProductFormInput>();
  const attributes = useWatch({ control, name: 'attributes' }) ?? [];
  const variants = (useWatch({ control, name: 'variants' }) ?? []) as ProductVariant[];
  const productGallery = (useWatch({ control, name: 'media' }) ?? []);
  const galleryIds = productGallery.map((item) => Number(item.id)).filter(Boolean);
  const [selectedCheckedIndex, setSelectedCheckedIndex] = useState<number[]>(
    [],
  );
  const [combinedData, setCombinedData] = useState<CombinedData>({});

  const thisVariants = variants.filter((v) => {
    return v.attribute_values?.includes(parentId);
  });

  const [show, setShow] = useState(expandVariation);

  useEffect(() => {
    let minPrice = thisVariants[0]?.base_price;
    let maxPrice = thisVariants[0]?.base_price;
    let in_stock: boolean | string | undefined = thisVariants[0]?.in_stock;
    let available_quantity = 0;
    let mediaArray: CombinedData['media'] = [
      thisVariants[0]?.media,
    ];

    thisVariants.forEach((item) => {
      minPrice = Number(Math.min(Number(minPrice), Number(item?.base_price)));
      maxPrice = Number(Math.max(Number(maxPrice), Number(item?.base_price)));
      in_stock = item?.in_stock !== in_stock ? ' ' : in_stock;
      available_quantity += Number(item?.available_quantity);
      mediaArray =
        item?.media && (mediaArray?.length ?? 0) < 2
          ? [...(mediaArray || []), item.media]
          : mediaArray;
    });
    setCombinedData((prev) => ({
      ...prev,
      base_price: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
      in_stock,
      available_quantity,
      media: mediaArray,
    }));
  }, [variants]);

  const thisAttribute = getAttributeByValueId(
    attributes,
    parentId,
  );

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

  if (!thisVariants.length) {
    return null;
  }

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
      value,
      variant_index: [...selectedIndex, ...indexList],
    });
  };

  const handleOnParentValueChange = (value: unknown, fieldName: string) => {
    const indexList = generateVariantIndexes(variants, [
      parentId,
    ]);
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
      value,
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
    );
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

  const addToGalleryIfMissing = (media: MediaChangePayload | null) => {
    if (!media?.id) {
      return;
    }
    const isInGallery = productGallery.some((item) => String(item.id) === String(media.id));
    if (!isInGallery) {
      setValue('media', [...productGallery, media as MediaRef], { shouldDirty: true });
    }
  };

  const handleParentThumbnailChange = (media: MediaChangePayload | null) => {
    handleOnParentValueChange(media, 'media');
    addToGalleryIfMissing(media);
  };

  const handleChildThumbnailChange = (media: MediaChangePayload | null, variant: ProductVariant) => {
    handleOnChildValueChange(media, 'media', variant);
    addToGalleryIfMissing(media);
  };

  const getIndexArray = (variant: ProductVariant): number[] => {
    let indexList: number[] = [];
    if (variant.id) {
      indexList = generateVariantIndexById(variants, variant?.id);
    } else {
      indexList = generateVariantIndexes(
        variants,
        variant?.attribute_values,
      );
    }
    return indexList;
  };

  const hasVariation = thisVariants[0].attribute_values.filter(
    (item) => item !== parentId,
  ).length;

  return (
    <>
      <TableRow cssOverride={styles.hoverParent}>
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
          <Flex gap={3} align="center">
            {hasVariation ? (
              <MediaStack
                size="small"
                mediaArray={combinedData?.media as { url?: string }[]}
              />
            ) : (
              <VariantThumbnailSelector
                src={combinedData?.media?.[0]?.url}
                galleryIds={galleryIds}
                onChange={handleParentThumbnailChange}
              />
            )}
            <Flex direction="column" gap={1}>
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
              data-hover-reveal={
                thisVariants[0]?.attribute_values.length > 1
                  ? 'true'
                  : undefined
              }
              cssOverride={styles.hoverReveal}
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
            value={combinedData?.base_price || ''}
            onChange={(event) =>
              handleOnParentValueChange(
                !hasVariation
                  ? parseFloat(event.target.value)
                  : event.target.value,
                'base_price',
              )
            }
            disabled={!!hasVariation}
            type={!hasVariation ? 'number' : 'text'}
          />
        </TableCell>
        <TableCell style={{ width: '170px' }}>
          {!variants[0]?.track_inventory ? (
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
              <TableCell />
              <TableCell>
                <Flex gap={3} align="center">
                  <Checkbox
                    checked={selectedCheckedIndex.includes(index)}
                    onCheckedChange={(checked) =>
                      handleChildCheckboxClick(checked === true, item, index)
                    }
                  />
                  <VariantThumbnailSelector
                    src={(item?.media as MediaRef | null)?.url}
                    galleryIds={galleryIds}
                    onChange={(media) => handleChildThumbnailChange(media, item)}
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
                            )
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
                  value={item?.base_price || ''}
                  type="number"
                  onChange={(event) =>
                    handleOnChildValueChange(
                      parseFloat(event.target.value),
                      'base_price',
                      item,
                    )
                  }
                />
              </TableCell>
              <TableCell>
                {!variants[0]?.track_inventory ? (
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
