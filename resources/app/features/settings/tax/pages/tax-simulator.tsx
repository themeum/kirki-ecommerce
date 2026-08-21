import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { SimulatorIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TaxSimulator = () => {
  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <Flex gap={2}>
            <Flex gap={3} direction="column" cssOverride={{ width: '55%' }}>
              <Flex gap={2} direction="column">
                <Text weight="semibold">{__('Tax Simulator', 'kirki-ecommerce')}</Text>
                <Text variant="small" color="secondary">{__(
                  'Test your real-world shipping outcomes instantly — no guesswork needed.',
                  'kirki-ecommerce',
                )}</Text>
              </Flex>
              <Button variant="secondary">
                <SimulatorIcon />
                Try Simulator
              </Button>
            </Flex>
            <Card cssOverride={mergeCss(cardStyles.tartiaryCard, styles.previewCard)}>
              <CardContent />
            </Card>
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

TaxSimulator.displayName = 'TaxSimulator';

export default TaxSimulator;

const styles = defineStyles({
  previewCard: {
    width: '45%',
  },
});

