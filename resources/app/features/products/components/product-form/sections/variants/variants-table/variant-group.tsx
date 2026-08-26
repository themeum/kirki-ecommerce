import type React from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import {
  getAvailabilityColor,
  getAvailabilityDescription,
  getAvailabilityLabel,
} from '@/features/products/lib/availability';
import { getAttributeByValueId } from '@/features/products/lib/utils';
import { ChevronDownIcon, InfoIcon } from '@/icons';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import GroupPriceCell from './group-price-cell';
import { useVariantGroup } from './use-variant-group';
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

type VariantGroupProps = {
  parentId: number;
  selectedIndex: number[];
  setSelectedIndex: React.Dispatch<React.SetStateAction<number[]>>;
  expandVariation: boolean;
  currencySymbol: string;
  storeDefaultThreshold: number;
  updateVariants: (payload: UpdateVariantsPayload) => void;
};

const VariantGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
  currencySymbol,
  storeDefaultThreshold,
  updateVariants,
}: VariantGroupProps) => {
  const {
    thisVariants,
    thisAttribute,
    attributes,
    combinedData,
    displayMedia,
    childStatuses,
    childQuantities,
    groupStatus,
    groupQuantity,
    hasVariation,
    galleryIds,
    show,
    setShow,
    selectedCheckedIndex,
    handleParentCheckboxClick,
    handleChildCheckboxClick,
    handleOnParentValueChange,
    handleOnChildValueChange,
    handleParentThumbnailChange,
    handleChildThumbnailChange,
  } = useVariantGroup({
    parentId,
    selectedIndex,
    setSelectedIndex,
    expandVariation,
    storeDefaultThreshold,
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
            <VariantThumbnailSelector
              src={displayMedia[0]?.url}
              stackMedia={displayMedia}
              galleryIds={galleryIds}
              onChange={handleParentThumbnailChange}
            />
            <Flex direction="column" gap={1}>
              <div>{thisAttribute?.value ?? ''}</div>
              {thisVariants[0]?.attribute_values.length > 1 && (
                <div>
                  {thisVariants.length}{' '}
                  {thisVariants.length > 1
                    ? __('variants', 'kirki-ecommerce')
                    : __('variant', 'kirki-ecommerce')}
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
          <GroupPriceCell
            minPrice={combinedData.minPrice}
            maxPrice={combinedData.maxPrice}
            currencySymbol={currencySymbol}
            onCommit={(value) => handleOnParentValueChange(value, 'base_price')}
          />
        </TableCell>
        <TableCell style={{ width: '170px' }}>
          {groupStatus && (
            <Flex align="center" gap={2}>
              <Text variant="tiny" color={getAvailabilityColor(groupStatus)}>
                {getAvailabilityLabel(groupStatus, groupQuantity)}
              </Text>
              <Tooltip tip={getAvailabilityDescription(groupStatus)}>
                <InfoIcon />
              </Tooltip>
            </Flex>
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
                    src={item?.media?.url}
                    galleryIds={galleryIds}
                    onChange={(media) => handleChildThumbnailChange(media, item)}
                  />
                  <div>
                    {item.attribute_values
                      .filter((value) => value !== parentId)
                      .map(
                        (value) =>
                          (
                            getAttributeByValueId(
                              attributes,
                              value,
                            )
                          )?.value ?? String(value),
                      )
                      .join(' | ')}
                  </div>
                </Flex>
              </TableCell>
              <TableCell>
                <InputGroup>
                  <InputGroupAddon>{currencySymbol}</InputGroupAddon>
                  <InputGroupInput
                    placeholder={__('19.99', 'kirki-ecommerce')}
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
                </InputGroup>
              </TableCell>
              <TableCell>
                <Text variant="tiny" color={getAvailabilityColor(childStatuses[index])}>
                  {getAvailabilityLabel(childStatuses[index], childQuantities[index])}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </>
      ) : null}
    </>
  );
};

VariantGroup.displayName = 'VariantGroup';

export default VariantGroup;
