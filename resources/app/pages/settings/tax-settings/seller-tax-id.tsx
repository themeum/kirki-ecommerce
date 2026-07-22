import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ActionGroup from '@/components/ui/action-group';
import { PlusIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

const SellerTaxID = () => {
  return (
    <div>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Flex direction="column" gap={6}>
          <Flex style={{ alignItems: 'center' }}>
            <Text
              type="primary"
              header={__('Seller Tax ID', 'kirki-ecommerce')}
              style={{ gap: '12px' }}
            />
            <ActionGroup>
              <Button variant="secondary" size="sm">
                <PlusIcon />
                Add ID
              </Button>
            </ActionGroup>
          </Flex>
          <Text
            type="primary"
            subHeader={__(
              'This information will be used on invoices where tax is applied, based on buyer region and your registration scope.',
              'kirki-ecommerce',
            )}
          />
        </Flex>
      </Card>
    </div>
  );
};

SellerTaxID.displayName = 'SellerTaxID';

export default SellerTaxID;
