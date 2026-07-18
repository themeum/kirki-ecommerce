import Flex from '@/molecules/flex';

import { Separator } from '@/components/ui/separator';

const SeparatorPreview = () => {
  return (
    <Flex direction="column" gap={16}>
      <div>
        <p>Above the horizontal separator</p>
        <Separator />
        <p>Below the horizontal separator</p>
      </div>
      <Flex gap={16} style={{ height: 48, alignItems: 'center' }}>
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Right</span>
      </Flex>
    </Flex>
  );
};

SeparatorPreview.displayName = 'SeparatorPreview';

export default SeparatorPreview;
