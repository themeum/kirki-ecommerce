import { Check } from 'lucide-react';

import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';

const UiBadgePreview = () => {
  return (
    <Flex direction="column" gap={6}>
      <Flex direction="column" gap={3}>
        <Text weight="semibold">Figma status variants</Text>
        <Flex gap={2} wrap="wrap" align="center">
          <Badge variant="info">Processing</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="caution">On hold</Badge>
          <Badge variant="success">Completed</Badge>
          <Badge variant="destructive">Cancelled</Badge>
          <Badge variant="secondary">Refunded</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="requested">Refund Requested</Badge>
          <Badge variant="secondary">Partially Refunded</Badge>
          <Badge variant="success">Rewarded</Badge>
        </Flex>
      </Flex>

      <Flex direction="column" gap={3}>
        <Text weight="semibold">Structural variants</Text>
        <Flex gap={2} wrap="wrap" align="center">
          <Badge variant="default">Default</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
          <Badge variant="link">Link</Badge>
        </Flex>
      </Flex>

      <Flex direction="column" gap={3}>
        <Text weight="semibold">With icon</Text>
        <Flex gap={2} wrap="wrap" align="center">
          <Badge variant="success">
            <Check data-icon="inline-start" aria-hidden="true" />
            Success
          </Badge>
          <Badge variant="warning">
            Pending
            <Check data-icon="inline-end" aria-hidden="true" />
          </Badge>
          <Badge variant="info">
            <Check data-icon="inline-start" aria-hidden="true" />
            Processing
          </Badge>
        </Flex>
      </Flex>

      <Flex direction="column" gap={3}>
        <Text weight="semibold">With spinner</Text>
        <Flex gap={2} wrap="wrap" align="center">
          <Badge variant="default">
            <Spinner data-icon="inline-start" />
            Loading
          </Badge>
          <Badge variant="secondary">
            <Spinner data-icon="inline-start" />
            Syncing
          </Badge>
          <Badge variant="info">
            <Spinner data-icon="inline-start" />
            Processing
          </Badge>
          <Badge variant="outline">
            <Spinner data-icon="inline-start" />
            Please wait
          </Badge>
        </Flex>
      </Flex>

      <Flex direction="column" gap={3}>
        <Text weight="semibold">As link</Text>
        <Flex gap={2} wrap="wrap" align="center">
          <Badge variant="default" asChild>
            <a href="#">Default link</a>
          </Badge>
          <Badge variant="success" asChild>
            <a href="#">Success link</a>
          </Badge>
          <Badge variant="link" asChild>
            <a href="#">Link variant</a>
          </Badge>
          <Badge variant="outline" asChild>
            <a href="#">
              <Check data-icon="inline-start" aria-hidden="true" />
              Outline link
            </a>
          </Badge>
        </Flex>
      </Flex>
    </Flex>
  );
};

UiBadgePreview.displayName = 'UiBadgePreview';

export default UiBadgePreview;
