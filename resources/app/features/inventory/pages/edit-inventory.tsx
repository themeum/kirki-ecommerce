import { zodResolver } from '@hookform/resolvers/zod';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Eye } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/ui/empty-state';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import UnsavedToast from '@/components/unsaved-toast';
import { RouteConfig } from '@/config/route-config';
import Image from '@/features/inventory/components/variant-form/sections/image';
import Inventory from '@/features/inventory/components/variant-form/sections/inventory';
import Price from '@/features/inventory/components/variant-form/sections/price';
import Shipping from '@/features/inventory/components/variant-form/sections/shipping';
import Visibility from '@/features/inventory/components/variant-form/sections/visibility';
import {
  type VariantFormInput,
  type VariantFormPayload,
  VariantFormSchema,
} from '@/features/inventory/schemas/forms/variant-form';
import { useUpdateVariantMutation, useVariantQuery } from '@/features/inventory/services/inventory';
import EditInventorySkeleton from '@/features/inventory/skeletons/edit-inventory-skeleton';
import { useUnsavedNavigationGuard } from '@/hooks/use-unsaved-navigation-guard';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { getOverlayMotionStyles } from '@/theme/overlay-motion';
import { __ } from '@/wpi18n';

const EditInventory = () => {
  const { id } = useParams();
  const variantId = Number(id);
  const navigate = useNavigate();

  const { data: variant, isLoading, isError } = useVariantQuery(variantId);
  const updateMutation = useUpdateVariantMutation();
  const isSubmitting = updateMutation.isPending;

  const form = useForm<VariantFormInput, unknown, VariantFormPayload>({
    resolver: zodResolver(VariantFormSchema),
    defaultValues: getDefaults(VariantFormSchema),
  });

  const { isDirty } = form.formState;
  const productNameRef = useRef<HTMLElement>(null);
  const [isProductNameTruncated, setIsProductNameTruncated] = useState(false);
  const {
    isBlocked,
    discardChanges: proceedBlockedNavigation,
    markSaving,
    shakeSignal,
  } = useUnsavedNavigationGuard(isDirty);

  useEffect(() => {
    if (!variant) {
      return;
    }

    form.reset(
      pickFormValues(VariantFormSchema, variant, {
        max_per_order: variant.max_per_order ?? 1,
        available_quantity: variant.available_quantity ?? 0,
      }),
    );
  }, [variant, form]);

  const handleProductNameHover = () => {
    const element = productNameRef.current;

    if (!element) {
      return;
    }

    setIsProductNameTruncated(element.scrollWidth > element.clientWidth);
  };

  const handleBack = () => {
    void navigate(RouteConfig.Inventory.buildLink());
  };

  const handleSave = async () => {
    markSaving(true);

    try {
      await form.handleSubmit(async (payload) => {
        try {
          const response = await updateMutation.mutateAsync({
            id: variantId,
            data: payload,
          });
          form.reset(pickFormValues(VariantFormSchema, response.data));
        } catch (error) {
          applyServerErrors(form, error as ErrorResponse);
        }
      })();
    } finally {
      markSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    form.reset();
    proceedBlockedNavigation();
  };

  if (isError) {
    return (
      <Page>
        <PageHeading text={__('Inventory', 'kirki-ecommerce')} hasBack onBack={handleBack} sticky />
        <Container>
          <EmptyState text={__('This variant could not be found.', 'kirki-ecommerce')} />
        </Container>
      </Page>
    );
  }

  if (isLoading || !variant) {
    return (
      <Page>
        <PageHeading text={__('Inventory', 'kirki-ecommerce')} hasBack onBack={handleBack} sticky />
        <EditInventorySkeleton />
      </Page>
    );
  }

  const attributeLabels = variant.attribute_value_labels ?? [];
  const productName = (
    <Text
      ref={productNameRef}
      variant="heading5"
      cssOverride={styles.productName}
      onMouseEnter={handleProductNameHover}
    >
      {variant.name}
    </Text>
  );

  return (
    <Page>
      <Form {...form}>
        <PageHeading
          hasBack
          onBack={handleBack}
          sticky
          buttonProps={{ disabled: isSubmitting }}
          actions={
            <>
              {variant.preview_url && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={__('More options', 'kirki-ecommerce')}
                    >
                      <DotsHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => window.open(variant.preview_url ?? '', '_blank')}
                    >
                      <Eye size={16} />
                      {__('Preview', 'kirki-ecommerce')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
        >
          <Flex align="center" gap={2} cssOverride={styles.breadcrumb}>
            <TooltipProvider delayDuration={200}>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  {variant.product_id ? (
                    <Link
                      to={RouteConfig.Products.get('EditProduct').buildLink({
                        id: variant.product_id,
                      })}
                      css={scoped(styles.productLink)}
                    >
                      {productName}
                    </Link>
                  ) : (
                    productName
                  )}
                </TooltipTrigger>
                {isProductNameTruncated && (
                  <TooltipContent side="bottom" cssOverride={styles.productNameTooltip}>
                    {variant.name}
                  </TooltipContent>
                )}
              </TooltipRoot>
            </TooltipProvider>
            {attributeLabels.length > 0 && (
              <Flex align="center" gap={2} cssOverride={styles.attributes}>
                <span css={scoped(styles.breadcrumbSeparator)}>›</span>
                <Text variant="small" color="muted">
                  {attributeLabels.map((label, index) => (
                    <Fragment key={`${index}-${label}`}>
                      {index > 0 && <span css={scoped(styles.separator)}>|</span>}
                      {label}
                    </Fragment>
                  ))}
                </Text>
              </Flex>
            )}
          </Flex>
        </PageHeading>

        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
              <Price />
              <Inventory committedQuantity={variant.committed_quantity} />
              <Shipping />
            </Flex>
            <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
              <Visibility />
              <Image />
            </Flex>
          </Flex>
        </Container>

        <UnsavedToast
          visible={isBlocked}
          onDiscardChanges={handleDiscardChanges}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          shakeSignal={shakeSignal}
          message={__('Unsaved variant', 'kirki-ecommerce')}
        />
      </Form>
    </Page>
  );
};

EditInventory.displayName = 'EditInventory';

export default EditInventory;

const styles = defineStyles({
  breadcrumb: {
    marginLeft: `-${theme.spacing[3]}`,
    minWidth: 0,
    overflow: 'hidden',
  },
  productLink: {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  productName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productNameTooltip: {
    maxWidth: '360px',
    ...getOverlayMotionStyles('var(--radix-tooltip-content-transform-origin)'),
    zIndex: theme.zIndex.tooltip,
  },
  attributes: {
    flexShrink: 0,
  },
  breadcrumbSeparator: {
    color: theme.colors.text.disabled,
  },
  separator: {
    color: theme.colors.text.disabled,
    margin: `0 ${theme.spacing[1]}`,
  },
});
