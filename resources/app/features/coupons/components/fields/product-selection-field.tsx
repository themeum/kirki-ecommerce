import { Cross2Icon } from '@radix-ui/react-icons';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { SelectProductsDialog } from '@/features/products';
import { ProductIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const COLUMN_COUNT = 2;

const isInLastRow = (index: number, total: number) =>
  index >= total - (total % COLUMN_COUNT === 0 ? COLUMN_COUNT : total % COLUMN_COUNT);

const ProductSelectionField = () => {
  const { control } = useFormContext<CouponFormInput>();
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  return (
    <Controller
      control={control}
      name="products"
      render={({ field, fieldState }) => {
        const selectedProducts = field.value ?? [];

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            {selectedProducts.length === 0 ? (
              <Card
                cssOverride={mergeCss(
                  cardStyles.formCard,
                  styles.emptyCard,
                  fieldState.invalid && styles.emptyError,
                )}
              >
                <CardContent>
                  <Flex direction="column" gap={3} align="center" justify="center">
                    <ProductIcon />
                    <Button variant="secondary" onClick={() => setProductPickerOpen(true)}>
                      <PlusIcon />
                      <Text variant="small" weight="medium">
                        {__('Select Products', 'kirki-ecommerce')}
                      </Text>
                    </Button>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <Flex direction="column" gap={3}>
                <Card
                  cssOverride={mergeCss(
                    styles.listCard,
                    fieldState.invalid ? styles.listCardInvalid : {},
                  )}
                >
                  <div css={styles.grid}>
                    {selectedProducts.map((product, index) => (
                      <div
                        key={product.productId}
                        css={scoped(
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
                              selectedProducts.filter(
                                (item) => item.productId !== product.productId,
                              ),
                            )
                          }
                        >
                          <Cross2Icon />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
                <Button
                  variant="outline"
                  cssOverride={styles.addMoreButton}
                  onClick={() => setProductPickerOpen(true)}
                >
                  <PlusIcon />
                  <Text variant="small" weight="medium">
                    {__('Add More', 'kirki-ecommerce')}
                  </Text>
                </Button>
              </Flex>
            )}

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

            <SelectProductsDialog
              open={productPickerOpen}
              onOpenChange={setProductPickerOpen}
              onAdd={(selections) => {
                field.onChange(selections);
                setProductPickerOpen(false);
              }}
              selectedProducts={selectedProducts}
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
    backgroundColor: theme.colors.background.surfaceAlt,
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
  addMoreButton: {
    width: '100%',
    gap: theme.spacing[2],
  },
});
