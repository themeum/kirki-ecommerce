import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SampleDataLinkProps = {
  phase: 'idle' | 'downloading' | 'creating' | 'done';
  isDisabled: boolean;
  onLoad: () => void;
};

const SampleDataLink = ({ phase, isDisabled, onLoad }: SampleDataLinkProps) => {
  return (
    <Flex justify="center" align="center" cssOverride={styles.root}>
      {phase === 'idle' ? (
        <Button variant="link" onClick={onLoad} disabled={isDisabled} cssOverride={styles.link}>
          {__('Click here to load sample data!', 'kirki-ecommerce')}
        </Button>
      ) : (
        <Flex gap={2} align="center">
          <Spinner cssOverride={styles.spinner} />
          <Text color="subdued" variant="small">
            {phase === 'downloading'
              ? __('Downloading product sample...', 'kirki-ecommerce')
              : __('Creating products...', 'kirki-ecommerce')}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

SampleDataLink.displayName = 'SampleDataLink';

export default SampleDataLink;

const styles = defineStyles({
  root: {
    width: '100%',
    minHeight: '24px',
    marginTop: '-12px',
  },
  link: {
    color: theme.colors.text.subdued,
    textDecoration: 'underline',
    ...theme.typography.small('medium'),
  },
  spinner: {
    width: '20px',
    height: '20px',
    color: theme.colors.icon.brand,
    '& svg': {
      width: '20px',
      height: '20px',
    },
  },
});
