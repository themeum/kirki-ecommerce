import { Cross2Icon } from '@radix-ui/react-icons';
import { PlusIcon } from 'lucide-react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  useWatch,
} from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import SelectProductsDialog from '@/features/products/components/shared/select-products-dialog';
import type { ProductSelection } from '@/features/products/schemas/catalog/product-selection';
import { ProductIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scopedMerge } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __, _n, sprintf } from '@/wpi18n';

const COLUMN_COUNT = 2;

const isInLastRow = (index: number, total: number) =>
  index >= total - (total % COLUMN_COUNT === 0 ? COLUMN_COUNT : total % COLUMN_COUNT);

type ProductSelectionFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = {
  name: TName;
  control: Control<TFieldValues, unknown, TTransformedValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ProductSelectionField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  name,
  control,
  open,
  onOpenChange,
}: ProductSelectionFieldProps<TFieldValues, TName, TTransformedValues>) => {
  const watchedValue = useWatch({ control, name });
  const selectedProducts = watchedValue as unknown as ProductSelection[] | null | undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            {!isDefined(selectedProducts) || selectedProducts.length === 0 ? (
              <Card
                cssOverride={mergeCss(
                  cardStyles.formCard,
                  styles.emptyCard,
                  fieldState.invalid && styles.emptyError,
                )}
                noShadow
              >
                <CardContent>
                  <Flex direction="column" gap={3} align="center" justify="center">
                    <ProductIcon />
                    <Button variant="secondary" onClick={() => onOpenChange(true)}>
                      <PlusIcon />
                      <Text variant="small" weight="medium">
                        {__('Select Products', 'kirki-ecommerce')}
                      </Text>
                    </Button>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <Card
                cssOverride={mergeCss(
                  styles.listCard,
                  fieldState.invalid ? styles.listCardInvalid : {},
                )}
                noShadow
              >
                <div css={styles.grid}>
                  {selectedProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      css={scopedMerge(
                        styles.cell,
                        isInLastRow(index, selectedProducts.length) ? styles.cellLastRow : {},
                      )}
                    >
                      <Flex gap={3} align="center">
                        <Image
                          size="sm"
                          src={product.thumbnail}
                          alt={product.productTitle}
                          cssOverride={{ height: '2.5rem', width: '2.5rem' }}
                        />
                        <Flex direction="column" gap={1}>
                          <Text variant="small">{product.productTitle}</Text>
                          <Text variant="small" color="secondary">
                            {product.variants.length > 1
                              ? sprintf(
                                  /* translators: %d: number of variants */
                                  _n(
                                    '%d variant',
                                    '%d variants',
                                    product.variants.length,
                                    'kirki-ecommerce',
                                  ),
                                  product.variants.length,
                                )
                              : product.variants[0]?.variantLabel}
                          </Text>
                        </Flex>
                      </Flex>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        cssOverride={styles.removeButton}
                        aria-label={sprintf(
                          /* translators: %s: product title */
                          __('Remove %s', 'kirki-ecommerce'),
                          product.productTitle,
                        )}
                        onClick={() =>
                          field.onChange(
                            selectedProducts.filter((item) => item.productId !== product.productId),
                          )
                        }
                      >
                        <Cross2Icon />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

            <SelectProductsDialog
              open={open}
              onOpenChange={onOpenChange}
              onAdd={(selections) => {
                field.onChange(selections);
                onOpenChange(false);
              }}
              selectedProducts={selectedProducts ?? []}
              selectVariants={false}
            />
          </Field>
        );
      }}
    />
  );
};

ProductSelectionField.displayName = 'ProductSelectionField';

export default ProductSelectionField;

const styles = defineStyles({
  emptyError: {
    borderColor: theme.colors.border.critical,
  },
  emptyCard: {
    paddingBlock: theme.spacing[12],
    backgroundColor: theme.colors.background.surface,
  },
  listCard: {
    padding: theme.spacing[0],
    gap: theme.spacing[0],
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    borderRadius: theme.radius.md,
  },
  listCardInvalid: {
    borderColor: theme.colors.border.critical,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${COLUMN_COUNT}, minmax(0, 1fr))`,
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderBottom: `1px solid ${theme.colors.border.alt}`,
    '&:nth-of-type(odd)': {
      borderRight: `1px solid ${theme.colors.border.alt}`,
    },
    '&:hover, &:focus-within': {
      backgroundColor: theme.colors.background.surfaceAlt,
      button: {
        opacity: 1,
      },
    },
  },
  cellLastRow: {
    borderBottom: 'none',
  },
  removeButton: {
    opacity: 0,
    flexShrink: 0,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.sm,
  },
});
