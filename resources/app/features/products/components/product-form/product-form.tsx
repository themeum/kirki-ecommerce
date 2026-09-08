import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

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
import AdditionalInfo from '@/features/products/components/product-form/sections/additional-info/additional-info';
import Inventory from '@/features/products/components/product-form/sections/inventory/inventory';
import Price from '@/features/products/components/product-form/sections/price/price';
import RightPanel from '@/features/products/components/product-form/sections/right-panel/right-panel';
import SEOSettings from '@/features/products/components/product-form/sections/seo-settings/seo-settings';
import Shipping from '@/features/products/components/product-form/sections/shipping/shipping';
import Variants from '@/features/products/components/product-form/sections/variants/variants';
import UnsavedToast from '@/features/products/components/product-form/unsaved-toast';
import { useProductForm } from '@/features/products/hooks/use-product-form';
import type { Product } from '@/features/products/schemas/catalog/product';
import {
  type ProductFormInput,
  type ProductFormPayload,
} from '@/features/products/schemas/forms/product-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

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
  } = useProductForm({
    initialValues,
    onSubmit,
  });

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

  const handleToastDiscard = useCallback(() => {
    discardChanges();
    if (duplicateBlockedByUnsaved) {
      setDuplicateBlockedByUnsaved(false);
      void onDuplicate?.();
    }
  }, [discardChanges, duplicateBlockedByUnsaved, onDuplicate]);

  const handleToastSave = useCallback(async () => {
    const result = await handleSave();
    if (result.success && duplicateBlockedByUnsaved) {
      setDuplicateBlockedByUnsaved(false);
      void onDuplicate?.();
    }
  }, [duplicateBlockedByUnsaved, handleSave, onDuplicate]);

  return (
    <Form {...form}>
      <PageHeading
        onBack={handleBack}
        text={
          isCreate ? __('New Product', 'kirki-ecommerce') : __('Edit Product', 'kirki-ecommerce')
        }
        hasBack
        sticky
        actions={
          <>
            <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={() => handleSave()} loading={isSubmitting}>
              {isCreate ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
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
                    <Grid gap={3} template="2fr 1fr">
                      <TextField
                        name="title"
                        label={__('Title', 'kirki-ecommerce')}
                        placeholder={__('e.g. Yellow T-Shirt', 'kirki-ecommerce')}
                      />
                      <TextField
                        name="ribbon"
                        label={__('Ribbon', 'kirki-ecommerce')}
                        placeholder={__('e.g. Fresh Arrival', 'kirki-ecommerce')}
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
                      placeholder={__('Brief product summary...', 'kirki-ecommerce')}
                    />
                    <RichTextField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      placeholder={__('Write product description here...', 'kirki-ecommerce')}
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
          <RightPanel
            mode={mode}
            product={product}
            onDuplicate={handleDuplicateClick}
            isDuplicating={isDuplicating}
          />
        </div>
      </Container>
      <UnsavedToast
        visible={(isBlocked || duplicateBlockedByUnsaved) && isDirty}
        onDiscardChanges={handleToastDiscard}
        onSave={handleToastSave}
        isSubmitting={isSubmitting}
        shakeSignal={shakeSignal}
        message={
          duplicateBlockedByUnsaved
            ? __('Unsaved product, take an action to proceed.', 'kirki-ecommerce')
            : __('Unsaved product', 'kirki-ecommerce')
        }
      />
    </Form>
  );
};

ProductForm.displayName = 'ProductForm';

export default ProductForm;
