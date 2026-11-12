import type { CSSObject } from '@emotion/react';
import { Minus } from 'lucide-react';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import CategoryTree from '@/components/ui/category-tree/category-tree';
import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import { filterCategoryTree, toggleCategorySelection } from '@/components/ui/category-tree/utils';
import Chip from '@/components/ui/chip/chip';
import ChipInput from '@/components/ui/chip/chip-input';
import { chipsInputControlCss } from '@/components/ui/chip/chip-input-styles';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, itemCenter, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CategoriesDropdownFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TCategory extends CategoryTreeItem = CategoryTreeItem,
> = {
  name: TName;
  categories: TCategory[];
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  selectAllLabel?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const CategoriesDropdownField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TCategory extends CategoryTreeItem = CategoryTreeItem,
>({
  name,
  categories,
  label,
  description,
  infoText,
  placeholder = __('Search categories..', 'kirki-ecommerce'),
  selectAllLabel = __('All Categories', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: CategoriesDropdownFieldProps<TFieldValues, TName, TCategory>) => {
  const { control } = useFormContext<TFieldValues>();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const fieldRef = useRef<HTMLDivElement>(null);

  const visibleCategories = useMemo(
    () => filterCategoryTree(categories, search) as TCategory[],
    [categories, search],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = (field.value ?? []) as TCategory[];
        const selectedIds = selected.map((category) => category.id);

        const applyIds = (ids: number[]) => {
          field.onChange(categories.filter((category) => ids.includes(category.id)));
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverAnchor asChild>
                <ChipInput
                  ref={fieldRef}
                  error={Boolean(fieldState.error)}
                  disabled={disabled}
                  maxVisibleRows={2}
                  control={
                    <div css={scoped(styles.control)}>
                      <Input
                        value={search}
                        placeholder={
                          selectedIds.length > 0 ? __('Add more', 'kirki-ecommerce') : placeholder
                        }
                        disabled={disabled}
                        cssOverride={mergeCss(chipsInputControlCss, styles.input)}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setIsOpen(true);
                        }}
                        onClick={() => {
                          if (!disabled) {
                            setIsOpen(true);
                          }
                        }}
                      />
                    </div>
                  }
                  chips={
                    selected.length > 0
                      ? selected.map((category) => (
                          <Chip
                            key={category.id}
                            text={category.name}
                            closeIcon={<Minus size={14} aria-hidden="true" />}
                            onRemove={() => {
                              applyIds(
                                toggleCategorySelection(categories, selectedIds, category, false),
                              );
                            }}
                          />
                        ))
                      : undefined
                  }
                />
              </PopoverAnchor>
              <PopoverContent
                align="start"
                sideOffset={4}
                cssOverride={styles.content}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={(event) => {
                  if (fieldRef.current?.contains(event.target as Node)) {
                    event.preventDefault();
                  }
                }}
              >
                {visibleCategories.length > 0 ? (
                  <CategoryTree
                    categories={visibleCategories}
                    value={selectedIds}
                    onChange={applyIds}
                    selectAllLabel={selectAllLabel}
                    showSelectAll={search.trim().length === 0}
                  />
                ) : (
                  <div css={scoped(styles.empty)}>
                    <Text variant="small" color="secondary">
                      {__('No categories found.', 'kirki-ecommerce')}
                    </Text>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

CategoriesDropdownField.displayName = 'CategoriesDropdownField';

export default CategoriesDropdownField;

const styles = defineStyles({
  control: {
    ...itemCenter(),
    width: '100%',
  },
  input: {
    flex: 1,
  },
  chevron: {
    ...itemCenter(),
    flexShrink: 0,
    paddingRight: theme.spacing[3],
    color: theme.colors.icon.primary,
  },
  content: {
    width: 'var(--radix-popover-trigger-width)',
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: 0,
    overflow: 'hidden',
  },
  empty: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
});
