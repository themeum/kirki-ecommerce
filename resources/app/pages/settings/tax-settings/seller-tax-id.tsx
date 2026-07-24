import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ActionGroup from '@/components/ui/action-group';
import { PlusIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';

const SellerTaxID = () => {
  return (
    <div>
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
          <Flex direction="column" gap={6}>
            <Flex style={{ alignItems: 'center' }}>
              <Text
                type="primary"
                header={__('Seller Tax ID', 'kirki-ecommerce')}
                style={{ gap: theme.spacing[3] }}
              />
              <ActionGroup>
                <Button variant="secondary">
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
        </CardContent>
      </Card>
    </div>
  );
};

SellerTaxID.displayName = 'SellerTaxID';

export default SellerTaxID;

