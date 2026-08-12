import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { pickFormValues } from '@/libs/zod';
import type { Brand } from '@/schemas/catalog/brand';
import {
  type BrandFormInput,
  type BrandFormPayload,
  BrandFormSchema,
} from '@/schemas/forms/brand-form';
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brand';
import { cardStyles } from '@/theme/card-styles';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type BrandAddEditPopoverProps = {
  brand: Brand | BrandFormInput;
  onClose?: () => void;
};

const getInitialLogoUrl = (brand: Brand | BrandFormInput) => {
  const logo = brand.logo && typeof brand.logo === 'object' ? brand.logo : null;
  return logo?.url || null;
};

const BrandAddEditPopover = ({
  brand,
  onClose = noop,
}: BrandAddEditPopoverProps) => {
  const createMutation = useCreateBrandMutation();
  const updateMutation = useUpdateBrandMutation();
  const brandId = 'id' in brand ? brand.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [imageUrl, setImageUrl] = useState<string | null>(
    getInitialLogoUrl(brand),
  );

  const form = useForm<BrandFormInput, unknown, BrandFormPayload>({
    resolver: zodResolver(BrandFormSchema),
    defaultValues: pickFormValues(BrandFormSchema, brand),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = async (payload: BrandFormPayload) => {
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
              <Flex direction="column" gap={4}>
                <Card cssOverride={cardStyles.lightCard}>
                  <CardContent>
                    <Flex direction="column" gap={4}>
                      <TextField
                        name="name"
                        label={__('Name', 'kirki-ecommerce')}
                        placeholder={__('e.g., apple', 'kirki-ecommerce')}
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
