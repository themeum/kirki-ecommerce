import { Card, CardContent } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import type { TextType } from '@/types';
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
    <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
      <CardContent>
        <Flex>
          <Text
            type={__('primary', 'kirki-ecommerce') as TextType}
            header={__('Product Variations', 'kirki-ecommerce')}
            subHeader={__(
              'Manage the options this product comes in.',
              'kirki-ecommerce',
            )}
          />
        </Flex>
        <AttributeList onSave={onSave} />
        <VariationTable />
      </CardContent>
    </Card>
  );
};

Variants.displayName = 'Variants';

export default Variants;
