import Card from '@/molecules/card';
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
    <Card type="form">
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
    </Card>
  );
};

export default Variants;
