import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import {
  BrandFormSchema,
  type BrandFormValues,
} from '@/schemas/forms/brand-form';
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brand';
import type { Brand, BrandFormData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

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
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {brandId
              ? __('Edit Brand', 'kirki-ecommerce')
              : __('New Brand', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogBody>
              <Flex direction="column" gap={16}>
                <Card css={styles.lightCard}>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </Flex>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {brandId
                  ? __('Save', 'kirki-ecommerce')
                  : __('Add', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

BrandAddEditPopover.displayName = 'BrandAddEditPopover';

export default BrandAddEditPopover;

const styles = {
  lightCard: scoped({
    borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
};
