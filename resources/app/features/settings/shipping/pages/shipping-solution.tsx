import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { EasyShipIcon, ShippoIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ShippingSolution = () => {
  return (
    <>
      <Card cssOverride={cardStyles.formCard} >
        <CardContent >

          <Flex direction="column" gap={2}>
            <Text weight="semibold">{__('Shipping Solution', 'kirki-ecommerce')}</Text>
            <Text color="secondary">Used to create shipping rates for different product groups, like heavy items needing higher fees.</Text>
          </Flex>

          <Grid>
            <Button
              variant="outline"
              cssOverride={styles.solutionButton}
            >
              <ShippoIcon />
            </Button>
            <Button
              variant="outline"
              cssOverride={styles.solutionButton}
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

const styles = defineStyles({
  solutionButton: {
    width: '100%',
    padding: `${theme.spacing[5]} 0`,
  },
});
