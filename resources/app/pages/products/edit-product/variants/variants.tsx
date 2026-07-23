import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import AttributeList from '@/pages/products/edit-product/variants/attribute-list/attribute-list';
import VariationTable from '@/pages/products/edit-product/variants/variation-table/variation-table';

type SaveResult = {
  success?: boolean;
};

type VariantsProps = {
  onSave?: () => Promise<SaveResult | false | void> | SaveResult | false | void;
};

const Variants = ({ onSave = () => {} }: VariantsProps) => {
  return (
    <Card css={styles.formCard}>
      <CardHeader>
        <CardTitle>{__('Product Variations', 'kirki-ecommerce')}</CardTitle>
        <CardDescription>
          {__('Manage the options this product comes in.', 'kirki-ecommerce')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttributeList onSave={onSave} />
        <VariationTable />
      </CardContent>
    </Card>
  );
};

Variants.displayName = 'Variants';

export default Variants;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
};
