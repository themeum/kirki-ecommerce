import type { CSSObject } from '@emotion/react';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import { filterCategoryTree, getAncestors } from '@/components/ui/category-tree/utils';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import CategoryQuickCreate from '@/features/categories/components/fields/category-quick-create';
import type { Category } from '@/features/categories/schemas/catalog/category';
import { useCategoriesQuery } from '@/features/categories/services/category';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CategoryRef = {
  id: number;
  name: string;
  parent_id?: number | null;
};

type CategoryOption = MultiSelectOption & {
  depth: number;
  /** Ancestor names, root first, excluding the category itself. */
  path: string[];
};

type CategoriesFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const INDENT_PER_LEVEL_PX = 16;
const PATH_SEPARATOR = ' › ';

/**
 * Depth-first order with each node's depth and ancestor path recorded, so a
 * flat list of rows still reads as a tree.
 *
 * cmdk navigates a flat list of items, so the nesting lives in how the rows
 * are ordered and indented rather than in nested containers that would break
 * arrow-key order.
 *
 * @param categories Categories to arrange.
 * @param parentId Parent whose children to emit.
 * @param depth Depth of the current level.
 * @param path Ancestor names down to this level.
 *
 * @returns Options in tree order.
 */
const flattenTree = (
  categories: CategoryTreeItem[],
  parentId: number | null = null,
  depth = 0,
  path: string[] = [],
): CategoryOption[] =>
  categories
    .filter((category) => (category.parent_id ?? null) === parentId)
    .flatMap((category) => [
      { value: category.id, title: category.name, depth, path },
      ...flattenTree(categories, category.id, depth + 1, [...path, category.name]),
    ]);

/**
 * Category picker bound to react-hook-form. Owns the category list, the
 * tree's search and ordering, in-panel category creation, and the mapping
 * between the form's `{ id, name, parent_id }` refs and the multi-select's
 * option shape.
 *
 * Each checkbox stands alone: checking a parent does not reach its children
 * and unchecking a child does not reach its ancestors, so a chip always
 * means the merchant put that one category on the product.
 *
 * @param props Component props.
 *
 * @returns CategoriesField element.
 */
const CategoriesField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder = __('Search or add categories', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: CategoriesFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const { data: categoryData } = useCategoriesQuery({ limit: -1 });
  const [search, setSearch] = useState('');
  const [pendingName, setPendingName] = useState<string | null>(null);

  const categories = useMemo(() => categoryData?.results ?? [], [categoryData]);
  const isSearching = search.trim().length > 0;

  // Ancestors of a match are kept so a nested result still renders in its
  // place — which is why cmdk's own filtering is handed off here.
  const options = useMemo(
    () => flattenTree(filterCategoryTree(categories, search)),
    [categories, search],
  );

  // A selected category may be outside the filtered list, or newly created
  // and not yet refetched, so its path is resolved from the full list.
  const pathOf = (id: number): string[] => {
    const category = categories.find((item) => item.id === id);

    if (!category) {
      return [];
    }

    return getAncestors(categories, category)
      .reverse()
      .map((ancestor) => ancestor.name);
  };

  const toOption = (category: CategoryRef): CategoryOption => ({
    value: category.id,
    title: category.name,
    depth: 0,
    path: pathOf(category.id),
  });

  // The indent belongs to the row, not to the name: a name-only indent
  // leaves every checkbox in one column and the tree reads as a flat list.
  // Added to the row's own left padding rather than replacing it, and
  // dropped while searching, where the list is flat and each row carries
  // its path instead.
  const optionStyle = (option: CategoryOption): CSSProperties | undefined => {
    if (isSearching || option.depth === 0) {
      return undefined;
    }

    return {
      paddingLeft: `calc(${theme.spacing[2]} + ${option.depth * INDENT_PER_LEVEL_PX}px)`,
    };
  };

  const renderOption = (option: CategoryOption) => {
    if (!isSearching) {
      return option.title;
    }

    return (
      <span>
        {option.path.length > 0 && (
          <span css={scoped(styles.path)}>
            {option.path.join(PATH_SEPARATOR)}
            {PATH_SEPARATOR}
          </span>
        )}
        {option.title}
      </span>
    );
  };

  const renderChip = (option: CategoryOption) => (
    <span
      css={scoped(styles.chipLabel)}
      title={[...option.path, option.title].join(PATH_SEPARATOR)}
    >
      {option.path.length > 0 && (
        <span css={scoped(styles.path)}>
          {option.path.join(PATH_SEPARATOR)}
          {PATH_SEPARATOR}
        </span>
      )}
      {option.title}
    </span>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedCategories = (field.value ?? []) as CategoryRef[];

        const handleChange = (next: CategoryOption[]) => {
          field.onChange(
            next.map((option) => {
              const id = Number(option.value);
              const category = categories.find((item) => item.id === id);

              return {
                id,
                name: option.title,
                parent_id: category?.parent_id ?? null,
              };
            }),
          );
        };

        const handleCreated = (category: Category) => {
          field.onChange([
            ...selectedCategories,
            { id: category.id, name: category.name, parent_id: category.parent_id ?? null },
          ]);
          setPendingName(null);
          setSearch('');
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <MultiSelect
              options={options}
              value={selectedCategories.map(toOption)}
              onChange={handleChange}
              onSearchChange={setSearch}
              onCreate={(query) => setPendingName(query)}
              createEmptyLabel={__('New category', 'kirki-ecommerce')}
              panel={
                pendingName !== null ? (
                  <CategoryQuickCreate
                    initialName={pendingName}
                    onCancel={() => setPendingName(null)}
                    onCreated={handleCreated}
                  />
                ) : undefined
              }
              maxVisibleChips={1}
              renderOption={renderOption}
              optionStyle={optionStyle}
              renderChip={renderChip}
              placeholder={placeholder}
              selectedPlaceholder={__('Search', 'kirki-ecommerce')}
              emptyText={__('No matching categories', 'kirki-ecommerce')}
              disabled={disabled}
              error={Boolean(fieldState.error)}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

CategoriesField.displayName = 'CategoriesField';

export default CategoriesField;
export type { CategoriesFieldProps };

const styles = defineStyles({
  path: {
    color: theme.colors.text.subdued,
  },
  chipLabel: {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
