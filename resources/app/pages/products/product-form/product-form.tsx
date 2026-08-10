import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import MediaGalleryField from '@/components/form/media-gallery-field';
import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import PageHeading from '@/components/ui/page-heading';
import { Separator } from '@/components/ui/separator';
import { RouteConfig } from '@/config/route-config';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { setUnsavedDataStatus } from '@/libs/unsaved-store';
import { getDefaults } from '@/libs/zod';
import {
  getDefaultVariantValues,
  ProductFormSchema,
  type ProductFormInput,
  type ProductFormPayload,
} from '@/schemas/forms/product-form';
import { getErrorMessage } from '@/services/helpers';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import UnsavedToast from '@/pages/products/product-form/unsaved-toast';
import { useUnsavedNavigationGuard } from '@/pages/products/product-form/use-unsaved-navigation-guard';

import AdditionalInfo from '@/pages/products/product-form/sections/additional-info/additional-info';
import Inventory from '@/pages/products/product-form/sections/inventory/inventory';
import Price from '@/pages/products/product-form/sections/price/price';
import RightPanel from '@/pages/products/product-form/sections/right-panel/right-panel';
import SEOSettings from '@/pages/products/product-form/sections/seo-settings/seo-settings';
import Shipping from '@/pages/products/product-form/sections/shipping/shipping';
import Variants from '@/pages/products/product-form/sections/variants/variants';

type ProductFormProps = {
  mode: 'create' | 'edit';
  initialValues?: ProductFormInput;
  onSubmit: (data: ProductFormPayload) => Promise<ProductFormInput | void>;
  isSubmitting?: boolean;
};

type SaveResult = {
  success?: boolean;
};

type HandleSaveOptions = {
  focusOnError?: boolean;
};

const ProductForm = ({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
}: ProductFormProps) => {
  const navigate = useNavigate();
  const isCreate = mode === 'create';

  const form = useForm<ProductFormInput, unknown, ProductFormPayload>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues:
      initialValues ?? {
        ...getDefaults(ProductFormSchema),
        variants: [getDefaultVariantValues()],
      },
  });

  const hasVariants = useWatch({ control: form.control, name: 'has_variants' });
  const attributeValues = useWatch({
    control: form.control,
    name: 'variants.0.attribute_values',
  });

  const showSimpleVariantSections =
    !hasVariants ||
    !attributeValues ||
    (Array.isArray(attributeValues) && attributeValues.length === 0);

  const { isDirty } = form.formState;

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
    return () => setUnsavedDataStatus(false);
  }, [isDirty]);

  const { isBlocked, discardChanges, markSaving, shakeSignal } =
    useUnsavedNavigationGuard(isDirty);

  const handleSave = async ({
    focusOnError = true,
  }: HandleSaveOptions = {}): Promise<SaveResult> => {
    let success = false;

    markSaving(true);
    try {
      await form.handleSubmit(async (payload) => {
        try {
          const result = await onSubmit(payload);
          if (result) {
            form.reset(result);
          }
          success = true;
        } catch (error) {
          const unmatchedMessages: string[] = [];
          const { matchedFields } = applyServerErrors(
            form,
            error as ErrorResponse,
            {
              onUnmatched: (leftovers) => {
                unmatchedMessages.push(...Object.values(leftovers));
              },
            },
          );

          toast.error(
            [getErrorMessage(error), ...unmatchedMessages].join(' '),
          );

          if (focusOnError && matchedFields[0]) {
            form.setFocus(matchedFields[0] as FieldPath<ProductFormInput>);
          }

          success = false;
        }
      })();
    } finally {
      markSaving(false);
    }

    return { success };
  };

  return (
    <Form {...form}>
      <PageHeading
        onBack={() => navigate(RouteConfig.Products.buildLink())}
        text={
          isCreate
            ? __('New Product', 'kirki-ecommerce')
            : __('Edit Product', 'kirki-ecommerce')
        }
        hasBack
        sticky
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => navigate(RouteConfig.Products.buildLink())}
              disabled={isSubmitting}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave()}
              loading={isSubmitting}
            >
              {isCreate
                ? __('Create', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          <div style={{ width: '70%' }}>
            <Flex direction="column" gap={4}>
              <Card cssOverride={cardStyles.formCard}>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <Grid gap={3} template={'2fr 1fr'}>
                      <TextField
                        name="title"
                        label={__('Title', 'kirki-ecommerce')}
                        placeholder={__(
                          'e.g. Yellow T-Shirt',
                          'kirki-ecommerce',
                        )}
                      />
                      <TextField
                        name="ribbon"
                        label={__('Ribbon', 'kirki-ecommerce')}
                        placeholder={__(
                          'e.g. Fresh Arrival',
                          'kirki-ecommerce',
                        )}
                      />
                    </Grid>
                    <TextField
                      name="slug"
                      label={__('Slug', 'kirki-ecommerce')}
                      placeholder={__('yellow-t-shirt', 'kirki-ecommerce')}
                    />
                    <MediaGalleryField
                      name="media"
                      label={__('Images and videos', 'kirki-ecommerce')}
                    />
                    <TextareaField
                      name="short_description"
                      label={__('Short description', 'kirki-ecommerce')}
                      rows={3}
                      placeholder={__(
                        'Brief product summary...',
                        'kirki-ecommerce',
                      )}
                    />
                    <RichTextField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      placeholder={__(
                        'Write product description here...',
                        'kirki-ecommerce',
                      )}
                    />
                    <Separator marginTop={0} marginBottom={0} />
                    <AdditionalInfo />
                  </Flex>
                </CardContent>
              </Card>
              {showSimpleVariantSections && (
                <>
                  <Price />
                  <Inventory />
                  <Shipping />
                </>
              )}
              <Variants />
              <SEOSettings />
            </Flex>
          </div>
          <RightPanel />
        </div>
      </Container>
      <UnsavedToast
        visible={isBlocked && isDirty}
        onDiscardChanges={discardChanges}
        onSave={() => handleSave()}
        isSubmitting={isSubmitting}
        shakeSignal={shakeSignal}
      />
    </Form>
  );
};

ProductForm.displayName = 'ProductForm';

export default ProductForm;
