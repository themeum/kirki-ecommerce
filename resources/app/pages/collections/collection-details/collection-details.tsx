import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import PageHeading from '@/components/ui/page-heading';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { NEW_ITEM_ID } from '@/conf';
import { PlusIcon, ProductIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { CollectionFormSchema, type CollectionFormValues } from '@/schemas/forms/collection-form';
import { useCollectionQuery, useCreateCollectionMutation, useUpdateCollectionMutation } from '@/services/collection';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss, defineStyles } from '@/theme/mixins';
import type { CollectionFormData } from '@/types';
import { __ } from '@/wpi18n';

const emptyValues: CollectionFormValues = {
  title: '',
  slug: '',
  description: '',
  banner: null,
  seo_title: '',
  seo_description: '',
};

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === NEW_ITEM_ID;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<number | undefined>();

  const { data: collectionResponse } = useCollectionQuery(Number(id), !isNew);
  const createMutation = useCreateCollectionMutation();
  const updateMutation = useUpdateCollectionMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(CollectionFormSchema),
    defaultValues: emptyValues,
  });

  const watchedTitle = form.watch('title');
  const watchedSlug = form.watch('slug');
  const watchedDescription = form.watch('description');
  const watchedSeoTitle = form.watch('seo_title');
  const watchedSeoDescription = form.watch('seo_description');

  useEffect(() => {
    if (!collectionResponse) {
      return;
    }

    const banner =
      collectionResponse.banner && typeof collectionResponse.banner === 'object'
        ? collectionResponse.banner
        : null;

    setCollectionId(collectionResponse.id);
    setImageUrl(banner?.url ?? null);
    form.reset({
      title: collectionResponse.title ?? '',
      slug: collectionResponse.slug ?? '',
      description: collectionResponse.description ?? '',
      banner: banner?.id ?? (typeof collectionResponse.banner === 'number'
        ? collectionResponse.banner
        : null),
      seo_title: collectionResponse.seo_title ?? '',
      seo_description: collectionResponse.seo_description ?? '',
    });
  }, [collectionResponse, form]);

  const handleSubmit = async (values: CollectionFormValues) => {
    const payload: CollectionFormData = {
      ...values,
      banner: values.banner ?? null,
    };

    try {
      if (collectionId) {
        await updateMutation.mutateAsync({
          id: collectionId,
          data: payload,
        });
      } else {
        const response = await createMutation.mutateAsync(payload);
        navigate('/collections/' + response.data.id);
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Form {...form}>
      <PageHeading
        text={
          isNew
            ? __('New Collection', 'kirki-ecommerce')
            : __('Edit Collection', 'kirki-ecommerce')
        }
        type="primary"
        sticky
        actions={
          <>
            <Button variant="ghost">
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              loading={isSubmitting}
            >
              {isNew
                ? __('Create', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
        hasBack
      />

      <Container size="md">
        <Flex direction="column" gap={4}>
          <Card cssOverride={cardStyles.formCard}>
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
                <ThumbnailField
                  name="banner"
                  label={__('Banner', 'kirki-ecommerce')}
                  valueAs="id"
                  previewUrl={imageUrl}
                  onPreviewChange={setImageUrl}
                />
              </Flex>
            </CardContent>
          </Card>

          <Card cssOverride={mergeCss(cardStyles.formCard, styles.productPlaceholderCard)}>
            <CardContent>
              <Flex
                direction="column"
                gap={3}
                align="center" justify="center">
                <ProductIcon />
                <Button variant="secondary">
                  <PlusIcon />
                  {__('Select Products', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={4}>
                <CardHeader>
                  <CardTitle>{__('SEO Settings', 'kirki-ecommerce')}</CardTitle>
                </CardHeader>
                <Card cssOverride={cardStyles.innerCard}>
                  <CardContent>
                    <Flex gap={4} justify="space-between">
                      <Flex direction="column" gap={2}>
                        <Text variant="small" cssOverride={styles.seoUrl}>{window.kirki_ecommerce.site_url +
                            ' › collections › ' +
                            (watchedSlug || '')}</Text>
                        <Text weight="semibold" cssOverride={styles.seoTitle}>{watchedSeoTitle || watchedTitle || ''}</Text>
                        <Text variant="small" cssOverride={styles.seoDescription}>{watchedSeoDescription || watchedDescription || ''}</Text>
                      </Flex>
                      <Thumbnail
                        src={imageUrl ?? undefined}
                        style={{
                          height: '92px',
                          width: '92px',
                          flexShrink: 0,
                        }}
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
      </Container>
    </Form>
  );
};

CollectionDetails.displayName = 'CollectionDetails';

export default CollectionDetails;

const styles = defineStyles({
  productPlaceholderCard: {
    padding: theme.spacing[11],
  },
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
    backgroundColor: theme.colors.background.surfaceSubdued,
  },
});

