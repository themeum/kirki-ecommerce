import { RefreshCw } from 'lucide-react';

import Button from '@/components/ui/button';
import ErrorState from '@/components/ui/error-state';
import Flex from '@/components/ui/flex';
import { __ } from '@/wpi18n';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

type QueryErrorStateProps = {
  onRetry: () => void;
  isRetrying?: boolean;
  title?: string;
  description?: string;
};

const QueryErrorState = (props: QueryErrorStateProps) => {
  const {
    onRetry,
    isRetrying = false,
    title = __('Something went wrong', 'kirki-ecommerce'),
    description = __(
      "We couldn't complete your request. Please try again or contact support if the issue persists.",
      'kirki-ecommerce',
    ),
  } = props;

  return (
    <ErrorState
      title={title}
      description={description}
      actions={
        <Flex gap={3}>
          <Button variant="primary" loading={isRetrying} onClick={onRetry}>
            <RefreshCw size={16} />
            {__('Try Again', 'kirki-ecommerce')}
          </Button>
          <Button
            variant="secondary"
            // @todo: need to use the correct url.
            onClick={() => window.open('https://kirki.com/account/tickets/', '_blank')}
          >
            <QuestionMarkCircledIcon />
            {__('Contact Support', 'kirki-ecommerce')}
          </Button>
        </Flex>
      }
    />
  );
};

QueryErrorState.displayName = 'QueryErrorState';

export default QueryErrorState;
export type { QueryErrorStateProps };
