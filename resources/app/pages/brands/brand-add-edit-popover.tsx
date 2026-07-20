import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import { Form } from '@/components/ui/form';
import { BrandIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  BrandFormSchema,
  type BrandFormValues,
} from '@/schemas/forms/brand-form';
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brand';
import type { Brand, BrandFormData } from '@/types';
import { __ } from '@/wpi18n';

type BrandAddEditPopoverProps = {
  brand: Brand | BrandFormData;
  onClose?: () => void;
};

const getInitialLogoUrl = (brand: Brand | BrandFormData) => {
  const logo =
    brand.logo && typeof brand.logo === 'object' ? brand.logo : null;
  return logo?.url || null;
};

const getLogoId = (brand: Brand | BrandFormData) => {
  if (brand.logo && typeof brand.logo === 'object') {
    return brand.logo.id ?? null;
  }
  if (typeof brand.logo === 'number' || typeof brand.logo === 'string') {
    return brand.logo;
  }
  return null;
};

const BrandAddEditPopover = ({
  brand,
  onClose = () => {},
}: BrandAddEditPopoverProps) => {
  const createMutation = useCreateBrandMutation();
  const updateMutation = useUpdateBrandMutation();
  const brandId = 'id' in brand ? brand.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [imageUrl, setImageUrl] = useState<string | null>(
    getInitialLogoUrl(brand),
  );

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(BrandFormSchema),
    defaultValues: {
      name: brand.name ?? '',
      slug: brand.slug ?? '',
      description: brand.description ?? '',
      logo: getLogoId(brand),
    },
  });

  const handleSubmit = async (values: BrandFormValues) => {
    const payload: BrandFormData = {
      ...values,
      logo: values.logo ?? null,
    };

    try {
      if (brandId) {
        await updateMutation.mutateAsync({
          id: brandId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
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
            brandId
              ? __('Edit Brand', 'kirki-ecommerce')
              : __('New Brand', 'kirki-ecommerce')
          }
        />
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody>
          <Flex direction="column" gap={16}>
            <Card type="light">
              <Flex direction="column" gap={16}>
                <TextField
                  name="name"
                  label={__('Name', 'kirki-ecommerce')}
                  placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
                />
                <TextField
                  name="slug"
                  label={__('Slug', 'kirki-ecommerce')}
                  placeholder={__('e.g., fund-raising', 'kirki-ecommerce')}
                />
                <TextareaField
                  name="description"
                  label={__('Description', 'kirki-ecommerce')}
                  rows={2}
                  placeholder={__(
                    'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                    'kirki-ecommerce',
                  )}
                />
                <ThumbnailField
                  name="logo"
                  label={__('Thumb', 'kirki-ecommerce')}
                  valueAs="id"
                  previewUrl={imageUrl}
                  onPreviewChange={setImageUrl}
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
            state={isSubmitting ? 'disabled' : undefined}
          />
          <Button
            type="primary"
            text={
              brandId
                ? __('Save', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')
            }
            onClick={form.handleSubmit(handleSubmit)}
            state={isSubmitting ? 'loading' : undefined}
          />
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

BrandAddEditPopover.displayName = 'BrandAddEditPopover';

export default BrandAddEditPopover;
