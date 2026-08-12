import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { LockIcon, LoudHandMic } from '@/icons';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ComingSoonProps = {
  text?: string;
};

const ComingSoon = (props: ComingSoonProps) => {
  const { text } = props;

  return (
    <Page>
      <PageHeading
        text={text || __('Coming Soon', 'kirki-ecommerce')}
        leftIcon={<LockIcon />}
      />
      <Container>
        <Card cssOverride={styles.card}>
          <CardContent>
            <Flex direction="column" align="center" gap={6}>
              <span css={scoped(styles.iconFrame)} aria-hidden="true">
                <LoudHandMic />
              </span>
              <Flex cssOverride={{ maxWidth: '330px' }} direction="column" align="center" gap={2}>
                <Text variant="heading4" weight="semibold">
                  {__('Coming Soon', 'kirki-ecommerce')}
                </Text>
                <Text
                  variant="small"
                  color="secondary"
                  cssOverride={styles.description}
                >
                  {__(
                    'This feature is currently under development and will be available soon.',
                    'kirki-ecommerce',
                  )}
                </Text>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

ComingSoon.displayName = 'ComingSoon';

export default ComingSoon;

const styles = defineStyles({
  card: {
    minHeight: '450px',
    justifyContent: 'center',
  },
  iconFrame: {
    ...flexCenter(),
    width: '4.375rem',
    height: '4.375rem',
    borderRadius: '1.5rem',
    backgroundColor: '#F5F5F5',
    boxShadow: 'inset 0 0 0 2px #DBDBDB, inset 0 0 0 4px #ffffff',
    svg: {
      width: '100%',
      height: '100%',
    },
  },
  description: {
    maxWidth: '330px',
    textAlign: 'center',
  },
});
