import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import ThumbnailSelector from '@/components/thumbnail-selector';
import { NEW_ITEM_ID } from '@/conf';
import { PlusIcon, ProductIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import PageHeading from '@/molecules/page-heading';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import {
  addCollectionAPI,
  getCollectionByIdAPI,
  setKeyValue,
  updateCollection,
  updateCollectionAPI,
} from '@/store/collectionsSlice';
import { useAppDispatch } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type {
  CollectionFormData,
  FormErrors,
  MediaChangePayload,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type CollectionDetailsFormData = CollectionFormData & {
  id?: number;
};

const CollectionDetails = () => {
  let { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [collectionFormData, setCollectionFormData] =
    useState<CollectionDetailsFormData>({});
  const [, setLoaded] = useState(false);

  useEffect(() => {
    if (!isNew()) {
      getCollectionByIdAPI(id as unknown as number).then((result) => {
        if (isApiSuccess(result)) {
          setCollectionFormData(result.data);
          const banner =
            result.data.banner && typeof result.data.banner === 'object'
              ? result.data.banner
              : null;
          setImageUrl(banner?.url ?? null);
          setLoaded(true);
        }
      });
    }
  }, []);

  const handleOnChange = (data: unknown, fieldName: string) => {
    setCollectionFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleMediaChange = (img: MediaChangePayload | MediaChangePayload[]) => {
    const media = img as MediaChangePayload;
    setImageUrl(media?.url ?? null);
    setCollectionFormData((prev) => ({
      ...prev,
      banner: media?.id,
    }));
  };

  const handleAddOrUpdateCollection = async () => {
    let result = {} as Awaited<ReturnType<typeof addCollectionAPI>>;
    if (collectionFormData.id) {
      result = await updateCollectionAPI(
        collectionFormData.id,
        collectionFormData,
      );
    } else {
      result = await addCollectionAPI(collectionFormData);
    }

    if (isApiSuccess(result)) {
      if (isNew()) {
        navigate('/collections/' + result.data.id);
      }
      if (collectionFormData.id) {
        dispatch(updateCollection(result.data));
      } else {
        dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      }
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const isNew = () => {
    return id === NEW_ITEM_ID;
  };

  return (
    <>
      <PageHeading
        text={
          isNew()
            ? __('New Collection', 'kirki-ecommerce')
            : __('Edit Collection', 'kirki-ecommerce')
        }
        type="primary"
        sticky
        actions={
          <>
            <Button type="ghost" size="small" text={__('Cancel', 'kirki-ecommerce')} />
            <Button
              type="primary"
              size="small"
              text={isNew() ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
              onClick={handleAddOrUpdateCollection}
            />
          </>
        }
        hasBack
      />

      <Container size="md">
        <Flex direction="column" gap={16}>
          <Card type="form">
            <Grid>
              <Input
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('e.g. Winter sale', 'kirki-ecommerce')}
                value={collectionFormData.title as string}
                onChange={(value) => handleOnChange(value, 'title')}
                error={errors.title as string | boolean | undefined}
              />
              <Input
                label={__('Slug', 'kirki-ecommerce')}
                placeholder={__('winter-sale', 'kirki-ecommerce')}
                value={collectionFormData.slug as string}
                onChange={(value) => handleOnChange(value, 'slug')}
                error={errors.slug as string | boolean | undefined}
              />
            </Grid>
            <Input
              multiline={5}
              label={__('Description', 'kirki-ecommerce')}
              placeholder={__(
                'e.g. Discover our exciting winter sale! Enjoy amazing discounts on cozy sweaters, stylish boots, and essential winter gear.',
                'kirki-ecommerce',
              )}
              value={(collectionFormData.description as string) || ''}
              onChange={(value) => handleOnChange(value, 'description')}
              error={errors.description as string | boolean | undefined}
            />
            <ThumbnailSelector
              src={imageUrl ?? undefined}
              label={__('Banner', 'kirki-ecommerce')}
              error={errors.banner as string | boolean | undefined}
              onChange={(img) => handleMediaChange(img)}
            />
          </Card>

          <Card type="form" style={{ padding: '43.5px' }}>
            <Flex
              direction="column"
              gap={12}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <ProductIcon />
              <Button
                size="small"
                text={__('Select Products', 'kirki-ecommerce')}
                type="secondary"
                leftIcon={<PlusIcon />}
              />
            </Flex>
          </Card>

          <Card type="form">
            <Text
              header={__('SEO Settings', 'kirki-ecommerce')}
              type="primary"
              padding="large"
            />
            <Card type="inner">
              <Flex gap={16} style={{ justifyContent: 'space-between' }}>
                <Flex direction="column" gap={6}>
                  <Text
                    type="xsm"
                    style={{ color: '#4D5157' }}
                    header={
                      window.kirki_ecommerce.site_url +
                      ' › collections › ' +
                      collectionFormData.slug
                    }
                  />
                  <Text
                    type="primary"
                    header={
                      (collectionFormData.seo_title as string) ||
                      (collectionFormData.title as string)
                    }
                    style={{ color: '#000091' }}
                  />
                  <Text
                    type="xsm"
                    style={{ color: '#616161' }}
                    header={
                      (collectionFormData.seo_description as string) ||
                      (collectionFormData.description as string)
                    }
                  />
                </Flex>
                <Thumbnail
                  src={imageUrl ?? undefined}
                  style={{ height: '92px', width: '92px', flexShrink: 0 }}
                />
              </Flex>
            </Card>
            <Separator
              style={{ margin: 'auto -16px', backgroundColor: '#EEEDF3' }}
            />
            <Input
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('Placeholder', 'kirki-ecommerce')}
              value={(collectionFormData.seo_title as string) || ''}
              onChange={(value) => handleOnChange(value, 'seo_title')}
              error={errors.seo_title as string | boolean | undefined}
            />

            <Input
              multiline={5}
              label={__('Meta Description', 'kirki-ecommerce')}
              placeholder={__('Placeholder', 'kirki-ecommerce')}
              value={(collectionFormData.seo_description as string) || ''}
              onChange={(value) => handleOnChange(value, 'seo_description')}
              error={errors.seo_description as string | boolean | undefined}
            />
          </Card>
        </Flex>
      </Container>
    </>
  );
};

export default CollectionDetails;
