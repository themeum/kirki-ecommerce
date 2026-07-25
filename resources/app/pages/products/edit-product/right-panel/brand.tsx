import { css } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Combobox from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import { MinusIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import type { ProductRightPanelFormValues } from '@/schemas/forms/product-right-panel-form';
import { useBrandsQuery } from '@/services/brand';
import { cardStyles } from '@/theme/card-styles';
import type { Brand as BrandEntity, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-dialog';

type BrandSuggestion = SelectOption & BrandEntity;

/**
 * Product brand picker using Combobox with creatable support.
 *
 * @returns Brand panel element.
 * @since 1.0.0
 */
const Brand = () => {
  const { watch, setValue } = useFormContext<ProductRightPanelFormValues>();
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
          <Card css={cardStyles.innerCard}>
            <CardContent css={cardStyles.innerContent}>
              <Flex gap={2} align="center">
                <Thumbnail src={brandLogo?.url} />
                <Text variant="small">{productBrand?.name}</Text>
                <ActionGroup css={css({ cursor: 'pointer' })}>
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

