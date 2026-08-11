import { useMemo } from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import { useCategoriesQuery } from '@/services/category';
import { __ } from '@/wpi18n';

type FilterObject = {
  category_ids?: number[];
};

type CategoriesFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: number[]) => void;
};

const CategoriesFilter = ({
  filterObject,
  onChange = () => {},
}: CategoriesFilterProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });

  const options: MultiSelectOption[] = useMemo(
    () =>
      (categoriesData?.results ?? []).map((category) => ({
        value: category.id,
        title: category.name,
      })),
    [categoriesData],
  );

  const selectedIds = filterObject?.category_ids ?? [];
  const selected = options.filter((option) =>
    selectedIds.includes(Number(option.value)),
  );

  return (
    <Field>
      <FieldLabel>{__('Categories', 'kirki-ecommerce')}</FieldLabel>
      <MultiSelect
        options={options}
        value={selected}
        onChange={(next) => onChange(next.map((option) => Number(option.value)))}
        placeholder={__('Select Categories...', 'kirki-ecommerce')}
      />
    </Field>
  );
};

CategoriesFilter.displayName = 'CategoriesFilter';

export default CategoriesFilter;
