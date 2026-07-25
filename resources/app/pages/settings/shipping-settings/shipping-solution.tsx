import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Grid from '@/components/ui/grid';
import { ShippoIcon, EasyShipIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { cardStyles } from '@/theme/card-styles';

const ShippingSolution = () => {
  return (
    <>
      <Card css={cardStyles.largeCard} >
        <CardContent css={cardStyles.largeContentPadded}>

        <Flex direction="column" gap={2}>
          <Text weight="semibold">{__('Shipping Solution', 'kirki-ecommerce')}</Text>
          <Text color="secondary">Used to create shipping rates for different product groups, like heavy items needing higher fees.</Text>
        </Flex>

        <Grid>
        <Button
        variant="outline"
        css={styles.solutionButton}
        >
        <ShippoIcon />
        </Button>
        <Button
        variant="outline"
        css={styles.solutionButton}
        >
        <EasyShipIcon />
        </Button>
        </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default ShippingSolution;

const styles = {
  solutionButton: scoped({
    width: '100%',
    padding: `${theme.spacing[5]} 0`,
  }),
};
