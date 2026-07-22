import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { SimulatorIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

const TaxSimulator = () => {
  return (
    <div>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Flex gap={8}>
          <Flex gap={12} direction="column" style={{ width: '55%' }}>
            <Flex gap={6} direction="column">
              <Text
                type="primary"
                header={__('Tax Simulator', 'kirki-ecommerce')}
              />
              <Text
                type="secondary"
                subHeader={__(
                  'Test your real-world shipping outcomes instantly — no guesswork needed.',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
            <Button variant="secondary" size="sm">
              <SimulatorIcon />
              Try Simulator
            </Button>
          </Flex>
          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-tartiary`}
            style={{ width: '45%' }}
          ></Card>
        </Flex>
      </Card>
    </div>
  );
};

TaxSimulator.displayName = 'TaxSimulator';

export default TaxSimulator;
