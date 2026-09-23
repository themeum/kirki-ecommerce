import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import FloatingBar from '@/components/floating-bar/floating-bar';
import MediaGalleryField from '@/components/form/media-gallery-field';
import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Label from '@/components/ui/label';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { Separator } from '@/components/ui/separator';
import RightPanel from '@/features/products/components/product-form/sections/right-panel/right-panel';
import SEOSettings from '@/features/products/components/product-form/sections/seo-settings/seo-settings';
import Variants from '@/features/products/components/product-form/sections/variants/variants';
import VariantFieldScope from '@/features/products/components/variant-sections/field-scope';
import Inventory from '@/features/products/components/variant-sections/inventory/inventory';
import Price from '@/features/products/components/variant-sections/price/price';
import Shipping from '@/features/products/components/variant-sections/shipping/shipping';
import { useProductForm } from '@/features/products/hooks/use-product-form';
import type { Product } from '@/features/products/schemas/catalog/product';
import {
  type ProductFormInput,
  type ProductFormPayload,
} from '@/features/products/schemas/forms/product-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';
import { MinusCircle } from 'lucide-react';

const RIGHT_SIDE_PANEL_WIDTH = '320px';
const LEFT_SIDE_PANEL_WIDTH = '624px';

type ProductFormProps = {
  mode: 'create' | 'edit';
  initialValues?: ProductFormInput;
  product?: Product;
  onSubmit: (data: ProductFormPayload) => Promise<ProductFormInput | void>;
  isSubmitting?: boolean;
  onDuplicate?: () => void | Promise<void>;
  isDuplicating?: boolean;
};

const ProductForm = ({
  mode,
  initialValues,
  product,
  onSubmit,
  isSubmitting = false,
  onDuplicate,
  isDuplicating = false,
}: ProductFormProps) => {
  const isCreate = mode === 'create';
  const [duplicateBlockedByUnsaved, setDuplicateBlockedByUnsaved] = useState(false);

  const {
    form,
    showSimpleVariantSections,
    isDirty,
    isBlocked,
    discardChanges,
    shakeSignal,
    handleSave,
    generateSku,
    isGeneratingSku,
  } = useProductForm({
    initialValues,
    onSubmit,
  });

  const [openShortDescription, setOpenShortDescription] = useState(
    !!form.getValues('short_description'),
  );

  useEffect(() => {
    if (!isDirty) {
      setDuplicateBlockedByUnsaved(false);
    }
  }, [isDirty]);

  const navigate = useNavigate();
  const handleBack = () => {
    void navigate(-1);
  };

  const handleDuplicateClick = () => {
    if (isDirty) {
      setDuplicateBlockedByUnsaved(true);
      return;
    }
    void onDuplicate?.();
  };

  const handleBarDiscard = useCallback(() => {
    discardChanges();
    if (duplicateBlockedByUnsaved) {
      setDuplicateBlockedByUnsaved(false);
      void onDuplicate?.();
    }
  }, [discardChanges, duplicateBlockedByUnsaved, onDuplicate]);

  const handleBarSave = useCallback(async () => {
    const result = await handleSave();
    if (result.success && duplicateBlockedByUnsaved) {
      setDuplicateBlockedByUnsaved(false);
      void onDuplicate?.();
    }
  }, [duplicateBlockedByUnsaved, handleSave, onDuplicate]);

  return (
    <Page containerSize="lg">
      <Form {...form}>
        <PageHeading
          onBack={handleBack}
          sticky
          text={
            isCreate ? __('New Product', 'kirki-ecommerce') : __('Edit Product', 'kirki-ecommerce')
          }
          actions={
            <>
              <Button variant="tertiary" onClick={handleBack} disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={() => void handleBarSave()} loading={isSubmitting}>
                {isCreate ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
        />
        <PageContent>
          <Grid template={`${LEFT_SIDE_PANEL_WIDTH} ${RIGHT_SIDE_PANEL_WIDTH}`} gap={4}>
            <Flex direction="column" gap={4}>
              <Card cssOverride={cardStyles.formCard}>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <TextField
                      name="title"
                      label={__('Title', 'kirki-ecommerce')}
                      placeholder={__('e.g. Yellow T-Shirt', 'kirki-ecommerce')}
                    />

                    <RichTextField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      placeholder={__('Write product description here...', 'kirki-ecommerce')}
                    />

                    <MediaGalleryField name="media" label={__('Media', 'kirki-ecommerce')} />

                    <Separator negativeMargin={16} />

                    <Flex direction="column" gap={2}>
                      <Flex align="center" justify="space-between">
                        <Label>{__('Short description', 'kirki-ecommerce')}</Label>
                        <Button
                          variant="tertiary"
                          onClick={() => setOpenShortDescription(true)}
                          cssOverride={{
                            display: openShortDescription ? 'none' : 'flex',
                          }}
                        >
                          {__('Add', 'kirki-ecommerce')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setOpenShortDescription(false);
                            form.setValue('short_description', null, {
                              shouldDirty: true,
                            });
                          }}
                          cssOverride={{
                            display: !openShortDescription ? 'none' : 'flex',
                          }}
                        >
                          <MinusCircle color={theme.colors.icon.secondary} />
                        </Button>
                      </Flex>
                      {openShortDescription && (
                        <TextareaField
                          name="short_description"
                          rows={3}
                          placeholder={__('Brief product summary...', 'kirki-ecommerce')}
                        />
                      )}
                    </Flex>

                    {/* <AdditionalInfo /> */}
                  </Flex>
                </CardContent>
              </Card>
              {showSimpleVariantSections && (
                <VariantFieldScope prefix="variants.0.">
                  <Price />
                  <Inventory onGenerateSku={generateSku} isGeneratingSku={isGeneratingSku} />
                  <Shipping />
                </VariantFieldScope>
              )}
              <Variants />
              <SEOSettings />
            </Flex>

            <RightPanel
              mode={mode}
              product={product}
              onDuplicate={handleDuplicateClick}
              isDuplicating={isDuplicating}
            />
          </Grid>
        </PageContent>
        <FloatingBar
          visible={(isBlocked || duplicateBlockedByUnsaved) && isDirty}
          shakeSignal={shakeSignal}
          label={
            duplicateBlockedByUnsaved
              ? __('Unsaved product, take an action to proceed.', 'kirki-ecommerce')
              : __('Unsaved product', 'kirki-ecommerce')
          }
        >
          <Button variant="tertiary" onClick={handleBarDiscard} disabled={isSubmitting}>
            {__('Discard', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={() => void handleBarSave()} loading={isSubmitting}>
            {isCreate ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
          </Button>
        </FloatingBar>
      </Form>
    </Page>
  );
};

ProductForm.displayName = 'ProductForm';

export default ProductForm;
