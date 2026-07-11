import { useState } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import { BrandIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  addBrandAPI,
  setKeyValue,
  updateBrand,
  updateBrandAPI,
} from '@/store/brandsSlice';
import { useAppDispatch } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { Brand, BrandFormData, FormErrors, MediaChangePayload } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type BrandAddEditPopoverProps = {
  brand: Brand | BrandFormData;
  onClose?: () => void;
};

const BrandAddEditPopover = ({
  brand,
  onClose = () => {},
}: BrandAddEditPopoverProps) => {
  const dispatch = useAppDispatch();
  const logo =
    brand.logo && typeof brand.logo === 'object' ? brand.logo : null;
  const [imageUrl, setImageUrl] = useState<string | null>(logo?.url || null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [brandFormData, setBrandFormData] =
    useState<BrandFormData & { id?: number }>(brand);

  const handleOnChange = (data: unknown, fieldName: string) => {
    setBrandFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleMediaChange = (img: MediaChangePayload | MediaChangePayload[]) => {
    const media = img as MediaChangePayload;
    setImageUrl(media?.url ?? null);
    setBrandFormData((prev) => ({
      ...prev,
      logo: media?.id,
    }));
  };

  const handleAddOrUpdateBrand = async () => {
    let result = {} as Awaited<ReturnType<typeof addBrandAPI>>;
    if (brandFormData.id) {
      console.log(brandFormData);
      result = await updateBrandAPI(brandFormData.id, brandFormData);
    } else {
      console.log(brandFormData);
      result = await addBrandAPI(brandFormData);
    }
    if (isApiSuccess(result)) {
      if (brandFormData.id) {
        console.log(result);
        dispatch(updateBrand(result.data));
      } else {
        dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      }
      onClose();
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  return (
    <Popover isOpen={true} onClose={onClose}>
      <PopoverHeader
        onClose={onClose}
        leftIcon={<BrandIcon />}
        style={{ borderBottom: '1px solid #E4E3E9' }}
      >
        <Text
          type="primary"
          header={
            brandFormData.id
              ? __('Edit Brand', 'kirki-ecommerce')
              : __('New Brand', 'kirki-ecommerce')
          }
        />
      </PopoverHeader>
      <PopoverBody>
        <Flex direction="column" gap={16}>
          <Card type="light">
            <Flex direction="column" gap={16}>
              <Input
                label={__('Name', 'kirki-ecommerce')}
                placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
                value={brandFormData.name as string}
                onChange={(value) => handleOnChange(value, 'name')}
                error={errors.name as string | boolean | undefined}
              />
              <Input
                label={__('Slug', 'kirki-ecommerce')}
                placeholder={__('e.g., fund-raising', 'kirki-ecommerce')}
                value={brandFormData.slug as string}
                onChange={(value) => handleOnChange(value, 'slug')}
                error={errors.slug as string | boolean | undefined}
              />
              <Input
                label={__('Description', 'kirki-ecommerce')}
                multiline={2}
                style={{ padding: '8px 12px' }}
                placeholder={__(
                  'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                  'kirki-ecommerce',
                )}
                value={brandFormData.description as string}
                onChange={(value) => handleOnChange(value, 'description')}
                error={errors.description as string | boolean | undefined}
              />
              <ThumbnailSelector
                src={imageUrl ?? undefined}
                label={__('Thumb', 'kirki-ecommerce')}
                error={errors.logo as string | boolean | undefined}
                onChange={(img) => handleMediaChange(img)}
              />
            </Flex>
          </Card>
        </Flex>
      </PopoverBody>
      <PopoverFooter>
        <Button
          type="outlined"
          text={__('Cancel', 'kirki-ecommerce')}
          onClick={onClose}
        />
        <Button
          type="primary"
          text={
            brandFormData.id
              ? __('Save', 'kirki-ecommerce')
              : __('Add', 'kirki-ecommerce')
          }
          onClick={handleAddOrUpdateBrand}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default BrandAddEditPopover;
