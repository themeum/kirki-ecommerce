import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX, NEW_ITEM_ID } from '@/conf';
import { PlusIcon, ProductIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import PageHeading from '@/molecules/page-heading';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import {
  CollectionFormSchema,
  type CollectionFormValues,
} from '@/schemas/forms/collection-form';
import {
  useCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
} from '@/services/collection';
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
            <Button variant="ghost" size="sm">
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
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
        <Flex direction="column" gap={16}>
          <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
            <CardContent>
              <Flex direction="column" gap={16}>
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

          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
            style={{ padding: '43.5px' }}
          >
            <Flex
              direction="column"
              gap={12}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <ProductIcon />
              <Button variant="secondary" size="sm">
                <PlusIcon />
                {__('Select Products', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Card>

          <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
            <CardContent>
              <Flex direction="column" gap={16}>
                <Text
                  header={__('SEO Settings', 'kirki-ecommerce')}
                  type="primary"
                  padding="large"
                />
                <Card
                  className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
                >
                  <CardContent>
                    <Flex gap={16} style={{ justifyContent: 'space-between' }}>
                      <Flex direction="column" gap={6}>
                        <Text
                          type="xsm"
                          style={{ color: '#4D5157' }}
                          header={
                            window.kirki_ecommerce.site_url +
                            ' › collections › ' +
                            (watchedSlug || '')
                          }
                        />
                        <Text
                          type="primary"
                          header={watchedSeoTitle || watchedTitle || ''}
                          style={{ color: '#000091' }}
                        />
                        <Text
                          type="xsm"
                          style={{ color: '#616161' }}
                          header={
                            watchedSeoDescription || watchedDescription || ''
                          }
                        />
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
                <Separator
                  style={{ margin: 'auto -16px', backgroundColor: '#EEEDF3' }}
                />
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
