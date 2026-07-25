import { css } from '@emotion/react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { SimulatorIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TaxSimulator = () => {
  return (
    <div>
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
          <Flex gap={2}>
            <Flex gap={3} direction="column" css={css({ width: '55%' })}>
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
            <Card css={[cardStyles.tartiaryCard, styles.previewCard]}>
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

const styles = {
  previewCard: scoped({
    width: '45%',
  }),
};

