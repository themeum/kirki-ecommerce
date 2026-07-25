import { css } from '@emotion/react';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';

const SeparatorPreview = () => {
  return (
    <Flex direction="column" gap={4}>
      <div>
        <p>Above the horizontal separator</p>
        <Separator marginTop={8} marginBottom={8} />
        <p>Below the horizontal separator</p>
      </div>
      <Flex gap={4} align="center" css={css({ height: 48 })}>
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Right</span>
      </Flex>
    </Flex>
  );
};

SeparatorPreview.displayName = 'SeparatorPreview';

export default SeparatorPreview;
