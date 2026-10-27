import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import MediaField from '@/components/form/media-field';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Image from '@/components/ui/image';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import {
  type CollectionFormInput,
  type CollectionFormPayload,
  CollectionFormSchema,
} from '@/features/collections/schemas/forms/collection-form';
import {
  useCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
} from '@/features/collections/services/collection';
import CollectionDetailsSkeleton from '@/features/collections/skeletons/collection-details-skeleton';
import { buildProductSelection, ProductSelectionField } from '@/features/products';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const CollectionDetails = () => {
  const { id } = useParams();
  const isNew = id === NEW_ITEM_ID;
  const [collectionId, setCollectionId] = useState<number | undefined>();
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const { data: collectionResponse, isLoading } = useCollectionQuery(Number(id), !isNew);
  const isLoadingCollection = !isNew && isLoading;
  const createMutation = useCreateCollectionMutation();
  const updateMutation = useUpdateCollectionMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CollectionFormInput, unknown, CollectionFormPayload>({
    resolver: zodResolver(CollectionFormSchema),
    defaultValues: getDefaults(CollectionFormSchema),
  });

  const title = useWatch({ control: form.control, name: 'title' });
  const slug = useWatch({ control: form.control, name: 'slug' });
  const description = useWatch({ control: form.control, name: 'description' });
  const seoTitle = useWatch({ control: form.control, name: 'seo_title' });
  const seoDescription = useWatch({ control: form.control, name: 'seo_description' });
  const banner = useWatch({ control: form.control, name: 'banner' });
  const selectedProducts = useWatch({ control: form.control, name: 'products' });

  useEffect(() => {
    if (!collectionResponse) {
      return;
    }

    setCollectionId(collectionResponse.id);
    form.reset(
      pickFormValues(CollectionFormSchema, collectionResponse, {
        products: collectionResponse.products.map(buildProductSelection),
      }),
    );
  }, [collectionResponse, form]);

  const navigate = useNavigate();

  const handleSubmit = async (payload: CollectionFormPayload) => {
    try {
      if (collectionId) {
        await updateMutation.mutateAsync({
          id: collectionId,
          data: payload,
        });
      } else {
        const response = await createMutation.mutateAsync(payload);
        void navigate(
          RouteConfig.Collections.get('CollectionDetail').buildLink({ id: response.data.id }),
          {
            replace: true,
          },
        );
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBack = () => {
    void navigate(-1);
  };

  return (
    <Page containerSize="md">
      <Form {...form}>
        <PageHeading
          sticky
          text={
            isNew
              ? __('New Collection', 'kirki-ecommerce')
              : __('Edit Collection', 'kirki-ecommerce')
          }
          actions={
            <>
              <Button variant="ghost" onClick={handleBack}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSubmit)}
                loading={isSubmitting}
              >
                {isNew ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
          onBack={handleBack}
        />

        {isLoadingCollection ? (
          <CollectionDetailsSkeleton />
        ) : (
          <PageContent>
            <Flex direction="column" gap={4}>
              <Card>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <Grid>
                      <TextField
                        name="title"
                        label={__('Title', 'kirki-ecommerce')}
                        placeholder={__('e.g. Winter sale', 'kirki-ecommerce')}
                      />
                      <TextField
                        name="slug"
                        label={__('Slug', 'kirki-ecommerce')}
                        placeholder={__('winter-sale', 'kirki-ecommerce')}
                      />
                    </Grid>
                    <TextareaField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      rows={5}
                      placeholder={__(
                        'e.g. Discover our exciting winter sale! Enjoy amazing discounts on cozy sweaters, stylish boots, and essential winter gear.',
                        'kirki-ecommerce',
                      )}
                    />
                    <MediaField name="banner" label={__('Banner', 'kirki-ecommerce')} />
                  </Flex>
                </CardContent>
              </Card>

              <Card noShadow>
                <CardContent>
                  <Flex direction="column" gap={3}>
                    {selectedProducts && selectedProducts.length > 0 && (
                      <Flex justify="end">
                        <Button
                          variant="secondary"
                          cssOverride={styles.addMoreButton}
                          onClick={() => setProductPickerOpen(true)}
                        >
                          <PlusIcon />
                          <Text variant="small" weight="medium">
                            {__('Select Products', 'kirki-ecommerce')}
                          </Text>
                        </Button>
                      </Flex>
                    )}
                    <ProductSelectionField
                      name="products"
                      control={form.control}
                      open={productPickerOpen}
                      onOpenChange={setProductPickerOpen}
                    />
                  </Flex>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{__('SEO Settings', 'kirki-ecommerce')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <Card noShadow>
                      <CardContent>
                        <Flex gap={4} justify="space-between">
                          <Flex direction="column" gap={2}>
                            <Text variant="small" cssOverride={styles.seoUrl}>
                              {sprintf(
                                '%s › collections › %s',
                                window.kirki_ecommerce.site_url,
                                slug || '',
                              )}
                            </Text>
                            <Text weight="semibold" cssOverride={styles.seoTitle}>
                              {seoTitle || title || ''}
                            </Text>
                            <Text variant="small" cssOverride={styles.seoDescription}>
                              {seoDescription || description || ''}
                            </Text>
                          </Flex>
                          <Image
                            src={typeof banner === 'number' ? null : banner}
                            width={92}
                            height={92}
                            cssOverride={{ flexShrink: 0 }}
                          />
                        </Flex>
                      </CardContent>
                    </Card>
                    <Separator cssOverride={styles.seoSeparator} />
                    <TextField
                      name="seo_title"
                      label={__('Title', 'kirki-ecommerce')}
                      placeholder={__('Placeholder', 'kirki-ecommerce')}
                    />
                    <TextareaField
                      name="seo_description"
                      label={__('Meta Description', 'kirki-ecommerce')}
                      rows={5}
                      placeholder={__('Placeholder', 'kirki-ecommerce')}
                    />
                  </Flex>
                </CardContent>
              </Card>
            </Flex>
          </PageContent>
        )}
      </Form>
    </Page>
  );
};

CollectionDetails.displayName = 'CollectionDetails';

export default CollectionDetails;

const styles = defineStyles({
  seoUrl: {
    color: theme.colors.icon.primary,
  },
  seoTitle: {
    color: theme.colors.text.emphasis,
  },
  seoDescription: {
    color: theme.colors.text.secondary,
  },
  seoSeparator: {
    margin: `auto -${theme.spacing[4]}`,
    width: 'calc(100% + 32px)',
  },
  addMoreButton: {
    gap: theme.spacing[2],
    color: theme.colors.text.primary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  },
});
