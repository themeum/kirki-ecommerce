import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Badge from '@/molecules/badge';
import { __ } from '@/wpi18n';
import { CLASS_PREFIX } from '@/conf';
import { BoxClosedIcon, PlusIcon } from '@/icons';

const TaxServices = () => {
  return (
    <div>
      <Card type="large">
        <Flex direction="column" gap={6}>
          <Flex style={{ alignItems: 'center' }}>
            <Text
              type="primary"
              header={__('Tax Services', 'kirki-ecommerce')}
              subHeader={__(
                'Connect your preferred sales tax service to Kirki store',
                'kirki-ecommerce',
              )}
              style={{ gap: '12px' }}
            />
          </Flex>
          <Text type="primary" />
        </Flex>

        <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
          {[1, 2, 3].map((_item, index) => (
            <Card
              type="inner"
              key={index}
              className={`${CLASS_PREFIX}-box-card ${CLASS_PREFIX}-hover-parent`}
            >
              <Flex style={{ alignItems: 'center', minHeight: '36px' }} gap={8}>
                <Text
                  header="Stripe Tax"
                  type="xsm"
                  leftIcon={<BoxClosedIcon />}
                  style={{ fontWeight: '500' }}
                />
                {index === 1 ? (
                  <Badge text="Active" type="published" />
                ) : (
                  <Text
                    subHeader={__(
                      'Calculate and collect tax globally in your Kirki store',
                      'kirki-ecommerce',
                    )}
                    type="xsm"
                    style={{ color: '#878593' }}
                  />
                )}
                <ActionGroup className={`${CLASS_PREFIX}-hover-visible`}>
                  <Button
                    text="Setup"
                    type="tartiary"
                    leftIcon={<PlusIcon />}
                    size="small"
                  />
                </ActionGroup>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>
    </div>
  );
};

TaxServices.displayName = 'TaxServices';

export default TaxServices;
