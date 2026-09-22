import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import { BrandAddEditPopover, useBrandsQuery } from '@/features/brands';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { __ } from '@/wpi18n';

type ProductBrand = NonNullable<ProductFormInput['brand']>;

type BrandOption = MultiSelectOption & {
  logo: ProductBrand['logo'];
};

const toLogo = (logo: unknown): ProductBrand['logo'] =>
  logo && typeof logo === 'object' ? (logo as ProductBrand['logo']) : null;

/**
 * Image is rendered whether or not the brand has a logo — it falls back to
 * the shared placeholder, which keeps every name in the list starting at
 * the same place.
 */
const renderBrand = (option: BrandOption) => (
  <Flex gap={2} align="center">
    <Image src={option.logo} width={20} height={20} />
    {option.title}
  </Flex>
);

/**
 * Brand picker. A product has one brand, so this is the shared token box in
 * its single-selection mode: choosing replaces whatever was held, closes the
 * panel, and leaves one full-width chip in place of the text cursor.
 *
 * @returns Brand element.
 * @since 1.0.0
 */
const Brand = () => {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const productBrand = watch('brand');
  const { data: brandData } = useBrandsQuery({ limit: -1 });
  const [pendingName, setPendingName] = useState<string | null>(null);

  const options: BrandOption[] = useMemo(
    () =>
      (brandData?.results ?? []).map((brand) => ({
        value: brand.id,
        title: brand.name,
        logo: toLogo(brand.logo),
      })),
    [brandData],
  );

  // The form holds the brand itself; the component works in option arrays,
  // so a held brand is a one-element array on the way out and `next[0]` on
  // the way back.
  const selected: BrandOption[] = productBrand?.id
    ? [
        {
          value: productBrand.id,
          title: productBrand.name,
          logo: toLogo(productBrand.logo),
        },
      ]
    : [];

  const handleChange = (next: BrandOption[]) => {
    const option = next[0];

    setValue(
      'brand',
      option ? { id: Number(option.value), name: option.title, logo: option.logo } : null,
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <>
      <Field>
        <FieldLabel>{__('Brand', 'kirki-ecommerce')}</FieldLabel>
        <MultiSelect
          single
          options={options}
          value={selected}
          onChange={handleChange}
          renderOption={renderBrand}
          renderChip={renderBrand}
          onCreate={(query) => setPendingName(query)}
          placeholder={__('Add brand', 'kirki-ecommerce')}
          emptyText={__('No brands found.', 'kirki-ecommerce')}
        />
      </Field>
      {pendingName !== null && (
        <BrandAddEditPopover brand={{ name: pendingName }} onClose={() => setPendingName(null)} />
      )}
    </>
  );
};

Brand.displayName = 'Brand';

export default Brand;
