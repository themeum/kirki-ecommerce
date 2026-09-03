import { ChevronDown, ChevronUp } from 'lucide-react';
import type React from 'react';
import type { MouseEvent } from 'react';

import MoneyField from '@/components/form/money-field';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import {
  getAvailabilityColor,
  getAvailabilityDescription,
  getAvailabilityLabel,
} from '@/features/products/lib/availability';
import { getAttributeByValueId } from '@/features/products/lib/utils';
import { getVariantIndexArray } from '@/features/products/lib/variant-group';
import { InfoIcon } from '@/icons';
import { __ } from '@/wpi18n';

import GroupPriceCell from './group-price-cell';
import { useVariantGroup } from './use-variant-group';
import VariantMediaSelector from './variant-media-selector';

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

const CHEVRON_COLUMN_WIDTH = '64px';

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
    variants,
    show,
    setShow,
    selectedCheckedIndex,
    handleParentCheckboxClick,
    handleChildCheckboxClick,
    handleOnParentValueChange,
    handleParentMediaChange,
    handleChildMediaChange,
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

  const isGroupFullySelected =
    thisVariants.length > 0 && selectedCheckedIndex.length === thisVariants.length;
  const hasSecondaryAttribute = thisVariants[0]?.attribute_values.length > 1;

  return (
    <>
      <TableRow
        cssOverride={{ cursor: 'pointer' }}
        onClick={() => handleParentCheckboxClick(!isGroupFullySelected, [parentId])}
      >
        <TableCell onlyCheckbox onClick={stopPropagation}>
          <Checkbox
            checked={
              selectedCheckedIndex.length > 0 && selectedCheckedIndex.length < thisVariants.length
                ? 'indeterminate'
                : selectedCheckedIndex.length === thisVariants.length
            }
            onCheckedChange={(checked) => handleParentCheckboxClick(checked === true, [parentId])}
          />
        </TableCell>
        <TableCell cssOverride={{ width: '242px' }}>
          <Flex gap={3} align="center">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps the thumbnail's media picker click from also toggling row selection; the thumbnail control itself is the interactive element */}
            <div onClick={stopPropagation}>
              <VariantMediaSelector
                src={displayMedia[0]?.url}
                stackMedia={displayMedia}
                galleryIds={galleryIds}
                onChange={handleParentMediaChange}
              />
            </div>
            <Flex direction="column" gap={1}>
              <Text variant="small">{thisAttribute?.value ?? ''}</Text>
              {hasSecondaryAttribute && (
                <Text variant="tiny" color="secondary">
                  {thisVariants.length}{' '}
                  {thisVariants.length > 1
                    ? __('variants', 'kirki-ecommerce')
                    : __('variant', 'kirki-ecommerce')}
                </Text>
              )}
            </Flex>
          </Flex>
        </TableCell>
        <TableCell cssOverride={{ width: '170px' }} onClick={stopPropagation}>
          <GroupPriceCell
            minPrice={combinedData.minPrice}
            maxPrice={combinedData.maxPrice}
            currencySymbol={currencySymbol}
            onCommit={(value) => handleOnParentValueChange(value, 'base_price')}
          />
        </TableCell>
        <TableCell cssOverride={{ width: '170px' }}>
          {groupStatus && (
            <Flex
              align="center"
              gap={2}
              cssOverride={{
                '&:hover': {
                  '& [data-tooltip]': {
                    opacity: 1,
                  },
                },
              }}
            >
              <Text variant="tiny" color={getAvailabilityColor(groupStatus)}>
                {getAvailabilityLabel(groupStatus, groupQuantity)}
              </Text>
              <Tooltip
                tip={getAvailabilityDescription(groupStatus)}
                position="top"
                cssOverride={{ opacity: 0 }}
              >
                <InfoIcon />
              </Tooltip>
            </Flex>
          )}
        </TableCell>
        <TableCell cssOverride={{ width: CHEVRON_COLUMN_WIDTH }} onClick={stopPropagation}>
          {hasSecondaryAttribute && (
            <Button variant="ghost" size="icon" onClick={() => setShow(!show)}>
              {show ? <ChevronUp /> : <ChevronDown />}
            </Button>
          )}
        </TableCell>
      </TableRow>
      {show && hasVariation ? (
        <>
          {thisVariants.map((item, index) => {
            const isChecked = selectedCheckedIndex.includes(index);
            const mainIndex = getVariantIndexArray(variants, item)[0] ?? index;

            return (
              <TableRow
                key={index}
                cssOverride={{ cursor: 'pointer' }}
                onClick={() => handleChildCheckboxClick(!isChecked, item, index)}
              >
                <TableCell />
                <TableCell>
                  <Flex gap={3} align="center">
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps clicks on the checkbox from also toggling row selection; the checkbox itself is the interactive element */}
                    <div onClick={stopPropagation}>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleChildCheckboxClick(checked === true, item, index)
                        }
                      />
                    </div>

                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps the thumbnail's media picker click from also toggling row selection; the thumbnail control itself is the interactive element */}
                    <div onClick={stopPropagation}>
                      <VariantMediaSelector
                        src={item?.media?.url}
                        galleryIds={galleryIds}
                        onChange={(media) => handleChildMediaChange(media, item)}
                      />
                    </div>
                    <Text variant="small">
                      {item.attribute_values
                        .filter((value) => value !== parentId)
                        .map(
                          (value) =>
                            getAttributeByValueId(attributes, value)?.value ?? String(value),
                        )
                        .join(' | ')}
                    </Text>
                  </Flex>
                </TableCell>
                <TableCell onClick={stopPropagation}>
                  <MoneyField
                    name={`variants.${mainIndex}.base_price`}
                    placeholder={__('19.99', 'kirki-ecommerce')}
                    currencySymbol={currencySymbol}
                  />
                </TableCell>
                <TableCell>
                  <Text variant="tiny" color={getAvailabilityColor(childStatuses[index])}>
                    {getAvailabilityLabel(childStatuses[index], childQuantities[index])}
                  </Text>
                </TableCell>
                <TableCell cssOverride={{ width: CHEVRON_COLUMN_WIDTH }} />
              </TableRow>
            );
          })}
        </>
      ) : null}
    </>
  );
};

VariantGroup.displayName = 'VariantGroup';

export default VariantGroup;
