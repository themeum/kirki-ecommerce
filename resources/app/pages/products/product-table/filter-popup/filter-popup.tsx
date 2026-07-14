import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { CloseIcon, ListFilter } from '@/icons';
import { useListParams } from '@/hooks';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import { DropdownMenuContent } from '@/molecules/dropdown';
import Flex from '@/molecules/flex';
import { RadioGroup } from '@/molecules/radio-group';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { __, sprintf } from '@/wpi18n';

import BrandFilter from '@/pages/products/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/pages/products/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/pages/products/product-table/filter-popup/collection-filter';

type LocalFilterState = {
  category_ids: number[];
  status: string;
  stock_status: string;
  collection_ids: number | undefined;
  brand_ids: number | undefined;
};

type FilterPopupProps = {
  onChange?: () => void;
  buttonProps?: ComponentProps<typeof Button>;
  data?: unknown;
};

const FilterPopup = ({
  onChange: _onChange = () => {},
  buttonProps,
  data: _data,
}: FilterPopupProps) => {
  const { params, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const popoverRef = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<LocalFilterState>({
    category_ids: [],
    status: 'all',
    stock_status: '',
    collection_ids: undefined,
    brand_ids: undefined,
  });

  const hasFilter = [
    params.category_ids?.length,
    params.status,
    params.stock_status,
    params.collection_ids?.length,
    params.brand_ids?.length,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      category_ids: params.category_ids || [],
      status: (params.status as string) || 'all',
      stock_status: params.stock_status || '',
      collection_ids: params.collection_ids?.[0],
      brand_ids: params.brand_ids?.[0],
    });
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string | number | Array<string | number>,
    filterName: keyof LocalFilterState,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleOnApplyFilter = () => {
    setParams({
      category_ids: filterObject.category_ids.length
        ? filterObject.category_ids
        : undefined,
      status:
        filterObject.status && filterObject.status !== 'all'
          ? filterObject.status
          : undefined,
      stock_status: filterObject.stock_status || undefined,
      collection_ids: filterObject.collection_ids
        ? [filterObject.collection_ids]
        : undefined,
      brand_ids: filterObject.brand_ids ? [filterObject.brand_ids] : undefined,
    });
    handleFilterClose();
  };

  const handleFilterClose = () => {
    setFilterObject({
      category_ids: [],
      status: 'all',
      stock_status: '',
      collection_ids: undefined,
      brand_ids: undefined,
    });
    setOpenPopup(false);
  };

  return (
    <>
      <Flex>
        <Button
          type="outlined"
          size="small"
          text={__('Filter', 'kirki-ecommerce')}
          leftIcon={<ListFilter />}
          style={{
            borderRightColor: hasFilter ? 'none' : 'var(--decom-border-border)',
            borderRadius: hasFilter
              ? 'var(--decom-radius-rounded-md) var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md)'
              : 'var(--decom-radius-rounded-md)',
          }}
          onClick={() => setOpenPopup((prev) => !prev)}
          ref={popoverRef}
          {...buttonProps}
        />
        {hasFilter ? (
          <Button
            type="outlined"
            size="small"
            style={{
              color: 'var(--decom-text-text-emphasis)',
              backgroundColor: 'var(--decom-background-bg-fill-secondary)',
              borderLeft: 'none',
              cursor: 'default',
              borderRadius:
                'var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md) var(--decom-radius-rounded-none)',
            }}
            text={sprintf(__('%d', 'kirki-ecommerce'), hasFilter)}
          />
        ) : null}
      </Flex>
      <DropdownMenuContent
        isOpen={openPopup}
        triggerRef={popoverRef}
        onClose={handleFilterClose}
        style={{ width: '288px', maxHeight: '522px' }}
      >
        <Flex
          style={{
            top: '-4px',
            position: 'sticky',
            backgroundColor: 'white',
            padding: '12px 12px 8px 12px',
            zIndex: '100',
          }}
        >
          <Text header={__('Filter', 'kirki-ecommerce')} />
          <ActionGroup>
            <Button
              icon={<CloseIcon />}
              type="blank"
              onClick={handleFilterClose}
              style={{ color: 'var(--decom-text-text-primary)' }}
            />
          </ActionGroup>
        </Flex>

        <Flex
          direction="column"
          gap={16}
          style={{
            padding: '8px 12px',
            overflowY: 'auto',
            minHeight: '400px',
          }}
        >
          <CategoriesFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'category_ids')}
          />
          <RadioGroup
            optionsArray={[
              { value: 'published', title: __('Published', 'kirki-ecommerce') },
              { value: 'draft', title: __('Draft', 'kirki-ecommerce') },
              { value: 'all', title: __('All', 'kirki-ecommerce') },
            ]}
            defaultValue="all"
            value={filterObject.status || 'all'}
            onChange={(val) => handleOnFilterChange(val, 'status')}
            label={__('Status', 'kirki-ecommerce')}
          />
          <Select
            label={__('Inventory', 'kirki-ecommerce')}
            value={filterObject.stock_status}
            defaultValue="true"
            optionsArray={[
              { value: 'in_stock', title: __('In stock', 'kirki-ecommerce') },
              { value: 'out_of_stock', title: __('Out of stock', 'kirki-ecommerce') },
            ]}
            onChange={(val) => handleOnFilterChange(val, 'stock_status')}
          />
          <CollectionFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'collection_ids')}
          />
          <BrandFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'brand_ids')}
          />
        </Flex>

        <Flex
          style={{
            padding: '8px 12px 12px 12px',
            borderTop: '1px solid #E4E3E9',
            bottom: '-4px',
            position: 'sticky',
            backgroundColor: 'white',
          }}
        >
          <ActionGroup>
            <Button
              type="primary"
              text={__('Apply Filter', 'kirki-ecommerce')}
              size="small"
              onClick={handleOnApplyFilter}
            />
          </ActionGroup>
        </Flex>
      </DropdownMenuContent>
    </>
  );
};

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
