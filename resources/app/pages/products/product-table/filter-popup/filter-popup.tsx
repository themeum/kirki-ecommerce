import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { CloseIcon, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import { DropdownMenuContent } from '@/molecules/dropdown';
import Flex from '@/molecules/flex';
import { RadioGroup } from '@/molecules/radio-group';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue } from '@/store/productsSlice';
import { __, sprintf } from '@/wpi18n';

import BrandFilter from '@/pages/products/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/pages/products/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/pages/products/product-table/filter-popup/collection-filter';

type ProductFilterState = {
  category_ids?: number[] | string;
  status?: string;
  inventory_type?: string;
  collection_id?: string | number;
  brand_id?: string | number;
  [key: string]: unknown;
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
  const dispatch = useAppDispatch();
  const popoverRef = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<ProductFilterState>({});
  const { loaded, filter: filterData } = useAppSelector((state) => state.products);
  const hasFilter = Object.keys(filterData || {}).length;

  useEffect(() => {
    const { category_ids } = (filterData || {}) as ProductFilterState;

    if (category_ids) {
      const idArray = String(category_ids)
        .split(',')
        .map(Number);
      setFilterObject({
        ...(filterData as ProductFilterState),
        category_ids: idArray,
      });
    } else {
      setFilterObject((filterData || {}) as ProductFilterState);
    }
  }, [loaded, filterData, openPopup]);

  const handleOnFilterChange = (
    val: string | number | Array<string | number>,
    filterName: string,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleOnApplyFilter = () => {
    const formattedData: ProductFilterState = { ...filterObject };
    Object.keys(filterObject).forEach((key) => {
      const value = formattedData[key];
      if (
        value === 'all' ||
        value === 'none' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value.length === 0)
      ) {
        delete formattedData[key];
      }
    });
    if (filterObject?.category_ids) {
      if (
        Array.isArray(filterObject.category_ids) &&
        filterObject.category_ids.length > 0
      ) {
        formattedData.category_ids = filterObject.category_ids.join(',');
      }
    }

    dispatch(setKeyValue({ key: 'filter', value: formattedData }));
    handleFilterClose();
  };

  const handleFilterClose = () => {
    setFilterObject({});
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
        {Object.keys(filterData || {}).length ? (
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
            text={sprintf(__('%d', 'kirki-ecommerce'), Object.keys(filterData || {}).length)}
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
            value={filterObject?.status || 'all'}
            onChange={(val) => handleOnFilterChange(val, 'status')}
            label={__('Status', 'kirki-ecommerce')}
          />
          <Select
            label={__('Inventory', 'kirki-ecommerce')}
            value={filterObject?.inventory_type}
            defaultValue="true"
            optionsArray={[
              { value: 'in_stock', title: __('In stock', 'kirki-ecommerce') },
              { value: 'out_of_stock', title: __('Out of stock', 'kirki-ecommerce') },
            ]}
            onChange={(val) => handleOnFilterChange(val, 'inventory_type')}
          />
          <CollectionFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'collection_id')}
          />
          <BrandFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'brand_id')}
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

export default FilterPopup;
