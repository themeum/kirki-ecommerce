import type React from 'react';

import MediaStack from '@/components/media-stack';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { getAttributeByValueId } from '@/features/products/lib/utils';
import { ChevronDownIcon } from '@/icons';
import type { MediaRef } from '@/schemas/shared/media';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { useSingleGroup } from './use-single-group';
import VariantThumbnailSelector from './variant-thumbnail-selector';

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
  const {
    thisVariants,
    thisAttribute,
    attributes,
    combinedData,
    hasVariation,
    galleryIds,
    variants,
    show,
    setShow,
    selectedCheckedIndex,
    handleParentCheckboxClick,
    handleChildCheckboxClick,
    handleOnParentValueChange,
    handleOnChildValueChange,
    handleParentThumbnailChange,
    handleChildThumbnailChange,
  } = useSingleGroup({
    parentId,
    selectedIndex,
    setSelectedIndex,
    expandVariation,
    updateVariants,
  });

  if (!thisVariants.length) {
    return null;
  }

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
