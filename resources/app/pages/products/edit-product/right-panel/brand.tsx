import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { MinusIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import Searchbox from '@/molecules/searchbox';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import type { ProductRightPanelFormValues } from '@/schemas/forms/product-right-panel-form';
import { useBrandsQuery } from '@/services/brand';
import type { Brand as BrandEntity, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-popover';

type BrandSuggestion = SelectOption & BrandEntity;

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

  const handleSearchChange = (searchText: string) => {
    setBrandTitle(String(searchText));
  };

  const handleRemoveBrand = () => {
    setValue('brand', null, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddBrand = (brand: SelectOption) => {
    const suggestion = suggestionArray.find((item) => item.value === brand.value);
    setValue(
      'brand',
      suggestion
        ? {
            id: suggestion.id,
            name: suggestion.name,
            logo:
              suggestion.logo && typeof suggestion.logo === 'object'
                ? suggestion.logo
                : null,
          }
        : {
            id: Number(brand.value),
            name: brand.title,
            logo: null,
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
        <Flex direction="column" gap={8}>
          <Label
            text={__('Brand', 'kirki-ecommerce')}
            helpText={__('Brand', 'kirki-ecommerce')}
          />
          <Card type="inner">
            <Flex gap={8} style={{ alignItems: 'center' }}>
              <Thumbnail src={brandLogo?.url} />
              <Text type="xsm" header={productBrand?.name} />
              <ActionGroup style={{ cursor: 'pointer' }}>
                <Button
                  type="ghost"
                  size="small"
                  icon={<MinusIcon />}
                  onClick={handleRemoveBrand}
                />
              </ActionGroup>
            </Flex>
          </Card>
        </Flex>
      ) : (
        <Searchbox
          value={brandTitle}
          label={__('Brand', 'kirki-ecommerce')}
          helpText={__('Brand', 'kirki-ecommerce')}
          placeholder={__('Search or Add Brand', 'kirki-ecommerce')}
          suggestionArray={suggestionArray || []}
          onChange={(searchText) => handleSearchChange(String(searchText))}
          onEnter={(value) => handleAddNewBrand(String(value))}
          onOptionClick={(brand) => handleAddBrand(brand)}
        />
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
