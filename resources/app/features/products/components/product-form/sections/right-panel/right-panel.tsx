import SelectField from '@/components/form/select-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import LeadingIconBadge from '@/components/ui/leading-icon-badge';
import Text from '@/components/ui/text';
import Brand from '@/features/products/components/product-form/sections/right-panel/brand';
import Categories from '@/features/products/components/product-form/sections/right-panel/categories/categories';
import Collections from '@/features/products/components/product-form/sections/right-panel/collections';
import Tags from '@/features/products/components/product-form/sections/right-panel/tags';
import type { Product, ProductStatus } from '@/features/products/schemas/catalog/product';
import { DATE_FORMATS, formatDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';
import { Copy, Eye } from 'lucide-react';

type RightPanelProps = {
  product?: Product;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
  mode: 'create' | 'edit';
};

const resolveStatusInfo = (product: Product) => {
  if (product.status === 'published' && isDefined(product.published_at)) {
    return {
      label: __('Published on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.published_at), DATE_FORMATS.HUMAN_READABLE),
      variant: 'success' as const,
    };
  }

  if (product.status === 'trashed' && isDefined(product.trashed_at)) {
    return {
      label: __('Trashed on', 'kirki-ecommerce'),
      time: formatDateValue(new Date(product.trashed_at), DATE_FORMATS.HUMAN_READABLE),
      variant: 'critical' as const,
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
    <Flex align="center" justify="space-between">
      <Flex align="center" gap={1}>
        <LeadingIconBadge variant={info.variant} />
        <Text variant="tiny">{info.label}</Text>
      </Flex>
      <Text variant="tiny" color="subdued">
        {info.time}
      </Text>
    </Flex>
  );
};

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: __('Draft', 'kirki-ecommerce') },
  { value: 'published', label: __('Publish', 'kirki-ecommerce') },
];

const RightPanel = ({ mode, product, onDuplicate, isDuplicating = false }: RightPanelProps) => {
  return (
    <div style={{ width: '30%' }}>
      <Flex direction="column" gap={4}>
        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <Flex direction="column" gap={3}>
              {isDefined(product) && <StatusBadge product={product} />}
              <SelectField
                name="status"
                label={mode === 'create' ? __('Status', 'kirki-ecommerce') : null}
                options={statusOptions}
              />
              {isDefined(product) && (
                <Flex align="center" justify="space-between">
                  <Button variant="link" onClick={onDuplicate} loading={isDuplicating}>
                    <Copy size={16} css={scoped({ color: theme.colors.text.emphasis })} />
                    <Text variant="tiny" weight="medium" color="emphasis">
                      {__('Duplicate', 'kirki-ecommerce')}
                    </Text>
                  </Button>
                  <Button variant="link" onClick={() => {}}>
                    <Eye size={16} css={scoped({ color: theme.colors.text.emphasis })} />
                    <Text variant="tiny" weight="medium" color="emphasis">
                      {__('Preview', 'kirki-ecommerce')}
                    </Text>
                  </Button>
                </Flex>
              )}
            </Flex>
          </CardContent>
        </Card>
        <Categories />
        <Card cssOverride={cardStyles.formCard}>
          <CardContent cssOverride={styles.fields}>
            <Tags />
            <Collections />
            <Brand />
          </CardContent>
        </Card>
      </Flex>
    </div>
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
});
