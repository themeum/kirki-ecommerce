import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Combobox from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import type { Brand as BrandEntity } from '@/features/brands';
import { BrandAddEditPopover, useBrandsQuery } from '@/features/brands';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { MinusIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

type BrandSuggestion = SelectOption & BrandEntity;

const Brand = () => {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const productBrand = watch('brand');
  const { data: brandData } = useBrandsQuery({ limit: -1 });
  const [suggestionArray, setSuggestionArray] = useState<BrandSuggestion[]>(
    [],
  );
  const [openBrandCreatePopup, setOpenBrandCreatePopup] = useState(false);
  const [brandTitle, setBrandTitle] = useState('');

  useEffect(() => {
    const suggestionList = brandData?.results.map((item) => ({
      value: item.id,
      title: item.name,
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      count: item.count,
      logo: item.logo,
    }));
    setSuggestionArray(suggestionList ?? []);
  }, [productBrand, brandData]);

  const comboboxOptions = useMemo(
    () =>
      suggestionArray.map((item) => ({
        label: item.title,
        value: String(item.value),
      })),
    [suggestionArray],
  );

  const handleRemoveBrand = () => {
    setValue('brand', null, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddBrand = (brandValue: string) => {
    const suggestion = suggestionArray.find(
      (item) => String(item.value) === brandValue,
    );
    if (!suggestion) {
      return;
    }

    setValue(
      'brand',
      {
        id: suggestion.id,
        name: suggestion.name,
        logo:
          suggestion.logo && typeof suggestion.logo === 'object'
            ? suggestion.logo
            : null,
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleAddNewBrand = (searchText: string) => {
    setBrandTitle(searchText);
    setOpenBrandCreatePopup(true);
  };

  const brandLogo =
    productBrand?.logo && typeof productBrand.logo === 'object'
      ? productBrand.logo
      : null;

  return (
    <>
      {productBrand?.id ? (
        <Field>
          <FieldLabel>{__('Brand', 'kirki-ecommerce')}</FieldLabel>
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Flex gap={2} align="center">
                <Thumbnail src={brandLogo?.url} />
                <Text variant="small">{productBrand?.name}</Text>
                <ActionGroup cssOverride={{ cursor: 'pointer' }}>
                  <Button
                    variant="ghost"
                    onClick={handleRemoveBrand}
                  >
                    <MinusIcon />
                  </Button>
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
        </Field>
      ) : (
        <Field>
          <FieldLabel>{__('Brand', 'kirki-ecommerce')}</FieldLabel>
          <Combobox
            options={comboboxOptions}
            placeholder={__('Search or Add Brand', 'kirki-ecommerce')}
            searchPlaceholder={__('Search or Add Brand', 'kirki-ecommerce')}
            creatable
            addItemLabel={__('Add Brand', 'kirki-ecommerce')}
            onChange={(nextValue) => handleAddBrand(String(nextValue))}
            onAddItem={handleAddNewBrand}
          />
        </Field>
      )}
      {openBrandCreatePopup && (
        <BrandAddEditPopover
          brand={{ name: brandTitle }}
          onClose={() => setOpenBrandCreatePopup(false)}
        />
      )}
    </>
  );
};

Brand.displayName = 'Brand';

export default Brand;

