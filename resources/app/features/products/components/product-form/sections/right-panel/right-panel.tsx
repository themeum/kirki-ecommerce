import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import DateField from '@/components/form/date-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import LeadingIconBadge from '@/components/ui/leading-icon-badge';
import Skeleton from '@/components/ui/skeleton';
import Text from '@/components/ui/text';
import Brand from '@/features/products/components/product-form/sections/right-panel/brand';
import Categories from '@/features/products/components/product-form/sections/right-panel/categories';
import Collections from '@/features/products/components/product-form/sections/right-panel/collections';
import Ribbon from '@/features/products/components/product-form/sections/right-panel/ribbon';
import Tags from '@/features/products/components/product-form/sections/right-panel/tags';
import type { Product, ProductStatus } from '@/features/products/schemas/catalog/product';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { DATE_FORMATS, formatDateValue } from '@/libs/date';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { slugify } from '@/utils/string';
import { __ } from '@/wpi18n';

type RightPanelProps = {
  product?: Product;
  mode: 'create' | 'edit';
};

const resolveStatusInfo = (product: Product) => {
  if (product.status === 'published' && isDefined(product.published_at)) {
    return {
      label: __('Published on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.published_at), DATE_FORMATS.HUMAN_READABLE_MIDIUM),
      variant: 'success' as const,
    };
  }

  if (product.status === 'scheduled' && isDefined(product.scheduled_at)) {
    return {
      label: __('Scheduled on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.scheduled_at), DATE_FORMATS.HUMAN_READABLE_MIDIUM),
      variant: 'success' as const,
    };
  }

  if (product.status === 'trashed' && isDefined(product.trashed_at)) {
    return {
      label: __('Trashed on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.trashed_at), DATE_FORMATS.HUMAN_READABLE_MIDIUM),
      variant: 'critical' as const,
    };
  }

  if (product.status === 'draft' && isDefined(product.created_at)) {
    return {
      label: __('Created on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.created_at), DATE_FORMATS.HUMAN_READABLE_MIDIUM),
      variant: 'default' as const,
    };
  }

  return null;
};

const StatusBadge = ({ product }: { product: Product }) => {
  const info = resolveStatusInfo(product);

  if (!isDefined(info)) {
    return null;
  }

  return (
    <Flex align="center" gap={1}>
      <LeadingIconBadge variant={info.variant} />
      <Text variant="tiny">{info.label}</Text>
      <Text variant="tiny" color="subdued">
        {info.time}
      </Text>
    </Flex>
  );
};

const PreviewLink = ({ product }: { product: Product }) => {
  if (!isDefined(product.preview_url)) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (!isDefined(product.preview_url)) {
          return;
        }
        window.open(product.preview_url, '_blank');
      }}
    >
      <Text variant="tiny" weight="medium" color="emphasis">
        {__('Preview', 'kirki-ecommerce')}
      </Text>
    </Button>
  );
};

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: __('Draft', 'kirki-ecommerce') },
  { value: 'published', label: __('Publish', 'kirki-ecommerce') },
  { value: 'scheduled', label: __('Scheduled', 'kirki-ecommerce') },
];

const RightPanel = ({ mode, product }: RightPanelProps) => {
  const form = useFormContext<ProductFormInput>();
  const status = useWatch({ control: form.control, name: 'status' });
  const title = useWatch({ control: form.control, name: 'title' });

  const isNewUnsavedProduct = mode === 'create' && !isDefined(product);
  const slugTouchedRef = useRef(false);

  const { data: advancedSettings, isPending: isAdvancedSettingsPending } =
    useSettingsQuery('advance');
  const shopPageSlug = advancedSettings?.pages?.find((page) => page.key === 'shop')?.slug;
  const pagePrefix = shopPageSlug ? `/${shopPageSlug}` : '/products';

  useEffect(() => {
    if (!isNewUnsavedProduct || slugTouchedRef.current) {
      return;
    }
    form.setValue('slug', slugify(title ?? ''), { shouldDirty: true });
  }, [title, isNewUnsavedProduct, form]);

  useEffect(() => {
    if (status === 'scheduled') {
      return;
    }
    const current = form.getValues();
    if (!current.scheduled_date && !current.scheduled_time) {
      return;
    }
    form.setValue('scheduled_date', null, { shouldDirty: true });
    form.setValue('scheduled_time', null, { shouldDirty: true });
  }, [status, form]);

  return (
    <Flex direction="column" gap={4}>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <Flex direction="column" gap={3}>
            {isDefined(product) && (
              <Flex align="center" justify="space-between">
                <StatusBadge product={product} />
                <PreviewLink product={product} />
              </Flex>
            )}
            <SelectField
              name="status"
              label={mode === 'create' ? __('Status', 'kirki-ecommerce') : null}
              options={statusOptions}
            />
            {status === 'scheduled' && (
              <Grid gap={2}>
                <DateField
                  name="scheduled_date"
                  displayFormat={DATE_FORMATS.HUMAN_READABLE_MIDIUM}
                  mode="date"
                  placeholder={__('dd/mm/yyyy', 'kirki-ecommerce')}
                />
                <DateField
                  name="scheduled_time"
                  mode="time"
                  placeholder={__('hh:mm AM', 'kirki-ecommerce')}
                />
              </Grid>
            )}
            {!isAdvancedSettingsPending ? (
              <Flex align="center">
                <Text variant="small" color="subdued">
                  {`${pagePrefix}/`}
                </Text>
                <TextField
                  name="slug"
                  placeholder={__('untitled', 'kirki-ecommerce')}
                  cssOverride={styles.slugField}
                  onBlur={() => {
                    slugTouchedRef.current = true;
                  }}
                />
              </Flex>
            ) : (
              <Flex>
                <Skeleton width={100} />
                <Skeleton width={180} />
              </Flex>
            )}
          </Flex>
        </CardContent>
      </Card>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent cssOverride={styles.fields}>
          <Categories />
          <Brand />
          <Tags />
          <Collections />
          <Ribbon />
        </CardContent>
      </Card>
    </Flex>
  );
};

RightPanel.displayName = 'RightPanel';

export default RightPanel;

const styles = defineStyles({
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  slugField: {
    flex: 1,
    '& input': {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      paddingLeft: theme.spacing[2],
    },
    '&:hover input, &:focus-within input': {
      borderColor: theme.colors.background.fillBrand,
      backgroundColor: theme.colors.background.fill,
    },
    '& input::placeholder': {
      color: theme.colors.text.primary,
    },
  },
});
